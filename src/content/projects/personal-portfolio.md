---
title: "Building a Dual-Identity Portfolio: Technical Deep Dive"
description: "A comprehensive technical walkthrough of how I built a dual-space portfolio with Astro, React Islands, Cloudflare CDN, and an 8-dimensional photo filtering system—all orchestrated by AI agents."
date: 2024-11-28
tags: ["astro", "typescript", "react", "cloudflare", "performance", "ai", "architecture", "photography"]
image: "/projects/dual-portfolio.png"
featured: true
repo: "https://github.com/ilangurudev/personal-portfolio/"
---

# Building a Dual-Identity Portfolio: A Technical Deep Dive

*For Python developers curious about modern web architecture*

This article is the technical companion to [my blog post about building this portfolio with AI agents](/blog/building-portfolio-with-ai). While that post covers the *process* and lessons learned, this one dives into the *architecture*—how all the pieces fit together, why I made certain choices, and how you might apply similar patterns to your own projects.

If you're coming from Python, I'll draw parallels throughout. Think of this as "Astro for Pythonistas."

---

## The Problem: Two Identities, One Domain

I needed a portfolio that could showcase two completely different personas:

1. **Professional Space** (`/`): AI/ML engineering blog, projects, terminal-hacker aesthetic
2. **Photography Space** (`/photography/*`): Street photography portfolio, bright editorial magazine aesthetic

The catch? **Complete aesthetic isolation**. These two spaces should feel like different websites that happen to share a URL. No "style bleed"—the dark terminal green of my blog should never accidentally leak into the cream-and-amber photography gallery.

```
┌─────────────────────────────────────────────────────────────────┐
│                         guru.dev                                 │
├───────────────────────────┬─────────────────────────────────────┤
│    Professional Space     │       Photography Space              │
│         (/)               │        (/photography/*)              │
├───────────────────────────┼─────────────────────────────────────┤
│  • Dark (slate-950)       │  • Light (cream #FFFBF5)            │
│  • Terminal green/cyan    │  • Amber/terracotta accents         │
│  • JetBrains Mono         │  • Crimson Text + Work Sans         │
│  • "Hacker" aesthetic     │  • "Editorial magazine" aesthetic   │
│  • Blog posts, projects   │  • Photo albums, galleries          │
└───────────────────────────┴─────────────────────────────────────┘
```

While I considered several exisitng solutions like squarespace, I wanted something that is infninitely customizable and cheap. 

---

## Tech Stack Overview

Before diving deep, here's what's under the hood:

| Layer | Technology | Python Equivalent |
|-------|------------|-------------------|
| **Framework** | Astro 5.x | Flask/FastAPI (but static) |
| **Interactivity** | React 18 (Islands) | Htmx + Alpine.js |
| **Styling** | Tailwind CSS 4.x | — |
| **Content** | Markdown + Zod schemas | Markdown + Pydantic |
| **Images** | Sharp + Cloudflare R2 | Pillow + S3 |
| **Testing** | Playwright | Selenium/Playwright |
| **Deployment** | Netlify (static) | Vercel/Render |

---

## Architecture Deep Dive

### 1. Why Astro? (Not Next.js, Not a Python SSG)

I chose Astro for three reasons:

**Zero-JS by Default**: Astro ships zero JavaScript unless you explicitly add interactive components. For a portfolio where 90% of content is static (blog posts, photo grids), this means faster loads than any React SPA.

**Content Collections**: Astro has built-in support for typed content. Think of it like having Pydantic models automatically validate your Markdown frontmatter at build time.

**Islands Architecture**: Instead of hydrating the entire page (React SPA style), Astro only hydrates specific components that need interactivity. My lightbox needs JavaScript; my blog post doesn't.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Traditional SPA (React/Next)                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    ALL JavaScript                        │   │
│  │   Header │ Sidebar │ Content │ Footer │ Comments        │   │
│  │   (hydrated) (hydrated) (hydrated) (hydrated) (hydrated)│   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Islands Architecture (Astro)                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   Header │ Sidebar │ Content │ Footer │ Comments        │   │
│  │   (static) (static)  (static) (static)  (React!)        │   │
│  │            ↓                              ↓              │   │
│  │         Plain HTML                   Hydrated Island    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**For Python folks**: If you've used Jinja2 templates with Flask, Astro feels similar—but with TypeScript, component imports, and build-time content validation. It's like if Pelican and React had a very performant baby.

