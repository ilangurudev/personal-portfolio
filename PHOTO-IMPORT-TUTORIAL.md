# Photo Import Tutorial - Your Complete Guide

This tutorial walks you through importing your first album using the EXIF metadata extraction system.

---

## Prerequisites

Before you start, make sure you have:
- [ ] A collection of photos (5-20 recommended for first try)
- [ ] Photos are JPEGs with EXIF data
- [ ] Ideally, photos have IPTC keywords/tags (optional but helpful)

**Tip:** If you use Lightroom or Capture One, add keywords and titles there before exporting. The import script will pick them up!

---

## Step 1: Prepare Your Photos

### Choose Your First Album

Pick a small, cohesive set of photos for your first import. Examples:
- A day trip or vacation
- A specific photowalk
- A themed collection (all street photography, all portraits, etc.)

### Decide on an Album Slug

Create a slug (URL-friendly identifier) for this album:
- Use lowercase letters
- Use hyphens for spaces
- Keep it descriptive but concise

**Examples:**
- `tokyo-street-2024` ✅
- `golden-gate-bridge` ✅
- `tokyo_street` ❌ (use hyphens, not underscores)
- `Tokyo Street` ❌ (no spaces or capitals)

**For this tutorial, let's use:** `my-first-album`

---

## Step 2: Run the Import Script

### Command

Open your terminal in the project directory and run:

```bash
npm run import my-first-album ~/path/to/your/photos
```

**Replace** `~/path/to/your/photos` with the actual path to your photo folder.

**Example:**
```bash
npm run import my-first-album ~/Desktop/tokyo-photos
```

### What You'll See

The script will output progress as it processes each photo:

```
📸 Importing photos for album: my-first-album
   Source: /Users/guru/Desktop/tokyo-photos

✓ Created album directory: public/photos/my-first-album/

📂 Found 8 photos. Processing...

  ✓ DSC_0042.jpg
  ✓ DSC_0043.jpg
  ✓ DSC_0044.jpg
  ✓ DSC_0045.jpg
  ✓ DSC_0046.jpg
  ✓ DSC_0047.jpg
  ✓ DSC_0048.jpg
  ✓ DSC_0049.jpg

✅ Batch file created: batch-import-my-first-album.md

📋 Next steps:
   1. Review batch-import-my-first-album.md
   2. Edit titles, refine tags, add descriptions
   3. Create album metadata: src/content/albums/my-first-album.md
   4. Create individual .md files in src/content/photos/my-first-album/
   5. Delete batch file when done
   6. Commit your changes

📊 Summary:
   Photos with IPTC metadata: 3/8
   Photos with GPS data: 2/8

✨ Import complete!
```

### What Just Happened?

1. **Photos copied:** All your JPEGs are now in `public/photos/my-first-album/`
2. **EXIF extracted:** Script read metadata from each photo
3. **Batch file created:** `batch-import-my-first-album.md` in your project root
4. **Summary shown:** How many photos have IPTC metadata and GPS data

---

## Step 3: Review and Edit the Batch File

### Open the Batch File

Open `batch-import-my-first-album.md` in your text editor.

### What It Looks Like

```markdown
# Batch Import: my-first-album

**Album:** my-first-album
**Date:** 2025-11-27
**Photos:** 8

Review and split into individual markdown files in `src/content/photos/my-first-album/`

---

## Photo 1: DSC_0042.jpg

```yaml
title: "Shibuya Crossing at Night"  # from IPTC Title
album: "my-first-album"
filename: "my-first-album/DSC_0042.jpg"
tags: ["street", "tokyo", "night"]  # from IPTC Keywords
description: ""  # TODO: Add description
date: 2024-11-20
featured: false
location: "35.6595° N, 139.7004° E"  # from GPS
```

---

## Photo 2: DSC_0043.jpg

```yaml
title: "DSC_0043"  # TODO: Add descriptive title
album: "my-first-album"
filename: "my-first-album/DSC_0043.jpg"
tags: []  # TODO: Add tags
description: ""  # TODO: Add description
date: 2024-11-20
featured: false
location: ""  # TODO: Add location
```

---

[... more photos ...]
```

