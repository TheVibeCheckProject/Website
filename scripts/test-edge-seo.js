const { chromium } = require('playwright');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const testPages = [
  'index.html',
  'faq.html',
  'situations.html',
  'send-card.html',
  'blog/index.html',
  'blog/100-encouraging-messages-for-a-friend.html'
];

const viewports = [
  { width: 390, height: 844, name: 'Mobile (390px)' },
  { width: 768, height: 1024, name: 'Tablet (768px)' },
  { width: 1440, height: 900, name: 'Desktop (1440px)' }
];

async function runEdgeAudit() {
  console.log('Launching headless Microsoft Edge (channel: "msedge")...');
  let browser;
  try {
    browser = await chromium.launch({
      channel: 'msedge',
      headless: true
    });
  } catch (err) {
    console.error('Could not launch Edge channel:', err.message);
    return;
  }

  const context = await browser.newContext();
  let totalErrors = 0;

  for (const pageName of testPages) {
    const page = await context.newPage();
    const filePath = 'file:///' + path.join(ROOT, pageName).replace(/\\/g, '/');

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        // Ignore analytics or external font/clarity network aborts in local file:/// testing
        if (!msg.text().includes('clarity') && !msg.text().includes('googlesyndication')) {
          consoleErrors.push(msg.text());
        }
      }
    });

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(filePath, { waitUntil: 'domcontentloaded' });

      // Check horizontal overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      if (overflow) {
        console.error(`[OVERFLOW] ${pageName} on ${vp.name}`);
        totalErrors++;
      }
    }

    if (consoleErrors.length > 0) {
      console.warn(`[CONSOLE ERRORS] ${pageName}:`, consoleErrors);
    } else {
      console.log(`[EDGE QA PASS] ${pageName} across all 3 viewports.`);
    }

    await page.close();
  }

  await browser.close();
  console.log(`\nEdge QA completed with ${totalErrors} overflow errors.`);
}

runEdgeAudit();
