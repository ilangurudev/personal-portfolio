# Complete Testing Guide for Your Static Portfolio Site

## 1. Understanding the Testing Pyramid 🔺

Think of testing like quality control at different stages of manufacturing:

```
       /\
      /E2E\       ← Few, slow, expensive (test the whole car)
     /------\
    / INTEG \     ← Some, medium speed (test engine + transmission)
   /----------\
  /   UNIT     \  ← Many, fast, cheap (test individual parts)
 /--------------\
```

### Why This Matters for Your Site

**Unit Tests (70%)** - Test individual functions in isolation
- ✅ Perfect for: Pure functions like `getPhotoUrl()`, `formatSettings()`
- ⚡ Speed: Milliseconds
- 💰 Cost: Cheap to write and maintain

**Integration Tests (20%)** - Test how multiple pieces work together
- ✅ Perfect for: Content collections, data loaders, component rendering
- ⚡ Speed: Seconds
- 💰 Cost: Moderate

**E2E Tests (10%)** - Test the entire app like a real user
- ✅ Perfect for: Navigation, filtering, lightbox interactions (what you have now!)
- ⚡ Speed: Minutes
- 💰 Cost: Expensive (brittle, slow)

---

## 2. What You Have Now (Analysis)

Looking at your current setup:

**✅ Strengths:**
- Good E2E coverage with Playwright
- Tests cover critical user flows (navigation, filtering, responsive design)
- Tests are well-documented with clear console output

