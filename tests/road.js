/* Reward road tests: the steps, which streaks are milestones, how a step
   opens, what the steps give, and the shield cap (app/road.js). How the store
   keeps the road, and how shields keep a streak, are in tests/progress.js.

   Run:  node tests/road.js        Exits 1 on any failure. */
"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");

global.window = global;
global.AM = {};
new Function(fs.readFileSync(path.join(__dirname, "..", "app/road.js"), "utf8")).call(global);
const R = global.AM.road;

let failed = 0;
function test(name, fn) {
  try { fn(); console.log("ok   " + name); }
  catch (e) { failed++; console.log("FAIL " + name + "\n       " + e.message.split("\n")[0]); }
}
const kinds = (n) => R.step(n).rewards.map((r) => r.kind + (r.key === undefined ? "" : ":" + r.key)).join(" ");

/* ---------- the steps ---------- */
test("the road's streaks are the owner's ladder", () => {
  const streaks = [];
  for (let i = 0; i < 15; i++) streaks.push(R.step(i).streak);
  assert.deepStrictEqual(streaks, [3, 7, 14, 30, 50, 100, 150, 200, 250, 300, 365, 400, 500, 600, 700]);
});
test("each step has its levels to clear, up to all 90", () => {
  const levels = [];
  for (let i = 0; i < 12; i++) levels.push(R.step(i).levels);
  assert.deepStrictEqual(levels, [3, 8, 15, 25, 35, 50, 65, 80, 90, null, null, null]);
});
test("steps are numbered from one", () => {
  assert.strictEqual(R.step(0).n, 1);
  assert.strictEqual(R.step(12).n, 13);
});
test("each step gives what was agreed", () => {
  assert.strictEqual(kinds(0), "colour:5 colour:6");
  assert.strictEqual(kinds(1), "shield");
  assert.strictEqual(kinds(2), "frame:silver");
  assert.strictEqual(kinds(3), "certificate:30 pattern:binakol");
  assert.strictEqual(kinds(4), "shield pattern:triangles");
  assert.strictEqual(kinds(5), "certificate:100 flame:blue frame:gold");
  assert.strictEqual(kinds(6), "pattern:hexagons");
  assert.strictEqual(kinds(7), "shield");
  assert.strictEqual(kinds(8), "pattern:stars");
  assert.strictEqual(kinds(9), "shield");
  assert.strictEqual(kinds(10), "flame:purple certificate:365 frame:year");
  assert.strictEqual(kinds(11), "shield");
  assert.strictEqual(kinds(20), "shield");
});

/* ---------- milestones ---------- */
test("the road's streaks are milestones", () => {
  [3, 7, 14, 30, 50, 100, 150, 200, 250, 300, 365, 400, 500, 600, 1000].forEach((d) => assert.ok(R.isMilestone(d), d));
});
test("other days are not", () => {
  [0, 1, 2, 4, 6, 8, 29, 31, 99, 101, 350, 399, 401, 450, 465, 550].forEach((d) => assert.ok(!R.isMilestone(d), d));
});

/* ---------- reaching a step ---------- */
test("a step opens by its streak or its levels, whichever comes first", () => {
  const s = R.step(1);
  assert.strictEqual(R.reachedBy(s, 7, 0), "streak");
  assert.strictEqual(R.reachedBy(s, 2, 8), "levels");
  assert.strictEqual(R.reachedBy(s, 7, 8), "streak", "both: the streak is named");
  assert.strictEqual(R.reachedBy(s, 6, 7), null);
});
test("past all 90 levels, only a streak opens a step", () => {
  assert.strictEqual(R.reachedBy(R.step(9), 0, 1000), null);
  assert.strictEqual(R.reachedBy(R.step(9), 300, 0), "streak");
});
test("steps are reached in order, by either ladder", () => {
  assert.strictEqual(R.reached(0, 0), 0);
  assert.strictEqual(R.reached(2, 2), 0);
  assert.strictEqual(R.reached(3, 0), 1);
  assert.strictEqual(R.reached(0, 3), 1);
  assert.strictEqual(R.reached(7, 15), 3, "the levels go further than the streak");
  assert.strictEqual(R.reached(30, 8), 4, "the streak goes further than the levels");
  assert.strictEqual(R.reached(1, 90), 9, "every level cleared");
  assert.strictEqual(R.reached(365, 0), 11);
  assert.strictEqual(R.reached(499, 0), 12);
  assert.strictEqual(R.reached(500, 90), 13);
});

/* ---------- what the steps give ---------- */
test("nothing before the first step", () => {
  assert.deepStrictEqual(R.unlocked(0), { colours: [], frames: [], patterns: [], flames: [], certificates: [], shields: 0 });
});
test("everything the steps reached give, in order", () => {
  assert.deepStrictEqual(R.unlocked(6), {
    colours: [5, 6], frames: ["silver", "gold"], patterns: ["binakol", "triangles"], flames: ["blue"], certificates: [30, 100], shields: 2
  });
  const all = R.unlocked(13);
  assert.deepStrictEqual(all.frames, ["silver", "gold", "year"]);
  assert.deepStrictEqual(all.patterns, ["binakol", "triangles", "hexagons", "stars"]);
  assert.deepStrictEqual(all.flames, ["blue", "purple"]);
  assert.deepStrictEqual(all.certificates, [30, 100, 365]);
  assert.strictEqual(all.shields, 6);
});

/* ---------- shields ---------- */
test("two shields at most", () => {
  assert.strictEqual(R.MAX_SHIELDS, 2);
  assert.strictEqual(R.credit(0, 1), 1);
  assert.strictEqual(R.credit(1, 1), 2);
  assert.strictEqual(R.credit(2, 1), 2);
  assert.strictEqual(R.credit(0, 3), 2);
  assert.strictEqual(R.credit(1, 0), 1);
});

console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
