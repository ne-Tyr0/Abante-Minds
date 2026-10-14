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
global.location = { hash: "", reload: () => {} };
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
/* ---------- settings ---------- */

test("sound and vibration start on and calm starts off", () => {
  const S = launch();
  assert.deepStrictEqual(S.settings(), { sound: true, vibration: true, calm: false });
});
test("a setting is kept with the learner's record", () => {
  const S = launch();
  S.setSetting("sound", false);
  S.setSetting("calm", true);
  const T = launch(JSON.parse(storage[KEY]));
  assert.deepStrictEqual(T.settings(), { sound: false, vibration: true, calm: true });
});
test("an unknown setting is ignored and a missing one takes its default", () => {
  const S = launch({ version: 2, settings: { calm: true, sound: "loud" } });
  assert.deepStrictEqual(S.settings(), { sound: true, vibration: true, calm: true });
  S.setSetting("banana", true);
  assert.ok(!("banana" in S.get().settings));
});

/* ---------- badges ---------- */

const keys = (S) => Object.keys(S.get().badges).sort();
test("clearing a level awards its badge, once", () => {
  const S = launch();
  onDay("2026-10-10");
  const results = times(9, () => S.recordAnswer("a", "a1", true, true));
  assert.deepStrictEqual(results.map((r) => r.badge), [null, null, null, null, null, null, null, "lv:a/a1", null]);
  assert.strictEqual(results[7].shiny, true, "eight out of eight first tries");
  assert.deepStrictEqual(S.get().badges["lv:a/a1"], { at: "2026-10-10", shiny: true, seen: false });
  assert.deepStrictEqual(S.takeRecent(), ["lv:a/a1"]);
  assert.deepStrictEqual(S.takeRecent(), [], "asking empties the list");
});
test("a first try wrong on the way to clearing means no shiny badge", () => {
  const S = launch();
  S.recordAnswer("a", "a1", false, true);
  const last = times(8, () => S.recordAnswer("a", "a1", true, true)).pop();
  assert.deepStrictEqual([last.badge, last.shiny], ["lv:a/a1", false]);
  assert.ok(!("shiny" in S.get().badges["lv:a/a1"]));
});
test("a facts level's badge comes with its last fact mastered, and stays", () => {
  const S = launch();
  onDay("2026-10-10");
  ["k1", "k2", "k3"].forEach((k) => S.recordFact(k, true, true));
  onDay("2026-10-11");
  const got = ["k1", "k2", "k3"].map((k) => S.recordFact(k, true, true).badges);
  assert.deepStrictEqual(got, [[], [], ["lv:b/f1"]]);
  assert.strictEqual(S.get().badges["lv:b/f1"].shiny, true, "no fact ever missed");
  S.recordFact("k1", false, false);
  assert.strictEqual(S.factState("k1").mastered, false);
  assert.ok(S.get().badges["lv:b/f1"], "a lost fact does not take the badge");
});
test("a missed fact on the way means the facts badge is not shiny", () => {
  const S = launch();
  onDay("2026-10-10");
  S.recordFact("k2", false, false);
  ["k1", "k2", "k3"].forEach((k) => S.recordFact(k, true, true));
  onDay("2026-10-11");
  ["k1", "k2", "k3"].forEach((k) => S.recordFact(k, true, true));
  assert.deepStrictEqual(S.get().badges["lv:b/f1"], { at: "2026-10-11", seen: false });
});
test("every level but a review level is a badge, named on one ladder", () => {
  const S = launch();
  const cat = S.catalog();
  assert.deepStrictEqual(cat.topics.map((t) => [t.key, t.levels.map((l) => l.key)]),
    [["a", ["lv:a/a1", "lv:a/a2"]], ["c", ["lv:c/c1"]], ["b", ["lv:b/f1", "lv:b/p1"]]]);
  assert.deepStrictEqual([cat.earned, cat.total], [0, 5]);
  assert.deepStrictEqual(cat.topics[0].levels.map((l) => l.name), ["A Starter", "A Master"]);
  assert.strictEqual(cat.topics[2].track, "basics");
  assert.deepStrictEqual(cat.specials.map((s) => s.key),
    ["streak:3", "streak:7", "streak:14", "streak:30", "exam:60", "exam:75", "exam:90", "improver", "welcome"]);
});
test("the ladder spreads across a topic, Starter first and Master last", () => {
  const S = launch();
  const ladder = (n) => times(n, (i) => S.tierName(i + 1, n));
  assert.deepStrictEqual(ladder(2), ["Starter", "Master"]);
  assert.deepStrictEqual(ladder(3), ["Starter", "Expert", "Master"]);
  assert.deepStrictEqual(ladder(4), ["Starter", "Builder", "Expert", "Master"]);
  assert.deepStrictEqual(ladder(5), ["Starter", "Explorer", "Expert", "Champion", "Master"]);
  assert.deepStrictEqual(ladder(6), ["Starter", "Explorer", "Builder", "Expert", "Champion", "Master"]);
});
test("progress made before badges is awarded once, quietly", () => {
  /* The store rolls the day as it launches, on the real date: a streak
     last kept today is still running. */
  const d = new Date(), real = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const S = launch({
    version: 2, streakDays: 7, lastActiveDay: real,
    levels: { "a/a1": { correct: 8, attempts: 8, cleared: true }, "c/c1": { correct: 8, attempts: 10, cleared: true }, "a/a2": { correct: 5, attempts: 5, cleared: false } },
    exams: [{ day: "2026-10-01", score: 16, total: 20 }]
  });
  onDay("2026-10-10");
  S.syncBadges();
  assert.deepStrictEqual(keys(S), ["exam:60", "exam:75", "lv:a/a1", "lv:c/c1", "streak:3", "streak:7"]);
  const b = S.get().badges;
  assert.deepStrictEqual(b["lv:a/a1"], { at: "2026-10-10", shiny: true, before: true, seen: true });
  assert.deepStrictEqual(b["lv:c/c1"], { at: "2026-10-10", before: true, seen: true });
  assert.deepStrictEqual(S.takeRecent(), [], "nothing to celebrate");
  assert.strictEqual(S.get().badgesSince, "2026-10-10");
  assert.ok(JSON.parse(storage[KEY]).badges["lv:a/a1"], "saved at once");
  const last = times(3, () => S.recordAnswer("a", "a2", true, true)).pop();
  assert.deepStrictEqual(S.get().badges[last.badge], { at: "2026-10-10", shiny: true, seen: false }, "a badge earned now is not from before");
  onDay("2026-10-12");
  S.syncBadges();
  assert.strictEqual(S.get().badgesSince, "2026-10-10", "the first count happens once");
});
test("streak badges at 3 and 7 days in a row", () => {
  const S = launch();
  const on = ["10", "11", "12", "13", "14", "15", "16"].map((d) => { onDay("2026-10-" + d); S.recordAnswer("a", "a1", true, true); return keys(S).filter((k) => k.startsWith("streak")); });
  assert.deepStrictEqual(on.map((k) => k.length), [0, 0, 1, 1, 1, 1, 2]);
  assert.deepStrictEqual(on[6], ["streak:3", "streak:7"]);
  assert.strictEqual(S.get().badges["streak:3"].at, "2026-10-12", "a badge keeps the day it was earned");
  assert.deepStrictEqual(S.takeRecent().filter((k) => k.startsWith("streak")), ["streak:3", "streak:7"], "each celebrated once");
});
test("a practice exam earns its score's badges", () => {
  const S = launch();
  S.recordExam({ score: 15, total: 20, seconds: 900, topics: {} });
  assert.deepStrictEqual(keys(S), ["exam:60", "exam:75"]);
  S.recordExam({ score: 18, total: 20, seconds: 900, topics: {} });
  assert.deepStrictEqual(keys(S), ["exam:60", "exam:75", "exam:90"]);
});
test("Improver comes with the fifth missed question put right", () => {
  const S = launch({ version: 2, reviewsFixed: 3, review: {
    r1: { topic: "a", template: "t", tier: 1, seed: 1, pinnedAt: null, step: 2, due: "2026-10-10", added: 1 },
    r2: { topic: "a", template: "t", tier: 1, seed: 2, pinnedAt: null, step: 2, due: "2026-10-10", added: 2 } } });
  onDay("2026-10-10");
  S.recordReview("r1", true);
  assert.ok(!S.get().badges.improver, "four is not yet");
  S.recordReview("r2", true);
  assert.ok(S.get().badges.improver);
  assert.strictEqual(S.get().reviewsFixed, 5);
});
test("Welcome back after a few days away, once", () => {
  const S = launch();
  onDay("2026-10-10"); S.recordAnswer("a", "a1", true, true);
  onDay("2026-10-12"); S.rollDay(); S.recordAnswer("a", "a1", true, true);
  assert.ok(!S.get().badges.welcome, "one day missed is not away");
  onDay("2026-10-15"); S.rollDay(); S.recordAnswer("a", "a1", true, true);
  assert.deepStrictEqual(S.get().badges.welcome, { at: "2026-10-15", seen: false });
  assert.strictEqual(S.get().welcomeDue, false);
});
test("the showcase shows the newest three until the learner picks", () => {
  const S = launch();
  onDay("2026-10-10"); times(8, () => S.recordAnswer("a", "a1", true, true));
  onDay("2026-10-11"); times(8, () => S.recordAnswer("a", "a2", true, true));
  onDay("2026-10-12"); times(8, () => S.recordAnswer("c", "c1", true, true));
  S.recordExam({ score: 12, total: 20, seconds: 600, topics: {} });
  assert.deepStrictEqual(S.showcase(), ["exam:60", "lv:c/c1", "streak:3"], "newest first, the older ones off the end");
  assert.strictEqual(S.togglePin("streak:30"), false, "an unearned badge cannot be pinned");
  S.togglePin("lv:a/a1");
  assert.deepStrictEqual(S.showcase(), ["lv:a/a1"]);
  S.togglePin("lv:a/a2"); S.togglePin("lv:c/c1"); S.togglePin("exam:60");
  assert.deepStrictEqual(S.showcase(), ["lv:a/a2", "lv:c/c1", "exam:60"], "a fourth pick drops the oldest");
  S.togglePin("lv:c/c1");
  assert.deepStrictEqual(S.showcase(), ["lv:a/a2", "exam:60"]);
  assert.strictEqual(S.isPinned("exam:60"), true);
});
test("a new badge is unseen until its card is opened", () => {
  const S = launch();
  times(8, () => S.recordAnswer("a", "a1", true, true));
  const seen = () => S.findBadge("lv:a/a1").badge.seen;
  assert.strictEqual(seen(), false, "new until its card is opened");
  S.markBadgeSeen("lv:a/a1");
  assert.strictEqual(seen(), true);
  assert.strictEqual(JSON.parse(storage[KEY]).badges["lv:a/a1"].seen, true, "and kept");
  assert.strictEqual(S.findBadge("lv:c/c1").badge.seen, true, "an unearned badge is never new");
});

