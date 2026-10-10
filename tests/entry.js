/* Answer-entry tests: what each key does to the boxes a learner types into,
   for a number, a fraction and a mixed number. The keypad and a hardware
   keyboard both go through these rules, so this is the keypad's behaviour.

   Run:  node tests/entry.js        Exits 1 on any failure. */
"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");

global.window = global;
global.AM = {};
new Function(fs.readFileSync(path.join(__dirname, "..", "app/entry.js"), "utf8")).call(global);
const E = global.AM.entry;

let failed = 0;
function test(name, fn) {
  try { fn(); console.log("ok   " + name); }
  catch (e) { failed++; console.log("FAIL " + name + "\n       " + e.message.split("\n")[0]); }
}
const keys = (e, seq) => seq.split("").reduce((s, k) => k === ">" ? E.next(s) : k === "<" ? E.del(s) : E.press(s, k), e);

test("a number takes digits and one decimal point", () => {
  const e = keys(E.create("number"), "12.5.0");
  assert.strictEqual(E.text(e), "12.50");
});
test("a number stops at the field's width", () => {
  assert.strictEqual(E.text(keys(E.create("number"), "123456789")), "1234567");
  assert.strictEqual(E.NUMBER_MAX, 7);
});
test("keys a number cannot take are ignored", () => {
  const e = E.create("number");
  for (const k of ["-", "/", " ", "a", "Next", "", "12"]) assert.strictEqual(E.press(e, k), e, JSON.stringify(k));
});
test("delete removes the last character", () => {
  assert.strictEqual(E.text(keys(E.create("number"), "3.5<")), "3.");
  assert.strictEqual(E.text(keys(E.create("number"), "<<")), "");
});
test("a fraction starts in the numerator and moves to the denominator", () => {
  const e = keys(E.create("fraction"), "3>4");
  assert.strictEqual(e.box, "den");
  assert.strictEqual(E.text(e), "3/4");
});
test("a fraction box takes no decimal point and at most three digits", () => {
  const e = keys(E.create("fraction"), "1.2345>9.");
  assert.deepStrictEqual(e.parts, { num: "123", den: "9" });
});
test("next stops at the last box", () => {
  const e = keys(E.create("fraction"), "1>2>>>");
  assert.strictEqual(e.box, "den");
  assert.strictEqual(E.text(e), "1/2");
});
test("delete in an empty box steps back to the box before", () => {
  let e = keys(E.create("mixed"), "2>3>4");
  e = keys(e, "<");
  assert.deepStrictEqual([e.box, E.text(e)], ["den", "2 3/"]);
  e = keys(e, "<");
  assert.strictEqual(e.box, "num");
  e = keys(e, "<<<");
  assert.deepStrictEqual([e.box, e.parts], ["whole", { whole: "", num: "", den: "" }]);
});
test("a tapped box takes the keys", () => {
  let e = keys(E.create("mixed"), "1>2>3");
  e = E.focus(e, "whole");
  e = keys(e, "4");
  assert.strictEqual(E.text(e), "14 2/3");
  assert.strictEqual(E.focus(e, "nowhere"), e);
});
test("a mixed number reads as whole, then fraction", () => {
  assert.strictEqual(E.text(keys(E.create("mixed"), "2>3>4")), "2 3/4");
  assert.strictEqual(E.text(keys(E.create("mixed"), ">7>4")), "7/4");
  assert.strictEqual(E.text(keys(E.create("mixed"), "5")), "5");
});
test("complete: what can be checked", () => {
  assert.strictEqual(E.complete(E.create("number")), false);
  assert.strictEqual(E.complete(keys(E.create("number"), ".")), false);
  assert.strictEqual(E.complete(keys(E.create("number"), ".5")), true);
  assert.strictEqual(E.complete(keys(E.create("fraction"), "3")), false);
  assert.strictEqual(E.complete(keys(E.create("fraction"), "3>4")), true);
  assert.strictEqual(E.complete(keys(E.create("mixed"), "2>3")), false);
  assert.strictEqual(E.complete(keys(E.create("mixed"), "2")), true);
  assert.strictEqual(E.complete(keys(E.create("mixed"), ">3>4")), true);
});
test("isEmpty", () => {
  assert.strictEqual(E.isEmpty(E.create("mixed")), true);
  assert.strictEqual(E.isEmpty(keys(E.create("mixed"), ">>4")), false);
});
test("state is never changed in place", () => {
  const e = E.create("fraction");
  const before = JSON.stringify(e);
  keys(e, "1>2<<");
  E.focus(e, "den");
  assert.strictEqual(JSON.stringify(e), before);
});
test("a time is typed as hours, then minutes", () => {
  assert.strictEqual(E.text(keys(E.create("time"), "1405")), "14:05", "two digits of hours move on to the minutes");
  assert.strictEqual(E.text(keys(E.create("time"), "9>05")), "9:05");
  assert.strictEqual(E.text(keys(E.create("time"), "0000")), "00:00");
  assert.strictEqual(E.text(keys(E.create("time"), "23>599")), "23:59");
  assert.strictEqual(E.text(keys(E.create("time"), "12005")), "12:00", "minutes stop at two digits");
  assert.strictEqual(E.text(keys(E.create("time"), "9.>3.0")), "9:30", "a time has no decimal point");
});
test("only a real time can be typed", () => {
  assert.strictEqual(E.text(keys(E.create("time"), "24")), "2:", "no hour 24");
  assert.strictEqual(E.text(keys(E.create("time"), "30")), "3:", "no hour 30");
  assert.strictEqual(E.text(keys(E.create("time"), "10>7")), "10:", "no 70 minutes");
  assert.strictEqual(E.text(keys(E.create("time"), "10>6")), "10:", "no 60 minutes");
});
test("a time is complete with its hours and both digits of its minutes", () => {
  assert.strictEqual(E.complete(keys(E.create("time"), "14")), false);
  assert.strictEqual(E.complete(keys(E.create("time"), "140")), false);
  assert.strictEqual(E.complete(keys(E.create("time"), "1405")), true);
  assert.strictEqual(E.complete(keys(E.create("time"), "9>05")), true);
  assert.strictEqual(E.complete(keys(E.create("time"), ">05")), false);
});
test("delete steps back from the minutes to the hours", () => {
  assert.strictEqual(E.text(keys(E.create("time"), "1405<<<")), "14:");
  assert.strictEqual(E.text(keys(E.create("time"), "1405<<<<")), "1:");
});
test("an unknown kind is refused", () => {
  assert.throws(() => E.create("ratio"), /no answer entry/);
});

console.log(failed ? `\n${failed} failed` : "\nok: answer entry behaves as specified");
process.exit(failed ? 1 : 0);
