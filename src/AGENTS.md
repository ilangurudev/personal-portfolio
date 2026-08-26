# Source Code Documentation

## 1. Architecture & Design Patterns

### High-Level Data Flow

```ascii
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Markdown Files  │      │ Zod Validation  │      │ Astro Pages     │
│ (frontmatter)   │ ───► │ (config.ts)     │ ───► │ (SSG HTML)      │
└─────────────────┘      └─────────────────┘      └────────┬────────┘
                                                           │
                                                           ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Browser (DOM)   │ ◄─── │ React Islands   │ ◄─── │ Client Hydration│
│ (Interactivity) │      │ (Components)    │      │ (JS Bundle)     │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### Core Data Pipeline
1. **Content Authoring:** User creates Markdown files in `src/content/`.
2. **Build Validation:** `src/content/config.ts` validates frontmatter against Zod schemas.
3. **Static Generation:** Astro pages (e.g., `photos.astro`) query collections via `getCollection()`.
4. **HTML Rendering:** Server renders static HTML for SEO and initial load.
5. **Hydration:** Interactive islands (Gallery, Lightbox) hydrate on the client.

### Hybrid Rendering Model
- **Server-Rendered:** Astro generates static HTML
- **Client Islands:** React components hydrate on-demand (`client:load`)
- **Progressive Loading:** InfinitePhotoGallery uses Intersection Observer for virtualization
- **Event Communication:** CustomEvents bridge vanilla JS ↔ React (e.g., filter changes)

### Two-Theme System
- **Completely Separate Design Systems:**
  - Professional: Dark (slate-950), terminal-green/cyan/yellow, monospace (JetBrains Mono)
  - Photography: Warm paper/near-black editorial system with signal-orange accents, Instrument Serif display type, and Manrope UI type
- **Space Toggle:** In-header navigation switches between `/` ↔ `/photography`
- **No Cross-Contamination:** Each layout defines its own CSS variables and theme

### Key Patterns

#### Server + Client Communication (Custom Events)
**Problem:** Tag buttons are static HTML (vanilla JS) but need to update the React gallery.
**Solution:** Use the `EventTarget` API.
1. **Dispatch:** Vanilla JS fires `window.dispatchEvent(new CustomEvent('tagFilterChange', ...))`
2. **Listen:** React component uses `useEffect` to listen: `window.addEventListener('tagFilterChange', ...)`
3. **Contract:** See [`src/components/AGENTS.md`](src/components/AGENTS.md#integration-contracts) for the exact event payload and global function signatures.

#### Tag Filter Implementation
1. **User Interaction:** Click tag -> URL hash updates (optional) -> Event dispatched.
2. **Filtering Logic:** `FilteredPhotoGallery.tsx` maintains a list of active photos.
3. **Memoization:** `useMemo` recalculates the visible list only when tags or photos change.
4. **Rendering:** The virtualized grid receives the new list and updates the DOM efficiently.
5. **Shared helpers:** Client tag normalization/filtering/availability (and `setupTagLogicToggle` for the OR/AND buttons) live in `src/utils/client/tag-utils.ts`; inline scripts should omit `type="module"` so Astro/Vite rewrites the imports, and use relative paths (e.g., `../../utils/client/tag-utils`) instead of `/src/...` which 404s after build.

### Performance Patterns
- **Infinite Scroll:** Archive grids load in 20-photo batches; desktop stories extend the target count to the end of the next planned row so already-rendered rows never split or reflow.
- **Stable Story Reflow:** Desktop album and photography tag-detail stories begin from a date-only source sequence (album-configured direction; tag pages newest first), then apply a deterministic editorial spacing pass: `featured: true` photos become full-width anchors, support photos are reserved and moved across an anchor boundary when needed, and every pair of anchors is separated by a complete support row. Featured and support photos each retain their own relative order. Supporting row sizes (two to four) vary on refresh without changing the planned photo sequence. Source aspect ratios determine support-row column widths, so full photographs remain visible directly on the page with no cover crop, matte, or fixed-height frame. Full-width anchors use the original photo URL; support rows use 900px derivatives. Smaller viewports and non-story galleries keep the natural row-major grid.
- **CDN + Resizing:** Thumbnails use Cloudflare `/cdn-cgi/image/width=400,quality=85,format=jpg/`
- **Image Preloading:** Lightbox preloads adjacent photos for smooth navigation
- **LocalStorage:** Filter panel collapse state persists across sessions

### State Management
- **React State:** Component-local via `useState` (tags, filters, visible count)
- **Global Lightbox:** Singleton instance exposed on `window.photoLightbox`
- **CustomEvents:** `tagFilterChange` event syncs vanilla JS filters → React gallery
- **URL State:** No client-side routing; all navigation is server-side

### Environment Configuration
- **`PUBLIC_PHOTO_CDN_URL`**: Base URL for Cloudflare R2 + Image Resizing (e.g., `https://photos.example.com`). If unset, falls back to local `/photos/`.
- **`R2_ACCOUNT_ID`**: Cloudflare Account ID for upload scripts.
- **Note:** See `.env.example` for setup.

