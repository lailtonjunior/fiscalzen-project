import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const targetRel = 'apps/api/src/jobs/events.ts';
const targetAbs = path.join(ROOT, targetRel);

function fail(msg) {
  console.error(`[FAIL] ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(targetAbs)) {
  fail(`Arquivo nao encontrado: ${targetRel}`);
}

let src = fs.readFileSync(targetAbs, 'utf8');

// If logger already exported, nothing to do.
if (/export\s+(const|let|var)\s+logger\b/.test(src) || /export\s*\{[^}]*\blogger\b[^}]*\}/.test(src)) {
  console.log(`[NOOP] ${targetRel} (logger ja exportado)`);
  process.exit(0);
}

// Ensure we have a pino import we can use.
const hasPinoImport = /from\s+['"]pino['"]/.test(src);

// Find insertion point after the last import block.
const lines = src.split(/\r?\n/);
let insertAt = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/^\s*import\b/.test(line) || /^\s*export\s+\{\s*\}\s*from\b/.test(line)) {
    insertAt = i + 1;
    continue;
  }
  // Allow blank lines between imports
  if (insertAt > 0 && /^\s*$/.test(line)) {
    insertAt = i + 1;
    continue;
  }
  break;
}

const patchLines = [];
if (!hasPinoImport) {
  patchLines.push("import pino from 'pino';");
}
patchLines.push("export const logger = pino({ name: 'fiscalzen-jobs' });");
patchLines.push('');

lines.splice(insertAt, 0, ...patchLines);
const out = lines.join('\n');

fs.writeFileSync(targetAbs, out, 'utf8');
console.log(`[OK] ${targetRel} (export logger adicionado)`);

console.log('\nNext steps:');
console.log('1) Reinicie o API: pnpm --filter @fiscalzen/api dev');
console.log('2) Teste: node tools/check-api-health.mjs');
