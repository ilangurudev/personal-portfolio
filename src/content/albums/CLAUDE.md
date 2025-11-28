# Albums Content Directory

This directory contains album metadata for the **Photography Space** (`/photography/*`).

## File Structure

```
albums/
├── album-slug.md     # Individual album metadata
└── CLAUDE.md         # This file
```

## Creating a New Album

### 1. Import Photos First
Use the import script to copy photos and extract EXIF data:
```bash
npm run import <album-slug> ~/path/to/photos
# Example: npm run import tokyo-nights ~/Desktop/tokyo-photos
```

**Note:** Album slug should be kebab-case (e.g., `street-sf`, `tokyo-nights`)

### 2. Create Album Metadata File
```bash
touch src/content/albums/tokyo-nights.md
```

### 3. Add Frontmatter
```yaml
---
title: "Tokyo Nights"
description: "Street photography from Tokyo after dark"
coverPhoto: "tokyo-nights/shibuya-crossing.jpg"
date: 2024-11-28
featured: true
order: 1
---

Optional album story or context goes here.

This can include background about the trip, camera gear used,
or thoughts about the collection.
```

### 4. Frontmatter Schema (from src/content/config.ts)
- **title** (required): Album display name
- **description** (required): Short description for album cards
- **coverPhoto** (required): Path to cover photo (format: `{album-slug}/{photo}.jpg`)
- **date** (required): Album date (for sorting)
- **featured** (optional, default: false): Featured albums appear first
- **order** (optional, default: 0): Manual ordering (lower numbers first)

## Album Routes

- `/photography` - Homepage showing all albums
- `/photography/albums` - Grid view of all albums
- `/photography/album/{slug}` - Individual album page

## Cover Photos

The `coverPhoto` field references a photo from `public/photos/{album-slug}/`:
```
coverPhoto: "tokyo-nights/photo-1.jpg"
```

Maps to: `public/photos/tokyo-nights/photo-1.jpg`

## Ordering

Albums are sorted by:
1. **Featured** status (featured first)
2. **Order** field (lower numbers first)
3. **Date** (newest first)

## Design Notes

- Uses `PhotoLayout.astro` for bright, editorial aesthetic
- Cream/white backgrounds with amber accents
- Sans-serif fonts (Work Sans, Crimson Text)
- Clean, minimal grid layouts
