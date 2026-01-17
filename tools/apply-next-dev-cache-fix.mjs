#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const appWeb = path.join(process.cwd(), 'apps', 'web');

const candidates = [
  'next.config.mjs',
  'next.config.js',
  'next.config.cjs',
  'next.config.ts',
];

let configPath = null;
for (const f of candidates) {
  const p = path.join(appWeb, f);
  if (existsSync(p)) {
    configPath = p;
    break;
  }
}

const webpackBlock = `  webpack(config, { dev }) {\n    // DEV only: disable webpack persistent cache (Windows ENOENT pack.gz / middleware-manifest issues)\n    if (dev) {\n      config.cache = false;\n    }\n    return config;\n  },`;

function patchObjectLiteral(src, marker) {
  const idx = src.indexOf(marker);
  if (idx === -1) return { patched: false, out: src, reason: 'marker_not_found' };
  // Insert after the marker line
  const lineEnd = src.indexOf('\n', idx);
  const insertPos = lineEnd === -1 ? src.length : lineEnd + 1;
  const before = src.slice(0, insertPos);
  const after = src.slice(insertPos);
  return { patched: true, out: before + webpackBlock + '\n' + after, reason: 'injected_webpack_block' };
}

try {
  if (!configPath) {
    const p = path.join(appWeb, 'next.config.mjs');
    const content = `/** @type {import('next').NextConfig} */\nconst nextConfig = {\n${webpackBlock}\n};\n\nexport default nextConfig;\n`;
    writeFileSync(p, content, 'utf8');
    console.log(`[OK] Created ${path.relative(process.cwd(), p)} with DEV cache fix`);
    process.exit(0);
  }

  let src = readFileSync(configPath, 'utf8');

  if (src.includes('config.cache = false') || src.includes('webpack(config')) {
    console.log(`[NOOP] ${path.relative(process.cwd(), configPath)} already has a webpack cache tweak`);
    process.exit(0);
  }

  let res = patchObjectLiteral(src, 'export default {');
  if (!res.patched) {
    res = patchObjectLiteral(src, 'module.exports = {');
  }

  if (!res.patched) {
    console.error(`[FAIL] Could not patch ${path.relative(process.cwd(), configPath)} automatically.`);
    console.error('Reason: export default { } or module.exports = { } not found in a simple form.');
    console.error('Please add this inside your next config object:\n' + webpackBlock);
    process.exit(1);
  }

  writeFileSync(configPath, res.out, 'utf8');
  console.log(`[OK] Patched ${path.relative(process.cwd(), configPath)}: ${res.reason}`);
} catch (err) {
  console.error('[ERROR] apply-next-dev-cache-fix failed');
  console.error(err?.message ?? err);
  process.exit(1);
}
Sync(p)) {
    configPath = p;
    break;
  }
}

const injection = `
  // DEV (Windows): disable webpack persistent cache to avoid ENOENT/middleware-manifest issues
  webpack(config, { dev }) {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
`;

function patchObjectExport(src, marker) {
  const idx = src.indexOf(marker);
  if (idx === -1) return null;
  const insertPos = idx + marker.length;
  return src.slice(0, insertPos) + injection + src.slice(insertPos);
}

try {
  if (!configPath) {
    // Create minimal config (safe default)
    const newPath = path.join(appWeb, 'next.config.mjs');
    const newContent = `/** @type {import('next').NextConfig} */\nexport default {\n${injection}\n};\n`;
    writeFileSync(newPath, newContent, 'utf8');
    console.log(`[OK] Created ${path.relative(process.cwd(), newPath)}`);
    process.exit(0);
  }

  let src = readFileSync(configPath, 'utf8');
  if (src.includes('config.cache = false') || src.includes('webpack(config, { dev })') || src.includes('webpack(config,{ dev })')) {
    console.log(`[NOOP] ${path.relative(process.cwd(), configPath)} already patched`);
    process.exit(0);
  }

  let patched = patchObjectExport(src, 'export default {');
  if (!patched) patched = patchObjectExport(src, 'module.exports = {');

  if (!patched) {
    console.log(`[NOOP] Could not find object export in ${path.relative(process.cwd(), configPath)}. Please add manually.`);
    process.exit(0);
  }

  // Basic safety: keep original formatting newline
  writeFileSync(configPath, patched, 'utf8');
  console.log(`[OK] Patched ${path.relative(process.cwd(), configPath)} (disabled webpack cache in dev)`);
} catch (err) {
  console.error('[FAIL] apply-next-dev-cache-fix failed');
  console.error(err?.message ?? err);
  process.exit(1);
}
  const insertAt = idx + marker.length;
  return src.slice(0, insertAt) + injection + src.slice(insertAt);
}

