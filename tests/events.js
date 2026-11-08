/* Weekly challenge tests: the week a day falls in and its theme
   (app/events.js), how each kind of goal counts, and the store awarding the
   week's badge at the end of the round that meets it, once, and only for
   that week.

   Run:  node tests/events.js        Exits 1 on any failure. */
"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const ROOT = path.join(__dirname, "..");
const EVENTS = fs.readFileSync(path.join(ROOT, "app/events.js"), "utf8");
const STORE = fs.readFileSync(path.join(ROOT, "app/store.js"), "utf8");
const ROAD = fs.readFileSync(path.join(ROOT, "app/road.js"), "utf8");

let failed = 0;
function test(name, fn) {
  try { fn(); console.log("ok   " + name); }
  catch (e) { failed++; console.log("FAIL " + name + "\n       " + e.message.split("\n")[0]); }
}

/* A clock the tests can set, and storage, as tests/progress.js has them. */
const RealDate = Date;
let NOW = null, storage = {};
global.Date = class extends RealDate {
  constructor(...a) { if (a.length) super(...a); else super(NOW === null ? RealDate.now() : NOW); }
  static now() { return NOW === null ? RealDate.now() : NOW; }
};
const at = (day, h) => new RealDate(day + "T" + String(h || 9).padStart(2, "0") + ":00:00").getTime();
global.window = global;
global.location = { hash: "", reload: () => {} };
global.addEventListener = () => {};
global.localStorage = { getItem: (k) => (k in storage ? storage[k] : null), setItem: (k, v) => { storage[k] = String(v); }, removeItem: (k) => { delete storage[k]; } };
global.AM = {};
new Function(EVENTS).call(global);
const E = global.AM.events;
const row = (o) => Object.assign({ at: at("2026-01-07"), attempt: 1, correct: true, kind: "practice", topic: "decimals" }, o);
const theme = (key) => E.themeByKey(key);