### Edit the Metadata

Go through each photo and improve the metadata:

#### Fix Titles

Look for `# TODO: Add descriptive title` and replace generic filenames:

**Before:**
```yaml
title: "DSC_0043"  # TODO: Add descriptive title
```

**After:**
```yaml
title: "Quiet Alley in Shimokitazawa"
```

#### Add Tags

Look for `# TODO: Add tags` and add relevant keywords:

**Before:**
```yaml
tags: []  # TODO: Add tags
```

**After:**
```yaml
tags: ["street", "tokyo", "alley", "urban"]
```

**Tag Tips:**
- Use 3-6 tags per photo
- Be consistent (lowercase, hyphens for multi-word)
- Mix genres, subjects, locations, moods
- Examples: `street`, `landscape`, `golden-hour`, `urban`, `people`

#### Add Descriptions

Add context or stories in the description field:

**Before:**
```yaml
description: ""  # TODO: Add description
```

**After:**
```yaml
description: "Found this quiet alley while wandering through Shimokitazawa. The warm light from the izakaya contrasted beautifully with the blue twilight."
```

#### Fix Locations

If GPS is missing, add location manually:

**Before:**
```yaml
location: ""  # TODO: Add location
```

**After:**
```yaml
location: "Shimokitazawa, Tokyo, Japan"
```

#### Mark Featured Photos

For your best 1-3 photos in the album, change `featured` to `true`:

```yaml
featured: true
```

### Save Your Changes

Save the batch file after editing all photos.

---

## Step 4: Create Album Metadata

### Create the Album File

```bash
touch src/content/albums/my-first-album.md
```

### Open and Add Frontmatter

Open `src/content/albums/my-first-album.md` and add:

```markdown
---
title: "Tokyo Street Memories"
description: "A collection of street photography from my November trip to Tokyo, capturing the vibrant energy and quiet moments of the city."
coverPhoto: "my-first-album/DSC_0042.jpg"
date: 2024-11-20
featured: true
order: 1
---

This was my first trip to Tokyo in five years. I spent a week wandering through Shibuya, Shimokitazawa, and Harajuku with just a 35mm lens, trying to capture both the chaos and serenity of the city.

The photos in this collection represent my favorite moments from early morning markets to late-night crossings.
```

### Album Fields Explained

- **title:** Display name for the album
- **description:** Short summary (shows on album cards)
- **coverPhoto:** Path to cover image (relative to `public/photos/`)
  - Pick your best photo from the album
  - Use format: `album-slug/photo-filename.jpg`
- **date:** Album date (usually first/last photo date)
- **featured:** Show on homepage? (`true` or `false`)
- **order:** Display order (lower numbers first)

### Save the Album File

---

## Step 5: Split Batch File into Individual Photo Files

### Create Photo Directory

```bash
mkdir -p src/content/photos/my-first-album
```

### Create Individual Markdown Files

For each photo in the batch file, create a separate `.md` file.

#### Example: Photo 1

**Create file:** `src/content/photos/my-first-album/shibuya-crossing.md`

**Copy the YAML block from batch file and wrap with `---`:**

```markdown
---
title: "Shibuya Crossing at Night"
album: "my-first-album"
filename: "my-first-album/DSC_0042.jpg"
tags: ["street", "tokyo", "night", "urban"]
date: 2024-11-20
featured: true
location: "Shibuya, Tokyo, Japan"
---

The famous Shibuya crossing during the evening rush. The organized chaos of hundreds of people crossing in perfect synchronization never gets old.
```

**Note:**
- Description goes in the markdown body (below `---`)
- Remove all `# TODO` comments
- Filename can be descriptive (`shibuya-crossing.md`) or simple (`photo-1.md`)

#### Repeat for All Photos

Create one `.md` file per photo in the album.

