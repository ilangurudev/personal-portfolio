const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.TEST_URL || 'http://127.0.0.1:4321';
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ colorScheme: 'light', reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(`${base}/photography`);
    const toggle = page.getByRole('button', { name: 'Dark mode', exact: true });
    await toggle.waitFor({ timeout: 5000 });
    assert.equal(await toggle.getAttribute('aria-pressed'), 'false');
    await toggle.focus();
    await page.keyboard.press('Enter');
    assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
    await page.waitForFunction(() => getComputedStyle(document.body).backgroundColor === 'rgb(28, 27, 25)');
    const contrast = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      const luminance = token => {
        const hex = style.getPropertyValue(token).trim().slice(1);
        const channels = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
          .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
        return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
      };
      return ['--ink', '--muted', '--signal'].map(token => (luminance(token) + .05) / (luminance('--paper') + .05));
    });
    assert(contrast.every(ratio => ratio >= 4.5), `Dark typography contrast: ${contrast}`);
    const otherTab = await context.newPage();
    await otherTab.goto(base + '/photography/albums');
    await otherTab.getByRole('button', { name: 'Dark mode', exact: true }).click();
    await page.waitForFunction(() => document.documentElement.dataset.photoTheme === 'light');
    await otherTab.getByRole('button', { name: 'Dark mode', exact: true }).click();
    await page.waitForFunction(() => document.documentElement.dataset.photoTheme === 'dark');
    await otherTab.close();
    await page.reload();
    assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
    for (const path of ['/photography/albums', '/photography/photos', '/photography/search', '/photography/tags', '/photography/album/puerto-rico-2025', '/photography/tag/street%20photography']) {
      await page.goto(base + path);
      assert.equal(await toggle.getAttribute('aria-pressed'), 'true', path);
      assert.equal(await page.evaluate(() => document.documentElement.dataset.photoTheme), 'dark');
    }
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await toggle.isVisible());
    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-pressed'), 'false');
    await page.goto(base + '/');
    assert.equal(await page.locator('[data-photo-theme-toggle]').count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.photoTheme), undefined);
    const system = await browser.newContext({ colorScheme: 'dark' });
    const automatic = await system.newPage();
    await automatic.goto(base + '/photography');
    assert.equal(await automatic.evaluate(() => document.documentElement.dataset.photoTheme), 'dark');
    await automatic.emulateMedia({ colorScheme: 'light' });
    await automatic.waitForFunction(() => document.documentElement.dataset.photoTheme === 'light');
    await automatic.getByRole('button', { name: 'Dark mode', exact: true }).click();
    await automatic.emulateMedia({ colorScheme: 'dark' });
    await automatic.emulateMedia({ colorScheme: 'light' });
    assert.equal(await automatic.evaluate(() => document.documentElement.dataset.photoTheme), 'dark', 'Explicit preference wins over system');
    await system.close();
    const noJS = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'dark' });
    const staticPage = await noJS.newPage();
    await staticPage.goto(base + '/photography');
    assert.equal(await staticPage.locator('[data-photo-theme-toggle]').isVisible(), false);
    assert.equal(await staticPage.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(238, 234, 226)');
    await noJS.close();
    const blocked = await browser.newContext({ colorScheme: 'dark' });
    await blocked.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('Blocked'); } }); });
    const fallback = await blocked.newPage();
    await fallback.goto(base + '/photography');
    await fallback.getByRole('button', { name: 'Dark mode', exact: true }).click();
    assert.equal(await fallback.evaluate(() => document.documentElement.dataset.photoTheme), 'light');
    console.log('Photography theme: keyboard, mobile, persistence, routes, system changes, storage fallback and space isolation passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
