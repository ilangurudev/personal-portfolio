/**
 * Photography About anchor navigation regression.
 *
 * Delays homepage photographs so the test exercises the real failure mode:
 * the About hash is resolved before lazy images above it have loaded. Once the
 * images arrive, the biography must remain in the viewport.
 */

const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://127.0.0.1:4321';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  let releaseImages;
  let imageSequence = 0;
  const imageGate = new Promise(resolve => {
    releaseImages = resolve;
  });

  await page.route('**/*', async route => {
    const request = route.request();
    if (request.resourceType() !== 'image' || !request.url().includes('/cdn-cgi/image/')) {
      await route.continue();
      return;
    }

    await imageGate;
    const sequence = imageSequence++;
    await new Promise(resolve => setTimeout(resolve, sequence * 75));
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1000"></svg>',
    });
  });

  console.log('Testing About navigation while homepage photographs load...');

  await page.goto(`${TARGET_URL}/photography`, { waitUntil: 'domcontentloaded' });
  await page.locator('.desktop-nav a', { hasText: 'About' }).click();
  assert(new URL(page.url()).hash === '#about', 'About navigation must target #about.');

  releaseImages();
  await page.waitForTimeout(2500);

  const destination = await page.locator('[data-home-about]').evaluate(section => {
    const heading = section.querySelector('h2');
    const sectionRect = section.getBoundingClientRect();
    const headingRect = heading?.getBoundingClientRect();
    return {
      sectionTop: sectionRect.top,
      headingTop: headingRect?.top ?? Number.POSITIVE_INFINITY,
      viewportHeight: window.innerHeight,
    };
  });

  assert(
    destination.sectionTop < destination.viewportHeight * 0.25
      && destination.headingTop < destination.viewportHeight,
    `About moved out of view after photographs loaded: ${JSON.stringify(destination)}`,
  );

  console.log('About navigation remains anchored to the biography.');
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exit(1);
});
