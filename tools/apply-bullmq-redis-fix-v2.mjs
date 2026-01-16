/**
 * BullMQ Redis fix (v2): enforce maxRetriesPerRequest: null
 *
 * Your v1 run showed:
 * - apps/api/src/config/redis.ts already contains `maxRetriesPerRequest` (but BullMQ still errors)
 * - apps/api/src/jobs/queues.ts doesn't use a literal `connection: { ... }`
 *
 * BullMQ v5+ requires ALL Redis connections used by BullMQ (Queue/Worker/QueueEvents)
 * to have ioredis option: maxRetriesPerRequest = null (not a number).
 *
 * This script:
 * 1) In `apps/api/src/config/redis.ts`:
 *    - If it finds `maxRetriesPerRequest: <anything>`, it rewrites to `null`.
 *    - If it finds `maxRetriesPerRequest=<anything>` in URL params (rare), it does nothing.
 *
 * 2) In `apps/api/src/jobs/queues.ts`:
 *    - If it finds `connection: redis`, it rewrites to:
 *        connection: { ...(redis as any).options, maxRetriesPerRequest: null }
 *      This avoids depending on how redis.ts instantiated the client.
 *
 * Usage (repo root):
 *   node tools/apply-bullmq-redis-fix-v2.mjs
 *
 * After patch:
 *   pnpm dev
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function patchRedisTs() {
  const rel = "apps/api/src/config/redis.ts";
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return { rel, status: "skipped", reason: "not_found" };

  const before = fs.readFileSync(abs, "utf8");
  let after = before;

  // Enforce: maxRetriesPerRequest: null
  // Replace any non-null value (number, env var, etc.) with null.
  after = after.replace(
    /maxRetriesPerRequest\s*:\s*([^,\n}]+)/g,
    (m, val) => {
      const v = String(val).trim();
      if (v === "null") return m;
      return "maxRetriesPerRequest: null";
    }
  );

  const changed = after !== before;
  if (changed) {
    fs.writeFileSync(abs, after, "utf8");
    return { rel, status: "patched", reason: "forced_maxRetriesPerRequest_null" };
  }
  return { rel, status: "noop", reason: "already_null_or_not_found" };
}

function patchQueuesTs() {
  const rel = "apps/api/src/jobs/queues.ts";
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return { rel, status: "skipped", reason: "not_found" };

  const before = fs.readFileSync(abs, "utf8");
  let after = before;

  // Replace: connection: redis  (with optional spaces and trailing comma)
  // This is the most common pattern when reusing a shared redis instance.
  after = after.replace(
    /connection\s*:\s*redis(\s*[,\}])/g,
    "connection: { ...(redis as any).options, maxRetriesPerRequest: null }$1"
  );

  // Also handle: connection: redisClient / redisConnection if your file uses different name.
  // ONLY if it contains "connection:" and the identifier name includes "redis".
  after = after.replace(
    /connection\s*:\s*(\w*redis\w*)(\s*[,\}])/gi,
    (m, ident, tail) => {
      // If already an object literal, skip (handled elsewhere)
      if (m.includes("{")) return m;
      if (ident.toLowerCase() === "redis") {
        return `connection: { ...(redis as any).options, maxRetriesPerRequest: null }${tail}`;
      }
      // Wrap other redis-like identifiers as well (best-effort)
      return `connection: { ...(${ident} as any).options, maxRetriesPerRequest: null }${tail}`;
    }
  );

  const changed = after !== before;
  if (changed) {
    fs.writeFileSync(abs, after, "utf8");
    return { rel, status: "patched", reason: "wrapped_connection_options" };
  }
  return { rel, status: "noop", reason: "no_connection_identifier_found" };
}

const results = [patchRedisTs(), patchQueuesTs()];

for (const r of results) {
  const tag = r.status === "patched" ? "OK" : r.status.toUpperCase();
  console.log(`[${tag}] ${r.rel} (${r.reason})`);
}

console.log("\nSummary:");
console.log(JSON.stringify(results, null, 2));

console.log("\nVerification (manual, optional):");
console.log("Open apps/api/src/config/redis.ts and confirm maxRetriesPerRequest is literally null.");
console.log("Open apps/api/src/jobs/queues.ts and confirm BullMQ constructors receive connection with maxRetriesPerRequest: null.");
