# DRY Refactoring Next Steps

1) Unify lightbox sync glue  
   - Create a shared client helper (e.g., `src/utils/client/lightbox-sync.ts`) that wires `window.updateLightboxFromFilter` and accepts optional callbacks for page-specific UI updates (e.g., tag page count).  
   - Replace inline scripts in `src/pages/photography/album/[slug].astro` and `src/pages/photography/tag/[tag].astro` to use the helper.  
   - Update `src/components/react/FilteredPhotoGallery.tsx` to import and use the shared contract if helpful (or just rely on the global helper).

2) Centralize photo serialization  
   - Add a utility (server-safe + client-safe) to build gallery payloads: `serializePhotoForGallery(photo, albumTitleMap, { includeResized?: boolean })`.  
   - Use it in `/photography/photos`, album pages, and tag pages instead of bespoke `map` shapes.  
   - Expose a paired `mapToLightboxPhotos` wrapper around `transformForLightbox` for consistency.

3) Remove inline tag utility fallbacks  
   - Ensure all tag-related pages import `filterPhotosByTags`, `getAvailableTags`, `normalizeTag`, `setupTagLogicToggle` from `src/utils/client/tag-utils.ts`.  
   - Drop inline fallback implementations in `photos.astro` and `TagFilterBar.astro`; keep a single source of truth.

4) Reuse EXIF/settings parsing  
   - Export a client-safe parser from `src/utils/shared/exif.ts` and use it in `photos.astro` instead of the duplicated `parseSettings`.  
   - Confirm formatting (e.g., `formatShutterSpeed`) comes from the shared module everywhere.

5) Consolidate gallery layout CSS  
   - Move shared `.gallery-container`, absolute `.photo-card`, and `.photo-image` overrides into a small shared CSS import (e.g., `src/styles/photo-gallery-shared.css`) used by album + tag pages.  
   - Keep theme separation intact by importing via `PhotoLayout`.

6) Simplify photography landing filter  
   - Consider reusing a slimmed-down `TagFilterBar` (or emitting the same `tagFilterChange` event) for the three-button filter on `/photography/`.  
   - Let the shared lightbox sync helper handle `updatePhotos` instead of bespoke logic.

7) Documentation updates  
   - After refactors, update relevant `AGENTS.md` files (`src/components/AGENTS.md`, `src/utils/AGENTS.md`, `src/layouts/AGENTS.md`) to reflect the new shared helpers and CSS location.

8) Tests to run  
   - `npm run test:albums`, `npm run test:tag-and-or`, `npm run test:lightbox`, `npm run test:filters`, `npm run test:scroll` to cover gallery + filters + lightbox after changes.

