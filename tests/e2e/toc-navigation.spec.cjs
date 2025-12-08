const { chromium } = require('playwright');

async function runTests() {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ ${name}`);
      console.error(`  ${err.message}`);
      failed++;
    }
  }

  try {
    // Blog post TOC tests
    console.log('\n--- Blog Post TOC Tests ---\n');

    await test('Blog post page loads with TOC sidebar (desktop)', async () => {
      await page.setViewportSize({ width: 1400, height: 900 });
      await page.goto(`${BASE_URL}/blog/building-portfolio-with-ai`);
      await page.waitForLoadState('networkidle');

      // Check TOC container exists
      const tocSidebar = await page.locator('[data-toc-sidebar]');
      await tocSidebar.waitFor({ state: 'visible', timeout: 5000 });

      const isVisible = await tocSidebar.isVisible();
      if (!isVisible) throw new Error('TOC sidebar not visible on desktop');
    });

    await test('TOC contains heading links', async () => {
      const tocLinks = await page.locator('[data-toc-sidebar] a');
      const count = await tocLinks.count();

      if (count < 3) throw new Error(`Expected at least 3 TOC links, got ${count}`);
    });

    await test('Clicking TOC link scrolls to heading', async () => {
      const firstLink = await page.locator('[data-toc-sidebar] a').first();
      const href = await firstLink.getAttribute('href');

      await firstLink.click();
      await page.waitForTimeout(500);

      // Check URL has hash
      const url = page.url();
      if (!url.includes('#')) throw new Error('URL should include hash after clicking TOC link');
    });

    await test('TOC highlights current section on scroll', async () => {
      // Scroll down to trigger highlighting
      await page.evaluate(() => window.scrollTo(0, 1000));
      await page.waitForTimeout(300);

      const activeLink = await page.locator('[data-toc-sidebar] a[data-active="true"]');
      const count = await activeLink.count();

      if (count === 0) throw new Error('No active TOC link found after scrolling');
    });

    // Mobile TOC tests
    console.log('\n--- Mobile TOC Tests ---\n');

    await test('Mobile shows floating TOC button instead of sidebar', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/blog/building-portfolio-with-ai`);
      await page.waitForLoadState('networkidle');

      // Sidebar should be hidden
      const tocSidebar = await page.locator('[data-toc-sidebar]');
      const sidebarVisible = await tocSidebar.isVisible();
      if (sidebarVisible) throw new Error('TOC sidebar should be hidden on mobile');

      // Mobile button should be visible
      const tocButton = await page.locator('[data-toc-mobile-button]');
      await tocButton.waitFor({ state: 'visible', timeout: 5000 });
      const buttonVisible = await tocButton.isVisible();
      if (!buttonVisible) throw new Error('TOC mobile button not visible');
    });

    await test('Clicking mobile TOC button opens drawer', async () => {
      const tocButton = await page.locator('[data-toc-mobile-button]');
      await tocButton.click();

      const drawer = await page.locator('[data-toc-drawer]');
      await drawer.waitFor({ state: 'visible', timeout: 1000 });
      const drawerVisible = await drawer.isVisible();

      if (!drawerVisible) throw new Error('TOC drawer did not open');
    });

    await test('Mobile drawer contains TOC links', async () => {
      const drawerLinks = await page.locator('[data-toc-drawer] a');
      const count = await drawerLinks.count();

      if (count < 3) throw new Error(`Expected at least 3 links in drawer, got ${count}`);
    });

    await test('Clicking drawer link scrolls and closes drawer', async () => {
      const firstLink = await page.locator('[data-toc-drawer] a').first();
      await firstLink.click();
      await page.waitForTimeout(500);

      // Drawer should close
      const drawer = await page.locator('[data-toc-drawer]');
      const drawerVisible = await drawer.isVisible();

      if (drawerVisible) throw new Error('Drawer should close after clicking link');
    });

    // Project page TOC tests
    console.log('\n--- Project Page TOC Tests ---\n');

    await test('Project page has TOC sidebar (desktop)', async () => {
      await page.setViewportSize({ width: 1400, height: 900 });
      await page.goto(`${BASE_URL}/projects/personal-portfolio`);
      await page.waitForLoadState('networkidle');

      const tocSidebar = await page.locator('[data-toc-sidebar]');
      await tocSidebar.waitFor({ state: 'visible', timeout: 5000 });

      const isVisible = await tocSidebar.isVisible();
      if (!isVisible) throw new Error('TOC sidebar not visible on project page');
    });

  } finally {
    await browser.close();
  }

  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
