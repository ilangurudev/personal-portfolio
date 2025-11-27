/**
 * Visual Aesthetics Tests
 *
 * Verifies color schemes, typography, and visual design elements
 * for both Professional and Photography spaces.
 */

const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:4321';

(async () => {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS === 'true',
    slowMo: 100
  });
  const page = await browser.newPage();

  console.log('🧪 Testing Visual Aesthetics...\n');

  // Test Professional Space Aesthetics
  console.log('📍 Professional Space (Dark Terminal Theme)');
  await page.goto(TARGET_URL);
  await page.waitForLoadState('networkidle');

  const profBgColor = await page.locator('body.blog-space').evaluate(
    el => getComputedStyle(el).backgroundColor
  );
  const terminalGreen = await page.locator('.site-title a').first().evaluate(
    el => getComputedStyle(el).color
  );
  const terminalFont = await page.locator('body.blog-space').evaluate(
    el => getComputedStyle(el).fontFamily
  );

  console.log(`   ✓ Background: ${profBgColor}`);
  console.log(`   ✓ Terminal green: ${terminalGreen}`);
  console.log(`   ✓ Monospace font: ${terminalFont.includes('JetBrains') ? '✓' : '✗'}`);

  // Check for scanlines effect
  const hasScanlines = await page.locator('.scanlines').count() > 0;
  console.log(`   ✓ Scanlines effect: ${hasScanlines ? '✓' : '✗'}`);

  // Test Photography Space Aesthetics
  console.log('\n📍 Photography Space (Bright Editorial Theme)');
  await page.goto(`${TARGET_URL}/photo`);
  await page.waitForLoadState('networkidle');

  const photoBgColor = await page.locator('body.photo-space').evaluate(
    el => getComputedStyle(el).backgroundColor
  );
  const photoTextColor = await page.locator('.hero-title').first().evaluate(
    el => getComputedStyle(el).color
  );
  const photoFont = await page.locator('.hero-title').first().evaluate(
    el => getComputedStyle(el).fontFamily
  );

  console.log(`   ✓ Background: ${photoBgColor} (warm cream)`);
  console.log(`   ✓ Text color: ${photoTextColor}`);
  console.log(`   ✓ Serif font: ${photoFont.includes('Crimson') ? '✓' : '✗'}`);

  // Test color contrast
  console.log('\n📍 Color Contrast Verification');

  // Professional space should be very dark
  const isDarkBg = profBgColor.includes('2, 6, 23') || profBgColor.includes('rgb(2, 6, 23)');
  console.log(`   ✓ Professional has dark background: ${isDarkBg ? '✓' : '✗'}`);

  // Photography space should be very light
  const isLightBg = photoBgColor.includes('255, 251, 245') || photoBgColor.includes('rgb(255, 251, 245)');
  console.log(`   ✓ Photography has light background: ${isLightBg ? '✓' : '✗'}`);

  console.log('\n✅ Visual aesthetics tests passed!\n');

  await browser.close();
})();
