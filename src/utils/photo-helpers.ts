import { getCollection, type CollectionEntry } from 'astro:content';
import { augmentPhotosWithExif } from '../content/loaders/exif-augmenter';
import { formatShutterSpeed } from './shared/exif';

export { formatShutterSpeed };

export type Photo = CollectionEntry<'photos'>;

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
 * Parsed EXIF settings from a settings string
 */
export interface ParsedExifSettings {
  aperture?: number;
  shutterSpeed?: number;
  iso?: number;
}

/**
 * Parse camera settings string into structured EXIF data
 * @param settings - Raw settings string (e.g., "f/2.8, 1/1000s, ISO 400")
 * @returns Parsed settings object with aperture, shutterSpeed, and iso
 */
export function parseSettings(settings?: string): ParsedExifSettings {
  if (!settings) return {};

  const result: ParsedExifSettings = {};

  // Parse aperture (f/2.8 -> 2.8)
  const apertureMatch = settings.match(/f\/([\d.]+)/);
  if (apertureMatch) {
    result.aperture = parseFloat(apertureMatch[1]);
  }

  // Parse shutter speed (1/1000s -> 0.001, 2s -> 2)
  const shutterMatch = settings.match(/(\d+)\/(\d+)s|(\d+(?:\.\d+)?)s/);
  if (shutterMatch) {
    if (shutterMatch[1] && shutterMatch[2]) {
      // Fractional shutter speed (e.g., 1/1000s)
      result.shutterSpeed = parseInt(shutterMatch[1]) / parseInt(shutterMatch[2]);
    } else if (shutterMatch[3]) {
      // Whole number shutter speed (e.g., 2s)
      result.shutterSpeed = parseFloat(shutterMatch[3]);
    }
  }

  // Parse ISO (ISO 400 -> 400)
  const isoMatch = settings.match(/ISO\s*(\d+)/);
  if (isoMatch) {
    result.iso = parseInt(isoMatch[1]);
  }

  return result;
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
