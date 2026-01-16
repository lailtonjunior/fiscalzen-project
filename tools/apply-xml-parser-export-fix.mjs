/**
 * Fix runtime ESM import error:
 *   SyntaxError: '@fiscalzen/xml-parser' does not provide an export named 'detectXmlType'
 *
 * Root cause:
 *   The xml-parser package exports `detectDocumentType` (and/or similar),
 *   while apps/api imports `detectXmlType`.
 *
 * Minimal safe fix:
 *   Keep the existing identifier used by the job code (`detectXmlType`) but
 *   import it as an alias from the real export:
 *
 *     import { detectDocumentType as detectXmlType } from '@fiscalzen/xml-parser';
 *
 * This script patches ONLY:
 *   apps/api/src/jobs/xml-processor.ts
 *
 * Usage (repo root):
 *   node tools/apply-xml-parser-export-fix.mjs
 */
import fs from "node:fs";
import path from "node:path";

const target = "apps/api/src/jobs/xml-processor.ts";
const root = process.cwd();
const abs = path.join(root, target);

if (!fs.existsSync(abs)) {
  console.error(`[ERROR] File not found: ${target}`);
  process.exit(1);
}

const before = fs.readFileSync(abs, "utf8");
let after = before;

// Patch import list: `detectXmlType` -> `detectDocumentType as detectXmlType`
const importRe = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]@fiscalzen\/xml-parser['"]\s*;?/m;
const m = after.match(importRe);

if (!m) {
  console.error(
    "[ERROR] Could not find an import from '@fiscalzen/xml-parser' in apps/api/src/jobs/xml-processor.ts"
  );
  process.exit(1);
}

const importList = m[1];

// Only patch if detectXmlType is present and alias not already applied.
if (importList.includes("detectDocumentType as detectXmlType")) {
  console.log("[NOOP] Alias already present. No changes made.");
  process.exit(0);
}

if (!importList.includes("detectXmlType")) {
  console.log("[NOOP] detectXmlType not found in xml-parser import. No changes made.");
  process.exit(0);
}

// Replace detectXmlType token in the import list (preserving commas/spaces).
const patchedList = importList.replace(
  /\bdetectXmlType\b/g,
  "detectDocumentType as detectXmlType"
);

after = after.replace(importRe, (full, _list) => full.replace(importList, patchedList));

if (after === before) {
  console.log("[NOOP] No changes needed.");
  process.exit(0);
}

fs.writeFileSync(abs, after, "utf8");
console.log(`[OK] Patched: ${target}`);
