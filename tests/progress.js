/* Progress tests: the path's rules, as the store keeps them. Levels clear on
   answers right the first time, retries and redos never count, clearing a
   level opens the next, and an old (version 1) record keeps the learner and
   the streak but not the tier progress the path replaced.

   Run:  node tests/progress.js        Exits 1 on any failure. */
"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const SRC = fs.readFileSync(path.join(__dirname, "..", "app/store.js"), "utf8");
const KEY = "abante-minds/v1";

/* A browser the store can run in: storage, connectivity, a location. */
let storage = {};
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

/* A fresh store over whatever is in storage, as on app launch. */
function launch(saved) {
  storage = saved === undefined ? {} : { [KEY]: JSON.stringify(saved) };
  global.AM = { content: { TOPICS: TOPICS, blueprintCompetencies: 8, examDate: "2027-01-30" } };
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

console.log(failed ? `\n${failed} failed` : "\nok: progress follows the path's rules");
process.exit(failed ? 1 : 0);
