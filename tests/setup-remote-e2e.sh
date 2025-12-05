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

# Allow skipping in sandboxes where downloads are blocked (e.g., Claude web)
BROWSER_CACHE_DIR="${PLAYWRIGHT_BROWSERS_PATH:-$HOME/.cache/ms-playwright}"
if [ "${SKIP_CHROMIUM_INSTALL:-0}" = "1" ]; then
  echo "↪️  SKIP_CHROMIUM_INSTALL=1 set; skipping Chromium download."
  echo "    Ensure Chromium already exists in ${BROWSER_CACHE_DIR}."
elif ls "${BROWSER_CACHE_DIR}"/chromium-* >/dev/null 2>&1; then
  echo "✅ Chromium already present in ${BROWSER_CACHE_DIR}, skipping download."
else
  if npx playwright install chromium; then
    echo "✅ Chromium installed"
  else
    echo "⚠️ Chromium download failed. If you're in a restricted sandbox, set"
    echo "   SKIP_CHROMIUM_INSTALL=1 and ensure a Chromium binary is available"
    echo "   in ${BROWSER_CACHE_DIR} (or set PLAYWRIGHT_BROWSERS_PATH)."
  fi
fi
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
sleep 5

# Check if dev server is responding
if curl -s http://localhost:4321 > /dev/null 2>&1; then
  echo "✅ Dev server is running on http://localhost:4321"
  echo ""
  echo "🎉 Setup complete!"
else
  echo "❌ Dev server failed to start properly"
  echo "Check logs at: /tmp/astro-dev.log"
  tail -20 /tmp/astro-dev.log
  exit 1
fi
