/**
 * Fix BullMQ Redis error:
 *   "BullMQ: Your redis options maxRetriesPerRequest must be null."
 *
 * Root cause:
 * BullMQ requires ioredis connections used for blocking operations to have:
 *   maxRetriesPerRequest: null
 *
 * This script applies a minimal patch in common locations:
 * 1) apps/api/src/config/redis.ts
 *    - If it instantiates ioredis (new IORedis/new Redis), inject maxRetriesPerRequest: null
 *
 * 2) apps/api/src/jobs/queues.ts
 *    - If it passes a connection options object literal (connection: { ... }),
 *      inject maxRetriesPerRequest: null
 *
 * The script is intentionally conservative:
 * - It does nothing if the key is already present.
 * - It only edits the two known files if they exist.
 *
 * Usage (repo root):
 *   node tools/apply-bullmq-redis-fix.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const targets = [
  "apps/api/src/config/redis.ts",
  "apps/api/src/jobs/queues.ts",
];

function readIfExists(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return null;
  return { rel, abs, text: fs.readFileSync(abs, "utf8") };
}

function write(abs, text) {
  fs.writeFileSync(abs, text, "utf8");
}

function patchRedisConfig(file) {
  let { text } = file;
  if (text.includes("maxRetriesPerRequest")) {
    return { changed: false, reason: "already_has_maxRetriesPerRequest" };
  }

  // Case A: new IORedis(URL, { ... })
  const reObjArg = /(new\s+(?:IORedis|Redis)\s*\(\s*[^,]+,\s*\{)/g;
  if (reObjArg.test(text)) {
    text = text.replace(reObjArg, (m) => `${m}\n  maxRetriesPerRequest: null,`);
    return { changed: text !== file.text, newText: text, reason: "injected_into_options_object" };
  }

  // Case B: new IORedis(URL) (single arg)
  const reSingleArg = /(new\s+(?:IORedis|Redis)\s*\(\s*[^)]+\))/g;
  if (reSingleArg.test(text)) {
    text = text.replace(reSingleArg, (m) => {
      // Don't double-patch if already has second arg.
      if (m.includes(",")) return m;
      // Insert options as 2nd argument.
      return m.replace(/\)$/, ", { maxRetriesPerRequest: null })");
    });
    return { changed: text !== file.text, newText: text, reason: "added_second_argument" };
  }

  return { changed: false, reason: "no_ioredis_constructor_pattern_found" };
}

function patchQueues(file) {
  let { text } = file;
  if (text.includes("maxRetriesPerRequest")) {
    return { changed: false, reason: "already_has_maxRetriesPerRequest" };
  }

  // Patch object-literal connection: { ... }
  // Only add when we find `connection: {`
  const marker = "connection: {";
  if (!text.includes(marker)) {
    return { changed: false, reason: "no_connection_object_literal_found" };
  }

  text = text.replaceAll(marker, "connection: {\n      maxRetriesPerRequest: null,");

  return { changed: text !== file.text, newText: text, reason: "injected_into_connection_object" };
}

const results = [];

for (const rel of targets) {
  const file = readIfExists(rel);
  if (!file) {
    results.push({ rel, status: "skipped", reason: "not_found" });
    continue;
  }

  let patch;
  if (rel.endsWith("apps/api/src/config/redis.ts")) patch = patchRedisConfig(file);
  else if (rel.endsWith("apps/api/src/jobs/queues.ts")) patch = patchQueues(file);
  else patch = { changed: false, reason: "unknown_target" };

  if (patch.changed) {
    write(file.abs, patch.newText);
    results.push({ rel, status: "patched", reason: patch.reason });
    console.log(`[OK] Patched: ${rel} (${patch.reason})`);
  } else {
    results.push({ rel, status: "noop", reason: patch.reason });
    console.log(`[NOOP] ${rel} (${patch.reason})`);
  }
}

console.log("\nSummary:");
console.log(JSON.stringify(results, null, 2));

console.log("\nNext steps:");
console.log("1) Ensure Redis is running (REDIS_URL points to it).");
console.log("2) Re-run: pnpm dev");
