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
  assert(await curatedCards.count() === 22,
    'The Distance, made human edit must contain exactly 22 deliberately curated photographs.');
  const curatedImageSources = await curatedCards.locator('img').evaluateAll(images =>
    images.map(image => image.getAttribute('src'))
  );
  assert(curatedImageSources.every(source => source && !source.includes('/cdn-cgi/image/')),
    `Every photograph in the homepage edit must use its full-resolution source. Found ${curatedImageSources.filter(source => source?.includes('/cdn-cgi/image/')).join(', ')}.`);

  const hero = page.locator('[data-home-hero]');
  const heroPhotoId = await hero.getAttribute('data-hero-photo-id');
  assert(heroPhotoId, 'The homepage hero must identify the selected photograph.');
  assert(heroPhotoId === 'tampa-2025/20251109-_AR51732.md',
    `Distance, made human must open on the Tampa balcony figure pointing toward the Gulf. Found ${heroPhotoId}.`);
  const heroHeadline = (await hero.locator('h1').innerText()).replace(/\s+/g, ' ').trim();
  assert(heroHeadline === 'Distance, made human.',
    `The selected hero line is missing. Found "${heroHeadline}".`);
  const pointOfView = (await page.locator('#manifesto-title').innerText()).replace(/\s+/g, ' ').trim();
  assert(pointOfView === 'I photograph the distance between intimacy and immensity, using the human experience to turn monuments, mountains, crowds, and coastlines into lived space.',
    `The selected point of view is missing. Found "${pointOfView}".`);

  const curatedIds = await curatedCards.evaluateAll(cards =>
    cards.map(card => card.getAttribute('data-photo-id'))
  );
  assert(!curatedIds.includes(heroPhotoId),
    'The hero photograph must not repeat inside the curated edit.');
  const expectedCuratedIds = [
    'miami-2024/DJI_20241229174619_0019_D-Enhanced-NR.md',
    'olympic-2025/20250706-_AR56992.md',
    'olympic-2025/20250708-_AR58026.md',
    'puerto-rico-2025/20251214-_AR54596.md',
    'puerto-rico-2025/20251214-_AR54553.md',
    'rainier-2025/20250711-_AR58804.md',
    'new-york-2025/AR53141.md',
    'new-york-2025/AR53856.md',
    'olympic-2025/20250708-_AR58023.md',
    'dc-spring-2025/DSC00115.md',
    'puerto-rico-2025/20251214-_AR54253.md',
    'tampa-2025/20251108-_AR51547.md',
    'tampa-2025/20251111-_AR52171.md',
    'puerto-rico-2025/20251213-_AR53645.md',
    'tampa-2025/20251111-_AR52140.md',
    'miami-2024/DSC04805.md',
    'cherry-blossoms-2025/DSC00949.md',
    'puerto-rico-2025/20251214-_AR54764.md',
    'puerto-rico-2025/20251212-_AR53225.md',
    'puerto-rico-2025/20251214-_AR54842.md',
    'olympic-2025/20250708-_AR57853.md',
    'miami-2024/DSC08293.md',
  ];
  assert(JSON.stringify(curatedIds) === JSON.stringify(expectedCuratedIds),
    `The Distance, made human sequence is incorrect: ${curatedIds.join(', ')}.`);
  const expectedEditGroups = [
    ['feature', ['miami-2024/DJI_20241229174619_0019_D-Enhanced-NR.md']],
    ['pair', ['olympic-2025/20250706-_AR56992.md', 'olympic-2025/20250708-_AR58026.md']],
    ['pair', ['puerto-rico-2025/20251214-_AR54596.md', 'puerto-rico-2025/20251214-_AR54553.md']],
    ['feature', ['rainier-2025/20250711-_AR58804.md']],
    ['feature', ['new-york-2025/AR53141.md']],
    ['pair', ['new-york-2025/AR53856.md', 'olympic-2025/20250708-_AR58023.md']],
    ['pair', ['dc-spring-2025/DSC00115.md', 'puerto-rico-2025/20251214-_AR54253.md']],
    ['pair', ['tampa-2025/20251108-_AR51547.md', 'tampa-2025/20251111-_AR52171.md']],
    ['feature', ['puerto-rico-2025/20251213-_AR53645.md']],
    ['feature', ['tampa-2025/20251111-_AR52140.md']],
    ['pair', ['miami-2024/DSC04805.md', 'cherry-blossoms-2025/DSC00949.md']],
    ['pair', ['puerto-rico-2025/20251214-_AR54764.md', 'puerto-rico-2025/20251212-_AR53225.md']],
    ['pair', ['puerto-rico-2025/20251214-_AR54842.md', 'olympic-2025/20250708-_AR57853.md']],
    ['feature', ['miami-2024/DSC08293.md']],
  ];
  const renderedEditGroups = await page.locator('[data-edit-group]').evaluateAll(groups => groups.map(group => [
    group.getAttribute('data-edit-group'),
    [...group.querySelectorAll('[data-curated-photo]')].map(card => card.getAttribute('data-photo-id')),
  ]));
  assert(JSON.stringify(renderedEditGroups) === JSON.stringify(expectedEditGroups),
    `The Edit's feature/pair grouping is incorrect: ${JSON.stringify(renderedEditGroups)}.`);

  const chapterLabels = await page.locator('[data-edit-chapter] p').evaluateAll(labels =>
    labels.map(label => label.textContent.replace(/\s+/g, ' ').trim())
  );
  assert(JSON.stringify(chapterLabels) === JSON.stringify([
    'A / Beyond Measure',
    'B / One Among Many',
    'C / At Human Distance',
  ]), `The selected three-movement structure is missing: ${chapterLabels.join(', ')}.`);
  const editHeading = (await page.locator('#edit-title').innerText()).replace(/\s+/g, ' ').trim();
  assert(editHeading === 'Twenty-two photographs. One human measure.',
    `The edited-photo count and thesis are out of sync. Found "${editHeading}".`);

  const editGroups = page.locator('[data-edit-group]');
  assert(await editGroups.count() === 14,
    'The desktop edit should use fourteen deliberate visual groups rather than a modulo-based collage.');

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
  const featuredStorySlugs = await page.locator('[data-featured-story]').evaluateAll(stories =>
    stories.map(story => story.getAttribute('data-album-slug')),
  );
  assert(JSON.stringify(featuredStorySlugs) === JSON.stringify([
    'las-vegas-2026',
    'puerto-rico-2025',
    'new-york-2025',
    'olympic-2025',
    'rainier-2025',
    'miami-2024',
  ]), `The Featured Stories edit is incorrect: ${featuredStorySlugs.join(', ')}.`);

  const newYorkCover = page.locator('[data-featured-story][data-album-slug="new-york-2025"] img');
  assert((await newYorkCover.getAttribute('src'))?.includes('/new-york-2025/_AR53141.jpg'),
    'The New York story cover must show the children looking at the Statue of Liberty.');

  const otherNotebooks = page.locator('[data-story-archive]');
  assert(await otherNotebooks.count() === 1,
    'Every non-featured trip notebook must remain available in a secondary archive.');
  assert((await otherNotebooks.locator('h2').innerText()).includes('Other Notebooks'),
    'The secondary story collection must be titled Other Notebooks.');
  const otherNotebookSlugs = await otherNotebooks.locator('[data-album-slug]').evaluateAll(stories =>
    stories.map(story => story.getAttribute('data-album-slug')),
  );
  assert(!featuredStorySlugs.some(slug => otherNotebookSlugs.includes(slug)),
    'Featured stories must not be duplicated in Other Notebooks.');
  assert(otherNotebookSlugs.includes('seattle-2025')
    && otherNotebookSlugs.includes('georgetown-metro-2025')
    && otherNotebookSlugs.includes('tysons-foggy-2024'),
  'Albums outside the six-story edit must appear in Other Notebooks.');

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

  const archiveCards = page.locator('#photos-grid .photo-card[data-photo-id]');
  await archiveCards.first().waitFor({ state: 'visible' });
  const portraitCardIndex = await archiveCards.evaluateAll(async cards => {
    const orientations = await Promise.all(cards.map(card => new Promise(resolve => {
      const source = card.querySelector('img')?.src;
      if (!source) return resolve(false);
      const probe = new Image();
      probe.onload = () => resolve(probe.naturalHeight > probe.naturalWidth);
      probe.onerror = () => resolve(false);
      probe.src = source;
    })));
    return orientations.findIndex(Boolean);
  });
  assert(portraitCardIndex >= 0, 'The Archive needs a portrait photograph for immersive lightbox acceptance.');
  await archiveCards.nth(portraitCardIndex).click();
  await page.waitForSelector('#photo-lightbox.is-open, #photo-lightbox[style*="display: flex"]');
  await page.waitForTimeout(500);
  const desktopLightboxImage = page.locator('.lightbox-image');
  await desktopLightboxImage.evaluate(image => image.complete
    ? Promise.resolve()
    : new Promise(resolve => image.addEventListener('load', resolve, { once: true })));

  const immersiveImageBox = await desktopLightboxImage.boundingBox();
  assert(immersiveImageBox && immersiveImageBox.height >= 860,
    `A portrait photograph should use at least 86% of the 1000px-tall viewport. Found ${immersiveImageBox?.height || 0}px.`);

  const previousControl = page.locator('.lightbox-prev');
  const nextControl = page.locator('.lightbox-next');
  const closeControl = page.locator('.lightbox-close');
  const [previousBox, nextBox, closeBox] = await Promise.all([
    previousControl.boundingBox(),
    nextControl.boundingBox(),
    closeControl.boundingBox(),
  ]);
  const controlSurfaces = await Promise.all([
    previousControl.evaluate(control => ({
      background: getComputedStyle(control).backgroundColor,
      backdrop: getComputedStyle(control).backdropFilter,
    })),
    nextControl.evaluate(control => ({
      background: getComputedStyle(control).backgroundColor,
      backdrop: getComputedStyle(control).backdropFilter,
    })),
    closeControl.evaluate(control => ({
      background: getComputedStyle(control).backgroundColor,
      backdrop: getComputedStyle(control).backdropFilter,
      color: getComputedStyle(control).color,
    })),
  ]);
  assert(controlSurfaces.every(surface => surface.background === 'rgba(0, 0, 0, 0)' && surface.backdrop === 'none'),
    'Lightbox navigation and close controls should be bare glyphs without liquid-glass surfaces.');
  assert(previousBox && previousBox.x + previousBox.width <= immersiveImageBox.x
    && nextBox && nextBox.x >= immersiveImageBox.x + immersiveImageBox.width,
  'Previous and next glyphs should sit wholly inside the side margins, outside the photograph.');
  assert(closeBox
    && closeBox.x >= immersiveImageBox.x + immersiveImageBox.width
    && closeBox.y >= immersiveImageBox.y
    && closeBox.y + closeBox.height <= immersiveImageBox.y + 64,
  'The plain close glyph should sit in the right margin aligned with the photograph’s top edge.');
  assert(controlSurfaces[2].color === 'rgb(255, 255, 255)',
    'The close glyph should be white.');
  assert((await closeControl.innerText()).trim() === '' && await closeControl.locator('svg').count() === 1,
    'The close control should use a custom icon rather than a typographic multiplication glyph.');
  const closeIconStyle = await closeControl.locator('svg').evaluate(icon => ({
    width: parseFloat(getComputedStyle(icon).width),
    height: parseFloat(getComputedStyle(icon).height),
    strokeWidth: parseFloat(getComputedStyle(icon).strokeWidth),
  }));
  assert(closeIconStyle.width <= 18 && closeIconStyle.height <= 18 && closeIconStyle.strokeWidth <= 1.5,
    'The close icon should remain a restrained, thin-line mark.');

  const desktopInfoToggle = page.locator('.lightbox-info-toggle');
  assert(await desktopInfoToggle.locator('svg').count() === 1
    && await desktopInfoToggle.locator('svg circle').count() === 0,
  'The information control should use its button edge as the only circle, without a second concentric SVG ring.');
  assert(await desktopLightboxImage.evaluate(image => getComputedStyle(image).cursor) === 'zoom-in',
    'The photograph should advertise the available zoom with a zoom-in cursor.');

  const unzoomedImageBox = await desktopLightboxImage.boundingBox();
  await desktopLightboxImage.click();
  await page.waitForTimeout(300);
  const zoomedImageBox = await desktopLightboxImage.boundingBox();
  assert(zoomedImageBox && zoomedImageBox.height >= unzoomedImageBox.height * 1.99,
    'Clicking the photograph should magnify it by 100% to twice its normal size.');
  assert(await desktopLightboxImage.evaluate(image => getComputedStyle(image).cursor) === 'zoom-out',
    'The zoomed photograph should advertise the zoom-out toggle.');

  await desktopLightboxImage.click();
  await page.waitForTimeout(300);
  const restoredImageBox = await desktopLightboxImage.boundingBox();
  assert(restoredImageBox && Math.abs(restoredImageBox.height - unzoomedImageBox.height) <= 2,
    'Clicking the zoomed photograph again should restore its original scale.');
  assert(await desktopLightboxImage.evaluate(image => getComputedStyle(image).cursor) === 'zoom-in',
    'The restored photograph should return to the zoom-in cursor.');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(350);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${TARGET_URL}/photography`);
  await page.waitForLoadState('networkidle');
  const openingImageTop = await page.locator('[data-home-hero] img').evaluate(el => el.getBoundingClientRect().top);
  assert(openingImageTop < 100, 'Mobile visitors should meet a photograph immediately.');
  const mobileHeroPosition = await page.locator('[data-home-hero] img').evaluate(el => getComputedStyle(el).objectPosition);
  assert(mobileHeroPosition === '40% 48%',
    `The mobile hero crop must preserve the lone figure at the human center of the edit. Found ${mobileHeroPosition}.`);

  await page.locator('[data-curated-photo]').first().click();
  await page.waitForSelector('#photo-lightbox.is-open, #photo-lightbox[style*="display: flex"]');
  await page.waitForTimeout(500);
  const mobileImageBox = await page.locator('.lightbox-image').boundingBox();
  const [mobilePreviousBox, mobileNextBox, mobileCloseBox] = await Promise.all([
    page.locator('.lightbox-prev').boundingBox(),
    page.locator('.lightbox-next').boundingBox(),
    page.locator('.lightbox-close').boundingBox(),
  ]);
  assert(mobileImageBox && mobilePreviousBox && mobileNextBox
    && mobilePreviousBox.y >= mobileImageBox.y + mobileImageBox.height
    && mobileNextBox.y >= mobileImageBox.y + mobileImageBox.height,
  'When side margins are too narrow, bare navigation glyphs should move into the black control margin below the photograph.');
  assert(mobileImageBox && mobileCloseBox
    && mobileCloseBox.y + mobileCloseBox.height <= mobileImageBox.y,
  'When the right margin is too narrow, the close glyph should move into the upper black margin above the photograph.');
  const infoPanel = page.locator('[data-lightbox-info-panel]');
  assert(await infoPanel.count() === 1, 'Lightbox context needs one progressive information panel.');
  assert(!(await infoPanel.isVisible()), 'Photo context must not compete with the photograph by default.');
  assert(!(await page.locator('.lightbox-album').isVisible()), 'Album context must stay inside the closed information panel.');
  assert(!(await page.locator('.lightbox-tags').isVisible()), 'Tags must stay inside the closed information panel.');

  const infoToggle = page.locator('.lightbox-info-toggle');
  assert(await infoToggle.getAttribute('aria-expanded') === 'false', 'The information toggle must expose its closed state.');
  assert((await infoToggle.innerText()).trim() === '', 'The information toggle must be icon-only.');
  assert(await infoToggle.locator('svg').count() === 1, 'The information toggle must use a circular i icon.');
  const expectedPhotoTitle = (await page.locator('.lightbox-image').getAttribute('alt') || '').trim();
  assert(expectedPhotoTitle.length > 0, 'The open photograph needs an accessible title.');

  await infoToggle.click();
  assert(await infoPanel.isVisible(), 'Opening information must reveal album, tags, title, and technical details together.');
  assert(await infoToggle.getAttribute('aria-expanded') === 'true', 'The information toggle must expose its open state.');
  assert(await page.locator('.lightbox-album').isVisible(), 'Opening information must reveal the album name.');
  assert(await page.locator('.lightbox-tag').first().isVisible(), 'Opening information must reveal photo tags.');
  const disclosedPhotoTitle = page.locator('[data-lightbox-photo-title]');
  assert(await disclosedPhotoTitle.isVisible(), 'Opening information must reveal the photograph title.');
  const disclosedPhotoTitleText = (await disclosedPhotoTitle.innerText()).trim();
  assert(disclosedPhotoTitleText.toLocaleLowerCase() === expectedPhotoTitle.toLocaleLowerCase(),
    `The title shown in information must match the open photograph. Alt: "${expectedPhotoTitle}". Information: "${disclosedPhotoTitleText}".`);

  const imageBox = await page.locator('.lightbox-image').boundingBox();
  const infoBox = await infoPanel.boundingBox();
  assert(imageBox && infoBox && infoBox.y >= imageBox.y + imageBox.height - 1,
    'Expanded information must sit below the photograph without covering it.');

  await infoToggle.click();
  assert(!(await infoPanel.isVisible()), 'The same information icon must close the panel.');
  assert(await infoToggle.getAttribute('aria-expanded') === 'false', 'The information toggle must return to its closed state.');
  assert((await infoToggle.innerText()).trim() === '', 'Closing information must not replace the icon with Close details text.');

  console.log('Photography editorial redesign acceptance tests passed.');
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