/* ---------- Basics facts ---------- */

const quickRight = (S, k) => S.recordFact(k, true, true);
test("a fact is mastered when right and quick on two different days", () => {
  const S = launch();
  onDay("2026-10-10");
  assert.deepStrictEqual(quickRight(S, "k1"), { mastered: false, lost: false, badges: [] });
  assert.deepStrictEqual(quickRight(S, "k1"), { mastered: false, lost: false, badges: [] }, "twice on one day is still one day");
  let f = S.factState("k1");
  assert.deepStrictEqual([f.seen, f.right, f.days, f.mastered, f.quickToday], [2, 2, ["2026-10-10"], false, true]);
  onDay("2026-10-11");
  assert.strictEqual(S.factState("k1").quickToday, false);
  assert.deepStrictEqual(quickRight(S, "k1"), { mastered: true, lost: false, badges: [] });
  f = S.factState("k1");
  assert.deepStrictEqual([f.days, f.mastered, f.last], [["2026-10-10", "2026-10-11"], true, "2026-10-11"]);
  onDay("2026-10-14");
  assert.deepStrictEqual(quickRight(S, "k1"), { mastered: false, lost: false, badges: [] }, "mastered once, not again");
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
  assert.deepStrictEqual(S.recordFact("k1", false, false), { mastered: false, lost: true, badges: [] });
  const f = S.factState("k1");
  assert.deepStrictEqual([f.miss, f.days, f.mastered], [1, [], false]);
  assert.deepStrictEqual(S.recordFact("k2", false, false), { mastered: false, lost: false, badges: [] });
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
  assert.deepStrictEqual(S.catalog().topics.map((t) => [t.key, t.earned]), [["a", 0], ["c", 0], ["b", 1]], "a Basics badge, and none on the path");
});

