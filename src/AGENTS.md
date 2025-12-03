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
  - Photography: Light (cream #FFFBF5), amber/terracotta, sans/serif (Work Sans, Crimson Text)
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
