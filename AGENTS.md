# AGENTS.md - Personal Portfolio Documentation

**Owner:** Guru Ilangovan (AI/LLM Engineer, Photographer)

## Quick Reference Index

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Configuration](#2-tech-stack--configuration)
3. [Architecture & Design Patterns](#3-architecture--design-patterns)
4. [Content Structure](#4-content-structure)
5. [Key Features](#5-key-features)
6. [Workflows](#6-workflows)
7. [Helper Functions & Utilities](#7-helper-functions--utilities)
8. [Development & Testing](#8-development--testing)

---

## 1. Project Overview

**Concept:** Dual-space portfolio showcasing two distinct identities:
- **Professional Space** (`/`): AI blog, learnings, projects - terminal "hacker" aesthetic
- **Photography Space** (`/photography/*`): Street/landscape portfolio - bright editorial aesthetic

**Design Philosophy:**
- Complete separation of aesthetics (no mixing)
- Content-driven architecture (Markdown + Zod schemas)
- Progressive enhancement (SSR with React islands for interactivity)
- Performance-first (infinite scroll, CDN, image optimization)

---

## 2. Tech Stack & Configuration

### Core Technologies
- **Framework:** Astro 5.x (static site generator)
- **Styling:** Tailwind CSS 4.x (via `@tailwindcss/vite`)
- **Interactivity:** React 18.x (islands architecture via `@astrojs/react`)
- **Content:** Astro Content Collections with Zod schemas
- **Images:** Sharp (via Astro `<Image>`) + exifr (EXIF extraction)
- **Cloud Storage:** Cloudflare R2 (S3-compatible) with Image Resizing
- **Testing:** Playwright (E2E)
- **Deployment:** Netlify

### Key Configuration Files

**`astro.config.mjs`:**
```javascript
integrations: [react()]
vite: { plugins: [tailwindcss()] }
```

**`src/content/config.ts`:**
- Defines 4 collections: `albums`, `photos`, `blog`, `projects`
- Zod schemas enforce type safety and structure
- See [Content Structure](#4-content-structure) for schemas

**Environment Variables:**
- `PUBLIC_PHOTO_CDN_URL` - Cloudflare R2 public URL for photo CDN
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` - R2 upload credentials
- `PUBLIC_ENV` - Environment indicator (DEV/PROD) for debug features

---

## 3. Architecture & Design Patterns

### Content-Driven Architecture
- **Source of Truth:** Markdown frontmatter (stored in Git)
- **Build-Time Augmentation:** EXIF data merged from frontmatter (no runtime extraction)
- **Type Safety:** Zod schemas validate all content at build time
- **Static Generation:** All routes pre-rendered via `getStaticPaths()`

### Hybrid Rendering Model
- **Server-Rendered:** Astro generates static HTML
- **Client Islands:** React components hydrate on-demand (`client:load`)
- **Progressive Loading:** InfinitePhotoGallery uses Intersection Observer for virtualization
- **Event Communication:** CustomEvents bridge vanilla JS ↔ React (e.g., filter changes)

### Two-Theme System
- **Completely Separate Design Systems:**
  - Professional: Dark (slate-950), terminal-green/cyan/yellow, monospace (JetBrains Mono)
  - Photography: Light (cream #FFFBF5), amber/terracotta, sans/serif (Work Sans, Crimson Text)
- **Space Toggle:** In-header navigation switches between `/` ↔ `/photography`
- **No Cross-Contamination:** Each layout defines its own CSS variables and theme

### Performance Patterns
- **Infinite Scroll:** Batch loading (20 photos/batch) via Intersection Observer
- **Responsive Column Grid:** Max 3 columns, adapts to viewport (300px min column width)
- **CDN + Resizing:** Thumbnails use Cloudflare `/cdn-cgi/image/width=400,quality=85,format=jpg/`
- **Image Preloading:** Lightbox preloads adjacent photos for smooth navigation
- **LocalStorage:** Filter panel collapse state persists across sessions

### State Management
- **React State:** Component-local via `useState` (tags, filters, visible count)
- **Global Lightbox:** Singleton instance exposed on `window.photoLightbox`
- **CustomEvents:** `tagFilterChange` event syncs vanilla JS filters → React gallery
- **URL State:** No client-side routing; all navigation is server-side

---

## 4. Content Structure

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
  order: number;           // Manual ordering (lower = first, default: 0)
}
```
**Sorting:** Featured → Order (asc) → Date (desc)

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

---

## 5. Key Features

### 5.1 Advanced Photo Filtering (`/photography/photos`)

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

### 5.2 Photo Lightbox

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

### 5.3 Album-Specific Tag Filtering

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

### 5.4 Infinite Scroll Gallery

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

### 5.5 CDN & Image Optimization

**Cloudflare R2 Integration:**
- Original photos stored in R2 bucket
- `PUBLIC_PHOTO_CDN_URL` env var points to R2 public URL
- Fallback to local `public/photos/` in development

**Image Resizing:**
```javascript
// Thumbnail URL (via Cloudflare Image Resizing)
${CDN_URL}/cdn-cgi/image/width=400,quality=85,format=jpg/${filename}

// Full-size URL (original)
${CDN_URL}/${filename}
```

**Helper Functions:**
- `getPhotoUrl(filename)` - Full-size photo URL
- `getResizedPhotoUrl(filename, width=400)` - Thumbnail URL with auto-resizing

**Benefits:**
- Reduced bandwidth (thumbnails are ~90% smaller)
- Faster page loads
- On-demand resizing (no build-time image processing)

### 5.6 Dual-Space Toggle

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

### 5.7 Image Protection

**Both layouts implement:**
- Disable right-click context menu on images
- Disable drag-and-drop (`draggable="false"`)
- iOS touch-callout prevention
- MutationObserver to catch dynamically added images

**Purpose:** Discourage casual image downloading (not foolproof, but adds friction).

### 5.8 Responsive Design

**Breakpoints:**
- Desktop: > 768px
- Tablet/Mobile: ≤ 768px
- Small Mobile: ≤ 480px

**Mobile Optimizations:**
- **Grid:** 3 columns → 1 column
- **Filter Panel:** Sidebar → Fixed overlay drawer
- **Lightbox:** Compact metadata with "See more" toggle
- **Navigation:** Hamburger menu with slide-out drawer
- **Touch Gestures:** Swipe navigation in lightbox
- **Typography:** Reduced font sizes for readability

---

## 6. Workflows

### 6.1 Photo Import Workflow

**Purpose:** Import photos, extract EXIF/IPTC, create batch metadata file for review.

**Command:**
```bash
npm run import ~/path/to/photos
# Example: npm run import ~/Desktop/tokyo-nights
```

**Process:**
1. **Album Slug Extraction:** Last path component becomes album slug (e.g., `tokyo-nights`)
2. **Interactive CLI:** `import-ui.js` prompts for album details (optional)
3. **Photo Copy:** Copies photos to `public/photos/{album-slug}/`
4. **EXIF Extraction:** Reads EXIF/IPTC data (camera, settings, GPS, keywords, dates)
5. **R2 Upload:** Optionally uploads to Cloudflare R2 (if credentials configured)
6. **Batch File Creation:** Creates `batch-import-{album-slug}.md` with all metadata

**Batch File Format:**
```markdown
---
title: "Photo Title (from EXIF or filename)"
album: "tokyo-nights"
filename: "tokyo-nights/DSC09500.jpg"
tags: ["street", "night", "tokyo"]  # from IPTC keywords
date: 2024-11-15T18:30:00Z
camera: "Sony A7 IV"
settings: "f/2.8, 1/250s, ISO 400"
focalLength: 35
location: "Shibuya, Tokyo"  # from GPS coords
position: "middle"
featured: false
---
```

**User Tasks (Before Committing):**
1. **Review Batch File:** Check titles, tags, descriptions
2. **Refine Titles:** Replace generic filenames with descriptive titles
3. **Add/Edit Tags:** Ensure tags are meaningful and consistent
4. **Set Featured:** Mark 1-3 best photos as `featured: true`
5. **Adjust Position:** For portraits or specific crops, set `position: top|middle|bottom`
6. **Add Descriptions:** Optional body content for photo stories

**Next Steps:**
1. Create album metadata: `src/content/albums/{album-slug}.md`
2. Split batch file into individual `.md` files in `src/content/photos/{album-slug}/`
3. Delete batch file: `rm batch-import-{album-slug}.md`
4. Validate: `node scripts/validate-metadata.js {album-slug}`
5. Build: `npm run build` (augments any missing EXIF data)

### 6.2 Photo Removal Workflow

**Purpose:** Remove photos or entire albums safely (deletes files + metadata).

**Commands:**
```bash
# Preview deletions (dry-run)
npm run remove -- --album pacific-northwest --dry-run

# Force-delete album (no prompt)
npm run remove -- --album pacific-northwest --yes

# Remove single photo by metadata slug
npm run remove -- --photo new-york/AR53764

# Remove single photo by source filename
npm run remove -- --photo new-york/_AR53764.jpg
```

**Process:**
1. **Identifies Files:** Photo file, metadata, batch files
2. **Deletes:** Removes all matching files
3. **Cleanup:** Auto-removes empty directories
4. **Album Cleanup:** If last photo deleted, removes album metadata too

**Dry-Run Output:**
```
🗑️ Would delete:
  - public/photos/pacific-northwest/DSC09500.jpg
  - src/content/photos/pacific-northwest/DSC09500.md
```

### 6.3 Blog Post Workflow

**Process:**
1. **Create File:** `src/content/blog/{slug}.md`
2. **Frontmatter:**
   ```yaml
   ---
   title: "Understanding LLM Agents"
   description: "A deep dive into agentic workflows."
   date: 2024-11-28
   tags: ["ai", "llm", "engineering"]
   isNotebook: false
   ---
   ```
3. **Content:** Write markdown content below frontmatter
4. **Build:** `npm run build` generates static page at `/blog/{slug}`

**Jupyter Notebooks:**
1. Export notebook to Markdown
2. Place in `src/content/blog/`
3. Set `isNotebook: true` in frontmatter
4. `BlogLayout` applies special CSS for notebook code cells/outputs
5. Save images to `public/images/blog/{slug}/` and update markdown links

### 6.4 Project Workflow

**Process:**
1. **Create File:** `src/content/projects/{slug}.md`
2. **Frontmatter:**
   ```yaml
   ---
   title: "Project Name"
   description: "Brief description"
   date: 2024-11-28
   tags: ["astro", "typescript", "ai"]
   image: "/projects/project-name.png"
   link: "https://example.com"
   repo: "https://github.com/user/repo"
   featured: true
   ---
   ```
3. **Image:** Place screenshot in `public/projects/`
4. **Content:** Write markdown content below frontmatter
5. **Build:** `npm run build` generates static page at `/projects/{slug}`

---

## 7. Helper Functions & Utilities

### 7.1 Photo Helpers (`src/utils/photo-helpers.ts`)

**CRITICAL:** Always use these helpers instead of raw `getCollection('photos')` to ensure EXIF data is available.

```typescript
// Get all photos with EXIF augmented
const photos = await getPhotosWithExif();

// Get single photo by ID
const photo = await getPhotoWithExif('tokyo-nights/shibuya');

// Get photos from specific album
const albumPhotos = await getAlbumPhotosWithExif('tokyo-nights');

// Get featured photos only
const featured = await getFeaturedPhotosWithExif();

// Check if photo has complete metadata
const isComplete = hasCompleteMetadata(photo);

// Format settings for display
const formattedSettings = formatSettings(photo.data.settings);
```

**Why?** EXIF data is stored in frontmatter (not extracted at runtime). Helpers ensure data is always present and properly merged.

### 7.2 URL Helpers (`src/utils/url-helper.ts`)

```typescript
// Get full-size photo URL (CDN or local)
const url = getPhotoUrl('tokyo-nights/DSC09500.jpg');
// → https://cdn.example.com/tokyo-nights/DSC09500.jpg (prod)
// → /photos/tokyo-nights/DSC09500.jpg (dev)

// Get resized thumbnail URL (Cloudflare Image Resizing)
const thumbUrl = getResizedPhotoUrl('tokyo-nights/DSC09500.jpg', 400);
// → https://cdn.example.com/cdn-cgi/image/width=400,quality=85,format=jpg/tokyo-nights/DSC09500.jpg
```

**Use Cases:**
- `getPhotoUrl()` - Lightbox full-size images
- `getResizedPhotoUrl()` - Grid thumbnails, cards, previews

### 7.3 EXIF Augmenter (`src/content/loaders/exif-augmenter.ts`)

**Note:** Mostly deprecated. EXIF data is now stored in frontmatter during import.

**Purpose:** Originally extracted EXIF at build time. Now simply returns photos as-is (frontmatter is source of truth).

**Still Contains:** Extraction logic for reference if needed.

---

## 8. Development & Testing

### 8.1 Development Commands

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

### 8.2 Testing

**E2E Tests (Playwright):**
```bash
npm run test              # All tests
npm run test:navigation   # Navigation only
npm run test:responsive   # Responsive only
npm run test:visual       # Visual only
```

**Test Files:**
- `tests/e2e/dual-space-navigation.spec.js` - Space toggle functionality
- `tests/e2e/responsive-design.spec.js` - Mobile/desktop layouts
- `tests/e2e/gallery-navigation.spec.js` - Photo gallery interactions
- `tests/e2e/visual-aesthetics.spec.js` - Design consistency

**Note:** Test files may not exist yet - tests are run via Playwright skill.

### 8.3 Build Gotchas

1. **Image Path:** `filename` in photo frontmatter is relative to `public/photos/`
2. **EXIF:** Frontmatter is source of truth (no runtime extraction)
3. **Tags:** Case-sensitive, keep consistent (recommend lowercase)
4. **Content Collections Warning:** `src/content/loaders/` triggers auto-collection warning (safe to ignore)
5. **First Build:** May be slow due to Sharp image processing; subsequent builds use cache

### 8.4 File Organization

**Directory Structure:**
```
personal-portfolio/
├── src/
│   ├── pages/              # Astro route pages
│   │   ├── index.astro     # Professional homepage
│   │   ├── about.astro     # About page
│   │   ├── blog/           # Blog routes
│   │   ├── projects/       # Project routes
│   │   └── photography/    # Photography routes
│   ├── layouts/            # Layout templates
│   │   ├── BlogLayout.astro      # Professional space layout
│   │   ├── PhotoLayout.astro     # Photography space layout
│   │   └── GalleryLayout.astro   # Fullscreen viewing (unused)
│   ├── components/
│   │   ├── react/          # React components (galleries, filters)
│   │   └── photo/          # Photo-specific Astro components
│   ├── content/            # Content collections
│   │   ├── albums/         # Album metadata
│   │   ├── photos/         # Photo metadata (by album)
│   │   ├── blog/           # Blog posts
│   │   ├── projects/       # Project showcases
│   │   └── config.ts       # Zod schemas
│   ├── utils/              # Helper functions
│   └── styles/             # Global CSS
├── public/                 # Static assets
│   ├── photos/             # Photo files (by album)
│   └── projects/           # Project screenshots
├── scripts/                # Import/management scripts
└── tests/                  # Playwright E2E tests
```

### 8.5 Routing

**Professional Space:**
```
/                          → Homepage (dashboard)
/about                     → About page
/blog                      → Blog index
/blog/{slug}              → Individual blog post
/projects                  → Projects index
/projects/{slug}          → Individual project
```

**Photography Space:**
```
/photography              → Photography homepage (featured photos)
/photography/photos       → All photos with advanced filtering
/photography/albums       → All albums grid view
/photography/album/{slug} → Individual album with tag filtering
/photography/tags         → All tags index
/photography/tag/{tag}    → Photos filtered by tag
```

---

## Key Takeaways

**What Makes This Portfolio Special:**
1. **Dual-Space Design:** Completely separate professional (terminal) and personal (editorial) aesthetics
2. **Advanced Filtering:** 8-dimension photo filtering with real-time updates and tag logic modes
3. **Rich Lightbox:** Full EXIF metadata display, slideshow, keyboard/touch navigation
4. **EXIF Integration:** Automatic extraction and storage during import workflow
5. **CDN-Ready:** Cloudflare R2 + Image Resizing for production performance
6. **Developer Experience:** Import scripts, validation tools, batch editing workflow
7. **Performance:** Infinite scroll, virtualization, progressive loading, resized thumbnails
8. **Type Safety:** Zod schemas + TypeScript for content validation
9. **Responsive:** Mobile-first with touch gestures and adaptive layouts
10. **Islands Architecture:** React components only where needed (optimal performance)

**When Adding Features:**
- Use `getPhotosWithExif()` for photo queries (not `getCollection('photos')`)
- Use `getPhotoUrl()` for full-size, `getResizedPhotoUrl()` for thumbnails
- Update Zod schemas in `src/content/config.ts` if adding frontmatter fields
- Maintain separation between Professional/Photography design systems
- Use React islands for interactivity, Astro for static content
- Test mobile responsiveness (breakpoint: 768px)
- Consider CDN implications (image URLs may be remote)
