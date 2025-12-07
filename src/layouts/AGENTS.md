# Layouts & Theme Documentation

## 1. Dual-Space Theme System

The codebase strictly separates two distinct "spaces" via Layouts. This is a fundamental architectural decision to prevent style bleed between the professional and photography personas.

### Professional Space (`BlogLayout.astro`)
- **Theme:** Terminal/Hacker (Dark, Monospace, Green/Cyan accents).
- **Font:** `JetBrains Mono`
- **Key Features:**
  - **Scanlines:** CSS overlay effect defined in `BlogLayout`.
  - **Terminal Prompt:** Header styling mimics a command line.
  - **Prose Styling:** Markdown prose uses cyan links (yellow on hover) and terminal-style chevron bullets (`>`) across blog, about, and project pages for consistent professional-space formatting.
  - **Scoped Variables:**
    ```css
    :root {
      --slate-950: #020617;
      --terminal-green: #22c55e;
      /* ...defined locally in BlogLayout.astro */
    }
    ```

### Photography Space (`PhotoLayout.astro`)
- **Theme:** Editorial (Light/Cream, Serif/Sans, Amber/Terracotta accents).
- **Fonts:** `Crimson Text` (Headings), `Work Sans` (Body).
- **Key Features:**
  - **Viewfinder:** SVG corners overlay on photo hover.
  - **Shared Styles:** Imports `photo-card.css` for consistent photo card styling across all photography pages.
  - **Scoped Variables:**
    ```css
    :root {
      --cream: #FFFBF5;
      --amber: #D97706;
      /* ...defined locally in PhotoLayout.astro */
    }
    ```

## 3. Shared Styles

- `src/styles/photo-card.css`: Base photo card styling (hover states, viewfinder overlay, aspect ratio) imported globally by `PhotoLayout.astro`.
- `src/styles/photo-gallery-shared.css`: Gallery layout helpers + virtualization overrides imported by `PhotoLayout.astro` so photography pages share a single source of truth:
  - `.gallery-container` spacing/flex behavior
  - `.gallery-container :global(.photo-card) { position: absolute; }` to support react-window
  - `.gallery-container :global(.photo-image) { height: 100%; }` to replace aspect-ratio for virtualized rows
  - Mobile margin tweaks for gallery blocks

> [!IMPORTANT]
> **Do not edit `global.css` for theme colors.**
> Theme variables are scoped to their respective Layout files. `global.css` is only for reset utilities and Tailwind directives.

## 4. Layout Architecture

### "Islands" Integration
Layouts are responsible for initializing the global environment that "Islands" (interactive components) rely on.

- **Global Event Listeners:**
  - Both layouts implement `contextmenu` and `dragstart` prevention for images.
  - Both layouts observe DOM mutations to apply protection to new images (e.g., loaded via infinite scroll).

- **Mobile Navigation:**
  - Each layout implements its own vanilla JS mobile menu logic (Hamburger button, drawer animation).
  - They share NO code for this, ensuring complete visual isolation.
  - Hamburger replaces desktop nav at ≤1200px to prevent header/nav overlap on wider tablets (iPad landscape included).
- **Search Shortcut:** Both layouts listen for Cmd/Ctrl + K to focus the nearest `[data-search-input]` or navigate to the space-specific search page (`/search` or `/photography/search`). Search is also present in both desktop and mobile navs.
