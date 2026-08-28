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
  const heroTransformAtTop = await heroImage.evaluate(el => {
    const transform = getComputedStyle(el).transform;
    const matrix = new DOMMatrixReadOnly(transform);
    return { transform, scale: matrix.a };
  });
  await desktop.evaluate(() => window.scrollTo(0, 480));
  await desktop.waitForFunction(() => window.scrollY >= 450);
  await nextPaint(desktop);
  const heroTransformAfterScroll = await heroImage.evaluate(el => getComputedStyle(el).transform);
  const heroCopyOpacityAfterScroll = Number(await desktop.locator('.hero-copy').evaluate(el => getComputedStyle(el).opacity));
  assert(heroTransformAtTop.transform !== 'none', 'The desktop hero should begin with a restrained cinematic settle.');
  assert(heroTransformAtTop.scale >= 1.055,
    `The hero settle should be clearly perceptible without becoming a zoom effect; found scale ${heroTransformAtTop.scale}.`);
  assert(heroTransformAfterScroll !== heroTransformAtTop.transform,
    'The desktop hero should respond subtly as the visitor begins scrolling.');
  assert(heroCopyOpacityAfterScroll <= 0.8,
    `The hero copy should noticeably recede as the edit approaches; found opacity ${heroCopyOpacityAfterScroll}.`);

  await desktop.evaluate(() => window.scrollTo(0, 0));
  await nextPaint(desktop);

  const editPhotos = desktop.locator('[data-curated-edit] .editorial-photo');
  assert(await editPhotos.count() === 22,
    'The complete Distance, made human. edit should contain 22 animated photographs.');

  const initialPhotoMotion = await editPhotos.evaluateAll(photos => photos.map((photo, index) => {
    const cardStyle = getComputedStyle(photo);
    const imageStyle = getComputedStyle(photo.querySelector('img'));
    return {
      index: index + 1,
      opacity: Number(cardStyle.opacity),
      transform: cardStyle.transform,
      clipPath: imageStyle.clipPath,
    };
  }));
  const staticPhotos = initialPhotoMotion.filter(photo =>
    photo.opacity >= 0.99
    && photo.transform === 'none'
    && (photo.clipPath === 'none' || photo.clipPath === 'inset(0px)')
  );
  assert(staticPhotos.length === 0,
    `Every Edit photograph should have its own staged entrance; static frames: ${staticPhotos.map(photo => photo.index).join(', ') || 'none'}.`);

  const chapterLeads = desktop.locator('.edit-group:has(.edit-chapter) .editorial-photo');
  assert(await chapterLeads.count() === 3,
    'Beyond Measure, One Among Many, and At Human Distance should each have one lead photograph.');
  const chapterSignatures = await chapterLeads.evaluateAll(photos => photos.map(photo => {
    const cardStyle = getComputedStyle(photo);
    const imageStyle = getComputedStyle(photo.querySelector('img'));
    return [cardStyle.opacity, cardStyle.transform, imageStyle.clipPath].join('|');
  }));
  assert(new Set(chapterSignatures).size === 3,
    'Each chapter lead should establish a distinct motion language rather than repeating the opening effect.');

  const finalPhoto = editPhotos.last();
  await finalPhoto.scrollIntoViewIfNeeded();
  await desktop.waitForFunction(
    element => Number(getComputedStyle(element).opacity) > 0.95
      && getComputedStyle(element).transform === 'none',
    await finalPhoto.elementHandle(),
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
  const reducedLastPhoto = reduced.locator('[data-curated-edit] .editorial-photo').last();
  assert(Number(await reducedLastPhoto.evaluate(el => getComputedStyle(el).opacity)) === 1,
    'Reduced-motion visitors must receive the complete edit without hidden reveal states.');
  assert(await reducedLastPhoto.evaluate(el => getComputedStyle(el).transform) === 'none',
    'Reduced-motion visitors must not receive staged photo transforms.');
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
  const mobileLastPhoto = mobile.locator('[data-curated-edit] .editorial-photo').last();
  const mobileLastPhotoState = await mobileLastPhoto.evaluate(el => ({
    opacity: Number(getComputedStyle(el).opacity),
    transform: getComputedStyle(el).transform,
  }));
  assert(mobileLastPhotoState.opacity < 0.99 || mobileLastPhotoState.transform !== 'none',
    'Every mobile Edit photograph should retain a simplified individual entrance.');

  await browser.close();
  console.log('Photography homepage scroll-story acceptance test passed.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
