/* Mutation test for tests/validate-packs.js: each broken pack must fail with
   the expected message, and each control must still pass. Slow (a few
   minutes): a mutant that passes the static checks runs the full generation
   sweep.

   Run:  node tests/mutation/validator.js        Exits 1 if any mutant survives. */
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");
// The repository under test (default: this checkout) and a scratch folder to
// break copies in (default: a fresh temp folder).
const REPO = process.argv[2] || path.join(__dirname, "..", "..");
const WORK = process.argv[3] || fs.mkdtempSync(path.join(os.tmpdir(), "am-mutants-"));

function fresh() {
  fs.rmSync(WORK, { recursive: true, force: true });
  for (const f of ["app/icons.js", "app/content.js", "app/entry.js", "content/blueprint.json", "tests/validate-packs.js"]) {
    fs.mkdirSync(path.join(WORK, path.dirname(f)), { recursive: true });
    fs.copyFileSync(path.join(REPO, f), path.join(WORK, f));
  }
  fs.cpSync(path.join(REPO, "content/packs"), path.join(WORK, "content/packs"), { recursive: true });
}
const P = (f) => path.join(WORK, "content/packs/math", f);
const readJ = (f) => JSON.parse(fs.readFileSync(P(f), "utf8"));
const writeJ = (f, j) => fs.writeFileSync(P(f), JSON.stringify(j, null, 2));
function edit(file, fn) { const j = readJ(file); fn(j); writeJ(file, j); }
const tpl = (j, id) => j.templates.find((t) => t.id === "decimals." + id);
const lvl = (j, id) => j.levels.find((l) => l.id === id);
const D = "decimals.json", M = "manifest.json", TT = "times.json";
const ttpl = (j, id) => j.templates.find((t) => t.id === "times." + id);
const PIECES = { template: "decimals.how-many-pieces", params: { vi: 25, t: 30, p: 45 } };
const DA = "data.json";
const chart = (j, id) => j.templates.find((t) => t.id === "data." + id).chart;
const pin = (j, p) => { j.pinned = [Object.assign({}, PIECES, p, { params: Object.assign({}, PIECES.params, p && p.params) })]; };

