import fs from "node:fs";
import path from "node:path";

const rel = "apps/api/src/config/env.ts";
const abs = path.join(process.cwd(), rel);

if (!fs.existsSync(abs)) {
  console.error(`[ERROR] File not found: ${rel}`);
  process.exit(1);
}

const before = fs.readFileSync(abs, "utf8");
let after = before;

if (/CERT_ENCRYPTION_KEY\s*:/m.test(after)) {
  console.log("[NOOP] CERT_ENCRYPTION_KEY already present:", rel);
  process.exit(0);
}

// Ensure Buffer is referenced safely (node env)
if (!/Buffer\.from\(/.test(after)) {
  // no-op; we will add refine with Buffer usage anyway
}

// Find the first z.object({ ... }) and inject key inside object literal
const marker = "z.object(";
const idx = after.indexOf(marker);
if (idx === -1) {
  console.error("[ERROR] Could not find z.object(...) schema in env.ts");
  process.exit(1);
}

const openBrace = after.indexOf("{", idx);
if (openBrace === -1) {
  console.error("[ERROR] Could not find '{' after z.object in env.ts");
  process.exit(1);
}

// naive brace matching for the object literal inside z.object({ ... })
let i = openBrace;
let depth = 0;
let end = -1;
for (; i < after.length; i++) {
  const ch = after[i];
  if (ch === "{") depth++;
  if (ch === "}") {
    depth--;
    if (depth === 0) {
      end = i;
      break;
    }
  }
}
if (end === -1) {
  console.error("[ERROR] Could not match closing '}' of env schema object.");
  process.exit(1);
}

const injection = `
  // ===========================================
  // Certificate encryption (A1 PFX)
  // 32 bytes key required (base64 -> 32 bytes OR hex 64 chars)
  // ===========================================
  CERT_ENCRYPTION_KEY: z
    .string()
    .min(1, 'CERT_ENCRYPTION_KEY é obrigatório')
    .refine((v) => {
      // Accept HEX(64) or BASE64(32 bytes)
      const isHex = /^[0-9a-fA-F]{64}$/.test(v);
      if (isHex) return true;
      try {
        const buf = Buffer.from(v, 'base64');
        return buf.length === 32;
      } catch {
        return false;
      }
    }, 'CERT_ENCRYPTION_KEY deve ser 32 bytes (base64) ou 64 chars hex'),
`;

after = after.slice(0, end) + injection + after.slice(end);

// Ensure z import exists (most env.ts has it)
if (!/from\s+['"]zod['"]/.test(after)) {
  console.error("[ERROR] This env.ts does not import z from zod; cannot safely patch.");
  process.exit(1);
}

if (after === before) {
  console.log("[NOOP] No changes applied:", rel);
  process.exit(0);
}

fs.writeFileSync(abs, after, "utf8");
console.log("[OK] Patched:", rel);
console.log("Next: add CERT_ENCRYPTION_KEY to your env (.env / apps/api/.env).");
