import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Parse frontmatter from a markdown file
 * Simple parser - assumes frontmatter is between --- delimiters
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return null;
  }

  const frontmatter = {};
  const lines = match[1].split('\n');

  for (const line of lines) {
    // Handle simple key: value pairs
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();

    // Remove quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }

    // Handle arrays (simple parsing)
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map(v => v.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }

    // Handle booleans
    if (value === 'true') value = true;
    if (value === 'false') value = false;

    frontmatter[key] = value;
  }

  return frontmatter;
}

/**
 * Validate metadata for a single photo
 */
function validatePhoto(filename, data) {
  const issues = [];

  // Check for generic titles (camera default filenames)
  const genericPrefixes = ['DSC_', 'IMG_', '_MG_', 'DSCN', 'P', 'PICT', ''];
  const titleLooksGeneric = genericPrefixes.some(prefix =>
    data.title?.toUpperCase().startsWith(prefix.toUpperCase())
  );

  if (titleLooksGeneric || !data.title) {
    issues.push({
      severity: 'warning',
      message: `Generic or missing title: "${data.title || 'untitled'}"`,
    });
  }

  // Check for missing tags
  if (!data.tags || data.tags.length === 0) {
    issues.push({
      severity: 'warning',
      message: 'No tags',
    });
  }

  // Check for missing description
  if (!data.description || data.description === '') {
    issues.push({
      severity: 'info',
      message: 'No description',
    });
  }

  // Check for missing location
  if (!data.location || data.location === '') {
    issues.push({
      severity: 'info',
      message: 'No location (optional)',
    });
  }

  // Check for missing featured flag (should be explicit)
  if (data.featured === undefined) {
    issues.push({
      severity: 'info',
      message: 'Featured flag not set (defaults to false)',
    });
  }

  return issues;
}

/**
 * Validate all photos in an album
 */
async function validateAlbum(albumSlug) {
  const photosDir = join(process.cwd(), 'src/content/photos', albumSlug);

  // Check if album directory exists
  if (!existsSync(photosDir)) {
    console.error(`❌ Album directory not found: ${photosDir}`);
    console.error(`\nDid you create the photo metadata files yet?`);
    process.exit(1);
  }

  const files = await readdir(photosDir);
  const mdFiles = files.filter(f => f.endsWith('.md'));

  if (mdFiles.length === 0) {
    console.error(`❌ No markdown files found in ${photosDir}`);
    console.error(`\nDid you split the batch file into individual .md files?`);
    process.exit(1);
  }

  console.log(`\n📋 Validating ${mdFiles.length} photos in album: ${albumSlug}\n`);

  const allIssues = {
    errors: [],
    warnings: [],
    info: [],
  };

  for (const file of mdFiles) {
    const filePath = join(photosDir, file);
    const content = await readFile(filePath, 'utf-8');
    const frontmatter = parseFrontmatter(content);

    if (!frontmatter) {
      allIssues.errors.push({ file, message: 'Could not parse frontmatter' });
      continue;
    }

    const issues = validatePhoto(file, frontmatter);

    for (const issue of issues) {
      allIssues[issue.severity === 'warning' ? 'warnings' : issue.severity === 'info' ? 'info' : 'errors'].push({
        file,
        message: issue.message,
      });
    }
  }

  // Print results
  let hasIssues = false;

  if (allIssues.errors.length > 0) {
    hasIssues = true;
    console.log(`❌ Errors (${allIssues.errors.length}):\n`);
    allIssues.errors.forEach(({ file, message }) => {
      console.log(`  ${file}: ${message}`);
    });
    console.log('');
  }

  if (allIssues.warnings.length > 0) {
    hasIssues = true;
    console.log(`⚠️  Warnings (${allIssues.warnings.length}):\n`);
    allIssues.warnings.forEach(({ file, message }) => {
      console.log(`  ${file}: ${message}`);
    });
    console.log('');
  }

  if (allIssues.info.length > 0) {
    console.log(`ℹ️  Info (${allIssues.info.length}):\n`);
    allIssues.info.forEach(({ file, message }) => {
      console.log(`  ${file}: ${message}`);
    });
    console.log('');
  }

  if (!hasIssues) {
    console.log(`✅ All photos have complete metadata!\n`);
    return true;
  }

  console.log(`\n💡 Suggestions:`);
  if (allIssues.warnings.some(i => i.message.includes('Generic'))) {
    console.log(`  - Replace generic titles with descriptive ones`);
  }
  if (allIssues.warnings.some(i => i.message.includes('tags'))) {
    console.log(`  - Add relevant tags for searchability`);
  }
  if (allIssues.info.some(i => i.message.includes('description'))) {
    console.log(`  - Consider adding descriptions for context`);
  }
  console.log('');

  return allIssues.errors.length === 0;
}

/**
 * Main function
 */
async function main() {
  const albumSlug = process.argv[2];

  if (!albumSlug) {
    console.error('❌ Usage: node scripts/validate-metadata.js <album-slug>');
    console.error('\nExample:');
    console.error('  node scripts/validate-metadata.js street-sf');
    process.exit(1);
  }

  const valid = await validateAlbum(albumSlug);
  process.exit(valid ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});
