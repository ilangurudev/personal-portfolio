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

  console.log('📍 Navigate to the Archive and position a photo away from the viewport top');
  await page.goto(`${TARGET_URL}/photography/photos`);
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => document.querySelectorAll('#photos-grid .photo-card[data-photo-id]').length >= 12);

  const photoCards = page.locator('#photos-grid .photo-card[data-photo-id]');
  const photoCount = await photoCards.count();
  console.log(`   ✓ Photo cards found: ${photoCount}`);

  if (photoCount === 0) {
    console.log('   ⚠ No photos found, skipping scroll lock test');
    await browser.close();
    return;
  }

  const initialOverflow = await page.evaluate(() => getComputedStyle(document.body).overflow);
  console.log(`   Current body overflow: ${initialOverflow}`);

  const selectedPhoto = photoCards.nth(11);
  await selectedPhoto.scrollIntoViewIfNeeded();
  await selectedPhoto.locator('img').evaluate((image) => image.complete && image.naturalWidth > 0
    ? true
    : new Promise((resolve) => image.addEventListener('load', () => resolve(true), { once: true })));
  await page.waitForTimeout(300);
  await selectedPhoto.evaluate((card) => card.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(100);

  const beforeOpen = await selectedPhoto.evaluate((card) => ({
    scrollY: window.scrollY,
    cardTop: card.getBoundingClientRect().top,
    photoId: card.getAttribute('data-photo-id')
  }));

  if (beforeOpen.scrollY <= 0 || beforeOpen.cardTop < 100 || beforeOpen.cardTop > 500) {
    console.error(`✗ Archive setup did not place the selected photo in a scrolled, mid-viewport position (${JSON.stringify(beforeOpen)})`);
    process.exit(1);
  }

  await selectedPhoto.evaluate((card) => card.click());
  await page.waitForSelector('#photo-lightbox.active');
  await page.waitForTimeout(300);

  const overflowWhileOpen = await page.evaluate(() => getComputedStyle(document.body).overflow);
  if (overflowWhileOpen !== 'hidden') {
    console.error(`✗ Body overflow should be "hidden" while lightbox is open (got "${overflowWhileOpen}")`);
    process.exit(1);
  } else {
    console.log('   ✓ Body scroll locked while lightbox open');
  }

  await page.locator('.lightbox-close').click();
  const scrollYImmediatelyAfterClose = await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(window.scrollY)));
  }));
  await page.waitForTimeout(400);

  const overflowAfterClose = await page.evaluate(() => getComputedStyle(document.body).overflow);
  if (overflowAfterClose === 'hidden') {
    console.error(`✗ Body overflow remained "hidden" after closing lightbox (got "${overflowAfterClose}")`);
    process.exit(1);
  } else {
    console.log('   ✓ Body overflow restored after closing lightbox');
  }

  const afterClose = await selectedPhoto.evaluate((card) => ({
    scrollY: window.scrollY,
    cardTop: card.getBoundingClientRect().top,
    activeElement: document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName
  }));
  const immediateScrollDrift = Math.abs(scrollYImmediatelyAfterClose - beforeOpen.scrollY);
  const scrollDrift = Math.abs(afterClose.scrollY - beforeOpen.scrollY);
  const cardDrift = Math.abs(afterClose.cardTop - beforeOpen.cardTop);

  if (immediateScrollDrift > 1 || scrollDrift > 1 || cardDrift > 1) {
    console.error(
      `✗ Closing the Archive lightbox moved the page/photo (immediate scroll drift: ${immediateScrollDrift}px, settled scroll drift: ${scrollDrift}px, card drift: ${cardDrift}px, before: ${JSON.stringify(beforeOpen)}, after: ${JSON.stringify(afterClose)})`
    );
    process.exit(1);
  } else {
    console.log('   ✓ Red close button preserves the exact Archive position and photo placement');
  }

  // Retain the general lock assertion independently from the close-position regression.
  await selectedPhoto.evaluate((card) => card.click());
  await page.waitForSelector('#photo-lightbox.active');
  const beforeWheelY = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(200);
  const afterWheelY = await page.evaluate(() => window.scrollY);
  if (afterWheelY !== beforeWheelY) {
    console.error(`✗ Page scrolled while lightbox open (before: ${beforeWheelY}, after: ${afterWheelY})`);
    process.exit(1);
  } else {
    console.log('   ✓ Page position unchanged while lightbox open');
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  console.log('\n✅ Lightbox scroll lock tests completed\n');
  await browser.close();
})();
