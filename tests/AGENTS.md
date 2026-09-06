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
npm test                  # Run ALL specs in parallel (new runner)
npm run test:serial       # Run ALL specs sequentially (previous flow)
npm run test:navigation   # Dual-space navigation
npm run test:responsive   # Responsive layouts
npm run test:visual       # Visual aesthetics
npm run test:filters      # Simple filter toggle (All/Street/Landscape)
npm run test:tag-and-or   # Tag filtering with AND/OR modes
npm run test:tag-story    # Newest-first editorial layout on photography tag pages
npm run test:lightbox     # Lightbox open/close/navigation
npm run test:story        # Story drawer functionality
npm run test:story-anchors # Featured anchor spacing, image sources, refresh rhythm, lightbox order
npm run test:nav-links    # Tag/album links in lightbox
npm run test:scroll       # Infinite scroll / lazy loading
npm run test:advanced-filters # 8-dimensional filter panel
npm run test:slideshow    # Slideshow mode
npm run test:albums       # Album pages functionality
npm run test:sorting      # Photo sorting
npm run test:css-leaks    # CSS rendering leak detection
npm run test:viewfinder   # Viewfinder overlay CSS functionality
npm run test:photo-hover  # Shared color-preserving frame across homepage, album, tag, and Archive photographs
npm run test:photo-editorial # Curated photography IA and editorial acceptance contract
npm run test:photo-scroll-story # Homepage motion hierarchy, reduced motion, and natural scrolling
npm run test:photo-motion # Shared motion profiles across stories, indexes, Archive, and search
npm run test:about-anchor # About hash remains stable while homepage photographs lazy-load
```

**Parallel runner options:**
- `E2E_CONCURRENCY`: Specs to run at once (defaults to CPU count; capped by spec count).
- `E2E_LOG_THROUGH=true`: Stream each spec's output live with `[spec]` prefixes.
- `HEADLESS=true`: Run browsers headless (recommended in remote/CI).
- Failures are summarized at the end with captured output for failing specs only.

**Headless vs headed:**
- Browsers run headless by default (we set `HEADLESS=true` unless overridden).
- To watch interactions locally, set `HEADLESS=false` for a single run.

**Test Files:**

| File | Description | Features Tested |
|------|-------------|-----------------|
| `photography-theme.spec.cjs` | Photography appearance | Keyboard toggle, mobile availability, persistence across all photography route types, live system preference, blocked storage, and professional-space isolation |
| `dual-space-navigation.spec.js` | Space toggle | Professional ↔ Photography switching |
| `photo-filter-toggle.spec.cjs` | Photography structure | Fixed curated edit, public themes, Archive filter availability |
| `photography-editorial-redesign.spec.cjs` | Editorial acceptance | Exact Tampa balcony hero, hero/edit uniqueness, original-resolution sources for every Edit photograph, balanced desktop groups and frame-number gutters, the 22-frame **Distance, made human.** sequence and three movements, the exact five-story feature edit and New York cover, Other Notebooks, public themes, Archive, mobile hero crop, immersive lightbox sizing, responsive margin-positioned bare navigation/close glyphs that never cover the image, a 100% magnification (2× scale) zoom toggle with matching cursors, and a single-ring information control that reveals album, tags, title, and technical metadata below the photograph |
| `photography-scroll-story.spec.cjs` | Homepage scroll story | Desktop hero settling, an individual entrance for all 22 Edit photographs, distinct motion signatures for all three story chapters, natural scrolling, reduced-motion completeness, and simplified mobile behavior |
| `photography-motion-system.spec.cjs` | Photography motion system | Row-level album/tag reveals, Stories/Themes indexes, dynamically inserted Archive/search cards, compact mobile stories, and reduced-motion completeness |
| `about-anchor-navigation.spec.cjs` | Homepage About anchor | Staggered lazy-image loading cannot push the desktop biography out of view; a clean mobile reload lands on the biography copy rather than the portrait |
| `responsive-design.spec.js` | Responsive layouts | Mobile/tablet/desktop, hamburger + space toggle in mobile menu |
| `visual-aesthetics.spec.js` | Design consistency | Colors, typography, themes |
| `search-focus-shortcut.spec.js` | Search shortcut | Cmd/Ctrl + K navigates/focuses inputs in both spaces |
| `professional-search-results.spec.js` | Professional search | Results for blog + projects, tag/snippet rendering, URL sync |
| `photography-search-results.spec.js` | Photography search | Album-first ordering, album pill on photos, lightbox opens from results |
| `tag-filtering-and-or.spec.cjs` | Tag filtering | AND/OR modes, tag availability, clear filters |
| `tag-story-layout.spec.cjs` | Photography tag story | Progressive editorial rows, featured anchors/original sources, support spacing, and full lightbox order |
| `story-drawer.spec.cjs` | Story drawer | Open/close, content display, auto-close |
| `story-drawer-album-tag.spec.cjs` | Story drawer (album/tag pages) | Finds photos with story metadata dynamically; verifies drawer on album + tag pages |
| `lightbox-navigation-links.spec.cjs` | Link navigation | Tag click → tag page, album click → album page |
| `infinite-scroll.spec.cjs` | Loading and sequence stability | Finite homepage edit, progressive Archive loading, complete planned story rows, fixed anchor order, justified row stability, refresh rhythm variation, and editorial lightbox navigation |
| `story-layout-full-scroll.spec.cjs` | Randomized story reflow | Three complete Puerto Rico refresh/scroll passes; full composition visibility, transparent wrappers, justified rows, no overlaps, stable editorial order, safe quiet solos, and footer spacing |
| `story-featured-anchors.spec.cjs` | Featured story hierarchy | Every metadata-featured photo remains a full-width original-resolution anchor, including portraits; complete support-row separation, stable anchors and lightbox order, resized supporting images, and varied rhythms over three refreshes |
| `tests/unit/story-layout-plan.test.ts` | Story planner interface | Consecutive and tail-anchor support borrowing, support-row variation without solo leftovers, and date-then-filename source ordering in both directions, independent of input order and album folder |
| `advanced-filters.spec.cjs` | Filter panel | All 8 dimensions, persistence, clear all |
| `exif-filters.spec.cjs` | EXIF sliders | Aperture/shutter/ISO sliders reduce results (regression guard) |
| `slideshow-mode.spec.cjs` | Slideshow | Intervals, auto-advance, stop on close |
| `album-pages.spec.cjs` | Album pages | Listing, detail pages, album filtering |
| `sorting.spec.cjs` | Photo sorting | order_score, date sorting |
| `project-tags-visibility.spec.cjs` | Project tags | Project list hides tags; project detail shows clickable tags to /tags/* |
| `lightbox-interactions.spec.cjs` | Lightbox core | Open/close, navigation, metadata, keyboard (home + all-photos + all-photos after tag filter + first album + first tag pages from listings) |
| `lightbox-scroll-lock.spec.cjs` | Lightbox scroll lock | Body scroll disabled while open and restored after closing |
| `css-rendering-leaks.spec.cjs` | CSS leak detection | Regression test for CSS code appearing as plain text before header on photography pages |
| `viewfinder-css.spec.cjs` | Composition preservation | Responsive photo-card rendering, lazy loading, and the homepage Edit's color-preserving signal-orange hover/focus frame |
| `photography-hover-affordance.spec.cjs` | Cross-gallery photo affordance | Album stories, tag stories, and Archive cards share the 2px-offset signal-orange hover frame without changing image color or geometry |
| `toc-navigation.spec.cjs` | TOC Navigation | Desktop sidebar visibility, mobile drawer, link clicking, scroll highlighting |

**Note:** Tests are run via Playwright. Ensure the dev server is running (`npm run dev`) before running tests. The Playwright runner now watches for any `✗` output or `console.error` in specs and exits non-zero so failures are visible.

`tests/unit/vegas-capture-dates.test.ts` verifies all 169 Las Vegas timestamps retain the recorded timezone and that the Hoover Dam/casino sequence survives the camera filename counter rollover, including the editorial layout pass.

## 3. Build Gotchas

1. **Image Path:** `filename` in photo frontmatter is relative to `public/photos/`
2. **EXIF:** Frontmatter is source of truth (no runtime extraction)
3. **Tags:** Case-sensitive, keep consistent (recommend lowercase)
4. **Content Collections Warning:** `src/content/loaders/` triggers auto-collection warning (safe to ignore)
5. **First Build:** May be slow due to Sharp image processing; subsequent builds use cache
