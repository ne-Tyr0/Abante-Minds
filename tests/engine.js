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
    examDate: "2027-01-30", blueprintCompetencies: 94,
    topics: [{ key: "t", label: "Test", icon: "star", colorKey: 1, file: "t.json" },
             { key: "u", label: "Other", icon: "star", colorKey: 2, file: "u.json" },
             { key: "v", label: "Later", icon: "star", colorKey: 3, comingSoon: true }]
  },
  files: [{
    topic: "t",
    levels: [
      { id: "one", title: "One", templates: ["t.formats", "t.tiers", "t.where"], lesson: [
        { title: "Groups", body: "Times means equal groups." },
        { title: "Worked example", example: { template: "t.formats", params: { a: 3, b: 4 }, format: "two" } }] },
      { id: "two", title: "Two", templates: ["t.choice", "t.dropped", "t.decimal"] }
    ],
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
  }, { topic: "u", levels: [{ id: "only", title: "Only", templates: ["u.only"] }], templates: [T("u.only")] }, null]
};

test("use() refuses a pack that cannot work", () => {
  const m = PACK.manifest;
  const u = (extra) => Object.assign({ topic: "u", levels: [{ id: "only", title: "Only", templates: ["u.only"] }], templates: [T("u.only")] }, extra);
  throws(() => C.use(m, [PACK.files[1], PACK.files[0], null]), /missing or mislabelled/);
  throws(() => C.use(m, [PACK.files[0], u({ templates: [T("t.where")], levels: [{ id: "x", title: "X", templates: ["t.where"] }] }), null]), /used twice/);
  throws(() => C.use(m, [PACK.files[0], u({ templates: [] }), null]), /no templates/);
  throws(() => C.use(m, [PACK.files[0], u({ levels: [] }), null]), /no levels/);
  throws(() => C.use(m, [PACK.files[0], u({ levels: [{ id: "x", title: "X", templates: ["u.nope"] }] }), null]), /unknown template u.nope/);
  throws(() => C.use(m, [PACK.files[0], u(), u()]), /coming soon but has a file/);
  throws(() => C.use({}, []), /no topics/);
});
test("use() installs topics, version and subtest", () => {
  C.use(PACK.manifest, PACK.files);
  assert.deepStrictEqual(C.TOPICS.map((t) => [t.key, t.ready]), [["t", true], ["u", true], ["v", false]]);
  assert.strictEqual(C.packVersion, "9.9.9");
  assert.strictEqual(C.subtest, "math");
  assert.strictEqual(C.examDate, "2027-01-30");
  assert.strictEqual(C.blueprintCompetencies, 94);
  assert.deepStrictEqual(C.byKey("u"), {
    key: "u", weight: 0, label: "Other", icon: "star", colorKey: 2, ready: true, track: "path", grid: false,
    levels: [{ id: "only", title: "Only", kind: "practice", competencies: ["G5.Q2.10"], hasLesson: false, factCount: 0 }]
  });
  assert.deepStrictEqual(C.BASICS, []);
  assert.deepStrictEqual(C.byKey("v").levels, []);
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
  C.use(PACK.manifest, [Object.assign({}, PACK.files[0], {
    pinned: [], templates: [T("t.fb", { fallback: "Try {a} again." })], levels: [{ id: "fb", title: "Fb", templates: ["t.fb"] }]
  }), PACK.files[1], null]);
  assert.strictEqual(C.diagnose(C.instance("t.fb", 1, { a: 3, b: 4 }), "99").feedback, "Try 3 again.");
  C.use(PACK.manifest, PACK.files);
});
test("sessions: one level's templates, pinned first when asked, no template twice running", () => {
  const S = (o) => C.buildSession(Object.assign({ topic: "t", level: "one", count: 10, tier: 1, seed: 42 }, o));
  const ses = S({ pinned: true });
  assert.strictEqual(ses.length, 10);
  assert.strictEqual(ses[0].prompt, "3 times 4?");
  assert.strictEqual(ses[1].prompt, "6 groups of 5?");
  assert.ok(ses[0].pinned && ses[1].pinned && !ses[2].pinned);
  /* A pinned item has no seed, so the attempt log finds it by its place in the topic's list. */
  assert.deepStrictEqual([ses[0].pinnedAt, ses[1].pinnedAt, ses[2].pinnedAt], [0, 1, undefined]);
  for (let i = 3; i < ses.length; i++) assert.notStrictEqual(ses[i].templateId, ses[i - 1].templateId, `question ${i}`);
  assert.ok(ses.every((q) => ["t.formats", "t.tiers", "t.where"].includes(q.templateId)), "only level one's templates");
  assert.deepStrictEqual(ses.map((q) => q.id), ses.map((_, i) => "t-one-" + i));
  assert.deepStrictEqual([ses[0].levelId, ses[0].levelTitle], ["one", "One"]);
  assert.deepStrictEqual(S({ pinned: true }), ses);
  assert.ok(S({ pinned: false }).every((q) => !q.pinned));
  assert.ok(S({ level: "two", pinned: true }).every((q) => !q.pinned && ["t.choice", "t.dropped", "t.decimal"].includes(q.templateId)),
    "pinned items from another level stay out");
  assert.strictEqual(S({ count: 1 }).length, 1);
  throws(() => S({ topic: "nope" }), /no topic 'nope'/);
  throws(() => S({ topic: "v" }), /no topic 'v'/);
  throws(() => S({ level: "nine" }), /no level 'nine'/);
});
test("a lesson: text as written, examples rendered from their template", () => {
  const cards = C.lesson("t", "one");
  assert.deepStrictEqual(cards[0], { kind: "text", title: "Groups", body: "Times means equal groups." });
  assert.strictEqual(cards[1].kind, "example");
  assert.strictEqual(cards[1].prompt, "4 groups of 3?");
  assert.strictEqual(cards[1].answer, "12");
  assert.deepStrictEqual(cards[1].steps, ["s1", "s2", "s3"]);
  assert.deepStrictEqual(C.lesson("t", "two"), []);
});
test("words and fixed", () => {
  const w = (n) => ev("words(" + n + ")");
  assert.deepStrictEqual([0, 7, 13, 20, 45, 100, 105, 450, 1005, 12045].map(w),
    ["zero", "seven", "thirteen", "twenty", "forty-five", "one hundred", "one hundred five", "four hundred fifty", "one thousand five", "twelve thousand forty-five"]);
  throws(() => w(1000000), /0 to 999999/);
  throws(() => ev("words(1.5)"), /whole number/);
  assert.deepStrictEqual([ev("fixed(2.4, 2)"), ev("fixed(7, 3)"), ev("fixed(0.035, 3)")], ["2.40", "7.000", "0.035"]);
  throws(() => ev("fixed(1 / 3, 2)"), /cannot show/);
});