## 2. Content Structure

### Collections Overview

| Collection | Location | Schema | Purpose |
|------------|----------|--------|---------|
| `albums` | `src/content/albums/` | Album metadata | Organize photos by theme/location/date |
| `photos` | `src/content/photos/{album}/` | Photo metadata + EXIF | Individual photo records |
| `blog` | `src/content/blog/` | Blog post content | Articles, learnings, notebooks |
| `projects` | `src/content/projects/` | Project showcases | Portfolio work |

### Detailed Schemas

#### `albums` Collection
```typescript
{
  title: string;           // Display name
  description: string;     // Short description for cards
  coverPhoto: string;      // Path: "{album-slug}/{photo}.jpg"
  date: Date;              // Album date (for sorting)
  featured: boolean;       // Show first in listings (default: false)
  order_score: number;     // Manual ordering (higher = first, default: 0)
  dateSortOrder: 'asc' | 'desc'; // Photo date sorting within album (default: 'asc')
}
```
**Sorting:** Featured → Order Score (desc) → Date (desc)
**Photo Sorting Within Album:** Date only (configurable via `dateSortOrder`, default: `asc`) establishes the story source. `featured` controls visual emphasis rather than source order; the story planner may make bounded local sequencing exceptions to keep anchors separated.

#### `photos` Collection
```typescript
{
  // Manual fields (edit in frontmatter)
  title: string;                    // Descriptive title
  album: string;                    // Album slug (must match folder)
  filename: string;                 // Path: "{album-slug}/{photo}.jpg"
  tags: string[];                   // Searchable tags
  featured: boolean;                // Show on /photography homepage (default: false)
  location?: string;                // Location description
  position: 'top'|'middle'|'bottom'; // Crop position for grid (default: 'middle')
  order_score: number;              // Custom sort order (higher = first, default: 0)

  // Technical fields (stored in frontmatter during import)
  date: Date;                       // Photo date (from EXIF DateTimeOriginal)
  camera?: string;                  // Camera model (from EXIF Make + Model)
  settings?: string;                // "f/2.8, 1/250s, ISO 400"
  focalLength?: number;             // Focal length in mm
}
```
**CRITICAL:** Frontmatter values override EXIF. Always use `getPhotosWithExif()` helper to ensure EXIF is available.

#### `blog` Collection
```typescript
{
  title: string;           // Post title
  description: string;     // SEO description
  date: Date;              // Publication date
  tags: string[];          // Categorization tags
  isNotebook: boolean;     // Jupyter notebook import flag (default: false)
}
```
**Special:** `about.md` is excluded from blog index listings.

**Homepage Display:** Shows 5 most recent posts (excluding `about.md`), sorted by date desc.

#### `projects` Collection
```typescript
{
  title: string;           // Project name
  description: string;     // Short description
  date: Date;              // Project date
  tags: string[];          // Technology tags
  image?: string;          // Screenshot path (in public/)
  link?: string;           // Live demo URL
  repo?: string;           // GitHub repo URL
  featured: boolean;       // Featured projects appear first (default: false)
}
```
**Homepage Display:** Shows 5 projects, featured first (with ★ indicator), then by date desc.