---

### 2. Content Collections: Pydantic for the Web

Astro's content collections use Zod for schema validation. If you know Pydantic, you'll feel right at home:

```typescript
// src/content/config.ts - This is like your Pydantic models

import { defineCollection, z } from 'astro:content';

const photos = defineCollection({
  type: 'content',
  schema: z.object({
    // Manual fields (you edit these)
    title: z.string(),
    album: z.string(),
    filename: z.string(),
    tags: z.array(z.string()),
    featured: z.boolean().default(false),
    position: z.enum(['top', 'middle', 'bottom']).default('middle'),

    // Technical fields (auto-filled from EXIF)
    date: z.date(),
    camera: z.string().optional(),
    settings: z.string().optional(),  // "f/2.8, 1/250s, ISO 400"
    focalLength: z.number().optional(),
  }),
});
```

**Python equivalent** (for comparison):

```python
# This is what it would look like in Pydantic
from pydantic import BaseModel
from typing import Optional, Literal
from datetime import date

class Photo(BaseModel):
    title: str
    album: str
    filename: str
    tags: list[str]
    featured: bool = False
    position: Literal['top', 'middle', 'bottom'] = 'middle'

    date: date
    camera: Optional[str] = None
    settings: Optional[str] = None
    focal_length: Optional[int] = None
```

The schema validates every Markdown file's frontmatter at build time. Invalid data = build fails. No runtime surprises.

---

### 3. The Dual-Layout System

The key to aesthetic isolation is **separate layouts with scoped CSS variables**:

```
src/layouts/
├── BlogLayout.astro      # Professional space (dark terminal)
└── PhotoLayout.astro     # Photography space (light editorial)
```

Each layout defines its own design tokens:

```css
/* BlogLayout.astro - Professional Space */
:root {
  --slate-950: #020617;
  --terminal-green: #22c55e;
  --terminal-cyan: #06b6d4;
  --font-mono: 'JetBrains Mono', monospace;
}

/* PhotoLayout.astro - Photography Space */
:root {
  --cream: #FFFBF5;
  --amber: #D97706;
  --terracotta: #C2410C;
  --font-heading: 'Crimson Text', serif;
  --font-body: 'Work Sans', sans-serif;
}
```

**Why not a single layout with a theme toggle?** Because that creates coupling. If I change the blog's accent color, I don't want to accidentally affect the photo gallery. Separate layouts = separate concerns = peace of mind.

---

### 4. The Data Flow Pipeline

Here's how content flows from Markdown to rendered page:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Markdown Files  │      │ Zod Validation  │      │ Astro Pages     │
│ (frontmatter)   │ ───► │ (config.ts)     │ ───► │ (SSG HTML)      │
└─────────────────┘      └─────────────────┘      └────────┬────────┘
                                                           │
                                                           ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Browser (DOM)   │ ◄─── │ React Islands   │ ◄─── │ Client Hydration│
│ (Interactivity) │      │ (Components)    │      │ (JS Bundle)     │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

1. **Write**: Create `src/content/photos/tokyo/shibuya.md` with frontmatter
2. **Validate**: Zod schema checks all fields at build time
3. **Generate**: Astro queries collections and generates static HTML
4. **Hydrate**: React components (gallery, lightbox) come alive on the client

---

## The 8-Dimensional Filtering System

This is the most complex feature. The photography gallery supports filtering across **8 dimensions**:

1. **Tags** - Multi-select with AND/OR logic toggle
2. **Albums** - Filter by album
3. **Cameras** - Filter by camera model
4. **Date Range** - Min/max date pickers
5. **Aperture** - Dual-range slider (f-stop)
6. **Shutter Speed** - Dual-range slider
7. **ISO** - Dual-range slider
8. **Focal Length** - Dual-range slider (mm)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Filter Panel Architecture                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐         CustomEvent            ┌────────────┐ │
│  │  Vanilla JS  │  ──── 'tagFilterChange' ────►  │   React    │ │
│  │  Filter UI   │                                │  Gallery   │ │
│  │  (static)    │ ◄──── window.updateLightbox ── │  (island)  │ │
│  └──────────────┘                                └────────────┘ │
│                                                                  │
│  Event Payload:                                                  │
│  {                                                               │
│    activeTags: ['street', 'night'],                             │
│    tagLogic: 'and' | 'or',                                      │
│    filters: { aperture: [1.4, 8], iso: [100, 3200], ... }       │
│  }                                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### The Bridge: CustomEvents

