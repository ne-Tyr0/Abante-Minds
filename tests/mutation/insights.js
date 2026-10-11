/* Mutation test for tests/insights.js: break the strengths-and-gaps rules one
   way at a time and require the tests to fail.

   Run:  node tests/mutation/insights.js        Exits 1 if any mutant survives. */
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");
// The repository under test (default: this checkout) and a scratch folder to
// break copies in (default: a fresh temp folder).
const REPO = process.argv[2] || path.join(__dirname, "..", "..");
const WORK = process.argv[3] || fs.mkdtempSync(path.join(os.tmpdir(), "am-mutants-"));
const SRC = fs.readFileSync(path.join(REPO, "app/insights.js"), "utf8").split("\r\n").join("\n");

const M = [
  ["retries count", "    return row.attempt === 1 && (row.kind === \"practice\" || row.kind === \"exam\");", "    return (row.kind === \"practice\" || row.kind === \"exam\");"],
  ["redos and facts count", "    return row.attempt === 1 && (row.kind === \"practice\" || row.kind === \"exam\");", "    return row.attempt === 1;"],
  ["exams do not count", "    return row.attempt === 1 && (row.kind === \"practice\" || row.kind === \"exam\");", "    return row.attempt === 1 && row.kind === \"practice\";"],
  ["a kind met once is reported", "      .filter(function (t) { return t.asked >= MIN; })", "      .filter(function () { return true; })"],
  ["old answers never fade", "    var rows = log.slice(-RECENT);", "    var rows = log;"],
  ["a tie goes to the rarer kind", "    .sort(function (a, b) { return b.share - a.share || b.asked - a.asked; });", "    .sort(function (a, b) { return b.share - a.share || a.asked - b.asked; });"],
  ["worst first", "    .sort(function (a, b) { return b.share - a.share || b.asked - a.asked; });", "    .sort(function (a, b) { return a.share - b.share || b.asked - a.asked; });"],
  ["any difference is named", "    var apart = types.length > 1 && best.share - worst.share >= GAP;", "    var apart = types.length > 1;"],
  ["one kind named against itself", "    var apart = types.length > 1 && best.share - worst.share >= GAP;", "    var apart = best && best.share - worst.share >= 0;"],
  ["names left as codes", "name: NAMES[t.key] || t.key,", "name: t.key,"],
  ["a row with no type counted", "      if (!key) return;\n", ""],
  ["right not counted", "      if (row.correct) by[key].right += 1;", ""]
];

fs.mkdirSync(path.join(WORK, "app"), { recursive: true });
fs.mkdirSync(path.join(WORK, "tests"), { recursive: true });
fs.mkdirSync(path.join(WORK, "content"), { recursive: true });
fs.copyFileSync(path.join(REPO, "tests/insights.js"), path.join(WORK, "tests/insights.js"));
fs.copyFileSync(path.join(REPO, "content/blueprint.json"), path.join(WORK, "content/blueprint.json"));
let caught = 0;
const missed = [];
for (const [name, from, to] of M) {
  const n = SRC.split(from).length - 1;
  if (n !== 1) { missed.push(name); console.log(`BAD   ${name}: pattern found ${n} times`); continue; }
  fs.writeFileSync(path.join(WORK, "app/insights.js"), SRC.replace(from, to));
  const r = spawnSync(process.execPath, [path.join(WORK, "tests/insights.js")], { encoding: "utf8" });
  const fails = (r.stdout.match(/^FAIL .*/gm) || []).map((l) => l.slice(5));
  if (r.status === 1 && fails.length) { caught++; console.log(`ok    ${name}  <- ${fails.join("; ")}`); }
  else { missed.push(name); console.log(`MISS  ${name} (exit ${r.status})`); }
}
console.log(`\n${caught}/${M.length} insights mutants caught`);
process.exit(missed.length ? 1 : 0);
