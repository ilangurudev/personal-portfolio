/** Public discovery tests for the curated photography experience. */
const { chromium } = require('playwright');
const TARGET_URL = process.env.TEST_URL || 'http://127.0.0.1:4321';
const assert = (condition, message) => { if (!condition) throw new Error(message); };

(async () => {
  const browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });
  const page = await browser.newPage();
  console.log('Testing curated work and public theme discovery...');

  await page.goto(`${TARGET_URL}/photography`);
  await page.waitForLoadState('networkidle');
  assert(await page.locator('[data-curated-photo]').count() === 20, 'Homepage edit is not the curated 20-image sequence.');

  await page.goto(`${TARGET_URL}/photography/tags`);
  await page.waitForLoadState('networkidle');
  assert(await page.locator('[data-public-theme]').count() === 8, 'Expected eight public themes.');

  const firstTheme = page.locator('[data-public-theme]').first();
  const destination = await firstTheme.getAttribute('href');
  await firstTheme.click();
  await page.waitForLoadState('networkidle');
  assert(page.url().includes(destination), 'Theme did not navigate to its photo collection.');
  await page.waitForSelector('.photo-card[data-photo-id]');

  await page.goto(`${TARGET_URL}/photography/photos`);
  await page.waitForLoadState('networkidle');
  assert(await page.locator('#toggle-filters').count() === 1, 'Archive filter entry point is missing.');
  await page.locator('#toggle-filters').click();
  assert(await page.locator('#filter-panel').isVisible(), 'Archive filters did not open.');

  console.log('Curated work and public theme discovery tests passed.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
