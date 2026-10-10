/* Mutation test for tests/facts.js: break the facts drill's rules one way at
   a time and require the facts tests to fail.

   Run:  node tests/mutation/facts.js        Exits 1 if any mutant survives. */
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");
// The repository under test (default: this checkout) and a scratch folder to
// break copies in (default: a fresh temp folder).
const REPO = process.argv[2] || path.join(__dirname, "..", "..");
const WORK = process.argv[3] || fs.mkdtempSync(path.join(os.tmpdir(), "am-mutants-"));
const SRC = fs.readFileSync(path.join(REPO, "app/facts.js"), "utf8").split("\r\n").join("\n");

const M = [
  ["new facts without a limit", "  var NEW_MAX = 6;", "  var NEW_MAX = 40;"],
  ["no mastered facts come along", "  var REVIEW_SLOTS = 3;", "  var REVIEW_SLOTS = 0;"],
  ["slower counts as quick", "  var QUICK_MS = 4000;", "  var QUICK_MS = 5000;"],
  ["a hint still counts as quick", "    return !usedHints && ms >= 0 && ms <= QUICK_MS;", "    return ms >= 0 && ms <= QUICK_MS;"],
  ["the boundary is not quick", "    return !usedHints && ms >= 0 && ms <= QUICK_MS;", "    return !usedHints && ms >= 0 && ms < QUICK_MS;"],
  ["new facts before ones being learnt", "    var learning = due.concat(fresh.slice(0, NEW_MAX), doneToday)", "    var learning = fresh.slice(0, NEW_MAX).concat(due, doneToday)"],
  ["done today before new", "    var learning = due.concat(fresh.slice(0, NEW_MAX), doneToday)", "    var learning = due.concat(doneToday, fresh.slice(0, NEW_MAX))"],
  ["newest practice first", "      .sort(function (a, b) { return a.last < b.last ? -1 : a.last > b.last ? 1 : a.i - b.i; })", "      .sort(function (a, b) { return a.last < b.last ? 1 : a.last > b.last ? -1 : a.i - b.i; })"],
  ["all mastered: no more review", "    if (learning.length < size - review.length) review = known.slice(0, size - learning.length);", ""],
  ["a small level does not go round again", "    while (out.length < size && again.length) {", "    while (false) {"],
  ["the same fact twice running", "      if (pass.length > 1 && pass[0] === out[out.length - 1]) { pass[0] = pass[1]; pass[1] = out[out.length - 1]; }", ""],
  ["not shuffled", "    var out = shuffle(learning.concat(review), r);", "    var out = learning.concat(review);"],
  ["a miss comes straight back", "    var pos = Math.min(index + 1 + GAP, keys.length);", "    var pos = Math.min(index + 1, keys.length);"],
  ["a miss lands beside itself", "    while (pos < keys.length && (keys[pos - 1] === key || keys[pos] === key)) pos++;", ""],
  ["a round grows without end", "    if (keys.length >= (size || ROUND) + EXTRA_MAX) return -1;", ""],
  ["a shorter round", "  var ROUND = 20;", "  var ROUND = 15;"]
];

fs.mkdirSync(path.join(WORK, "app"), { recursive: true });
fs.mkdirSync(path.join(WORK, "tests"), { recursive: true });
fs.copyFileSync(path.join(REPO, "tests/facts.js"), path.join(WORK, "tests/facts.js"));
let caught = 0;
const missed = [];
for (const [name, from, to] of M) {
  const n = SRC.split(from).length - 1;
  if (n !== 1) { missed.push(name); console.log(`BAD   ${name}: pattern found ${n} times`); continue; }
  fs.writeFileSync(path.join(WORK, "app/facts.js"), SRC.replace(from, to));
  const r = spawnSync(process.execPath, [path.join(WORK, "tests/facts.js")], { encoding: "utf8" });
  const fails = (r.stdout.match(/^FAIL .*/gm) || []).map((l) => l.slice(5));
  if (r.status === 1 && fails.length) { caught++; console.log(`ok    ${name}  <- ${fails.join("; ")}`); }
  else { missed.push(name); console.log(`MISS  ${name} (exit ${r.status})`); }
}
console.log(`\n${caught}/${M.length} facts mutants caught`);
process.exit(missed.length ? 1 : 0);