try {
  if (!configPath) {
    // Create minimal config
    const newPath = path.join(appWeb, 'next.config.mjs');
    const content = `/** @type {import('next').NextConfig} */\nexport default {\n${injection}\n};\n`;
    writeFileSync(newPath, content, 'utf8');
    console.log(`[OK] Created ${path.relative(process.cwd(), newPath)}`);
    process.exit(0);
  }

  const rel = path.relative(process.cwd(), configPath);
  let src = readFileSync(configPath, 'utf8');

  if (src.includes('config.cache = false') || src.includes('webpack(config, { dev })') || src.includes('webpack(config,{ dev })')) {
    console.log(`[NOOP] ${rel} already contains a DEV webpack cache override`);
    process.exit(0);
  }

  let patched = null;

  // ESM export default object
  patched = patchObjectExport(src, 'export default {');
  if (!patched) patched = patchObjectExport(src, 'module.exports = {');

  if (!patched) {
    console.error(`[FAIL] Could not patch ${rel}. Unknown export style.`);
    console.error('Please add the following block inside your Next config object:');
    console.error(injection);
    process.exit(1);
  }

  writeFileSync(configPath, patched, 'utf8');
  console.log(`[OK] Patched ${rel}`);
} catch (err) {
  console.error('[ERROR] apply-next-dev-cache-fix failed');
  console.error(err?.message ?? err);
  process.exit(1);
}
.log(`[OK] Created ${path.relative(process.cwd(), newPath)} (webpack cache disabled in dev)`);
    process.exit(0);
  }

  const rel = path.relative(process.cwd(), configPath);
  const src = readFileSync(configPath, 'utf8');

  if (src.includes('config.cache = false') || src.includes('webpack(config')) {
    console.log(`[NOOP] ${rel} (already has webpack cache override)`);
    process.exit(0);
  }

  let patched = patchObjectExport(src, 'export default {');
  if (!patched) patched = patchObjectExport(src, 'module.exports = {');

  if (!patched) {
    console.error(`[NOOP] ${rel} - Could not find a simple config export to patch.`);
    console.error('Add this manually inside your Next config object:');
    console.error(injection);
    process.exit(1);
  }

  writeFileSync(configPath, patched, 'utf8');
  console.log(`[OK] Patched ${rel} (disabled webpack cache in dev)`);
} catch (err) {
  console.error('[ERROR] Failed to apply Next dev cache fix');
  console.error(err?.message ?? err);
  process.exit(1);
}
    process.exit(0);
  }

  let patched = null;

  // ESM style
  patched = patchObjectExport(src, 'export default {');
  if (!patched) patched = patchObjectExport(src, 'module.exports = {');

  if (!patched) {
    console.error(`[FAIL] ${rel}: unsupported next.config format. Please add manually:`);
    console.error(injection.trim());
    process.exit(1);
  }

  writeFileSync(configPath, patched, 'utf8');
  console.log(`[OK] Patched ${rel}: disabled webpack persistent cache in dev`);
} catch (err) {
  console.error('[ERROR] apply-next-dev-cache-fix failed');
  console.error(err?.message ?? err);
  process.exit(1);
}
  writeFileSync(configPath, patched, 'utf8');
  console.log(`[OK] Patched ${rel} (webpack cache disabled in dev)`);
} catch (err) {
  console.error('[ERROR] apply-next-dev-cache-fix failed');
  console.error(err?.message ?? err);
  process.exit(1);
}
