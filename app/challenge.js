/* Abante Minds — the rules of the challenge round.

   Two timed modes, chosen by the owner on 2026-10-27 from three prototypes.
   The sprint is 60 seconds: as many as you can, and after eight right the
   numbers get bigger. The ladder is 90 seconds: three right in a row steps
   the questions up, to step 3 at most, and a miss steps them back.

   There are no lives and a miss costs nothing but the seconds it took. A
   right answer scores 10, or on the ladder 10 for each step it was asked at;
   five right in a row doubles that and ten triples it. A round never moves
   the path, Basics or review (app.js), so a bad one costs nothing either.

   Only the rules are here, with no screen and no clock of their own: `now` is
   always passed in. */
(function () {
  "use strict";

  var MODES = {
    sprint: { key: "sprint", name: "60-second sprint", label: "Sprint", seconds: 60 },
    ladder: { key: "ladder", name: "Speed ladder", label: "Ladder", seconds: 90 }
  };
  var POINTS = 10;
  var STEP_RUN = 3;             /* right in a row to climb a step of the ladder */
  var TOP_STEP = 3;
  var SPRINT_EASY = 8;          /* right answers before a sprint's numbers get bigger */
  var LOW_SECONDS = 10;         /* the clock turns coral for the last of them */

  function multiplier(run) { return run >= 10 ? 3 : run >= 5 ? 2 : 1; }

  function start(mode, seed, daily, now) {
    return {
      mode: mode, seed: seed, daily: !!daily, done: false,
      endsAt: now + MODES[mode].seconds * 1000,
      score: 0, right: 0, wrong: 0, run: 0, bestRun: 0,
      step: 1, top: 1, stepRun: 0, rose: false
    };
  }

  /* The tier of the next question: a ladder's step, or a sprint's stage. */
  function tier(g) {
    if (g.mode === "ladder") return g.step;
    return g.right < SPRINT_EASY ? 1 : 2;
  }

  /* One answer. A right one scores at the step it was asked, and counts
     itself in the run first, so the fifth in a row is the first doubled. */
  function answer(g, right) {
    var before = multiplier(g.run);
    if (right) {
      g.right += 1;
      g.run += 1;
      g.bestRun = Math.max(g.bestRun, g.run);
      g.score += POINTS * g.step * multiplier(g.run);
      if (g.mode === "ladder") {
        g.stepRun += 1;
        if (g.stepRun >= STEP_RUN && g.step < TOP_STEP) {
          g.step += 1;
          g.stepRun = 0;
          g.top = Math.max(g.top, g.step);
        }
      }
    } else {
      g.wrong += 1;
      g.run = 0;
      if (g.mode === "ladder") {
        g.stepRun = 0;
        g.step = Math.max(1, g.step - 1);
      }
    }
    g.rose = multiplier(g.run) > before;
    return g;
  }

  /* Whole seconds left, as the clock shows them, and the share of the bar. */
  function secondsLeft(g, now) { return Math.max(0, Math.ceil((g.endsAt - now) / 1000)); }
  function shareLeft(g, now) { return Math.max(0, Math.min(1, (g.endsAt - now) / (MODES[g.mode].seconds * 1000))); }
  function isLow(g, now) { return g.endsAt - now < LOW_SECONDS * 1000; }

  /* Today's challenge is drawn from the date and the mode, so it stays the
     same all day on this phone. Learners with different levels cleared get
     different questions, because a round only asks what its learner cleared. */
  function dailySeed(day, mode) {
    var h = mode === "ladder" ? 7 : 3, text = String(day);
    for (var i = 0; i < text.length; i++) h = (Math.imul(h, 31) + text.charCodeAt(i)) >>> 0;
    return h;
  }

  window.AM = window.AM || {};
  window.AM.challenge = {
    MODES: MODES, POINTS: POINTS, STEP_RUN: STEP_RUN, TOP_STEP: TOP_STEP, SPRINT_EASY: SPRINT_EASY,
    multiplier: multiplier, start: start, tier: tier, answer: answer,
    secondsLeft: secondsLeft, shareLeft: shareLeft, isLow: isLow, dailySeed: dailySeed
  };
})();
