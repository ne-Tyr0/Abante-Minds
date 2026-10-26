/* Mutation test for tests/tally.js and tests/worker.js: break the weekly
   totals one way at a time, on the phone (app/tally.js) or on the server
   (server/worker.js), and require the tests to fail.

   Run:  node tests/mutation/totals.js        Exits 1 if any mutant survives. */
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");
// The repository under test (default: this checkout) and a scratch folder to
// break copies in (default: a fresh temp folder).
const REPO = process.argv[2] || path.join(__dirname, "..", "..");
const WORK = process.argv[3] || fs.mkdtempSync(path.join(os.tmpdir(), "am-mutants-"));
const read = (f) => fs.readFileSync(path.join(REPO, f), "utf8").split("\r\n").join("\n");
const FILES = { tally: "app/tally.js", worker: "server/worker.js" };
const SRC = { tally: read(FILES.tally), worker: read(FILES.worker) };

const M = [
  // the phone
  ["tally", "counts while sharing is off", "    if (!sharing()) return;\n    var box = load();\n    fn(roll(box));", "    var box = load();\n    fn(roll(box));"],
  ["tally", "pending keeps a box while off", "      if (!sharing()) return [];\n", ""],
  ["tally", "no cap", "obj[key] = Math.min(CAP, (obj[key] || 0) + (n === undefined ? 1 : n));", "obj[key] = (obj[key] || 0) + (n === undefined ? 1 : n);"],
  ["tally", "a zero counts as one", "(n === undefined ? 1 : n)", "(n || 1)"],
  ["tally", "empty weeks queued", "      if (!empty(box.current)) box.outbox.push(box.current);", "      box.outbox.push(box.current);"],
  ["tally", "outbox unbounded", "      while (box.outbox.length > OUTBOX_MAX) box.outbox.shift();\n", ""],
  ["tally", "the newest week dropped instead", "box.outbox.shift();", "box.outbox.pop();"],
  ["tally", "weeks numbered wrong", "t.setUTCDate(t.getUTCDate() + 4 - day);", "t.setUTCDate(t.getUTCDate() + 3 - day);"],
  ["tally", "sends without an address", "      if (!ENDPOINT || !sharing() || typeof fetch !== \"function\") return Promise.resolve(0);", "      if (!sharing() || typeof fetch !== \"function\") return Promise.resolve(0);"],
  ["tally", "a refused week leaves the outbox", "            if (!r.ok) return false;\n", ""],
  ["tally", "a refusal does not stop the run", "          if (!ok) return false;\n", ""],
  ["tally", "cookies sent", "credentials: \"omit\"", "credentials: \"include\""],
  ["tally", "clearing keeps the box", "      try { window.localStorage.removeItem(KEY); } catch (e) { /* nothing to clear */ }", ""],
  ["tally", "hints not counted", "        if (hints) add(r, \"hints\", hints);\n", ""],
  ["tally", "a wrong answer counted right", "        if (rightFirst) add(r, \"right\");", "        add(r, \"right\");"],
  // the server
  ["worker", "unknown fields taken", "  for (const k of Object.keys(body)) if (!TOP.includes(k)) return { ok: false, why: \"unknown field \" + k };\n", ""],
  ["worker", "this week taken", "  for (let i = 1; i <= 8; i++)", "  for (let i = 0; i <= 8; i++)"],
  ["worker", "nine weeks back taken", "  for (let i = 1; i <= 8; i++)", "  for (let i = 1; i <= 9; i++)"],
  ["worker", "any measure taken", "      for (const [m, n] of Object.entries(row)) if (!measures.includes(m) || !isCount(n)) return", "      for (const [m, n] of Object.entries(row)) if (!isCount(n)) return"],
  ["worker", "fractions taken", "function isCount(n) { return Number.isInteger(n) && n >= 0 && n <= CAP; }", "function isCount(n) { return typeof n === \"number\" && n >= 0 && n <= CAP; }"],
  ["worker", "negatives taken", "function isCount(n) { return Number.isInteger(n) && n >= 0 && n <= CAP; }", "function isCount(n) { return Number.isInteger(n) && n <= CAP; }"],
  ["worker", "past the cap taken", "function isCount(n) { return Number.isInteger(n) && n >= 0 && n <= CAP; }", "function isCount(n) { return Number.isInteger(n) && n >= 0; }"],
  ["worker", "any feature taken", "if (!FEATURES.includes(k) || !isCount(n)) return", "if (!isCount(n)) return"],
  ["worker", "any interval taken", "    if (!INTERVALS.includes(k) || !isObject(row)) return", "    if (!isObject(row)) return"],
  ["worker", "too many levels taken", "    if (!isObject(g) || Object.keys(g).length > MAX_ITEMS) return", "    if (!isObject(g)) return"],
  ["worker", "too many errors taken", "Object.keys(body.errors).length > 30", "Object.keys(body.errors).length > 300"],
  ["worker", "any key shape taken", "      if (!keyRe.test(k) || !isObject(row)) return", "      if (!isObject(row)) return"],
  ["worker", "no reports mark", "      out.push([scope, item, \"reports\", 1]);\n", ""],
  ["worker", "zeros stored", "for (const [k, n] of Object.entries(body.features)) if (n > 0) out.push", "for (const [k, n] of Object.entries(body.features)) out.push"],
  ["worker", "any origin taken", "  if (origin !== ALLOWED_ORIGIN) return new Response(\"Forbidden\", { status: 403, headers });\n", ""],
  ["worker", "no size limit", "  if (text.length > MAX_BYTES) return new Response(\"Too large\", { status: 413, headers });\n", ""],
  ["worker", "totals overwritten", "DO UPDATE SET value = value + excluded.value", "DO UPDATE SET value = excluded.value"],
  ["worker", "the week's count not kept", "  statements.push(env.DB.prepare(COUNT).bind(body.week, body.app));\n", ""],
  ["worker", "reads the caller's address", "  const origin = request.headers.get(\"Origin\");", "  const origin = request.headers.get(\"Origin\"); request.headers.get(\"CF-Connecting-IP\");"],
  ["worker", "a preflight for anyone", "status: origin === ALLOWED_ORIGIN ? 204 : 403", "status: 204"]
];

for (const dir of ["app", "server", "tests"]) fs.mkdirSync(path.join(WORK, dir), { recursive: true });
for (const f of ["app/store.js", "app/tally.js", "server/worker.js", "server/package.json", "tests/tally.js", "tests/worker.js"]) {
  fs.copyFileSync(path.join(REPO, f), path.join(WORK, f));
}
let caught = 0;
for (const [which, name, from, to] of M) {
  if (SRC[which].split(from).length !== 2) { console.log(`BAD   ${name}: pattern not found once`); continue; }
  fs.writeFileSync(path.join(WORK, FILES[which]), SRC[which].replace(from, to));
  const fails = [];
  let failedRun = false;
  for (const t of ["tests/tally.js", "tests/worker.js"]) {
    const r = spawnSync(process.execPath, [path.join(WORK, t)], { encoding: "utf8" });
    fails.push(...(r.stdout.match(/^FAIL .*/gm) || []).map((l) => l.slice(5)));
    if (r.status !== 0) failedRun = true;
  }
  fs.writeFileSync(path.join(WORK, FILES[which]), SRC[which]);
  if (failedRun && fails.length) { caught++; console.log(`ok    ${name}  <- ${fails.join("; ")}`); }
  else console.log(`MISS  ${name}`);
}
console.log(`\n${caught}/${M.length} weekly totals mutants caught`);
process.exit(caught === M.length ? 0 : 1);
