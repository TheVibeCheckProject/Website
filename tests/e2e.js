/**
 * Browser tests for the core journeys (Microsoft Edge via Playwright).
 *   npm run test:e2e
 */
const { chromium } = require('playwright');
const { startServer, listPages, urlPath, encodeCard, reporter } = require('./lib/site');

const t = reporter('e2e');
const BLOCK = /googlesyndication|clarity\.ms|workers\.dev|jsdelivr|unsplash|fonts\.g/;

(async () => {
    const server = await startServer();
    const browser = await chromium.launch(process.env.VC_TEST_BROWSER ? { executablePath: process.env.VC_TEST_BROWSER } : { channel: 'msedge' });
    const newContext = async (opts = {}) => {
        const ctx = await browser.newContext({ reducedMotion: 'reduce', ...opts });
        await ctx.route(BLOCK, r => r.abort());
        return ctx;
    };
    // Card flow: tap the front card and wait until the words are showing
    const enterPortal = async (page) => {
        await page.locator('.portal-card.is-active').click();
        await page.waitForFunction(() => document.body.classList.contains('is-inside') && !CardFlow.busy, null, { timeout: 10000 });
    };
    const decodeLink = (url) => JSON.parse(decodeURIComponent(Buffer.from(url.split('data=')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('latin1')));
    // "Save image": open the control inside `scope`, choose a layout, return the real download's PNG size
    const saveImage = async (page, scope, layout) => {
        await page.click(`${scope} .save-image-btn`);
        const [download] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }).catch(() => null), page.click(`${scope} [data-save="${layout}"]`)]);
        if (!download) return null;
        const png = require('fs').readFileSync(await download.path());
        return { name: download.suggestedFilename(), isPng: png.slice(1, 4).toString() === 'PNG', width: png.readUInt32BE(16), height: png.readUInt32BE(20), bytes: png.length };
    };
    const isWallpaper = (d) => !!d && d.isPng && d.width === 1179 && d.height === 2556 && d.bytes > 20000 && /wallpaper\.png$/.test(d.name);
    const isSquare = (d) => !!d && d.isPng && d.width === 1080 && d.height === 1080 && d.bytes > 20000 && /square\.png$/.test(d.name);
    // The same site with the one switch in js/send-card-logic.js turned on
    const withOwnWordsFree = (ctx) => ctx.route(/\/js\/send-card-logic\.js/, async (route) => {
        const res = await route.fetch();
        const body = (await res.text()).replace('const OWN_WORDS_FREE = false;', 'const OWN_WORDS_FREE = true;');
        await route.fulfill({ response: res, body });
    });
    const trackErrors = (page) => {
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        return errors;
    };

    try {
        // 1. Every page loads without JS errors or sideways scrolling on a phone
        {
            const ctx = await newContext({ viewport: { width: 390, height: 844 } });
            for (const rel of listPages()) {
                const page = await ctx.newPage();
                const errors = trackErrors(page);
                await page.goto(server.base + urlPath(rel), { waitUntil: 'load' });
                await page.waitForTimeout(300);
                const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
                t.check(errors.length === 0, `JS error on ${rel}`, errors.join(' | '));
                t.check(overflow <= 0, `horizontal overflow on ${rel}`, `${overflow}px`);
                await page.close();
            }
            await ctx.close();
        }

        // 2. Blog "Send as Card" -> create card (free user) -> recipient opens it
        let cardUrl = '';
        {
            const ctx = await newContext({ viewport: { width: 1280, height: 900 } });
            const page = await ctx.newPage();
            const errors = trackErrors(page);
            const msg = "I'm right here. You don't have to reply.";
            await page.goto(`${server.base}/send-card.html?message=${encodeURIComponent(msg)}`);
            await page.waitForTimeout(500);
            await enterPortal(page);
            t.check((await page.textContent('.portal-phrase.is-active')).includes("I'm right here"), 'portal opens on the ?message= text');
            await page.click('#mainCta');
            await page.waitForSelector('#cardForm.is-open');
            await page.fill('#recipientName', 'Sam');
            await page.fill('#senderName', 'Alex');
            await page.fill('#personalMessage', 'Thinking of you');
            await page.evaluate(() => document.getElementById('cardForm').requestSubmit());
            await page.waitForTimeout(800);
            t.check(!(await page.$('#premOverlay.open')), 'free user is not paywalled for a site-provided message');
            t.check(!!(await page.$('#successMessage.show')), 'card is created (success screen)');
            cardUrl = await page.inputValue('#cardLink');
            t.check(cardUrl.startsWith('https://thevibecheckproject.com/view-card.html?data='), 'share link uses the canonical view-card URL', cardUrl.slice(0, 60));
            t.check(errors.length === 0, 'no JS errors creating a card', errors.join(' | '));

            // Sender opening their own link = preview, no read receipt
            await page.goto(cardUrl.replace('https://thevibecheckproject.com', server.base));
            await page.waitForTimeout(800);
            t.check((await page.textContent('#headerBadge')).includes('Preview'), 'sender sees their own card as a preview');
            await ctx.close();
        }
        {
            // Recipient (fresh browser)
            const ctx = await newContext({ viewport: { width: 1440, height: 900 } });
            const page = await ctx.newPage();
            const errors = trackErrors(page);
            await page.goto(cardUrl.replace('https://thevibecheckproject.com', server.base));
            await page.waitForTimeout(1200);
            t.check((await page.textContent('h1')).includes('Sam'), 'recipient sees a personalised heading');
            await page.click('#flipCard');
            await page.waitForTimeout(1600);
            t.check((await page.textContent('#cardAffirmation')).includes("I'm right here"), 'recipient sees the affirmation');
            t.check((await page.textContent('#cardMessage')).includes('Alex says'), 'recipient sees the sender note');
            // The reply panel waits ~4s so the card can be read first
            t.check(!(await page.evaluate(() => document.body.classList.contains('is-revealed'))), 'reveal panel waits while the card is read');
            await page.waitForTimeout(3000);
            t.check(await page.evaluate(() => document.body.classList.contains('is-revealed')), 'reveal panel appears after flip');
            t.check(errors.length === 0, 'no JS errors on the recipient page', errors.join(' | '));
            await ctx.close();
        }

        // 3. Crafted card links: hostile background is ignored, garbage token doesn't crash
        {
            const ctx = await newContext();
            const external = [];
            await ctx.route(/evil\.example/, r => { external.push(r.request().url()); r.abort(); });
            const page = await ctx.newPage();
            const errors = trackErrors(page);
            const data = encodeCard({ id: 'x', recipientName: { bad: 1 }, affirmation: 'Hi', background: 'https://evil.example/p.png', themeGroup: 'love' });
            await page.goto(`${server.base}/view-card.html?data=${data}`);
            await page.waitForTimeout(1000);
            t.check(external.length === 0, 'external card background is never requested');
            await page.goto(`${server.base}/view-card.html?data=not-a-card!!`);
            await page.waitForTimeout(600);
            t.check(await page.evaluate(() => document.getElementById('vibe-loader').classList.contains('hidden')), 'malformed link still shows the page');
            t.check(errors.length === 0, 'no JS errors on crafted links', errors.join(' | '));
            await ctx.close();
        }

        // 4. My Vibes: created cards are listed, escaped, and deletable
        {
            const ctx = await newContext();
            const page = await ctx.newPage();
            await page.goto(`${server.base}/send-card.html`);
            await page.waitForTimeout(400);
            await enterPortal(page);
            await page.click('#mainCta');
            await page.waitForSelector('#cardForm.is-open');
            await page.fill('#recipientName', '<b>Jo</b>');
            await page.evaluate(() => document.getElementById('cardForm').requestSubmit());
            await page.waitForTimeout(600);
            await page.goto(`${server.base}/my-cards.html`);
            await page.waitForTimeout(600);
            t.check(await page.locator('.history-card').count() === 1, 'My Vibes lists the created card');
            t.check(!(await page.$('.recipient-name b')), 'recipient name is escaped, not rendered as HTML');
            await page.click('.btn-card-delete');
            await page.click('#btnConfirmDelete');
            const gone = await page.waitForFunction(() => document.querySelectorAll('.history-card').length === 0, null, { timeout: 3000 }).then(() => true, () => false);
            t.check(gone, 'card can be deleted', `${await page.locator('.history-card').count()} card(s) still listed`);
            t.check(await page.isVisible('#emptyState'), 'empty state shows after deleting the last card');
            await ctx.close();
        }

        // 5. Premium return: only a Stripe-verified session unlocks (verify worker is mocked here)
        {
            const premiumCase = async (query, verifyReply) => {
                const ctx = await browser.newContext();
                await ctx.route(/googlesyndication|clarity\.ms|jsdelivr|unsplash|fonts\.g|\/hit\//, r => r.abort());
                await ctx.route(/vibe-premium\..*\/verify/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(verifyReply) }));
                const page = await ctx.newPage();
                await page.goto(`${server.base}/send-card.html${query}`);
                await page.waitForTimeout(1500);
                const result = await page.evaluate(() => ({ unlocked: localStorage.getItem('premium_unlocked') === '1', search: location.search }));
                await ctx.close();
                return result;
            };
            const bare = await premiumCase('?premium=1', { valid: true });
            t.check(!bare.unlocked, '?premium=1 without a Stripe session does not unlock');
            const paid = await premiumCase('?premium=1&session_id=cs_live_testSession1234567890', { valid: true });
            t.check(paid.unlocked, 'a Stripe-verified session unlocks Premium');
            t.check(paid.search === '', 'premium params are stripped from the URL after unlocking');
            const unpaid = await premiumCase('?premium=1&session_id=cs_live_testSession1234567890', { valid: false, reason: 'not_paid' });
            t.check(!unpaid.unlocked, 'an unpaid session does not unlock');
        }

        // 7. Card flow: taps, Premium locks, paywall at send, own words, exit, saved place, fallbacks
        {
            const ctx = await newContext({ viewport: { width: 1280, height: 900 } });
            const page = await ctx.newPage();
            const errors = trackErrors(page);
            await page.goto(`${server.base}/send-card.html`);
            await page.waitForTimeout(500);
            const side = await page.locator('.portal-card[data-index="1"]').boundingBox();
            await page.mouse.click(side.x + side.width * 0.8, side.y + side.height / 2);
            await page.waitForTimeout(300);
            t.check(await page.evaluate(() => document.querySelector('.portal-card.is-active').dataset.index) === '1', 'one tap brings a side card to the front');
            for (let i = 0; i < 6; i++) await page.click('#ringNext');
            t.check(await page.evaluate(() => !backgroundDefs[document.querySelector('.portal-card.is-active').dataset.index].premium), 'free users: arrows skip Premium cards');
            const locked = await page.evaluate(() => { const c = [...document.querySelectorAll('.portal-card.is-locked')].find(el => el.style.display !== 'none'); const r = c.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
            await page.mouse.click(locked.x, locked.y);
            t.check(!!(await page.$('#premOverlay.open')), 'tapping a Premium card opens the Premium sheet');
            await page.click('#premLater');
            await enterPortal(page);
            t.check(await page.evaluate(() => selectedBackground.startsWith('assets/backgrounds/')), 'entering sets the card background path');
            t.check(await page.evaluate(() => ['Grounding', 'Worth'].every(n => [...document.querySelectorAll('#portalTopicsDock .flow-chip')].some(c => c.textContent.includes(n)))), 'the Grounding and Worth sets are in the portal');
            t.check(await page.evaluate(() => FREE_WORD_SETS.every(s => s.items.every(isFreeWords))), 'free users can send every Grounding and Worth phrase');
            await page.locator('#portalTopicsDock .flow-chip', { hasText: 'Calm' }).click();
            t.check((await page.textContent('#mainCta')).includes('Unlock Premium'), 'locked collection: main button offers Premium');
            await page.evaluate(() => { selectedAffirmation = 'Breathe. You are safe right now.'; });
            await page.evaluate(() => document.getElementById('cardForm').requestSubmit());
            t.check(!!(await page.$('#premOverlay.open')) && !(await page.$('#successMessage.show')), 'free user sending a Premium collection quote is stopped at send');
            await page.click('#premLater');
            // A Premium card or sound reached some other way is also stopped at send
            await page.evaluate(() => { selectedAffirmation = freeAffirmations[0]; selectedBackground = backgroundDefs.find(b => b.premium).image; });
            await page.evaluate(() => document.getElementById('cardForm').requestSubmit());
            t.check(!!(await page.$('#premOverlay.open')) && !(await page.$('#successMessage.show')), 'free user sending a Premium card is stopped at send');
            await page.click('#premLater');
            await page.evaluate(() => { selectedBackground = backgroundDefs[0].image; selectedSound = 'harp'; });
            await page.evaluate(() => document.getElementById('cardForm').requestSubmit());
            t.check(!!(await page.$('#premOverlay.open')) && !(await page.$('#successMessage.show')), 'free user sending a Premium sound is stopped at send');
            await page.click('#premLater');
            await page.evaluate(() => { selectedSound = 'chime'; });
            await page.locator('#portalTopicsDock .flow-chip', { hasText: 'Your own' }).click();
            await page.waitForTimeout(700);
            t.check(!!(await page.$('#premOverlay.open')), 'free user: "your own words" opens the Premium sheet');
            await page.click('#premLater');
            await page.locator('#portalTopicsDock .flow-chip', { hasText: 'General' }).click();
            await page.click('#mainCta');
            await page.waitForSelector('#cardForm.is-open');
            await page.click('#sendButton');
            await page.waitForTimeout(300);
            t.check(!(await page.$('#successMessage.show')) && await page.evaluate(() => document.activeElement.id === 'recipientName'), 'send with no recipient name stops at the name field');
            await page.click('#drawerClose');
            await page.click('#btnBackToRing');
            await page.waitForFunction(() => !CardFlow.inside && !CardFlow.busy, null, { timeout: 10000 });
            t.check(await page.evaluate(() => getComputedStyle(document.querySelector('.portal-card.is-active')).opacity === '1' && !document.getElementById('portalSpace').classList.contains('is-open')), 'Change Card lands back on a visible card');
            t.check(errors.length === 0, 'no JS errors in the card flow', errors.join(' | '));
            await ctx.close();
        }
        {
            // Premium: own words go on the card, capped at 200 characters
            const ctx = await newContext({ viewport: { width: 1280, height: 900 } });
            await ctx.addInitScript(() => localStorage.setItem('premium_unlocked', '1'));
            const page = await ctx.newPage();
            const errors = trackErrors(page);
            await page.goto(`${server.base}/send-card.html`);
            await page.waitForTimeout(400);
            await enterPortal(page);
            await page.locator('#portalTopicsDock .flow-chip', { hasText: 'Your own' }).click();
            await page.waitForSelector('body.is-writing');
            await page.waitForTimeout(100);
            await page.focus('#composerInput');
            await page.keyboard.type('x'.repeat(230));
            t.check(await page.evaluate(() => document.getElementById('composerInput').value.length) === 200, 'own words stop at 200 characters');
            await page.fill('#composerInput', 'Sam, you make every room feel lighter.');
            await page.keyboard.press('Enter');
            await page.click('#mainCta');
            await page.waitForSelector('#cardForm.is-open');
            await page.fill('#recipientName', 'Sam');
            await page.evaluate(() => document.getElementById('cardForm').requestSubmit());
            await page.waitForSelector('#successMessage.show', { timeout: 8000 });
            const card = decodeLink(await page.inputValue('#cardLink'));
            t.check(card.affirmation === 'Sam, you make every room feel lighter.' && card.themeGroup === 'default', 'Premium: own words are sent on the card', JSON.stringify(card).slice(0, 120));
            t.check(['id', 'affirmation', 'recipientName', 'senderName', 'personalMessage', 'sound', 'themeGroup', 'background', 'createdAt'].every(k => k in card), 'card link keeps all nine fields');
            t.check(errors.length === 0, 'no JS errors sending own words', errors.join(' | '));
            await ctx.close();
        }
        {
            // Back from Stripe: the saved place brings them into the same card and words
            const ctx = await newContext({ viewport: { width: 1280, height: 900 } });
            await ctx.addInitScript(() => {
                if (sessionStorage.getItem('seeded')) return;
                sessionStorage.setItem('seeded', '1');
                localStorage.setItem('premium_unlocked', '1');
                localStorage.setItem('vc_flow_draft', JSON.stringify({ background: 'nebula', setId: 'love', phrase: 'You are deeply, profoundly loved.', to: 'Ana', then: 'use-collection', savedAt: Date.now() }));
            });
            const page = await ctx.newPage();
            await page.goto(`${server.base}/send-card.html`);
            await page.waitForFunction(() => document.body.classList.contains('is-inside') && !CardFlow.busy, null, { timeout: 10000 });
            await page.waitForTimeout(400);
            const state = await page.evaluate(() => ({ bg: selectedBackground, words: selectedAffirmation, to: document.getElementById('recipientName').value, draft: localStorage.getItem('vc_flow_draft') }));
            t.check(state.bg.includes('nebula') && state.words === 'You are deeply, profoundly loved.' && state.to === 'Ana', 'saved place is restored after Premium', JSON.stringify(state));
            t.check(state.draft === null, 'saved place is cleared once used');
            await ctx.close();
        }
        {
            // Full motion with GSAP blocked: plain Send button, card still sends; ?classic=1 rollback
            const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
            await ctx.route(BLOCK, r => r.abort());
            const page = await ctx.newPage();
            const errors = trackErrors(page);
            await page.goto(`${server.base}/send-card.html`);
            await page.waitForTimeout(400);
            await enterPortal(page);
            await page.click('#mainCta');
            await page.waitForSelector('#cardForm.is-open');
            t.check(await page.evaluate(() => document.getElementById('sendButton').classList.contains('is-plain')), 'without GSAP the Send button is a plain button');
            await page.fill('#recipientName', 'Sam');
            await page.click('#sendButton');
            const sent = await page.waitForSelector('#successMessage.show', { timeout: 8000 }).then(() => true, () => false);
            t.check(sent, 'without GSAP the card still sends');
            t.check(errors.length === 0, 'no JS errors without GSAP', errors.join(' | '));
            await page.goto(`${server.base}/send-card.html?classic=1&to=Sam`);
            await page.waitForTimeout(600);
            t.check(page.url().includes('send-card-classic.html?to=Sam'), '?classic=1 opens the classic form', page.url());
            await ctx.close();
        }

        // 8. Homepage: today's card opens, is remembered, can be kept (shows in My Vibes) and saved as an image
        {
            const ctx = await newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
            const page = await ctx.newPage();
            const errors = trackErrors(page);
            await page.goto(`${server.base}/`);
            await page.waitForTimeout(500);
            const batch = require('../newsletter-content/batch.json');
            const todayKey = await page.evaluate(() => VibeDaily.dateKey());
            const expected = (batch.emails.find(e => e.date === todayKey) || {}).affirmation;
            t.check(await page.isHidden('#dayActions'), "today's card starts sealed");
            await page.click('#dayCardOpen');
            await page.waitForSelector('#dayCard.is-open');
            const words = (await page.textContent('#dayWords')).replace(/\s+/g, ' ').trim();
            t.check(words.length > 10 && (!expected || words === expected.trim()), "today's card shows the same words as the daily email", words.slice(0, 60));
            t.check(await page.isVisible('#dayActions'), 'actions appear once the card is open');
            await page.fill('#daySendName', 'Sam');
            t.check(await page.evaluate(() => VibeDaily.streak()) === 1, 'opening counts as day one');
            await page.click('#dayKeepBtn');
            await page.click('#daySaveBtn');
            const [download] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }).catch(() => null), page.click('[data-save="square"]')]);
            t.check(!!download && /square\.png$/.test(download.suggestedFilename()), 'the affirmation downloads as an image');
            await page.click('[data-mood="heavy"]');
            t.check((await page.textContent('#checkWords')).trim().length > 10 && (await page.getAttribute('#checkSend', 'href')).startsWith('send-card.html?message='), 'the vibe check answers with words that can be sent');
            await page.reload();
            await page.waitForSelector('#dayCard.is-open');
            t.check(await page.getAttribute('[data-mood="heavy"]', 'aria-pressed') === 'true', "today's card and answer are remembered on return");
            await page.fill('#daySendName', 'Sam');
            await page.press('#daySendName', 'Enter');
            await page.waitForURL(/send-card\.html\?message=.*recipient=Sam/);
            t.check(true, 'sending from the homepage opens the card maker with the words and name');
            await page.goto(`${server.base}/my-cards.html`);
            await page.waitForTimeout(500);
            t.check(await page.locator('.kept-day').count() === 1, 'a kept day is listed in My Vibes');
            await page.locator('.kept-action', { hasText: 'Remove' }).click();
            t.check(await page.locator('.kept-day').count() === 0 && await page.isVisible('#keptEmpty'), 'a kept day can be removed');
            t.check(errors.length === 0, 'no JS errors on the homepage journey', errors.join(' | '));
            await ctx.close();
        }

        // 9. Sealed cards: the date travels in the link, the card stays closed until then, old links are unaffected
        {
            const ctx = await newContext({ viewport: { width: 1280, height: 900 } });
            const page = await ctx.newPage();
            const errors = trackErrors(page);
            await page.goto(`${server.base}/send-card.html`);
            await page.waitForTimeout(400);
            await enterPortal(page);
            await page.click('#mainCta');
            await page.waitForSelector('#cardForm.is-open');
            await page.fill('#recipientName', 'Sam');
            const openOn = await page.evaluate(() => { const d = new Date(); d.setDate(d.getDate() + 3); const el = document.getElementById('openOn'); el.value = VibeDailyDate(d); return el.value; function VibeDailyDate(x) { return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; } });
            await page.evaluate(() => document.getElementById('cardForm').requestSubmit());
            await page.waitForSelector('#successMessage.show', { timeout: 8000 });
            const link = await page.inputValue('#cardLink');
            t.check(decodeLink(link).openOn === openOn, 'the sealed-until day is in the card link');
            t.check((await page.textContent('#sealedNotice')).includes('Sealed until'), 'the success screen says the card is sealed');
            await ctx.close();

            const rctx = await newContext({ viewport: { width: 1280, height: 900 } });
            const rpage = await rctx.newPage();
            const rerrors = trackErrors(rpage);
            await rpage.goto(link.replace('https://thevibecheckproject.com', server.base));
            await rpage.waitForTimeout(1000);
            await rpage.click('#flipCard');
            await rpage.waitForTimeout(400);
            t.check(!(await rpage.evaluate(() => document.getElementById('flipCard').classList.contains('flipped'))) && await rpage.isVisible('#sealedPanel'), 'a sealed card does not open before its day');
            const past = { ...decodeLink(link), openOn: '2026-01-01' };
            await rpage.goto(`${server.base}/view-card.html?data=${encodeCard(past)}`);
            await rpage.waitForTimeout(1000);
            await rpage.click('#flipCard');
            await rpage.waitForTimeout(400);
            t.check(await rpage.evaluate(() => document.getElementById('flipCard').classList.contains('flipped')), 'a sealed card opens once its day has come');
            await rpage.goto(`${server.base}/view-card.html?data=${encodeCard({ ...past, openOn: '<img src=x onerror=alert(1)>' })}`);
            await rpage.waitForTimeout(800);
            t.check(await rpage.isHidden('#sealedPanel'), 'a malformed sealed-until value is ignored');
            t.check(rerrors.length === 0, 'no JS errors on sealed cards', rerrors.join(' | '));
            await rctx.close();
        }

        // 10. More to create: new designs, occasions and free sets
        {
            const ctx = await newContext({ viewport: { width: 1280, height: 900 } });
            const page = await ctx.newPage();
            const errors = trackErrors(page);
            await page.goto(`${server.base}/send-card.html?preset=exam`);
            await page.waitForTimeout(500);
            const counts = await page.evaluate(() => ({
                free: backgroundDefs.filter(b => !b.premium).length, premium: backgroundDefs.filter(b => b.premium).length,
                grouped: backgroundDefs.findIndex(b => b.premium) === backgroundDefs.filter(b => !b.premium).length,
                lights: backgroundDefs.every(b => Array.isArray(b.light) && b.light.length === 3),
                chips: document.querySelectorAll('#occasionRow .flow-chip').length, templates: occasionTemplates.length,
                presetBgs: occasionTemplates.every(t => backgroundDefs.some(b => b.id === t.bgId && !b.premium) && backgroundDefs.some(b => b.id === t.premBgId)),
                freeWords: occasionTemplates.every(t => isFreeWords(t.affirmation)),
                active: backgroundDefs[document.querySelector('.portal-card.is-active').dataset.index].id
            }));
            t.check(counts.free >= 17 && counts.premium === 17 && counts.grouped && counts.lights, 'new card designs are free, Premium stays at 17 and grouped at the end', JSON.stringify(counts));
            t.check(counts.templates >= 12 && counts.chips === counts.templates && counts.presetBgs && counts.freeWords, 'every occasion has a chip, a free card and words a free user can send', JSON.stringify(counts));
            t.check(counts.active === 'lighthouse', '?preset=exam (an alias) opens on the Exam Day card', counts.active);
            const missing = await page.evaluate(async () => (await Promise.all(backgroundDefs.map(b => fetch(b.image, { method: 'HEAD' }).then(r => r.ok ? '' : b.id)))).filter(Boolean));
            t.check(missing.length === 0, 'every card background file exists', missing.join(', '));
            await enterPortal(page);
            t.check((await page.textContent('.portal-phrase.is-active')).includes("You've done the work"), 'a preset opens on its own words');
            const sets = await page.evaluate(() => ({
                names: FREE_WORD_SETS.map(s => s.name), sizes: FREE_WORD_SETS.map(s => s.items.length),
                inDock: FREE_WORD_SETS.every(s => !!document.querySelector(`#portalTopicsDock .flow-chip[data-set="${s.id}"]`)),
                locked: FREE_WORD_SETS.some(s => document.querySelector(`#portalTopicsDock .flow-chip[data-set="${s.id}"] .chip-lock`)),
                sendable: FREE_WORD_SETS.every(s => s.items.every(isFreeWords)),
                premium: categoryDefs.filter(c => c.premium).map(c => `${c.label}:${c.affirmations.length}`).join(',')
            }));
            t.check(sets.names.length >= 7 && sets.sizes.every(n => n >= 8) && sets.inDock && !sets.locked && sets.sendable, 'the new free sets are in the portal, unlocked and sendable', JSON.stringify(sets));
            t.check(sets.premium === 'Calm:5,Celebrate:5,Love:5,Healing:5', 'the four Premium collections are unchanged', sets.premium);
            await page.locator('#portalTopicsDock .flow-chip', { hasText: 'Grief' }).click();
            await page.click('#mainCta');
            await page.waitForSelector('#cardForm.is-open');
            await page.fill('#recipientName', 'Sam');
            await page.evaluate(() => document.getElementById('cardForm').requestSubmit());
            await page.waitForSelector('#successMessage.show', { timeout: 8000 });
            const card = decodeLink(await page.inputValue('#cardLink'));
            t.check(card.affirmation.startsWith("I'm so sorry") && card.background === 'assets/backgrounds/bg_scene_lighthouse.webp' && Object.keys(card).length === 9, 'a free user sends a new set on a new design (still nine fields)', JSON.stringify(card).slice(0, 160));
            await page.setViewportSize({ width: 390, height: 844 });
            await page.goto(`${server.base}/send-card.html`);
            await page.waitForTimeout(400);
            const row = await page.evaluate(() => { const r = document.getElementById('occasionRow'); return { scrolls: r.scrollWidth > r.clientWidth, page: document.documentElement.scrollWidth - document.documentElement.clientWidth }; });
            t.check(row.scrolls && row.page <= 0, 'phones: the occasion chips scroll in their row, the page does not', JSON.stringify(row));
            t.check(errors.length === 0, 'no JS errors with the new designs, occasions and sets', errors.join(' | '));
            await ctx.close();
        }

        // 11. Save image: the card really downloads as a phone wallpaper and a square, in the three places
        {
            const ctx = await newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
            const page = await ctx.newPage();
            const errors = trackErrors(page);
            await page.goto(`${server.base}/send-card.html`);
            await page.waitForTimeout(400);
            await enterPortal(page);
            await page.click('#mainCta');
            await page.waitForSelector('#cardForm.is-open');
            await page.fill('#recipientName', 'Sam');
            await page.fill('#senderName', 'Alex');
            // (b) before sending, in the note panel
            await page.click('#saveImageMaker .save-image-btn');
            t.check(await page.isVisible('#saveImageMaker [data-save="wallpaper"]') && await page.isVisible('#saveImageMaker [data-save="square"]'), 'Save image offers Phone wallpaper and Square');
            await page.keyboard.press('Escape');
            t.check(await page.isHidden('#saveImageMaker .save-image-menu') && !!(await page.$('#cardForm.is-open')), 'Escape closes the Save image menu, not the note panel');
            const w1 = await saveImage(page, '#saveImageMaker', 'wallpaper');
            t.check(isWallpaper(w1) && w1.name.includes('for-sam'), 'maker, before sending: the wallpaper downloads at 1179x2556', JSON.stringify(w1));
            t.check((await page.textContent('#saveImageMaker .save-image-status')).includes('Saved'), 'a saved confirmation shows after the download');
            const s1 = await saveImage(page, '#saveImageMaker', 'square');
            t.check(isSquare(s1), 'maker, before sending: the square downloads at 1080x1080', JSON.stringify(s1));
            t.check(!(await page.$('#successMessage.show')) && await page.evaluate(() => !localStorage.getItem('vibe_history') || !localStorage.getItem('vibe_history').includes('Sam')), 'downloading does not send the card');
            // The Premium rule applies to downloading too
            await page.evaluate(() => { window.__bg = selectedBackground; selectedBackground = backgroundDefs.find(b => b.premium).image; });
            const blockedBg = await saveImage(page, '#saveImageMaker', 'square');
            t.check(!blockedBg && !!(await page.$('#premOverlay.open')), 'free user: a Premium card cannot be downloaded (Premium sheet instead)');
            await page.click('#premLater');
            await page.evaluate(() => { selectedBackground = window.__bg; window.__words = selectedAffirmation; selectedAffirmation = 'Breathe. You are safe right now.'; });
            const blockedSet = await saveImage(page, '#saveImageMaker', 'square');
            t.check(!blockedSet && !!(await page.$('#premOverlay.open')), 'free user: Premium collection words cannot be downloaded');
            await page.click('#premLater');
            await page.evaluate(() => { selectedAffirmation = 'Words I typed myself.'; });
            const blockedOwn = await saveImage(page, '#saveImageMaker', 'square');
            t.check(!blockedOwn && !!(await page.$('#premOverlay.open')), 'free user: own words cannot be downloaded while they are Premium');
            t.check(await page.isVisible('#premOwnWordsItem'), 'the Premium sheet lists "Write your own words" while it is Premium');
            await page.click('#premLater');
            await page.evaluate(() => { selectedAffirmation = window.__words; });
            // (a) after sending, on the success screen
            await page.evaluate(() => document.getElementById('cardForm').requestSubmit());
            await page.waitForSelector('#successMessage.show', { timeout: 8000 });
            const link = await page.inputValue('#cardLink');
            const w2 = await saveImage(page, '#saveImageDone', 'wallpaper');
            const s2 = await saveImage(page, '#saveImageDone', 'square');
            t.check(isWallpaper(w2) && isSquare(s2), 'success screen: both images download at the right sizes', JSON.stringify([w2, s2]));
            t.check(errors.length === 0, 'no JS errors saving images in the maker', errors.join(' | '));
            await ctx.close();

            // (c) the recipient page, only once the card is open
            const rctx = await newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
            const rpage = await rctx.newPage();
            const rerrors = trackErrors(rpage);
            await rpage.goto(link.replace('https://thevibecheckproject.com', server.base));
            await rpage.waitForTimeout(1000);
            t.check(!(await rpage.isVisible('#saveImageCard .save-image-btn')), 'recipient: no Save image before the card is opened');
            await rpage.click('#flipCard');
            await rpage.waitForTimeout(1900);
            t.check(await rpage.isVisible('#saveImageCard .save-image-btn'), 'recipient: Save image appears once the card is open');
            const w3 = await saveImage(rpage, '#saveImageCard', 'wallpaper');
            const s3 = await saveImage(rpage, '#saveImageCard', 'square');
            t.check(isWallpaper(w3) && isSquare(s3), 'recipient: both images download at the right sizes', JSON.stringify([w3, s3]));
            t.check(await rpage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), 'recipient: no sideways scrolling with the Save image control');
            // An animated card (a frame of its video) and an old link with no background
            const base = decodeLink(link);
            await rpage.goto(`${server.base}/view-card.html?data=${encodeCard({ ...base, id: 'v1', background: 'assets/backgrounds/animated_vibrant.mp4' })}`);
            await rpage.waitForTimeout(1500);
            await rpage.click('#flipCard');
            await rpage.waitForTimeout(1900);
            const vid = await saveImage(rpage, '#saveImageCard', 'square');
            t.check(isSquare(vid), 'recipient: an animated card downloads as an image', JSON.stringify(vid));
            const pixels = await rpage.evaluate(async () => {
                const shot = async (card) => { const c = await VibeCardImage.render({ ...card, layout: 'wallpaper' }); const d = c.getContext('2d').getImageData(600, 300, 1, 1).data; return [c.width, c.height, d[0], d[1], d[2]].join(','); };
                const long = 'word '.repeat(60).trim().slice(0, 280);
                return { video: await shot({ background: 'assets/backgrounds/animated_vibrant.mp4', affirmation: 'Hi' }), missingVideo: await shot({ background: 'assets/backgrounds/nope.mp4', light: ['#FEC84A', '#FB923C', '#FFF6DC'], affirmation: 'Hi' }), none: await shot({ themeGroup: 'love', affirmation: long, recipientName: 'A'.repeat(50), senderName: 'B'.repeat(50) }) };
            });
            t.check(Object.values(pixels).every(v => v.startsWith('1179,2556,') && !v.endsWith(',0,0,0')), 'video frame, missing-video fallback and no-background cards all paint a picture', JSON.stringify(pixels));
            // Sealed until a day: never offered
            const d = new Date(); d.setDate(d.getDate() + 5);
            const openOn = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            await rpage.goto(`${server.base}/view-card.html?data=${encodeCard({ ...base, id: 's1', openOn })}`);
            await rpage.waitForTimeout(1000);
            await rpage.click('#flipCard');
            await rpage.waitForTimeout(1900);
            t.check(!(await rpage.isVisible('#saveImageCard .save-image-btn')), 'recipient: a sealed card never offers Save image');
            t.check(rerrors.length === 0, 'no JS errors saving images on the recipient page', rerrors.join(' | '));
            await rctx.close();
        }

        // 12. OWN_WORDS_FREE = true (the one switch in js/send-card-logic.js): own words for everyone, nothing says Premium
        {
            const ctx = await newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
            await withOwnWordsFree(ctx);
            const page = await ctx.newPage();
            const errors = trackErrors(page);
            await page.goto(`${server.base}/send-card.html`);
            await page.waitForTimeout(400);
            t.check(await page.evaluate(() => OWN_WORDS_FREE === true && !isPremium), 'the switch is on for a free user in this test');
            await enterPortal(page);
            const ownChip = page.locator('#portalTopicsDock .flow-chip', { hasText: 'Your own' });
            t.check(await ownChip.locator('.chip-lock').count() === 0 && !(await ownChip.textContent()).includes('Premium'), 'switch on: the "Your own" chip has no lock');
            await ownChip.click();
            await page.waitForSelector('body.is-writing', { timeout: 3000 }).catch(() => { });
            t.check(await page.evaluate(() => document.body.classList.contains('is-writing')) && !(await page.$('#premOverlay.open')), 'switch on: a free user opens "Your own words" with no paywall');
            await page.waitForTimeout(100);
            await page.focus('#composerInput');
            await page.keyboard.type('y'.repeat(230));
            t.check(await page.evaluate(() => document.getElementById('composerInput').value.length) === 200, 'switch on: own words still stop at 200 characters');
            await page.fill('#composerInput', 'Sam, I am glad you are in my life.');
            await page.keyboard.press('Enter');
            t.check(!(await page.textContent('#portalUi')).toUpperCase().includes('PREMIUM') || await page.evaluate(() => ![...document.querySelectorAll('.portal-phrase.is-write, #mainCta')].some(el => /premium/i.test(el.textContent))), 'switch on: the own-words stop and the main button do not mention Premium');
            t.check(await page.evaluate(() => document.getElementById('premOwnWordsItem').hidden), 'switch on: the Premium sheet no longer lists "Write your own words"');
            await page.click('#mainCta');
            await page.waitForSelector('#cardForm.is-open');
            await page.fill('#recipientName', 'Sam');
            const own = await saveImage(page, '#saveImageMaker', 'square');
            t.check(isSquare(own) && !(await page.$('#premOverlay.open')), 'switch on: a free user downloads a card with their own words', JSON.stringify(own));
            await page.evaluate(() => document.getElementById('cardForm').requestSubmit());
            await page.waitForSelector('#successMessage.show', { timeout: 8000 }).catch(() => { });
            const sentOwn = await page.inputValue('#cardLink');
            t.check(!!sentOwn && decodeLink(sentOwn).affirmation === 'Sam, I am glad you are in my life.' && !(await page.$('#premOverlay.open')), 'switch on: a free user sends a card with their own words');
            // The rest of Premium is still Premium
            const still = await page.evaluate(() => [premiumBlockFor('Breathe. You are safe right now.', backgroundDefs[0].image), premiumBlockFor(freeAffirmations[0], backgroundDefs.find(b => b.premium).image)].every(Boolean));
            t.check(still, 'switch on: Premium collections and Premium cards are still Premium');
            t.check(errors.length === 0, 'no JS errors with own words free', errors.join(' | '));
            await ctx.close();
        }

        // 6. Blog index opens at the top; FAQ accordion toggles
        {
            const ctx = await newContext({ viewport: { width: 1440, height: 900 } });
            const page = await ctx.newPage();
            await page.goto(`${server.base}/blog/`);
            await page.waitForTimeout(1200);
            t.check(await page.evaluate(() => window.scrollY) === 0, 'blog index does not auto-scroll on load');
            await page.goto(`${server.base}/faq.html`);
            await page.click('#faq-recipient-app .faq-question');
            t.check(await page.evaluate(() => document.getElementById('faq-recipient-app').classList.contains('active')), 'FAQ item opens');
            await ctx.close();
        }
    } catch (e) {
        t.check(false, 'test run crashed', e.message);
    } finally {
        await browser.close();
        await server.close();
        t.finish();
    }
})();
