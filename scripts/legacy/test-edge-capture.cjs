const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log('Launching Microsoft Edge for Dual-Concept Verification...');
    const browser = await chromium.launch({
        channel: 'msedge',
        headless: true
    });

    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2
    });

    const page = await context.newPage();
    const artifactDir = 'C:\\Users\\devin\\.gemini\\antigravity-ide\\brain\\74e83735-3a5f-47f3-874a-cd28332c0615';

    console.log('Navigating to http://localhost:8085/index.html...');
    await page.goto('http://localhost:8085/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // ─────────────────────────────────────────
    // CONCEPT 1: EDITORIAL GLASSMORPHISM
    // ─────────────────────────────────────────
    console.log('Capturing Concept 1: Warm Modern Editorial...');
    await page.click('#btnThemeEditorial');
    await page.waitForTimeout(400);

    const c1Hero = path.join(artifactDir, 'concept1_editorial_hero.png');
    await page.screenshot({ path: c1Hero, clip: { x: 0, y: 0, width: 1440, height: 920 } });
    console.log('Saved Concept 1 Hero:', c1Hero);

    const c1Full = path.join(artifactDir, 'concept1_editorial_full.png');
    await page.screenshot({ path: c1Full, fullPage: true });
    console.log('Saved Concept 1 Full:', c1Full);

    // ─────────────────────────────────────────
    // CONCEPT 2: PLAYFUL KINETIC
    // ─────────────────────────────────────────
    console.log('Capturing Concept 2: Playful Kinetic...');
    await page.click('#btnThemeKinetic');
    await page.waitForTimeout(500);

    const c2Hero = path.join(artifactDir, 'concept2_kinetic_hero.png');
    await page.screenshot({ path: c2Hero, clip: { x: 0, y: 0, width: 1440, height: 920 } });
    console.log('Saved Concept 2 Hero:', c2Hero);

    const c2Full = path.join(artifactDir, 'concept2_kinetic_full.png');
    await page.screenshot({ path: c2Full, fullPage: true });
    console.log('Saved Concept 2 Full:', c2Full);

    // Switch back to Concept 1 as default
    await page.click('#btnThemeEditorial');
    await page.waitForTimeout(200);

    await browser.close();
    console.log('Dual concept captures completed successfully with Edge!');
})().catch(err => {
    console.error('Capture script error:', err);
    process.exit(1);
});
