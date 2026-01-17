import fs from "node:fs";
import path from "node:path";

const rel = "apps/api/src/plugins/auth.ts";
const abs = path.join(process.cwd(), rel);

if (!fs.existsSync(abs)) {
  console.error(`[ERROR] File not found: ${rel}`);
  process.exit(1);
}

const before = fs.readFileSync(abs, "utf8");
let after = before;

// 1) Fix JwtPayload interface (remove runtime process.env inside type)
after = after.replace(
  /export\s+interface\s+JwtPayload\s*{[\s\S]*?}\s*/m,
  `export interface JwtPayload {
  sub: string;
  tenantId: string;
  email?: string;
  role: 'admin' | 'user' | 'viewer';
  iat?: number;
  exp?: number;
}
`
);

// 2) Replace DEV bypass block to use UUIDs from env + valid defaults
const devBypassRegex =
  /\/\/ DEV ONLY: optional auth bypass[\s\S]*?\(request\s+as\s+any\)\.user\s*=\s*{[\s\S]*?}\s*;[\s\S]*?return;\s*}\s*/m;

const devBypassReplacement = `// DEV ONLY: optional auth bypass (never enable in production)
    if (process.env.NODE_ENV !== 'production' && process.env.DISABLE_AUTH === 'true') {
      (request as any).user = {
        sub: process.env.DEV_USER_ID ?? '00000000-0000-0000-0000-000000000001',
        tenantId: process.env.DEV_TENANT_ID ?? '00000000-0000-0000-0000-000000000000',
        role: 'admin',
        email: 'dev@local',
      } satisfies JwtPayload;

      return;
    }
`;

if (devBypassRegex.test(after)) {
  after = after.replace(devBypassRegex, devBypassReplacement);
} else {
  // fallback: try to find authenticate decorator and inject bypass at start
  const idx = Math.max(
    after.indexOf("fastify.decorate('authenticate'"),
    after.indexOf('fastify.decorate("authenticate"')
  );

  if (idx !== -1) {
    const brace = after.indexOf("{", idx);
    if (brace !== -1) {
      after = after.slice(0, brace + 1) + "\n    " + devBypassReplacement + after.slice(brace + 1);
    } else {
      console.error("[ERROR] Could not locate authenticate function body to inject bypass.");
      process.exit(1);
    }
  } else {
    console.error("[ERROR] Could not find fastify.decorate('authenticate') in auth.ts");
    process.exit(1);
  }
}

if (after === before) {
  console.log("[NOOP] No changes needed:", rel);
  process.exit(0);
}

fs.writeFileSync(abs, after, "utf8");
console.log("[OK] Patched:", rel);
console.log("Next: set DISABLE_AUTH=true and DEV_TENANT_ID/DEV_USER_ID in apps/api/.env (DEV only).");
