/**
 * Vibe Check Project — Platform Setup Automation
 *
 * Automates Ko-fi and Gumroad configuration so Devin doesn't have to do it manually.
 *
 * HOW TO RUN:
 *   node scripts/setup-platforms.mjs           (runs both)
 *   node scripts/setup-platforms.mjs --kofi    (Ko-fi only)
 *   node scripts/setup-platforms.mjs --gumroad (Gumroad only)
 *
 * REQUIRES: playwright installed
 *   npm install playwright (if not already)
 *   npx playwright install chromium
 *
 * FOR ANTIGRAVITY: Use your browser tool to open each URL, wait for login,
 *   then follow the STEP comments in each function below.
 */

import { chromium } from 'playwright';
import readline from 'readline';

// ── CONFIG ──────────────────────────────────────────────────────────────────
const CONFIG = {
  kofi: {
    username: 'thevibecheckproject',
    membershipTitle: 'Daily Affirmations + Weekly Card Packs',
    membershipDescription: `Your monthly drop of good vibes — delivered straight to your inbox.

What you get every month:
✨ 30 daily affirmations (one per day, sent to your email)
🃏 4 exclusive card pack drops (themed weekly, e.g. "Sunday Vibe Pack")
🎨 Early access to new card designs before they go public
💜 Direct support for an independent creator building something real

Cancel anytime. No questions asked.`,
    membershipPrice: '3.99',
  },
  gumroad: {
    productName: 'Premium Card Design Pack',
    productDescription: `10 exclusive animated card design themes — yours forever, one-time purchase.

Unlock premium card backgrounds for every vibe:
🎂 Birthday  💔 Grief Support  🔥 Hype-Up  💕 Love  🌿 Anxiety Relief
👯 Friendship  💜 Self-Love  🎉 Congratulations  ✨ Just Because  👁️ "I See You"

Each theme has a unique background, font, and color palette.

Delivered as a ZIP with 10 PNG card backgrounds + instructions on how to use them in The Vibe Check Project.`,
    productPrice: '4.99',
    coverImagePath: null, // Set this to an absolute path if you have the image ready
  },
};
// ────────────────────────────────────────────────────────────────────────────

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

async function waitForUser(message) {
  await prompt(`\n${message}\nPress ENTER when ready...`);
}

// ── KO-FI AUTOMATION ────────────────────────────────────────────────────────
async function setupKofi(page) {
  console.log('\n=== KO-FI SETUP ===');

  // STEP 1: Open Ko-fi
  await page.goto('https://ko-fi.com/account/login');
  console.log('Ko-fi login page opened.');
  await waitForUser('Sign in to Ko-fi in the browser window, then come back here.');

  // STEP 2: Navigate to memberships
  console.log('Navigating to membership management...');
  await page.goto(`https://ko-fi.com/manage/memberships`);
  await page.waitForLoadState('networkidle');

  // STEP 3: Check if a membership tier exists, else create one
  const addTierBtn = page.locator('text=Add tier, text=Add Tier, text=Create Tier, [data-testid="add-tier"], button:has-text("Add tier")').first();
  const editTierBtn = page.locator('text=Edit, button:has-text("Edit")').first();

  let isNewTier = false;
  if (await addTierBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('No tier found. Creating new tier...');
    await addTierBtn.click();
    isNewTier = true;
  } else if (await editTierBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Existing tier found. Editing...');
    await editTierBtn.click();
  } else {
    console.log('Could not find Add Tier or Edit button. Opening memberships page for manual check.');
    await waitForUser('Manually navigate to your membership tier edit screen, then press ENTER.');
  }

  await page.waitForLoadState('networkidle');

  // STEP 4: Fill in tier details
  // Title
  const titleField = page.locator('input[name="title"], input[placeholder*="tier name"], input[placeholder*="Title"]').first();
  if (await titleField.isVisible({ timeout: 3000 }).catch(() => false)) {
    await titleField.triple_click?.() || await titleField.click({ clickCount: 3 });
    await titleField.fill(CONFIG.kofi.membershipTitle);
    console.log(`✓ Title set: "${CONFIG.kofi.membershipTitle}"`);
  } else {
    console.log('⚠ Could not find title field. Ko-fi may have changed their UI.');
  }

  // Description
  const descField = page.locator('textarea[name="description"], textarea[placeholder*="description"], .ql-editor').first();
  if (await descField.isVisible({ timeout: 3000 }).catch(() => false)) {
    await descField.click({ clickCount: 3 });
    await descField.fill(CONFIG.kofi.membershipDescription);
    console.log('✓ Description filled.');
  }

  // Price
  const priceField = page.locator('input[name="amount"], input[placeholder*="amount"], input[placeholder*="price"], input[type="number"]').first();
  if (await priceField.isVisible({ timeout: 3000 }).catch(() => false)) {
    await priceField.click({ clickCount: 3 });
    await priceField.fill(CONFIG.kofi.membershipPrice);
    console.log(`✓ Price set: $${CONFIG.kofi.membershipPrice}/month`);
  }

  // STEP 5: Save
  await waitForUser('Review the Ko-fi form above. Press ENTER to save, or manually click Save.');
  const saveBtn = page.locator('button:has-text("Save"), button:has-text("Update"), input[type="submit"]').first();
  if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await saveBtn.click();
    await page.waitForLoadState('networkidle');
    console.log('✅ Ko-fi membership tier saved!');
  } else {
    console.log('Save button not found. Please save manually.');
    await waitForUser('Save manually, then press ENTER to continue.');
  }
}

