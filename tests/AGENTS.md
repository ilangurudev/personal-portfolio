# Development & Testing

## 1. Development Commands

```bash
npm run dev            # Start dev server (http://localhost:4321)
npm run build          # Production build
npm run preview        # Preview production build
npm run import         # Import photos (see workflow)
npm run remove         # Remove photos/albums (see workflow)
npm run copy-exif      # Migrate EXIF to frontmatter (deprecated)
npm run fix-frontmatter # Fix type issues in frontmatter (deprecated)
npm run sync_keywords  # Sync IPTC keywords to tags (deprecated)
```

## 2. Testing

**Unit & Component Tests (Vitest):**
```bash
npm run test:unit        # Run the full Vitest suite once
npm run test:unit:watch  # Watch mode during development
```

- `tests/unit/` – Pure utilities (e.g., homepage data shaping)
- `tests/integration/` – Cross-file logic (blog metadata + static paths)
- `tests/component/` – DOM behaviors (BlogLayout interactions, etc.)

**E2E Tests (Playwright):**
```bash
npm run test              # Unit + E2E suites
npm run test:e2e          # Playwright-only aggregate
npm run test:navigation   # Navigation only
npm run test:responsive   # Responsive only
npm run test:visual       # Visual only
```

**Test Files:**
- `tests/e2e/dual-space-navigation.spec.js` - Space toggle functionality
- `tests/e2e/gallery-navigation.spec.js` - Photo gallery interactions
- `tests/e2e/photo-filter-toggle.spec.cjs` - Filter logic and UI states
- `tests/e2e/responsive-design.spec.js` - Mobile/desktop layouts
- `tests/e2e/visual-aesthetics.spec.js` - Design consistency

**Note:** Tests are run via Playwright. Ensure the dev server is running or use `npm run test` which handles startup.

## 3. Build Gotchas

1. **Image Path:** `filename` in photo frontmatter is relative to `public/photos/`
2. **EXIF:** Frontmatter is source of truth (no runtime extraction)
3. **Tags:** Case-sensitive, keep consistent (recommend lowercase)
4. **Content Collections Warning:** `src/content/loaders/` triggers auto-collection warning (safe to ignore)
5. **First Build:** May be slow due to Sharp image processing; subsequent builds use cache
