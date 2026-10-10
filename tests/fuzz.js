/* Generator fuzz test.
   The app is offline: a bad generated question reaches every learner who draws
   it, and nothing can hotfix an installed phone until it next syncs. So whole
   sessions are built for every topic at every tier, across thousands of seeds,
   and every question is checked for properties that must hold for any question
   the packs can ever produce. Basics facts levels are played as the app plays
   them: whole rounds, picked by app/facts.js for learners at every stage.

   Run:  node tests/fuzz.js        Exits 1 on any violation. */
"use strict";
const fs = require("fs");
const path = require("path");

// app/content.js is a browser IIFE that hangs its API off window.AM; the
// pack it would fetch is read from disk and installed the same way.
const ROOT = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
global.window = global;
global.AM = {};
new Function(read("app/content.js")).call(global);
const C = global.AM.content;
const PACK = "content/packs/math/";
const manifest = JSON.parse(read(PACK + "manifest.json"));
C.use(manifest, manifest.topics.map((t) => (t.comingSoon ? null : JSON.parse(read(PACK + t.file)))),
  (manifest.basics || []).map((t) => JSON.parse(read(PACK + t.file))));
new Function(read("app/facts.js")).call(global);
const F = global.AM.facts;

// The keypad's own length limit, from the entry rules the app uses, so the
// two cannot drift.
new Function(read("app/entry.js")).call(global);
const KEYPAD_MAX = global.AM.entry.NUMBER_MAX;

const FAILURES = {};
function fail(rule, q, detail) {
  (FAILURES[rule] = FAILURES[rule] || []).push({ topic: q.topicKey, prompt: q.prompt, detail });
}

