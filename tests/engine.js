/* Engine unit tests: the arithmetic, the expression language and the rules
   the engine applies to every pack, each pinned to a small example so a
   regression names itself. The real packs are covered by validate-packs.js
   and fuzz.js; these use a tiny pack of their own.

   Run:  node tests/engine.js        Exits 1 on any failure. */
"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const ROOT = path.join(__dirname, "..");
const SRC = fs.readFileSync(path.join(ROOT, "app/content.js"), "utf8");
global.window = global;
global.AM = {};
new Function(SRC).call(global);
const C = global.AM.content;
const E = C.engine;

let failed = 0;
function test(name, fn) {
  try { fn(); console.log("ok   " + name); }
  catch (e) { failed++; console.log("FAIL " + name + "\n       " + e.message.split("\n")[0]); }
}
const ev = (src, scope) => E.evaluate(src, scope || Object.create(null));
const show = (src, scope) => E.fmt(ev(src, scope));
const throws = (fn, pattern) => assert.throws(fn, (e) => pattern.test(e.message), "expected an error matching " + pattern);

/* ---------- arithmetic ---------- */

test("decimal literals are exact", () => {
  assert.strictEqual(ev("0.1 + 0.2 == 0.3"), true);
  assert.strictEqual(show("1.12 * 250"), "280");
  assert.strictEqual(show("268.8 - 0.8"), "268");
});
test("operator precedence and associativity", () => {
  assert.strictEqual(show("2 + 3 * 4"), "14");
  assert.strictEqual(show("(2 + 3) * 4"), "20");
  assert.strictEqual(show("10 - 4 - 3"), "3");
  assert.strictEqual(show("24 / 4 / 2"), "3");
  assert.strictEqual(show("2 * 7 % 4"), "2");
  assert.strictEqual(show("-2 + 5"), "3");
  assert.strictEqual(ev("false ? 1 : true ? 2 : 3").n, 2);
  assert.strictEqual(ev("!(1 > 2) && 2 >= 2 || false"), true);
});
test("&& and || short-circuit, so a guard protects a division", () => {
  const s = Object.assign(Object.create(null), { b: E.Q(0), a: E.Q(5) });
  assert.strictEqual(ev("b != 0 && a / b > 1", s), false);
  assert.strictEqual(ev("b == 0 || a / b > 1", s), true);
});
test("functions", () => {
  assert.strictEqual(show("floor(7 / 2)"), "3");
  assert.strictEqual(show("ceil(7 / 2)"), "4");
  assert.strictEqual(show("abs(3 - 5)"), "2");
  assert.strictEqual(show("min(4, 2.5, 9)"), "2.5");
  assert.strictEqual(show("max(4, 2.5, 9)"), "9");
  assert.strictEqual(show("gcd(12, 18)"), "6");
  assert.strictEqual(show("lcm(4, 6)"), "12");
  assert.strictEqual(ev("peso(63)"), "₱63");
  assert.strictEqual(ev("fmt(5 / 2)"), "2.5");
});
test("round: half up like Math.round, and exact at any place", () => {
  for (let k = 0; k <= 400; k++) assert.strictEqual(E.fmt(E.round(E.Q(k, 8))), String(Math.round(k / 8)), `${k}/8`);
  // Math.round(2.345 * 100) / 100 is 2.34 in floating point; exactly, it is 2.35.
  assert.strictEqual(show("round(2.345, 2)"), "2.35");
});
test("fmt shows terminating decimals and refuses repeating ones", () => {
  assert.strictEqual(E.fmt(E.Q(5, 2)), "2.5");
  assert.strictEqual(E.fmt(E.Q(32, 100)), "0.32");
  assert.strictEqual(E.fmt(E.Q(24)), "24");
  assert.strictEqual(E.fmt(E.Q(1, 16)), "0.0625");
  throws(() => E.fmt(E.Q(1, 3)), /repeating decimal/);
});
test("peso: whole pesos bare, otherwise two places", () => {
  assert.strictEqual(E.peso(E.Q(63)), "₱63");
  assert.strictEqual(E.peso(E.fromLiteral("268.8")), "₱268.80");
  assert.strictEqual(E.peso(E.Q(1, 3)), "₱0.33");
  assert.strictEqual(E.peso(E.fromLiteral("0.05")), "₱0.05");
});
test("errors instead of wrong numbers", () => {
  throws(() => ev("1 / 0"), /division by zero/);
  throws(() => ev("5 % 0"), /division by zero/);
  throws(() => ev("999999999 * 999999999"), /too large/);
  throws(() => ev("2.5 % 2"), /whole number/);
  throws(() => ev("1 == 'a'"), /compare a number with text/);
  throws(() => ev("1 + 'a'"), /expected a number/);
  throws(() => ev("1 ? 2 : 3"), /true or false/);
});