test("pow and sup: powers and how they are printed", () => {
  assert.deepStrictEqual(["pow(2, 5)", "pow(10, 3)", "pow(7, 0)", "pow(1.5, 2)"].map(show), ["32", "1000", "1", "2.25"]);
  throws(() => ev("pow(2, 21)"), /0 to 20/);
  throws(() => ev("pow(2, 1.5)"), /whole number/);
  assert.deepStrictEqual([ev("sup(2)"), ev("sup(3)"), ev("sup(0)"), ev("sup(10)"), ev("sup(456789)")], ["²", "³", "⁰", "¹⁰", "⁴⁵⁶⁷⁸⁹"]);
  assert.strictEqual(E.interpolate("{b}{sup(e)} = {pow(b, e)}", Object.assign(Object.create(null), { b: E.Q(2), e: E.Q(5) })), "2⁵ = 32");
  throws(() => ev("sup(1.5)"), /whole number/);
  assert.ok(E.RESERVED.includes("pow") && E.RESERVED.includes("sup"), "a param cannot be named pow or sup");
});

/* ---------- fractions, mixed numbers and number suffixes ---------- */

test("frac and mixed show amounts as a learner writes them", () => {
  assert.strictEqual(ev("frac(6 / 8)"), "3/4");
  assert.strictEqual(ev("frac(7 / 4)"), "7/4");
  assert.strictEqual(ev("frac(4)"), "4");
  assert.strictEqual(ev("mixed(11 / 4)"), "2 3/4");
  assert.strictEqual(ev("mixed(3 / 4)"), "3/4");
  assert.strictEqual(ev("mixed(2)"), "2");
  assert.ok(E.RESERVED.includes("frac") && E.RESERVED.includes("mixed"));
});
test("fraction entries are read exactly as the boxes produce them", () => {
  const r = (t) => { const x = E.readFraction(t); return x && [x.form, x.whole, x.num, x.den, E.fmt(x.value)]; };
  assert.deepStrictEqual(r("3/4"), ["fraction", 0, 3, 4, "0.75"]);
  assert.deepStrictEqual(r("2 3/4"), ["mixed", 2, 3, 4, "2.75"]);
  assert.deepStrictEqual(r("6/8"), ["fraction", 0, 6, 8, "0.75"]);
  assert.deepStrictEqual(r("5"), ["whole", 5, 0, 1, "5"]);
  for (const bad of ["3/0", "1/2/3", "0.75", "3/", "/4", "2 3", "", null]) assert.strictEqual(E.readFraction(bad), null, String(bad));
});

const F = (id, extra) => Object.assign({
  id, competency: "G6.Q1.11", domain: "NA", construct: "test", schema: "equal-groups",
  params: { a: { range: [1, 5] }, b: { range: [6, 9] } },
  answer: { type: "fraction", value: "a / b" },
  formats: [{ id: "one", prompt: "{a} over {b}?" }],
  hints: ["h1", "h2", "h3"], steps: ["s1", "s2", "s3"], explain: "{frac(answer)}",
  distractors: [{ value: "a / (b + 1)", error: "one-more", feedback: "{frac(value)} has one more in the bottom." }]
}, extra);

const FRACTION_PACK = {
  manifest: {
    subtest: "math", version: "9.9.9", fallbackFeedback: "Not yet.",
    formFeedback: {
      "not-lowest-terms": "Lowest terms, please.",
      "not-a-mixed-number": "As a mixed number, please.",
      "fraction-part-not-proper": "The fraction part is too big."
    },
    topics: [{ key: "f", label: "Fractions", icon: "star", colorKey: 1, file: "f.json" }]
  },
  files: [{
    topic: "f",
    levels: [{ id: "all", title: "All", templates: ["f.third", "f.any", "f.whole-sometimes", "f.mixed", "f.percent", "f.unit", "f.pi", "f.choice", "f.money", "f.mixed-order"] }],
    templates: [
      F("f.third", { params: { a: { range: [1, 2] }, b: { value: "3" } }, distractors: [
        { value: "a / (b + 1)", error: "one-more", feedback: "{frac(value)} has one more in the bottom." },
        { value: "a / 6", error: "doubled-the-bottom", feedback: "{frac(value)} doubled the bottom." }] }),
      F("f.any", { answer: { type: "fraction", value: "a / b", form: "any" } }),
      F("f.whole-sometimes", { params: { a: { range: [2, 12] }, b: { value: "2" } } }),
      F("f.mixed", {
        params: { w: { range: [1, 4] }, a: { range: [1, 2] }, b: { value: "3" } },
        answer: { type: "mixed", value: "w + a / b" },
        distractors: [{ value: "w + a / (b + 1)", error: "one-more", feedback: "{mixed(value)} has one more in the bottom." }]
      }),
      F("f.percent", { params: { a: { range: [1, 9] }, b: { value: "10" } }, answer: { type: "percent", value: "a * b" },
        distractors: [{ value: "a", error: "forgot-to-scale", feedback: "{value}% forgot the ten." }] }),
      F("f.unit", { params: { a: { range: [2, 9] }, b: { value: "1" } }, answer: { type: "unit", unit: "cm²", value: "a * a" },
        distractors: [{ value: "a * 4", error: "perimeter", feedback: "{value} is the perimeter." }] }),
      F("f.pi", { params: { a: { range: [2, 9] }, b: { value: "1" } }, answer: { type: "pi-expression", value: "a * a" },
        distractors: [{ value: "a * 2", error: "circumference", feedback: "{value}π is the circumference." }] }),
      F("f.choice", {
        params: { a: { range: [1, 2] }, b: { value: "3" } },
        answer: { type: "choice", value: "a / b", label: "{frac(value)}" },
        distractors: [
          { value: "a / (b + 1)", error: "one-more", feedback: "x" },
          { value: "a / (b + 2)", error: "two-more", feedback: "x" },
          { value: "(a + 1) / (b + 4)", error: "both-more", feedback: "x" }]
      }),
      F("f.money", { params: { a: { range: [2, 9] }, b: { value: "1" } }, answer: { type: "integer", value: "a * 10", prefix: "₱" },
        distractors: [{ value: "a", error: "forgot-to-scale", feedback: "x" }] }),
      F("f.mixed-order", {
        params: { a: { range: [1, 9] }, b: { value: "1" } },
        answer: { type: "choice", value: "a + 30", label: "{value}", order: "mixed" },
        distractors: [
          { value: "a", error: "low", feedback: "x" },
          { value: "a + 10", error: "mid", feedback: "x" },
          { value: "a + 20", error: "high", feedback: "x" }]
      })
    ]
  }]
};

