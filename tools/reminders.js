/* The practice reminder's calendar files, one per hour (app/reminder.js has
   the times and what the event says). Kept here, not in the app: the app
   only links to the files, and its shipped code names no outside address.

   Run:  node tools/reminders.js           writes reminders/*.ics
         node tools/reminders.js --check   exits 1 if any is missing or out of date (CI) */
"use strict";
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");
global.window = global;
global.AM = global.AM || {};
new Function(fs.readFileSync(path.join(REPO, "app/reminder.js"), "utf8")).call(global);
const R = global.AM.reminder;

const APP_URL = "https://ne-tyr0.github.io/Abante-Minds/";
const START_DAY = "20261101";   /* a fixed first day; the event repeats daily from it */
const two = (n) => (n < 10 ? "0" : "") + n;

/* The calendar file for an hour: a daily event at that time, in the phone's
   own time zone (no Z, no time zone), with an alert when it starts. RFC 5545
   lines end in CR LF, and commas in text are escaped. */
function ics(hour) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Abante Minds//Practice reminder//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:abante-minds-practice-" + two(hour) + "00@ne-tyr0.github.io",
    "DTSTAMP:20261104T000000Z",
    "DTSTART:" + START_DAY + "T" + two(hour) + "0000",
    "DURATION:PT" + R.MINUTES + "M",
    "RRULE:FREQ=DAILY",
    "SUMMARY:" + R.TITLE,
    "DESCRIPTION:" + R.DETAILS.replace(/,/g, "\\,"),
    "URL:" + APP_URL,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Time for math practice",
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    ""
  ].join("\r\n");
}

function main() {
  const check = process.argv.includes("--check");
  let stale = 0;
  fs.mkdirSync(path.join(REPO, "reminders"), { recursive: true });
  for (const hour of R.HOURS) {
    const file = path.join(REPO, R.icsPath(hour));
    const want = ics(hour);
    const have = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
    if (have === want) continue;
    if (check) { stale++; console.log("stale  " + R.icsPath(hour)); }
    else { fs.writeFileSync(file, want); console.log("wrote  " + R.icsPath(hour)); }
  }
  const extra = fs.readdirSync(path.join(REPO, "reminders")).filter((f) => !R.HOURS.some((h) => R.icsPath(h).endsWith("/" + f)));
  extra.forEach((f) => { stale++; console.log("extra  reminders/" + f); });
  if (check) console.log(stale ? stale + " reminder file(s) out of date: run node tools/reminders.js" : "reminder files match app/reminder.js");
  process.exit(check && stale ? 1 : 0);
}

module.exports = { ics: ics, APP_URL: APP_URL };
if (require.main === module) main();
