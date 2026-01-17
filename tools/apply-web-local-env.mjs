#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'apps', 'web', '.env.local');
const desired = 'NEXT_PUBLIC_API_URL=http://localhost:3001';

let txt = '';
if (fs.existsSync(file)) {
  txt = fs.readFileSync(file, 'utf8');
}

if (txt.includes('NEXT_PUBLIC_API_URL=')) {
  const next = txt.replace(/^NEXT_PUBLIC_API_URL=.*$/m, desired);
  if (next !== txt) {
    fs.writeFileSync(file, next, 'utf8');
    console.log('[OK] Atualizado apps/web/.env.local NEXT_PUBLIC_API_URL');
  } else {
    console.log('[NOOP] apps/web/.env.local NEXT_PUBLIC_API_URL ja ok');
  }
} else {
  const prefix = txt && !txt.endsWith('\n') ? '\n' : '';
  const next = txt + prefix + desired + '\n';
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, next, 'utf8');
  console.log('[OK] Criado apps/web/.env.local com NEXT_PUBLIC_API_URL');
}
