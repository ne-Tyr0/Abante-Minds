/* Mutation test for tests/validate-packs.js: each broken pack must fail with
   the expected message, and each control must still pass. Slow (a minute or
   two): every mutant runs the full generation sweep.

   Run:  node tests/mutation/validator.js        Exits 1 if any mutant survives. */
"use strict";
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const os = require("os");
// The repository under test (default: this checkout) and a scratch folder to
// break copies in (default: a fresh temp folder).
const REPO = process.argv[2] || path.join(__dirname, "..", "..");
const WORK = process.argv[3] || fs.mkdtempSync(path.join(os.tmpdir(), "am-mutants-"));

function fresh() {
  fs.rmSync(WORK, { recursive: true, force: true });
  for (const f of ["app/icons.js", "app/content.js", "app/app.js", "app/entry.js", "content/blueprint.json", "tests/validate-packs.js"]) {
    fs.mkdirSync(path.join(WORK, path.dirname(f)), { recursive: true });
    fs.copyFileSync(path.join(REPO, f), path.join(WORK, f));
  }
  fs.cpSync(path.join(REPO, "content/packs"), path.join(WORK, "content/packs"), { recursive: true });
}
const P = (f) => path.join(WORK, "content/packs/math", f);
const readJ = (f) => JSON.parse(fs.readFileSync(P(f), "utf8"));
const writeJ = (f, j) => fs.writeFileSync(P(f), JSON.stringify(j, null, 2));
function edit(file, fn) { const j = readJ(file); fn(j); writeJ(file, j); }
const tpl = (j, id) => j.templates.find((t) => t.id === id);

