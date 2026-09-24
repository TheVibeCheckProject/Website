/**
 * Visual regression via computed-style fingerprints: records display, size, spacing,
 * colours, fonts, borders, transforms… of every element on key pages (and a few
 * interactive states) at phone and desktop width, then compares against a baseline.
 * Use it around CSS/HTML refactors that should not change how anything looks.
 *
 *   npm run test:visual -- --update   save a baseline (before your change)
 *   npm run test:visual               compare against it (after your change)
 *
 * The baseline lives in tests/.visual-baseline.json (git-ignored, local only).
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { startServer, listPages, urlPath, encodeCard } = require('./lib/site');

const BASELINE = path.join(__dirname, '.visual-baseline.json');
const UPDATE = process.argv.includes('--update');
const PORT = 8765; // fixed so absolute URLs in computed styles are stable between runs
const PROPS = ['display', 'position', 'top', 'left', 'width', 'height', 'margin-top', 'margin-bottom', 'padding-top', 'padding-left',
    'color', 'background-color', 'background-image', 'font-family', 'font-size', 'font-weight', 'line-height', 'border-top-width',
    'border-top-color', 'border-radius', 'opacity', 'visibility', 'transform', 'box-shadow', 'grid-template-columns', 'flex-direction',
    'gap', 'z-index', 'text-align', 'overflow', 'filter', 'backdrop-filter', 'text-shadow', 'letter-spacing'];

const card = encodeCard({ id: 'vibe_visual', recipientName: 'Sam', senderName: 'Alex', affirmation: 'You are loved', personalMessage: 'Hi', sound: 'chime', themeGroup: 'love', background: 'assets/backgrounds/bg_free_rose_1772750381958.webp' });
const STATES = {
    '/': [['nav-open', p => p.click('#nav-hamburger')]],
    '/send-card.html': [
        ['premium-modal', p => p.evaluate(() => showPremModal())],
        ['step-2', p => p.evaluate(() => { hidePremModal(); goToStep(2); })],
        ['step-3', p => p.evaluate(() => goToStep(3))],
        ['success', async p => { await p.fill('#recipientName', 'Sam'); await p.evaluate(() => document.getElementById('cardForm').requestSubmit()); }],
    ],
    '/faq.html': [['faq-open', p => p.click('#faq-recipient-app .faq-question')]],
    [`/view-card.html?data=${card}`]: [['flipped', p => p.click('#flipCard')]],
};

(async () => {
    const server = await startServer(PORT);
    const browser = await chromium.launch({ channel: 'msedge' });
    const pages = listPages().filter(p => p !== 'view-card.html').map(urlPath).concat([`/view-card.html?data=${card}`]);
    const snapshot = {};
    try {
        for (const width of [390, 1440]) {
            const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
            await ctx.route(/googlesyndication|clarity|workers\.dev|jsdelivr|fonts\.g|unsplash/, r => r.abort());
            await ctx.addInitScript(() => { Math.random = () => 0.42; });
            for (const url of pages) {
                const page = await ctx.newPage();
                await page.goto(server.base + url, { waitUntil: 'load' });
                await page.waitForTimeout(url === '/' ? 3500 : 800); // the homepage defers some work by 3s
                const capture = async (label) => {
                    await page.waitForTimeout(600);
                    snapshot[`${width} ${url.slice(0, 60)} ${label}`] = await page.evaluate((props) =>
                        [...document.querySelectorAll('body *:not(script):not(style):not(.confetti-piece):not(.particle)')]
                            .map(el => { const cs = getComputedStyle(el); return el.tagName + '.' + el.className + '|' + props.map(k => cs.getPropertyValue(k)).join('|'); }),
                    PROPS);
                };
                await capture('load');
                for (const [label, act] of STATES[url] || []) { try { await act(page); } catch (e) { /* state not reachable */ } await capture(label); }
                await page.close();
            }
            await ctx.close();
        }
    } finally {
        await browser.close();
        await server.close();
    }

    if (UPDATE || !fs.existsSync(BASELINE)) {
        fs.writeFileSync(BASELINE, JSON.stringify(snapshot));
        console.log(`visual: baseline saved (${Object.keys(snapshot).length} snapshots). Make your change, then run npm run test:visual.`);
        return;
    }

    const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
    let differing = 0;
    for (const key of new Set([...Object.keys(base), ...Object.keys(snapshot)])) {
        const a = base[key] || [], b = snapshot[key] || [];
        if (a.length !== b.length) { differing++; console.log(`✗ ${key}: element count ${a.length} -> ${b.length}`); continue; }
        // Compare styles only; the tag.class label is context (renaming a class isn't a visual change)
        const styles = (x) => x.slice(x.indexOf('|'));
        const changed = a.map((v, i) => [v, b[i]]).filter(([v, w]) => styles(v) !== styles(w));
        if (!changed.length) continue;
        differing++;
        console.log(`✗ ${key}: ${changed.length} element(s) changed`);
        for (const [v, w] of changed.slice(0, 3)) {
            const vs = v.split('|'), ws = w.split('|');
            const diffs = PROPS.map((p, i) => vs[i + 1] !== ws[i + 1] ? `${p}: ${vs[i + 1]} -> ${ws[i + 1]}` : null).filter(Boolean);
            console.log(`    ${vs[0].slice(0, 70)} :: ${diffs.join('; ').slice(0, 300)}`);
        }
    }
    console.log(differing ? `\nvisual: ${differing} snapshot(s) differ from the baseline` : `\nvisual: identical to baseline (${Object.keys(snapshot).length} snapshots)`);
    if (differing) process.exitCode = 1;
})();
