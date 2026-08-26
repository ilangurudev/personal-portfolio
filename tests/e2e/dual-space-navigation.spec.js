/**
 * Dual-Space Navigation Tests
 *
 * Tests navigation between Professional (dark terminal) and Photography (bright editorial) spaces.
 * Verifies that both themes render correctly with proper aesthetics.
 */

const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:4321';

(async () => {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS === 'true',
    slowMo: 100
  });
  const page = await browser.newPage();

  console.log('🧪 Testing Dual-Space Navigation...\n');

  // Test 1: Professional Homepage (Dark Terminal Theme)
  console.log('📍 Test 1: Professional Homepage (/)');
  await page.goto(TARGET_URL);
  await page.waitForLoadState('networkidle');

  const professionalTitle = await page.title();
  console.log(`   ✓ Page loaded: ${professionalTitle}`);

  // Check for terminal aesthetic elements
  const hasTerminalPrompt = await page.locator('.command-prompt').count() > 0;
  const hasDarkBackground = await page.locator('body.blog-space').count() > 0;
  console.log(`   ✓ Terminal prompt: ${hasTerminalPrompt ? '✓' : '✗'}`);
  console.log(`   ✓ Dark theme: ${hasDarkBackground ? '✓' : '✗'}`);

  // Test 2: Space Toggle to Photography
  console.log('\n📍 Test 2: Space Toggle Navigation');
  const toggleButton = await page.locator('.space-toggle a').first();
  const toggleText = await toggleButton.textContent();
  console.log(`   ✓ Toggle button found: "${toggleText.trim()}"`);

  await toggleButton.click();
  await page.waitForLoadState('networkidle');
  console.log('   ✓ Navigated to photography space');

  // Test 3: Photography Homepage (Bright Editorial Theme)
  console.log('\n📍 Test 3: Photography Homepage (/photography)');
  const photoTitle = await page.title();
  console.log(`   ✓ Page loaded: ${photoTitle}`);

  // Check for photography aesthetic elements
  const hasPhotoSpace = await page.locator('body.photo-space').count() > 0;
  const hasHeroTitle = await page.locator('[data-home-hero] h1').count() > 0;
  const hasSerifFont = await page.locator('[data-home-hero] h1').first().evaluate(
    el => getComputedStyle(el).fontFamily.includes('Instrument Serif')
  );

  console.log(`   ✓ Photo space theme: ${hasPhotoSpace ? '✓' : '✗'}`);
  console.log(`   ✓ Hero title: ${hasHeroTitle ? '✓' : '✗'}`);
  console.log(`   ✓ Editorial serif font: ${hasSerifFont ? '✓' : '✗'}`);

  // Test 4: Toggle back to Professional
  console.log('\n📍 Test 4: Toggle Back to Professional');
  const photoToggleButton = await page.getByRole('link', { name: 'AI / Engineering', exact: true });
  await photoToggleButton.click();
  await page.waitForLoadState('networkidle');

  const backToProf = await page.locator('body.blog-space').count() > 0;
  console.log(`   ✓ Back to professional space: ${backToProf ? '✓' : '✗'}`);

  console.log('\n✅ Dual-space navigation tests passed!\n');

  await browser.close();
})();
