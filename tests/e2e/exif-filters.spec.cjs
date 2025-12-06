/**
 * EXIF Filter Regression
 *
 * Ensures EXIF-based sliders (shutter speed, aperture) actually filter results.
 * The page currently allows adjusting sliders, but photos were not being
 * filtered in practice—this spec is intended to fail until the bug is fixed.
 */

const assert = require('assert');
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
      '--single-process',
    ],
    slowMo: 50,
  });

  const page = await browser.newPage();

  try {
    console.log('🧪 EXIF filter regression on /photography/photos');
    await page.goto(`${TARGET_URL}/photography/photos`);
    await page.waitForLoadState('networkidle');

    // Open filter panel if collapsed
    const filterPanel = page.locator('#filter-panel');
    const collapsed = await filterPanel.evaluate((el) => el.classList.contains('collapsed'));
    if (collapsed) {
      await page.locator('#toggle-filters').click();
      await page.waitForTimeout(200);
    }

    const initialTotal = parseInt(await page.locator('#total-count').textContent() || '0', 10);
    console.log(`   Initial total photos: ${initialTotal}`);
    assert(initialTotal > 0, 'Expected photos to be present before filtering');

    // Helper to set a range slider value and trigger input/change
    async function setRangeValue(selector, value) {
      const slider = page.locator(selector);
      await slider.evaluate((el, val) => {
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, value);
      await page.waitForTimeout(400);
    }

    // 1) Shutter speed: narrow max to 1/500s (~0.002) to keep only fastest exposure(s)
    console.log('\n📍 Apply shutter speed filter (max 1/500s)');
    await setRangeValue('#shutter-max', '0.002');
    const afterShutter = parseInt(await page.locator('#total-count').textContent() || '0', 10);
    console.log(`   Photos after shutter filter: ${afterShutter}`);
    assert(
      afterShutter > 0 && afterShutter < initialTotal,
      'Shutter speed filter should reduce visible photos',
    );

    // 2) Reset filters, then tighten aperture to f/2.0 to keep only fast lenses
    console.log('\n📍 Clear filters, then apply aperture filter (max f/2.0)');
    await page.locator('#clear-filters').click();
    await page.waitForTimeout(300);
    await setRangeValue('#aperture-max', '2.0');

    const afterAperture = parseInt(await page.locator('#total-count').textContent() || '0', 10);
    console.log(`   Photos after aperture filter: ${afterAperture}`);
    assert(
      afterAperture > 0 && afterAperture < initialTotal,
      'Aperture filter should reduce visible photos',
    );

    console.log('\n✓ EXIF filters reduce results as expected');
  } finally {
    await browser.close();
  }
})();