**Naming convention options:**
1. Descriptive: `shibuya-crossing.md`, `quiet-alley.md`
2. Simple: `photo-1.md`, `photo-2.md`, `photo-3.md`
3. Original: `DSC_0042.md`, `DSC_0043.md`

**Recommendation:** Use descriptive names for easier management.

### Quick Method (for many photos)

If you have many photos, create all files at once:

```bash
# In src/content/photos/my-first-album/
touch photo-1.md photo-2.md photo-3.md photo-4.md photo-5.md photo-6.md photo-7.md photo-8.md
```

Then copy/paste YAML blocks from batch file into each one.

---

## Step 6: Delete the Batch File

Once you've split everything into individual files:

```bash
rm batch-import-my-first-album.md
```

---

## Step 7: Validate Your Metadata

Run the validation script to check for issues:

```bash
node scripts/validate-metadata.js my-first-album
```

### Good Output

```
📋 Validating 8 photos in album: my-first-album

✅ All photos have complete metadata!
```

### Output with Issues

```
📋 Validating 8 photos in album: my-first-album

⚠️  Warnings (3):

  photo-2.md: Generic or missing title: "DSC_0043"
  photo-3.md: No tags
  photo-5.md: Generic or missing title: "IMG_1234"

ℹ️  Info (2):

  photo-6.md: No description
  photo-7.md: No location (optional)

💡 Suggestions:
  - Replace generic titles with descriptive ones
  - Add relevant tags for searchability
```

**If you see warnings:** Go back and fix them in the individual `.md` files.

---

## Step 8: Build and Preview

### Build Your Site

```bash
npm run build
```

### Watch for EXIF Augmentation

During build, you should see:

```
📷 EXIF Augmenter: Processing 8 photos...
✓ EXIF Augmenter: Augmented 8 photos
```

This means EXIF data (camera, settings, date) was successfully extracted from your JPEGs!

### Preview the Site

```bash
npm run preview
```

Open http://localhost:4321 in your browser.

---

## Step 9: Use Photos in Your Pages

Now that your photos are imported, use them in your Astro pages.

### Example: Album Gallery Page

**Create:** `src/pages/photo/[album].astro`

```astro
---
import { getAlbumPhotosWithExif } from '@/utils/photo-helpers';
import { getCollection } from 'astro:content';

// Get album slug from URL
const { album } = Astro.params;

// Get album metadata
const albums = await getCollection('albums');
const albumData = albums.find(a => a.id === album);

// Get photos with EXIF data
const photos = await getAlbumPhotosWithExif(album);
---

<html>
  <head>
    <title>{albumData?.data.title}</title>
  </head>
  <body>
    <h1>{albumData?.data.title}</h1>
    <p>{albumData?.data.description}</p>

    <div class="photo-grid">
      {photos.map(photo => (
        <div class="photo-card">
          <img
            src={`/photos/${photo.data.filename}`}
            alt={photo.data.title}
          />
          <h3>{photo.data.title}</h3>

          {/* EXIF data automatically filled! */}
          <p class="camera">{photo.data.camera}</p>
          <p class="settings">{photo.data.settings}</p>

          <div class="tags">
            {photo.data.tags.map(tag => (
              <span class="tag">{tag}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </body>
</html>
```

### What's Automatic?

When you use `getAlbumPhotosWithExif()`:
- ✅ `photo.data.camera` → "Sony A7IV" (from EXIF)
- ✅ `photo.data.settings` → "f/2.8, 1/1000s, ISO 400" (from EXIF)
- ✅ `photo.data.date` → Date object (from EXIF if not in frontmatter)

**You didn't have to type these in frontmatter!** The system extracted them automatically from your JPEGs.

---

## Common Questions

### Q: What if my photos don't have IPTC keywords?

**A:** No problem! The batch file will have empty tags with `# TODO: Add tags`. Just add them manually during review (Step 3).

**Tip for next time:** Use Lightroom/Capture One to add keywords before exporting.

### Q: Can I skip the batch file and create individual files directly?

**A:** Not recommended. The batch file workflow lets you:
- Review all metadata at once
- Batch-edit with multi-cursor
- Ensure consistency before committing

