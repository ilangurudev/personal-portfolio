# Layouts Directory

This directory contains the two core layout components for the dual-space portfolio.

## File Structure

```
layouts/
├── BlogLayout.astro      # Professional space layout (dark terminal theme)
├── PhotoLayout.astro     # Photography space layout (bright editorial theme)
├── GalleryLayout.astro   # Fullscreen photo viewing
└── CLAUDE.md             # This file
```

## BlogLayout.astro (Professional Space)

**Routes using this layout:**
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
- **Aesthetic**: "Hacker terminal" vibe

**Key Features:**
- Terminal-style command prompts with blinking cursors
- Space toggle in header (switches between `/` and `/photography`)
- Syntax highlighting for code blocks
- Special styling for Jupyter notebooks (if `isNotebook: true`)
- Profile image with cyan glow effects
- Hover effects with color transitions

**Usage:**
```astro
---
import BlogLayout from '../layouts/BlogLayout.astro';
---

<BlogLayout title="Page Title" description="Page description">
  <!-- Your content here -->
</BlogLayout>
```

**CSS Variables:**
- `--slate-950`: Background color
- `--slate-900`: Lighter background
- `--slate-800`: Borders
- `--terminal-green`: Primary accent
- `--terminal-cyan`: Secondary accent
- `--terminal-yellow`: Highlights
- `--terminal-gray`: Body text

## PhotoLayout.astro (Photography Space)

**Routes using this layout:**
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
- **Aesthetic**: "Editorial magazine" vibe

**Key Features:**
- Space toggle in header (switches between `/photography` and `/`)
- Clean, minimal grid layouts
- EXIF data display on photo pages
- Tag navigation
- Responsive image galleries
- Hover effects with subtle animations

**Usage:**
```astro
---
import PhotoLayout from '../layouts/PhotoLayout.astro';
---

<PhotoLayout title="Page Title" description="Page description">
  <!-- Your content here -->
</PhotoLayout>
```

**CSS Variables:**
- `--stone-50`: Background
- `--stone-100`: Lighter background
- `--amber-600`: Primary accent
- `--orange-600`: Secondary accent
- `--stone-900`: Body text

## GalleryLayout.astro (Fullscreen Gallery)

**Routes using this layout:**
- Individual photo detail pages (fullscreen viewing)

**Design System:**
- Fullscreen photo display
- Minimal UI overlay
- EXIF metadata panel
- Navigation controls (prev/next)
- Uses PhotoLayout color scheme

**Key Features:**
- Lightbox-style viewing
- Keyboard navigation
- Touch/swipe support
- Photo metadata display
- Close/exit controls

**Usage:**
```astro
---
import GalleryLayout from '../layouts/GalleryLayout.astro';
---

<GalleryLayout photo={photoData}>
  <!-- Gallery-specific content -->
</GalleryLayout>
```

## Space Toggle Component

Both `BlogLayout` and `PhotoLayout` include a space toggle in the header:

- **In Professional Space**: Toggle shows "📸 Photography" → links to `/photography`
- **In Photography Space**: Toggle shows "💻 Professional" → links to `/`

This allows seamless navigation between the two "personalities" of the portfolio.

## Global Styles

Both layouts import global font families:
- **Professional**: `Fira Code`, `JetBrains Mono` (monospace)
- **Photography**: `Work Sans` (sans-serif), `Crimson Text` (serif)

These are loaded via CDN or local font files.

## Responsive Breakpoints

Both layouts use consistent breakpoints:
- **Mobile**: `max-width: 640px`
- **Tablet**: `max-width: 768px`
- **Desktop**: `min-width: 769px`

## Component Reuse

When creating new pages:
1. **AI/Tech content?** → Use `BlogLayout`
2. **Photography content?** → Use `PhotoLayout`
3. **Fullscreen photo viewing?** → Use `GalleryLayout`

## Customization

To modify themes:
- **Professional colors**: Edit CSS variables in `BlogLayout.astro`
- **Photography colors**: Edit CSS variables in `PhotoLayout.astro`
- **Fonts**: Update font-family declarations in respective layouts
- **Spacing**: Adjust padding/margin in layout styles

## Testing

Always test layout changes across both spaces to ensure consistency:
```bash
npm run dev
# Visit:
# - http://localhost:4321/ (Professional)
# - http://localhost:4321/photography (Photography)
```
