/* Weekly totals tests: app/tally.js, the phone's side of counts-only sharing.
   Nothing is counted while sharing is off; totals add up per level, review
   interval, facts level, exam topic, feature and error; a finished week waits
   in the outbox and leaves it only once sent; turning sharing off or starting
   over clears everything; and every report the phone builds passes the
   server's own check (server/worker.js), with nothing in it that could point
   to a learner.

   Run:  node tests/tally.js        Exits 1 on any failure. */
"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { pathToFileURL } = require("url");

const ROOT = path.join(__dirname, "..");
const STORE = fs.readFileSync(path.join(ROOT, "app/store.js"), "utf8");
const TALLY = fs.readFileSync(path.join(ROOT, "app/tally.js"), "utf8");
const KEY = "abante-minds/tally";

let storage = {};
global.window = global;
global.location = { hash: "", reload: () => {} };
global.addEventListener = () => {};
global.localStorage = {
  getItem: (k) => (k in storage ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};

/* A fresh store and tally over a clean phone. */
function launch(sharing) {
  storage = {};
  global.AM = { content: { TOPICS: [], BASICS: [], facts: () => [], blueprintCompetencies: 1, examDate: "2027-01-30" } };
  new Function(STORE).call(global);
  new Function(TALLY).call(global);
  if (sharing) global.AM.store.setSetting("sharing", true);
  return { S: global.AM.store, T: global.AM.tally };
}
const box = () => JSON.parse(storage[KEY] || "null");
const day = (iso) => new Date(iso + "T09:00:00");

let failed = 0;
const queue = [];
/* Tests share one fake phone, so they run one at a time, async ones too. */
function test(name, fn) { queue.push([name, fn]); }

test("weeks are numbered the ISO way, as the server numbers them", () => {
  const { T } = launch(false);
  assert.strictEqual(T.isoWeek(day("2026-10-26")), "2026-W44");
  assert.strictEqual(T.isoWeek(day("2026-01-01")), "2026-W01");
  assert.strictEqual(T.isoWeek(day("2026-12-31")), "2026-W53");
  assert.strictEqual(T.isoWeek(day("2027-01-01")), "2026-W53", "the first days of a year can belong to the last week of the one before");
  assert.strictEqual(T.isoWeek(day("2025-12-29")), "2026-W01", "and the last days of a year to the next one's first week");
});

test("sharing starts off, and nothing is counted while it is off", () => {
  const { S, T } = launch(false);
  assert.strictEqual(S.settings().sharing, false);
  T.answer("decimals", "add-and-subtract", true, 0);
  T.roundFinished("decimals", "add-and-subtract");
  T.review(3, true);
  T.fact("times", "2-5-10", true, true);
  T.exam([{ key: "decimals", right: 2, asked: 3 }]);
  T.feature("badge-card");
  T.error("load-failed");
  assert.strictEqual(storage[KEY], undefined, "not even an empty box is kept");
  assert.deepStrictEqual(T.pending(), []);
  assert.strictEqual(storage[KEY], undefined, "and asking what would be sent keeps nothing either");
});

test("with sharing on, the week's totals add up", () => {
  const { T } = launch(true);
  T.answer("decimals", "add-and-subtract", true, 0);
  T.answer("decimals", "add-and-subtract", false, 2);
  T.answer("decimals", "add-and-subtract", true, 1);
  T.roundFinished("decimals", "add-and-subtract");
  T.roundLeft("fractions", "parts");
  T.review(1, true);
  T.review(1, false);
  T.review(7, true);
  T.fact("times", "2-5-10", true, true);
  T.fact("times", "2-5-10", false, false);
  T.exam([{ key: "decimals", right: 2, asked: 3 }, { key: "time", right: 0, asked: 1 }]);
  T.feature("badge-card");
  T.feature("badge-card");
  T.error("load-failed");
  const t = box().current;
  assert.deepStrictEqual(t.levels, {
    "decimals/add-and-subtract": { answered: 3, right: 2, hints: 3, finished: 1 },
    "fractions/parts": { left: 1 }
  });
  assert.deepStrictEqual(t.review, { 1: { right: 1, wrong: 1 }, 7: { right: 1 } });
  assert.deepStrictEqual(t.facts, { "times/2-5-10": { answered: 2, right: 1, quick: 1 } });
  assert.deepStrictEqual(t.exams, { taken: 1, topics: { decimals: { right: 2, asked: 3 }, time: { right: 0, asked: 1 } } });
  assert.deepStrictEqual(t.features, { "badge-card": 2 });
  assert.deepStrictEqual(t.errors, { "load-failed": 1 });
});

test("a number stops at the cap", () => {
  const { T } = launch(true);
  for (let i = 0; i < 5010; i++) T.feature("badge-card");
  assert.strictEqual(box().current.features["badge-card"], 5000);
  T.answer("decimals", "add-and-subtract", false, 9000);
  assert.strictEqual(box().current.levels["decimals/add-and-subtract"].hints, 5000);
});

test("a report carries the week, the build and the totals, and nothing that points to a learner", () => {
  const { S, T } = launch(true);
  S.set({ profile: { name: "Ligaya Mendoza", school: "Poblacion, Pilar", colorKey: 2 } });
  T.answer("decimals", "add-and-subtract", true, 0);
  const t = box().current;
  assert.deepStrictEqual(Object.keys(t).sort(), ["app", "errors", "exams", "facts", "features", "levels", "review", "v", "week"]);
  assert.strictEqual(t.app, String(S.APP_BUILD));
  const text = JSON.stringify(t);
  for (const banned of ["Ligaya", "Poblacion", S.participantCode(), "participant", "id", "time", "at"]) {
    assert.ok(!new RegExp("\\b" + banned + "\\b").test(text), "no " + banned + " in " + text);
  }
});

test("a finished week waits in the outbox; an empty week is not kept", () => {
  const { T } = launch(true);
  assert.deepStrictEqual(T.pending(day("2026-10-20")), [], "nothing yet");
  T.answer("decimals", "add-and-subtract", true, 0);
  const now = box().current.week;
  const later = new Date(Date.now() + 7 * 86400000);
  const out = T.pending(later);
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0].week, now);
  assert.strictEqual(box().current.week, T.isoWeek(later), "a new week starts empty");
  assert.deepStrictEqual(box().current.levels, {});
  const evenLater = new Date(Date.now() + 14 * 86400000);
  assert.strictEqual(T.pending(evenLater).length, 1, "the empty week between is not queued");
});

