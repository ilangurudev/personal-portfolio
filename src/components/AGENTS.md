# Component Documentation

## 1. Advanced Photo Filtering (`/photography/photos`)

**Most Complex Feature** - 8-dimensional filtering system with real-time updates.

**Filter Dimensions:**
1. **Tags** - Multi-select with AND/OR logic toggle
2. **Albums** - Multi-select checkbox filter
3. **Cameras** - Filter by camera model
4. **Date Range** - Min/max date pickers
5. **Aperture** - Dual-range slider (f-stop)
6. **Shutter Speed** - Dual-range slider (seconds)
7. **ISO** - Dual-range slider
8. **Focal Length** - Dual-range slider (mm)

**UI Behavior:**
- **Collapsible Panel:** Remembers state via `localStorage`
- **Close Button:** Dismisses filter drawer (added PR #32)
- **Filter Count Badge:** Shows active filter count
- **Mobile:** Filter panel becomes fixed overlay with floating toggle button
- **Real-Time Updates:** Filters update gallery + lightbox instantly via CustomEvents

**Tag Logic Toggle:**
- **OR Mode:** Show photos with ANY selected tag (default)
- **AND Mode:** Show photos with ALL selected tags
- **Tag Availability:** In AND mode, unavailable tags (0 results) are hidden

**Architecture:**
- **State:** Vanilla JS manages filter UI state
- **Filtering:** React `FilteredPhotoGallery` component listens via `tagFilterChange` event
- **Lightbox Sync:** `window.updateLightboxFromFilter()` updates lightbox photos array

## 2. Integration Contracts

### Event Bus: `tagFilterChange`
**Source:** Vanilla JS (Filter UI)
**Target:** React (`FilteredPhotoGallery`)
**Payload:**
```typescript
{
  detail: {
    activeTags: string[]; // Lowercase, trimmed (e.g., ["street", "night"])
    tagLogic: 'and' | 'or';
  }
}
```

### Global Dependencies
The "Islands" architecture relies on these window-scoped globals to glue separate components together:

1.  **`window.photoLightbox`**:
    -   **Type:** `PhotoLightbox` class instance
    -   **Source:** `src/components/photo/PhotoLightbox.astro` (inline script)
    -   **Usage:** Singleton controller for the fullscreen image viewer.

2.  **`window.updateLightboxFromFilter(photos)`**:
    -   **Type:** `(photos: LightboxPhoto[]) => void`
    -   **Source:** `setupLightboxSync()` in `src/utils/client/lightbox-sync`
    -   **Usage:** Called by React components to sync the lightbox state when the visible grid changes.
    -   **Helper:** `setupLightboxSync` wires the global updater and optional callbacks for page-specific UI (e.g., tag page count/title). `pushFilteredPhotosToLightbox` lets React components trigger the sync without touching `window` directly.

## 3. Photo Lightbox

**Full-Featured Image Viewer** with rich metadata and navigation.

**Features:**
- **Navigation:**
  - Keyboard: Arrow keys (prev/next), Escape (close)
  - Touch: Swipe gestures for mobile
  - Mouse: Click arrows or outside to close
- **Scroll Lock:** Disables page scrolling while the lightbox is open and restores it on close
- **Shutter Animation:** Film-style opening animation
- **Preloading:** Adjacent photos pre-fetched for instant navigation
- **Slideshow Mode:** Configurable intervals (1s, 3s, 5s, 10s, 60s, off)
- **Story Drawer (New):**
  - Book icon button appears only when photo has content in markdown body
  - Click to reveal frosted slide-up drawer with photo description/story
  - Smooth slide-up animation with backdrop blur
  - Auto-closes when navigating to next/previous photo
  - Scrollable for longer content (max 70vh on desktop, 60vh on mobile)
  - Close button or click outside to dismiss
  - Content formatted as paragraphs (splits on `\n\n`)
  - Positioned to left of slideshow button
- **Metadata Display:**
  - Album name (clickable link)
  - Tags (clickable links to tag pages)
  - Camera model
  - Settings (aperture, shutter, ISO)
  - Focal length (with icon)
  - Location (with icon)
  - Film counter: "5 / 42"
- **Mobile Optimizations:**
  - Portrait orientation detection
  - Expandable metadata ("See more" button)
  - Touch-optimized controls

**Architecture:**
- Singleton class: `PhotoLightbox` (Astro component with inline `<script>`)
- Global instance: `window.photoLightbox`
- Photo updates: `updatePhotos(newPhotos)` method for filter sync
- Viewfinder effect: SVG corners with "focus lock" animation on open
- Story content: Reads `body` field from photo markdown files

## 3. Album-Specific Tag Filtering

Individual album pages (`/photography/album/{slug}`) have simplified tag filtering:

**Features:**
- Expandable tag filter bar (toggle button: "Refine by tags")
- AND/OR logic toggle
- Tag availability filtering (in AND mode, hide tags that result in 0 photos)
- Clear filters button
- Uses same `FilteredPhotoGallery` component as all-photos page

**Difference from All-Photos:**
- Fewer filter dimensions (tags only, no camera/EXIF filters)
- Filters only within current album's photos
- Simpler UI (no side panel, inline filter bar)

## 4. Infinite Scroll Gallery

**Component:** `InfinitePhotoGallery.tsx` (React)

**Architecture:**
- **Responsive Grid:** 1-3 columns (max 3), calculated from container width
- **Batch Loading:** Initial 20 photos, loads +20 per scroll
- **Intersection Observer:** Sentinel element triggers loading (200px root margin)
- **Aspect Ratio:** 3:2 for all thumbnails
- **Crop Position:** Customizable per photo (`top`, `middle`, `bottom`)
- **Viewfinder Overlay:** SVG corners appear on hover
- **Memory Optimization:** Uses resized thumbnails (400px width) via `getResizedPhotoUrl()`

**Performance:**
- Only renders visible photos + buffer
- Prevents full-resolution image loading until lightbox
- Smooth scroll with progressive rendering

## 5. Dual-Space Toggle

**Seamless Navigation** between Professional ↔ Photography spaces.

**Professional Space Toggle:**
- Rectangular button in header
- Label: "Photography" or similar
- Links to `/photography`

**Photography Space Toggle:**
- Pill-style rounded button in header
- Label: "Professional" or similar
- Links to `/`

**Mobile:**
- Included in hamburger menu
- Slide-out drawer animation
- Touch-optimized tap targets

## 6. Image Protection

**Both layouts implement:**
- Disable right-click context menu on images
- Disable drag-and-drop (`draggable="false"`)
- iOS touch-callout prevention
- MutationObserver to catch dynamically added images
- React galleries also set `draggable={false}` on `<img>` (e.g., `InfinitePhotoGallery`) to keep hydration in sync with the layout script that marks images undraggable at runtime.

**Purpose:** Discourage casual image downloading (not foolproof, but adds friction).

## 7. Static Components

### `PhotoAbout.astro`
- **Location:** `src/components/photo/PhotoAbout.astro`
- **Purpose:** "About Me" section on the photography homepage.
- **Features:**
  - Sticky sidebar with avatar and social links
  - Responsive grid layout (sidebar + content)
  - Gear list and philosophy text
  - Styled with photography theme variables (Crimson Text, Work Sans)

### `ViewfinderSVG` (Astro + React)
- **Locations:** `src/components/photo/ViewfinderSVG.astro`, `src/components/react/ViewfinderSVG.tsx`
- **Purpose:** Single source of truth for the viewfinder corner overlay SVG used on photo cards (server-rendered grids and the React infinite gallery).
- **Usage:** Import in Astro pages/components for markup; the all-photos page also consumes it via a `<template id="viewfinder-template">` for JS-inserted cards to avoid duplicated SVG strings.

### `TagFilterBar.astro`
- **Location:** `src/components/photo/TagFilterBar.astro`
- **Purpose:** Shared, collapsible tag filter bar for album + tag pages (pills + AND/OR toggle).
- **Behavior:** Uses `setupTagLogicToggle` from `src/utils/client/tag-utils` for DRY toggle handling, dispatches `tagFilterChange` on pill or mode changes, manages tag availability in AND mode, and optionally locks an initial tag (for tag pages) while keeping the clear button state in sync.
- **Props:** `tags: string[]`, `photos: { data: { tags: string[] } }[]`, `initialActiveTag?: string` (preselect + cannot fully clear when provided).

### `TagPills.astro`
- **Location:** `src/components/TagPills.astro`
- **Purpose:** Reusable tag chip renderer for the professional space (blog + projects).
- **Behavior:** Renders clickable pills linking to `/tags/{tag}`, with terminal-theme hover states. Accepts `tags: string[]` and optional `class` for wrapper styling.

### `TableOfContents` (React)
- **Location:** `src/components/react/TableOfContents.tsx`
- **Purpose:** Floating table of contents for blog posts and project pages in the professional space.
- **Features:**
  - **Desktop:** Fixed sidebar on the left side with scroll-spy highlighting
  - **Mobile:** Floating button (bottom-left) that opens a slide-up drawer
  - Extracts h2 and h3 headings from markdown content
  - Smooth scroll navigation with URL hash updates
  - Active section highlighting via Intersection Observer
  - Terminal-style styling ("> " indicators, cyan/green colors)
  - Drawer closes on link click, escape key, or overlay click
- **Usage:** Used in `src/pages/blog/[slug].astro` and `src/pages/projects/[slug].astro` with `client:load` directive
- **Props:** `headings: { depth: number, slug: string, text: string }[]` - from Astro's `render()` function
