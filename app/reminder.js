/* Abante Minds — the practice reminder (decided with the owner, 3 and 4
   November 2026). The phone's own calendar does the reminding: the app has
   no server and sends nothing, and the reminder lives in the calendar, where
   the learner can delete it.
   Phones differ. An iPhone home-screen app cannot be trusted to hand over a
   calendar file it makes itself, so each time has a ready-made file on the
   site (reminders/, written by tools/reminders.js). Google Calendar on
   Android cannot import a file at all, so there it is a link that opens
   Google Calendar with the daily event filled in; the link holds the event's
   name and time, nothing about the learner. It is the one outside address
   in the app, allowed by name in tests/invariants.js (owner, 4 Nov 2026):
   the learner opens it; the app loads nothing from it.
   Pure, apart from reading which phone it is on. */
(function () {
  "use strict";

  var HOURS = [15, 16, 17, 18, 19, 20, 21];   /* on the hour, after school */
  var DEFAULT_HOUR = 17;
  var TITLE = "Abante Minds: math practice";
  var DETAILS = "Ten questions, or one quick challenge. Open Abante Minds from your home screen.";
  var MINUTES = 15;

  function two(n) { return (n < 10 ? "0" : "") + n; }

  /* 15 -> "3 PM". */
  function label(hour) {
    var h = hour % 12 || 12;
    return h + (hour < 12 ? " AM" : " PM");
  }

  function icsPath(hour) { return "reminders/practice-" + two(hour) + "00.ics"; }

  /* Google Calendar's "add event" link: a daily event at the hour, from
     `day` (YYYY-MM-DD). Times without a Z are read in the learner's own
     time zone. */
  function googleLink(hour, day) {
    var d = String(day).replace(/-/g, "");
    var end = hour * 60 + MINUTES;
    var dates = d + "T" + two(hour) + "0000/" + d + "T" + two(Math.floor(end / 60)) + two(end % 60) + "00";
    return "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent(TITLE) +
      "&details=" + encodeURIComponent(DETAILS) +
      "&dates=" + dates +
      "&recur=" + encodeURIComponent("RRULE:FREQ=DAILY");
  }

  /* An iPhone or iPad, including an iPad that says it is a Mac. */
  function isApple(ua, touchPoints) {
    return /iPhone|iPad|iPod/.test(ua || "") || (/Macintosh/.test(ua || "") && (touchPoints || 0) > 1);
  }
  function onApple() {
    return isApple(navigator.userAgent, navigator.maxTouchPoints);
  }

  window.AM = window.AM || {};
  window.AM.reminder = {
    HOURS: HOURS, DEFAULT_HOUR: DEFAULT_HOUR, TITLE: TITLE, DETAILS: DETAILS, MINUTES: MINUTES,
    label: label, icsPath: icsPath, googleLink: googleLink, isApple: isApple, onApple: onApple
  };
})();