// A number a learner cannot follow. The engine works in exact fractions and
// refuses to print a repeating decimal, so what is left to catch is a decimal
// longer than the four places the blueprint goes to.
const ugly = (s) => /\d+\.\d{5,}/.test(s);
// A negative RESULT ("= -60"). A subtraction sign in "500 - 170" is not one.
const negative = (s) => /=\s*[-\u2212]\s?\d/.test(s);
// A negative number anywhere in the words ("adds -3 pesos", "(−4)"): a minus
// sign right before a digit, not after one. Signed numbers are Grade 7.
const signed = (s) => /(^|[\s(])[-\u2212]\d/.test(s);
// "a 8 m ribbon", "a 11 m rectangle": a number read with a vowel sound
// (eight, eleven, eighteen, eighty, eight hundred) takes "an".
const article = (s) => /(^|[\s(])[Aa] (8|11(?!\d)|18(?!\d))/.test(s);

const SEEDS = 600;
const TIERS = [1, 2, 3, 4];
let total = 0;

const LEVELS = [], FACT_LEVELS = [];
for (const topic of C.TOPICS.concat(C.BASICS)) for (const level of topic.levels) {
  if (level.kind === "practice") LEVELS.push([topic.key, level.id]);
  else FACT_LEVELS.push([topic.key, level.id]);
}

for (const [topic, level] of LEVELS) {
  for (const tier of TIERS) for (let seed = 0; seed < SEEDS; seed++) {
    for (const q of C.buildSession({ topic, level, count: 10, tier, seed, pinned: seed % 2 === 0 })) check(q);
  }
}

/* A learner part way through: each fact new, being learnt, done today or
   mastered, at random. */
function learnerFor(keys, seed) {
  let a = seed + 1;
  const r = () => { a = (a * 1103515245 + 12345) % 2147483648; return a / 2147483648; };
  const states = {};
  for (const k of keys) {
    const x = r();
    states[k] = x < 0.3 ? { seen: 0, mastered: false, quickToday: false, last: null }
      : x < 0.6 ? { seen: 2, mastered: false, quickToday: false, last: "2026-10-0" + (1 + Math.floor(r() * 9)) }
      : x < 0.8 ? { seen: 1, mastered: false, quickToday: true, last: "2026-10-10" }
      : { seen: 4, mastered: true, quickToday: false, last: "2026-09-2" + Math.floor(r() * 9) };
  }
  return (k) => states[k];
}

let rounds = 0;
for (const [topic, level] of FACT_LEVELS) {
  const keys = C.facts(topic, level);
  for (let seed = 0; seed < SEEDS; seed++) {
    const round = F.pickRound(keys, learnerFor(keys, seed), seed);
    rounds++;
    const where = { topicKey: topic, prompt: `${level} round ${seed}` };
    if (round.length !== Math.min(F.ROUND, keys.length ? F.ROUND : 0)) fail("a round is not full", where, String(round.length));
    if (keys.length > 1 && round.some((k, i) => i > 0 && k === round[i - 1])) fail("a fact twice running", where, round.join(" "));
    if (round.some((k) => !keys.includes(k))) fail("a round asks a fact its level does not have", where, round.join(" "));
    round.forEach((k, i) => check(C.factQuestion(topic, level, k, seed * 100 + i, i)));
  }
}

function check(q) {
  total++;

  // 1. the answer must be one a learner can enter: no minus key; a number
  //    at most four decimal places and no longer than the keypad allows; a
  //    fraction a non-whole amount whose parts fit their boxes
  if (!Number.isFinite(q.answer)) fail("answer is not finite", q, String(q.answer));
  else if (q.answer < 0) fail("answer is negative", q, String(q.answer));
  else if (q.entry === "number" && Math.abs(q.answer * 1e4 - Math.round(q.answer * 1e4)) > 1e-6)
    fail("answer needs more than 4 decimal places", q, String(q.answer));
  else if (q.entry === "number" && q.answerText.length > KEYPAD_MAX)
    fail("answer is longer than the keypad allows", q, q.answerText);
  else if ((q.entry === "fraction" || q.entry === "mixed") &&
           (Number.isInteger(q.answer) || q.answerText.split(/[ /]/).some((p) => p.length > global.AM.entry.BOX_MAX)))
    fail("fraction answer does not fit its boxes", q, q.answerText);

  // 2. the scaffold must be complete
  if (!q.hints || q.hints.length !== 3) fail("not exactly 3 hints", q, String(q.hints && q.hints.length));
  if (!q.steps || q.steps.length !== 3) fail("not exactly 3 steps", q, String(q.steps && q.steps.length));
  if (!q.explain || !q.missExplain) fail("missing explanation", q, "");

  // 3. no hint or step may show a number a learner cannot follow
  for (const s of [...(q.hints || []), ...(q.steps || [])]) {
    if (ugly(s)) fail("decimal longer than four places in scaffold", q, s);
    if (negative(s)) fail("negative intermediate in scaffold", q, s);
  }
  /* A chart's words are read too: its title, names and labels, and the
     description a screen reader speaks. */
  const chart = q.chart ? [q.chart.title, q.chart.text] : [];
  for (const s of [q.prompt, q.explain, ...(q.hints || []), ...(q.steps || []), ...q.distractors.map((d) => d.feedback), ...chart]) {
    if (signed(s)) fail("a negative number in the words", q, s);
    if (article(s)) fail("'a' before a number read with a vowel sound", q, s);
  }

  // 4. multiple choice must be answerable
  if (q.type === "choice") {
    if (!q.choices || q.choices.length !== 4) fail("not 4 choices", q, String(q.choices && q.choices.length));
    else {
      if (new Set(q.choices).size !== 4) fail("duplicate choices", q, q.choices.join(" / "));
      if (q.answerIndex == null || q.answerIndex < 0 || q.answerIndex > 3)
        fail("answer not among choices", q, String(q.answerIndex));
    }
  }

  // 5. the checker must accept the answer it generated
  const given = q.type === "choice" ? q.answerIndex : q.answerText;
  if (!C.isCorrect(q, given)) fail("own answer rejected by checker", q, String(given));

  // 6. entering a named mistake must bring back that mistake's feedback,
  //    and no named mistake may be the right answer
  const markedRight = [], undiagnosed = [], unfilled = [];
  for (const d of q.distractors) {
    const entry = q.type === "choice"
      ? q.choiceValues.findIndex((v) => C.engine.eq(v, d.exact))
      : q.entry === "fraction" ? C.engine.frac(d.exact)
      : q.entry === "mixed" ? C.engine.mixed(d.exact)
      : C.engine.fmt(d.exact);
    const got = C.diagnose(q, entry);
    if (got.correct) markedRight.push(d.error);
    else if (got.error !== d.error || got.feedback !== d.feedback) undiagnosed.push(d.error + " -> " + got.error);
    if (!d.feedback || /[{}]/.test(d.feedback)) unfilled.push(String(d.feedback));
  }
  if (markedRight.length) fail("a named mistake is marked right", q, markedRight.join(", "));
  if (undiagnosed.length) fail("a named mistake is not diagnosed", q, undiagnosed.join(", "));
  if (unfilled.length) fail("mistake feedback is empty or unfilled", q, unfilled.join(" | "));
}

console.log(`fuzzed ${total.toLocaleString()} questions across ${LEVELS.length} levels, tiers ${TIERS.join("-")}, ${SEEDS} seeds each,`);
console.log(`and ${rounds.toLocaleString()} facts rounds across ${FACT_LEVELS.length} Basics levels`);

const rules = Object.keys(FAILURES);
if (!rules.length) {
  console.log("ok: no property violations");
  process.exit(0);
}

for (const rule of rules.sort((a, b) => FAILURES[b].length - FAILURES[a].length)) {
  const hits = FAILURES[rule];
  console.log(`\nFAIL ${rule}: ${hits.length} of ${total} (${(100 * hits.length / total).toFixed(2)}%)`);
  for (const h of hits.slice(0, 2)) {
    console.log(`  [${h.topic}] ${h.prompt.slice(0, 70)}`);
    console.log(`     -> ${h.detail.slice(0, 70)}`);
  }
}
process.exit(1);
