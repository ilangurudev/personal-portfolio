---
title: "I Built This Portfolio Without Writing a Single Line of Code"
description: "How I built a dual-space portfolio website using AI coding agents in 10 days, and what I learned along the way about working with robot collaborators."
date: 2025-12-06
tags: ["ai", "llm", "engineering", "web-development"]
isNotebook: false
---

# I Built This Portfolio Without Writing a Single Line of Code

Ten days. 208 commits. 68 pull requests. Zero lines of code written by hand.

Yeah, you read that right. The website you're looking at? I didn't write a single line of it. AI agents did all the typing while I sat back, sipped coffee, and played the role of "guy with opinions who occasionally says no, that's ugly."

Okay, it wasn't quite that simple. But it's close. Let me tell you how it went down.

## What I Wanted: Two Websites Pretending to Be One

Here's the deal. I'm an AI/ML engineer by day, street photographer by... also day (and sometimes golden hour). I wanted a portfolio that showed both sides without making them fight each other aesthetically.

So I came up with this dual-space concept:

1. **Professional Space** (`/`): My AI blog and projects—dark, terminal-vibes, very "I hack things" energy
2. **Photography Space** (`/photography/*`): My photos—bright, editorial, magazine-ish, very "I have feelings about light"

The catch? **Complete separation**. No style bleeding. Clicking between them should feel like visiting two different websites that just happen to share a URL. Dual layouts, separate color systems, the works.

Now, I *could* have built this myself. I've done web stuff before—Flask apps, GitHub Pages, the usual. But doing this properly? With Astro, React islands, Tailwind, infinite scroll, a custom lightbox, EXIF extraction, Cloudflare CDN integration? That's easily a month of evenings and weekends.

I had 10 days and the attention span of a mass extinction event.

Enter: the robots.

## The Squad: My AI Collaborators

I didn't just use one AI tool. I assembled a little squad:

- **Claude Code**: The heavy lifter. Complex features, multi-file refactors, architectural debates
- **Cursor**: Quick and snappy. Great for "just fix this one thing" energy
- **Claude Code Web**: For when I wanted to work from a browser like a fancy person

Here's the thing nobody tells you: **these tools are good at different stuff**. Claude Code is amazing when you need it to understand your whole project and make sweeping changes. Cursor is faster for surgical edits. Learning when to use which is half the battle.

I basically became a project manager for a team of very eager, very fast, occasionally confused junior developers who never need sleep and never complain about code reviews.

## Days 1-2: Getting the Bones Together

November 27th. The `init` commit. The "hello world" of ambition.

Within 48 hours, we had:

- Astro 5.x project with React islands (fancy way of saying "mostly static, interactive where needed")
- Tailwind CSS hooked up
- Netlify deployment working
- A photo import script that extracts EXIF metadata and uploads to Cloudflare R2
- Basic dual-layout system

My job? Describe what I wanted in plain English. Argue about architecture. Say things like "no, I don't like that shade of green" and "can we make it feel more like a terminal?"

The AI would propose something. I'd push back. We'd iterate. It's like pair programming except my partner types 10x faster than me and never gets annoyed when I change my mind.

One thing I did early that paid off big: I had the AI create documentation files explaining our architectural decisions. Here's a snippet from `AGENTS.md`:

```markdown
### Why Islands Architecture?
- **Efficiency:** We only hydrate the interactive parts (filtering, lightbox).
- **Isolation:** A heavy React component in the gallery doesn't slow
  down the blog post reader.

### Why Separate Layouts?
- **Aesthetic Integrity:** Prevents "style creep" between the Hacker
  (Professional) and Editorial (Photography) personas.
```

This wasn't just busywork. These docs became the AI's cheat sheet for future sessions. More on that later.

## Days 3-5: The Fun Stuff

With the foundation set, we got to the features that actually make a portfolio interesting:

