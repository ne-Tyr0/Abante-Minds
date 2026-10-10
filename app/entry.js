/* Abante Minds — answer entry.
   What the learner has typed so far, held as boxes: one box for a number, a
   numerator over a denominator for a fraction, a whole number beside the
   two for a mixed number, and hours then minutes for a clock time. These are
   plain functions over a small state object, so the keypad, a hardware
   keyboard and the tests all go through the same rules. The engine (content.js) reads the finished text; this file only
   decides what each key does. */
(function () {
  "use strict";

  var AM = (window.AM = window.AM || {});

  var BOXES = {
    number: ["value"],
    fraction: ["num", "den"],
    mixed: ["whole", "num", "den"],
    time: ["hour", "minute"]
  };
  var NUMBER_MAX = 7; /* characters across the field */
  var BOX_MAX = 3;    /* digits in a fraction box */
  var CLOCK_MAX = 2;  /* digits of hours, and of minutes */

  function create(kind) {
    var boxes = BOXES[kind];
    if (!boxes) throw new Error("no answer entry of kind '" + kind + "'");
    var parts = {};
    boxes.forEach(function (b) { parts[b] = ""; });
    return { kind: kind, box: boxes[0], parts: parts };
  }

  function copy(e) {
    var parts = {};
    Object.keys(e.parts).forEach(function (b) { parts[b] = e.parts[b]; });
    return { kind: e.kind, box: e.box, parts: parts };
  }

  /* A digit, or a decimal point where a number can take one. A key that does
     not fit is ignored rather than an error: a tap must never break the
     screen. */
  function press(e, key) {
    var cur = e.parts[e.box];
    if (key === ".") {
      if (e.kind !== "number" || cur.indexOf(".") > -1) return e;
    } else if (!/^[0-9]$/.test(key)) {
      return e;
    }
    if (cur.length >= (e.kind === "number" ? NUMBER_MAX : e.kind === "time" ? CLOCK_MAX : BOX_MAX)) return e;
    if (e.kind === "time" && !onTheClock(e.box, cur + key)) return e;
    var n = copy(e);
    n.parts[n.box] = cur + key;
    /* Two digits of hours are all there can be, so the minutes come next. */
    if (n.kind === "time" && n.box === "hour" && n.parts.hour.length === CLOCK_MAX) n.box = "minute";
    return n;
  }

  /* A clock time can only be a real one: hours up to 23, and minutes up to
     59, so a first digit of minutes above 5 is refused. */
  function onTheClock(box, digits) {
    return box === "hour" ? +digits <= 23 : digits.length === CLOCK_MAX || +digits <= 5;
  }

  /* Delete the last character of the box in use. In an empty box, step back
     to the one before, so a learner can keep deleting across the fraction. */
  function del(e) {
    var n = copy(e);
    var cur = n.parts[n.box];
    if (cur.length) { n.parts[n.box] = cur.slice(0, -1); return n; }
    var boxes = BOXES[n.kind], i = boxes.indexOf(n.box);
    if (i > 0) n.box = boxes[i - 1];
    return n;
  }

  /* Move to the next box: whole, then numerator, then denominator; hours,
     then minutes. */
  function next(e) {
    var boxes = BOXES[e.kind], i = boxes.indexOf(e.box);
    if (i < 0 || i === boxes.length - 1) return e;
    var n = copy(e);
    n.box = boxes[i + 1];
    return n;
  }

  function focus(e, box) {
    if (!(box in e.parts) || box === e.box) return e;
    var n = copy(e);
    n.box = box;
    return n;
  }

  function isEmpty(e) {
    return Object.keys(e.parts).every(function (b) { return !e.parts[b]; });
  }

  /* Ready to check: a number with at least one digit; a fraction with both
     boxes filled; a mixed number with its fraction filled, or only a whole
     number, which is an answer the checker can judge; a time with its hours
     and both digits of its minutes. */
  function complete(e) {
    var p = e.parts;
    if (e.kind === "number") return /\d/.test(p.value);
    if (e.kind === "time") return !!p.hour && p.minute.length === CLOCK_MAX;
    if (e.kind === "fraction") return !!(p.num && p.den);
    if (p.num && p.den) return true;
    return !!p.whole && !p.num && !p.den;
  }

  /* The entry as the checker reads it: 36.5, 3/4, 2 3/4, 2, or 14:05. */
  function text(e) {
    var p = e.parts;
    if (e.kind === "number") return p.value;
    if (e.kind === "time") return p.hour + ":" + p.minute;
    var fraction = p.num + "/" + p.den;
    if (e.kind === "fraction") return fraction;
    if (!p.num && !p.den) return p.whole;
    return p.whole ? p.whole + " " + fraction : fraction;
  }

  AM.entry = {
    BOXES: BOXES, NUMBER_MAX: NUMBER_MAX, BOX_MAX: BOX_MAX, CLOCK_MAX: CLOCK_MAX,
    create: create, press: press, del: del, next: next, focus: focus,
    isEmpty: isEmpty, complete: complete, text: text
  };
})();
