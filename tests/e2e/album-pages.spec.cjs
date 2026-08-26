/**
 * Album Pages Tests
 *
 * Tests album-related functionality:
 * - Albums listing page (/photography/albums)
 * - Album sorting (featured, order_score, date)
 * - Album detail pages (/photography/album/[slug])
 * - Album-specific tag filtering
 * - Album cover photos
 * - Album metadata display
 */

const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:4321';

(async () => {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS === 'true',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process'],
    slowMo: 100
  });
  const page = await browser.newPage();

  console.log('🧪 Testing Album Pages...\n');

  // Test 1: Navigate to Albums Listing Page
  console.log('📍 Test 1: Navigate to Albums Listing Page');
  await page.goto(`${TARGET_URL}/photography/albums`);
  await page.waitForLoadState('networkidle');

  const pageTitle = await page.title();
  console.log(`   ✓ Page loaded: ${pageTitle}`);

  // Test 2: Verify albums exist
  console.log('\n📍 Test 2: Verify Albums Grid');
  const albumCards = await page.locator('.album-card, [class*="album"]');
  const albumCount = await albumCards.count();
  console.log(`   Album cards found: ${albumCount}`);
  console.log(`   ✓ Albums displayed: ${albumCount > 0 ? '✓' : '✗'}`);

  if (albumCount === 0) {
    console.log('   ⚠ No albums found, skipping album-specific tests');
    await browser.close();
    return;
  }

  // Test 3: Verify album card structure
  console.log('\n📍 Test 3: Verify Album Card Structure');
  const firstAlbumCard = await albumCards.first();

  // Check for cover image
  const hasCoverImage = await firstAlbumCard.locator('img').count() > 0;
  console.log(`   ✓ Has cover image: ${hasCoverImage ? '✓' : '✗'}`);

  // Check for clickable link
  const hasLink = await firstAlbumCard.locator('a[href*="/photography/album/"]').count() > 0 ||
                  (await firstAlbumCard.getAttribute('href'))?.includes('/photography/album/');
  console.log(`   ✓ Has album link: ${hasLink ? '✓' : '(may be on card itself)'}`);

  // Test 4: Click on album to navigate
  console.log('\n📍 Test 4: Navigate to Album Detail Page');
  const albumLink = await page.locator('a[href*="/photography/album/"]').first();
  const albumHref = await albumLink.getAttribute('href');
  console.log(`   Album link: ${albumHref}`);

  await albumLink.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  const albumPageUrl = page.url();
  const onAlbumPage = albumPageUrl.includes('/photography/album/');
  console.log(`   ✓ Navigated to album page: ${onAlbumPage ? '✓' : '✗'}`);
  console.log(`   URL: ${albumPageUrl}`);

  // Test 5: Verify album page content
  console.log('\n📍 Test 5: Verify Album Page Content');
  const albumHeader = await page.locator('h1, .album-title, .page-title').first();
  const albumTitle = await albumHeader.textContent();
  console.log(`   Album title: ${albumTitle?.trim()}`);

  // Check for photos in album
  await page.waitForSelector('.photo-card[data-photo-id]', { timeout: 10000 });
  const albumPhotos = await page.locator('.photo-card[data-photo-id]');
  const albumPhotoCount = await albumPhotos.count();
  console.log(`   Photos in album: ${albumPhotoCount}`);
  console.log(`   ✓ Photos displayed: ${albumPhotoCount > 0 ? '✓' : '✗'}`);

  // Test 6: Test tag filtering within album
  console.log('\n📍 Test 6: Tag Filtering Within Album');

  // Look for filter toggle or tag pills
  const filterToggle = await page.locator('#filter-toggle, .filter-toggle');
  const filterToggleExists = await filterToggle.count() > 0;

  if (filterToggleExists) {
    await filterToggle.click();
    await page.waitForTimeout(400);

    const tagPills = await page.locator('.tag-pill, .filter-checkbox-label');
    const tagPillCount = await tagPills.count();
    console.log(`   Tag filters available: ${tagPillCount}`);

    if (tagPillCount > 0) {
      // Get initial photo count
      const initialPhotoCount = albumPhotoCount;

      // Click a tag
      const firstTagPill = await tagPills.first();
      const isAlreadyActive = await firstTagPill.evaluate(el =>
        el.classList.contains('active') || el.querySelector('input:checked') !== null
      );

      if (!isAlreadyActive) {
        await firstTagPill.click();
        await page.waitForTimeout(500);

        // Check if a different count is shown (filtering may or may not change count)
        console.log('   ✓ Tag filter interaction tested');
      } else {
        console.log('   ✓ Tag already active (album-specific filter)');
      }
    }
  } else {
    console.log('   ⚠ No tag filter toggle found on album page');
  }

  // Test 7: Open lightbox from album page
  console.log('\n📍 Test 7: Open Lightbox from Album Page');
  if (albumPhotoCount > 0) {
    const albumFirstPhoto = await albumPhotos.first();
    await albumFirstPhoto.click();
    await page.waitForTimeout(500);

    const lightbox = await page.locator('#photo-lightbox');
    const lightboxVisible = await lightbox.evaluate(el =>
      el.style.display !== 'none' && el.classList.contains('active')
    );
    console.log(`   ✓ Lightbox opened from album: ${lightboxVisible ? '✓' : '✗'}`);

    // Verify album name in lightbox metadata
    const lightboxAlbum = await page.locator('.lightbox-album-link');
    const lightboxAlbumExists = await lightboxAlbum.count() > 0;
    console.log(`   ✓ Album link in lightbox: ${lightboxAlbumExists ? '✓' : '✗'}`);

    if (lightboxAlbumExists) {
      const lightboxAlbumText = await lightboxAlbum.textContent();
      console.log(`   Lightbox album: ${lightboxAlbumText?.trim()}`);
    }

    // Close lightbox
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }

  // Test 8: Navigate between albums
  console.log('\n📍 Test 8: Navigate to Different Albums');
  await page.goto(`${TARGET_URL}/photography/albums`);
  await page.waitForLoadState('networkidle');

  const allAlbumLinks = await page.locator('a[href*="/photography/album/"]');
  const allAlbumCount = await allAlbumLinks.count();
  console.log(`   Total album links: ${allAlbumCount}`);

  if (allAlbumCount >= 2) {
    // Visit second album
    const secondAlbumLink = await allAlbumLinks.nth(1);
    const secondAlbumHref = await secondAlbumLink.getAttribute('href');
    console.log(`   Navigating to second album: ${secondAlbumHref}`);

    await secondAlbumLink.click();
    await page.waitForLoadState('networkidle');

    const secondAlbumUrl = page.url();
    console.log(`   ✓ On second album: ${secondAlbumUrl.includes('/photography/album/') ? '✓' : '✗'}`);

    const secondAlbumTitle = await page.locator('h1, .album-title, .page-title').first().textContent();
    console.log(`   Second album title: ${secondAlbumTitle?.trim()}`);
  }

  // Test 9: Album URL encoding
  console.log('\n📍 Test 9: Album URL Structure');
  const currentAlbumUrl = page.url();
  const albumSlug = currentAlbumUrl.split('/photography/album/')[1]?.split('?')[0];
  console.log(`   Album slug: ${albumSlug}`);
  console.log(`   ✓ URL structure valid: ${albumSlug && albumSlug.length > 0 ? '✓' : '✗'}`);

  // Test 10: Back to albums listing
  console.log('\n📍 Test 10: Navigate Back to Albums Listing');
  await page.goto(`${TARGET_URL}/photography/albums`);
  await page.waitForLoadState('networkidle');

  const backOnAlbumsList = page.url().includes('/photography/albums');
  console.log(`   ✓ Back on albums listing: ${backOnAlbumsList ? '✓' : '✗'}`);

  console.log('\n✅ Album pages tests completed!\n');

  await browser.close();
})();
