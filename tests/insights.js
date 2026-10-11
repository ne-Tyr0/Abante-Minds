/* Strengths-and-gaps tests: which answers count, how the kinds of problem
   are tallied and ranked, and when the strongest and weakest are named.

   Run:  node tests/insights.js        Exits 1 on any failure. */
"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");

global.window = global;
global.AM = {};
new Function(fs.readFileSync(path.join(__dirname, "..", "app/insights.js"), "utf8")).call(global);
const I = global.AM.insights;

let failed = 0;
function test(name, fn) {
  try { fn(); console.log("ok   " + name); }
  catch (e) { failed++; console.log("FAIL " + name + "\n       " + e.message.split("\n")[0]); }
}

/* A row as the attempt log keeps it; the template's name gives its type here. */
const row = (template, correct, extra) => Object.assign({ template, correct, attempt: 1, kind: "practice" }, extra);
const typeOf = (id) => id.split(".")[0];
const many = (template, right, wrong, extra) =>
  Array.from({ length: right }, () => row(template, true, extra)).concat(Array.from({ length: wrong }, () => row(template, false, extra)));

test("only a first try on the path or in an exam counts", () => {
  assert.strictEqual(I.counted(row("compare.a", true)), true);
  assert.strictEqual(I.counted(row("compare.a", true, { kind: "exam" })), true);
  assert.strictEqual(I.counted(row("compare.a", true, { attempt: 2 })), false, "a retry has seen the working");
  for (const kind of ["redo", "facts", "review"]) assert.strictEqual(I.counted(row("compare.a", true, { kind })), false, kind);
});
test("tally: right and asked by kind, in the order first met", () => {
  const rows = [row("change.a", true), row("compare.b", false), row("change.c", false), row("change.d", true, { attempt: 2 })];
  assert.deepStrictEqual(I.tally(rows, (r) => typeOf(r.template)), [
    { key: "change", right: 1, asked: 2 }, { key: "compare", right: 0, asked: 1 }]);
  assert.deepStrictEqual(I.tally(rows, () => null), [], "a row with no type is left out");
});
test("summarize: kinds met often enough, best first, in the learner's words", () => {
  const log = [].concat(many("change.x", 9, 1), many("compare.x", 3, 4), many("rate.x", 2, 2));
  const s = I.summarize(log, typeOf);
  assert.deepStrictEqual(s.types.map((t) => [t.key, t.right, t.asked]), [["change", 9, 10], ["compare", 3, 7]], "rate has only 4 tries");
  assert.strictEqual(s.types[0].name, "An amount goes up or down");
  assert.strictEqual(s.strongest.key, "change");
  assert.strictEqual(s.weakest.key, "compare");
});
test("the strongest and weakest are named only when far enough apart", () => {
  const close = I.summarize([].concat(many("change.x", 7, 3), many("compare.x", 6, 4)), typeOf);
  assert.deepStrictEqual([close.types.length, close.strongest, close.weakest], [2, null, null]);
  const one = I.summarize(many("change.x", 5, 5), typeOf);
  assert.deepStrictEqual([one.types.length, one.strongest, one.weakest], [1, null, null]);
  assert.deepStrictEqual(I.summarize([], typeOf), { types: [], strongest: null, weakest: null });
});
test("a tie goes to the kind met more often", () => {
  const s = I.summarize([].concat(many("compare.x", 4, 1), many("change.x", 8, 2)), typeOf);
  assert.deepStrictEqual(s.types.map((t) => t.key), ["change", "compare"]);
});
test("only the most recent rows count", () => {
  const old = many("compare.x", 0, 10);
  const recent = Array.from({ length: I.RECENT }, (_, i) => row(i % 2 ? "change.x" : "compare.x", true));
  const s = I.summarize(old.concat(recent), typeOf);
  assert.ok(s.types.every((t) => t.right === t.asked), "the old misses have faded");
  assert.strictEqual(s.types.reduce((n, t) => n + t.asked, 0), I.RECENT);
});
test("every problem type in the blueprint has a name", () => {
  const blueprint = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "content/blueprint.json"), "utf8"));
  for (const t of Object.values(blueprint.schemas).flat()) assert.ok(I.NAMES[t], t);
});

console.log(failed ? `\n${failed} failed` : "\nok: strengths and gaps behave as specified");
process.exit(failed ? 1 : 0);
