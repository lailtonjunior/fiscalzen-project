import fs from "node:fs";
import path from "node:path";

const rel = "apps/api/src/modules/companies/routes.ts";
const abs = path.join(process.cwd(), rel);

if (!fs.existsSync(abs)) {
  console.error(`[ERROR] File not found: ${rel}`);
  process.exit(1);
}

const before = fs.readFileSync(abs, "utf8");
let after = before;

if (after.includes("companiesService.disable") && !after.includes("companiesService.delete")) {
  console.log("[NOOP] routes.ts already uses disable:", rel);
  process.exit(0);
}

// Replace companiesService.delete(...) with companiesService.disable(...)
after = after.replace(/companiesService\.delete\s*\(/g, "companiesService.disable(");

// If still contains companiesService.delete, we didn’t match patterns
if (after.includes("companiesService.delete")) {
  console.error("[ERROR] Could not replace companiesService.delete(...) in routes.ts. Please open the file and confirm the method name.");
  process.exit(1);
}

if (after === before) {
  console.log("[NOOP] No changes needed:", rel);
  process.exit(0);
}

fs.writeFileSync(abs, after, "utf8");
console.log("[OK] Patched:", rel);
console.log("DELETE /companies/:id now calls companiesService.disable(...)");
