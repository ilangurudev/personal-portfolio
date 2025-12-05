# Portfolio E2E Tests

End-to-end tests for the dual-space portfolio using Playwright.

## Prerequisites

Playwright is installed in the skill directory: `.claude/skills/playwright-skill/`

## Running Tests

**Start the dev server first:**
```bash
npm run dev
```

**Run all tests:**
```bash
npm test
```

**Run individual test suites:**
```bash
# Navigation between spaces
npm run test:navigation

# Responsive design across viewports
npm run test:responsive

# Visual aesthetics verification
npm run test:visual

# Lightbox scroll lock
npm run test:lightbox-scroll
```

## Test Suites

### 1. Dual-Space Navigation (`dual-space-navigation.spec.js`)
Tests navigation between Professional and Photography spaces:
- Professional homepage loads with dark terminal theme
- Space toggle button works
- Photography homepage loads with bright editorial theme
- Can toggle back to professional space

### 2. Responsive Design (`responsive-design.spec.js`)
Tests both spaces across different viewports:
- Mobile (375x667)
- Tablet (768x1024)
- Desktop (1920x1080)

Generates screenshots in `tests/screenshots/` for visual regression.

### 3. Visual Aesthetics (`visual-aesthetics.spec.js`)
Verifies design implementation:
- Professional space: Dark background, terminal green, monospace font, scanlines
- Photography space: Cream background, serif font, editorial styling
- Color contrast between spaces

### 4. Lightbox Scroll Lock (`lightbox-scroll-lock.spec.cjs`)
Ensures page scrolling is disabled while the lightbox is open and restored after closing.

## Environment Variables

- `TEST_URL`: Override base URL (default: `http://localhost:4321`)
- `HEADLESS`: Run in headless mode (default: `false`)
- `SCREENSHOT_DIR`: Screenshot output directory (default: `./tests/screenshots`)

**Example:**
```bash
TEST_URL=http://localhost:3000 HEADLESS=true npm test
```

## CI/CD Integration

For GitHub Actions or other CI:
```bash
HEADLESS=true npm test
```

## Adding New Tests

1. Create a new spec file in `tests/e2e/`
2. Use the same structure as existing tests
3. Add npm script to `package.json`
4. Update this README

## Test Strategy

Tests follow TDD principles:
1. Write test for new feature
2. Implement feature
3. Run test to verify
4. Refactor with confidence

Keep tests focused and independent. Each test should:
- Have a clear purpose
- Be able to run standalone
- Clean up after itself
- Use descriptive console output
