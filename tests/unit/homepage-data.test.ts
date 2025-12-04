import { describe, it, expect } from 'vitest';
import { selectRecentPosts, selectFeaturedProjects } from '../../src/utils/homepage-data';
import type { BlogEntry, ProjectEntry } from '../../src/utils/homepage-data';

type BlogFactoryOptions = {
  slug: string;
  date: string;
};

type ProjectFactoryOptions = {
  slug: string;
  date: string;
  featured?: boolean;
};

const makeBlogEntry = ({ slug, date }: BlogFactoryOptions): BlogEntry => ({
  id: slug,
  slug,
  body: '',
  collection: 'blog',
  data: {
    title: slug,
    description: slug,
    date: new Date(date),
    tags: [],
    isNotebook: false,
  },
});

const makeProjectEntry = ({ slug, date, featured = false }: ProjectFactoryOptions): ProjectEntry => ({
  id: slug,
  slug,
  body: '',
  collection: 'projects',
  data: {
    title: slug,
    description: slug,
    date: new Date(date),
    tags: [],
    featured,
  },
});

describe('selectRecentPosts', () => {
  it('filters out the about page, sorts by newest first, and limits', () => {
    const entries = [
      makeBlogEntry({ slug: 'about', date: '2023-01-01' }),
      makeBlogEntry({ slug: 'post-a', date: '2024-01-01' }),
      makeBlogEntry({ slug: 'post-b', date: '2024-05-01' }),
      makeBlogEntry({ slug: 'post-c', date: '2023-12-31' }),
    ];

    const result = selectRecentPosts(entries, 2);

    expect(result.map(entry => entry.slug)).toEqual(['post-b', 'post-a']);
  });

  it('handles identical timestamps by falling back to slug order', () => {
    const entries = [
      makeBlogEntry({ slug: 'z-post', date: '2024-02-01' }),
      makeBlogEntry({ slug: 'a-post', date: '2024-02-01' }),
      makeBlogEntry({ slug: 'm-post', date: '2024-01-01' }),
    ];

    const result = selectRecentPosts(entries);

    expect(result.map(entry => entry.slug).slice(0, 2)).toEqual(['a-post', 'z-post']);
  });

  it('returns all posts when total is below limit', () => {
    const entries = [
      makeBlogEntry({ slug: 'post-a', date: '2024-01-01' }),
      makeBlogEntry({ slug: 'post-b', date: '2024-01-02' }),
    ];

    const result = selectRecentPosts(entries, 5);

    expect(result).toHaveLength(2);
    expect(result.map(entry => entry.slug)).toEqual(['post-b', 'post-a']);
  });
});

describe('selectFeaturedProjects', () => {
  it('bubbles featured projects ahead of non-featured and sorts by recency', () => {
    const entries = [
      makeProjectEntry({ slug: 'non-recent', date: '2023-01-01', featured: false }),
      makeProjectEntry({ slug: 'featured-old', date: '2023-06-01', featured: true }),
      makeProjectEntry({ slug: 'featured-new', date: '2024-06-01', featured: true }),
      makeProjectEntry({ slug: 'non-new', date: '2024-05-01', featured: false }),
    ];

    const result = selectFeaturedProjects(entries, 3);

    expect(result.map(entry => entry.slug)).toEqual([
      'featured-new',
      'featured-old',
      'non-new',
    ]);
  });

  it('uses slug ordering when featured flags and dates are identical', () => {
    const entries = [
      makeProjectEntry({ slug: 'zeta', date: '2024-01-01', featured: true }),
      makeProjectEntry({ slug: 'alpha', date: '2024-01-01', featured: true }),
      makeProjectEntry({ slug: 'beta', date: '2024-01-01', featured: true }),
    ];

    const result = selectFeaturedProjects(entries);

    expect(result.map(entry => entry.slug)).toEqual(['alpha', 'beta', 'zeta']);
  });

  it('does not mutate the original array', () => {
    const entries = [
      makeProjectEntry({ slug: 'a', date: '2023-01-01' }),
      makeProjectEntry({ slug: 'b', date: '2024-01-01' }),
    ];

    const clone = [...entries];
    selectFeaturedProjects(entries);

    expect(entries).toEqual(clone);
  });
});
