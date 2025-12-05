/**
 * CSS Rendering Leaks Tests
 *
 * Regression test to catch CSS code being rendered as plain text on pages.
 * This test verifies that no CSS comments or code appear before the header
 * on photography pages.
 */

const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:4321';

// Known CSS leak patterns to detect
const CSS_LEAK_PATTERNS = [
  /\/\*.*For pages using React\/virtualized grids/i,
  /\/\*.*Photo Card Component Styles/i,
  /\.photo-card\s*\{/,
  /@import.*photo-card\.css/i,
  /\/\*.*Base photo card container/i,
];

(async () => {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS === 'true',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process'],
    slowMo: 100
  });
  const page = await browser.newPage();

  console.log('🧪 Testing CSS Rendering Leaks...\n');

  let allTestsPassed = true;

  // Test pages to check
  const testPages = [
    { name: 'Photography Home', url: '/photography' },
    { name: 'Tags Page', url: '/photography/tags' },
  ];

  // Get a sample album and tag for dynamic routes
  console.log('📍 Discovering sample album and tag...');
  await page.goto(`${TARGET_URL}/photography/albums`);
  await page.waitForLoadState('networkidle');
  
  // Get first album link
  const firstAlbumLink = await page.locator('a[href*="/photography/album/"]').first();
  const albumHref = await firstAlbumLink.getAttribute('href');
  if (albumHref) {
    const albumSlug = albumHref.split('/photography/album/')[1];
    testPages.push({ name: `Album: ${albumSlug}`, url: `/photography/album/${albumSlug}` });
  }

  // Get a sample tag
  await page.goto(`${TARGET_URL}/photography/tags`);
  await page.waitForLoadState('networkidle');
  
  const firstTagLink = await page.locator('a[href*="/photography/tag/"]').first();
  const tagHref = await firstTagLink.getAttribute('href');
  if (tagHref) {
    const tagSlug = tagHref.split('/photography/tag/')[1];
    testPages.push({ name: `Tag: ${tagSlug}`, url: `/photography/tag/${tagSlug}` });
  }

  // Test each page
  for (const testPage of testPages) {
    console.log(`\n📍 Testing: ${testPage.name}`);
    await page.goto(`${TARGET_URL}${testPage.url}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    // Get the body text content before the header
    const bodyText = await page.evaluate(() => {
      const body = document.body;
      if (!body) return '';
      
      // Get all text nodes before the header
      const header = document.querySelector('header.photo-header, header');
      if (!header) return body.textContent || '';
      
      // Get text content of all nodes before header
      let textBeforeHeader = '';
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let node;
      while (node = walker.nextNode()) {
        const parent = node.parentElement;
        if (parent && header.compareDocumentPosition(parent) & Node.DOCUMENT_POSITION_PRECEDING) {
          const text = node.textContent.trim();
          if (text) {
            textBeforeHeader += text + ' ';
          }
        }
      }
      
      return textBeforeHeader.trim();
    });

    // Check for CSS leak patterns in body text
    let hasLeak = false;
    let leakPattern = null;
    
    for (const pattern of CSS_LEAK_PATTERNS) {
      if (pattern.test(bodyText)) {
        hasLeak = true;
        leakPattern = pattern.toString();
        break;
      }
    }

    // Also check the first visible element's text content
    const firstElementText = await page.evaluate(() => {
      const body = document.body;
      if (!body || !body.firstElementChild) return '';
      
      // Get the first non-script, non-style, non-comment element
      let first = body.firstElementChild;
      while (first && (
        first.tagName === 'SCRIPT' || 
        first.tagName === 'STYLE' ||
        first.tagName === 'NOSCRIPT'
      )) {
        first = first.nextElementSibling;
      }
      
      return first ? (first.textContent || '').trim() : '';
    });

    // Check first element text for CSS leaks
    if (!hasLeak) {
      for (const pattern of CSS_LEAK_PATTERNS) {
        if (pattern.test(firstElementText)) {
          hasLeak = true;
          leakPattern = pattern.toString();
          break;
        }
      }
    }

    // Verify header is near the top (should be first visible content)
    const headerPosition = await page.evaluate(() => {
      const header = document.querySelector('header.photo-header, header');
      if (!header) return null;
      
      const rect = header.getBoundingClientRect();
      return {
        top: rect.top,
        left: rect.left,
        height: rect.height
      };
    });

    if (hasLeak) {
      console.log(`   ✗ CSS leak detected! Pattern: ${leakPattern}`);
      console.log(`   ✗ Leaked text preview: ${bodyText.substring(0, 200)}...`);
      allTestsPassed = false;
    } else {
      console.log(`   ✓ No CSS leaks detected`);
    }

    if (headerPosition) {
      // Header should be near the top (within 150px, accounting for any margin/padding)
      // If CSS leak exists, header will be pushed down, so this check helps catch leaks
      const headerNearTop = headerPosition.top >= -50 && headerPosition.top <= 150;
      if (headerNearTop) {
        console.log(`   ✓ Header positioned correctly (top: ${Math.round(headerPosition.top)}px)`);
      } else {
        console.log(`   ⚠ Header pushed down (top: ${Math.round(headerPosition.top)}px) - may indicate CSS leak`);
        // Don't fail on header position alone if we already detected a CSS leak
        if (!hasLeak) {
          allTestsPassed = false;
        }
      }
    } else {
      console.log(`   ✗ Header not found`);
      allTestsPassed = false;
    }

    // Additional check: verify no CSS comments in visible text
    const visibleText = await page.evaluate(() => {
      return document.body.innerText || '';
    });

    const hasVisibleCssComment = /\/\*.*\*\//.test(visibleText.split('\n')[0] || '');
    if (hasVisibleCssComment) {
      console.log(`   ✗ CSS comment detected in visible text`);
      allTestsPassed = false;
    }
  }

  if (allTestsPassed) {
    console.log('\n✅ CSS rendering leak tests passed!\n');
  } else {
    console.log('\n❌ CSS rendering leak tests failed!\n');
    process.exit(1);
  }

  await browser.close();
})();

