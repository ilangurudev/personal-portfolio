/** Visual-system regression tests for the intentionally separate portfolio spaces. */
const { chromium } = require('playwright');
const TARGET_URL = process.env.TEST_URL || 'http://127.0.0.1:4321';
const assert = (condition, message) => { if (!condition) throw new Error(message); };

(async () => {
  const browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  console.log('Testing the dual-space visual systems...');

  await page.goto(TARGET_URL);
  await page.waitForLoadState('networkidle');
  const professional = await page.locator('body.blog-space').evaluate(el => ({ background: getComputedStyle(el).backgroundColor, font: getComputedStyle(el).fontFamily }));
  assert(professional.background.includes('2, 6, 23'), 'Professional space lost its dark terminal surface.');
  assert(professional.font.includes('JetBrains'), 'Professional space lost its monospace voice.');

  await page.goto(`${TARGET_URL}/photography`);
  await page.waitForLoadState('networkidle');
  const photography = await page.locator('body.photo-space').evaluate(el => ({ background: getComputedStyle(el).backgroundColor, font: getComputedStyle(el).fontFamily }));
  const hero = await page.locator('[data-home-hero] h1').evaluate(el => ({ font: getComputedStyle(el).fontFamily, color: getComputedStyle(el).color }));
  const signal = await page.locator('[data-home-hero] h1 em').evaluate(el => getComputedStyle(el).color);
  assert(photography.background.includes('238, 234, 226'), 'Photography space lost its warm paper surface.');
  assert(photography.font.includes('Manrope'), 'Photography UI typeface is not active.');
  assert(hero.font.includes('Instrument Serif'), 'Photography display typeface is not active.');
  assert(signal.includes('255, 104, 72') || signal.includes('240, 74, 36'), 'Signal-orange accent is missing.');

  console.log('Dual-space visual-system tests passed.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
