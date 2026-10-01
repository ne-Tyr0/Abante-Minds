/* Abante Minds — learner state.
   Everything lives on the phone and stays there. There is no endpoint and no request:
   a session runs to the end with or without signal, and progress leaves the device
   only when the learner exports it. localStorage is wrapped because a locked-down
   school browser can throw on the first read, and losing progress is better than a
   white screen. */
(function () {
  "use strict";

  var AM = (window.AM = window.AM || {});
  var KEY = "abante-minds/v1";
  var TIER_TARGET = 20;      /* twenty correct on a tier opens the next */
  var TOPIC_TARGET = 20;     /* four topics, twenty questions each */
  var SESSION_LENGTH = 10;
  var RECOVERY_RUN = 5;      /* five correct in a row after a demote */

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
      version: 1,
      installed: false,
      signedIn: false,
      profile: null,               /* {name, school, colorKey, iconKey, username} */
      tier: 1,
      tierProgress: 0,
      demoted: false,
      recoveryRun: 0,
      topics: { money: 0, percent: 0, ratio: 0, measure: 0 },
      lastTopic: null,
      streakDays: 0,
      lastActiveDay: null,
      lastRolledDay: null,
      weekStart: null,
      week: [false, false, false, false, false, false, false],
      resetToday: false,
      totalCorrect: 0,
      recoveryRequested: false,
      lastSession: null
    };
  }

  function read() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return blank();
      var parsed = JSON.parse(raw);
      var base = blank();
      Object.keys(parsed || {}).forEach(function (k) { base[k] = parsed[k]; });
      return base;
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
     streak, and a reset streak drops the learner one tier — which the practice
     screen then states calmly, inside the ordinary layout. */
  function rollDay() {
    var t = today();
    if (state.lastActiveDay === t) return;
    /* Boot, every session start and every answer call this. Demoting is a
       once-a-day event, so the roll has to be idempotent or opening the app
       twice after a missed day would cost two tiers. */
    if (state.lastRolledDay === t) return;
    state.lastRolledDay = t;

    var gap = daysBetween(state.lastActiveDay, t);
    if (state.lastActiveDay && gap !== null && gap > 1) {
      state.streakDays = 0;
      state.resetToday = true;
      if (state.tier > 1) {
        state.tier -= 1;
        state.tierProgress = Math.min(state.tierProgress, TIER_TARGET - 1);
        state.demoted = true;
        state.recoveryRun = 0;
      }
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

  /* ---------- answers ---------- */
  function recordAnswer(topicKey, correct) {
    rollDay();
    markPractice();

    if (!correct) {
      state.recoveryRun = 0;
      commit();
      return { tieredUp: false };
    }

    state.totalCorrect += 1;
    state.topics[topicKey] = Math.min(TOPIC_TARGET, (state.topics[topicKey] || 0) + 1);
    state.tierProgress += 1;

    var tieredUp = false;
    if (state.demoted) {
      state.recoveryRun += 1;
      if (state.recoveryRun >= RECOVERY_RUN && state.tier < 4) {
        state.tier += 1;
        state.tierProgress = 0;
        state.demoted = false;
        state.recoveryRun = 0;
        tieredUp = true;
      }
    }
    if (!tieredUp && state.tierProgress >= TIER_TARGET && state.tier < 4) {
      state.tier += 1;
      state.tierProgress = 0;
      state.demoted = false;
      tieredUp = true;
    }

    commit();
    return { tieredUp: tieredUp };
  }

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

  /* ---------- derived ---------- */
  function topicList() {
    return AM.content.TOPICS.map(function (t) {
      return {
        key: t.key, label: t.label, icon: t.icon, colorKey: t.colorKey,
        correct: state.topics[t.key] || 0,
        total: TOPIC_TARGET,
        color: "var(--skill-" + t.colorKey + "-600)",
        ratio: (state.topics[t.key] || 0) / TOPIC_TARGET
      };
    });
  }

  function badges() {
    return [
      { key: "streak", label: "4 days", icon: "streak", earned: state.streakDays >= 4,
        face: "var(--brand-blue-100)", ink: "var(--brand-blue-600)" },
      { key: "tier2", label: "Tier 2", icon: "level-up", earned: state.tier >= 2,
        face: "var(--skill-2-100)", ink: "var(--skill-2-600)" },
      { key: "tier3", label: "Tier 3", icon: "trophy", earned: state.tier >= 3,
        face: "var(--skill-3-100)", ink: "var(--skill-3-600)" },
      { key: "all4", label: "All 4", icon: "star",
        earned: topicList().every(function (t) { return t.correct >= TOPIC_TARGET; }),
        face: "var(--skill-4-100)", ink: "var(--skill-4-600)" }
    ];
  }

  function hasProgress() { return state.totalCorrect > 0; }

  /* Forget the learner entirely and start again at the splash screen. */
  function reset() {
    state = blank();
    try { window.localStorage.removeItem(KEY); } catch (e) { /* nothing to clear */ }
    window.location.reload();
  }

  AM.store = {
    TIER_TARGET: TIER_TARGET,
    TOPIC_TARGET: TOPIC_TARGET,
    SESSION_LENGTH: SESSION_LENGTH,
    RECOVERY_RUN: RECOVERY_RUN,

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
    topicList: topicList,
    badges: badges,
    hasProgress: hasProgress,
    reset: reset,
    today: today,

    isOnline: function () { return online; },
    /* Exposed so the offline screens are reachable without pulling the plug:
       AM.store.setOffline(true) in the console, or load the app with #offline. */
    setOffline: function (v) { setOnline(!v); }
  };

  rollDay();
  write(state);
  if (location.hash === "#offline") setOnline(false);
})();
