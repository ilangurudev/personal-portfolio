# Understanding of Codebase Based on AGENTS.md

## Project Overview
The project is a **dual-space personal portfolio** for Guru Ilangovan, combining two distinct identities:
1.  **Professional Space (`/`)**: A "hacker" aesthetic (terminal style, dark mode) for AI blog posts, projects, and learnings.
2.  **Photography Space (`/photography/*`)**: An "editorial" aesthetic (bright, clean) for a street/landscape photography portfolio.

## Tech Stack
-   **Core**: Astro 5.x (SSG), React 18.x (Islands), Tailwind CSS 4.x.
-   **Content**: Markdown with Zod schemas (Content Collections).
-   **Images**: Sharp, Cloudflare R2, Cloudflare Image Resizing.
-   **Testing**: Playwright.
-   **Deployment**: Netlify.

## Key Architectural Concepts
1.  **Hybrid Rendering**: Static HTML for SEO/performance, React Islands for interactivity (Gallery, Lightbox).
2.  **Separation of Concerns**:
    -   Distinct layouts and design systems for the two spaces to prevent style bleed.
    -   Vanilla JS for static UI state (e.g., filters) communicating with React components via `CustomEvents`.
3.  **Content-First**:
    -   All data (photos, albums, blogs) is driven by Markdown frontmatter.
    -   `src/content/config.ts` enforces schemas.
    -   Photo metadata (EXIF) is stored in frontmatter, not extracted at runtime.

## Key Components & Features
-   **Dual-Space Toggle**: Seamless switching between the two personas.
-   **Photo Gallery**:
    -   Infinite scroll (virtualized).
    -   Advanced 8-dimensional filtering (Tags, EXIF, Date, etc.).
    -   Real-time updates via CustomEvents.
-   **Lightbox**: Full-featured viewer with EXIF data display, keyboard nav, and preloading.
-   **Workflows**:
    -   `npm run import`: Automates photo processing, EXIF extraction, and R2 upload.
    -   `npm run remove`: Safely deletes photos and metadata.

## Questions & Gaps
Based *only* on the `AGENTS.md` files, here are some questions and potential gaps:

1.  **Test Coverage**: `tests/AGENTS.md` explicitly states "Test files may not exist yet". It is unclear how much of the testing strategy (Playwright E2E) is actually implemented versus planned.
2.  **Deployment Details**: While Netlify and Cloudflare R2 are mentioned, the specific deployment configuration (e.g., `netlify.toml` or CI/CD pipelines) is not detailed in the `AGENTS.md` files.
3.  **Legacy Code**: There are mentions of "deprecated" scripts like `npm run copy-exif` and `npm run fix-frontmatter`. It's unclear if these are still in the codebase or just referenced for historical context.
4.  **Tailwind 4.x**: The stack mentions Tailwind 4.x via `@tailwindcss/vite`. Since v4 is relatively new/beta, are there specific configuration quirks documented? (Not found in `AGENTS.md`).
5.  **"Islands" Specifics**: The communication between Vanilla JS and React via `CustomEvents` is well-described, but the exact boundaries of *which* components are islands and which are static is only generally described (Gallery/Lightbox vs. the rest).

## Conclusion
The documentation provides a very strong high-level and mid-level understanding of the system. The "Dual-Space" concept is central, and the technical decisions (Astro, Islands, CustomEvents) clearly support this separation and performance goals.
