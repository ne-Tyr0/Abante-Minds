/* Abante Minds — motion helpers.
   Classic script, no imports, no build step. CSS handles every single-step
   transition; this file exists only for the sequences CSS cannot express and
   for reading the duration tokens back out so no number is written twice. */
(function () {
  "use strict";

  var root = document.documentElement;

  /* Durations are read from the cascade rather than hardcoded, so the
     prefers-reduced-motion override collapses the JS sequences too. */
  function dur(name, fallback) {
    var raw = getComputedStyle(root).getPropertyValue(name).trim();
    if (!raw) return fallback;
    var n = parseFloat(raw);
    if (isNaN(n)) return fallback;
    return raw.indexOf("ms") > -1 ? n : n * 1000;
  }

  var EASE_OUT = "cubic-bezier(0.2, 0.8, 0.2, 1)";
  var EASE_IN = "cubic-bezier(0.4, 0, 1, 1)";
  var EASE_POP = "cubic-bezier(0.34, 1.3, 0.64, 1)";

  function reduced() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ---------- Fills ----------
     ratio is 0..1. The element keeps its layout width; only the scale changes,
     so the 400ms fill never triggers layout on the row it sits in. */
  function setFill(el, ratio) {
    if (!el) return;
    var r = Math.max(0, Math.min(1, Number(ratio) || 0));
    el.style.setProperty("--am-fill", String(r));
    el.setAttribute("aria-valuenow", Math.round(r * 100));
  }

  /* One-time upgrade for fills still rendered with an inline width percentage
     (the React bundle sets width:"62%"). Reads the authored value, hands it to
     the custom property, and lets motion.css take over. */
  function upgradeFills(scope) {
    var host = scope || document;
    var nodes = host.querySelectorAll(
      ".am-practice-header-track > span, .am-skill-card-progress > span, [data-am-fill]"
    );
    Array.prototype.forEach.call(nodes, function (el) {
      if (el.dataset.amFillReady === "1") return;
      var authored = el.dataset.amFill || el.style.width;
      var r = parseFloat(authored) || 0;
      if (authored && authored.indexOf("%") > -1) r = r / 100;
      el.dataset.amFillReady = "1";
      /* start collapsed and set the real value on the next frame, so a returning
         learner watches the gain arrive instead of finding it already there */
      el.style.setProperty("--am-fill", "0");
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { setFill(el, r); });
      });
    });
  }

  /* ---------- Question to next question ----------
     swap() never waits on the animation: the incoming node is inserted, marked
     interactive, and the outgoing node is pulled out of flow to fade on its own.
     A fast kid can answer before the transition has finished. */
  function swapQuestion(stage, nextNode) {
    if (!stage) return;
    stage.classList.add("am-question-stage");
    var current = stage.firstElementChild;
    nextNode.classList.add("am-question-enter");
    stage.appendChild(nextNode);
    if (current) {
      current.classList.remove("am-question-enter");
      current.classList.add("am-question-exit");
      window.setTimeout(function () {
        if (current.parentNode === stage) stage.removeChild(current);
      }, dur("--dur-base", 240));
    }
    return nextNode;
  }

  /* ---------- Answer reveal ----------
     Returns the hold before auto-advance, or null when the learner controls it.
     Product logic, deliberately not a token: correct holds 600ms so it registers
     without dragging across 50 questions; wrong holds until a tap, because the
     learner has to read the feedback and the first worked step. */
  function revealAnswer(tile, state) {
    if (!tile) return null;
    tile.classList.add("am-answer-tile");
    tile.dataset.state = state;
    var glyph = tile.querySelector("[data-am-glyph]");
    if (glyph) {
      glyph.classList.remove("am-glyph-pop");
      void glyph.offsetWidth; /* restart the animation on a repeat answer */
      glyph.classList.add("am-glyph-pop");
    }
    return state === "correct" ? 600 : null;
  }

  /* ---------- Celebration takeover ----------
     Multi-step, so Web Animations rather than a chain of classes. Total lands
     under 700ms: field 320, badge from 60, button finishes at ~620. */
  function celebrate(el) {
    if (!el) return;
    var takeover = dur("--dur-takeover", 320);
    var fast = dur("--dur-fast", 160);
    var base = dur("--dur-base", 240);
    var stagger = reduced() ? 0 : 60;

    /* a previous dismiss left a fill:both fade sitting on the node */
    if (el.getAnimations) el.getAnimations().forEach(function (a) { a.cancel(); });

    el.animate(
      [{ opacity: 0, transform: "scale(0.98)" }, { opacity: 1, transform: "none" }],
      { duration: takeover, easing: EASE_OUT, fill: "both" }
    );

    var badge = el.querySelector("[data-am-badge]");
    if (badge) {
      badge.animate(
        [{ opacity: 0, transform: "scale(0.6)" }, { opacity: 1, transform: "none" }],
        { duration: fast, delay: stagger, easing: EASE_POP, fill: "both" }
      );
    }

    var counter = el.querySelector("[data-am-count]");
    if (counter) countUp(counter, Number(counter.dataset.amCount) || 0, takeover);

    var cta = el.querySelector("[data-am-cta]");
    if (cta) {
      cta.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: base,
        delay: takeover + stagger,
        easing: EASE_OUT,
        fill: "both"
      });
    }
  }

  /* Exiting is a straight fade on the shorter curve — nobody wants a slow goodbye. */
  function dismissCelebration(el, done) {
    if (!el) return;
    var base = dur("--dur-base", 240);
    var a = el.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: base,
      easing: EASE_IN,
      fill: "both"
    });
    a.onfinish = function () { if (done) done(); };
  }

  /* Text, so it cannot be composited. Kept to one short number on one small
     node, stepped on rAF rather than a timer so it cannot outrun the frame. */
  function countUp(el, to, duration) {
    var ms = duration || dur("--dur-takeover", 320);
    if (reduced() || ms < 16) { el.textContent = String(to); return; }
    var start = performance.now();
    function frame(now) {
      var t = Math.min(1, (now - start) / ms);
      el.textContent = String(Math.round(to * t));
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Screen transitions ----------
     Forward comes in from the right; back leaves to the right. */
  function goToScreen(outgoing, incoming, direction) {
    var base = dur("--dur-base", 240);
    if (outgoing && direction === "back") {
      outgoing.classList.add("am-screen-back");
      window.setTimeout(function () {
        outgoing.hidden = true;
        outgoing.classList.remove("am-screen-back");
      }, base);
    } else if (outgoing) {
      outgoing.hidden = true;
    }
    if (incoming) {
      incoming.hidden = false;
      incoming.classList.remove("am-screen-forward");
      void incoming.offsetWidth;
      incoming.classList.add("am-screen-forward");
    }
  }

  /* ---------- Offline and sync ---------- */
  function setOffline(banner, isOffline) {
    if (banner) banner.dataset.visible = isOffline ? "true" : "false";
  }

  function setSyncing(el, pending) {
    if (!el) return;
    el.classList.toggle("am-sync-pending", !!pending);
  }

  function syncResolved(el) {
    if (!el) return;
    el.classList.remove("am-sync-pending");
    var glyph = el.querySelector("[data-am-glyph]") || el;
    glyph.classList.remove("am-glyph-pop");
    void glyph.offsetWidth;
    glyph.classList.add("am-glyph-pop");
  }

  window.AbanteMinds = window.AbanteMinds || {};
  window.AbanteMinds.motion = {
    dur: dur,
    reduced: reduced,
    easings: { out: EASE_OUT, in: EASE_IN, pop: EASE_POP },
    setFill: setFill,
    upgradeFills: upgradeFills,
    swapQuestion: swapQuestion,
    revealAnswer: revealAnswer,
    celebrate: celebrate,
    dismissCelebration: dismissCelebration,
    countUp: countUp,
    goToScreen: goToScreen,
    setOffline: setOffline,
    setSyncing: setSyncing,
    syncResolved: syncResolved
  };
})();