/* ---------- spaced review ---------- */

const missed = (seed, extra) => Object.assign({ templateId: "a.t", tier: 2, seed: seed, pinned: false, topicKey: "a" }, extra);
test("a miss comes back the next day, then in 3 days, then in 7, then is done", () => {
  const s = launch();
  onDay("2026-10-20");
  const key = s.scheduleReview(missed(11));
  assert.deepStrictEqual([s.reviewDue(), s.reviewNext()], [[], "2026-10-21"]);
  onDay("2026-10-21");
  const due = s.reviewDue();
  assert.deepStrictEqual([due.length, due[0].key, due[0].template, due[0].tier, due[0].seed, due[0].pinnedAt, due[0].step],
    [1, key, "a.t", 2, 11, null, 0]);
  assert.deepStrictEqual(s.recordReview(key, true), { done: false, due: "2026-10-24" });
  onDay("2026-10-24");
  assert.deepStrictEqual(s.recordReview(key, true), { done: false, due: "2026-10-31" });
  onDay("2026-10-31");
  assert.deepStrictEqual(s.recordReview(key, true), { done: true, due: null });
  assert.deepStrictEqual([s.reviewDue(), s.reviewNext()], [[], null]);
});
test("a miss in review starts it again from the next day", () => {
  const s = launch();
  onDay("2026-10-20");
  const key = s.scheduleReview(missed(3));
  onDay("2026-10-21");
  s.recordReview(key, true);
  onDay("2026-10-24");
  assert.deepStrictEqual(s.recordReview(key, false), { done: false, due: "2026-10-25" });
  onDay("2026-10-25");
  assert.strictEqual(s.reviewDue()[0].step, 0);
});
test("a question still due later stays due", () => {
  const s = launch();
  onDay("2026-10-20");
  s.scheduleReview(missed(1));
  onDay("2026-10-29");
  assert.strictEqual(s.reviewDue().length, 1);
});
test("a pinned item is kept by its place, not a seed", () => {
  const s = launch();
  onDay("2026-10-20");
  const key = s.scheduleReview(missed(null, { pinned: true, pinnedAt: 1, seed: null }));
  assert.strictEqual(key, "a.t:2:p1");
  onDay("2026-10-21");
  assert.deepStrictEqual([s.reviewDue()[0].seed, s.reviewDue()[0].pinnedAt], [null, 1]);
});
test("the longest waiting comes first, and at most REVIEW_MAX are kept", () => {
  const s = launch();
  onDay("2026-10-20");
  s.scheduleReview(missed(1));
  onDay("2026-10-21");
  s.scheduleReview(missed(2));
  NOW += 60000;
  s.scheduleReview(missed(3));
  onDay("2026-10-25");
  assert.deepStrictEqual(s.reviewDue().map((e) => e.seed), [1, 2, 3], "by due day, then the one missed first");
  for (let i = 0; i < s.REVIEW_MAX + 3; i++) { NOW += 1; s.scheduleReview(missed(100 + i)); }
  const kept = Object.keys(s.get().review);
  assert.strictEqual(kept.length, s.REVIEW_MAX);
  assert.ok(!kept.includes("a.t:2:1") && kept.includes("a.t:2:" + (100 + s.REVIEW_MAX + 2)), "the oldest went first");
});
test("reviewing keeps the streak but never moves the path", () => {
  const s = launch();
  onDay("2026-10-20");
  const key = s.scheduleReview(missed(5));
  onDay("2026-10-21");
  s.recordReview(key, true);
  assert.deepStrictEqual([s.get().streakDays, s.get().levels, s.get().totalCorrect], [1, {}, 0]);
  assert.strictEqual(s.recordReview("a.t:2:nope", true), null, "an unknown key is ignored");
  s.dropReview(key);
  assert.deepStrictEqual(s.get().review, {});
});

