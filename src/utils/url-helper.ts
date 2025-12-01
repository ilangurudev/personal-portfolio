/**
 * Get the full URL for a photo, handling both local and CDN paths.
 * @param filename - The relative path from the photos root (e.g., "album/photo.jpg")
 * @returns The full URL to the image
 */
export function getPhotoUrl(filename: string): string {
  const cdnUrl = import.meta.env.PUBLIC_PHOTO_CDN_URL;
  
  if (cdnUrl) {
    // Remove leading slash if present in filename to avoid double slashes
    const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;
    // Remove trailing slash from CDN URL if present
    const cleanCdnUrl = cdnUrl.endsWith('/') ? cdnUrl.slice(0, -1) : cdnUrl;
    
    return `${cleanCdnUrl}/${cleanFilename}`;
  }

  // Fallback to local public/photos directory
  return filename.startsWith('/') ? `/photos${filename}` : `/photos/${filename}`;
}

/**
 * Get a resized photo URL using Cloudflare Image Resizing.
 * Used for grid thumbnails to reduce memory usage and improve load times.
 * @param filename - The relative path from the photos root (e.g., "album/photo.jpg")
 * @param width - The target width in pixels (default: 400)
 * @returns The full URL to the resized image, or original URL if CDN is not configured
 */
export function getResizedPhotoUrl(filename: string, width: number = 400): string {
  const cdnUrl = import.meta.env.PUBLIC_PHOTO_CDN_URL;
  
  if (cdnUrl) {
    // Remove leading slash if present in filename to avoid double slashes
    const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;
    // Remove trailing slash from CDN URL if present
    const cleanCdnUrl = cdnUrl.endsWith('/') ? cdnUrl.slice(0, -1) : cdnUrl;
    
    // Construct Cloudflare Image Resizing URL
    return `${cleanCdnUrl}/cdn-cgi/image/width=${width},quality=85,format=jpg/${cleanFilename}`;
  }

  // Fallback to local public/photos directory (no resizing in local dev)
  return filename.startsWith('/') ? `/photos${filename}` : `/photos/${filename}`;
}

