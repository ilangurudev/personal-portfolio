# Portfolio Implementation TODO

Last updated: 2024-11-27

## ✅ Completed

- [x] Initialize Astro project with Tailwind CSS
- [x] Set up folder structure (content, components, layouts, pages)
- [x] Configure content collections with Zod schemas (`src/content/config.ts`)
- [x] Create PhotoLayout with bright editorial theme
- [x] Create BlogLayout with dark terminal theme
- [x] Create photo homepage (`/photo`) with coming soon message
- [x] Create professional homepage (`/`) with about page
- [x] Create reusable test suite in `tests/e2e/`:
  - `dual-space-navigation.spec.js` - Tests space toggle
  - `responsive-design.spec.js` - Tests viewports
  - `visual-aesthetics.spec.js` - Tests colors/fonts
- [x] Write test for gallery keyboard navigation (`gallery-navigation.spec.js`)
- [x] Create sample photos for testing (test-album with 3 photos)
- [x] Create GalleryLayout.astro (fullscreen gallery layout)

## 🚧 In Progress

- [ ] Build gallery view with keyboard navigation
  - Layout created, need to create the page file
  - Path: `src/pages/photo/gallery/[photo].astro`
  - Features needed:
    - Dynamic routing for all photos
    - Keyboard shortcuts (left/right arrows, ESC)
    - Previous/Next navigation
    - Photo metadata display
    - Preloading adjacent images

## 📋 TODO - Core Features

### Gallery & Albums
- [ ] Create album index page (`/photo/albums`)
- [ ] Create dynamic album page (`/photo/album/[slug].astro`)
- [ ] Update photo homepage to show featured photos from collection
- [ ] Create photo grid component with masonry layout

### Tag Filtering
- [ ] Create tag index page showing all tags
- [ ] Create dynamic tag page (`/photo/tag/[tag].astro`)
- [ ] Add tag cloud component to photo homepage
- [ ] Make tags clickable in gallery view

### Blog
- [ ] Create blog index page (`/blog/index.astro`)
- [ ] Create blog post page (`/blog/[slug].astro`)
- [ ] Add Jupyter notebook styling for `isNotebook: true` posts

### Helper Scripts
- [ ] Create `scripts/add-photos.sh` for automated photo import
- [ ] Document photo addition workflow

### Deployment
- [ ] Configure Netlify (`netlify.toml`)
- [ ] Set up GitHub repository
- [ ] Test production build
- [ ] Deploy to Netlify

## 🧪 Testing

### Test Commands
```bash
npm test                 # Run all tests
npm run test:navigation  # Dual-space navigation
npm run test:responsive  # Responsive design
npm run test:visual      # Visual aesthetics
```

### Tests to Add
- [ ] Gallery keyboard navigation test (written, needs implementation to pass)
- [ ] Tag filtering test
- [ ] Album view test
- [ ] Photo grid test

## 📁 File Structure Reference

```
src/
├── content/
│   ├── config.ts ✅
│   ├── albums/
│   │   └── test-album.md ✅
│   ├── photos/
│   │   └── test-album/
│   │       ├── photo-1.md ✅
│   │       ├── photo-2.md ✅
│   │       └── photo-3.md ✅
│   └── blog/
│       └── about.md ✅
├── components/
│   ├── photo/    (need: PhotoGrid, AlbumCard, TagCloud)
│   ├── blog/     (need: BlogCard, PostList)
│   └── shared/   (mostly handled by layouts)
├── layouts/
│   ├── PhotoLayout.astro ✅
│   ├── BlogLayout.astro ✅
│   └── GalleryLayout.astro ✅
└── pages/
    ├── index.astro ✅ (professional homepage)
    ├── photo/
    │   ├── index.astro ✅ (coming soon)
    │   ├── albums.astro (TODO)
    │   ├── album/[slug].astro (TODO)
    │   ├── gallery/[photo].astro (IN PROGRESS)
    │   └── tag/[tag].astro (TODO)
    └── blog/
        ├── index.astro (TODO)
        └── [slug].astro (TODO)

public/photos/
└── test-album/ ✅
    ├── cover.jpg ✅
    ├── photo-1.jpg ✅
    ├── photo-2.jpg ✅
    └── photo-3.jpg ✅

tests/e2e/ ✅
├── dual-space-navigation.spec.js ✅
├── responsive-design.spec.js ✅
├── visual-aesthetics.spec.js ✅
└── gallery-navigation.spec.js ✅
```

## 🎨 Design Specs

### Professional Space
- Background: `#020617` (slate-950)
- Primary: `#22c55e` (terminal-green)
- Accent: `#06b6d4` (terminal-cyan)
- Font: JetBrains Mono (monospace)
- Effects: Scanlines, terminal glow

### Photography Space
- Background: `#FFFBF5` (warm cream)
- Primary: `#1C1917` (charcoal)
- Accent: `#D97706` (amber)
- Font: Crimson Text (serif) + Work Sans (sans)
- Style: Editorial, generous whitespace

## 🚀 Next Steps to Resume

1. **Complete Gallery Page:**
   ```bash
   mkdir -p src/pages/photo/gallery
   # Create src/pages/photo/gallery/[photo].astro with keyboard nav
   ```

2. **Test Gallery:**
   ```bash
   npm run test:navigation  # Should see gallery test run
   ```

3. **Create Album Pages:**
   - Album index showing all albums
   - Dynamic album page with photo grid

4. **Add Tag Filtering:**
   - Tag index page
   - Dynamic tag filtering page

5. **Deploy:**
   - Create netlify.toml
   - Push to GitHub
   - Connect to Netlify

## 📝 Notes

- Dev server runs on: `http://localhost:4321`
- Tests use Playwright in `.claude/skills/playwright-skill/`
- SVG placeholder images are currently used for testing
- Replace placeholders with real photos before deployment
- Content collections provide full type safety via Zod schemas
