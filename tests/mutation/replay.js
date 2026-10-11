/* Mutation test for tests/replay.js: break the replay tool one way at a time
   and require the tests to fail.

   Run:  node tests/mutation/replay.js        Exits 1 if any mutant survives. */
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");
// The repository under test (default: this checkout) and a scratch folder to
// break copies in (default: a fresh temp folder).
const REPO = process.argv[2] || path.join(__dirname, "..", "..");
const WORK = process.argv[3] || fs.mkdtempSync(path.join(os.tmpdir(), "am-mutants-"));
const SRC = fs.readFileSync(path.join(REPO, "tools/replay.js"), "utf8").split("\r\n").join("\n");

const M = [
  ["another pack never flagged", "  if (row.pack !== C.packVersion) flags.push", "  if (false) flags.push"],
  ["a changed format never flagged", "  if (q.format !== row.format) flags.push", "  if (false) flags.push"],
  ["facts rebuilt as templates", "q = row.fact\n      ? C.factQuestion", "q = false\n      ? C.factQuestion"],
  ["a fact's seed ignored", "C.factQuestion(row.topic, row.level, row.fact, row.seed, row.ordinal || 0)", "C.factQuestion(row.topic, row.level, row.fact, 0, row.ordinal || 0)"],
  ["answers never marked again", "C.isCorrect(q, row.given) !== !!row.correct", "false"],
  ["a missing template not caught", "  if (!q) return {", "  if (false) return {"],
  ["a choice given by its number", "return q.type === \"choice\" ? C.choiceText(q, value) :", "return q.type === \"choice\" ? String(value) :"],
  ["unanswered shown as null", "${x.given === null ? \"not answered\" : x.given}", "${x.given}"],
  ["the mistake left out", "${r.error ? ` (${r.error})` : \"\"}", ""],
  ["pictures given by letter only", "q.choiceFigures ? q.choices.map((l, i) => `${l}: ${q.choiceFigures[i].text}`) : q.choices", "q.choices"],
  ["sessions not counted", "const sessions = new Set(rows.map((r) => r.session)).size;", "const sessions = rows.length;"],
  ["times in local time", "new Date(ms).toISOString().replace(/\\.\\d+Z$/, \"Z\")", "new Date(ms).toString()"],
  ["quotes not doubled", "'\"' + s.replace(/\"/g, '\"\"') + '\"'", "'\"' + s + '\"'"],
  ["no byte-order mark", "return \"\\uFEFF\" + lines.join", "return lines.join"]
];

fs.mkdirSync(path.join(WORK, "app"), { recursive: true });
fs.mkdirSync(path.join(WORK, "tests"), { recursive: true });
fs.mkdirSync(path.join(WORK, "tools"), { recursive: true });
fs.copyFileSync(path.join(REPO, "app/content.js"), path.join(WORK, "app/content.js"));
fs.copyFileSync(path.join(REPO, "tests/replay.js"), path.join(WORK, "tests/replay.js"));
fs.cpSync(path.join(REPO, "content"), path.join(WORK, "content"), { recursive: true });
let caught = 0;
const missed = [];
for (const [name, from, to] of M) {
  const n = SRC.split(from).length - 1;
  if (n !== 1) { missed.push(name); console.log(`BAD   ${name}: pattern found ${n} times`); continue; }
  fs.writeFileSync(path.join(WORK, "tools/replay.js"), SRC.replace(from, () => to));
  const r = spawnSync(process.execPath, [path.join(WORK, "tests/replay.js")], { encoding: "utf8" });
  const fails = (r.stdout.match(/^FAIL .*/gm) || []).map((l) => l.slice(5));
  if (r.status === 1 && fails.length) { caught++; console.log(`ok    ${name}  <- ${fails.join("; ")}`); }
  else { missed.push(name); console.log(`MISS  ${name} (exit ${r.status})`); }
}
console.log(`\n${caught}/${M.length} replay mutants caught`);
process.exit(missed.length ? 1 : 0);