/* ---------- practice exams ---------- */

test("an exam is kept on its own: the path and Basics do not move", () => {
  const s = launch();
  onDay("2026-10-20");
  s.recordExam({ score: 14, total: 20, seconds: 1500, topics: { a: [3, 4] } });
  assert.deepStrictEqual(s.get().exams, [{ day: "2026-10-20", score: 14, total: 20, seconds: 1500, topics: { a: [3, 4] } }]);
  assert.deepStrictEqual([s.get().levels, s.get().facts, s.get().totalCorrect], [{}, {}, 0]);
  assert.strictEqual(s.get().streakDays, 1, "it is practice, so it keeps the streak");
  assert.deepStrictEqual(JSON.parse(storage[KEY]).exams.length, 1, "saved");
});
test("exam stats: the last and the best, and only the most recent are kept", () => {
  const s = launch();
  assert.strictEqual(s.examStats(), null);
  [12, 17, 9, 17].forEach((score) => s.recordExam({ score: score, total: 20, seconds: 600, topics: {} }));
  const st = s.examStats();
  assert.deepStrictEqual([st.taken, st.last.score, st.best.score], [4, 17, 17]);
  assert.strictEqual(st.best, s.get().exams[3], "a tie goes to the later exam");
  for (let i = 0; i < s.EXAMS_KEPT + 2; i++) s.recordExam({ score: i % 20, total: 20, seconds: 600, topics: {} });
  assert.strictEqual(s.get().exams.length, s.EXAMS_KEPT);
});

/* ---------- the attempt log ---------- */

