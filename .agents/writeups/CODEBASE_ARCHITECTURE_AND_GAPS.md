# Codebase Architecture & AGENTS.md Gap Analysis

## 1. Architecture Overview (The "Ground Truth")

### Dual-Space System
The codebase strictly separates two distinct "spaces" via Layouts, not just CSS classes:
-   **Professional (`BlogLayout.astro`)**:
    -   **Theme**: Terminal/Hacker (Dark, Monospace, Green/Cyan accents).
    -   **Implementation**: Defines CSS variables (`--slate-950`, `--terminal-green`) locally in the `<style>` block.
    -   **Features**: Scanlines effect, command-prompt navigation.
-   **Photography (`PhotoLayout.astro`)**:
    -   **Theme**: Editorial (Light/Cream, Serif/Sans, Amber/Terracotta accents).
    -   **Implementation**: Defines CSS variables (`--cream`, `--amber`) locally.
    -   **Features**: Sticky header, refined typography (Crimson Text).

### The "Island" Communication Bus
The interaction between static Astro/Vanilla JS and React Islands is more complex than "CustomEvents":
1.  **Vanilla JS (Controller)**:
    -   Manages UI state (filter pills, toggle buttons) in `[tag].astro` and `[slug].astro`.
    -   Dispatches `CustomEvent('tagFilterChange', { detail: { activeTags, tagLogic } })`.
    -   Exposes global helpers: `window.updateLightboxFromFilter(photos)`.
2.  **React (View)**:
    -   `FilteredPhotoGallery` listens for `tagFilterChange`.
    -   Updates its internal state and re-renders the virtualized grid.
    -   Calls `window.updateLightboxFromFilter` to keep the global lightbox in sync.
3.  **Global Singleton**:
    -   `PhotoLightbox.astro` creates a global `window.photoLightbox` instance.

### Testing Strategy
Contrary to `tests/AGENTS.md`, a robust E2E suite exists in `tests/e2e/`:
-   `dual-space-navigation.spec.js`: Verifies theme switching and CSS variable application.
-   `photo-filter-toggle.spec.cjs`: Tests the filtering logic and UI states.
-   `visual-aesthetics.spec.js`: Likely checks font loading and layout shifts.

---

## 2. Gaps in AGENTS.md

### Critical Missing Information
These are details that would have saved me significant "discovery" time:

1.  **Event Payload Structure**:
    -   **Missing**: The exact shape of `tagFilterChange` detail (`{ activeTags: string[], tagLogic: 'and' | 'or' }`).
    -   **Why it matters**: An agent trying to modify the filter logic would need to read the source code to know what data to send.

2.  **Global Window Interface**:
    -   **Missing**: The existence and signature of `window.updateLightboxFromFilter` and `window.photoLightbox`.
    -   **Why it matters**: These are the "glue" between the separate islands. Modifying the gallery without updating the lightbox would introduce subtle bugs.

3.  **CSS Variable Scope**:
    -   **Missing**: The fact that CSS variables are defined *inside* the Layouts, not in `global.css`.
    -   **Why it matters**: An agent asked to "change the global theme" might look in `global.css` and fail. It needs to know to edit the specific Layout file.

4.  **Test Suite Reality**:
    -   **Outdated**: `tests/AGENTS.md` says "Test files may not exist yet".
    -   **Why it matters**: An agent might skip running tests or try to write duplicate tests, wasting context window and time.

### "Just Right" Detail for Sub-AGENTS.md
To fix this, the sub-files should contain:

-   **`src/components/AGENTS.md`**:
    -   Document the **Event Bus Contract**: "Listens to `tagFilterChange` (payload: `{...}`). Emits nothing."
    -   Document **Global Dependencies**: "Requires `window.photoLightbox` to be present."

-   **`src/layouts/AGENTS.md`** (New/Update):
    -   Explicitly state: "Theme variables are scoped to this file. Do not edit `global.css` for theme colors."

-   **`tests/AGENTS.md`**:
    -   List the *actual* key test files and what they cover (e.g., "Navigation: `dual-space-navigation.spec.js`").

## 3. Reflection
The existing `AGENTS.md` provided a great high-level map, but it failed at the "integration seams." For an agent, knowing *how* components talk to each other (exact event names, payloads, global functions) is more valuable than knowing *what* they do (which can often be inferred from the filename).
