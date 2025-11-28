import exifr from 'exifr';
import { readdir, copyFile, mkdir, writeFile } from 'fs/promises';
import { join, basename, extname, normalize } from 'path';
import { existsSync } from 'fs';

/**
 * Extract metadata from a photo using EXIF/IPTC data
 * @param {string} photoPath - Absolute path to the photo file
 * @returns {Promise<Object>} Extracted metadata object
 */
async function extractMetadata(photoPath) {
  try {
    // Read all metadata (IPTC, XMP, EXIF) - don't use pick as it may miss IPTC/XMP fields
    const exif = await exifr.parse(photoPath, {
      iptc: true,
      xmp: true,
      exif: true,
      gps: true,
    });

    const filename = basename(photoPath);
    const filenameWithoutExt = basename(photoPath, extname(photoPath));

    // Keywords can be in IPTC Keywords or XMP subject - check both
    const keywords = exif?.Keywords || exif?.subject || [];
    // Ensure it's an array
    const tags = Array.isArray(keywords) ? keywords : (keywords ? [keywords] : []);

    return {
      filename,
      title: exif?.Title || filenameWithoutExt.replace(/^_+/, ''), // Remove leading underscores from title
      tags: tags,
      date: exif?.DateTimeOriginal || new Date(),
      location: formatGPS(exif?.GPSLatitude, exif?.GPSLongitude),
      hasIPTC: !!(exif?.Title || tags.length > 0),
      hasGPS: !!(exif?.GPSLatitude && exif?.GPSLongitude),
    };
  } catch (error) {
    const filename = basename(photoPath);
    const filenameWithoutExt = basename(photoPath, extname(photoPath));

    console.warn(`⚠️  EXIF read failed for ${filename}: ${error.message}`);

    return {
      filename,
      title: filenameWithoutExt.replace(/^_+/, ''), // Remove leading underscores from title
      tags: [],
      date: new Date(),
      location: '',
      hasIPTC: false,
      hasGPS: false,
    };
  }
}

/**
 * Format GPS coordinates to a human-readable string
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {string} Formatted GPS string or empty if invalid
 */
function formatGPS(lat, lon) {
  if (!lat || !lon) return '';

  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';

  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
}

/**
 * Generate album metadata file
 * @param {string} albumSlug - Album slug identifier
 * @param {Array<Object>} photos - Array of photo metadata objects
 * @param {string} outputPath - Output file path
 */
async function generateAlbumFile(albumSlug, photos, outputPath) {
  // Use first photo as cover, or first photo filename
  const coverPhoto = photos.length > 0 
    ? `${albumSlug}/${photos[0].filename}`
    : `${albumSlug}/cover.jpg`;
  
  // Use date from first photo, or today's date
  const albumDate = photos.length > 0 && photos[0].date
    ? photos[0].date.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  // Generate album title from slug (capitalize and add spaces)
  const albumTitle = albumSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const content = `---
title: "${albumTitle}"
description: "A collection of photography"
coverPhoto: "${coverPhoto}"
date: ${albumDate}
featured: true
order: 1
---

A collection of photography from ${albumTitle}.
`;

  await writeFile(outputPath, content);
  console.log(`  ✅ Created album metadata: ${outputPath}`);
}

/**
 * Generate individual photo metadata file
 * @param {string} albumSlug - Album slug identifier
 * @param {Object} photo - Photo metadata object
 * @param {string} outputPath - Output file path
 */
async function generatePhotoFile(albumSlug, photo, outputPath) {
  const filenameWithoutExt = basename(photo.filename, extname(photo.filename));
  const dateStr = photo.date.toISOString().split('T')[0];
  
  // Format tags array
  const tagsFormatted = photo.tags.length > 0
    ? photo.tags.map(t => `"${t}"`).join(', ')
    : '';

  const content = `---
title: "${photo.title}"
album: "${albumSlug}"
filename: "${albumSlug}/${photo.filename}"
tags: [${tagsFormatted}]
date: ${dateStr}
featured: false
location: "${photo.location || ''}"
---

`;

  await writeFile(outputPath, content);
}

