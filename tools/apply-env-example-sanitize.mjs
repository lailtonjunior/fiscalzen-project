import fs from "node:fs";
import path from "node:path";

const candidates = [".env.example", "apps/api/.env.example", "apps/web/.env.example"];
const root = process.cwd();

function patchFile(fileRel) {
  const abs = path.join(root, fileRel);
  if (!fs.existsSync(abs)) return false;

  const before = fs.readFileSync(abs, "utf8");
  let after = before;

  // Add CERT_ENCRYPTION_KEY if not present
  if (!/^CERT_ENCRYPTION_KEY=/m.test(after)) {
    after += `

# ===========================================
# Certificate encryption (A1 PFX)
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# ===========================================
CERT_ENCRYPTION_KEY=
`;
  }

  // Sanitize common secret keys (keep keys, blank values)
  const keysToBlank = [
    "JWT_SECRET",
    "AGENT_TOKEN_SECRET",
    "S3_ACCESS_KEY",
    "S3_SECRET_KEY",
    "MEILISEARCH_API_KEY",
    "CLERK_SECRET_KEY",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  ];

  for (const k of keysToBlank) {
    const re = new RegExp(`^${k}=.*$`, "gm");
    after = after.replace(re, `${k}=`);
  }

  if (after === before) {
    console.log("[NOOP]", fileRel);
    return true;
  }

  fs.writeFileSync(abs, after, "utf8");
  console.log("[OK] Patched:", fileRel);
  return true;
}

let patchedAny = false;
for (const rel of candidates) {
  const ok = patchFile(rel);
  if (ok) patchedAny = true;
}

if (!patchedAny) {
  console.error("[ERROR] Could not find any .env.example to patch (searched root and apps/*).");
  process.exit(1);
}
