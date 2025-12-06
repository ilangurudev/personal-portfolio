const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:4321';

(async () => {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS === 'true',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process'],
    slowMo: 75
  });

  const page = await browser.newPage();

  console.log('🧪 Testing AND toggle on All Photos page...\n');

  await page.goto(`${TARGET_URL}/photography/photos`);
  await page.waitForLoadState('networkidle');

  const pageTitle = await page.locator('.page-title').textContent();
  console.log(`   ✓ Page title: ${pageTitle}`);

  const filtersToggle = page.locator('#toggle-filters');
  await filtersToggle.click();
  await page.waitForTimeout(400);

  await page.waitForSelector('#tags-filter');
  const tagCheckboxes = page.locator('#tags-filter input[type="checkbox"]');
  const tagCount = await tagCheckboxes.count();
  console.log(`   ✓ Tag checkboxes available: ${tagCount}`);

  if (tagCount < 2) {
    console.log('   ⚠ Not enough tags to test AND logic');
    await browser.close();
    return;
  }

  const initialTotalText = await page.locator('#total-count').textContent();
  console.log(`   Initial total count: ${initialTotalText}`);

  await tagCheckboxes.nth(0).click();
  await tagCheckboxes.nth(1).click();
  await page.waitForTimeout(400);

  const orCountText = await page.locator('#total-count').textContent();
  console.log(`   Count after selecting two tags (OR mode): ${orCountText}`);

  const toggleOr = page.locator('#toggle-or');
  const toggleAnd = page.locator('#toggle-and');

  await toggleAnd.click();
  await page.waitForTimeout(400);

  const andPressed = await toggleAnd.getAttribute('aria-pressed');
  const orPressed = await toggleOr.getAttribute('aria-pressed');
  const andCountText = await page.locator('#total-count').textContent();

  const toNumber = (text) => parseInt((text || '').match(/\d+/)?.[0] || '0', 10);
  const orNumber = toNumber(orCountText);
  const andNumber = toNumber(andCountText);

  console.log(`   ✓ AND pressed: ${andPressed === 'true' ? '✓' : '✗'}`);
  console.log(`   ✓ OR released: ${orPressed === 'false' ? '✓' : '✗'}`);
  console.log(`   Count in AND mode: ${andNumber} (OR mode was ${orNumber})`);
  console.log(`   ✓ AND mode does not increase results: ${andNumber <= orNumber ? '✓' : '✗'}`);

  await toggleOr.click();
  await page.waitForTimeout(300);
  const resetOrPressed = await toggleOr.getAttribute('aria-pressed');
  console.log(`   ✓ OR restored after toggle back: ${resetOrPressed === 'true' ? '✓' : '✗'}`);

  await browser.close();
})();

