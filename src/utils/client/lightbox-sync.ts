import type { LightboxPhoto } from '../lightbox-transform';

type LightboxSyncWindow = Window & {
  photoLightbox?: { updatePhotos: (photos: LightboxPhoto[]) => void };
  updateLightboxFromFilter?: (photos: LightboxPhoto[]) => void;
};

export type LightboxSyncOptions = {
  onFilteredPhotosChange?: (photos: LightboxPhoto[]) => void;
  onActiveTagsChange?: (activeTags: string[]) => void;
};

/**
 * Wire the global lightbox updater and optional page-specific callbacks.
 */
export function setupLightboxSync(options: LightboxSyncOptions = {}) {
  if (typeof window === 'undefined') return () => {};

  const win = window as LightboxSyncWindow;
  const { onFilteredPhotosChange, onActiveTagsChange } = options;

  win.updateLightboxFromFilter = (photos: LightboxPhoto[]) => {
    if (win.photoLightbox && typeof win.photoLightbox.updatePhotos === 'function') {
      win.photoLightbox.updatePhotos(photos);
    }

    if (typeof onFilteredPhotosChange === 'function') {
      onFilteredPhotosChange(photos);
    }
  };

  let detachTagListener: (() => void) | undefined;

  if (typeof onActiveTagsChange === 'function') {
    const handleTagFilterChange = (event: Event) => {
      const detail = (event as CustomEvent)?.detail || {};
      const activeTags = Array.isArray(detail.activeTags) ? detail.activeTags : [];
      onActiveTagsChange(activeTags);
    };

    window.addEventListener('tagFilterChange', handleTagFilterChange as EventListener);
    detachTagListener = () =>
      window.removeEventListener('tagFilterChange', handleTagFilterChange as EventListener);
  }

  return () => {
    if (detachTagListener) detachTagListener();
  };
}

export function pushFilteredPhotosToLightbox(photos: LightboxPhoto[]) {
  if (typeof window === 'undefined') return;

  const win = window as LightboxSyncWindow;
  if (typeof win.updateLightboxFromFilter === 'function') {
    win.updateLightboxFromFilter(photos);
  }
}

