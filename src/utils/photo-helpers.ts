import { getCollection, type CollectionEntry } from 'astro:content';
import { augmentPhotosWithExif } from '../content/loaders/exif-augmenter';
import { formatShutterSpeed, parseSettings, type ParsedExifSettings } from './shared/exif';
import { getPhotoUrl, getResizedPhotoUrl } from './url-helper';
import {
  transformForLightbox,
  toIsoDateString,
  type LightboxPhoto
} from './lightbox-transform';
export { transformForLightbox, type LightboxPhoto } from './lightbox-transform';

export { formatShutterSpeed, parseSettings };
export type { ParsedExifSettings };

export type Photo = CollectionEntry<'photos'>;
export type Album = CollectionEntry<'albums'>;

export interface GalleryPhoto {
  id: string;
  url: string;
  resizedUrl?: string;
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
    position?: 'top' | 'middle' | 'bottom';
    order_score?: number;
  };
}

type GallerySource = {
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
    position?: 'top' | 'middle' | 'bottom';
    order_score?: number;
  };
};

interface SerializeOptions {
  includeResized?: boolean;
}

/**
 * Normalize a photo into the gallery payload used by both Astro pages and React islands.
 * - Ensures URLs are present
 * - Normalizes tags and dates for client-safe use
 * - Optionally includes resized URL for progressive grids
 */
export function serializePhotoForGallery(
  photo: GallerySource,
  albumTitleMap?: Map<string, string>,
  options: SerializeOptions = {}
): GalleryPhoto {
  const { includeResized = false } = options;

  const tags = (photo.data.tags || [])
    .map(tag => (typeof tag === 'string' ? tag.trim() : ''))
    .filter(Boolean);

  const normalized: GalleryPhoto = {
    id: photo.id,
    url: getPhotoUrl(photo.data.filename),
    ...(includeResized && { resizedUrl: getResizedPhotoUrl(photo.data.filename, 600) }),
    body: photo.body || '',
    data: {
      title: photo.data.title,
      filename: photo.data.filename,
      album: photo.data.album,
      albumTitle: photo.data.albumTitle ?? albumTitleMap?.get(photo.data.album),
      tags,
      camera: photo.data.camera,
      settings: photo.data.settings,
      focalLength: photo.data.focalLength,
      location: photo.data.location,
      date: toIsoDateString(photo.data.date),
      position: photo.data.position,
      order_score: typeof photo.data.order_score === 'number' ? photo.data.order_score : 0
    }
  };

  return normalized;
}

/**
 * Convenience wrapper for mapping any photo list to lightbox payloads.
 */
export function mapToLightboxPhotos(
  photos: Array<Parameters<typeof transformForLightbox>[0]>,
  albumTitleMap?: Map<string, string>
): LightboxPhoto[] {
  return photos.map(photo => transformForLightbox(photo, albumTitleMap));
}

/**
 * Get all photos with EXIF data augmented from the actual photo files
 * @returns Array of photos with camera/settings/date filled from EXIF if not in frontmatter
 */
export async function getPhotosWithExif(): Promise<Photo[]> {
  const photos = await getCollection('photos');

  // Augment with EXIF data
  const augmentedData = await augmentPhotosWithExif(
    photos.map(p => p.data)
  );

  // Map back to CollectionEntry format
  return photos.map((photo, i) => ({
    ...photo,
    data: augmentedData[i],
  }));
}

/**
 * Get a single photo by ID with EXIF data augmented
 * @param id - Photo ID (folder/filename without extension)
 * @returns Photo with EXIF data or undefined if not found
 */
export async function getPhotoWithExif(id: string): Promise<Photo | undefined> {
  const photos = await getPhotosWithExif();
  return photos.find(p => p.id === id);
}

/**
 * Get photos from a specific album with EXIF data augmented
 * @param albumSlug - Album slug to filter by
 * @returns Array of photos in the album with EXIF data
 */
export async function getAlbumPhotosWithExif(albumSlug: string): Promise<Photo[]> {
  const photos = await getPhotosWithExif();
  return photos.filter(p => p.data.album === albumSlug);
}

/**
 * Get featured photos with EXIF data augmented
 * @returns Array of featured photos with EXIF data
 */
export async function getFeaturedPhotosWithExif(): Promise<Photo[]> {
  const photos = await getPhotosWithExif();
  return photos.filter(p => p.data.featured);
}

/**
 * Check if a photo has complete metadata (title, tags, camera, settings)
 * @param photo - Photo entry to check
 * @returns True if photo has all recommended metadata
 */
export function hasCompleteMetadata(photo: Photo): boolean {
  return !!(
    photo.data.title &&
    photo.data.tags.length > 0 &&
    photo.data.camera &&
    photo.data.settings
  );
}

