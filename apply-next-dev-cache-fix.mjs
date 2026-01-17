#!/usr/bin/env node
/**
 * Ensures Next dev builds do NOT use persistent webpack pack cache.
 * This mitigates ENOENT pack.gz / middleware-manifest.json issues on Windows.
 *
 * It patches apps/web/next.config.(js|mjs|ts). If no config exists, it creates next.config.mjs.
 * Usage: node tools/apply-next-dev-cache-fix.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const webDir = path.join(root, 'apps', 'web');

const candidates = ['next.config.mjs', 'next.config.js', 'next.config.ts'];
let target = null;
for (const f of candidates) {
  const p = path.join(webDir, f);
  if (fs.existsSync(p)) {
    target = p;
    break;
  }
}

function ensurePatch(content) {
  // If already patched, NOOP
  if (content.includes('FISCALZEN_DISABLE_WEBPACK_CACHE')) return { content, changed: false };

  // Try to inject into existing "webpack" function if present.
  const hasWebpackFn = /webpack\s*\(\s*config\s*,\s*\{[^}]*dev[^}]*\}\s*\)\s*\{/.test(content);
  if (hasWebpackFn) {
    // Insert right after the start of the webpack function body.
    const patched = content.replace(
      /(webpack\s*\(\s*config\s*,\s*\{[^}]*dev[^}]*\}\s*\)\s*\{)/,
      `$1\n    // FISCALZEN_DISABLE_WEBPACK_CACHE (Windows stability): avoid pack.gz cache corruption\n    if (dev) {\n      config.cache = false;\n    }\n`
    );
    return { content: patched, changed: patched !== content };
  }

  // Otherwise, create/replace with a safe config wrapper.
  const scaffold = `/**
 * Next.js config - patched by apply-next-dev-cache-fix.mjs
 * Purpose: avoid persistent webpack cache corruption on Windows during dev.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    // FISCALZEN_DISABLE_WEBPACK_CACHE (Windows stability): avoid pack.gz cache corruption
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
`;

  return { content: scaffold, changed: true };
}

if (!target) {
  target = path.join(webDir, 'next.config.mjs');
  fs.writeFileSync(target, '', 'utf8');
}

const original = fs.readFileSync(target, 'utf8');
const res = ensurePatch(original);

if (!res.changed) {
  console.log(`[NOOP] ${path.relative(root, target)} (already_patched)`);
  process.exit(0);
}

fs.writeFileSync(target, res.content, 'utf8');
console.log(`[OK] Patched ${path.relative(root, target)}`);

console.log('\nRecommended: clear Next cache once:');
console.log('  node tools/clean-web-next-cache.mjs');
