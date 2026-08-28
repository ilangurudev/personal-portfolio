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
  assert(await cards.count() === 22, 'Curated photo cards are missing.');
  const imageTreatment = await cards.first().locator('img').evaluate(el => ({ fit: getComputedStyle(el).objectFit, naturalHeight: el.naturalHeight }));
  assert(imageTreatment.fit === 'contain', 'Curated images are being cropped.');
  assert(imageTreatment.naturalHeight > 0, 'Curated image failed to load.');

  const framedCard = cards.nth(4);
  await framedCard.scrollIntoViewIfNeeded();
  await page.waitForFunction(card => Number(getComputedStyle(card).opacity) > 0.99
    && getComputedStyle(card).transform === 'none'
    && getComputedStyle(card.querySelector('img')).transform === 'none', await framedCard.elementHandle());
  await framedCard.hover();
  await page.waitForTimeout(300);
  const hoverTreatment = await framedCard.evaluate(card => {
    const cardStyle = getComputedStyle(card);
    const imageStyle = getComputedStyle(card.querySelector('img'));
    const cardRect = card.getBoundingClientRect();
    const numberRect = card.querySelector('.photo-number').getBoundingClientRect();
    const outlineOffset = parseFloat(cardStyle.outlineOffset);
    const outlineWidth = parseFloat(cardStyle.outlineWidth);
    return {
      filter: imageStyle.filter,
      transform: imageStyle.transform,
      outlineColor: cardStyle.outlineColor,
      outlineOffset,
      outlineWidth,
      numberFrameSeparation: cardRect.left - outlineOffset - outlineWidth - numberRect.right,
    };
  });
  assert(hoverTreatment.filter === 'none' && hoverTreatment.transform === 'none',
    `Hover must preserve the photograph's color and geometry. Found filter ${hoverTreatment.filter} and transform ${hoverTreatment.transform}.`);
  assert(hoverTreatment.outlineColor === 'rgb(240, 74, 36)'
    && hoverTreatment.outlineOffset > 0
    && hoverTreatment.outlineWidth === 1,
  `Hover must indicate clickability with the offset signal-orange frame. Found ${JSON.stringify(hoverTreatment)}.`);
  assert(hoverTreatment.numberFrameSeparation >= 2,
    `The hover frame must leave visible space beside the frame number. Found ${hoverTreatment.numberFrameSeparation}px.`);

  await page.mouse.move(0, 0);
  await cards.nth(3).focus();
  await page.keyboard.press('Tab');
  await page.waitForTimeout(250);
  const focusTreatment = await framedCard.evaluate(card => ({
    active: document.activeElement === card,
    focusVisible: card.matches(':focus-visible'),
    outlineColor: getComputedStyle(card).outlineColor,
  }));
  assert(focusTreatment.active && focusTreatment.focusVisible && focusTreatment.outlineColor === 'rgb(240, 74, 36)',
    `Keyboard focus must receive the same signal-orange frame as pointer hover. Found ${JSON.stringify(focusTreatment)}.`);

  await framedCard.evaluate(card => card.blur());

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
