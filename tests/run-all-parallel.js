#!/usr/bin/env node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const specDir = path.resolve(__dirname, 'e2e');
const skillDir = path.resolve(__dirname, '../.claude/skills/playwright-skill');
const runnerPath = path.join(skillDir, 'run.js');

function failAndExit(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

if (!fs.existsSync(specDir)) {
  failAndExit(`Spec directory not found: ${specDir}`);
}

if (!fs.existsSync(runnerPath)) {
  failAndExit(`Playwright runner not found: ${runnerPath}`);
}

const filters = process.argv.slice(2);
const allSpecs = fs
  .readdirSync(specDir)
  .filter((file) => file.endsWith('.spec.js') || file.endsWith('.spec.cjs'))
  .sort((a, b) => a.localeCompare(b));

const specs = filters.length
  ? allSpecs.filter((file) => filters.some((f) => file.includes(f)))
  : allSpecs;

if (specs.length === 0) {
  const note = filters.length
    ? `No specs matched filters: ${filters.join(', ')}`
    : 'No spec files found.';
  failAndExit(note);
}

const requestedConcurrency = Number(process.env.E2E_CONCURRENCY);
const defaultConcurrency = Math.max(1, Math.min(os.cpus().length, specs.length));
const concurrency =
  Number.isFinite(requestedConcurrency) && requestedConcurrency > 0
    ? Math.min(requestedConcurrency, specs.length)
    : defaultConcurrency;

const logThrough = process.env.E2E_LOG_THROUGH === 'true';

async function runSpec(specName) {
  return new Promise((resolve) => {
    const specPath = path.join(specDir, specName);
    const start = Date.now();
    const child = spawn(
      'node',
      [runnerPath, specPath],
      {
        cwd: skillDir,
        env: { ...process.env, PLAYWRIGHT_SKIP_TEMP_CLEANUP: 'true' },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    let output = '';
    let sawFailureMarker = false;

    const append = (chunk, stream) => {
      const text = chunk.toString();
      output += text;
      if (logThrough) {
        const prefixed = text
          .split('\n')
          .filter(Boolean)
          .map((line) => `[${specName}] ${line}`)
          .join('\n');
        stream.write(`${prefixed}\n`);
      }
      if (text.includes('✗')) {
        sawFailureMarker = true;
      }
    };

    child.stdout.on('data', (data) => append(data, process.stdout));
    child.stderr.on('data', (data) => {
      sawFailureMarker = true;
      append(data, process.stderr);
    });

    child.on('close', (code) => {
      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;
      const failed = sawFailureMarker || (typeof code === 'number' && code !== 0);
      const symbol = failed ? '✗' : '✓';
      console.log(`${symbol} ${specName} (${duration})`);
      resolve({ specName, output, failed, duration });
    });
  });
}

async function worker(queue, results) {
  while (queue.length > 0) {
    const nextSpec = queue.shift();
    const result = await runSpec(nextSpec);
    results.push(result);
  }
}

async function main() {
  console.log(
    `Running ${specs.length} specs with concurrency ${concurrency} (HEADLESS=${process.env.HEADLESS || 'true'})`,
  );
  if (filters.length) {
    console.log(`Filters: ${filters.join(', ')}`);
  }
  console.log('');

  const queue = [...specs];
  const results = [];
  const workers = Array.from({ length: concurrency }, () => worker(queue, results));
  await Promise.all(workers);

  const failures = results.filter((r) => r.failed);
  if (failures.length > 0) {
    console.log(`\nFailures (${failures.length}/${specs.length}):`);
    failures.forEach(({ specName, output }) => {
      console.log(`\n--- ${specName} ---`);
      console.log(output.trim() || '(no output)');
    });
    process.exitCode = 1;
  } else {
    console.log(`\nAll ${specs.length} specs passed.`);
  }
}

main().catch((error) => {
  console.error('❌ Parallel runner failed:', error);
  process.exit(1);
});

