/** Featured photographs become spaced full-width anchors in the album's editorial sequence. */
const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://127.0.0.1:4321';
const STORY_URL = `${TARGET_URL}/photography/album/puerto-rico-2025`;
const PORTRAIT_STORY_URL = `${TARGET_URL}/photography/album/new-york-2025`;
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function loadEntireStory(page) {
  const total = await page.locator('#photos-data').evaluate(element =>
    JSON.parse(element.textContent || '[]').length
  );

  for (let attempt = 0; attempt < 24; attempt++) {
    const rendered = await page.locator('.gallery-container .photo-card[data-photo-id]').count();
    if (rendered === total) return;
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(450);
  }

  throw new Error('Story did not render every photograph.');
}

async function readPlan(page) {
  return page.locator('.gallery-container').evaluate(gallery => {
    const rows = [...gallery.querySelectorAll('[data-story-row]')].map(row => {
      const cards = [...row.querySelectorAll('.photo-card[data-photo-id]')];
      return {
        kind: row.getAttribute('data-story-row'),
        ids: cards.map(card => card.getAttribute('data-photo-id')),
        sources: cards.map(card => card.querySelector('img')?.getAttribute('src') || ''),
        imageKinds: cards.map(card => card.getAttribute('data-image-source')),
        cardWidths: cards.map(card => card.getBoundingClientRect().width),
        width: row.getBoundingClientRect().width
      };
    });

    return {
      rows,
      galleryWidth: gallery.querySelector('[data-story-gallery]')?.getBoundingClientRect().width || 0,
      lightboxOrder: window.photoLightbox?.photos?.map(photo => photo.id) || [],
      featuredIds: [...gallery.querySelectorAll('.photo-card[data-featured="true"]')]
        .map(card => card.getAttribute('data-photo-id'))
    };
  });
}

(async () => {
  const browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const observedSupportRhythms = new Set();
  let expectedAnchorIds;

  for (let refresh = 0; refresh < 3; refresh++) {
    await page.goto(STORY_URL);
    await page.waitForLoadState('networkidle');
    await loadEntireStory(page);
    const plan = await readPlan(page);

    const anchorRows = plan.rows.filter(row => row.kind === 'anchor');
    const anchorIds = anchorRows.flatMap(row => row.ids);
    assert(anchorRows.length > 1, 'The story should expose multiple featured anchors.');
    assert(
      anchorIds.join('|') === plan.featuredIds.join('|'),
      `Every featured photograph should remain a full-width anchor in source order. Expected ${plan.featuredIds.join(', ')}, found ${anchorIds.join(', ')}.`
    );
    assert(anchorRows.every(row => row.ids.length === 1), 'Every featured anchor should contain exactly one photograph.');
    assert(anchorRows.every(row => Math.abs(row.width - plan.galleryWidth) <= 2), 'Featured anchors should occupy the full gallery width.');
    assert(anchorRows.every(row => row.imageKinds[0] === 'original'), 'Featured anchors should request the original photo URL.');
    assert(anchorRows.every(row => !row.sources[0].includes('/cdn-cgi/image/')), 'Featured anchors should bypass resized CDN derivatives.');

    const anchorIndices = plan.rows.flatMap((row, index) => row.kind === 'anchor' ? [index] : []);
    for (let index = 1; index < anchorIndices.length; index++) {
      const between = plan.rows.slice(anchorIndices[index - 1] + 1, anchorIndices[index]);
      assert(
        between.some(row => row.kind === 'support' && row.ids.length >= 2),
        'Every pair of featured anchors should be separated by a complete supporting row.'
      );
    }

    const supportRows = plan.rows.filter(row => row.kind === 'support');
    assert(
      supportRows.every(row => row.ids.length >= 1 && row.ids.length <= 4),
      'Supporting rows should contain one quiet solo or two to four photographs.'
    );
    assert(
      supportRows.flatMap(row => row.imageKinds).every(kind => kind === 'resized'),
      'Supporting photographs should retain resized thumbnail URLs.'
    );

    const renderedOrder = plan.rows.flatMap(row => row.ids);
    assert(
      plan.lightboxOrder.join('|') === renderedOrder.join('|'),
      'Lightbox navigation should follow the displayed editorial sequence.'
    );

    if (expectedAnchorIds) {
      assert(anchorIds.join('|') === expectedAnchorIds.join('|'), 'Refresh changed which photographs act as anchors.');
    } else {
      expectedAnchorIds = anchorIds;
    }
    observedSupportRhythms.add(supportRows.map(row => row.ids.length).join('-'));
  }

  assert(observedSupportRhythms.size > 1, 'Supporting row rhythm should vary across repeated refreshes.');

  await page.goto(PORTRAIT_STORY_URL);
  await page.waitForLoadState('networkidle');
  await loadEntireStory(page);
  const portraitPlan = await readPlan(page);
  const portraitAnchors = portraitPlan.rows.filter(row => row.kind === 'anchor');
  assert(portraitAnchors.length > 0, 'The portrait-heavy story should expose featured anchors.');
  assert(
    portraitAnchors.every(row => Math.abs(row.cardWidths[0] - row.width) <= 2),
    'Featured portrait photographs should fill their full-width anchor row.'
  );

  console.log('Featured story anchor tests passed.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
