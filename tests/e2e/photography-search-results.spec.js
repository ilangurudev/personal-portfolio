/**
 * Photography Search Results Tests
 *
 * Verifies album-first ordering, album pill rendering for photo results,
 * URL/query sync, and that clicking a photo result opens the lightbox.
 */

const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:4321';
const QUERY = 'georgetown';

(async () => {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS === 'true',
    slowMo: 40,
  });
  const page = await browser.newPage();

  try {
    console.log('🧪 Testing photography search results...\n');

    await page.goto(`${TARGET_URL}/photography/search`);
    await page.waitForLoadState('networkidle');

    const initialVisible = await page.locator('#photo-empty-initial').isVisible();
    if (!initialVisible) {
      throw new Error('Initial empty state not visible');
    }
    console.log('   ✓ Initial empty state visible');

    await page.fill('input[name="q"]', QUERY);
    await page.click('#photo-search-submit');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#photo-results .search-card', { timeout: 4000 });

    const urlHasQuery = page.url().includes(`q=${QUERY}`);
    if (!urlHasQuery) {
      throw new Error('URL query param not synced with search input');
    }
    console.log('   ✓ URL query param synced');

    const cards = page.locator('#photo-results .search-card');
    const totalCards = await cards.count();
    if (totalCards < 2) {
      throw new Error(`Expected album + photo results, found ${totalCards}`);
    }
    console.log(`   ✓ Results rendered (${totalCards})`);

    const firstCard = cards.first();
    const isAlbumCard = await firstCard.evaluate((el) => el.classList.contains('album-card'));
    const albumPill = await firstCard.locator('.kind-pill').innerText();
    if (!isAlbumCard || !albumPill.toLowerCase().includes('album')) {
      throw new Error('First result should be an album card with album pill');
    }
    console.log('   ✓ Album result appears first');

    const photoCard = page.locator('#photo-results .photo-card').first();
    if ((await photoCard.count()) === 0) {
      throw new Error('No photo results rendered');
    }
    const albumTagText = (await photoCard.locator('.album-pill').innerText()).trim().toLowerCase();
    if (!albumTagText.includes('georgetown')) {
      throw new Error('Photo result missing album pill for Georgetown');
    }
    console.log('   ✓ Photo results include album pill with album name');

    const lightboxBootstrap = await page.evaluate(() => {
      const lb = window.photoLightbox;
      const count = Array.isArray(lb?.photos) ? lb.photos.length : 0;
      return { exists: Boolean(lb), count };
    });
    if (!lightboxBootstrap.exists || lightboxBootstrap.count === 0) {
      throw new Error('Lightbox bootstrap missing search photos');
    }
    console.log(`   ✓ Lightbox bootstrapped with ${lightboxBootstrap.count} photos`);

    await photoCard.locator('a.media').click();
    await page.waitForFunction(() => {
      const el = document.getElementById('photo-lightbox');
      return !!el && el.style.display !== 'none' && el.classList.contains('active');
    }, null, { timeout: 2000 });
    console.log('   ✓ Clicking a photo result opens the lightbox');

    console.log('\n✅ Photography search results tests passed!\n');
    await browser.close();
  } catch (error) {
    console.error(`   ✗ ${error.message}`);
    await browser.close();
    process.exit(1);
  }
})();

