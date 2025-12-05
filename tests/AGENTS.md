# Development & Testing

## 1. Determining Environment

First determine if the env var `PUBLIC_ENV` is "DEV". If it is, then you are in a local environment. Else you are probably in a remote (sandboxed) environment.  

### Local Env Instructions

In a local environment, environment is mostly setup for you. You can check if a dev server is already running. If not, you can start by `npm run dev # Start dev server (http://localhost:4321)`

### Remove Env

If you're running tests in a remote or sandboxed environment (e.g., Claude Code web, Codespaces, containers) where `PUBLIC_ENV` is not `DEV`, setup environment with `SKIP_CHROMIUM_INSTALL=1 bash tests/setup-remote-e2e.sh`. 

see [SETUP-REMOTE.md](./SETUP-REMOTE.md) for detailed troubleshooting instructions including:
- Installing dependencies
- Installing Playwright/Chromium
- Starting the dev server
- Troubleshooting common issues
  - If Chromium downloads are blocked, set `SKIP_CHROMIUM_INSTALL=1` and point `PLAYWRIGHT_BROWSERS_PATH` (or `${HOME}/.cache/ms-playwright`) to a preinstalled browser.

## 2. Testing


**E2E Tests (Playwright):**
```bash
npm run test              # Run ALL tests comprehensively
npm run test:navigation   # Dual-space navigation
npm run test:responsive   # Responsive layouts
npm run test:visual       # Visual aesthetics
npm run test:filters      # Simple filter toggle (All/Street/Landscape)
npm run test:tag-and-or   # Tag filtering with AND/OR modes
npm run test:lightbox     # Lightbox open/close/navigation
npm run test:story        # Story drawer functionality
npm run test:nav-links    # Tag/album links in lightbox
npm run test:scroll       # Infinite scroll / lazy loading
npm run test:advanced-filters # 8-dimensional filter panel
npm run test:slideshow    # Slideshow mode
npm run test:albums       # Album pages functionality
npm run test:sorting      # Photo sorting
npm run test:css-leaks    # CSS rendering leak detection
npm run test:viewfinder   # Viewfinder overlay CSS functionality
```

**Headless vs headed:**
- Browsers run headed by default so you can watch interactions.
- Set `HEADLESS=true` to run all Playwright tests in headless mode. In remote envs, USE THIS. 

**Test Files:**

| File | Description | Features Tested |
|------|-------------|-----------------|
| `dual-space-navigation.spec.js` | Space toggle | Professional ↔ Photography switching |
| `photo-filter-toggle.spec.cjs` | Simple filter | All/Street/Landscape toggle |
| `responsive-design.spec.js` | Responsive layouts | Mobile/tablet/desktop, hamburger + space toggle in mobile menu |
| `visual-aesthetics.spec.js` | Design consistency | Colors, typography, themes |
| `tag-filtering-and-or.spec.cjs` | Tag filtering | AND/OR modes, tag availability, clear filters |
| `story-drawer.spec.cjs` | Story drawer | Open/close, content display, auto-close |
| `lightbox-navigation-links.spec.cjs` | Link navigation | Tag click → tag page, album click → album page |
| `infinite-scroll.spec.cjs` | Lazy loading | Initial batch, scroll loading, photo counts |
| `advanced-filters.spec.cjs` | Filter panel | All 8 dimensions, persistence, clear all |
| `slideshow-mode.spec.cjs` | Slideshow | Intervals, auto-advance, stop on close |
| `album-pages.spec.cjs` | Album pages | Listing, detail pages, album filtering |
| `sorting.spec.cjs` | Photo sorting | order_score, date sorting |
| `lightbox-interactions.spec.cjs` | Lightbox core | Open/close, navigation, metadata, keyboard (home + all-photos + all-photos after tag filter + first album + first tag pages from listings) |
| `css-rendering-leaks.spec.cjs` | CSS leak detection | Regression test for CSS code appearing as plain text before header on photography pages |
| `viewfinder-css.spec.cjs` | Viewfinder CSS | Viewfinder overlay visibility, hover effects, focus lock animation, CSS styles loading |

**Note:** Tests are run via Playwright. Ensure the dev server is running (`npm run dev`) before running tests. The Playwright runner now watches for any `✗` output or `console.error` in specs and exits non-zero so failures are visible.

## 3. Build Gotchas

1. **Image Path:** `filename` in photo frontmatter is relative to `public/photos/`
2. **EXIF:** Frontmatter is source of truth (no runtime extraction)
3. **Tags:** Case-sensitive, keep consistent (recommend lowercase)
4. **Content Collections Warning:** `src/content/loaders/` triggers auto-collection warning (safe to ignore)
5. **First Build:** May be slow due to Sharp image processing; subsequent builds use cache
