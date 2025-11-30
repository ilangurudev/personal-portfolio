import exifr from 'exifr';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join, basename, extname, normalize } from 'path';
import { existsSync } from 'fs';

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
      frontmatter[key] = value;
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
      
      // Check if quoted date
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        frontmatter[key] = value;
        continue;
      }
    }

    // Handle arrays
    if (value.startsWith('[') && value.endsWith(']')) {
      const arrayContent = value.slice(1, -1).trim();
      if (!arrayContent) {
        frontmatter[key] = [];
      } else {
        frontmatter[key] = arrayContent
          .split(',')
          .map(item => {
            item = item.trim();
            if ((item.startsWith('"') && item.endsWith('"')) || 
                (item.startsWith("'") && item.endsWith("'"))) {
              return item.slice(1, -1);
            }
            return item;
          });
      }
      continue;
    }

    frontmatter[key] = value;
  }

  return { frontmatter, body };
}

/**
 * Serialize frontmatter object to string
 * @param {Object} frontmatter - Frontmatter object
 * @returns {string} Serialized frontmatter string
 */
function serializeFrontmatter(frontmatter) {
  return Object.entries(frontmatter)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        const arrayStr = value.map(v => `"${v}"`).join(', ');
        return `${key}: [${arrayStr}]`;
      }
      if (typeof value === 'string') {
        return `${key}: "${value}"`;
      }
      return `${key}: ${value}`;
    })
    .join('\n');
}

/**
 * Extract keywords from a photo using EXIF/IPTC data
 * @param {string} photoPath - Absolute path to the photo file
 * @returns {Promise<string[]>} Extracted keywords
 */
async function extractKeywords(photoPath) {
  try {
    const exif = await exifr.parse(photoPath, {
      iptc: true,
      xmp: true,
      exif: false, // We only need IPTC/XMP for keywords usually
    });

    // Keywords can be in IPTC Keywords or XMP subject - check both
    const keywords = exif?.Keywords || exif?.subject || [];
    // Ensure it's an array
    const tags = Array.isArray(keywords) ? keywords : (keywords ? [keywords] : []);
    return tags;
  } catch (error) {
    console.warn(`  ⚠️  Failed to read metadata for ${basename(photoPath)}: ${error.message}`);
    return [];
  }
}

async function main() {
  const [sourcePath] = process.argv.slice(2);

  if (!sourcePath) {
    console.error('❌ Usage: npm run sync_keywords <source-photos-path>');
    process.exit(1);
  }

  if (!existsSync(sourcePath)) {
    console.error(`❌ Source path not found: ${sourcePath}`);
    process.exit(1);
  }

  const albumSlug = basename(normalize(sourcePath));
  console.log(`\n🔄 Syncing keywords for album: ${albumSlug}`);
  console.log(`   Source: ${sourcePath}`);

  const photosDir = join(process.cwd(), 'src', 'content', 'photos', albumSlug);
  
  if (!existsSync(photosDir)) {
    console.error(`❌ Album directory not found: ${photosDir}`);
    console.error(`   Make sure you have imported this album first.`);
    process.exit(1);
  }

  const files = await readdir(photosDir);
  const mdFiles = files.filter(f => f.endsWith('.md'));

  if (mdFiles.length === 0) {
    console.log(`❌ No markdown files found in ${photosDir}`);
    process.exit(0);
  }

  console.log(`   Found ${mdFiles.length} metadata files. Processing...\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const mdFile of mdFiles) {
    const mdPath = join(photosDir, mdFile);
    const content = await readFile(mdPath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);

    if (!frontmatter.filename) {
      console.warn(`  ⚠️  Skipping ${mdFile}: No filename field found`);
      skippedCount++;
      continue;
    }

    // frontmatter.filename is likely "album-slug/image.jpg"
    // We want the basename to find it in sourcePath
    const imageFilename = basename(frontmatter.filename);
    const sourceImagePath = join(sourcePath, imageFilename);

    if (!existsSync(sourceImagePath)) {
      console.warn(`  ⚠️  Source image not found: ${sourceImagePath} (referenced in ${mdFile})`);
      skippedCount++;
      continue;
    }

    const newKeywords = await extractKeywords(sourceImagePath);
    
    // Compare new keywords with existing tags
    const currentTags = frontmatter.tags || [];
    const sortedCurrent = [...currentTags].sort().join(',');
    const sortedNew = [...newKeywords].sort().join(',');

    if (sortedCurrent === sortedNew) {
      // No changes
      continue;
    }

    // Update tags
    frontmatter.tags = newKeywords;
    
    // Reconstruct file content
    const newContent = `---\n${serializeFrontmatter(frontmatter)}\n---\n${body}`;
    await writeFile(mdPath, newContent, 'utf-8');
    
    console.log(`  ✅ Updated ${mdFile}: ${currentTags.length} -> ${newKeywords.length} tags`);
    updatedCount++;
  }

  console.log(`\n✅ Sync complete!`);
  console.log(`   Updated: ${updatedCount} files`);
  console.log(`   Skipped: ${skippedCount} files`);
}

main().catch(error => {
  console.error('❌ Sync failed:', error);
  process.exit(1);
});

