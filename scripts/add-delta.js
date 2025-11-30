import exifr from 'exifr';
import { readdir, copyFile, mkdir, writeFile, readFile } from 'fs/promises';
import { join, basename, extname, normalize } from 'path';
import { existsSync } from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import 'dotenv/config';

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
    console.error('❌ Usage: node scripts/add-delta.js <source-photos-path>');
    console.error('\nExample:');
    console.error('  node scripts/add-delta.js ~/Desktop/sf-street-photos');
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

  console.log(`\n📸 Checking delta for album: ${albumSlug}`);
  console.log(`   Source: ${sourcePath}\n`);
  
  // Check if album exists in src/content/albums
  const albumsDir = join(process.cwd(), 'src', 'content', 'albums');
  const albumMetadataPath = join(albumsDir, `${albumSlug}.md`);
  
  if (!existsSync(albumMetadataPath)) {
    console.error(`❌ Album metadata not found at: ${albumMetadataPath}`);
    console.error(`   Please run the full import first: npm run import "${sourcePath}"`);
    process.exit(1);
  }

  // R2 or Local
  if (R2_ENABLED) {
    console.log(`   ☁️  R2 Upload Enabled (Bucket: ${process.env.R2_BUCKET_NAME})`);
  } else {
    console.log(`   📂 Local Storage Mode (Check .env to enable R2)`);
  }
  console.log('');

  // Destination for photos
  const albumDir = join(process.cwd(), 'public', 'photos', albumSlug);
  if (!R2_ENABLED) {
    if (!existsSync(albumDir)) {
        console.log(`📁 Creating local album directory: public/photos/${albumSlug}/`);
        await mkdir(albumDir, { recursive: true });
    }
  }

  // Metadata directory
  const photosDir = join(process.cwd(), 'src', 'content', 'photos', albumSlug);
  if (!existsSync(photosDir)) {
      console.warn(`⚠️  Photos metadata directory not found at: ${photosDir}`);
      await mkdir(photosDir, { recursive: true });
  }

  // Read existing metadata files to know what's already imported
  let existingPhotoFiles = [];
  if (existsSync(photosDir)) {
    const files = await readdir(photosDir);
    existingPhotoFiles = files
        .filter(f => f.endsWith('.md'))
        .map(f => basename(f, '.md')); // filename without extension
  }

  // Read source photos
  const sourceFiles = await readdir(sourcePath);
  const jpegFiles = sourceFiles.filter(f => /\.(jpe?g|JPE?G)$/i.test(f));

  if (jpegFiles.length === 0) {
    console.error(`\n❌ No JPEG files found in ${sourcePath}`);
    process.exit(1);
  }

  // Filter for new files
  // Note: Metadata filenames usually match photo filenames minus extension.
  // We need to be careful about matching. import-photos.js uses:
  // const filenameWithoutExt = basename(photo.filename, extname(photo.filename));
  // const metadataFilename = filenameWithoutExt.replace(/^_+/, '');
  
  const newFiles = jpegFiles.filter(file => {
    const filenameWithoutExt = basename(file, extname(file));
    const metadataFilename = filenameWithoutExt.replace(/^_+/, '');
    return !existingPhotoFiles.includes(metadataFilename);
  });

  if (newFiles.length === 0) {
      console.log(`✅ No new photos to add. All ${jpegFiles.length} photos are already imported.`);
      process.exit(0);
  }

  console.log(`\n📷 Found ${newFiles.length} new photos (out of ${jpegFiles.length} total). Processing...\n`);

  // Process new photos
  const photos = [];
  for (const file of newFiles) {
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
      // Check if file already exists locally to avoid overwrite if not needed? 
      // But it's a "new" import, so maybe overwrite or just copy.
      await copyFile(sourcePhotoPath, destPath);
      console.log(`  ✅ Copied locally: ${file}`);
    }

    // Generate metadata file
    const filenameWithoutExt = basename(metadata.filename, extname(metadata.filename));
    const metadataFilename = filenameWithoutExt.replace(/^_+/, '');
    const photoPath = join(photosDir, `${metadataFilename}.md`);
    
    // Default to NOT featured for delta imports
    await generatePhotoFile(albumSlug, metadata, photoPath, { isFeatured: false });
    console.log(`  ✅ Created photo metadata: ${metadataFilename}.md`);
  }

  // Summary
  const photosWithExif = photos.filter(p => p.camera || p.settings || p.focalLength !== undefined).length;
  console.log(`\n✅ Delta Import Summary:`);
  console.log(`   New Photos added: ${photos.length}`);
  console.log(`   Photos with EXIF data: ${photosWithExif}/${photos.length}`);
  console.log(`   Photos with IPTC metadata: ${photos.filter(p => p.hasIPTC).length}/${photos.length}`);
  console.log(`   Photos with GPS data: ${photos.filter(p => p.hasGPS).length}/${photos.length}`);
  console.log(`\n🎉 Delta import complete!`);
}

main().catch(error => {
  console.error('❌ Delta import failed:', error);
  process.exit(1);
});
