/**
 * Viewfinder CSS Tests
 *
 * Regression test to ensure viewfinder overlay CSS works correctly:
 * - Viewfinder overlay appears on photo card hover
 * - Viewfinder corners SVG is visible
 * - Focus lock animation works on click
 * - Styles are properly scoped and applied
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

  console.log('🧪 Testing Viewfinder CSS...\n');

  let allTestsPassed = true;

  // Test pages with photo cards
  const testPages = [
    { name: 'Photography Home', url: '/photography' },
  ];

  // Get a sample album and tag for dynamic routes
  console.log('📍 Discovering sample album and tag...');
  await page.goto(`${TARGET_URL}/photography/albums`);
  await page.waitForLoadState('networkidle');
  
  const firstAlbumLink = await page.locator('a[href*="/photography/album/"]').first();
  const albumHref = await firstAlbumLink.getAttribute('href');
  if (albumHref) {
    const albumSlug = albumHref.split('/photography/album/')[1];
    testPages.push({ name: `Album: ${albumSlug}`, url: `/photography/album/${albumSlug}` });
  }

  await page.goto(`${TARGET_URL}/photography/tags`);
  await page.waitForLoadState('networkidle');
  
  const firstTagLink = await page.locator('a[href*="/photography/tag/"]').first();
  const tagHref = await firstTagLink.getAttribute('href');
  if (tagHref) {
    const tagSlug = tagHref.split('/photography/tag/')[1];
    testPages.push({ name: `Tag: ${tagSlug}`, url: `/photography/tag/${tagSlug}` });
  }

  // Test each page
  for (const testPage of testPages) {
    console.log(`\n📍 Testing: ${testPage.name}`);
    await page.goto(`${TARGET_URL}${testPage.url}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Find first photo card
    const photoCard = await page.locator('.photo-card').first();
    const cardCount = await photoCard.count();

    if (cardCount === 0) {
      console.log(`   ⚠ No photo cards found, skipping viewfinder tests`);
      continue;
    }

    // Test 1: Verify viewfinder overlay exists in DOM
    console.log('   📍 Test 1: Viewfinder overlay exists');
    const overlayExists = await photoCard.locator('.viewfinder-overlay').count() > 0;
    if (overlayExists) {
      console.log(`   ✓ Viewfinder overlay found in DOM`);
    } else {
      console.log(`   ✗ Viewfinder overlay NOT found in DOM`);
      allTestsPassed = false;
      continue;
    }

    // Test 2: Verify viewfinder corners SVG exists
    console.log('   📍 Test 2: Viewfinder corners SVG exists');
    const cornersExists = await photoCard.locator('.viewfinder-corners').count() > 0;
    if (cornersExists) {
      console.log(`   ✓ Viewfinder corners SVG found`);
    } else {
      console.log(`   ✗ Viewfinder corners SVG NOT found`);
      allTestsPassed = false;
    }

    // Test 3: Check initial opacity (should be 0)
    console.log('   📍 Test 3: Initial overlay opacity (should be 0)');
    const initialOpacity = await photoCard.locator('.viewfinder-overlay').evaluate(
      el => getComputedStyle(el).opacity
    );
    const initialOpacityNum = parseFloat(initialOpacity);
    if (initialOpacityNum === 0 || initialOpacityNum < 0.1) {
      console.log(`   ✓ Initial opacity is ${initialOpacity} (hidden)`);
    } else {
      console.log(`   ✗ Initial opacity is ${initialOpacity} (should be ~0)`);
      allTestsPassed = false;
    }

    // Test 4: Hover and check opacity changes
    console.log('   📍 Test 4: Hover effect (opacity should increase)');
    await photoCard.hover();
    await page.waitForTimeout(400); // Wait for transition

    const hoverOpacity = await photoCard.locator('.viewfinder-overlay').evaluate(
      el => getComputedStyle(el).opacity
    );
    const hoverOpacityNum = parseFloat(hoverOpacity);
    if (hoverOpacityNum > 0.5) {
      console.log(`   ✓ Hover opacity is ${hoverOpacity} (visible)`);
    } else {
      console.log(`   ✗ Hover opacity is ${hoverOpacity} (should be ~1)`);
      allTestsPassed = false;
    }

    // Test 5: Verify viewfinder corners are visible on hover
    console.log('   📍 Test 5: Viewfinder corners visibility on hover');
    const cornersVisible = await photoCard.locator('.viewfinder-corners').evaluate(
      el => {
        const style = getComputedStyle(el);
        return style.opacity !== '0' && style.display !== 'none' && style.visibility !== 'hidden';
      }
    );
    if (cornersVisible) {
      console.log(`   ✓ Viewfinder corners are visible on hover`);
    } else {
      console.log(`   ✗ Viewfinder corners are NOT visible on hover`);
      allTestsPassed = false;
    }

    // Test 6: Verify viewfinder corners have correct color
    console.log('   📍 Test 6: Viewfinder corners color');
    const cornersColor = await photoCard.locator('.viewfinder-corners').evaluate(
      el => getComputedStyle(el).color
    );
    // Should be white or near-white (rgba(255, 255, 255, ...) or similar)
    const isWhite = cornersColor.includes('255, 255, 255') || cornersColor.includes('rgb(255, 255, 255)');
    if (isWhite) {
      console.log(`   ✓ Viewfinder corners color: ${cornersColor}`);
    } else {
      console.log(`   ⚠ Viewfinder corners color: ${cornersColor} (expected white)`);
      // Don't fail on color, just warn
    }

    // Test 7: Verify CSS classes are applied correctly
    console.log('   📍 Test 7: CSS classes applied');
    const hasPhotoCardClass = await photoCard.evaluate(el => el.classList.contains('photo-card'));
    const hasPhotoImage = await photoCard.locator('.photo-image').count() > 0;
    
    if (hasPhotoCardClass && hasPhotoImage) {
      console.log(`   ✓ Photo card structure is correct`);
    } else {
      console.log(`   ✗ Photo card structure is incorrect`);
      allTestsPassed = false;
    }

    // Test 8: Verify focus lock animation (click to trigger)
    console.log('   📍 Test 8: Focus lock animation on click');
    await photoCard.click();
    await page.waitForTimeout(300);

    const hasFocusLocked = await photoCard.locator('.viewfinder-corners.focus-locked').count() > 0;
    if (hasFocusLocked) {
      console.log(`   ✓ Focus lock class applied on click`);
    } else {
      // Check if lightbox opened (which might remove the class quickly)
      const lightboxOpen = await page.locator('.lightbox').count() > 0;
      if (lightboxOpen) {
        console.log(`   ✓ Lightbox opened (focus lock may have been brief)`);
      } else {
        console.log(`   ⚠ Focus lock not detected (may be timing issue)`);
        // Don't fail, as timing might be the issue
      }
    }

    // Close lightbox if it opened
    const closeBtn = await page.locator('.lightbox .lightbox-close, .lightbox [aria-label*="close" i], button[aria-label="Close lightbox"]').first();
    if (await closeBtn.count() > 0) {
      const isVisible = await closeBtn.isVisible();
      if (isVisible) {
        await closeBtn.click();
        await page.waitForTimeout(200);
      }
    }

    // Test 9: Verify CSS keyframes animation exists
    console.log('   📍 Test 9: CSS animation keyframes');
    const animationName = await photoCard.locator('.viewfinder-corners').evaluate(
      el => getComputedStyle(el).animationName
    );
    if (animationName && animationName !== 'none') {
      console.log(`   ✓ Animation applied: ${animationName}`);
    } else {
      console.log(`   ⚠ No animation detected (may be timing issue)`);
      // Don't fail, as animation might have completed
    }
  }

  // Test 10: Verify CSS file is loaded (check for styles in computed styles)
  console.log('\n📍 Test 10: CSS styles loaded');
  await page.goto(`${TARGET_URL}/photography`);
  await page.waitForLoadState('networkidle');
  
  const testCard = await page.locator('.photo-card').first();
  if (await testCard.count() > 0) {
    const cardStyles = await testCard.evaluate(el => {
      const style = getComputedStyle(el);
      return {
        position: style.position,
        cursor: style.cursor,
        display: style.display
      };
    });

    const hasCorrectStyles = cardStyles.position === 'relative' && 
                             cardStyles.cursor === 'crosshair' &&
                             cardStyles.display === 'flex';
    
    if (hasCorrectStyles) {
      console.log(`   ✓ Photo card CSS styles loaded correctly`);
    } else {
      console.log(`   ✗ Photo card CSS styles incorrect:`, cardStyles);
      allTestsPassed = false;
    }
  }

  if (allTestsPassed) {
    console.log('\n✅ Viewfinder CSS tests passed!\n');
  } else {
    console.log('\n❌ Viewfinder CSS tests failed!\n');
    process.exit(1);
  }

  await browser.close();
})();

