import type { LightboxPhoto } from '../utils/lightbox-transform';

declare global {
  interface Window {
    /**
     * Sync lightbox photos after React filter changes.
     */
    updateLightboxFromFilter?: (filteredPhotos: LightboxPhoto[]) => void;
    /**
     * Singleton lightbox instance exposed by PhotoLightbox.astro.
     */
    photoLightbox?: {
      updatePhotos: (photos: LightboxPhoto[]) => void;
    };
    /**
     * Optional cache of all photos used by legacy inline scripts.
     */
    allPhotosData?: LightboxPhoto[];
  }
}

export {};