/* ---------- the expression language is closed ---------- */

test("no names beyond the template's own values", () => {
  // Checked against a plain object too: a scope with a prototype must not leak it.
  for (const n of ["constructor", "__proto__", "toString", "hasOwnProperty", "window", "AM", "process"]) {
    throws(() => ev(n), /unknown name/);
    throws(() => ev(n, {}), /unknown name/);
  }
  for (const f of ["eval(1)", "constructor(1)", "toString(1)", "alert(1)", "require(1)"])
    throws(() => E.parse(f), /unknown function/);
});
test("no member access, indexing, templates or assignment", () => {
  for (const src of ["a.b", "a[0]", "a`x`", "a = 1", "a; b", "{}", "\"x\"", "a => a", "1e3"])
    throws(() => E.parse(src), /cannot read|unexpected|expected/);
});
test("the engine never evaluates code from a pack", () => {
  assert.ok(!/\beval\s*\(|\bnew\s+Function\b|\bFunction\s*\(|setTimeout\s*\(\s*["'`]/.test(SRC));
});
test("names() finds every name, including untaken branches", () => {
  assert.deepStrictEqual(E.names(E.parse("a > 1 ? b : max(c, d * 2)")).sort(), ["a", "b", "c", "d"]);
});
test("interpolation", () => {
  const s = Object.assign(Object.create(null), { a: E.Q(3), w: "kg" });
  assert.strictEqual(E.interpolate("{a} {w} is {a * 1000} g", s), "3 kg is 3000 g");
  throws(() => E.interpolate("{a > 1}", s), /true\/false/);
  throws(() => E.interpolate("{a", s), /unbalanced/);
  assert.deepStrictEqual(E.slots("x {a} y {b + 1}"), ["a", "b + 1"]);
});

/* ---------- reading what the learner typed ---------- */

test("typed answers are read exactly", () => {
  const same = (a, b) => assert.ok(E.eq(E.readTyped(a), b), `${a}`);
  same("36", E.Q(36)); same("36.0", E.Q(36)); same("36.", E.Q(36));
  same(".5", E.Q(1, 2)); same("0.10", E.Q(1, 10)); same("₱ 1,200", E.Q(1200));
  for (const bad of ["", ".", "1.2.3", null, undefined]) assert.strictEqual(E.readTyped(bad), null, String(bad));
});

/* ---------- a tiny pack of our own ---------- */

const T = (id, extra) => Object.assign({
  id, competency: "G5.Q2.10", domain: "NA", construct: "test", schema: "change",
  params: { a: { range: [2, 9] }, b: { range: [2, 9] } },
  answer: { type: "integer", value: "a * b" },
  formats: [{ id: "one", prompt: "{a} times {b}?" }],
  hints: ["h1", "h2", "h3"], steps: ["s1", "s2", "s3"], explain: "{a} × {b} = {answer}",
  distractors: [{ value: "a + b", error: "added", feedback: "{value} adds them." }]
}, extra);

const PACK = {
  manifest: {
    subtest: "math", version: "9.9.9", fallbackFeedback: "Not yet.",
    topics: [{ key: "t", label: "Test", icon: "star", colorKey: 1, file: "t.json" },
             { key: "u", label: "Other", icon: "star", colorKey: 2, file: "u.json" }]
  },
  files: [{
    topic: "t",
    pinned: [{ template: "t.formats", params: { a: 3, b: 4 } }, { template: "t.formats", params: { a: 5, b: 6 }, format: "two" }],
    templates: [
      T("t.formats", { formats: [{ id: "one", prompt: "{a} times {b}?" }, { id: "two", prompt: "{b} groups of {a}?" }] }),
      T("t.tiers", { params: { a: { tiers: { "1": [2, 3], "2": [50, 60] } }, b: { value: "1" } } }),
      T("t.where", { where: ["a > b"] }),
      T("t.choice", {
        params: { a: { range: [1, 4] }, b: { range: [1, 4] } },
        answer: { type: "choice", value: "a * b", label: "{value} things" },
        distractors: [
          { value: "a + b", error: "added", feedback: "{value} adds." },
          { value: "a", error: "first", feedback: "{value} is a." },
          { value: "b + 10", error: "far", feedback: "{value} is far." }]
      }),
      T("t.dropped", {
        params: { a: { range: [2, 9] }, b: { value: "2" } },
        distractors: [
          { value: "a / 3", error: "repeating", feedback: "{a}" },
          { value: "a * 2 + 1", error: "twice-plus-one", feedback: "{value} is twice plus one." },
          { value: "a + a + 1", error: "same-number", feedback: "{value} also twice plus one." },
          { value: "answer", error: "is-the-answer", feedback: "{value}" },
          { value: "a + 100", error: "named", feedback: "{value} adds a hundred." }]
      }),
      T("t.decimal", {
        params: { a: { range: [1, 9] }, b: { value: "0.25" } },
        answer: { type: "decimal", value: "a * b", maxDecimals: 1 }
      })
    ]
  }, { topic: "u", templates: [T("u.only")] }]
};

test("use() refuses a pack that cannot work", () => {
  const m = PACK.manifest;
  throws(() => C.use(m, [PACK.files[1], PACK.files[0]]), /missing or mislabelled/);
  throws(() => C.use(m, [PACK.files[0], { topic: "u", templates: [T("t.where")] }]), /used twice/);
  throws(() => C.use(m, [PACK.files[0], { topic: "u", templates: [] }]), /no templates/);
  throws(() => C.use({}, []), /no topics/);
});
test("use() installs topics, version and subtest", () => {
  C.use(PACK.manifest, PACK.files);
  assert.deepStrictEqual(C.TOPICS.map((t) => t.key), ["t", "u"]);
  assert.strictEqual(C.packVersion, "9.9.9");
  assert.strictEqual(C.subtest, "math");
  assert.deepStrictEqual(C.byKey("u"), { key: "u", label: "Other", icon: "star", colorKey: 2 });
  assert.strictEqual(C.byKey("nope"), undefined);
});
test("generation is deterministic in (template, tier, seed)", () => {
  for (let s = 0; s < 50; s++) assert.deepStrictEqual(C.generate("t.formats", 1, s), C.generate("t.formats", 1, s));
  const prompts = new Set(Array.from({ length: 50 }, (_, s) => C.generate("t.formats", 1, s).prompt));
  assert.ok(prompts.size > 20, "different seeds should give different questions");
});
test("a question carries what an attempt log needs to rebuild it", () => {
  const q = C.generate("t.formats", 2, 77);
  for (const k of ["templateId", "tier", "seed", "format", "packVersion", "competency", "domain", "schema", "answerType"])
    assert.ok(q[k] !== undefined && q[k] !== null, k);
  assert.strictEqual(q.seed, 77);
  assert.strictEqual(q.pinned, false);
});
test("every format appears, and a pinned item uses the one it names or the first", () => {
  const seen = new Set(Array.from({ length: 100 }, (_, s) => C.generate("t.formats", 1, s).format));
  assert.deepStrictEqual([...seen].sort(), ["one", "two"]);
  assert.strictEqual(C.instance("t.formats", 1, { a: 3, b: 4 }).format, "one");
  assert.strictEqual(C.instance("t.formats", 1, { a: 3, b: 4 }, "two").prompt, "4 groups of 3?");
  throws(() => C.instance("t.formats", 1, { a: 3, b: 4 }, "three"), /no format/);
  throws(() => C.instance("t.formats", 1, { a: 3 }), /does not set 'b'/);
});
test("tiers: a tier with no range of its own uses the nearest one below", () => {
  for (let s = 0; s < 50; s++) {
    assert.ok(C.generate("t.tiers", 1, s).answer <= 3);
    for (const tier of [2, 3, 4]) assert.ok(C.generate("t.tiers", tier, s).answer >= 50, `tier ${tier}`);
  }
});
test("where: every question meets the constraints", () => {
  for (let s = 0; s < 200; s++) {
    const q = C.generate("t.where", 1, s);
    const [a, b] = q.prompt.match(/\d+/g).map(Number);
    assert.ok(a > b, q.prompt);
  }
});
test("answers the keypad cannot enter are drawn again", () => {
  for (let s = 0; s < 200; s++) {
    const q = C.generate("t.decimal", 1, s);
    assert.ok(Math.round(q.answer * 10) === q.answer * 10, String(q.answer));
  }
  assert.ok(Array.from({ length: 200 }, (_, s) => C.firstDraw("t.decimal", 1, s)).some((f) => f.reason === "answer"));
});
test("choice items: four different named options, sorted, answer among them", () => {
  for (let s = 0; s < 300; s++) {
    const q = C.generate("t.choice", 1, s);
    assert.strictEqual(new Set(q.choices).size, 4);
    assert.ok(q.choices.every((c) => / things$/.test(c)));
    const v = q.choiceValues.map((x) => x.n / x.d);
    assert.deepStrictEqual(v, [...v].sort((x, y) => x - y));
    assert.strictEqual(q.choices[q.answerIndex], q.answer + " things");
  }
  assert.ok(Array.from({ length: 300 }, (_, s) => C.firstDraw("t.choice", 1, s)).some((f) => f.reason === "choice"));
});
test("a mistake is named only when it can be told apart", () => {
  const q = C.instance("t.dropped", 1, { a: 4 });
  // 4/3 repeats; 9 is two mistakes at once; 8 is the answer itself.
  assert.deepStrictEqual(q.distractors.map((d) => d.error), ["named"]);
});
test("diagnose: right, a named mistake, or the honest fallback", () => {
  const q = C.instance("t.formats", 1, { a: 3, b: 4 });
  assert.deepStrictEqual(C.diagnose(q, "12"), { correct: true, error: null, feedback: null });
  assert.deepStrictEqual(C.diagnose(q, "12.0"), { correct: true, error: null, feedback: null });
  assert.deepStrictEqual(C.diagnose(q, "7"), { correct: false, error: "added", feedback: "7 adds them." });
  assert.deepStrictEqual(C.diagnose(q, "13"), { correct: false, error: null, feedback: "Not yet." });
  assert.deepStrictEqual(C.diagnose(q, ""), { correct: false, error: null, feedback: "Not yet." });
  assert.strictEqual(C.isCorrect(q, "12"), true);
  assert.strictEqual(C.isCorrect(q, "7"), false);
  const c = C.instance("t.choice", 1, { a: 2, b: 3 });
  assert.strictEqual(C.diagnose(c, c.answerIndex).correct, true);
  const wrong = c.choiceValues.findIndex((v) => v.n === 2 && v.d === 1);
  assert.deepStrictEqual(C.diagnose(c, wrong), { correct: false, error: "first", feedback: "2 is a." });
});
test("a template's own fallback replaces the pack's", () => {
  C.use(PACK.manifest, [Object.assign({}, PACK.files[0], { templates: [T("t.fb", { fallback: "Try {a} again." })] }), PACK.files[1]]);
  assert.strictEqual(C.diagnose(C.instance("t.fb", 1, { a: 3, b: 4 }), "99").feedback, "Try 3 again.");
  C.use(PACK.manifest, PACK.files);
});
test("sessions: pinned items first, the right length, no template twice running", () => {
  const ses = C.buildSession("t", 10, 1, 42);
  assert.strictEqual(ses.length, 10);
  assert.strictEqual(ses[0].prompt, "3 times 4?");
  assert.strictEqual(ses[1].prompt, "6 groups of 5?");
  assert.ok(ses[0].pinned && ses[1].pinned && !ses[2].pinned);
  for (let i = 3; i < ses.length; i++) assert.notStrictEqual(ses[i].templateId, ses[i - 1].templateId, `question ${i}`);
  assert.deepStrictEqual(ses.map((q) => q.id), ses.map((_, i) => "t-" + i));
  assert.deepStrictEqual(C.buildSession("t", 10, 1, 42), ses);
  assert.strictEqual(C.buildSession("t", 1, 1, 42).length, 1);
  assert.ok(C.buildSession("u", 5, 1, 1).every((q) => q.topicKey === "u"));
  assert.ok(C.buildSession("nope", 3, 1, 1).every((q) => q.topicKey === "t"), "unknown topic falls back to the first");
});

console.log(failed ? `\n${failed} failed` : "\nok: engine behaves as specified");
process.exit(failed ? 1 : 0);
