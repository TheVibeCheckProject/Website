const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function generatePins() {
    const messagesPath = path.join(__dirname, '../data/messages.json');
    const generatorPath = 'file://' + path.join(__dirname, '../docs/pinterest-pin-generator.html');
    const outputDir = path.join(__dirname, '../assets/pinterest-pins');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const messagesData = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));

    const browser = await chromium.launch();
    const context = await browser.newContext({
        viewport: { width: 1200, height: 1600 },
        deviceScaleFactor: 2 // This makes the 500x750 canvas into a 1000x1500 image
    });
    const page = await browser.newPage();

    console.log('Loading generator...');
    await page.goto(generatorPath);

    for (const category of messagesData.categories) {
        console.log(`Processing category: ${category.title}...`);

        let index = 1;
        for (const message of category.messages) {
            const hook = category.header_title.toUpperCase();

            // Inject values into the page
            await page.evaluate(({ hook, message, color }) => {
                document.getElementById('hookInput').value = hook;
                document.getElementById('messageInput').value = message;

                // Trigger the update function in the HTML
                updatePin();

                // Find and click the color button that matches the theme
                const btns = document.querySelectorAll('.color-btn');
                const themeColors = {
                    '#FF6B9D': 0, // Anxiety (Pink/Cyan)
                    '#CDFF60': 1, // Encouragement (Lime/Purple)
                    '#FEC84A': 2, // Just Because (Yellow/Pink)
                    '#A78BFA': 3, // Grief (Purple/Cyan)
                    '#67E8F9': 3  // Breakup (Using same as grief/anxiety for now or custom)
                };

                // Mapping breakdown:
                // Primary Pink: #FF6B9D
                // Primary Lime: #CDFF60
                // Primary Yellow: #FEC84A
                // Primary Purple: #A78BFA

                const btnIndex = themeColors[color] || 0;
                btns[btnIndex].click();
            }, { hook, message, color: category.color_theme });

            // Wait a tiny bit for the update to render
            await page.waitForTimeout(100);

            const pinElement = await page.$('#pinCanvas');
            const safeTitle = category.id + '-' + index;
            const outputPath = path.join(outputDir, `${safeTitle}.png`);

            await pinElement.screenshot({ path: outputPath });
            console.log(`Saved: ${safeTitle}.png`);
            index++;
        }
    }

    await browser.close();
    console.log('Done! All pins generated in assets/pinterest-pins/');
}

generatePins().catch(console.error);
