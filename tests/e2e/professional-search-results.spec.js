/**
 * Professional Search Results Tests
 *
 * Verifies that the professional search page returns blog + project results,
 * keeps the query in sync with the URL, renders tags/snippets, and orders by
 * recency (blog first, project second with current content set).
 */

const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:4321';
const QUERY = 'ai';

(async () => {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS === 'true',
    slowMo: 40,
  });
  const page = await browser.newPage();

  try {
    console.log('🧪 Testing professional search results...\n');

    await page.goto(`${TARGET_URL}/search`);
    await page.waitForLoadState('networkidle');

    const initialVisible = await page.locator('#empty-initial').isVisible();
    if (!initialVisible) {
      throw new Error('Initial empty state not visible');
    }
    console.log('   ✓ Initial empty state visible');

    await page.fill('input[name="q"]', QUERY);
    await page.click('#search-submit');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#results-container .search-card', { timeout: 3000 });

    const urlHasQuery = page.url().includes(`q=${QUERY}`);
    if (!urlHasQuery) {
      throw new Error('URL query param not synced with search input');
    }
    console.log('   ✓ URL query param synced');

    const cards = page.locator('#results-container .search-card');
    const cardCount = await cards.count();
    if (cardCount < 2) {
      throw new Error(`Expected at least 2 results (blog + project), found ${cardCount}`);
    }
    console.log(`   ✓ Results rendered (${cardCount})`);

    const firstType = (await cards.nth(0).locator('.type-pill').innerText()).trim().toLowerCase();
    const firstTitle = (await cards.nth(0).locator('.card-title').innerText()).trim();
    if (firstType !== 'blog') {
      throw new Error(`First result should be blog; found "${firstType}"`);
    }
    console.log(`   ✓ First result is blog: "${firstTitle}"`);

    const projectTypeCount = await cards.locator('.type-pill', { hasText: 'project' }).count();
    if (projectTypeCount === 0) {
      throw new Error('Project result not found');
    }
    console.log('   ✓ Project result present');

    const snippetText = (await cards.nth(0).locator('.snippet').innerText()).trim();
    if (!snippetText.startsWith('//')) {
      throw new Error('Snippet missing "//" prefix');
    }
    console.log('   ✓ Snippet includes comment prefix');

    const firstTag = await cards.nth(0).locator('.tag').first().innerText();
    if (!firstTag.toLowerCase().includes('#ai')) {
      throw new Error('Expected normalized #ai tag on first result');
    }
    console.log('   ✓ Tags rendered and normalized (e.g., #ai)');

    console.log('\n✅ Professional search results tests passed!\n');
    await browser.close();
  } catch (error) {
    console.error(`   ✗ ${error.message}`);
    await browser.close();
    process.exit(1);
  }
})();

