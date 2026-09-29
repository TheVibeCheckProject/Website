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
    const browser = await chromium.launch({ channel: 'msedge' });
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
            await page.locator('#portalTopicsDock .flow-chip', { hasText: 'Calm' }).click();
            t.check((await page.textContent('#mainCta')).includes('Unlock Premium'), 'locked collection: main button offers Premium');
            await page.evaluate(() => { selectedAffirmation = 'Breathe. You are safe right now.'; });
            await page.evaluate(() => document.getElementById('cardForm').requestSubmit());
            t.check(!!(await page.$('#premOverlay.open')) && !(await page.$('#successMessage.show')), 'free user sending a Premium collection quote is stopped at send');
            await page.click('#premLater');
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
