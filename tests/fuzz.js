/* Generator fuzz test.
   The app is offline: a bad generated question reaches every learner who draws
   it, and nothing can hotfix an installed phone until it next syncs. So every
   template is driven across thousands of seeds and checked for properties that
   must hold for any question it can ever produce.

   Run:  node tests/fuzz.js        Exits 1 on any violation. */
"use strict";
const fs = require("fs");
const path = require("path");

// app/content.js is a browser IIFE that hangs its API off window.AM
const ROOT = path.join(__dirname, "..");
global.window = global;
global.AM = {};
new Function(fs.readFileSync(path.join(ROOT, "app/content.js"), "utf8")).call(global);
const C = global.AM.content;

const FAILURES = {};
function fail(rule, q, detail) {
  (FAILURES[rule] = FAILURES[rule] || []).push({ topic: q.topicKey, prompt: q.prompt, detail });
}

// A step a learner cannot follow. Sub-1 decimals like "16 / 40 = 0.4" are fine
// and teachable, so only long repeating tails count.
const ugly = (s) => /\d+\.\d{3,}/.test(s);
// A negative RESULT ("= -60"). A subtraction sign in "500 - 170" is not one.
const negative = (s) => /=\s*[-\u2212]\s?\d/.test(s);

const SEEDS = 4000;
let total = 0;

for (const topic of C.TOPICS) {
  for (let seed = 0; seed < SEEDS; seed++) {
    for (const q of C.buildSession(topic.key, 10, 1, seed)) {
      total++;

      // 1. the answer must be a number the keypad can type: no minus key exists
      if (!Number.isFinite(q.answer)) fail("answer is not finite", q, String(q.answer));
      else if (q.answer < 0) fail("answer is negative", q, String(q.answer));
      else if (Math.abs(q.answer * 100 - Math.round(q.answer * 100)) > 1e-9)
        fail("answer needs more than 2 decimal places", q, String(q.answer));

      // 2. the scaffold must be complete
      if (!q.hints || q.hints.length !== 3) fail("not exactly 3 hints", q, String(q.hints && q.hints.length));
      if (!q.steps || q.steps.length !== 3) fail("not exactly 3 steps", q, String(q.steps && q.steps.length));
      if (!q.explain || !q.missExplain) fail("missing explanation", q, "");

      // 3. no hint or step may show a number a learner cannot follow
      for (const s of [...(q.hints || []), ...(q.steps || [])]) {
        if (ugly(s)) fail("long repeating decimal in scaffold", q, s);
        if (negative(s)) fail("negative intermediate in scaffold", q, s);
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
      const given = q.type === "choice" ? q.answerIndex : String(q.answer);
      if (!C.isCorrect(q, given)) fail("own answer rejected by checker", q, String(given));
    }
  }
}

console.log(`fuzzed ${total.toLocaleString()} questions across ${C.TOPICS.length} topics, ${SEEDS} seeds each`);

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
