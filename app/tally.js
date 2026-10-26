/* Abante Minds — this week's totals, shared only if the learner says yes.

   Counts only, decided 2026-10-26 (LEGAL-RESEARCH.md, "Update, 26 October").
   While sharing is on, the phone adds up the week's practice as plain totals:
   per level, questions answered, right first time and hints used, and rounds
   finished or left early; review results by how long the question waited;
   facts answered and quick; practice exams per topic; a few feature counts;
   error codes. After the week ends it sends those totals once. There is no
   ID, no device detail and no time of day, so one week's report cannot be
   linked to the next or told apart from anyone else's; the server adds it
   into running totals and throws it away (server/).

   Nothing is counted while sharing is off, and turning it off clears what has
   not been sent. ENDPOINT stays null until the owner approves a server, so
   until then nothing leaves the phone. */
(function () {
  "use strict";

  var KEY = "abante-minds/tally";
  var ENDPOINT = null;          /* the server's address, once approved; null sends nothing */
  var SCHEMA = 1;
  var OUTBOX_MAX = 8;           /* finished weeks kept unsent; past it the oldest go */
  var CAP = 5000;               /* the most any one number counts to in a week */

  /* The week as ISO 8601 numbers it, e.g. 2026-W44, from the phone's date. */
  function isoWeek(d) {
    var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    var yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    var week = Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
    return t.getUTCFullYear() + "-W" + (week < 10 ? "0" : "") + week;
  }

  function store() { return window.AM && window.AM.store; }
  function sharing() { var s = store(); return !!(s && s.settings().sharing); }
  function build() { var s = store(); return String((s && s.APP_BUILD) || 0); }

  function blank(week) {
    return { v: SCHEMA, week: week, app: build(), levels: {}, review: {}, facts: {}, exams: { taken: 0, topics: {} }, features: {}, errors: {} };
  }
  function load() {
    try {
      var box = JSON.parse(window.localStorage.getItem(KEY) || "null");
      if (box && typeof box === "object" && Array.isArray(box.outbox)) return box;
    } catch (e) { /* a box that cannot be read starts again */ }
    return { current: null, outbox: [] };
  }
  function save(box) {
    try { window.localStorage.setItem(KEY, JSON.stringify(box)); } catch (e) { /* a full phone loses this week's totals, nothing else */ }
  }
  function empty(t) {
    return !t || (!Object.keys(t.levels).length && !Object.keys(t.review).length && !Object.keys(t.facts).length &&
      !t.exams.taken && !Object.keys(t.features).length && !Object.keys(t.errors).length);
  }

  /* This week's totals, after moving a finished week to the outbox. */
  function roll(box, now) {
    var week = isoWeek(now || new Date());
    if (box.current && box.current.week !== week) {
      if (!empty(box.current)) box.outbox.push(box.current);
      while (box.outbox.length > OUTBOX_MAX) box.outbox.shift();
      box.current = null;
    }
    if (!box.current) box.current = blank(week);
    return box.current;
  }

  function add(obj, key, n) { obj[key] = Math.min(CAP, (obj[key] || 0) + (n === undefined ? 1 : n)); }
  function row(obj, key) { return obj[key] || (obj[key] = {}); }

  /* Every count goes through here: with sharing off nothing is counted. */
  function count(fn) {
    if (!sharing()) return;
    var box = load();
    fn(roll(box));
    save(box);
  }

  var tally = {
    isoWeek: isoWeek,
    endpoint: function () { return ENDPOINT; },

    /* One answer in a level on the path or a practice level in Basics. */
    answer: function (topic, level, rightFirst, hints) {
      count(function (t) {
        var r = row(t.levels, topic + "/" + level);
        add(r, "answered");
        if (rightFirst) add(r, "right");
        if (hints) add(r, "hints", hints);
      });
    },
    roundFinished: function (topic, level) { count(function (t) { add(row(t.levels, topic + "/" + level), "finished"); }); },
    roundLeft: function (topic, level) { count(function (t) { add(row(t.levels, topic + "/" + level), "left"); }); },
    /* A missed question come back after `interval` days: 1, 3 or 7. */
    review: function (interval, right) {
      count(function (t) { add(row(t.review, String(interval)), right ? "right" : "wrong"); });
    },
    fact: function (topic, level, right, quick) {
      count(function (t) {
        var r = row(t.facts, topic + "/" + level);
        add(r, "answered");
        if (right) add(r, "right");
        if (quick) add(r, "quick");
      });
    },
    /* A practice exam finished: right and asked per topic. */
    exam: function (byTopic) {
      count(function (t) {
        add(t.exams, "taken");
        (byTopic || []).forEach(function (x) {
          var r = row(t.exams.topics, x.key);
          add(r, "right", x.right || 0);
          add(r, "asked", x.asked || 0);
        });
      });
    },
    feature: function (name) { count(function (t) { add(t.features, name); }); },
    error: function (code) { count(function (t) { add(t.errors, code); }); },

    /* Sharing turned off, or the learner starting over: nothing is kept. */
    clear: function () {
      try { window.localStorage.removeItem(KEY); } catch (e) { /* nothing to clear */ }
    },

    /* What would be sent, oldest week first: each is the week, the app's
       build and the totals above, and nothing else. */
    pending: function (now) {
      if (!sharing()) return [];
      var box = load();
      roll(box, now);
      save(box);
      return box.outbox.slice();
    },

    /* Send finished weeks, oldest first; a week leaves the outbox only once
       the server has taken it. Without an ENDPOINT nothing is sent. */
    flush: function (now) {
      if (!ENDPOINT || !sharing() || typeof fetch !== "function") return Promise.resolve(0);
      if (typeof navigator !== "undefined" && navigator.onLine === false) return Promise.resolve(0);
      var sent = 0;
      return tally.pending(now).reduce(function (p, report) {
        return p.then(function (ok) {
          if (!ok) return false;
          return fetch(ENDPOINT, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(report),
            keepalive: true, credentials: "omit"
          }).then(function (r) {
            if (!r.ok) return false;
            var box = load();
            box.outbox = box.outbox.filter(function (w) { return w.week !== report.week; });
            save(box);
            sent += 1;
            return true;
          }, function () { return false; });
        });
      }, Promise.resolve(true)).then(function () { return sent; });
    },

    /* For the tests only: an address to send to. */
    _setEndpoint: function (url) { ENDPOINT = url; }
  };

  window.AM = window.AM || {};
  window.AM.tally = tally;
})();
