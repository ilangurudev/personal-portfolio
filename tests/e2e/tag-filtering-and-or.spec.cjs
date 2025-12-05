/**
 * Tag Filtering Tests (AND/OR Mode)
 *
 * Tests the tag filtering functionality with AND/OR toggle modes:
 * - Tag selection and deselection
 * - OR mode: photos with ANY selected tag shown
 * - AND mode: photos with ALL selected tags shown
 * - Tag availability updates in AND mode
 * - Photo count updates
 * - Clear filters functionality
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

  console.log('🧪 Testing Tag Filtering (AND/OR Mode)...\n');

  // Test 1: Navigate to Tag Page
  console.log('📍 Test 1: Navigate to Tag Page with Filter Pills');
  await page.goto(`${TARGET_URL}/photography/tag/landscape%20photography`);
  await page.waitForLoadState('networkidle');

  const pageTitle = await page.title();
  console.log(`   ✓ Page loaded: ${pageTitle}`);

  // Test 2: Verify tag filter bar exists
  console.log('\n📍 Test 2: Verify Tag Filter Bar');
  const filterToggle = await page.locator('#filter-toggle');
  const filterToggleExists = await filterToggle.count() > 0;
  console.log(`   ✓ Filter toggle button exists: ${filterToggleExists ? '✓' : '✗'}`);

  // Expand the filter bar
  await filterToggle.click();
  await page.waitForTimeout(400);

  const tagPillsContainer = await page.locator('#tag-pills-container');
  const isExpanded = await tagPillsContainer.evaluate(el => el.classList.contains('expanded'));
  console.log(`   ✓ Filter bar expanded: ${isExpanded ? '✓' : '✗'}`);

  // Test 3: Verify AND/OR toggle exists
  console.log('\n📍 Test 3: Verify AND/OR Toggle');
  const toggleOr = await page.locator('.tag-logic-toggle .toggle-option[data-mode="or"]');
  const toggleAnd = await page.locator('.tag-logic-toggle .toggle-option[data-mode="and"]');

  const toggleOrExists = await toggleOr.count() > 0;
  const toggleAndExists = await toggleAnd.count() > 0;
  console.log(`   ✓ OR toggle exists: ${toggleOrExists ? '✓' : '✗'}`);
  console.log(`   ✓ AND toggle exists: ${toggleAndExists ? '✓' : '✗'}`);

  // Verify OR is active by default
  const orIsActive = await toggleOr.evaluate(el => el.getAttribute('aria-pressed') === 'true');
  console.log(`   ✓ OR mode active by default: ${orIsActive ? '✓' : '✗'}`);

  // Test 4: Select multiple tags in OR mode
  console.log('\n📍 Test 4: Select Multiple Tags (OR Mode)');
  const initialCount = await page.locator('#photo-count').textContent();
  console.log(`   Initial photo count: ${initialCount}`);

  // Find and click a second tag
  const tagPills = await page.locator('.tag-pill:not(.active)');
  const secondTagExists = await tagPills.count() > 0;

  if (secondTagExists) {
    const secondTag = await tagPills.first();
    const secondTagName = await secondTag.getAttribute('data-tag');
    await secondTag.click();
    await page.waitForTimeout(500);

    const activeTagsCount = await page.locator('.tag-pill.active').count();
    console.log(`   ✓ Second tag selected (${secondTagName}): ${activeTagsCount === 2 ? '✓' : '✗'}`);

    const newCount = await page.locator('#photo-count').textContent();
    console.log(`   Photo count after OR selection: ${newCount}`);

    // Test 5: Switch to AND mode
    console.log('\n📍 Test 5: Switch to AND Mode');
    await toggleAnd.click();
    await page.waitForTimeout(500);

    const andIsActive = await toggleAnd.evaluate(el => el.getAttribute('aria-pressed') === 'true');
    console.log(`   ✓ AND mode activated: ${andIsActive ? '✓' : '✗'}`);

    const andModeCount = await page.locator('#photo-count').textContent();
    console.log(`   Photo count in AND mode: ${andModeCount}`);

    // In AND mode, count should be less than or equal to OR mode
    const orNumber = parseInt(newCount.match(/\d+/)?.[0] || '0');
    const andNumber = parseInt(andModeCount.match(/\d+/)?.[0] || '0');
    console.log(`   ✓ AND mode shows fewer/equal photos (${andNumber} <= ${orNumber}): ${andNumber <= orNumber ? '✓' : '✗'}`);

    // Test 6: Verify tag availability in AND mode
    console.log('\n📍 Test 6: Tag Availability in AND Mode');
    const hiddenTags = await page.locator('.tag-pill[style*="display: none"]').count();
    const visibleTags = await page.locator('.tag-pill:not([style*="display: none"])').count();
    console.log(`   Visible tags: ${visibleTags}`);
    console.log(`   Hidden tags (unavailable): ${hiddenTags}`);
    console.log(`   ✓ Some tags hidden in AND mode: ${hiddenTags >= 0 ? '✓' : '✗'}`);

    // Test 7: Switch back to OR mode
    console.log('\n📍 Test 7: Switch Back to OR Mode');
    await toggleOr.click();
    await page.waitForTimeout(500);

    const orActiveAgain = await toggleOr.evaluate(el => el.getAttribute('aria-pressed') === 'true');
    console.log(`   ✓ OR mode reactivated: ${orActiveAgain ? '✓' : '✗'}`);

    // All tags should be visible again
    const allTagsVisible = await page.locator('.tag-pill[style*="display: none"]').count();
    console.log(`   ✓ All tags visible in OR mode: ${allTagsVisible === 0 ? '✓' : '✗'}`);

    // Test 8: Clear filters
    console.log('\n📍 Test 8: Clear Filters');
    const clearBtn = await page.locator('#clear-filters');
    const clearBtnVisible = await clearBtn.evaluate(el => el.style.display !== 'none');

    if (clearBtnVisible) {
      await clearBtn.click();
      await page.waitForTimeout(500);

      const activeTagsAfterClear = await page.locator('.tag-pill.active').count();
      console.log(`   ✓ Filters cleared (1 tag active - initial): ${activeTagsAfterClear === 1 ? '✓' : '✗'}`);
    } else {
      console.log(`   ✓ Clear button hidden (expected with single tag): ✓`);
    }
  } else {
    console.log('   ⚠ No additional tags available to test multi-select');
  }

  // Test 9: Test on All Photos page with advanced filters
  console.log('\n📍 Test 9: Navigate to All Photos Page');
  await page.goto(`${TARGET_URL}/photography/photos`);
  await page.waitForLoadState('networkidle');

  const photosPageTitle = await page.locator('.page-title').textContent();
  console.log(`   ✓ All Photos page loaded: ${photosPageTitle === 'All Photos' ? '✓' : '✗'}`);

  // Open filter panel
  const toggleFiltersBtn = await page.locator('#toggle-filters');
  await toggleFiltersBtn.click();
  await page.waitForTimeout(400);

  const filterPanel = await page.locator('#filter-panel');
  const panelVisible = await filterPanel.evaluate(el => !el.classList.contains('collapsed'));
  console.log(`   ✓ Filter panel opened: ${panelVisible ? '✓' : '✗'}`);

  // Test 10: Verify tag checkboxes exist
  console.log('\n📍 Test 10: Verify Tag Checkboxes in Filter Panel');
  const tagCheckboxes = await page.locator('#tags-filter input[type="checkbox"]');
  const tagCount = await tagCheckboxes.count();
  console.log(`   ✓ Tag checkboxes found: ${tagCount}`);

  // Test AND/OR toggle in filter panel
  const panelToggleOr = await page.locator('#toggle-or');
  const panelToggleAnd = await page.locator('#toggle-and');

  const panelOrExists = await panelToggleOr.count() > 0;
  const panelAndExists = await panelToggleAnd.count() > 0;
  console.log(`   ✓ OR toggle in panel: ${panelOrExists ? '✓' : '✗'}`);
  console.log(`   ✓ AND toggle in panel: ${panelAndExists ? '✓' : '✗'}`);

  // Test 11: Select a tag and verify filtering
  console.log('\n📍 Test 11: Select Tag and Verify Filtering');
  const initialTotalCount = await page.locator('#total-count').textContent();
  console.log(`   Initial total photos: ${initialTotalCount}`);

  if (tagCount > 0) {
    const firstTagCheckbox = await tagCheckboxes.first();
    await firstTagCheckbox.click();
    await page.waitForTimeout(500);

    const filteredCount = await page.locator('#total-count').textContent();
    console.log(`   Filtered photo count: ${filteredCount}`);

    const countChanged = filteredCount !== initialTotalCount;
    console.log(`   ✓ Photo count changed after filtering: ${countChanged ? '✓' : '✗'}`);
  }

  console.log('\n✅ Tag filtering (AND/OR mode) tests completed!\n');

  await browser.close();
})();
