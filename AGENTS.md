# AGENTS.md - Portfolio Site Instructions

## Project Overview

Dual-space portfolio for Guru:
- **Professional Space** (`/`): AI blog/learnings, dark terminal aesthetic.
- **Photography Space** (`/photography/*`): Street/landscape portfolio, bright minimal aesthetic.

**Owner:** Guru (AI researcher/engineer, photographer)

## Tech Stack

- **Framework:** Astro 5.x (static site generator)
- **Styling:** Tailwind CSS 4.x (via `@tailwindcss/vite`)
- **Content:** Markdown + Zod Schemas (`src/content/config.ts`)
- **Images:** Astro `<Image>` (Sharp) + EXIF extraction (`exifr`)
- **Testing:** Playwright (E2E)
- **Deployment:** Netlify

## File Organization

### Content (`src/content/`)
- `albums/`: Album metadata (`.md` files).
- `photos/`: Photo metadata (`{album-slug}/*.md`).
- `blog/`: Blog posts and `about.md`.

### Layouts (`src/layouts/`)
- `BlogLayout.astro`: Dark, terminal-inspired (Professional).
- `PhotoLayout.astro`: Bright, minimal, editorial (Photography).
- `GalleryLayout.astro`: Fullscreen viewing.

### Static Assets
- `public/photos/{album-slug}/`: Original photo files.

## Design Implementation

**CRITICAL:** Use `frontend-design` skill for UI components.

- **Professional:** Slate-950 bg, terminal-green/cyan accents, monospace fonts (JetBrains Mono/Fira Code). "Hacker" vibe.
- **Photography:** Cream/White bg, amber/orange accents, sans/serif mix (Work Sans/Crimson Text). "Editorial" vibe.
- **Space Toggle:** Implemented in Layouts. Toggles between `/` and `/photography`.

---

## Photo Workflow (Detailed)

### 1. Import Photos
Run the import script to copy photos and extract initial EXIF/IPTC data.
```bash
npm run import <album-slug> ~/path/to/photos
# Example: npm run import street-sf ~/Desktop/new-photos
```
*Note: Album slug should be kebab-case (e.g., `tokyo-nights`).*

### 2. Review Batch File
The script creates `batch-import-{album-slug}.md` in the project root.
- **Titles:** Replace generic filenames with descriptive titles.
- **Tags:** Add relevant tags (e.g., `street`, `night`, `tokyo`).
- **Descriptions:** Add context/story for the photo.
- **Featured:** Set `featured: true` for top 1-3 photos in the album.
- **Locations:** Add if GPS is missing.

### 3. Create Album Metadata
Create `src/content/albums/{album-slug}.md`:
```yaml
---
title: "Album Title"
description: "Short description for album card"
coverPhoto: "{album-slug}/photo-1.jpg"
date: 2024-11-28
featured: true
order: 1
---
Optional album story or context goes here.
```

### 4. Split & Finalize
Split the batch file into individual `.md` files in `src/content/photos/{album-slug}/`.
- **Directory:** `mkdir -p src/content/photos/{album-slug}`
- **Files:** Create one `.md` file per photo (e.g., `shibuya-crossing.md`).
- **Content:** Copy the YAML block from the batch file and wrap in `---`.
- **Cleanup:** `rm batch-import-{album-slug}.md`

### 5. Validate & Build
```bash
# Check for missing tags/titles
node scripts/validate-metadata.js <album-slug>

# Build site (augments missing data from EXIF)
npm run build
```

---

## Blog Workflow (Professional Space)

### 1. Create Post
Create a new markdown file in `src/content/blog/`:
```bash
touch src/content/blog/my-new-post.md
```

### 2. Frontmatter Schema
```yaml
---
title: "Understanding LLM Agents"
description: "A deep dive into agentic workflows."
date: 2024-11-28
tags: ["ai", "llm", "engineering"]
isNotebook: false
---

# Content starts here...
```

### 3. Jupyter Notebooks
If importing a notebook:
1.  Export notebook to Markdown.
2.  Place in `src/content/blog/`.
3.  Set `isNotebook: true` in frontmatter.
4.  **Styling:** The `BlogLayout` applies specific CSS for notebook code cells and outputs.
5.  **Images:** Save notebook images to `public/images/blog/{post-slug}/` and update links in markdown.

---

## Development & Testing

### Helper Functions
When querying photos, ALWAYS use the helpers to ensure EXIF data is attached:
```typescript
import { getPhotosWithExif, getAlbumPhotosWithExif } from '@/utils/photo-helpers';
```

### Commands
```bash
npm run dev            # Start dev server
npm run build          # Production build
npm run preview        # Preview production build
npm run test           # Run all tests
npm run test:visual    # Visual regression only
```

### Key Gotchas
1.  **Image Path:** `filename` in photo frontmatter is relative to `public/photos/`.
2.  **EXIF:** Build time extracts EXIF. First build is slow; subsequent builds use cache.
3.  **Tags:** Case-sensitive. Keep consistent (e.g., always lowercase).
4.  **Blog Routes:** `/blog/[slug]` handles individual posts.
