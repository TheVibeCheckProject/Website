/**
 * Renders the procedural neutral card backgrounds in neutral.html to images.
 *
 *   node scripts/marketing/backgrounds/generate.js            -> previews in assets/email/
 *   node scripts/marketing/backgrounds/generate.js --site     -> also 640x640 WebP in assets/backgrounds/
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..', '..', '..');
const OUT = path.join(ROOT, 'assets', 'email');
const SITE = process.argv.includes('--site');

(async () => {
    const browser = await chromium.launch({ channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
        await page.goto('file://' + path.join(__dirname, 'neutral.html').replace(/\\/g, '/'));
        const names = await page.evaluate(() => window.names());
        fs.mkdirSync(OUT, { recursive: true });
        for (const name of names) {
            await page.evaluate((n) => window.paint(n), name);
            const png = path.join(OUT, `bg-neutral-${name}.png`);
            await (await page.$('#art')).screenshot({ path: png });
            console.log('wrote', path.relative(ROOT, png));
            if (SITE) {
                const webp = path.join(ROOT, 'assets', 'backgrounds', `bg_free_${name}.webp`);
                execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', png, '-vf', 'scale=640:640', '-quality', '82', webp]);
                console.log('wrote', path.relative(ROOT, webp));
            }
        }
    } finally {
        await browser.close();
    }
})().catch((e) => { console.error(e); process.exit(1); });
