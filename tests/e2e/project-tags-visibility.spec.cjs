/**
 * Project Tags Visibility Tests
 *
 * Verifies:
 * - Project list page does NOT render tag pills
 * - Project detail page DOES render tag pills
 * - Tag pills on detail page are clickable and navigate to /tags/*
 */

const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:4321';

(async () => {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS === 'true',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process'],
    slowMo: 80
  });
  const page = await browser.newPage();

  console.log('🧪 Testing Project Tags Visibility...\n');

  // Test 1: Projects list should not show tag pills
  console.log('📍 Test 1: Visit /projects and ensure tags are hidden on cards');
  await page.goto(`${TARGET_URL}/projects`);
  await page.waitForLoadState('networkidle');

  const projectCards = page.locator('.project-card');
  const projectCount = await projectCards.count();
  console.log(`   ✓ Project cards found: ${projectCount}`);

  if (projectCount === 0) {
    console.log('   ⚠ No projects found; skipping remaining checks.');
    await browser.close();
    return;
  }

  const tagPillsOnList = await page.locator('.projects-grid .tag-pill').count();
  console.log(`   ✓ Tag pills on list: ${tagPillsOnList} (expected 0)`);
  if (tagPillsOnList > 0) {
    console.error('   ✗ Found tag pills on the projects list (should be hidden).');
    await browser.close();
    process.exit(1);
  }

  // Test 2: Project detail should show tag pills
  console.log('\n📍 Test 2: Open first project and verify tags are visible');
  await projectCards.first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);

  const detailTagPills = page.locator('.tag-pill');
  const detailTagCount = await detailTagPills.count();
  console.log(`   ✓ Tag pills on detail: ${detailTagCount}`);

  if (detailTagCount === 0) {
    console.error('   ✗ No tag pills found on project detail page.');
    await browser.close();
    process.exit(1);
  }

  // Test 3: Tags navigate to /tags/*
  console.log('\n📍 Test 3: Click first tag pill and confirm navigation');
  const firstTag = detailTagPills.first();
  const tagText = await firstTag.textContent();
  await firstTag.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);

  const tagUrl = page.url();
  const navigatedToTags = tagUrl.includes('/tags/');
  console.log(`   ✓ Navigated to tags page (${tagText?.trim()}): ${navigatedToTags ? '✓' : '✗'}`);

  if (!navigatedToTags) {
    console.error('   ✗ Tag pill did not navigate to a /tags/ page.');
    await browser.close();
    process.exit(1);
  }

  console.log('\n✅ Project tags visibility tests passed!\n');

  await browser.close();
})();

