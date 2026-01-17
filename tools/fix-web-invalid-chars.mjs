import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_DIRS = [
  "apps/web/app",
  "apps/web/lib",
  "apps/web/components",
];

const IGNORE_DIRS = new Set(["node_modules", ".next", "dist", "build", ".turbo"]);

function isTextLike(file) {
  return /\.(ts|tsx|js|jsx|mjs|cjs|css|json|md|txt)$/.test(file);
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (IGNORE_DIRS.has(ent.name)) continue;
      walk(p, out);
    } else if (ent.isFile() && isTextLike(ent.name)) {
      out.push(p);
    }
  }
  return out;
}

function fixBuffer(buf) {
  let changed = false;

  // Remove BOM UTF-8
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    buf = buf.slice(3);
    changed = true;
  }

  // Remove NUL e SUB
  const filtered = [];
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    if (b === 0x00 || b === 0x1a) { changed = true; continue; }
    filtered.push(b);
  }
  buf = Buffer.from(filtered);

  // Replace U+2028/U+2029 por quebra de linha normal (seguro)
  let text = buf.toString("utf8");
  if (text.includes("\u2028") || text.includes("\u2029")) {
    text = text.replaceAll("\u2028", "\n").replaceAll("\u2029", "\n");
    buf = Buffer.from(text, "utf8");
    changed = true;
  }

  return { buf, changed };
}

const files = TARGET_DIRS.flatMap(d => walk(path.join(ROOT, d)));
let patched = 0;

for (const f of files) {
  const before = fs.readFileSync(f);
  const { buf: after, changed } = fixBuffer(before);
  if (!changed) continue;

  const rel = path.relative(ROOT, f);
  const bak = f + ".bak";
  if (!fs.existsSync(bak)) fs.writeFileSync(bak, before);
  fs.writeFileSync(f, after);
  patched++;
  console.log("[OK] Patched:", rel, "(backup:", path.basename(bak) + ")");
}

console.log("\nSummary:", { patched });
console.log("Agora rode: pnpm --filter @fiscalzen/web dev");
