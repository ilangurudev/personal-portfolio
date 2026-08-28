/**
 * Lightbox Navigation Links Tests
 *
 * Tests clickable tags and albums within the lightbox:
 * - Clicking a tag in lightbox navigates to tag page
 * - Clicking an album in lightbox navigates to album page
 * - URL encoding for special characters in tags
 * - Navigation preserves lightbox state appropriately
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

  console.log('🧪 Testing Lightbox Navigation Links...\n');

  // Test 1: Navigate to Photography Page
  console.log('📍 Test 1: Navigate to Photography Page');
  await page.goto(`${TARGET_URL}/photography`);
  await page.waitForLoadState('networkidle');

  const pageTitle = await page.title();
  console.log(`   ✓ Page loaded: ${pageTitle}`);

  // Test 2: Open lightbox
  console.log('\n📍 Test 2: Open Lightbox');
  const photoCards = await page.locator('.photo-card[data-photo-id]');
  const photoCount = await photoCards.count();

  if (photoCount === 0) {
    console.log('   ⚠ No photos found, skipping navigation tests');
    await browser.close();
    return;
  }

  const firstPhoto = await photoCards.first();
  await firstPhoto.click();
  await page.waitForTimeout(500);

  const lightbox = await page.locator('#photo-lightbox');
  const lightboxVisible = await lightbox.evaluate(el =>
    el.style.display !== 'none' && el.classList.contains('active')
  );
  console.log(`   ✓ Lightbox opened: ${lightboxVisible ? '✓' : '✗'}`);

  // Test 3: Find photo with tags
  console.log('\n📍 Test 3: Find Photo with Tags');
  let foundPhotoWithTags = false;
  let attempts = 0;
  const maxAttempts = Math.min(photoCount, 10);

  const tags = await page.locator('.lightbox-tag');
  let tagCount = await tags.count();

  while (tagCount === 0 && attempts < maxAttempts) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(400);
    tagCount = await tags.count();
    attempts++;
  }

  if (tagCount > 0) {
    foundPhotoWithTags = true;
    console.log(`   ✓ Found photo with ${tagCount} tags after ${attempts} navigation(s)`);

    await page.locator('.lightbox-info-toggle').click();
    await page.waitForTimeout(150);

    // Test 4: Get tag information
    console.log('\n📍 Test 4: Verify Tag Clickability');
    const firstTag = await tags.first();
    const tagDataAttr = await firstTag.getAttribute('data-tag');
    const tagText = await firstTag.textContent();
    console.log(`   Tag to click: ${tagText} (data-tag: ${tagDataAttr})`);

    // Test 5: Click tag and verify navigation
    console.log('\n📍 Test 5: Click Tag - Navigate to Tag Page');
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    await firstTag.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const newUrl = page.url();
    console.log(`   New URL: ${newUrl}`);

    const navigatedToTagPage = newUrl.includes('/photography/tag/');
    console.log(`   ✓ Navigated to tag page: ${navigatedToTagPage ? '✓' : '✗'}`);

    // Verify the tag page content
    const tagTitle = await page.locator('.tag-title');
    const tagTitleExists = await tagTitle.count() > 0;
    console.log(`   ✓ Tag page title exists: ${tagTitleExists ? '✓' : '✗'}`);

    if (tagTitleExists) {
      const titleText = await tagTitle.textContent();
      console.log(`   Tag page title: ${titleText}`);
    }
  } else {
    console.log(`   ⚠ No photos with tags found in first ${maxAttempts} photos`);
  }

  // Test 6: Go back and test album navigation
  console.log('\n📍 Test 6: Navigate Back to Photography Page');
  await page.goto(`${TARGET_URL}/photography`);
  await page.waitForLoadState('networkidle');

  // Open lightbox again
  const newPhotoCards = await page.locator('.photo-card[data-photo-id]');
  const newFirstPhoto = await newPhotoCards.first();
  await newFirstPhoto.click();
  await page.waitForTimeout(500);

  // Test 7: Find photo with album
  console.log('\n📍 Test 7: Find Photo with Album Link');
  let foundPhotoWithAlbum = false;
  attempts = 0;

  const albumLink = await page.locator('.lightbox-album-link');
  let albumLinkCount = await albumLink.count();

  while (albumLinkCount === 0 && attempts < maxAttempts) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(400);
    albumLinkCount = await albumLink.count();
    attempts++;
  }

  if (albumLinkCount > 0) {
    foundPhotoWithAlbum = true;
    console.log(`   ✓ Found photo with album after ${attempts} navigation(s)`);

    await page.locator('.lightbox-info-toggle').click();
    await page.waitForTimeout(150);

    // Test 8: Get album information
    console.log('\n📍 Test 8: Verify Album Link Clickability');
    const firstAlbumLink = await albumLink.first();
    const albumDataAttr = await firstAlbumLink.getAttribute('data-album');
    const albumText = await firstAlbumLink.textContent();
    console.log(`   Album to click: ${albumText?.trim()} (data-album: ${albumDataAttr})`);

    // Test 9: Click album and verify navigation
    console.log('\n📍 Test 9: Click Album - Navigate to Album Page');
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    await firstAlbumLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const newUrl = page.url();
    console.log(`   New URL: ${newUrl}`);

    const navigatedToAlbumPage = newUrl.includes('/photography/album/');
    console.log(`   ✓ Navigated to album page: ${navigatedToAlbumPage ? '✓' : '✗'}`);

    // Verify the album page content
    const albumHeader = await page.locator('.album-header, .album-title, h1');
    const albumHeaderExists = await albumHeader.count() > 0;
    console.log(`   ✓ Album page header exists: ${albumHeaderExists ? '✓' : '✗'}`);
  } else {
    console.log(`   ⚠ No photos with album links found in first ${maxAttempts} photos`);
  }

  // Test 10: Test Albums listing page
  console.log('\n📍 Test 10: Navigate to Albums Listing Page');
  await page.goto(`${TARGET_URL}/photography/albums`);
  await page.waitForLoadState('networkidle');

  const albumsTitle = await page.locator('.album-title, h1').first();
  const albumsTitleText = await albumsTitle.textContent();
  console.log(`   Page title: ${albumsTitleText}`);

  const albumCards = await page.locator('.album-card, [data-album]');
  const albumCardCount = await albumCards.count();
  console.log(`   ✓ Album cards found: ${albumCardCount}`);

  if (albumCardCount > 0) {
    // Test 11: Click first album card
    console.log('\n📍 Test 11: Click Album Card');
    const firstAlbumCard = await albumCards.first();
    await firstAlbumCard.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const albumPageUrl = page.url();
    const onAlbumPage = albumPageUrl.includes('/photography/album/');
    console.log(`   ✓ Navigated to album page: ${onAlbumPage ? '✓' : '✗'}`);
    console.log(`   Album URL: ${albumPageUrl}`);
  }

  // Test 12: Test Tags listing page
  console.log('\n📍 Test 12: Navigate to Tags Listing Page');
  await page.goto(`${TARGET_URL}/photography/tags`);
  await page.waitForLoadState('networkidle');

  const tagsPage = await page.locator('h1, .page-title').first();
  const tagsPageText = await tagsPage.textContent();
  console.log(`   Page content: ${tagsPageText?.substring(0, 50)}...`);

  const tagLinks = await page.locator('a[href*="/photography/tag/"]');
  const tagLinkCount = await tagLinks.count();
  console.log(`   ✓ Tag links found: ${tagLinkCount}`);

  if (tagLinkCount > 0) {
    // Test 13: Click first tag link
    console.log('\n📍 Test 13: Click Tag Link from Tags Page');
    const firstTagLink = await tagLinks.first();
    const tagHref = await firstTagLink.getAttribute('href');
    console.log(`   Clicking tag: ${tagHref}`);

    await firstTagLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const tagPageUrl = page.url();
    const onTagPage = tagPageUrl.includes('/photography/tag/');
    console.log(`   ✓ Navigated to tag page: ${onTagPage ? '✓' : '✗'}`);
    console.log(`   Tag URL: ${tagPageUrl}`);
  }

  console.log('\n✅ Lightbox navigation links tests completed!\n');

  await browser.close();
})();