/**
 * Main function - CLI entry point
 */
async function main() {
  const [sourcePath] = process.argv.slice(2);

  // Validate arguments
  if (!sourcePath) {
    console.error('❌ Usage: npm run import <source-photos-path>');
    console.error('\nExample:');
    console.error('  npm run import ~/Desktop/sf-street-photos');
    console.error('  (Album slug will be extracted from the path: "sf-street-photos")');
    process.exit(1);
  }

  // Validate source path
  if (!existsSync(sourcePath)) {
    console.error(`❌ Source path not found: ${sourcePath}`);
    process.exit(1);
  }

  // Extract album slug from the last component of the path
  const albumSlug = basename(normalize(sourcePath));

  console.log(`\n📸 Importing photos for album: ${albumSlug}`);
  console.log(`   Source: ${sourcePath}\n`);

  // Create album folder in public/photos
  const albumDir = join(process.cwd(), 'public', 'photos', albumSlug);
  await mkdir(albumDir, { recursive: true });
  console.log(`📁 Created album directory: public/photos/${albumSlug}/`);

  // Read source photos
  const files = await readdir(sourcePath);
  const jpegFiles = files.filter(f => /\.(jpe?g|JPE?G)$/i.test(f));

  if (jpegFiles.length === 0) {
    console.error(`\n❌ No JPEG files found in ${sourcePath}`);
    process.exit(1);
  }

  console.log(`\n📷 Found ${jpegFiles.length} photos. Processing...\n`);

  // Process photos
  const photos = [];
  for (const file of jpegFiles) {
    const sourcePhotoPath = join(sourcePath, file);
    const destPath = join(albumDir, file);

    // Extract metadata
    const metadata = await extractMetadata(sourcePhotoPath);
    photos.push(metadata);

    // Copy photo
    await copyFile(sourcePhotoPath, destPath);
    console.log(`  ✅ ${file}`);
  }

  // Create content directories
  const albumsDir = join(process.cwd(), 'src', 'content', 'albums');
  const photosDir = join(process.cwd(), 'src', 'content', 'photos', albumSlug);
  await mkdir(albumsDir, { recursive: true });
  await mkdir(photosDir, { recursive: true });
  console.log(`\n📝 Creating metadata files...\n`);

  // Generate album metadata file
  const albumPath = join(albumsDir, `${albumSlug}.md`);
  await generateAlbumFile(albumSlug, photos, albumPath);

  // Generate individual photo metadata files
  for (const photo of photos) {
    const filenameWithoutExt = basename(photo.filename, extname(photo.filename));
    // Remove leading underscore from metadata filename (Astro excludes _*.md files)
    const metadataFilename = filenameWithoutExt.replace(/^_+/, '');
    const photoPath = join(photosDir, `${metadataFilename}.md`);
    await generatePhotoFile(albumSlug, photo, photoPath);
    console.log(`  ✅ Created photo metadata: ${metadataFilename}.md`);
  }

  // Summary
  console.log(`\n✅ Summary:`);
  console.log(`   Photos imported: ${photos.length}`);
  console.log(`   Photos with IPTC metadata: ${photos.filter(p => p.hasIPTC).length}/${photos.length}`);
  console.log(`   Photos with GPS data: ${photos.filter(p => p.hasGPS).length}/${photos.length}`);
  console.log(`\n🎉 Import complete!`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Review and edit album metadata: src/content/albums/${albumSlug}.md`);
  console.log(`   2. Review and edit photo metadata in: src/content/photos/${albumSlug}/`);
  console.log(`   3. Add descriptive titles, refine tags, and add descriptions`);
  console.log(`   4. Commit your changes`);
}

main().catch(error => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});