**⚠️ Gaps:**
- **No unit tests** for utility functions (`url-helper.ts:6`, `photo-helpers.ts:59`)
- **No integration tests** for content collections and data loaders
- **No component tests** for React islands
- E2E tests are "DIY" scripts (not using Playwright's built-in test runner)

**🎯 Impact on Agent Development:**
Without unit/integration tests, when an agent makes changes:
1. ❌ Can't quickly verify utility functions still work
2. ❌ Must run full E2E tests to catch simple bugs
3. ❌ Slow feedback loop (minutes instead of seconds)
4. ❌ Hard to pinpoint what broke when tests fail

---

## 3. Testing Strategy for Static Sites

### The Static Site Advantage

Your Astro site is **built once, served static**. This means:

**What you DON'T need to test:**
- ❌ API routes (you don't have a backend)
- ❌ Database queries (content is markdown files)
- ❌ Authentication flows (no login system)
- ❌ Real-time features (no WebSockets)

**What you SHOULD test:**

1. **Build-time logic** (most important!)
   - Content collection transformations
   - EXIF data extraction
   - URL generation
   - Photo filtering/sorting logic

2. **Interactive React components**
   - `InfinitePhotoGallery` virtualization
   - Filter state management
   - Lightbox interactions

3. **User experiences**
   - Navigation between spaces
   - Responsive layouts
   - Visual consistency

---

## 4. Practical Implementation Plan

Let me show you exactly what to add to your project:

### Step 1: Add Testing Tools

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Why these tools?**
- **Vitest**: Fast unit test runner (made by Vite/Astro team)
- **Testing Library**: Best practice for testing React components
- **jsdom**: Simulates a browser for component tests

### Step 2: Configure Vitest

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

Create `tests/setup.ts`:

```typescript
import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

### Step 3: Update `package.json`

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:e2e",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:e2e": "npm run test:navigation && npm run test:responsive && npm run test:visual",
    "test:navigation": "cd .claude/skills/playwright-skill && node run.js ../../../tests/e2e/dual-space-navigation.spec.js",
    // ... rest of your scripts
  }
}
```

---

## 5. Writing Your First Tests

### Example 1: Unit Test for `url-helper.ts`

Create `tests/unit/url-helper.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getPhotoUrl, getResizedPhotoUrl } from '../../src/utils/url-helper';

describe('getPhotoUrl', () => {
  const originalEnv = import.meta.env.PUBLIC_PHOTO_CDN_URL;

  afterEach(() => {
    // Restore original environment
    import.meta.env.PUBLIC_PHOTO_CDN_URL = originalEnv;
  });

  it('returns local path when CDN is not configured', () => {
    import.meta.env.PUBLIC_PHOTO_CDN_URL = '';

    const url = getPhotoUrl('street/nyc.jpg');

    expect(url).toBe('/photos/street/nyc.jpg');
  });

  it('returns CDN path when configured', () => {
    import.meta.env.PUBLIC_PHOTO_CDN_URL = 'https://cdn.example.com';

    const url = getPhotoUrl('street/nyc.jpg');

    expect(url).toBe('https://cdn.example.com/street/nyc.jpg');
  });

  it('handles leading slash in filename', () => {
    import.meta.env.PUBLIC_PHOTO_CDN_URL = 'https://cdn.example.com';

    const url = getPhotoUrl('/street/nyc.jpg');

    expect(url).toBe('https://cdn.example.com/street/nyc.jpg');
  });

  it('handles trailing slash in CDN URL', () => {
    import.meta.env.PUBLIC_PHOTO_CDN_URL = 'https://cdn.example.com/';

    const url = getPhotoUrl('street/nyc.jpg');

    expect(url).toBe('https://cdn.example.com/street/nyc.jpg');
  });
});

describe('getResizedPhotoUrl', () => {
  it('generates Cloudflare Image Resizing URL', () => {
    import.meta.env.PUBLIC_PHOTO_CDN_URL = 'https://cdn.example.com';

    const url = getResizedPhotoUrl('street/nyc.jpg', 400);

    expect(url).toBe('https://cdn.example.com/cdn-cgi/image/width=400,quality=85,format=jpg/street/nyc.jpg');
  });

  it('uses default width of 400px', () => {
    import.meta.env.PUBLIC_PHOTO_CDN_URL = 'https://cdn.example.com';

    const url = getResizedPhotoUrl('street/nyc.jpg');

    expect(url).toContain('width=400');
  });

  it('falls back to local path when CDN not configured', () => {
    import.meta.env.PUBLIC_PHOTO_CDN_URL = '';

    const url = getResizedPhotoUrl('street/nyc.jpg', 400);

    expect(url).toBe('/photos/street/nyc.jpg');
  });
});
```

**What this test does:**
- ✅ Tests all code paths (CDN vs local, slash handling)
- ✅ Runs in ~10ms
- ✅ Will catch bugs when agents modify `url-helper.ts`
- ✅ Clear assertions that document expected behavior

### Example 2: Unit Test for `photo-helpers.ts`

Create `tests/unit/photo-helpers.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { hasCompleteMetadata, formatSettings } from '../../src/utils/photo-helpers';

describe('hasCompleteMetadata', () => {
  it('returns true when all metadata is present', () => {
    const photo = {
      id: 'test/photo.jpg',
      data: {
        title: 'Sunset in NYC',
        tags: ['street', 'urban'],
        camera: 'Sony A7III',
        settings: 'f/2.8, 1/500s, ISO 400',
      },
    };

    expect(hasCompleteMetadata(photo as any)).toBe(true);
  });

  it('returns false when title is missing', () => {
    const photo = {
      id: 'test/photo.jpg',
      data: {
        title: '',
        tags: ['street'],
        camera: 'Sony A7III',
        settings: 'f/2.8, 1/500s, ISO 400',
      },
    };

    expect(hasCompleteMetadata(photo as any)).toBe(false);
  });

  it('returns false when tags array is empty', () => {
    const photo = {
      id: 'test/photo.jpg',
      data: {
        title: 'Sunset',
        tags: [],
        camera: 'Sony A7III',
        settings: 'f/2.8, 1/500s, ISO 400',
      },
    };

    expect(hasCompleteMetadata(photo as any)).toBe(false);
  });
});

describe('formatSettings', () => {
  it('returns settings string unchanged', () => {
    const result = formatSettings('f/2.8, 1/500s, ISO 400');

    expect(result).toBe('f/2.8, 1/500s, ISO 400');
  });

  it('returns placeholder when settings is undefined', () => {
    const result = formatSettings(undefined);

    expect(result).toBe('Settings unknown');
  });

  it('returns placeholder when settings is empty string', () => {
    const result = formatSettings('');

    expect(result).toBe('Settings unknown');
  });
});
```

### Example 3: Component Test for React Islands

Create `tests/component/FilteredPhotoGallery.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilteredPhotoGallery from '../../src/components/react/FilteredPhotoGallery';

describe('FilteredPhotoGallery', () => {
  const mockPhotos = [
    {
      id: 'street/nyc-1.jpg',
      data: {
        title: 'NYC Street',
        filename: 'street/nyc-1.jpg',
        tags: ['street', 'urban'],
        featured: true,
        camera: 'Sony A7III',
      },
    },
    {
      id: 'landscape/mountain.jpg',
      data: {
        title: 'Mountain View',
        filename: 'landscape/mountain.jpg',
        tags: ['landscape', 'nature'],
        featured: false,
        camera: 'Sony A7III',
      },
    },
  ];

  it('renders all photos by default', () => {
    render(<FilteredPhotoGallery photos={mockPhotos} initialFilter="all" />);

    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  it('filters photos by street tag', () => {
    const { rerender } = render(
      <FilteredPhotoGallery photos={mockPhotos} initialFilter="street" />
    );

    const visibleImages = screen.getAllByRole('img').filter(
      img => !img.closest('[style*="display: none"]')
    );

    expect(visibleImages).toHaveLength(1);
  });

  it('updates URL when filter changes', () => {
    // Mock window.history
    const pushStateSpy = vi.spyOn(window.history, 'pushState');

    render(<FilteredPhotoGallery photos={mockPhotos} initialFilter="all" />);

    const streetButton = screen.getByText('Street');
    fireEvent.click(streetButton);

    expect(pushStateSpy).toHaveBeenCalledWith(
      expect.anything(),
      '',
      expect.stringContaining('?filter=street')
    );
  });
});
```

---

## 6. Testing Best Practices for Agent-Assisted Development

### Rule 1: Write Tests Before Asking Agents to Code

**❌ Bad workflow:**
```
You: "Add a new tag filter for 'black and white' photos"
Agent: *adds feature*
You: "Test it for me"
Agent: *writes E2E test after the fact*
```

**✅ Good workflow:**
```
You: "I want to add a 'black and white' tag filter. First, write a unit test
      for a function `isBlackAndWhite(photo)` that checks if 'bw' is in tags."
Agent: *writes failing test*
You: "Now implement the function to make it pass"
Agent: *implements function, test passes*
You: "Now integrate it into FilteredPhotoGallery"
Agent: *adds UI, writes component test*
```

This is **Test-Driven Development (TDD)** - tests guide the implementation.

### Rule 2: Test Behaviors, Not Implementation

**❌ Bad test (tests implementation details):**
```typescript
it('calls fetchPhotos with correct parameters', () => {
  const spy = vi.spyOn(helpers, 'fetchPhotos');
  render(<Gallery />);
  expect(spy).toHaveBeenCalledWith({ limit: 20 });
});
```

**✅ Good test (tests user-facing behavior):**
```typescript
it('displays 20 photos on initial load', async () => {
  render(<Gallery />);
  const photos = await screen.findAllByRole('img');
  expect(photos).toHaveLength(20);
});
```

Why? If an agent refactors `fetchPhotos` → `getPhotos`, the bad test breaks even though the feature still works.

### Rule 3: Use Descriptive Test Names

**❌ Bad:**
```typescript
it('works', () => { ... });
it('test 1', () => { ... });
```

**✅ Good:**
```typescript
it('returns CDN URL when PUBLIC_PHOTO_CDN_URL is configured', () => { ... });
it('filters photos by multiple tags in AND mode', () => { ... });
```

When a test fails, you (and the agent) should immediately know what broke.

### Rule 4: Keep Tests Fast

**Speed targets:**
- Unit tests: < 50ms each
- Component tests: < 200ms each
- E2E tests: < 30s each

**How:**
- Mock external dependencies (network, filesystem)
- Don't test the same thing at multiple levels
- Run unit/component tests in parallel

### Rule 5: Test Edge Cases

For every function, test:
1. **Happy path** - normal input
2. **Edge cases** - empty strings, null, undefined, zero
3. **Boundaries** - max/min values
4. **Error cases** - invalid input

Example for `getPhotoUrl`:
```typescript
// Happy path
getPhotoUrl('street/nyc.jpg') → '/photos/street/nyc.jpg'

// Edge cases
getPhotoUrl('') → '/photos/'
getPhotoUrl('/street/nyc.jpg') → '/photos/street/nyc.jpg' (leading slash)

// Boundaries
getPhotoUrl('a'.repeat(1000)) → should handle long paths

// Error cases (if you add validation)
getPhotoUrl('../../../etc/passwd') → should reject path traversal
```

---

## 7. Modernizing Your E2E Tests

Your current E2E tests are good but use "raw" Playwright. Let's upgrade them to use Playwright Test Runner for better features:

### Before (your current approach):
```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Testing...');
  await page.goto('http://localhost:4321');

  const title = await page.title();
  console.log(`✓ Page loaded: ${title}`);

  await browser.close();
})();
```

**Problems:**
- ❌ Manual browser lifecycle management
- ❌ No test isolation (one failure stops everything)
- ❌ No parallel execution
- ❌ No built-in screenshots/videos on failure
- ❌ Hard to debug

### After (Playwright Test Runner):
```typescript
import { test, expect } from '@playwright/test';

test.describe('Dual-Space Navigation', () => {
  test('professional homepage shows terminal theme', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Guru Ilangovan/);
    await expect(page.locator('body.blog-space')).toBeVisible();
    await expect(page.locator('.command-prompt')).toBeVisible();
  });

  test('photography space shows editorial theme', async ({ page }) => {
    await page.goto('/photography');

    await expect(page.locator('body.photo-space')).toBeVisible();
    await expect(page.locator('.hero-title')).toBeVisible();
  });

  test('space toggle navigates between themes', async ({ page }) => {
    await page.goto('/');

    await page.locator('.space-toggle a').first().click();
    await expect(page).toHaveURL(/\/photography/);

    await page.locator('.space-toggle a').first().click();
    await expect(page).toHaveURL(/^\/$/);
  });
});
```

**Benefits:**
- ✅ Automatic browser management
- ✅ Each test is isolated (failure doesn't stop others)
- ✅ Runs tests in parallel (3-5x faster)
- ✅ Auto-captures screenshots/videos on failure
- ✅ Better error messages
- ✅ Retry flaky tests automatically

### Setup Playwright Test Runner

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
```

Update `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

---

## 8. Complete Testing Workflow

Here's your end-to-end testing process:

### Development Loop

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run unit tests in watch mode
npm run test:unit:watch

# Make changes to code...
# Tests automatically re-run ✅
```

### Pre-Commit Checks

```bash
# Run all tests before committing
npm test

# This runs:
# 1. Unit tests (~5 seconds)
# 2. Component tests (~10 seconds)
# 3. E2E tests (~60 seconds)
```

### CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 9. Testing Checklist for New Features

When you ask an agent to add a feature, use this checklist:

### ✅ Before Coding
- [ ] Write failing unit test for core logic
- [ ] Write failing component test (if UI change)
- [ ] Run tests to confirm they fail

### ✅ During Coding
- [ ] Implement feature to make tests pass
- [ ] Run tests in watch mode for fast feedback
- [ ] Refactor if needed (tests prevent breaking changes)

### ✅ After Coding
- [ ] Add E2E test for critical user flow (if needed)
- [ ] Run full test suite: `npm test`
- [ ] Check coverage: `npm run test:unit -- --coverage`
- [ ] Review test output for brittleness

### ✅ Agent Instructions Template

When asking agents to implement features, use:

```
I want to add [feature description].

1. First, write unit tests for these functions:
   - [function1]: should handle [case1], [case2]
   - [function2]: should handle [edge case]

2. Then implement the functions to make tests pass.

3. Finally, write a component test that verifies:
   - [user behavior 1]
   - [user behavior 2]

Run all tests before showing me the code.
```

---

## 10. Recommended Test Coverage Targets

For sustainable agent-assisted development:

**Must Test (100% coverage):**
- ✅ Pure utility functions (`url-helper.ts`, `photo-helpers.ts`)
- ✅ Content collection schemas
- ✅ Data transformation logic (EXIF augmentation)

**Should Test (80% coverage):**
- ✅ React components with state (`FilteredPhotoGallery`, `InfinitePhotoGallery`)
- ✅ Complex UI interactions (filtering, sorting, lightbox)

**Optional (E2E only):**
- ❌ Static pages (blog posts, project pages)
- ❌ Simple presentational components
- ❌ CSS/styling (use visual regression instead)

### Check Coverage

```bash
npm run test:unit -- --coverage

# Output:
# File                | % Stmts | % Branch | % Funcs | % Lines
# --------------------|---------|----------|---------|--------
# url-helper.ts       |   100   |   100    |   100   |   100
# photo-helpers.ts    |   85    |   90     |   100   |   85
```

**Aim for:**
- Overall: 70%+ coverage
- Utilities: 90%+ coverage
- Components: 60%+ coverage

---

## 11. Common Pitfalls to Avoid

### ❌ Pitfall 1: Over-testing
```typescript
// Don't test framework code
it('React renders component', () => {
  const { container } = render(<Gallery />);
  expect(container).toBeTruthy(); // ❌ Useless test
});
```

### ❌ Pitfall 2: Testing Implementation Details
```typescript
// Don't test internal state
it('sets loading state to true', () => {
  const { result } = renderHook(() => usePhotos());
  expect(result.current.loading).toBe(true); // ❌ Brittle
});

// Test user-observable behavior instead
it('shows loading spinner while fetching', () => {
  render(<Gallery />);
  expect(screen.getByText('Loading...')).toBeInTheDocument(); // ✅
});
```

### ❌ Pitfall 3: Flaky E2E Tests
```typescript
// Don't use arbitrary waits
await page.waitForTimeout(1000); // ❌ Flaky

// Wait for specific conditions
await page.waitForSelector('.photo-card'); // ✅
await expect(page.locator('.photo-card')).toBeVisible(); // ✅
```

### ❌ Pitfall 4: Not Cleaning Up
```typescript
// Clean up after tests
afterEach(() => {
  localStorage.clear(); // ✅
  cleanup(); // ✅
});
```

---

## 12. Action Plan: What to Implement First

Based on your codebase, here's the priority order:

### Week 1: Foundation (Unit Tests)
1. ✅ Set up Vitest + Testing Library
2. ✅ Test `url-helper.ts` (2 functions, ~10 test cases)
3. ✅ Test `photo-helpers.ts` (5 functions, ~15 test cases)
4. ✅ Add `npm run test:unit` to your workflow

**Impact:** Fast feedback, catches 60% of bugs

### Week 2: Components (Integration Tests)
1. ✅ Test `FilteredPhotoGallery` filtering logic
2. ✅ Test `InfinitePhotoGallery` virtualization
3. ✅ Mock photo data with test fixtures

**Impact:** Catches UI bugs before E2E

### Week 3: E2E Modernization
1. ✅ Migrate E2E tests to Playwright Test Runner
2. ✅ Add parallel execution
3. ✅ Set up screenshot/video capture on failure

**Impact:** Faster, more reliable E2E tests

### Week 4: CI/CD
1. ✅ Add GitHub Actions workflow
2. ✅ Run tests on every PR
3. ✅ Block merges if tests fail

**Impact:** Prevents regressions from reaching production

---

## 13. Resources for Learning More

### Beginner-Friendly
- [Vitest Guide](https://vitest.dev/guide/) - Official docs
- [Testing Library Philosophy](https://testing-library.com/docs/guiding-principles/) - Best practices
- [Playwright Tutorial](https://playwright.dev/docs/intro) - E2E testing

### Advanced
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html) - TDD explained
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications) - Testing strategy

---

## 14. Summary: Why This Matters

**Without robust tests:**
- 🔴 Agent changes break existing features silently
- 🔴 You manually test every page after changes
- 🔴 Bugs discovered in production
- 🔴 Fear of refactoring leads to tech debt

**With robust tests:**
- 🟢 Agent changes are validated in seconds
- 🟢 Automated testing saves hours per feature
- 🟢 Bugs caught before git commit
- 🟢 Confident refactoring improves code quality

**ROI Calculation:**
- Initial setup: ~8 hours
- Ongoing maintenance: ~15% extra time per feature
- **Time saved: 2-3 hours per week** (no manual testing)
- **Bugs prevented: ~80%** (caught before production)

---

## Next Steps

Ready to implement? Follow the setup in Section 4, then start with Week 1 of the Action Plan (Section 12).

Questions? Refer to the resources in Section 13 or check existing tests in the `tests/e2e/` directory for examples.

Happy testing! 🧪