- **Terminal-style landing page**: Dashboard layout, command-prompt vibes, very "hackerman"
- **Lightbox with swipe gestures**: Because nobody wants to tap tiny arrows on mobile
- **Multi-tag filtering with AND/OR logic**: 8 different filter dimensions (tags, albums, camera, date, aperture, shutter speed, ISO, focal length). Yes, 8. I may have gone overboard.
- **Infinite scroll gallery**: Virtualized rendering so your browser doesn't cry when loading 200 photos

My git history tells the story of the collaboration:

```
claude/add-lightbox-swipe-...
claude/redesign-landing-page-...
cursor/integrate-google-analytics-...
claude/multi-tag-filter-design-...
```

Each branch = one conversation with an AI = one feature shipped. It's weirdly satisfying to watch the commit graph grow.

## The Big Aha Moment: Tests Are Your Best Friend

Okay, here's where it gets real.

Around day 5, I noticed a pattern. I'd ask for a new feature. AI would implement it. I'd be happy. Then I'd discover that something *else* broke. The lightbox stopped working. The filters got weird. Little gremlins everywhere.

AI agents are remarkably capable, but they're also remarkably good at introducing subtle regressions while confidently telling you everything is fine.

The solution was so obvious I felt dumb for not doing it earlier: **write tests**.

I had the AI help me build a comprehensive Playwright test suite. End-to-end tests that automated exactly what I was manually checking after each change:

```javascript
// From lightbox-interactions.spec.cjs
console.log('Test 9: Navigate to Next Photo (Button)');
const nextBtn = await page.locator('.lightbox-next');
const initialCounter = await counter.textContent();

await nextBtn.click();
await page.waitForTimeout(400);

const newCounter = await counter.textContent();
const navigated = initialCounter !== newCounter;
console.log(`   Navigation successful: ${navigated ? '✓' : '✗'}`);
```

Once these tests existed, the whole workflow changed:

1. Me: "Hey, can you refactor the tag filtering?"
2. AI: *does the thing*
3. Me: `npm test`
4. Tests: "3 failures lol"
5. Me: *shares failures*
6. AI: *fixes stuff*
7. Repeat until green

This isn't some revolutionary insight—TDD has been around forever. But for AI-assisted development specifically? It's a game-changer. Tests become your safety net. You can ask for aggressive refactors without holding your breath.

By the end, I had 19 test files covering everything from dual-space navigation to CSS regression detection. The AI could break things, but it couldn't break things *quietly*.

## Days 8-10: The Great Cleanup

Armed with a solid test suite, the final stretch was all about refactoring.

See, when you're moving fast with AI, code duplication creeps in. You've got three components doing similar tag filtering. Copy-pasted CSS everywhere. Utility functions that exist in two places.

I asked the AI to find all the DRY violations and propose a cleanup plan. What followed was beautiful systematic murder of duplicate code:

```
refactor: DRY implementation for sorting and tag utilities (1.1, 1.2, 1.3)
refactor: DRY implementation for parseSettings, extractTags, and photo-card CSS
DRY: share viewfinder SVG and shutter formatter
```

Each refactor validated by the test suite. Red tests = something broke. Green tests = ship it.

The codebase went from "it works but don't look too closely" to "actually pretty clean." Shared utilities, consistent patterns, proper documentation.

## The Secret Sauce: AGENTS.md Files

Remember that documentation I mentioned earlier? Let me explain why it's so important.

I maintain these files called `AGENTS.md` throughout the codebase. They're basically cheat sheets for AI agents—structured docs that explain how everything works.

```markdown
## 2. Documentation Map

| Topic | Location | Description |
|-------|----------|-------------|
| **Core Architecture** | `src/AGENTS.md` | Rendering model, design systems |
| **Components** | `src/components/AGENTS.md` | UI components (Lightbox, Gallery) |
| **Layouts & Themes** | `src/layouts/AGENTS.md` | Dual-space theme system |
| **Testing** | `tests/AGENTS.md` | E2E tests, development commands |
```

