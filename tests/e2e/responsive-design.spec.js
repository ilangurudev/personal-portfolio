/**
 * Responsive Design Tests
 *
 * Tests both spaces across different viewport sizes (mobile, tablet, desktop).
 * Takes screenshots for visual regression testing.
 */

const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:4321';
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || './tests/screenshots';

const HAMBURGER_SELECTORS = {
  professional: {
    button: '#blog-hamburger-btn',
    menu: '#blog-mobile-menu',
    close: '#blog-mobile-menu-close'
  },
  photography: {
    button: '#hamburger-btn',
    menu: '#mobile-menu',
    close: '#mobile-menu-close'
  }
};

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
    { path: '/photography', name: 'photography' }
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

      if (viewport.name === 'mobile') {
        const selectors = HAMBURGER_SELECTORS[pageConfig.name];
        const normalizePath = (path) => (path === '/' ? '/' : path.replace(/\/$/, ''));

        await page.click(selectors.button);
        await page.waitForSelector(`${selectors.menu}.active`);

        await page.click(selectors.close);
        await page.waitForFunction(
          (menuSelector) => !document.querySelector(menuSelector)?.classList.contains('active'),
          selectors.menu
        );

        console.log(`   ✓ mobile hamburger menu opens/closes (${pageConfig.name})`);

        await page.click(selectors.button); // reopen to test space toggle from within menu
        await page.waitForSelector(`${selectors.menu}.active`);

        const toggleTargetPath = pageConfig.path === '/' ? '/photography' : '/';
        const toggleLink = page.locator(
          `${selectors.menu} .mobile-space-toggle .toggle-link.toggle-inactive`
        );

        const targetBodySelector =
          pageConfig.name === 'professional' ? 'body.photo-space' : 'body.blog-space';

        await toggleLink.scrollIntoViewIfNeeded();
        await toggleLink.click({ timeout: 5000, force: true }); // dev toolbar can intercept pointer events
        await page.waitForLoadState('networkidle');

        const currentPath = new URL(page.url()).pathname;
        if (normalizePath(currentPath) !== normalizePath(toggleTargetPath)) {
          throw new Error(
            `Space toggle did not navigate as expected: now at ${currentPath}, expected ${toggleTargetPath}`
          );
        }

        await page.waitForSelector(targetBodySelector);

        console.log(
          `   ✓ space toggle navigates from mobile menu (${pageConfig.name} → ${toggleTargetPath})`
        );

        await page.goto(`${TARGET_URL}${pageConfig.path}`); // return for rest of viewport checks
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(200);
      }

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
