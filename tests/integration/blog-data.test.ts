import { describe, it, expect } from 'vitest';
import {
  BLOG_FILE_OWNER,
  BLOG_FILE_PERMISSIONS,
  buildBlogStaticPaths,
  formatPostSize,
  sanitizeBlogEntries,
} from '../../src/utils/blog-data';
import type { BlogCollectionEntry } from '../../src/utils/blog-data';

type BlogOptions = {
  slug: string;
  bodyLength?: number;
};

const createBlogEntry = ({ slug, bodyLength = 500 }: BlogOptions): BlogCollectionEntry => ({
  id: slug,
  slug,
  body: 'x'.repeat(bodyLength),
  collection: 'blog',
  data: {
    title: slug,
    description: slug,
    date: new Date('2024-01-01'),
    tags: [],
    isNotebook: false,
  },
});

describe('formatPostSize', () => {
  it('returns a floor-division kilobyte string for string bodies', () => {
    expect(formatPostSize('x'.repeat(432))).toBe('4k');
  });

  it('accepts a numeric length and clamps invalid values to 0k', () => {
    expect(formatPostSize(0)).toBe('0k');
    expect(formatPostSize(-10)).toBe('0k');
    expect(formatPostSize(Number.NaN)).toBe('0k');
  });
});

describe('sanitizeBlogEntries', () => {
  it('removes the about entry but keeps others intact', () => {
    const entries = [
      createBlogEntry({ slug: 'about' }),
      createBlogEntry({ slug: 'post-one' }),
      createBlogEntry({ slug: 'post-two' }),
    ];

    const sanitized = sanitizeBlogEntries(entries);

    expect(sanitized.map(entry => entry.slug)).toEqual(['post-one', 'post-two']);
  });
});

describe('buildBlogStaticPaths', () => {
  it('returns params/props pairs for filtered entries', () => {
    const post = createBlogEntry({ slug: 'post-one' });
    const entries = [createBlogEntry({ slug: 'about' }), post];

    const paths = buildBlogStaticPaths(entries);

    expect(paths).toEqual([
      {
        params: { slug: 'post-one' },
        props: { entry: post },
      },
    ]);
  });

  it('deduplicates entries that share the same slug', () => {
    const first = createBlogEntry({ slug: 'post-one' });
    const duplicate = createBlogEntry({ slug: 'post-one', bodyLength: 800 });

    const paths = buildBlogStaticPaths([first, duplicate]);

    expect(paths).toHaveLength(1);
    expect(paths[0]?.props.entry).toBe(first);
  });
});

describe('metadata constants', () => {
  it('exports stable permissions and owner strings for the index view', () => {
    expect(BLOG_FILE_PERMISSIONS).toBe('-rw-r--r--');
    expect(BLOG_FILE_OWNER).toBe('guru');
  });
});
