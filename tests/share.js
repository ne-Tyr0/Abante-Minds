/* Share and count tests: what the streak milestone picture and the certificate
   may say (app/share.js), and the number that counts up on a round's result
   tiles (motion/moments.js). The pictures need a canvas, so they are checked
   by eye in the drafts; their words are checked here. Which streaks are
   milestones is the reward road's (tests/road.js).

   Run:  node tests/share.js        Exits 1 on any failure. */
"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const read = (f) => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
global.window = global;
global.AM = {};
new Function(read("app/share.js")).call(global);
const S = global.AM.share;

/* Frames run when a test says so, at the time it gives. */
let frames = [];
let PERF = 0;
global.requestAnimationFrame = (fn) => { frames.push(fn); };
Object.defineProperty(global, "performance", { value: { now: () => PERF }, configurable: true, writable: true });
new Function(read("motion/moments.js")).call(global);
const M = global.AbanteMinds.moments;
const frame = (ts) => { const due = frames; frames = []; due.forEach((fn) => fn(ts)); };
const number = () => ({ textContent: "", dataset: {}, isConnected: true });

let failed = 0;
function test(name, fn) {
  try { fn(); console.log("ok   " + name); }
  catch (e) { failed++; console.log("FAIL " + name + "\n       " + e.message.split("\n")[0]); }
}

/* ---------- the picture's words ---------- */
test("the picture takes the first name only", () => {
  assert.strictEqual(S.firstName("Maya Santos"), "Maya");
  assert.strictEqual(S.firstName("  Juan   Dela Cruz "), "Juan");
  assert.strictEqual(S.firstName("Ana"), "Ana");
});
test("no name gives no name", () => {
  assert.strictEqual(S.firstName(""), "");
  assert.strictEqual(S.firstName("   "), "");
  assert.strictEqual(S.firstName(null), "");
  assert.strictEqual(S.firstName(undefined), "");
});
test("a very long first name is cut short", () => {
  assert.strictEqual(S.firstName("Maximilianoaurelianus Cruz"), "Maximilianoaurelianu");
});
test("the line names the learner when they gave a name, and never their surname", () => {
  assert.strictEqual(S.caption(7, "Maya Santos"), "Maya practised math 7 days in a row");
  assert.strictEqual(S.caption(30, ""), "Practised math 30 days in a row");
  assert.strictEqual(S.caption(3, null), "Practised math 3 days in a row");
  assert.ok(S.caption(14, "Juan Dela Cruz").indexOf("Cruz") === -1);
});

/* ---------- the certificate's words ---------- */
test("a certificate says what the step was reached by", () => {
  assert.strictEqual(S.certificateLine({ by: "streak", days: 30, levels: 25 }), "for practising math 30 days in a row");
  assert.strictEqual(S.certificateLine({ by: "levels", days: 30, levels: 25 }), "for clearing 25 levels of Grade 6 math");
});
test("its date is written out", () => {
  assert.strictEqual(S.longDate("2026-11-03"), "3 November 2026");
  assert.strictEqual(S.longDate("2027-01-30"), "30 January 2027");
});
test("each flame has its four colours", () => {
  assert.deepStrictEqual(Object.keys(S.FLAMES), ["orange", "blue", "purple"]);
  Object.keys(S.FLAMES).forEach((k) => assert.strictEqual(S.FLAMES[k].length, 4, k));
});

/* ---------- the count ---------- */
test("a count starts at nought even when its first frame is timed before the call", () => {
  PERF = 1000;
  const el = number();
  M.count(el, 6, "", 650);
  frame(900);
  assert.strictEqual(el.textContent, "0");
});
test("it rises and never goes below nought or past its number", () => {
  PERF = 1000;
  const el = number(), seen = [];
  M.count(el, 80, "%", 650);
  [900, 1000, 1100, 1300, 1500, 1549, 1550].forEach((t) => { frame(t); seen.push(parseInt(el.textContent, 10)); });
  for (let i = 1; i < seen.length; i++) assert.ok(seen[i] >= seen[i - 1], "never goes down: " + seen.join(" "));
  assert.ok(seen.every((v) => v >= 0 && v <= 80), seen.join(" "));
  assert.strictEqual(el.textContent, "80%", "lands exactly, suffix and all");
  assert.strictEqual(frames.length, 0, "and stops asking for frames");
});
test("it ends exactly on its number, however the frames fall", () => {
  PERF = 0;
  const el = number();
  M.count(el, 100, "", 650);
  [0, 520, 598].forEach(frame);
  assert.strictEqual(el.textContent, "99", "nearly there at 92% of its time");
  frame(780);
  assert.strictEqual(el.textContent, "100");
});
test("a number marked done keeps what it was set to", () => {
  PERF = 0;
  const el = number();
  M.count(el, 6, "", 650);
  frame(10);
  el.dataset.done = "1";
  el.textContent = "6";
  frame(200);
  assert.strictEqual(el.textContent, "6");
  assert.strictEqual(frames.length, 0, "and the count lets go");
});
test("a number taken off the screen stops counting", () => {
  PERF = 0;
  const el = number();
  M.count(el, 9, "", 650);
  frame(10);
  el.isConnected = false;
  frame(100);
  assert.strictEqual(frames.length, 0);
});

console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
