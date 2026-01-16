/**
 * Apply SEFAZ client "production" -> "producao" environment key fix (v3).
 *
 * Why:
 *  TS errors indicate endpoint maps are keyed as:
 *    { producao, homologacao }
 *  but the service code is generating/using the string key "production".
 *
 * What this script does (ONLY in the 4 service files):
 *  - .production           -> .producao
 *  - ['production']        -> ['producao']
 *  - ["production"]        -> ["producao"]
 *  - 'production'          -> 'producao'
 *  - "production"          -> "producao"
 *
 * This is intentionally scoped to the SEFAZ service files to avoid touching
 * unrelated Node env checks elsewhere in the repo.
 *
 * Usage (from repo root):
 *   node tools/apply-sefaz-producao-fix.mjs
 */
import fs from "node:fs";
import path from "node:path";

const targets = [
  "packages/sefaz-client/src/services/distdfe-nfe.ts",
  "packages/sefaz-client/src/services/distdfe-cte.ts",
  "packages/sefaz-client/src/services/mdfe-distdfe.ts",
  "packages/sefaz-client/src/services/consulta.ts",
];

const root = process.cwd();

function replaceAllSafe(input, find, repl) {
  return input.split(find).join(repl);
}

function patchFile(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.error(`[SKIP] Not found: ${rel}`);
    return { rel, changed: false, reason: "not_found" };
  }

  const before = fs.readFileSync(abs, "utf8");
  let after = before;

  after = replaceAllSafe(after, ".production", ".producao");
  after = replaceAllSafe(after, "['production']", "['producao']");
  after = replaceAllSafe(after, '["production"]', '["producao"]');

  // Also replace string literals used for ambiente selection in these service files.
  after = replaceAllSafe(after, "'production'", "'producao'");
  after = replaceAllSafe(after, '"production"', '"producao"');

  const changed = after !== before;
  if (changed) {
    fs.writeFileSync(abs, after, "utf8");
    console.log(`[OK] Patched: ${rel}`);
  } else {
    console.log(`[NOOP] No changes needed: ${rel}`);
  }
  return { rel, changed };
}

const results = targets.map(patchFile);

const patched = results.filter((r) => r.changed).map((r) => r.rel);
const skipped = results.filter((r) => r.reason === "not_found").map((r) => r.rel);
const noop = results.filter((r) => !r.changed && !r.reason).map((r) => r.rel);

console.log("\nSummary:");
console.log(JSON.stringify({ patched, skipped, noop }, null, 2));