### Professional Tags Pages
- **Routes:** `/tags` (cloud) and `/tags/[tag]` (detail).
- **Data:** Aggregates tags across `blog` (excluding `about`) and `projects` using `src/utils/professional-tags.ts`.
- **Behavior:** Tag cloud scales font size by usage; hover reveals total item count. Detail pages show a single unified grid of posts/projects (type pill + title + description + date + tags), sorted by date descending with no separate sections.

### Search
- **Routes:** `/search` (Professional) and `/photography/search` (Photography).
- **Logic:** `src/utils/search.ts` searches both frontmatter and markdown body fields. Professional space covers `blog` (excludes `about.md`) + `projects`; photography covers `photos` (EXIF/frontmatter + body) and `albums`.
- **Live Results:** Inputs are debounced (~180ms) and fetch results as you type; URL `?q` param stays in sync for reload/sharing.
- **Shortcut:** Cmd/Ctrl + K focuses the search input if present or navigates to the space’s search page (wired in `BlogLayout.astro` and `PhotoLayout.astro`).
- **Autofocus:** Search pages auto-focus/select the input on load so the caret/keyboard is ready immediately after shortcut navigation (desktop + mobile).
- **Nav:** Desktop + mobile menus in both layouts include a Search item for quick access.
- **Tags:** Search result tags are normalized to lowercase and clamped to two rows with an ellipsis when overflowed (both spaces).
- **Photography ordering:** Search results show albums first (with an album pill). Photo results are ordered by `order_score` (desc) → relevance to the query (desc) → date (desc); photo cards omit a type pill.
- **Photography photo titles:** Photo search cards show the album name with a folder icon (links to album) instead of the photo filename/title to reduce noise.
- **Photography album cards:** Album search results render the album description/snippet with a 2-line clamp + ellipsis to match the album listing cards.
- **Photography lightbox:** Photo results now hydrate the global lightbox; clicking a photo card opens the lightbox instead of navigating away (links still work as a no-JS fallback).

### Photography Information Architecture
- **`/photography`:** A fixed, manually sequenced 20-frame edit from `src/data/photo-curation.ts`; the work appears before biography or utility UI. A separate hero image opens the page and must never repeat in the edit.
- **Homepage motion:** `/photography` progressively enhances that fixed edit with a subtle desktop hero settle, a three-group signature reveal for the opening **Motion** chapter, and quieter one-shot reveals thereafter. It never pins, locks, or hijacks vertical scrolling. Mobile omits hero parallax and simplifies reveal distance; reduced-motion and no-`IntersectionObserver` environments receive the complete static edit immediately.
- **`/photography/albums`:** Editorially presented as **Stories**, with six featured bodies of work followed by the complete notebook archive.
- **`/photography/tags`:** A small public-facing set of eight themes. It intentionally does not expose the full internal keyword taxonomy.
- **`/photography/tag/[tag]`:** A newest-first editorial story for the selected theme. It uses the same featured-anchor/support-row planner and lightbox order as album stories while retaining progressive loading and tag refinement.
- **`/photography/photos`:** The complete searchable/filterable **Archive**, where technical discovery tools belong.
- **Album detail:** Opens with a full-bleed story cover and short editorial statement, then reveals the filterable notebook.
- **Curation rule:** Do not derive the homepage from `featured`, timestamps, or score. Choose `HERO_PHOTO` separately, keep it out of the edit, and author desktop rhythm through `CURATED_EDIT_GROUPS`. Feature groups are full-width anchors; pair groups are aligned equal-width rows, with both frame numbers using the same photo-edge spacing and the right-hand number contained by the center gutter. `CURATED_EDIT_IDS` is derived from those groups.
- **Taxonomy rule:** Frontmatter tags are lowercase and correctly spelled; omit unknown locations rather than storing invalid coordinate placeholders.
