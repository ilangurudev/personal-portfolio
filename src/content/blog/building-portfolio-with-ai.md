---
title: "I Built This Portfolio Without Writing a Single Line of Code"
description: "A technical deep-dive into building a dual-space portfolio website using AI coding agents in 10 days, and what I learned about responsible AI-assisted development."
date: 2025-12-06
tags: ["ai", "llm", "engineering", "web-development"]
isNotebook: false
---

# I Built This Portfolio Without Writing a Single Line of Code

Ten days. 208 commits. 68 pull requests. Zero lines of code written by hand.

This is the story of how I built this portfolio website—a dual-space platform showcasing both my AI/ML engineering work and my photography—using AI coding agents as my sole implementation partners. Not as a gimmick, but as a genuine experiment in what AI-assisted development looks like when you approach it responsibly and opinionately.

## The Concept: Dual Identities, Complete Separation

Before diving into the "how," let me explain the "what." I wanted a portfolio that represented two distinct aspects of my work:

1. **Professional Space** (`/`): My AI/ML engineering blog, learnings, and projects—with a dark, terminal-inspired "hacker" aesthetic
2. **Photography Space** (`/photography/*`): My street and landscape photography—with a bright, editorial magazine feel

The key constraint was **complete aesthetic separation**. No mixing of styles. Each space should feel like a different website while sharing the same underlying architecture. This meant dual layouts, separate CSS variable systems, and theme-aware components.

I knew what I wanted. I had opinions on the architecture. What I lacked was the time (and frankly, the modern frontend expertise) to implement it from scratch. A project like this would normally take me at least a month of evenings and weekends. With the help of AI agents, I did it in 10 days.

## The Tools: A Multi-Agent Approach

I didn't rely on a single AI tool. I used a combination of:

- **Claude Code**: My primary partner for complex features, refactoring, and architectural decisions
- **Cursor**: Great for focused, file-specific edits and quick iterations
- **Claude Code Web**: For sessions when I wanted to work from a browser

Each tool has its strengths. Claude Code excels at multi-file refactoring and understanding project-wide context. Cursor is snappy for targeted edits. I found myself naturally switching between them based on the task at hand.

The key insight: **AI agents are not a monolith**. Different tools excel at different tasks, and learning when to use which is a skill in itself.

## Phase 1: Foundation (Days 1-2)

The journey started on November 27th with a simple `init` commit. Within the first two days, we had:

- Astro 5.x project scaffold with React islands architecture
- Tailwind CSS 4.x integration
- Netlify deployment configured
- Photo import pipeline (extracting EXIF metadata, uploading to Cloudflare R2)
- Basic dual-layout system

I described what I wanted in natural language. The AI proposed architectures. We iterated. When I disagreed with an approach, I said so—and the AI adapted.

Here's an example of the kind of architectural decision the AI helped crystallize. From the `AGENTS.md` documentation it generated:

```markdown
### Why Islands Architecture?
- **Efficiency:** We only hydrate the interactive parts (filtering, lightbox).
- **Isolation:** A heavy React component in the gallery doesn't slow
  down the blog post reader.

### Why Separate Layouts?
- **Aesthetic Integrity:** Prevents "style creep" between the Hacker
  (Professional) and Editorial (Photography) personas.
- **Maintainability:** Changing the blog font will never accidentally
  break the photo gallery grid.
```

This documentation wasn't busywork—it became the source of truth that helped AI agents understand the codebase in future sessions.

## Phase 2: Core Features (Days 3-5)

With the foundation in place, we moved to user-facing features:

- **Terminal-style landing page**: A dashboard layout that felt like a command-line interface
- **Lightbox with swipe gestures**: Touch-friendly mobile navigation for the photo gallery
- **Multi-tag filtering with AND/OR logic**: An 8-dimensional filter system (tags, albums, camera, date range, aperture, shutter speed, ISO, focal length)
- **Infinite scroll gallery**: Virtualized rendering with Intersection Observer for smooth performance

The branch names in my git history tell the story of the AI collaboration:

```
claude/add-lightbox-swipe-...
claude/redesign-landing-page-...
cursor/integrate-google-analytics-...
claude/multi-tag-filter-design-...
```

Each branch represents a conversation with an AI agent, a feature implemented, tested, and merged.

## The Aha Moment: Test-Driven Development with AI

Around day 5, I added Playwright for end-to-end testing. This changed everything.

Here's the thing about working with AI agents: they're remarkably capable at implementing features, but they can also introduce subtle regressions. Early in the project, I'd ask for a new feature, get it implemented, and then discover that some previous functionality had broken.

The solution was obvious in hindsight: **write tests**.

But not just any tests—I worked with the AI to create comprehensive E2E tests that automated exactly what I would manually check after each feature implementation:

```javascript
// From lightbox-interactions.spec.cjs - one of 19 test files
console.log('Test 9: Navigate to Next Photo (Button)');
const nextBtn = await page.locator('.lightbox-next');
const initialCounter = await counter.textContent();

await nextBtn.click();
await page.waitForTimeout(400);

const newCounter = await counter.textContent();
const navigated = initialCounter !== newCounter;
console.log(`   Navigation successful: ${navigated ? '✓' : '✗'}`);
```

Once these tests existed, I could confidently ask the AI to refactor aggressively. The workflow became:

1. Describe the change I wanted
2. AI implements the change
3. Run `npm test`
4. If tests fail, share the failures with the AI
5. AI fixes the issues
6. Repeat until green

This isn't revolutionary—TDD has been known for decades. But for AI-assisted development specifically, it's transformational. Tests became my safety net, allowing me to move fast without breaking things.

