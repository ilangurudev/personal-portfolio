/**
 * Parsed EXIF settings from a settings string.
 */
export interface ParsedExifSettings {
  aperture?: number;
  shutterSpeed?: number;
  iso?: number;
}

/**
 * Parse a camera settings string (e.g., "f/2.8, 1/1000s, ISO 400") into structured EXIF data.
 * Safe for client and server usage.
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
      result.shutterSpeed = parseInt(shutterMatch[1]) / parseInt(shutterMatch[2]);
    } else if (shutterMatch[3]) {
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
 * Format a shutter speed value (seconds) into a user-friendly string.
 * Examples: 0.001 -> "1/1000s", 2 -> "2.0s"
 */
export function formatShutterSpeed(seconds: number): string {
  if (seconds < 1) {
    const denominator = Math.round(1 / seconds);
    return `1/${denominator}s`;
  }
  return `${seconds.toFixed(1)}s`;
}
