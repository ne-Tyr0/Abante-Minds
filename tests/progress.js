/* Progress tests: the path's rules, as the store keeps them. Levels clear on
   answers right the first time, retries and redos never count, clearing a
   level opens the next, and an old (version 1) record keeps the learner and
   the streak but not the tier progress the path replaced. Basics facts are
   mastered on two days, lost on a miss, and never move the path.

   Run:  node tests/progress.js        Exits 1 on any failure. */
"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const SRC = fs.readFileSync(path.join(__dirname, "..", "app/store.js"), "utf8");
const KEY = "abante-minds/v1";

/* A browser the store can run in: storage, connectivity, a location, and a
   clock the tests can move to another day. */
let storage = {};
const RealDate = Date;
let NOW = null;
global.Date = class extends RealDate {
  constructor(...a) { if (a.length) super(...a); else super(NOW === null ? RealDate.now() : NOW); }
  static now() { return NOW === null ? RealDate.now() : NOW; }
};
const onDay = (iso) => { NOW = new RealDate(iso + "T09:00:00").getTime(); };
global.window = global;
global.location = { hash: "" };
global.addEventListener = () => {};
global.localStorage = {
  getItem: (k) => (k in storage ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};

const TOPICS = [
  { key: "a", label: "A", icon: "star", colorKey: 1, ready: true, levels: [
    { id: "a1", title: "A one", competencies: ["C1", "C2"], hasLesson: true },
    { id: "a2", title: "A two", competencies: ["C3"], hasLesson: true }] },
  { key: "b", label: "B", icon: "star", colorKey: 2, ready: false, levels: [] },
  { key: "c", label: "C", icon: "star", colorKey: 3, ready: true, levels: [
    { id: "c1", title: "C one", competencies: ["C4", "C1"], hasLesson: false }] }
];

const BASICS = [
  { key: "b", label: "B", icon: "star", colorKey: 4, ready: true, track: "basics", grid: true, levels: [
    { id: "f1", title: "F one", kind: "facts", competencies: [], hasLesson: true, factCount: 3 },
    { id: "p1", title: "P one", kind: "practice", competencies: [], hasLesson: false, factCount: 0 },
    { id: "all", title: "All", kind: "review", competencies: [], hasLesson: false, factCount: 3 }] }
];
const FACT_KEYS = ["k1", "k2", "k3"];
const facts = (topic, level) => (topic === "b" && (level === "f1" || level === "all") ? FACT_KEYS.slice() : []);

/* A fresh store over whatever is in storage, as on app launch. */
function launch(saved) {
  storage = saved === undefined ? {} : { [KEY]: JSON.stringify(saved) };
  NOW = null;
  global.AM = { content: { TOPICS: TOPICS, BASICS: BASICS, facts: facts, blueprintCompetencies: 8, examDate: "2027-01-30" } };
  new Function(SRC).call(global);
  return global.AM.store;
}

let failed = 0;
function test(name, fn) {
  try { fn(); console.log("ok   " + name); }
  catch (e) { failed++; console.log("FAIL " + name + "\n       " + e.message.split("\n")[0]); }
}
const times = (n, fn) => { const out = []; for (let i = 0; i < n; i++) out.push(fn(i)); return out; };

test("a new learner starts with nothing", () => {
  const S = launch();
  const s = S.get();
  assert.strictEqual(s.version, 2);
  assert.deepStrictEqual(s.levels, {});
  assert.strictEqual(S.hasProgress(), false);
  assert.strictEqual(S.CLEAR_TARGET, 8);
});
test("a version 1 record keeps the learner and streak, and drops tier progress", () => {
  const S = launch({
    version: 1, installed: true, installCardDismissed: true, signedIn: true, profile: { name: "Ligaya" },
    tier: 3, tierProgress: 12, demoted: true, recoveryRun: 2, topics: { money: 18 }, lastTopic: "money",
    streakDays: 5, week: [true, true, false, false, false, false, false], totalCorrect: 40,
    lastSession: { topicLabel: "Change and money", correct: 7, attempted: 10 }
  });
  const s = S.get();
  assert.strictEqual(s.version, 2);
  assert.deepStrictEqual([s.installed, s.installCardDismissed, s.signedIn, s.profile.name], [true, true, true, "Ligaya"]);
  assert.deepStrictEqual([s.totalCorrect, s.lastSession, s.levels], [0, null, {}]);
  for (const gone of ["tier", "tierProgress", "demoted", "recoveryRun", "topics", "lastTopic"]) assert.ok(!(gone in s), gone);
  assert.strictEqual(JSON.parse(storage[KEY]).version, 2, "the migrated record is saved at once");
});
test("a version 2 record is read back as it was", () => {
  const S = launch();
  S.recordAnswer("a", "a1", true, true);
  const saved = JSON.parse(storage[KEY]);
  const T = launch(saved);
  assert.deepStrictEqual(T.levelState("a", "a1"), { correct: 1, attempts: 1, cleared: false, lessonSeen: false });
});
test("only a first try moves a level", () => {
  const S = launch();
  S.recordAnswer("a", "a1", false, true);
  S.recordAnswer("a", "a1", true, false);
  S.recordAnswer("a", "a1", true, true);
  assert.deepStrictEqual(S.levelState("a", "a1"), { correct: 1, attempts: 2, cleared: false, lessonSeen: false });
  assert.strictEqual(S.get().totalCorrect, 1);
  assert.deepStrictEqual(S.get().lastLevel, { topic: "a", level: "a1" });
});
test("eight right first time clears a level, once, and opens the next", () => {
  const S = launch();
  const cleared = times(9, () => S.recordAnswer("a", "a1", true, true).cleared);
  assert.deepStrictEqual(cleared, [false, false, false, false, false, false, false, true, false]);
  const t = S.topicPath("a");
  assert.deepStrictEqual(t.levels.map((l) => [l.cleared, l.unlocked]), [[true, true], [false, true]]);
  assert.strictEqual(t.current.id, "a2");
  assert.strictEqual(t.levels[0].correct, 8, "shown progress stops at the target");
});
test("a later level stays locked until the one before is cleared", () => {
  const S = launch();
  times(7, () => S.recordAnswer("a", "a1", true, true));
  assert.deepStrictEqual(S.topicPath("a").levels.map((l) => l.unlocked), [true, false]);
});
test("the numbers get harder as a level fills", () => {
  const S = launch();
  const tiers = times(9, () => { const t = S.tierFor("a", "a1"); S.recordAnswer("a", "a1", true, true); return t; });
  assert.deepStrictEqual(tiers, [1, 1, 1, 2, 2, 2, 3, 3, 4]);
});
test("redoing missed questions keeps the streak and leaves the level alone", () => {
  const S = launch();
  S.notePractice();
  assert.deepStrictEqual(S.get().levels, {});
  assert.strictEqual(S.get().streakDays, 1);
});
test("a lesson is marked seen", () => {
  const S = launch();
  S.markLessonSeen("a", "a2");
  assert.strictEqual(S.levelState("a", "a2").lessonSeen, true);
  assert.strictEqual(S.topicPath("a").levels[1].lessonSeen, true);
});
test("the path: levels cleared, the blueprint covered, what is next", () => {
  const S = launch();
  let p = S.path();
  assert.deepStrictEqual([p.levelsCleared, p.levelsTotal, p.coverage, p.next.level.id], [0, 3, 0, "a1"]);
  assert.strictEqual(p.daysToExam > 0, true);
  assert.deepStrictEqual(p.topics.map((t) => t.ready), [true, false, true]);
  times(8, () => S.recordAnswer("a", "a1", true, true));
  p = S.path();
  assert.deepStrictEqual([p.levelsCleared, p.coverage, p.next.level.id], [1, 2 / 8, "a2"]);
  times(8, () => S.recordAnswer("a", "a2", true, true));
  p = S.path();
  assert.deepStrictEqual([p.levelsCleared, p.coverage, p.next.topic.key, p.next.level.id], [2, 3 / 8, "c", "c1"],
    "a finished topic hands on to the next open level, skipping one not yet written");
  times(8, () => S.recordAnswer("c", "c1", true, true));
  p = S.path();
  assert.deepStrictEqual([p.levelsCleared, p.coverage, p.next], [3, 4 / 8, null], "a competency counts once");
});
test("next is the level last practised while it is still open", () => {
  const S = launch();
  S.recordAnswer("c", "c1", true, true);
  assert.strictEqual(S.path().next.level.id, "c1");
});
test("badges", () => {
  const S = launch();
  const earned = () => S.badges().filter((b) => b.earned).map((b) => b.key);
  assert.deepStrictEqual(earned(), []);
  times(8, () => S.recordAnswer("a", "a1", true, true));
  assert.deepStrictEqual(earned(), ["level"]);
  times(8, () => S.recordAnswer("a", "a2", true, true));
  assert.deepStrictEqual(earned(), ["level", "topic"]);
  times(8, () => S.recordAnswer("c", "c1", true, true));
  assert.deepStrictEqual(earned(), ["level", "topic", "half"]);
});

/* ---------- Basics facts ---------- */

const quickRight = (S, k) => S.recordFact(k, true, true);
test("a fact is mastered when right and quick on two different days", () => {
  const S = launch();
  onDay("2026-10-10");
  assert.deepStrictEqual(quickRight(S, "k1"), { mastered: false, lost: false });
  assert.deepStrictEqual(quickRight(S, "k1"), { mastered: false, lost: false }, "twice on one day is still one day");
  let f = S.factState("k1");
  assert.deepStrictEqual([f.seen, f.right, f.days, f.mastered, f.quickToday], [2, 2, ["2026-10-10"], false, true]);
  onDay("2026-10-11");
  assert.strictEqual(S.factState("k1").quickToday, false);
  assert.deepStrictEqual(quickRight(S, "k1"), { mastered: true, lost: false });
  f = S.factState("k1");
  assert.deepStrictEqual([f.days, f.mastered, f.last], [["2026-10-10", "2026-10-11"], true, "2026-10-11"]);
  onDay("2026-10-14");
  assert.deepStrictEqual(quickRight(S, "k1"), { mastered: false, lost: false }, "mastered once, not again");
  assert.deepStrictEqual(S.factState("k1").days, ["2026-10-11", "2026-10-14"]);
});
test("a slow right answer is practice, not mastery", () => {
  const S = launch();
  onDay("2026-10-10");
  S.recordFact("k1", true, false);
  onDay("2026-10-11");
  S.recordFact("k1", true, false);
  const f = S.factState("k1");
  assert.deepStrictEqual([f.seen, f.right, f.miss, f.days, f.mastered], [2, 2, 0, [], false]);
});
test("a miss sends a fact back, even a mastered one", () => {
  const S = launch();
  onDay("2026-10-10");
  quickRight(S, "k1");
  onDay("2026-10-11");
  quickRight(S, "k1");
  assert.deepStrictEqual(S.recordFact("k1", false, false), { mastered: false, lost: true });
  const f = S.factState("k1");
  assert.deepStrictEqual([f.miss, f.days, f.mastered], [1, [], false]);
  assert.deepStrictEqual(S.recordFact("k2", false, false), { mastered: false, lost: false });
});
test("facts keep the streak, count as right first time, and are progress", () => {
  const S = launch();
  onDay("2026-10-10");
  S.recordFact("k1", false, false);
  assert.strictEqual(S.hasProgress(), true, "even a miss is progress");
  assert.strictEqual(S.get().streakDays, 1);
  quickRight(S, "k2");
  assert.strictEqual(S.get().totalCorrect, 1);
});
test("a fact's record survives a relaunch", () => {
  const S = launch();
  onDay("2026-10-10");
  quickRight(S, "k3");
  const T = launch(JSON.parse(storage[KEY]));
  onDay("2026-10-10");
  assert.deepStrictEqual(T.factState("k3").days, ["2026-10-10"]);
});
test("Basics: every level open, facts mastered per level, review not counted twice", () => {
  const S = launch();
  let b = S.basicsTopic("b");
  assert.deepStrictEqual(b.levels.map((lv) => [lv.kind, lv.facts, lv.unlocked]), [["facts", 3, true], ["practice", 0, true], ["review", 3, true]]);
  assert.deepStrictEqual([b.facts, b.mastered, b.practiceLevels, b.done, b.next.id], [3, 0, 1, false, "f1"]);
  for (const k of FACT_KEYS) { onDay("2026-10-10"); quickRight(S, k); onDay("2026-10-11"); quickRight(S, k); }
  b = S.basicsTopic("b");
  assert.deepStrictEqual([b.facts, b.mastered, b.levels[0].done, b.levels[2].mastered, b.next.id], [3, 3, true, 3, "p1"]);
  times(8, () => S.recordAnswer("b", "p1", true, true));
  b = S.basicsTopic("b");
  assert.deepStrictEqual([b.cleared, b.done, b.next], [1, true, null]);
  assert.deepStrictEqual(S.basics().map((t) => t.key), ["b"]);
  assert.strictEqual(S.basicsTopic("nope"), null);
});
test("Basics never move the path", () => {
  const S = launch();
  times(8, () => S.recordAnswer("b", "p1", true, true));
  quickRight(S, "k1");
  const p = S.path();
  assert.deepStrictEqual([p.levelsCleared, p.coverage, p.next.level.id], [0, 0, "a1"]);
  assert.deepStrictEqual(S.badges().filter((x) => x.earned).map((x) => x.key), []);
});

console.log(failed ? `\n${failed} failed` : "\nok: progress follows the path's rules");
process.exit(failed ? 1 : 0);
