/**
 * Lightbox Scroll Lock Tests
 *
 * Ensures page scrolling is disabled while the lightbox is open and restored after closing.
 */

const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:4321';

(async () => {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS === 'true',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process'
    ],
    slowMo: 80
  });
  const page = await browser.newPage();

  console.log('🧪 Testing Lightbox Scroll Lock...\n');

  console.log('📍 Navigate to Photography page');
  await page.goto(`${TARGET_URL}/photography`);
  await page.waitForLoadState('networkidle');

  const photoCards = await page.locator('.photo-card[data-photo-id]');
  const photoCount = await photoCards.count();
  console.log(`   ✓ Photo cards found: ${photoCount}`);

  if (photoCount === 0) {
    console.log('   ⚠ No photos found, skipping scroll lock test');
    await browser.close();
    return;
  }

  const initialOverflow = await page.evaluate(() => getComputedStyle(document.body).overflow);
  console.log(`   Current body overflow: ${initialOverflow}`);

  const firstPhoto = await photoCards.first();
  await firstPhoto.click();
  await page.waitForSelector('#photo-lightbox.active');
  await page.waitForTimeout(300);

  const overflowWhileOpen = await page.evaluate(() => getComputedStyle(document.body).overflow);
  if (overflowWhileOpen !== 'hidden') {
    console.error(`✗ Body overflow should be "hidden" while lightbox is open (got "${overflowWhileOpen}")`);
    process.exit(1);
  } else {
    console.log('   ✓ Body scroll locked while lightbox open');
  }

  // Attempt to scroll while lightbox is open
  const beforeScrollY = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(200);
  const afterScrollY = await page.evaluate(() => window.scrollY);

  if (afterScrollY !== beforeScrollY) {
    console.error(`✗ Page scrolled while lightbox open (before: ${beforeScrollY}, after: ${afterScrollY})`);
    process.exit(1);
  } else {
    console.log('   ✓ Page position unchanged while lightbox open');
  }

  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  const overflowAfterClose = await page.evaluate(() => getComputedStyle(document.body).overflow);
  if (overflowAfterClose === 'hidden') {
    console.error(`✗ Body overflow remained "hidden" after closing lightbox (got "${overflowAfterClose}")`);
    process.exit(1);
  } else {
    console.log('   ✓ Body overflow restored after closing lightbox');
  }

  console.log('\n✅ Lightbox scroll lock tests completed\n');
  await browser.close();
})();

