#!/usr/bin/env node
/*
apply-auth-dev-ids-fix.mjs

Fixes common DEV auth issues:
- DEV auth bypass was setting tenantId/sub to non-UUID values (e.g. "dev-tenant"),
  which breaks DB queries expecting UUID.
- JwtPayload interface mistakenly used runtime expressions as types.

This script patches: apps/api/src/plugins/auth.ts
*/

import fs from 'node:fs';
import path from 'node:path';

const rel = path.join('apps', 'api', 'src', 'plugins', 'auth.ts');

function die(msg) {
  console.error(msg);
  process.exit(1);
}

if (!fs.existsSync(rel)) {
  die(`[FAIL] File not found: ${rel}`);
}

let s = fs.readFileSync(rel, 'utf8');
let changed = false;

// 1) Fix JwtPayload interface (make fields proper types)
const ifaceRe = /export\s+interface\s+JwtPayload\s*\{[\s\S]*?\n\}/m;
if (ifaceRe.test(s)) {
  const nextIface = `export interface JwtPayload {\n  sub: string;\n  tenantId: string;\n  email: string;\n  role: 'admin' | 'user' | 'viewer';\n  iat?: number;\n  exp?: number;\n}`;
  const before = s;
  s = s.replace(ifaceRe, nextIface);
  if (s !== before) changed = true;
} else {
  console.warn('[WARN] JwtPayload interface block not found. Skipping interface patch.');
}

// 2) Fix DEV bypass user payload (must be UUIDs)
const bypassStart = "if (process.env.NODE_ENV !== 'production' && process.env.DISABLE_AUTH === 'true')";
if (s.includes(bypassStart)) {
  // Replace the object assigned to request.user inside the bypass block.
  // We look for `(request as any).user = { ... };` within that block.
  const blockRe = new RegExp(
    "(" +
      "if\\s*\\(process\\.env\\.NODE_ENV\\s*!==\\s*'production'\\s*&&\\s*process\\.env\\.DISABLE_AUTH\\s*===\\s*'true'\\)\\s*\\{[\\s\\S]*?" +
      "\\(request\\s+as\\s+any\\)\\.user\\s*=\\s*\\{[\\s\\S]*?\\}\\s*;" +
      "[\\s\\S]*?\\n\\s*return;[\\s\\S]*?\\n\\s*\\}" +
    ")",
    'm'
  );

  if (blockRe.test(s)) {
    const newUserObj =
      "(request as any).user = {\n" +
      "        sub: process.env.DEV_USER_ID ?? '00000000-0000-0000-0000-000000000001',\n" +
      "        tenantId: process.env.DEV_TENANT_ID ?? '00000000-0000-0000-0000-000000000000',\n" +
      "        email: process.env.DEV_USER_EMAIL ?? 'dev@local',\n" +
      "        role: 'admin',\n" +
      "      };";

    const before = s;
    s = s.replace(
      /\(request\s+as\s+any\)\.user\s*=\s*\{[\s\S]*?\}\s*;/m,
      newUserObj
    );
    if (s !== before) changed = true;
  } else {
    console.warn('[WARN] DEV bypass block found but pattern did not match. Skipping bypass patch.');
  }
} else {
  console.warn('[WARN] DEV bypass not found. Skipping bypass patch.');
}

if (!changed) {
  console.log('[NOOP] auth.ts (no changes needed or patterns not found)');
  process.exit(0);
}

fs.writeFileSync(rel, s, 'utf8');
console.log(`[OK] Patched ${rel}`);
console.log('Next: restart the API: pnpm --filter @fiscalzen/api dev');
