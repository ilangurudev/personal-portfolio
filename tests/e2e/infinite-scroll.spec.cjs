/** Progressive loading, finite homepage curation, and stable story sequencing. */
const { chromium } = require('playwright');
const TARGET_URL = process.env.TEST_URL || 'http://127.0.0.1:4321';
const assert = (condition, message) => { if (!condition) throw new Error(message); };

(async () => {
  const browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  console.log('Testing progressive archive loading...');

  await page.goto(`${TARGET_URL}/photography/photos`);
  await page.waitForLoadState('networkidle');
  const total = Number(await page.locator('#total-count').textContent());
  const initial = await page.locator('#photos-grid .photo-card').count();
  assert(total > initial && initial > 0 && initial <= 40, 'Archive did not begin with a bounded batch.');
  const firstFive = page.locator('#photos-grid .photo-card img').first();
  assert(await firstFive.getAttribute('loading') === 'lazy', 'Archive images should lazy-load.');

  let loaded = initial;
  for (let attempt = 0; attempt < 4 && loaded === initial; attempt++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(900);
    loaded = await page.locator('#photos-grid .photo-card').count();
  }
  assert(loaded > initial, 'Archive did not load another batch after scrolling.');
  assert(Number(await page.locator('#visible-count').textContent()) === loaded, 'Visible archive count drifted from rendered cards.');

  await page.goto(`${TARGET_URL}/photography`);
  await page.waitForLoadState('networkidle');
  const curated = page.locator('[data-curated-photo]');
  assert(await curated.count() === 20, 'Homepage should stay finite at twenty curated photographs.');
  assert(await curated.first().locator('img').count() === 1, 'Curated photo markup is incomplete.');
  assert((await curated.first().locator('img').getAttribute('src'))?.length > 0, 'Curated photo URL is missing.');

  console.log('Testing stable, horizontal story sequencing...');
  await page.goto(`${TARGET_URL}/photography/album/puerto-rico-2025`);
  await page.waitForLoadState('networkidle');

  const storyCards = page.locator('.gallery-container .photo-card[data-photo-id]');
  const initialStoryCount = await storyCards.count();
  assert(initialStoryCount === 24, `Story should begin with three complete eight-photo groups, found ${initialStoryCount} photographs.`);

  const initialStoryGroups = page.locator('.gallery-container [data-story-layout-group]');
  assert(await initialStoryGroups.count() === 3, 'The initial story batch should render as three complete editorial groups.');
  for (let groupIndex = 0; groupIndex < 3; groupIndex++) {
    assert(await initialStoryGroups.nth(groupIndex).locator('.photo-card[data-photo-id]').count() === 8, 'Every complete editorial group should contain eight photographs.');
  }

  const initialPhotoIds = await storyCards.evaluateAll(cards => cards.map(card => card.getAttribute('data-photo-id')));
  const firstLayoutSequence = await initialStoryGroups.evaluateAll(groups => groups.map(group => group.getAttribute('data-planned-layout')));

  await page.waitForFunction(() =>
    [...document.querySelectorAll('.gallery-container .photo-card img')]
      .every(image => image.naturalWidth > 0 && image.naturalHeight > 0)
  );
  await page.waitForTimeout(250);

  const readStoryLayout = () => page.locator('.gallery-container .photo-card[data-photo-id]').evaluateAll(cards =>
    cards.map((card, index) => {
      const rect = card.getBoundingClientRect();
      return {
        index,
        id: card.getAttribute('data-photo-id'),
        left: Math.round(rect.left),
        top: Math.round(rect.top + window.scrollY)
      };
    })
  );

  const beforeLoad = await readStoryLayout();
  let loadedStoryCount = initialStoryCount;
  for (let attempt = 0; attempt < 4 && loadedStoryCount === initialStoryCount; attempt++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(900);
    loadedStoryCount = await storyCards.count();
  }
  assert(loadedStoryCount > initialStoryCount, 'Story did not load another batch after scrolling.');

  const afterLoad = await readStoryLayout();
  const loadedStoryGroups = page.locator('.gallery-container [data-story-layout-group]');
  const firstSixLayouts = (await loadedStoryGroups.evaluateAll(groups => groups.map(group => group.getAttribute('data-planned-layout')))).slice(0, 6);
  const originalCardsStayedPut = beforeLoad.every(before => {
    const after = afterLoad.find(card => card.id === before.id);
    return after && after.left === before.left && after.top === before.top;
  });

  assert(originalCardsStayedPut, 'Already-rendered story photographs moved when the next batch loaded.');
  assert(firstSixLayouts.length === 6 && new Set(firstSixLayouts).size === 6, 'The first six editorial groups should use every layout once before repeating.');
  const rowGeometry = await loadedStoryGroups.evaluateAll(groups => groups.flatMap(group =>
    [...group.querySelectorAll('[data-story-row]')].map(row => {
      const cards = [...row.querySelectorAll('.photo-card')];
      const heights = cards.map(card => card.getBoundingClientRect().height);
      return {
        cardCount: cards.length,
        heightDifference: heights.length > 1 ? Math.max(...heights) - Math.min(...heights) : 0
      };
    })
  ));
  assert(rowGeometry.every(row => row.cardCount >= 2 && row.cardCount <= 4), 'Story layouts should reflow into two-, three-, or four-photo rows without oversized solo frames.');
  assert(rowGeometry.every(row => row.heightDifference <= 2), 'Story rows should remain justified without matte bars or ragged holes.');

  await page.reload();
  await page.waitForLoadState('networkidle');
  const refreshedCards = page.locator('.gallery-container .photo-card[data-photo-id]');
  const refreshedGroups = page.locator('.gallery-container [data-story-layout-group]');
  const refreshedPhotoIds = await refreshedCards.evaluateAll(cards => cards.map(card => card.getAttribute('data-photo-id')));
  const refreshedLayoutSequence = await refreshedGroups.evaluateAll(groups => groups.map(group => group.getAttribute('data-planned-layout')));
  assert(refreshedPhotoIds.slice(0, initialPhotoIds.length).join('|') === initialPhotoIds.join('|'), 'Refreshing changed the chronological photograph order.');
  assert(refreshedLayoutSequence.slice(0, firstLayoutSequence.length).join('|') !== firstLayoutSequence.join('|'), 'Refreshing should produce a new editorial layout sequence.');

  await page.evaluate(() => window.scrollTo(0, 0));
  await refreshedCards.first().click();
  await page.locator('#photo-lightbox.active').waitFor();
  const storyTotal = await page.locator('#photos-data').evaluate(element => JSON.parse(element.textContent || '[]').length);
  const initialLightboxSource = await page.locator('.lightbox-image').getAttribute('src');
  const lightboxScrollPosition = await page.evaluate(() => window.scrollY);
  assert((await page.locator('.lightbox-counter').textContent())?.trim() === `1 / ${storyTotal}`, 'Lightbox did not open at the first story photograph.');
  await page.locator('.lightbox-next').click();
  await page.waitForFunction(source => document.querySelector('.lightbox-image')?.getAttribute('src') !== source, initialLightboxSource);
  assert((await page.locator('.lightbox-counter').textContent())?.trim() === `2 / ${storyTotal}`, 'Next did not advance to the second, horizontally adjacent story photograph.');
  assert(await page.evaluate(() => window.scrollY) === lightboxScrollPosition, 'Lightbox Next moved the page vertically.');

  console.log('Progressive loading and story sequence tests passed.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
