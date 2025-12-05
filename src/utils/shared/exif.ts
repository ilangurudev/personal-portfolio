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

