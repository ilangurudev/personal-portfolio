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
npm run import ~/path/to/photos
# Example: npm run import ~/Desktop/new-photos
# Album slug will be extracted from the path: "new-photos"
```
*Note: The album slug is automatically extracted from the last component of the path. Use kebab-case folder names (e.g., `tokyo-nights`).*

### 1b. Remove Photos or Whole Albums
Use the removal CLI whenever an image (and its metadata) needs to be deleted so files don't drift out of sync.
```bash
# Dry-run to preview deletions
npm run remove -- --album pacific-northwest --dry-run

# Force-delete album assets, metadata, and batch file with no prompt
npm run remove -- --album pacific-northwest --yes

# Remove a single photo by metadata slug or source filename
npm run remove -- --photo new-york/AR53764
npm run remove -- --photo new-york/_AR53764.jpg
```
The script automatically removes empty `src/content/photos/<album>` and `public/photos/<album>` folders; if the final photo in an album is deleted, the album metadata file is cleaned up too.

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

---

## Content Directory Schemas

### Blog Posts (`src/content/blog/`)

**Frontmatter Schema** (from `src/content/config.ts`):
- **title** (required): Post title
- **description** (required): Short description for SEO and previews
- **date** (required): Publication date
- **tags** (required): Array of tags for categorization
- **isNotebook** (optional, default: false): Set to `true` for Jupyter notebook imports

**Featured on Homepage:**
- Homepage (`/`) displays the **5 most recent** blog posts (excluding `about.md`)
- Sorted by date descending
- Command prompt: `$ ls -la blog/ | tail -n 5`

**Special Files:**
- `about.md`: Special about page, not listed in blog index

---

### Projects (`src/content/projects/`)

**Frontmatter Schema** (from `src/content/config.ts`):
- **title** (required): Project name
- **description** (required): Short description for project cards
- **date** (required): Project date (used for sorting)
- **tags** (required): Array of technology tags
- **image** (optional): Path to project screenshot/image (relative to `public/`)
- **link** (optional): Live demo/deployment URL
- **repo** (optional): GitHub repository URL
- **featured** (optional, default: false): Featured projects appear first

**Featured on Homepage:**
- Homepage (`/`) displays up to **5 projects**
- Featured projects (`featured: true`) appear first with `★` indicator
- Then sorted by date descending
- Command prompt: `$ ls -la projects/ | tail -n 5`

**Project Images:**
Place in `public/projects/` and reference: `image: "/projects/project-name.png"`

**Example:**
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

# Project details...
```

---

### Albums (`src/content/albums/`)

**Frontmatter Schema** (from `src/content/config.ts`):
- **title** (required): Album display name
- **description** (required): Short description for album cards
- **coverPhoto** (required): Path to cover photo (format: `{album-slug}/{photo}.jpg`)
- **date** (required): Album date (for sorting)
- **featured** (optional, default: false): Featured albums appear first
- **order** (optional, default: 0): Manual ordering (lower numbers first)

**Album Ordering:**
Albums are sorted by:
1. **Featured** status (featured first)
2. **Order** field (lower numbers first)
3. **Date** (newest first)

**Album Routes:**
- `/photography` - Homepage showing all albums
- `/photography/albums` - Grid view of all albums
- `/photography/album/{slug}` - Individual album page

---

### Photos (`src/content/photos/`)

**Directory Structure:**
```
photos/
├── album-slug/
│   ├── photo-1.md
│   ├── photo-2.md
│   └── ...
```

**Frontmatter Schema** (from `src/content/config.ts`):

*Manual Fields (edit before committing):*
- **title** (required): Descriptive photo title
- **album** (required): Album slug (must match album folder name)
- **filename** (required): Path relative to `public/photos/`
- **tags** (required): Searchable tags array
- **featured** (optional, default: false): Show on featured photos page
- **location** (optional): Location description (from GPS or manual)

*Technical Fields (auto-filled from EXIF):*
- **date** (required): Photo date (extracted from EXIF DateTimeOriginal)
- **camera** (optional): Camera model (extracted from EXIF Make + Model)
- **settings** (optional): Camera settings (aperture, shutter, ISO)

**Note:** Frontmatter values override EXIF data if provided.

**Photo Routes:**
- `/photography` - Featured photos and albums
- `/photography/album/{album-slug}` - Album gallery
- `/photography/tag/{tag}` - Photos filtered by tag
- `/photography/tags` - All tags index

---

## Layouts Reference

### BlogLayout.astro (Professional Space)

**Used For:**
- `/` - Homepage with dashboard
- `/blog` - Blog index
- `/blog/{slug}` - Individual blog posts
- `/projects` - Projects index
- `/projects/{slug}` - Individual projects

**Design System:**
- **Background**: Slate-950 (very dark gray)
- **Primary**: Terminal-green (`#22c55e`) with glow effects
- **Secondary**: Terminal-cyan (`#06b6d4`)
- **Accent**: Terminal-yellow (`#eab308`)
- **Text**: Terminal-gray (muted white)
- **Fonts**: Monospace (Fira Code, JetBrains Mono)

**Usage:**
```astro
import BlogLayout from '../layouts/BlogLayout.astro';

<BlogLayout title="Page Title" description="Description">
  <!-- Content -->
</BlogLayout>
```

**Key Features:**
- Terminal-style command prompts with blinking cursors
- Space toggle in header (switches to `/photography`)
- Syntax highlighting for code blocks
- Special styling for Jupyter notebooks

See `src/layouts/CLAUDE.md` for complete layout documentation.

---

### PhotoLayout.astro (Photography Space)

**Used For:**
- `/photography` - Photography homepage
- `/photography/albums` - Albums grid
- `/photography/album/{slug}` - Album galleries
- `/photography/tags` - Tags index
- `/photography/tag/{tag}` - Tag-filtered photos

**Design System:**
- **Background**: Cream/White (`#fafaf9`)
- **Primary**: Amber (`#f59e0b`)
- **Secondary**: Orange (`#ea580c`)
- **Text**: Dark gray/black
- **Fonts**: Sans-serif (Work Sans) + Serif (Crimson Text)

**Usage:**
```astro
import PhotoLayout from '../layouts/PhotoLayout.astro';

<PhotoLayout title="Page Title" description="Description">
  <!-- Content -->
</PhotoLayout>
```

**Key Features:**
- Space toggle in header (switches to `/`)
- Clean, minimal grid layouts
- EXIF data display on photo pages
- Tag navigation

See `src/layouts/CLAUDE.md` for complete layout documentation.
