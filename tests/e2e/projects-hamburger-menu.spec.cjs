/**
 * Projects Page Hamburger Menu Test
 *
 * Tests that the hamburger menu works correctly on the projects page on mobile.
 * This is a regression test for a bug where the hamburger menu didn't work on the projects page.
 */

const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:4321';

const HAMBURGER_SELECTORS = {
  button: '#blog-hamburger-btn',
  menu: '#blog-mobile-menu',
  close: '#blog-mobile-menu-close',
  overlay: '#blog-mobile-menu-overlay'
};

(async () => {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS === 'true',
    slowMo: 100
  });
  const page = await browser.newPage();

  console.log('🧪 Testing Projects Page Hamburger Menu on Mobile...\n');

  // Set mobile viewport
  await page.setViewportSize({
    width: 375,
    height: 667
  });

  // Navigate to projects page
  await page.goto(`${TARGET_URL}/projects`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // Let animations settle

  console.log('📍 Testing /projects page on mobile');

  // Test 1: Hamburger button should be visible
  const hamburgerBtn = page.locator(HAMBURGER_SELECTORS.button);
  const isVisible = await hamburgerBtn.isVisible();
  if (!isVisible) {
    throw new Error('❌ Hamburger button is not visible on mobile');
  }
  console.log('   ✓ Hamburger button is visible');

  // Test 2: Mobile menu should not be active initially
  const mobileMenu = page.locator(HAMBURGER_SELECTORS.menu);
  const isActiveInitially = await mobileMenu.evaluate((el) => el.classList.contains('active'));
  if (isActiveInitially) {
    throw new Error('❌ Mobile menu should not be active initially');
  }
  console.log('   ✓ Mobile menu is not active initially');

  // Test 3: Click hamburger button to open menu
  try {
    await hamburgerBtn.click({ timeout: 5000 });
    await page.waitForSelector(`${HAMBURGER_SELECTORS.menu}.active`, { timeout: 5000 });
    console.log('   ✓ Hamburger menu opens when button is clicked');
  } catch (error) {
    throw new Error(`❌ Failed to open hamburger menu: ${error.message}`);
  }

  // Test 4: Menu should have the active class
  const isActiveAfterClick = await mobileMenu.evaluate((el) => el.classList.contains('active'));
  if (!isActiveAfterClick) {
    throw new Error('❌ Mobile menu should have active class after click');
  }
  console.log('   ✓ Mobile menu has active class');

  // Test 5: Close button should close the menu
  try {
    const closeBtn = page.locator(HAMBURGER_SELECTORS.close);
    await closeBtn.click({ timeout: 5000 });
    await page.waitForFunction(
      (menuSelector) => !document.querySelector(menuSelector)?.classList.contains('active'),
      HAMBURGER_SELECTORS.menu,
      { timeout: 5000 }
    );
    console.log('   ✓ Close button closes the menu');
  } catch (error) {
    throw new Error(`❌ Failed to close menu with close button: ${error.message}`);
  }

  // Test 6: Overlay should close the menu
  await hamburgerBtn.click({ timeout: 5000 });
  await page.waitForSelector(`${HAMBURGER_SELECTORS.menu}.active`, { timeout: 5000 });

  try {
    const overlay = page.locator(HAMBURGER_SELECTORS.overlay);
    await overlay.click({ timeout: 5000, force: true });
    await page.waitForFunction(
      (menuSelector) => !document.querySelector(menuSelector)?.classList.contains('active'),
      HAMBURGER_SELECTORS.menu,
      { timeout: 5000 }
    );
    console.log('   ✓ Clicking overlay closes the menu');
  } catch (error) {
    throw new Error(`❌ Failed to close menu by clicking overlay: ${error.message}`);
  }

  // Test 7: Escape key should close the menu
  await hamburgerBtn.click({ timeout: 5000 });
  await page.waitForSelector(`${HAMBURGER_SELECTORS.menu}.active`, { timeout: 5000 });

  try {
    await page.keyboard.press('Escape');
    await page.waitForFunction(
      (menuSelector) => !document.querySelector(menuSelector)?.classList.contains('active'),
      HAMBURGER_SELECTORS.menu,
      { timeout: 5000 }
    );
    console.log('   ✓ Escape key closes the menu');
  } catch (error) {
    throw new Error(`❌ Failed to close menu with Escape key: ${error.message}`);
  }

  console.log('\n✅ All projects page hamburger menu tests passed!\n');

  await browser.close();
})();
