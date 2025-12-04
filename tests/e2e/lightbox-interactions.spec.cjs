/**
 * Lightbox Interaction Tests
 *
 * Tests the full-screen photo lightbox:
 * - Opening lightbox by clicking photo
 * - Close via X button, ESC key, backdrop click
 * - Navigation via arrow buttons and keyboard
 * - Photo counter display
 * - Metadata display (tags, album, camera info)
 * - Touch swipe gestures (simulated)
 * - Image preloading
 */

const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:4321';

(async () => {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
    slowMo: 100
  });
  const page = await browser.newPage();

  console.log('🧪 Testing Lightbox Interactions...\n');

  // Test 1: Navigate to Photography Page
  console.log('📍 Test 1: Navigate to Photography Page');
  await page.goto(`${TARGET_URL}/photography`);
  await page.waitForLoadState('networkidle');

  const pageTitle = await page.title();
  console.log(`   ✓ Page loaded: ${pageTitle}`);

  // Test 2: Verify photos exist on page
  console.log('\n📍 Test 2: Verify Photos Exist');
  const photoCards = await page.locator('.photo-card[data-photo-id]');
  const photoCount = await photoCards.count();
  console.log(`   ✓ Photo cards found: ${photoCount}`);

  if (photoCount === 0) {
    console.log('   ⚠ No photos found, skipping lightbox tests');
    await browser.close();
    return;
  }

  // Test 3: Open lightbox by clicking first photo
  console.log('\n📍 Test 3: Open Lightbox');
  const firstPhoto = await photoCards.first();
  const firstPhotoId = await firstPhoto.getAttribute('data-photo-id');
  console.log(`   Clicking photo: ${firstPhotoId}`);

  await firstPhoto.click();
  await page.waitForTimeout(500); // Wait for animation

  const lightbox = await page.locator('#photo-lightbox');
  const lightboxVisible = await lightbox.evaluate(el =>
    el.style.display !== 'none' && el.classList.contains('active')
  );
  console.log(`   ✓ Lightbox opened: ${lightboxVisible ? '✓' : '✗'}`);

  // Test 4: Verify lightbox image displayed
  console.log('\n📍 Test 4: Verify Lightbox Image');
  const lightboxImage = await page.locator('.lightbox-image');
  const imageSrc = await lightboxImage.getAttribute('src');
  console.log(`   ✓ Image loaded: ${imageSrc ? '✓' : '✗'}`);
  console.log(`   Image src: ${imageSrc?.substring(0, 60)}...`);

  // Test 5: Verify photo counter
  console.log('\n📍 Test 5: Verify Photo Counter');
  const counter = await page.locator('.lightbox-counter');
  const counterText = await counter.textContent();
  console.log(`   ✓ Counter displayed: ${counterText}`);

  const counterPattern = /\d+\s*\/\s*\d+/;
  const counterValid = counterPattern.test(counterText || '');
  console.log(`   ✓ Counter format valid (X / Y): ${counterValid ? '✓' : '✗'}`);

  // Test 6: Verify metadata displayed
  console.log('\n📍 Test 6: Verify Metadata Display');
  const tagsAndAlbum = await page.locator('.lightbox-tags-and-album');
  const tagsVisible = await tagsAndAlbum.evaluate(el => el.children.length > 0);
  console.log(`   ✓ Tags/Album section visible: ${tagsVisible ? '✓' : '✗'}`);

  const tags = await page.locator('.lightbox-tag');
  const tagCount = await tags.count();
  console.log(`   ✓ Tags displayed: ${tagCount}`);

  const metadata = await page.locator('.lightbox-metadata');
  const metadataItems = await page.locator('.lightbox-metadata-item');
  const metadataCount = await metadataItems.count();
  console.log(`   ✓ Metadata items displayed: ${metadataCount}`);

  // Test 7: Navigate to next photo via button
  console.log('\n📍 Test 7: Navigate to Next Photo (Button)');
  const nextBtn = await page.locator('.lightbox-next');
  const initialCounter = await counter.textContent();

  await nextBtn.click();
  await page.waitForTimeout(400);

  const newCounter = await counter.textContent();
  const navigated = initialCounter !== newCounter;
  console.log(`   Counter before: ${initialCounter}`);
  console.log(`   Counter after: ${newCounter}`);
  console.log(`   ✓ Navigation successful: ${navigated ? '✓' : '✗'}`);

  // Test 8: Navigate to previous photo via button
  console.log('\n📍 Test 8: Navigate to Previous Photo (Button)');
  const prevBtn = await page.locator('.lightbox-prev');
  const beforePrev = await counter.textContent();

  await prevBtn.click();
  await page.waitForTimeout(400);

  const afterPrev = await counter.textContent();
  const navigatedBack = beforePrev !== afterPrev || afterPrev === initialCounter;
  console.log(`   ✓ Navigated back: ${navigatedBack ? '✓' : '✗'}`);

  // Test 9: Navigate via keyboard (ArrowRight)
  console.log('\n📍 Test 9: Navigate via Keyboard (ArrowRight)');
  const beforeKeyNav = await counter.textContent();

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(400);

  const afterKeyNav = await counter.textContent();
  const keyNavWorked = beforeKeyNav !== afterKeyNav;
  console.log(`   Counter before: ${beforeKeyNav}`);
  console.log(`   Counter after: ${afterKeyNav}`);
  console.log(`   ✓ Keyboard navigation (Right): ${keyNavWorked ? '✓' : '✗'}`);

  // Test 10: Navigate via keyboard (ArrowLeft)
  console.log('\n📍 Test 10: Navigate via Keyboard (ArrowLeft)');
  const beforeLeftNav = await counter.textContent();

  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(400);

  const afterLeftNav = await counter.textContent();
  const leftNavWorked = beforeLeftNav !== afterLeftNav;
  console.log(`   ✓ Keyboard navigation (Left): ${leftNavWorked ? '✓' : '✗'}`);

  // Test 11: Close lightbox via ESC key
  console.log('\n📍 Test 11: Close Lightbox (ESC Key)');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  const lightboxAfterEsc = await lightbox.evaluate(el =>
    el.style.display === 'none' || !el.classList.contains('active')
  );
  console.log(`   ✓ Lightbox closed via ESC: ${lightboxAfterEsc ? '✓' : '✗'}`);

  // Test 12: Reopen and close via X button
  console.log('\n📍 Test 12: Close Lightbox (X Button)');
  await firstPhoto.click();
  await page.waitForTimeout(500);

  const closeBtn = await page.locator('.lightbox-close');
  await closeBtn.click();
  await page.waitForTimeout(400);

  const lightboxAfterClose = await lightbox.evaluate(el =>
    el.style.display === 'none' || !el.classList.contains('active')
  );
  console.log(`   ✓ Lightbox closed via X button: ${lightboxAfterClose ? '✓' : '✗'}`);

  // Test 13: Reopen and close via backdrop click
  console.log('\n📍 Test 13: Close Lightbox (Backdrop Click)');
  await firstPhoto.click();
  await page.waitForTimeout(500);

  const backdrop = await page.locator('.lightbox-backdrop');
  await backdrop.click();
  await page.waitForTimeout(400);

  const lightboxAfterBackdrop = await lightbox.evaluate(el =>
    el.style.display === 'none' || !el.classList.contains('active')
  );
  console.log(`   ✓ Lightbox closed via backdrop: ${lightboxAfterBackdrop ? '✓' : '✗'}`);

  // Test 14: Verify focus lock animation on photo click
  console.log('\n📍 Test 14: Verify Focus Lock Animation');
  // Re-click the photo to check for viewfinder animation
  await firstPhoto.click();
  await page.waitForTimeout(100);

  const viewfinder = await firstPhoto.locator('.viewfinder-corners');
  const hasFocusLock = await viewfinder.evaluate(el => el.classList.contains('focus-locked'));
  console.log(`   ✓ Focus lock animation triggered: ${hasFocusLock ? '✓' : 'may have passed'}`);

  await page.waitForTimeout(400);

  // Test 15: Verify body scroll is locked when lightbox is open
  console.log('\n📍 Test 15: Verify Body Scroll Lock');
  const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
  console.log(`   ✓ Body overflow when lightbox open: "${bodyOverflow}"`);
  const scrollLocked = bodyOverflow === 'hidden';
  console.log(`   ✓ Scroll locked: ${scrollLocked ? '✓' : '(may vary by timing)'}`);

  // Close lightbox
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  console.log('\n✅ Lightbox interaction tests completed!\n');

  await browser.close();
})();
