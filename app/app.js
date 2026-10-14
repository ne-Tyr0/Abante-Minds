/* Abante Minds — shell, router, and the practice loop.
   One render pass rebuilds the current screen; the shell slots (banner,
   header, body, below-fold, footer, nav) stay put so the keypad and the
   bottom action never move under a thumb mid-session. */
(function () {
  "use strict";

  var AM = window.AM;
  var el = AM.el, icon = AM.icon;
  var store = AM.store, C = AM.content;
  var motion = (window.AbanteMinds && window.AbanteMinds.motion) || null;
  var sound = (window.AbanteMinds && window.AbanteMinds.sound) || null;

  /* The Calm animations setting, where the CSS and motion.js can read it. */
  function applySettings() {
    document.documentElement.dataset.calm = store.settings().calm ? "true" : "false";
  }
  applySettings();

  /* ---------- device ----------
     The gutter steps 24 → 32 → 48 and the reading column caps at 720. The
     bottom-anchored action is a thumb-reach rule, so it survives on tablet and
     becomes an inline action on desktop, where the bottom nav is a left rail. */
  function device() {
    var w = window.innerWidth;
    if (w >= 1280) return "desktop";
    if (w >= 768) return "tablet";
    return "phone";
  }
  AM.device = device;

  var app = {
    route: "splash",
    direction: "forward",
    session: null,
    scratch: {},
    deferredInstall: null
  };

  var root, slots;
  /* The entrance belongs to arriving at a screen. A re-render inside one — a
     keypad digit, a sync tick — must not restart it, or the screen fades from
     nothing on every tap. */
  var animatedRoute = null;

  function buildShell() {
    root = document.getElementById("am-root");
    AM.clear(root);

    slots = {
      rail: el("div.am-rail-slot"),
      banner: el("div.am-slot-banner"),
      header: el("div.am-slot-header"),
      body: el("div.am-slot-body"),
      belowFold: el("div.am-slot-belowfold"),
      footer: el("div.am-slot-footer"),
      nav: el("div.am-slot-nav")
    };

    var frame = el("div.am-frame", null,
      slots.banner, slots.header,
      slots.body, slots.belowFold, slots.footer, slots.nav);

    root.appendChild(slots.rail);
    root.appendChild(frame);

    /* Words for a screen reader when something happens that is only seen:
       a level cleared, a streak, a badge. */
    var live = el("div.am-live", { role: "status", "aria-live": "polite" });
    root.appendChild(live);
    AM.announce = function (text) {
      live.textContent = "";
      window.setTimeout(function () { live.textContent = text; }, 60);
    };
  }

  function fill(slot, node) {
    AM.clear(slot);
    if (node) { slot.appendChild(node); slot.hidden = false; }
    else slot.hidden = true;
  }

  function render() {
    var dev = device();
    root.dataset.device = dev;

    var builder = AM.screens[app.route] || AM.screens.home;
    var view = builder(app) || {};
    /* A tap that re-renders its own screen (a key, a choice, a hint) swaps
       the button it pressed for a new one; the new one springs back up. */
    var carried = motion && app.route === animatedRoute ? motion.pressCarry() : null;

    root.dataset.gold = view.onGold ? "true" : "false";

    /* The celebration is a takeover: no header, no nav, one action. There is
       no painted status bar: the phone draws its own, and a second clock
       frozen at 9:41 under the real one was only a mockup's. */
    fill(slots.banner, view.banner || null);
    fill(slots.header, view.header || (view.back ? backRow(view.back) : null));

    var body = view.body || el("div");
    if (app.route !== animatedRoute) {
      body.classList.add(app.direction === "back" ? "am-screen-back-in" : "am-screen-forward");
      animatedRoute = app.route;
    }
    fill(slots.body, body);
    fill(slots.belowFold, view.belowFold || null);
    fill(slots.footer, view.footer || null);

    /* The bottom bar is for the screens a learner moves between; picking,
       practising and the summary are focused modes and the design draws no nav
       on any of them. The rail is different — it is the desktop window frame,
       so it stays. */
    var wantsNav = !!view.nav && view.bottomNav !== false && dev !== "desktop";
    fill(slots.nav, wantsNav ? AM.BottomNav(view.nav, navigate) : null);

    var wantsRail = !!view.nav && dev === "desktop";
    fill(slots.rail, wantsRail ? AM.SideRail(view.nav, navigate, view.railFooter || null) : null);

    if (view.onGold && motion) motion.celebrate(root.querySelector(".am-celebrate"));

    slots.body.scrollTop = app.keepScroll ? slots.body.scrollTop : 0;
    app.keepScroll = false;
    app.direction = "forward";
    if (carried) carried();
    currentView = view;
    guardBack();

    /* A screen that plays something once it is on the page. */
    if (view.after) view.after();
  }
  app.render = render;

  /* ---------- the phone's Back button ----------
     The app is one page, so Back would leave it altogether. On any screen
     but Home (and the screens before a learner exists), one history entry
     stands guard: Back pops it, the app goes back itself and the guard goes
     up again. A sheet that is open closes first, and in a round Back asks
     before leaving, as the X does. On Home the guard is taken down, so Back
     leaves the app there, as a phone user expects. */
  var UNGUARDED = { home: true, splash: true, signin: true, setup: true, recover: true, recoverSent: true, loadFailed: true };
  var currentView = null, guarded = false, unguarding = false;
  function guardBack() {
    var wants = !UNGUARDED[app.route];
    try {
      if (wants && !guarded) { window.history.pushState({ am: "guard" }, ""); guarded = true; }
      else if (!wants && guarded) { guarded = false; unguarding = true; window.history.back(); }
    } catch (e) { /* no history to keep: Back does what the browser does */ }
  }
  window.addEventListener("popstate", function () {
    if (unguarding) { unguarding = false; return; }
    guarded = false;
    if (app.closeSheet) app.closeSheet();
    else {
      var view = currentView || {};
      var back = view.onBack || view.back || function () { app.go("home", "back"); };
      back();
    }
    guardBack();
  });

  function backRow(handler) {
    return el("div", { style: { flex: "none", padding: "12px 24px 0" } },
      el("button.am-reset.am-backlink", {
        type: "button", onClick: handler,
        style: {
          display: "flex", alignItems: "center", gap: "var(--space-2)",
          color: "var(--ink-600)", background: "none", border: 0, cursor: "pointer", padding: 0
        }
      }, icon("back", 20), el("span.label", null, "Back")));
  }

  function navigate(key) {
    if (key === "home") app.go("home");
    else if (key === "profile") app.go("profile");
    else if (key === "practice") {
      if (app.session && app.route !== "practice" && app.route !== "exam") app.go(app.session.exam ? "exam" : "practice");
      else app.go("topics");
    }
  }

  app.go = function (route, direction) {
    app.route = route;
    app.direction = direction || "forward";
    render();
  };

  /* ---------- install ----------
     The browser decides when it can install in one tap, and says so with
     beforeinstallprompt, which only fires while the app is not installed.
     Where it never fires (iPhone Safari, some Android browsers) the offer
     opens a screen with the steps instead. `installed` is set only on
     evidence: the browser reporting the install, or the app running from the
     home screen. Tapping a button is not evidence. */
  function standalone() {
    return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      window.navigator.standalone === true;
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    app.deferredInstall = e;
    /* Only offered while not installed, so an earlier install has since been removed. */
    if (store.get().installed) store.set({ installed: false });
  });

  window.addEventListener("appinstalled", function () {
    app.deferredInstall = null;
    store.set({ installed: true });
  });

  /* Whether to offer installing at all. A plain-HTTP address cannot install,
     so the offer is not made there. */
  app.canOfferInstall = function () {
    return !!window.isSecureContext && !standalone() && !store.get().installed;
  };

  /* One tap where the browser allows it, otherwise the steps. `next` is where
     to go afterwards: the splash moves on to sign-in, other screens stay put. */
  app.offerInstall = function (next) {
    var e = app.deferredInstall;
    if (!e) {
      app.scratch.install = { from: app.route, next: next || null };
      app.go("installSteps");
      return;
    }
    app.deferredInstall = null; /* a prompt can be shown once per event */
    e.prompt();
    function after(choice) {
      if (choice && choice.outcome === "accepted") store.set({ installed: true });
      if (next) app.go(next);
      else { app.keepScroll = true; render(); }
    }
    var outcome = e.userChoice;
    if (outcome && outcome.then) outcome.then(after, function () { after(null); });
    else after(null);
  };

  /* ---------- practice loop ---------- */

  /* A topic's levels, from the path. */
  app.openTopic = function (topicKey) {
    app.scratch.topic = topicKey;
    app.go("topic");
  };

  /* A Basics topic: its levels, all open, and its grid if it has one. */
  app.openBasicsTopic = function (topicKey) {
    app.scratch.basicsTopic = topicKey;
    app.go("basicsTopic");
  };

  /* Back to the topic a level belongs to, on the path or in Basics. */
  function backToTopic(topicKey) {
    if (C.byKey(topicKey).track === "basics") {
      app.scratch.basicsTopic = topicKey;
      app.go("basicsTopic", "back");
    } else {
      app.scratch.topic = topicKey;
      app.go("topic", "back");
    }
  }
  app.backToTopic = backToTopic;

  /* A level opens with its lesson the first time; after that, straight to
     practice. The lesson can always be seen again from the topic screen. */
  app.startLevel = function (topicKey, levelId) {
    var lv = store.levelState(topicKey, levelId);
    var level = levelMeta(topicKey, levelId);
    if (level.hasLesson && !lv.lessonSeen) app.openLesson(topicKey, levelId);
    else beginLevel(topicKey, levelId);
  };

  app.openLesson = function (topicKey, levelId) {
    app.scratch.lesson = { topic: topicKey, level: levelId, page: 0, cards: C.lesson(topicKey, levelId) };
    app.go("lesson");
  };

  app.lessonPage = function (delta) {
    var l = app.scratch.lesson;
    if (!l) return;
    var page = l.page + delta;
    if (page < 0) { backToTopic(l.topic); return; }
    if (page >= l.cards.length) {
      store.markLessonSeen(l.topic, l.level);
      beginLevel(l.topic, l.level);
      return;
    }
    l.page = page;
    app.go("lesson", delta < 0 ? "back" : "forward");
  };

  function levelMeta(topicKey, levelId) {
    var topic = C.byKey(topicKey);
    var index = topic.levels.findIndex(function (lv) { return lv.id === levelId; });
    var level = topic.levels[index];
    return {
      topic: topic, number: index + 1, id: level.id, title: level.title, hasLesson: level.hasLesson,
      kind: level.kind, track: topic.track
    };
  }

  function newSession(meta, questions, redo) {
    return {
      topicKey: meta.topic.key, topicLabel: meta.topic.label, colorKey: meta.topic.colorKey,
      levelId: meta.id, levelTitle: meta.title, levelNumber: meta.number,
      track: meta.track, kind: meta.kind, facts: meta.kind === "facts" || meta.kind === "review",
      redo: !!redo, questions: questions,
      index: 0, phase: "ask", entry: null, picked: null, diagnosis: null,
      showHints: false, hintsRevealed: 0, stepsRevealed: 1,
      run: 0, correct: 0, attempted: 0, missed: [],
      pendingLevelUp: false, startedAt: Date.now(),
      /* Ties a session's rows together in the attempt log. */
      id: Date.now().toString(36) + "-" + Math.floor(Math.random() * 1679616).toString(36),
      /* A facts round times each answer from the moment it is shown. */
      shownAt: Date.now(), lastMs: null, lastQuick: false, lastMastered: false, lastRequeued: false,
      quick: 0, mastered: [], seed: null
    };
  }

  /* A level's first session opens with its pinned questions; the numbers get
     harder as the level fills (store.tierFor). */
  function beginLevel(topicKey, levelId) {
    var meta = levelMeta(topicKey, levelId);
    if (meta.kind !== "practice") { beginFacts(meta); return; }
    var lv = store.levelState(topicKey, levelId);
    store.rollDay();
    var questions = C.buildSession({
      topic: topicKey, level: levelId, count: store.SESSION_LENGTH,
      tier: store.tierFor(topicKey, levelId), seed: Date.now(), pinned: lv.attempts === 0
    });
    app.session = newSession(meta, questions, false);
    app.session.entry = freshEntry(app.session);
    app.go("practice");
  }

  /* A Basics facts round: which facts, and in what order, is app/facts.js's
     call from what the learner has done with each. */
  function beginFacts(meta) {
    store.rollDay();
    var seed = Date.now() >>> 0;
    var keys = AM.facts.pickRound(C.facts(meta.topic.key, meta.id), store.factState, seed);
    var questions = keys.map(function (k, i) { return C.factQuestion(meta.topic.key, meta.id, k, seed + i, i); });
    app.session = newSession(meta, questions, false);
    app.session.seed = seed;
    app.session.entry = freshEntry(app.session);
    app.go("practice");
  }

  /* Missed questions again, after their solutions were shown. They keep the
     streak going but do not count towards clearing the level. */
  app.startRedo = function (result) {
    app.session = newSession(levelMeta(result.topicKey, result.levelId), result.missed.slice(), true);
    app.session.entry = freshEntry(app.session);
    app.go("practice");
  };

  /* An empty answer of the kind the current question takes: number,
     fraction or mixed number. A choice question has none. */
  function freshEntry(s) {
    var q = s.questions[s.index];
    return q && q.entry ? AM.entry.create(q.entry) : null;
  }

  /* The keypad stays put while the body scrolls, so with hints open the
     answer field can sit below the visible part of the body. Bring it into
     view as the learner types, by the least scroll that shows it. */
  function revealAnswer() {
    var field = root.querySelector(".am-answer-field");
    if (field && field.scrollIntoView) field.scrollIntoView({ block: "nearest" });
  }

  /* Every key goes through the entry rules in entry.js, so the keypad and a
     hardware keyboard behave the same. */
  function editEntry(change) {
    var s = app.session;
    if (!s || s.phase !== "ask" || !s.entry) return;
    s.entry = change(s.entry);
    app.keepScroll = true;
    render();
    revealAnswer();
  }

  app.type = function (d) { editEntry(function (e) { return AM.entry.press(e, d); }); };
  app.backspace = function () { editEntry(AM.entry.del); };
  app.nextBox = function () { editEntry(AM.entry.next); };
  app.focusBox = function (box) { editEntry(function (e) { return AM.entry.focus(e, box); }); };

  app.check = function () {
    var s = app.session;
    if (!s || s.phase !== "ask") return;
    var q = s.questions[s.index];
    if (q.type === "choice" ? s.picked === null : !AM.entry.complete(s.entry)) return;
    var given = q.type === "choice" ? s.picked : AM.entry.text(s.entry);
    if (s.exam) { examAnswer(s, q, given); return; }

    /* A wrong answer that matches a mistake the template expects gets that
       mistake's explanation; any other gets the honest fallback. */
    s.diagnosis = C.diagnose(q, given);
    var right = s.diagnosis.correct;
    s.phase = right ? "correct" : "wrong";
    q.__tries = (q.__tries || 0) + 1;
    store.logAttempt({
      session: s.id, topic: s.topicKey, level: s.levelId, kind: s.redo ? "redo" : s.kind,
      template: q.templateId, tier: q.tier, seed: q.seed, pinned: q.pinned ? q.pinnedAt : null,
      format: q.format, fact: q.factKey || null, pack: q.packVersion,
      ordinal: s.index, attempt: q.__tries, given: given, correct: right, error: s.diagnosis.error,
      ms: Date.now() - s.shownAt, hints: s.showHints ? s.hintsRevealed : 0,
      /* Steps show only after a wrong answer, so a first try has seen none. */
      steps: q.__tries > 1 ? s.stepsRevealed : 0
    });

    /* Only the first try at a question counts towards the level: right on
       the first try is what "correct" means in the session and on the path. */
    var firstTry = !q.__counted;
    if (firstTry) {
      q.__counted = true;
      s.attempted += 1;
      if (right) s.correct += 1;
    }
    if (s.facts) checkFact(s, q, right);
    else if (s.review) { if (firstTry) store.recordReview(q.reviewKey, right); else store.notePractice(); }
    else if (s.redo) store.notePractice();
    else if (store.recordAnswer(s.topicKey, s.levelId, right, firstTry).cleared) s.pendingLevelUp = true;
    /* A miss on the path comes back in a day, then three, then seven. */
    if (!right && firstTry && !s.facts && !s.redo && !s.review) store.scheduleReview(q);

    s.lostRun = 0;
    if (right) {
      s.run += 1;
      s.bestRun = Math.max(s.bestRun || 0, s.run);
      /* A question first answered wrong stops being a miss once it lands. */
      s.missed = s.missed.filter(function (m) { return m.id !== q.id; });
    } else {
      s.lostRun = s.run;
      s.run = 0;
      /* A fact's answer is shown in full: it comes back later to be tried again. */
      s.stepsRevealed = s.facts ? q.steps.length : 1;
      if (!s.missed.some(function (m) { return m.id === q.id; })) s.missed.push(q);
    }
    /* Felt as well as seen: a tick for right, a double for a run of 3, 5,
       10 and every 5 after, and a softer buzz for a miss. Inside the tap, as
       the iPhone needs. */
    var milestone = right && (s.run === 3 || (s.run > 0 && s.run % 5 === 0));
    if (motion) {
      motion.haptic(!right ? "wrong"
        : s.facts && s.lastMastered ? "mastered"
        : milestone ? "combo" : "correct");
    }
    if (sound) {
      if (!right) sound.play("wrong");
      else if (s.facts && s.lastMastered) sound.play("check");
      else if (milestone) sound.play("combo", s.run);
      else sound.play("correct");
    }
    render();
    var moments = window.AbanteMinds && window.AbanteMinds.moments;
    if (moments) {
      var chip = root.querySelector(".am-combo");
      if (right && s.run >= 2) moments.combo(chip, s.run);
      else if (!right && s.lostRun >= 3) moments.putOut(chip);
    }
    /* A right fact moves on by itself, so a round keeps its pace; the button
       is still there, and whichever comes first wins. */
    if (s.facts && right) {
      var at = s.index;
      window.setTimeout(function () {
        if (app.session === s && s.index === at && s.phase === "correct" && app.route === "practice") app.next();
      }, AUTO_NEXT_MS);
    }
  };

  var AUTO_NEXT_MS = 1200;

  /* A fact counts towards mastery when it is right and quick; a miss sends it
     back, and it comes back later in this round too, after its answer has
     been shown. There is no second try at the same question. */
  function checkFact(s, q, right) {
    var ms = Date.now() - s.shownAt;
    var quick = right && AM.facts.isQuick(ms, s.showHints);
    s.lastMs = ms;
    s.lastQuick = quick;
    s.lastMastered = store.recordFact(q.factKey, right, quick).mastered;
    s.lastRequeued = false;
    if (quick) s.quick += 1;
    if (s.lastMastered && s.mastered.indexOf(q.factKey) < 0) s.mastered.push(q.factKey);
    if (!right) {
      var keys = s.questions.map(function (x) { return x.factKey; });
      var at = AM.facts.requeueAt(keys, s.index, q.factKey);
      s.lastRequeued = at > -1;
      if (at > -1) {
        var n = s.questions.length;
        s.questions.splice(at, 0, C.factQuestion(s.topicKey, s.levelId, q.factKey, s.seed + n, n));
      }
    }
  }

  app.retry = function () {
    var s = app.session;
    if (!s) return;
    s.phase = "ask";
    s.shownAt = Date.now();
    s.entry = freshEntry(s);
    s.picked = null;
    s.diagnosis = null;
    render();
  };

  app.next = function () {
    var s = app.session;
    if (!s) return;
    if (s.pendingLevelUp) {
      s.pendingLevelUp = false;
      if (motion) motion.haptic("levelUp");
      app.go("levelup");
      return;
    }
    advance();
  };

  /* The fade and a fallback timer both try to move on, and the button can be
     tapped twice: only the first of them, while the celebration is still up,
     advances. A throttled or slow phone can finish the fade after the timer,
     which once skipped a question. */
  app.afterLevelUp = function () {
    function once() { if (app.route === "levelup") advance(); }
    if (motion) {
      motion.dismissCelebration(document.querySelector(".am-celebrate"), once);
      /* Never gate on the fade: if the animation API is unavailable, move on. */
      window.setTimeout(once, 400);
    } else once();
  };

  /* From the level-up to the badges, and back into the session after. */
  app.levelUpToBadges = function () {
    app.scratch.badgesBack = function () { app.scratch.badgesBack = null; advance(); };
    app.scratch.badgesHighlight = true;
    app.go("badges");
  };

  function advance() {
    var s = app.session;
    if (!s) { app.go("home"); return; }
    if (s.leaving) { endLeft(s); return; }
    if (s.index + 1 >= s.questions.length) { finish(); return; }
    s.index += 1;
    s.phase = "ask";
    s.entry = freshEntry(s);
    s.picked = null;
    s.diagnosis = null;
    s.showHints = false;
    s.hintsRevealed = 0;
    s.stepsRevealed = 1;
    s.shownAt = Date.now();
    app.go(s.exam ? "exam" : "practice");
  }

  function finish() {
    var s = app.session;
    if (s.exam) { finishExam(s, false); return; }
    if (s.review) { finishReview(s); return; }
    var minutes = Math.max(1, Math.round((Date.now() - s.startedAt) / 60000));
    var result = {
      topicKey: s.topicKey,
      topicLabel: s.topicLabel,
      colorKey: s.colorKey,
      levelId: s.levelId,
      levelTitle: s.levelTitle,
      levelNumber: s.levelNumber,
      track: s.track,
      kind: s.kind,
      facts: s.facts,
      quick: s.quick,
      masteredNow: s.mastered.length,
      redo: s.redo,
      attempted: s.attempted,
      correct: s.correct,
      missed: s.missed.map(function (q) {
        var copy = {};
        Object.keys(q).forEach(function (k) { if (k.indexOf("__") !== 0) copy[k] = q[k]; });
        return copy;
      }),
      missedTheme: null,
      minutes: minutes
    };
    app.scratch.result = result;
    store.set({ lastSession: { topicLabel: s.topicLabel, levelTitle: s.levelTitle, correct: s.correct, attempted: s.attempted } });
    app.session = null;
    afterSession("summary");
  }

  /* The first session finished on a day goes by the streak screen on its
     way to the summary. */
  function afterSession(route) {
    var s = store.get(), t = store.today();
    if (s.lastActiveDay === t && s.streakShownDay !== t) {
      store.set({ streakShownDay: t });
      app.scratch.afterStreak = route;
      app.scratch.streak = null;
      app.go("streak");
    } else app.go(route);
  }

  /* ---------- leaving a round ----------
     A round can be left at any question (screens.js asks first). What it
     got right is kept, and a level whose round was left can no longer earn
     a shiny badge (store.leaveLevel), so leaving before a hard question is
     not a way to stay perfect. A practice exam left is not scored. Leaving
     on the last question, already answered, is finishing. */
  app.leaveSession = function () {
    var s = app.session;
    if (!s) return;
    if (s.exam) {
      s.exam.done = true;
      window.clearInterval(examTimer);
      examTimer = null;
      app.session = null;
      app.go("home", "back");
      return;
    }
    if (s.phase !== "ask" && s.index + 1 >= s.questions.length) { app.next(); return; }
    if (!s.redo && !s.review && (s.kind === "practice" || s.kind === "facts")) store.leaveLevel(s.topicKey, s.levelId);
    s.leaving = true;
    /* A level cleared by the question just answered still gets its moment. */
    if (s.pendingLevelUp) { app.next(); return; }
    endLeft(s);
  };

  function endLeft(s) {
    app.session = null;
    if (s.review) app.go("home", "back");
    else backToTopic(s.topicKey);
  }

  /* ---------- spaced review ----------
     Up to REVIEW_SESSION missed questions that are due, the longest waiting
     first, each exactly as it was first asked. A question whose template a
     later pack has retired is dropped. */
  var REVIEW_SESSION = 10;
  app.startReview = function () {
    store.rollDay();
    var questions = [];
    store.reviewDue().forEach(function (e) {
      if (questions.length >= REVIEW_SESSION) return;
      var q = C.rebuild(e);
      if (!q) { store.dropReview(e.key); return; }
      q.reviewKey = e.key;
      q.id = "review-" + questions.length;
      questions.push(q);
    });
    if (!questions.length) { app.go("home"); return; }
    var meta = { topic: { key: "review", label: "Review", colorKey: 1 }, id: "review", title: "Review", number: 0, track: "review", kind: "practice" };
    var s = newSession(meta, questions, false);
    s.review = true;
    s.entry = freshEntry(s);
    app.session = s;
    app.go("practice");
  };

  function finishReview(s) {
    app.scratch.review = { attempted: s.attempted, correct: s.correct, due: store.reviewDue().length, next: store.reviewNext() };
    app.session = null;
    afterSession("reviewDone");
  }

  /* ---------- the practice exam ----------
     EXAM_COUNT questions across the path by blueprint weight, against a clock
     of EXAM_MINUTES. No hints and no right or wrong until the end, as in the
     real exam; a question can be skipped. Its results are kept on their own
     and never move the path or Basics. */
  var EXAM_COUNT = 20, EXAM_MINUTES = 30, examTimer = null;

  app.EXAM_COUNT = EXAM_COUNT;
  app.EXAM_MINUTES = EXAM_MINUTES;

  app.startExam = function () {
    store.rollDay();
    var seed = Date.now() >>> 0;
    var meta = { topic: { key: "exam", label: "Practice exam", colorKey: 1 }, id: "exam", title: "Practice exam", number: 0, track: "exam", kind: "exam" };
    var s = newSession(meta, C.buildExam({ count: EXAM_COUNT, seed: seed }), false);
    s.exam = { seed: seed, endsAt: Date.now() + EXAM_MINUTES * 60000, answers: [], done: false };
    s.entry = freshEntry(s);
    app.session = s;
    if (examTimer) window.clearInterval(examTimer);
    examTimer = window.setInterval(tickExam, 1000);
    app.go("exam");
  };

  /* Minutes and seconds left, as the clock shows them: 29:41. */
  app.examClock = function (s) {
    var left = Math.max(0, Math.ceil((s.exam.endsAt - Date.now()) / 1000));
    var m = Math.floor(left / 60), sec = left % 60;
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  };

  /* The clock updates in place, so typing is never interrupted by a redraw.
     When it runs out, the exam ends where it stands. */
  function tickExam() {
    var s = app.session;
    if (!s || !s.exam || s.exam.done) { window.clearInterval(examTimer); examTimer = null; return; }
    if (Date.now() >= s.exam.endsAt) { finishExam(s, true); return; }
    var node = document.querySelector(".am-exam-clock");
    if (node) node.textContent = app.examClock(s) + " left";
  }

  /* The answer is taken and checked, but nothing is shown: the next question
     comes straight up. A skipped question has no answer. */
  function examAnswer(s, q, given) {
    var d = given === null ? { correct: false, error: null } : C.diagnose(q, given);
    s.exam.answers[s.index] = {
      given: given, correct: d.correct, error: d.error,
      shown: given === null ? null : q.type === "choice" ? C.choiceText(q, given) : (q.unit || "") + given + q.suffix
    };
    s.attempted += 1;
    if (d.correct) s.correct += 1;
    store.logAttempt({
      session: s.id, topic: q.topicKey, level: q.levelId, kind: "exam",
      template: q.templateId, tier: q.tier, seed: q.seed, pinned: null,
      format: q.format, fact: null, pack: q.packVersion,
      ordinal: s.index, attempt: 1, given: given, correct: d.correct, error: d.error,
      ms: Date.now() - s.shownAt, hints: 0, steps: 0
    });
    if (given !== null && !d.correct) store.scheduleReview(q);
    advance();
  }

  app.skipQuestion = function () {
    var s = app.session;
    if (!s || !s.exam || s.exam.done) return;
    examAnswer(s, s.questions[s.index], null);
  };

  function finishExam(s, timedOut) {
    if (s.exam.done) return;
    s.exam.done = true;
    if (app.closeSheet) app.closeSheet();  /* time ran out while leaving was being asked */
    window.clearInterval(examTimer);
    examTimer = null;
    var byTopic = [], seen = {};
    s.questions.forEach(function (q, i) {
      var t = seen[q.topicKey];
      if (!t) { t = seen[q.topicKey] = { key: q.topicKey, label: q.topicLabel, colorKey: q.colorKey, right: 0, asked: 0 }; byTopic.push(t); }
      t.asked += 1;
      if (s.exam.answers[i] && s.exam.answers[i].correct) t.right += 1;
    });
    /* In path order, as the learner knows the topics. */
    var order = C.TOPICS.map(function (t) { return t.key; });
    byTopic.sort(function (a, b) { return order.indexOf(a.key) - order.indexOf(b.key); });
    var topics = {};
    byTopic.forEach(function (t) { topics[t.key] = [t.right, t.asked]; });
    var seconds = Math.min(EXAM_MINUTES * 60, Math.round((Date.now() - s.startedAt) / 1000));
    store.recordExam({ score: s.correct, total: s.questions.length, seconds: seconds, topics: topics });
    app.scratch.exam = {
      score: s.correct, total: s.questions.length, seconds: seconds, timedOut: !!timedOut,
      byTopic: byTopic, questions: s.questions, answers: s.exam.answers
    };
    app.session = null;
    app.go("examResult");
  }

  /* ---------- keyboard ----------
     A shared school desktop has a keyboard; a phone in a jeepney does not.
     Both routes into the field are live wherever they exist. */
  document.addEventListener("keydown", function (e) {
    if ((app.route !== "practice" && app.route !== "exam") || !app.session || app.closeSheet) return;
    var s = app.session;
    var q = s.questions[s.index];
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === "Enter") {
      /* If the learner has tabbed onto a control, Enter belongs to that
         control — otherwise pressing it on the "5" key would type a 5 and
         submit the answer in the same stroke. */
      var focused = document.activeElement;
      if (focused && (focused.tagName === "BUTTON" || focused.tagName === "A")) return;
      if (s.phase === "ask") app.check();
      else if (s.phase === "correct") app.next();
      else if (s.facts) app.next(); /* a missed fact has no second try, only Next */
      e.preventDefault();
      return;
    }
    if (q.type !== "compute" || s.phase !== "ask") return;
    if (e.key === "Backspace") { app.backspace(); e.preventDefault(); return; }
    /* A fraction moves to its next box on "/" or space, as it would be written;
       a time on ":" or space. */
    if ((e.key === "/" || e.key === " " || e.key === ":") && q.entry !== "number") { app.nextBox(); e.preventDefault(); return; }
    if (/^[0-9.]$/.test(e.key)) { app.type(e.key); e.preventDefault(); }
  });

  /* ---------- boot ---------- */
  var lastDevice = device();
  window.addEventListener("resize", function () {
    var next = device();
    if (next === lastDevice) return;
    lastDevice = next;
    app.keepScroll = true;
    render();
  });

  store.subscribe(function () {
    applySettings();
    if (app.route === "home" || app.route === "profile" || app.route === "summary") {
      app.keepScroll = true;
      render();
    }
  });

  /* The questions are data (content/packs/), so the first screen waits for
     the pack. From the precache that is a few milliseconds. The service worker
     registers first, so even a launch that cannot load the pack leaves it
     installing for next time. Loading starts inside a promise so that any
     failure, even a content.js from an older deploy with no load(), lands on
     the retry screen rather than a blank one. `app.ready` settles once the
     first screen is up, for anything that drives the app from outside. */
  function boot() {
    buildShell();
    /* Opened from the home screen, so it is installed, whatever this
       storage says. On iPhone it may not be the storage Safari uses. */
    if (standalone() && !store.get().installed) store.set({ installed: true });
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("sw.js").catch(function () { /* offline still works from cache-less reloads */ });
    }
    app.ready = Promise.resolve().then(function () { return C.load(); }).then(function () {
      /* Badges are counted from the levels, so only once the pack is in:
         the first time, progress made before badges is awarded quietly. */
      store.syncBadges();
      var s = store.get();
      if (!s.installed && !s.signedIn) app.route = "splash";
      else if (!s.signedIn) app.route = "signin";
      else if (!s.profile) app.route = "setup";
      else app.route = "home";
      render();
    }, function (err) {
      app.loadError = err; /* for anyone debugging from the console */
      app.route = "loadFailed";
      render();
    });
  }

  AM.app = app;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
