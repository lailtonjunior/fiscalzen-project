/**
 * Patch FiscalZen API scheduler to log the real error object (stack/cause).
 *
 * Symptom:
 *   Logs show only:
 *     "Scheduler error"
 *   without any error details.
 *
 * This script:
 *   - Finds files under apps/api/src/jobs containing the string "Scheduler error"
 *   - Rewrites common logger patterns to include the error object:
 *
 *     logger.error("Scheduler error", err)
 *     logger.error("Scheduler error")
 *     logger.error(err, "Scheduler error")
 *     logger.error({ err }, "Scheduler error")
 *
 * We normalize to:
 *     logger.error({ err }, "Scheduler error")
 *
 * NOTE:
 *   This is safe for pino-compatible loggers and preserves message text.
 *
 * Usage (repo root):
 *   node tools/apply-scheduler-logging-fix.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const JOBS_DIR = path.join(ROOT, "apps", "api", "src", "jobs");

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile() && p.endsWith(".ts")) out.push(p);
  }
  return out;
}

if (!fs.existsSync(JOBS_DIR)) {
  console.error("[ERROR] jobs dir not found:", JOBS_DIR);
  process.exit(1);
}

const files = walk(JOBS_DIR);
const touched = [];

for (const abs of files) {
  const before = fs.readFileSync(abs, "utf8");
  if (!before.includes("Scheduler error")) continue;

  let after = before;

  // Pattern 1: logger.error("Scheduler error", err)
  after = after.replace(
    /\.error\(\s*(['"`]Scheduler error['"`])\s*,\s*(\w+)\s*\)/g,
    ".error({ err: $2 }, $1)"
  );

  // Pattern 2: logger.error(err, "Scheduler error")
  after = after.replace(
    /\.error\(\s*(\w+)\s*,\s*(['"`]Scheduler error['"`])\s*\)/g,
    ".error({ err: $1 }, $2)"
  );

  // Pattern 3: logger.error({ err }, "Scheduler error") or logger.error({error: err}, ...)
  // Leave as-is if already has an object with err.
  // No change.

  // Pattern 4: logger.error("Scheduler error") inside a catch(err) { ... }
  // Conservative: only patch when we can see a nearby `catch (err)` block within 10 lines.
  // We'll do a simple heuristic using a regex that spans a small window.
  after = after.replace(
    /(catch\s*\(\s*(\w+)\s*\)\s*\{[\s\S]{0,400}?\n)([ \t]*)(\w+)\.error\(\s*(['"`]Scheduler error['"`])\s*\)/g,
    "$1$3$4.error({ err: $2 }, $5)"
  );

  if (after !== before) {
    fs.writeFileSync(abs, after, "utf8");
    const rel = path.relative(ROOT, abs).replaceAll("\\", "/");
    console.log("[OK] Patched:", rel);
    touched.push(rel);
  } else {
    const rel = path.relative(ROOT, abs).replaceAll("\\", "/");
    console.log("[NOOP] Found but patterns not matched:", rel);
  }
}

console.log("\nSummary:");
console.log(JSON.stringify({ patched: touched }, null, 2));
console.log("\nNext step: re-run `pnpm dev` and capture the Scheduler error log again (it should now include stack/cause).");
