import fs from "node:fs";
import path from "node:path";

function exists(rel) {
  return fs.existsSync(path.join(process.cwd(), rel));
}

function read(rel) {
  return fs.readFileSync(path.join(process.cwd(), rel), "utf8");
}

function write(rel, content) {
  fs.mkdirSync(path.dirname(path.join(process.cwd(), rel)), { recursive: true });
  fs.writeFileSync(path.join(process.cwd(), rel), content, "utf8");
}

function patchApiTs() {
  const rel = "apps/web/lib/api.ts";
  if (!exists(rel)) {
    console.error(`[ERROR] File not found: ${rel}`);
    process.exit(1);
  }

  const before = read(rel);
  let after = before;

  // We will inject a robust baseURL resolver and force axios/fetch to use relative base in browser.
  // This patch is conservative: it only adds helper + replaces baseURL assignment if found.
  if (!after.includes("function resolveApiBaseUrl")) {
    after =
      `// AUTO-PATCH: API base URL resolver (browser uses same-origin to allow Next proxy rewrites)\n` +
      `function resolveApiBaseUrl(): string {\n` +
      `  // In the browser, always use relative path to avoid CORS/preflight and rely on Next rewrites.\n` +
      `  if (typeof window !== 'undefined') return '';\n` +
      `  // On server-side (SSR), allow explicit env override\n` +
      `  return process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? '';\n` +
      `}\n\n` +
      after;
  }

  // Replace common patterns: const API_URL = ... / baseURL: ...
  // 1) If there is a constant NEXT_PUBLIC_API_URL usage, keep it but prefer resolver.
  after = after.replace(
    /const\s+API_URL\s*=\s*process\.env\.NEXT_PUBLIC_API_URL[\s\S]*?;(\r?\n)/m,
    `const API_URL = resolveApiBaseUrl();$1`
  );

  // 2) If there is any baseURL: process.env.NEXT_PUBLIC_API_URL, replace with API_URL ('' in browser)
  after = after.replace(
    /baseURL:\s*process\.env\.NEXT_PUBLIC_API_URL\s*\|\|\s*['"][^'"]+['"]/g,
    "baseURL: API_URL"
  );
  after = after.replace(/baseURL:\s*process\.env\.NEXT_PUBLIC_API_URL/g, "baseURL: API_URL");
  after = after.replace(/baseURL:\s*API_BASE_URL/g, "baseURL: API_URL");

  // 3) If apiFetch builds URL with NEXT_PUBLIC_API_URL, make it relative in browser
  // Replace occurrences of `${API_URL}/api/v1` or `${process.env...}/api/v1` to `/api/v1`
  after = after.replace(/\$\{API_URL\}\/api\/v1/g, "/api/v1");
  after = after.replace(/\$\{process\.env\.NEXT_PUBLIC_API_URL\}\/api\/v1/g, "/api/v1");

  if (after === before) {
    console.log("[NOOP] apps/web/lib/api.ts (no recognizable pattern to patch)");
    return;
  }

  write(rel, after);
  console.log("[OK] Patched:", rel);
}

function ensureNextConfigRewrite() {
  // We will create/patch next.config.mjs or next.config.js to add rewrites:
  // /api/v1/:path* -> http://localhost:3001/api/v1/:path*
  const mjs = "apps/web/next.config.mjs";
  const js = "apps/web/next.config.js";

  let rel = exists(mjs) ? mjs : (exists(js) ? js : mjs);

  const targetVar =
    "const API_PROXY_TARGET = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';";

  const rewriteBlock =
    `async rewrites() {\n` +
    `    return [\n` +
    `      {\n` +
    `        source: '/api/v1/:path*',\n` +
    `        destination: \`\${API_PROXY_TARGET}/api/v1/:path*\`,\n` +
    `      },\n` +
    `    ];\n` +
    `  },`;

  if (!exists(rel)) {
    const content =
`/** @type {import('next').NextConfig} */\n` +
`${targetVar}\n\n` +
`const nextConfig = {\n` +
`  reactStrictMode: true,\n` +
`  ${rewriteBlock}\n` +
`};\n\n` +
`export default nextConfig;\n`;
    write(rel, content);
    console.log("[OK] Created:", rel);
    return;
  }

  const before = read(rel);
  let after = before;

  if (!after.includes("API_PROXY_TARGET")) {
    after = targetVar + "\n\n" + after;
  }

  if (after.includes("rewrites()")) {
    console.log("[NOOP] next.config already has rewrites():", rel);
    write(rel, after);
    return;
  }

  // Insert rewrites into nextConfig object (simple heuristic)
  // Find "const nextConfig = {" or "module.exports = {"
  if (after.includes("const nextConfig = {")) {
    after = after.replace(
      /const\s+nextConfig\s*=\s*{\s*/m,
      (m) => m + `  ${rewriteBlock}\n  `
    );
  } else if (after.includes("module.exports")) {
    after = after.replace(
      /module\.exports\s*=\s*{\s*/m,
      (m) => m + `  ${rewriteBlock}\n  `
    );
  } else {
    // fallback: append guidance
    after += `\n\n// AUTO-PATCH NOTE: please add rewrites() to proxy /api/v1/* to API_PROXY_TARGET\n`;
  }

  write(rel, after);
  console.log("[OK] Patched rewrites in:", rel);
}

patchApiTs();
ensureNextConfigRewrite();

console.log("\nNext steps:");
console.log("1) Ensure apps/web has env NEXT_PUBLIC_API_URL=http://localhost:3001 (optional, used as proxy target).");
console.log("2) Restart: pnpm dev");
console.log("3) Web will call /api/v1/* (same-origin) and Next will proxy to API.");
