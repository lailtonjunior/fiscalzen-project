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

function findBadChars(buf) {
  const bad = [];

  // BOM UTF-8
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    bad.push({ type: "BOM_UTF8", index: 0 });
  }

  // NUL e SUB (0x00, 0x1A) quebram parser JS/TS
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    if (b === 0x00) bad.push({ type: "NUL_0x00", index: i });
    if (b === 0x1a) bad.push({ type: "SUB_0x1A", index: i });
  }

  // U+2028 / U+2029 podem causar "Invalid or unexpected token" em JS em alguns casos
  const text = buf.toString("utf8");
  let idx = text.indexOf("\u2028");
  while (idx !== -1) {
    bad.push({ type: "U+2028", index: idx, textIndex: true });
    idx = text.indexOf("\u2028", idx + 1);
  }
  idx = text.indexOf("\u2029");
  while (idx !== -1) {
    bad.push({ type: "U+2029", index: idx, textIndex: true });
    idx = text.indexOf("\u2029", idx + 1);
  }

  return bad;
}

function locateLineCol(text, pos) {
  let line = 1, col = 1;
  for (let i = 0; i < pos && i < text.length; i++) {
    if (text[i] === "\n") { line++; col = 1; } else col++;
  }
  return { line, col };
}

const files = TARGET_DIRS.flatMap(d => walk(path.join(ROOT, d)));
let found = 0;

for (const f of files) {
  const buf = fs.readFileSync(f);
  const bad = findBadChars(buf);
  if (bad.length === 0) continue;

  found++;
  const rel = path.relative(ROOT, f);
  const text = buf.toString("utf8");
  console.log("\n[FOUND]", rel);

  for (const item of bad.slice(0, 10)) {
    const pos = item.textIndex ? item.index : item.index;
    const { line, col } = locateLineCol(text, pos);
    const snippet = text.split("\n")[line - 1] ?? "";
    console.log(` - ${item.type} at line ${line}, col ${col}`);
    console.log(`   ${snippet}`);
  }

  if (bad.length > 10) console.log(` - (+${bad.length - 10} more)`);
}

if (!found) {
  console.log("[OK] Nenhum caractere invalido encontrado nas pastas alvo.");
  console.log("Se o erro persistir, o problema pode estar em algum arquivo fora de apps/web/app|lib|components ou em arquivo gerado.");
} else {
  console.log(`\nSummary: ${found} arquivo(s) com caracteres invalidos.`);
  console.log("Aplique o fix automatico com: node tools/fix-web-invalid-chars.mjs");
}
