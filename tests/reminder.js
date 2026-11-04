/* Practice reminder tests: the times and the Google Calendar link
   (app/reminder.js), the calendar files (tools/reminders.js), and that the
   files on the site are the ones the app links to. What the store keeps is
   in tests/progress.js.

   Run:  node tests/reminder.js        Exits 1 on any failure. */
"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const REPO = path.join(__dirname, "..");
global.window = global;
global.AM = {};
const T = require(path.join(REPO, "tools/reminders.js"));
const R = Object.assign({}, global.AM.reminder, { ics: T.ics, APP_URL: T.APP_URL });

let failed = 0;
function test(name, fn) {
  try { fn(); console.log("ok   " + name); }
  catch (e) { failed++; console.log("FAIL " + name + "\n       " + e.message.split("\n")[0]); }
}
const lines = (h) => R.ics(h).split("\r\n");
const field = (h, name) => (lines(h).find((l) => l.indexOf(name + ":") === 0) || "").slice(name.length + 1);

/* ---------- the times ---------- */
test("the times are on the hour, 3 PM to 9 PM", () => {
  assert.deepStrictEqual(R.HOURS, [15, 16, 17, 18, 19, 20, 21]);
  assert.deepStrictEqual(R.HOURS.map(R.label), ["3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM"]);
  assert.ok(R.HOURS.indexOf(R.DEFAULT_HOUR) > -1);
});
test("other hours read the way a clock says them", () => {
  assert.strictEqual(R.label(12), "12 PM");
  assert.strictEqual(R.label(0), "12 AM");
  assert.strictEqual(R.label(9), "9 AM");
});

/* ---------- the calendar file ---------- */
test("each hour has its own file", () => {
  assert.strictEqual(R.icsPath(15), "reminders/practice-1500.ics");
  assert.strictEqual(R.icsPath(21), "reminders/practice-2100.ics");
});
test("a file is one daily event at its hour, in the phone's own time", () => {
  assert.strictEqual(field(17, "DTSTART"), "20261101T170000", "no Z and no time zone: the phone's own");
  assert.strictEqual(field(9 + 12, "DTSTART"), "20261101T210000");
  assert.strictEqual(field(17, "RRULE"), "FREQ=DAILY");
  assert.strictEqual(field(17, "DURATION"), "PT15M");
});
test("it alerts when the event starts", () => {
  const l = lines(17);
  const a = l.indexOf("BEGIN:VALARM"), b = l.indexOf("END:VALARM");
  assert.ok(a > -1 && b > a);
  assert.ok(l.slice(a, b).indexOf("TRIGGER:PT0M") > -1);
  assert.ok(l.slice(a, b).indexOf("ACTION:DISPLAY") > -1);
});
test("each hour's event is its own, so two can sit side by side", () => {
  assert.notStrictEqual(field(15, "UID"), field(16, "UID"));
});
test("it is a well-formed calendar: CR LF lines, begun and ended, commas escaped", () => {
  const text = R.ics(17);
  assert.ok(/\r\n$/.test(text));
  assert.strictEqual(text.split("\n").length, text.split("\r\n").length, "every line ends in CR LF");
  assert.strictEqual(lines(17)[0], "BEGIN:VCALENDAR");
  assert.ok(lines(17).indexOf("END:VCALENDAR") > -1);
  assert.ok(lines(17).indexOf("VERSION:2.0") > -1);
  assert.ok(lines(17).indexOf("METHOD:PUBLISH") > -1);
  assert.ok(/\\,/.test(field(17, "DESCRIPTION")) && !/[^\\],/.test(field(17, "DESCRIPTION")));
});
test("it names the app and links to it, and says nothing about the learner", () => {
  assert.strictEqual(field(17, "SUMMARY"), R.TITLE);
  assert.strictEqual(field(17, "URL"), R.APP_URL);
  assert.ok(!/ATTENDEE|ORGANIZER|CONTACT/.test(R.ics(17)));
});

/* ---------- the files on the site ---------- */
test("the site has every hour's file, exactly as the app makes it", () => {
  R.HOURS.forEach((h) => {
    const file = path.join(REPO, R.icsPath(h));
    assert.ok(fs.existsSync(file), R.icsPath(h));
    assert.strictEqual(fs.readFileSync(file, "utf8"), R.ics(h), R.icsPath(h) + " is out of date: run node tools/reminders.js");
  });
});

/* ---------- Google Calendar ---------- */
const query = (url) => Object.fromEntries(new URL(url).searchParams);
test("the Google link adds a daily event at the hour, from today", () => {
  const q = query(R.googleLink(17, "2026-11-04"));
  assert.strictEqual(q.action, "TEMPLATE");
  assert.strictEqual(q.text, R.TITLE);
  assert.strictEqual(q.dates, "20261104T170000/20261104T171500");
  assert.strictEqual(q.recur, "RRULE:FREQ=DAILY");
});
test("its end is fifteen minutes on, in the phone's own time", () => {
  assert.strictEqual(query(R.googleLink(21, "2026-12-31")).dates, "20261231T210000/20261231T211500");
  assert.ok(!/Z/.test(query(R.googleLink(21, "2026-12-31")).dates));
});
test("it goes to Google Calendar and carries nothing about the learner", () => {
  const u = new URL(R.googleLink(17, "2026-11-04"));
  assert.strictEqual(u.origin + u.pathname, "https://calendar.google.com/calendar/render");
  assert.deepStrictEqual(Object.keys(query(u.href)).sort(), ["action", "dates", "details", "recur", "text"]);
});

/* ---------- which phone ---------- */
test("an iPhone, an iPad, and an iPad that says it is a Mac take the calendar file", () => {
  assert.ok(R.isApple("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", 5));
  assert.ok(R.isApple("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)", 5));
  assert.ok(R.isApple("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5));
});
test("Android and a Mac with no touch take the Google link", () => {
  assert.ok(!R.isApple("Mozilla/5.0 (Linux; Android 14; Pixel 8)", 5));
  assert.ok(!R.isApple("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0));
  assert.ok(!R.isApple("", 0));
});

console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
