/* Mutation test for tests/entry.js: break the answer-entry rules one way at a
   time and require the entry tests to fail.

   Run:  node tests/mutation/entry.js        Exits 1 if any mutant survives. */
"use strict";
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const os = require("os");
// The repository under test (default: this checkout) and a scratch folder to
// break copies in (default: a fresh temp folder).
const REPO = process.argv[2] || path.join(__dirname, "..", "..");
const WORK = process.argv[3] || fs.mkdtempSync(path.join(os.tmpdir(), "am-mutants-"));
const SRC = fs.readFileSync(path.join(REPO, "app/entry.js"), "utf8").split("\r\n").join("\n");
const M = [
  ["decimal point in a fraction box", 'if (e.kind !== "number" || cur.indexOf(".") > -1) return e;', 'if (cur.indexOf(".") > -1) return e;'],
  ["no box length limit", 'if (cur.length >= (e.kind === "number" ? NUMBER_MAX : BOX_MAX)) return e;', 'if (cur.length >= NUMBER_MAX) return e;'],
  ["delete does not step back", "    if (i > 0) n.box = boxes[i - 1];", ""],
  ["next runs past the last box", "    if (i < 0 || i === boxes.length - 1) return e;", "    if (i < 0) return e;"],
  ["mixed needs a whole number to check", "    if (p.num && p.den) return true;", "    if (p.whole && p.num && p.den) return true;"],
  ["empty whole leaves a stray space", "    return p.whole ? p.whole + \" \" + fraction : fraction;", "    return p.whole + \" \" + fraction;"],
  ["state changed in place", "    var n = copy(e);\n    n.parts[n.box] = cur + key;\n    return n;", "    e.parts[e.box] = cur + key;\n    return e;"]
];
fs.mkdirSync(path.join(WORK, "app"), { recursive: true });
fs.mkdirSync(path.join(WORK, "tests"), { recursive: true });
fs.copyFileSync(path.join(REPO, "tests/entry.js"), path.join(WORK, "tests/entry.js"));
let caught = 0;
for (const [name, from, to] of M) {
  if (SRC.split(from).length !== 2) { console.log(`BAD   ${name}: pattern not found once`); continue; }
  fs.writeFileSync(path.join(WORK, "app/entry.js"), SRC.replace(from, to));
  const r = spawnSync(process.execPath, [path.join(WORK, "tests/entry.js")], { encoding: "utf8" });
  const fails = (r.stdout.match(/^FAIL .*/gm) || []).map((l) => l.slice(5));
  if (r.status === 1 && fails.length) { caught++; console.log(`ok    ${name}  <- ${fails.join("; ")}`); }
  else console.log(`MISS  ${name}`);
}
console.log(`\n${caught}/${M.length} entry mutants caught`);
process.exit(caught === M.length ? 0 : 1);
