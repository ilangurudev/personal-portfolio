import exifr from 'exifr';
// import inquirer from 'inquirer'; // Replaced by custom UI
import { readdir, copyFile, mkdir, writeFile, readFile } from 'fs/promises';
import { join, basename, extname, normalize } from 'path';
import { existsSync } from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import 'dotenv/config';
import { getAlbumDetails } from './import-ui.js';

// R2 Configuration
const R2_ENABLED = process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME;

let s3Client;
if (R2_ENABLED) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

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

    // Extract technical EXIF data
    const { camera, settings, focalLength } = extractTechnicalExif(exif);

    return {
      filename,
      title: exif?.Title || filenameWithoutExt.replace(/^_+/, ''), // Remove leading underscores from title
      tags: tags,
      date: exif?.DateTimeOriginal || new Date(),
      location: formatGPS(exif?.GPSLatitude, exif?.GPSLongitude),
      camera,
      settings,
      focalLength,
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
      camera: undefined,
      settings: undefined,
      focalLength: undefined,
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
 * @param {Object} options - Album options (title, description, coverPhoto)
 */
async function generateAlbumFile(albumSlug, photos, outputPath, options = {}) {
  // Use provided cover photo or first photo
  const coverPhoto = options.coverPhoto 
    ? `${albumSlug}/${options.coverPhoto}`
    : (photos.length > 0 ? `${albumSlug}/${photos[0].filename}` : `${albumSlug}/cover.jpg`);
  
  // Use date from first photo, or today's date
  const albumDate = photos.length > 0 && photos[0].date
    ? photos[0].date.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  // Use provided title or generate from slug
  const albumTitle = options.title || albumSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const description = options.description || "A collection of photography";

  const content = `---
title: "${albumTitle}"
description: "${description}"
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
 * @param {Object} options - Photo options (isFeatured)
 */
async function generatePhotoFile(albumSlug, photo, outputPath, options = {}) {
  const filenameWithoutExt = basename(photo.filename, extname(photo.filename));
  const dateStr = photo.date.toISOString().split('T')[0];
  
  // Format tags array
  const tagsFormatted = photo.tags.length > 0
    ? photo.tags.map(t => `"${t}"`).join(', ')
    : '';

  // Build frontmatter with EXIF data
  const frontmatterLines = [
    `title: "${photo.title}"`,
    `album: "${albumSlug}"`,
    `filename: "${albumSlug}/${photo.filename}"`,
    `tags: [${tagsFormatted}]`,
    `date: ${dateStr}`,
    `featured: ${!!options.isFeatured}`,
  ];

  // Add optional EXIF fields if present
  if (photo.location) {
    frontmatterLines.push(`location: "${photo.location}"`);
  } else {
    frontmatterLines.push(`location: ""`);
  }

  if (photo.camera) {
    frontmatterLines.push(`camera: "${photo.camera}"`);
  }

  if (photo.settings) {
    frontmatterLines.push(`settings: "${photo.settings}"`);
  }

  if (photo.focalLength !== undefined && photo.focalLength !== null) {
    frontmatterLines.push(`focalLength: ${photo.focalLength}`);
  }

  const content = `---
${frontmatterLines.join('\n')}
---

`;

  await writeFile(outputPath, content);
}

/**
 * Upload file to R2
 * @param {string} filePath - Source file path
 * @param {string} key - Destination key (path in bucket)
 */
async function uploadToR2(filePath, key) {
  const fileContent = await readFile(filePath);
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: fileContent,
    ContentType: 'image/jpeg', // Assuming JPEGs as per filter
  });

  try {
    await s3Client.send(command);
    console.log(`  ☁️  Uploaded to R2: ${key}`);
  } catch (error) {
    console.error(`  ❌ R2 Upload failed for ${key}:`, error);
    throw error;
  }
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
  
  if (R2_ENABLED) {
    console.log(`   ☁️  R2 Upload Enabled (Bucket: ${process.env.R2_BUCKET_NAME})`);
  } else {
    console.log(`   📂 Local Storage Mode (Check .env to enable R2)`);
  }
  console.log('');

  // Create album folder in public/photos ONLY if not using R2
  const albumDir = join(process.cwd(), 'public', 'photos', albumSlug);
  if (!R2_ENABLED) {
    await mkdir(albumDir, { recursive: true });
    console.log(`📁 Created local album directory: public/photos/${albumSlug}/`);
  }

  // Read source photos
  const files = await readdir(sourcePath);
  const jpegFiles = files.filter(f => /\.(jpe?g|JPE?G)$/i.test(f));

  if (jpegFiles.length === 0) {
    console.error(`\n❌ No JPEG files found in ${sourcePath}`);
    process.exit(1);
  }

  console.log(`\n📷 Found ${jpegFiles.length} photos. Processing...\n`);

  // Process photos (upload/copy + extract metadata) FIRST
  const photos = [];
  for (const file of jpegFiles) {
    const sourcePhotoPath = join(sourcePath, file);
    
    // Extract metadata FIRST (from local file)
    const metadata = await extractMetadata(sourcePhotoPath);
    photos.push(metadata);

    if (R2_ENABLED) {
      // Upload to R2
      const r2Key = `${albumSlug}/${file}`;
      await uploadToR2(sourcePhotoPath, r2Key);
    } else {
      // Copy locally
      const destPath = join(albumDir, file);
      await copyFile(sourcePhotoPath, destPath);
      console.log(`  ✅ Copied locally: ${file}`);
    }
  }

  // Interactive UI Selection
  console.log('✨ Launching selection UI...');
  const defaultTitle = albumSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  // Use sourcePath for serving images in the UI regardless of R2/local mode
  const answers = await getAlbumDetails(sourcePath, photos, defaultTitle);
  console.log('✅ Selection received:', answers);


  // Create content directories
  const albumsDir = join(process.cwd(), 'src', 'content', 'albums');
  const photosDir = join(process.cwd(), 'src', 'content', 'photos', albumSlug);
  await mkdir(albumsDir, { recursive: true });
  await mkdir(photosDir, { recursive: true });
  console.log(`\n📝 Creating metadata files...\n`);

  // Generate album metadata file
  const albumPath = join(albumsDir, `${albumSlug}.md`);
  await generateAlbumFile(albumSlug, photos, albumPath, {
    title: answers.displayName,
    description: answers.description,
    coverPhoto: answers.coverImage
  });

  // Generate individual photo metadata files
  for (const photo of photos) {
    const filenameWithoutExt = basename(photo.filename, extname(photo.filename));
    // Remove leading underscore from metadata filename (Astro excludes _*.md files)
    const metadataFilename = filenameWithoutExt.replace(/^_+/, '');
    const photoPath = join(photosDir, `${metadataFilename}.md`);
    const isFeatured = answers.featuredImages.includes(photo.filename);
    await generatePhotoFile(albumSlug, photo, photoPath, { isFeatured });
    console.log(`  ✅ Created photo metadata: ${metadataFilename}.md`);
  }

  // Summary
  const photosWithExif = photos.filter(p => p.camera || p.settings || p.focalLength !== undefined).length;
  console.log(`\n✅ Summary:`);
  console.log(`   Photos imported: ${photos.length}`);
  console.log(`   Photos with EXIF data: ${photosWithExif}/${photos.length}`);
  console.log(`   Photos with IPTC metadata: ${photos.filter(p => p.hasIPTC).length}/${photos.length}`);
  console.log(`   Photos with GPS data: ${photos.filter(p => p.hasGPS).length}/${photos.length}`);
  console.log(`\n🎉 Import complete!`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Review and edit album metadata: src/content/albums/${albumSlug}.md`);
  console.log(`   2. Review and edit photo metadata in: src/content/photos/${albumSlug}/`);
  console.log(`   3. EXIF data (camera, settings, focal length) has been saved to frontmatter`);
  if (!R2_ENABLED) {
    console.log(`   4. Add descriptive titles, refine tags, and add descriptions`);
    console.log(`   5. Commit your changes`);
  } else {
    console.log(`   4. Verify photos appear on your R2 domain`);
    console.log(`   5. Commit metadata changes (no binary files!)`);
  }
}

main().catch(error => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});