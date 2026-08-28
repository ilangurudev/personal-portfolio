/** Cross-gallery acceptance for the color-preserving photograph hover frame. */
const { chromium } = require('playwright');
const TARGET_URL = process.env.TEST_URL || 'http://127.0.0.1:4321';
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function assertGalleryHoverFrame(page, path, selector, surface) {
  await page.goto(`${TARGET_URL}${path}`);
  await page.waitForLoadState('networkidle');
  const card = page.locator(selector).first();
  await card.waitFor({ state: 'visible' });
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1400);

  const imageBefore = await card.locator('img').evaluate(image => ({
    filter: getComputedStyle(image).filter,
    transform: getComputedStyle(image).transform,
  }));
  await card.hover();
  await page.waitForTimeout(600);
  const treatment = await card.evaluate(card => {
    const cardStyle = getComputedStyle(card);
    const imageStyle = getComputedStyle(card.querySelector('img'));
    return {
      filter: imageStyle.filter,
      transform: imageStyle.transform,
      outlineColor: cardStyle.outlineColor,
      outlineOffset: cardStyle.outlineOffset,
      outlineWidth: cardStyle.outlineWidth,
    };
  });

  assert(treatment.outlineColor === 'rgb(240, 74, 36)'
    && treatment.outlineOffset === '2px'
    && treatment.outlineWidth === '1px',
  `${surface} photographs must use the shared offset signal-orange hover frame. Found ${JSON.stringify(treatment)}.`);
  assert(treatment.filter === imageBefore.filter && treatment.transform === imageBefore.transform,
    `${surface} hover must preserve the photograph's color and geometry.`);
}

(async () => {
  const browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  console.log('Testing the cross-gallery photography hover affordance...');

  await assertGalleryHoverFrame(
    page,
    '/photography/album/puerto-rico-2025',
    '[data-story-gallery] .photo-card[data-photo-id]',
    'Album story',
  );
  await assertGalleryHoverFrame(
    page,
    '/photography/tag/street%20photography',
    '[data-story-gallery] .photo-card[data-photo-id]',
    'Tag story',
  );
  await assertGalleryHoverFrame(
    page,
    '/photography/photos',
    '#photos-grid .photo-card[data-photo-id]',
    'Archive',
  );

  console.log('Cross-gallery photography hover affordance tests passed.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
