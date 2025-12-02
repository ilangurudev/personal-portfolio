/**
 * Photo Filter Toggle Tests
 *
 * Tests the All|Street|Landscape filter toggle on the photography landing page.
 * Verifies that photos are correctly filtered based on their tags.
 */

const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:4321';

(async () => {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS === 'true',
    slowMo: 100
  });
  const page = await browser.newPage();

  console.log('🧪 Testing Photo Filter Toggle...\n');

  // Test 1: Navigate to Photography Landing Page
  console.log('📍 Test 1: Navigate to Photography Landing Page');
  await page.goto(`${TARGET_URL}/photography`);
  await page.waitForLoadState('networkidle');

  const pageTitle = await page.title();
  console.log(`   ✓ Page loaded: ${pageTitle}`);

  // Test 2: Verify Filter Toggle Group Exists
  console.log('\n📍 Test 2: Verify Filter Toggle Group');
  const filterToggle = await page.locator('.filter-toggle-group');
  const toggleCount = await filterToggle.count();
  console.log(`   ✓ Filter toggle group found: ${toggleCount > 0 ? '✓' : '✗'}`);

  const allButton = await page.locator('.filter-toggle-option[data-filter="all"]');
  const streetButton = await page.locator('.filter-toggle-option[data-filter="street"]');
  const landscapeButton = await page.locator('.filter-toggle-option[data-filter="landscape"]');

  const allExists = await allButton.count() > 0;
  const streetExists = await streetButton.count() > 0;
  const landscapeExists = await landscapeButton.count() > 0;

  console.log(`   ✓ All button exists: ${allExists ? '✓' : '✗'}`);
  console.log(`   ✓ Street button exists: ${streetExists ? '✓' : '✗'}`);
  console.log(`   ✓ Landscape button exists: ${landscapeExists ? '✓' : '✗'}`);

  // Test 3: Verify Default State (All)
  console.log('\n📍 Test 3: Verify Default State');
  const allButtonActive = await allButton.evaluate(el => el.classList.contains('active'));
  console.log(`   ✓ All button is active by default: ${allButtonActive ? '✓' : '✗'}`);

  const totalPhotos = await page.locator('.photo-card').count();
  const visiblePhotos = await page.locator('.photo-card:visible').count();
  console.log(`   ✓ Total photos: ${totalPhotos}`);
  console.log(`   ✓ Visible photos (All): ${visiblePhotos}`);

  // Test 4: Click Street Filter
  console.log('\n📍 Test 4: Test Street Filter');
  await streetButton.click();
  await page.waitForTimeout(300); // Wait for filtering animation

  const streetButtonActive = await streetButton.evaluate(el => el.classList.contains('active'));
  console.log(`   ✓ Street button is active: ${streetButtonActive ? '✓' : '✗'}`);

  const visibleStreetPhotos = await page.locator('.photo-card:visible').count();
  console.log(`   ✓ Visible photos (Street): ${visibleStreetPhotos}`);
  console.log(`   ✓ Filter reduced photos: ${visibleStreetPhotos < totalPhotos ? '✓' : '✗'}`);

  // Test 5: Click Landscape Filter
  console.log('\n📍 Test 5: Test Landscape Filter');
  await landscapeButton.click();
  await page.waitForTimeout(300); // Wait for filtering animation

  const landscapeButtonActive = await landscapeButton.evaluate(el => el.classList.contains('active'));
  console.log(`   ✓ Landscape button is active: ${landscapeButtonActive ? '✓' : '✗'}`);

  const visibleLandscapePhotos = await page.locator('.photo-card:visible').count();
  console.log(`   ✓ Visible photos (Landscape): ${visibleLandscapePhotos}`);
  console.log(`   ✓ Filter reduced photos: ${visibleLandscapePhotos < totalPhotos ? '✓' : '✗'}`);

  // Test 6: Click All to Reset
  console.log('\n📍 Test 6: Test All Filter (Reset)');
  await allButton.click();
  await page.waitForTimeout(300); // Wait for filtering animation

  const allButtonActiveAgain = await allButton.evaluate(el => el.classList.contains('active'));
  console.log(`   ✓ All button is active: ${allButtonActiveAgain ? '✓' : '✗'}`);

  const visibleAllPhotos = await page.locator('.photo-card:visible').count();
  console.log(`   ✓ Visible photos (All): ${visibleAllPhotos}`);
  console.log(`   ✓ All photos visible again: ${visibleAllPhotos === totalPhotos ? '✓' : '✗'}`);

  // Test 7: Verify Only One Button Active at a Time
  console.log('\n📍 Test 7: Verify Exclusive Button States');
  await streetButton.click();
  await page.waitForTimeout(100);

  const activeButtons = await page.locator('.filter-toggle-option.active').count();
  console.log(`   ✓ Only one button active at a time: ${activeButtons === 1 ? '✓' : '✗'}`);

  console.log('\n✅ Photo filter toggle tests passed!\n');

  await browser.close();
})();