The filter UI is vanilla JavaScript (static HTML, no hydration needed). The gallery is React (needs state management). How do they talk?

**CustomEvents**—the browser's built-in pub/sub system:

```typescript
// Vanilla JS (filter buttons) - PUBLISHER
function onTagClick(tag: string) {
  window.dispatchEvent(new CustomEvent('tagFilterChange', {
    detail: {
      activeTags: ['street', 'night'],
      tagLogic: 'and'
    }
  }));
}

// React component - SUBSCRIBER
useEffect(() => {
  const handleFilterChange = (event: CustomEvent) => {
    const { activeTags, tagLogic } = event.detail;
    setActiveTags(new Set(activeTags));
    setTagLogic(tagLogic);
  };

  window.addEventListener('tagFilterChange', handleFilterChange);
  return () => window.removeEventListener('tagFilterChange', handleFilterChange);
}, []);
```

**Python equivalent**: This is like using Redis pub/sub or Python's `asyncio.Event` to coordinate between different parts of your application. The filter UI publishes state changes; the gallery subscribes and re-renders.

### Filtering Logic: AND vs OR

Users can toggle between AND and OR logic for tags:

```typescript
// FilteredPhotoGallery.tsx
const filteredPhotos = useMemo(() => {
  if (activeTags.size === 0) return allPhotos;

  return allPhotos.filter(photo => {
    const photoTags = photo.data.tags.map(normalizeTag);

    if (tagLogic === 'and') {
      // ALL selected tags must be present
      return Array.from(activeTags).every(tag => photoTags.includes(tag));
    }
    // ANY selected tag matches
    return Array.from(activeTags).some(tag => photoTags.includes(tag));
  });
}, [allPhotos, activeTags, tagLogic]);
```

The `useMemo` hook ensures filtering only recalculates when dependencies change—similar to Python's `@functools.lru_cache` but for React render cycles.

---

## Performance: Cloudflare Image Resizing & Infinite Scroll

### Dynamic Image Resizing

Photos are stored in Cloudflare R2 (S3-compatible). Instead of pre-generating thumbnails, I use **Cloudflare Image Resizing** on-the-fly:

```typescript
// src/utils/url-helper.ts
export function getResizedPhotoUrl(filename: string, width: number = 400): string {
  const cdnUrl = import.meta.env.PUBLIC_PHOTO_CDN_URL;

  if (cdnUrl) {
    // Cloudflare Image Resizing URL pattern
    return `${cdnUrl}/cdn-cgi/image/width=${width},quality=85,format=jpg/${filename}`;
  }

  // Local fallback (no resizing in dev)
  return `/photos/${filename}`;
}
```

**How it works**:
- Full-size photo: `https://cdn.example.com/tokyo/shibuya.jpg` (5MB)
- Thumbnail: `https://cdn.example.com/cdn-cgi/image/width=400,quality=85,format=jpg/tokyo/shibuya.jpg` (50KB)

Cloudflare resizes on first request, then caches at the edge. No pre-processing, no storage duplication.

**Python equivalent**: This is like using Pillow to resize images, but done at the CDN level. Imagine if your S3 bucket could automatically serve different sizes based on URL parameters.

### Infinite Scroll with Intersection Observer

Loading 200+ photos at once would kill performance. Instead, I use **batch loading**:

```typescript
// InfinitePhotoGallery.tsx
const INITIAL_LOAD = 20;
const LOAD_MORE = 20;

export const InfinitePhotoGallery: React.FC<Props> = ({ photos }) => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < photos.length) {
          setVisibleCount(prev => Math.min(prev + LOAD_MORE, photos.length));
        }
      },
      { rootMargin: '200px' }  // Trigger 200px before reaching bottom
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [visibleCount, photos.length]);

  return (
    <div className="gallery-grid">
      {photos.slice(0, visibleCount).map(photo => (
        <PhotoCard key={photo.id} photo={photo} />
      ))}

      {/* Invisible sentinel triggers loading */}
      {visibleCount < photos.length && (
        <div ref={sentinelRef}>Loading more...</div>
      )}
    </div>
  );
};
```

