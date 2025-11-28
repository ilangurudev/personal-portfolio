# Photo Import Workflow

## Quick Start

### 1. Import Photos

```bash
npm run import <album-slug> ~/path/to/source/photos
```

**Example:**
```bash
npm run import street-sf ~/Desktop/sf-street-photos
```

### 1b. Cleanly Remove Albums or Photos

Use the removal CLI to delete assets and metadata together:

```bash
# Remove an entire album (photos, metadata, batch files)
npm run remove -- --album pacific-northwest

# Remove a single photo (metadata + image)
npm run remove -- --photo new-york/AR53764
```

Options:
- `--dry-run` — preview what would be deleted.
- `--yes` — skip the confirmation prompt (useful for automation).
- Photo identifiers accept either the metadata slug (`AR53764`) or the actual filename (`_AR53764.jpg`).

When the last photo in an album is removed, the script automatically prunes the empty folders and album metadata so the content collections stay in sync.

### 2. Review Batch File

Open `batch-import-{album-slug}.md` in the project root:
- Edit titles (look for `TODO: Add descriptive title`)
- Refine tags (look for `TODO: Add tags`)
- Add descriptions for each photo
- Add locations if missing GPS data

### 3. Create Album Metadata

If this is a new album, create the album metadata file:

```bash
touch src/content/albums/{album-slug}.md
```

Add frontmatter:
```yaml
---
title: "Album Title"
description: "Album description"
coverPhoto: "{album-slug}/photo-1.jpg"
date: 2024-11-20
featured: true
order: 1
---

Optional album story or context goes here.
```

### 4. Split into Individual Files

Create individual markdown files for each photo:

```bash
mkdir -p src/content/photos/{album-slug}
```

Copy each photo's YAML block from the batch file into separate files:
- `src/content/photos/{album-slug}/photo-1.md`
- `src/content/photos/{album-slug}/photo-2.md`
- etc.

Add frontmatter delimiters (`---`) and optional descriptions:
```markdown
---
title: "Photo Title"
album: "album-slug"
filename: "album-slug/photo-1.jpg"
tags: ["tag1", "tag2"]
description: ""
date: 2024-11-20
featured: false
location: "San Francisco, CA"
---

Optional photo story or context goes here.
```

### 5. Delete Batch File

```bash
rm batch-import-{album-slug}.md
```

### 6. Build and Verify

```bash
npm run build
npm run preview
```

Check the console for EXIF augmentation messages:
```
📷 EXIF Augmenter: Processing 10 photos...
✓ EXIF Augmenter: Augmented 8 photos
```

---

## What Gets Auto-Extracted

### Import-Time (from IPTC/EXIF)

The import script reads metadata from your photos and pre-fills the batch file:

| Field | Source | Fallback |
|-------|--------|----------|
| Title | IPTC Title | Filename (e.g., "DSC_0042") |
| Tags | IPTC Keywords | Empty array (TODO marker added) |
| Date | EXIF DateTimeOriginal | Current date |
| Location | GPS coordinates | Empty string (TODO marker added) |

### Build-Time (from EXIF)

When you build your site (or query photos using `getPhotosWithExif()`), these fields are automatically filled if not in frontmatter:

| Field | Source | Format |
|-------|--------|--------|
| Camera | EXIF Make + Model | "Sony A7IV" |
| Settings | EXIF Aperture, Shutter, ISO | "f/2.8, 1/1000s, ISO 400" |
| Date | EXIF DateTimeOriginal | Date object |

**Important:** Frontmatter always wins! If you manually add `camera`, `settings`, or `date` to frontmatter, those values are used instead of EXIF.

---

## Usage in Pages

### Get Photos with EXIF Data

Use the helper functions from `src/utils/photo-helpers.ts`:

```astro
---
import { getPhotosWithExif, getAlbumPhotosWithExif } from '@/utils/photo-helpers';

// Get all photos with EXIF
const allPhotos = await getPhotosWithExif();

// Get photos from specific album
const albumPhotos = await getAlbumPhotosWithExif('street-sf');

// Get featured photos
const featured = await getFeaturedPhotosWithExif();
---

{albumPhotos.map(photo => (
  <div>
    <h2>{photo.data.title}</h2>
    <p class="camera">{photo.data.camera}</p>
    <p class="settings">{photo.data.settings}</p>
  </div>
))}
```

### Without EXIF Augmentation

If you don't need EXIF data, use standard Astro content collections:

```astro
---
import { getCollection } from 'astro:content';

const photos = await getCollection('photos');
---
```

**Note:** Photos queried this way will only have metadata from frontmatter.

---

## Troubleshooting

### No IPTC Keywords Found

**Symptom:** Batch file shows `TODO: Add tags` for all photos

**Cause:** Your photos don't have IPTC keyword metadata

**Solution:**
- Add keywords in Adobe Lightroom, Capture One, or Photo Mechanic before exporting
- Or manually add tags in the batch file during review
- Consider creating a tag constants file for consistency: `src/utils/tag-constants.ts`

### Wrong Camera Name in EXIF

**Symptom:** Build shows incorrect camera model

**Cause:** EXIF data has wrong or generic camera name

**Solution:** Override in frontmatter:
```yaml
camera: "Corrected Camera Name"
```

### EXIF Augmenter Not Running

**Symptom:** Console doesn't show "EXIF Augmenter: Processing X photos..."

**Cause:** You're using `getCollection('photos')` instead of `getPhotosWithExif()`

**Solution:** Update your pages to use the helper functions:
```diff
- import { getCollection } from 'astro:content';
- const photos = await getCollection('photos');
+ import { getPhotosWithExif } from '@/utils/photo-helpers';
+ const photos = await getPhotosWithExif();
```

### Photos Not Found During Build

**Symptom:** Console shows "Photo not found: /path/to/photo.jpg"

**Cause:** Filename in frontmatter doesn't match actual file in `public/photos/`

**Solution:**
- Check filename in frontmatter matches exactly (case-sensitive)
- Verify photo exists in `public/photos/{album}/{filename}`
- Ensure you ran the import script to copy photos

### GPS Location Not Formatted

**Symptom:** Location shows raw coordinates instead of readable format

**Cause:** Import script formats GPS as degrees (e.g., "37.7749° N")

**Solution:** If you want city names:
- Manually edit location in batch file: `location: "San Francisco, CA"`
- Or use a reverse geocoding service (future enhancement)

### Build Time Too Slow

**Symptom:** Build takes >1 minute with many photos

**Cause:** EXIF reading is I/O bound

**Solution:**
- First build is slower (no cache) - subsequent builds are faster
- Use local SSD (not network drive) for photos
- EXIF augmenter uses in-memory cache during build
- Consider reducing photo count per album if build time is critical

---

## Validation

### Check Metadata Completeness

Before deploying, validate that photos have complete metadata:

```bash
node scripts/validate-metadata.js <album-slug>
```

This checks for:
- Generic titles (DSC_*, IMG_*, etc.)
- Missing tags
- Missing descriptions
- Missing locations (if GPS data unavailable)

**Example:**
```bash
node scripts/validate-metadata.js street-sf

⚠️  Found 3 issues in street-sf:
  - photo-1.md: Generic title "DSC_0042"
  - photo-2.md: No tags
  - photo-3.md: No description
```

---

## Best Practices

### Tag Consistency

Create a tag constants file to maintain consistent tags across albums:

```typescript
// src/utils/tag-constants.ts
export const PHOTO_TAGS = {
  GENRES: ['street', 'landscape', 'portrait', 'urban', 'nature'],
  LIGHTING: ['golden-hour', 'blue-hour', 'night', 'overcast'],
  SUBJECTS: ['people', 'architecture', 'animals', 'abstract'],
  LOCATIONS: ['san-francisco', 'tokyo', 'paris'],
} as const;
```

