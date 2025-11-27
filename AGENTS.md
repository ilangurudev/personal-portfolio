# AGENTS.md - Portfolio Site Instructions

## Project Overview

Dual-space personal portfolio site for Guru featuring:
- **Photography Space** (`/photo/*`): Street & landscape photography portfolio with gallery navigation
- **Professional Space** (`/` and `/blog/*`): AI blog and learnings with dark terminal aesthetic

**Owner:** Guru (into street/landscape photography, AI researcher/engineer)

## Tech Stack

- **Framework:** Astro 4.x (static site generator)
- **Styling:** Tailwind CSS
- **Content Management:** File-based with markdown frontmatter + Zod schemas
- **Image Processing:** Astro's built-in `<Image>` component (Sharp)
- **Deployment:** Netlify (static hosting)
- **Languages:** TypeScript, Astro components

## File Organization Conventions

### Content Structure
```
src/content/
├── albums/          # Album metadata (one .md per album)
├── photos/          # Photo metadata (mirrors album structure)
│   └── album-name/  # One .md per photo
└── blog/            # Blog posts and about page
```

### Component Organization
```
src/components/
├── photo/           # Photography-specific components
├── blog/            # Blog-specific components
└── shared/          # Cross-space components (Header, Footer, SpaceToggle)
```

### Layouts
- `PhotoLayout.astro`: Bright, minimal aesthetic for photography
- `BlogLayout.astro`: Dark, hacker-esque theme for professional content
- `GalleryLayout.astro`: Fullscreen photo viewing mode

### Photo Storage
```
public/photos/
└── album-name/      # Album folder = album slug
    ├── photo1.jpg
    ├── photo2.jpg
    └── ...
```

**Important:** Original photos go directly into repo - no pre-processing required. Astro handles optimization at build time.

## Design Preferences

### Photography Space Aesthetic
- **Vibe:** Bright, minimal, artistic (but not generic AI aesthetic)
- **Colors:** White/cream backgrounds, amber/orange accents
- **Typography:** Sans-serif (Inter or similar)
- **Layout:** Masonry grid for photos, generous whitespace
- **Navigation:** Clean, unobtrusive

### Professional Space Aesthetic
- **Vibe:** Dark, terminal/hacker-inspired, technical
- **Colors:** Slate-950 background, green/cyan accents (matrix vibes)
- **Typography:** Monospace fonts (Fira Code, JetBrains Mono)
- **Layout:** Code-editor inspired, structured
- **Navigation:** Command-line inspired elements

### Cross-Space Toggle
- Visible on ALL pages (top-right corner recommended)
- Styled contextually for each space
- Clear visual indicator of current space
- Simple toggle between `/` (Professional) and `/photo` (Photography)

## Design Implementation

**CRITICAL:** Always use the `frontend-design` skill when creating UI components or pages. This skill ensures production-grade, distinctive aesthetics that avoid generic AI design patterns.

Usage:
```
Use the frontend-design skill to create [component/page description]
```

Examples:
- "Use the frontend-design skill to create the photography homepage with masonry grid"
- "Use the frontend-design skill to create the dark professional about page"
- "Use the frontend-design skill to create the fullscreen gallery component"

## Content Management Approach

### Type Safety
- All content defined in `src/content/config.ts` using Zod schemas
- Astro Content Collections provide type checking and validation
- IntelliSense support for frontmatter fields

### Adding Content (Guru's Workflow)

**Photos:**
```bash
# Automated import
./scripts/add-photos.sh album-slug ~/path/to/photos

# Then edit metadata in:
# - src/content/albums/album-slug.md
# - src/content/photos/album-slug/*.md
```

**Blog Posts:**
```bash
# Create new post
touch src/content/blog/post-slug.md

# Edit with frontmatter + markdown content
# Commit and push (auto-deploys)
```

**Jupyter Notebooks:**
```bash
# Export as markdown
jupyter nbconvert --to markdown notebook.ipynb

# Move to blog, add frontmatter with isNotebook: true
mv notebook.md src/content/blog/

# Specialized styling applied automatically
```

### Content Schema Reference

**Albums:**
- `title`: Album name
- `description`: Short description
- `coverPhoto`: Path relative to public/photos/
- `date`: Album date
- `featured`: Show on homepage (boolean)
- `order`: Display order (number)

**Photos:**
- `title`: Photo title
- `album`: Album slug (must match album folder)
- `filename`: Path relative to public/photos/
- `tags`: Array of tag strings (clickable, filterable)
- `date`: Photo date
- `featured`: Show on best photos page (boolean)
- `camera`, `settings`, `location`: Optional EXIF/context

