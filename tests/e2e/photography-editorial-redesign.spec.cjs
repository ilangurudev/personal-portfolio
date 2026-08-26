/**
 * Photography editorial redesign acceptance tests.
 *
 * Public seams: photography routes, navigation, curated work, story index,
 * public themes, responsive hierarchy, and progressive lightbox disclosure.
 */

const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://127.0.0.1:4321';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  console.log('Testing the photography editorial redesign...');

  await page.goto(`${TARGET_URL}/photography`);
  await page.waitForLoadState('networkidle');

  const mainChildren = page.locator('main.photo-main > *');
  assert(await mainChildren.first().getAttribute('data-home-hero') !== null,
    'The photography homepage must lead with the work, not the biography.');

  const expectedPhotographyNavigation = [
    ['Work', '/photography#work'],
    ['Stories', '/photography/albums'],
    ['Archive', '/photography/photos'],
    ['Themes', '/photography/tags'],
    ['Search', '/photography/search'],
    ['About', '/photography#about'],
  ];
  const readNavigation = (locator, selector = 'a') => locator.locator(selector).evaluateAll(links =>
    links.map(link => [link.textContent.trim(), link.getAttribute('href')])
  );
  const desktopNavigation = await readNavigation(page.locator('.desktop-nav'), 'a:not(.professional-link)');
  const drawerDestinations = await page.locator('.mobile-menu-links a').evaluateAll(links =>
    links.map(link => link.getAttribute('href'))
  );
  assert(JSON.stringify(desktopNavigation) === JSON.stringify(expectedPhotographyNavigation),
    `Desktop photography navigation must expose the complete visitor index. Found ${JSON.stringify(desktopNavigation)}.`);
  assert(JSON.stringify(drawerDestinations) === JSON.stringify(expectedPhotographyNavigation.map(([, href]) => href)),
    `The photography drawer must match the desktop visitor index. Found ${JSON.stringify(drawerDestinations)}.`);

  const curatedCards = page.locator('[data-curated-photo]');
  assert(await curatedCards.count() === 20,
    'The homepage edit must contain exactly 20 deliberately curated photographs.');

  const hero = page.locator('[data-home-hero]');
  const heroPhotoId = await hero.getAttribute('data-hero-photo-id');
  const heroAlt = (await hero.locator('img').getAttribute('alt') || '').toLowerCase();
  assert(heroPhotoId, 'The homepage hero must identify the selected photograph.');
  assert(!heroPhotoId.includes('20251214-_AR54253') && !heroAlt.includes('cemetery'),
    'The homepage must not open on the Old San Juan cemetery photograph.');

  const curatedIds = await curatedCards.evaluateAll(cards =>
    cards.map(card => card.getAttribute('data-photo-id'))
  );
  assert(!curatedIds.includes(heroPhotoId),
    'The hero photograph must not repeat inside the curated edit.');
  assert(!curatedIds.some(id => id && id.includes('20251214-_AR54253')),
    'The cemetery photograph should be removed from the homepage edit.');

  const editGroups = page.locator('[data-edit-group]');
  assert(await editGroups.count() === 11,
    'The desktop edit should use eleven deliberate visual groups rather than a modulo-based collage.');

  let previousBottom = 0;
  for (let index = 0; index < await editGroups.count(); index++) {
    const group = editGroups.nth(index);
    const groupBox = await group.boundingBox();
    assert(groupBox, `Edit group ${index + 1} is not measurable.`);
    assert(groupBox.y >= previousBottom - 1,
      `Edit group ${index + 1} overlaps the preceding group.`);
    previousBottom = groupBox.y + groupBox.height;

    const kind = await group.getAttribute('data-edit-group');
    const cards = group.locator('[data-curated-photo]');
    const cardCount = await cards.count();
    if (kind === 'feature') {
      assert(cardCount === 1, `Feature group ${index + 1} must contain one photograph.`);
      const cardBox = await cards.first().boundingBox();
      assert(cardBox.width >= groupBox.width * 0.9,
        `Feature group ${index + 1} should act as a full-width visual anchor.`);
    } else {
      assert(kind === 'pair' && cardCount === 2,
        `Balanced group ${index + 1} must contain exactly two photographs.`);
      const left = await cards.nth(0).boundingBox();
      const right = await cards.nth(1).boundingBox();
      assert(Math.abs(left.width - right.width) <= 2,
        `Pair group ${index + 1} must use equal-width columns.`);
      assert(Math.abs(left.y - right.y) <= 2,
        `Pair group ${index + 1} must align both photographs to the same row.`);

      const leftNumber = await cards.nth(0).locator('.photo-number').boundingBox();
      const rightNumber = await cards.nth(1).locator('.photo-number').boundingBox();
      const leftEdge = left.x + left.width;
      const rightEdge = right.x;
      assert(rightNumber.x >= leftEdge + 2 && rightNumber.x + rightNumber.width <= rightEdge - 2,
        `Photograph ${index + 1}'s right-hand number must sit inside the pair gutter without touching either image.`);

      const leftNumberGap = left.x - (leftNumber.x + leftNumber.width);
      const rightNumberGap = right.x - (rightNumber.x + rightNumber.width);
      assert(Math.abs(leftNumberGap - rightNumberGap) <= 2,
        `Pair group ${index + 1} must use consistent spacing between each number and its photograph.`);
    }
  }

  const curatedTop = await page.locator('[data-curated-edit]').evaluate(el => el.getBoundingClientRect().top);
  const aboutTop = await page.locator('[data-home-about]').evaluate(el => el.getBoundingClientRect().top);
  assert(curatedTop < aboutTop, 'The curated work must appear before the biography.');

  const heroFont = await page.locator('[data-home-hero] h1').evaluate(el => getComputedStyle(el).fontFamily);
  assert(heroFont.includes('Instrument Serif'), 'The new editorial display typeface is not active.');

  const firstCuratedImage = curatedCards.first().locator('img');
  const firstImageFit = await firstCuratedImage.evaluate(el => getComputedStyle(el).objectFit);
  assert(firstImageFit !== 'cover', 'Curated photographs must preserve their authored compositions.');

  await page.goto(`${TARGET_URL}/photography/albums`);
  await page.waitForLoadState('networkidle');
  assert((await page.title()).startsWith('Stories') && (await page.locator('h1').first().innerText()).includes('Places'),
    'The album index should be framed as authored photographic stories.');
  assert(await page.locator('[data-featured-story]').count() === 6,
    'The story index must foreground six authored bodies of work.');
  assert(await page.locator('[data-story-archive]').count() === 1,
    'Older trip notebooks must remain available in a secondary archive.');

  await page.goto(`${TARGET_URL}/photography/tags`);
  await page.waitForLoadState('networkidle');
  const publicThemes = page.locator('[data-public-theme]');
  const publicThemeCount = await publicThemes.count();
  assert(publicThemeCount >= 6 && publicThemeCount <= 10,
    `Expected 6–10 public themes, found ${publicThemeCount}.`);
  const themeText = (await publicThemes.allTextContents()).join(' ').toLowerCase();
  for (const internalTag of ['portrait orientation', 'high contast', 'frame fill']) {
    assert(!themeText.includes(internalTag), `Internal taxonomy leaked into public themes: ${internalTag}`);
  }

  await page.goto(`${TARGET_URL}/photography/photos`);
  await page.waitForLoadState('networkidle');
  assert(await page.locator('[data-archive-page]').count() === 1,
    'The full catalog must be clearly identified as the Archive.');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${TARGET_URL}/photography`);
  await page.waitForLoadState('networkidle');
  const openingImageTop = await page.locator('[data-home-hero] img').evaluate(el => el.getBoundingClientRect().top);
  assert(openingImageTop < 100, 'Mobile visitors should meet a photograph immediately.');

  await page.locator('[data-curated-photo]').first().click();
  await page.waitForSelector('#photo-lightbox.is-open, #photo-lightbox[style*="display: flex"]');
  const techDetails = page.locator('[data-lightbox-technical]');
  assert(await techDetails.count() === 1, 'Lightbox technical details need a progressive-disclosure container.');
  assert(!(await techDetails.isVisible()), 'Technical metadata must not compete with the photograph by default.');

  console.log('Photography editorial redesign acceptance tests passed.');
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
