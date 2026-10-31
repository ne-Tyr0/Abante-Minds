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
  var APP_BUILD = 59;           /* this build of the app: the number in sw.js's CACHE (tests/invariants.js) */

  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dayBefore(iso) {
    var d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function weekOf(iso) {
    var d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() - weekdayIndex(iso));
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
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
      signedIn: false,             /* from the old sign-in; kept in old records, no longer read */
      profile: null,               /* {name, school, colorKey, iconKey}; the name may be blank */
      levels: {},                  /* "topic/level": {correct, attempts, cleared, lessonSeen} */
      facts: {},                   /* fact key: {seen, right, miss, days, last}; days are the days it was right and quick */
      review: {},                  /* missed questions coming back: key: {topic, template, tier, seed, pinnedAt, step, due, added} */
      challenge: null,             /* the challenge round: {best: {mode: result}, played: {mode: n}, daily: {day, mode: result}} */
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
      lastSession: null,
      participant: null,           /* the pseudonymous code on every logged answer, made when first needed */
      settings: null,              /* {sound, vibration, calm}; null until changed, read through settings() */
      badges: {},                  /* badge key: {at, shiny, before, seen}; see "badges" below */
      badgesSince: null,           /* the day badges were first counted */
      showcase: null,              /* up to three badge keys pinned on Profile; null shows the newest */
      reviewsFixed: 0,             /* missed questions put right in review, for Improver */
      welcomeDue: false,           /* back after a few days away: Welcome back on the next answer */
      streakShownDay: null,        /* the day the streak screen last showed */
      forgivenDay: null,           /* the last missed day forgiven, so a streak carried on */
      forgivenWeek: null           /* the week (its Monday) that day fell in: one a week */
    };
  }

  /* Sound and vibration start on, as most learning apps do; a phone on
     silent stays silent whatever this says. Calm turns the celebrations
     into a still frame, and is on by itself when the phone asks for reduced
     motion. */
  var DEFAULT_SETTINGS = { sound: true, vibration: true, calm: false, theme: "auto" };
  /* A setting with named choices; every other setting is on or off. Auto
     follows the phone's own light or dark setting. */
  var SETTING_CHOICES = { theme: ["auto", "light", "dark"] };
  function validSetting(name, value) {
    return SETTING_CHOICES[name] ? SETTING_CHOICES[name].indexOf(value) > -1 : typeof value === "boolean";
  }
  function settings() {
    var saved = state.settings || {}, out = {};
    Object.keys(DEFAULT_SETTINGS).forEach(function (k) {
      out[k] = validSetting(k, saved[k]) ? saved[k] : DEFAULT_SETTINGS[k];
    });
    return out;
  }
  function setSetting(name, value) {
    if (!(name in DEFAULT_SETTINGS)) return;
    var v = SETTING_CHOICES[name] ? value : !!value;
    if (!validSetting(name, v)) return;
    var next = settings();
    next[name] = v;
    state.settings = next;
    commit();
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
    /* One missed day a week is forgiven (decided 2026-10-31): a phone with no
       data or a shared handset should not cost a learner their streak. Two
       days in a row, or a second in the same week, still end it. */
    if (state.lastActiveDay && gap !== null && gap > 1) {
      var missed = dayBefore(t);
      if (gap === 2 && state.forgivenWeek !== weekOf(missed)) {
        state.forgivenDay = missed;
        state.forgivenWeek = weekOf(missed);
      } else {
        state.streakDays = 0;
        state.resetToday = true;
      }
    }
    if (state.lastActiveDay && gap !== null && gap >= WELCOME_GAP) state.welcomeDue = true;

    /* Roll the week strip when we cross into a new Monday-based week. */
    var iso = weekOf(t);
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
    var carried = gap === 1 || (gap === 2 && state.forgivenDay === dayBefore(t));
    state.streakDays = carried ? state.streakDays + 1 : 1;
    state.lastActiveDay = t;
    state.week[weekdayIndex(t)] = true;
    if (carried || gap === null) state.resetToday = false;
    awardStreak();
    if (state.welcomeDue) { state.welcomeDue = false; award("welcome"); }
  }

  /* ---------- levels ---------- */
  function levelKey(topic, level) { return topic + "/" + level; }

  function levelState(topic, level) {
    var s = state.levels[levelKey(topic, level)];
    var out = {
      correct: s ? s.correct : 0, attempts: s ? s.attempts : 0,
      cleared: !!(s && s.cleared), lessonSeen: !!(s && s.lessonSeen)
    };
    if (s && s.left) out.left = true;   /* a round of it was left partway; see leaveLevel */
    return out;
  }

  function saveLevel(topic, level, s) { state.levels[levelKey(topic, level)] = s; }

  /* One answer. Only a first try moves the level: right adds to it, and the
     level clears when it reaches CLEAR_TARGET. Any answer counts as practice
     for the streak. */
  function recordAnswer(topic, level, right, firstTry) {
    rollDay();
    markPractice();
    var s = levelState(topic, level), clearedNow = false, badge = null;
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
    if (clearedNow) {
      badge = levelBadgeKey(topic, level);
      award(badge, { shiny: shinyLevel(s) });
    }
    commit();
    return { cleared: clearedNow, badge: badge, shiny: !!(badge && state.badges[badge].shiny) };
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

  /* Within a round the numbers also follow the learner (decided 2026-10-26):
     ADAPT_RUN first tries right in a row step one tier harder, and a first
     try wrong steps one back, never below the level's own floor (tierFor) and
     never more than ADAPT_MAX above it. Tier 3 is the hardest a level draws
     from, and a cleared level always asks at 4. `a` is the round's state,
     {boost, run}; a new round starts again at the floor. `prev`, the tier of
     the question just asked, keeps a rise to one tier at a time: the floor
     can rise on the same answer that earns a step. */
  var ADAPT_RUN = 3, ADAPT_MAX = 2;
  function adaptStep(a, right) {
    var boost = (a && a.boost) || 0, run = (a && a.run) || 0;
    if (!right) return { boost: Math.max(0, boost - 1), run: 0 };
    run += 1;
    if (run >= ADAPT_RUN) return { boost: Math.min(ADAPT_MAX, boost + 1), run: 0 };
    return { boost: boost, run: run };
  }
  function adaptiveTier(topic, level, a, prev) {
    var floor = tierFor(topic, level);
    if (floor >= 4) return 4;
    var tier = Math.min(3, floor + ((a && a.boost) || 0));
    return prev ? Math.max(floor, Math.min(tier, prev + 1)) : tier;
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
    var now = f.days.length >= MASTERY_DAYS;
    var badges = now && !was ? awardFactLevels() : [];
    commit();
    return { mastered: now && !was, lost: was && !now, badges: badges };
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

  /* ---------- the attempt log ----------
     One row per answer, right or wrong, first try or not: enough to rebuild
     the exact question (template, tier, seed or pinned position, format and
     pack version) and to see how it was answered (what was given, the
     mistake it matched, how long it took, how many hints and steps were
     seen). No question text, and nothing that names the learner: only the
     participant code below. Append-only and ring-buffered at LOG_MAX
     (RESEARCH-PLAN.md item 8). */
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
  /* ---------- the participant code ----------
     A pseudonymous code, AM-XXXX-XXXX, made on the phone the first time it
     is needed and kept with the learner's record: seven random Crockford
     base32 characters (no I, L, O or U, so it survives handwriting) and a
     check character that catches any one of them copied wrong. It names no
     one; the researcher keeps the sheet linking codes to names, and starting
     over gives a new one (RESEARCH-PLAN.md item 18). Every logged answer
     carries it, so two learners sharing a phone can be told apart. */
  var CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  function codeCheck(chars) {
    /* Odd weights, each coprime to 32: a wrong character always moves the sum. */
    var sum = 0;
    for (var i = 0; i < chars.length; i++) sum += (2 * i + 1) * CODE_ALPHABET.indexOf(chars.charAt(i));
    return CODE_ALPHABET.charAt(sum % 32);
  }
  function isParticipantCode(code) {
    var m = /^AM-([0-9A-HJKMNP-TV-Z]{4})-([0-9A-HJKMNP-TV-Z]{4})$/.exec(String(code));
    if (!m) return false;
    var chars = m[1] + m[2];
    return codeCheck(chars.slice(0, 7)) === chars.charAt(7);
  }
  function newParticipantCode() {
    var bytes = new Uint8Array(7);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(bytes);
    else for (var k = 0; k < 7; k++) bytes[k] = Math.floor(Math.random() * 256);
    var chars = "";
    for (var j = 0; j < 7; j++) chars += CODE_ALPHABET.charAt(bytes[j] % 32);
    chars += codeCheck(chars);
    return "AM-" + chars.slice(0, 4) + "-" + chars.slice(4);
  }
  function participantCode() {
    if (!isParticipantCode(state.participant)) {
      state.participant = newParticipantCode();
      write(state);
    }
    return state.participant;
  }

  function logAttempt(fields) {
    var row = { at: Date.now(), app: APP_BUILD, participant: participantCode() };
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
    if (done) {
      state.reviewsFixed = (state.reviewsFixed || 0) + 1;
      if (state.reviewsFixed >= IMPROVER_FIXES) award("improver");
    }
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
    awardExam(r.score, r.total);
    commit();
  }
  /* The last and the best, by the share right, the later one on a tie. */
  function examStats() {
    var list = state.exams || [];
    if (!list.length) return null;
    var best = list.reduce(function (b, x) { return x.score / x.total >= b.score / b.total ? x : b; }, list[0]);
    return { taken: list.length, last: list[list.length - 1], best: best };
  }

  /* ---------- the challenge round ----------
     What a round may ask: every level cleared, on the path and in Basics, and
     from a facts level only the facts already mastered. A review level asks
     nothing new and is never cleared, so it does not come up. A round keeps its best score for each
     mode, one play a day of today's challenge for each mode, and its badges.
     It counts as practice for the streak if anything was answered, and it
     never moves the path, Basics or review. */
  function challengePool() {
    var out = [];
    AM.content.TOPICS.concat(AM.content.BASICS || []).forEach(function (t) {
      if (t.ready === false) return;
      t.levels.forEach(function (lv) {
        if (lv.kind === "facts") {
          var keys = AM.content.facts(t.key, lv.id).filter(function (k) { return factState(k).mastered; });
          if (keys.length) out.push({ topic: t.key, level: lv.id, facts: keys });
        } else if (levelState(t.key, lv.id).cleared) out.push({ topic: t.key, level: lv.id });
      });
    });
    return out;
  }
  function challengeState() {
    return state.challenge || { best: {}, played: {}, daily: null };
  }
  function challengeStats(mode) {
    var c = challengeState();
    return { best: c.best[mode] || null, played: c.played[mode] || 0 };
  }
  /* Today's play of this mode, if it has been played. */
  function challengeDaily(mode) {
    var d = challengeState().daily;
    return d && d.day === today() ? d[mode] || null : null;
  }
  function recordChallenge(mode, r, daily) {
    rollDay();
    if (r.right + r.wrong > 0) markPractice();
    var c = challengeState();
    var entry = { score: r.score, right: r.right, wrong: r.wrong, bestRun: r.bestRun, top: r.top, day: today() };
    var previous = c.best[mode] || null;
    var better = r.score > 0 && (!previous || r.score > previous.score);
    if (better) c.best[mode] = entry;
    c.played[mode] = (c.played[mode] || 0) + 1;
    /* A round with nothing answered, such as a phone locked until time ran
       out, does not use up today's play. */
    if (daily && r.right + r.wrong > 0) {
      if (!c.daily || c.daily.day !== today()) c.daily = { day: today() };
      c.daily[mode] = entry;
    }
    state.challenge = c;
    if (mode === "sprint") {
      SPRINT_BADGES.forEach(function (n) { if (r.right >= n) award("challenge:sprint:" + n); });
    } else {
      LADDER_STEP_BADGES.forEach(function (n) { if (r.top >= n) award("challenge:ladder:" + n); });
      if (r.score >= LADDER_SCORE_BADGE) award("challenge:ladder:" + LADDER_SCORE_BADGE);
    }
    commit();
    return { better: better, previous: previous };
  }

  /* ---------- badges ----------
     Every level is a badge: each level on the path, and each practice or
     facts level in Basics (a review level asks facts already counted, so it
     has none). A level's badge is earned when the level clears, or for a
     facts level when every one of its facts is mastered; it is shiny when it
     got there without a single first try wrong. Special badges sit beside
     them: streaks of 3, 7, 14 and 30 days, practice exams at 60, 75 and 90
     per cent, six for the challenge round, Improver for five missed questions put right in review, and
     Welcome back for practising again after a few days away.

     A badge, once earned, is never taken away: a fact can be lost and a
     streak can end, and the badge stays. Badges began after levels did, so
     the first time they are counted (syncBadges, once the packs have loaded)
     every one the learner had already earned is awarded and marked
     `before`, with no "new" flag and no celebration. After that a badge is
     awarded the moment it is earned. */
  var STREAK_BADGES = [3, 7, 14, 30];
  var EXAM_BADGES = [60, 75, 90];
  var IMPROVER_FIXES = 5;
  var WELCOME_GAP = 3;          /* days between practice that count as away */
  var SHOWCASE_MAX = 3;
  var TIERS = ["Starter", "Explorer", "Builder", "Expert", "Champion", "Master"];

  /* The ladder is the same in every topic: the first level is always
     Starter and the last always Master, and the ones between are spread by
     how far through the topic they are, so Champion means nearly done
     whether a topic has four levels or six. */
  function tierName(number, total) {
    if (number >= total) return TIERS[5];
    if (number <= 1) return TIERS[0];
    return TIERS[Math.min(4, Math.max(1, Math.round((number - 1) / (total - 1) * 5)))];
  }

  var SPRINT_BADGES = [8, 15, 25], LADDER_STEP_BADGES = [2, 3], LADDER_SCORE_BADGE = 600;
  var SPECIALS = [
    { key: "streak:3", kind: "streak", tier: 1, name: "3-day streak", how: "Practise 3 days in a row." },
    { key: "streak:7", kind: "streak", tier: 2, name: "7-day streak", how: "Practise 7 days in a row." },
    { key: "streak:14", kind: "streak", tier: 3, name: "14-day streak", how: "Practise 14 days in a row." },
    { key: "streak:30", kind: "streak", tier: 4, name: "30-day streak", how: "Practise 30 days in a row." },
    { key: "exam:60", kind: "exam", tier: 1, name: "Exam 60%", how: "Score 60% or more on a practice exam." },
    { key: "exam:75", kind: "exam", tier: 2, name: "Exam 75%", how: "Score 75% or more on a practice exam." },
    { key: "exam:90", kind: "exam", tier: 3, name: "Exam 90%", how: "Score 90% or more on a practice exam." },
    { key: "challenge:sprint:8", kind: "challenge", tier: 1, name: "Sprint 8", how: "Get 8 right in a 60-second sprint." },
    { key: "challenge:sprint:15", kind: "challenge", tier: 2, name: "Sprint 15", how: "Get 15 right in a 60-second sprint." },
    { key: "challenge:sprint:25", kind: "challenge", tier: 3, name: "Sprint 25", how: "Get 25 right in a 60-second sprint." },
    { key: "challenge:ladder:2", kind: "challenge", tier: 1, name: "Ladder step 2", how: "Reach step 2 of the speed ladder." },
    { key: "challenge:ladder:3", kind: "challenge", tier: 2, name: "Ladder step 3", how: "Reach step 3 of the speed ladder." },
    { key: "challenge:ladder:600", kind: "challenge", tier: 3, name: "Ladder 600", how: "Score 600 in a speed ladder." },
    { key: "improver", kind: "improver", tier: 0, name: "Improver", how: "Put right " + IMPROVER_FIXES + " questions you missed before, in review." },
    { key: "welcome", kind: "welcome", tier: 0, name: "Welcome back", how: "Come back to practise after a few days away." }
  ];

  var syncing = false;          /* the first count of badges, for progress made before them */
  var recent = [];              /* keys awarded since the screens last asked */

  function award(key, extra) {
    var badges = state.badges || (state.badges = {});
    if (badges[key]) return false;
    var b = { at: today() };
    if (extra && extra.shiny) b.shiny = true;
    if (syncing) { b.before = true; b.seen = true; } else { b.seen = false; recent.push(key); }
    badges[key] = b;
    return true;
  }

  function levelBadgeKey(topic, level) { return "lv:" + levelKey(topic, level); }

  /* Shiny is a level got through without a first try wrong, and without a
     round of it left partway: leaving before a hard question must not be a
     way to stay perfect. */
  function shinyLevel(s) { return s.attempts === s.correct && !s.left; }

  /* A round left partway. What it got right stays; the level's badge, if it
     is not earned yet, can no longer be shiny. */
  function leaveLevel(topic, level) {
    if (badgeOf(levelBadgeKey(topic, level))) return;
    var s = levelState(topic, level);
    if (s.left) return;
    s.left = true;
    saveLevel(topic, level, s);
    commit();
  }

  /* Whether the level's badge could still come out shiny, for the question
     a learner is asked before leaving: not earned yet, never left, and no
     first try wrong so far (for a facts level, no fact of it ever missed). */
  function canStillShine(topic, level) {
    if (badgeOf(levelBadgeKey(topic, level))) return false;
    var s = levelState(topic, level);
    if (s.left) return false;
    var keys = AM.content.facts(topic, level);
    if (keys.length) return keys.every(function (k) { return factState(k).miss === 0; });
    return s.attempts === s.correct;
  }

  /* The next streak badge not yet earned, and how many days are left to it. */
  function nextStreakBadge() {
    var next = STREAK_BADGES.filter(function (n) { return !badgeOf("streak:" + n); })[0];
    return next ? { days: next, left: Math.max(1, next - state.streakDays) } : null;
  }
  /* Yesterday was missed and forgiven: what Home and the streak screen say. */
  function forgivenYesterday() {
    return !!state.forgivenDay && state.forgivenDay === dayBefore(today());
  }

  function awardStreak() {
    STREAK_BADGES.forEach(function (n) { if (state.streakDays >= n) award("streak:" + n); });
  }
  function awardExam(score, total) {
    var pct = total ? (score / total) * 100 : 0;
    EXAM_BADGES.forEach(function (n) { if (pct >= n) award("exam:" + n); });
  }

  /* A facts level is done when every one of its facts is mastered; shiny
     when none of them was ever missed. */
  function factLevelDone(topic, level) {
    var keys = AM.content.facts(topic, level);
    if (!keys.length) return null;
    var all = keys.map(factState);
    if (!all.every(function (f) { return f.mastered; })) return null;
    return { shiny: !levelState(topic, level).left && all.every(function (f) { return f.miss === 0; }) };
  }
  function awardFactLevels() {
    var got = [];
    (AM.content.BASICS || []).forEach(function (t) {
      t.levels.forEach(function (lv) {
        if (lv.kind !== "facts") return;
        var done = factLevelDone(t.key, lv.id);
        if (done && award(levelBadgeKey(t.key, lv.id), done)) got.push(levelBadgeKey(t.key, lv.id));
      });
    });
    return got;
  }

  /* Count every badge the learner has earned and not yet been given. The
     first count marks them `before`; later ones only catch up. */
  function syncBadges() {
    var first = !state.badgesSince;
    if (first) state.badgesSince = today();
    syncing = first;
    var before = Object.keys(state.badges || {}).length;
    AM.content.TOPICS.concat(AM.content.BASICS || []).forEach(function (t) {
      t.levels.forEach(function (lv) {
        if (lv.kind === "facts" || lv.kind === "review") return;
        var s = levelState(t.key, lv.id);
        if (s.cleared) award(levelBadgeKey(t.key, lv.id), { shiny: shinyLevel(s) });
      });
    });
    awardFactLevels();
    awardStreak();
    (state.exams || []).forEach(function (e) { awardExam(e.score, e.total); });
    if ((state.reviewsFixed || 0) >= IMPROVER_FIXES) award("improver");
    syncing = false;
    if (first || Object.keys(state.badges || {}).length !== before) commit();
  }

  /* Every badge there is, in path order then Basics then the specials, with
     what the learner has: for the shelf, the badge card and the counts. */
  function badgeOf(key) { return (state.badges || {})[key] || null; }
  function catalog() {
    var topics = [], earned = 0, total = 0;
    AM.content.TOPICS.concat(AM.content.BASICS || []).forEach(function (t) {
      if (t.ready === false) return;
      var own = t.levels.filter(function (lv) { return lv.kind !== "review"; });
      var levels = own.map(function (lv, i) {
        var key = levelBadgeKey(t.key, lv.id), b = badgeOf(key);
        total += 1;
        if (b) earned += 1;
        return {
          key: key, topic: t.key, level: lv.id, title: lv.title, kind: lv.kind || "practice",
          number: i + 1, total: own.length, tier: tierName(i + 1, own.length),
          name: t.label + " " + tierName(i + 1, own.length),
          earned: !!b, at: b ? b.at : null, shiny: !!(b && b.shiny), before: !!(b && b.before), seen: !b || b.seen !== false,
          left: !b && !!levelState(t.key, lv.id).left
        };
      });
      topics.push({
        key: t.key, label: t.label, icon: t.icon, colorKey: t.colorKey, track: t.track === "basics" ? "basics" : "path",
        levels: levels, earned: levels.filter(function (x) { return x.earned; }).length,
        complete: levels.length > 0 && levels.every(function (x) { return x.earned; })
      });
    });
    var specials = SPECIALS.map(function (sp) {
      var b = badgeOf(sp.key);
      return {
        key: sp.key, kind: sp.kind, tier: sp.tier, name: sp.name, how: sp.how,
        earned: !!b, at: b ? b.at : null, before: !!(b && b.before), seen: !b || b.seen !== false
      };
    });
    return { topics: topics, specials: specials, earned: earned, total: total };
  }

  function findBadge(key, cat) {
    cat = cat || catalog();
    for (var i = 0; i < cat.topics.length; i++) {
      var t = cat.topics[i];
      for (var j = 0; j < t.levels.length; j++) if (t.levels[j].key === key) return { topic: t, badge: t.levels[j] };
    }
    var sp = cat.specials.filter(function (x) { return x.key === key; })[0];
    return sp ? { topic: null, badge: sp } : null;
  }

  function markBadgeSeen(key) {
    var b = badgeOf(key);
    if (b && b.seen === false) { b.seen = true; commit(); }
  }

  /* The three on show: the learner's own picks while they are earned,
     otherwise the most recent, newest first. Badges are kept in the order
     they were earned, so on the same day the later one is the newer. */
  function showcase() {
    var badges = state.badges || {};
    var picked = (state.showcase || []).filter(function (k) { return badges[k]; });
    if (picked.length) return picked.slice(0, SHOWCASE_MAX);
    var order = Object.keys(badges);
    return order.slice().sort(function (a, b) {
      return badges[a].at < badges[b].at ? 1 : badges[a].at > badges[b].at ? -1 : order.indexOf(b) - order.indexOf(a);
    }).slice(0, SHOWCASE_MAX);
  }
  function isPinned(key) { return (state.showcase || []).indexOf(key) > -1; }
  /* Pin or unpin a badge. Pinning a fourth unpins the oldest pick. */
  function togglePin(key) {
    if (!badgeOf(key)) return false;
    var list = (state.showcase || []).filter(function (k) { return badgeOf(k); });
    var at = list.indexOf(key);
    if (at > -1) list.splice(at, 1);
    else { list.push(key); if (list.length > SHOWCASE_MAX) list.shift(); }
    state.showcase = list;
    commit();
    return at < 0;
  }

  /* Badges awarded since the screens last asked: for the summary, the exam
     result, the streak screen. Asking empties the list. */
  function takeRecent() { var out = recent; recent = []; return out; }

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
    settings: settings,
    setSetting: setSetting,
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
    adaptStep: adaptStep,
    adaptiveTier: adaptiveTier,
    ADAPT_RUN: ADAPT_RUN,
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
    syncBadges: syncBadges,
    leaveLevel: leaveLevel,
    canStillShine: canStillShine,
    catalog: catalog,
    findBadge: findBadge,
    tierName: tierName,
    markBadgeSeen: markBadgeSeen,
    challengePool: challengePool,
    challengeStats: challengeStats,
    challengeDaily: challengeDaily,
    recordChallenge: recordChallenge,
    showcase: showcase,
    isPinned: isPinned,
    togglePin: togglePin,
    takeRecent: takeRecent,
    nextStreakBadge: nextStreakBadge,
    forgivenYesterday: forgivenYesterday,
    SHOWCASE_MAX: SHOWCASE_MAX,
    IMPROVER_FIXES: IMPROVER_FIXES,
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
    participantCode: participantCode,
    isParticipantCode: isParticipantCode,
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