const M = [
  ["unknown template field", "money.json", (j) => { j.templates[0].hint = "x"; }, "unknown field 'hint'"],
  ["id in the wrong topic", "money.json", (j) => { j.templates[1].id = "percent.x"; }, "id must be 'money.'"],
  ["id not kebab", "money.json", (j) => { j.templates[1].id = "money.Fare_Times"; }, "id must be 'money.'"],
  ["duplicate id", "money.json", (j) => { j.templates[1].id = j.templates[0].id; }, "is used twice"],
  ["competency not in blueprint", "money.json", (j) => { j.templates[0].competency = "G9.Q9.9"; }, "is not in the blueprint"],
  ["competency not practicable", "money.json", (j) => { j.templates[0].competency = "G5.Q3.1"; j.templates[0].domain = "DP"; }, "not practicable"],
  ["domain mismatch", "money.json", (j) => { j.templates[0].domain = "MG"; }, "does not match G5.Q2.10"],
  ["empty construct", "money.json", (j) => { j.templates[0].construct = " "; }, "construct must be described"],
  ["schema not in blueprint", "money.json", (j) => { j.templates[0].schema = "guess"; }, "schema 'guess'"],
  ["param with two kinds", "money.json", (j) => { j.templates[0].params.price.choose = [50]; }, "exactly one of"],
  ["param unknown field", "money.json", (j) => { j.templates[0].params.price.stp = 5; }, "unknown fields: stp"],
  ["param reserved name", "money.json", (j) => { const t = j.templates[1]; t.params.floor = { value: "1" }; }, "'floor' is reserved"],
  ["param bad name", "money.json", (j) => { const t = j.templates[1]; t.params["2x"] = { value: "1" }; }, "is not a valid name"],
  ["forward reference", "money.json", (j) => { j.templates[0].params.price = { range: [23, "bill"] }; }, "uses 'bill', which is not defined there"],
  ["tiers without tier 1", "money.json", (j) => { j.templates[1].params.n = { tiers: { "2": [4, 9] } }; }, "must define tier 1"],
  ["tier 5", "money.json", (j) => { j.templates[1].params.n = { tiers: { "1": [4, 9], "5": [4, 12] } }; }, "only be 1 to 4"],
  ["step without range", "money.json", (j) => { j.templates[0].params.bill.step = 5; }, "step only applies to a range"],
  ["negative choose", "money.json", (j) => { j.templates[0].params.bill.choose = [100, -5]; }, "choose has -5"],
  ["unparseable expression", "money.json", (j) => { j.templates[0].answer.value = "bill -"; }, "cannot parse"],
  ["unknown function", "money.json", (j) => { j.templates[0].answer.value = "sqrt(bill)"; }, "cannot parse"],
  ["answer type not inputtable", "money.json", (j) => { j.templates[0].answer.type = "exponent"; }, "needs the answer-input rebuild"],
  ["answer type unknown", "money.json", (j) => { j.templates[0].answer.type = "money"; }, "is not in the blueprint"],
  ["maxDecimals too many", "percent.json", (j) => { tpl(j, "percent.sale-price").answer.maxDecimals = 5; }, "maxDecimals"],
  ["maxDecimals on an integer", "money.json", (j) => { j.templates[0].answer.maxDecimals = 2; }, "maxDecimals"],
  ["choice without label", "money.json", (j) => { delete tpl(j, "money.what-is-left").answer.label; }, "answer label must be non-empty"],
  ["label on a typed answer", "money.json", (j) => { j.templates[0].answer.label = "{value}"; }, "label is only for choice"],
  ["no formats", "money.json", (j) => { j.templates[0].formats = []; }, "at least one format"],
  ["duplicate format id", "money.json", (j) => { const f = j.templates[0].formats; f.push(Object.assign({}, f[0])); }, "id is used twice"],
  ["prompt reveals the answer", "money.json", (j) => { j.templates[0].formats[0].prompt += " ({answer})"; }, "uses 'answer'"],
  ["two hints", "money.json", (j) => { j.templates[0].hints.pop(); }, "hints must be exactly 3"],
  ["four steps", "money.json", (j) => { j.templates[0].steps.push("x"); }, "steps must be exactly 3"],
  ["unknown slot name", "money.json", (j) => { j.templates[0].steps[0] = "{prise}"; }, "uses 'prise'"],
  ["unbalanced brace", "money.json", (j) => { j.templates[0].explain += " {"; }, "unbalanced braces"],
  ["fallback unknown name", "ratio.json", (j) => { j.templates[0].fallback = "{kilo}"; }, "uses 'kilo'"],
  ["choice with two distractors", "money.json", (j) => { tpl(j, "money.what-is-left").distractors.pop(); }, "exactly 3 distractors"],
  ["typed with no distractors", "money.json", (j) => { j.templates[0].distractors = []; }, "at least one expected mistake"],
  ["duplicate error code", "money.json", (j) => { const d = j.templates[0].distractors; d[1].error = d[0].error; }, "is used twice"],
  ["error code not kebab", "money.json", (j) => { j.templates[0].distractors[0].error = "Added Wrong"; }, "kebab-case error code"],
  ["feedback unknown name", "money.json", (j) => { j.templates[0].distractors[0].feedback = "{valu}"; }, "uses 'valu'"],
  ["distractor unknown field", "money.json", (j) => { j.templates[0].distractors[0].why = "x"; }, "unknown field 'why'"],
  ["pinned unknown template", "money.json", (j) => { j.pinned[0].template = "money.nope"; }, "unknown template"],
  ["pinned missing a value", "money.json", (j) => { delete j.pinned[0].params.bill; }, "does not set bill"],
  ["pinned sets a computed value", "money.json", (j) => { j.pinned[0].params.toTen = 7; }, "not drawn values"],
  ["pinned outside range", "money.json", (j) => { j.pinned[0].params.price = 95; }, "outside the values it draws"],
  ["pinned off step", "ratio.json", (j) => { j.pinned[0].params.perKilo = 155; }, "outside the values it draws"],
  ["pinned not a choice", "money.json", (j) => { j.pinned[0].params.bill = 1000; }, "not one of its choices"],
  ["pinned unknown format", "money.json", (j) => { j.pinned[0].format = "rice"; }, "no format 'rice'"],
  ["empty literal range", "money.json", (j) => { j.templates[1].params.n = { range: [9, 4] }; }, "range [9,4] is empty"],
  ["empty range at run time", "money.json", (j) => { tpl(j, "money.what-is-left").params.b = { range: [60, "a - 100"], step: 5 }; }, "is empty"],
  ["range not whole steps", "money.json", (j) => { j.templates[1].params.n = { range: [4, 9], step: 2 }; }, "not a whole number of steps"],
  ["pinned item, two formats, none named", "money.json", (j) => { const f = j.templates[0].formats; f.push(Object.assign({}, f[0], { id: "second" })); }, null],
  ["answer never valid", "money.json", (j) => { j.templates[0].answer.value = "price - bill"; }, "no usable question"],
  ["repeating decimal shown", "money.json", (j) => { j.templates[0].explain = "{price / 3}"; }, "repeating decimal"],
  ["mistake never usable", "money.json", (j) => { j.templates[0].distractors[1].value = "answer"; }, "'gave-the-price' was never usable"],
  ["mistakes always ambiguous", "money.json", (j) => { const d = j.templates[0].distractors; d[1].value = d[0].value; }, "was never usable"],
  ["mostly rejected", "money.json", (j) => { j.templates[0].where = ["price == 50"]; }, "rejects"],
  ["format never shown", "money.json", (j) => { const f = j.templates[0].formats; f.push(Object.assign({}, f[0], { id: "second" })); j.templates[0].where = ["true"]; }, null],
  ["manifest unknown icon", "manifest.json", (j) => { j.topics[0].icon = "banana"; }, "icon 'banana'"],
  ["manifest bad colorKey", "manifest.json", (j) => { j.topics[0].colorKey = 7; }, "colorKey"],
  ["manifest bad version", "manifest.json", (j) => { j.version = "1"; }, "version must be"],
  ["manifest no fallback", "manifest.json", (j) => { delete j.fallbackFeedback; }, "fallbackFeedback"],
  ["manifest wrong subtest", "manifest.json", (j) => { j.subtest = "verbal"; }, "does not match its folder"],
  ["not a placeholder: money not a blueprint topic", "manifest.json", (j) => { j.placeholder = false; }, "topic 'money' is not in the blueprint"],
  ["topic file mislabelled", "money.json", (j) => { j.topic = "cash"; }, "file says topic 'cash'"],
  ["unit answer without its unit", "money.json", (j) => { j.templates[1].answer.type = "unit"; }, "needs its unit"],
  ["unit on a non-unit answer", "money.json", (j) => { j.templates[1].answer.unit = "cm"; }, "unit is only for unit answers"],
  ["form on a whole-number answer", "money.json", (j) => { j.templates[1].answer.form = "any"; }, "form is only for fraction"],
  ["form with an unknown value", "money.json", (j) => { Object.assign(j.templates[0].answer, { type: "fraction", value: "price / bill", form: "simplest" }); delete j.templates[0].answer.prefix; }, "form is only for fraction"],
  ["mistake named like a form mistake", "money.json", (j) => { j.templates[0].distractors[0].error = "not-lowest-terms"; }, "is a form mistake"],
  ["fraction answers without form feedback", "money.json", (j) => { Object.assign(j.templates[0].answer, { type: "fraction", value: "price / bill" }); delete j.templates[0].answer.prefix; }, "formFeedback is required"],
  ["form feedback missing an entry", "manifest.json", (j) => { j.formFeedback = { "not-lowest-terms": "x", "not-a-mixed-number": "y" }; }, "needs plain text for 'fraction-part-not-proper'"],
  ["form feedback with an unknown entry", "manifest.json", (j) => { j.formFeedback = { "not-lowest-terms": "x", "not-a-mixed-number": "y", "fraction-part-not-proper": "z", "too-big": "w" }; }, "unknown entry 'too-big'"],
  ["maxDecimals on a percent answer", "money.json", (j) => { Object.assign(j.templates[1].answer, { type: "percent", maxDecimals: 2 }); delete j.templates[1].answer.prefix; }, null],
  ["answer longer than the keypad", "money.json", (j) => { j.templates[0].params.bill.choose = [100000000]; j.pinned = []; }, "longer than the keypad's 7 characters"]
];