const LOG_KEY = "abante-minds/attempts";
test("every answer is logged, with the build and the time", () => {
  const s = launch();
  NOW = 1700000000000;
  const row = s.logAttempt({ topic: "a", template: "a.t", seed: 7, given: "12", correct: false, error: "added" });
  assert.deepStrictEqual(row, { at: 1700000000000, app: s.APP_BUILD, participant: s.participantCode(), topic: "a", template: "a.t", seed: 7, given: "12", correct: false, error: "added" });
  assert.strictEqual(s.attempts().length, 1);
  assert.deepStrictEqual(JSON.parse(storage[LOG_KEY]), [row], "kept under its own key");
  assert.ok(!(LOG_KEY in JSON.parse(storage[KEY] || "{}")), "not inside the main record");
});
test("the log survives a relaunch and keeps its order", () => {
  let s = launch();
  s.logAttempt({ n: 1 });
  s.logAttempt({ n: 2 });
  const kept = storage[LOG_KEY];
  s = launch();
  storage[LOG_KEY] = kept;
  new Function(SRC).call(global);
  assert.deepStrictEqual(global.AM.store.attempts().map((r) => r.n), [1, 2]);
});
test("past LOG_MAX the oldest attempts go", () => {
  const s = launch();
  for (let i = 0; i < s.LOG_MAX + 3; i++) s.logAttempt({ n: i });
  const rows = s.attempts();
  assert.strictEqual(rows.length, s.LOG_MAX);
  assert.deepStrictEqual([rows[0].n, rows[rows.length - 1].n], [3, s.LOG_MAX + 2]);
});
test("a full phone gives up the oldest fifth rather than the new answer", () => {
  const s = launch();
  for (let i = 0; i < 10; i++) s.logAttempt({ n: i });
  const real = global.localStorage.setItem;
  let refused = false;
  global.localStorage.setItem = (k, v) => { if (k === LOG_KEY && !refused) { refused = true; throw new Error("QuotaExceededError"); } real(k, v); };
  s.logAttempt({ n: 10 });
  global.localStorage.setItem = real;
  assert.deepStrictEqual(s.attempts().map((r) => r.n), [2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.strictEqual(JSON.parse(storage[LOG_KEY]).length, 9);
});
test("the copy handed out cannot change the log", () => {
  const s = launch();
  s.logAttempt({ n: 1 });
  s.attempts().push({ n: 99 });
  assert.strictEqual(s.attempts().length, 1);
});

/* ---------- the participant code ---------- */

test("the participant code is AM-XXXX-XXXX in Crockford letters, with a check character", () => {
  const s = launch();
  const code = s.participantCode();
  assert.match(code, /^AM-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
  assert.strictEqual(s.isParticipantCode(code), true);
  for (const bad of ["", null, "AM-0000-000", "AM-0000-0000-0", "am-0000-0000", "XX-0000-0000", "AM-I000-0000"]) assert.strictEqual(s.isParticipantCode(bad), false, String(bad));
});
test("any one character copied wrong is caught", () => {
  const s = launch();
  const A = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  for (let n = 0; n < 20; n++) {
    storage = {};
    const code = launch().participantCode();
    const at = [3, 4, 5, 6, 8, 9, 10, 11];
    for (const i of at) for (const ch of A) {
      if (ch === code[i]) continue;
      const wrong = code.slice(0, i) + ch + code.slice(i + 1);
      assert.strictEqual(s.isParticipantCode(wrong), false, `${code} with ${ch} at ${i}`);
    }
  }
});
test("the code is made once and kept: across answers and a relaunch", () => {
  let s = launch();
  const code = s.participantCode();
  s.logAttempt({ n: 1 });
  assert.strictEqual(s.participantCode(), code);
  const kept = storage[KEY];
  storage = { [KEY]: kept };
  new Function(SRC).call(global);
  s = global.AM.store;
  assert.strictEqual(s.participantCode(), code, "kept with the learner's record");
  assert.strictEqual(JSON.parse(storage[KEY]).participant, code);
});
test("every logged answer carries the code", () => {
  const s = launch();
  s.logAttempt({ n: 1 });
  s.logAttempt({ n: 2 });
  assert.deepStrictEqual(s.attempts().map((r) => r.participant), [s.participantCode(), s.participantCode()]);
});
test("starting over gives a new code", () => {
  const s = launch();
  const before = s.participantCode();
  s.reset();
  assert.notStrictEqual(s.participantCode(), before);
});
test("two phones make different codes", () => {
  const codes = new Set();
  for (let i = 0; i < 200; i++) { storage = {}; codes.add(launch().participantCode()); }
  assert.strictEqual(codes.size, 200);
});

console.log(failed ? `\n${failed} failed` : "\nok: progress follows the path's rules");
process.exit(failed ? 1 : 0);
