import { getCollection } from 'astro:content';
import {
  getAlbumTitleMap,
  getPhotosWithExif,
  serializePhotoForGallery,
  sortAlbums,
  sortPhotos
} from './photo-helpers';
import { getPhotoUrl } from './url-helper';

type SearchKind = 'blog' | 'project' | 'photo' | 'album';

export interface SearchResult {
  kind: SearchKind;
  title: string;
  url: string;
  snippet: string;
  tags: string[];
  date?: string;
  albumTitle?: string;
  albumSlug?: string;
  camera?: string;
  location?: string;
  thumbUrl?: string;
  coverUrl?: string;
  /** Photo-only fields to support lightbox activation from search */
  id?: string;
  body?: string;
  filename?: string;
  settings?: string;
  focalLength?: number;
  position?: string;
  space: 'professional' | 'photography';
}

const tokenize = (query: string): string[] =>
  query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

const buildHaystack = (...parts: Array<string | undefined | string[]>): string => {
  return parts
    .flatMap((part) => (Array.isArray(part) ? part : [part]))
    .filter(Boolean)
    .map((part) => (part as string).toString().trim())
    .join(' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
};

const matchesQuery = (terms: string[], haystack: string): boolean =>
  terms.every((term) => haystack.includes(term));

const computeRelevance = (terms: string[], haystack: string): number =>
  terms.reduce((score, term) => {
    if (!haystack.includes(term)) return score;
    // Count occurrences of each term to give more weight to closer matches
    const occurrences = haystack.split(term).length - 1;
    return score + occurrences;
  }, 0);

const makeSnippet = (primary?: string, fallback?: string, limit = 180): string => {
  const raw = (primary || fallback || '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';
  return raw.length > limit ? `${raw.slice(0, limit)}…` : raw;
};

const sortByDateDesc = (a?: string, b?: string) => {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return b.localeCompare(a);
};

export async function searchProfessional(query: string): Promise<SearchResult[]> {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const [blogPosts, projects] = await Promise.all([
    getCollection('blog'),
    getCollection('projects')
  ]);

  const blogResults = blogPosts
    .filter((post) => post.slug !== 'about')
    .filter((post) =>
      matchesQuery(
        terms,
        buildHaystack(post.data.title, post.data.description, post.data.tags, post.body)
      )
    )
    .map<SearchResult>((post) => ({
      kind: 'blog',
      space: 'professional',
      title: post.data.title,
      url: `/blog/${post.slug}`,
      snippet: makeSnippet(post.body, post.data.description),
      tags: post.data.tags || [],
      date: post.data.date.toISOString()
    }));

  const projectResults = projects
    .filter((project) =>
      matchesQuery(
        terms,
        buildHaystack(project.data.title, project.data.description, project.data.tags, project.body)
      )
    )
    .map<SearchResult>((project) => ({
      kind: 'project',
      space: 'professional',
      title: project.data.title,
      url: `/projects/${project.slug}`,
      snippet: makeSnippet(project.body, project.data.description),
      tags: project.data.tags || [],
      date: project.data.date.toISOString()
    }));

  return [...blogResults, ...projectResults].sort((a, b) => sortByDateDesc(a.date, b.date));
}

export async function searchPhotography(query: string): Promise<SearchResult[]> {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const [photos, albums] = await Promise.all([getPhotosWithExif(), getCollection('albums')]);
  const albumTitleMap = await getAlbumTitleMap(albums);

  const sortedPhotos = sortPhotos(photos);
  const photoResults = sortedPhotos
    .map((photo) => serializePhotoForGallery(photo, albumTitleMap, { includeResized: true }))
    .map((photo) => {
      const haystack = buildHaystack(
        photo.data.title,
        photo.data.tags,
        photo.data.albumTitle,
        photo.data.camera,
        photo.data.settings,
        photo.data.location,
        photo.body
      );

      if (!matchesQuery(terms, haystack)) return null;

      const isoDate =
        photo.data.date instanceof Date
          ? photo.data.date.toISOString()
          : typeof photo.data.date === 'string'
          ? photo.data.date
          : '';

      return {
        result: {
          kind: 'photo' as const,
          space: 'photography' as const,
          id: photo.id,
          title: photo.data.title,
          url: photo.url,
          filename: photo.data.filename,
          body: photo.body,
          snippet: makeSnippet(
            photo.body,
            photo.data.location ||
              photo.data.camera ||
              photo.data.albumTitle ||
              photo.data.album
          ),
          tags: photo.data.tags || [],
          date: isoDate,
          albumTitle: photo.data.albumTitle,
          albumSlug: photo.data.album,
          camera: photo.data.camera,
          settings: photo.data.settings,
          focalLength: photo.data.focalLength,
          position: photo.data.position,
          location: photo.data.location,
          thumbUrl: photo.resizedUrl
        },
        orderScore: photo.data.order_score ?? 0,
        relevance: computeRelevance(terms, haystack)
      };
    })
    .filter((item): item is { result: SearchResult; orderScore: number; relevance: number } => Boolean(item));

  const albumResults = sortAlbums(albums).filter((album) =>
    matchesQuery(terms, buildHaystack(album.data.title, album.data.description, album.body))
  ).map<SearchResult>((album) => ({
    kind: 'album',
    space: 'photography',
    title: album.data.title,
    url: `/photography/album/${album.slug}`,
    snippet: makeSnippet(album.body, album.data.description),
    tags: [],
    date: album.data.date.toISOString(),
    albumSlug: album.slug,
    coverUrl: album.data.coverPhoto ? getPhotoUrl(album.data.coverPhoto) : undefined
  }));

  const sortedPhotoResults = photoResults
    .sort((a, b) => {
      if (b.orderScore !== a.orderScore) return b.orderScore - a.orderScore;
      if (b.relevance !== a.relevance) return b.relevance - a.relevance;
      return sortByDateDesc(a.result.date, b.result.date);
    })
    .map((entry) => entry.result);

  return [...albumResults, ...sortedPhotoResults];
}

