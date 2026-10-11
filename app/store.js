/* Abante Minds — learner state.
   Everything lives on the phone and stays there. There is no endpoint and no request:
   a session runs to the end with or without signal, and progress leaves the device
   only when the learner exports it. localStorage is wrapped because a locked-down
   school browser can throw on the first read, and losing progress is better than a
   white screen.

   Progress is a path of levels (content/packs). A level clears at CLEAR_TARGET
   answers right on the first try; a retry, or redoing a missed question after
   seeing its solution, does not count towards it. Clearing a level unlocks the
   next one in its topic.

   Beside the path, the Basics track keeps each fact (7 × 8, 56 ÷ 7) on its
   own: mastered when right and quick on MASTERY_DAYS different days.

   Every answer also goes into an attempt log under its own key, so the main
   record stays small to write. It stays on the phone like the rest. */
(function () {
  "use strict";

  var AM = (window.AM = window.AM || {});
  var KEY = "abante-minds/v1";  /* the storage key stays; the version lives inside */
  var VERSION = 2;
  var CLEAR_TARGET = 8;         /* first-try correct answers that clear a level */
  var SESSION_LENGTH = 10;
  var MASTERY_DAYS = 2;         /* different days a Basics fact must be right and quick */
  var LOG_KEY = "abante-minds/attempts";
  var LOG_MAX = 5000;           /* attempts kept; past it the oldest go */
  var APP_BUILD = 31;           /* this build of the app: the number in sw.js's CACHE (tests/invariants.js) */

  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function daysBetween(a, b) {
    if (!a || !b) return null;
    var ms = new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime();
    return Math.round(ms / 86400000);
  }
  /* Monday-first index, so the week strip starts where a school week does. */
  function weekdayIndex(iso) {
    var d = new Date(iso + "T00:00:00").getDay();
    return (d + 6) % 7;
  }

  function blank() {
    return {
      version: VERSION,
      installed: false,            /* set only on evidence: the browser reporting an install, or running from the home screen */
      installCardDismissed: false, /* "Not now" on the Home card; Profile keeps offering it */
      signedIn: false,
      profile: null,               /* {name, school, colorKey, iconKey, username} */
      levels: {},                  /* "topic/level": {correct, attempts, cleared, lessonSeen} */
      facts: {},                   /* fact key: {seen, right, miss, days, last}; days are the days it was right and quick */
      review: {},                  /* missed questions coming back: key: {topic, template, tier, seed, pinnedAt, step, due, added} */
      exams: [],                   /* practice exams, the last EXAMS_KEPT: {day, score, total, seconds, topics: {key: [right, asked]}} */
      lastLevel: null,             /* {topic, level}: where the learner last practised */
      streakDays: 0,
      lastActiveDay: null,
      lastRolledDay: null,
      weekStart: null,
      week: [false, false, false, false, false, false, false],
      resetToday: false,
      totalCorrect: 0,             /* answers right on the first try, on the path and in Basics */
      recoveryRequested: false,
      lastSession: null
    };
  }

  /* Version 1 counted tiers and the four placeholder topics. The path replaced
     both, so that progress is dropped. Who the learner is, the install state
     and the streak carry over. */
  var CARRIED = ["installed", "installCardDismissed", "signedIn", "profile", "streakDays",
    "lastActiveDay", "lastRolledDay", "weekStart", "week", "resetToday", "recoveryRequested"];

  function migrate(saved) {
    var base = blank();
    if (!saved || typeof saved !== "object") return base;
    if (saved.version === VERSION) {
      Object.keys(saved).forEach(function (k) { base[k] = saved[k]; });
      return base;
    }
    CARRIED.forEach(function (k) { if (k in saved) base[k] = saved[k]; });
    return base;
  }

  function read() {
    try {
      var raw = window.localStorage.getItem(KEY);
      return raw ? migrate(JSON.parse(raw)) : blank();
    } catch (e) {
      return blank();
    }
  }

  function write(s) {
    try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private mode: run in memory */ }
  }

  var state = read();
  var listeners = [];
  /* Connectivity is tracked only so the UI can say "offline" honestly. Nothing is ever
     sent: there is no endpoint, and progress leaves the phone only when the learner
     exports it. Do not reintroduce a sync indicator without a real request behind it. */
  var online = navigator.onLine !== false;

  function emit() { listeners.forEach(function (fn) { fn(state); }); }
  function commit() { write(state); emit(); }

  /* ---------- day roll ----------
     Called on boot and whenever a session starts. A missed day resets the
     streak. Nothing else is taken away: a cleared level stays cleared. */
  function rollDay() {
    var t = today();
    if (state.lastActiveDay === t) return;
    if (state.lastRolledDay === t) return;
    state.lastRolledDay = t;

    var gap = daysBetween(state.lastActiveDay, t);
    if (state.lastActiveDay && gap !== null && gap > 1) {
      state.streakDays = 0;
      state.resetToday = true;
    }

    /* Roll the week strip when we cross into a new Monday-based week. */
    var idx = weekdayIndex(t);
    var startOfWeek = new Date(t + "T00:00:00");
    startOfWeek.setDate(startOfWeek.getDate() - idx);
    var iso = startOfWeek.getFullYear() + "-" + pad(startOfWeek.getMonth() + 1) + "-" + pad(startOfWeek.getDate());
    if (state.weekStart !== iso) {
      state.weekStart = iso;
      state.week = [false, false, false, false, false, false, false];
    }
  }

  /* The first answer of the day is what extends a streak — opening the app is not
     practice. */
  function markPractice() {
    var t = today();
    if (state.lastActiveDay === t) return;
    var gap = daysBetween(state.lastActiveDay, t);
    state.streakDays = gap === 1 ? state.streakDays + 1 : 1;
    state.lastActiveDay = t;
    state.week[weekdayIndex(t)] = true;
    if (gap === 1 || gap === null) state.resetToday = false;
  }

  /* ---------- levels ---------- */
  function levelKey(topic, level) { return topic + "/" + level; }

  function levelState(topic, level) {
    var s = state.levels[levelKey(topic, level)];
    return {
      correct: s ? s.correct : 0, attempts: s ? s.attempts : 0,
      cleared: !!(s && s.cleared), lessonSeen: !!(s && s.lessonSeen)
    };
  }

  function saveLevel(topic, level, s) { state.levels[levelKey(topic, level)] = s; }

  /* One answer. Only a first try moves the level: right adds to it, and the
     level clears when it reaches CLEAR_TARGET. Any answer counts as practice
     for the streak. */
  function recordAnswer(topic, level, right, firstTry) {
    rollDay();
    markPractice();
    var s = levelState(topic, level), clearedNow = false;
    if (firstTry) {
      s.attempts += 1;
      if (right) {
        s.correct += 1;
        state.totalCorrect += 1;
        if (!s.cleared && s.correct >= CLEAR_TARGET) { s.cleared = true; clearedNow = true; }
      }
    }
    saveLevel(topic, level, s);
    state.lastLevel = { topic: topic, level: level };
    commit();
    return { cleared: clearedNow };
  }

  /* Practice that does not move a level (redoing missed questions) still
     keeps the streak. */
  function notePractice() {
    rollDay();
    markPractice();
    commit();
  }

  function markLessonSeen(topic, level) {
    var s = levelState(topic, level);
    s.lessonSeen = true;
    saveLevel(topic, level, s);
    commit();
  }

  /* How hard the numbers are: tier 1 on a fresh level, rising as the learner
     gets answers right, and tier 4 for reviewing a level already cleared. */
  function tierFor(topic, level) {
    var s = levelState(topic, level);
    if (s.cleared) return 4;
    return s.correct >= 6 ? 3 : s.correct >= 3 ? 2 : 1;
  }

  /* ---------- Basics facts ----------
     A fact is mastered when it has been right and quick (app/facts.js) on
     MASTERY_DAYS different days. A miss sends it back to be learnt again,
     mastered or not, which is what keeps the course worth repeating. A slow
     right answer is practice, but does not count towards mastering. */
  function factState(key) {
    var f = state.facts[key];
    var days = f ? f.days : [];
    return {
      seen: f ? f.seen : 0, right: f ? f.right : 0, miss: f ? f.miss : 0, days: days.slice(),
      mastered: days.length >= MASTERY_DAYS, quickToday: days.indexOf(today()) > -1, last: f ? f.last : null
    };
  }

  function recordFact(key, right, quick) {
    rollDay();
    markPractice();
    var t = today();
    var f = state.facts[key] || { seen: 0, right: 0, miss: 0, days: [], last: null };
    var was = f.days.length >= MASTERY_DAYS;
    f.seen += 1;
    f.last = t;
    if (right) {
      f.right += 1;
      state.totalCorrect += 1;
      if (quick && f.days.indexOf(t) < 0) f.days = f.days.concat(t).slice(-MASTERY_DAYS);
    } else {
      f.miss += 1;
      f.days = [];
    }
    state.facts[key] = f;
    commit();
    var now = f.days.length >= MASTERY_DAYS;
    return { mastered: now && !was, lost: was && !now };
  }

  /* ---------- the path, as the screens show it ---------- */
  function topicPath(t) {
    var levels = t.levels.map(function (lv, i) {
      var s = levelState(t.key, lv.id);
      return {
        id: lv.id, title: lv.title, number: i + 1, competencies: lv.competencies, hasLesson: lv.hasLesson,
        correct: Math.min(s.correct, CLEAR_TARGET), target: CLEAR_TARGET, attempts: s.attempts,
        cleared: s.cleared, lessonSeen: s.lessonSeen, unlocked: false
      };
    });
    levels.forEach(function (lv, i) { lv.unlocked = i === 0 || levels[i - 1].cleared; });
    var cleared = levels.filter(function (lv) { return lv.cleared; }).length;
    return {
      key: t.key, label: t.label, icon: t.icon, colorKey: t.colorKey, ready: t.ready,
      levels: levels, cleared: cleared, total: levels.length,
      current: levels.filter(function (lv) { return lv.unlocked && !lv.cleared; })[0] || null,
      done: t.ready && levels.length > 0 && cleared === levels.length
    };
  }

  /* The whole path: every topic in order, the levels cleared, the share of the
     blueprint those levels cover, the days to the exam, and where to go next --
     the level last practised if it is still open, else the first open level
     on the path. */
  function path() {
    var topics = AM.content.TOPICS.map(topicPath);
    var levelsCleared = 0, levelsTotal = 0, covered = {};
    topics.forEach(function (t) {
      levelsCleared += t.cleared;
      levelsTotal += t.total;
      t.levels.forEach(function (lv) {
        if (lv.cleared) lv.competencies.forEach(function (c) { covered[c] = true; });
      });
    });
    var reachable = AM.content.blueprintCompetencies;
    var next = null, last = state.lastLevel;
    if (last) {
      var lt = topics.filter(function (t) { return t.key === last.topic && t.ready; })[0];
      if (lt && lt.current) next = { topic: lt, level: lt.current };
    }
    if (!next) {
      topics.some(function (t) { if (t.ready && t.current) { next = { topic: t, level: t.current }; return true; } return false; });
    }
    return {
      topics: topics, levelsCleared: levelsCleared, levelsTotal: levelsTotal,
      coverage: reachable ? Object.keys(covered).length / reachable : 0,
      daysToExam: AM.content.examDate ? Math.max(0, daysBetween(today(), AM.content.examDate)) : null,
      next: next
    };
  }

  /* ---------- Basics, as the screens show it ----------
     Every level is open. A facts level counts its facts mastered; a practice
     level clears at CLEAR_TARGET as one on the path does, but opens nothing
     and counts for nothing on the path. A review level asks every fact, so
     it is not counted twice in the topic's totals. */
  function sum(list, field) { return list.reduce(function (n, x) { return n + x[field]; }, 0); }

  function basicsTopic(t) {
    var levels = t.levels.map(function (lv, i) {
      var keys = lv.kind === "practice" ? [] : AM.content.facts(t.key, lv.id);
      var mastered = keys.filter(function (k) { return factState(k).mastered; }).length;
      var s = levelState(t.key, lv.id);
      return {
        id: lv.id, title: lv.title, number: i + 1, kind: lv.kind, hasLesson: lv.hasLesson, lessonSeen: s.lessonSeen,
        facts: keys.length, mastered: mastered,
        correct: Math.min(s.correct, CLEAR_TARGET), target: CLEAR_TARGET, attempts: s.attempts, cleared: s.cleared,
        unlocked: true,
        done: lv.kind === "practice" ? s.cleared : keys.length > 0 && mastered === keys.length
      };
    });
    var own = levels.filter(function (lv) { return lv.kind !== "review"; });
    var factLevels = levels.filter(function (lv) { return lv.kind === "facts"; });
    var practice = levels.filter(function (lv) { return lv.kind === "practice"; });
    return {
      key: t.key, label: t.label, icon: t.icon, colorKey: t.colorKey, ready: true, grid: t.grid, track: "basics",
      levels: levels,
      facts: sum(factLevels, "facts"), mastered: sum(factLevels, "mastered"),
      cleared: practice.filter(function (lv) { return lv.cleared; }).length, practiceLevels: practice.length,
      done: own.every(function (lv) { return lv.done; }),
      next: own.filter(function (lv) { return !lv.done; })[0] || null
    };
  }

  function basics() { return (AM.content.BASICS || []).map(basicsTopic); }

  /* ---------- connectivity ----------
     Observed, never acted on. Losing signal changes nothing about what the app does;
     it only changes what the app says. */
  function setOnline(next) {
    if (online === next) return;
    online = next;
    emit();
  }

  window.addEventListener("online", function () { setOnline(true); });
  window.addEventListener("offline", function () { setOnline(false); });

  function badges() {
    var p = path();
    return [
      { key: "streak", label: "4 days", icon: "streak", earned: state.streakDays >= 4,
        face: "var(--brand-blue-100)", ink: "var(--brand-blue-600)" },
      { key: "level", label: "1st level", icon: "level-up", earned: p.levelsCleared > 0,
        face: "var(--skill-2-100)", ink: "var(--skill-2-600)" },
      { key: "topic", label: "1st topic", icon: "trophy", earned: p.topics.some(function (t) { return t.done; }),
        face: "var(--skill-3-100)", ink: "var(--skill-3-600)" },
      { key: "half", label: "Halfway", icon: "star", earned: p.coverage >= 0.5,
        face: "var(--skill-4-100)", ink: "var(--skill-4-600)" }
    ];
  }

  /* ---------- the attempt log ----------
     One row per answer, right or wrong, first try or not: enough to rebuild
     the exact question (template, tier, seed or pinned position, format and
     pack version) and to see how it was answered (what was given, the
     mistake it matched, how long it took, how many hints and steps were
     seen). No question text and nothing about the learner. Append-only and
     ring-buffered at LOG_MAX (RESEARCH-PLAN.md item 8). */
  var attemptLog = null;
  function loadLog() {
    if (attemptLog) return attemptLog;
    try { attemptLog = JSON.parse(window.localStorage.getItem(LOG_KEY) || "[]"); } catch (e) { attemptLog = []; }
    if (!Array.isArray(attemptLog)) attemptLog = [];
    return attemptLog;
  }
  function saveLog() {
    /* A full phone gives up the oldest fifth and tries once more; after that
       the log runs in memory, like the rest of the store in private mode. */
    for (var tries = 0; tries < 2; tries++) {
      try { window.localStorage.setItem(LOG_KEY, JSON.stringify(attemptLog)); return; }
      catch (e) { attemptLog.splice(0, Math.max(1, Math.floor(attemptLog.length / 5))); }
    }
  }
  function logAttempt(fields) {
    var row = { at: Date.now(), app: APP_BUILD };
    Object.keys(fields).forEach(function (k) { row[k] = fields[k]; });
    var log = loadLog();
    log.push(row);
    if (log.length > LOG_MAX) log.splice(0, log.length - LOG_MAX);
    saveLog();
    return row;
  }

  /* ---------- spaced review ----------
     A question missed on the path or in a practice exam comes back a day
     later, then three days after that, then seven (REVIEW_DAYS). Right on
     its first try moves it on; wrong sends it back to a day; right at the
     last step and it is done. It is kept as its recipe (template, tier, and
     seed or pinned place), so it comes back exactly as it was asked. At most
     REVIEW_MAX are kept, the oldest going first. A review never moves the
     path, but it keeps the streak (RESEARCH-PLAN.md item 17). */
  var REVIEW_DAYS = [1, 3, 7], REVIEW_MAX = 200;
  function addDays(day, n) {
    var d = new Date(day + "T12:00:00");
    d.setDate(d.getDate() + n);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function reviewKey(q) {
    return q.templateId + ":" + q.tier + ":" + (q.pinned ? "p" + q.pinnedAt : q.seed);
  }
  function scheduleReview(q) {
    var review = state.review || (state.review = {});
    var key = reviewKey(q);
    review[key] = {
      topic: q.topicKey, template: q.templateId, tier: q.tier,
      seed: q.pinned ? null : q.seed, pinnedAt: q.pinned ? q.pinnedAt : null,
      step: 0, due: addDays(today(), REVIEW_DAYS[0]), added: Date.now()
    };
    var keys = Object.keys(review);
    if (keys.length > REVIEW_MAX) {
      keys.sort(function (a, b) { return review[a].added - review[b].added; })
        .slice(0, keys.length - REVIEW_MAX).forEach(function (k) { delete review[k]; });
    }
    commit();
    return key;
  }
  /* Due today or earlier, the longest waiting first. */
  function reviewDue() {
    var review = state.review || {}, t = today();
    return Object.keys(review)
      .filter(function (k) { return review[k].due <= t; })
      .sort(function (a, b) {
        var x = review[a], y = review[b];
        return x.due < y.due ? -1 : x.due > y.due ? 1 : x.added - y.added;
      })
      .map(function (k) {
        var e = { key: k };
        Object.keys(review[k]).forEach(function (f) { e[f] = review[k][f]; });
        return e;
      });
  }
  /* The next day something comes back, when nothing is due now. */
  function reviewNext() {
    var review = state.review || {}, t = today();
    return Object.keys(review).map(function (k) { return review[k].due; })
      .filter(function (d) { return d > t; }).sort()[0] || null;
  }
  function recordReview(key, right) {
    var review = state.review || {}, e = review[key];
    if (!e) return null;
    rollDay();
    markPractice();
    var done = false;
    if (!right) { e.step = 0; e.due = addDays(today(), REVIEW_DAYS[0]); }
    else if (e.step + 1 >= REVIEW_DAYS.length) { delete review[key]; done = true; }
    else { e.step += 1; e.due = addDays(today(), REVIEW_DAYS[e.step]); }
    commit();
    return { done: done, due: done ? null : e.due };
  }
  function dropReview(key) {
    if (state.review && state.review[key]) { delete state.review[key]; commit(); }
  }

  /* ---------- practice exams ----------
     Kept apart from the path and Basics: an exam never clears a level or
     masters a fact. It is practice all the same, so it keeps the streak. */
  var EXAMS_KEPT = 20;
  function recordExam(r) {
    rollDay();
    markPractice();
    state.exams = (state.exams || []).concat([{ day: today(), score: r.score, total: r.total, seconds: r.seconds, topics: r.topics }])
      .slice(-EXAMS_KEPT);
    commit();
  }
  /* The last and the best, by the share right, the later one on a tie. */
  function examStats() {
    var list = state.exams || [];
    if (!list.length) return null;
    var best = list.reduce(function (b, x) { return x.score / x.total >= b.score / b.total ? x : b; }, list[0]);
    return { taken: list.length, last: list[list.length - 1], best: best };
  }

  function hasProgress() {
    return state.totalCorrect > 0 || Object.keys(state.levels).length > 0 || Object.keys(state.facts).length > 0;
  }

  /* Forget the learner entirely and start again at the splash screen. */
  function reset() {
    state = blank();
    attemptLog = [];
    try { window.localStorage.removeItem(KEY); window.localStorage.removeItem(LOG_KEY); } catch (e) { /* nothing to clear */ }
    window.location.reload();
  }

  AM.store = {
    CLEAR_TARGET: CLEAR_TARGET,
    SESSION_LENGTH: SESSION_LENGTH,
    MASTERY_DAYS: MASTERY_DAYS,
    VERSION: VERSION,
    LOG_MAX: LOG_MAX,
    APP_BUILD: APP_BUILD,

    get: function () { return state; },
    set: function (patch) {
      Object.keys(patch).forEach(function (k) { state[k] = patch[k]; });
      commit();
    },
    subscribe: function (fn) { listeners.push(fn); return function () {
      listeners = listeners.filter(function (f) { return f !== fn; });
    }; },

    rollDay: rollDay,
    recordAnswer: recordAnswer,
    notePractice: notePractice,
    markLessonSeen: markLessonSeen,
    levelState: levelState,
    tierFor: tierFor,
    topicPath: function (key) {
      var t = AM.content.TOPICS.filter(function (x) { return x.key === key; })[0];
      return t ? topicPath(t) : null;
    },
    path: path,
    factState: factState,
    recordFact: recordFact,
    basics: basics,
    basicsTopic: function (key) {
      var t = (AM.content.BASICS || []).filter(function (x) { return x.key === key; })[0];
      return t ? basicsTopic(t) : null;
    },
    badges: badges,
    hasProgress: hasProgress,
    recordExam: recordExam,
    scheduleReview: scheduleReview,
    reviewDue: reviewDue,
    reviewNext: reviewNext,
    recordReview: recordReview,
    dropReview: dropReview,
    REVIEW_DAYS: REVIEW_DAYS,
    REVIEW_MAX: REVIEW_MAX,
    examStats: examStats,
    EXAMS_KEPT: EXAMS_KEPT,
    logAttempt: logAttempt,
    attempts: function () { return loadLog().slice(); },
    reset: reset,
    today: today,
    migrate: migrate,

    isOnline: function () { return online; },
    /* Exposed so the offline screens are reachable without pulling the plug:
       AM.store.setOffline(true) in the console, or load the app with #offline. */
    setOffline: function (v) { setOnline(!v); }
  };

  rollDay();
  write(state); /* saves a migrated record straight away */
  if (location.hash === "#offline") setOnline(false);
})();
