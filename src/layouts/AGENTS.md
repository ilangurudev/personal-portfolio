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
- **Theme:** Gallery editorial (warm paper, near-black ink, signal-orange accent).
- **Fonts:** `Instrument Serif` (display/headings), `Manrope` (body/UI).
- **Key Features:**
  - **Compact Header:** A 76px sticky desktop bar (64px mobile) keeps navigation subordinate to the work.
  - **Navigation Language:** Desktop and mobile expose the same photography index—Work, Stories, Archive, Themes, Search, and About—while AI/Engineering remains a separate space switch. Homepage media above hash targets must reserve intrinsic space so Work/About links stay anchored while lazy images load. The `#about` target belongs on `.about-copy`, not the enclosing portrait-first section, so mobile navigation reveals the biography rather than stopping on the portrait.
  - **Mobile Menu:** Full-screen editorial index using the same navigation vocabulary.
  - **Scoped Variables:**
    ```css
    :root {
      --paper: #f1eee7;
      --ink: #161513;
      --signal: #f04a24;
      /* ...defined locally in PhotoLayout.astro */
    }
    ```

## 3. Shared Styles

- `src/styles/photo-card.css`: Legacy/shared card utilities. New editorial pages may override these locally to preserve natural image ratios.
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
- **Photography Motion:** `PhotoLayout.astro` owns the global `data-photo-reveal` profile styles and boots `setupPhotoMotion()` from `src/utils/client/photo-motion.ts`. The controller observes both initial and dynamically inserted elements, reveals each stable key once, and falls back to immediately visible content for reduced motion or missing observer support. Homepage-specific hero choreography remains local to `/photography`.
