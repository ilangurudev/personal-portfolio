# Scripts & Workflows

## 1. Photo Import Workflow

**Purpose:** Import photos, extract EXIF/IPTC, create batch metadata file for review.

**Command:**
```bash
npm run import ~/path/to/photos
# Example: npm run import ~/Desktop/tokyo-nights
```

**Process:**
1. **Album Slug Extraction:** Last path component becomes album slug (e.g., `tokyo-nights`)
2. **Interactive CLI & UI:** `import-ui.js` prompts for album details (optional) and spins up a temporary UI for ease of use.
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
4. Build: `npm run build` (augments any missing EXIF data)

## 2. Photo Removal Workflow

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

## 3. Blog Post Workflow

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

## 4. Project Workflow

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

## 5. Utility Scripts

### `add-delta.js`
- **Command:** `npm run add-delta`
- **Purpose:** Figures out the photos in the source directory that are not present in the destination directory and adds them to the destination directory.
- **Usage:** Interactive CLI prompts for album and time offset.


### `sync-keywords.js`
- **Command:** `npm run sync_keywords`
- **Purpose:** Syncs IPTC keywords from photo files to frontmatter tags.

