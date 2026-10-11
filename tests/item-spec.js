/* Item specification tests: what tools/item-spec.js says about a template,
   that it lists every template once with the engine's own example, and that
   its CSV and its staleness check hold.

   Run:  node tests/item-spec.js        Exits 1 on any failure. */
"use strict";
const assert = require("assert");
const S = require("../tools/item-spec.js");
const C = global.AM.content;

let failed = 0;
function test(name, fn) {
  try { fn(); console.log("ok   " + name); }
  catch (e) { failed++; console.log("FAIL " + name + "\n       " + e.message.split("\n")[0]); }
}

/* A CSV reader for the test, quoted cells and doubled quotes included. */
function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\r" && text[i + 1] === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; i++; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

test("draws lists what is drawn, not what is worked out from it", () => {
  const t = { params: {
    a: { range: [1, 5] }, b: { value: "a * 2" }, c: { choose: [2, 3] },
    d: { tiers: { 1: [2, 9], 3: [10, 99] } }, e: { range: ["a + 1", 9], step: 0.5 }
  } };
  assert.deepStrictEqual(S.draws(t), ["a: 1 to 5", "c: one of 2, 3", "d: 2 to 9 (tiers 1–2), 10 to 99 (tiers 3–4)", "e: a + 1 to 9 in steps of 0.5"]);
  assert.deepStrictEqual(S.draws({ params: { x: { value: "3" } } }), [], "a template that draws nothing");
});

test("a tier with no range of its own is shown with the one below it", () => {
  assert.deepStrictEqual(S.draws({ params: { n: { tiers: { 1: [1, 2], 2: [3, 4], 4: [5, 6] }, step: 0.25 } } }),
    ["n: 1 to 2 in steps of 0.25 (tier 1), 3 to 4 in steps of 0.25 (tiers 2–3), 5 to 6 in steps of 0.25 (tier 4)"]);
});

test("the answer names its type, its sign or unit and its decimal places", () => {
  assert.strictEqual(S.answerText({ type: "decimal", prefix: "₱", maxDecimals: 2 }), "decimal, in ₱, up to 2 decimal places");
  assert.strictEqual(S.answerText({ type: "unit", unit: "cm", maxDecimals: 1 }), "number with a unit, in cm, up to 1 decimal place");
  assert.strictEqual(S.answerText({ type: "integer" }), "whole number");
  assert.strictEqual(S.answerText({ type: "mixed" }), "mixed number");
  assert.strictEqual(S.answerText({ type: "choice", figure: { kind: "grid" } }), "choice of pictures");
});

const rows = S.rows();

test("every template appears once, on the path or in Basics", () => {
  const ids = rows.map((r) => r.template);
  assert.strictEqual(new Set(ids).size, ids.length, "a template listed twice");
  assert.deepStrictEqual(ids.slice().sort(), C.templates().map((t) => t.id).sort());
  assert.strictEqual(S.markdown().split("\n#### `").length - 1, ids.length, "one entry per template in the file");
});

test("templates are listed in path order: topic by topic, level by level", () => {
  const path = rows.filter((r) => r.part === "path");
  const topics = C.TOPICS.filter((t) => t.ready !== false).map((t) => t.key);
  const seen = [...new Set(path.map((r) => r.topic))];
  assert.deepStrictEqual(seen, topics.filter((k) => seen.includes(k)));
  for (let i = 1; i < path.length; i++) {
    if (path[i].topic === path[i - 1].topic) assert.ok(path[i].levelNo >= path[i - 1].levelNo, path[i].template + " is out of order");
  }
  assert.ok(rows.findIndex((r) => r.part === "basics") > rows.findIndex((r) => r.part === "path"), "Basics comes after the path");
});

test("each example is the engine's own question at the stated tier and seed", () => {
  for (const r of rows) {
    const q = C.generate(r.template, S.EXAMPLE_TIER, S.EXAMPLE_SEED);
    assert.strictEqual(r.example.prompt, q.prompt, r.template);
  }
});

test("a choice example shows the right choice as the app names it", () => {
  const choice = rows.filter((r) => r.example.choices.length);
  assert.ok(choice.length > 0);
  for (const r of choice) {
    const q = C.generate(r.template, S.EXAMPLE_TIER, S.EXAMPLE_SEED);
    assert.strictEqual(r.example.answer, C.choiceText(q, q.answerIndex), r.template);
  }
});

test("a choice of pictures gives each picture in words, after its letter", () => {
  const pictures = rows.filter((r) => r.answer === "choice of pictures");
  assert.ok(pictures.length > 0);
  for (const r of pictures) {
    assert.strictEqual(r.example.choices.length, 4, r.template);
    r.example.choices.forEach((c, i) => assert.match(c, new RegExp("^" + "ABCD"[i] + ": Picture: "), r.template));
    assert.match(r.example.answer, /^Picture [A-D]$/, r.template);
  }
});

test("an answer is written as the app shows it: ₱ before, a unit after", () => {
  const peso = rows.find((r) => r.template === "decimals.cost-of-more");
  assert.match(peso.example.answer, /^₱\d/);
  const deg = rows.find((r) => r.template === "transform.regular-angle");
  assert.match(deg.example.answer, /^\d+°$/, "a degree sign sits against its number");
});

test("a Basics template serves no competency, and says so", () => {
  for (const r of rows.filter((x) => x.part === "basics")) {
    assert.strictEqual(r.competency, "");
    assert.match(r.competencyText, /^none/);
  }
  for (const r of rows.filter((x) => x.part === "path")) assert.match(r.competencyText, new RegExp("^" + r.competency.replace(/\./g, "\\.") + ", "));
});

test("a review level is described, not left as an empty level", () => {
  const md = S.markdown();
  assert.ok(!/0 templates/.test(md), "an empty level shown as 0 templates");
  assert.ok(md.includes("asks every fact of the topic again"));
});

test("the CSV has one row per template, every row the same width", () => {
  const text = S.csv();
  assert.strictEqual(text.charCodeAt(0), 0xfeff, "starts with a byte-order mark, for Excel");
  const table = parseCsv(text.slice(1));
  assert.strictEqual(table.length, rows.length + 1);
  const width = table[0].length;
  assert.ok(table.every((r) => r.length === width), "a row of another width");
  const prompts = table.slice(1).map((r) => r[table[0].indexOf("example_prompt")]);
  assert.deepStrictEqual(prompts, rows.map((r) => r.example.prompt), "quoting round-trips");
});

test("a cell with a comma, a quote or a line break is quoted", () => {
  assert.strictEqual(S.csvCell('say "hi", ok'), '"say ""hi"", ok"');
  assert.strictEqual(S.csvCell("a\nb"), '"a\nb"');
  assert.strictEqual(S.csvCell("plain"), "plain");
});

test("the check passes the file as generated, in either line ending, and nothing else", () => {
  const md = S.markdown();
  assert.strictEqual(S.check(md), true);
  assert.strictEqual(S.check(md.replace(/\n/g, "\r\n")), true, "a Windows checkout");
  assert.strictEqual(S.check(md + "x"), false);
  assert.strictEqual(S.check(md.replace("Level 1", "Level one")), false);
  assert.strictEqual(S.check(""), false, "a missing file");
});

if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
console.log("\nok: the item specifications describe the packs");