test("a fraction question: entry kind, answer text, form", () => {
  C.use(FRACTION_PACK.manifest, FRACTION_PACK.files);
  const q = C.instance("f.third", 1, { a: 2 });
  assert.deepStrictEqual([q.type, q.entry, q.answerText, q.form, q.suffix, q.unit], ["compute", "fraction", "2/3", "lowest", "", ""]);
});
test("a fraction mistake whose decimal repeats can still be named", () => {
  const q = C.instance("f.third", 1, { a: 1 });
  // 1/4 terminates; 1/6 repeats and was dropped before fractions could be typed.
  assert.deepStrictEqual(q.distractors.map((d) => [d.error, E.frac(d.exact)]), [["one-more", "1/4"], ["doubled-the-bottom", "1/6"]]);
  assert.deepStrictEqual(C.diagnose(q, "1/6"), { correct: false, error: "doubled-the-bottom", feedback: "1/6 doubled the bottom." });
});
test("diagnose a fraction: right, unsimplified, a named mistake, or the fallback", () => {
  const q = C.instance("f.third", 1, { a: 2 });
  assert.deepStrictEqual(C.diagnose(q, "2/3"), { correct: true, error: null, feedback: null });
  assert.deepStrictEqual(C.diagnose(q, "4/6"), { correct: false, error: "not-lowest-terms", feedback: "Lowest terms, please." });
  assert.deepStrictEqual(C.diagnose(q, "2/4"), { correct: false, error: "one-more", feedback: "1/2 has one more in the bottom." });
  assert.deepStrictEqual(C.diagnose(q, "5/7"), { correct: false, error: null, feedback: "Not yet." });
  assert.deepStrictEqual(C.diagnose(q, "0.75"), { correct: false, error: null, feedback: "Not yet." });
});
test("form 'any' accepts an unsimplified fraction", () => {
  const q = C.instance("f.any", 1, { a: 3, b: 6 });
  assert.strictEqual(q.answerText, "1/2");
  assert.strictEqual(C.diagnose(q, "3/6").correct, true);
});
test("a fraction answer is never a whole number", () => {
  for (let s = 0; s < 200; s++) assert.ok(!Number.isInteger(C.generate("f.whole-sometimes", 1, s).answer));
  assert.ok(Array.from({ length: 200 }, (_, s) => C.firstDraw("f.whole-sometimes", 1, s)).some((f) => f.reason === "answer"));
});
test("diagnose a mixed number: form mistakes are named apart from wrong amounts", () => {
  const q = C.instance("f.mixed", 1, { w: 2, a: 2 });
  assert.deepStrictEqual([q.entry, q.answerText], ["mixed", "2 2/3"]);
  assert.strictEqual(C.diagnose(q, "2 2/3").correct, true);
  assert.strictEqual(C.diagnose(q, "8/3").error, "not-a-mixed-number");
  assert.strictEqual(C.diagnose(q, "2 4/6").error, "not-lowest-terms");
  assert.strictEqual(C.diagnose(q, "1 5/3").error, "fraction-part-not-proper");
  assert.strictEqual(C.diagnose(q, "2 2/4").error, "one-more");
  assert.deepStrictEqual(C.diagnose(q, "2"), { correct: false, error: null, feedback: "Not yet." });
  assert.strictEqual(C.diagnose(q, "8/3").feedback, "As a mixed number, please.");
});
test("numbers with a sign or unit after them", () => {
  assert.deepStrictEqual(["f.percent", "f.unit", "f.pi"].map((id) => {
    const q = C.generate(id, 1, 3);
    return [q.entry, q.suffix];
  }), [["number", "%"], ["number", " cm²"], ["number", "π"]]);
  const q = C.instance("f.unit", 1, { a: 5 });
  assert.strictEqual(C.diagnose(q, "25").correct, true);
  assert.strictEqual(C.diagnose(q, "20").error, "perimeter");
  const m = C.instance("f.money", 1, { a: 4 });
  assert.deepStrictEqual([m.unit, m.suffix, m.answerText], ["₱", "", "40"]);
});
test("choices in mixed order: the answer is not always last, and stays put for a question", () => {
  const where = Array.from({ length: 60 }, (_, s) => C.generate("f.mixed-order", 1, s).answerIndex);
  assert.ok(new Set(where).size >= 3, "the greatest option moves around: " + where.join(""));
  for (let s = 0; s < 20; s++) assert.deepStrictEqual(C.generate("f.mixed-order", 1, s).choices, C.generate("f.mixed-order", 1, s).choices);
  const a = C.instance("f.mixed-order", 1, { a: 4 }), b = C.instance("f.mixed-order", 1, { a: 4 });
  assert.deepStrictEqual(a.choices, b.choices);
  assert.strictEqual(a.choices[a.answerIndex], "34");
});
test("choices can be fractions that repeat as decimals", () => {
  const q = C.instance("f.choice", 1, { a: 1 });
  assert.strictEqual(q.entry, null);
  assert.deepStrictEqual(q.choices, ["1/5", "1/4", "2/7", "1/3"]);
  assert.strictEqual(q.choices[q.answerIndex], "1/3");
  assert.strictEqual(C.diagnose(q, 1).error, "one-more");
});

/* ---------- the Basics track ---------- */

const BASICS = {
  manifest: Object.assign({}, PACK.manifest, {
    basics: [{ key: "b", label: "Facts", icon: "star", colorKey: 4, file: "b.json" }]
  }),
  file: (extra) => Object.assign({
    topic: "b",
    grid: { title: "Times table", sign: "×", from: 2, to: 4 },
    levels: [
      { id: "small", title: "Small", kind: "facts", templates: ["b.times", "b.share"] },
      { id: "skill", title: "Skill", templates: ["b.skill"] },
      { id: "all", title: "All", kind: "review" }
    ],
    templates: [
      T("b.times", {
        competency: undefined, grid: true, params: { x: { choose: [2, 3] }, y: { range: [2, 4] } }, where: ["y >= x"],
        answer: { type: "integer", value: "x * y" },
        formats: [{ id: "xy", prompt: "{x} × {y} = ?" }, { id: "yx", prompt: "{y} × {x} = ?" }],
        explain: "{x} × {y} = {answer}", distractors: [{ value: "x + y", error: "added", feedback: "{value} adds." }]
      }),
      T("b.share", {
        competency: undefined, params: { x: { choose: [2] }, q: { range: [1, 3] }, n: { value: "x * q" } },
        answer: { type: "integer", value: "q" }, formats: [{ id: "div", prompt: "{n} ÷ {x} = ?" }],
        explain: "{n} ÷ {x} = {answer}", distractors: [{ value: "q + 1", error: "one-more", feedback: "{value} is one more." }]
      }),
      T("b.skill", { competency: undefined })
    ]
  }, extra)
};
const SMALL = ["b.times:2,2", "b.times:2,3", "b.times:2,4", "b.times:3,3", "b.times:3,4", "b.share:2,1", "b.share:2,2", "b.share:2,3"];

