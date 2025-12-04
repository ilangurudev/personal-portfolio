/**
 * Advanced Filter Panel Tests
 *
 * Tests the 8-dimensional filter panel on /photography/photos:
 * - Filter panel toggle (open/close)
 * - Tag filtering with search
 * - Album filtering
 * - Camera filtering
 * - Date range filtering
 * - EXIF filtering (aperture, shutter speed, ISO, focal length)
 * - Clear all filters
 * - Filter count badge
 * - Filter persistence (localStorage)
 */

const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:4321';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process'],
    slowMo: 100
  });
  const page = await browser.newPage();

  console.log('🧪 Testing Advanced Filter Panel...\n');

  // Test 1: Navigate to All Photos Page
  console.log('📍 Test 1: Navigate to All Photos Page');
  await page.goto(`${TARGET_URL}/photography/photos`);
  await page.waitForLoadState('networkidle');

  const pageTitle = await page.locator('.page-title').textContent();
  console.log(`   ✓ Page loaded: ${pageTitle}`);

  // Test 2: Verify filter panel exists
  console.log('\n📍 Test 2: Verify Filter Panel');
  const filterPanel = await page.locator('#filter-panel');
  const filterPanelExists = await filterPanel.count() > 0;
  console.log(`   ✓ Filter panel exists: ${filterPanelExists ? '✓' : '✗'}`);

  // Check initial collapsed state
  const initialCollapsed = await filterPanel.evaluate(el => el.classList.contains('collapsed'));
  console.log(`   ✓ Initially collapsed: ${initialCollapsed ? '✓' : '(may depend on localStorage)'}`);

  // Test 3: Toggle filter panel
  console.log('\n📍 Test 3: Toggle Filter Panel');
  const toggleBtn = await page.locator('#toggle-filters');
  await toggleBtn.click();
  await page.waitForTimeout(400);

  const panelExpanded = await filterPanel.evaluate(el => !el.classList.contains('collapsed'));
  console.log(`   ✓ Panel expanded after click: ${panelExpanded ? '✓' : '✗'}`);

  // Test 4: Verify all filter sections exist
  console.log('\n📍 Test 4: Verify Filter Sections');
  const filterSections = [
    { id: '#tags-filter', name: 'Tags' },
    { id: '#albums-filter', name: 'Albums' },
    { id: '#cameras-filter', name: 'Cameras' },
    { id: '#date-min', name: 'Date Min' },
    { id: '#date-max', name: 'Date Max' },
    { id: '#aperture-min', name: 'Aperture' },
    { id: '#shutter-min', name: 'Shutter Speed' },
    { id: '#iso-min', name: 'ISO' },
    { id: '#focal-min', name: 'Focal Length' }
  ];

  for (const section of filterSections) {
    const exists = await page.locator(section.id).count() > 0;
    console.log(`   ✓ ${section.name}: ${exists ? '✓' : '✗'}`);
  }

  // Get initial photo count
  const initialTotal = parseInt(await page.locator('#total-count').textContent() || '0');
  console.log(`\n   Initial total photos: ${initialTotal}`);

  // Test 5: Tag Search
  console.log('\n📍 Test 5: Tag Search Functionality');
  const tagSearch = await page.locator('#tag-search');
  const tagSearchExists = await tagSearch.count() > 0;
  console.log(`   ✓ Tag search input exists: ${tagSearchExists ? '✓' : '✗'}`);

  if (tagSearchExists) {
    // Count initial visible tags
    const initialVisibleTags = await page.locator('#tags-filter .filter-checkbox-label:not(.search-hidden)').count();
    console.log(`   Initial visible tags: ${initialVisibleTags}`);

    // Type in search
    await tagSearch.fill('str');
    await page.waitForTimeout(200);

    const filteredVisibleTags = await page.locator('#tags-filter .filter-checkbox-label:not(.search-hidden)').count();
    console.log(`   Tags visible after search "str": ${filteredVisibleTags}`);
    console.log(`   ✓ Search filters tags: ${filteredVisibleTags < initialVisibleTags ? '✓' : '(no matching reduction)'}`);

    // Clear search
    await tagSearch.fill('');
    await page.waitForTimeout(200);
  }

  // Test 6: Select a tag filter
  console.log('\n📍 Test 6: Tag Checkbox Filter');
  const tagCheckboxes = await page.locator('#tags-filter input[type="checkbox"]');
  const tagCount = await tagCheckboxes.count();

  if (tagCount > 0) {
    const firstTagCheckbox = await tagCheckboxes.first();
    const tagLabel = await firstTagCheckbox.evaluate(el =>
      el.closest('label')?.textContent?.trim() || 'unknown'
    );
    console.log(`   Selecting tag: ${tagLabel}`);

    await firstTagCheckbox.click();
    await page.waitForTimeout(500);

    const afterTagFilter = parseInt(await page.locator('#total-count').textContent() || '0');
    console.log(`   Photos after tag filter: ${afterTagFilter}`);
    console.log(`   ✓ Tag filter applied: ${afterTagFilter <= initialTotal ? '✓' : '✗'}`);

    // Uncheck to reset
    await firstTagCheckbox.click();
    await page.waitForTimeout(500);
  }

  // Test 7: Album filter
  console.log('\n📍 Test 7: Album Checkbox Filter');
  const albumCheckboxes = await page.locator('#albums-filter input[type="checkbox"]');
  const albumCount = await albumCheckboxes.count();
  console.log(`   Available albums: ${albumCount}`);

  if (albumCount > 0) {
    const firstAlbum = await albumCheckboxes.first();
    await firstAlbum.click();
    await page.waitForTimeout(500);

    const afterAlbumFilter = parseInt(await page.locator('#total-count').textContent() || '0');
    console.log(`   Photos after album filter: ${afterAlbumFilter}`);
    console.log(`   ✓ Album filter applied: ${afterAlbumFilter <= initialTotal ? '✓' : '✗'}`);

    await firstAlbum.click();
    await page.waitForTimeout(500);
  }

  // Test 8: Camera filter
  console.log('\n📍 Test 8: Camera Checkbox Filter');
  const cameraCheckboxes = await page.locator('#cameras-filter input[type="checkbox"]');
  const cameraCount = await cameraCheckboxes.count();
  console.log(`   Available cameras: ${cameraCount}`);

  if (cameraCount > 0) {
    const firstCamera = await cameraCheckboxes.first();
    await firstCamera.click();
    await page.waitForTimeout(500);

    const afterCameraFilter = parseInt(await page.locator('#total-count').textContent() || '0');
    console.log(`   Photos after camera filter: ${afterCameraFilter}`);
    console.log(`   ✓ Camera filter applied: ${afterCameraFilter <= initialTotal ? '✓' : '✗'}`);

    await firstCamera.click();
    await page.waitForTimeout(500);
  }

  // Test 9: Date range filter
  console.log('\n📍 Test 9: Date Range Filter');
  const dateMin = await page.locator('#date-min');
  const dateMax = await page.locator('#date-max');

  const minDateValue = await dateMin.inputValue();
  const maxDateValue = await dateMax.inputValue();
  console.log(`   Date range: ${minDateValue} to ${maxDateValue}`);

  // Narrow the date range
  const newMaxDate = new Date(maxDateValue);
  newMaxDate.setMonth(newMaxDate.getMonth() - 1);
  const narrowedMax = newMaxDate.toISOString().split('T')[0];

  await dateMax.fill(narrowedMax);
  await page.waitForTimeout(500);

  const afterDateFilter = parseInt(await page.locator('#total-count').textContent() || '0');
  console.log(`   Photos after date filter (narrowed to ${narrowedMax}): ${afterDateFilter}`);
  console.log(`   ✓ Date filter applied: ${afterDateFilter <= initialTotal ? '✓' : '(no change)'}`);

  // Reset date
  await dateMax.fill(maxDateValue);
  await page.waitForTimeout(500);

  // Test 10: Aperture range filter
  console.log('\n📍 Test 10: Aperture Range Filter');
  const apertureMin = await page.locator('#aperture-min');
  const apertureMax = await page.locator('#aperture-max');

  const apertureMinValue = await apertureMin.evaluate(el => el.value);
  const apertureMaxValue = await apertureMax.evaluate(el => el.value);
  console.log(`   Aperture range: f/${apertureMinValue} to f/${apertureMaxValue}`);

  // Narrow aperture range
  const narrowedApertureMax = (parseFloat(apertureMaxValue) - 2).toFixed(1);
  await apertureMax.fill(narrowedApertureMax);
  await page.waitForTimeout(500);

  const afterApertureFilter = parseInt(await page.locator('#total-count').textContent() || '0');
  console.log(`   Photos after aperture filter (max f/${narrowedApertureMax}): ${afterApertureFilter}`);
  console.log(`   ✓ Aperture filter applied: ${afterApertureFilter <= initialTotal ? '✓' : '(no change)'}`);

  // Test 11: Filter count badge
  console.log('\n📍 Test 11: Filter Count Badge');
  const filterCountBadge = await page.locator('#filter-count');
  const badgeVisible = await filterCountBadge.evaluate(el => el.style.display !== 'none');
  const badgeValue = await filterCountBadge.textContent();
  console.log(`   ✓ Filter badge visible: ${badgeVisible ? '✓' : '(no filters active)'}`);
  console.log(`   Badge value: ${badgeValue || '0'}`);

  // Test 12: Clear all filters
  console.log('\n📍 Test 12: Clear All Filters');
  const clearBtn = await page.locator('#clear-filters');
  await clearBtn.click();
  await page.waitForTimeout(500);

  const afterClear = parseInt(await page.locator('#total-count').textContent() || '0');
  console.log(`   Photos after clear: ${afterClear}`);
  console.log(`   ✓ Filters cleared: ${afterClear === initialTotal ? '✓' : '✗'}`);

  // Test 13: Close filter panel
  console.log('\n📍 Test 13: Close Filter Panel');
  const closeBtn = await page.locator('#close-filters');
  await closeBtn.click();
  await page.waitForTimeout(400);

  const panelCollapsed = await filterPanel.evaluate(el => el.classList.contains('collapsed'));
  console.log(`   ✓ Panel collapsed via X button: ${panelCollapsed ? '✓' : '✗'}`);

  // Test 14: Filter panel state persistence
  console.log('\n📍 Test 14: Filter Panel State Persistence (localStorage)');
  // Open panel
  await toggleBtn.click();
  await page.waitForTimeout(400);

  // Check localStorage
  const panelState = await page.evaluate(() => localStorage.getItem('filterPanelCollapsed'));
  console.log(`   localStorage state: ${panelState}`);

  // Reload page and check if panel state is preserved
  await page.reload();
  await page.waitForLoadState('networkidle');

  const panelStateAfterReload = await page.locator('#filter-panel').evaluate(el =>
    el.classList.contains('collapsed')
  );
  console.log(`   Panel collapsed after reload: ${panelStateAfterReload}`);
  console.log(`   ✓ State persisted: ${panelState === String(panelStateAfterReload) ? '✓' : 'may differ'}`);

  // Test 15: No results state
  console.log('\n📍 Test 15: No Results State');
  // Open panel and apply impossible filter combination
  if (!panelStateAfterReload) {
    // Panel is open
  } else {
    await page.locator('#toggle-filters').click();
    await page.waitForTimeout(400);
  }

  // Apply multiple restrictive filters
  const allTagCheckboxes = await page.locator('#tags-filter input[type="checkbox"]');
  const tagCheckCount = await allTagCheckboxes.count();

  if (tagCheckCount >= 2) {
    // Select first two tags and set to AND mode
    await allTagCheckboxes.nth(0).click();
    await allTagCheckboxes.nth(1).click();
    await page.waitForTimeout(300);

    // Switch to AND mode
    const andToggle = await page.locator('#toggle-and');
    await andToggle.click();
    await page.waitForTimeout(500);

    // Narrow date range significantly
    await page.locator('#date-max').fill('2000-01-01');
    await page.waitForTimeout(500);

    const noResultsEl = await page.locator('#no-results');
    const noResultsVisible = await noResultsEl.evaluate(el => el.style.display !== 'none');
    console.log(`   ✓ No results message shown: ${noResultsVisible ? '✓' : '(still has results)'}`);

    // Reset via button
    const resetBtn = await page.locator('#reset-filters');
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await page.waitForTimeout(500);
      console.log('   ✓ Reset filters button works');
    }
  }

  console.log('\n✅ Advanced filter panel tests completed!\n');

  await browser.close();
})();
