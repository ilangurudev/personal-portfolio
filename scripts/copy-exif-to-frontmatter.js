import exifr from 'exifr';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join, basename, extname } from 'path';
import { existsSync } from 'fs';

/**
 * Extract technical EXIF data (camera, settings, focal length)
 * @param {Object} exif - Parsed EXIF data
 * @returns {Object} Technical EXIF data
 */
function extractTechnicalExif(exif) {
  // Camera model
  const camera = exif?.Make && exif?.Model
    ? `${exif.Make} ${exif.Model}`.trim()
    : undefined;

  // Format settings as "f/2.8, 1/1000s, ISO 400"
  let settings;
  if (exif?.FNumber || exif?.ExposureTime || exif?.ISO) {
    const aperture = exif.FNumber ? `f/${exif.FNumber}` : null;
    const shutter = exif.ExposureTime
      ? (exif.ExposureTime >= 1
        ? `${exif.ExposureTime}s`
        : `1/${Math.round(1 / exif.ExposureTime)}s`)
      : null;
    const iso = exif.ISO ? `ISO ${exif.ISO}` : null;

    settings = [aperture, shutter, iso].filter(Boolean).join(', ');
  }

  // Focal length
  let focalLength;
  if (exif?.FocalLength) {
    if (typeof exif.FocalLength === 'number' && Number.isFinite(exif.FocalLength)) {
      focalLength = exif.FocalLength;
    } else if (typeof exif.FocalLength === 'object' && exif.FocalLength !== null) {
      const numerator = exif.FocalLength.numerator;
      const denominator = exif.FocalLength.denominator ?? 1;
      if (typeof numerator === 'number' && Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) {
        focalLength = numerator / denominator;
      }
    }
  }

  return { camera, settings, focalLength };
}

/**
 * Parse frontmatter from markdown file
 * @param {string} content - Markdown file content
 * @returns {Object} Parsed frontmatter and body
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatterText = match[1];
  const body = match[2] || '';

  // Parse YAML-like frontmatter (simple parser)
  const frontmatter = {};
  const lines = frontmatterText.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    let value = trimmed.slice(colonIndex + 1).trim();

    // Handle boolean values (unquoted)
    if (value === 'true' || value === 'false') {
      frontmatter[key] = value === 'true';
      continue;
    }

    // Handle numbers (including decimals, unquoted)
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      frontmatter[key] = parseFloat(value);
      continue;
    }

    // Handle date strings (YYYY-MM-DD format, unquoted)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      frontmatter[key] = value; // Keep as string in YYYY-MM-DD format for Astro
      continue;
    }

    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
      
      // Check if quoted boolean
      if (value === 'true' || value === 'false') {
        frontmatter[key] = value === 'true';
        continue;
      }
      
      // Check if quoted date (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        frontmatter[key] = value; // Keep as string in YYYY-MM-DD format for Astro
        continue;
      }
    }

    // Handle arrays
    if (value.startsWith('[') && value.endsWith(']')) {
      const arrayContent = value.slice(1, -1).trim();
      if (arrayContent) {
        frontmatter[key] = arrayContent
          .split(',')
          .map(item => item.trim().replace(/^["']|["']$/g, ''));
      } else {
        frontmatter[key] = [];
      }
    } else {
      frontmatter[key] = value;
    }
  }

  return { frontmatter, body };
}

/**
 * Update frontmatter with EXIF data
 * @param {Object} frontmatter - Existing frontmatter
 * @param {Object} exifData - EXIF data to add
 * @returns {Object} Updated frontmatter
 */
function updateFrontmatter(frontmatter, exifData) {
  const updated = { ...frontmatter };

  // Only add EXIF fields if they don't already exist or are empty
  if (exifData.camera && !updated.camera) {
    updated.camera = exifData.camera;
  }
  if (exifData.settings && !updated.settings) {
    updated.settings = exifData.settings;
  }
  if (exifData.focalLength !== undefined && exifData.focalLength !== null && updated.focalLength === undefined) {
    updated.focalLength = exifData.focalLength;
  }

  return updated;
}

/**
 * Serialize frontmatter back to YAML string
 * @param {Object} frontmatter - Frontmatter object
 * @returns {string} YAML string
 */
function serializeFrontmatter(frontmatter) {
  const lines = [];
  
  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      const formatted = value.map(v => `"${v}"`).join(', ');
      lines.push(`${key}: [${formatted}]`);
    } else if (typeof value === 'number') {
      lines.push(`${key}: ${value}`);
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (value instanceof Date) {
      // Format date as YYYY-MM-DD
      const dateStr = value.toISOString().split('T')[0];
      lines.push(`${key}: ${dateStr}`);
    } else if (value === null || value === undefined) {
      // Skip null/undefined values
      continue;
    } else {
      // Escape quotes in string values
      const escaped = String(value).replace(/"/g, '\\"');
      lines.push(`${key}: "${escaped}"`);
    }
  }

  return lines.join('\n');
}

/**
 * Process a single photo markdown file
 * @param {string} mdPath - Path to markdown file
 * @param {string} photosDir - Directory containing photo files
 * @returns {Promise<boolean>} True if updated, false otherwise
 */
