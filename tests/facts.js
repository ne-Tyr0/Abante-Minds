/* Facts drill tests: which facts a Basics round asks, and when a missed one
   comes back (app/facts.js). The store's side, mastering a fact on two days,
   is in tests/progress.js.

   Run:  node tests/facts.js        Exits 1 on any failure. */
"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");

global.window = global;
global.AM = {};
new Function(fs.readFileSync(path.join(__dirname, "..", "app/facts.js"), "utf8")).call(global);
const F = global.AM.facts;

let failed = 0;
function test(name, fn) {
  try { fn(); console.log("ok   " + name); }
  catch (e) { failed++; console.log("FAIL " + name + "\n       " + e.message.split("\n")[0]); }
}

const keys = (n, p) => Array.from({ length: n }, (_, i) => (p || "f") + i);
const NEW = { seen: 0, mastered: false, quickToday: false, last: null };
/* A learner's record: each key's state, NEW where not given. */
const learner = (states) => (k) => states[k] || NEW;
const noRepeatsRunning = (round) => round.every((k, i) => i === 0 || k !== round[i - 1]);
const count = (round, k) => round.filter((x) => x === k).length;

test("the rules' numbers", () => {
  assert.strictEqual(F.ROUND, 20);
  assert.strictEqual(F.NEW_MAX, 6);
  assert.strictEqual(F.QUICK_MS, 4000);
  assert.strictEqual(F.REVIEW_SLOTS, 3);
  assert.strictEqual(F.GAP, 3);
  assert.strictEqual(F.EXTRA_MAX, 5);
});
test("a new level: a full round of the first new facts, in the order listed", () => {
  const all = keys(40);
  for (let seed = 0; seed < 50; seed++) {
    const round = F.pickRound(all, learner({}), seed);
    assert.strictEqual(round.length, F.ROUND);
    assert.deepStrictEqual([...new Set(round)].sort(), all.slice(0, F.NEW_MAX).sort());
    assert.ok(noRepeatsRunning(round), round.join(" "));
    for (const k of all.slice(0, F.NEW_MAX)) assert.ok(count(round, k) >= 3, `${k} comes round more than once`);
  }
});
test("facts still being learnt come before new ones", () => {
  const all = keys(40);
  const states = {};
  all.slice(10, 30).forEach((k) => { states[k] = { seen: 2, mastered: false, quickToday: false, last: "2026-10-01" }; });
  const round = F.pickRound(all, learner(states), 3);
  assert.strictEqual(round.length, 20);
  assert.ok(round.every((k) => states[k]), "no new fact while 20 are being learnt");
});
test("among facts being learnt, the least recently practised come first", () => {
  const all = keys(30);
  const states = {};
  all.forEach((k, i) => { states[k] = { seen: 1, mastered: false, quickToday: false, last: i < 25 ? "2026-10-0" + (1 + (i % 9)) : "2026-09-01" }; });
  const round = F.pickRound(all, learner(states), 9);
  for (const k of all.slice(25)) assert.ok(round.includes(k), `${k}, practised longest ago, is in`);
});
test("facts already right and quick today wait behind new ones", () => {
  const all = keys(30);
  const states = {};
  all.slice(0, 20).forEach((k) => { states[k] = { seen: 1, mastered: false, quickToday: true, last: "2026-10-10" }; });
  const round = F.pickRound(all, learner(states), 4);
  for (const k of all.slice(20, 20 + F.NEW_MAX)) assert.ok(round.includes(k), `new ${k} is in`);
  assert.strictEqual(new Set(round.filter((k) => !states[k])).size, F.NEW_MAX);
});
test("a few mastered facts always come along", () => {
  const all = keys(40);
  const states = {};
  all.slice(0, 10).forEach((k) => { states[k] = { seen: 3, mastered: true, quickToday: false, last: "2026-09-01" }; });
  all.slice(10, 40).forEach((k) => { states[k] = { seen: 1, mastered: false, quickToday: false, last: "2026-10-01" }; });
  const round = F.pickRound(all, learner(states), 5);
  assert.strictEqual(round.filter((k) => states[k].mastered).length, F.REVIEW_SLOTS);
});
test("everything mastered: the round is review, as many different facts as it can hold", () => {
  const all = keys(30);
  const states = Object.fromEntries(all.map((k) => [k, { seen: 3, mastered: true, quickToday: false, last: "2026-09-01" }]));
  const round = F.pickRound(all, learner(states), 6);
  assert.strictEqual(round.length, 20);
  assert.strictEqual(new Set(round).size, 20);
});
test("a small level goes round again, never the same fact twice running", () => {
  for (let seed = 0; seed < 200; seed++) {
    const round = F.pickRound(keys(3), learner({}), seed);
    assert.strictEqual(round.length, 20);
    assert.ok(noRepeatsRunning(round), round.join(" "));
    for (const k of keys(3)) assert.ok(count(round, k) >= 6);
  }
});
test("the same seed gives the same round; another seed, another order", () => {
  const all = keys(12);
  assert.deepStrictEqual(F.pickRound(all, learner({}), 42), F.pickRound(all, learner({}), 42));
  const orders = new Set(Array.from({ length: 20 }, (_, s) => F.pickRound(all, learner({}), s).join(",")));
  assert.ok(orders.size > 15);
  const openers = new Set(Array.from({ length: 20 }, (_, s) => F.pickRound(all, learner({}), s)[0]));
  assert.ok(openers.size > 1, "a round does not always open with the first fact listed");
});
test("an empty level gives an empty round", () => {
  assert.deepStrictEqual(F.pickRound([], learner({}), 1), []);
});
test("a missed fact comes back GAP questions later, never beside itself", () => {
  const round = keys(20);
  assert.strictEqual(F.requeueAt(round, 2, "f2"), 2 + 1 + F.GAP);
  assert.strictEqual(F.requeueAt(round, 18, "f18"), 20, "near the end it goes last");
  const crowded = ["a", "b", "c", "d", "x", "e", "f"];
  assert.strictEqual(F.requeueAt(crowded, 0, "x"), 6, "not beside another x");
  const many = keys(20 + F.EXTRA_MAX);
  assert.strictEqual(F.requeueAt(many, 3, "f3"), -1, "a round grows by at most EXTRA_MAX");
});
test("quick: right within QUICK_MS and without a hint", () => {
  assert.strictEqual(F.isQuick(F.QUICK_MS, false), true);
  assert.strictEqual(F.isQuick(F.QUICK_MS + 1, false), false);
  assert.strictEqual(F.isQuick(1200, true), false);
  assert.strictEqual(F.isQuick(-5, false), false);
});

console.log(failed ? `\n${failed} failed` : "\nok: the facts drill behaves as specified");
process.exit(failed ? 1 : 0);
