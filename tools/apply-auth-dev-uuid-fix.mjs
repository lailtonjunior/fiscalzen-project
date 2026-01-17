#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const target = path.join(process.cwd(), 'apps', 'api', 'src', 'plugins', 'auth.ts');
if (!fs.existsSync(target)) {
  console.log('[SKIP] apps/api/src/plugins/auth.ts nao encontrado');
  process.exit(0);
}

let txt = fs.readFileSync(target, 'utf8');
const orig = txt;

// 1) Corrige interface JwtPayload (nao pode ter valores em runtime dentro da interface)
//    sub/tenantId devem ser string.
txt = txt.replace(/export\s+interface\s+JwtPayload\s*\{[\s\S]*?\n\}/m, (block) => {
  let b = block;
  b = b.replace(/^[\t ]*sub\s*:\s*[^;\n]+;?/m, '  sub: string;');
  b = b.replace(/^[\t ]*tenantId\s*:\s*[^;\n]+;?/m, '  tenantId: string;');
  b = b.replace(/^[\t ]*email\s*:\s*string\s*;?/m, '  email?: string;');
  return b;
});

// 2) DEV BYPASS: garantir UUIDs validos (evita erro uuid: "dev-tenant")
const DEV_TENANT = process.env.DEV_TENANT_ID || '00000000-0000-0000-0000-000000000000';
const DEV_USER = process.env.DEV_USER_ID || '00000000-0000-0000-0000-000000000001';

txt = txt.replace(/\(request\s+as\s+any\)\.user\s*=\s*\{[\s\S]*?\};/m, () => {
  return `(request as any).user = {\n        sub: process.env.DEV_USER_ID ?? '${DEV_USER}',\n        tenantId: process.env.DEV_TENANT_ID ?? '${DEV_TENANT}',\n        email: process.env.DEV_USER_EMAIL ?? 'dev@local',\n        role: 'admin',\n      };`;
});

if (txt === orig) {
  console.log('[NOOP] auth.ts (nenhuma alteracao aplicada)');
  process.exit(0);
}

fs.writeFileSync(target, txt, 'utf8');
console.log('[OK] Patched apps/api/src/plugins/auth.ts (DEV UUID + tipos JwtPayload)');
