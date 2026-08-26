/** Photography tag-detail pages use the same editorial story contract as albums. */
const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://127.0.0.1:4321';
const STORY_URL = `${TARGET_URL}/photography/tag/street%20photography`;
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function loadInitialTagStory(page) {
  const total = await page.locator('#photos-data').evaluate(element =>
    JSON.parse(element.textContent || '[]').length
  );
  await page.locator('[data-story-gallery]').waitFor({ state: 'visible' });
  await page.locator('.gallery-container .photo-card[data-photo-id]').first().waitFor({ state: 'visible' });
  await page.waitForFunction(expected => window.photoLightbox?.photos?.length === expected, total);
  return total;
}

(async () => {
  const browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(STORY_URL);
  await page.waitForLoadState('networkidle');
  const total = await loadInitialTagStory(page);

  const plan = await page.locator('.gallery-container').evaluate(gallery => {
    const storyGallery = gallery.querySelector('[data-story-gallery]');
    const rows = [...gallery.querySelectorAll('[data-story-row]')].map(row => {
      const cards = [...row.querySelectorAll('.photo-card[data-photo-id]')];
      return {
        kind: row.getAttribute('data-story-row'),
        ids: cards.map(card => card.getAttribute('data-photo-id')),
        imageKinds: cards.map(card => card.getAttribute('data-image-source')),
        sources: cards.map(card => card.querySelector('img')?.getAttribute('src') || ''),
        width: row.getBoundingClientRect().width,
        cardWidths: cards.map(card => card.getBoundingClientRect().width)
      };
    });

    return {
      hasStoryGallery: Boolean(storyGallery),
      galleryWidth: storyGallery?.getBoundingClientRect().width || 0,
      rows,
      featuredIds: [...gallery.querySelectorAll('.photo-card[data-featured="true"]')]
        .map(card => card.getAttribute('data-photo-id')),
      lightboxOrder: window.photoLightbox?.photos?.map(photo => photo.id) || []
    };
  });

  assert(plan.hasStoryGallery, 'Tag detail should render the editorial story gallery on desktop.');
  assert(plan.rows.length > 0, 'Tag detail should expose planned story rows.');
  const renderedOrder = plan.rows.flatMap(row => row.ids);
  assert(renderedOrder.length >= 20 && renderedOrder.length < total, 'Tag story should begin with complete progressively loaded rows.');

  const anchorRows = plan.rows.filter(row => row.kind === 'anchor');
  const anchorIds = anchorRows.flatMap(row => row.ids);
  assert(anchorRows.length > 0, 'Street photography should expose featured anchors.');
  assert(anchorIds.join('|') === plan.featuredIds.join('|'), 'Every featured tag photo should remain an anchor.');
  assert(anchorRows.every(row => row.ids.length === 1), 'Every tag anchor should contain one photograph.');
  assert(anchorRows.every(row => Math.abs(row.width - plan.galleryWidth) <= 2), 'Tag anchors should occupy the full gallery width.');
  assert(anchorRows.every(row => Math.abs(row.cardWidths[0] - row.width) <= 2), 'Tag anchor cards should fill their row.');
  assert(anchorRows.every(row => row.imageKinds[0] === 'original'), 'Tag anchors should request original-resolution photos.');
  assert(anchorRows.every(row => !row.sources[0].includes('/cdn-cgi/image/')), 'Tag anchors should bypass resized CDN derivatives.');

  const anchorIndices = plan.rows.flatMap((row, index) => row.kind === 'anchor' ? [index] : []);
  for (let index = 1; index < anchorIndices.length; index++) {
    const between = plan.rows.slice(anchorIndices[index - 1] + 1, anchorIndices[index]);
    assert(
      between.some(row => row.kind === 'support' && row.ids.length >= 2),
      'Every pair of tag anchors should be separated by a complete support row.'
    );
  }

  const supportRows = plan.rows.filter(row => row.kind === 'support');
  assert(supportRows.every(row => row.ids.length >= 1 && row.ids.length <= 4), 'Tag support rows should contain one to four photographs.');
  assert(supportRows.flatMap(row => row.imageKinds).every(kind => kind === 'resized'), 'Tag support photos should use resized derivatives.');

  assert(plan.lightboxOrder.length === total, 'Tag lightbox should contain every matching photograph.');
  assert(
    plan.lightboxOrder.slice(0, renderedOrder.length).join('|') === renderedOrder.join('|'),
    'Tag lightbox navigation should begin with the displayed editorial sequence.'
  );

  console.log('Tag story layout tests passed.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
