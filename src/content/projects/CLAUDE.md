# Projects Content Directory

This directory contains project documentation for the **Professional Space** of the portfolio.

## File Structure

```
projects/
├── project-slug.md   # Individual project descriptions
└── CLAUDE.md         # This file
```

## Creating a New Project

### 1. Create the File
```bash
touch src/content/projects/my-project.md
```

### 2. Add Frontmatter
```yaml
---
title: "Project Name"
description: "Brief description of what this project does"
date: 2024-11-28
tags: ["astro", "typescript", "ai"]
image: "/projects/project-name.png"
link: "https://example.com"
repo: "https://github.com/user/repo"
featured: true
---

# Project Name

Detailed description of the project...

## Key Features

- Feature 1
- Feature 2

## Tech Stack

- Technology 1
- Technology 2
```

### 3. Frontmatter Schema (from src/content/config.ts)
- **title** (required): Project name
- **description** (required): Short description for project cards
- **date** (required): Project date (used for sorting)
- **tags** (required): Array of technology tags
- **image** (optional): Path to project screenshot/image (relative to `public/`)
- **link** (optional): Live demo/deployment URL
- **repo** (optional): GitHub repository URL
- **featured** (optional, default: false): Featured projects appear first

## Featured on Homepage

The homepage (`/`) displays up to **5 projects**:
- **Featured projects** (`featured: true`) appear first
- Then sorted by date descending
- Featured projects show a `★` indicator

## Project Images

Place project images in `public/projects/`:
```
public/
└── projects/
    ├── project-1.png
    ├── project-2.png
    └── ...
```

Reference them in frontmatter:
```yaml
image: "/projects/project-1.png"
```

## Full Projects Index

All projects appear at `/projects` in a grid layout with:
- Project image with overlay
- Title and description
- Technology tags
- Hover effects with "ViewSource" overlay

## Design Notes

- Uses `BlogLayout.astro` for dark terminal aesthetic
- Grid layout with image cards
- Terminal-green accents and cyan highlights
- Tag badges with technology names
