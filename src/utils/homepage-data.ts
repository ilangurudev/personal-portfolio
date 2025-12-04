import type { CollectionEntry } from 'astro:content';

export type BlogEntry = CollectionEntry<'blog'>;
export type ProjectEntry = CollectionEntry<'projects'>;

export function selectRecentPosts(entries: BlogEntry[], limit = 5): BlogEntry[] {
  return entries
    .filter(entry => entry.slug !== 'about')
    .sort((a, b) => {
      const diff = b.data.date.valueOf() - a.data.date.valueOf();
      if (diff !== 0) return diff;
      return a.slug.localeCompare(b.slug);
    })
    .slice(0, limit);
}

export function selectFeaturedProjects(entries: ProjectEntry[], limit = 5): ProjectEntry[] {
  return entries
    .slice()
    .sort((a, b) => {
      if (a.data.featured && !b.data.featured) return -1;
      if (!a.data.featured && b.data.featured) return 1;
      const diff = b.data.date.valueOf() - a.data.date.valueOf();
      if (diff !== 0) return diff;
      return a.slug.localeCompare(b.slug);
    })
    .slice(0, limit);
}
