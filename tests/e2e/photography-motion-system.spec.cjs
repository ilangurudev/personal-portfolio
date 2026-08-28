/**
 * Photography-space motion-system acceptance test.
 *
 * Public seams: visitor-visible story rows, indexes, Archive batches, dynamic
 * search results, mobile layouts, and reduced-motion rendering.
 */

const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || process.env.BASE_URL || 'http://127.0.0.1:4321';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function expectReveal(page, locator, label) {
  const opacityBefore = Number(await locator.evaluate(el => getComputedStyle(el).opacity));
  assert(opacityBefore < 0.1, `${label} should wait below the fold before entering.`);
  await locator.scrollIntoViewIfNeeded();
  await page.waitForFunction(
    element => Number(getComputedStyle(element).opacity) > 0.95,
    await locator.elementHandle(),
  );
}

(async () => {
  const browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });
  const desktop = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'no-preference',
  });

  console.log('Testing shared photography motion across visitor surfaces...');

  await desktop.goto(`${TARGET_URL}/photography/album/puerto-rico-2025`);
  await desktop.waitForLoadState('networkidle');
  await desktop.waitForSelector('html[data-photo-motion="ready"]', { timeout: 5000 });
  await desktop.waitForSelector('[data-story-gallery] [data-photo-reveal]');

  const albumRows = desktop.locator('[data-story-gallery] [data-photo-reveal]');
  assert(await albumRows.count() >= 4, 'Album stories should reveal complete editorial rows.');
  assert(await desktop.locator('[data-photo-reveal="story-anchor"]').count() >= 1,
    'Album anchors should receive the cinematic story treatment.');
  await desktop.evaluate(() => window.scrollTo(0, 0));
  await expectReveal(desktop, albumRows.last(), 'The final initially rendered album row');

  await desktop.goto(`${TARGET_URL}/photography/tag/street%20photography`);
  await desktop.waitForLoadState('networkidle');
  await desktop.waitForSelector('[data-story-gallery] [data-photo-reveal]');
  const tagRows = desktop.locator('[data-story-gallery] [data-photo-reveal]');
  assert(await tagRows.count() >= 3, 'Tag stories should use the same row-level motion language as albums.');
  assert(await desktop.locator('[data-photo-reveal="story-anchor"]').count() >= 1,
    'Featured tag photographs should retain the anchor reveal treatment.');

  await desktop.goto(`${TARGET_URL}/photography/albums`);
  await desktop.waitForLoadState('networkidle');
  await desktop.waitForSelector('html[data-photo-motion="ready"]');
  const featuredStories = desktop.locator('[data-photo-reveal="index-feature"]');
  const notebookCards = desktop.locator('[data-photo-reveal="index-card"]');
  assert(await featuredStories.count() === 5,
    'Every authored featured story should receive the composed index reveal.');
  assert(await notebookCards.count() >= 8,
    'Notebook archive cards should receive the quieter index treatment.');
  await desktop.evaluate(() => window.scrollTo(0, 0));
  await expectReveal(desktop, featuredStories.last(), 'The final featured story');

  await desktop.goto(`${TARGET_URL}/photography/tags`);
  await desktop.waitForLoadState('networkidle');
  const themeRows = desktop.locator('[data-photo-reveal="index-row"]');
  assert(await themeRows.count() === 8,
    'The public Themes index should reveal all eight authored paths.');
  await desktop.evaluate(() => window.scrollTo(0, 0));
  await expectReveal(desktop, themeRows.last(), 'The final theme row');

  await desktop.goto(`${TARGET_URL}/photography/photos`);
  await desktop.waitForLoadState('networkidle');
  await desktop.waitForSelector('#photos-grid .photo-card');
  const archiveCards = desktop.locator('#photos-grid [data-photo-reveal="utility-card"]');
  assert(await archiveCards.count() >= 20,
    'The Archive should apply quiet utility motion to its initial batch and any eagerly appended batch.');
  await desktop.evaluate(() => window.scrollTo(0, 0));
  await expectReveal(desktop, archiveCards.last(), 'The final card in the initial Archive batch');

  await desktop.goto(`${TARGET_URL}/photography/search`);
  await desktop.waitForLoadState('networkidle');
  await desktop.locator('[data-search-input]').fill('street');
  await desktop.waitForSelector('#photo-results:not([hidden]) [data-photo-reveal="utility-result"]');
  const searchCards = desktop.locator('#photo-results [data-photo-reveal="utility-result"]');
  assert(await searchCards.count() >= 4,
    'Dynamically inserted photography search results should use the utility reveal profile.');

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'no-preference',
  });
  await mobile.goto(`${TARGET_URL}/photography/album/puerto-rico-2025`);
  await mobile.waitForLoadState('networkidle');
  await mobile.waitForSelector('[data-photo-reveal="story-card"]');
  assert(await mobile.locator('[data-photo-reveal="story-card"]').count() >= 8,
    'Mobile album stories should use the compact per-card treatment instead of desktop row masks.');

  const reduced = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  await reduced.goto(`${TARGET_URL}/photography/photos`);
  await reduced.waitForLoadState('networkidle');
  await reduced.waitForSelector('html[data-photo-motion="reduced"]');
  const reducedCards = reduced.locator('#photos-grid [data-photo-reveal="utility-card"]');
  await reducedCards.first().waitFor();
  assert(Number(await reducedCards.last().evaluate(el => getComputedStyle(el).opacity)) === 1,
    'Reduced-motion visitors must receive every Archive card fully visible without staging.');

  await browser.close();
  console.log('Shared photography motion acceptance test passed.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
