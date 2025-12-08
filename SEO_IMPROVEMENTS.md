# SEO Improvements Roadmap

This document outlines the SEO improvements for the personal portfolio site to maximize Google visibility and search rankings.

---

## Phase 1: Foundation (COMPLETED/IN PROGRESS)

### ✅ Sitemap Generation
- **Status:** In Progress
- **Implementation:** Using `@astrojs/sitemap` integration
- **Purpose:** Helps Google discover and index all pages
- **Location:** Auto-generated at `/sitemap-index.xml` and `/sitemap-0.xml`

### ✅ Robots.txt
- **Status:** In Progress
- **Implementation:** Static file in `public/robots.txt`
- **Purpose:** Guides search engine crawlers on what to index
- **Location:** `/robots.txt`

---

## Phase 2: Meta Tags & Social Sharing (TODO)

### Open Graph Tags
- **Purpose:** Rich previews when shared on Facebook, LinkedIn, Discord, etc.
- **Required Tags:**
  - `og:title`
  - `og:description`
  - `og:image` (1200x630px recommended)
  - `og:url`
  - `og:type` (website, article, profile)
  - `og:site_name`

### Twitter Card Tags
- **Purpose:** Rich previews when shared on Twitter/X
- **Required Tags:**
  - `twitter:card` (summary_large_image for photos)
  - `twitter:title`
  - `twitter:description`
  - `twitter:image`
  - `twitter:creator` (optional: your Twitter handle)

### Canonical URLs
- **Purpose:** Prevent duplicate content issues
- **Implementation:** Add `<link rel="canonical" href="...">` to every page
- **Example:** Prevents `/blog/post` and `/blog/post/` from being seen as duplicates

---

## Phase 3: Structured Data (TODO)

### JSON-LD Schema Markup
Structured data helps Google show rich results (enhanced listings with images, ratings, etc.)

#### 1. **Person Schema** (About Page)
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Guru Ilangovan",
  "jobTitle": "AI/LLM Engineer",
  "url": "https://guru.dev",
  "sameAs": [
    "https://github.com/ilangurudev",
    "https://linkedin.com/in/yourprofile"
  ]
}
```

#### 2. **BlogPosting Schema** (Blog Posts)
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Post Title",
  "datePublished": "2023-10-27",
  "author": {
    "@type": "Person",
    "name": "Guru Ilangovan"
  },
  "image": "https://guru.dev/og-image.jpg",
  "articleBody": "..."
}
```

#### 3. **ImageObject Schema** (Photography)
```json
{
  "@context": "https://schema.org",
  "@type": "ImageObject",
  "contentUrl": "https://cdn.example.com/photo.jpg",
  "creator": "Guru Ilangovan",
  "datePublished": "2023-10-27",
  "exifData": {
    "camera": "...",
    "lens": "...",
    "focalLength": "..."
  }
}
```

#### 4. **CreativeWork Schema** (Projects)
```json
{
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "name": "Project Name",
  "description": "...",
  "creator": {
    "@type": "Person",
    "name": "Guru Ilangovan"
  }
}
```

---

## Phase 4: Content Optimization (TODO)

### Image Alt Text
- **Current Status:** Need to audit
- **Action:** Ensure all images have descriptive alt text
- **Photography:** Use photo titles or EXIF descriptions
- **UI Images:** Describe what the image shows

### Meta Descriptions
- **Current Status:** Optional in layouts (good!)
- **Action:** Ensure EVERY page has a unique, compelling description
- **Length:** 150-160 characters
- **Blog Posts:** Auto-generate from first paragraph if not provided
- **Photos:** Use photo story/description if available

### Header Hierarchy
- **Current Status:** Need to audit
- **Action:** Ensure proper H1 → H2 → H3 structure
- **Rule:** Only one H1 per page (usually the page title)

---

## Phase 5: Performance & Technical SEO (TODO)

### Core Web Vitals
- **Largest Contentful Paint (LCP):** < 2.5s
- **First Input Delay (FID):** < 100ms
- **Cumulative Layout Shift (CLS):** < 0.1
- **Action:** Run Lighthouse audit and optimize

### Mobile Optimization
- **Current Status:** Responsive design implemented
- **Action:** Test on real devices, verify touch targets
- **Photography:** Ensure infinite scroll works smoothly on mobile

### Image Optimization
- **Current Status:** Using Astro `<Image>` component (good!)
- **Action:** Audit image sizes and formats
- **Cloudflare R2:** Leverage Image Resizing for responsive images

---

## Phase 6: External SEO (TODO)

### Google Search Console
1. Add and verify property
2. Submit sitemap
3. Request indexing for key pages
4. Monitor search performance
5. Fix any crawl errors

### Google Business Profile (Optional)
- If you offer photography services, create a profile
- Link to your portfolio

### Social Media Integration
- Share blog posts and photos regularly
- Use consistent branding across platforms
- Link back to your portfolio in bio/about sections

### Backlinks
- Guest blog posts about AI/LLM topics
- Photography community submissions
- GitHub profile README link
- Open source project documentation

---

## Implementation Priority

1. ✅ **Phase 1:** Foundation (sitemap, robots.txt) → **IN PROGRESS**
2. 🔜 **Phase 2:** Meta tags & social sharing → **Next**
3. 📋 **Phase 3:** Structured data
4. 📋 **Phase 4:** Content optimization
5. 📋 **Phase 5:** Performance audit
6. 📋 **Phase 6:** External SEO activities

---

## Measuring Success

### Key Metrics to Track
- **Google Search Console:**
  - Total impressions
  - Average position
  - Click-through rate (CTR)
  - Indexed pages count

- **Analytics:**
  - Organic search traffic
  - Top landing pages
  - Average session duration
  - Bounce rate

### Timeline
- **Week 1-2:** Foundation + Meta tags
- **Week 3-4:** Structured data + Content optimization
- **Month 2:** Monitor and iterate based on Search Console data
- **Month 3+:** Focus on backlinks and external SEO

---

## Resources

- [Google Search Central](https://developers.google.com/search)
- [Schema.org Documentation](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Astro SEO Best Practices](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
