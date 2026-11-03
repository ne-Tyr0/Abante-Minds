/* Mutation test for tests/share.js: break what the milestone picture and the
   certificate may say, and the counting number, one way at a time, and
   require the tests to fail.

   Run:  node tests/mutation/share.js        Exits 1 if any mutant survives. */
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const REPO = path.join(__dirname, "..", "..");
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "am-share-"));
const FILES = { share: "app/share.js", moments: "motion/moments.js", store: "app/store.js" };
const read = (f) => fs.readFileSync(path.join(REPO, f), "utf8").split("\r\n").join("\n");
const SRC = {};
Object.keys(FILES).forEach((k) => { SRC[k] = read(FILES[k]); });

const M = [
  ["share", "the whole name", "return (String(name || \"\").trim().split(/\\s+/)[0] || \"\").slice(0, 20);", "return String(name || \"\").trim().slice(0, 20);"],
  ["share", "no cut for a long name", "[0] || \"\").slice(0, 20);", "[0] || \"\");"],
  ["share", "leading spaces kept", "String(name || \"\").trim().split", "String(name || \"\").split"],
  ["share", "a name even when none was given", "(who ? who + \" practised\" : \"Practised\")", "(who + \" practised\")"],
  ["share", "a certificate always says the streak", "return o.by === \"levels\" ? \"for clearing \"", "return false ? \"for clearing \""],
  ["share", "the date unwritten", "return Number(p[2]) + \" \" + MONTHS[Number(p[1]) - 1] + \" \" + p[0];", "return iso;"],
  ["moments", "the clock starts at the call", "if (start === null) start = now;", "if (start === null) start = performance.now();"],
  ["moments", "done is ignored", "if (el.dataset && el.dataset.done) return;", ""],
  ["moments", "it stops short", "if (t < 1 && el.isConnected) requestAnimationFrame(frame);", "if (t < 0.9 && el.isConnected) requestAnimationFrame(frame);"],
  ["moments", "it counts on off the screen", "if (t < 1 && el.isConnected) requestAnimationFrame(frame);", "if (t < 1) requestAnimationFrame(frame);"],
  ["moments", "it overshoots", "Math.round(to * (1 - Math.pow(1 - t, 2)))", "Math.round(to * 1.2 * (1 - Math.pow(1 - t, 2)))"]
];

for (const dir of ["app", "motion", "tests"]) fs.mkdirSync(path.join(WORK, dir), { recursive: true });
fs.copyFileSync(path.join(REPO, "tests/share.js"), path.join(WORK, "tests/share.js"));
Object.keys(FILES).forEach((k) => fs.writeFileSync(path.join(WORK, FILES[k]), SRC[k]));

let caught = 0, bad = 0;
for (const [which, name, from, to] of M) {
  if (SRC[which].split(from).length !== 2) { bad++; console.log("BAD   " + name + ": pattern not found once"); continue; }
  fs.writeFileSync(path.join(WORK, FILES[which]), SRC[which].replace(from, () => to));
  const r = spawnSync(process.execPath, [path.join(WORK, "tests/share.js")], { encoding: "utf8" });
  fs.writeFileSync(path.join(WORK, FILES[which]), SRC[which]);
  const fails = (r.stdout.match(/^FAIL .*/gm) || []).map((l) => l.slice(5));
  if (r.status !== 0) { caught++; console.log("ok    " + name + "  <- " + (fails[0] || "crashed")); }
  else console.log("MISS  " + name);
}
fs.rmSync(WORK, { recursive: true, force: true });
console.log("TOTAL " + caught + "/" + M.length + " share mutants caught" + (bad ? ", " + bad + " patterns not found" : ""));
process.exit(caught === M.length ? 0 : 1);
