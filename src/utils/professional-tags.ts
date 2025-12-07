import { getCollection, type CollectionEntry } from 'astro:content';

type ProfessionalEntry = CollectionEntry<'blog'> | CollectionEntry<'projects'>;

export type TagSummary = {
  tag: string;
  displayTag: string;
  count: number;
};

const normalizeTag = (tag: string) => tag.trim().toLowerCase();

export async function getProfessionalEntries(): Promise<ProfessionalEntry[]> {
  const [blogPosts, projects] = await Promise.all([
    getCollection('blog').then(entries =>
      entries.filter(entry => entry.slug !== 'about'),
    ),
    getCollection('projects'),
  ]);

  return [...blogPosts, ...projects];
}

export function aggregateProfessionalTags(entries: ProfessionalEntry[]): TagSummary[] {
  const tagMap = new Map<string, { displayTag: string; count: number }>();

  entries.forEach(entry => {
    (entry.data.tags ?? []).forEach(rawTag => {
      const trimmed = rawTag?.trim();
      if (!trimmed) return;

      const normalized = normalizeTag(trimmed);
      const existing = tagMap.get(normalized);

      if (existing) {
        existing.count += 1;
        return;
      }

      tagMap.set(normalized, {
        displayTag: trimmed,
        count: 1,
      });
    });
  });

  return Array.from(tagMap.entries())
    .map(([tag, meta]) => ({
      tag,
      displayTag: meta.displayTag,
      count: meta.count,
    }))
    .sort((a, b) => b.count - a.count || a.displayTag.localeCompare(b.displayTag));
}

export function filterEntriesByTag(entries: ProfessionalEntry[], tag: string): ProfessionalEntry[] {
  const normalized = normalizeTag(tag);

  return entries.filter(entry =>
    (entry.data.tags ?? []).some(rawTag => normalizeTag(rawTag) === normalized),
  );
}