const MUTANTS = [
  // templates
  ["unknown template field", D, (j) => { j.templates[0].hint = "x"; }, "unknown field 'hint'"],
  ["id in the wrong topic", D, (j) => { j.templates[1].id = "fractions.x"; }, "id must be 'decimals.'"],
  ["id not kebab", D, (j) => { j.templates[1].id = "decimals.Write_It"; }, "id must be 'decimals.'"],
  ["duplicate id", D, (j) => { j.templates[1].id = j.templates[0].id; }, "is used twice"],
  ["competency not in blueprint", D, (j) => { j.templates[0].competency = "G9.Q9.9"; }, "is not in the blueprint"],
  ["competency not practicable", D, (j) => { j.templates[0].competency = "G5.Q3.1"; j.templates[0].domain = "DP"; }, "not practicable"],
  ["domain mismatch", D, (j) => { j.templates[0].domain = "MG"; }, "does not match G5.Q2.4"],
  ["competency of another topic", D, (j) => { j.templates[0].competency = "G5.Q2.11"; }, "belongs to topic 'factors'"],
  ["empty construct", D, (j) => { j.templates[0].construct = " "; }, "construct must be described"],
  ["schema not in blueprint", D, (j) => { j.templates[0].schema = "guess"; }, "schema 'guess'"],
  // params
  ["param with two kinds", D, (j) => { j.templates[0].params.d1.choose = [5]; }, "exactly one of"],
  ["param unknown field", D, (j) => { j.templates[0].params.d1.stp = 5; }, "unknown fields: stp"],
  ["param reserved name", D, (j) => { j.templates[0].params.floor = { value: "1" }; }, "'floor' is reserved"],
  ["param bad name", D, (j) => { j.templates[0].params["2x"] = { value: "1" }; }, "is not a valid name"],
  ["forward reference", D, (j) => { j.templates[0].params.d1 = { range: [1, "p"] }; }, "uses 'p', which is not defined there"],
  ["tiers without tier 1", D, (j) => { j.templates[0].params.w = { tiers: { "2": [1, 9] } }; }, "must define tier 1"],
  ["tier 5", D, (j) => { j.templates[0].params.w = { tiers: { "1": [1, 9], "5": [10, 20] } }; }, "only be 1 to 4"],
  ["step without range", D, (j) => { tpl(j, "change-money").params.bill.step = 5; }, "step only applies to a range"],
  ["negative choose", D, (j) => { tpl(j, "change-money").params.bill.choose = [100, -5]; }, "choose has -5"],
  ["empty literal range", D, (j) => { j.templates[1].params.w = { range: [9, 4] }; }, "range [9,4] is empty"],
  ["empty range at run time", D, (j) => { tpl(j, "what-is-left").params.s1 = { range: ["total", "total - 5"], step: 0.25 }; }, "is empty"],
  ["range not whole steps", D, (j) => { tpl(j, "change-money").params.p2 = { range: [10, 40], step: 0.7 }; }, "not a whole number of steps"],
  // answers
  ["unparseable expression", D, (j) => { j.templates[0].answer.value = "g /"; }, "cannot parse"],
  ["unknown function", D, (j) => { j.templates[0].answer.value = "sqrt(g)"; }, "cannot parse"],
  ["answer type not inputtable", D, (j) => { j.templates[0].answer.type = "exponent"; }, "needs the answer-input rebuild"],
  ["answer type unknown", D, (j) => { j.templates[0].answer.type = "money"; }, "is not in the blueprint"],
  ["maxDecimals too many", D, (j) => { tpl(j, "change-money").answer.maxDecimals = 5; }, "maxDecimals"],
  ["maxDecimals on an integer", D, (j) => { tpl(j, "how-many-pieces").answer.maxDecimals = 2; }, "maxDecimals"],
  ["choice without label", D, (j) => { delete tpl(j, "greatest").answer.label; }, "answer label must be non-empty"],
  ["label on a typed answer", D, (j) => { j.templates[0].answer.label = "{value}"; }, "label is only for choice"],
  ["order on a typed answer", D, (j) => { j.templates[0].answer.order = "mixed"; }, "order is only for choice"],
  ["order with an unknown value", D, (j) => { tpl(j, "greatest").answer.order = "random"; }, "order is only for choice"],
  ["unit answer without its unit", D, (j) => { tpl(j, "how-many-pieces").answer.type = "unit"; }, "needs its unit"],
  ["unit on a non-unit answer", D, (j) => { tpl(j, "how-many-pieces").answer.unit = "cm"; }, "unit is only for unit answers"],
  ["form on a whole-number answer", D, (j) => { tpl(j, "how-many-pieces").answer.form = "any"; }, "form is only for fraction"],
  ["form with an unknown value", D, (j) => { tpl(j, "to-fraction").answer.form = "simplest"; }, "form is only for fraction"],
  ["answer never valid", D, (j) => { j.templates[0].answer.value = "0 - g"; }, "no usable question"],
  ["answer longer than the keypad", D, (j) => { tpl(j, "change-money").params.bill.choose = [100000000]; }, "longer than the keypad's 7 characters"],
  // formats and text
  ["no formats", D, (j) => { j.templates[0].formats = []; }, "at least one format"],
  ["duplicate format id", D, (j) => { const f = j.templates[0].formats; f.push(Object.assign({}, f[0])); }, "id is used twice"],
  ["prompt reveals the answer", D, (j) => { j.templates[0].formats[0].prompt += " ({answer})"; }, "uses 'answer'"],
  ["two hints", D, (j) => { j.templates[0].hints.pop(); }, "hints must be exactly 3"],
  ["four steps", D, (j) => { j.templates[0].steps.push("x"); }, "steps must be exactly 3"],
  ["unknown slot name", D, (j) => { j.templates[0].steps[0] = "{nn}"; }, "uses 'nn'"],
  ["unbalanced brace", D, (j) => { j.templates[0].explain += " {"; }, "unbalanced braces"],
  ["fallback unknown name", D, (j) => { j.templates[0].fallback = "{kilo}"; }, "uses 'kilo'"],
  ["repeating decimal shown", D, (j) => { j.templates[0].explain = "{g / 3}"; }, "repeating decimal"],
  // distractors
  ["choice with two distractors", D, (j) => { tpl(j, "greatest").distractors.pop(); }, "exactly 3 distractors"],
  ["typed with no distractors", D, (j) => { j.templates[0].distractors = []; }, "at least one expected mistake"],
  ["duplicate error code", D, (j) => { const d = j.templates[0].distractors; d[1].error = d[0].error; }, "is used twice"],
  ["error code not kebab", D, (j) => { j.templates[0].distractors[0].error = "Gave Digit"; }, "kebab-case error code"],
  ["mistake named like a form mistake", D, (j) => { j.templates[0].distractors[0].error = "not-lowest-terms"; }, "is a form mistake"],
  ["feedback unknown name", D, (j) => { j.templates[0].distractors[0].feedback = "{valu}"; }, "uses 'valu'"],
  ["distractor unknown field", D, (j) => { j.templates[0].distractors[0].why = "x"; }, "unknown field 'why'"],
  ["mistake never usable", D, (j) => { j.templates[0].distractors[0].value = "answer"; }, "'gave-the-digit' was never usable"],
  ["mistakes always ambiguous", D, (j) => { const d = j.templates[0].distractors; d[2].value = d[0].value; }, "was never usable"],
  ["mostly rejected", D, (j) => { tpl(j, "add").where.push("w1 == 5"); }, "rejects"],
  // pinned items
  ["pinned unknown template", D, (j) => { j.pinned = [{ template: "decimals.nope", params: {} }]; }, "unknown template"],
  ["pinned missing a value", D, (j) => { pin(j); delete j.pinned[0].params.p; }, "does not set p"],
  ["pinned sets a computed value", D, (j) => { pin(j, { params: { v: 0.25 } }); }, "not drawn values"],
  ["pinned outside range", D, (j) => { pin(j, { params: { p: 95 } }); }, "outside the values it draws"],
  ["pinned off step", D, (j) => { j.pinned = [{ template: "decimals.change-money", params: { p1: 15.1, p2: 10.25, bill: 100 } }]; }, "outside the values it draws"],
  ["pinned not a choice", D, (j) => { pin(j, { params: { vi: 30 } }); }, "not one of its choices"],
  ["pinned unknown format", D, (j) => { pin(j, { format: "rope" }); }, "no format 'rope'"],
  // the manifest and the path
  ["manifest unknown icon", M, (j) => { j.topics[0].icon = "banana"; }, "icon 'banana'"],
  ["manifest bad colorKey", M, (j) => { j.topics[0].colorKey = 7; }, "colorKey"],
  ["manifest bad version", M, (j) => { j.version = "1"; }, "version must be"],
  ["manifest no fallback", M, (j) => { delete j.fallbackFeedback; }, "fallbackFeedback"],
  ["manifest wrong subtest", M, (j) => { j.subtest = "verbal"; }, "does not match its folder"],
  ["wrong exam date", M, (j) => { j.examDate = "2027-02-01"; }, "examDate must be"],
  ["wrong competency count", M, (j) => { j.blueprintCompetencies = 90; }, "blueprintCompetencies must be 94"],
  ["topic missing from the path", M, (j) => { j.topics = j.topics.filter((t) => t.key !== "transform"); }, "blueprint topic 'transform' is not on the path"],
  ["topic on the path twice", M, (j) => { j.topics.push(Object.assign({}, j.topics[1])); }, "on the path twice"],
  ["topic not in the blueprint", M, (j) => { j.topics[1].key = "money"; }, "topic 'money' is not in the blueprint"],
  ["coming soon with a file", M, (j) => { j.topics.find((t) => t.comingSoon).file = "fractions.json"; }, "a topic coming soon has no file yet"],
  ["written topic without a file", M, (j) => { delete j.topics[0].file; }, "a written topic needs its file"],
  ["unknown topic field", M, (j) => { j.topics[0].colour = 1; }, "unknown field 'colour'"],
  ["fraction answers without form feedback", M, (j) => { delete j.formFeedback; }, "formFeedback is required"],
  ["form feedback missing an entry", M, (j) => { delete j.formFeedback["fraction-part-not-proper"]; }, "needs plain text for 'fraction-part-not-proper'"],
  ["form feedback with an unknown entry", M, (j) => { j.formFeedback["too-big"] = "w"; }, "unknown entry 'too-big'"],
  ["topic file mislabelled", D, (j) => { j.topic = "cash"; }, "file says topic 'cash'"],
  ["topic file unknown field", D, (j) => { j.extra = 1; }, "unknown field 'extra'"],
  // levels
  ["no levels", D, (j) => { j.levels = []; }, "needs at least one level"],
  ["level id not kebab", D, (j) => { j.levels[0].id = "Place Value"; }, "id must be kebab-case"],
  ["level id twice", D, (j) => { j.levels[1].id = j.levels[0].id; }, "id is used twice"],
  ["level without a title", D, (j) => { delete j.levels[0].title; }, "needs a plain title"],
  ["level with one template", D, (j) => { lvl(j, "word-problems").templates.pop(); }, "needs at least two templates"],
  ["template in no level", D, (j) => { lvl(j, "place-value").templates.pop(); }, "is in no level"],
  ["template in two levels", D, (j) => { lvl(j, "compare-and-round").templates.push("decimals.digit-value"); }, "is in level 'place-value' and 'compare-and-round'"],
  ["level names an unknown template", D, (j) => { lvl(j, "place-value").templates.push("decimals.nope"); }, "names unknown template decimals.nope"],
  ["unknown level field", D, (j) => { j.levels[0].colour = 1; }, "unknown field 'colour'"],
  // lessons
  ["lesson of one card", D, (j) => { j.levels[0].lesson = [j.levels[0].lesson[1]]; }, "two or three cards"],
  ["lesson of four cards", D, (j) => { const l = j.levels[0].lesson; l.push(l[0]); }, "two or three cards"],
  ["lesson with no example", D, (j) => { j.levels[0].lesson[1] = { title: "Idea", body: "Words." }; }, "needs a worked example"],
  ["example from another level", D, (j) => { j.levels[0].lesson[1].example.template = "decimals.round"; }, "which is not in this level"],
  ["example outside its ranges", D, (j) => { j.levels[0].lesson[1].example.params.d1 = 12; }, "d1=12 is outside the values it draws"],
  ["example breaks a constraint", D, (j) => { j.levels[0].lesson[1].example.params.d2 = 5; }, "break a constraint"],
  ["example unknown format", D, (j) => { j.levels[0].lesson[1].example.format = "nope"; }, "no format 'nope'"],
  ["text card with slots", D, (j) => { j.levels[0].lesson[0].body = "{x}"; }, "needs plain body text"],
  ["text card without a title", D, (j) => { delete j.levels[0].lesson[0].title; }, "needs a plain title"],
  ["lesson card unknown field", D, (j) => { j.levels[0].lesson[0].image = "x"; }, "unknown field 'image'"],
  // coverage
  ["competency left without a template", D, (j) => {
    j.templates = j.templates.filter((t) => t.id !== "decimals.how-many-pieces");
    j.levels.forEach((l) => { l.templates = l.templates.filter((id) => id !== "decimals.how-many-pieces"); });
    lvl(j, "word-problems").templates.push("decimals.divide-by-whole");
    lvl(j, "divide").templates = lvl(j, "divide").templates.filter((id) => id !== "decimals.divide-by-whole");
  }, "no template for G6.Q1.10"],
  ["fewer templates than the blueprint targets", D, (j) => {
    const drop = ["decimals.from-fraction", "decimals.between", "decimals.multiply-money"];
    j.templates = j.templates.filter((t) => !drop.includes(t.id));
    j.levels.forEach((l) => { l.templates = l.templates.filter((id) => !drop.includes(id)); });
  }, "19 templates; the blueprint targets 20"],
  // Basics
  ["Basics template with a competency", TT, (j) => { ttpl(j, "x2").competency = "G5.Q1.8"; }, "a Basics template has no competency"],
  ["Basics template in no domain", TT, (j) => { ttpl(j, "x2").domain = "XX"; }, "domain XX is not one of the blueprint's domains"],
  ["grid on a path template", D, (j) => { j.templates[0].grid = true; }, "grid is only for Basics facts"],
  ["grid not true", TT, (j) => { ttpl(j, "x2").grid = "yes"; }, "grid is true or absent"],
  ["grid template without a drawn y", TT, (j) => { ttpl(j, "x8").params.y = { value: "8" }; }, "needs a drawn param 'y'"],
  ["facts level on the path", D, (j) => { j.levels[0].kind = "facts"; }, "kind is facts or review, and only in a Basics topic"],
  ["unknown level kind", TT, (j) => { j.levels[0].kind = "drill"; }, "kind is facts or review"],
  ["review level with templates", TT, (j) => { j.levels[5].templates = ["times.x2"]; }, "lists no templates"],
  ["review level with a lesson", TT, (j) => { j.levels[5].lesson = j.levels[0].lesson; }, "a review level has no lesson"],
  ["nothing to review", TT, (j) => { j.levels = [j.levels[5]]; }, "there are no facts levels to review"],
  ["tiers in a fact", TT, (j) => { ttpl(j, "x10").params.y = { tiers: { "1": [3, 10] } }; }, "has tiers"],
  ["grid template in a practice level", TT, (j) => { delete j.levels[3].kind; }, "is on the grid, so it belongs in a facts level"],
  ["a grid with no grid templates", TT, (j) => { j.templates.forEach((t) => { delete t.grid; }); }, "a grid needs templates marked grid"],
  ["grid templates with no grid", TT, (j) => { delete j.grid; }, "templates are marked grid, but the topic has no grid"],
  ["grid sign", TT, (j) => { j.grid.sign = "x"; }, "grid sign is × or +"],
  ["grid range backwards", TT, (j) => { j.grid.from = 5; j.grid.to = 3; }, "grid from and to are whole numbers"],
  ["a grid cell with no fact", TT, (j) => { ttpl(j, "x12").params.y.choose = ttpl(j, "x12").params.y.choose.filter((y) => y !== 12); }, "no fact for 12 × 12"],
  ["a grid cell with the wrong fact", TT, (j) => { ttpl(j, "x2").answer.value = "x * y + 2"; }, "whose answer is"],
  ["a facts template with no facts", TT, (j) => { ttpl(j, "x8").where = ["y > 100"]; }, "lists no facts"],
  ["a facts template with too many facts", TT, (j) => { ttpl(j, "x11").params.y = { range: [2, 300] }; }, "a template holds at most 200"],
  ["a mistake no fact can use", TT, (j) => { ttpl(j, "x8").distractors.push({ value: "x * y", error: "the-answer", feedback: "{value}" }); }, "was never usable on any of its 1 facts"],
  ["Basics key of a path topic", M, (j) => { j.basics[0].key = "decimals"; }, "has the key of a topic on the path"],
  ["Basics topic listed twice", M, (j) => { j.basics.push(Object.assign({}, j.basics[0])); }, "is listed twice"],
  ["Basics topic without a file", M, (j) => { delete j.basics[0].file; }, "a Basics topic needs its file"],
  ["Basics topic coming soon", M, (j) => { j.basics[0].comingSoon = true; }, "unknown field 'comingSoon'"],
  ["Basics not a list", M, (j) => { j.basics = {}; }, "basics must be a list"],
  ["Basics file for another topic", TT, (j) => { j.topic = "time"; }, "file says topic 'time'"],
  ["Basics file unknown field", TT, (j) => { j.pinned = []; }, "unknown field 'pinned'"],
  // charts
  ["chart unknown field", DA, (j) => { chart(j, "read-bar").colour = 1; }, "chart has an unknown field 'colour'"],
  ["chart of an unknown kind", DA, (j) => { chart(j, "read-bar").kind = "scatter"; }, "chart kind is one of bar, line, pie, table"],
  ["chart that states the answer", DA, (j) => { chart(j, "read-bar").title = "{answer}"; }, "chart title {answer} uses 'answer'"],
  ["pie with an axis", DA, (j) => { chart(j, "pie-angle").axis = "Pupils"; }, "a pie graph has no axis"],
  ["pie in an unknown unit", DA, (j) => { chart(j, "pie-angle").unit = "deg"; }, "a pie graph's unit is % or °"],
  ["pie of one slice", DA, (j) => { const c = chart(j, "pie-angle"); c.slices = c.slices.slice(0, 1); }, "a pie graph has 2 to 6 slices"],
  ["series short of a value", DA, (j) => { chart(j, "read-bar").series[0].values.pop(); }, "series 0 needs one value per category"],
  ["graph with three series", DA, (j) => { const s = chart(j, "read-bar").series; s.push(s[0]); }, "a bar has 1 to 2 series"],
  ["table with a step", DA, (j) => { chart(j, "table-difference").step = "1"; }, "a table has no step"],
  ["graph with no step", DA, (j) => { delete chart(j, "read-bar").step; }, "chart step must be an expression"],
  ["graph of one category", DA, (j) => { const c = chart(j, "read-bar"); c.categories = c.categories.slice(0, 1); }, "a chart has 2 to 8 categories"],
  ["value between gridlines", DA, (j) => { chart(j, "read-bar").step = "st * 3"; }, "so it cannot be read"],
  ["too many gridlines", DA, (j) => { chart(j, "read-bar").step = "st / 2"; }, "steps up its side; it needs 2 to 10"],
  ["negative value", DA, (j) => { chart(j, "read-bar").series[0].values[0] = "0 - a1"; }, "has the value -"],
  ["categories too long to fit", DA, (j) => { chart(j, "read-bar").categories[0] = "The long rainy month"; }, "categories do not fit"],
  ["two categories the same", DA, (j) => { const c = chart(j, "read-line"); c.categories[1] = c.categories[0]; }, "names two categories the same"],
  ["two series the same", DA, (j) => { const s = chart(j, "read-bar").series; s[1].name = s[0].name; }, "names two series the same"],
  ["series name too long", DA, (j) => { chart(j, "read-bar").series[0].name = "The Grade 5 pupils of Rizal"; }, "is longer than 16 characters"],
  ["chart title too long", DA, (j) => { chart(j, "table-difference").title = "The price of a kilo of well-milled rice at two stores"; }, "title is longer than 48 characters"],
  ["pie that is not one whole", DA, (j) => { chart(j, "pie-angle").slices[3].value = "p4 + 5"; }, "not 100%"],
  ["pie slice too thin to label", DA, (j) => { j.templates.find((t) => t.id === "data.pie-angle").params.p1.range = [5, 35]; }, "too thin to label"],
  ["pie slice in parts of a per cent", DA, (j) => { const c = chart(j, "pie-angle"); c.slices[0].value = "p1 + 0.5"; c.slices[3].value = "p4 - 0.5"; }, "not a whole number"],
  ["pie with two hidden slices", DA, (j) => { chart(j, "pie-missing").slices[0].hidden = "sl != 1"; }, "hides more than one slice"],
  ["two slices the same", DA, (j) => { const s = chart(j, "pie-angle").slices; s[1].name = s[0].name; }, "names two slices the same"],
  ["slice name too long", DA, (j) => { chart(j, "pie-percent").slices[0].name = "Science and Health"; }, "slice name 'Science and Health' is longer than 16"],
  ["slice with an unknown field", DA, (j) => { chart(j, "pie-angle").slices[0].colour = "red"; }, "slice 0 has an unknown field 'colour'"],
  ["chart label using an unknown name", DA, (j) => { chart(j, "table-difference").label = "{peso(price)}"; }, "chart label {peso(price)} uses 'price'"],
  // clock times
  ["time answer past midnight", "time.json", (j) => { j.templates.find((t) => t.id === "time.end-time").answer.value = "s + d + 1440"; }, "no usable question"],
  ["clock() past midnight", "time.json", (j) => { j.templates.find((t) => t.id === "time.end-time").explain = "{clock(s + 1440)}"; }, "0 to 1439 minutes after midnight"],
  // controls: these must pass
  ["control: pinned item, two formats, none named", D, (j) => { pin(j); }, null],
  ["control: a fourth format", D, (j) => { const f = j.templates[0].formats; f.push(Object.assign({}, f[0], { id: "fourth" })); }, null],
  ["control: a percent answer with places", D, (j) => { const a = tpl(j, "change-money").answer; a.type = "percent"; delete a.prefix; }, null],
  ["control: a smaller grid", TT, (j) => { j.grid.to = 10; }, null],
  ["control: a table with a third column", DA, (j) => { chart(j, "table-difference").series.push({ name: "Store C", values: ["a1", "b1", "a2", "b2"] }); }, null]
];

/* MUTANT=<part of a name> runs only the matching mutants. */
const ONLY = process.env.MUTANT;
const RUN = ONLY ? MUTANTS.filter(([name]) => name.includes(ONLY)) : MUTANTS;

let caught = 0;
const missed = [];
for (const [name, file, fn, expect] of RUN) {
  fresh();
  edit(file, fn);
  const r = spawnSync(process.execPath, [path.join(WORK, "tests/validate-packs.js")], { encoding: "utf8" });
  const out = r.stdout + r.stderr;
  const ok = expect === null ? r.status === 0 : r.status === 1 && out.includes(expect);
  if (ok) { caught++; console.log(`ok    ${name}`); }
  else { missed.push(name); console.log(`MISS  ${name} (exit ${r.status})\n${out.split("\n").slice(-6).join("\n")}`); }
}
console.log(`\n${caught}/${RUN.length} mutants behaved as expected`);
process.exit(missed.length ? 1 : 0);
