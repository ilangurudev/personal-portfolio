import exifr from 'exifr';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Extract tags from a photo file
 * @param {string} photoPath - Absolute path to the photo file
 * @returns {Promise<string[]>} Array of tag strings
 */
async function extractTags(photoPath) {
  try {
    const exif = await exifr.parse(photoPath, {
      iptc: true,
      xmp: true,
    });

    // Keywords can be in IPTC Keywords or XMP subject - check both
    const keywords = exif?.Keywords || exif?.subject || [];
    // Ensure it's an array
    return Array.isArray(keywords) ? keywords : (keywords ? [keywords] : []);
  } catch (error) {
    console.warn(`⚠️  Failed to extract tags from ${photoPath}: ${error.message}`);
    return [];
  }
}

/**
 * Update tags in a markdown frontmatter file
 * @param {string} mdPath - Path to markdown file
 * @param {string[]} tags - Array of tags to set
 */
async function updateMarkdownTags(mdPath, tags) {
  const content = await readFile(mdPath, 'utf-8');
  
  // Match the tags line in frontmatter
  const tagsRegex = /^tags:\s*\[.*?\]/m;
  
  // Format tags as YAML array
  const tagsFormatted = tags.length > 0
    ? tags.map(t => `"${t}"`).join(', ')
    : '';
  const tagsLine = `tags: [${tagsFormatted}]`;
  
  if (tagsRegex.test(content)) {
    // Replace existing tags line
    const updated = content.replace(tagsRegex, tagsLine);
    await writeFile(mdPath, updated, 'utf-8');
    return true;
  } else {
    // Tags line not found - this shouldn't happen with valid frontmatter
    console.warn(`⚠️  Could not find tags line in ${mdPath}`);
    return false;
  }
}

/**
 * Process all photos in an album
 * @param {string} albumSlug - Album slug
 */
async function processAlbum(albumSlug) {
  const photosDir = join(process.cwd(), 'public', 'photos', albumSlug);
  const contentDir = join(process.cwd(), 'src', 'content', 'photos', albumSlug);

  if (!existsSync(photosDir)) {
    console.error(`❌ Photos directory not found: ${photosDir}`);
    return;
  }

  if (!existsSync(contentDir)) {
    console.error(`❌ Content directory not found: ${contentDir}`);
    return;
  }

  console.log(`\n📷 Processing album: ${albumSlug}\n`);

  // Get all JPEG files
  const photoFiles = await readdir(photosDir);
  const jpegFiles = photoFiles.filter(f => /\.(jpe?g|JPE?G)$/i.test(f));

  let updated = 0;
  let skipped = 0;

  for (const photoFile of jpegFiles) {
    const photoPath = join(photosDir, photoFile);
    const mdFile = photoFile.replace(/\.(jpe?g|JPE?G)$/i, '.md');
    const mdPath = join(contentDir, mdFile);

    if (!existsSync(mdPath)) {
      console.warn(`⚠️  Markdown file not found: ${mdFile}`);
      skipped++;
      continue;
    }

    // Extract tags from photo
    const tags = await extractTags(photoPath);

    if (tags.length === 0) {
      console.log(`  ⏭️  ${photoFile} - No tags found`);
      skipped++;
      continue;
    }

    // Update markdown file
    await updateMarkdownTags(mdPath, tags);
    console.log(`  ✅ ${photoFile} - Updated with ${tags.length} tags: ${tags.join(', ')}`);
    updated++;
  }

  console.log(`\n✅ Summary:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${jpegFiles.length}\n`);
}

/**
 * Main function - CLI entry point
 */
async function main() {
  const albumSlug = process.argv[2];

  if (!albumSlug) {
    console.error('❌ Usage: node scripts/update-photo-tags.js <album-slug>');
    console.error('\nExample:');
    console.error('  node scripts/update-photo-tags.js pacific-northwest');
    process.exit(1);
  }

  await processAlbum(albumSlug);
}

main().catch(error => {
  console.error('❌ Update failed:', error);
  process.exit(1);
});

