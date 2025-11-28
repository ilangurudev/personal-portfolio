import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * Fix frontmatter types (date and featured should not be quoted)
 */
async function fixFrontmatterTypes() {
  const contentPhotosDir = join(process.cwd(), 'src', 'content', 'photos');

  console.log('🔧 Fixing frontmatter types...\n');

  // Get all album directories
  const albums = await readdir(contentPhotosDir, { withFileTypes: true });
  const albumDirs = albums.filter(d => d.isDirectory()).map(d => d.name);

  let totalFixed = 0;

  for (const albumSlug of albumDirs) {
    const albumContentDir = join(contentPhotosDir, albumSlug);
    const mdFiles = await readdir(albumContentDir);
    const photoMdFiles = mdFiles.filter(f => f.endsWith('.md'));

    for (const mdFile of photoMdFiles) {
      const mdPath = join(albumContentDir, mdFile);
      const content = await readFile(mdPath, 'utf-8');

      // Fix date: "YYYY-MM-DD" -> date: YYYY-MM-DD
      let fixed = content.replace(/^date: "(\d{4}-\d{2}-\d{2})"$/m, 'date: $1');
      
      // Fix featured: "true" -> featured: true
      fixed = fixed.replace(/^featured: "true"$/m, 'featured: true');
      fixed = fixed.replace(/^featured: "false"$/m, 'featured: false');

      if (fixed !== content) {
        await writeFile(mdPath, fixed, 'utf-8');
        console.log(`  ✅ Fixed: ${albumSlug}/${mdFile}`);
        totalFixed++;
      }
    }
  }

  console.log(`\n✅ Fixed ${totalFixed} files`);
}

fixFrontmatterTypes().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

