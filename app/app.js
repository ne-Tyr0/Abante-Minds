/* Abante Minds — shell, router, and the practice loop.
   One render pass rebuilds the current screen; the shell slots (status bar,
   banner, header, body, below-fold, footer, nav) stay put so the keypad and the
   bottom action never move under a thumb mid-session. */
(function () {
  "use strict";

  var AM = window.AM;
  var el = AM.el, icon = AM.icon;
  var store = AM.store, C = AM.content;
  var motion = (window.AbanteMinds && window.AbanteMinds.motion) || null;

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
      statusBar: el("div.am-slot-status"),
      banner: el("div.am-slot-banner"),
      header: el("div.am-slot-header"),
      body: el("div.am-slot-body"),
      belowFold: el("div.am-slot-belowfold"),
      footer: el("div.am-slot-footer"),
      nav: el("div.am-slot-nav")
    };

    var frame = el("div.am-frame", null,
      slots.statusBar, slots.banner, slots.header,
      slots.body, slots.belowFold, slots.footer, slots.nav);

    root.appendChild(slots.rail);
    root.appendChild(frame);
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

    root.dataset.gold = view.onGold ? "true" : "false";

    /* The celebration is a takeover: no header, no nav, one action. */
    var showChrome = view.chrome !== false;
    fill(slots.statusBar, showChrome || view.onGold
      ? AM.StatusBar({ onGold: !!view.onGold, offline: !store.isOnline(), minimal: dev === "desktop" })
      : null);
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
  }
  app.render = render;

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
      if (app.session && app.route !== "practice") app.go("practice");
      else app.go("topics");
    }
  }

  app.go = function (route, direction) {
    app.route = route;
    app.direction = direction || "forward";
    render();
  };

  /* ---------- install ----------
     Uses the real beforeinstallprompt when the browser offers one; otherwise
     the hint has still done its job and the app carries on. */
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    app.deferredInstall = e;
  });

  app.install = function (done) {
    if (!app.deferredInstall) { done(); return; }
    var e = app.deferredInstall;
    app.deferredInstall = null;
    e.prompt();
    var outcome = e.userChoice;
    if (outcome && outcome.then) outcome.then(function () { done(); }, function () { done(); });
    else done();
  };

  /* ---------- practice loop ---------- */

  app.startPractice = function (topicKey) {
    var key = topicKey || store.get().lastTopic || C.TOPICS[0].key;
    var topic = C.byKey(key);
    store.rollDay();
    store.set({ lastTopic: key });

    app.session = {
      topicKey: key,
      topicLabel: topic.label,
      colorKey: topic.colorKey,
      questions: C.buildSession(key, store.SESSION_LENGTH, store.get().tier, Date.now()),
      index: 0,
      phase: "ask",
      typed: "",
      picked: null,
      showHints: false,
      hintsRevealed: 0,
      stepsRevealed: 1,
      run: 0,
      correct: 0,
      attempted: 0,
      missed: [],
      demoteSeen: !store.get().demoted,
      pendingTierUp: false,
      startedAt: Date.now()
    };
    app.go("practice");
  };

  app.startRedo = function (result) {
    var topic = C.byKey(result.topicKey);
    app.session = {
      topicKey: result.topicKey,
      topicLabel: topic.label,
      colorKey: topic.colorKey,
      questions: result.missed.slice(),
      index: 0, phase: "ask", typed: "", picked: null,
      showHints: false, hintsRevealed: 0, stepsRevealed: 1,
      run: 0, correct: 0, attempted: 0, missed: [],
      demoteSeen: true, pendingTierUp: false, startedAt: Date.now()
    };
    app.go("practice");
  };

  app.type = function (d) {
    var s = app.session;
    if (!s || s.phase !== "ask") return;
    if (d === "." && s.typed.indexOf(".") > -1) return;
    if (s.typed.length >= 7) return;
    s.typed += d;
    app.keepScroll = true;
    render();
  };

  app.backspace = function () {
    var s = app.session;
    if (!s || s.phase !== "ask") return;
    s.typed = s.typed.slice(0, -1);
    app.keepScroll = true;
    render();
  };

  app.check = function () {
    var s = app.session;
    if (!s || s.phase !== "ask") return;
    var q = s.questions[s.index];
    var given = q.type === "choice" ? s.picked : s.typed;
    if (q.type === "choice" && given === null) return;
    if (q.type === "compute" && !s.typed) return;

    var right = C.isCorrect(q, given);
    s.phase = right ? "correct" : "wrong";
    s.demoteSeen = true;

    /* An attempt is counted once per question, however many tries it takes. */
    if (!q.__counted) {
      q.__counted = true;
      s.attempted += 1;
    }

    if (right) {
      s.run += 1;
      if (!q.__scored) {
        q.__scored = true;
        s.correct += 1;
        var outcome = store.recordAnswer(s.topicKey, true);
        s.pendingTierUp = outcome.tieredUp;
      }
      /* A question first answered wrong stops being a miss once it lands. */
      s.missed = s.missed.filter(function (m) { return m.id !== q.id; });
    } else {
      s.run = 0;
      s.stepsRevealed = 1;
      store.recordAnswer(s.topicKey, false);
      if (!s.missed.some(function (m) { return m.id === q.id; })) s.missed.push(q);
    }
    render();
  };

  app.retry = function () {
    var s = app.session;
    if (!s) return;
    s.phase = "ask";
    s.typed = "";
    s.picked = null;
    render();
  };

  app.next = function () {
    var s = app.session;
    if (!s) return;
    if (s.pendingTierUp) { s.pendingTierUp = false; app.go("tierup"); return; }
    advance();
  };

  app.afterTierUp = function () {
    if (motion) {
      motion.dismissCelebration(document.querySelector(".am-celebrate"), advance);
      /* Never gate on the fade: if the animation API is unavailable, move on. */
      window.setTimeout(function () { if (app.route === "tierup") advance(); }, 400);
    } else advance();
  };

  function advance() {
    var s = app.session;
    if (!s) { app.go("home"); return; }
    if (s.index + 1 >= s.questions.length) { finish(); return; }
    s.index += 1;
    s.phase = "ask";
    s.typed = "";
    s.picked = null;
    s.showHints = false;
    s.hintsRevealed = 0;
    s.stepsRevealed = 1;
    app.go("practice");
  }

  function finish() {
    var s = app.session;
    var minutes = Math.max(1, Math.round((Date.now() - s.startedAt) / 60000));
    var result = {
      topicKey: s.topicKey,
      topicLabel: s.topicLabel,
      colorKey: s.colorKey,
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
    store.set({ lastSession: { topicLabel: s.topicLabel, correct: s.correct, attempted: s.attempted } });
    if (store.isOnline()) store.startSync();
    app.session = null;
    app.go("summary");
  }

  /* ---------- keyboard ----------
     A shared school desktop has a keyboard; a phone in a jeepney does not.
     Both routes into the field are live wherever they exist. */
  document.addEventListener("keydown", function (e) {
    if (app.route !== "practice" || !app.session) return;
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
      e.preventDefault();
      return;
    }
    if (q.type !== "compute" || s.phase !== "ask") return;
    if (e.key === "Backspace") { app.backspace(); e.preventDefault(); return; }
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
    if (app.route === "home" || app.route === "profile" || app.route === "summary") {
      app.keepScroll = true;
      render();
    }
  });

  function boot() {
    buildShell();
    var s = store.get();
    if (!s.installed && !s.signedIn) app.route = "splash";
    else if (!s.signedIn) app.route = "signin";
    else if (!s.profile) app.route = "setup";
    else app.route = "home";
    render();
    if (store.isOnline()) store.startSync();

    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("sw.js").catch(function () { /* offline still works from cache-less reloads */ });
    }
  }

  AM.app = app;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