// ── GUMROAD AUTOMATION ──────────────────────────────────────────────────────
async function setupGumroad(page) {
  console.log('\n=== GUMROAD SETUP ===');

  // STEP 1: Open Gumroad
  await page.goto('https://app.gumroad.com/login');
  console.log('Gumroad login page opened.');
  await waitForUser('Sign in to Gumroad in the browser window, then come back here.');

  // STEP 2: Navigate to products
  await page.goto('https://app.gumroad.com/products');
  await page.waitForLoadState('networkidle');

  // STEP 3: Find the Vibe Check product
  const productLink = page.locator('a:has-text("Vibe Check"), a:has-text("vibe check"), a:has-text("Premium Card")').first();
  if (await productLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('Found existing product. Opening edit page...');
    // Get href and construct edit URL
    const href = await productLink.getAttribute('href');
    const editUrl = href?.includes('/edit') ? `https://app.gumroad.com${href}` : `https://app.gumroad.com${href}/edit`;
    await page.goto(editUrl);
  } else {
    console.log('Could not auto-find the product. Showing all products for manual selection.');
    await waitForUser('Manually click your Vibe Check Premium product to edit it, then press ENTER.');
  }

  await page.waitForLoadState('networkidle');

  // STEP 4: Update product name
  const nameField = page.locator('input[name="name"], input[placeholder*="name"], input#name').first();
  if (await nameField.isVisible({ timeout: 3000 }).catch(() => false)) {
    await nameField.click({ clickCount: 3 });
    await nameField.fill(CONFIG.gumroad.productName);
    console.log(`✓ Product name set: "${CONFIG.gumroad.productName}"`);
  }

  // STEP 5: Update description
  const descField = page.locator('.ql-editor, [contenteditable="true"], textarea[name="description"]').first();
  if (await descField.isVisible({ timeout: 3000 }).catch(() => false)) {
    await descField.click({ clickCount: 3 });
    await page.keyboard.press('Control+A');
    await descField.type(CONFIG.gumroad.productDescription, { delay: 5 });
    console.log('✓ Description filled.');
  }

  // STEP 6: Update price
  const priceField = page.locator('input[name="price"], input[placeholder*="price"], input#price').first();
  if (await priceField.isVisible({ timeout: 3000 }).catch(() => false)) {
    await priceField.click({ clickCount: 3 });
    await priceField.fill(CONFIG.gumroad.productPrice);
    console.log(`✓ Price set: $${CONFIG.gumroad.productPrice}`);
  }

  // STEP 7: Cover image (optional — only if image path is configured)
  if (CONFIG.gumroad.coverImagePath) {
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fileInput.setInputFiles(CONFIG.gumroad.coverImagePath);
      console.log(`✓ Cover image uploaded from: ${CONFIG.gumroad.coverImagePath}`);
    }
  } else {
    console.log('⚠ No cover image configured. Set CONFIG.gumroad.coverImagePath once you have the image.');
  }

  // STEP 8: Publish
  const publishBtn = page.locator('button:has-text("Publish"), button:has-text("Save changes"), input[value="Save"]').first();
  await waitForUser('Review the Gumroad form. Press ENTER to publish/save, or click it manually.');
  if (await publishBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await publishBtn.click();
    await page.waitForLoadState('networkidle');
    console.log('✅ Gumroad product saved and published!');
  } else {
    console.log('Publish button not found. Please publish manually.');
    await waitForUser('Publish manually in the browser, then press ENTER to finish.');
  }
}

// ── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const runKofi = args.length === 0 || args.includes('--kofi');
  const runGumroad = args.length === 0 || args.includes('--gumroad');

  console.log('Vibe Check Project — Platform Setup Automation');
  console.log('==============================================');
  console.log('This will open a browser. Sign in manually when prompted.');
  console.log('The script fills in all the content for you after you log in.\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
    channel: 'chrome', // Uses the regular Google Chrome installed on your machine
    ignoreDefaultArgs: ['--enable-automation'],
    args: [
      '--disable-blink-features=AutomationControlled',
      '--start-maximized'
    ]
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    if (runKofi) await setupKofi(page);
    if (runGumroad) await setupGumroad(page);

    console.log('\n✅ All done! Platform setup complete.');
    console.log('Next steps: Design your Canva card themes, then run with --gumroad to upload the cover image.');
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error('The browser stays open so you can finish manually.');
    await waitForUser('Press ENTER to close the browser when done.');
  } finally {
    await browser.close();
  }
}

main();
