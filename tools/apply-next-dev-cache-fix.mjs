#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const candidates = [
  path.join(root, 'apps', 'web', 'next.config.js'),
  path.join(root, 'apps', 'web', 'next.config.mjs'),
  path.join(root, 'apps', 'web', 'next.config.ts'),
];

const file = candidates.find((p) => fs.existsSync(p));
if (!file) {
  console.log('[SKIP] next.config.* nao encontrado em apps/web.');
  process.exit(0);
}

let src = fs.readFileSync(file, 'utf8');
if (src.includes('cfg.cache = false') || src.includes('config.cache = false')) {
  console.log('[NOOP] next.config ja contem desabilitacao de cache webpack em dev.');
  process.exit(0);
}

// Heuristica: adicionar um hook webpack que desabilita cache em dev.
// Funciona bem para o caso mais comum: export default nextConfig;
const insertion = `
  webpack: (config, { dev }) => {
    if (dev) {
      // Mitiga erros intermitentes no Windows (ENOENT em .next/cache/webpack)
      config.cache = false;
    }
    return config;
  },
`;

function patchObjectExportDefault(text) {
  // Tenta localizar: const nextConfig = { ... };
  const m = text.match(/const\s+nextConfig\s*=\s*\{[\s\S]*?\n\};/m);
  if (!m) return null;
  const block = m[0];
  if (/webpack\s*:\s*\(/.test(block)) return null;
  const idx = block.lastIndexOf('}');
  if (idx === -1) return null;
  const patched = block.slice(0, idx) + insertion + block.slice(idx);
  return text.replace(block, patched);
}

function patchModuleExports(text) {
  // module.exports = { ... };
  const m = text.match(/module\.exports\s*=\s*\{[\s\S]*?\n\};/m);
  if (!m) return null;
  const block = m[0];
  if (/webpack\s*:\s*\(/.test(block)) return null;
  const idx = block.lastIndexOf('}');
  if (idx === -1) return null;
  const patched = block.slice(0, idx) + insertion + block.slice(idx);
  return text.replace(block, patched);
}

let out = patchObjectExportDefault(src) ?? patchModuleExports(src);
if (!out) {
  console.log('[WARN] Nao consegui aplicar patch automaticamente no next.config.* (formato nao reconhecido).');
  console.log('Sugestao: adicione manualmente um webpack() que define config.cache = false quando dev=true.');
  process.exit(0);
}

fs.writeFileSync(file, out, 'utf8');
console.log(`[OK] Patch aplicado em ${path.relative(root, file)} (webpack cache desabilitado no dev).`);
console.log('Proximo passo: node tools/clean-web-next-cache.mjs && pnpm --filter @fiscalzen/web dev');