By the end of the project, I had 19 test files covering:
- Dual-space navigation
- Responsive layouts across devices
- Tag filtering with AND/OR modes
- Lightbox interactions (keyboard, touch, mouse)
- Infinite scroll behavior
- Story drawer functionality
- CSS rendering regression detection

## Phase 3: The DRY Refactoring Sprint (Days 8-10)

Armed with comprehensive tests, the final phase was aggressive refactoring. The codebase had accumulated some duplication—multiple components implementing similar tag filtering logic, repeated CSS patterns, duplicated utility functions.

I asked the AI to identify DRY (Don't Repeat Yourself) violations and propose a refactoring plan. What emerged was a systematic cleanup:

```
refactor: DRY implementation for sorting and tag utilities (1.1, 1.2, 1.3)
refactor: DRY implementation for parseSettings, extractTags, and photo-card CSS
DRY: share viewfinder SVG and shutter formatter
```

Each refactoring PR was validated by the test suite. When tests failed, we knew exactly what broke. When tests passed, I had confidence to merge.

The result is a codebase that's not just functional, but maintainable. Shared utilities in `src/utils/`, consistent component patterns, and comprehensive documentation.

## The AGENTS.md System: Teaching AI About Your Codebase

One investment that paid dividends was maintaining structured documentation specifically for AI consumption. I call them `AGENTS.md` files—documentation designed to give AI agents context about how the codebase works.

The root `AGENTS.md` provides a project overview and links to directory-specific docs:

```markdown
## 2. Documentation Map

| Topic | Location | Description |
|-------|----------|-------------|
| **Core Architecture** | `src/AGENTS.md` | Rendering model, design systems |
| **Components** | `src/components/AGENTS.md` | UI components (Lightbox, Gallery) |
| **Layouts & Themes** | `src/layouts/AGENTS.md` | Dual-space theme system |
| **Testing** | `tests/AGENTS.md` | E2E tests, development commands |
```

When I start a new AI session, the agent reads these files and immediately understands:
- The project's architectural decisions and why they were made
- Which utilities exist and where to find them
- The testing workflow and how to validate changes
- Critical rules (like keeping the two aesthetics separate)

The key is keeping these docs current and concise. Every significant change gets documented. It's an investment, but it compounds—each future session is more productive because the AI has better context.

## Honest Reflections: The Tradeoffs

I'd be dishonest if I claimed this approach has no downsides. Here are my genuine concerns:

### The "Brainrot" Risk

There's a real possibility that by delegating all implementation to AI, I'm losing the muscle memory and deep understanding that comes from writing code yourself. If I had to implement this site without AI tomorrow, I genuinely don't think I could. The Astro/React/Tailwind specifics would require significant relearning.

This troubles me. As someone who has spent years building software, the idea of skills atrophying is uncomfortable. My current rationalization is that I've traded implementation-level expertise for architecture-level leverage—I can now build more ambitious things faster. But I'm not fully at peace with this tradeoff.

### The Supervision Burden

AI-assisted development is not "hands off." I reviewed every PR. I read through implementations at a high level. I caught issues the AI missed. This project worked because I stayed engaged and opinionated.

I worry about the temptation to trust AI outputs blindly as the tools get better. The velocity is intoxicating, but quality requires human judgment—at least for now.

### Testing Is Non-Negotiable

Without the Playwright test suite, this project would have been chaos. Every time I skipped writing tests for a "quick feature," I regretted it later. The AI would break something, I'd miss it, and I'd waste time debugging.

If you're doing AI-assisted development, invest heavily in automated testing. It's not optional.

## What I Actually Learned

After 10 days of intensive AI-assisted development, here's what I believe:

1. **Engineers can move significantly faster with AI**—but the multiplier depends on the quality of your guidance. You need to be opinionated about architecture and willing to push back on suboptimal suggestions.

2. **Testing enables aggressive iteration**. The combination of AI implementation speed + comprehensive test coverage is powerful. You can refactor fearlessly.

3. **Documentation for AI is worth the investment**. Structured, current docs like `AGENTS.md` files pay dividends across sessions.

4. **Multiple AI tools have different strengths**. Don't marry yourself to one agent. Use Claude Code for complex multi-file work, Cursor for quick edits, etc.

5. **The human role is shifting, not disappearing**. I didn't write code, but I made countless decisions about architecture, aesthetics, user experience, and quality. The AI implemented my vision—it didn't generate the vision.

## The Numbers

Final tally for this project:

- **Timeline**: 10 days (Nov 27 - Dec 6, 2025)
- **Commits**: 208
- **Pull Requests**: 68
- **Test Files**: 19
- **Lines of Code Written By Hand**: 0

The website you're reading this on is the result. A dual-space portfolio with a terminal-aesthetic professional section and an editorial-style photography gallery. Infinite scroll, 8-dimensional filtering, EXIF metadata extraction, lightbox with slideshow mode and story drawer, mobile-optimized responsive design.

Built entirely through conversation with AI agents.

## Closing Thoughts

I'm not claiming this is how everyone should work. Different projects have different needs. Sometimes you need the deep understanding that comes from writing every line yourself.

But for a personal portfolio—a project where I had clear vision but limited time—AI-assisted development was transformative. I built something I'm proud of, faster than I thought possible, while learning a new way of working.

The tools are only getting better. The question isn't whether AI will change how we build software—it's how we adapt our practices to stay responsible and effective.

For me, that means: strong opinions, comprehensive tests, current documentation, and constant supervision. AI as a collaborator, not a replacement.

Let's see where this goes.
