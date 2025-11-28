import { defineCollection, z } from 'astro:content';

const albums = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    coverPhoto: z.string(),
    date: z.date(),
    featured: z.boolean().default(false),
    order: z.number().default(0),
  }),
});

const photos = defineCollection({
  type: 'content',
  schema: z.object({
    // Manual fields (edit in frontmatter before committing)
    /** Photo title - edit before committing */
    title: z.string(),
    /** Album slug - must match album folder name */
    album: z.string(),
    /** Path to photo relative to public/photos/ */
    filename: z.string(),
    /** Searchable tags - refine IPTC keywords before committing */
    tags: z.array(z.string()),
    /** Mark true to show on featured photos page */
    featured: z.boolean().default(false),
    /** Location description (from GPS or manual) */
    location: z.string().optional(),

    // Technical fields (auto-filled from EXIF when using getPhotosWithExif(), frontmatter overrides)
    /** Photo date - extracted from EXIF DateTimeOriginal if not in frontmatter */
    date: z.date(),
    /** Camera model - extracted from EXIF Make + Model if not in frontmatter */
    camera: z.string().optional(),
    /** Camera settings - extracted from EXIF (aperture, shutter, ISO) if not in frontmatter */
    settings: z.string().optional(),
    /** Focal length in millimeters - extracted from EXIF if not in frontmatter */
    focalLength: z.number().optional(),
  }),
});

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    tags: z.array(z.string()),
    isNotebook: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    tags: z.array(z.string()),
    image: z.string().optional(),
    link: z.string().url().optional(),
    repo: z.string().url().optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { albums, photos, blog, projects };
