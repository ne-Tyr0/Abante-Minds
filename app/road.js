/* Abante Minds — the reward road (decided with the owner, 3 November 2026).
   One permanent ladder of rewards: no seasons, nothing to buy, nothing
   random, and no learning locked behind it. Each step opens with a streak
   or with a number of levels cleared (the path and Basics together),
   whichever comes first, so a learner who cannot practise every day, on a
   shared phone, still moves along. A step reached stays reached.
   Pure, like challenge.js: the store gives it the best streak ever and the
   levels cleared, and keeps the shields and what has been shown. */
(function () {
  "use strict";

  var STEPS = [
    { streak: 3, levels: 3, rewards: [{ kind: "colour", key: 5 }, { kind: "colour", key: 6 }] },
    { streak: 7, levels: 8, rewards: [{ kind: "shield" }] },
    { streak: 14, levels: 15, rewards: [{ kind: "colour", key: 7 }] },
    { streak: 30, levels: 25, rewards: [{ kind: "certificate", key: 30 }, { kind: "pattern", key: "kusikus" }] },
    { streak: 50, levels: 35, rewards: [{ kind: "shield" }, { kind: "pattern", key: "triangles" }] },
    { streak: 100, levels: 50, rewards: [{ kind: "certificate", key: 100 }, { kind: "flame", key: "blue" }] },
    { streak: 150, levels: 65, rewards: [{ kind: "pattern", key: "hexagons" }] },
    { streak: 200, levels: 80, rewards: [{ kind: "shield" }] },
    { streak: 250, levels: 90, rewards: [{ kind: "pattern", key: "stars" }] },
    { streak: 300, levels: null, rewards: [{ kind: "shield" }] },
    { streak: 365, levels: null, rewards: [{ kind: "flame", key: "purple" }, { kind: "certificate", key: 365 }] }
  ];
  /* Past the table: 400 days, 500 days and every 100 after, a shield each. */
  var AFTER = 400, EVERY = 100;
  /* As with Duolingo's streak freezes, two can be held; one more is lost. */
  var MAX_SHIELDS = 2;
  var LISTS = { colour: "colours", frame: "frames", pattern: "patterns", flame: "flames", certificate: "certificates" };

  /* Step i, counting from 0. */
  function step(i) {
    var s = i < STEPS.length ? STEPS[i] : { streak: AFTER + (i - STEPS.length) * EVERY, levels: null, rewards: [{ kind: "shield" }] };
    return { n: i + 1, streak: s.streak, levels: s.levels, rewards: s.rewards };
  }

  /* A streak of this many days is a milestone: it has a step of its own. */
  function isMilestone(days) {
    if (days >= AFTER) return (days - AFTER) % EVERY === 0;
    return STEPS.some(function (s) { return s.streak === days; });
  }

  /* How a step opens for this learner: "streak", "levels", or null. */
  function reachedBy(s, best, levels) {
    if (best >= s.streak) return "streak";
    return s.levels !== null && levels >= s.levels ? "levels" : null;
  }

  /* How many steps are reached. Both ladders rise, so the steps reached are
     always the first ones. */
  function reached(best, levels) {
    var n = 0;
    while (reachedBy(step(n), best, levels)) n++;
    return n;
  }

  /* Everything the first n steps give. */
  function unlocked(n) {
    var out = { colours: [], frames: [], patterns: [], flames: [], certificates: [], shields: 0 };
    for (var i = 0; i < n; i++) step(i).rewards.forEach(function (r) {
      if (r.kind === "shield") out.shields++;
      else out[LISTS[r.kind]].push(r.key);
    });
    return out;
  }

  /* New shields go in up to the most a learner can hold. */
  function credit(held, fresh) {
    return Math.min(MAX_SHIELDS, Math.max(0, held) + Math.max(0, fresh));
  }

  window.AM = window.AM || {};
  window.AM.road = {
    STEPS: STEPS, MAX_SHIELDS: MAX_SHIELDS,
    step: step, isMilestone: isMilestone, reachedBy: reachedBy, reached: reached,
    unlocked: unlocked, credit: credit
  };
})();
