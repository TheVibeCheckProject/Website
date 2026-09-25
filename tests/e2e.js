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
            t.check((await page.textContent('#previewAffirmation')).includes("I'm right here"), 'studio preview shows the ?message= text');
            await page.evaluate(() => goToStep(3));
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
            await page.evaluate(() => goToStep(3));
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
