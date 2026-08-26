/** Regression tests for the composition-preserving editorial photo treatment. */
const { chromium } = require('playwright');
const TARGET_URL = process.env.TEST_URL || 'http://127.0.0.1:4321';
const assert = (condition, message) => { if (!condition) throw new Error(message); };

(async () => {
  const browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  console.log('Testing editorial image treatment...');

  await page.goto(`${TARGET_URL}/photography`);
  await page.waitForLoadState('networkidle');
  const cards = page.locator('[data-curated-photo]');
  assert(await cards.count() === 20, 'Curated photo cards are missing.');
  const imageTreatment = await cards.first().locator('img').evaluate(el => ({ fit: getComputedStyle(el).objectFit, naturalHeight: el.naturalHeight }));
  assert(imageTreatment.fit === 'contain', 'Curated images are being cropped.');
  assert(imageTreatment.naturalHeight > 0, 'Curated image failed to load.');

  await page.goto(`${TARGET_URL}/photography/albums`);
  await page.waitForLoadState('networkidle');
  const firstStoryHref = await page.locator('[data-featured-story]').first().getAttribute('href');
  await page.goto(`${TARGET_URL}${firstStoryHref}`);
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('.photo-card[data-photo-id]');
  const storyImage = page.locator('.photo-card[data-photo-id] img').first();
  assert(await storyImage.getAttribute('loading') === 'lazy', 'Story gallery should lazy-load photographs.');

  console.log('Editorial image treatment tests passed.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