test("Basics topics install beside the path, never on it", () => {
  C.use(BASICS.manifest, PACK.files, [BASICS.file()]);
  assert.deepStrictEqual(C.TOPICS.map((t) => t.key), ["t", "u", "v"]);
  assert.deepStrictEqual(C.BASICS.map((t) => [t.key, t.track, t.ready, t.grid]), [["b", "basics", true, true]]);
  assert.deepStrictEqual(C.BASICS[0].levels.map((lv) => [lv.id, lv.kind, lv.factCount]),
    [["small", "facts", 8], ["skill", "practice", 0], ["all", "review", 8]]);
  assert.deepStrictEqual(C.byKey("b").levels.map((lv) => lv.competencies), [[], [], []], "Basics are not on the blueprint");
});
test("a facts level lists every fact once, in template order; review lists them all", () => {
  C.use(BASICS.manifest, PACK.files, [BASICS.file()]);
  assert.deepStrictEqual(C.facts("b", "small"), SMALL);
  assert.deepStrictEqual(C.facts("b", "all"), SMALL);
  assert.deepStrictEqual(C.facts("b", "skill"), []);
  const list = C.facts("b", "small");
  list.pop();
  assert.strictEqual(C.facts("b", "small").length, 8, "a caller cannot change the level's list");
});
test("a fact question is that fact, in the format its seed picks", () => {
  C.use(BASICS.manifest, PACK.files, [BASICS.file()]);
  const q = C.factQuestion("b", "small", "b.times:3,4", 7, 5);
  assert.strictEqual(q.answer, 12);
  assert.strictEqual(q.factKey, "b.times:3,4");
  assert.strictEqual(q.levelId, "small");
  assert.strictEqual(q.id, "b-small-5");
  assert.strictEqual(q.pinned, false);
  assert.ok(["3 × 4 = ?", "4 × 3 = ?"].includes(q.prompt));
  assert.deepStrictEqual(C.factQuestion("b", "small", "b.times:3,4", 7, 5), q);
  const prompts = new Set(Array.from({ length: 40 }, (_, s) => C.factQuestion("b", "small", "b.times:3,4", s, 0).prompt));
  assert.strictEqual(prompts.size, 2, "both formats appear across seeds");
  assert.strictEqual(C.factQuestion("b", "all", "b.share:2,3", 1, 0).answer, 3);
  assert.ok(C.isCorrect(q, "12"));
  assert.strictEqual(C.diagnose(q, "7").error, "added");
});
test("a fact is listed once, and only with an answer a learner can give", () => {
  const f = BASICS.file();
  f.templates = f.templates.concat([T("b.minus", {
    params: { x: { choose: [2, 3, 2] }, y: { range: [1, 4] } },
    answer: { type: "integer", value: "x - y" }, formats: [{ id: "m", prompt: "{x} − {y} = ?" }],
    explain: "{answer}", distractors: [{ value: "x + y", error: "added", feedback: "{value}" }]
  })]);
  f.levels = f.levels.concat([{ id: "minus", title: "Minus", kind: "facts", templates: ["b.minus"] }]);
  C.use(BASICS.manifest, PACK.files, [f]);
  assert.deepStrictEqual(C.facts("b", "minus"), ["b.minus:2,1", "b.minus:2,2", "b.minus:3,1", "b.minus:3,2", "b.minus:3,3"]);
  assert.strictEqual(C.facts("b", "all").length, 8 + 5);
  assert.deepStrictEqual(C.fact("b.minus:3,2"), { key: "b.minus:3,2", template: "b.minus", params: { x: 3, y: 2 } });
  C.use(PACK.manifest, PACK.files);
});
test("factQuestion refuses a fact the level does not have", () => {
  C.use(BASICS.manifest, PACK.files, [BASICS.file()]);
  throws(() => C.factQuestion("b", "skill", "b.times:3,4", 1, 0), /has no fact/);
  throws(() => C.factQuestion("b", "small", "b.times:4,4", 1, 0), /has no fact/);
  throws(() => C.factQuestion("b", "nope", "b.times:3,4", 1, 0), /has no level/);
});
test("the grid puts a fact on both of its cells, and only grid templates on it", () => {
  C.use(BASICS.manifest, PACK.files, [BASICS.file()]);
  const g = C.grid("b");
  assert.deepStrictEqual(g.values, [2, 3, 4]);
  assert.strictEqual(g.sign, "×");
  assert.strictEqual(g.cells["3,4"], "b.times:3,4");
  assert.strictEqual(g.cells["4,3"], "b.times:3,4");
  assert.strictEqual(g.cells["2,2"], "b.times:2,2");
  assert.strictEqual(g.cells["4,4"], undefined);
  assert.ok(Object.values(g.cells).every((k) => k.startsWith("b.times:")));
  assert.strictEqual(C.grid("t"), null);
  assert.strictEqual(C.grid("nope"), null);
});
test("use() refuses Basics that cannot work", () => {
  const m = BASICS.manifest;
  const level = (lv) => BASICS.file({ levels: [lv] });
  throws(() => C.use(m, PACK.files, [level({ id: "x", title: "X", kind: "drill", templates: ["b.times"] })]), /unknown kind 'drill'/);
  throws(() => C.use(m, PACK.files, [level({ id: "x", title: "X", kind: "review", templates: ["b.times"] })]), /no templates of its own/);
  throws(() => C.use(m, PACK.files, [level({ id: "x", title: "X", kind: "review" })]), /nothing to ask/);
  throws(() => C.use(Object.assign({}, m, { basics: [{ key: "b", comingSoon: true }] }), PACK.files, [null]), /cannot be coming soon/);
  throws(() => C.use(Object.assign({}, m, { basics: [{ key: "u", label: "U", icon: "star", colorKey: 1, file: "u.json" }] }),
    PACK.files, [PACK.files[1]]), /topic key used twice/);
  throws(() => C.use(m, PACK.files, []), /missing or mislabelled/);
  const pathFacts = Object.assign({}, PACK.files[1], { levels: [{ id: "only", title: "Only", kind: "facts", templates: ["u.only"] }] });
  throws(() => C.use(PACK.manifest, [PACK.files[0], pathFacts, null]), /only a Basics level can be facts/);
  const tiered = BASICS.file();
  tiered.templates = tiered.templates.map((t) => t.id === "b.times" ? Object.assign({}, t, { params: { x: { tiers: { "1": [2, 3] } }, y: { range: [2, 4] } } }) : t);
  throws(() => C.use(m, PACK.files, [tiered]), /must be a choose or a range, not tiers/);
  C.use(PACK.manifest, PACK.files);
});

