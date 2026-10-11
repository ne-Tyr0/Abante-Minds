/* Mutation test for tests/item-spec.js: break the item specification
   generator one way at a time and require the tests to fail.

   Run:  node tests/mutation/item-spec.js        Exits 1 if any mutant survives. */
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");
// The repository under test (default: this checkout) and a scratch folder to
// break copies in (default: a fresh temp folder).
const REPO = process.argv[2] || path.join(__dirname, "..", "..");
const WORK = process.argv[3] || fs.mkdtempSync(path.join(os.tmpdir(), "am-mutants-"));
const SRC = fs.readFileSync(path.join(REPO, "tools/item-spec.js"), "utf8").split("\r\n").join("\n");

const M = [
  ["worked-out params listed", '    if ("value" in spec) continue;\n', ""],
  ["a tier's span runs into the next", "keys[i + 1] - 1 : LAST_TIER", "keys[i + 1] : LAST_TIER"],
  ["the step left out", ' + (step === undefined ? "" : ` in steps of ${step}`)', ""],
  ["the unit left out", "  if (a.unit) bits.push(`in ${a.unit}`);\n", ""],
  ["1 decimal places", '${a.maxDecimals === 1 ? "" : "s"}', "s"],
  ["example at another tier", "C.generate(t.id, EXAMPLE_TIER, EXAMPLE_SEED)", "C.generate(t.id, EXAMPLE_TIER + 1, EXAMPLE_SEED)"],
  ["choice example shows the first choice", "q.choices[q.answerIndex]", "q.choices[0]"],
  ["the peso sign dropped", '(q.unit || "") + q.answerText', "q.answerText"],
  ["a level's first template skipped", "for (const id of level.templates || [])", "for (const id of (level.templates || []).slice(1))"],
  ["Basics before the path", '[[manifest.topics, "path"], [manifest.basics || [], "basics"]]', '[[manifest.basics || [], "basics"], [manifest.topics, "path"]]'],
  ["review shown as an empty level", '      if (level.kind === "review") {', "      if (false) {"],
  ["Basics with no competency text", '  if (!t.competency) return "none (Basics: a fact or method under the blueprint)";\n', ""],
  ["quotes not doubled", "'\"' + s.replace(/\"/g, '\"\"') + '\"'", "'\"' + s + '\"'"],
  ["a line break left unquoted", '/[",\\r\\n]/', '/[",]/'],
  ["no byte-order mark", 'return "\\uFEFF" + lines.join', "return lines.join"],
  ["a Windows checkout reads as stale", 'text.replace(/\\r\\n/g, "\\n") === markdown()', "text === markdown()"]
];

fs.mkdirSync(path.join(WORK, "app"), { recursive: true });
fs.mkdirSync(path.join(WORK, "tests"), { recursive: true });
fs.mkdirSync(path.join(WORK, "tools"), { recursive: true });
fs.copyFileSync(path.join(REPO, "app/content.js"), path.join(WORK, "app/content.js"));
fs.copyFileSync(path.join(REPO, "tests/item-spec.js"), path.join(WORK, "tests/item-spec.js"));
fs.cpSync(path.join(REPO, "content"), path.join(WORK, "content"), { recursive: true });
let caught = 0;
const missed = [];
for (const [name, from, to] of M) {
  const n = SRC.split(from).length - 1;
  if (n !== 1) { missed.push(name); console.log(`BAD   ${name}: pattern found ${n} times`); continue; }
  fs.writeFileSync(path.join(WORK, "tools/item-spec.js"), SRC.replace(from, () => to));
  const r = spawnSync(process.execPath, [path.join(WORK, "tests/item-spec.js")], { encoding: "utf8" });
  const fails = (r.stdout.match(/^FAIL .*/gm) || []).map((l) => l.slice(5));
  if (r.status === 1 && fails.length) { caught++; console.log(`ok    ${name}  <- ${fails.join("; ")}`); }
  else { missed.push(name); console.log(`MISS  ${name} (exit ${r.status})`); }
}
console.log(`\n${caught}/${M.length} item-spec mutants caught`);
process.exit(missed.length ? 1 : 0);
