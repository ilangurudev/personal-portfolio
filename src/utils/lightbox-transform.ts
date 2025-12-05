import { getPhotoUrl } from './url-helper';

export interface LightboxPhoto {
  id: string;
  url: string;
  body: string;
  data: {
    title: string;
    filename: string;
    album: string;
    albumTitle?: string;
    tags: string[];
    camera?: string;
    settings?: string;
    focalLength?: number;
    location?: string;
    date: string;
    position?: string;
  };
}

type LightboxTransformSource = {
  id: string;
  body?: string;
  data: {
    title: string;
    filename: string;
    album: string;
    albumTitle?: string;
    tags?: string[];
    camera?: string;
    settings?: string;
    focalLength?: number;
    location?: string;
    date: Date | string;
    position?: string;
  };
};

/**
 * Safely convert a date value (Date or string) to an ISO string.
 * Returns an empty string for invalid/malformed dates instead of throwing.
 */
export function toIsoDateString(value: Date | string): string {
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
}

/**
 * Normalize a photo into the lightbox payload format used across Astro pages and React islands.
 * Accepts either a CollectionEntry or any object with the required shape (date can be Date or string).
 */
export function transformForLightbox(
  photo: LightboxTransformSource,
  albumTitleMap?: Map<string, string>
): LightboxPhoto {
  const date = toIsoDateString(photo.data.date);

  return {
    id: photo.id,
    url: getPhotoUrl(photo.data.filename),
    body: photo.body || '',
    data: {
      title: photo.data.title,
      filename: photo.data.filename,
      album: photo.data.album,
      albumTitle: photo.data.albumTitle ?? albumTitleMap?.get(photo.data.album),
      tags: photo.data.tags ?? [],
      camera: photo.data.camera,
      settings: photo.data.settings,
      focalLength: photo.data.focalLength,
      location: photo.data.location,
      date,
      position: photo.data.position,
    },
  };
}

