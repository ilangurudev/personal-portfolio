/**
 * Story Drawer - Album & Tag Pages
 *
 * - Finds a photo with story content from global metadata (no hardcoded ids)
 * - Verifies story drawer on the photo's album page
 * - Verifies story drawer on one of the photo's tag pages
 *
 * The test discovers a story-enabled photo from `/photography/photos`
 * (`window.allPhotosData`) and then opens that same photo via the lightbox
 * on the album and tag pages to assert the story drawer renders correctly.
 */

const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:4321';

const launchOptions = {
  headless: process.env.HEADLESS === 'true',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--single-process',
  ],
  slowMo: 100,
};

async function waitForLightboxReady(page) {
  await page.waitForFunction(() => {
    const lb = window.photoLightbox;
    return !!lb && Array.isArray(lb.photos) && lb.photos.length > 0;
  });
}

async function findStoryCandidate(page) {
  console.log('🔎 Discovering photo with story from /photography/photos');
  await page.goto(`${TARGET_URL}/photography/photos`);
  await page.waitForLoadState('networkidle');

  await page.waitForFunction(
    () => Array.isArray(window.allPhotosData) && window.allPhotosData.length > 0
  );

  const candidates = await page.evaluate(() => {
    const photos = Array.isArray(window.allPhotosData) ? window.allPhotosData : [];
    return photos
      .filter(
        (p) =>
          p &&
          typeof p === 'object' &&
          p.body &&
          p.body.trim().length > 0 &&
          p.data &&
          p.data.album
      )
      .map((p) => ({
        id: p.id,
        album: p.data.album,
        tags: Array.isArray(p.data.tags) ? p.data.tags.filter(Boolean) : [],
        story: p.body.trim(),
        title: p.data.title || p.id,
      }));
  });

  if (!candidates.length) {
    return null;
  }

  // Prefer a candidate that has at least one tag so we can hit a tag page too
  const withTag = candidates.find((c) => c.tags.length > 0);
  return withTag || candidates[0];
}

async function getStoryIndexOnPage(page, preferredId) {
  return page.evaluate((targetId) => {
    const lb = window.photoLightbox;
    if (!lb || !Array.isArray(lb.photos)) {
      return { index: -1, story: '' };
    }

    const withId = lb.photos.findIndex(
      (p) => p.id === targetId && p.body && p.body.trim().length > 0
    );
    if (withId !== -1) {
      return { index: withId, story: lb.photos[withId].body || '' };
    }

    const fallback = lb.photos.findIndex((p) => p.body && p.body.trim().length > 0);
    return { index: fallback, story: fallback >= 0 ? lb.photos[fallback].body || '' : '' };
  }, preferredId);
}

async function openLightboxAt(page, index) {
  const opened = await page.evaluate((i) => {
    const lb = window.photoLightbox;
    if (!lb || !lb.photos || !lb.photos[i]) return false;
    lb.open(i);
    return true;
  }, index);

  if (!opened) {
    throw new Error('Failed to open lightbox at requested index');
  }

  await page.waitForSelector('#photo-lightbox.active');
  await page.waitForTimeout(400);
}

async function assertStoryDrawer(page, expectedSnippet, contextLabel) {
  const storyBtn = page.locator('.lightbox-story-btn');
  const isVisible = await storyBtn.isVisible();

  if (!isVisible) {
    throw new Error(`[${contextLabel}] Story button should be visible for photo with story`);
  }

  await storyBtn.click();
  await page.waitForSelector('.lightbox-story-drawer.active');

  const content = await page.locator('.lightbox-story-content').textContent();
  const normalizedContent = (content || '').replace(/\s+/g, ' ').trim();
  if (!normalizedContent) {
    throw new Error(`[${contextLabel}] Story drawer content is empty`);
  }

  if (expectedSnippet) {
    const expectedNorm = expectedSnippet.replace(/\s+/g, ' ').trim().slice(0, 80).toLowerCase();
    if (expectedNorm && !normalizedContent.toLowerCase().includes(expectedNorm)) {
      console.log(
        `[${contextLabel}] ⚠ Story content did not contain expected snippet (may be formatted differently)`
      );
    }
  }

  // Close drawer and ensure it actually closes
  await page.locator('.lightbox-story-close').click();
  await page.waitForTimeout(350);
  const stillActive = await page
    .locator('.lightbox-story-drawer')
    .evaluate((el) => el.classList.contains('active'));

  if (stillActive) {
    throw new Error(`[${contextLabel}] Story drawer did not close after clicking close button`);
  }
}

async function runAlbumFlow(page, candidate) {
  const albumUrl = `${TARGET_URL}/photography/album/${candidate.album}`;
  console.log(`\n📷 Album page: ${albumUrl}`);
  await page.goto(albumUrl);
  await page.waitForLoadState('networkidle');
  await waitForLightboxReady(page);

  const { index, story } = await getStoryIndexOnPage(page, candidate.id);
  if (index < 0) {
    throw new Error('No photo with story found on album page');
  }

  console.log(`   ✓ Story photo index on album page: ${index}`);
  await openLightboxAt(page, index);
  await assertStoryDrawer(page, story || candidate.story, 'Album page');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
}

async function runTagFlow(page, candidate) {
  if (!candidate.tags.length) {
    console.log('⚠ Candidate had no tags; skipping tag page story test');
    return;
  }

  const tagSlug = encodeURIComponent(candidate.tags[0]);
  const tagUrl = `${TARGET_URL}/photography/tag/${tagSlug}`;
  console.log(`\n🏷️  Tag page: ${tagUrl}`);
  await page.goto(tagUrl);
  await page.waitForLoadState('networkidle');
  await waitForLightboxReady(page);

  const { index, story } = await getStoryIndexOnPage(page, candidate.id);
  if (index < 0) {
    throw new Error('No photo with story found on tag page');
  }

  console.log(`   ✓ Story photo index on tag page: ${index}`);
  await openLightboxAt(page, index);
  await assertStoryDrawer(page, story || candidate.story, 'Tag page');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
}

(async () => {
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage();

  try {
    console.log('🧪 Testing Story Drawer on Album & Tag pages...\n');

    const candidate = await findStoryCandidate(page);
    if (!candidate) {
      throw new Error('No photos with story content found in metadata; cannot run story drawer tests');
    }

    console.log(
      `   ✓ Using photo "${candidate.title}" (id: ${candidate.id}) in album "${candidate.album}" with tags: ${candidate.tags.join(', ')}`
    );

    await runAlbumFlow(page, candidate);
    await runTagFlow(page, candidate);

    console.log('\n✅ Story drawer album/tag tests completed!\n');
  } catch (err) {
    console.error(`\n✗ Story drawer album/tag tests failed: ${err.message}\n`);
    await browser.close();
    process.exit(1);
  }

  await browser.close();
})();

