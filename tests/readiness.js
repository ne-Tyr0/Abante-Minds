/* Readiness tests: the estimate by topic and overall, and the weekly look back
   (app/readiness.js), and today's goal and the look back as the store keeps them.

   Run:  node tests/readiness.js        Exits 1 on any failure. */
"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const read = (f) => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
let storage = {};
const RealDate = Date;
let NOW = null;
global.Date = class extends RealDate {
  constructor(...a) { if (a.length) super(...a); else super(NOW === null ? RealDate.now() : NOW); }
  static now() { return NOW === null ? RealDate.now() : NOW; }
};
const onDay = (iso) => { NOW = new RealDate(iso + "T09:00:00").getTime(); };
const at = (iso) => new RealDate(iso + "T10:00:00").getTime();
global.window = global;
global.location = { hash: "", reload: () => {} };
global.addEventListener = () => {};
global.localStorage = {
  getItem: (k) => (k in storage ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};

const TOPICS = [{ key: "a", label: "A", icon: "star", colorKey: 1, ready: true, levels: [
  { id: "a1", title: "A one", competencies: ["C1"], hasLesson: false }, { id: "a2", title: "A two", competencies: ["C2"], hasLesson: false }] }];
function launch() {
  storage = {};
  NOW = null;
  global.AM = { content: { TOPICS: TOPICS, BASICS: [], facts: () => [], blueprintCompetencies: 2, examDate: "2027-01-30" } };
  new Function(read("app/readiness.js")).call(global);
  new Function(read("app/store.js")).call(global);
  return global.AM.store;
}
launch();
const R = global.AM.readiness;

let failed = 0;
function test(name, fn) {
  try { fn(); console.log("ok   " + name); }
  catch (e) { failed++; console.log("FAIL " + name + "\n       " + e.message.split("\n")[0]); }
}
const row = (topic, correct, o) => Object.assign({ at: 1000, kind: "practice", attempt: 1, topic: topic, correct: correct }, o || {});
const rows = (topic, right, wrong) => Array(wrong).fill(0).map(() => row(topic, false)).concat(Array(right).fill(0).map(() => row(topic, true)));
const T = (key, cleared, total, weight) => ({ key: key, label: key.toUpperCase(), cleared: cleared, total: total, weight: weight === undefined ? 1 : weight });
const scored = (log, t) => R.overall(log, [t]).topics[0];

/* ---------- a topic ---------- */
test("a topic scores its share cleared times its recent share right", () => {
  assert.strictEqual(scored(rows("a", 8, 2), T("a", 3, 6)).score, 0.4);
  assert.strictEqual(scored(rows("a", 10, 0), T("a", 6, 6)).score, 1);
});
test("with too little in the log, cleared levels are assumed fairly right", () => {
  assert.strictEqual(scored(rows("a", 4, 0), T("a", 2, 4)).score, 0.5 * R.UNSEEN);
  assert.strictEqual(scored(rows("a", 5, 0), T("a", 2, 4)).score, 0.5, "five first tries are enough to use");
});
test("only the latest first tries count, so old habits fade", () => {
  const log = rows("a", 0, 50).concat(rows("a", R.RECENT, 0));
  assert.strictEqual(scored(log, T("a", 2, 2)).score, 1);
  const worse = rows("a", 50, 0).concat(rows("a", 0, R.RECENT));
  assert.strictEqual(scored(worse, T("a", 2, 2)).score, 0);
});
test("retries, redos, reviews and challenges do not count; exams do", () => {
  const skipped = [row("a", false, { attempt: 2 }), row("a", false, { kind: "redo" }), row("a", false, { kind: "challenge" }), row("a", false, { kind: "facts" })];
  const log = rows("a", 5, 0).concat(Array(4).fill(skipped).reduce((x, y) => x.concat(y), []));
  assert.strictEqual(scored(log, T("a", 1, 1)).score, 1);
  assert.strictEqual(scored(rows("a", 5, 0).concat(Array(5).fill(row("a", false, { kind: "exam" }))), T("a", 1, 1)).score, 0.5);
});
test("another topic's answers do not count", () => {
  assert.strictEqual(scored(rows("b", 0, 10), T("a", 1, 1)).score, R.UNSEEN);
});
test("each topic has a band", () => {
  assert.strictEqual(scored([], T("a", 0, 4)).band, "Not started");
  assert.strictEqual(scored(rows("a", 1, 0), T("a", 0, 4)).band, "Getting started");
  assert.strictEqual(scored(rows("a", 10, 0), T("a", 1, 4)).band, "Getting started");
  assert.strictEqual(scored(rows("a", 10, 0), T("a", 7, 20)).band, "Building", "exactly the line");
  assert.strictEqual(scored(rows("a", 10, 0), T("a", 7, 10)).band, "Strong", "exactly the line");
  assert.strictEqual(scored(rows("a", 10, 0), T("a", 6, 10)).band, "Building");
});

/* ---------- the whole ---------- */
test("the whole is by each topic's weight, rounded down to a step", () => {
  const all = (a, b) => R.overall(rows("a", 10, 0).concat(rows("b", 10, 0)), [T("a", a, 1, 3), T("b", b, 1, 1)]);
  assert.strictEqual(all(1, 0).percent, 75);
  assert.strictEqual(all(0, 1).percent, 25);
  const part = R.overall(rows("a", 10, 0), [T("a", 37, 100)]);
  assert.strictEqual(part.percent, 35, "never rounds up to look better");
  assert.strictEqual(part.share, 0.37, "while the bar moves with every level");
  assert.strictEqual(R.overall(rows("a", 10, 0), [T("a", 2, 2)]).percent, 100);
});
test("a topic with no weight or no levels is left out", () => {
  const r = R.overall(rows("a", 10, 0), [T("a", 1, 1, 1), T("b", 0, 1, 0), T("c", 0, 0, 1)]);
  assert.deepStrictEqual(r.topics.map((t) => t.key), ["a"]);
  assert.strictEqual(r.percent, 100);
  assert.strictEqual(R.overall([], []).percent, 0);
  assert.strictEqual(R.overall([], []).focus, null);
});
test("it measures whatever list it is given, so a narrower section can use its own", () => {
  const log = rows("a", 10, 0).concat(rows("b", 0, 10));
  assert.strictEqual(R.overall(log, [T("a", 1, 1)]).percent, 100);
  assert.strictEqual(R.overall(log, [T("a", 1, 1), T("b", 1, 1)]).percent, 50);
});
test("the most to gain is the most weight still unlearned", () => {
  const focus = (list, log) => R.overall(log || [], list).focus.key;
  assert.strictEqual(focus([T("a", 0, 1, 1), T("b", 0, 1, 3)]), "b", "the heavier of two untouched");
  assert.strictEqual(focus([T("a", 1, 1, 3), T("b", 0, 1, 1)], rows("a", 10, 0)), "b", "a finished topic has nothing left");
  assert.strictEqual(R.overall(rows("a", 10, 0), [T("a", 1, 1)]).focus, null, "and with all finished there is none");
});
test("started means a level cleared or a few first tries", () => {
  assert.strictEqual(R.overall([], [T("a", 0, 1)]).started, false);
  assert.strictEqual(R.overall(rows("a", 4, 0), [T("a", 0, 1)]).started, false);
  assert.strictEqual(R.overall(rows("a", 5, 0), [T("a", 0, 1)]).started, true);
  assert.strictEqual(R.overall([], [T("a", 1, 2)]).started, true);
});

/* ---------- a week ---------- */
test("a week counts its days, its first tries and its strongest topic", () => {
  const from = at("2026-10-19") - 36000000, to = from + 7 * 86400000;
  const log = [
    row("a", true, { at: at("2026-10-18") }),                     /* the Sunday before */
    row("a", true, { at: at("2026-10-19") }), row("a", false, { at: at("2026-10-19"), attempt: 2 }),
    row("a", false, { at: at("2026-10-21") }),
    row("a", true, { at: at("2026-10-25") }),
    row("a", true, { at: at("2026-10-26") })                      /* the Monday after */
  ];
  const w = R.week(log, from, to);
  assert.deepStrictEqual([w.days, w.asked, w.right], [3, 3, 2]);
  assert.strictEqual(w.best, null, "too few to call a topic strongest");
  assert.strictEqual(R.week(log, to + 7 * 86400000, to + 14 * 86400000), null, "nothing that week");
});
test("the strongest topic needs enough first tries, and is the best share", () => {
  const log = rows("a", 4, 1).concat(rows("b", 5, 0)).concat(rows("c", 3, 0));
  assert.strictEqual(R.week(log, 0, 5000).best, "b");
  const facts = rows("b", 5, 0).map((r) => Object.assign(r, { kind: "facts" }));
  assert.strictEqual(R.week(facts, 0, 5000).best, null, "facts are not a topic on the path");
  assert.strictEqual(R.week(facts, 0, 5000).asked, 5, "but they are questions answered");
});

/* ---------- today's goal ---------- */
test("today's goal is one round, and a new day starts again", () => {
  const S = launch();
  onDay("2026-10-20");
  assert.deepStrictEqual(S.dailyGoal(), { target: 1, done: 0, met: false });
  assert.strictEqual(S.recordRound(), true, "the round that meets it says so");
  assert.deepStrictEqual(S.dailyGoal(), { target: 1, done: 1, met: true });
  assert.strictEqual(S.recordRound(), false, "and only that one");
  assert.strictEqual(S.dailyGoal().done, 2);
  onDay("2026-10-21");
  assert.deepStrictEqual(S.dailyGoal(), { target: 1, done: 0, met: false });
  assert.strictEqual(S.recordRound(), true);
  assert.strictEqual(S.dailyGoal().done, 1, "yesterday's rounds are not added on");
});

/* ---------- the look back ---------- */
test("last week is offered from the week after, until it is put away", () => {
  const S = launch();
  onDay("2026-10-20");                       /* a Tuesday */
  S.logAttempt({ kind: "practice", attempt: 1, topic: "a", correct: true });
  assert.strictEqual(S.recap(), null, "this week is not over");
  onDay("2026-10-26");                       /* the Monday after */
  assert.deepStrictEqual([S.recap().days, S.recap().asked, S.recap().right], [1, 1, 1]);
  S.dismissRecap();
  assert.strictEqual(S.recap(), null);
  assert.strictEqual(JSON.parse(storage["abante-minds/v1"]).recapSeen, "2026-10-26", "and it stays put away after a reload");
  onDay("2026-11-02");
  assert.strictEqual(S.recap(), null, "the week after, with nothing in it, offers nothing");
});
test("it counts the levels cleared that week, not before or after", () => {
  const S = launch();
  onDay("2026-10-12");
  for (let i = 0; i < 8; i++) S.recordAnswer("a", "a1", true, true);
  S.logAttempt({ kind: "practice", attempt: 1, topic: "a", correct: true });
  onDay("2026-10-20");
  for (let i = 0; i < 8; i++) S.recordAnswer("a", "a2", true, true);
  S.logAttempt({ kind: "practice", attempt: 1, topic: "a", correct: true });
  onDay("2026-10-27");
  assert.strictEqual(S.recap().levels, 1);
  onDay("2026-10-20");
  assert.strictEqual(S.recap().levels, 1, "and the week before had its own");
});

test("a badge counted when badges first arrived was not cleared that week", () => {
  const S = launch();
  onDay("2026-10-20");
  S.logAttempt({ kind: "practice", attempt: 1, topic: "a", correct: true });
  S.set({ badges: { "lv:a/a1": { at: "2026-10-20", before: true }, "lv:a/a2": { at: "2026-10-21" } } });
  onDay("2026-10-27");
  assert.strictEqual(S.recap().levels, 1);
});

console.log(failed ? `\n${failed} failed` : "\nok: readiness and the look back behave as specified");
process.exit(failed ? 1 : 0);
