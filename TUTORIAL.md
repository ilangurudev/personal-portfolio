# Personal Portfolio Tutorial

**A comprehensive guide for Python developers entering the JavaScript ecosystem**

---

## Table of Contents

1. [Introduction & Big Picture](#1-introduction--big-picture)
2. [JavaScript/TypeScript Ecosystem Primer](#2-javascripttypescript-ecosystem-primer)
3. [Astro Framework Overview](#3-astro-framework-overview)
4. [Project Structure](#4-project-structure)
5. [Content Collections Deep Dive](#5-content-collections-deep-dive)
6. [The Dual Aesthetic System](#6-the-dual-aesthetic-system)
7. [React Islands & Interactivity](#7-react-islands--interactivity)
8. [Photo Filtering System](#8-photo-filtering-system)
9. [Infinite Scroll Implementation](#9-infinite-scroll-implementation)
10. [Image Handling & CDN](#10-image-handling--cdn)
11. [Development Workflow](#11-development-workflow)
12. [Key Patterns & Best Practices](#12-key-patterns--best-practices)

---

## 1. Introduction & Big Picture

### What This Site Is

This is a **dual-space portfolio** that showcases two completely different identities:

1. **Professional Space** (`/`, `/blog`, `/projects`): Dark terminal aesthetic with green text (think "hacker" vibes)
2. **Photography Space** (`/photography/*`): Bright editorial aesthetic with serif fonts (think magazine layout)

The key philosophy: **complete separation**. No mixing of styles, no shared components that blend aesthetics. Each space has its own design system.

### Why These Technologies?

Coming from Python, you might wonder why not use Django or Flask. Here's the reasoning:

- **Static Site Generation (SSG)**: This site is mostly content (blog posts, photos). SSG means we build HTML once at compile time, not on every request. Think of it like "pre-rendering" everything. Fast, cheap hosting (no server needed), great SEO.

- **Astro**: A modern framework designed specifically for content-heavy sites. It's like Jekyll or Hugo (if you've used those), but with better developer experience and the ability to use JavaScript UI components where needed.

- **React Islands**: Most of the site is static HTML. React only "hydrates" (becomes interactive) for specific components that need interactivity—like the photo filter or infinite scroll. This is called **Islands Architecture**.

- **TypeScript**: JavaScript with type annotations. Think of it as adding type hints to JavaScript, similar to Python's type hints but enforced at compile time.

---

## 2. JavaScript/TypeScript Ecosystem Primer

Let's map JavaScript concepts to Python equivalents you already know.

### npm vs pip

**npm** (Node Package Manager) is like **pip**, but for JavaScript.

| Python | JavaScript |
|--------|-----------|
| `pip install requests` | `npm install axios` |
| `requirements.txt` | `package.json` |
| `pip freeze > requirements.txt` | `npm install` (reads package.json) |
| Virtual environments (`venv`) | `node_modules` folder |

**Key file: `package.json`**

```json
{
  "name": "bustling-binary",
  "scripts": {
    "dev": "astro dev",        // Like "python manage.py runserver"
    "build": "astro build"      // Compile site to static HTML
  },
  "dependencies": {
    "astro": "^5.16.2",         // Like "Django==4.0"
    "react": "^18.3.1"
  }
}
```

The `^` symbol means "compatible versions" (similar to `>=` in Python).

**node_modules**: Think of this as your virtual environment. When you run `npm install`, all packages are downloaded here. It's usually **huge** (can be 100k+ files), which is why it's in `.gitignore`.

### Modern JavaScript Syntax (Quick Overview)

If your JavaScript knowledge is outdated, here are the key modern features:

```javascript
// 1. const/let (NOT var)
const name = "Guru";        // Like Python: name = "Guru" (immutable)
let age = 25;               // Like Python: age = 25 (mutable)

// 2. Arrow functions (like Python lambdas, but more powerful)
const add = (a, b) => a + b;
// Python equivalent: add = lambda a, b: a + b

// 3. Template literals (like Python f-strings)
const greeting = `Hello, ${name}!`;
// Python: greeting = f"Hello, {name}!"

// 4. Destructuring (like Python unpacking)
const { title, date } = post.data;
// Python: title, date = post.data['title'], post.data['date']

// 5. Spread operator
const newArray = [...oldArray, newItem];
// Python: new_list = [*old_list, new_item]

// 6. Async/await (Python has this too!)
const data = await fetch('/api/photos');
// Same as Python: data = await fetch('/api/photos')

// 7. Modules (like Python imports)
import { getPhotos } from './utils';
// Python: from utils import get_photos

export const helper = () => { };
// Python: def helper(): pass
```

### TypeScript Basics

TypeScript adds **type annotations** to JavaScript. If you've used Python type hints, this will feel familiar.

```typescript
// Python type hints:
// def greet(name: str, age: int) -> str:
//     return f"Hello {name}, age {age}"

// TypeScript equivalent:
function greet(name: string, age: number): string {
  return `Hello ${name}, age ${age}`;
}

// Interface (like Python's TypedDict or Pydantic model)
interface Photo {
  id: string;
  data: {
    title: string;
    date: Date;
    tags?: string[];  // ? means optional (like Python's Optional[list[str]])
  };
}

// Type alias (like Python's type NewType)
type TagLogic = 'and' | 'or';  // Union type (only these two values allowed)
```

**Key differences from Python**:
- Types are checked at **compile time** only (not runtime)
- Use `:` to annotate, not spaces
- Interfaces define object shapes (like Pydantic models)

---

## 3. Astro Framework Overview

### What is Astro?

Think of Astro as a **static site generator** (SSG) like Jekyll or Hugo, but modern and JavaScript-based.

**Key Concept**: Astro is designed for **content-heavy sites** (blogs, documentation, portfolios). It's NOT for building web apps like Gmail or Twitter.

### Static Site Generation (SSG) vs. Server-Side Rendering (SSR) vs. Client-Side Rendering (CSR)

Let's break this down with a Python web app analogy:

| Pattern | When HTML is Generated | Example |
|---------|----------------------|---------|
| **SSG** (Static) | At build time, once | Running `python manage.py build` and deploying static HTML files |
| **SSR** (Server-Side) | On every request | Django/Flask rendering templates on each HTTP request |
| **CSR** (Client-Side) | In the browser, via JavaScript | Single Page App (React/Vue) where browser downloads JS and builds page |

**This site uses SSG**. When you run `npm run build`, Astro:
1. Reads all Markdown files (blog posts, photos, etc.)
2. Runs all page templates
3. Outputs pure HTML files
4. Deploys to Netlify (a CDN that serves these static files)

**Benefits**:
- **Fast**: No server processing, just serving HTML
- **Cheap**: No backend servers needed (just a CDN)
- **SEO**: Search engines see complete HTML immediately

### Islands Architecture

Here's the brilliant part: Most of this site is **static HTML**. But some parts need JavaScript interactivity (photo filter, lightbox, infinite scroll).

**Traditional approach** (React SPA): Send JavaScript for the ENTIRE site, even static parts.

**Islands approach**: Only "hydrate" (make interactive) specific components.

```astro
<!-- This is STATIC (no JavaScript sent to browser) -->
<h1>Welcome to my portfolio</h1>
<p>This text is plain HTML</p>

<!-- This is an ISLAND (React component with interactivity) -->
<FilteredPhotoGallery client:load allPhotos={photos} />
```

The `client:load` directive tells Astro: "This component needs JavaScript. Send it to the browser."

**Python analogy**: Imagine if your Django templates could mix static HTML with "Python widgets" that run in the browser. Islands are like that.

### File-Based Routing

Astro uses **file-based routing** (like Next.js). The file structure directly maps to URLs.

```
src/pages/
├── index.astro              → /
├── blog.astro               → /blog
├── photography/
│   ├── index.astro          → /photography
│   ├── photos.astro         → /photography/photos
│   └── album/
│       └── [slug].astro     → /photography/album/:slug (dynamic)
```

**Dynamic routes**: `[slug].astro` is like Django's `path('<slug:slug>', ...)`. The brackets indicate a parameter.

### The Build Process

When you run `npm run build`:

1. **Astro reads all `.astro` files** in `src/pages/`
2. **Fetches data** from Content Collections (more on this later)
3. **Executes the code fence** (the `---` section at top of `.astro` files)
4. **Renders HTML** using the template
5. **Bundles JavaScript** for any React islands
6. **Optimizes images**
7. **Outputs to `dist/`** folder (ready to deploy)

**Python analogy**: Think of it like running a Django management command that pre-renders all possible pages and saves them as static HTML.

---

## 4. Project Structure

Let's walk through the directory structure top-down.

```
personal-portfolio/
├── src/                          # Source code (like Python's app/ folder)
│   ├── pages/                    # Routes (maps to URLs)
│   ├── layouts/                  # Templates (like Django's base.html)
│   ├── components/               # Reusable UI pieces
│   ├── content/                  # Markdown files (blog posts, photos)
│   ├── utils/                    # Helper functions
│   └── styles/                   # Global CSS
├── public/                       # Static assets (served as-is)
│   ├── photos/                   # Photo files
│   └── favicon.svg
├── scripts/                      # Build scripts (we're skipping this)
├── astro.config.mjs             # Astro configuration
├── package.json                  # Dependencies (like requirements.txt)
├── tsconfig.json                 # TypeScript configuration
└── node_modules/                 # Installed packages (like venv)
```

### Key Directories

**`src/pages/`**: This is your **router**. Each `.astro` file becomes a route.

**`src/layouts/`**: These are **base templates** (like Django's `base.html`). They wrap page content.

**`src/components/`**: Reusable UI components. Two types:
- **`.astro` components**: Static, server-rendered
- **`.tsx` components**: React components (can be interactive)

**`src/content/`**: This is where **all content lives** (blog posts, photos, albums). Astro has a special "Content Collections" API for this (covered next).

**`public/`**: Files here are served **as-is**. `public/photo.jpg` → `yoursite.com/photo.jpg`

---

## 5. Content Collections Deep Dive

This is one of Astro's killer features. Let's understand it step-by-step.

### The Problem (Without Content Collections)

Imagine you have 100 blog posts as Markdown files. In a traditional setup:
- You'd manually read files, parse frontmatter, validate data
- No type safety (what if a post is missing `date`?)
- Hard to query (e.g., "get all posts tagged 'AI'")

### The Solution: Content Collections

**Content Collections** are like **Pydantic models for your Markdown files**. You define a schema (with validation), and Astro handles the rest.

#### Step 1: Define Your Schema

File: `src/content/config.ts`

```typescript
import { defineCollection, z } from 'astro:content';

// z is Zod (validation library, like Pydantic)
const blog = defineCollection({
  type: 'content',  // Markdown files
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    tags: z.array(z.string()),
    isNotebook: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

**Python equivalent** (using Pydantic):

```python
from pydantic import BaseModel
from datetime import datetime

class BlogPost(BaseModel):
    title: str
    description: str
    date: datetime
    tags: list[str]
    isNotebook: bool = False
```

#### Step 2: Create Content

File: `src/content/blog/my-first-post.md`

```markdown
---
title: "My First Post"
description: "Learning Astro"
date: 2025-01-15
tags: ["astro", "learning"]
---

This is the post content (Markdown body).
```

The `---` fences are **frontmatter** (metadata). This is a common pattern in static site generators.

#### Step 3: Query Your Content

File: `src/pages/blog.astro`

```astro
---
import { getCollection } from 'astro:content';

// Get all blog posts (returns typed array!)
const posts = await getCollection('blog');

// Sort by date (newest first)
const sortedPosts = posts.sort((a, b) =>
  b.data.date.valueOf() - a.data.date.valueOf()
);
---

<h1>Blog Posts</h1>
{sortedPosts.map(post => (
  <article>
    <h2>{post.data.title}</h2>
    <time>{post.data.date.toLocaleDateString()}</time>
    <p>{post.data.description}</p>
    <a href={`/blog/${post.slug}`}>Read more</a>
  </article>
))}
```

**Key points**:
- `getCollection('blog')` returns an array of post objects
- Each post has:
  - `data`: The frontmatter (typed according to your schema)
  - `slug`: Filename without extension (e.g., `my-first-post`)
  - `body`: The Markdown content
- **Type safety**: If you try to access `post.data.invalidField`, TypeScript will error

**Python analogy**:

```python
# Python equivalent (pseudo-code)
posts = BlogPost.from_markdown_files('content/blog/')
sorted_posts = sorted(posts, key=lambda p: p.date, reverse=True)
```

### How This Site Uses Content Collections

We have **4 collections**:

1. **`albums`**: Photo albums (e.g., "Japan 2023")
   - Schema: `title`, `description`, `coverPhoto`, `date`, `featured`, `order`

2. **`photos`**: Individual photos
   - Schema: `title`, `album`, `filename`, `tags`, `date`, `camera`, `settings`, etc.
   - **EXIF data** (camera settings) is auto-extracted and merged with frontmatter

3. **`blog`**: Blog posts
   - Schema: `title`, `description`, `date`, `tags`, `isNotebook`

4. **`projects`**: Portfolio projects
   - Schema: `title`, `description`, `date`, `tags`, `image`, `link`, `repo`, `featured`

**Example**: Querying featured photos

```typescript
const allPhotos = await getCollection('photos');
const featuredPhotos = allPhotos.filter(p => p.data.featured === true);
```

### Slugs Explained

A **slug** is a URL-friendly identifier derived from the filename.

```
File: src/content/blog/my-first-post.md
Slug: "my-first-post"
URL:  /blog/my-first-post
```

For dynamic routes (`[slug].astro`), you use `getStaticPaths()`:

```astro
---
// src/pages/blog/[slug].astro
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
---

<h1>{post.data.title}</h1>
<article>{post.body}</article>
```

**Python analogy**: This is like Django's `get_object_or_404(Post, slug=slug)`, but at build time.

---

## 6. The Dual Aesthetic System

This site has **two completely separate design systems**. Let's see how that's implemented.

### Design System Overview

| Space | Colors | Fonts | Aesthetic |
|-------|--------|-------|-----------|
| **Professional** (`/`) | Dark: `slate-950`, Green: `terminal-green`, Cyan: `terminal-cyan` | `JetBrains Mono` (monospace) | Terminal/hacker |
| **Photography** (`/photography`) | Light: `cream`, Charcoal: `#1C1917`, Amber: `#D97706` | `Crimson Text` (serif), `Work Sans` (sans) | Editorial/magazine |

### How Separation is Achieved

#### 1. Separate Layouts

Each space has its own layout component:

**Professional**: `src/layouts/BlogLayout.astro`

```astro
---
// Import terminal font
<link href=".../JetBrains+Mono:wght@300;400;500;700" rel="stylesheet">
---
<body class="blog-space">
  <div class="scanlines"></div>  <!-- Terminal effect -->
  <header class="blog-header">
    <nav>
      <a href="/">home</a>
      <a href="/blog">blog</a>
      <a href="/projects">projects</a>
      <div class="space-toggle">
        <span class="toggle-active">Professional</span>
        <a href="/photography">Personal</a>
      </div>
    </nav>
  </header>
  <main><slot /></main>
</body>

<style>
  body.blog-space {
    background: var(--slate-950);  /* Dark background */
    color: var(--terminal-green);  /* Green text */
    font-family: 'JetBrains Mono', monospace;
  }

  /* Scanlines effect (like old CRT monitor) */
  .scanlines {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.15),
      rgba(0, 0, 0, 0.15) 1px,
      transparent 1px,
      transparent 2px
    );
    pointer-events: none;
    opacity: 0.4;
  }
</style>
```

**Photography**: `src/layouts/PhotoLayout.astro`

```astro
---
<link href=".../Crimson+Text:ital,wght@0,400;0,600;0,700" rel="stylesheet">
---
<body class="gallery-space">
  <header class="photo-header">
    <!-- Completely different header design -->
  </header>
  <main><slot /></main>
</body>

<style>
  body.gallery-space {
    background: var(--cream);      /* Light background */
    color: var(--charcoal);        /* Dark text */
    font-family: 'Work Sans', sans-serif;
  }
</style>
```

**Key insight**: By using different `<body>` classes (`blog-space` vs `gallery-space`), all CSS is scoped to each space.

#### 2. CSS Custom Properties (Variables)

CSS custom properties (like CSS variables) define the color palette:

```css
/* Professional space */
:root {
  --slate-950: #020617;
  --terminal-green: #22c55e;
  --terminal-cyan: #06b6d4;
}

/* Photography space */
:root {
  --cream: #FFFBF5;
  --charcoal: #1C1917;
  --amber: #D97706;
}
```

**Python analogy**: Think of these as constants:

```python
# Professional theme
SLATE_950 = "#020617"
TERMINAL_GREEN = "#22c55e"

# Photography theme
CREAM = "#FFFBF5"
CHARCOAL = "#1C1917"
```

#### 3. Tailwind CSS

This site uses **Tailwind CSS**, a "utility-first" CSS framework.

**Traditional CSS** (semantic classes):
```html
<button class="primary-button">Click me</button>

<style>
.primary-button {
  background: blue;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
}
</style>
```

**Tailwind** (utility classes):
```html
<button class="bg-blue-500 text-white px-4 py-2 rounded">
  Click me
</button>
```

Each class does **one thing**: `bg-blue-500` = blue background, `px-4` = horizontal padding, etc.

**Why Tailwind?**
- **Fast**: No need to name classes or context-switch to CSS file
- **Consistent**: Uses a design system (spacing scale, color palette)
- **Small bundle**: Unused classes are removed at build time

**Python analogy**: Tailwind is like using a utility library instead of writing custom functions. Instead of writing `def format_name(name)`, you use existing helpers.

---

## 7. React Islands & Interactivity

Most of this site is **static HTML**. But some parts need interactivity. That's where React comes in.

### What is React?

**React** is a JavaScript library for building **user interfaces**. It's component-based (like Astro), but designed for **interactive UIs**.

**Key concepts**:
1. **Components**: Reusable UI pieces (like Python functions that return HTML)
2. **State**: Data that can change over time (triggers re-renders)
3. **Props**: Data passed from parent to child (like function arguments)
4. **Hooks**: Functions that let you use state and other features

### JSX (JavaScript XML)

React uses **JSX**, which looks like HTML inside JavaScript:

```jsx
// This is JSX (looks like HTML, but it's JavaScript)
const greeting = <h1>Hello, {name}!</h1>;

// Gets compiled to:
const greeting = React.createElement('h1', null, 'Hello, ', name, '!');
```

**Python analogy**: Imagine if you could write HTML directly in Python strings with f-string syntax:

```python
# Pseudo-code (this doesn't exist in Python)
greeting = <h1>Hello, {name}!</h1>
```

### React Components

A React component is a function that returns JSX:

```tsx
// TypeScript + React = .tsx file
interface GreetingProps {
  name: string;
  age: number;
}

const Greeting: React.FC<GreetingProps> = ({ name, age }) => {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      <p>You are {age} years old.</p>
    </div>
  );
};

// Usage:
<Greeting name="Guru" age={25} />
```

**Python analogy**:

```python
from dataclasses import dataclass
from typing import Protocol

@dataclass
class GreetingProps:
    name: str
    age: int

def Greeting(props: GreetingProps) -> str:
    return f"""
    <div>
      <h1>Hello, {props.name}!</h1>
      <p>You are {props.age} years old.</p>
    </div>
    """
```

### React Hooks

**Hooks** are special functions that let you use React features. They all start with `use`.

#### `useState` - Managing State

```tsx
import { useState } from 'react';

const Counter = () => {
  // Declare state variable
  const [count, setCount] = useState(0);

  // count = current value
  // setCount = function to update it
  // 0 = initial value

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
};
```

**Python analogy** (pseudo-code):

```python
class Counter:
    def __init__(self):
        self.count = 0

    def increment(self):
        self.count += 1
        self.re_render()  # React does this automatically!
```

**Key insight**: When you call `setCount()`, React **re-renders** the component with the new value.

#### `useEffect` - Side Effects

```tsx
import { useEffect } from 'react';

const DataFetcher = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    // This runs AFTER the component renders
    fetch('/api/data')
      .then(res => res.json())
      .then(json => setData(json));
  }, []);  // Empty array = run once on mount

  return <div>{data ? data.message : 'Loading...'}</div>;
};
```

**Dependency array** (second argument):
- `[]` - Run once when component mounts
- `[count]` - Run when `count` changes
- No array - Run on every render (usually a mistake!)

**Python analogy**: Like Django's `__init__()` or React's lifecycle methods. It's for setup/teardown.

#### `useMemo` - Memoization

```tsx
import { useMemo } from 'react';

const ExpensiveComponent = ({ items }) => {
  // Only re-compute when 'items' changes
  const sortedItems = useMemo(() => {
    return items.sort((a, b) => a.date - b.date);
  }, [items]);

  return <div>{sortedItems.map(...)}</div>;
};
```

**Python analogy**: Like Python's `@lru_cache` decorator—avoid re-computing expensive operations.

#### `useRef` - Persistent References

```tsx
import { useRef } from 'react';

const ScrollComponent = () => {
  const elementRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    elementRef.current?.scrollTo(0, 0);
  };

  return <div ref={elementRef}>Content...</div>;
};
```

`useRef` creates a **mutable object** that persists across renders (doesn't trigger re-render when changed).

### How Astro Uses React (Client Directives)

In Astro, React components are **static by default**. To make them interactive, use a **client directive**:

```astro
---
import FilteredPhotoGallery from '../components/react/FilteredPhotoGallery.tsx';
---

<!-- Static (no JavaScript sent) -->
<FilteredPhotoGallery allPhotos={photos} />

<!-- Interactive (JavaScript sent to browser) -->
<FilteredPhotoGallery client:load allPhotos={photos} />
```

**Client directives**:
- `client:load` - Load JavaScript immediately
- `client:idle` - Load when browser is idle
- `client:visible` - Load when component is visible
- `client:only` - Only render in browser (not at build time)

**This site uses `client:load`** for interactive components (photo gallery, filters).

---

## 8. Photo Filtering System

Let's walk through how the tag filtering works. This is a great example of React state management.

### Architecture Overview

The filtering system has 3 parts:

1. **Tag buttons** (vanilla JavaScript) - User clicks tags
2. **FilteredPhotoGallery** (React) - Filters photos based on tags
3. **Lightbox** (vanilla JS) - Updates when filter changes

They communicate via **custom events** (browser's EventTarget API).

### Part 1: Tag Selection (Vanilla JS)

File: `src/pages/photography/photos.astro`

```javascript
<script>
  const tagButtons = document.querySelectorAll('.tag-button');
  const activeTags = new Set();  // Like Python's set()

  tagButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tag = button.dataset.tag;

      // Toggle tag
      if (activeTags.has(tag)) {
        activeTags.delete(tag);
        button.classList.remove('active');
      } else {
        activeTags.add(tag);
        button.classList.add('active');
      }

      // Notify React component
      window.dispatchEvent(new CustomEvent('tagFilterChange', {
        detail: {
          activeTags: Array.from(activeTags),
          tagLogic: 'or'  // or 'and'
        }
      }));
    });
  });
</script>
```

**Python analogy**:

```python
active_tags = set()

def on_tag_click(tag: str):
    if tag in active_tags:
        active_tags.remove(tag)
    else:
        active_tags.add(tag)

    notify_react({'active_tags': list(active_tags)})
```

### Part 2: Filtering Logic (React)

File: `src/components/react/FilteredPhotoGallery.tsx`

```tsx
import { useState, useEffect, useMemo } from 'react';

export const FilteredPhotoGallery = ({ allPhotos }) => {
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [tagLogic, setTagLogic] = useState<'and' | 'or'>('or');

  // Listen for tag changes from vanilla JS
  useEffect(() => {
    const handleTagChange = (event: CustomEvent) => {
      setActiveTags(new Set(event.detail.activeTags));
      setTagLogic(event.detail.tagLogic);
    };

    window.addEventListener('tagFilterChange', handleTagChange);
    return () => window.removeEventListener('tagFilterChange', handleTagChange);
  }, []);

  // Filter photos (memoized for performance)
  const filteredPhotos = useMemo(() => {
    if (activeTags.size === 0) return allPhotos;

    return allPhotos.filter(photo => {
      const photoTags = photo.data.tags || [];

      if (tagLogic === 'and') {
        // ALL selected tags must be present
        return Array.from(activeTags).every(tag =>
          photoTags.includes(tag)
        );
      } else {
        // ANY selected tag must be present
        return Array.from(activeTags).some(tag =>
          photoTags.includes(tag)
        );
      }
    });
  }, [allPhotos, activeTags, tagLogic]);

  return <InfinitePhotoGallery photos={filteredPhotos} />;
};
```

**Python analogy**:

```python
def filter_photos(all_photos, active_tags, tag_logic):
    if not active_tags:
        return all_photos

    def matches(photo):
        photo_tags = photo.tags or []
        if tag_logic == 'and':
            return all(tag in photo_tags for tag in active_tags)
        else:
            return any(tag in photo_tags for tag in active_tags)

    return [p for p in all_photos if matches(p)]
```

### Key Patterns

1. **Set for active tags**: Fast lookup, prevents duplicates
2. **`useMemo` for filtering**: Only re-filter when tags/logic change (not on every render)
3. **Custom events for communication**: Decouples vanilla JS from React
4. **Normalization**: Tags are lowercased for case-insensitive comparison

---

## 9. Infinite Scroll Implementation

The photo gallery loads photos **progressively** (20 at a time) as you scroll. This improves performance.

### How It Works

File: `src/components/react/InfinitePhotoGallery.tsx`

```tsx
import { useState, useEffect, useRef } from 'react';

const INITIAL_LOAD = 20;
const LOAD_MORE = 20;

export const InfinitePhotoGallery = ({ photos }) => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Intersection Observer (browser API for scroll detection)
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // When sentinel becomes visible, load more
        if (entries[0].isIntersecting && visibleCount < photos.length) {
          setVisibleCount(prev => Math.min(prev + LOAD_MORE, photos.length));
        }
      },
      { rootMargin: '200px' }  // Start loading 200px before sentinel is visible
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [visibleCount, photos.length]);

  const visiblePhotos = photos.slice(0, visibleCount);

  return (
    <div>
      {visiblePhotos.map(photo => (
        <PhotoCard key={photo.id} photo={photo} />
      ))}

      {/* Sentinel element (triggers loading when visible) */}
      {visibleCount < photos.length && (
        <div ref={sentinelRef}>Loading more...</div>
      )}
    </div>
  );
};
```

### Intersection Observer API

**Intersection Observer** is a browser API that detects when an element becomes visible in the viewport.

**Python analogy**: Imagine you have a generator that yields items when needed:

```python
def infinite_photos(photos, batch_size=20):
    for i in range(0, len(photos), batch_size):
        yield photos[i:i + batch_size]
        # Wait for user to scroll...
```

### Grid Layout

The gallery uses **CSS Grid** for responsive columns:

```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: `repeat(${columnCount}, 1fr)`,  // 1-3 columns
  gap: '32px'
}}>
  {visiblePhotos.map(...)}
</div>
```

`columnCount` is calculated based on viewport width:

```tsx
const updateColumns = () => {
  const width = containerRef.current.offsetWidth;
  const cols = Math.floor(width / MIN_COLUMN_WIDTH);
  setColumnCount(Math.min(3, Math.max(1, cols)));
};
```

**Responsive behavior**:
- Desktop: 3 columns
- Tablet: 2 columns
- Mobile: 1 column

---

## 10. Image Handling & CDN

This site stores photos on **Cloudflare R2** (S3-compatible storage) with on-the-fly image resizing.

### CDN Setup

Photos are NOT in the `public/` folder. They're on a CDN at:

```
https://photos.guru.dev/photos/{filename}
```

**Why?**
- **Performance**: CDN is globally distributed (fast loading worldwide)
- **Cost**: Cheaper than storing in Git or deploying with Netlify
- **Resizing**: Cloudflare can resize images on-the-fly

### Image URLs

File: `src/utils/url-helper.ts`

```typescript
const CDN_URL = import.meta.env.PUBLIC_PHOTO_CDN_URL;

export function getPhotoUrl(filename: string): string {
  return `${CDN_URL}/photos/${filename}`;
}

export function getResizedPhotoUrl(filename: string, width: number): string {
  // Cloudflare Image Resizing syntax
  return `${CDN_URL}/cdn-cgi/image/width=${width},quality=85,format=auto/photos/${filename}`;
}
```

**Usage**:

```astro
<!-- Original (large) -->
<img src={getPhotoUrl('sunset.jpg')} />

<!-- Resized (400px wide) -->
<img src={getResizedPhotoUrl('sunset.jpg', 400)} />
```

**Cloudflare automatically**:
- Resizes image to 400px width
- Optimizes quality (85%)
- Converts to best format (WebP for modern browsers, JPEG for old ones)

**Python analogy**: Like using Pillow (PIL) to resize images, but handled by the CDN:

```python
# Python equivalent (but on CDN)
from PIL import Image
img = Image.open('sunset.jpg')
img.thumbnail((400, 400))
img.save('sunset-400.jpg', quality=85)
```

### EXIF Data Extraction

Photos contain **EXIF metadata** (camera settings). We extract this and merge it with frontmatter.

File: `src/utils/photo-helpers.ts`

```typescript
import exifr from 'exifr';  // Library for reading EXIF

export async function getPhotosWithExif() {
  const photos = await getCollection('photos');

  return Promise.all(photos.map(async (photo) => {
    // Skip if frontmatter already has EXIF data
    if (photo.data.camera) return photo;

    // Read EXIF from file
    const filePath = `/public/photos/${photo.data.filename}`;
    const exif = await exifr.parse(filePath);

    // Merge EXIF into photo.data
    return {
      ...photo,
      data: {
        ...photo.data,
        camera: `${exif.Make} ${exif.Model}`,
        settings: `f/${exif.FNumber} • ${exif.ExposureTime}s • ISO${exif.ISO}`,
        focalLength: exif.FocalLength,
      }
    };
  }));
}
```

**Python analogy** (using PIL):

```python
from PIL import Image
from PIL.ExifTags import TAGS

def get_exif(image_path):
    img = Image.open(image_path)
    exif = img._getexif()
    return {TAGS[k]: v for k, v in exif.items() if k in TAGS}
```

---

## 11. Development Workflow

Let's walk through a typical development session.

### Starting the Dev Server

```bash
npm run dev
```

This runs `astro dev`, which:
1. Starts a local server at `http://localhost:4321`
2. Watches for file changes (auto-reloads browser)
3. Enables Hot Module Replacement (HMR)—changes appear instantly

**Python analogy**: Like `python manage.py runserver` or `flask run --debug`

### Making Changes

**Example**: Edit a blog post

1. Open `src/content/blog/my-post.md`
2. Change the title:
   ```diff
   ---
   - title: "Old Title"
   + title: "New Title"
   ---
   ```
3. Save → Browser auto-refreshes with new title

**Example**: Edit a React component

1. Open `src/components/react/PhotoGallery.tsx`
2. Change something:
   ```diff
   - <div className="photo-card">
   + <div className="photo-card enhanced">
   ```
3. Save → React "hot reloads" the component (keeps state!)

### Building for Production

```bash
npm run build
```

This:
1. Runs Astro's build process
2. Outputs static files to `dist/`
3. Optimizes JavaScript, CSS, images
4. Removes unused CSS (tree-shaking)

**Output**:
```
dist/
├── index.html
├── blog/
│   ├── post-1/index.html
│   └── post-2/index.html
├── photography/
│   └── index.html
└── _astro/
    ├── PhotoGallery.abc123.js
    └── styles.def456.css
```

### Deploying to Netlify

This site is deployed to **Netlify** (static hosting platform).

1. Push code to GitHub
2. Netlify automatically:
   - Runs `npm run build`
   - Deploys `dist/` to CDN
   - Sets up custom domain

**Python analogy**: Like deploying Django static files to S3 + CloudFront.

---

## 12. Key Patterns & Best Practices

Let's consolidate what we've learned into reusable patterns.

### Server vs. Client Code

**Server code** (runs at build time):
- `.astro` files (code fence `---`)
- Fetching from Content Collections
- Image optimization
- Generating static HTML

**Client code** (runs in browser):
- React components (with `client:*` directive)
- Event listeners (`addEventListener`)
- `<script>` tags in `.astro` files
- Interactive features (filters, lightbox, etc.)

**Rule**: Use server code by default. Only use client code when you need interactivity.

### Type Safety

This project uses **TypeScript everywhere**. Benefits:

1. **Catch errors early**: `property 'titl' does not exist` (typo caught at compile time)
2. **Auto-completion**: Editor suggests available fields
3. **Refactoring**: Rename a field, and TypeScript finds all usages

**Example**: Photo interface

```typescript
interface Photo {
  id: string;
  data: {
    title: string;
    tags?: string[];  // Optional
  };
}

// TypeScript error: 'titl' doesn't exist
const title = photo.data.titl;  // ❌

// Auto-completion suggests 'title'
const title = photo.data.title;  // ✅
```

### Component Composition

Break UI into **small, reusable components**:

```
PhotoLayout (layout)
├── PhotoHeader (navigation)
├── FilteredPhotoGallery (React island)
│   └── InfinitePhotoGallery (React)
│       └── PhotoCard (static)
└── PhotoLightbox (vanilla JS)
```

**Benefits**:
- **Reusability**: Use `PhotoCard` in multiple galleries
- **Maintainability**: Change header without touching gallery
- **Performance**: Only PhotoGallery needs JavaScript

### Performance Optimizations

1. **Lazy loading images**: `loading="lazy"` attribute
   ```html
   <img src="photo.jpg" loading="lazy" />
   ```

2. **Infinite scroll**: Only render visible photos

3. **Memoization**: Cache expensive computations with `useMemo`

4. **CDN**: Serve images from Cloudflare (globally distributed)

5. **Image resizing**: Load appropriate sizes (400px for thumbnails, not 4000px originals)

6. **Islands architecture**: Ship minimal JavaScript

### Content-Driven Architecture

**All content is in Markdown** with frontmatter. This means:

- **No hardcoded data**: Easy to add blog posts (just add `.md` file)
- **Version controlled**: Content changes are Git commits
- **Type-safe**: Zod validates frontmatter
- **Portable**: Markdown is universal (not locked to Astro)

**Example**: Adding a new blog post

1. Create `src/content/blog/new-post.md`:
   ```markdown
   ---
   title: "My New Post"
   date: 2025-01-20
   tags: ["astro"]
   ---

   Content here...
   ```

2. That's it! Astro automatically:
   - Generates `/blog/new-post` page
   - Adds to blog listing
   - Creates RSS feed entry

### Separation of Concerns

The dual-space architecture enforces **complete separation**:

- **Layouts**: `BlogLayout.astro` vs `PhotoLayout.astro`
- **Styles**: `blog-space` CSS vs `gallery-space` CSS
- **Colors**: Terminal palette vs Editorial palette
- **Fonts**: Monospace vs Serif

**Why?** Makes it impossible to accidentally mix aesthetics. Each space is self-contained.

---

## Conclusion

You've now learned:

✅ **JavaScript ecosystem** (npm, modern JS syntax, TypeScript)
✅ **Astro framework** (SSG, routing, builds)
✅ **Content Collections** (Markdown + Zod schemas)
✅ **Dual aesthetics** (separate layouts/styles)
✅ **React islands** (components, hooks, state)
✅ **Photo filtering** (state management, custom events)
✅ **Infinite scroll** (Intersection Observer)
✅ **Image optimization** (CDN, resizing, EXIF)

### Next Steps

1. **Experiment**: Make small changes and see what happens
2. **Add content**: Create a blog post or add a photo
3. **Customize**: Change colors, fonts, or layouts
4. **Read docs**:
   - [Astro Docs](https://docs.astro.build)
   - [React Docs](https://react.dev)
   - [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

### Common Tasks

**Add a blog post**:
```bash
# 1. Create file
touch src/content/blog/my-post.md

# 2. Add frontmatter and content
# 3. Run dev server
npm run dev

# 4. Visit http://localhost:4321/blog/my-post
```

**Add a photo**:
```bash
# 1. Import photo (creates Markdown file)
npm run import

# 2. Edit tags in frontmatter
# 3. Mark as featured if needed
```

**Change colors**:
```astro
<!-- src/layouts/BlogLayout.astro -->
<style>
  :root {
    --terminal-green: #00ff00;  /* Change to bright green */
  }
</style>
```

---

## Glossary

**Astro**: Static site generator for content-heavy sites
**Build time**: When you run `npm run build` (generates static HTML)
**CDN**: Content Delivery Network (fast global file serving)
**Client-side**: Code that runs in the browser
**Component**: Reusable UI piece
**Content Collection**: Astro's system for managing Markdown content
**EXIF**: Metadata embedded in photos (camera settings, GPS, etc.)
**Frontmatter**: YAML metadata at top of Markdown files (`---`)
**Hook**: React function for state/effects (starts with `use`)
**Hydration**: Process of making static HTML interactive with JavaScript
**Islands Architecture**: Only load JavaScript for interactive components
**JSX**: HTML-like syntax in JavaScript
**Memoization**: Caching expensive computations
**npm**: Node Package Manager (like pip)
**Props**: Data passed to components (like function arguments)
**Slug**: URL-friendly identifier (e.g., `my-first-post`)
**SSG**: Static Site Generation (build HTML once, serve many times)
**State**: Data that triggers re-renders when changed
**TypeScript**: JavaScript with type annotations
**Zod**: Validation library (like Pydantic for JavaScript)

---

**Happy coding! 🚀**
