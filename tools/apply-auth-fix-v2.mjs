/**
 * DEV Auth bypass for FiscalZen API
 *
 * Patch file:
 *   apps/api/src/plugins/auth.ts
 *
 * What it does:
 * - Injects a DEV bypass inside the authenticate decorator, controlled by:
 *     DISABLE_AUTH=true
 *   and only when NODE_ENV !== 'production'
 *
 * Usage:
 *   node tools/apply-auth-fix-v2.mjs
 *
 * Then set (DEV only):
 *   DISABLE_AUTH=true
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const rel = "apps/api/src/plugins/auth.ts";
const abs = path.join(ROOT, rel);

if (!fs.existsSync(abs)) {
  console.error("[ERROR] File not found:", rel);
  process.exit(1);
}

const before = fs.readFileSync(abs, "utf8");
let after = before;

const markerSingle = "fastify.decorate('authenticate'";
const markerDouble = 'fastify.decorate("authenticate"';

let markerIndex = after.indexOf(markerSingle);
if (markerIndex === -1) markerIndex = after.indexOf(markerDouble);

if (markerIndex === -1) {
  console.error("[ERROR] Could not find authenticate decorator in:", rel);
  console.error("Searched for fastify.decorate('authenticate' / \"authenticate\")");
  process.exit(1);
}

// Find the first "{" after the decorator marker (function body start)
const braceIndex = after.indexOf("{", markerIndex);
if (braceIndex === -1) {
  console.error("[ERROR] Could not find function body '{' after authenticate decorator in:", rel);
  process.exit(1);
}

const bypassSnippet =
  "\n    // DEV ONLY: optional auth bypass (never enable in production)\n" +
  "    if (process.env.NODE_ENV !== 'production' && process.env.DISABLE_AUTH === 'true') {\n" +
  "      // Minimal dev user payload used by downstream code\n" +
  "      (request as any).user = {\n" +
  "        sub: 'dev-user',\n" +
  "        tenantId: 'dev-tenant',\n" +
  "        role: 'admin',\n" +
  "      };\n" +
  "      return;\n" +
  "    }\n";

if (after.includes("process.env.DISABLE_AUTH") && after.includes("DEV ONLY: optional auth bypass")) {
  console.log("[NOOP] Bypass already present in auth.ts");
  process.exit(0);
}

// Inject right after the opening brace of authenticate function
after = after.slice(0, braceIndex + 1) + bypassSnippet + after.slice(braceIndex + 1);

if (after === before) {
  console.log("[NOOP] No changes applied.");
  process.exit(0);
}

fs.writeFileSync(abs, after, "utf8");
console.log("[OK] Patched:", rel);
console.log("Next: set DISABLE_AUTH=true in apps/api/.env (DEV only) and restart pnpm dev.");
