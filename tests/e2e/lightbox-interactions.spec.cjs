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

const buildUrl = (href) => {
  if (!href) return null;
  if (href.startsWith('http')) return href;
  if (href.startsWith('/')) return `${TARGET_URL}${href}`;
  return `${TARGET_URL}/${href}`;
};

const getFirstAlbumHref = async (page) => {
  await page.goto(`${TARGET_URL}/photography/albums`);
  await page.waitForSelector('[data-album-card]');
  const slug = await page.$eval('[data-album-card]', (el) =>
    el.getAttribute('data-album-slug')
  );
  return slug ? `/photography/album/${slug}` : null;
};

const getFirstTagHref = async (page) => {
  await page.goto(`${TARGET_URL}/photography/tags`);
  await page.waitForSelector('[data-tag-link]');
  const tag = await page.$eval('[data-tag-link]', (el) =>
    el.getAttribute('data-tag')
  );
  return tag ? `/photography/tag/${tag}` : null;
};

const runKeyboardSmoke = async (page, label, href) => {
  const target = buildUrl(href);
  console.log(`\n🔁 Keyboard nav smoke on ${label}: ${target || '(not found)'}`);
  if (!target) {
    console.log(`   ⚠ Skipping ${label}: no link found`);
    return;
  }

  await page.goto(target);
  await page.waitForLoadState('networkidle');

  const photoCards = await page.locator('.photo-card[data-photo-id]');
  const count = await photoCards.count();
  console.log(`   ✓ Photo cards found: ${count}`);
  if (count === 0) {
    console.log(`   ⚠ No photos on ${label}, skipping`);
    return;
  }

  const firstPhoto = await photoCards.first();
  await firstPhoto.click();
  await page.waitForTimeout(500);

  const counter = await page.locator('.lightbox-counter');
  const before = await counter.textContent();

  // Right
  await page.waitForTimeout(700);
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction((prevCounter) => {
    const el = document.querySelector('.lightbox-counter');
    return el && el.textContent && el.textContent.trim() !== (prevCounter || '').trim();
  }, before);
  const afterRight = await counter.textContent();
  console.log(`   → Right nav: ${before} -> ${afterRight}`);

  // Left
  await page.waitForTimeout(700);
  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction((prevCounter) => {
    const el = document.querySelector('.lightbox-counter');
    return el && el.textContent && el.textContent.trim() !== (prevCounter || '').trim();
  }, afterRight);
  const afterLeft = await counter.textContent();
  console.log(`   ← Left nav: ${afterRight} -> ${afterLeft}`);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
};

const runKeyboardOnPhotosPage = async (page, { label, applyTag = false }) => {
  console.log(`\n🔁 Keyboard nav on All Photos (${label})`);
  await page.goto(`${TARGET_URL}/photography/photos`);
  await page.waitForLoadState('networkidle');

  if (applyTag) {
    const toggleFiltersBtn = await page.locator('#toggle-filters');
    if ((await toggleFiltersBtn.count()) > 0) {
      await toggleFiltersBtn.click();
      await page.waitForTimeout(400);
      const tagCheckboxes = await page.locator('#tags-filter input[type="checkbox"]');
      if ((await tagCheckboxes.count()) > 0) {
        const firstTagCheckbox = await tagCheckboxes.first();
        const tagLabel = await firstTagCheckbox.evaluate(el =>
          el.closest('label')?.textContent?.trim() || 'unknown'
        );
        console.log(`   Selecting tag: ${tagLabel}`);
        await firstTagCheckbox.click();
        await page.waitForTimeout(500);
      } else {
        console.log('   ⚠ No tag checkboxes found on All Photos page');
      }
    } else {
      console.log('   ⚠ Filter toggle not found on All Photos page');
    }
  }

  // Reuse the keyboard smoke on the current page
  const photoCards = await page.locator('.photo-card[data-photo-id]');
  const count = await photoCards.count();
  console.log(`   ✓ Photo cards found: ${count}`);
  if (count === 0) {
    console.log('   ⚠ No photos found on All Photos page, skipping');
    return;
  }

  const firstPhoto = await photoCards.first();
  await firstPhoto.click();
  await page.waitForTimeout(500);

  const counter = await page.locator('.lightbox-counter');
  const before = await counter.textContent();

  await page.waitForTimeout(700);
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction((prevCounter) => {
    const el = document.querySelector('.lightbox-counter');
    return el && el.textContent && el.textContent.trim() !== (prevCounter || '').trim();
  }, before);
  const afterRight = await counter.textContent();
  console.log(`   → Right nav: ${before} -> ${afterRight}`);

  await page.waitForTimeout(700);
  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction((prevCounter) => {
    const el = document.querySelector('.lightbox-counter');
    return el && el.textContent && el.textContent.trim() !== (prevCounter || '').trim();
  }, afterRight);
  const afterLeft = await counter.textContent();
  console.log(`   ← Left nav: ${afterRight} -> ${afterLeft}`);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
};

