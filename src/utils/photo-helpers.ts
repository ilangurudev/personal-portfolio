import { getCollection, type CollectionEntry } from 'astro:content';
import { augmentPhotosWithExif } from '../content/loaders/exif-augmenter';

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
