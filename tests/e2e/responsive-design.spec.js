/**
 * Responsive Design Tests
 *
 * Tests both spaces across different viewport sizes (mobile, tablet, desktop).
 * Takes screenshots for visual regression testing.
 */

const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:4321';
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || './tests/screenshots';

(async () => {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS === 'true',
    slowMo: 100
  });
  const page = await browser.newPage();

  console.log('🧪 Testing Responsive Design...\n');

  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 }
  ];

  const pages = [
    { path: '/', name: 'professional' },
    { path: '/photo', name: 'photography' }
  ];

  for (const pageConfig of pages) {
    console.log(`📍 Testing ${pageConfig.name} space (${pageConfig.path})`);

    for (const viewport of viewports) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height
      });

      await page.goto(`${TARGET_URL}${pageConfig.path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500); // Let animations settle

      const screenshotPath = `${SCREENSHOT_DIR}/${pageConfig.name}-${viewport.name}.png`;
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });

      console.log(`   ✓ ${viewport.name} (${viewport.width}x${viewport.height}): ${screenshotPath}`);
    }
    console.log('');
  }

  console.log('✅ Responsive design tests completed!\n');
  console.log(`📸 Screenshots saved to: ${SCREENSHOT_DIR}/\n`);

  await browser.close();
})();
