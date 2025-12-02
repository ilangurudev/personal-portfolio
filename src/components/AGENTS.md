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

## 2. Photo Lightbox

**Full-Featured Image Viewer** with rich metadata and navigation.

**Features:**
- **Navigation:**
  - Keyboard: Arrow keys (prev/next), Escape (close)
  - Touch: Swipe gestures for mobile
  - Mouse: Click arrows or outside to close
- **Shutter Animation:** Film-style opening animation
- **Preloading:** Adjacent photos pre-fetched for instant navigation
- **Slideshow Mode:** Configurable intervals (1s, 3s, 5s, 10s, 60s, off)
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

**Purpose:** Discourage casual image downloading (not foolproof, but adds friction).