**Blog:**
- `title`, `description`: Post metadata
- `date`: Publication date
- `tags`: Topic tags
- `isNotebook`: Boolean (applies special Jupyter styling)

## Testing Requirements

### Manual Testing Checklist
- [ ] Gallery keyboard navigation (arrows, ESC)
- [ ] Tag filtering across albums
- [ ] Space toggle on all pages
- [ ] Mobile responsiveness (both spaces)
- [ ] Image lazy loading
- [ ] Build completes successfully

### Performance Testing
- Run Lighthouse audit: Target >95 performance score
- Check First Contentful Paint < 1.5s
- Verify images are optimized (WebP format)

### Content Validation
- Zod schemas validate frontmatter at build time
- Build fails on invalid content (good!)
- Check TypeScript types when querying content

## Deployment Instructions

### Initial Setup
1. Create GitHub repository
2. Connect to Netlify
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 20

### Netlify Configuration (`netlify.toml`)
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "20"

# Increase timeout for image processing
[build.processing]
  skip_processing = false
```

### Deployment Flow
```bash
# Make changes
git add .
git commit -m "Description"
git push

# Netlify auto-builds and deploys
# Build time: 15-25 min first build, <5 min cached rebuilds
```

### Deploy Previews
- Every branch gets preview URL
- Test before merging to main
- Useful for trying new album layouts

## Important Gotchas

### Image Processing
- **Build time scales with photo count:** 200+ photos = 15-25 min first build
- **Solution:** Netlify caching speeds up subsequent builds significantly
- **Don't worry about:** Pre-optimizing images - Astro handles it
- **Do worry about:** Extremely large originals (>10MB) - consider resizing those first

### Content Collections
- **Hot reload:** Changing content requires dev server restart sometimes
- **Path gotcha:** Photo filenames are relative to `public/photos/`, not `public/`
- **Slug generation:** Album folder name = album slug (must match in frontmatter)

### Routing
- **Dynamic routes:** `[slug].astro` files use `getStaticPaths()`
- **All routes are static:** Pre-rendered at build time
- **No 404 handling needed:** Netlify serves 404.astro automatically

### Tailwind
- **Configuration:** Extend theme in `tailwind.config.mjs` for custom colors
- **Purging:** Tailwind auto-purges unused classes (great for bundle size)
- **Custom CSS:** Use `@apply` sparingly - prefer utility classes

### Gallery Navigation
- **Progressive enhancement:** Works without JS, enhanced with keyboard shortcuts
- **Preloading:** Adjacent images preloaded for smooth navigation
- **URL state:** Each photo has unique URL (shareable, SEO-friendly)

### Tags
- **Case sensitivity:** "landscape" ≠ "Landscape" - be consistent
- **Suggestion:** Define tag list in `src/utils/constants.ts` for consistency
- **Validation:** Consider adding tag enum to Zod schema

### Jupyter Notebooks
- **Export format:** Markdown works best (not HTML)
- **Images in notebooks:** Exported as base64 or separate files
- **Styling:** Custom CSS targets `.notebook-post` class

## Development Workflow

### Local Development
```bash
npm run dev          # Start dev server (http://localhost:4321)
npm run build        # Test production build
npm run preview      # Preview production build locally
```

### Adding New Features
1. Check if it fits photography or professional space
2. Create components in appropriate folder
3. Use TypeScript for utilities
4. Test both light and dark themes
5. Verify mobile responsiveness

### Code Style Preferences
- Prefer explicit over clever code
- Use functional patterns where appropriate
- Keep components focused and single-purpose
- Avoid over-engineering - simplicity wins
- Comment only when logic isn't self-evident

## Future Considerations

### Planned Enhancements (not yet implemented)
- Search functionality across photos/posts
- Map view of photo locations (using location field)
- RSS feed for blog
- GitHub Action to auto-convert Jupyter notebooks

### Scalability Notes
- Current approach works well up to ~500 photos
- Beyond that, consider:
  - External image CDN (Cloudinary)
  - On-demand image processing
  - Pagination on album pages

## Support & Resources

- **Astro Docs:** https://docs.astro.build
- **Astro Content Collections:** https://docs.astro.build/en/guides/content-collections/
- **Astro Images:** https://docs.astro.build/en/guides/images/
- **Tailwind Docs:** https://tailwindcss.com/docs
- **Deployment:** https://docs.netlify.com

## Implementation Plan

Detailed implementation plan available at:
`~/.claude/plans/sleepy-finding-valley.md`

To execute the plan:
```
Implement the plan from sleepy-finding-valley.md
```
