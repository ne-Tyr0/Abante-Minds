/* Abante Minds — the facts drill: which facts a round asks, and when a
   missed one comes back.
   Basics facts (7 × 8, 56 ÷ 7) are mastered one at a time: right, and quick,
   on two different days (store.js decides when). The store keeps what the
   learner has done with each fact; this file decides what to ask next. Pure functions, with no
   storage and no screen, so the rules are tested on their own (tests/facts.js). */
(function () {
  "use strict";

  var AM = (window.AM = window.AM || {});

  var ROUND = 20;         /* questions in a round */
  var NEW_MAX = 6;        /* facts a round may introduce for the first time */
  var REVIEW_SLOTS = 3;   /* mastered facts each round keeps fresh, when there are any */
  var QUICK_MS = 4000;    /* a right answer this fast counts towards mastering the fact */
  var GAP = 3;            /* a missed fact comes back after this many others */
  var EXTRA_MAX = 5;      /* how many misses can lengthen a round */

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(list, r) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1)), tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }

  /* Least recently practised first; ties in a shuffled order, so two rounds
     on the same day do not ask the same facts in the same order. */
  function oldestFirst(keys, stateOf, r) {
    return shuffle(keys.slice(), r)
      .map(function (k, i) { return { k: k, last: stateOf(k).last || "", i: i }; })
      .sort(function (a, b) { return a.last < b.last ? -1 : a.last > b.last ? 1 : a.i - b.i; })
      .map(function (x) { return x.k; });
  }

  /* One round. stateOf(key) says what the learner has done with a fact:
     {seen, mastered, quickToday, last}. First come the facts still being
     learnt that have not yet been right and quick today, then up to NEW_MAX
     new ones in the order the level lists them, then the ones already done
     today. A few mastered facts always come along, so a fact that has slipped
     is caught. When everything is mastered the round is all review. A level
     with fewer facts than a round goes round again, the ones being learnt
     first, each pass shuffled and never the same fact twice running. */
  function pickRound(keys, stateOf, seed, size) {
    size = size || ROUND;
    var r = rng(seed);
    var due = [], fresh = [], doneToday = [], known = [];
    keys.forEach(function (k) {
      var s = stateOf(k);
      if (!s.seen) fresh.push(k);
      else if (s.mastered) known.push(k);
      else if (s.quickToday) doneToday.push(k);
      else due.push(k);
    });
    due = oldestFirst(due, stateOf, r);
    doneToday = oldestFirst(doneToday, stateOf, r);
    known = oldestFirst(known, stateOf, r);

    var review = known.slice(0, REVIEW_SLOTS);
    var learning = due.concat(fresh.slice(0, NEW_MAX), doneToday).slice(0, size - review.length);
    if (learning.length < size - review.length) review = known.slice(0, size - learning.length);

    var out = shuffle(learning.concat(review), r);
    var again = learning.length ? learning : review;
    while (out.length < size && again.length) {
      var pass = shuffle(again.slice(), r);
      if (pass.length > 1 && pass[0] === out[out.length - 1]) { pass[0] = pass[1]; pass[1] = out[out.length - 1]; }
      for (var i = 0; i < pass.length && out.length < size; i++) out.push(pass[i]);
    }
    return out;
  }

  /* Where a fact just missed comes back: GAP questions later, never next to
     itself, and not at all once misses have added EXTRA_MAX to the round. -1
     means it does not come back this round. */
  function requeueAt(keys, index, key, size) {
    if (keys.length >= (size || ROUND) + EXTRA_MAX) return -1;
    var pos = Math.min(index + 1 + GAP, keys.length);
    while (pos < keys.length && (keys[pos - 1] === key || keys[pos] === key)) pos++;
    return pos;
  }

  /* Right and quick, with no hint: what counts towards mastering a fact. */
  function isQuick(ms, usedHints) {
    return !usedHints && ms >= 0 && ms <= QUICK_MS;
  }

  AM.facts = {
    ROUND: ROUND, NEW_MAX: NEW_MAX, REVIEW_SLOTS: REVIEW_SLOTS, QUICK_MS: QUICK_MS,
    GAP: GAP, EXTRA_MAX: EXTRA_MAX,
    pickRound: pickRound,
    requeueAt: requeueAt,
    isQuick: isQuick
  };
})();
