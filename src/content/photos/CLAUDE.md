# Photos Content Directory

This directory contains photo metadata for the **Photography Space**.

## Directory Structure

```
photos/
├── album-slug/           # One directory per album
│   ├── photo-1.md       # Individual photo metadata
│   ├── photo-2.md
│   └── ...
└── CLAUDE.md            # This file
```

## Photo Import Workflow

### 1. Import Photos
```bash
npm run import <album-slug> ~/path/to/photos
```

This script:
- Copies photos to `public/photos/{album-slug}/`
- Extracts EXIF/IPTC data
- Creates `batch-import-{album-slug}.md` in project root

### 2. Review Batch File
Open `batch-import-{album-slug}.md` and refine:
- **Titles**: Replace filenames with descriptive titles
- **Tags**: Add relevant tags (e.g., `street`, `night`, `portrait`)
- **Descriptions**: Add context or stories
- **Featured**: Mark 1-3 best photos as `featured: true`
- **Locations**: Add if GPS data is missing

### 3. Create Album Metadata
```bash
touch src/content/albums/{album-slug}.md
```
See `src/content/albums/CLAUDE.md` for album frontmatter format.

### 4. Split Batch into Individual Files
```bash
mkdir -p src/content/photos/{album-slug}
```

Create one `.md` file per photo (e.g., `shibuya-crossing.md`):
```yaml
---
title: "Shibuya Crossing at Night"
album: "tokyo-nights"
filename: "tokyo-nights/IMG_1234.jpg"
tags: ["street photography", "night", "urban"]
featured: true
location: "Shibuya, Tokyo"
date: 2024-11-20
camera: "Canon EOS R6"
settings: "f/2.8, 1/60s, ISO 3200"
---

Optional photo caption or story.
```

### 5. Cleanup
```bash
rm batch-import-{album-slug}.md
```

### 6. Validate & Build
```bash
node scripts/validate-metadata.js <album-slug>
npm run build
```

## Frontmatter Schema (from src/content/config.ts)

### Manual Fields (edit before committing)
- **title** (required): Descriptive photo title
- **album** (required): Album slug (must match album folder name)
- **filename** (required): Path relative to `public/photos/`
- **tags** (required): Searchable tags array
- **featured** (optional, default: false): Show on featured photos page
- **location** (optional): Location description (from GPS or manual)

### Technical Fields (auto-filled from EXIF)
- **date** (required): Photo date (extracted from EXIF DateTimeOriginal)
- **camera** (optional): Camera model (extracted from EXIF Make + Model)
- **settings** (optional): Camera settings (aperture, shutter, ISO)

**Note:** Frontmatter values override EXIF data if provided.

## Using Photo Helpers

ALWAYS use helper functions to ensure EXIF data is attached:

```typescript
import { getPhotosWithExif, getAlbumPhotosWithExif } from '@/utils/photo-helpers';

// Get all photos with EXIF
const photos = await getPhotosWithExif();

// Get photos from specific album
const albumPhotos = await getAlbumPhotosWithExif('tokyo-nights');
```

## Photo Routes

- `/photography` - Featured photos and albums
- `/photography/album/{album-slug}` - Album gallery
- `/photography/tag/{tag}` - Photos filtered by tag
- `/photography/tags` - All tags index

## Image Files

Original photos live in `public/photos/{album-slug}/`:
```
public/
└── photos/
    ├── tokyo-nights/
    │   ├── IMG_1234.jpg
    │   ├── IMG_1235.jpg
    │   └── ...
    └── new-york/
        └── ...
```

## Key Gotchas

1. **Image Path**: `filename` in frontmatter is relative to `public/photos/`
2. **EXIF Extraction**: Happens at build time; first build is slow, subsequent builds use cache
3. **Tags**: Case-sensitive; keep consistent (lowercase recommended)
4. **Build Cache**: Delete `.astro/` if EXIF data seems stale

## Design Notes

- Uses `PhotoLayout.astro` for bright, minimal aesthetic
- EXIF data displayed on photo detail pages
- Tag-based navigation and filtering
- Lazy loading and responsive images via Astro `<Image>` component