**The flow**:
1. Initial render: 20 photos
2. User scrolls → sentinel enters viewport (200px margin)
3. Observer fires → load 20 more
4. Repeat until all photos loaded

**Python equivalent**: Similar to lazy loading in Django QuerySets with pagination, but triggered by scroll position rather than page navigation.

---

## The Import Pipeline: AI-Generated Disposable Tools

One of the joys of AI-assisted development: you can create **disposable convenience tools** that would normally be "too expensive" to justify.

### The Photo Import Script

```bash
npm run import ~/Desktop/tokyo-night-photos
```

This single command:
1. Extracts the album slug from the path (`tokyo-night-photos`)
2. Spins up a **temporary web UI** for selecting cover image and featured photos
3. Copies photos to `public/photos/{album}/`
4. Extracts EXIF data (camera, settings, GPS coordinates, IPTC keywords)
5. Optionally uploads to Cloudflare R2
6. Generates a batch Markdown file for review

### The Temporary Import UI

The import script launches a temporary Express server with a visual interface:

```javascript
// scripts/import-ui.js
export async function getAlbumDetails(sourcePath, photos, defaultTitle) {
  return new Promise(async (resolve) => {
    const app = express();
    const port = 3333;

    app.get('/', (req, res) => {
      // Serve a Tailwind-styled HTML page with:
      // - Grid of all photos
      // - Click to set cover image (amber highlight)
      // - Ctrl+Click to toggle featured (green highlight)
      // - Form for album title/description
    });

    app.post('/submit', (req, res) => {
      resolve(req.body);  // Return selections to main script
      server.close();     // Kill the server
    });

    const server = app.listen(port);
    open(`http://localhost:${port}`);  // Auto-open browser
  });
}
```

**Why build this?** Pre-AI, this would be "too much work" for a personal project. I'd either:
- Use a clunky CLI and eyeball photo filenames
- Manually edit each Markdown file

With AI agents, I described what I wanted and got a fully functional import UI in ~30 minutes. It's **disposable convenience**—if I never use it again, no big deal. If I use it twice, it's already paid for itself.

---

## The AGENTS.md Documentation System

Throughout the codebase, you'll find `AGENTS.md` files:

```
AGENTS.md                        # Root: project overview
src/AGENTS.md                    # Architecture & data flow
src/components/AGENTS.md         # Component documentation
src/layouts/AGENTS.md            # Theme system
scripts/AGENTS.md                # Import/remove workflows
tests/AGENTS.md                  # Testing commands
```

These aren't just for humans—they're **context files for AI agents**.

### Why It Matters

When I start a new Claude Code session, the agent reads these files and immediately understands:

- **Architectural decisions**: Why islands? Why separate layouts?
- **Existing utilities**: Don't reinvent `getPhotoUrl()`, it exists
- **Testing workflow**: Run `npm test` before committing
- **Critical rules**: "Never mix the two visual themes"

```markdown
# From AGENTS.md

### Why Islands Architecture?
- **Efficiency:** We only hydrate the interactive parts (filtering, lightbox).
- **Isolation:** A heavy React component in the gallery doesn't slow
  down the blog post reader.

### Why Separate Layouts?
- **Aesthetic Integrity:** Prevents "style creep" between the Hacker
  (Professional) and Editorial (Photography) personas.