/* ---------- the week ---------- */
test("a week runs Monday to Sunday and is named by its Monday", () => {
  for (const d of ["2026-11-02", "2026-11-05", "2026-11-08"]) {
    const w = E.weekOf(d);
    assert.deepStrictEqual([w.id, w.start, w.end], ["2026-11-02", "2026-11-02", "2026-11-08"], d);
  }
  assert.strictEqual(E.weekOf("2026-11-09").id, "2026-11-09");
  assert.strictEqual(E.weekOf("2027-01-01").id, "2026-12-28", "across the new year");
});
test("the themes turn over week by week, every one in turn, the same for everyone", () => {
  const seen = [];
  for (let k = 0; k < E.THEMES.length; k++) {
    const d = new RealDate(2026, 0, 7 + 7 * k, 12);
    seen.push(E.weekOf(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")).theme);
  }
  assert.deepStrictEqual(seen, E.THEMES.map((t, i) => i));
  assert.strictEqual(E.weekOf("2026-01-05").theme, E.weekOf("2026-01-11").theme, "a week keeps its theme all week");
});
test("every theme has a name, a glyph, a goal, and words for both", () => {
  for (const t of E.THEMES) {
    assert.ok(t.key && t.name && t.icon && t.what && t.why, t.key);
    assert.ok(["right", "days", "levels", "topics"].includes(t.goal.kind) && t.goal.need > 0, t.key);
  }
});

/* ---------- the goals ---------- */
test("a topic goal counts first tries right in its topics, on the path or in a needs-practice round", () => {
  const p = E.progress(theme("palengke"), { rows: [
    row(), row({ topic: "percent" }), row({ kind: "kind" }),
    row({ correct: false }), row({ attempt: 2 }), row({ kind: "redo" }), row({ kind: "facts" }), row({ kind: "exam" }), row({ topic: "time" })
  ] });
  assert.deepStrictEqual(p, { have: 3, need: 20, done: false });
});
test("a goal met is done, and shows no more than it needs", () => {
  const rows = Array.from({ length: 25 }, () => row());
  assert.deepStrictEqual(E.progress(theme("palengke"), { rows }), { have: 20, need: 20, done: true });
});
test("a days goal counts days with a full round of answers", () => {
  const rows = [];
  for (const d of ["2026-01-05", "2026-01-06", "2026-01-07"]) for (let i = 0; i < 10; i++) rows.push(row({ at: at(d), correct: i % 2 === 0 }));
  for (let i = 0; i < 9; i++) rows.push(row({ at: at("2026-01-08") }));
  for (let i = 0; i < 10; i++) rows.push(row({ at: at("2026-01-09"), attempt: 2 }));
  assert.deepStrictEqual(E.progress(theme("bayanihan"), { rows }), { have: 3, need: 4, done: false });
});
test("a levels goal counts the levels cleared in the week", () => {
  assert.deepStrictEqual(E.progress(theme("fiesta"), { rows: [], levels: 1 }), { have: 1, need: 2, done: false });
  assert.strictEqual(E.progress(theme("fiesta"), { rows: [], levels: 3 }).done, true);
});
test("a topics goal counts topics with enough first tries right", () => {
  const rows = [];
  for (const [t, n] of [["decimals", 5], ["ratio", 5], ["time", 4], ["area", 6]]) for (let i = 0; i < n; i++) rows.push(row({ topic: t }));
  assert.deepStrictEqual(E.progress(theme("sarisari"), { rows }), { have: 3, need: 3, done: true });
});

/* ---------- the store ---------- */
function launch(day) {
  storage = {};
  NOW = at(day);
  global.AM = { content: { TOPICS: [], BASICS: [], facts: () => [], blueprintCompetencies: 8, examDate: "2027-01-30" } };
  new Function(ROAD).call(global);
  new Function(EVENTS).call(global);
  new Function(STORE).call(global);
  return global.AM.store;
}
test("the week's badge is earned at the end of the round that meets the goal, once", () => {
  const s = launch("2026-01-07");
  s.set({ profile: { name: "Test", colorKey: 1 } });
  for (let i = 0; i < 19; i++) s.logAttempt(row());
  s.recordRound();
  assert.strictEqual(s.weekChallenge().earned, false);
  assert.strictEqual(s.weekChallenge().have, 19);
  s.logAttempt(row());
  s.recordRound();
  const wk = s.weekChallenge();
  assert.deepStrictEqual([wk.key, wk.theme.key, wk.done, wk.earned], ["week:2026-01-05", "palengke", true, true]);
  assert.deepStrictEqual(s.takeRecent(), ["week:2026-01-05"]);
  s.recordRound();
  assert.deepStrictEqual(s.takeRecent(), [], "not awarded twice");
  const sp = s.catalog().specials.filter((b) => b.kind === "week");
  assert.deepStrictEqual(sp.map((b) => [b.key, b.theme, b.name, b.earned]), [["week:2026-01-05", "palengke", "Palengke week, 5 Jan", true]]);
});
test("last week's answers do not count this week, and its badge cannot be earned late", () => {
  const s = launch("2026-01-07");
  s.set({ profile: { name: "Test", colorKey: 1 } });
  for (let i = 0; i < 20; i++) s.logAttempt(row());
  NOW = at("2026-01-13");
  s.recordRound();
  const wk = s.weekChallenge();
  assert.deepStrictEqual([wk.id, wk.theme.key, wk.have, wk.earned], ["2026-01-12", "bayanihan", 0, false]);
  assert.deepStrictEqual(s.takeRecent(), []);
});
test("days left counts down to Sunday", () => {
  const s = launch("2026-01-05");
  assert.strictEqual(s.weekChallenge().daysLeft, 6);
  NOW = at("2026-01-11");
  assert.strictEqual(s.weekChallenge().daysLeft, 0);
});

console.log(failed ? `\n${failed} failed` : "\nok: the weekly challenge behaves as specified");
process.exit(failed ? 1 : 0);
