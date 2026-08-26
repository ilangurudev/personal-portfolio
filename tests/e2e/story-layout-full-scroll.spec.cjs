/** Full-scroll acceptance coverage for randomized, composition-preserving story layouts. */
const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://127.0.0.1:4321';
const STORY_URL = `${TARGET_URL}/photography/album/puerto-rico-2025`;
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function loadEntireStory(page) {
  const total = await page.locator('#photos-data').evaluate(element =>
    JSON.parse(element.textContent || '[]').length
  );

  for (let attempt = 0; attempt < 20; attempt++) {
    const rendered = await page.locator('.gallery-container .photo-card[data-photo-id]').count();
    if (rendered === total) return total;
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(450);
  }

  throw new Error('Story did not render every photograph while scrolling to the bottom.');
}

async function scrollThroughStory(page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  for (let step = 0; step < 140; step++) {
    const reachedBottom = await page.evaluate(() => {
      window.scrollBy(0, Math.max(480, window.innerHeight * 0.75));
      return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    });
    await page.waitForTimeout(60);
    if (reachedBottom) return;
  }
  throw new Error('Story could not be swept from top to bottom within the safety limit.');
}

(async () => {
  const browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  for (let refresh = 0; refresh < 3; refresh++) {
    console.log(`Inspecting full story layout pass ${refresh + 1}/3...`);
    await page.goto(STORY_URL);
    await page.waitForLoadState('networkidle');
    const total = await loadEntireStory(page);
    await scrollThroughStory(page);

    await page.waitForFunction(() =>
      [...document.querySelectorAll('.gallery-container .photo-card img')]
        .every(image => image.naturalWidth > 0 && image.naturalHeight > 0)
    );
    await page.waitForTimeout(250);

    const audit = await page.locator('.gallery-container').evaluate((gallery, expectedTotal) => {
      const cards = [...gallery.querySelectorAll('.photo-card[data-photo-id]')];
      const rows = [...gallery.querySelectorAll('[data-story-row]')];
      const measurements = cards.map((card, index) => {
        const image = card.querySelector('img');
        const cardRect = card.getBoundingClientRect();
        const imageRect = image.getBoundingClientRect();
        return {
          index,
          id: card.getAttribute('data-photo-id'),
          cardRect: { left: cardRect.left, top: cardRect.top, right: cardRect.right, bottom: cardRect.bottom },
          naturalRatio: image.naturalWidth / image.naturalHeight,
          renderedRatio: imageRect.width / imageRect.height,
          objectFit: getComputedStyle(image).objectFit
        };
      });

      const visualOrder = [...measurements]
        .sort((a, b) => Math.abs(a.cardRect.top - b.cardRect.top) > 2
          ? a.cardRect.top - b.cardRect.top
          : a.cardRect.left - b.cardRect.left)
        .map(item => item.id);
      const overlaps = measurements.flatMap((first, firstIndex) =>
        measurements.slice(firstIndex + 1).flatMap(second => {
          const horizontal = Math.min(first.cardRect.right, second.cardRect.right) - Math.max(first.cardRect.left, second.cardRect.left);
          const vertical = Math.min(first.cardRect.bottom, second.cardRect.bottom) - Math.max(first.cardRect.top, second.cardRect.top);
          return horizontal > 2 && vertical > 2 ? [[first.id, second.id]] : [];
        })
      );
      const lastCardBottom = Math.max(...measurements.map(item => item.cardRect.bottom));
      const footerTop = document.querySelector('footer')?.getBoundingClientRect().top ?? gallery.getBoundingClientRect().bottom;
      const pageBackground = getComputedStyle(document.body).backgroundColor;
      const raggedRows = rows.flatMap((row, rowIndex) => {
          const rowCards = [...row.children].filter(child => child.matches('.photo-card'));
          if (rowCards.length < 2) return [];
          const heights = rowCards.map(card => card.getBoundingClientRect().height);
          return Math.max(...heights) - Math.min(...heights) > 2
            ? [{ layout: row.getAttribute('data-planned-layout'), rowIndex, heights: heights.map(Math.round) }]
            : [];
      });
      const avoidableSoloRows = rows
        .filter(row => row.getAttribute('data-story-row') === 'support'
          && row.querySelectorAll('.photo-card').length === 1
          && !row.hasAttribute('data-quiet-solo'))
        .map((row, rowIndex) => ({ layout: row.getAttribute('data-planned-layout'), rowIndex }));

      return {
        total: cards.length,
        expectedTotal,
        rowSizes: rows.map(row => row.querySelectorAll('.photo-card[data-photo-id]').length),
        photoOrder: measurements.map(item => item.id),
        visualOrder,
        overlaps,
        raggedRows,
        avoidableSoloRows,
        incompleteGroupGap: footerTop - lastCardBottom,
        cropped: measurements.filter(item =>
          item.objectFit !== 'contain' || Math.abs(item.naturalRatio - item.renderedRatio) > 0.03
        ),
        matted: cards.filter(card => {
          const background = getComputedStyle(card.querySelector('.photo-image')).backgroundColor;
          return background !== pageBackground && background !== 'rgba(0, 0, 0, 0)';
        }).map(card => card.getAttribute('data-photo-id'))
      };
    }, total);

    assert(audit.total === audit.expectedTotal, `Expected ${audit.expectedTotal} photos at the bottom, found ${audit.total}.`);
    assert(audit.rowSizes.every(size => size >= 1 && size <= 4), 'Story rows should contain between one and four photographs.');
    assert(audit.cropped.length === 0, `${audit.cropped.length} story thumbnails hide part of their source composition.`);
    assert(audit.matted.length === 0, `${audit.matted.length} story thumbnails use a visible matte instead of natural reflow.`);
    assert(audit.raggedRows.length === 0, `Mixed image ratios leave ragged holes in story rows: ${JSON.stringify(audit.raggedRows.slice(0, 3))}`);
    assert(audit.avoidableSoloRows.length === 0, `A partial story group created an oversized solo row: ${JSON.stringify(audit.avoidableSoloRows)}`);
    assert(audit.overlaps.length === 0, `Story cards overlap: ${JSON.stringify(audit.overlaps.slice(0, 3))}`);
    assert(audit.visualOrder.join('|') === audit.photoOrder.join('|'), 'The visual story order differs from its editorial DOM order.');
    assert(audit.incompleteGroupGap < 200, `The final incomplete group leaves ${Math.round(audit.incompleteGroupGap)}px of dead space before the footer.`);
  }

  console.log('Full-scroll story layout tests passed.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
