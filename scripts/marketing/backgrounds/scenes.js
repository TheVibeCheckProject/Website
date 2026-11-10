/**
 * Renders the painted card backgrounds in scenes.html to images.
 *
 *   node scripts/marketing/backgrounds/scenes.js [outDir]         -> 1024px PNG previews (default: assets/email/)
 *   node scripts/marketing/backgrounds/scenes.js --site [names…]  -> also WebP in assets/backgrounds/ as
 *                                                                    bg_scene_<name>.webp (all scenes if no names):
 *                                                                    640x640 for the square scenes, 1080x1512 for
 *                                                                    the portrait ones (sharp in downloaded images)
 *
 * Uses Microsoft Edge; on a machine without it: VC_TEST_BROWSER=/path/to/chromium node …/scenes.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..', '..', '..');
const args = process.argv.slice(2);
const SITE = args.includes('--site');
const rest = args.filter(a => a !== '--site');
const OUT = SITE ? path.join(ROOT, 'assets', 'email') : (rest[0] || path.join(ROOT, 'assets', 'email'));
const only = SITE ? rest : [];

(async () => {
    const browser = await chromium.launch(process.env.VC_TEST_BROWSER ? { executablePath: process.env.VC_TEST_BROWSER } : { channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
        await page.goto('file://' + path.join(__dirname, 'scenes.html').replace(/\\/g, '/'));
        const names = (await page.evaluate(() => window.names())).filter(n => !only.length || only.includes(n));
        fs.mkdirSync(OUT, { recursive: true });
        for (const name of names) {
            await page.evaluate((n) => window.paint(n), name);
            const png = path.join(OUT, `scene-${name}.png`);
            // The canvas itself, at its own size (square scenes 1024, portrait scenes 1080x1512)
            const [w, h] = await page.evaluate((n) => window.sizeOf(n), name);
            fs.writeFileSync(png, Buffer.from((await page.evaluate(() => window.png())).split(',')[1], 'base64'));
            console.log('wrote', png);
            if (SITE) {
                const webp = path.join(ROOT, 'assets', 'backgrounds', `bg_scene_${name}.webp`);
                execFileSync('ffmpeg', w === h
                    ? ['-y', '-v', 'error', '-i', png, '-vf', 'scale=640:640', '-quality', '86', webp]
                    : ['-y', '-v', 'error', '-i', png, '-quality', '80', webp]);
                fs.unlinkSync(png);   // the preview isn't needed once the site image exists
                console.log('wrote', path.relative(ROOT, webp));
            }
        }
    } finally {
        await browser.close();
    }
})().catch((e) => { console.error(e); process.exit(1); });