/* ---------- charts ---------- */

test("pick: one of a list by its place", () => {
  assert.strictEqual(ev("pick(2, 'June', 'July', 'August')"), "July");
  assert.strictEqual(show("pick(3, 10, 20, 30)"), "30");
  throws(() => ev("pick(0, 'a', 'b')"), /no item 0/);
  throws(() => ev("pick(3, 'a', 'b')"), /no item 3/);
  throws(() => ev("pick(1.5, 'a', 'b')"), /whole number/);
  assert.ok(E.RESERVED.includes("pick"), "a param cannot be named pick");
});

const CHARTS = {
  manifest: Object.assign({}, PACK.manifest, { topics: [{ key: "c", label: "Charts", icon: "star", colorKey: 1, file: "c.json" }] }),
  files: [{
    topic: "c",
    levels: [{ id: "all", title: "All", templates: ["c.bar", "c.pie", "c.table", "c.flat", "c.angle"], lesson: [
      { title: "Bars", body: "Read across." },
      { title: "Worked example", example: { template: "c.bar", params: { a: 7, b: 3 } } }] }],
    templates: [
      T("c.bar", { chart: { kind: "bar", title: "Books {a}", axis: "Books", step: "5", label: "{fmt(value)} bk", categories: ["Jun", "Jul"],
        series: [{ name: "Grade 5", values: ["a * 5", "b * 5"] }, { name: "Grade 6", values: ["b * 5", "b * 5 + 3"] }] } }),
      T("c.pie", { chart: { kind: "pie", title: "Fruits", unit: "%", slices: [
        { name: "Mango", value: "a * 10" }, { name: "Banana", value: "100 - a * 10", hidden: "a > 5" }] } }),
      T("c.table", { chart: { kind: "table", title: "Prices", axis: "Week", label: "{peso(value)}",
        categories: ["Week 1", "Week 2"], series: [{ name: "Store A", values: ["a", "b + 0.5"] }] } }),
      T("c.flat", { chart: { kind: "line", title: "Flat", axis: "Units", step: "a - a", categories: ["A", "B"], series: [{ name: "S", values: ["a", "b"] }] } }),
      T("c.angle", { answer: { type: "unit", unit: "°", value: "a * 18" } })
    ]
  }]
};
test("charts: a bar graph's values, gridlines and words", () => {
  C.use(CHARTS.manifest, CHARTS.files);
  const c = C.instance("c.bar", 1, { a: 7, b: 3 }).chart;
  assert.deepStrictEqual(c.series.map((s) => s.values), [[35, 15], [15, 18]]);
  assert.deepStrictEqual(c.series[0].labels, ["35 bk", "15 bk"]);
  assert.deepStrictEqual([c.kind, c.title, c.axis, c.step, c.top], ["bar", "Books 7", "Books", 5, 35]);
  assert.deepStrictEqual(c.ticks.map((k) => k.value), [0, 5, 10, 15, 20, 25, 30, 35]);
  assert.strictEqual(c.ticks[7].label, "35 bk");
  assert.strictEqual(c.text, "Double bar graph: Books 7 (Books). Grade 5: Jun 35 bk, Jul 15 bk. Grade 6: Jun 15 bk, Jul 18 bk.");
  /* The top gridline is the first at or above the highest value. */
  assert.strictEqual(C.instance("c.bar", 1, { a: 3, b: 4 }).chart.top, 25);
  throws(() => C.instance("c.flat", 1, { a: 3, b: 4 }), /step must be more than 0/);
  C.use(PACK.manifest, PACK.files);
});
test("charts: a pie's slices, one of them unlabelled", () => {
  C.use(CHARTS.manifest, CHARTS.files);
  const hid = C.instance("c.pie", 1, { a: 7, b: 3 }).chart;
  assert.deepStrictEqual(hid.slices, [{ name: "Mango", value: 70, label: "70%", hidden: false }, { name: "Banana", value: 30, label: "30%", hidden: true }]);
  assert.strictEqual(hid.text, "Pie graph: Fruits. Clockwise from the top: Mango 70%, Banana not labelled.");
  assert.strictEqual(C.instance("c.pie", 1, { a: 3, b: 3 }).chart.slices[1].hidden, false);
  C.use(PACK.manifest, PACK.files);
});
test("charts: a table reads row by row, with no gridlines", () => {
  C.use(CHARTS.manifest, CHARTS.files);
  const t = C.instance("c.table", 1, { a: 4, b: 6 }).chart;
  assert.deepStrictEqual(t.series[0].labels, ["₱4", "₱6.50"]);
  assert.strictEqual(t.text, "Table: Prices (Week). Week 1: Store A ₱4. Week 2: Store A ₱6.50.");
  assert.ok(!("ticks" in t) && !("step" in t));
  C.use(PACK.manifest, PACK.files);
});
test("charts: only a template with one gets one, in practice and in its lesson", () => {
  C.use(CHARTS.manifest, CHARTS.files);
  assert.ok(!("chart" in C.instance("c.angle", 1, { a: 4, b: 2 })));
  const cards = C.lesson("c", "all");
  assert.strictEqual(cards[1].chart.title, "Books 7");
  assert.ok(!("chart" in cards[0]));
  C.use(PACK.manifest, PACK.files);
  assert.ok(!("chart" in C.generate("t.formats", 1, 3)));
});
test("a degree sign sits against its number; other units take a space", () => {
  C.use(CHARTS.manifest, CHARTS.files);
  assert.strictEqual(C.instance("c.angle", 1, { a: 4, b: 2 }).suffix, "°");
  C.use(PACK.manifest, PACK.files);
});

test("retier: the same question at another tier, in its place in the round", () => {
  const ses = C.buildSession({ topic: "t", level: "one", count: 10, tier: 1, seed: 42, pinned: true });
  const i = ses.findIndex((x) => !x.pinned && x.templateId === "t.tiers");
  const q = ses[i];
  assert.ok(q.answer <= 3, "tier 1 draws small numbers");
  const up = C.retier(q, 2, i);
  assert.deepStrictEqual([up.templateId, up.seed, up.tier, up.id, up.levelId], [q.templateId, q.seed, 2, q.id, q.levelId]);
  assert.ok(up.answer >= 50, "tier 2 draws from its own range");
  const again = C.rebuild({ topic: up.topicKey, template: up.templateId, tier: up.tier, seed: up.seed, pinnedAt: null });
  assert.deepStrictEqual([again.prompt, again.answer], [up.prompt, up.answer], "the attempt log rebuilds what was asked");
  assert.strictEqual(C.retier(q, 1, i), q, "already at that tier: the same question");
  assert.strictEqual(C.retier(ses[0], 3, 0), ses[0], "a pinned item keeps its fixed values");
});