Use these when editing the batch file to ensure consistency.

### Filename Organization

Keep original camera filenames during import (DSC_0042.jpg, etc.):
- Easier to match with Lightroom catalogs
- Original filenames preserved in metadata
- Descriptive titles go in frontmatter, not filenames

### Album Folder Naming

Use kebab-case for album slugs:
- ✅ `street-photography-sf`
- ✅ `tokyo-night-2024`
- ❌ `Street Photography SF`
- ❌ `tokyo_night`

### Featured Photos

Be selective with `featured: true`:
- Use for your absolute best photos
- Aim for diversity (don't feature entire album)
- Review featured collection periodically

### Descriptions

Add context that isn't obvious from the photo:
- What you were thinking/feeling
- Technical challenges or creative choices
- Story behind the shot
- **Don't** describe what's visible (title + tags cover that)

---

## Advanced Usage

### Batch Editing Frontmatter

Use a text editor with multi-cursor support (VS Code, Sublime) to batch-edit the batch file:
- Select all `TODO: Add tags` lines → replace with actual tags
- Multi-cursor edit all titles simultaneously
- Regex find/replace for pattern-based edits

### Lightroom Integration

Add IPTC metadata in Lightroom before export:
1. Select photos in Lightroom
2. Library → Edit Metadata
3. Add Keywords (becomes tags)
4. Add Title (becomes title)
5. Export photos with metadata
6. Run import script

**Result:** Batch file pre-filled with your Lightroom metadata!

### Custom EXIF Fields

To display additional EXIF data (lens, focal length, etc.):

1. Update `extractTechnicalExif()` in `src/content/loaders/exif-augmenter.ts`:
   ```typescript
   pick: ['Make', 'Model', 'LensModel', 'FocalLength', 'FNumber', ...]
   ```

2. Add to schema in `src/content/config.ts`:
   ```typescript
   lens: z.string().optional(),
   focalLength: z.number().optional(),
   ```

3. Update `augmentPhotoWithExif()` to merge these fields

---

## File Structure Reference

```
project-root/
├── public/
│   └── photos/
│       └── {album-slug}/
│           ├── photo-1.jpg
│           ├── photo-2.jpg
│           └── ...
├── src/
│   ├── content/
│   │   ├── albums/
│   │   │   └── {album-slug}.md
│   │   ├── photos/
│   │   │   └── {album-slug}/
│   │   │       ├── photo-1.md
│   │   │       ├── photo-2.md
│   │   │       └── ...
│   │   └── config.ts
│   └── utils/
│       └── photo-helpers.ts
├── scripts/
│   ├── import-photos.js
│   ├── validate-metadata.js
│   └── README.md (this file)
└── batch-import-{album-slug}.md (temporary, delete after splitting)
```

---

## EXIF Field Reference

### Always Available (Standard EXIF)
- Make: Camera manufacturer
- Model: Camera model
- DateTimeOriginal: Photo capture date/time
- FNumber: Aperture (e.g., 2.8 for f/2.8)
- ExposureTime: Shutter speed (e.g., 0.001 for 1/1000s)
- ISO: ISO sensitivity

### Sometimes Available (IPTC)
- Title: Photo title
- Keywords: Array of keyword strings
- Caption: Photo description/caption

### Sometimes Available (GPS)
- GPSLatitude: Latitude (if geotagging enabled)
- GPSLongitude: Longitude (if geotagging enabled)

### Rarely Available (Optional)
- LensModel: Lens used
- FocalLength: Focal length in mm
- WhiteBalance: White balance mode
- Flash: Flash fired or not
- Orientation: Photo rotation

---

## Support

For issues or questions:
- Check this README first
- Review the batch import file for TODO markers
- Run the validation script
- Check Astro build console for EXIF augmentation logs
- Verify photos exist in `public/photos/{album}/`