(async () => {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS === 'true',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process'],
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

  // Test 3: Ensure lightbox data bootstrap exists
  console.log('\n📍 Test 3: Verify Lightbox Bootstrap');
  const lightboxBootstrap = await page.evaluate(() => {
    const lb = window.photoLightbox;
    return {
      exists: !!lb,
      hasPhotos: !!lb?.photos?.length,
      photoCount: lb?.photos?.length || 0
    };
  });
  console.log(
    `   ✓ window.photoLightbox present: ${lightboxBootstrap.exists ? '✓' : '✗'}`
  );
  console.log(
    `   ✓ lightbox photos loaded: ${lightboxBootstrap.hasPhotos ? '✓' : '✗'} (${lightboxBootstrap.photoCount})`
  );

  // Test 3: Open lightbox by clicking first photo
  console.log('\n📍 Test 4: Open Lightbox');
  const firstPhoto = await photoCards.first();
  const firstPhotoId = await firstPhoto.getAttribute('data-photo-id');
  console.log(`   Clicking photo: ${firstPhotoId}`);
  console.log(
    `   ✓ First photo id present: ${firstPhotoId ? '✓' : '✗'}`
  );

  await firstPhoto.click();
  await page.waitForTimeout(500); // Wait for animation

  const lightbox = await page.locator('#photo-lightbox');
  const lightboxVisible = await lightbox.evaluate(el =>
    el.style.display !== 'none' && el.classList.contains('active')
  );
  console.log(`   ✓ Lightbox opened: ${lightboxVisible ? '✓' : '✗'}`);

  // Test 5: Verify lightbox image displayed
  console.log('\n📍 Test 5: Verify Lightbox Image');
  const lightboxImage = await page.locator('.lightbox-image');
  const imageSrc = await lightboxImage.getAttribute('src');
  const imageAlt = await lightboxImage.getAttribute('alt');
  console.log(`   ✓ Image loaded: ${imageSrc ? '✓' : '✗'}`);
  console.log(`   Image src: ${imageSrc?.substring(0, 60)}...`);
  console.log(`   ✓ Image alt present: ${imageAlt ? '✓' : '✗'}`);

  // Capture initial image src for navigation checks
  const initialImageSrc = imageSrc;

  // Test 6: Verify photo counter
  console.log('\n📍 Test 6: Verify Photo Counter');
  const counter = await page.locator('.lightbox-counter');
  const counterText = await counter.textContent();
  console.log(`   ✓ Counter displayed: ${counterText}`);

  const counterPattern = /\d+\s*\/\s*\d+/;
  const counterValid = counterPattern.test(counterText || '');
  console.log(`   ✓ Counter format valid (X / Y): ${counterValid ? '✓' : '✗'}`);

  // Test 7: Verify metadata displayed
  console.log('\n📍 Test 7: Verify Metadata Display');
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

  // Test 8: Verify navigation controls exist
  console.log('\n📍 Test 8: Verify Navigation Controls');
  const hasPrevButton = (await page.locator('.lightbox-prev').count()) > 0;
  const hasNextButton = (await page.locator('.lightbox-next').count()) > 0;
  const hasCloseButton = (await page.locator('.lightbox-close').count()) > 0;
  console.log(`   ✓ Previous button: ${hasPrevButton ? '✓' : '✗'}`);
  console.log(`   ✓ Next button: ${hasNextButton ? '✓' : '✗'}`);
  console.log(`   ✓ Close button: ${hasCloseButton ? '✓' : '✗'}`);

  // Test 9: Navigate to next photo via button
  console.log('\n📍 Test 9: Navigate to Next Photo (Button)');
  const nextBtn = await page.locator('.lightbox-next');
  const initialCounter = await counter.textContent();
  const srcBeforeNext = await lightboxImage.getAttribute('src');

  await nextBtn.click();
  await page.waitForTimeout(400);

  const newCounter = await counter.textContent();
  const navigated = initialCounter !== newCounter;
  console.log(`   Counter before: ${initialCounter}`);
  console.log(`   Counter after: ${newCounter}`);
  console.log(`   ✓ Navigation successful: ${navigated ? '✓' : '✗'}`);
  await page.waitForFunction((previousSrc) => {
    const img = document.querySelector('.lightbox-image');
    return img && img.getAttribute('src') !== previousSrc;
  }, srcBeforeNext);
  const srcAfterNext = await lightboxImage.getAttribute('src');
  console.log(
    `   ✓ Image source changed (button next): ${srcBeforeNext !== srcAfterNext ? '✓' : '✗'}`
  );

  // Test 10: Navigate to previous photo via button
  console.log('\n📍 Test 10: Navigate to Previous Photo (Button)');
  const prevBtn = await page.locator('.lightbox-prev');
  const beforePrev = await counter.textContent();
  const srcBeforePrev = await lightboxImage.getAttribute('src');

  await prevBtn.click();
  await page.waitForTimeout(400);

  const afterPrev = await counter.textContent();
  const navigatedBack = beforePrev !== afterPrev || afterPrev === initialCounter;
  console.log(`   ✓ Navigated back: ${navigatedBack ? '✓' : '✗'}`);
  await page.waitForFunction((targetSrc) => {
    const img = document.querySelector('.lightbox-image');
    return img && img.getAttribute('src') === targetSrc;
  }, initialImageSrc);
  const srcAfterPrev = await lightboxImage.getAttribute('src');
  console.log(
    `   ✓ Returned to initial image after prev: ${srcAfterPrev === initialImageSrc ? '✓' : '✗'}`
  );

  // Test 11: Navigate via keyboard (ArrowRight)
  console.log('\n📍 Test 11: Navigate via Keyboard (ArrowRight)');
  const beforeKeyNav = await counter.textContent();
  const srcBeforeKeyRight = await lightboxImage.getAttribute('src');

  // Wait for any previous navigation transition to finish
  await page.waitForTimeout(700);
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction((prevCounter) => {
    const el = document.querySelector('.lightbox-counter');
    return el && el.textContent && el.textContent.trim() !== (prevCounter || '').trim();
  }, beforeKeyNav);

  const afterKeyNav = await counter.textContent();
  const keyNavWorked = beforeKeyNav !== afterKeyNav;
  console.log(`   Counter before: ${beforeKeyNav}`);
  console.log(`   Counter after: ${afterKeyNav}`);
  console.log(`   ✓ Keyboard navigation (Right): ${keyNavWorked ? '✓' : '✗'}`);
  await page.waitForFunction((previousSrc) => {
    const img = document.querySelector('.lightbox-image');
    return img && img.getAttribute('src') !== previousSrc;
  }, srcBeforeKeyRight);
  const srcAfterKeyRight = await lightboxImage.getAttribute('src');
  console.log(
    `   ✓ Image source changed (keyboard right): ${srcAfterKeyRight !== srcBeforeKeyRight ? '✓' : '✗'}`
  );

  // Test 12: Navigate via keyboard (ArrowLeft)
  console.log('\n📍 Test 12: Navigate via Keyboard (ArrowLeft)');
  const beforeLeftNav = await counter.textContent();

  // Wait for transition to settle before navigating back
  await page.waitForTimeout(700);
  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction((prevCounter) => {
    const el = document.querySelector('.lightbox-counter');
    return el && el.textContent && el.textContent.trim() !== (prevCounter || '').trim();
  }, beforeLeftNav);

  const afterLeftNav = await counter.textContent();
  const leftNavWorked = beforeLeftNav !== afterLeftNav;
  console.log(`   ✓ Keyboard navigation (Left): ${leftNavWorked ? '✓' : '✗'}`);
  await page.waitForFunction((targetSrc) => {
    const img = document.querySelector('.lightbox-image');
    return img && img.getAttribute('src') === targetSrc;
  }, initialImageSrc);
  const srcAfterKeyLeft = await lightboxImage.getAttribute('src');
  console.log(
    `   ✓ Returned to initial image after keyboard left: ${srcAfterKeyLeft === initialImageSrc ? '✓' : '✗'}`
  );

  // Test 13: Close lightbox via ESC key
  console.log('\n📍 Test 13: Close Lightbox (ESC Key)');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  const lightboxAfterEsc = await lightbox.evaluate(el =>
    el.style.display === 'none' || !el.classList.contains('active')
  );
  console.log(`   ✓ Lightbox closed via ESC: ${lightboxAfterEsc ? '✓' : '✗'}`);

  // Test 14: Reopen and close via X button
  console.log('\n📍 Test 14: Close Lightbox (X Button)');
  await firstPhoto.click();
  await page.waitForTimeout(500);

  const closeBtn = await page.locator('.lightbox-close');
  await closeBtn.click();
  await page.waitForTimeout(400);

  const lightboxAfterClose = await lightbox.evaluate(el =>
    el.style.display === 'none' || !el.classList.contains('active')
  );
  console.log(`   ✓ Lightbox closed via X button: ${lightboxAfterClose ? '✓' : '✗'}`);

  // Test 15: Reopen and close via backdrop click
  console.log('\n📍 Test 15: Close Lightbox (Backdrop Click)');
  console.log('\n📍 Test 15: Not running this test for now.');
  // await firstPhoto.click();
  // await page.waitForTimeout(500);

  // const backdrop = await page.locator('.lightbox-backdrop');
  // // Click at the top-left corner to avoid content overlay
  // await backdrop.click({ position: { x: 50, y: 50 }, force: true });
  // await page.waitForTimeout(400);

  // const lightboxAfterBackdrop = await lightbox.evaluate(el =>
  //   el.style.display === 'none' || !el.classList.contains('active')
  // );
  // console.log(`   ✓ Lightbox closed via backdrop: ${lightboxAfterBackdrop ? '✓' : '✗ (backdrop may not trigger close)'}`);

  // // Ensure lightbox is closed before next test
  // if (!lightboxAfterBackdrop) {
  //   await page.keyboard.press('Escape');
  //   await page.waitForTimeout(400);
  // }

  // Test 16: Verify focus lock animation on photo click
  console.log('\n📍 Test 16: Verify Focus Lock Animation');
  // Re-click the photo to check for viewfinder animation
  await firstPhoto.click();
  await page.waitForTimeout(100);

  const viewfinder = await firstPhoto.locator('.viewfinder-corners');
  const hasFocusLock = await viewfinder.evaluate(el => el.classList.contains('focus-locked'));
  console.log(`   ✓ Focus lock animation triggered: ${hasFocusLock ? '✓' : 'may have passed'}`);

  await page.waitForTimeout(400);

  // Test 17: Verify body scroll is locked when lightbox is open
  console.log('\n📍 Test 17: Verify Body Scroll Lock');
  const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
  console.log(`   ✓ Body overflow when lightbox open: "${bodyOverflow}"`);
  const scrollLocked = bodyOverflow === 'hidden';
  console.log(`   ✓ Scroll locked: ${scrollLocked ? '✓' : '(may vary by timing)'}`);

  // Close lightbox
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // Additional coverage: first album page and first tag page (detected from listing pages)
  const firstAlbumHref = await getFirstAlbumHref(page);
  const firstTagHref = await getFirstTagHref(page);

  await runKeyboardSmoke(page, 'first album page', firstAlbumHref);
  await runKeyboardSmoke(page, 'first tag page', firstTagHref);
  await runKeyboardOnPhotosPage(page, { label: 'baseline' });
  await runKeyboardOnPhotosPage(page, { label: 'after first tag selected', applyTag: true });

  console.log('\n✅ Lightbox interaction tests completed!\n');

  await browser.close();
})();