/* ---------- spaced review ---------- */

test("rebuild: a missed question comes back exactly as it was asked", () => {
  const ses = C.buildSession({ topic: "t", level: "one", count: 6, tier: 2, seed: 5, pinned: true });
  for (const q of ses) {
    const again = C.rebuild({ topic: q.topicKey, template: q.templateId, tier: q.tier, seed: q.pinned ? null : q.seed, pinnedAt: q.pinned ? q.pinnedAt : null });
    assert.deepStrictEqual([again.prompt, again.answer, again.format, again.levelId], [q.prompt, q.answer, q.format, q.levelId], q.id);
  }
  assert.strictEqual(C.rebuild({ topic: "t", template: "t.nope", tier: 1, seed: 1 }), null, "a template a later pack retired");
  assert.strictEqual(C.rebuild({ topic: "u", template: "t.formats", tier: 1, seed: 1 }), null, "a template from another topic");
  assert.strictEqual(C.rebuild({ topic: "t", template: "t.tiers", tier: 1, seed: null, pinnedAt: 0 }), null, "a pinned place now holding another template");
  assert.strictEqual(C.rebuild({ topic: "t", template: "t.formats", tier: 1, seed: null, pinnedAt: 7 }), null, "a pinned place that is gone");
  assert.strictEqual(C.rebuild({ topic: "v", template: "t.formats", tier: 1, seed: 1 }), null, "a topic not yet written");
});

/* ---------- the practice exam ---------- */

const WEIGHTED = {
  manifest: Object.assign({}, PACK.manifest, { topics: [
    Object.assign({}, PACK.manifest.topics[0], { weight: 0.6 }),
    Object.assign({}, PACK.manifest.topics[1], { weight: 0.4 }),
    Object.assign({}, PACK.manifest.topics[2], { weight: 0.5 })] }),
  files: PACK.files
};
test("exam: questions shared out by weight, the largest remainders first", () => {
  C.use(WEIGHTED.manifest, WEIGHTED.files);
  assert.deepStrictEqual(C.examPlan(5), [{ key: "t", count: 3 }, { key: "u", count: 2 }], "a topic coming soon gets none");
  assert.deepStrictEqual(C.examPlan(4), [{ key: "t", count: 2 }, { key: "u", count: 2 }], "2.4 and 1.6: the last one goes to the larger remainder");
  assert.deepStrictEqual(C.examPlan(1), [{ key: "t", count: 1 }]);
  C.use(PACK.manifest, PACK.files);
  throws(() => C.examPlan(5), /no weighted topic/);
});
test("exam: a mixed, shuffled paper, the same for the same seed", () => {
  C.use(WEIGHTED.manifest, WEIGHTED.files);
  const paper = C.buildExam({ count: 10, seed: 9 });
  assert.strictEqual(paper.length, 10);
  assert.deepStrictEqual(paper.map((q) => q.id), paper.map((_, i) => "exam-" + i));
  assert.strictEqual(paper.filter((q) => q.topicKey === "t").length, 6);
  /* Tier 3: the numbers of a level well under way. */
  assert.ok(paper.every((q) => q.tier === 3 && q.levelId), "exam numbers, and each question knows its level");
  const fromT = paper.filter((q) => q.topicKey === "t").map((q) => q.templateId);
  assert.strictEqual(new Set(fromT).size, 6, "no template twice while the topic has more");
  assert.deepStrictEqual(C.buildExam({ count: 10, seed: 9 }), paper);
  assert.notDeepStrictEqual(C.buildExam({ count: 10, seed: 10 }).map((q) => q.prompt), paper.map((q) => q.prompt));
  assert.ok(paper.slice(0, 6).some((q) => q.topicKey === "u"), "shuffled, not topic by topic");
  C.use(PACK.manifest, PACK.files);
});

/* ---------- figures ---------- */

