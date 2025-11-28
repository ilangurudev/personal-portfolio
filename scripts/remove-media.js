import { existsSync } from 'fs';
import { join } from 'path';
import { readFile, readdir, rm } from 'fs/promises';
import { createInterface } from 'readline/promises';

const ROOT = process.cwd();

function printUsage() {
  console.log(`
Cleanly remove albums or individual photos (metadata + assets).

Usage:
  node scripts/remove-media.js --album <album-slug> [--yes] [--dry-run]
  node scripts/remove-media.js --photo <album-slug>/<photo-id> [--yes] [--dry-run]

Options:
  --album, -a    Album slug to remove entirely.
  --photo, -p    Photo identifier (<album>/<metadata-slug> or <album>/<filename.jpg>).
  --yes, -y      Skip confirmation prompt (use with automation).
  --dry-run      Show what would be deleted without removing anything.
  --help, -h     Show this message.
`);
}

function parseArgs(rawArgs) {
  const options = { album: null, photo: null, yes: false, dryRun: false, help: false };

  const expectValue = (flag, value) => {
    if (!value || value.startsWith('-')) {
      throw new Error(`Missing value for ${flag}`);
    }
    return value;
  };

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    switch (arg) {
      case '--album':
      case '-a':
        options.album = expectValue(arg, rawArgs[++i]);
        break;
      case '--photo':
      case '-p':
        options.photo = expectValue(arg, rawArgs[++i]);
        break;
      case '--yes':
      case '-y':
      case '--force':
        options.yes = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (options.album && options.photo) {
    throw new Error('Specify either --album or --photo, not both.');
  }

  if (!options.album && !options.photo) {
    options.help = true;
  }

  return options;
}

async function confirmAction(message, skip) {
  if (skip) return true;

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await rl.question(`${message} (y/N) `);
  rl.close();
  return answer.trim().toLowerCase() === 'y';
}

async function removeAlbum(albumSlug, options) {
  const albumPhotosDir = join(ROOT, 'public', 'photos', albumSlug);
  const albumContentDir = join(ROOT, 'src', 'content', 'photos', albumSlug);
  const albumMetadataFile = join(ROOT, 'src', 'content', 'albums', `${albumSlug}.md`);
  const batchFile = join(ROOT, `batch-import-${albumSlug}.md`);

  const targets = [];

  if (existsSync(albumPhotosDir)) {
    targets.push({ path: albumPhotosDir, type: 'dir', label: 'Photo assets' });
  }

  if (existsSync(albumContentDir)) {
    targets.push({ path: albumContentDir, type: 'dir', label: 'Photo metadata directory' });
  }

  if (existsSync(albumMetadataFile)) {
    targets.push({ path: albumMetadataFile, type: 'file', label: 'Album metadata file' });
  }

  if (existsSync(batchFile)) {
    targets.push({ path: batchFile, type: 'file', label: 'Batch import file' });
  }

  if (targets.length === 0) {
    throw new Error(`No files found for album "${albumSlug}". Nothing to remove.`);
  }

  console.log(`\n🧹 Preparing to remove album "${albumSlug}":`);
  targets.forEach(target => console.log(`  • ${target.label}: ${target.path}`));

  if (options.dryRun) {
    console.log('\nDry run complete. No files were removed.');
    return;
  }

  const confirmed = await confirmAction(`\nRemove album "${albumSlug}" and all listed files?`, options.yes);
  if (!confirmed) {
    console.log('\nAborted.');
    return;
  }

  for (const target of targets) {
    await rm(target.path, {
      recursive: target.type === 'dir',
      force: true,
    });
    console.log(`  ✅ Removed ${target.label}`);
  }

  console.log('\nAlbum removal complete.');
}

async function resolvePhotoMetadata(albumSlug, identifier) {
  const metadataDir = join(ROOT, 'src', 'content', 'photos', albumSlug);
  if (!existsSync(metadataDir)) {
    throw new Error(`Metadata directory not found for album "${albumSlug}".`);
  }

  const stripExtension = value =>
    value.replace(/\.(md|markdown)$/i, '').replace(/\.(jpe?g)$/i, '');

  const attemptSlug = stripExtension(identifier);
  const directPath = join(metadataDir, `${attemptSlug}.md`);

  if (existsSync(directPath)) {
    const content = await readFile(directPath, 'utf-8');
    return { metadataDir, metadataPath: directPath, slug: attemptSlug, content };
  }

  if (!/\.jpe?g$/i.test(identifier)) {
    throw new Error(
      `Photo metadata "${attemptSlug}.md" not found. Use the metadata filename (e.g., src/content/photos/${albumSlug}/photo-id.md).`
    );
  }

  const targetFilename = identifier.split('/').pop();
  const entries = await readdir(metadataDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const mdPath = join(metadataDir, entry.name);
    const content = await readFile(mdPath, 'utf-8');
    const filenameMatch = content.match(/^filename:\s*"(.+?)"/m);
    if (!filenameMatch) continue;
    const photoFilename = filenameMatch[1].split('/').pop();
    if (photoFilename === targetFilename) {
      return {
        metadataDir,
        metadataPath: mdPath,
        slug: entry.name.replace(/\.md$/, ''),
        content,
      };
    }
  }

  throw new Error(
    `Could not find metadata referencing "${targetFilename}". Check src/content/photos/${albumSlug}.`
  );
}

function extractFrontmatterValue(content, key) {
  const regex = new RegExp(`^${key}:\\s*"([^"]+)"`, 'm');
  const match = content.match(regex);
  return match ? match[1] : null;
}

async function removePhoto(identifier, options) {
  if (!identifier.includes('/')) {
    throw new Error('Photo identifier must be in the form <album>/<photo-id>.');
  }

  const [albumSlug, ...rest] = identifier.split('/');
  const rawPhotoId = rest.join('/');

  if (!albumSlug || !rawPhotoId) {
    throw new Error('Photo identifier must include both album slug and photo id.');
  }

  const { metadataDir, metadataPath, slug, content } = await resolvePhotoMetadata(
    albumSlug,
    rawPhotoId
  );

  const albumField = extractFrontmatterValue(content, 'album');
  if (albumField && albumField !== albumSlug) {
    throw new Error(
      `Album mismatch: metadata says "${albumField}", but CLI received "${albumSlug}".`
    );
  }

  const title = extractFrontmatterValue(content, 'title') || slug;
  const filename = extractFrontmatterValue(content, 'filename');

  if (!filename) {
    throw new Error(`Frontmatter in ${metadataPath} is missing a "filename" field.`);
  }

  const normalizedFilename = filename.replace(/^\/+/, '');
  const photoAssetPath = join(ROOT, 'public', 'photos', normalizedFilename);

  const targets = [
    { path: metadataPath, type: 'file', label: 'Photo metadata file' },
  ];

  if (existsSync(photoAssetPath)) {
    targets.push({ path: photoAssetPath, type: 'file', label: 'Photo asset' });
  } else {
    console.warn(`⚠️  Photo asset already missing: ${photoAssetPath}`);
  }

  console.log(`\n🗑️  Preparing to remove photo "${title}" from album "${albumSlug}":`);
  targets.forEach(target => console.log(`  • ${target.label}: ${target.path}`));

  if (options.dryRun) {
    console.log('\nDry run complete. No files were removed.');
    return;
  }

  const confirmed = await confirmAction(
    `\nRemove photo "${title}" and all listed files?`,
    options.yes
  );
  if (!confirmed) {
    console.log('\nAborted.');
    return;
  }

  for (const target of targets) {
    await rm(target.path, { force: true });
    console.log(`  ✅ Removed ${target.label}`);
  }

  await cleanupEmptyAlbum(albumSlug, metadataDir);
  console.log('\nPhoto removal complete.');
}

async function cleanupEmptyAlbum(albumSlug, metadataDir) {
  const metadataDirExists = existsSync(metadataDir);
  const photoDir = join(ROOT, 'public', 'photos', albumSlug);
  const albumMetadataFile = join(ROOT, 'src', 'content', 'albums', `${albumSlug}.md`);

  let remainingMetadata = 0;
  if (metadataDirExists) {
    const entries = await readdir(metadataDir);
    remainingMetadata = entries.filter(name => name.endsWith('.md')).length;
  }

  if (metadataDirExists && remainingMetadata === 0) {
    await rm(metadataDir, { recursive: true, force: true });
    console.log(`  🧹 Removed empty metadata directory: ${metadataDir}`);
  }

  if (existsSync(photoDir)) {
    const files = await readdir(photoDir);
    if (files.length === 0) {
      await rm(photoDir, { recursive: true, force: true });
      console.log(`  🧹 Removed empty photo directory: ${photoDir}`);
    }
  }

  const metadataDirStillExists = existsSync(metadataDir);
  const photoDirStillExists = existsSync(photoDir);
  if (!metadataDirStillExists && !photoDirStillExists && existsSync(albumMetadataFile)) {
    await rm(albumMetadataFile, { force: true });
    console.log(
      `  🧹 Removed album metadata file (album now empty): ${albumMetadataFile}`
    );
  } else if (existsSync(albumMetadataFile) && remainingMetadata === 0) {
    console.warn(
      `⚠️  Album metadata file still exists (${albumMetadataFile}). Remove it manually if the album is no longer needed.`
    );
  }
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`❌ ${error.message}`);
    printUsage();
    process.exit(1);
  }

  if (options.help) {
    printUsage();
    process.exit(options.album || options.photo ? 0 : 1);
  }

  try {
    if (options.album) {
      await removeAlbum(options.album, options);
    } else if (options.photo) {
      await removePhoto(options.photo, options);
    }
  } catch (error) {
    console.error(`\n❌ ${error.message}`);
    process.exit(1);
  }
}

main();
