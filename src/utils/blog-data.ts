import type { CollectionEntry } from 'astro:content';

export type BlogCollectionEntry = CollectionEntry<'blog'>;

export const BLOG_FILE_PERMISSIONS = '-rw-r--r--';
export const BLOG_FILE_OWNER = 'guru';

export function formatPostSize(body: string | number): string {
  const length = typeof body === 'number' ? body : body.length;
  if (!Number.isFinite(length) || length <= 0) {
    return '0k';
  }

  return `${Math.floor(length / 100)}k`;
}

export function sanitizeBlogEntries(entries: BlogCollectionEntry[]): BlogCollectionEntry[] {
  return entries.filter(entry => entry.slug !== 'about');
}

export function buildBlogStaticPaths(entries: BlogCollectionEntry[]) {
  const seen = new Set<string>();

  return sanitizeBlogEntries(entries).reduce<Array<{ params: { slug: string }; props: { entry: BlogCollectionEntry } }>>(
    (acc, entry) => {
      if (seen.has(entry.slug)) {
        return acc;
      }

      seen.add(entry.slug);
      acc.push({
        params: { slug: entry.slug },
        props: { entry },
      });

      return acc;
    },
    [],
  );
}
