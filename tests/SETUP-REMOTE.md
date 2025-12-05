# Remote Environment Setup for E2E Tests

This guide is for setting up E2E tests in remote or sandboxed environments (e.g., Claude Code web sandbox, Codespaces, etc.) where the environment is not a standard development machine.

**Note:** If you're running tests in a standard local development environment, you likely don't need this guide. Use this only when `public_env` is not `dev` or you're in a containerized/sandboxed environment.

## Quick Setup (Automated Script)

Run this one-liner to set up everything automatically:

```bash
bash tests/setup-remote-e2e.sh
```

The script will:
1. Install project dependencies
2. Install Playwright dependencies
3. Install Chromium browser with `SKIP_CHROMIUM_INSTALL=1` 
4. Start the dev server (npm run dev). It runs in localhost:4321/
5. Verify everything is working

After the script completes, you can run tests with:
```bash
HEADLESS=true npm run test              # Run all tests
HEADLESS=true npm run test:navigation   # Run specific test
```

## Manual Setup (Alternative)

If you prefer to set up manually or the automated script fails, follow these steps:

## Prerequisites Check

Before running E2E tests, verify your environment:

```bash
# Check Node.js version (should be >= 14.0.0)
node --version

# Check if in project root
pwd  # Should show /path/to/personal-portfolio
```

## Setup Steps

### 1. Install Project Dependencies

```bash
cd /home/user/personal-portfolio
npm install
```

This installs all Astro, React, and other project dependencies.

### 2. Install Playwright Dependencies

```bash
cd /home/user/personal-portfolio/.claude/skills/playwright-skill
npm install
```

This installs Playwright and playwright-core packages.

**Note:** In headless environments without a display, you must set `HEADLESS=true` when running tests (see below).

### 3. Start the Dev Server

**⚠️ CRITICAL:** The dev server MUST be started from the project root directory (`/home/user/personal-portfolio`). Starting it from any subdirectory will result in 404 errors and test failures.

```bash
cd /home/user/personal-portfolio
npm run dev &
```

The dev server will start on `http://localhost:4321`. Wait ~5-10 seconds for it to fully initialize before running tests.

You should see output like:
```
astro  v5.16.2 ready in 2080 ms
┃ Local    http://localhost:4321/
```

## Running Tests

### Headless Mode (Recommended for Remote)

In remote/sandboxed environments without a display, always use headless mode:

```bash
HEADLESS=true npm run test              # Run all tests
HEADLESS=true npm run test:navigation   # Run specific test
```

## Troubleshooting

### "astro: not found"

**Cause:** Project dependencies not installed
**Fix:** Run `npm install` in project root

### "Playwright not installed"

**Cause:** Playwright dependencies not installed
**Fix:** Run `npm install` in `.claude/skills/playwright-skill/`

### "Browser executable not found"

**Cause:** Chromium browser not installed
**Fix:** Run `npx playwright install chromium`

### "Connection refused" or "ECONNREFUSED"

**Cause:** Dev server not running
**Fix:** Start dev server with `npm run dev` and wait for it to initialize

### Tests fail with "Cannot open display"

**Cause:** Running headed mode in environment without display
**Fix:** Use `HEADLESS=true npm run test`

### "Page loaded: 404: Not Found" in test output

**Cause:** Dev server started from wrong directory or `src/` directory not found
**Fix:**
1. Kill the dev server: `pkill -f "astro dev"`
2. Ensure you're in `/home/user/personal-portfolio` (not a subdirectory)
3. Restart: `cd /home/user/personal-portfolio && npm run dev &`
4. Wait 10 seconds and verify: `curl -s http://localhost:4321 | head -20`

## Quick Setup Script

For convenience, here's a one-liner to set up everything:

```bash
cd /home/user/personal-portfolio && \
npm install && \
cd .claude/skills/playwright-skill && \
npm install && \
if [ "${SKIP_CHROMIUM_INSTALL:-0}" != "1" ]; then npx playwright install chromium; fi && \
cd /home/user/personal-portfolio && \
npm run dev & \
sleep 10 && \
echo "✅ Setup complete! Verifying dev server..." && \
curl -s http://localhost:4321 | head -5 && \
echo "" && \
echo "✅ Dev server is running! Run 'HEADLESS=true npm run test' to start testing"
```

If Chromium downloads are blocked, set `SKIP_CHROMIUM_INSTALL=1` before running the one-liner and provide a preinstalled browser via `PLAYWRIGHT_BROWSERS_PATH` or `${HOME}/.cache/ms-playwright`.

## Environment Detection

The setup process differs based on environment:

- **Local Dev (`public_env=dev`)**: Usually pre-configured, just run tests
- **Remote/Sandbox**: Follow all steps above
- **CI/CD**: Use headless mode + automated setup scripts

## Next Steps

After setup is complete:
1. Verify dev server is running and serving content:
   ```bash
   curl -s http://localhost:4321 | head -20
   ```
   You should see HTML content, not "404: Not Found"
2. Run a single test to verify: `HEADLESS=true npm run test:navigation`
3. Run full suite: `HEADLESS=true npm run test`

For test details and available test commands, see [tests/AGENTS.md](./AGENTS.md).
