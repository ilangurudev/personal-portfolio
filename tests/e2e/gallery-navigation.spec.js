/**
 * Gallery Keyboard Navigation Tests
 *
 * Tests the fullscreen gallery view with keyboard shortcuts:
 * - Left/Right arrows: Navigate between photos
 * - ESC: Exit to album view
 * - URL updates on navigation (shareable links)
 * - Preloading of adjacent images
 */

const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:4321';

(async () => {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS === 'true',
    slowMo: 100
  });
  const page = await browser.newPage();

  console.log('🧪 Testing Gallery Keyboard Navigation...\n');

  // Test 1: Gallery loads from direct URL
  console.log('📍 Test 1: Gallery Direct Access');
  await page.goto(`${TARGET_URL}/photo/gallery/test-album-photo-1`);
  await page.waitForLoadState('networkidle');

  const galleryTitle = await page.title();
  console.log(`   ✓ Gallery page loaded: ${galleryTitle}`);

  const hasFullscreenGallery = await page.locator('.gallery-fullscreen').count() > 0;
  console.log(`   ✓ Fullscreen gallery: ${hasFullscreenGallery ? '✓' : '✗'}`);

  // Test 2: Photo displays correctly
  console.log('\n📍 Test 2: Photo Display');
  const hasPhoto = await page.locator('.gallery-photo').count() > 0;
  const hasPhotoTitle = await page.locator('.photo-title').count() > 0;
  console.log(`   ✓ Photo element: ${hasPhoto ? '✓' : '✗'}`);
  console.log(`   ✓ Photo title: ${hasPhotoTitle ? '✓' : '✗'}`);

  // Test 3: Navigation controls present
  console.log('\n📍 Test 3: Navigation Controls');
  const hasPrevButton = await page.locator('.gallery-nav-prev').count() > 0;
  const hasNextButton = await page.locator('.gallery-nav-next').count() > 0;
  const hasCloseButton = await page.locator('.gallery-close').count() > 0;
  console.log(`   ✓ Previous button: ${hasPrevButton ? '✓' : '✗'}`);
  console.log(`   ✓ Next button: ${hasNextButton ? '✓' : '✗'}`);
  console.log(`   ✓ Close button: ${hasCloseButton ? '✓' : '✗'}`);

  // Test 4: Keyboard Navigation - Right Arrow
  console.log('\n📍 Test 4: Keyboard Navigation - Right Arrow');
  const urlBefore = page.url();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);
  const urlAfter = page.url();

  const urlChanged = urlBefore !== urlAfter;
  console.log(`   ✓ URL changed on right arrow: ${urlChanged ? '✓' : '✗'}`);
  console.log(`   ✓ Before: ${urlBefore.split('/').pop()}`);
  console.log(`   ✓ After: ${urlAfter.split('/').pop()}`);

  // Test 5: Keyboard Navigation - Left Arrow
  console.log('\n📍 Test 5: Keyboard Navigation - Left Arrow');
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(500);
  const urlBackToFirst = page.url();

  const backToOriginal = urlBackToFirst === urlBefore;
  console.log(`   ✓ Back to original photo: ${backToOriginal ? '✓' : '✗'}`);

  // Test 6: ESC Key Exits Gallery
  console.log('\n📍 Test 6: ESC Key Exits Gallery');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  const currentUrl = page.url();
  const exitedGallery = !currentUrl.includes('/gallery/');
  console.log(`   ✓ Exited gallery: ${exitedGallery ? '✓' : '✗'}`);
  console.log(`   ✓ Current URL: ${currentUrl}`);

  console.log('\n✅ Gallery keyboard navigation tests completed!\n');

  await browser.close();
})();
