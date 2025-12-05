/**
 * Story Drawer Tests
 *
 * Tests the story drawer functionality in the lightbox:
 * - Story button visibility (only when photo has story content)
 * - Opening story drawer
 * - Story content display
 * - Closing story drawer via X button
 * - Closing story drawer via backdrop
 * - Story drawer auto-close when navigating photos
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

  console.log('🧪 Testing Story Drawer...\n');

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
    console.log('   ⚠ No photos found, skipping story drawer tests');
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

  // Test 3: Check story button visibility
  console.log('\n📍 Test 3: Check Story Button');
  const storyBtn = await page.locator('.lightbox-story-btn');
  const storyBtnDisplay = await storyBtn.evaluate(el => window.getComputedStyle(el).display);
  const storyBtnVisible = storyBtnDisplay !== 'none';

  console.log(`   Story button display: ${storyBtnDisplay}`);
  console.log(`   ✓ Story button state determined: ${storyBtnVisible ? 'visible (has story)' : 'hidden (no story)'}`);

  // Test 4: Find a photo with a story (if button is hidden, navigate through photos)
  console.log('\n📍 Test 4: Find Photo with Story');
  let foundPhotoWithStory = storyBtnVisible;
  let attempts = 0;
  const maxAttempts = Math.min(photoCount, 10);

  while (!foundPhotoWithStory && attempts < maxAttempts) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(400);

    const btnDisplay = await storyBtn.evaluate(el => window.getComputedStyle(el).display);
    foundPhotoWithStory = btnDisplay !== 'none';
    attempts++;
  }

  if (foundPhotoWithStory) {
    console.log(`   ✓ Found photo with story after ${attempts} attempts`);

    // Test 5: Open story drawer
    console.log('\n📍 Test 5: Open Story Drawer');
    await storyBtn.click();
    await page.waitForTimeout(400);

    const storyDrawer = await page.locator('.lightbox-story-drawer');
    const drawerActive = await storyDrawer.evaluate(el =>
      el.style.display !== 'none' && el.classList.contains('active')
    );
    console.log(`   ✓ Story drawer opened: ${drawerActive ? '✓' : '✗'}`);

    // Test 6: Verify story content
    console.log('\n📍 Test 6: Verify Story Content');
    const storyContent = await page.locator('.lightbox-story-content');
    const contentText = await storyContent.textContent();
    const hasContent = contentText && contentText.trim().length > 0;
    console.log(`   Story content length: ${contentText?.length || 0} characters`);
    console.log(`   ✓ Story has content: ${hasContent ? '✓' : '✗'}`);

    // Test 7: Close story drawer via X button
    console.log('\n📍 Test 7: Close Story Drawer (X Button)');
    const storyCloseBtn = await page.locator('.lightbox-story-close');
    await storyCloseBtn.click();
    await page.waitForTimeout(400);

    const drawerClosed = await storyDrawer.evaluate(el =>
      el.style.display === 'none' || !el.classList.contains('active')
    );
    console.log(`   ✓ Story drawer closed via X: ${drawerClosed ? '✓' : '✗'}`);

    // Test 8: Reopen and close via backdrop
    console.log('\n📍 Test 8: Close Story Drawer (Backdrop)');
    await storyBtn.click();
    await page.waitForTimeout(400);

    // Click on the story drawer backdrop (the drawer element itself, not the content)
    await page.evaluate(() => {
      const drawer = document.querySelector('.lightbox-story-drawer');
      if (drawer) {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        drawer.dispatchEvent(clickEvent);
      }
    });
    await page.waitForTimeout(400);

    const drawerClosedBackdrop = await storyDrawer.evaluate(el =>
      el.style.display === 'none' || !el.classList.contains('active')
    );
    console.log(`   ✓ Story drawer closed via backdrop: ${drawerClosedBackdrop ? '✓' : '✗'}`);

    // Test 9: Story drawer closes when navigating photos
    console.log('\n📍 Test 9: Story Drawer Auto-Close on Navigation');
    await storyBtn.click();
    await page.waitForTimeout(400);

    const drawerOpenBeforeNav = await storyDrawer.evaluate(el =>
      el.style.display !== 'none' && el.classList.contains('active')
    );
    console.log(`   Drawer open before navigation: ${drawerOpenBeforeNav ? '✓' : '✗'}`);

    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(400);

    const drawerClosedAfterNav = await storyDrawer.evaluate(el =>
      el.style.display === 'none' || !el.classList.contains('active')
    );
    console.log(`   ✓ Drawer auto-closed after navigation: ${drawerClosedAfterNav ? '✓' : '✗'}`);
  } else {
    console.log(`   ⚠ No photos with stories found in first ${maxAttempts} photos`);
    console.log('   ⚠ Skipping story-specific tests (no story content in test data)');
  }

  // Test 10: Verify story button hidden for photos without story
  console.log('\n📍 Test 10: Verify Story Button Hidden for Photos Without Story');
  // Navigate to find a photo without story
  let foundPhotoWithoutStory = false;
  attempts = 0;

  while (!foundPhotoWithoutStory && attempts < maxAttempts) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(400);

    const btnDisplay = await storyBtn.evaluate(el => window.getComputedStyle(el).display);
    foundPhotoWithoutStory = btnDisplay === 'none';
    attempts++;
  }

  if (foundPhotoWithoutStory) {
    console.log(`   ✓ Found photo without story - button correctly hidden`);
  } else {
    console.log(`   ⚠ All tested photos have stories (button always visible)`);
  }

  // Close lightbox
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  console.log('\n✅ Story drawer tests completed!\n');

  await browser.close();
})();
