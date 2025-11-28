# Blog Content Directory

This directory contains blog posts for the **Professional Space** of the portfolio.

## File Structure

```
blog/
├── about.md          # Special: About page (not listed in blog index)
├── post-slug.md      # Individual blog posts
└── CLAUDE.md         # This file
```

## Creating a New Blog Post

### 1. Create the File
```bash
touch src/content/blog/my-new-post.md
```

### 2. Add Frontmatter
```yaml
---
title: "Your Post Title"
description: "A concise description for SEO and post previews"
date: 2024-11-28
tags: ["ai", "llm", "engineering"]
isNotebook: false
---

# Your content starts here...
```

### 3. Frontmatter Schema (from src/content/config.ts)
- **title** (required): Post title
- **description** (required): Short description for previews
- **date** (required): Publication date
- **tags** (required): Array of tags for categorization
- **isNotebook** (optional, default: false): Set to `true` for Jupyter notebook imports

## Jupyter Notebooks

For importing Jupyter notebooks as blog posts:

1. Export notebook to Markdown
2. Place in this directory with `.md` extension
3. Set `isNotebook: true` in frontmatter
4. Save notebook images to `public/images/blog/{post-slug}/`
5. Update image paths in markdown

The `BlogLayout` applies special styling for notebook code cells and outputs.

## Featured on Homepage

The homepage (`/`) displays the **5 most recent** blog posts (excluding `about.md`), sorted by date descending.

## Full Blog Index

All posts appear at `/blog` with the terminal-style listing.

## Design Notes

- Uses `BlogLayout.astro` for dark terminal aesthetic
- Terminal-green headings with glow effects
- Monospace fonts (Fira Code, JetBrains Mono)
- Comment-style descriptions with `//` prefix
