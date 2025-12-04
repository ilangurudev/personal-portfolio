/**
 * Infinite Scroll / Lazy Loading Tests
 *
 * Tests the progressive loading of photos:
 * - Initial batch load (first 20 photos)
 * - Load more photos on scroll
 * - Photo count updates correctly
 * - Loading indicator appears during load
 * - Intersection observer triggers correctly
 * - Images use lazy loading attribute
 */

const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:4321';
const INITIAL_BATCH_SIZE = 20;
const LOAD_MORE_SIZE = 20;

(async () => {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
    slowMo: 50
  });
  const page = await browser.newPage();

  console.log('🧪 Testing Infinite Scroll / Lazy Loading...\n');

  // Test 1: Navigate to All Photos Page
  console.log('📍 Test 1: Navigate to All Photos Page');
  await page.goto(`${TARGET_URL}/photography/photos`);
  await page.waitForLoadState('networkidle');

  const pageTitle = await page.locator('.page-title').textContent();
  console.log(`   ✓ Page loaded: ${pageTitle}`);

  // Test 2: Check initial photo count
  console.log('\n📍 Test 2: Check Initial Photo Count');
  const totalCountEl = await page.locator('#total-count');
  const visibleCountEl = await page.locator('#visible-count');

  const totalCount = parseInt(await totalCountEl.textContent() || '0');
  const visibleCount = parseInt(await visibleCountEl.textContent() || '0');

  console.log(`   Total photos: ${totalCount}`);
  console.log(`   Initially visible: ${visibleCount}`);
  console.log(`   ✓ Initial batch size ≤ ${INITIAL_BATCH_SIZE}: ${visibleCount <= INITIAL_BATCH_SIZE ? '✓' : '✗'}`);

  // Test 3: Verify initial photos loaded
  console.log('\n📍 Test 3: Verify Initial Photos Loaded');
  const photoCards = await page.locator('#photos-grid .photo-card');
  const initialPhotoCount = await photoCards.count();
  console.log(`   Photo cards in DOM: ${initialPhotoCount}`);
  console.log(`   ✓ Photos rendered: ${initialPhotoCount > 0 ? '✓' : '✗'}`);

  // Test 4: Verify images have lazy loading attribute
  console.log('\n📍 Test 4: Verify Lazy Loading Attributes');
  const images = await page.locator('#photos-grid .photo-card img');
  const imageCount = await images.count();

  let lazyLoadCount = 0;
  for (let i = 0; i < Math.min(imageCount, 5); i++) {
    const loadingAttr = await images.nth(i).getAttribute('loading');
    if (loadingAttr === 'lazy') lazyLoadCount++;
  }

  console.log(`   Images with loading="lazy": ${lazyLoadCount}/${Math.min(imageCount, 5)}`);
  console.log(`   ✓ Lazy loading enabled: ${lazyLoadCount > 0 ? '✓' : '✗'}`);

  // Test 5: Check if more photos available to load
  console.log('\n📍 Test 5: Check for More Photos');
  const morePhotosAvailable = totalCount > visibleCount;
  console.log(`   More photos to load: ${morePhotosAvailable ? 'Yes' : 'No'}`);

  if (morePhotosAvailable) {
    // Test 6: Scroll to trigger infinite scroll
    console.log('\n📍 Test 6: Trigger Infinite Scroll');

    const initialCardCount = await photoCards.count();
    console.log(`   Cards before scroll: ${initialCardCount}`);

    // Scroll to bottom of the page
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // Wait for loading indicator and new photos
    await page.waitForTimeout(800);

    const cardCountAfterScroll = await page.locator('#photos-grid .photo-card').count();
    console.log(`   Cards after scroll: ${cardCountAfterScroll}`);

    const newPhotosLoaded = cardCountAfterScroll > initialCardCount;
    console.log(`   ✓ New photos loaded on scroll: ${newPhotosLoaded ? '✓' : '✗'}`);

    // Test 7: Verify visible count updated
    console.log('\n📍 Test 7: Verify Visible Count Updated');
    const newVisibleCount = parseInt(await visibleCountEl.textContent() || '0');
    console.log(`   New visible count: ${newVisibleCount}`);
    console.log(`   ✓ Count increased: ${newVisibleCount > visibleCount ? '✓' : '✗'}`);

    // Test 8: Continue scrolling until all photos loaded
    console.log('\n📍 Test 8: Load All Photos via Scrolling');
    let prevCount = cardCountAfterScroll;
    let scrollAttempts = 0;
    const maxScrollAttempts = Math.ceil(totalCount / LOAD_MORE_SIZE) + 2;

    while (scrollAttempts < maxScrollAttempts) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(500);

      const currentCount = await page.locator('#photos-grid .photo-card').count();

      if (currentCount === prevCount) {
        // No new photos loaded, we've reached the end
        break;
      }

      prevCount = currentCount;
      scrollAttempts++;

      if (scrollAttempts % 3 === 0) {
        console.log(`   Scroll attempt ${scrollAttempts}: ${currentCount} photos loaded`);
      }
    }

    const finalCardCount = await page.locator('#photos-grid .photo-card').count();
    const finalVisibleCount = parseInt(await visibleCountEl.textContent() || '0');

    console.log(`   Final card count: ${finalCardCount}`);
    console.log(`   Final visible count: ${finalVisibleCount}`);
    console.log(`   Total expected: ${totalCount}`);
    console.log(`   ✓ All photos loaded: ${finalCardCount === totalCount ? '✓' : '✗'}`);
  } else {
    console.log('   ⚠ All photos fit in initial batch, skipping infinite scroll test');
  }

  // Test 9: Test on Photography Landing Page (uses React InfinitePhotoGallery)
  console.log('\n📍 Test 9: Test Infinite Scroll on Landing Page');
  await page.goto(`${TARGET_URL}/photography`);
  await page.waitForLoadState('networkidle');

  const landingPhotoCards = await page.locator('.photo-card[data-photo-id]');
  const landingInitialCount = await landingPhotoCards.count();
  console.log(`   Initial photos on landing: ${landingInitialCount}`);

  // Check if there's a sentinel element (for React's InfinitePhotoGallery)
  const sentinel = await page.locator('[style*="Loading more photos"]');
  const hasSentinel = await sentinel.count() > 0;
  console.log(`   Has loading sentinel: ${hasSentinel ? '✓' : 'not visible (may be no more photos)'}`);

  // Scroll and check for more photos
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(800);

  const landingAfterScrollCount = await page.locator('.photo-card[data-photo-id]').count();
  console.log(`   Photos after scroll: ${landingAfterScrollCount}`);

  // Test 10: Verify photo card structure
  console.log('\n📍 Test 10: Verify Photo Card Structure');
  const sampleCard = await landingPhotoCards.first();

  const hasDataPhotoId = await sampleCard.getAttribute('data-photo-id');
  console.log(`   ✓ Has data-photo-id: ${hasDataPhotoId ? '✓' : '✗'}`);

  const hasImage = await sampleCard.locator('.photo-image img').count() > 0;
  console.log(`   ✓ Has image element: ${hasImage ? '✓' : '✗'}`);

  const hasViewfinder = await sampleCard.locator('.viewfinder-overlay').count() > 0;
  console.log(`   ✓ Has viewfinder overlay: ${hasViewfinder ? '✓' : '✗'}`);

  // Test 11: Verify image URLs use resized versions
  console.log('\n📍 Test 11: Verify Resized Image URLs');
  const firstImage = await sampleCard.locator('.photo-image img');
  const imgSrc = await firstImage.getAttribute('src');
  console.log(`   Image src: ${imgSrc?.substring(0, 80)}...`);

  // Check if it uses CDN resizing (in production) or local path (in dev)
  const usesResizing = imgSrc?.includes('cdn-cgi/image') || imgSrc?.includes('/photos/');
  console.log(`   ✓ Uses valid image path: ${usesResizing ? '✓' : '✗'}`);

  console.log('\n✅ Infinite scroll / lazy loading tests completed!\n');

  await browser.close();
})();