```

**The investment compounds**. Each session is more productive because the AI has better context. It's like onboarding a new developer—except the docs actually get read.

### Keeping Docs Updated

Here's the critical rule from the root `CLAUDE.md`:

> ALWAYS remember to keep the corresponding AGENTS.md updated after any changes to the codebase. Not all changes warrant a full update, but be sure to update the AGENTS.md for any changes that affect the codebase materially.

The AI maintains its own documentation. When it adds a new component, it updates `components/AGENTS.md`. When it changes the build process, it updates `scripts/AGENTS.md`. Self-documenting code taken literally.

---

## The Test Suite: Your Safety Net

With AI writing code, tests become essential. I have 19 Playwright test files covering:

| Test File | What It Verifies |
|-----------|------------------|
| `dual-space-navigation.spec.js` | Professional ↔ Photography switching |
| `tag-filtering-and-or.spec.cjs` | AND/OR modes, tag availability |
| `lightbox-interactions.spec.cjs` | Open/close, navigation, keyboard controls |
| `infinite-scroll.spec.cjs` | Batch loading, scroll triggers |
| `advanced-filters.spec.cjs` | All 8 filter dimensions |
| `css-rendering-leaks.spec.cjs` | No CSS code appearing as text |

```bash
npm test                    # Run all specs in parallel
npm run test:filters        # Just the filter tests
npm run test:lightbox       # Just lightbox tests
```

**The workflow with AI**:
1. Ask for a new feature
2. AI implements it
3. Run `npm test`
4. Tests fail (often subtle regressions)
5. Share failures with AI
6. AI fixes
7. Repeat until green

Tests transform AI-assisted development from "hope it works" to **verified correctness**. I can ask for aggressive refactors without holding my breath.

---

## Key Takeaways

If you're building something similar (or just curious about modern web architecture), here's what I learned:

### 1. Islands Architecture is Underrated
Don't hydrate what doesn't need interactivity. My blog posts are static HTML. Only the gallery and lightbox need JavaScript. Result: faster loads, less complexity.

### 2. Zod/Pydantic-Style Validation is Essential
Type-safe content at build time catches errors before deployment. If you're using Markdown with frontmatter, validate it.

### 3. CustomEvents Bridge Framework Boundaries
When you have static HTML that needs to talk to React (or any framework), browser-native CustomEvents are simple and effective.

### 4. CDN Image Resizing Beats Pre-Processing
Don't generate 5 sizes of every image. Let the CDN resize on-demand. Less storage, less build complexity, same performance.

### 5. Document for Your AI
If you're using AI coding assistants, structured documentation like `AGENTS.md` pays dividends. The AI reads it, understands context, and makes fewer mistakes.

### 6. Tests Enable Fearless Refactoring
With comprehensive E2E tests, you can ask AI to make sweeping changes and immediately know if something broke.

---

## Final Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Personal Portfolio                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        Content Layer                             │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │   │
│  │  │  Blog   │  │ Projects│  │  Albums │  │  Photos │            │   │
│  │  │   .md   │  │   .md   │  │   .md   │  │   .md   │            │   │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘            │   │
│  │       └───────────┬┴───────────┬┴───────────┘                   │   │
│  │                   ▼            ▼                                │   │
│  │              Zod Schema Validation (config.ts)                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                  │                                      │
│                                  ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        Build Layer (Astro)                       │   │
│  │  ┌──────────────────┐              ┌──────────────────┐         │   │
│  │  │  BlogLayout.astro │              │ PhotoLayout.astro│         │   │
│  │  │  (dark terminal)  │              │ (light editorial)│         │   │
│  │  └──────────────────┘              └──────────────────┘         │   │
│  │                    Static Site Generation                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                  │                                      │
│                                  ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       Client Layer                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│  │  │ Filter Panel │  │   Gallery    │  │   Lightbox   │          │   │
│  │  │ (Vanilla JS) │  │   (React)    │  │  (Vanilla JS)│          │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │   │
│  │         │     CustomEvents │                 │                  │   │
│  │         └────────► ◄──────┴────────► ◄──────┘                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                  │                                      │
│                                  ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Infrastructure                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│  │  │   Netlify    │  │ Cloudflare   │  │ Cloudflare   │          │   │
│  │  │   (Hosting)  │  │     R2       │  │   Resizing   │          │   │
│  │  │              │  │   (Storage)  │  │   (Images)   │          │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## The Stack in Numbers

- **Framework**: Astro 5.x (static site generator)
- **Interactive Components**: React 18 (islands architecture)
- **Styling**: Tailwind CSS 4.x
- **Content Validation**: Zod schemas
- **Image Processing**: Sharp (build) + Cloudflare (runtime)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Testing**: 19 Playwright E2E test files
- **Documentation**: 6 AGENTS.md files across the codebase

---

## Resources

- **Source Code**: [github.com/ilangurudev/personal-portfolio](https://github.com/ilangurudev/personal-portfolio/)
- **The Development Story**: [I Built This Portfolio Without Writing a Single Line of Code](/blog/building-portfolio-with-ai)
- **Astro Documentation**: [docs.astro.build](https://docs.astro.build)
- **Cloudflare Image Resizing**: [developers.cloudflare.com/images](https://developers.cloudflare.com/images/)