async function processPhotoFile(mdPath, photosDir) {
  try {
    // Read markdown file
    const content = await readFile(mdPath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);

    // Skip if already has all EXIF data
    if (frontmatter.camera && frontmatter.settings && frontmatter.focalLength !== undefined) {
      return false;
    }

    // Get filename from frontmatter
    const filename = frontmatter.filename;
    if (!filename) {
      console.warn(`  ⚠️  No filename in frontmatter: ${mdPath}`);
      return false;
    }

    // Extract album and photo filename
    const parts = filename.split('/');
    if (parts.length !== 2) {
      console.warn(`  ⚠️  Invalid filename format: ${filename}`);
      return false;
    }

    const albumSlug = parts[0];
    const photoFilename = parts[1];

    // Try to find photo file
    // First try: exact match in photos directory
    let photoPath = join(photosDir, albumSlug, photoFilename);
    
    // If not found, try with leading underscore removed (some photos have _ prefix)
    if (!existsSync(photoPath)) {
      const photoBasename = basename(photoFilename, extname(photoFilename));
      const photoExt = extname(photoFilename);
      const altFilename = photoBasename.replace(/^_+/, '') + photoExt;
      photoPath = join(photosDir, albumSlug, altFilename);
    }

    // If still not found, try with leading underscore added
    if (!existsSync(photoPath)) {
      const photoBasename = basename(photoFilename, extname(photoFilename));
      const photoExt = extname(photoFilename);
      const altFilename = `_${photoBasename}${photoExt}`;
      photoPath = join(photosDir, albumSlug, altFilename);
    }

    if (!existsSync(photoPath)) {
      console.warn(`  ⚠️  Photo not found: ${photoPath}`);
      return false;
    }

    // Extract EXIF data
    const exif = await exifr.parse(photoPath, {
      exif: true,
      pick: ['Make', 'Model', 'FNumber', 'ExposureTime', 'ISO', 'FocalLength']
    });

    if (!exif) {
      console.warn(`  ⚠️  No EXIF data found: ${photoPath}`);
      return false;
    }

    const exifData = extractTechnicalExif(exif);

    // Skip if no EXIF data extracted
    if (!exifData.camera && !exifData.settings && exifData.focalLength === undefined) {
      return false;
    }

    // Update frontmatter
    const updatedFrontmatter = updateFrontmatter(frontmatter, exifData);

    // Write back to file
    const updatedContent = `---\n${serializeFrontmatter(updatedFrontmatter)}\n---\n${body}`;
    await writeFile(mdPath, updatedContent, 'utf-8');

    const updates = [];
    if (exifData.camera && !frontmatter.camera) updates.push('camera');
    if (exifData.settings && !frontmatter.settings) updates.push('settings');
    if (exifData.focalLength !== undefined && frontmatter.focalLength === undefined) updates.push('focalLength');

    console.log(`  ✅ Updated ${basename(mdPath)}: ${updates.join(', ')}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error processing ${mdPath}:`, error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  const [photosDirArg] = process.argv.slice(2);

  if (!photosDirArg) {
    console.error('❌ Usage: node scripts/copy-exif-to-frontmatter.js <photos-directory>');
    console.error('\nExample:');
    console.error('  node scripts/copy-exif-to-frontmatter.js ~/Desktop/photos');
    console.error('  (Directory should contain album folders with photo files)');
    process.exit(1);
  }

  const photosDir = photosDirArg;
  const contentPhotosDir = join(process.cwd(), 'src', 'content', 'photos');

  if (!existsSync(photosDir)) {
    console.error(`❌ Photos directory not found: ${photosDir}`);
    process.exit(1);
  }

  if (!existsSync(contentPhotosDir)) {
    console.error(`❌ Content photos directory not found: ${contentPhotosDir}`);
    process.exit(1);
  }

  console.log(`\n📷 Copying EXIF data from photos to frontmatter...\n`);
  console.log(`   Photos directory: ${photosDir}`);
  console.log(`   Content directory: ${contentPhotosDir}\n`);

  // Get all album directories
  const albums = await readdir(contentPhotosDir, { withFileTypes: true });
  const albumDirs = albums.filter(d => d.isDirectory()).map(d => d.name);

  let totalProcessed = 0;
  let totalUpdated = 0;

  for (const albumSlug of albumDirs) {
    console.log(`📁 Processing album: ${albumSlug}`);

    const albumContentDir = join(contentPhotosDir, albumSlug);
    const mdFiles = await readdir(albumContentDir);
    const photoMdFiles = mdFiles.filter(f => f.endsWith('.md'));

    for (const mdFile of photoMdFiles) {
      const mdPath = join(albumContentDir, mdFile);
      totalProcessed++;
      
      const updated = await processPhotoFile(mdPath, photosDir);
      if (updated) {
        totalUpdated++;
      }
    }

    console.log('');
  }

  console.log(`\n✅ Complete!`);
  console.log(`   Processed: ${totalProcessed} photos`);
  console.log(`   Updated: ${totalUpdated} photos`);
  console.log(`\n💡 You can now delete the photos directory if desired.`);
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

