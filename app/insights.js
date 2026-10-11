/* Abante Minds — strengths and gaps.
   What the attempt log says about the kinds of problem a learner handles.
   Every template is tagged with a problem type (its schema: change,
   comparing, equal groups, working backwards...), so the same arithmetic
   met in different stories can be told apart: a learner who handles change
   problems but not comparing ones, with the same numbers, learns something
   no score shows (RESEARCH-PLAN.md item 13).

   Pure functions over the log, like facts.js, so the tests can run them on
   any history. Only a first try counts, on the path or in a practice exam:
   a retry has seen the working, and Basics facts have their own mastery. */
(function () {
  "use strict";

  var AM = (window.AM = window.AM || {});

  var MIN = 5;        /* first tries before a kind of problem is worth reporting */
  var RECENT = 400;   /* the most recent rows looked at, so old habits fade */
  var GAP = 0.2;      /* how far apart the best and the worst must be to name them */

  /* The problem types in the learner's words. */
  var NAMES = {
    change: "An amount goes up or down",
    combine: "Putting amounts together",
    compare: "Comparing two amounts",
    "equal-groups": "Equal groups",
    rate: "Rates, like per kilo or per hour",
    "multiplicative-compare": "How many times as much",
    "part-whole": "A part of a whole",
    "work-backwards": "Working backwards",
    "missing-middle": "A missing step in the middle",
    "multi-step": "Several steps",
    "excess-info": "Setting aside numbers you do not need"
  };

  function counted(row) {
    return row.attempt === 1 && (row.kind === "practice" || row.kind === "exam");
  }

  /* Right and asked, by the key keyOf gives each counted row, in the order
     the keys first appear. */
  function tally(rows, keyOf) {
    var by = Object.create(null), order = [];
    rows.forEach(function (row) {
      if (!counted(row)) return;
      var key = keyOf(row);
      if (!key) return;
      if (!by[key]) { by[key] = { key: key, right: 0, asked: 0 }; order.push(key); }
      by[key].asked += 1;
      if (row.correct) by[key].right += 1;
    });
    return order.map(function (k) { return by[k]; });
  }

  /* The kinds of problem met at least MIN times, best first (more tries
     first on a tie), and the strongest and the weakest when they are at
     least GAP apart. */
  function summarize(log, typeOf) {
    var rows = log.slice(-RECENT);
    var types = tally(rows, function (row) { return typeOf(row.template); })
      .filter(function (t) { return t.asked >= MIN; })
      .map(function (t) { return { key: t.key, name: NAMES[t.key] || t.key, right: t.right, asked: t.asked, share: t.right / t.asked }; })
      .sort(function (a, b) { return b.share - a.share || b.asked - a.asked; });
    var best = types[0], worst = types[types.length - 1];
    var apart = types.length > 1 && best.share - worst.share >= GAP;
    return { types: types, strongest: apart ? best : null, weakest: apart ? worst : null };
  }

  AM.insights = { MIN: MIN, RECENT: RECENT, GAP: GAP, NAMES: NAMES, counted: counted, tally: tally, summarize: summarize };
})();
