#!/usr/bin/env node
/**
 * Clears Next.js dev cache that gets corrupted on Windows sometimes.
 * Deletes apps/web/.next and its cache folders.
 * Usage: node tools/clean-web-next-cache.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const webDir = path.join(root, 'apps', 'web');
const nextDir = path.join(webDir, '.next');

function rm(p) {
  if (!fs.existsSync(p)) return false;
  fs.rmSync(p, { recursive: true, force: true });
  return true;
}

const removed = [];

if (rm(nextDir)) removed.push('apps/web/.next');

// Some setups also cache under node_modules/.cache
const nmCache = path.join(webDir, 'node_modules', '.cache');
if (rm(nmCache)) removed.push('apps/web/node_modules/.cache');

if (removed.length === 0) {
  console.log('[NOOP] Nothing to remove');
} else {
  for (const r of removed) console.log(`[OK] Removed ${r}`);
}

console.log('\nNext steps:');
console.log('1) pnpm --filter @fiscalzen/web dev');
