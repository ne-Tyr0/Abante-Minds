/* Mutation test for tests/reminder.js: break the practice reminder's times,
   calendar file, Google link and phone check one way at a time, and require
   the tests to fail. The files on the site are copied in as they are, so a
   mutant that changes a file's text is caught as a stale file too.

   Run:  node tests/mutation/reminder.js        Exits 1 if any mutant survives. */
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const REPO = path.join(__dirname, "..", "..");
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "am-reminder-"));
const FILES = { app: "app/reminder.js", tool: "tools/reminders.js" };
const SRC = {};
Object.keys(FILES).forEach((k) => { SRC[k] = fs.readFileSync(path.join(REPO, FILES[k]), "utf8").split("\r\n").join("\n"); });

const M = [
  ["app", "a morning time", "var HOURS = [15, 16, 17, 18, 19, 20, 21];", "var HOURS = [9, 16, 17, 18, 19, 20, 21];"],
  ["app", "the default not offered", "var DEFAULT_HOUR = 17;", "var DEFAULT_HOUR = 22;"],
  ["app", "noon reads as nought", "var h = hour % 12 || 12;", "var h = hour % 12;"],
  ["app", "every time PM", "(hour < 12 ? \" AM\" : \" PM\")", "\" PM\""],
  ["app", "the file named by its hour only", "return \"reminders/practice-\" + two(hour) + \"00.ics\";", "return \"reminders/practice-\" + hour + \".ics\";"],
  ["tool", "a time zone pinned", "two(hour) + \"0000\",\n", "two(hour) + \"0000Z\",\n"],
  ["tool", "weekly, not daily", "\"RRULE:FREQ=DAILY\",", "\"RRULE:FREQ=WEEKLY\","],
  ["tool", "no alert", "    \"BEGIN:VALARM\",\n", ""],
  ["tool", "the alert an hour early", "\"TRIGGER:PT0M\",", "\"TRIGGER:-PT1H\","],
  ["tool", "one event for every hour", "\"UID:abante-minds-practice-\" + two(hour) + \"00@ne-tyr0.github.io\",", "\"UID:abante-minds-practice@ne-tyr0.github.io\","],
  ["tool", "lines end in LF", "].join(\"\\r\\n\");", "].join(\"\\n\");"],
  ["tool", "commas not escaped", "R.DETAILS.replace(/,/g, \"\\\\,\")", "R.DETAILS"],
  ["app", "the Google end not fifteen minutes on", "var end = hour * 60 + MINUTES;", "var end = hour * 60 + 60;"],
  ["app", "the Google link in UTC", "+ two(hour) + \"0000/\" + d", "+ two(hour) + \"0000Z/\" + d"],
  ["app", "the Google link not repeating", "\"&recur=\" + encodeURIComponent(\"RRULE:FREQ=DAILY\");", "\"\";"],
  ["app", "the Google link from a fixed day", "var d = String(day).replace(/-/g, \"\");", "var d = \"20261101\";"],
  ["app", "an iPad that says it is a Mac missed", "|| (/Macintosh/.test(ua || \"\") && (touchPoints || 0) > 1)", ""],
  ["app", "every Mac an iPad", "(/Macintosh/.test(ua || \"\") && (touchPoints || 0) > 1)", "/Macintosh/.test(ua || \"\")"]
];

for (const dir of ["app", "tools", "tests", "reminders"]) fs.mkdirSync(path.join(WORK, dir), { recursive: true });
Object.keys(FILES).forEach((k) => fs.writeFileSync(path.join(WORK, FILES[k]), SRC[k]));
fs.copyFileSync(path.join(REPO, "tests/reminder.js"), path.join(WORK, "tests/reminder.js"));
fs.readdirSync(path.join(REPO, "reminders")).forEach((f) => fs.copyFileSync(path.join(REPO, "reminders", f), path.join(WORK, "reminders", f)));

let caught = 0, bad = 0;
for (const [which, name, from, to] of M) {
  if (SRC[which].split(from).length !== 2) { bad++; console.log("BAD   " + name + ": pattern not found once"); continue; }
  fs.writeFileSync(path.join(WORK, FILES[which]), SRC[which].replace(from, () => to));
  const r = spawnSync(process.execPath, [path.join(WORK, "tests/reminder.js")], { encoding: "utf8" });
  fs.writeFileSync(path.join(WORK, FILES[which]), SRC[which]);
  const fails = (r.stdout.match(/^FAIL .*/gm) || []).map((l) => l.slice(5));
  if (r.status !== 0) { caught++; console.log("ok    " + name + "  <- " + (fails[0] || "crashed")); }
  else console.log("MISS  " + name);
}
fs.rmSync(WORK, { recursive: true, force: true });
console.log("TOTAL " + caught + "/" + M.length + " reminder mutants caught" + (bad ? ", " + bad + " patterns not found" : ""));
process.exit(caught === M.length ? 0 : 1);