const ONE_TO = (n) => ({ a: { range: [1, n] }, b: { value: "1" } });
const FIGS = {
  manifest: Object.assign({}, PACK.manifest, { topics: [{ key: "g", label: "Figures", icon: "star", colorKey: 1, file: "g.json" }] }),
  files: [{
    topic: "g",
    levels: [{ id: "all", title: "All", templates: ["g.tiling", "g.two", "g.seven", "g.clock", "g.mirror", "g.side", "g.grid", "g.move", "g.pick", "g.same", "g.cubes", "g.solid", "g.zones", "g.wide", "g.circle"] }],
    templates: [
      T("g.tiling", { params: ONE_TO(6), chart: { kind: "tiling", title: "Round a point", shapes: [{ sides: "5", count: "a" }] } }),
      T("g.two", { chart: { kind: "tiling", title: "Round a point", shapes: [{ sides: "8", count: "2" }, { sides: "4", count: "1" }] } }),
      T("g.seven", { chart: { kind: "tiling", title: "Round a point", shapes: [{ sides: "7", count: "1" }] } }),
      T("g.clock", { params: ONE_TO(13), chart: { kind: "clock", title: "Clock", hand: "a" } }),
      T("g.mirror", { params: ONE_TO(11), chart: { kind: "mirror", title: "Paper", distance: "a", side: "'left'" } }),
      T("g.side", { chart: { kind: "mirror", title: "Paper", distance: "a", side: "'up'" } }),
      T("g.grid", { params: ONE_TO(16), chart: { kind: "grid", title: "Grid", cols: "a + 2", rows: "4", points: [["1", "1"], ["a + 1", "1"], ["1", "3"]] } }),
      T("g.move", { chart: { kind: "grid", title: "Move", cols: "6", rows: "4", points: [["1", "1"], ["2", "1"], ["1", "3"]],
        image: [["5", "1"], ["4", "1"], ["5", "3"]], line: [["3", "0"], ["3", "4"]], dot: ["3", "2"] } }),
      /* Options that are pictures: the shape slid along by the option's value. */
      T("g.pick", {
        answer: { type: "choice", value: "1", order: "mixed", figure: { kind: "grid", cols: "6", rows: "4",
          points: [["1", "1"], ["2", "1"], ["1", "3"]], image: [["value + 1", "1"], ["value + 2", "1"], ["value + 1", "3"]] } },
        distractors: [{ value: "2", error: "two", feedback: "Two." }, { value: "3", error: "three", feedback: "Three." }, { value: "4", error: "four", feedback: "Four." }]
      }),
      T("g.cubes", { params: ONE_TO(9), chart: { kind: "cubes", title: "Block", length: "a", width: "2", height: "1" } }),
      T("g.solid", { params: ONE_TO(9), chart: { kind: "solid", title: "Solid", shape: "a" } }),
      T("g.circle", { params: ONE_TO(6), chart: { kind: "circle", title: "Circle", part: "a" } }),
      T("g.zones", { params: ONE_TO(11), chart: { kind: "zones", title: "Zones", from: "a - 1", to: "a + 2", cities: [["Manila", "a"], ["Tokyo", "a + 1"]] } }),
      T("g.wide", { params: ONE_TO(13), chart: { kind: "zones", title: "Zones", from: "0", to: "a", cities: [["Here", "0"], ["There", "5"]] } }),
      /* ...and a figure that ignores the value, so every option looks the same. */
      T("g.same", {
        answer: { type: "choice", value: "1", order: "mixed", figure: { kind: "grid", cols: "6", rows: "4",
          points: [["1", "1"], ["2", "1"], ["1", "3"]], image: [["2", "1"], ["3", "1"], ["2", "3"]] } },
        distractors: [{ value: "2", error: "two", feedback: "Two." }, { value: "3", error: "three", feedback: "Three." }, { value: "4", error: "four", feedback: "Four." }]
      })
    ]
  }]
};
test("figures: regular shapes round a point, and the gap they leave", () => {
  C.use(FIGS.manifest, FIGS.files);
  const t = C.instance("g.tiling", 1, { a: 3 }).chart;
  assert.deepStrictEqual(t.shapes, [{ sides: 5, count: 3, angle: 108, name: "3 regular pentagons" }]);
  assert.strictEqual(t.gap, 36);
  assert.strictEqual(t.text, "Picture: 3 regular pentagons round a point, with a gap left.");
  assert.strictEqual(C.instance("g.tiling", 1, { a: 1 }).chart.shapes[0].name, "a regular pentagon");
  const two = C.instance("g.two", 1, { a: 3, b: 2 }).chart;
  assert.deepStrictEqual([two.gap, two.text], [0, "Picture: 2 regular octagons and a square round a point, with no gap."]);
  throws(() => C.instance("g.tiling", 1, { a: 4 }), /overlap/);
  throws(() => C.instance("g.seven", 1, { a: 3, b: 2 }), /cannot show a regular shape of 7 sides/);
  C.use(PACK.manifest, PACK.files);
});
test("figures: a shape on squared paper, its corners on grid points", () => {
  C.use(FIGS.manifest, FIGS.files);
  const g = C.instance("g.grid", 1, { a: 3 }).chart;
  assert.deepStrictEqual([g.cols, g.rows, g.points], [5, 4, [[1, 1], [4, 1], [1, 3]]]);
  assert.strictEqual(g.text, "Picture: squared paper 5 squares across and 4 up, with a shape whose corners are at 1 across and 1 up; 4 across and 1 up; 1 across and 3 up. Each square is 1 square unit.");
  throws(() => C.instance("g.grid", 1, { a: 15 }), /a grid's width is 2 to 16/);
  C.use(PACK.manifest, PACK.files);
});
test("figures: a move on squared paper, with its image, its mirror line and the point it turns about", () => {
  C.use(FIGS.manifest, FIGS.files);
  const g = C.instance("g.move", 1, { a: 2, b: 2 }).chart;
  assert.deepStrictEqual([g.points, g.image, g.line, g.dot], [[[1, 1], [2, 1], [1, 3]], [[5, 1], [4, 1], [5, 3]], [[3, 0], [3, 4]], [3, 2]]);
  assert.strictEqual(g.text, "Picture: squared paper 6 squares across and 4 up, with a shape whose corners are at 1 across and 1 up; " +
    "2 across and 1 up; 1 across and 3 up. Its image after the move has corners at 5 across and 1 up; 4 across and 1 up; " +
    "5 across and 3 up. A mirror line runs from 3 across and 0 up to 3 across and 4 up. A dot marks the point 3 across and 2 up. " +
    "Each square is 1 square unit.");
  assert.ok(!("image" in C.instance("g.grid", 1, { a: 3 }).chart), "a plain grid has no image");
  C.use(PACK.manifest, PACK.files);
});
test("picture choices: each option drawn with its own value, lettered, and named by its picture", () => {
  C.use(FIGS.manifest, FIGS.files);
  const where = new Set();
  for (let s = 0; s < 30; s++) {
    const q = C.generate("g.pick", 1, s);
    assert.deepStrictEqual(q.choices, ["A", "B", "C", "D"]);
    assert.strictEqual(q.choiceFigures.length, 4);
    q.choiceFigures.forEach((f, i) => {
      assert.strictEqual(f.image[0][0], q.choiceValues[i].n + 1, "option " + q.choices[i] + " is drawn with its own value");
      assert.strictEqual(f.title, "");
    });
    assert.strictEqual(q.choiceFigures[q.answerIndex].image[0][0], 2, "the right picture is the answer's");
    assert.strictEqual(C.choiceText(q, q.answerIndex), "Picture " + q.choices[q.answerIndex]);
    assert.strictEqual(C.diagnose(q, q.choiceValues.findIndex((v) => v.n === 3)).error, "three");
    where.add(q.answerIndex);
  }
  assert.ok(where.size > 1, "the right picture is not always in the same place");
  throws(() => C.generate("g.same", 1, 0), /no usable question/);
  C.use(PACK.manifest, PACK.files);
  const c = C.instance("t.choice", 1, { a: 2, b: 3 });
  assert.strictEqual(C.choiceText(c, c.answerIndex), "6 things", "an option in words is its label");
  assert.ok(!("choiceFigures" in c));
});
test("figures: a block of small cubes, counted along each edge", () => {
  C.use(FIGS.manifest, FIGS.files);
  const b = C.instance("g.cubes", 1, { a: 4 }).chart;
  assert.deepStrictEqual([b.length, b.width, b.height], [4, 2, 1]);
  assert.strictEqual(b.text, "Picture: a block built from small cubes with no gaps, 4 cubes long, 2 cubes deep and 1 cube high.");
  throws(() => C.instance("g.cubes", 1, { a: 9 }), /a block's length in cubes is 1 to 8/);
  C.use(PACK.manifest, PACK.files);
});
test("figures: a solid in outline, described by its faces and never named", () => {
  C.use(FIGS.manifest, FIGS.files);
  const s = C.instance("g.solid", 1, { a: 4 }).chart;
  assert.strictEqual(s.shape, 4);
  assert.strictEqual(s.text, "Picture: a solid drawn in outline, its hidden edges dashed: a square base and 4 triangular faces that meet at a point.");
  for (let a = 1; a <= 8; a++) assert.ok(!/cube|prism|pyramid|cylinder|cone|sphere/.test(C.instance("g.solid", 1, { a }).chart.text), "shape " + a + " is named");
  throws(() => C.instance("g.solid", 1, { a: 9 }), /a solid's shape is 1 to 8/);
  C.use(PACK.manifest, PACK.files);
});
test("figures: a strip of time zones, with cities in theirs", () => {
  C.use(FIGS.manifest, FIGS.files);
  const z = C.instance("g.zones", 1, { a: 8 }).chart;
  assert.deepStrictEqual([z.from, z.to, z.cities], [7, 10, [{ name: "Manila", zone: 8 }, { name: "Tokyo", zone: 9 }]]);
  assert.strictEqual(z.text, "Picture: a time zone map, one column for each hour, from UTC+7 to UTC+10. Manila is in UTC+8; Tokyo is in UTC+9.");
  assert.match(C.instance("g.zones", 1, { a: 1 }).chart.text, /from UTC to UTC\+3\./, "London's zone is plain UTC");
  throws(() => C.instance("g.wide", 1, { a: 12 }), /a map's last zone is 1 to 9/);
  throws(() => C.instance("g.wide", 1, { a: 3 }), /a city's zone is 0 to 3, not 5/);
  C.use(PACK.manifest, PACK.files);
});
test("figures: a circle with one part marked, described and never named", () => {
  C.use(FIGS.manifest, FIGS.files);
  const c = C.instance("g.circle", 1, { a: 3 }).chart;
  assert.strictEqual(c.part, 3);
  assert.strictEqual(c.text, "Picture: a circle with its centre marked. Drawn in a heavier line: a line joining two points on the edge, not through the centre.");
  for (let a = 1; a <= 5; a++) assert.ok(!/radius|diameter|chord|circumference|arc/.test(C.instance("g.circle", 1, { a }).chart.text), "part " + a + " is named");
  throws(() => C.instance("g.circle", 1, { a: 6 }), /a circle's marked part is 1 to 5/);
  C.use(PACK.manifest, PACK.files);
});
test("figures: a clock face and a mirror line", () => {
  C.use(FIGS.manifest, FIGS.files);
  const k = C.instance("g.clock", 1, { a: 3 }).chart;
  assert.deepStrictEqual([k.hand, k.text], [3, "Picture: a clock face, with its hand pointing to 3."]);
  throws(() => C.instance("g.clock", 1, { a: 13 }), /a clock hand is 1 to 12/);
  const m = C.instance("g.mirror", 1, { a: 3 }).chart;
  assert.deepStrictEqual([m.distance, m.side, m.text], [3, "left", "Picture: squared paper with a mirror line, and a point 3 squares to its left."]);
  assert.strictEqual(C.instance("g.mirror", 1, { a: 1 }).chart.text, "Picture: squared paper with a mirror line, and a point 1 square to its left.");
  throws(() => C.instance("g.mirror", 1, { a: 11 }), /1 to 10/);
  throws(() => C.instance("g.side", 1, { a: 3, b: 2 }), /left or the right/);
  C.use(PACK.manifest, PACK.files);
});

/* ---------- clock times ---------- */

test("clock, clock12 and hm write times and lengths of time", () => {
  assert.deepStrictEqual(["clock(0)", "clock(845)", "clock(1439)"].map(ev), ["00:00", "14:05", "23:59"]);
  assert.deepStrictEqual(["clock12(0)", "clock12(45)", "clock12(540)", "clock12(720)", "clock12(765)", "clock12(1439)"].map(ev),
    ["12:00 midnight", "12:45 a.m.", "9:00 a.m.", "12:00 noon", "12:45 p.m.", "11:59 p.m."]);
  assert.deepStrictEqual(["hm(1)", "hm(45)", "hm(60)", "hm(61)", "hm(125)"].map(ev),
    ["1 minute", "45 minutes", "1 hour", "1 hour 1 minute", "2 hours 5 minutes"]);
  throws(() => ev("clock(1440)"), /0 to 1439/);
  throws(() => ev("clock12(0 - 5)"), /0 to 1439/);
  throws(() => ev("clock(90.5)"), /whole number/);
  throws(() => ev("hm(0)"), /at least a minute/);
  for (const f of ["clock", "clock12", "hm"]) assert.ok(E.RESERVED.includes(f), "a param cannot be named " + f);
});
test("a 24-hour time is read exactly as the boxes write it", () => {
  const t = (s) => { const v = E.readTime(s); return v && E.fmt(v); };
  assert.deepStrictEqual(["14:05", "9:05", "09:05", "00:00", "23:59"].map(t), ["845", "545", "545", "0", "1439"]);
  for (const bad of ["24:00", "12:60", "1405", "14:5", "14:05 p.m.", "", null]) assert.strictEqual(E.readTime(bad), null, String(bad));
});
const CLOCK = {
  manifest: Object.assign({}, PACK.manifest, { topics: [{ key: "k", label: "Clock", icon: "star", colorKey: 1, file: "k.json" }] }),
  files: [{
    topic: "k",
    levels: [{ id: "all", title: "All", templates: ["k.time", "k.late"] }],
    templates: [
      T("k.time", { answer: { type: "time", value: "a * 60 + 5" },
        distractors: [{ value: "a * 60 + 725", error: "p-m", feedback: "{clock(value)} is in the afternoon." }] }),
      T("k.late", { answer: { type: "time", value: "a * 60 + 1440" } })
    ]
  }]
};
test("a time answer is typed as 24-hour time and checked as one", () => {
  C.use(CLOCK.manifest, CLOCK.files);
  const q = C.instance("k.time", 1, { a: 3, b: 2 });
  assert.deepStrictEqual([q.entry, q.answerText, q.answer, q.suffix], ["time", "03:05", 185, ""]);
  assert.strictEqual(C.diagnose(q, "3:05").correct, true);
  assert.strictEqual(C.diagnose(q, "03:05").correct, true);
  assert.deepStrictEqual(C.diagnose(q, "15:05"), { correct: false, error: "p-m", feedback: "15:05 is in the afternoon." });
  for (const g of ["3:5", "305", "185", "27:05"]) assert.strictEqual(C.diagnose(q, g).error, null, g);
  /* A time past midnight is not one the boxes can hold. */
  throws(() => C.instance("k.late", 1, { a: 3, b: 2 }), /unusable answer/);
  C.use(PACK.manifest, PACK.files);
});

console.log(failed ? `\n${failed} failed` : "\nok: engine behaves as specified");
process.exit(failed ? 1 : 0);
