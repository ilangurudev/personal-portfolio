# Helper Functions & Utilities

## 1. Photo Helpers (`src/utils/photo-helpers.ts`)

**CRITICAL:** Always use these helpers instead of raw `getCollection('photos')` to ensure EXIF data is available.

### Photo Retrieval

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

### Sorting Utilities

```typescript
// Sort photos by order_score (descending), then by date (descending)
const sortedPhotos = sortPhotos(photos);

// Sort albums by featured status, then order_score, then date
const sortedAlbums = sortAlbums(albums);
```

### EXIF Parsing

```typescript
// Parse camera settings string into structured EXIF data
const parsed = parseSettings('f/2.8, 1/1000s, ISO 400');
// → { aperture: 2.8, shutterSpeed: 0.001, iso: 400 }

// Format shutter speed for display
const display = formatShutterSpeed(0.001);
// → "1/1000s"
```

### Tag Extraction

```typescript
// Extract tags with counts, sorted by count (default)
const tagsWithCounts = extractTags(photos, { sortBy: 'count' });
// → [{ tag: 'street', count: 45 }, { tag: 'urban', count: 23 }, ...]

// Extract tags sorted alphabetically
const tagsSortedAlpha = extractTags(photos, { sortBy: 'alpha' });

// Preserve original casing for display
const tagsWithDisplay = extractTags(photos, { preserveDisplayCasing: true });
// → [{ tag: 'street', count: 45, displayTag: 'Street' }, ...]

// Get just the tag names
const tagNames = extractTagNames(photos, 'alpha');
// → ['architecture', 'landscape', 'street', ...]
```

**Why?** EXIF data is stored in frontmatter (not extracted at runtime). Helpers ensure data is always present and properly merged. Tag extraction and sorting functions provide DRY utilities used across multiple photography pages.

## 2. URL Helpers (`src/utils/url-helper.ts`)

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

## 3. EXIF Augmenter (`src/content/loaders/exif-augmenter.ts`)

**Note:** **DEPRECATED for extraction**. EXIF data is now stored in frontmatter during import.

**Purpose:** Originally extracted EXIF at build time. Now acts as a type-safe pass-through that returns photos as-is (frontmatter is the source of truth). The extraction logic remains for reference or potential future use (e.g., re-populating missing frontmatter).

**Still Contains:** Extraction logic for reference if needed.
