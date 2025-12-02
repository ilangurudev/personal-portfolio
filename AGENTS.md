# AGENTS.md - Personal Portfolio Documentation

**Owner:** Guru Ilangovan (AI/LLM Engineer, Photographer)

## 1. Project Overview

**Concept:** Dual-space portfolio showcasing two distinct identities:
- **Professional Space** (`/`): AI blog, learnings, projects - terminal "hacker" aesthetic
- **Photography Space** (`/photography/*`): Street/landscape portfolio - bright editorial aesthetic

**Design Philosophy:**
- Complete separation of aesthetics (no mixing)
- Content-driven architecture (Markdown + Zod schemas)
- Progressive enhancement (SSR with React islands for interactivity)
- Performance-first (infinite scroll, CDN, image optimization)

---

## 2. Documentation Map

For detailed information, refer to the `AGENTS.md` in specific directories:

| Topic | Location | Description |
|-------|----------|-------------|
| **Core Architecture** | [`src/AGENTS.md`](src/AGENTS.md) | Rendering model, design systems, content schemas |
| **Components** | [`src/components/AGENTS.md`](src/components/AGENTS.md) | UI components (Lightbox, Gallery, Filtering) |
| **Workflows** | [`scripts/AGENTS.md`](scripts/AGENTS.md) | Import/Remove photos, Blog/Project creation |
| **Utilities** | [`src/utils/AGENTS.md`](src/utils/AGENTS.md) | Helper functions, URL generation |
| **Testing** | [`tests/AGENTS.md`](tests/AGENTS.md) | Development commands, E2E tests |

---

## 3. Tech Stack & Configuration

### Core Technologies
- **Framework:** Astro 5.x (static site generator)
- **Styling:** Tailwind CSS 4.x (via `@tailwindcss/vite`)
- **Interactivity:** React 18.x (islands architecture via `@astrojs/react`)
- **Content:** Astro Content Collections with Zod schemas
- **Images:** Sharp (via Astro `<Image>`) + exifr (EXIF extraction)
- **Cloud Storage:** Cloudflare R2 (S3-compatible) with Image Resizing
- **Testing:** Playwright (E2E)
- **Deployment:** Netlify

### Key Configuration Files
- **`astro.config.mjs`:** Integrations (React, Tailwind)
- **`src/content/config.ts`:** Zod schemas for `albums`, `photos`, `blog`, `projects`
- **Environment Variables:** `PUBLIC_PHOTO_CDN_URL`, `R2_ACCOUNT_ID`, etc.

---

## 4. Quick Start

**Development:**
```bash
npm run dev            # Start dev server
npm run import         # Import photos
```

**Key Features:**
- **Dual-Space Toggle:** Switch between Professional (`/`) and Photography (`/photography`)
- **Advanced Filtering:** 8-dimensional photo filtering (Tags, EXIF, Date)
- **Infinite Scroll:** Virtualized photo grid
- **Lightbox:** Full-featured image viewer with EXIF data

**Important Rules:**
- **Images:** Use `getPhotosWithExif()` helper, never raw collection.
- **Styles:** Keep Professional (dark/terminal) and Photography (light/editorial) styles separate.
- **Content:** All content is driven by Markdown frontmatter.
- ALWAYS remember to keep the corresponding AGENTS.md updated after any changes to the codebase. Not all changes warrant a full update, but be sure to update the AGENTS.md for any changes that affect the codebase materially.