test("at most eight finished weeks wait; past that the oldest go", () => {
  const { T } = launch(true);
  for (let w = 0; w < 10; w++) {
    T.pending(new Date(Date.now() + w * 7 * 86400000));
    const b = box(); b.current.features["badge-card"] = w + 1; storage[KEY] = JSON.stringify(b);
  }
  const out = T.pending(new Date(Date.now() + 10 * 7 * 86400000));
  assert.strictEqual(out.length, 8);
  assert.deepStrictEqual(out.map((r) => r.features["badge-card"]), [3, 4, 5, 6, 7, 8, 9, 10]);
});

test("turning sharing off and clearing, or starting over, leaves nothing", () => {
  const { S, T } = launch(true);
  T.answer("decimals", "add-and-subtract", true, 0);
  S.setSetting("sharing", false);
  T.clear();
  assert.strictEqual(storage[KEY], undefined);
  S.setSetting("sharing", true);
  T.answer("decimals", "add-and-subtract", true, 0);
  S.reset();
  assert.strictEqual(storage[KEY], undefined, "starting over clears the totals too");
});

test("without an address, nothing is ever sent", async () => {
  const { T } = launch(true);
  let called = 0;
  global.fetch = () => { called++; return Promise.resolve({ ok: true }); };
  T.answer("decimals", "add-and-subtract", true, 0);
  T.pending(new Date(Date.now() + 7 * 86400000));
  assert.strictEqual(T.endpoint(), null, "the app ships with no address");
  assert.strictEqual(await T.flush(new Date(Date.now() + 7 * 86400000)), 0);
  assert.strictEqual(called, 0);
});

test("with an address, finished weeks go oldest first and leave only once taken", async () => {
  const { T } = launch(true);
  T._setEndpoint("https://totals.example/v1/tally");
  const sent = [];
  let fail = false;
  global.fetch = (url, opts) => { sent.push(JSON.parse(opts.body).features["badge-card"]); assert.strictEqual(opts.credentials, "omit"); return Promise.resolve({ ok: !fail }); };
  for (let w = 0; w < 3; w++) {
    T.pending(new Date(Date.now() + w * 7 * 86400000));
    const b = box(); b.current.features["badge-card"] = w + 1; storage[KEY] = JSON.stringify(b);
  }
  const at = new Date(Date.now() + 3 * 7 * 86400000);
  fail = true;
  assert.strictEqual(await T.flush(at), 0);
  assert.deepStrictEqual(sent, [1], "a refused week stops the run");
  assert.strictEqual(box().outbox.length, 3, "and nothing leaves the outbox");
  fail = false;
  sent.length = 0;
  assert.strictEqual(await T.flush(at), 3);
  assert.deepStrictEqual(sent, [1, 2, 3]);
  assert.strictEqual(box().outbox.length, 0);
  T._setEndpoint(null);
});

test("every report the phone builds passes the server's check", async () => {
  const W = await import(pathToFileURL(path.join(ROOT, "server/worker.js")).href);
  const { T } = launch(true);
  T.answer("decimals", "add-and-subtract", true, 2);
  T.roundLeft("decimals", "add-and-subtract");
  T.review(3, false);
  T.fact("times", "2-5-10", true, true);
  T.exam([{ key: "decimals", right: 2, asked: 3 }]);
  ["streak-screen", "badge-card", "sound-off", "vibration-on", "calm-on", "theme-dark", "theme-auto"].forEach((f) => T.feature(f));
  T.error("load-failed");
  const later = new Date(Date.now() + 7 * 86400000);
  const [report] = T.pending(later);
  assert.deepStrictEqual(W.validate(report, later), { ok: true });
  assert.ok(W.rows(report).length > 10);
});

(async () => {
  for (const [name, fn] of queue) {
    try { await fn(); console.log("ok   " + name); }
    catch (e) { failed++; console.log("FAIL " + name + "\n       " + e.message.split("\n")[0]); }
  }
  console.log(failed ? `\n${failed} failed` : "\nok: weekly totals count only what they should");
  process.exit(failed ? 1 : 0);
})();
