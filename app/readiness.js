/* Abante Minds — how ready a learner is, and how their week went.

   Pure functions over the attempt log, like insights.js, so the tests can run
   them on any history. Readiness is an estimate and every screen says so: PSHS
   publishes no table of specifications, and this knows nothing of a real paper.
   A topic's score is how much of it is cleared, times how often its recent first
   tries were right: 3 of 6 levels at 80% right is 0.4. The whole is those scores
   by each topic's weight.

   The topics and their weights are passed in rather than read from the path, so
   a section with a narrower coverage, such as the NCE's own mathematics rather
   than all of MATATAG, can be measured the same way with its own list. */
(function () {
  "use strict";

  var AM = (window.AM = window.AM || {});

  var MIN = 5;          /* first tries in a topic before its right-share is used */
  var RECENT = 30;      /* the most recent first tries looked at, so old habits fade */
  var UNSEEN = 0.75;    /* the share assumed for levels cleared with too little in the log */
  var STRONG = 0.7, BUILDING = 0.35;
  var STEP = 5;         /* the whole is shown to the nearest step below: it is no finer */

  function counted(row) {
    return row.attempt === 1 && (row.kind === "practice" || row.kind === "exam");
  }

  /* Right and asked for each topic, over its RECENT latest first tries. */
  function recentByTopic(rows) {
    var by = Object.create(null);
    for (var i = rows.length - 1; i >= 0; i--) {
      var row = rows[i];
      if (!counted(row)) continue;
      var t = by[row.topic] || (by[row.topic] = { right: 0, asked: 0 });
      if (t.asked >= RECENT) continue;
      t.asked += 1;
      if (row.correct) t.right += 1;
    }
    return by;
  }

  function scoreTopic(t, seen) {
    var asked = seen ? seen.asked : 0;
    var share = asked >= MIN ? seen.right / asked : UNSEEN;
    var score = t.total ? (t.cleared / t.total) * share : 0;
    var band = !t.cleared && !asked ? "Not started" : score >= STRONG ? "Strong" : score >= BUILDING ? "Building" : "Getting started";
    return { key: t.key, label: t.label, weight: t.weight, score: score, band: band, started: t.cleared > 0 || asked >= MIN };
  }

  /* The whole, each topic's band, and where practice would add the most: the
     topic with the most weight still to gain. */
  function overall(rows, topics) {
    var seen = recentByTopic(rows);
    var scored = topics.filter(function (t) { return t.weight > 0 && t.total > 0; })
      .map(function (t) { return scoreTopic(t, seen[t.key]); });
    var weight = scored.reduce(function (a, t) { return a + t.weight; }, 0);
    var share = weight ? scored.reduce(function (a, t) { return a + t.weight * t.score; }, 0) / weight : 0;
    var focus = null, gain = 0;
    scored.forEach(function (t) {
      var g = t.weight * (1 - t.score);
      if (g > gain) { gain = g; focus = t; }
    });
    return {
      share: share,
      percent: Math.floor((share * 100 + 1e-9) / STEP) * STEP,
      started: scored.some(function (t) { return t.started; }),
      topics: scored, focus: focus
    };
  }

  /* A week of the log, from one midnight (ms) up to the next week's. Null if
     nothing was answered in it. Every kind of round counts: it was all practice. */
  function week(rows, from, to) {
    var days = Object.create(null), asked = 0, right = 0, tally = Object.create(null), any = false;
    rows.forEach(function (row) {
      if (row.at < from || row.at >= to) return;
      any = true;
      var d = new Date(row.at);
      days[d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate()] = true;
      if (row.attempt !== 1) return;
      asked += 1;
      if (row.correct) right += 1;
      if (!counted(row)) return;
      var t = tally[row.topic] || (tally[row.topic] = { key: row.topic, right: 0, asked: 0 });
      t.asked += 1;
      if (row.correct) t.right += 1;
    });
    if (!any) return null;
    var best = null;
    Object.keys(tally).forEach(function (k) {
      var t = tally[k];
      if (t.asked < MIN) return;
      if (!best || t.right / t.asked > best.right / best.asked) best = t;
    });
    return { days: Object.keys(days).length, asked: asked, right: right, best: best ? best.key : null };
  }

  AM.readiness = { MIN: MIN, RECENT: RECENT, UNSEEN: UNSEEN, STRONG: STRONG, BUILDING: BUILDING, STEP: STEP, overall: overall, week: week };
})();
