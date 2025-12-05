#!/bin/bash

# Remote E2E Test Environment Setup Script
# This script sets up the E2E test environment in remote/sandboxed environments
# (e.g., Claude Code web sandbox, Codespaces, etc.)

set -e  # Exit on error

echo "🚀 Setting up E2E test environment..."
echo ""

# Step 1: Install project dependencies
echo "📦 Step 1/5: Installing project dependencies..."
cd /home/user/personal-portfolio
npm install
echo "✅ Project dependencies installed"
echo ""

# Step 2: Install Playwright skill dependencies
echo "📦 Step 2/5: Installing Playwright dependencies..."
cd /home/user/personal-portfolio/.claude/skills/playwright-skill
npm install
echo "✅ Playwright dependencies installed"
echo ""

# Step 3: Install Chromium browser
echo "🌐 Step 3/5: Installing Chromium browser (~100MB download)..."
cd /home/user/personal-portfolio
npx playwright install chromium
echo "✅ Chromium installed"
echo ""

# Step 4: Start dev server
echo "🔧 Step 4/5: Starting dev server..."
cd /home/user/personal-portfolio

# Kill any existing dev server
pkill -f "astro dev" 2>/dev/null || true
sleep 2

# Start dev server in background
npm run dev > /tmp/astro-dev.log 2>&1 &
DEV_SERVER_PID=$!
echo "Dev server started with PID: $DEV_SERVER_PID"
echo ""

# Step 5: Verify dev server is running
echo "⏳ Step 5/5: Waiting for dev server to start..."
sleep 10

# Check if dev server is responding
if curl -s http://localhost:4321 > /dev/null 2>&1; then
  echo "✅ Dev server is running on http://localhost:4321"
  echo ""
  echo "🎉 Setup complete!"
  echo ""
  echo "Run tests with:"
  echo "  HEADLESS=true npm run test              # Run all tests"
  echo "  HEADLESS=true npm run test:navigation   # Run specific test"
  echo ""
  echo "Available test commands:"
  echo "  test:navigation    - Dual-space navigation tests"
  echo "  test:sorting       - Photo sorting tests"
  echo "  test:responsive    - Responsive design tests"
  echo "  test:visual        - Visual aesthetics tests"
  echo "  test:filters       - Photo filter toggle tests"
  echo "  test:tag-and-or    - Tag filtering AND/OR tests"
  echo "  test:lightbox      - Lightbox interaction tests"
  echo "  test:story         - Story drawer tests"
  echo "  test:nav-links     - Lightbox navigation links tests"
  echo "  test:scroll        - Infinite scroll tests"
  echo "  test:advanced-filters - Advanced filter panel tests"
  echo "  test:slideshow     - Slideshow mode tests"
  echo "  test:albums        - Album pages tests"
else
  echo "❌ Dev server failed to start properly"
  echo "Check logs at: /tmp/astro-dev.log"
  tail -20 /tmp/astro-dev.log
  exit 1
fi
