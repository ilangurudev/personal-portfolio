import exifr from 'exifr';
import { join } from 'path';
import { existsSync, statSync } from 'fs';

interface PhotoData {
  filename: string;
  camera?: string;
  settings?: string;
  focalLength?: number;
  date?: Date;
  [key: string]: any;
}

interface ExifData {
  camera?: string;
  settings?: string;
  focalLength?: number;
  date?: Date;
}

// In-memory cache for EXIF data (persists during build process)
const exifCache = new Map<string, { mtime: number; data: ExifData }>();

/**
 * Extract technical EXIF data from a photo
 * @param photoPath - Absolute path to the photo file
 * @returns Technical EXIF data (camera, settings, date)
 */
async function extractTechnicalExif(photoPath: string): Promise<ExifData> {
  try {
    const exif = await exifr.parse(photoPath, {
      exif: true,
      pick: ['Make', 'Model', 'FNumber', 'ExposureTime', 'ISO', 'FocalLength', 'DateTimeOriginal']
    });

    if (!exif) return {};

    const camera = exif.Make && exif.Model
      ? `${exif.Make} ${exif.Model}`.trim()
      : undefined;

    // Format settings as "f/2.8, 1/1000s, ISO 400"
    let settings: string | undefined;
    if (exif.FNumber || exif.ExposureTime || exif.ISO) {
      const aperture = exif.FNumber ? `f/${exif.FNumber}` : null;
      const shutter = exif.ExposureTime
        ? (exif.ExposureTime >= 1
          ? `${exif.ExposureTime}s`
          : `1/${Math.round(1 / exif.ExposureTime)}s`)
        : null;
      const iso = exif.ISO ? `ISO ${exif.ISO}` : null;

      settings = [aperture, shutter, iso].filter(Boolean).join(', ');
    }

    const focalLength = parseFocalLength(exif.FocalLength);

    return {
      camera,
      settings,
      focalLength,
      date: exif.DateTimeOriginal,
    };
  } catch (error) {
    console.warn(`EXIF extraction failed for ${photoPath}:`, error instanceof Error ? error.message : 'Unknown error');
    return {};
  }
}

/**
 * Extract EXIF data with caching to avoid redundant reads
 * @param photoPath - Absolute path to the photo file
 * @returns Cached or freshly extracted EXIF data
 */
async function extractWithCache(photoPath: string): Promise<ExifData> {
  if (!existsSync(photoPath)) {
    return {};
  }

  const stats = statSync(photoPath);
  const mtime = stats.mtimeMs;

  // Check cache
  const cached = exifCache.get(photoPath);
  if (cached && cached.mtime === mtime) {
    return cached.data;
  }

  // Extract EXIF
  const exifData = await extractTechnicalExif(photoPath);

  // Cache result
  exifCache.set(photoPath, { mtime, data: exifData });

  return exifData;
}

/**
 * Augment a single photo entry with EXIF data
 * @param photoData - Photo metadata from frontmatter
 * @returns Augmented photo data with EXIF merged in
 * 
 * NOTE: EXIF data is now stored in frontmatter during import.
 * This function now only reads from frontmatter and no longer
 * extracts from photo files. If frontmatter is missing EXIF data,
 * it will remain undefined (no fallback to file extraction).
 */
export async function augmentPhotoWithExif(photoData: PhotoData): Promise<PhotoData> {
  // EXIF data is now stored in frontmatter during import.
  // Just return the photo data as-is (frontmatter is the source of truth).
  return photoData;
}

/**
 * Augment multiple photo entries with EXIF data in parallel
 * @param photos - Array of photo metadata objects
 * @returns Array of augmented photo data
 * 
 * NOTE: EXIF data is now read from frontmatter only.
 */
export async function augmentPhotosWithExif(photos: PhotoData[]): Promise<PhotoData[]> {
  // EXIF data is now stored in frontmatter, so just return photos as-is
  return photos;
}

/**
 * Clear the EXIF cache (useful for testing or forced rebuilds)
 */
export function clearExifCache(): void {
  exifCache.clear();
}

function parseFocalLength(value: unknown): number | undefined {
  if (!value) return undefined;

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'object' && value !== null) {
    const numerator = (value as { numerator?: number }).numerator;
    const denominator = (value as { denominator?: number }).denominator ?? 1;
    if (typeof numerator === 'number' && Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) {
      return numerator / denominator;
    }
  }

  return undefined;
}
