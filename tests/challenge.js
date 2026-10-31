/* Challenge round tests: the scoring and the ladder (app/challenge.js), which
   questions a round may ask (app/content.js), and what a round keeps and never
   moves (app/store.js), all run together against the real question packs.

   Run:  node tests/challenge.js        Exits 1 on any failure. */
"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const ROOT = path.join(__dirname, "..");
const PACK = path.join(ROOT, "content", "packs", "math");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const pack = (f) => JSON.parse(fs.readFileSync(path.join(PACK, f), "utf8"));

let storage = {};
const RealDate = Date;
let NOW = null;
global.Date = class extends RealDate {
  constructor(...a) { if (a.length) super(...a); else super(NOW === null ? RealDate.now() : NOW); }
  static now() { return NOW === null ? RealDate.now() : NOW; }
};
const onDay = (iso) => { NOW = new RealDate(iso + "T09:00:00").getTime(); };
global.window = global;
global.location = { hash: "", reload: () => {} };
global.addEventListener = () => {};
global.localStorage = {
  getItem: (k) => (k in storage ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};

global.AM = {};
new Function(read("app/content.js")).call(global);
new Function(read("app/challenge.js")).call(global);
new Function(read("app/readiness.js")).call(global);
const manifest = pack("manifest.json");
global.AM.content.use(manifest, manifest.topics.map((t) => pack(t.file)), manifest.basics.map((t) => pack(t.file)));
const C = global.AM.content;
const G = global.AM.challenge;

/* A fresh store over nothing, as on a new phone. */
function launch() {
  storage = {};
  NOW = null;
  delete global.AM.store;
  new Function(read("app/store.js")).call(global);
  return global.AM.store;
}

let failed = 0;
function test(name, fn) {
  try { fn(); console.log("ok   " + name); }
  catch (e) { failed++; console.log("FAIL " + name + "\n       " + e.message.split("\n")[0]); }
}
const play = (g, answers) => { answers.forEach((a) => G.answer(g, a)); return g; };
const rights = (n) => Array(n).fill(true);
const sprint = () => G.start("sprint", 1, false, 0);
const ladder = () => G.start("ladder", 1, false, 0);
/* Clear a level the way a learner does: right answers until it clears. */
function clear(S, topic, level) {
  for (let i = 0; i < 8; i++) S.recordAnswer(topic, level, true, true);
  assert.ok(S.levelState(topic, level).cleared, "the level should have cleared");
}

/* ---------- the rules ---------- */
test("a sprint lasts 60 seconds and a ladder 90", () => {
  assert.strictEqual(G.start("sprint", 1, false, 1000).endsAt, 61000);
  assert.strictEqual(G.start("ladder", 1, false, 1000).endsAt, 91000);
});
test("five in a row doubles the points and ten triples them", () => {
  assert.deepStrictEqual([0, 4, 5, 9, 10, 25].map(G.multiplier), [1, 1, 2, 2, 3, 3]);
});
test("a sprint scores 10 a right answer, and the fifth in a row is the first doubled", () => {
  assert.strictEqual(play(sprint(), rights(4)).score, 40);
  assert.strictEqual(play(sprint(), rights(5)).score, 60);
  assert.strictEqual(play(sprint(), rights(10)).score, 40 + 5 * 20 + 30);
});
test("a miss scores nothing and ends the run, not the round", () => {
  const g = play(sprint(), [true, true, true, false]);
  assert.strictEqual(g.score, 30);
  assert.strictEqual(g.run, 0);
  assert.strictEqual(g.bestRun, 3);
  assert.strictEqual(g.wrong, 1);
  assert.strictEqual(g.right, 3);
  G.answer(g, true);
  assert.strictEqual(g.bestRun, 3, "a shorter run after a miss leaves the best alone");
  assert.strictEqual(play(g, rights(4)).score, 30 + 40 + 20, "a broken run starts doubling from scratch");
  assert.strictEqual(g.bestRun, 5);
});
test("the multiplier is marked as rising only on the answer that raises it", () => {
  const g = play(sprint(), rights(4));
  assert.strictEqual(g.rose, false);
  assert.strictEqual(G.answer(g, true).rose, true, "x2 at five");
  assert.strictEqual(G.answer(g, true).rose, false);
  play(g, rights(3));
  assert.strictEqual(G.answer(g, true).rose, true, "x3 at ten");
  assert.strictEqual(G.answer(g, false).rose, false);
});
test("a sprint's numbers get bigger after eight right, and never go back", () => {
  const g = play(sprint(), rights(7));
  assert.strictEqual(G.tier(g), 1);
  G.answer(g, true);
  assert.strictEqual(G.tier(g), 2);
  G.answer(g, false);
  assert.strictEqual(G.tier(g), 2);
});
test("three right in a row climbs the ladder, to step 3 at most", () => {
  const g = ladder();
  assert.strictEqual(G.tier(g), 1);
  play(g, rights(2));
  assert.strictEqual(g.step, 1);
  G.answer(g, true);
  assert.strictEqual(g.step, 2);
  play(g, rights(3));
  assert.strictEqual(g.step, 3);
  assert.strictEqual(G.tier(g), 3);
  play(g, rights(9));
  assert.strictEqual(g.step, 3);
  assert.strictEqual(g.top, 3);
});
test("a miss steps the ladder back one and restarts the climb, never below step 1", () => {
  const g = play(ladder(), rights(3));
  assert.strictEqual(G.answer(g, false).step, 1);
  assert.strictEqual(G.answer(g, false).step, 1);
  play(g, rights(2));
  G.answer(g, false);
  play(g, rights(2));
  assert.strictEqual(g.step, 1, "two, a miss, then two more is not three in a row");
  assert.strictEqual(g.top, 2, "the top step reached stays reached");
});
test("the ladder scores at the step a question was asked, before it climbs", () => {
  /* 10, 10, 10 at step 1; then 20, and the fifth is doubled at step 2. */
  assert.strictEqual(play(ladder(), rights(3)).score, 30);
  assert.strictEqual(play(ladder(), rights(4)).score, 50);
  assert.strictEqual(play(ladder(), rights(5)).score, 50 + 40);
});
test("the clock counts whole seconds, and is low for the last ten", () => {
  const g = G.start("sprint", 1, false, 0);
  assert.strictEqual(G.secondsLeft(g, 0), 60);
  assert.strictEqual(G.secondsLeft(g, 100), 60);
  assert.strictEqual(G.secondsLeft(g, 59001), 1);
  assert.strictEqual(G.secondsLeft(g, 70000), 0);
  assert.strictEqual(G.shareLeft(g, 30000), 0.5);
  assert.strictEqual(G.shareLeft(g, 70000), 0);
  assert.strictEqual(G.isLow(g, 50000), false);
  assert.strictEqual(G.isLow(g, 50001), true);
});
test("today's seed holds all day, and differs by day and by mode", () => {
  assert.strictEqual(G.dailySeed("2026-10-30", "sprint"), G.dailySeed("2026-10-30", "sprint"));
  assert.notStrictEqual(G.dailySeed("2026-10-30", "sprint"), G.dailySeed("2026-10-31", "sprint"));
  assert.notStrictEqual(G.dailySeed("2026-10-30", "sprint"), G.dailySeed("2026-10-30", "ladder"));
});

/* ---------- the questions ---------- */
const POOL = [{ topic: "decimals", level: "add-and-subtract" }, { topic: "gemdas", level: C.TOPICS.find((t) => t.key === "gemdas").levels[0].id }];
const draw = (o, n) => {
  const out = [];
  let avoid = null;
  for (let i = 0; i < n; i++) {
    const q = C.challengeQuestion(Object.assign({ pool: POOL, tier: 1, seed: 42, index: i, avoid: avoid }, o));
    avoid = q.templateId;
    out.push(q);
  }
  return out;
};
test("a round asks only from its pool, at the tier it is given", () => {
  [1, 2, 3].forEach((tier) => draw({ tier: tier }, 60).forEach((q) => {
    assert.strictEqual(q.tier, tier);
    assert.ok(POOL.some((e) => e.topic === q.topicKey && e.level === q.levelId), q.topicKey + "/" + q.levelId);
  }));
});
test("a question is short, with no graph or picture, wherever the pool has one", () => {
  draw({}, 200).forEach((q) => {
    assert.ok(C.isQuick(q), q.prompt);
    assert.ok(q.prompt.length <= C.QUICK_PROMPT);
    assert.ok(!q.chart && !q.choiceFigures);
  });
});
test("every level gives a question, and enough of them give short ones to fill a round", () => {
  let short = 0;
  C.TOPICS.forEach((t) => t.levels.forEach((lv) => {
    const q = C.challengeQuestion({ pool: [{ topic: t.key, level: lv.id }], tier: 2, seed: 9, index: 0 });
    assert.strictEqual(q.topicKey, t.key);
    assert.ok(q.prompt.length > 0);
    if (C.isQuick(q)) short++;
  }));
  assert.ok(short >= 20, short + " path levels have short questions");
});
test("in a mix, a level with nothing short gives way to one that has", () => {
  const long = C.TOPICS.find((t) => t.key === "area").levels[0].id;
  const mixed = [{ topic: "area", level: long }, POOL[0]];
  for (let i = 0; i < 60; i++) {
    assert.strictEqual(C.challengeQuestion({ pool: mixed, tier: 1, seed: 8, index: i }).topicKey, POOL[0].topic);
  }
  assert.strictEqual(C.challengeQuestion({ pool: [mixed[0]], tier: 1, seed: 8, index: 0 }).topicKey, "area", "alone, it still gives a question");
});
test("a graph or a picture is never short, however few words go with it", () => {
  assert.strictEqual(C.isQuick({ prompt: "Read it." }), true);
  assert.strictEqual(C.isQuick({ prompt: "Read it.", chart: {} }), false);
  assert.strictEqual(C.isQuick({ prompt: "Pick one.", choiceFigures: [] }), false);
  assert.strictEqual(C.isQuick({ prompt: "x".repeat(C.QUICK_PROMPT) }), true);
  assert.strictEqual(C.isQuick({ prompt: "x".repeat(C.QUICK_PROMPT + 1) }), false);
});
test("each place in a round draws its own question, without being told what came before", () => {
  const prompts = new Set();
  for (let i = 0; i < 20; i++) prompts.add(C.challengeQuestion({ pool: POOL, tier: 1, seed: 42, index: i }).prompt);
  assert.ok(prompts.size > 10, prompts.size + " different questions in 20");
});
test("a level with nothing short still avoids a graph whenever it can", () => {
  const data = C.TOPICS.find((t) => t.key === "data");
  data.levels.forEach((lv) => {
    const asked = [];
    for (let i = 0; i < 30; i++) asked.push(C.challengeQuestion({ pool: [{ topic: "data", level: lv.id }], tier: 1, seed: 5, index: i }));
    const seen = new Set();
    for (let i = 0; i < 300; i++) {
      const q = C.challengeQuestion({ pool: [{ topic: "data", level: lv.id }], tier: 1, seed: 5 + i, index: 0 });
      seen.add(!!q.chart);
    }
    if (seen.has(false)) assert.ok(asked.filter((q) => !q.chart).length > asked.length / 2, lv.id);
  });
});
test("the same seed and tier give the same question, and another seed another", () => {
  const key = (qs) => qs.map((q) => q.templateId + ":" + q.seed + ":" + q.prompt).join("|");
  assert.strictEqual(key(draw({}, 20)), key(draw({}, 20)));
  assert.notStrictEqual(key(draw({}, 20)), key(draw({ seed: 43 }, 20)));
});
test("the same kind of question does not come twice in a row when there is another", () => {
  const qs = draw({}, 100);
  qs.slice(1).forEach((q, i) => assert.notStrictEqual(q.templateId, qs[i].templateId));
});
test("its own right answer is right, so a round can be scored", () => {
  draw({ tier: 2 }, 80).forEach((q) => {
    const given = q.type === "choice" ? q.answerIndex : q.answerText;
    assert.ok(C.isCorrect(q, given), q.prompt + " -> " + given);
  });
});
test("a question can be rebuilt from its log row", () => {
  draw({ tier: 3 }, 30).forEach((q) => {
    const again = C.rebuild({ template: q.templateId, topic: q.topicKey, tier: q.tier, seed: q.seed, pinnedAt: null });
    assert.strictEqual(again.prompt, q.prompt);
  });
});
test("a facts level asks only the facts it is given, and only at the lowest tier", () => {
  const level = C.BASICS.find((t) => t.key === "times").levels[0].id;
  const facts = C.facts("times", level).slice(0, 2);
  const entry = { topic: "times", level: level, facts: facts };
  for (let i = 0; i < 30; i++) {
    const q = C.challengeQuestion({ pool: [entry], tier: 1, seed: 3, index: i });
    assert.ok(facts.indexOf(q.factKey) > -1, q.factKey);
  }
  const mixed = [entry, POOL[0]];
  for (let i = 0; i < 40; i++) {
    assert.strictEqual(C.challengeQuestion({ pool: mixed, tier: 2, seed: 3, index: i }).factKey, undefined);
  }
  const low = [];
  for (let i = 0; i < 40; i++) low.push(C.challengeQuestion({ pool: mixed, tier: 1, seed: 3, index: i }));
  assert.ok(low.some((q) => q.factKey), "facts do come up at tier 1");
  assert.ok(C.challengeQuestion({ pool: [entry], tier: 3, seed: 3, index: 0 }).factKey, "facts alone still give a question");
});

/* ---------- what a round keeps ---------- */
const result = (o) => Object.assign({ score: 100, right: 8, wrong: 2, bestRun: 4, top: 1 }, o);

test("nothing is open until a level is cleared, and then that level is", () => {
  const S = launch();
  assert.deepStrictEqual(S.challengePool(), []);
  clear(S, "decimals", "add-and-subtract");
  assert.deepStrictEqual(S.challengePool(), [{ topic: "decimals", level: "add-and-subtract" }]);
});
test("Basics count: a cleared practice level, and only the mastered facts of a facts level", () => {
  const S = launch();
  const T = C.BASICS.find((t) => t.levels.some((lv) => lv.kind === "facts"));
  const lv = T.levels.find((x) => x.kind === "facts");
  const [one, two] = C.facts(T.key, lv.id);
  onDay("2026-10-29"); S.recordFact(one, true, true);
  assert.deepStrictEqual(S.challengePool(), [], "not mastered yet");
  onDay("2026-10-30"); S.recordFact(one, true, true); S.recordFact(two, true, false);
  assert.ok(S.factState(one).mastered);
  assert.deepStrictEqual(S.challengePool(), [{ topic: T.key, level: lv.id, facts: [one] }]);
  const P = C.BASICS.find((t) => t.levels.some((x) => x.kind === "practice"));
  const plv = P.levels.find((x) => x.kind === "practice");
  clear(S, P.key, plv.id);
  assert.ok(S.challengePool().some((e) => e.level === plv.id && !e.facts));
  const reviews = C.BASICS.reduce((all, t) => all.concat(t.levels.filter((x) => x.kind === "review").map((x) => t.key + "/" + x.id)), []);
  assert.ok(!S.challengePool().some((e) => reviews.indexOf(e.topic + "/" + e.level) > -1), "a review level is not a level of its own");
});
test("a level not yet cleared is not in the pool", () => {
  const S = launch();
  for (let i = 0; i < 7; i++) S.recordAnswer("decimals", "add-and-subtract", true, true);
  assert.deepStrictEqual(S.challengePool(), []);
});
test("the first score is a best, a higher one beats it, and a lower or equal one does not", () => {
  const S = launch();
  assert.strictEqual(S.challengeStats("sprint").best, null);
  const first = S.recordChallenge("sprint", result({ score: 100 }), false);
  assert.strictEqual(first.better, true);
  assert.strictEqual(first.previous, null);
  assert.strictEqual(S.recordChallenge("sprint", result({ score: 100 }), false).better, false);
  assert.strictEqual(S.recordChallenge("sprint", result({ score: 90 }), false).better, false);
  assert.strictEqual(S.challengeStats("sprint").best.score, 100);
  const fourth = S.recordChallenge("sprint", result({ score: 110 }), false);
  assert.strictEqual(fourth.better, true);
  assert.strictEqual(fourth.previous.score, 100);
  assert.strictEqual(S.challengeStats("sprint").best.score, 110);
  assert.strictEqual(S.challengeStats("sprint").played, 4);
});
test("a round with no points is no record, and each mode keeps its own", () => {
  const S = launch();
  assert.strictEqual(S.recordChallenge("sprint", result({ score: 0, right: 0, wrong: 3 }), false).better, false);
  assert.strictEqual(S.challengeStats("sprint").best, null);
  S.recordChallenge("sprint", result({ score: 50 }), false);
  assert.strictEqual(S.challengeStats("ladder").best, null);
  assert.strictEqual(S.recordChallenge("ladder", result({ score: 10 }), false).better, true);
  assert.strictEqual(S.challengeStats("sprint").best.score, 50);
});
test("today's challenge is one play per mode a day, and it can set the best", () => {
  const S = launch();
  onDay("2026-10-30");
  assert.strictEqual(S.challengeDaily("sprint"), null);
  S.recordChallenge("sprint", result({ score: 70 }), true);
  assert.strictEqual(S.challengeDaily("sprint").score, 70);
  assert.strictEqual(S.challengeDaily("ladder"), null, "the other mode is still open");
  assert.strictEqual(S.challengeStats("sprint").best.score, 70);
  S.recordChallenge("sprint", result({ score: 90 }), false);
  assert.strictEqual(S.challengeDaily("sprint").score, 70, "a normal round is not today's challenge");
  S.recordChallenge("ladder", result({ score: 20 }), true);
  assert.strictEqual(S.challengeDaily("sprint").score, 70, "playing one mode keeps the other's");
  onDay("2026-10-31");
  assert.strictEqual(S.challengeDaily("sprint"), null, "a new day opens it again");
});
test("a round with nothing answered does not use up today's play", () => {
  const S = launch();
  onDay("2026-10-30");
  S.recordChallenge("sprint", result({ score: 0, right: 0, wrong: 0 }), true);
  assert.strictEqual(S.challengeDaily("sprint"), null);
  S.recordChallenge("sprint", result({ score: 0, right: 0, wrong: 1 }), true);
  assert.strictEqual(S.challengeDaily("sprint").wrong, 1, "a round of misses does");
});
test("a sprint's badges come at 8, 15 and 25 right, and no sooner", () => {
  const S = launch();
  const has = (k) => !!S.catalog().specials.find((x) => x.key === k).earned;
  S.recordChallenge("sprint", result({ right: 7 }), false);
  assert.ok(!has("challenge:sprint:8"));
  S.recordChallenge("sprint", result({ right: 8 }), false);
  assert.ok(has("challenge:sprint:8"));
  assert.ok(!has("challenge:sprint:15"));
  S.recordChallenge("sprint", result({ right: 24 }), false);
  assert.ok(has("challenge:sprint:15"));
  assert.ok(!has("challenge:sprint:25"));
  S.recordChallenge("sprint", result({ right: 25 }), false);
  assert.ok(has("challenge:sprint:25"));
  assert.ok(!has("challenge:ladder:2"), "a sprint earns no ladder badge");
});
test("a ladder's badges come at step 2, step 3 and 600 points, and no sooner", () => {
  const S = launch();
  const has = (k) => !!S.catalog().specials.find((x) => x.key === k).earned;
  S.recordChallenge("ladder", result({ top: 1, score: 599, right: 40 }), false);
  ["challenge:ladder:2", "challenge:ladder:3", "challenge:ladder:600", "challenge:sprint:8"].forEach((k) => assert.ok(!has(k), k));
  S.recordChallenge("ladder", result({ top: 2 }), false);
  assert.ok(has("challenge:ladder:2"));
  assert.ok(!has("challenge:ladder:3"));
  S.recordChallenge("ladder", result({ top: 3 }), false);
  assert.ok(has("challenge:ladder:3"));
  assert.ok(!has("challenge:ladder:600"));
  S.recordChallenge("ladder", result({ score: 600 }), false);
  assert.ok(has("challenge:ladder:600"));
});
test("a round counts as practice for the streak only if something was answered", () => {
  const S = launch();
  onDay("2026-10-30");
  S.recordChallenge("sprint", result({ score: 0, right: 0, wrong: 0 }), false);
  assert.strictEqual(S.get().streakDays, 0);
  S.recordChallenge("sprint", result({ score: 0, right: 0, wrong: 1 }), false);
  assert.strictEqual(S.get().streakDays, 1);
});
test("a round never moves the path, Basics or review", () => {
  const S = launch();
  clear(S, "decimals", "add-and-subtract");
  const snap = () => JSON.stringify({ l: S.levelState("decimals", "add-and-subtract"), t: S.get().totalCorrect, r: S.reviewDue() });
  const before = snap();
  S.recordChallenge("sprint", result({ score: 500, right: 40 }), false);
  assert.strictEqual(snap(), before);
});
test("readiness reaches the real path: its weights, and a cleared level moves it", () => {
  const S = launch();
  assert.ok(C.TOPICS.every((t) => t.weight > 0), "every topic carries its weight");
  const before = S.readiness();
  assert.strictEqual(before.percent, 0);
  assert.strictEqual(before.started, false);
  assert.strictEqual(before.topics.length, C.TOPICS.length);
  clear(S, "decimals", "add-and-subtract");
  const after = S.readiness();
  assert.strictEqual(after.started, true);
  assert.strictEqual(after.topics.find((t) => t.key === "decimals").band, "Getting started");
  assert.ok(after.focus, "and it names where there is most to gain");
});
test("a saved record survives a reload", () => {
  const S = launch();
  S.recordChallenge("ladder", result({ score: 240 }), false);
  delete global.AM.store;
  new Function(read("app/store.js")).call(global);
  assert.strictEqual(global.AM.store.challengeStats("ladder").best.score, 240);
});

console.log(failed ? `\n${failed} failed` : "\nok: the challenge round behaves as specified");
process.exit(failed ? 1 : 0);
