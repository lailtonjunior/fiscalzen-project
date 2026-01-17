#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'apps', 'api', 'src', 'config', 'env.ts');
if (!fs.existsSync(file)) {
  console.log('[SKIP] apps/api/src/config/env.ts nao encontrado');
  process.exit(0);
}

let txt = fs.readFileSync(file, 'utf8');
const orig = txt;

// Heuristica: tenta inserir CERT_ENCRYPTION_KEY no zod schema.
// - Quando NODE_ENV != 'production' pode ser opcional
// - Quando producao, deve existir e ter 32 bytes (base64 ou hex)

if (!txt.includes('CERT_ENCRYPTION_KEY')) {
  // tenta achar z.object({ ... })
  const m = txt.match(/(z\.object\(\{)([\s\S]*?)(\}\)\s*;)/m);
  if (m) {
    const insert = `\n  CERT_ENCRYPTION_KEY: z.string().min(16, 'CERT_ENCRYPTION_KEY ausente/curta'),`;
    txt = txt.replace(m[0], `${m[1]}${m[2].trimEnd()}${insert}\n${m[3]}`);
  } else {
    console.log('[NOOP] Nao encontrei z.object({...}) para inserir CERT_ENCRYPTION_KEY');
  }
}

// Atualiza .env.example se existir
function ensureInEnvExample(relPath) {
  const p = path.join(process.cwd(), relPath);
  if (!fs.existsSync(p)) return;
  let e = fs.readFileSync(p, 'utf8');
  if (!e.includes('CERT_ENCRYPTION_KEY')) {
    e += `\n# Chave para criptografar certificados A1 (AES-256). Gere uma chave forte e mantenha em segredo.\nCERT_ENCRYPTION_KEY=\n`;
    fs.writeFileSync(p, e, 'utf8');
    console.log(`[PATCH] ${relPath}: CERT_ENCRYPTION_KEY adicionado`);
  }
}

ensureInEnvExample('.env.example');
ensureInEnvExample('apps/api/.env.example');

if (txt !== orig) {
  fs.writeFileSync(file, txt, 'utf8');
  console.log('[PATCH] apps/api/src/config/env.ts atualizado (CERT_ENCRYPTION_KEY)');
} else {
  console.log('[NOOP] apps/api/src/config/env.ts ja contem CERT_ENCRYPTION_KEY ou padrao nao encontrado');
}
