/**
 * Fix SEFAZ client ambiente key mismatches in service files (v4).
 *
 * Problems observed:
 * 1) Code attempted to use "production" but endpoint maps are keyed as "producao".
 * 2) Code attempted to use "homologation" but endpoint maps are keyed as "homologacao".
 *
 * This script patches ONLY these 4 files:
 *  - packages/sefaz-client/src/services/distdfe-nfe.ts
 *  - packages/sefaz-client/src/services/distdfe-cte.ts
 *  - packages/sefaz-client/src/services/mdfe-distdfe.ts
 *  - packages/sefaz-client/src/services/consulta.ts
 *
 * Replacements inside those files:
 *  - .production        -> .producao
 *  - ['production']     -> ['producao']
 *  - ["production"]     -> ["producao"]
 *  - 'production'       -> 'producao'
 *  - "production"       -> "producao"
 *
 *  - .homologation      -> .homologacao
 *  - ['homologation']   -> ['homologacao']
 *  - ["homologation"]   -> ["homologacao"]
 *  - 'homologation'     -> 'homologacao'
 *  - "homologation"     -> "homologacao"
 *
 * Usage (repo root):
 *   node tools/apply-sefaz-ambiente-fix.mjs
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

function rep(s, from, to) {
  return s.split(from).join(to);
}

function patchFile(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.error(`[SKIP] Not found: ${rel}`);
    return { rel, changed: false, reason: "not_found" };
  }

  const before = fs.readFileSync(abs, "utf8");
  let after = before;

  // production -> producao
  after = rep(after, ".production", ".producao");
  after = rep(after, "['production']", "['producao']");
  after = rep(after, '["production"]', '["producao"]');
  after = rep(after, "'production'", "'producao'");
  after = rep(after, '"production"', '"producao"');

  // homologation -> homologacao
  after = rep(after, ".homologation", ".homologacao");
  after = rep(after, "['homologation']", "['homologacao']");
  after = rep(after, '["homologation"]', '["homologacao"]');
  after = rep(after, "'homologation'", "'homologacao'");
  after = rep(after, '"homologation"', '"homologacao"');

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