/**
 * Format camera settings for display
 * @param settings - Raw settings string
 * @returns Formatted settings or placeholder
 */
export function formatSettings(settings?: string): string {
  if (!settings) return 'Settings unknown';
  return settings;
}

/**
 * Sort photos by order_score (descending) and then by date (descending)
 * @param photos - Array of photos to sort
 * @returns Sorted array of photos (creates a new array, doesn't mutate)
 */
export function sortPhotos<T extends { data: { order_score?: number; date: Date } }>(
  photos: T[]
): T[] {
  return [...photos].sort((a, b) => {
    const scoreA = a.data.order_score ?? 0;
    const scoreB = b.data.order_score ?? 0;
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    return b.data.date.getTime() - a.data.date.getTime();
  });
}

/**
 * Sort albums by featured status, then by order_score (descending), then by date (descending)
 * @param albums - Array of albums to sort
 * @returns Sorted array of albums (creates a new array, doesn't mutate)
 */
export function sortAlbums<T extends { data: { featured?: boolean; order_score: number; date: Date } }>(
  albums: T[]
): T[] {
  return [...albums].sort((a, b) => {
    // Featured albums first
    if (a.data.featured && !b.data.featured) return -1;
    if (!a.data.featured && b.data.featured) return 1;

    // Then by order_score (descending)
    if (a.data.order_score !== b.data.order_score) {
      return b.data.order_score - a.data.order_score;
    }

    // Finally by date (descending)
    return b.data.date.getTime() - a.data.date.getTime();
  });
}

/**
 * Build a map of album slug → title for lightbox and gallery metadata
 * @param albums Optional preloaded album entries to avoid duplicate queries
 */
export async function getAlbumTitleMap(albums?: Album[]): Promise<Map<string, string>> {
  const albumEntries = albums ?? await getCollection('albums');
  return new Map(albumEntries.map(a => [a.slug, a.data.title]));
}

/**
 * Options for tag extraction
 */
export interface TagExtractionOptions {
  /** Sort by 'alpha' (alphabetically) or 'count' (by photo count, descending) */
  sortBy?: 'alpha' | 'count';
  /** Whether to preserve original casing for display (uses first occurrence) */
  preserveDisplayCasing?: boolean;
}

/**
 * Extracted tag with count and optional display form
 */
export interface ExtractedTag {
  /** Normalized (lowercase) tag */
  tag: string;
  /** Number of photos with this tag */
  count: number;
  /** Original casing for display (only if preserveDisplayCasing is true) */
  displayTag?: string;
}

/**
 * Extract unique tags from photos with counts and sorting options
 * @param photos - Array of photos to extract tags from
 * @param options - Extraction options (sortBy, preserveDisplayCasing)
 * @returns Array of extracted tags with counts
 */
export function extractTags<T extends { data: { tags: string[] } }>(
  photos: T[],
  options: TagExtractionOptions = {}
): ExtractedTag[] {
  const { sortBy = 'count', preserveDisplayCasing = false } = options;

  // Count tags
  const tagCounts = new Map<string, number>();
  const tagDisplayMap = preserveDisplayCasing ? new Map<string, string>() : null;

  photos.forEach(photo => {
    photo.data.tags.forEach(tag => {
      if (tag && typeof tag === 'string' && tag.trim()) {
        const normalized = tag.toLowerCase().trim();
        tagCounts.set(normalized, (tagCounts.get(normalized) || 0) + 1);

        // Preserve first occurrence of original casing
        if (tagDisplayMap && !tagDisplayMap.has(normalized)) {
          tagDisplayMap.set(normalized, tag);
        }
      }
    });
  });

  // Convert to array
  const tags: ExtractedTag[] = Array.from(tagCounts.entries()).map(([tag, count]) => ({
    tag,
    count,
    ...(tagDisplayMap && { displayTag: tagDisplayMap.get(tag) || tag }),
  }));

  // Sort based on option
  if (sortBy === 'count') {
    // Sort by count descending, then alphabetically
    tags.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.tag.localeCompare(b.tag);
    });
  } else {
    // Sort alphabetically
    tags.sort((a, b) => a.tag.localeCompare(b.tag));
  }

  return tags;
}

/**
 * Extract just the tag names (normalized, lowercase) from photos
 * @param photos - Array of photos to extract tags from
 * @param sortBy - Sort by 'alpha' (alphabetically) or 'count' (by photo count)
 * @returns Array of normalized tag names
 */
export function extractTagNames<T extends { data: { tags: string[] } }>(
  photos: T[],
  sortBy: 'alpha' | 'count' = 'count'
): string[] {
  return extractTags(photos, { sortBy }).map(t => t.tag);
}
