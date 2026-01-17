/**
 * FiscalZen Fix v1:
 * - DEV auth bypass (optional) to avoid 401 while wiring real login.
 * - Manifestacao compatibility routes required by web dashboard:
 *     GET /api/v1/manifestacao/count
 *     GET /api/v1/manifestacao/pending
 *
 * Why:
 * - Frontend currently does not set a backend JWT, so protected endpoints return 401.
 * - Web calls manifestacao/count + manifestacao/pending, but backend doesn't expose them (404).
 *
 * What this script does:
 * 1) apps/api/src/plugins/auth.ts
 *    Adds DEV-only bypass when DISABLE_AUTH=true:
 *      - sets request.user to an admin "dev" user
 *      - skips jwtVerify
 *
 * 2) apps/api/src/app.ts
 *    Registers small compat routes under /api/v1/manifestacao
 *    returning safe defaults.
 *
 * Apply from repo root:
 *   node tools/apply-auth-manifestacao-fix.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function read(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${rel}`);
  return { rel, abs, text: fs.readFileSync(abs, 'utf8') };
}

function write(file, text) {
  fs.writeFileSync(file.abs, text, 'utf8');
}

function patchAuth() {
  const file = read('apps/api/src/plugins/auth.ts');
  let out = file.text;

  if (!out.includes('DISABLE_AUTH')) {
    // Insert authDisabled const after fastifyJwt registration.
    // We target the line right after register(fastifyJwt, ...);
    const markerRe = /await\s+fastify\.register\(fastifyJwt,[\s\S]*?\);\s*/m;
    const m = out.match(markerRe);
    if (!m) {
      console.warn('[NOOP] auth.ts: could not find fastifyJwt registration block to inject authDisabled');
      return { rel: file.rel, status: 'noop', reason: 'pattern_not_found' };
    }

    const inject = `${m[0]}\n  // DEV helper: allow running the system without a JWT while wiring real auth.\n  // Enable ONLY in development by setting DISABLE_AUTH=true in apps/api/.env\n  const authDisabled = env.NODE_ENV === 'development' && process.env.DISABLE_AUTH === 'true';\n\n`;
    out = out.replace(markerRe, inject);
  }

  // Patch authenticate decorator to bypass when authDisabled
  if (!out.includes('if (authDisabled)')) {
    const authDecRe = /fastify\.decorate\('authenticate',[\s\S]*?=>\s*\{([\s\S]*?)\n\s*\}\);/m;
    const mm = out.match(authDecRe);
    if (!mm) {
      console.warn('[NOOP] auth.ts: could not find authenticate decorator block');
      return { rel: file.rel, status: 'noop', reason: 'decorate_authenticate_not_found' };
    }

    // Insert at the start of the decorator function body.
    out = out.replace(
      /fastify\.decorate\('authenticate',\s*async\s*function\s*\(\s*request:\s*FastifyRequest,\s*reply:\s*FastifyReply\s*\)\s*\{\s*/m,
      (s) => `${s}    if (authDisabled) {\n      // Minimal user context for local development.\n      // IMPORTANT: this bypass must never be enabled in production.\n      (request as any).user = {\n        sub: 'dev',\n        tenantId: 'dev',\n        email: 'dev@local',\n        role: 'admin',\n      };\n      return;\n    }\n\n`
    );
  }

  if (out === file.text) {
    return { rel: file.rel, status: 'noop', reason: 'already_patched' };
  }

  write(file, out);
  return { rel: file.rel, status: 'patched', reason: 'dev_auth_bypass_added' };
}

function patchApp() {
  const file = read('apps/api/src/app.ts');
  let out = file.text;

  if (out.includes('manifestacaoCompatRoutes')) {
    return { rel: file.rel, status: 'noop', reason: 'already_patched' };
  }

  // Find where manifestacaoRoutes is registered and insert compat plugin right after.
  const insertAfter = "await api.register(manifestacaoRoutes, { prefix: '/manifestacao' });";
  if (!out.includes(insertAfter)) {
    console.warn('[NOOP] app.ts: could not find manifestacaoRoutes registration line');
    return { rel: file.rel, status: 'noop', reason: 'manifestacao_register_not_found' };
  }

  const compat = `\n\n      // Compatibility routes expected by the web dashboard.\n      // If the real manifestacao module does not expose these endpoints yet,\n      // we provide safe defaults so the UI can render.\n      // NOTE: Once manifestacaoRoutes implements these, remove this block to avoid duplicate route errors.\n      await api.register(async function manifestacaoCompatRoutes(m) {\n        // Require auth (or DEV bypass if DISABLE_AUTH=true)\n        m.get('/count', { preHandler: [m.authenticate] }, async () => ({\n          success: true,\n          data: { count: 0 },\n        }));\n\n        m.get('/pending', { preHandler: [m.authenticate] }, async () => ({\n          success: true,\n          data: [],\n        }));\n      }, { prefix: '/manifestacao' });\n`;

  out = out.replace(insertAfter, insertAfter + compat);

  if (out === file.text) {
    return { rel: file.rel, status: 'noop', reason: 'no_change' };
  }

  write(file, out);
  return { rel: file.rel, status: 'patched', reason: 'manifestacao_compat_routes_added' };
}

const results = [];
try {
  results.push(patchAuth());
  results.push(patchApp());
} catch (err) {
  console.error('[ERROR]', err?.message ?? err);
  process.exit(1);
}

console.log('\nSummary:');
console.log(JSON.stringify(results, null, 2));

console.log('\nNext steps:');
console.log('1) (DEV only) Add to apps/api/.env: DISABLE_AUTH=true  (to bypass JWT until real login is wired)');
console.log('2) Restart pnpm dev');
console.log('3) Dashboard endpoints should return 200, and manifestacao endpoints return defaults instead of 404.');
