/**
 * Search Shortcut Autofocus Tests
 *
 * Verifies that Cmd/Ctrl + K navigates to each search page and focuses the input
 * so a cursor is ready (desktop) and the mobile keyboard can appear.
 */

const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:4321';
const IS_MAC = process.platform === 'darwin';
const SEARCH_SHORTCUT = IS_MAC ? 'Meta+K' : 'Control+K';

(async () => {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS === 'true',
    slowMo: 50,
  });
  const page = await browser.newPage();

  console.log('🧪 Testing search shortcut autofocus...\n');

  // Professional space shortcut
  console.log('📍 Professional space: shortcut navigates and focuses input');
  await page.goto(TARGET_URL);
  await page.waitForLoadState('networkidle');

  await Promise.all([
    page.waitForNavigation({ url: /\/search/ }),
    page.keyboard.press(SEARCH_SHORTCUT),
  ]);

  const proInput = page.locator('input[data-search-input]');
  await proInput.waitFor({ state: 'visible' });
  const proFocused = await proInput.evaluate((el) => document.activeElement === el);

  if (!proFocused) {
    console.error('   ✗ Search input not focused after shortcut in professional space');
    await browser.close();
    process.exit(1);
  }
  console.log('   ✓ Search input focused with caret ready');

  // Photography space shortcut (mobile viewport)
  console.log('\n📍 Photography space (mobile viewport): shortcut navigates and focuses input');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${TARGET_URL}/photography`);
  await page.waitForLoadState('networkidle');

  await Promise.all([
    page.waitForNavigation({ url: /\/photography\/search/ }),
    page.keyboard.press(SEARCH_SHORTCUT),
  ]);

  const photoInput = page.locator('input[data-search-input]');
  await photoInput.waitFor({ state: 'visible' });
  const photoFocused = await photoInput.evaluate((el) => document.activeElement === el);

  if (!photoFocused) {
    console.error('   ✗ Search input not focused after shortcut in photography space');
    await browser.close();
    process.exit(1);
  }
  console.log('   ✓ Photography search input focused');

  console.log('\n✅ Search shortcut autofocus tests passed!\n');

  await browser.close();
})();

