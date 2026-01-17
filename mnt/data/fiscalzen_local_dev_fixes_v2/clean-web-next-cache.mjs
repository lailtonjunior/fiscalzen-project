#!/usr/bin/env node
/**
 * Cleans Next.js dev build artifacts that commonly corrupt on Windows.
 *
 * Usage:
 *   node tools/clean-web-next-cache.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const webApp = path.join(repoRoot, 'apps', 'web');
const targets = [
  path.join(webApp, '.next'),
  path.join(webApp, '.turbo'),
  path.join(webApp, 'node_modules', '.cache'),
];

function rm(p) {
  if (!fs.existsSync(p)) return { path: p, status: 'noop' };
  fs.rmSync(p, { recursive: true, force: true });
  return { path: p, status: 'deleted' };
}

const results = targets.map(rm);
console.log('Clean results:');
for (const r of results) {
  console.log(`[${r.status.toUpperCase()}] ${r.path}`);
}

console.log('\nNext steps:');
console.log('1) Restart the web dev server: pnpm --filter @fiscalzen/web dev');
