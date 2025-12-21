---
title: "I Built a Photo Keywording Tool in a Weekend"
description: "Using AI to build a real tool with tests, linting, and all the things that used to feel like overhead."
date: 2025-12-20
tags: ["ai", "python", "photography", "llm", "software-development"]
isNotebook: false
---

# I Built a Photo Keywording Tool in a Weekend

I've got about 15,000 photos sitting in my Lightroom library. Beautiful shots. Terrible metadata. No searchable keywords. Finding anything specific? Good luck.

So I built a tool that fixes that. In a weekend. With AI doing most of the heavy lifting.

But here's the thing—this isn't really a story about photo management.

## The Real Story Here

Five years ago, if you'd asked me to build something like this, I would've looked at the scope and noped out immediately:

- Parse RAW file metadata
- Integrate with an AI vision model
- Handle XMP sidecar files properly
- Set up testing infrastructure
- Configure linting and pre-commit hooks
- Build a CLI interface

That's weeks of work. Maybe months if you count all the time I'd spend yak-shaving dependencies and fighting with library documentation.

But last weekend? I had a conversation with an AI and was very opinionated about how I wanted each piece to work. The result is a production-ready tool that actually solves my problem.

## The Opinionated Workflow

I didn't just say "build me a photo keywording app" and hope for the best. That's a recipe for garbage code and scope creep.

Instead, I broke it down into focused conversations, building one piece at a time:

1. **Keyword generator** - Feed an image to Gemini Flash, get relevant keywords back
2. **RAW file locator** - Match JPEG filenames to their original ARW/DNG files in my library
3. **XMP metadata tagger** - Use exiftool to write keywords without corrupting existing metadata
4. **Directory processor** - Recursively handle batches of images
5. **CLI interface** - Wrap it all in a usable command-line tool

Each of these was a separate, focused conversation. The AI would propose an implementation. I'd push back on the parts I didn't like. We'd iterate until it was clean.

The key? **I knew what I wanted before I asked for it.** The AI accelerated execution, but I did the design.

## The Three-Step Core

Once you strip away the scaffolding, the tool does three things:

### 1. Finding XMP Files

My workflow creates a disconnect. Lightroom stores photos as ARW (Sony RAW) or DNG files. I export JPEGs for review. But when I want to add metadata, it needs to go back to the original RAW files.

The tool recursively searches my photo library, matching JPEG filenames to their RAW counterparts. Simple in concept. Annoying to implement correctly (case sensitivity, file extensions, duplicate names). The AI handled all the edge cases I would've discovered through bugs.

### 2. AI-Powered Keyword Generation

Here's where it gets interesting. I didn't want the AI to invent arbitrary keywords. I have an existing taxonomy in Lightroom—categories like "street," "architecture," "sunset," "urban," etc.

The prompt is simple: "Analyze this image. Select ONLY keywords from the provided taxonomy that match what you see."

The AI doesn't freestyle. It picks from my controlled vocabulary. This keeps my library consistent instead of turning into a tag soup nightmare.

I'm using Gemini Flash for this. Fast, cheap, and the vision quality is good enough for keyword selection. Could I get better results with GPT-4 Vision? Maybe. Do I care when this works and costs pennies? Nope.

### 3. Writing to XMP

Keywords go into XMP sidecar files using exiftool. The tool appends to existing keywords rather than overwriting, so anything I've manually tagged stays intact.

This was one of those "test everything" moments. Metadata corruption is silent and catastrophic. You don't notice until months later when your library is toast.

So we wrote comprehensive tests with mocked exiftool calls. If the logic breaks, the tests scream. More on that in a second.

## The Professional Infrastructure

Here's what would've stopped me in the past: all the "professional" stuff around the code.

Pre-commit hooks running:
- Linting via Ruff
- Format checks
- Full test suite

Used to be, setting this up for a personal project felt like overkill. Too much configuration. Too much yak-shaving. Not worth it for a weekend hack.

But now? I asked the AI to set it up. It did. Took minutes.

And you know what? It's paid for itself already. Every commit runs the tests. I catch regressions before they're committed. The code stays clean automatically.

This is the subtle shift—tooling that used to be "enterprise only" is now so easy to set up that there's no reason not to use it on personal projects.

## Testing Strategy

Let me get specific about the tests because this is where AI-assisted development gets dangerous if you're not careful.

The AI wanted to write tests that actually called the Gemini API and ran exiftool. Real integration tests.

I said no.

Why? Because:
1. Tests shouldn't depend on external services or cost money to run
2. Tests should run fast so you actually run them
3. Real API calls introduce flakiness and rate limits

Instead, we mocked everything:
- Mock the AI API responses
- Mock exiftool execution
- Test just the logic

This is where being opinionated matters. The AI doesn't care if tests are expensive or slow. You have to care on its behalf.

The result is a test suite that runs in seconds, costs nothing, and validates the core logic without external dependencies. Every edge case is covered. Every refactor is verified.

And here's the kicker: those tests caught regressions multiple times during development. The AI would confidently implement a change that broke something subtle. The tests turned red. We fixed it before I ever noticed.

## Practical Usage

The workflow is stupid simple now:

1. Export JPEGs from Lightroom
2. Run the CLI tool: `python -m photo_tagger.cli /path/to/jpgs --raw-dir /path/to/library --taxonomy keywords.txt`
3. Tool processes images, writes keywords to XMP files
4. Re-import metadata in Lightroom

Batch keyword 100 photos in the time it used to take me to tag 10 manually. The time savings compound fast.

## What I Actually Learned

### Architecture Still Matters

The AI doesn't magically know how to structure your project. You do. I had to know:
- How XMP files work
- Why mocking matters for tests
- That I wanted a controlled taxonomy, not free-form tags
- The separation between keyword generation and metadata writing

The AI executed my vision. It didn't create the vision.

### Incremental Beats Monolithic

Breaking the project into small, focused pieces meant cleaner code. Each component does one thing. They compose cleanly.

If I'd asked for "build me a photo keywording tool" in one shot, I'd get a mess.

### Tests Are Your Safety Net

Every time I skipped tests "just this once," I regretted it within hours. AI introduces bugs silently and confidently. Tests catch them.

This isn't optional. It's the difference between a weekend hack and a weekend hack you can actually maintain.

### Modern Tools Lower the Bar

Ruff, pytest, pre-commit hooks, type hints—all of this used to feel like overhead. Now it's table stakes, and AI makes it trivial to set up.

There's no excuse anymore. Even for personal projects.

## The Bottom Line

This tool is on GitHub. It's not a demo. It's production code I use daily. It has tests. It has linting. It handles errors gracefully.

I didn't write most of the code. I designed the system, made architectural decisions, and pushed back when the AI suggested something dumb.

The development friction is gone. Things that used to block me—library integration, test setup, boilerplate—don't anymore.

If you've been sitting on ideas for small utilities thinking "it's not worth the time to build properly," maybe give it another look. The landscape has shifted.

Break the problem down. Be opinionated about what you want. Test everything. Ship it.

And if you've got thousands of poorly-tagged photos? Well, now you know one way to fix that.

The code is on GitHub: [photo-keyword-tagger](https://github.com/ilangurudev/photo-keyword-tagger)