When I start a new AI session, it reads these files and immediately knows:
- Why we made certain architectural choices
- Where to find existing utilities (so it doesn't reinvent them)
- The testing workflow
- Critical rules (like "never mix the two visual themes, I will cry")

The investment compounds. Each session is more productive because the AI has better context. It's like onboarding a new developer, except you only have to do it once and they actually read the docs.

## The Honest Part: What Worries Me

Alright, let's get real for a second. This approach isn't all sunshine and rainbows.

### Am I Getting Dumber?

Genuine concern. By delegating all implementation to AI, am I losing the muscle memory that comes from writing code yourself?

If you asked me to rebuild this site without AI tomorrow, I'd struggle. The Astro specifics, the React patterns, the Tailwind utilities—I know them conceptually but I haven't drilled them into my fingers.

This kind of freaks me out. I've been writing code for years. The idea of skills atrophying is uncomfortable.

My current cope: I've traded implementation-level expertise for architecture-level leverage. I can build more ambitious things faster. I'm working at a higher level of abstraction.

But yeah. I'm not 100% at peace with it. The "brainrot" is real, and I don't have a perfect answer.

### You Still Have to Pay Attention

AI-assisted development is not "set it and forget it." I reviewed every PR. I read through implementations. I caught issues the AI missed.

The velocity is intoxicating. It's tempting to just trust the output and move on. But quality still requires human judgment. At least for now.

### Tests Aren't Optional

Every time I skipped writing tests for a "quick feature," I regretted it within 24 hours. Something would break. I'd waste time debugging. Lesson learned the hard way, multiple times, because apparently I'm a slow learner.

If you're doing AI-assisted development: **invest in automated testing**. It's the difference between controlled speed and chaos.

## What I Actually Took Away From This

After 10 days of building with AI, here's what I think I know:

1. **AI makes engineers faster, but you have to steer.** The multiplier depends on how opinionated you are. You can't just say "build me a website" and expect magic. You need to have opinions and push back on bad suggestions.

2. **Tests + AI = fearless refactoring.** This combo is powerful. You can ask for aggressive changes and know immediately if something broke.

3. **Document for your AI.** Structured docs like `AGENTS.md` pay dividends across sessions. It's worth the investment.

4. **Use multiple tools.** They're good at different things. Don't marry yourself to one.

5. **The human role is changing, not disappearing.** I didn't write code, but I made a thousand decisions about architecture, UX, aesthetics, and quality. The AI implemented my vision—it didn't come up with the vision.

## The Final Tally

Here's where we ended up:

- **Timeline**: 10 days (Nov 27 - Dec 6, 2025)
- **Commits**: 208
- **Pull Requests**: 68
- **Test Files**: 19
- **Lines of Code Written By Hand**: 0
- **Cups of Coffee**: Don't ask

The result is the website you're reading this on. Dual-space portfolio. Terminal aesthetic on one side, editorial magazine on the other. Infinite scroll, 8-dimensional filtering, EXIF metadata, lightbox with slideshow mode and story drawer, responsive design.

Built entirely through conversation with AI agents.

**Want the technical details?** Check out the [Technical Deep Dive](/projects/personal-portfolio)—a comprehensive walkthrough of the architecture, code snippets, and engineering decisions. It's written for Python developers curious about modern web architecture, with Pydantic-to-Zod comparisons and everything.

## So... Now What?

Look, I'm not saying everyone should work this way. Some projects need the deep understanding that comes from writing every line yourself. Some codebases are too complex or sensitive for this approach.

But for a personal portfolio? A project where I had clear vision but limited time and a serious allergy to CSS debugging? AI-assisted development was kind of perfect.

The tools are only getting better. The question isn't whether AI will change how we build software—it already has. The question is how we adapt while staying responsible and keeping our skills sharp.

For me, that means: strong opinions, comprehensive tests, good documentation, and staying engaged even when it's tempting to just let the robots do their thing.

Also, regular breaks to actually write code by hand. Gotta keep the neurons firing.

Let's see where this goes.
