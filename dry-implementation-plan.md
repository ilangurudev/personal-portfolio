# DRY Refactoring Implementation Plan

## Executive Summary

This document outlines a comprehensive plan to eliminate code duplication (DRY violations) across the photography section of the portfolio. The analysis identified **50+ instances** of duplicated code across **6+ files**, including repeated functions, CSS styles, HTML markup, and business logic.

**Estimated Impact:**
- ~400 lines of duplicated code eliminated
- Single-point-of-change for sorting, filtering, and styling logic
- Reduced maintenance burden and bug surface area

---

## Table of Contents

1. [High Severity Violations](#1-high-severity-violations)
2. [Medium Severity Violations](#2-medium-severity-violations)
3. [Low Severity Violations](#3-low-severity-violations)
4. [Implementation Plan](#4-implementation-plan)
5. [File-by-File Impact](#5-file-by-file-impact)
6. [Testing Strategy](#6-testing-strategy)

---

## 1. High Severity Violations

### 1.1 Photo Sorting Logic (5 locations) — **Done**

**Problem:** Identical sorting logic duplicated across 5 locations.

**Files Affected:**
| File | Lines | Context |
|------|-------|---------|
| `src/pages/photography/index.astro` | 14-23 | Featured photos |
| `src/pages/photography/photos.astro` | 13-22 | All photos |
| `src/pages/photography/album/[slug].astro` | 20-29 | Album photos |
| `src/pages/photography/tag/[tag].astro` | 39-46 | All photos (availability) |
| `src/pages/photography/tag/[tag].astro` | 60-69 | Filtered photos (**redundant!**) |

**Duplicated Code:**
```typescript
const sortedPhotos = photos.sort((a, b) => {
  const scoreA = a.data.order_score ?? 0;
  const scoreB = b.data.order_score ?? 0;
  if (scoreB !== scoreA) {
    return scoreB - scoreA;
  }
  return b.data.date.getTime() - a.data.date.getTime();
});
```

**Solution:** Add `sortPhotos()` to `src/utils/photo-helpers.ts`

```typescript
export function sortPhotos<T extends { data: { order_score?: number; date: Date } }>(
  photos: T[]
): T[] {
  return [...photos].sort((a, b) => {
    const scoreA = a.data.order_score ?? 0;
    const scoreB = b.data.order_score ?? 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return b.data.date.getTime() - a.data.date.getTime();
  });
}
```

---

### 1.2 Album Sorting Logic (1 location, different pattern) — **Done**

**File:** `src/pages/photography/albums.astro` (lines 7-19)

**Code:**
```typescript
const sortedAlbums = albums.sort((a, b) => {
  if (a.data.featured && !b.data.featured) return -1;
  if (!a.data.featured && b.data.featured) return 1;
  if (a.data.order_score !== b.data.order_score) {
    return b.data.order_score - a.data.order_score;
  }
  return b.data.date.getTime() - a.data.date.getTime();
});
```

**Solution:** Add `sortAlbums()` to `src/utils/photo-helpers.ts`

```typescript
export function sortAlbums<T extends { data: { featured?: boolean; order_score: number; date: Date } }>(
  albums: T[]
): T[] {
  return [...albums].sort((a, b) => {
    if (a.data.featured && !b.data.featured) return -1;
    if (!a.data.featured && b.data.featured) return 1;
    if (a.data.order_score !== b.data.order_score) return b.data.order_score - a.data.order_score;
    return b.data.date.getTime() - a.data.date.getTime();
  });
}
```

---

### 1.3 `normalizeTag()` Function (5 locations) — **Done**

**Problem:** Tag normalization function defined separately in each file.

**Files Affected:**
| File | Lines | Type |
|------|-------|------|
| `src/pages/photography/index.astro` | 131-134 | Client JS |
| `src/pages/photography/photos.astro` | 532-535 | Client JS |
| `src/pages/photography/album/[slug].astro` | 477 | Client JS |
| `src/pages/photography/tag/[tag].astro` | 534-537 | Client JS |
| `src/components/react/FilteredPhotoGallery.tsx` | 35 | React |

**Duplicated Code:**
```javascript
function normalizeTag(tag) {
  if (!tag) return '';
  return String(tag).toLowerCase().trim();
}
```

**Solution:** Create shared client utility `src/utils/client/tag-utils.ts`

```typescript
export const normalizeTag = (tag?: string | null): string =>
  String(tag ?? '').toLowerCase().trim();
```

---

### 1.4 `parseSettings()` EXIF Parser (4 locations) — **Partially Done** (server shared; client in `photos.astro` still duplicates parser)

**Problem:** EXIF parsing logic duplicated in server and client code.

**Files Affected:**
| File | Lines | Type |
|------|-------|------|
| `src/pages/photography/photos.astro` | 63-93 | Server TS |
| `src/pages/photography/photos.astro` | 538-563 | Client JS |

**Duplicated Code (~30 lines each):**
```typescript
function parseSettings(settings?: string): { aperture?: number; shutterSpeed?: number; iso?: number } {
  if (!settings) return {};
  const result = {};

  const apertureMatch = settings.match(/f\/([\d.]+)/);
  if (apertureMatch) result.aperture = parseFloat(apertureMatch[1]);

  const shutterMatch = settings.match(/(\d+)\/(\d+)s|(\d+(?:\.\d+)?)s/);
  if (shutterMatch) {
    if (shutterMatch[1] && shutterMatch[2]) {
      result.shutterSpeed = parseInt(shutterMatch[1]) / parseInt(shutterMatch[2]);
    } else if (shutterMatch[3]) {
      result.shutterSpeed = parseFloat(shutterMatch[3]);
    }
  }

  const isoMatch = settings.match(/ISO\s*(\d+)/);
  if (isoMatch) result.iso = parseInt(isoMatch[1]);

  return result;
}
```

**Solution:** Add to `src/utils/photo-helpers.ts` (isomorphic)

```typescript
export interface ParsedExifSettings {
  aperture?: number;
  shutterSpeed?: number;
  iso?: number;
}

export function parseSettings(settings?: string): ParsedExifSettings {
  if (!settings) return {};
  // ... implementation
}
```

---

### 1.5 Tag Extraction/Counting Logic (4 locations) — **Done**

**Problem:** Similar tag collection patterns across pages.

**Files Affected:**
| File | Lines | Purpose |
|------|-------|---------|
| `src/pages/photography/photos.astro` | 30-44 | Tags with counts, sorted by count |
| `src/pages/photography/album/[slug].astro` | 32-42 | Album tags, sorted alphabetically |
| `src/pages/photography/tag/[tag].astro` | 48-55 | All tags, sorted alphabetically |
| `src/pages/photography/tags.astro` | 7-43 | Tags with counts for display |

**Solution:** Add `extractTags()` to `src/utils/photo-helpers.ts`

```typescript
export interface TagExtractionOptions {
  withCounts?: boolean;
  sortBy?: 'alpha' | 'count';
}

export interface ExtractedTag {
  tag: string;
  count: number;
}

export function extractTags(
  photos: Photo[],
  options: TagExtractionOptions = {}
): ExtractedTag[] {
  const { withCounts = true, sortBy = 'count' } = options;

  const tagCounts = new Map<string, number>();
  photos.forEach(photo => {
    photo.data.tags.forEach(tag => {
      if (tag) {
        const normalized = tag.toLowerCase().trim();
        tagCounts.set(normalized, (tagCounts.get(normalized) || 0) + 1);
      }
    });
  });

  const tags = Array.from(tagCounts.entries()).map(([tag, count]) => ({ tag, count }));

  if (sortBy === 'count') {
    tags.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  } else {
    tags.sort((a, b) => a.tag.localeCompare(b.tag));
  }

  return tags;
}
```

---

### 1.6 Photo Card CSS Styles (4 locations) — **Done**

**Problem:** ~80 lines of identical CSS repeated in each photography page.

**Files Affected:**
| File | Lines | Note |
|------|-------|------|
| `src/pages/photography/index.astro` | 365-449 | Scoped styles |
| `src/pages/photography/photos.astro` | 1594-1677 | `:global()` styles |
| `src/pages/photography/album/[slug].astro` | 339-425 | `:global()` styles |
| `src/pages/photography/tag/[tag].astro` | 372-462 | `:global()` styles |

**Duplicated Styles:**
```css
.photo-card { /* ~15 lines */ }
.photo-card:hover { /* ~3 lines */ }
.photo-image { /* ~6 lines */ }
.photo-image img { /* ~5 lines */ }
.photo-card:hover .photo-image img { /* ~1 line */ }
.viewfinder-overlay { /* ~12 lines */ }
.photo-card:hover .viewfinder-overlay { /* ~1 line */ }
.viewfinder-corners { /* ~7 lines */ }
.viewfinder-corners.focus-locked { /* ~4 lines */ }
@keyframes viewfinderFocus { /* ~10 lines */ }
```

**Solution:** Create `src/styles/photo-card.css`

```css
/* Photo Card Component Styles */
.photo-card {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-radius: 4px;
  overflow: hidden;
  background: var(--cream-dark);
  cursor: crosshair;
  position: relative;
}
/* ... rest of styles */
```

Then import in each page:
```astro
<style>
  @import '../styles/photo-card.css';
  /* Page-specific overrides only */
</style>
```

---

### 1.7 `filterPhotosByTags()` Logic (3 locations) — **Done**

**Problem:** Tag filtering logic with AND/OR support duplicated.

**Files Affected:**
| File | Lines | Type |
|------|-------|------|
| `src/pages/photography/photos.astro` | 1033-1044 | Client JS |
| `src/pages/photography/album/[slug].astro` | 480-494 | Client JS |
| `src/pages/photography/tag/[tag].astro` | 540-556 | Client JS |

**Duplicated Code:**
```javascript
function filterPhotosByTags(tags, logic) {
  if (tags.length === 0) return allPhotosData;
  return allPhotosData.filter(photo => {
    const photoTags = photo.data.tags.map(t => normalizeTag(t)).filter(Boolean);
    if (logic === 'and') {
      return tags.every(tag => photoTags.includes(tag));
    }
    return tags.some(tag => photoTags.includes(tag));
  });
}
```

**Solution:** Add to `src/utils/client/tag-utils.ts`

```typescript
export type TagLogic = 'and' | 'or';

export function filterPhotosByTags<T extends { data: { tags: string[] } }>(
  photos: T[],
  tags: string[],
  logic: TagLogic = 'or'
): T[] {
  if (tags.length === 0) return photos;

  return photos.filter(photo => {
    const photoTags = photo.data.tags.map(normalizeTag).filter(Boolean);
    if (logic === 'and') {
      return tags.every(tag => photoTags.includes(normalizeTag(tag)));
    }
    return tags.some(tag => photoTags.includes(normalizeTag(tag)));
  });
}
```

---

### 1.8 Tag Availability Update Logic (3 locations) — **Done**

**Problem:** Complex tag availability calculation duplicated.

**Files Affected:**
| File | Lines |
|------|-------|
| `src/pages/photography/photos.astro` | 1047-1111 |
| `src/pages/photography/album/[slug].astro` | 512-539 |
| `src/pages/photography/tag/[tag].astro` | 576-605 |

**Solution:** Add to `src/utils/client/tag-utils.ts`

```typescript
export function getAvailableTags<T extends { data: { tags: string[] } }>(
  allPhotos: T[],
  selectedTags: string[],
  logic: TagLogic
): Set<string> {
  if (logic === 'or') {
    // All tags available in OR mode
    const allTags = new Set<string>();
    allPhotos.forEach(photo => {
      photo.data.tags.forEach(tag => allTags.add(normalizeTag(tag)));
    });
    return allTags;
  }

  // In AND mode, only tags from filtered results
  const filtered = filterPhotosByTags(allPhotos, selectedTags, 'and');
  const available = new Set<string>();

  filtered.forEach(photo => {
    photo.data.tags.forEach(tag => {
      const normalized = normalizeTag(tag);
      if (normalized) available.add(normalized);
    });
  });

  // Always keep selected tags available
  selectedTags.forEach(tag => available.add(normalizeTag(tag)));

  return available;
}
```

---

## 2. Medium Severity Violations

### 2.1 Viewfinder SVG Markup (5+ locations) — **Done**

**Problem:** Identical SVG markup (~10 lines) copied across files.

**Files Affected:**
- `src/pages/photography/index.astro` (lines 84-90)
- `src/pages/photography/photos.astro` (lines 760-765, in innerHTML)
- `src/components/react/InfinitePhotoGallery.tsx` (lines 118-152)
- Referenced via components in `album/[slug].astro` and `tag/[tag].astro`

**Solution:** Create `src/components/photo/ViewfinderSVG.astro` (**shipped**) and React twin `src/components/react/ViewfinderSVG.tsx` (**shipped**). The all-photos page now uses a `<template id="viewfinder-template">` with the Astro component so JS-inserted cards reuse the same markup.

```astro
---
// ViewfinderSVG.astro - Reusable viewfinder corners overlay
---
<svg
  class="viewfinder-corners"
  viewBox="0 0 100 100"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path d="M15 15 L15 25 L25 25" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M85 15 L85 25 L75 25" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M15 85 L15 75 L25 75" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M85 85 L85 75 L75 75" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

For React, export as constant:
```typescript
// src/components/react/ViewfinderSVG.tsx
export const ViewfinderSVG = () => (
  <svg className="viewfinder-corners" viewBox="0 0 100 100" fill="none">
    {/* paths */}
  </svg>
);
```

---

### 2.2 `formatShutterSpeed()` Function (3 locations) — **Done**

**Files Affected:**
| File | Lines | Type |
|------|-------|------|
| `src/pages/photography/photos.astro` | 194-203 | Server TS |
| `src/pages/photography/photos.astro` | 566-575 | Client JS |

**Solution:** Move the formatter to `src/utils/shared/exif.ts` and re-export from `photo-helpers.ts`. The all-photos page consumes the shared helper server-side and via a single window-exposed helper for client scripts (no duplicate formatter definitions).

```typescript
export function formatShutterSpeed(seconds: number): string {
  if (seconds < 1) {
    const denominator = Math.round(1 / seconds);
    return `1/${denominator}s`;
  }
  return `${seconds.toFixed(1)}s`;
}
```

---

### 2.3 Tag Logic Toggle Handler (3 locations)

**Problem:** Nearly identical OR/AND toggle logic.

**Files Affected:**
- `src/pages/photography/album/[slug].astro` (lines 560-576)
- `src/pages/photography/tag/[tag].astro` (lines 624-642)
- `src/pages/photography/photos.astro` (lines 1129-1142)

**Solution:** Create shared handler in `src/utils/client/tag-utils.ts`

```typescript
export function setupTagLogicToggle(
  toggleContainer: HTMLElement,
  onModeChange: (mode: TagLogic) => void
): void {
  const buttons = toggleContainer.querySelectorAll<HTMLButtonElement>('.toggle-option');

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const mode = (button.dataset.mode as TagLogic) || 'or';

      buttons.forEach(btn => {
        btn.setAttribute('aria-pressed', btn.dataset.mode === mode ? 'true' : 'false');
      });

      onModeChange(mode);
    });
  });
}
```

---

### 2.4 Filter Bar HTML Structure (3 locations)

**Problem:** Identical collapsible filter bar markup.

**Files Affected:**
- `src/pages/photography/album/[slug].astro` (lines 84-128)
- `src/pages/photography/tag/[tag].astro` (lines 86-147)

**Solution:** Create `src/components/photo/TagFilterBar.astro`

```astro
---
interface Props {
  tags: string[];
  initialActiveTag?: string;
}

const { tags, initialActiveTag } = Astro.props;
---

<div class="tag-filter-bar">
  <button class="filter-toggle" id="filter-toggle" type="button">
    <span class="filter-toggle-text">Refine by tags</span>
    <svg class="filter-toggle-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>
  <div class="tag-pills-container" id="tag-pills-container">
    <div class="tag-filter-controls">
      <div class="tag-logic-toggle" id="tag-logic-toggle" role="group" aria-label="Tag filter mode">
        <button type="button" class="toggle-option" data-mode="or" aria-pressed="true">OR</button>
        <button type="button" class="toggle-option" data-mode="and" aria-pressed="false">AND</button>
      </div>
    </div>
    <div class="tag-pills" id="tag-pills">
      {tags.map(t => (
        <button
          class={`tag-pill ${t === initialActiveTag ? 'active' : ''}`}
          data-tag={t}
          type="button"
        >
          #{t}
        </button>
      ))}
    </div>
    <button class="clear-filters" id="clear-filters" style="display: none;">
      Clear filters
    </button>
  </div>
</div>

<style>
  /* Include filter bar styles */
</style>
```

---

### 2.5 Photo→Lightbox Data Transformation (4 locations)

**Problem:** Same mapping pattern for lightbox format.

**Files Affected:**
- `src/pages/photography/index.astro` (lines 96-99, 104-119)
- `src/pages/photography/photos.astro` (lines 488-512)
- `src/pages/photography/album/[slug].astro` (lines 45-61, 136-139)
- `src/components/react/FilteredPhotoGallery.tsx` (lines 90-107)

**Solution:** Add to `src/utils/photo-helpers.ts`

```typescript
export interface LightboxPhoto {
  id: string;
  url: string;
  body: string;
  data: {
    title: string;
    filename: string;
    album: string;
    albumTitle?: string;
    tags: string[];
    camera?: string;
    settings?: string;
    focalLength?: number;
    location?: string;
    date: string;
    position?: string;
  };
}

export function transformForLightbox(
  photo: Photo,
  albumTitleMap?: Map<string, string>
): LightboxPhoto {
  return {
    id: photo.id,
    url: getPhotoUrl(photo.data.filename),
    body: photo.body || '',
    data: {
      title: photo.data.title,
      filename: photo.data.filename,
      album: photo.data.album,
      albumTitle: albumTitleMap?.get(photo.data.album),
      tags: photo.data.tags,
      camera: photo.data.camera,
      settings: photo.data.settings,
      focalLength: photo.data.focalLength,
      location: photo.data.location,
      date: photo.data.date.toISOString(),
      position: photo.data.position,
    },
  };
}
```

---

## 3. Low Severity Violations

### 3.1 `albumTitleMap` Creation (4 locations)

**Files:** `index.astro`, `photos.astro`, `tag/[tag].astro`, `album/[slug].astro`

**Duplicated Code:**
```typescript
const albumTitleMap = new Map(albums.map(a => [a.slug, a.data.title]));
```

**Solution:** Add to `src/utils/photo-helpers.ts`

```typescript
export async function getAlbumTitleMap(): Promise<Map<string, string>> {
  const albums = await getCollection('albums');
  return new Map(albums.map(a => [a.slug, a.data.title]));
}
```

---

### 3.2 Filter Collapse/Expand Logic (3 locations)

**Solution:** Include in `TagFilterBar.astro` component with embedded script.

---

### 3.3 Clear Filters Visibility Logic (3 locations)

**Solution:** Include in shared tag utilities module.

---

## 4. Implementation Plan

### Phase 1: Server-Side Utilities (Low Risk, High Impact)

**File:** `src/utils/photo-helpers.ts`

**Add Functions:**
1. `sortPhotos()` - Photo sorting by order_score + date
2. `sortAlbums()` - Album sorting by featured + order_score + date
3. `extractTags()` - Tag extraction with counts and sorting options
4. `parseSettings()` - EXIF settings parser
5. `formatShutterSpeed()` - Shutter speed formatter
6. `getAlbumTitleMap()` - Album slug→title mapping
7. `transformForLightbox()` - Photo→Lightbox data transformation

**Estimated Changes:** ~100 lines added, ~80 lines removed across pages

**Files Modified:**
- `src/utils/photo-helpers.ts` (add functions)
- `src/pages/photography/index.astro` (use sortPhotos)
- `src/pages/photography/photos.astro` (use sortPhotos, extractTags, parseSettings)
- `src/pages/photography/album/[slug].astro` (use sortPhotos, extractTags)
- `src/pages/photography/tag/[tag].astro` (use sortPhotos, extractTags)
- `src/pages/photography/albums.astro` (use sortAlbums)
- `src/pages/photography/tags.astro` (use extractTags)

---

### Phase 2: Client-Side Utilities (Medium Risk, High Impact)

**New File:** `src/utils/client/tag-utils.ts`

**Add Functions:**
1. `normalizeTag()` - Tag normalization
2. `filterPhotosByTags()` - Tag filtering with AND/OR logic
3. `getAvailableTags()` - Available tag calculation for AND mode
4. `setupTagLogicToggle()` - Toggle handler setup

**Challenge:** Client scripts in Astro use `define:vars` which doesn't support imports directly. Options:
- Inline the shared code via build step
- Use a bundled client script
- Convert to React components where possible

**Files Modified:**
- Create `src/utils/client/tag-utils.ts`
- `src/pages/photography/photos.astro` (client script)
- `src/pages/photography/album/[slug].astro` (client script)
- `src/pages/photography/tag/[tag].astro` (client script)
- `src/components/react/FilteredPhotoGallery.tsx`

---

### Phase 3: Shared Components (Low Risk, Medium Impact)

**New Components:**
1. `src/components/photo/ViewfinderSVG.astro`
2. `src/components/photo/TagFilterBar.astro`
3. `src/components/react/ViewfinderSVG.tsx`

**Files Modified:**
- `src/pages/photography/index.astro`
- `src/pages/photography/album/[slug].astro`
- `src/pages/photography/tag/[tag].astro`
- `src/components/react/InfinitePhotoGallery.tsx`

---

### Phase 4: Shared Styles (Low Risk, Medium Impact)

**New File:** `src/styles/photo-card.css`

**Contents:**
- `.photo-card` styles
- `.photo-image` styles
- `.viewfinder-overlay` styles
- `.viewfinder-corners` styles
- `@keyframes viewfinderFocus`

**Files Modified:**
- `src/pages/photography/index.astro` (remove duplicate CSS)
- `src/pages/photography/photos.astro` (remove duplicate CSS)
- `src/pages/photography/album/[slug].astro` (remove duplicate CSS)
- `src/pages/photography/tag/[tag].astro` (remove duplicate CSS)

---

## 5. File-by-File Impact

| File | Lines Removed | Lines Added | Net Change |
|------|---------------|-------------|------------|
| `src/utils/photo-helpers.ts` | 0 | ~120 | +120 |
| `src/utils/client/tag-utils.ts` | 0 | ~80 | +80 |
| `src/styles/photo-card.css` | 0 | ~80 | +80 |
| `src/components/photo/ViewfinderSVG.astro` | 0 | ~15 | +15 |
| `src/components/photo/TagFilterBar.astro` | 0 | ~60 | +60 |
| `src/pages/photography/index.astro` | ~90 | ~10 | -80 |
| `src/pages/photography/photos.astro` | ~200 | ~30 | -170 |
| `src/pages/photography/album/[slug].astro` | ~150 | ~20 | -130 |
| `src/pages/photography/tag/[tag].astro` | ~170 | ~25 | -145 |
| `src/pages/photography/albums.astro` | ~15 | ~5 | -10 |
| `src/pages/photography/tags.astro` | ~30 | ~10 | -20 |
| **TOTAL** | ~655 | ~455 | **-200** |

---

## 6. Testing Strategy

### Automated Tests

Run existing Playwright E2E tests after each phase:
```bash
npm run test:e2e
```

### Manual Testing Checklist

#### Phase 1 (Server-Side)
- [ ] Featured photos page loads with correct sort order
- [ ] All photos page loads with correct sort order
- [ ] Album pages load with correct sort order
- [ ] Tag pages load with correct sort order
- [ ] Albums page loads with featured albums first
- [ ] Tags page shows correct tag counts

#### Phase 2 (Client-Side)
- [ ] Tag filtering works in OR mode
- [ ] Tag filtering works in AND mode
- [ ] Tag availability updates correctly in AND mode
- [ ] Clear filters button works
- [ ] Filter state persists correctly

#### Phase 3 (Components)
- [ ] Viewfinder overlay appears on hover
- [ ] Focus lock animation works (green corners)
- [ ] Tag filter bar expands/collapses
- [ ] Tag pills toggle active state

#### Phase 4 (Styles)
- [ ] Photo cards have consistent styling across all pages
- [ ] Hover effects work correctly
- [ ] Responsive layout works on mobile

---

## Appendix: Quick Reference

### New Exports from `photo-helpers.ts`

```typescript
// Sorting
export function sortPhotos<T>(photos: T[]): T[]
export function sortAlbums<T>(albums: T[]): T[]

// Tags
export function extractTags(photos: Photo[], options?: TagExtractionOptions): ExtractedTag[]

// EXIF
export function parseSettings(settings?: string): ParsedExifSettings
export function formatShutterSpeed(seconds: number): string

// Helpers
export function getAlbumTitleMap(): Promise<Map<string, string>>
export function transformForLightbox(photo: Photo, albumTitleMap?: Map<string, string>): LightboxPhoto
```

### New Exports from `client/tag-utils.ts`

```typescript
export const normalizeTag: (tag?: string | null) => string
export function filterPhotosByTags<T>(photos: T[], tags: string[], logic?: TagLogic): T[]
export function getAvailableTags<T>(allPhotos: T[], selectedTags: string[], logic: TagLogic): Set<string>
export function setupTagLogicToggle(container: HTMLElement, onModeChange: (mode: TagLogic) => void): void
```

---

## Priority Order

1. **Phase 1** - Server-side utilities (highest impact, lowest risk)
2. **Phase 4** - Shared styles (easy win, visual consistency)
3. **Phase 3** - Shared components (medium effort)
4. **Phase 2** - Client-side utilities (most complex due to Astro script constraints)
