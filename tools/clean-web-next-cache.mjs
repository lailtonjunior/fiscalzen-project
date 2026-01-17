#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function rmrf(p) {
  if (!fs.existsSync(p)) return false;
  fs.rmSync(p, { recursive: true, force: true });
  return true;
}

const targets = [
  path.join(root, 'apps', 'web', '.next'),
  path.join(root, 'apps', 'web', 'node_modules', '.cache'),
  path.join(root, 'apps', 'web', '.turbo'),
];

const removed = [];
for (const t of targets) {
  if (rmrf(t)) removed.push(path.relative(root, t));
}

console.log('[OK] Cache limpo. Removidos:');
if (removed.length === 0) console.log(' - (nada para remover)');
for (const r of removed) console.log(` - ${r}`);

console.log('\nProximo passo: pnpm --filter @fiscalzen/web dev');
