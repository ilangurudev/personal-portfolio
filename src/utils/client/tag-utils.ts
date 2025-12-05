/**
 * Client-side tag utilities
 *
 * Note: For Astro <script> blocks using define:vars, inline this function directly
 * since they don't support ES6 imports. This file is primarily for React components
 * and bundled client scripts.
 */

/**
 * Normalize a tag string to lowercase and trimmed
 * @param tag - Tag string to normalize (can be undefined or null)
 * @returns Normalized tag string (empty string if tag is falsy)
 */
export const normalizeTag = (tag?: string | null): string => {
  if (!tag) return '';
  return String(tag).toLowerCase().trim();
};

/**
 * Tag logic mode for filtering
 */
export type TagLogic = 'and' | 'or';

/**
 * Filter photos by tags with AND/OR logic
 * @param photos - Array of photos to filter
 * @param tags - Array of tag strings to filter by
 * @param logic - 'and' or 'or' logic for filtering (default: 'or')
 * @returns Filtered array of photos
 */
export function filterPhotosByTags<T extends { data: { tags: string[] } }>(
  photos: T[],
  tags: string[],
  logic: TagLogic = 'or'
): T[] {
  if (tags.length === 0) return photos;

  return photos.filter(photo => {
    const photoTags = photo.data.tags.map(normalizeTag).filter(Boolean);
    if (logic === 'and') {
      return tags.every(tag => photoTags.includes(normalizeTag(tag)));
    }
    return tags.some(tag => photoTags.includes(normalizeTag(tag)));
  });
}

/**
 * Get available tags for the current filter state
 * @param allPhotos - All photos to consider
 * @param selectedTags - Currently selected tags
 * @param logic - Current tag logic mode
 * @returns Set of available tag strings
 */
export function getAvailableTags<T extends { data: { tags: string[] } }>(
  allPhotos: T[],
  selectedTags: string[],
  logic: TagLogic
): Set<string> {
  if (logic === 'or') {
    // All tags available in OR mode
    const allTags = new Set<string>();
    allPhotos.forEach(photo => {
      photo.data.tags.forEach(tag => {
        const normalized = normalizeTag(tag);
        if (normalized) allTags.add(normalized);
      });
    });
    return allTags;
  }

  // In AND mode, only tags from filtered results
  const filtered = filterPhotosByTags(allPhotos, selectedTags, 'and');
  const available = new Set<string>();

  filtered.forEach(photo => {
    photo.data.tags.forEach(tag => {
      const normalized = normalizeTag(tag);
      if (normalized) available.add(normalized);
    });
  });

  // Always keep selected tags available
  selectedTags.forEach(tag => {
    const normalized = normalizeTag(tag);
    if (normalized) available.add(normalized);
  });

  return available;
}

/**
 * Setup tag logic toggle handler
 * @param toggleContainer - Container element with toggle buttons
 * @param onModeChange - Callback when mode changes
 */
export function setupTagLogicToggle(
  toggleContainer: HTMLElement,
  onModeChange: (mode: TagLogic) => void
): void {
  const buttons = toggleContainer.querySelectorAll<HTMLButtonElement>('.toggle-option');

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const mode = (button.dataset.mode as TagLogic) || 'or';

      buttons.forEach(btn => {
        btn.setAttribute('aria-pressed', btn.dataset.mode === mode ? 'true' : 'false');
      });

      onModeChange(mode);
    });
  });
}