/* A fraction template that should pass once the pack supplies form feedback. */
const CONTROL_FRACTION = ["fraction answer with form feedback", (dir) => {
  const m = path.join(dir, "content/packs/math/manifest.json");
  const j = JSON.parse(fs.readFileSync(m, "utf8"));
  j.formFeedback = { "not-lowest-terms": "Lowest terms.", "not-a-mixed-number": "Mixed number.", "fraction-part-not-proper": "Too big." };
  fs.writeFileSync(m, JSON.stringify(j, null, 2));
  edit("money.json", (t) => { Object.assign(t.templates[0].answer, { type: "fraction", value: "price / bill" }); delete t.templates[0].answer.prefix; });
}];

let caught = 0;
const missed = [];
function run(name, expect) {
  const r = spawnSync(process.execPath, [path.join(WORK, "tests/validate-packs.js")], { encoding: "utf8" });
  const out = r.stdout + r.stderr;
  if (expect === null) {
    if (r.status === 0) { caught++; console.log(`ok    control: ${name} passes`); }
    else { missed.push(name); console.log(`MISS  control: ${name} failed\n${out.split("\n").slice(-6).join("\n")}`); }
    return;
  }
  if (r.status === 1 && out.includes(expect)) { caught++; console.log(`ok    ${name}`); }
  else { missed.push(name); console.log(`MISS  ${name} (exit ${r.status})\n${out.split("\n").slice(-6).join("\n")}`); }
}
for (const [name, file, fn, expect] of M) { fresh(); edit(file, fn); run(name, expect); }
fresh(); CONTROL_FRACTION[1](WORK); run(CONTROL_FRACTION[0], null);
const total = M.length + 1;
console.log(`\n${caught}/${total} mutants behaved as expected`);
process.exit(missed.length ? 1 : 0);
