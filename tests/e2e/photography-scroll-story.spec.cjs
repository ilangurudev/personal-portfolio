/**
 * Photography homepage scroll-story acceptance test.
 *
 * Public seam: the rendered /photography experience. The test observes the
 * visitor-facing motion hierarchy, progressive enhancement, and accessibility
 * behavior without depending on observer or animation implementation details.
 */

const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://127.0.0.1:4321';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function nextPaint(page) {
  await page.evaluate(() => new Promise(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  ));
}

(async () => {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
  });

  console.log('Testing the photography homepage scroll story...');

  const desktop = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'no-preference',
  });
  await desktop.goto(`${TARGET_URL}/photography`);
  await desktop.waitForLoadState('networkidle');
  await desktop.waitForSelector('html[data-photography-motion="ready"]');

  const heroImage = desktop.locator('[data-home-hero] img');
  const heroTransformAtTop = await heroImage.evaluate(el => getComputedStyle(el).transform);
  await desktop.evaluate(() => window.scrollTo(0, 480));
  await nextPaint(desktop);
  const heroTransformAfterScroll = await heroImage.evaluate(el => getComputedStyle(el).transform);
  assert(heroTransformAtTop !== 'none', 'The desktop hero should begin with a restrained cinematic settle.');
  assert(heroTransformAfterScroll !== heroTransformAtTop,
    'The desktop hero should respond subtly as the visitor begins scrolling.');

  const openingMovement = desktop.locator('[data-motion-sequence="opening"]');
  assert(await openingMovement.count() === 3,
    'The first movement should contain exactly three signature scroll scenes.');
  assert(await openingMovement.nth(0).getAttribute('data-motion-variant') === 'anchor',
    'The opening movement should begin with one photographic anchor.');
  assert(await openingMovement.nth(1).getAttribute('data-motion-variant') === 'pair',
    'The anchor should be followed by a quieter paired reveal.');

  const quietScene = desktop.locator('[data-scroll-reveal="edit-group"]').last();
  await desktop.evaluate(() => window.scrollTo(0, 0));
  await nextPaint(desktop);
  const quietSceneBefore = Number(await quietScene.evaluate(el => getComputedStyle(el).opacity));
  assert(quietSceneBefore < 0.1,
    'Later photographs should wait below the fold instead of arriving all at once.');
  await quietScene.scrollIntoViewIfNeeded();
  await desktop.waitForFunction(
    element => Number(getComputedStyle(element).opacity) > 0.95,
    await quietScene.elementHandle(),
  );

  const overflowY = await desktop.locator('body').evaluate(el => getComputedStyle(el).overflowY);
  assert(overflowY !== 'hidden', 'The scroll story must never hijack or lock vertical page scrolling.');

  const reduced = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  await reduced.goto(`${TARGET_URL}/photography`);
  await reduced.waitForLoadState('networkidle');
  await reduced.waitForSelector('html[data-photography-motion="reduced"]');
  const reducedLastScene = reduced.locator('[data-scroll-reveal="edit-group"]').last();
  assert(Number(await reducedLastScene.evaluate(el => getComputedStyle(el).opacity)) === 1,
    'Reduced-motion visitors must receive the complete edit without hidden reveal states.');
  assert(await reduced.locator('[data-home-hero] img').evaluate(el => getComputedStyle(el).transform) === 'none',
    'Reduced-motion visitors must not receive scroll-linked hero movement.');

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'no-preference',
  });
  await mobile.goto(`${TARGET_URL}/photography`);
  await mobile.waitForLoadState('networkidle');
  await mobile.waitForSelector('html[data-photography-motion="ready"]');
  assert(await mobile.locator('[data-home-hero] img').evaluate(el => getComputedStyle(el).transform) === 'none',
    'Mobile should use the quieter motion treatment without hero parallax.');

  await browser.close();
  console.log('Photography homepage scroll-story acceptance test passed.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
