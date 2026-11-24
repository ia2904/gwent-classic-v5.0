const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const files = process.argv.slice(2);

const results = [];

function scan(file) {
  const src = fs.readFileSync(path.join(root, file), "utf8");
  const lines = src.split(/\r?\n/);
  let inBlockComment = false;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let code = line;
    if (inBlockComment) {
      const end = code.indexOf("*/");
      if (end === -1) continue;
      code = code.slice(end + 2);
      inBlockComment = false;
    }
    code = code.replace(/\/\*.*?\*\//g, " ");
    const bc = code.indexOf("/*");
    if (bc !== -1) {
      inBlockComment = true;
      code = code.slice(0, bc);
    }
    code = code.replace(/(^|[^:\\])\/\/.*$/, "$1");
    const re = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|`((?:[^`\\$]|\\.)*)`/g;
    let m;
    while ((m = re.exec(code))) {
      const text = m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3];
      if (text === undefined) continue;
      results.push({ file, line: i + 1, text });
    }
  }
}

files.forEach(scan);
fs.writeFileSync(path.join(__dirname, "strings-raw.json"), JSON.stringify(results, null, 1), "utf8");

const ui = results.filter((r) => {
  const t = r.text;
  if (t.length < 4 || t.length > 400) return false;
  if (!/[A-Za-z]/.test(t)) return false;
  if (/^(https?:|\/\/|\.\/|\.\.\/|data:|img\/|audio\/|sfx\/|fonts\/)/.test(t)) return false;
  if (/^[.#][\w-]/.test(t)) return false;
  if (/^[a-z_][a-z0-9_-]*$/.test(t)) return false;
  if (/^[A-Z_]+$/.test(t)) return false;
  if (/^[\w-]+\s*[=:]\s*[^ ]+;?$/.test(t)) return false;
  if (/px|rgba?\(|gradient|translate|rotate|scale|flex|grid|solid|none|hidden|block|absolute|relative/.test(t) && /[;{}]/.test(t)) return false;
  if (/^[\d\s.%+*/-]+$/.test(t)) return false;
  if (/^[\w\s-]+$/.test(t) && t.split(/\s+/).length <= 1 && !/[A-Z]/.test(t[0])) return false;
  return /\s/.test(t) || /^[A-Z]/.test(t);
});

const seen = new Map();
for (const r of ui) {
  if (!seen.has(r.text)) seen.set(r.text, []);
  seen.get(r.text).push(`${r.file}:${r.line}`);
}
const list = [...seen.entries()].map(([text, where]) => ({ text, where }));
fs.writeFileSync(path.join(__dirname, "strings-ui.json"), JSON.stringify(list, null, 1), "utf8");

console.log("raw strings:", results.length);
console.log("ui candidates:", list.length);