### Q: What if I make a mistake?

**A:** Easy fixes:
- **Wrong title/tags?** Edit the `.md` file in `src/content/photos/`
- **Wrong album metadata?** Edit `src/content/albums/album-slug.md`
- **Wrong EXIF camera name?** Add `camera: "Correct Name"` to frontmatter (overrides EXIF)

### Q: How do I add more photos to an existing album later?

**A:** Run the import script again with a different temporary album name, then manually move photos:

```bash
# Import new photos temporarily
npm run import temp-import ~/new-photos

# Review batch file, then manually add to existing album
# Move JPEGs: public/photos/temp-import/* → public/photos/my-first-album/
# Create .md files in src/content/photos/my-first-album/

# Clean up
rm -rf public/photos/temp-import
```

### Q: Can I edit EXIF data?

**A:** Yes! Add fields to frontmatter to override EXIF:

```yaml
camera: "Fujifilm X100V"  # Overrides EXIF
settings: "f/2, 1/500s, ISO 200"  # Overrides EXIF
```

Frontmatter always wins over EXIF.

---

## Troubleshooting

### Import Script Fails

**Error:** `Source path not found`
```bash
npm run import my-album ~/wrong/path
```

**Fix:** Check the path to your photos folder. Use absolute path or `~/` for home directory.

---

**Error:** `No JPEG files found`

**Fix:**
- Ensure photos are `.jpg` or `.jpeg` (not `.png`, `.raw`, etc.)
- Check file extensions are lowercase or uppercase consistently

---

### Build Doesn't Show EXIF Augmentation

**Symptom:** No "EXIF Augmenter: Processing..." message

**Fix:** Make sure you're using the helper functions in your pages:

```diff
- import { getCollection } from 'astro:content';
- const photos = await getCollection('photos');

+ import { getPhotosWithExif } from '@/utils/photo-helpers';
+ const photos = await getPhotosWithExif();
```

---

### Photos Not Displaying

**Symptom:** Broken images on site

**Fix:** Check that `filename` in frontmatter matches the actual file:

```yaml
# Correct (relative to public/photos/)
filename: "my-first-album/DSC_0042.jpg"

# Wrong (missing album folder)
filename: "DSC_0042.jpg"

# Wrong (absolute path)
filename: "/photos/my-first-album/DSC_0042.jpg"
```

---

## Next Steps

Congratulations! You've imported your first album. Here's what to do next:

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Add my-first-album with EXIF metadata"
   ```

2. **Import more albums:** Repeat this tutorial with different photo collections

3. **Create gallery pages:** Build out your photo space with album listings, tag filtering, etc.

4. **Refine your tags:** Create a tag constants file (`src/utils/tag-constants.ts`) for consistency

5. **Customize EXIF display:** Update templates to show additional EXIF fields (lens, focal length, etc.)

---

## Quick Reference

### Import Workflow Checklist

- [ ] Choose album slug (lowercase, hyphens)
- [ ] Run `npm run import <slug> ~/photos`
- [ ] Review and edit `batch-import-<slug>.md`
- [ ] Create `src/content/albums/<slug>.md`
- [ ] Create individual `.md` files in `src/content/photos/<slug>/`
- [ ] Delete batch file
- [ ] Run `node scripts/validate-metadata.js <slug>`
- [ ] Build and preview
- [ ] Commit changes

### Essential Commands

```bash
# Import photos
npm run import <album-slug> ~/path/to/photos

# Validate metadata
node scripts/validate-metadata.js <album-slug>

# Build site
npm run build

# Preview site
npm run preview
```

### Helper Functions

```typescript
import {
  getPhotosWithExif,           // All photos with EXIF
  getAlbumPhotosWithExif,       // Album photos with EXIF
  getFeaturedPhotosWithExif,    // Featured photos with EXIF
  getPhotoWithExif,             // Single photo with EXIF
} from '@/utils/photo-helpers';
```

---

Happy importing! If you run into issues, check `scripts/README.md` for more troubleshooting tips.
