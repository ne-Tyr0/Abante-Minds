/* Abante Minds — the twenty screens.
   Each builder returns the body of one route. The document draws several of
   them as separate frames (home first-run vs returning vs offline vs syncing);
   those are one screen with state here, which is what the frames describe.
   Layout numbers — 24px gutters, 64px nav, 52px keys — come straight from the
   design document; everything else is a token. */
(function () {
  "use strict";

  var AM = window.AM;
  var el = AM.el, icon = AM.icon;
  var C = AM.content, store = AM.store;

  var screens = {};

  /* ---------- shared furniture ---------- */

  function gutter() { return AM.device() === "desktop" ? 48 : AM.device() === "tablet" ? 32 : 24; }

  /* The reading column never exceeds 720 up to tablet. On desktop the cap moves
     to the cards themselves, so the second column has somewhere to go — the
     width is spent on another card, never on longer lines. app.css holds both
     rules so one media query governs them. */
  function column(children, extra) {
    var style = { width: "100%", margin: "0 auto", display: "flex", flexDirection: "column" };
    if (extra) Object.keys(extra).forEach(function (k) { style[k] = extra[k]; });
    return el("div.am-column", { style: style }, children);
  }

  function sectionLabel(text) {
    return el("span.caption", { style: { color: "var(--ink-600)" } }, text);
  }

  function greetingBlock(s, sub) {
    var name = (s.profile && s.profile.name) ? s.profile.name.split(" ")[0] : "there";
    return el("span.am-name", null,
      el("span.heading-lg", { style: { display: "block" } }, "Hello, " + name),
      el("span.body-sm", { style: { color: "var(--ink-600)" } }, sub)
    );
  }

  /* Flat surface-300 strip, no icon: the subset has no offline glyph and the
     rule is not to invent one. */
  function offlineBanner() {
    return el("div.am-offline-banner", {
      "data-visible": "true", role: "status",
      style: { flex: "none", background: "var(--surface-300)", padding: "12px " + gutter() + "px" }
    }, el("div.body-sm", { style: { color: "var(--ink-900)" } }, "Offline. Practice is saved on this phone."));
  }

  /* Offline is the only connection state worth a banner. There is no sync banner
     because there is no sync — see the note at the top of store.js. */
  function connectionBanner() {
    return store.isOnline() ? null : offlineBanner();
  }

  /* ---------- 1 · Welcome: a name, then straight to the first lesson ---------- */
  screens.splash = function (app) {
    var draft = app.scratch.welcome || (app.scratch.welcome = { name: "" });
    function begin() {
      store.set({ profile: { name: draft.name.trim(), school: "", colorKey: 1, iconKey: "triangle" } });
      app.scratch.welcome = null;
      var next = store.path().next;
      if (next) app.startLevel(next.topic.key, next.level.id);
      else app.go("home");
    }
    return {
      nav: null,
      body: el("div", {
        style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-4)", padding: "var(--space-6)" }
      },
        el("img", { src: "assets/abante-minds-mark.png", alt: "Abante Minds", style: { width: 104, height: 104, objectFit: "contain" } }),
        el("div.am-wordmark-lg", null, "Abante Minds"),
        el("div.body", { style: { color: "var(--ink-600)", textAlign: "center" } }, "NCE math practice · works offline")
      ),
      footer: el("div", {
        style: {
          flex: "none", margin: "0 auto 28px", width: "calc(100% - " + 2 * gutter() + "px)", maxWidth: 520,
          boxSizing: "border-box", background: "var(--surface-200)",
          borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)", padding: "var(--space-4)",
          display: "flex", flexDirection: "column", gap: "var(--space-3)"
        }
      },
        el("label", { style: { display: "flex", flexDirection: "column", gap: "var(--space-2)" } },
          el("span.label", null, "What should we call you?"),
          el("input.body-lg.am-input", {
            type: "text", value: draft.name, maxlength: 40, autocomplete: "off",
            oninput: function (e) { draft.name = e.target.value; },
            onkeydown: function (e) { if (e.key === "Enter") begin(); }
          }),
          el("span.caption", { style: { color: "var(--ink-600)" } }, "Your first name is enough. It stays on this phone.")),
        AM.Button({ label: "Start my first lesson", fullWidth: true, onClick: begin })
      )
    };
  };

  /* ---------- Add to home screen, anytime ----------
     Not before the first right answer: a new learner's first taps go on
     learning. After that it is on Home until they say "Not now" there,
     and on Profile for good. Both disappear once the app is installed. */
  var INSTALL_PITCH = "Add Abante Minds to your home screen. It keeps working when there is no signal.";

  /* Ghost, not amber: the practice action keeps the one primary on Home.
     The corner x is the "Not now", with a full 48px target. */
  function installCard(app) {
    return AM.Card({ style: { gap: "var(--space-3)" } },
      el("div", { style: { display: "flex", gap: "var(--space-3)", alignItems: "flex-start" } },
        el("span", {
          style: {
            flex: "none", width: 40, height: 40, marginTop: 4, borderRadius: "50%", background: "var(--brand-blue-100)",
            color: "var(--brand-blue-600)", display: "flex", alignItems: "center", justifyContent: "center"
          }
        }, icon("home", 22)),
        el("div.body", { style: { flex: 1, textWrap: "pretty", paddingTop: 4 } }, INSTALL_PITCH),
        el("button.am-reset.am-dismiss", {
          type: "button", "aria-label": "Not now", title: "Not now",
          onClick: function () { store.set({ installCardDismissed: true }); },
          style: {
            flex: "none", width: "var(--tap-button)", height: "var(--tap-button)", margin: "-8px -8px 0 0",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--ink-600)", background: "none", border: 0, cursor: "pointer", padding: 0
          }
        }, icon("x", 20))),
      AM.Button({ label: "Add to home screen", variant: "ghost", fullWidth: true, onClick: function () { app.offerInstall(); } }));
  }

  /* Which steps to show when the browser cannot install in one tap. iPadOS
     reports itself as a Mac, so a touch screen on "MacIntel" is an iPad. */
  function installPlatform() {
    var ua = navigator.userAgent || "";
    if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
    if (/Android/.test(ua)) return "android";
    return "other";
  }

  var INSTALL_STEPS = {
    ios: [
      "Tap the Share button: a square with an arrow pointing up.",
      "Scroll down and tap Add to Home Screen. If it is not there, open this page in Safari and start again.",
      "Tap Add. Abante Minds appears with your other apps."
    ],
    android: [
      "Open the browser menu: three dots or three lines, at the top or bottom of the screen.",
      "Tap Add to Home screen, or Install app.",
      "Confirm. Abante Minds appears with your other apps."
    ],
    other: [
      "Look for an install button at the right end of the address bar.",
      "If there is none, open the browser menu and choose Install, or Add to Home screen.",
      "If neither is there, this browser cannot add apps. Open this page in Chrome and try again."
    ]
  };

  screens.installSteps = function (app) {
    var t = app.scratch.install || {};
    function done() {
      app.go(t.from || "home", "back");
    }
    var steps = INSTALL_STEPS[installPlatform()];
    return {
      nav: null,
      back: done,
      body: column([
        el("div", { style: { padding: "20px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-2)" } },
          el("div.heading-md", null, "Add to your home screen"),
          el("div.body", { style: { color: "var(--ink-600)", textWrap: "pretty" } },
            "This browser can't do it in one tap. Here is how.")),
        el("div", { style: { padding: "20px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: 10 } },
          steps.map(function (step, i) {
            return AM.Card({ style: { padding: 14, flexDirection: "row", alignItems: "flex-start", gap: "var(--space-3)" } },
              el("span.label", {
                style: {
                  flex: "none", width: 28, height: 28, borderRadius: "50%", background: "var(--brand-blue-100)",
                  color: "var(--brand-blue-600)", display: "flex", alignItems: "center", justifyContent: "center"
                }
              }, String(i + 1)),
              el("span.body-lg", { style: { textWrap: "pretty" } }, step));
          })),
        el("div.body-sm", { style: { padding: "16px " + gutter() + "px 0", color: "var(--ink-600)", textWrap: "pretty" } },
          "Already added it? Open Abante Minds from your home screen.")
      ]),
      footer: el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 20px", display: "flex", justifyContent: "center" } },
        el("div", { style: { width: "100%", maxWidth: 520 } },
          AM.Button({ label: "Done", fullWidth: true, onClick: done })))
    };
  };

  /* ---------- Questions did not load ----------
     The question pack is precached with the app, so this shows when the very
     first visit lost signal before it finished, when the phone cleared the
     site's storage, or when a broken pack reached the site (CI validates every
     pack to keep that from happening). No glyph: the icon set has none for
     offline, and the design says to state it in words. */
  screens.loadFailed = function () {
    return {
      nav: null,
      body: el("div", {
        style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-4)", padding: "32px 28px" }
      },
        el("div.heading-md", null, "The questions did not load"),
        el("div.body", { style: { color: "var(--ink-600)", textAlign: "center", textWrap: "pretty" } },
          "Connect to the internet once and try again. After that, practice works with no signal.")
      ),
      footer: el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 28px" } },
        AM.Button({ label: "Try again", fullWidth: true, onClick: function () { window.location.reload(); } }))
    };
  };

  /* ---------- Editing the learner's card, from Profile ----------
     Skill hues do the colour-picking work; the chosen swatch takes an ink-900
     edge rather than a tick. */
  screens.setup = function (app) {
    var p = store.get().profile || {};
    var draft = app.scratch.setup || (app.scratch.setup = {
      name: p.name || "", school: p.school || "", colorKey: p.colorKey || 1, iconKey: p.iconKey || "triangle",
      frame: p.frame || null, pattern: p.pattern || "binakol", flame: p.flame || "orange",
      initials: p.initials || "", title: p.title || "", motto: p.motto || ""
    });
    /* A choice redraws the screen; the screen stays where it was scrolled
       to, rather than jumping back to the top (seen by the owner, 2026-11-05). */
    function rerender() {
      var b = document.querySelector(".am-slot-body"), y = b ? b.scrollTop : 0;
      app.render();
      var b2 = document.querySelector(".am-slot-body");
      if (b2) b2.scrollTop = y;
    }
    /* What the reward road has given, and where the rest is on it. */
    var got = store.road().unlocked;
    function stepOf(kind, key) {
      for (var i = 0; i < 12; i++) if (AM.road.step(i).rewards.some(function (r) { return r.kind === kind && r.key === key; })) return i + 1;
      return null;
    }
    function locked(kind, key) {
      var list = { colour: got.colours, frame: got.frames, pattern: got.patterns, flame: got.flames }[kind];
      return list.indexOf(key) < 0;
    }
    function opensAt(kind, key) {
      var t = kind === "frame" ? store.CARD_TIERS.filter(function (x) { return x.key === key; })[0] : null;
      if (t) return "opens at " + t.name + ": " + t.days + " days with a full round" + (t.allTopics ? " and every topic cleared" : "");
      return "opens at step " + stepOf(kind, key) + " of the reward road";
    }
    function lockNote(kind, key) {
      AM.announce("This " + opensAt(kind, key) + ".");
    }
    function leave() { app.scratch.setup = null; app.go("profile", "back"); }

    function field(labelText, key) {
      return [
        el("div.caption", { style: { color: "var(--ink-600)", marginTop: "var(--space-2)" } }, labelText),
        el("input.body-lg.am-input", {
          type: "text", value: draft[key], "aria-label": labelText,
          oninput: function (e) { draft[key] = e.target.value; },
          onchange: function () { rerender(); }
        })
      ];
    }

    var swatches = el("div", { style: { display: "flex", gap: "var(--space-3)" } });
    swatches.style.flexWrap = "wrap";
    [1, 2, 3, 4, 5, 6, 7].forEach(function (k) {
      var on = draft.colorKey === k, shut = k > 4 && locked("colour", k);
      swatches.appendChild(el("button.am-reset.am-pressable" + (shut ? ".am-locked" : ""), {
        type: "button",
        "aria-label": "Colour " + k + (shut ? ", opens on the reward road" : ""), "aria-pressed": on ? "true" : "false",
        onClick: function () { if (shut) { lockNote("colour", k); return; } draft.colorKey = k; rerender(); },
        style: {
          "--am-edge": on ? "var(--ink-900)" : "var(--skill-" + k + "-deep)",
          width: 46, height: 46, borderRadius: "50%",
          background: on ? "var(--skill-" + k + "-bright)" : "var(--skill-" + k + "-tint)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 0, color: "var(--skill-" + k + "-deep)"
        }
      }, shut ? icon("lock", 18) : null));
    });

    /* A row of choices from the road; one not reached yet shows a lock and
       says which step opens it. */
    function choices(kind, field, options, preview) {
      var row = el("div", { style: { display: "flex", gap: "var(--space-3)", flexWrap: "wrap" } });
      options.forEach(function (key) {
        var on = draft[field] === key, shut = key !== null && key !== "orange" && key !== "binakol" && key !== "plain" && locked(kind, key);
        row.appendChild(el("button.am-reset.am-pressable" + (shut ? ".am-locked" : ""), {
          type: "button",
          "aria-label": (key || (kind === "frame" ? "your tier" : "none")) + (shut ? ", " + opensAt(kind, key) : ""), "aria-pressed": on ? "true" : "false",
          onClick: function () { if (shut) { lockNote(kind, key); return; } draft[field] = key; rerender(); },
          style: {
            "--am-edge": on ? "var(--ink-900)" : "var(--line-200)",
            position: "relative", width: 56, height: 56, borderRadius: "var(--radius-sm)", overflow: "hidden",
            background: "var(--surface-200)", display: "flex", alignItems: "center", justifyContent: "center", padding: 0
          }
        }, preview(key), shut ? el("span.am-lock-mark", null, icon("lock", 16)) : null));
      });
      return row;
    }
    var heldTier = store.tier().tier.key;
    var frameKeys = [null].concat(store.CARD_TIERS.map(function (t) { return t.key; }), got.frames.indexOf("year") > -1 ? ["year"] : []);
    var frames = choices("frame", "frame", frameKeys, function (key) { return miniCard(key || heldTier, draft.colorKey); });
    /* The weaves, each drawn from the name typed above. */
    var patterns = choices("pattern", "pattern", ["binakol", "kusikus", "triangles", "hexagons", "stars", "plain"], function (key) {
      if (key === "plain") return el("span.caption", { style: { color: "var(--ink-600)" } }, "Plain");
      return el("span", { style: { position: "absolute", inset: 0, background: "var(--skill-" + draft.colorKey + "-bright)" }, html: AM.weaveSVG(draft.name || "Abante", key) });
    });
    var flames = choices("flame", "flame", ["orange", "blue", "purple"], function (key) { return flameIn(30, key); });

    /* Chips: one of a few, pressed or not. */
    function chipRow(key, options) {
      return el("div.am-chips", null, options.map(function (opt) {
        var on = draft[key] === opt[0];
        return el("button.am-reset.am-chipbtn", { type: "button", "aria-pressed": on ? "true" : "false", onClick: function () { draft[key] = opt[0]; rerender(); } }, opt[1]);
      }));
    }
    /* A title is something earned: the tier, or a badge (the newest first). */
    var tierNow = store.tier().tier, cat = store.catalog(), earnedNames = [];
    cat.topics.forEach(function (t) { t.levels.forEach(function (b) { if (b.earned) earnedNames.push([b.at || "", b.name]); }); });
    cat.specials.forEach(function (b) { if (b.earned) earnedNames.push([b.at || "", b.name]); });
    earnedNames.sort(function (a, b) { return a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0; });
    var titleOptions = [["", "No title"], [tierNow.name + " card", tierNow.name + " card"]];
    earnedNames.slice(0, 8).forEach(function (n) { if (!titleOptions.some(function (o) { return o[0] === n[1]; })) titleOptions.push([n[1], n[1]]); });
    if (draft.title && !titleOptions.some(function (o) { return o[0] === draft.title; })) titleOptions.push([draft.title, draft.title]);
    var MOTTOS = ["Kaya ko 'to!", "Abante!", "Isa pa!", "Hakbang-hakbang", "Math is my thing"];
    var mottoField = el("input.body-lg.am-input", {
      type: "text", value: draft.motto, maxLength: 28, "aria-label": "Your motto", placeholder: "Something that keeps you going",
      oninput: function (e) { draft.motto = e.target.value; },
      onchange: function () { rerender(); }
    });
    var initialsField = el("input.body-lg.am-input", {
      type: "text", value: draft.initials, maxLength: 3, "aria-label": "Your initials", placeholder: AM.initialsOf(draft.name),
      style: { width: 120, textTransform: "uppercase" },
      oninput: function (e) { draft.initials = e.target.value; },
      onchange: function () { rerender(); }
    });

    return {
      nav: null,
      back: leave,
      body: el("div", { style: { flex: "none", width: "100%", maxWidth: 560, margin: "0 auto", boxSizing: "border-box", padding: "20px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-2)" } },
        el("div.heading-md", null, "Edit your card"),
        el("div.body-sm", { style: { color: "var(--ink-600)" } }, "This stays on the phone."),
        /* The card stays in view at the top while the choices scroll under it. */
        el("div.am-ecprev", null,
          AM.ProfileCard({
            name: draft.name, school: (draft.school ? draft.school + " · " : "") + "Grade 6", colorKey: draft.colorKey,
            frame: draft.frame || tierNow.key, pattern: draft.pattern, initials: draft.initials, title: draft.title, motto: draft.motto,
            style: { maxWidth: "none", width: "100%" }
          })),
        field("Your name", "name"),
        field("School or barangay (optional)", "school"),
        el("div.caption", { style: { color: "var(--ink-600)", marginTop: "var(--space-2)" } }, "Your initials (optional)"),
        initialsField,
        el("div.caption", { style: { color: "var(--ink-600)", marginTop: "var(--space-3)" } }, "Card colour"),
        swatches,
        el("div.caption", { style: { color: "var(--ink-600)", marginTop: "var(--space-3)" } }, "Your weave · made from your name"),
        patterns,
        draft.pattern === "binakol" ? el("span.body-sm", { style: { color: "var(--ink-600)" } }, "Inspired by Ilocano binakol weaving.") : null,
        el("div.caption", { style: { color: "var(--ink-600)", marginTop: "var(--space-3)" } }, "Title · from what you have earned"),
        chipRow("title", titleOptions),
        el("div.caption", { style: { color: "var(--ink-600)", marginTop: "var(--space-3)" } }, "Your motto · a line of your own"),
        mottoField,
        chipRow("motto", MOTTOS.map(function (x) { return [x, x]; })),
        el("div.caption", { style: { color: "var(--ink-600)", marginTop: "var(--space-3)" } }, "Card frame · your tier, or one you have kept"),
        frames,
        el("div.caption", { style: { color: "var(--ink-600)", marginTop: "var(--space-3)" } }, "Flame"),
        flames,
        el("span.body-sm", { style: { color: "var(--ink-600)", marginBottom: "var(--space-4)" } }, "More open on your reward road.")
      ),
      footer: el("div", { style: { flex: "none", width: "100%", maxWidth: 560, margin: "0 auto", boxSizing: "border-box", padding: "0 " + gutter() + "px 24px" } },
        AM.Button({
          label: "Save", fullWidth: true,
          onClick: function () {
            store.set({
              profile: {
                name: draft.name.trim(), school: draft.school.trim(), colorKey: draft.colorKey, iconKey: draft.iconKey,
                frame: draft.frame, pattern: draft.pattern, flame: draft.flame,
                initials: draft.initials.trim().toUpperCase().slice(0, 3), title: draft.title, motto: draft.motto.trim().slice(0, 28)
              }
            });
            leave();
          }
        }))
    };
  };

  /* ---------- 5 / 6 / 17 · Home ----------
     The countdown to the exam, how much of the path is cleared, and the one
     level to do next. The streak stays; the tier ladder is gone, because the
     path replaced tiers. */
  function pct(ratio) { return Math.round(ratio * 100); }

  /* The tile a topic carries everywhere: its icon in two tones of its own
     colour, on the pale tint of it. */
  function topicTile(t, size) {
    size = size || 40;
    return el("span", {
      style: {
        flex: "none", width: size, height: size, borderRadius: "var(--radius-sm)",
        background: t.ready ? "var(--skill-" + t.colorKey + "-tint)" : "var(--surface-300)",
        color: "var(--ink-600)",
        display: "flex", alignItems: "center", justifyContent: "center"
      }
    }, t.ready ? AM.topicIcon(t.icon, Math.round(size * 0.66), t.colorKey) : icon("lock", Math.round(size / 2)));
  }

  function levelLabel(next) { return next.topic.label + " · Level " + next.level.number; }

  /* How far a Basics topic has got: facts mastered, levels cleared, or both. */
  function basicsCaption(t) {
    var parts = [];
    if (t.facts) parts.push(t.mastered + " of " + t.facts + " facts mastered");
    if (t.practiceLevels) parts.push(t.cleared + " of " + t.practiceLevels + " levels cleared");
    return parts.join(" · ");
  }
  function basicsRatio(t) {
    var done = t.mastered + t.cleared, all = t.facts + t.practiceLevels;
    return all ? done / all : 0;
  }
  function factLook(key) {
    var f = store.factState(key);
    return f.mastered ? "mastered" : f.seen ? "learning" : "fresh";
  }
  /* The day streak on Home: the flame, lit once there is a day to count,
     beside the number. Still here; it moves only in a celebration. */
  function streakBadge(days) {
    return el("span.am-combo", { role: "img", "aria-label": days + " day" + (days === 1 ? "" : "s") + " in a row", style: { padding: "4px 14px 4px 6px" } },
      AM.Flame ? AM.Flame(24, days > 0) : icon("streak", 20),
      el("span.am-combo-num", { "aria-hidden": "true", style: { fontSize: 22 } }, String(days)));
  }
  /* What the button does. A round always starts afresh, so it never says
     "Continue": nothing is resumed. */
  function levelVerb(level) { return level.attempts ? "Practise" : "Start"; }

  /* The end of the round that met today's goal says so, once. */
  function goalMet(app) {
    if (!app.scratch.goalMet) return null;
    return el("div", { style: { padding: "14px " + gutter() + "px 0", display: "flex" } },
      AM.Chip({ icon: "check", label: "Today's goal done!", large: true, background: "var(--success-100)", color: "var(--success-700)" }));
  }

  /* The next streak badge in a line, under the learner's name. */
  function streakGoal(s) {
    var goal = store.nextStreakBadge(), back = s.streakDays > 1 ? "Back for day " + s.streakDays : null;
    if (!goal) return back || "Good to see you";
    if (!back) return goal.days + " days in a row earns a streak badge";
    return back + " · " + goal.left + " more day" + (goal.left === 1 ? "" : "s") + " earns a badge";
  }

  function nextBadgeName(next) {
    var found = store.findBadge("lv:" + next.topic.key + "/" + next.level.id);
    return found ? found.badge.name : "this level's badge";
  }

  /* The topic at a glance: a segment for each level, the cleared ones full and
     the current one filled as far as it has got. */
  function levelSegments(next, onColour) {
    var levels = store.topicPath(next.topic.key).levels, colour = onColour ? "#fff" : "var(--skill-" + next.topic.colorKey + "-bright)";
    return el("div", {
      role: "img", "aria-label": "Level " + next.level.number + " of " + levels.length + ". " + next.level.correct + " of " + next.level.target + " right first time.",
      style: { display: "flex", gap: onColour ? 5 : 4 }
    }, levels.map(function (lv) {
      var ratio = lv.cleared ? 1 : lv.id === next.level.id ? next.level.correct / next.level.target : 0;
      return el("span", { style: { flex: 1, height: onColour ? 10 : 8, borderRadius: "var(--radius-pill)", background: onColour ? "rgba(255, 255, 255, 0.25)" : "var(--surface-300)", overflow: "hidden" } },
        el("span", { style: { display: "block", height: "100%", width: Math.round(ratio * 100) + "%", background: colour } }));
    }));
  }

  screens.home = function (app) {
    var s = store.get();
    var p = store.path();
    var first = !store.hasProgress();
    var desktop = AM.device() === "desktop";
    var next = p.next;

    var headline = first
      ? el("div", { style: { padding: "24px " + gutter() + "px 0" } },
          el("div.heading-lg.am-name", null, "Hello, " + ((s.profile && s.profile.name.split(" ")[0]) || "there")),
          el("div.body-sm", { style: { color: "var(--ink-600)", marginTop: 4, textWrap: "pretty" } }, streakGoal(s)))
      : el("div", {
          style: { padding: "24px " + gutter() + "px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-3)" }
        },
          greetingBlock(s, streakGoal(s)),
          desktop ? null : streakBadge(s.streakDays)
        );

    /* The exam at a glance: how ready, as a gauge, and where practice would
       add the most, which opens that topic. */
    var ready = store.readiness();
    var countdown = AM.Card({ style: { flexDirection: "row", alignItems: "center", gap: 14 } },
      AM.Gauge(ready.started ? ready.percent || 0 : 0, 64),
      el("span", { style: { display: "flex", flexDirection: "column", gap: 4, minWidth: 0 } },
        el("span.heading-sm", null, p.daysToExam === null ? "Your path" : p.daysToExam === 0 ? "Exam day" : "Exam in " + p.daysToExam + " day" + (p.daysToExam === 1 ? "" : "s")),
        el("span.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } },
          (p.daysToExam === null ? "" : "30 January. ") + (!ready.started ? "Clear your first level to start filling this."
            : (ready.percent ? "About " + ready.percent + "% ready" : "Just getting started") + ", from your answers, not the real exam.")),
        ready.started && ready.focus ? el("button.am-reset.am-togain", { type: "button", onClick: function () { app.openTopic(ready.focus.key); } }, "Most to gain: " + ready.focus.label + " ›") : null));

    /* Up next leads the screen, in its topic's colour. */
    var upNext = next
      ? AM.HeroNext({
          colorKey: next.topic.colorKey,
          eyebrow: "Up next · " + next.topic.label,
          title: next.level.title,
          sub: "Level " + next.level.number + " of " + store.topicPath(next.topic.key).levels.length,
          art: (function () {
            var nb = store.findBadge("lv:" + next.topic.key + "/" + next.level.id);
            return nb ? badgeButton(nb, 64) : el("span", { style: { width: 56, height: 56, borderRadius: 16, background: "#fff", display: "grid", placeItems: "center", transform: "rotate(-6deg)" } },
              AM.topicIcon(next.topic.icon, 36, next.topic.colorKey));
          })(),
          segments: levelSegments(next, true),
          meta: !next.level.lessonSeen && next.level.hasLesson
            ? "Starts with a short lesson. " + next.level.target + " right first time earns " + nextBadgeName(next) + "."
            : next.level.correct + " of " + next.level.target + " right first time to earn " + nextBadgeName(next),
          button: AM.Button({ label: levelVerb(next.level) + " level " + next.level.number, fullWidth: true, onClick: function () { app.startLevel(next.topic.key, next.level.id); } })
        })
      : AM.Card({ style: { gap: 10 } },
          sectionLabel("Up next"),
          el("span.body", { style: { textWrap: "pretty" } }, "Every level on the path is cleared. Review any level from the path, or try a practice exam."));

    var written = p.topics.filter(function (t) { return t.ready; });
    var pathCard = (first || AM.device() === "phone") ? null : AM.Card({ style: { padding: "var(--space-6)", gap: 14 } },
      sectionLabel("Your path"),
      AM.TopicBars(written.map(function (t) {
        return { label: t.label, correct: t.cleared, total: t.total, caption: t.cleared + " of " + t.total + " levels", color: "var(--skill-" + t.colorKey + "-bright)" };
      }), { height: 10 }),
      p.topics.length > written.length
        ? el("span.body-sm", { style: { color: "var(--ink-600)" } }, (p.topics.length - written.length) + " more topic" + (p.topics.length - written.length === 1 ? "" : "s") + " coming")
        : null);

    var badgeCard = first ? null : (function () {
      var cat = store.catalog(), shown = store.showcase();
      /* On a phone it waits for a first badge to show. */
      if (AM.device() === "phone" && !shown.length) return null;
      return AM.RowCard({
        lead: AM.LeadTile("trophy"), title: "Your badges · " + cat.earned + " of " + cat.total,
        caption: shown.length ? null : "Clear a level to earn your first",
        extra: shown.length ? el("span", { "aria-hidden": "true", style: { display: "flex", gap: 6, marginTop: 6 } },
          shown.map(function (k) { var b = store.findBadge(k, cat); return b ? el("span", { style: { width: 36, height: 36, display: "inline-flex" }, html: AM.badgeArt.art(b, 36) }) : null; })) : null,
        onClick: function () { app.scratch.badgesBack = null; app.go("badges"); }
      });
    })();

    /* Basics sit beside the path: open any time, and never counted on it. */
    var basics = store.basics();
    var basicsCard = basics.length ? AM.Card({ style: { gap: 12 } },
      sectionLabel("Basics · practise any time"),
      el("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
        basics.slice(0, 2).map(function (t) {
          return el("span", { style: { display: "flex", gap: "var(--space-3)", alignItems: "center" } },
            topicTile(t, 32),
            el("span", { style: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 } },
              el("span.label", null, t.label),
              AM.ProgressBar({ ratio: basicsRatio(t), height: 6, color: "var(--skill-" + t.colorKey + "-bright)", label: t.label + " progress" }),
              el("span.caption", { style: { color: "var(--ink-600)" } }, basicsCaption(t))));
        })),
      AM.Button({ label: "Practise the basics", variant: "ghost", fullWidth: true, onClick: function () { app.go("basics"); } })) : null;

    /* Missed questions that are due again (spaced review). */
    var due = store.reviewDue().length;
    var reviewCard = due ? AM.RowCard({
      lead: AM.LeadTile("retry"), title: due + " question" + (due === 1 ? "" : "s") + " to try again",
      caption: "Ones you missed, back so they stick", trailing: "Review",
      onClick: function () { app.startReview(); }
    }) : null;

    /* The practice exam: the whole paper at once, against the clock. */
    var exam = store.examStats();
    var examCard = first ? null : AM.RowCard({
      lead: AM.LeadTile("clock"), title: "Practice exam · " + app.EXAM_COUNT + " questions, " + app.EXAM_MINUTES + " minutes",
      caption: exam ? "Last " + exam.last.score + " of " + exam.last.total + " · best " + exam.best.score + " of " + exam.best.total : "Every topic, as the exam weighs them",
      onClick: function () { app.go("examIntro"); }
    });

    /* The streak and today's goal, together, above everything else. */
    var goal = store.dailyGoal();
    var goalCard = AM.StreakPanel({ days: s.streakDays, strip: store.weekStrip(), goal: goal });

    /* Last week, from the week after, until it is put away. */
    var last = store.recap();
    var recapCard = last ? AM.Card({ style: { gap: 8 } },
      el("span", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)" } },
        el("span.label", null, "Your last week"),
        el("button.am-reset.am-dismiss", {
          type: "button", "aria-label": "Put away", title: "Put away",
          onClick: function () { store.dismissRecap(); },
          style: {
            flex: "none", width: "var(--tap-button)", height: "var(--tap-button)", margin: "-12px -12px -12px 0",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--ink-600)", background: "none", border: 0, cursor: "pointer", padding: 0
          }
        }, icon("x", 20))),
      el("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-2)", textAlign: "center" } },
        [[last.days, last.days === 1 ? "day" : "days"], [last.asked, last.asked === 1 ? "question" : "questions"], [last.levels, last.levels === 1 ? "level cleared" : "levels cleared"]].map(function (x) {
          return el("span", { style: { display: "flex", flexDirection: "column" } },
            el("span.heading-md", null, String(x[0])), el("span.caption", { style: { color: "var(--ink-600)" } }, x[1]));
        })),
      el("span.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } },
        (last.asked ? Math.round(100 * last.right / last.asked) + "% right first time" : "") +
        (last.best && C.byKey(last.best) ? ". Strongest: " + C.byKey(last.best).label.toLowerCase() + "." : "."))) : null;

    var shielded = store.shieldSaved();
    var forgiven = shielded && s.lastActiveDay !== store.today() ? AM.Card({ style: { gap: 4 } },
      el("span.label", { style: { display: "inline-flex", alignItems: "center", gap: 6 } }, icon("shield", 18), "A shield kept your streak"),
      el("span.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } },
        (shielded.used === 1 ? "A streak shield covered" : shielded.used + " streak shields covered") + " the days you missed. Practise today to keep your " + shielded.streak + "-day streak going."))
      : store.forgivenYesterday() && s.lastActiveDay !== store.today() ? AM.Card({ style: { gap: 4 } },
      el("span.label", null, "Your streak is safe"),
      el("span.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } }, "You missed yesterday, and one missed day a week is forgiven. Practise today to keep it going.")) : null;

    /* The challenge round: quick timed rounds, once a level is cleared. */
    var challengeOpen = store.challengePool().length > 0;
    var challengeBest = Math.max.apply(null, Object.keys(AM.challenge.MODES).map(function (m) {
      var b = store.challengeStats(m).best;
      return b ? b.score : 0;
    }));
    var challengeCard = first ? null : AM.RowCard({
      lead: AM.LeadTile("level-up", "action"), title: "Challenge · 60-second sprint, speed ladder",
      caption: !challengeOpen ? "Clear a level to open it" : challengeBest ? "Your best: " + challengeBest + " points" : "Quick rounds from levels you have cleared",
      onClick: function () { app.go("challengeIntro"); }, disabled: !challengeOpen
    });

    var offer = s.totalCorrect > 0 && app.canOfferInstall() && !s.installCardDismissed ? installCard(app) : null;

    /* Tablet and desktop spend the extra width on a second card rather than on
       longer lines. */
    var cards = AM.device() === "phone"
      ? el("div", { style: { display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "0 " + gutter() + "px" } },
          goalCard, forgiven, recapCard, upNext, offer, reviewCard, countdown, badgeCard, examCard, challengeCard, basicsCard)
      : el("div", { style: { display: "flex", flexDirection: "column", gap: desktop ? 32 : 24, padding: "0 " + gutter() + "px" } },
          goalCard,
          forgiven,
          recapCard,
          el("div.am-pair", null, upNext,
            el("div", { style: { display: "flex", flexDirection: "column", gap: desktop ? 32 : 24, minWidth: 0 } }, countdown, badgeCard)),
          offer,
          reviewCard,
          el("div.am-pair", null, examCard, challengeCard),
          el("div.am-pair", null, pathCard, basicsCard));

    return {
      nav: "home",
      banner: connectionBanner(),
      railFooter: el("span.am-rail-note", {
        style: { background: "var(--brand-blue-100)", color: "var(--brand-blue-600)" }
      }, icon("streak", 22), el("span.label", { style: { color: "var(--ink-900)" } },
        s.streakDays + " day" + (s.streakDays === 1 ? "" : "s") + " in a row")),
      body: column([headline, el("div", { style: { height: 20 } }), cards], { gap: 0, paddingBottom: 24 })
    };
  };

  /* ---------- 7 / 8 · The path ----------
     Every topic of the blueprint in the order the app teaches them. Any
     written topic can be opened; the one to do next is marked. A topic not yet
     written is shown, locked, as coming soon, so the path never pretends to be
     the whole exam when it is not. */
  screens.topics = function (app) {
    var p = store.path();
    var next = p.next, nextKey = next ? next.topic.key : null;
    var ready = store.readiness();
    var gainKey = ready.started && ready.focus && ready.focus.key !== nextKey ? ready.focus.key : null;

    /* Where you are: the level to carry on with, one tap from starting it. */
    var resume = next ? (function () {
      var lv = next.level, left = Math.max(0, lv.target - lv.correct);
      var caption = lv.title + " · " + (!lv.lessonSeen && lv.hasLesson ? "starts with a short lesson" : left + " more to clear");
      var segs = el("span.am-resume-segs", { "aria-hidden": "true" });
      for (var i = 0; i < lv.target; i++) segs.appendChild(el(i < lv.correct ? "i.on" : "i"));
      return el("button.am-reset.am-pressable.am-resume", {
        type: "button", "aria-label": levelVerb(lv) + " " + levelLabel(next) + ": " + caption,
        onClick: function () { app.startLevel(next.topic.key, lv.id); },
        style: { "--am-edge": "var(--brand-blue-600)", "--tc": "var(--skill-" + next.topic.colorKey + "-bright)" }
      },
        topicTile(next.topic, 48),
        el("span.am-resume-text", null, el("b", null, levelLabel(next)), el("small", null, caption), segs),
        el("span.am-resume-go", { "aria-hidden": "true" }, icon("next", 24)));
    })() : null;

    /* Every topic, two to a row on a phone: how far it has got, and a tag on
       the one to do next and the one with the most to gain. A topic not yet
       written lies flat, as coming soon. */
    var grid = el("div.am-tgrid");
    p.topics.forEach(function (t) {
      var caption = !t.ready ? "Coming soon" : t.done ? "All " + t.total + " levels cleared" : t.cleared + " of " + t.total + " levels";
      var tag = t.key === nextKey ? "Up next" : t.key === gainKey ? "Most to gain" : null;
      var dots = el("span.am-tdots", { "aria-hidden": "true" });
      for (var i = 0; i < t.total; i++) dots.appendChild(el("i", { style: i < t.cleared ? { background: "var(--skill-" + t.colorKey + "-bright)" } : null }));
      grid.appendChild(el(t.ready ? "button.am-reset.am-pressable.am-ttile" : "div.am-ttile.am-ttile-soon", {
        type: t.ready ? "button" : null,
        "aria-label": t.label + ", " + caption + (tag ? ", " + tag.toLowerCase() : ""),
        onClick: t.ready ? function () { app.openTopic(t.key); } : null,
        style: t.ready ? { "--am-edge": t.key === nextKey ? "var(--brand-blue-600)" : "var(--surface-300)" } : null
      },
        el("span.am-ttile-top", null, topicTile(t, 44),
          tag ? el("span.am-ttag" + (tag === "Up next" ? "" : ".gain"), { "aria-hidden": "true" }, tag) : null),
        el("span.am-ttile-name", null, t.label),
        el("span.am-ttile-foot", null, t.total ? dots : null, el("span.caption.am-ttile-cap", null, caption))));
    });

    /* Basics sit beside the path: open any time, and never counted on it. */
    var basics = store.basics();
    var basicsList = basics.length ? el("div.am-stack", null, basics.map(function (t) {
      return AM.RowCard({
        lead: topicTile(t, 44), title: t.label, caption: basicsCaption(t),
        onClick: function () { app.scratch.basicsBack = "topics"; app.openBasicsTopic(t.key); }
      });
    })) : null;

    return {
      nav: "practice",
      banner: connectionBanner(),
      body: column([
        el("div", { style: { padding: "20px " + gutter() + "px 0" } },
          el("h1.heading-lg", { style: { margin: 0 } }, "Practice"),
          el("div.body-sm", { style: { color: "var(--ink-600)", marginTop: 4, textWrap: "pretty" } },
            p.levelsCleared + " of " + p.levelsTotal + " levels cleared" + (p.daysToExam === null ? "" : " · exam in " + p.daysToExam + " days"))),
        el("div", { style: { padding: "0 " + gutter() + "px" } },
          resume,
          sectionHead("Topics", p.topics.length + " topics"),
          grid,
          basicsList ? sectionHead("Basics", "Practise any time") : null,
          basicsList)
      ], { paddingBottom: 24 })
    };
  };

  function sectionHead(title, aside) {
    return el("div.am-sec-h", null, el("h2", null, title), aside ? el("span", null, aside) : null);
  }

  /* ---------- A topic's levels ----------
     Levels open in order: a cleared one can be reviewed, the current one
     continued, a locked one waits for the one before it. */
  screens.topic = function (app) {
    var t = store.topicPath(app.scratch.topic);
    if (!t || !t.ready) { app.go("topics"); return screens.topics(app); }
    var current = t.current, back = function () { app.go("topics", "back"); };

    var band = AM.TopicBand({
      colorKey: t.colorKey, onBack: back, backLabel: "Back to Practice",
      art: AM.topicIcon(t.icon, 40, t.colorKey), title: t.label,
      sub: t.done ? "All " + t.total + " levels cleared" : t.cleared + " of " + t.total + " levels cleared",
      ratio: t.total ? t.cleared / t.total : 0, barLabel: t.cleared + " of " + t.total + " levels cleared"
    });

    /* The levels as a path: cleared ones can be practised again, the current
       one shows how far it has got, a locked one waits for the one before. */
    var path = el("div.am-lpath", { style: { "--tc": "var(--skill-" + t.colorKey + "-bright)", "--tc-deep": "var(--skill-" + t.colorKey + "-deep)" } });
    t.levels.forEach(function (lv) {
      var st = lv.cleared ? "done" : lv.unlocked ? "now" : "locked";
      var caption = lv.cleared ? "Cleared · tap to review"
        : lv.unlocked ? (!lv.lessonSeen && lv.hasLesson ? "Starts with a short lesson · " : "") + lv.correct + " of " + lv.target + " right first time to clear"
        : "Clear level " + (lv.number - 1) + " to open";
      var head = [el("b", null, "Level " + lv.number + " · " + lv.title), el("small", null, caption)];
      var body;
      if (lv.cleared) {
        body = el("button.am-reset.am-pressable.am-lbody", {
          type: "button", "aria-label": "Level " + lv.number + ", " + lv.title + ", cleared. Practise it again.",
          onClick: function () { app.startLevel(t.key, lv.id); }, style: { "--am-edge": "var(--surface-300)" }
        }, head);
      } else if (lv.unlocked) {
        var segs = el("span.am-lsegs", { role: "img", "aria-label": lv.correct + " of " + lv.target + " right first time" });
        for (var i = 0; i < lv.target; i++) segs.appendChild(el(i < lv.correct ? "i.on" : "i"));
        body = el("div.am-lbody", null, head, segs,
          lv.hasLesson && lv.lessonSeen ? el("button.am-reset.am-togain", { type: "button", onClick: function () { app.openLesson(t.key, lv.id); } }, "See the lesson again") : null);
      } else body = el("div.am-lbody", null, head);
      path.appendChild(el("div.am-lrow." + st, null,
        el("span.am-lnode", { "aria-hidden": "true" }, lv.cleared ? icon("check", 22, { glyph: true }) : lv.unlocked ? String(lv.number) : icon("lock", 18)),
        body));
    });

    return {
      nav: "practice",
      banner: connectionBanner(),
      onBack: back,
      body: column([
        el("div", { style: { padding: "12px " + gutter() + "px 0" } }, band),
        el("div", { style: { padding: "20px " + gutter() + "px 0" } }, path)
      ], { paddingBottom: 24, maxWidth: 720 }),
      footer: el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 24px", display: "flex", justifyContent: "center" } },
        el("div", { style: { width: "100%", maxWidth: 520 } },
          current ? AM.Button({ label: levelVerb(current) + " level " + current.number, fullWidth: true, onClick: function () { app.startLevel(t.key, current.id); } })
            : AM.Button({ label: "Back to Practice", fullWidth: true, onClick: back })))
    };
  };

  /* ---------- Basics ----------
     The facts and methods under every topic: times tables, adding and
     subtracting, mental math. Every level is open, at any time, as often as
     the learner likes. A fact is mastered when it is right and quick on two
     different days, and a miss sends it back, so there is always something
     worth another round. Nothing here opens or closes the exam path. */
  function basicsRowButton(t, onClick, caption, ratio) {
    return el("button.am-reset.am-pressable.am-path-row", {
      type: "button", "aria-label": t.label + ", " + caption, onClick: onClick,
      style: {
        "--am-edge": "var(--line-200)", display: "flex", alignItems: "center", gap: "var(--space-3)", width: "100%", textAlign: "left",
        padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--surface-200)", color: "var(--ink-900)", cursor: "pointer"
      }
    },
      topicTile(t),
      el("span", { style: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 } },
        el("span.label", null, t.label),
        AM.ProgressBar({ ratio: ratio, height: 6, color: "var(--skill-" + t.colorKey + "-bright)", label: t.label + " progress" }),
        el("span.caption", { style: { color: "var(--ink-600)" } }, caption)),
      el("span", { style: { flex: "none", color: "var(--ink-600)" } }, icon("next", 20)));
  }

  screens.basics = function (app) {
    var list = el("div", { style: { display: "flex", flexDirection: "column", gap: 10, padding: "18px " + gutter() + "px 0" } });
    store.basics().forEach(function (t) {
      list.appendChild(basicsRowButton(t, function () { app.scratch.basicsBack = null; app.openBasicsTopic(t.key); }, basicsCaption(t), basicsRatio(t)));
    });
    return {
      nav: "practice",
      banner: connectionBanner(),
      back: function () { app.go("home", "back"); },
      body: column([
        el("div", { style: { padding: "20px " + gutter() + "px 0" } },
          el("div.heading-md", null, "Basics"),
          el("div.body-sm", { style: { color: "var(--ink-600)", marginTop: 4, textWrap: "pretty" } },
            "The facts and methods under every topic, so you can work without a calculator. Practise any time; nothing here opens or closes your exam path.")),
        list
      ], { paddingBottom: 24 })
    };
  };

  /* A Basics topic: its levels, all open, and its grid if it has one. */
  screens.basicsTopic = function (app) {
    var t = store.basicsTopic(app.scratch.basicsTopic);
    if (!t) { app.go("basics"); return screens.basics(app); }

    var list = el("div", { style: { display: "flex", flexDirection: "column", gap: 10, padding: "18px " + gutter() + "px 0" } });
    t.levels.forEach(function (lv) {
      var isNext = t.next && t.next.id === lv.id;
      var caption = lv.kind === "review" ? "All " + lv.facts + " facts, the ones that need work first"
        : lv.kind === "facts" ? lv.mastered + " of " + lv.facts + " facts mastered"
        : lv.cleared ? "Cleared · practise again any time" : lv.correct + " of " + lv.target + " right first time to clear";
      var ratio = lv.kind === "facts" ? lv.mastered / lv.facts : lv.kind === "practice" ? lv.correct / lv.target : null;
      var glyph = lv.done ? "check" : lv.kind === "review" ? "retry" : lv.kind === "facts" ? "streak" : "lesson";
      list.appendChild(el("button.am-reset.am-pressable.am-path-row", {
        type: "button", "aria-label": lv.title + ", " + caption + (isNext ? ", up next" : ""),
        onClick: function () { app.startLevel(t.key, lv.id); },
        style: {
          "--am-edge": isNext ? "var(--brand-blue-600)" : "var(--line-200)",
          display: "flex", alignItems: "center", gap: "var(--space-3)", width: "100%", textAlign: "left",
          padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--surface-200)", color: "var(--ink-900)", cursor: "pointer"
        }
      },
        el("span", {
          style: {
            flex: "none", width: 40, height: 40, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: lv.done ? "var(--skill-" + t.colorKey + "-bright)" : "var(--skill-" + t.colorKey + "-tint)",
            color: lv.done ? "var(--ink-inverse)" : "var(--skill-" + t.colorKey + "-deep)"
          }
        }, icon(glyph, 20)),
        el("span", { style: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 } },
          el("span", { style: { display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" } },
            el("span.label", null, lv.title),
            isNext ? AM.Chip({ label: "Up next" }) : null),
          ratio === null ? null : AM.ProgressBar({ ratio: ratio, height: 6, color: "var(--skill-" + t.colorKey + "-bright)", label: lv.title + " progress" }),
          el("span.caption", { style: { color: "var(--ink-600)" } }, caption))));
    });

    var grid = t.grid ? C.grid(t.key) : null;
    var gridCard = grid ? el("div", { style: { padding: "20px " + gutter() + "px 0" } },
      AM.Card({ style: { gap: 12 } },
        sectionLabel(grid.title),
        AM.FactGrid({ grid: grid, colorKey: t.colorKey, state: factLook }),
        el("span.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } },
          "A fact is mastered when you get it right in under 4 seconds on two different days. A miss sends it back to practise."))) : null;

    var target = t.next || t.levels.filter(function (lv) { return lv.kind === "review"; })[0] || t.levels[0];
    var actions = [AM.Button({
      label: (t.next ? "Practise: " : "Review: ") + target.title, fullWidth: true,
      onClick: function () { app.startLevel(t.key, target.id); }
    })];
    if (target.hasLesson && target.lessonSeen) actions.push(AM.Button({
      label: "See the lesson again", variant: "ghost", fullWidth: true,
      onClick: function () { app.openLesson(t.key, target.id); }
    }));

    var from = app.scratch.basicsBack === "topics" ? "topics" : "basics";
    var back = function () { app.go(from, "back"); };
    return {
      nav: "practice",
      banner: connectionBanner(),
      onBack: back,
      body: column([
        el("div", { style: { padding: "12px " + gutter() + "px 0" } },
          AM.TopicBand({
            colorKey: t.colorKey, onBack: back, backLabel: from === "topics" ? "Back to Practice" : "Back to Basics",
            art: AM.topicIcon(t.icon, 40, t.colorKey), title: t.label, sub: basicsCaption(t),
            ratio: basicsRatio(t), barLabel: basicsCaption(t)
          })),
        gridCard,
        list
      ], { paddingBottom: 24, maxWidth: 720 }),
      footer: el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 24px", display: "flex", justifyContent: "center" } },
        el("div", { style: { width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 10 } }, actions))
    };
  };

  /* ---------- A level's lesson ----------
     Two or three cards before the first practice: the idea, a worked example
     with every step shown, and the mistake to avoid. One card at a time, so a
     small screen never has to scroll through a wall of text. */
  screens.lesson = function (app) {
    var l = app.scratch.lesson;
    if (!l) { app.go("home"); return screens.home(app); }
    var t = C.byKey(l.topic);
    var number = t.levels.findIndex(function (x) { return x.id === l.level; }) + 1;
    var lv = { number: number, title: t.levels[number - 1].title };
    var card = l.cards[l.page];
    var last = l.page === l.cards.length - 1;

    var dots = el("span", { style: { display: "flex", gap: 6 }, "aria-label": "Card " + (l.page + 1) + " of " + l.cards.length });
    l.cards.forEach(function (_, i) {
      dots.appendChild(el("span", {
        style: {
          width: i === l.page ? 20 : 8, height: 8, borderRadius: "var(--radius-pill)",
          background: i <= l.page ? "var(--skill-" + t.colorKey + "-bright)" : "var(--surface-300)"
        }
      }));
    });

    var content;
    if (card.kind === "text") {
      content = el("div", { style: { padding: "20px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-3)" } },
        el("div.heading-md", null, card.title),
        el("div.body-lg", { style: { textWrap: "pretty" } }, card.body));
    } else {
      var steps = el("div", { style: { display: "flex", flexDirection: "column", gap: 10 } });
      card.steps.forEach(function (st, i) {
        steps.appendChild(AM.Card({ style: { padding: 14, flexDirection: "row", alignItems: "flex-start", gap: "var(--space-3)" } },
          el("span.am-lesson-step", { style: { background: "var(--skill-" + t.colorKey + "-tint)", color: "var(--skill-" + t.colorKey + "-deep)" } }, String(i + 1)),
          el("span.body-lg", { style: { textWrap: "pretty" } }, st)));
      });
      content = el("div", { style: { padding: "20px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-3)" } },
        el("div.heading-md", null, card.title),
        /* A short prompt is the sum itself, set large; a longer one is read. */
        card.prompt && card.prompt.length <= 28 ? el("div.am-lesson-prompt", null, card.prompt)
          : el("div.body-lg", { style: { fontWeight: 600, textWrap: "pretty" } }, card.prompt),
        card.chart ? AM.Chart(card.chart) : null,
        steps,
        el("div", {
          style: {
            border: "2px solid var(--success-700)", background: "var(--success-100)", borderRadius: "var(--radius-md)",
            padding: "var(--space-3) var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-3)"
          }
        },
          el("span", { style: { color: "var(--success-700)", flex: "none" } }, icon("check", 22, { glyph: true })),
          el("span", null,
            el("span.caption", { style: { display: "block", color: "var(--success-700)" } }, "Answer"),
            el("span.heading-md", null, card.answer))),
        el("div.body", { style: { color: "var(--ink-600)", textWrap: "pretty" } }, card.explain));
    }

    return {
      nav: null,
      back: function () { app.lessonPage(-1); },
      body: column([
        el("div", { style: { padding: "16px " + gutter() + "px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" } },
          el("span.caption.am-lesson-eyebrow", { style: { color: "var(--skill-" + t.colorKey + "-deep)" } }, t.label + " · Level " + lv.number + " · " + lv.title),
          dots),
        content
      ], { paddingBottom: 24 }),
      footer: el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 24px", display: "flex", justifyContent: "center" } },
        el("div", { style: { width: "100%", maxWidth: 520 } },
          AM.Button({ label: last ? "Start practice" : "Next", iconRight: last ? null : "next", fullWidth: true, onClick: function () { app.lessonPage(1); } })))
    };
  };

  /* ---------- 9–13, 15, 18 · Practice ----------
     One screen. Question text gets the most room at every width; correct and
     wrong each carry a glyph, never a fill alone. */
  screens.practice = function (app) {
    var ses = app.session;
    if (!ses) { app.go("home"); return screens.home(app); }

    var q = ses.questions[ses.index];
    var desktop = AM.device() === "desktop";
    var offline = !store.isOnline();
    var header = AM.PracticeHeader({
      onClose: openLeave,
      tier: ses.review ? (offline ? "Offline · review" : "Review")
        : ses.facts ? (offline ? "Offline · " : "") + ses.levelTitle : (offline ? "Offline · level " : "Level ") + ses.levelNumber,
      questionIndex: ses.index, questionTotal: ses.questions.length
    });

    /* ----- question text ----- */
    var answered = ses.phase !== "ask";
    if (!answered) ses.verdictShown = null;
    var promptNode = answered
      ? el("div", { style: { padding: "20px " + gutter() + "px 0" } },
          el("div.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } }, q.prompt))
      : el("div", { style: { padding: "24px " + gutter() + "px 0" } },
          el(desktop ? "div.heading-lg" : "div.body-lg", {
            style: desktop ? { textWrap: "pretty" } : { fontWeight: 500, textWrap: "pretty" }
          }, q.prompt));
    /* The graph stays in view after answering: the explanation reads from it.
       The desktop layout places its own. */
    var chartNode = q.chart && !desktop ? el("div", { style: { padding: "16px " + gutter() + "px 0", display: "flex" } }, AM.Chart(q.chart)) : null;

    /* ----- the answer surface ----- */
    function answerArea() {
      if (q.type === "choice") {
        var grid = el("div", {
          style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", padding: "24px " + gutter() + "px 0" }
        });
        q.choices.forEach(function (label, i) {
          var state = "idle";
          if (ses.phase === "ask") state = ses.picked === i ? "selected" : "idle";
          else if (i === q.answerIndex) state = "correct";
          else if (ses.picked === i) state = "wrong";
          grid.appendChild(AM.AnswerTile({
            text: label, state: state, tall: true, disabled: answered, figure: q.choiceFigures ? q.choiceFigures[i] : null,
            onClick: function () { if (!answered) { ses.picked = i; app.render(); } }
          }));
        });
        return grid;
      }
      return el("div", { style: { padding: "20px " + gutter() + "px 0" } }, answerField(desktop));
    }

    function answerField(tall) {
      return AM.AnswerField({ entry: ses.entry, prefix: q.unit, suffix: q.suffix, tall: tall, onFocusBox: app.focusBox });
    }

    /* ----- hints (13) ----- */
    function hintPanel() {
      if (!ses.showHints) return null;
      var wrap = el("div", { style: { padding: "18px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: 10 } },
        sectionLabel("Hint " + Math.max(1, ses.hintsRevealed) + " of " + q.hints.length));
      var list = el("div", {
        style: desktop
          ? { display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "var(--space-3)" }
          : { display: "flex", flexDirection: "column", gap: 10 }
      });
      q.hints.forEach(function (h, i) {
        if (i < ses.hintsRevealed) {
          list.appendChild(el("div.am-hintcard", null,
            el("span.am-hintnum", { "aria-hidden": "true" }, String(i + 1)),
            el("span.body", { style: { textWrap: "pretty" } }, h)));
        } else {
          list.appendChild(el("button.am-reset.am-locked", {
            type: "button",
            onClick: function () { ses.hintsRevealed = i + 1; app.render(); },
            style: {
              border: "2px dashed var(--surface-300)", borderRadius: "var(--radius-md)",
              padding: 14, display: "flex", gap: "var(--space-3)", alignItems: "center",
              color: "var(--ink-600)", background: "transparent", cursor: "pointer", textAlign: "left"
            }
          }, icon("lock", 20),
             el("span.body-sm", null, "Hint " + (i + 1) + " · " + (desktop ? "click" : "tap") + " to show")));
        }
      });
      wrap.appendChild(list);
      return wrap;
    }

    /* ----- verdict (11 / 12) -----
       Right or not, said once, at the foot: the verdict, how far the level
       has got and the next step sit together in one panel, green or coral,
       so the eye goes from the answer to what to do about it. It rises in
       when the answer is checked, not again when a step is shown. */
    function givenText() {
      return q.type === "choice" ? AM.content.choiceText(q, ses.picked) : (q.unit || "") + AM.entry.text(ses.entry) + q.suffix;
    }
    function verdictPanel(strip, buttons) {
      var right = ses.phase === "correct", key = ses.index + ":" + ses.phase;
      var enter = ses.verdictShown !== key;
      ses.verdictShown = key;
      var said = right ? givenText() + " is right." : "You put " + givenText() + ".";
      if (enter && AM.announce) AM.announce((right ? "Tama! " : "Not yet. ") + said);
      return el("div.am-fb" + (right ? ".good" : ".bad") + (enter ? ".am-fb-enter" : ""), null,
        el("div.am-fb-head", { style: { padding: "16px " + gutter() + "px 14px" } },
          el("span.am-fb-icon", { "aria-hidden": "true" }, icon(right ? "check" : "x", 24, { glyph: true })),
          el("span", { style: { minWidth: 0 } },
            el("span.am-fb-title", null, right ? "Tama!" : "Not yet"),
            el("span.am-fb-sub", null, said))),
        strip, buttons);
    }
    /* On a phone the options are gone once answered, so a picture answer
       shows the picture picked. Not the right one: a retry follows. */
    function pickedPicture() {
      if (ses.phase === "ask" || !q.choiceFigures || desktop) return null;
      return el("div", { style: { padding: "16px " + gutter() + "px 0", display: "flex" } },
        AM.Chart(Object.assign({}, q.choiceFigures[ses.picked], { title: "Your answer, picture " + q.choices[ses.picked] })));
    }

    /* Correct explains how it works. Wrong names the mistake when the answer
       matches one the template expects, says so plainly when it does not, and
       reveals one worked step, with the rest still locked. */
    function explanation() {
      /* A fact needs no explaining when it is right: what matters is whether
         it was quick enough to count. */
      if (ses.phase === "correct" && ses.facts) {
        var secs = (Math.round(ses.lastMs / 100) / 10).toFixed(1);
        return el("div", { style: { padding: "18px " + gutter() + "px 0", display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignItems: "center" } },
          ses.lastQuick ? AM.Chip({ icon: "streak", label: "Quick · " + secs + " s", large: true }) : null,
          ses.lastMastered ? AM.Chip({ icon: "check", label: "Mastered", large: true, background: "var(--success-100)", color: "var(--success-700)" }) : null,
          ses.lastQuick ? null : el("span.body", { style: { color: "var(--ink-600)", textWrap: "pretty" } },
            ses.showHints ? "Right. Next time try it without a hint: right in under 4 seconds counts towards mastering it."
              : "Right in " + secs + " s. Under 4 seconds counts towards mastering it."));
      }
      if (ses.phase === "correct") {
        return el("div", { style: { padding: "18px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-2)" } },
          sectionLabel("How it works"),
          el("span.body-lg", null, q.explain));
      }
      if (ses.phase === "wrong") {
        var block = el("div", { style: { padding: "16px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-3)" } },
          el("div.body", { style: { textWrap: "pretty" } }, (ses.diagnosis && ses.diagnosis.feedback) || q.missExplain),
          ses.facts ? el("div.body-sm", { style: { color: "var(--ink-600)" } },
            (q.answerText ? "The answer is " + q.unit + q.answerText + q.suffix + ". " : "") +
            (ses.lastRequeued ? "This one comes back later in the round." : "Practise it again next round.")) : null,
          sectionLabel("Step " + ses.stepsRevealed + " of " + q.steps.length));
        var list = el("div", { style: { display: "flex", flexDirection: "column", gap: 10 } });
        q.steps.forEach(function (step, i) {
          if (i < ses.stepsRevealed) {
            list.appendChild(AM.Card({ style: { padding: 14 } }, el("span.body-lg", null, step)));
          } else {
            list.appendChild(el("div", {
              style: {
                border: "2px dashed var(--surface-300)", borderRadius: "var(--radius-md)", padding: 14,
                display: "flex", gap: "var(--space-3)", alignItems: "center", color: "var(--ink-600)"
              }
            }, icon("lock", 20), el("span.body-sm", null, "Step " + (i + 1) + " hidden")));
          }
        });
        block.appendChild(list);
        return block;
      }
      return null;
    }

    /* The combo: a run of answers right first time. It arrives at two with
       its flame unlit, lights at three, and every fifth turns gold for a
       moment (motion/moments.js plays it). A broken run of three or more
       shows once more, as its flame goes out. */
    function streakChip() {
      var lost = ses.phase === "wrong" && ses.lostRun >= 3;
      if (!lost && (ses.phase !== "correct" || ses.run < 2)) return null;
      var n = lost ? ses.lostRun : ses.run, gold = !lost && n % 5 === 0;
      return el("div", { style: { padding: "18px " + gutter() + "px 0", display: "flex" } },
        el("span", { style: { position: "relative", display: "inline-flex" } },
          el("span.am-combo" + (gold ? ".am-combo-gold" : "") + (lost ? ".am-combo-out" : ""), null,
            AM.Flame ? AM.Flame(28, lost || n >= 3) : icon("streak", 20),
            el("span.am-combo-num", null, String(n)), el("span.label", null, "in a row")),
          gold ? el("span.am-combo-word", { "aria-hidden": "true" }, n >= 10 ? "Unstoppable!" : "On fire!") : null));
    }

    /* The answer that clears the level says so; the moment waits for the end. */
    function clearedChip() {
      if (ses.phase !== "correct" || !ses.clearedAt || ses.clearedAt.index !== ses.index) return null;
      return el("div", { style: { padding: "12px " + gutter() + "px 0", display: "flex" } },
        AM.Chip({ icon: "check", label: "Level cleared! Finish the round", large: true, background: "var(--success-100)", color: "var(--success-700)" }));
    }

    /* A facts round shows the level's facts mastered instead. */
    function factStrip() {
      var keys = C.facts(ses.topicKey, ses.levelId);
      var mastered = keys.filter(function (k) { return store.factState(k).mastered; }).length;
      return el("div", {
        style: {
          flex: "none", margin: "0 " + gutter() + "px 16px", background: "var(--surface-200)",
          borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)",
          padding: "12px var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-3)"
        }
      },
        el("span", { style: { flex: "none", color: "var(--brand-blue-600)" } }, icon("streak", 20)),
        el("span", { style: { flex: 1, display: "flex", flexDirection: "column", gap: 6 } },
          el("span.caption", { style: { color: "var(--ink-600)" } }, ses.levelTitle + ": facts mastered" + (offline ? " · counts offline" : "")),
          AM.ProgressBar({ ratio: keys.length ? mastered / keys.length : 0, label: "Facts mastered" })),
        el("span.body-sm", { style: { flex: "none", color: "var(--ink-600)" } }, mastered + " of " + keys.length));
    }

    /* How far the level is from clearing. A redo session says it does not
       count, rather than show a bar that will not move. */
    /* A review says where its questions came from and how far through it is. */
    function reviewStrip() {
      return el("div", {
        style: {
          flex: "none", margin: "0 " + gutter() + "px 16px", background: "var(--surface-200)",
          borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)",
          padding: "12px var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-3)"
        }
      },
        el("span", { style: { flex: "none", color: "var(--brand-blue-600)" } }, icon("retry", 20)),
        el("span", { style: { flex: 1, display: "flex", flexDirection: "column", gap: 6 } },
          el("span.caption", { style: { color: "var(--ink-600)" } }, q.topicLabel + " · a question you missed before"),
          AM.ProgressBar({ ratio: ses.index / ses.questions.length, label: "Review progress" })),
        el("span.body-sm", { style: { flex: "none", color: "var(--ink-600)" } }, (ses.index + 1) + " of " + ses.questions.length));
    }

    function levelStrip() {
      if (ses.review) return reviewStrip();
      if (ses.facts) return factStrip();
      var lv = store.levelState(ses.topicKey, ses.levelId);
      var shown = Math.min(lv.correct, store.CLEAR_TARGET);
      var note = ses.redo ? "Redo · does not count towards the level"
        : lv.cleared ? "Level " + ses.levelNumber + " cleared" + (ses.pendingLevelUp ? " · finish the round" : " · reviewing")
        : "Level " + ses.levelNumber + ": " + (store.CLEAR_TARGET - shown) + " more to clear" + (offline ? " · counts offline" : "");
      return el("div", {
        style: {
          flex: "none", margin: "0 " + gutter() + "px 16px", background: "var(--surface-200)",
          borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)",
          padding: "12px var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-3)"
        }
      },
        el("span", { style: { flex: "none", color: "var(--brand-blue-600)" } }, icon("level-up", 20)),
        el("span", { style: { flex: 1, display: "flex", flexDirection: "column", gap: 6 } },
          el("span.caption", { style: { color: "var(--ink-600)" } }, note),
          /* Not flex: in this column it would grow downward from nothing and vanish. */
          AM.ProgressBar({ ratio: shown / store.CLEAR_TARGET, label: "Level progress" })),
        el("span.body-sm", { style: { flex: "none", color: "var(--ink-600)" } },
          shown + " of " + store.CLEAR_TARGET));
    }

    /* ----- actions ----- */
    function checkButton() {
      return AM.Button({
        label: "Check", fullWidth: !desktop,
        disabled: q.type === "choice" ? ses.picked === null : !AM.entry.complete(ses.entry),
        onClick: function () { app.check(); }
      });
    }
    /* Revealing is one way: the list becomes the control, and the button does
       not come back. Revealing costs nothing but is visibly counted. */
    function hintButton() {
      return el("button.am-reset.am-pressable.am-hintbtn", {
        type: "button", "data-sound": "hint", style: { "--am-edge": "var(--celebration-gold-500)" },
        onClick: function () {
          ses.showHints = true;
          if (ses.hintsRevealed === 0) ses.hintsRevealed = 1;
          app.render();
        }
      }, icon("hint", 20), "Show a hint");
    }

    function hintsUsedCard() {
      if (!ses.showHints || ses.phase !== "ask") return null;
      return el("div", {
        style: {
          flex: "none", margin: "0 " + gutter() + "px 16px", background: "var(--surface-200)",
          borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)",
          padding: "12px var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-3)"
        }
      },
        el("span", { style: { flex: "none", color: "var(--ink-600)" } }, icon("hint", 20)),
        el("span.body-sm", { style: { flex: 1, color: "var(--ink-600)" } },
          "Hints used this session: " + ses.hintsRevealed + " of " + q.hints.length + ". Using them all still counts the question."));
    }

    var actions;
    if (ses.phase === "ask") {
      actions = desktop ? null : el("div", { style: { flex: "none", padding: "16px " + gutter() + "px 20px" } }, checkButton());
    } else if (ses.phase === "correct") {
      actions = el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 24px" } },
        AM.Button({
          label: ses.index + 1 >= ses.questions.length ? (ses.facts ? "Finish round" : "Finish session") : "Next question",
          fullWidth: true, iconRight: "next", onClick: function () { app.next(); }
        }));
    } else if (ses.facts) {
      /* A missed fact is not tried again on the spot, with its answer in
         view: it comes back later in the round instead. */
      actions = el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 24px" } },
        AM.Button({
          label: ses.index + 1 >= ses.questions.length ? "Finish round" : "Next question",
          fullWidth: true, iconRight: "next", onClick: function () { app.next(); }
        }));
    } else {
      actions = el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 24px", display: "flex", flexDirection: "column", gap: 10 } },
        AM.Button({ label: "Try again", fullWidth: true, onClick: function () { app.retry(); } }),
        AM.Button({
          label: ses.stepsRevealed >= q.steps.length ? "Next question" : "Show the full solution",
          variant: "ghost", fullWidth: true,
          onClick: function () {
            if (ses.stepsRevealed >= q.steps.length) app.next();
            else { ses.stepsRevealed = q.steps.length; app.render(); }
          }
        }));
    }

    /* ----- desktop: the keypad sits beside the field, not under it ----- */
    var keypadNode = (q.type === "compute" && ses.phase === "ask")
      ? AM.Keypad({
          kind: q.entry, tall: desktop,
          onPress: function (d) { app.type(d); }, onDelete: function () { app.backspace(); }, onNext: function () { app.nextBox(); }
        })
      : null;

    if (desktop) {
      var left = el("div", { style: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "var(--space-4)" } });
      if (q.type === "compute") {
        left.appendChild(answerField(true));
        if (ses.phase === "ask") left.appendChild(el("div.body-sm", { style: { color: "var(--ink-600)" } },
          q.entry === "number" ? "Type on the keyboard or use the keypad."
            : q.entry === "time" ? "Type on the keyboard or use the keypad. : or space moves to the minutes."
            : "Type on the keyboard or use the keypad. / or space moves to the next box."));
      }
      if (ses.phase === "ask") {
        left.appendChild(el("div", { style: { display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)" } },
          checkButton(), ses.showHints ? null : hintButton()));
      }

      var row = el("div", { style: { display: "flex", gap: 32, alignItems: "flex-start" } }, left);
      if (keypadNode) row.appendChild(el("div", { style: { flex: "none", width: 280 } }, keypadNode));

      var deskBody = el("div", { style: { flex: 1, display: "flex", justifyContent: "center", padding: gutter() + "px", minHeight: 0, overflowY: "auto" } },
        el("div", { style: { width: "100%", maxWidth: 720, display: "flex", flexDirection: "column", gap: 32 } },
          el("div.heading-lg", { style: { textWrap: "pretty" } }, q.prompt),
          q.chart ? AM.Chart(q.chart) : null,
          q.type === "choice" ? answerArea() : null,
          row,
          clearedChip(), explanation(), streakChip(),
          hintPanel(),
          ses.phase === "ask" ? levelStrip() : null
        ));

      return {
        nav: "practice", bottomNav: false, header: header, onBack: openLeave, banner: null,
        railFooter: el("span.am-rail-note", { style: { background: "var(--surface-100)", color: "var(--ink-600)" } },
          icon("clock", 22), el("span.label", { style: { color: "var(--ink-900)" } }, minutesLabel(ses))),
        body: deskBody,
        footer: (ses.phase === "ask") ? null : el("div", { style: { display: "flex", justifyContent: "center", padding: "0 " + gutter() + "px 20px" } },
          el("div.am-fb-desk", { style: { width: "100%", maxWidth: 720 } }, verdictPanel(levelStrip(), actions)))
      };
    }

    return {
      nav: "practice", bottomNav: false,
      header: header, onBack: openLeave,
      banner: null,
      /* Screen 13 moves the answer field below the scaffold once a hint is
         open, so the worked step and the box you type into read in order. */
      body: column([
        promptNode,
        chartNode,
        (ses.phase === "ask" && !ses.showHints) ? answerArea() : null,
        (ses.phase === "ask" && !ses.showHints)
          ? el("div", { style: { padding: "12px " + gutter() + "px 0", display: "flex" } }, hintButton())
          : null,
        hintPanel(),
        (ses.phase === "ask" && ses.showHints) ? answerArea() : null,
        pickedPicture(),
        explanation(),
        clearedChip(),
        streakChip()
      ]),
      belowFold: answered ? null : el("div", null,
        hintsUsedCard(),
        keypadNode ? el("div", { style: { padding: "0 " + gutter() + "px" } }, keypadNode) : levelStrip()),
      footer: answered ? verdictPanel(levelStrip(), actions) : actions
    };
  };

  function minutesLabel(ses) {
    var mins = Math.max(1, Math.round((Date.now() - ses.startedAt) / 60000));
    return mins + " minute" + (mins === 1 ? "" : "s") + " today";
  }

  /* ---------- badges on screens ----------
     Badges just earned wait here until a screen shows them: the level-up
     takes its own level's badge, the streak screen the streak and Welcome
     back badges, and a summary whatever is left. A screen keeps what it took
     in its own scratch, so drawing it again shows the same ones. */
  var pendingBadges = [];
  function takeBadges(test) {
    pendingBadges = pendingBadges.concat(store.takeRecent());
    var mine = pendingBadges.filter(test);
    pendingBadges = pendingBadges.filter(function (k) { return !test(k); });
    return mine;
  }
  function anyBadge() { return true; }

  var MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function earnedOn(b) {
    if (b.before) return "Earned before badges began";
    if (b.at === store.today()) return "Earned today";
    var p = String(b.at).split("-");
    return "Earned " + (+p[2]) + " " + MONTH_NAMES[+p[1] - 1];
  }

  /* A badge to tap, which opens its card. */
  function badgeButton(found, size, opts) {
    var o = opts || {};
    var isNew = found.badge.earned && found.badge.seen === false;
    return el("button.am-reset.am-badge-btn", {
      type: "button", "aria-label": found.badge.name + (found.badge.earned ? "" : ", not earned yet") + (isNew ? ", new" : ""),
      onClick: function () { openBadge(found.badge.key); },
      style: o.style || null
    }, AM.Badge(found, size), isNew ? el("span.am-newtag", { "aria-hidden": "true" }, "New") : null,
       o.caption ? el("span.caption", { style: { display: "block", lineHeight: 1.25, marginTop: 2, color: "var(--ink-600)", textAlign: "center" } }, o.caption) : null);
  }

  /* ----- the badge card -----
     Laid over whatever screen is up, outside the render cycle, so a redraw
     underneath leaves it be. Opening it marks the badge seen. */
  function openBadge(key) {
    var frame = document.querySelector(".am-frame");
    var found = store.findBadge(key);
    if (!frame || !found) return;
    var b = found.badge;
    store.markBadgeSeen(key);
    var sound = window.AbanteMinds && window.AbanteMinds.sound;
    if (sound) sound.play("pop");
    clearSheets(frame);

    var lines = [];
    if (found.topic) {
      lines.push(found.topic.label + " · level " + b.number + " of " + b.total + (b.title ? " · " + b.title : ""));
      if (b.earned) {
        lines.push(earnedOn(b));
        lines.push(b.shiny ? "Shiny: every first try right." : (b.kind === "facts" ? "Shiny when every fact is mastered without a miss." : "Clear it with every first try right to collect the shiny one."));
      } else {
        lines.push(b.kind === "facts" ? "Master every fact in this level to collect it." : "Clear this level to collect it: " + store.CLEAR_TARGET + " right first time.");
        if (b.left) lines.push("A round of it was left partway, so this one won't be shiny.");
      }
    } else {
      lines.push(b.how);
      if (b.earned) lines.push(earnedOn(b));
    }
    var previous = document.activeElement;
    var scrim = el("div.am-badge-sheet-scrim", { onClick: function () { close(); } });
    var pin = b.earned ? AM.Button({
      label: store.isPinned(key) ? "Take off my profile" : "Show on my profile", variant: "ghost", fullWidth: true,
      onClick: function () {
        store.togglePin(key);
        var label = pin.lastChild;
        if (label && label.nodeType === 3) label.nodeValue = store.isPinned(key) ? "Take off my profile" : "Show on my profile";
        else pin.textContent = store.isPinned(key) ? "Take off my profile" : "Show on my profile";
      }
    }) : null;
    var closeBtn = AM.Button({ label: "Close", fullWidth: true, onClick: function () { close(); } });
    var sheet = el("div.am-badge-sheet", { role: "dialog", "aria-modal": "true", "aria-label": b.name },
      el("div", { style: { lineHeight: 0 } }, AM.Badge(found, 128)),
      b.earned && b.shiny ? AM.Chip({ label: "Shiny", background: "var(--celebration-gold-500)", color: "var(--ink-900)" }) : null,
      el("div.heading-md", { style: { marginTop: 4 } }, b.name),
      lines.map(function (l, i) { return el(i === 0 ? "div.label" : "div.body", { style: { color: i === 0 ? "var(--ink-600)" : "var(--ink-900)", textWrap: "pretty", maxWidth: 360 } }, l); }),
      el("div", { style: { width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 10, marginTop: 12 } }, pin, closeBtn));
    function close() {
      if (app().closeSheet === close) app().closeSheet = null;
      if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
      if (scrim.parentNode) scrim.parentNode.removeChild(scrim);
      document.removeEventListener("keydown", onKey);
      if (previous && previous.focus) previous.focus();
      app().keepScroll = true;
      app().render();
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);
    frame.appendChild(scrim);
    frame.appendChild(sheet);
    app().closeSheet = close;  /* the phone's Back button closes it first */
    closeBtn.focus();
    var m = window.AbanteMinds && window.AbanteMinds.moments;
    if (m && !m.reduced()) {
      sheet.animate([{ transform: "translateY(100%)" }, { transform: "none" }], { duration: 380, easing: m.ease.backSoft });
      scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
      if (b.earned) sheet.firstChild.animate([{ transform: "scale(0.6) rotate(-20deg)" }, { transform: "none" }], { duration: 600, delay: 100, easing: m.ease.back, fill: "both" });
    }
  }
  function app() { return AM.app; }

  /* A sheet from the bottom, for a road step and for hints: a scrim, the
     content, and Close; Escape or the phone's Back closes it first. */
  function openSheet(label, content, closeLabel) {
    var frame = document.querySelector(".am-frame");
    if (!frame) return null;
    clearSheets(frame);
    var previous = document.activeElement, snd = window.AbanteMinds && window.AbanteMinds.sound;
    var scrim = el("div.am-sheet-scrim", { onClick: function () { close(); } });
    var closeBtn = AM.Button({ label: closeLabel || "Close", variant: "ghost", fullWidth: true, onClick: function () { close(); } });
    var sheet = el("div.am-sheet.am-sheet-left", { role: "dialog", "aria-modal": "true", "aria-label": label },
      content, el("div", { style: { width: "100%", marginTop: 12 } }, closeBtn));
    function close() {
      if (app().closeSheet === close) app().closeSheet = null;
      if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
      if (scrim.parentNode) scrim.parentNode.removeChild(scrim);
      document.removeEventListener("keydown", onKey);
      if (snd) snd.play("sheetDown");
      if (previous && previous.focus) previous.focus();
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);
    frame.appendChild(scrim);
    frame.appendChild(sheet);
    app().closeSheet = close;
    closeBtn.focus();
    if (snd) snd.play("sheetUp");
    var m = window.AbanteMinds && window.AbanteMinds.moments;
    if (m && !m.reduced()) {
      sheet.animate([{ transform: "translateY(100%)" }, { transform: "none" }], { duration: 380, easing: m.ease.backSoft });
      scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
    }
    return { close: close, sheet: sheet };
  }
  AM.openBadge = openBadge;

  function clearSheets(frame) {
    var old = frame.querySelectorAll(".am-sheet, .am-sheet-scrim, .am-badge-sheet, .am-badge-sheet-scrim");
    Array.prototype.forEach.call(old, function (n) { n.parentNode.removeChild(n); });
  }

  /* ---------- leaving a round ----------
     The X in a round's header, or the phone's Back button, asks first. It
     says what leaving keeps, and, only when there is still a shiny badge to
     lose, that leaving now loses it. "Keep going" is the default. */
  function openLeave() {
    var a = app(), s = a.session;
    var frame = document.querySelector(".am-frame");
    if (!s || !frame) return;
    clearSheets(frame);
    var exam = !!s.exam, challenge = !!s.challenge;
    var badged = !exam && !s.redo && !s.review && (s.kind === "practice" || s.kind === "facts");
    var lines = exam ? ["It won't be scored, and the clock stops."]
      : challenge ? [s.challenge.daily ? "It won't be scored, and today's challenge stays open." : "It won't be scored."]
      : s.redo ? ["These questions don't move the level, so nothing is lost."]
      : s.review ? ["Questions you've put right stay put right."]
      : s.facts ? ["Facts you've mastered stay mastered."]
      : ["Your right answers so far are kept."];
    if (badged && store.canStillShine(s.topicKey, s.levelId)) lines.push("If you leave now, this level's badge can't be shiny.");

    var previous = document.activeElement;
    var scrim = el("div.am-sheet-scrim", { onClick: function () { close(); } });
    var stay = AM.Button({ label: "Keep going", fullWidth: true, cta: true, onClick: function () { close(); } });
    var leave = AM.Button({ label: exam ? "Leave the exam" : "Leave", variant: "ghost", fullWidth: true, onClick: function () { close(true); a.leaveSession(); } });
    var sheet = el("div.am-sheet", { role: "dialog", "aria-modal": "true", "aria-labelledby": "am-leave-title" },
      el("div.heading-md", { id: "am-leave-title" }, exam ? "Leave the practice exam?" : "Leave this round?"),
      lines.map(function (l) { return el("div.body", { style: { color: "var(--ink-900)", textWrap: "pretty", maxWidth: 360 } }, l); }),
      el("div", { style: { width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 10, marginTop: 12 } }, stay, leave));
    function close(leaving) {
      if (a.closeSheet === close) a.closeSheet = null;
      if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
      if (scrim.parentNode) scrim.parentNode.removeChild(scrim);
      document.removeEventListener("keydown", onKey);
      if (!leaving && previous && previous.focus) previous.focus();
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);
    frame.appendChild(scrim);
    frame.appendChild(sheet);
    a.closeSheet = close;
    stay.focus();
    var m = window.AbanteMinds && window.AbanteMinds.moments;
    if (m && !m.reduced()) {
      sheet.animate([{ transform: "translateY(100%)" }, { transform: "none" }], { duration: 320, easing: m.ease.backSoft });
      scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
    }
  }
  AM.openLeave = openLeave;

  /* New badges, as a card on a summary. */
  function newBadgesCard(keys, bare) {
    if (!keys || !keys.length) return null;
    var cat = store.catalog();
    var found = keys.map(function (k) { return store.findBadge(k, cat); }).filter(Boolean);
    if (!found.length) return null;
    return el("div", { style: bare ? null : { padding: "18px " + gutter() + "px 0" } },
      AM.Card({ style: { gap: 10 } },
        sectionLabel(found.length === 1 ? "New badge" : found.length + " new badges"),
        el("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
          found.map(function (f, i) {
            return el("button.am-reset", {
              type: "button", onClick: function () { openBadge(f.badge.key); },
              style: { display: "flex", alignItems: "center", gap: 12, textAlign: "left", background: "none", border: 0, padding: 2, cursor: "pointer", color: "var(--ink-900)" }
            },
              el("span.am-reveal", { style: { lineHeight: 0, animationDelay: (i * 120) + "ms" } }, AM.Badge(f, 56)),
              el("span", { style: { display: "flex", flexDirection: "column", gap: 2, minWidth: 0 } },
                el("span.label", null, f.badge.name + (f.badge.shiny ? " · shiny" : "")),
                el("span.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } },
                  f.topic ? "Level " + f.badge.number + (f.badge.title ? " · " + f.badge.title : "") : f.badge.how)));
          }))));
  }

  /* ---------- the badge collection ---------- */
  screens.badges = function (app) {
    var cat = store.catalog();
    var shown = store.showcase();
    var p = store.path();
    var nextKey = p.next ? "lv:" + p.next.topic.key + "/" + p.next.level.id : null;
    var nextFound = nextKey ? store.findBadge(nextKey, cat) : null;

    function row(t) {
      return el("div", {
        style: {
          padding: "8px 10px", borderRadius: "var(--radius-md)",
          background: t.complete ? "var(--gold-tint, #fff1c2)" : "var(--surface-200)",
          border: "2px solid " + (t.complete ? "var(--celebration-gold-500)" : "var(--surface-300)")
        }
      },
        el("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
          el("span.label", null, t.label),
          t.complete ? AM.Chip({ label: "Set complete", background: "var(--celebration-gold-500)", color: "var(--ink-900)" }) : null,
          el("span.caption", { style: { marginLeft: "auto", color: "var(--ink-600)", whiteSpace: "nowrap" } }, t.earned + " of " + t.levels.length)),
        el("div.am-badge-row", { style: { marginTop: 4 } },
          t.levels.map(function (b) { return badgeButton({ topic: t, badge: b }, 40); })));
    }

    /* Opened from a level-up mid-session, the way back is the session. */
    var resume = app.scratch.badgesBack || null;
    return {
      nav: "road",
      banner: connectionBanner(),
      onBack: resume || null,
      footer: resume ? el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 20px", display: "flex", justifyContent: "center" } },
        el("div", { style: { width: "100%", maxWidth: 520 } }, AM.Button({ label: "Back to practice", fullWidth: true, onClick: resume }))) : null,
      after: function () {
        if (!app.scratch.badgesHighlight) return;
        app.scratch.badgesHighlight = false;
        var tag = document.querySelector(".am-slot-body .am-newtag");
        if (!tag) return;
        var btn = tag.parentNode;
        if (btn.scrollIntoView) btn.scrollIntoView({ block: "center" });
        var m = window.AbanteMinds && window.AbanteMinds.moments;
        if (m && !m.reduced()) {
          btn.animate([{ transform: "scale(1)" }, { transform: "scale(1.3)", offset: 0.35 }, { transform: "scale(1)" }], { duration: 700, delay: 300, easing: m.ease.backSoft });
          window.setTimeout(function () { var c = m.centre(btn); m.FX.stars(c.x, c.y, 8, ["#7b6cf6", "#ffd23f", "#ffffff"]); if (window.AbanteMinds.sound) window.AbanteMinds.sound.play("badge"); }, 420);
        }
      },
      body: column([
        roadHead(app, "badges"),
        el("div", { style: { padding: "18px " + gutter() + "px 0" } },
          el("div", { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 } },
            el("span.label", null, "Your badges"),
            el("span.label", { style: { color: "var(--ink-600)" } }, cat.earned + " of " + cat.total)),
          el("div", { style: { marginTop: 8 } }, AM.ProgressBar({ ratio: cat.total ? cat.earned / cat.total : 0, height: 10, label: "Badges collected" }))),
        /* The showcase is what the card shows, so it sits on a panel of its own. */
        el("div", { style: { padding: "16px " + gutter() + "px 0" } },
          el("div.am-showcase", null,
            el("div.am-showcase-head", null, el("span", null, "Showcase"), el("span", null, "On your card")),
            shown.length
              ? el("div", { style: { display: "flex", justifyContent: "space-around", alignItems: "flex-end" } },
                  shown.map(function (k) { return badgeButton(store.findBadge(k, cat), 72); }))
              : el("span.body-sm", { style: { textWrap: "pretty" } }, "Clear a level to earn your first badge. Your newest three show here, or pick your own from any badge's card."))),
        nextFound ? el("div", { style: { padding: "12px " + gutter() + "px 0" } },
          AM.Card({ style: { flexDirection: "row", alignItems: "center", gap: 12 } },
            badgeButton(nextFound, 56),
            el("span", { style: { display: "flex", flexDirection: "column", gap: 2, minWidth: 0 } },
              sectionLabel("Next badge"),
              el("span.label", null, nextFound.badge.name),
              el("span.body-sm", { style: { color: "var(--ink-600)" } }, "Clear level " + p.next.level.number + ", " + p.next.level.title + ": " + p.next.level.correct + " of " + p.next.level.target + " right first time so far.")))) : null,
        el("div", { style: { padding: "20px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: 10 } },
          sectionLabel("Topics"),
          cat.topics.filter(function (t) { return t.track === "path"; }).map(row)),
        el("div", { style: { padding: "20px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: 10 } },
          sectionLabel("Basics"),
          cat.topics.filter(function (t) { return t.track === "basics"; }).map(row)),
        el("div", { style: { padding: "20px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: 10 } },
          sectionLabel("Special badges"),
          el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(76px, 1fr))", gap: 6 } },
            cat.specials.map(function (sp) { return badgeButton({ topic: null, badge: sp }, 54, { caption: sp.name, style: { display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1 } }); })))
      ], { paddingBottom: 24 })
    };
  };

  /* ---------- the level-up ----------
     Five beats, one at a time, about seven seconds, and a tap anywhere
     lands them all at once:
     1. Gold rises up the screen from where the level's bar was.
     2. The badge arrives as its grey shape, wobbles, and turns over into
        colour with one gong, one burst of confetti. Then what this level
        adds lands: a new segment of the rim lights, and a new ornament
        drops on if the level brings one.
     3. The proof it was earned: the share right first time fills a ring,
        and the best run of the session is there with its flame.
     4. Where it leads: the learner's marker walks along the topic's levels
        to the one that just opened, and its lock springs open as it gets
        there. (In Basics every level is already open, so this beat rests.)
     5. The way on.
     With Calm animations the screen shows its end straight away. */
  screens.levelup = function (app) {
    var s = store.get();
    var ses = app.session;
    if (!ses) { app.go("home"); return screens.home(app); }
    var basics = ses.track === "basics";
    var t = basics ? store.basicsTopic(ses.topicKey) : store.topicPath(ses.topicKey);
    var levels = basics ? t.levels.filter(function (lv) { return lv.kind !== "review"; }) : t.levels;
    var key = "lv:" + ses.topicKey + "/" + ses.levelId;
    var cat = store.catalog();
    var found = store.findBadge(key, cat);
    var view = app.scratch.levelup;
    if (!view || view.key !== key || view.session !== ses.id) {
      view = app.scratch.levelup = { key: key, session: ses.id, played: false };
      takeBadges(function (k) { return k === key; });
    }
    var here = levels.findIndex(function (lv) { return lv.id === ses.levelId; });
    var next = basics ? null : (levels[here + 1] || null);
    var ls = store.levelState(ses.topicKey, ses.levelId);
    var at = ses.clearedAt || ls;
    var right = Math.min(at.correct, store.CLEAR_TARGET), tries = Math.max(at.attempts, right);
    var share = tries ? Math.round(100 * right / tries) : 0;
    var first = (s.profile && s.profile.name.split(" ")[0]) || "there";
    var b = found ? found.badge : null;

    var flip = el("div.am-lvup-flip", null,
      el("div.am-face.am-face-grey", { html: found ? AM.badgeArt.art({ topic: found.topic, badge: { number: b.number, total: b.total, earned: false, name: b.name } }, 132) : "" }),
      el("div.am-face.am-face-colour", { html: found ? AM.badgeArt.art(found, 132, { fresh: true }) : "" }));

    var ring = el("div.am-ring", null,
      el("span", { html: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" fill="none" stroke="var(--surface-300)" stroke-width="8"/>' +
        '<circle class="am-ring-fill" cx="32" cy="32" r="26" fill="none" stroke="var(--success-700)" stroke-width="8" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="' + (100 - share) + '" transform="rotate(-90 32 32)"/></svg>' }),
      el("b.am-ring-n", null, share + "%"));
    var best = ses.bestRun || 0;
    var flame = best >= 3 ? AM.Flame(22, true) : null;
    var card = el("div.am-lvup-card", null, ring,
      el("div.am-lvup-facts", null,
        el("span.am-lvup-fact.body-sm", null, el("b.am-lvup-right", null, String(right)), "of " + tries + " right first time"),
        best >= 3 ? el("span.am-lvup-fact.body-sm", null, flame, el("b", null, String(best)), "in a row, your best this time") : null,
        b && !b.shiny ? el("span.am-lvup-tip.caption", null, ls.left ? "A round was left partway, so this one isn't shiny" : "Every first try right earns the shiny one") : null,
        b && b.shiny ? el("span.am-lvup-tip.caption", null, "Every first try right: this one is shiny") : null));

    var pathNode = null, token = null, headCount = null;
    if (levels.length > 1) {
      var nodes = el("div.am-lvpath");
      /* On the path the levels before this one are cleared and the rest
         locked; in Basics every level is open, ticked when done. */
      levels.forEach(function (lv, i) {
        var kind = i === here ? "cur" : basics ? (lv.done ? "done" : "open") : i < here ? "done" : i === here + 1 ? "next" : "far";
        if (i > 0) nodes.appendChild(el("div.am-lvconn" + (!basics && i <= here ? ".on" : "") + (kind === "next" ? ".am-lvconn-next" : ""), null, el("i")));
        var content;
        if (kind === "done") content = [AM.icon("check", 18)];
        else if (kind === "cur") content = [el("span.am-lvnode-fill"), el("span.am-lvnode-n", null, String(i + 1)), el("span.am-lvnode-tick", { style: { opacity: 0 } }, AM.icon("check", 18))];
        else if (kind === "open") content = [el("span.am-lvnode-n", null, String(i + 1))];
        else if (kind === "next") content = [el("span.am-lvnode-pulse"), el("span.am-lvnode-lock", null, AM.icon("lock", 16)), el("span.am-lvnode-n", { style: { opacity: 0 } }, String(i + 1))];
        else content = [AM.icon("lock", 14)];
        nodes.appendChild(el("div.am-lvnode." + (kind === "next" ? "lock.am-lvnode-next" : kind), { "aria-hidden": "true" }, content));
      });
      token = basics || !next ? null : el("div.am-token", { "aria-hidden": "true" }, el("b.label", null, first.charAt(0).toUpperCase()), el("i"));
      pathNode = el("div.am-lvpath-wrap", null, nodes, token);
      headCount = basics ? null : el("span", null, el("span.am-lvup-count", null, String(Math.max(0, t.cleared - 1))), " of " + t.total + " levels");
    }

    var nextLine = next ? "Next up: level " + (here + 2) + ", " + next.title
      : basics ? "Every Basics level stays open to practise."
      : "That was the last level in " + t.label + ". The whole set is yours.";
    var keep = AM.Button({ label: ses.leaving || ses.index + 1 >= ses.questions.length ? "Continue" : "Keep going", variant: "inverse", fullWidth: true, cta: true, onClick: function () { view.played = true; if (view.tl) view.tl.skip(); app.afterLevelUp(); } });
    var see = el("button.am-reset.am-linkbtn.label", { type: "button", onClick: function () { view.played = true; if (view.tl) view.tl.skip(); app.levelUpToBadges(); } }, "See my badges");
    var footer = el("div.am-lvup-foot", { style: { flex: "none", padding: "0 " + gutter() + "px 24px", display: "flex", justifyContent: "center" } },
      el("div", { style: { width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 4 } }, see, keep));

    var body = el("div.am-celebrate.am-lvup", { style: { "--gutter": gutter() + "px" } },
      el("div.am-halo", { "aria-hidden": "true", html: AM.haloSVG("#ffffff") }),
      el("div.am-lvup-badge", { role: "img", "aria-label": b ? b.name + (b.shiny ? ", shiny" : "") : "" }, el("div.am-lvup-float", null, flip)),
      el("h2.am-lvup-title", null, "Level " + (here + 1) + " cleared!"),
      el("p.am-lvup-sub.body-lg", null, "You earned ", el("b", null, b ? b.name : "a badge"), b && b.shiny ? " · shiny" : ""),
      card,
      pathNode ? el("div.am-lvup-head.label", null, el("span", null, t.label), headCount || el("span", null, "Basics")) : null,
      pathNode,
      el("p.am-lvup-next.label", null, nextLine));

    return {
      nav: null, onGold: true, chrome: false,
      body: body,
      footer: footer,
      onBack: function () { keep.click(); },
      after: function () {
        AM.announce("Level " + (here + 1) + " cleared. You earned " + (b ? b.name : "a badge") + (b && b.shiny ? ", shiny" : "") + ".");
        var m = window.AbanteMinds && window.AbanteMinds.moments;
        if (!m) return;
        view.tl = playLevelUp(m, { body: body, footer: footer, flip: flip, ring: ring, share: share, card: card, flame: flame,
          path: pathNode, token: token, count: headCount ? headCount.firstChild : null, cleared: t.cleared,
          next: !!next, basics: basics, right: right });
        if (view.played || m.reduced()) { view.tl.skip(); view.played = true; }
        else body.addEventListener("click", function () { view.tl.skip(); view.played = true; });
        view.played = true;
      }
    };
  };

  function playLevelUp(m, d) {
    var tl = new m.Timeline(), E = m.ease, sound = window.AbanteMinds.sound;
    function play(name, arg) { return function () { if (sound) sound.play(name, arg); }; }
    var q = function (sel, scope) { return (scope || d.body).querySelector(sel); };
    var grey = q(".am-face-grey"), colour = q(".am-face-colour");
    var rise = el("div.am-lvup-rise", { "aria-hidden": "true" });
    document.body.appendChild(rise);
    colour.style.visibility = "hidden";

    /* 1. gold rises */
    tl.to(rise, [{ clipPath: "inset(0 0 0 0)" }, { clipPath: "inset(0 0 100% 0)" }], 700, 0.05, E.in)
      .call(play("charge"), 0.05)
      .call(function () { if (rise.parentNode) rise.parentNode.removeChild(rise); }, 0.8, true)
      .to(q(".am-halo"), [{ opacity: 0, transform: "scale(0.7)" }, { opacity: 1, transform: "none" }], 900, 1.7);
    /* 2. the badge */
    tl.to(q(".am-lvup-badge"), [{ transform: "scale(0.3)", opacity: 0 }, { transform: "none", opacity: 1 }], 500, 0.6, E.back)
      .to(d.flip, [
        { transform: "rotate(0deg) scaleX(1)", offset: 0 },
        { transform: "rotate(-7deg) scaleX(1)", offset: 0.1 },
        { transform: "rotate(7deg) scaleX(1)", offset: 0.2 },
        { transform: "rotate(-5deg) scaleX(1)", offset: 0.3 },
        { transform: "rotate(4deg) scaleX(1)", offset: 0.4 },
        { transform: "rotate(0deg) scaleX(1)", offset: 0.5, easing: E.in },
        { transform: "rotate(0deg) scaleX(0)", offset: 0.62, easing: E.back },
        { transform: "rotate(0deg) scaleX(1)", offset: 1 }
      ], 1100, 1.1, "linear")
      .call(play("roll"), 1.1)
      .call(function () { grey.style.visibility = "hidden"; colour.style.visibility = ""; }, 1.78, true)
      .call(function () {
        play("level")();
        var p = m.centre(d.flip, 0.45);
        m.FX.confetti(p.x, p.y, -90, 170, 420, 800, 60);
        m.FX.sparks(p.x, p.y, 14, ["#ffffff", "#fff1b8"]);
      }, 1.8);
    var seg = q(".am-b-newseg", colour), orn = q(".am-b-new", colour);
    if (seg) tl.to(seg, [{ opacity: 0 }, { opacity: 1 }], 400, 2.4).call(play("step", 3), 2.4);
    if (orn) tl.to(orn, [{ transform: "translateY(-40px)", opacity: 0 }, { transform: "translateY(4px)", opacity: 1, offset: 0.7 }, { transform: "none", opacity: 1 }], 520, 2.6, E.out).call(play("sparkle"), 2.85);
    tl.to(q(".am-lvup-title"), [{ transform: "translateY(18px)", opacity: 0 }, { transform: "none", opacity: 1 }], 500, 2.8)
      .to(q(".am-lvup-sub"), [{ transform: "translateY(10px)", opacity: 0 }, { transform: "none", opacity: 1 }], 450, 3.0);
    /* 3. the proof */
    var ringFill = q(".am-ring-fill", d.ring), ringN = q(".am-ring-n", d.ring), rightN = q(".am-lvup-right", d.card);
    tl.to(d.card, [{ transform: "translateY(20px)", opacity: 0 }, { transform: "none", opacity: 1 }], 500, 3.3)
      .to(ringFill, [{ strokeDashoffset: 100 }, { strokeDashoffset: 100 - d.share }], 1000, 3.45, "cubic-bezier(0.45, 0, 0.55, 1)")
      .call(function () { m.count(ringN, d.share, "%", 1000); m.count(rightN, d.right, "", 850); }, 3.45)
      .call(play("count"), 3.45)
      .call(function () { ringN.textContent = d.share + "%"; rightN.textContent = String(d.right); }, 4.5, true)
      .call(play("step", 2), 4.4)
      .to(d.ring, [{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }], 450, 4.4, E.backSoft);
    var t = 4.6;
    if (d.flame) { m.ignite(tl, d.flame, 4.1, 0.5); }
    /* 4. where it leads */
    if (d.path) {
      tl.to(q(".am-lvup-head"), [{ transform: "translateY(14px)", opacity: 0 }, { transform: "none", opacity: 1 }], 450, t)
        .to(d.path, [{ transform: "translateY(14px)", opacity: 0 }, { transform: "none", opacity: 1 }], 450, t + 0.08);
      var cur = q(".am-lvnode.cur", d.path);
      tl.to(q(".am-lvnode-fill", cur), [{ transform: "scale(0)" }, { transform: "scale(1)" }], 350, t + 0.45, E.back)
        .to(q(".am-lvnode-n", cur), [{ opacity: 1 }, { opacity: 0 }], 150, t + 0.45)
        .to(q(".am-lvnode-tick", cur), [{ opacity: 0 }, { opacity: 1 }], 250, t + 0.6)
        .call(function () { cur.classList.remove("cur"); cur.classList.add("done"); cur.style.color = "var(--ink-inverse)"; }, t + 0.5, true)
        .call(function () { if (d.count) d.count.textContent = String(d.cleared); }, t + 0.5, true)
        .call(play("check"), t + 0.5);
      if (d.next && !d.basics) {
        var nn = q(".am-lvnode-next", d.path), conn = q(".am-lvconn-next", d.path);
        tl.to(conn.firstChild, [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], 550, t + 0.8, "cubic-bezier(0.45, 0, 0.55, 1)");
        if (d.token) {
          var nodes = d.path.querySelectorAll(".am-lvnode");
          var x = function (n) { return n.offsetLeft + n.offsetWidth / 2 - d.token.offsetWidth / 2; };
          var from = x(cur), to = x(nn);
          d.token.style.transform = "translateX(" + from + "px)";
          tl.to(d.token, [{ transform: "translateX(" + from + "px)" }, { transform: "translateX(" + to + "px)" }], 600, t + 0.8, "cubic-bezier(0.45, 0, 0.55, 1)")
            .to(d.token, [{ marginTop: "0px" }, { marginTop: "-6px" }, { marginTop: "0px" }], 380, t + 1.4, E.out);
        }
        tl.to(q(".am-lvnode-lock", nn), [{ transform: "none", opacity: 1 }, { transform: "rotate(-14deg)", opacity: 1, offset: 0.3 }, { transform: "rotate(10deg) translateY(-3px)", opacity: 1, offset: 0.6 }, { transform: "scale(0.4) translateY(-8px)", opacity: 0 }], 600, t + 1.25)
          .call(play("unlock"), t + 1.35)
          .call(function () { nn.classList.remove("lock"); nn.classList.add("open"); }, t + 1.8, true)
          .to(nn, [{ transform: "scale(0.8)" }, { transform: "none" }], 450, t + 1.8, E.back)
          .to(q(".am-lvnode-n", nn), [{ opacity: 0, transform: "scale(0.3)" }, { opacity: 1, transform: "none" }], 400, t + 1.82, E.back)
          .to(q(".am-lvnode-pulse", nn), [{ transform: "scale(1)", opacity: 0.9 }, { transform: "scale(1.8)", opacity: 0 }], 900, t + 1.85);
        t += 2.2;
      } else t += 0.9;
    }
    /* 5. the way on */
    tl.to(q(".am-lvup-next"), [{ transform: "translateY(8px)", opacity: 0 }, { transform: "none", opacity: 1 }], 400, t)
      .to(d.footer, [{ transform: "translateY(120px)" }, { transform: "none" }], 500, t + 0.2, E.backSoft);
    return tl;
  }

  /* ---------- the daily streak ----------
     After the first session finished on a day: the flame lights, the count
     rolls on by one, today's day fills in on the week, and any streak or
     Welcome back badge earned with it is shown. Then back to the summary. */
  var DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
  var MILESTONE_LINES = {
    3: "Three days in a row. A habit is starting.",
    7: "A whole week of practice. This is how it sticks.",
    14: "Two weeks in a row. That's real work.",
    30: "Thirty days in a row. It's part of your day now.",
    50: "Fifty days in a row. That's real dedication.",
    100: "One hundred days in a row!",
    365: "A whole year of practice, every day."
  };
  screens.streak = function (app) {
    var s = store.get();
    var view = app.scratch.streak || (app.scratch.streak = { played: false, badges: takeBadges(function (k) { return k.indexOf("streak:") === 0 || k === "welcome"; }) });
    var days = s.streakDays || 1;
    var todayIndex = (new Date(store.today() + "T00:00:00").getDay() + 6) % 7;
    var fl = AM.Flame(132, true);
    var num = el("span.am-streak-num", { "aria-hidden": "true" }, el("span", null,
      days > 1 ? el("span", null, String(days - 1)) : null, el("span", null, String(days))));
    var week = el("div.am-week", { "aria-hidden": "true" }, DAY_LETTERS.map(function (d, i) {
      var on = s.week && s.week[i] && i !== todayIndex;
      return el("div.am-day.caption", null, d,
        el("span.am-dot" + (on ? ".on" : "") + (i === todayIndex ? ".today" : ""), null, el("i"), el("b"),
          (on || i === todayIndex) ? el("span.am-dot-tick", { style: { position: "relative", color: "var(--ink-inverse)", lineHeight: 0, opacity: on ? 1 : 0 } }, AM.icon("check", 16)) : null));
    }));
    var copy = days > 1 ? "Come back tomorrow to make it " + (days + 1) + "." : "Practise again tomorrow to start a streak.";
    if (store.forgivenYesterday()) copy = "Yesterday was forgiven: one missed day a week doesn't break your streak. " + copy;
    /* A streak badge earned today makes this a milestone: its own line, and
       a picture of the streak to share (app/share.js). */
    var mile = AM.road && AM.share && AM.road.isMilestone(days) ? days : null;
    if (mile) copy = (MILESTONE_LINES[mile] || days + " days in a row. Keep going.") + " " + copy;
    var saved = store.shieldSaved();
    if (saved) copy = (saved.used === 1 ? "A streak shield" : saved.used + " streak shields") + " kept your streak going. " + copy;
    if (view.road === undefined) view.road = store.takeRoad();
    var draw = function () {
      return view.drawn || (view.drawn = AM.share.picture(days, s.profile && s.profile.name, s.profile && s.profile.flame).then(function (b) { view.blob = b; return b; }));
    };
    var file = "abante-minds-" + days + "-day-streak.png", text = days + " days of math practice in a row!";
    var share = mile ? AM.Button({ label: "Share", variant: "ghost", iconLeft: "share", fullWidth: true, onClick: function () {
      /* Straight from the tap when the picture is ready, as phones require. */
      (view.blob ? AM.share.send(view.blob, file, text) : draw().then(function (b) { return AM.share.send(b, file, text); })).then(function (how) {
        if (how === "saved") AM.announce("Picture saved.");
        if (how === "failed") AM.announce("This phone could not share the picture.");
      });
    } }) : null;
    var fresh = newBadgesCard(view.badges);
    var go = function () {
      if (view.tl) view.tl.skip();
      var next = app.scratch.afterStreak || "home";
      app.scratch.streak = null;
      if (store.pendingTier()) { app.scratch.afterTier = next; next = "tierUp"; }
      app.go(next);
    };
    if (mile && AM.MILE) return milestoneView(app, view, { days: days, saved: saved, go: go, draw: draw, file: file, text: text });
    var body = el("div.am-streak" + (mile ? ".am-streak-mile" : ""), { style: { "--gutter": gutter() + "px", position: "relative" } },
      el("div.am-streak-glow", { "aria-hidden": "true" }),
      mile ? el("span.am-mile-chip.caption", null, "Milestone") : null,
      el("div", { style: { position: "relative", lineHeight: 0 } }, fl),
      num,
      el("div.am-streak-label", null, days === 1 ? "day of practice!" : "day streak!"),
      week,
      fresh ? el("div", { style: { width: "100%", maxWidth: 420, textAlign: "left" } }, fresh) : null,
      view.road.length ? el("div", { style: { width: "100%", maxWidth: 420 } }, roadNewCard(app, view.road)) : null,
      el("p.body", { style: { color: "var(--ink-600)", margin: "14px 0 0", maxWidth: 300, textWrap: "balance" } }, copy));
    var footer = el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 24px", display: "flex", justifyContent: "center", background: "var(--surface-200)" } },
      el("div", { style: { width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 10 } }, share, AM.Button({ label: "Continue", fullWidth: true, cta: true, onClick: go })));
    return {
      nav: null, chrome: false, body: body, footer: footer, onBack: go,
      after: function () {
        AM.announce(days + (days === 1 ? " day of practice." : " day streak.") + (mile && MILESTONE_LINES[mile] ? " " + MILESTONE_LINES[mile] : ""));
        if (mile) draw();
        var m = window.AbanteMinds && window.AbanteMinds.moments;
        if (!m) return;
        var tl = view.tl = new m.Timeline(), E = m.ease, sound = window.AbanteMinds.sound;
        var play = function (n) { return function () { if (sound) sound.play(n); }; };
        var dot = week.querySelector(".am-dot.today");
        tl.to(body.querySelector(".am-streak-glow"), [{ opacity: 0, transform: "scale(0.6)" }, { opacity: 1, transform: "none" }], 1200, 0.1);
        m.ignite(tl, fl, 0.1, 1);
        tl.call(play("ignite"), 0.15)
          .to(num, [{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }], 450, 0.6);
        if (days > 1) tl.to(num.firstChild, [{ transform: "translateY(0)" }, { transform: "translateY(-50%)" }], 600, 1.0, E.back).call(play("roll"), 1.0);
        if (mile) {
          tl.to(body.querySelector(".am-mile-chip"), [{ opacity: 0, transform: "translateY(-8px)" }, { opacity: 1, transform: "none" }], 400, 0.3)
            .call(function () { var p = m.centre(num); m.FX.stars(p.x, p.y, 14, ["#ffd23f", "#ff8a15", "#ffb000"]); }, 1.3)
            .call(play("fanfare"), 1.3);
        }
        tl.to(num, [{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }], 650, 1.25, E.backSoft)
          .to(body.querySelector(".am-streak-label"), [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], 450, 1.35)
          .to(week, [{ opacity: 0, transform: "translateY(20px)" }, { opacity: 1, transform: "none" }], 500, 1.75);
        if (dot) {
          tl.to(dot, [{ transform: "scale(1)" }, { transform: "scale(0.88)", offset: 0.25 }, { transform: "scale(1)" }], 640, 2.25, E.backSoft)
            .to(dot.firstChild, [{ transform: "scale(0)" }, { transform: "scale(1)" }], 400, 2.41, E.back)
            .to(dot.querySelector(".am-dot-tick"), [{ opacity: 0 }, { opacity: 1 }], 250, 2.5)
            .to(dot.querySelector("b"), [{ transform: "scale(1)", opacity: 0.9 }, { transform: "scale(2)", opacity: 0 }], 700, 2.43)
            .call(function () { dot.classList.remove("today"); dot.classList.add("on"); }, 2.45, true)
            .call(play("check"), 2.43);
        }
        var cards = body.querySelectorAll(".am-card");
        if (cards.length) tl.to(cards[0], [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], 450, 2.85).call(play("sparkle"), 2.9);
        tl.to(body.querySelector("p.body"), [{ opacity: 0 }, { opacity: 1 }], 450, 3.1)
          .to(footer, [{ transform: "translateY(" + (mile ? 180 : 110) + "px)" }, { transform: "none" }], 500, 3.3, E.backSoft);
        if (view.played || m.reduced()) tl.skip();
        else body.addEventListener("click", function () { tl.skip(); });
        view.played = true;
      }
    };
  };

  /* ---------- a streak milestone ----------
     A moment, not the daily screen: the milestone's own colour and scene,
     the number, what it covers, and what it earned. The days without a scene
     of their own (150, 250, 300, 400 and on) take the one before them. */
  var MILE_KEYS = [3, 7, 14, 30, 50, 100, 200, 365];
  function milestoneView(app, view, o) {
    var s = store.get(), days = o.days;
    var key = MILE_KEYS.filter(function (n) { return n <= days; }).pop() || 3, M = AM.MILE[key], exact = key === days;
    var name = exact ? M.name : days + " days";
    var sub = exact ? M.sub : (MILESTONE_LINES[days] || days + " days in a row. Keep going.");
    var stops = M.bg.match(/#[0-9a-f]{6}/gi), end = stops[stops.length - 1];
    var flame = { orange: "#ff8a15", gold: "#f2c13e", blue: "#5b9bff", ice: "#a9d4ff", purple: "#9b5cff" }[M.fl] || "#ff8a15";

    /* What the streak covers: the days themselves up to two weeks, a month
       of them at thirty, and after that the numbers. */
    var what;
    if (days <= 14) {
      var cells = days <= 7 ? 7 : 14, dots = [];
      for (var i = 0; i < cells; i++) dots.push(el(i < days ? "i.on" : "i", null, i < days ? icon("check", 14, { glyph: true }) : null));
      what = [el("div.am-mgrid", { style: { gridTemplateColumns: "repeat(7, 26px)", "--fl": flame } }, dots),
        el("div.am-mnext", null, days === 3 ? "3 of your first 7 days" : days === 7 ? "A whole week" : "Two full weeks")];
    } else if (days === 30) {
      var month = [];
      for (var j = 0; j < 30; j++) month.push(el("i.on"));
      what = [el("div.am-mgrid.small", { style: { gridTemplateColumns: "repeat(10, 16px)", "--fl": flame } }, month), el("div.am-mnext", null, "Every day of a month")];
    } else {
      what = el("div.am-mstat3", null,
        el("div", null, el("b", null, String(days)), el("small", null, "days in a row")),
        el("div", null, el("b", null, String(store.path().levelsCleared)), el("small", null, "levels cleared")),
        el("div", null, el("b", null, String(s.totalCorrect || 0)), el("small", null, "right answers")));
    }
    var note = /tomorrow/.test(sub) ? "" : "Come back tomorrow to make it " + (days + 1) + ".";
    if (store.forgivenYesterday()) note = "Yesterday was forgiven: one missed day a week doesn't break your streak. " + note;
    if (o.saved) note = (o.saved.used === 1 ? "A streak shield" : o.saved.used + " streak shields") + " kept your streak going. " + note;

    var art = el("div.am-mile-art", { html: AM.mileArt(key) });
    var hero = el("div.am-moment-hero", { "aria-hidden": "true" }, el("div.am-halo", { html: AM.haloSVG(M.tint) }), art);
    var fresh = newBadgesCard(view.badges, true), road = view.road.length ? roadNewCard(app, view.road, true) : null;
    var body = el("div.am-moment", { style: { "--gutter": gutter() + "px", background: M.bg } },
      el("div.am-moment-eyebrow", { style: { color: M.tint } }, name),
      hero,
      el("h1.am-moment-title", null, el("span.am-moment-big", null, String(days)), "day streak!"),
      el("p.am-moment-sub", null, sub),
      el("div.am-mcard", null, what),
      fresh ? el("div.am-mcard-wrap", null, fresh) : null,
      road ? el("div.am-mcard-wrap", null, road) : null,
      note ? el("p.am-moment-note", null, note) : null);
    var shareBtn = el("button.am-reset.am-moment-link.label", { type: "button", onClick: function () {
      /* Straight from the tap when the picture is ready, as phones require. */
      (view.blob ? AM.share.send(view.blob, o.file, o.text) : o.draw().then(function (b) { return AM.share.send(b, o.file, o.text); })).then(function (how) {
        if (how === "saved") AM.announce("Picture saved.");
        if (how === "failed") AM.announce("This phone could not share the picture.");
      });
    } }, icon("share", 18), "Share");
    var footer = el("div", { style: { flex: "none", padding: "8px " + gutter() + "px 20px", display: "flex", justifyContent: "center", background: end } },
      el("div", { style: { width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 4 } },
        AM.Button({ label: "Continue", variant: "inverse", fullWidth: true, cta: true, onClick: o.go }), shareBtn));
    return {
      nav: null, chrome: false, body: body, footer: footer, onBack: o.go,
      after: function () {
        AM.announce(days + " day streak. " + name + ". " + sub);
        o.draw();
        var m = window.AbanteMinds && window.AbanteMinds.moments;
        if (!m) return;
        var tl = view.tl = new m.Timeline(), E = m.ease, sound = window.AbanteMinds.sound;
        var play = function (n) { return function () { if (sound) sound.play(n); }; };
        /* The scene settles in, the words rise in order, one burst of confetti. */
        tl.to(hero.firstChild, [{ opacity: 0, transform: "scale(0.7)" }, { opacity: 1, transform: "none" }], 700, 0.05)
          .to(art, [{ opacity: 0, transform: "scale(0.6) translateY(16px)" }, { opacity: 1, transform: "scale(1.05)", offset: 0.6 }, { opacity: 1, transform: "none" }], 650, 0.1, E.out)
          .call(play("milestone"), 0.2)
          .call(function () { var p = m.centre(art, 0.45); m.FX.confetti(p.x, p.y, -90, 170, 420, 800, 40); }, 0.45);
        Array.prototype.forEach.call(body.children, function (c, k) {
          if (c === hero) return;
          tl.to(c, [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], 440, 0.25 + k * 0.09, E.out);
        });
        tl.to(footer, [{ transform: "translateY(140px)" }, { transform: "none" }], 500, 1.1, E.backSoft);
        if (view.played || m.reduced()) tl.skip();
        else body.addEventListener("click", function () { tl.skip(); });
        view.played = true;
      }
    };
  }

  /* ---------- card tiers ----------
     Profile shows the tier held, how near the next is, and the ladder. */
  function tierSection(app) {
    var t = store.tier(), T = store.CARD_TIERS;
    var line = !t.next ? "The highest tier. Every day still counts."
      : t.needsTopics ? "Pearl needs every topic cleared as well."
      : t.toNext + " more day" + (t.toNext === 1 ? "" : "s") + " with a full round to " + t.next.name;
    var ladder = el("div.am-tierladder", { "aria-hidden": "true" }, T.map(function (x, i) {
      return el("span.am-tierstep" + (i <= t.index ? ".on" : i === t.index + 1 ? ".next" : ""), { style: { "--t1": x.c[1], "--t2": x.c[2] } }, x.name);
    }));
    return el("div", { style: { padding: "16px " + gutter() + "px 0" } },
      AM.Card({ style: { gap: 10 } },
        el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 } },
          el("span.label", null, t.tier.name + " card"),
          el("span.caption", { style: { color: "var(--ink-600)" } }, t.days + " day" + (t.days === 1 ? "" : "s") + " with a full round")),
        t.next ? AM.ProgressBar({ ratio: t.next.days ? Math.min(1, t.days / t.next.days) : 1, height: 8, label: "Days to the next tier" }) : null,
        el("span.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } }, line),
        ladder));
  }

  /* A new tier: a moment of its own, after the day's streak. The card is
     shown wearing it, with its stone from Emerald up. */
  screens.tierUp = function (app) {
    var view = app.scratch.tierUp || (app.scratch.tierUp = { t: store.takeTier(), played: false });
    var go = function () { if (view.tl) view.tl.skip(); var next = app.scratch.afterTier || "home"; app.scratch.tierUp = null; app.scratch.afterTier = null; app.go(next); };
    var t = view.t || store.tier(), x = t.tier, p = store.get().profile || {};
    var bg = "linear-gradient(180deg, " + x.c[2] + " 0%, " + x.c[3] + " 100%)";
    var card = AM.ProfileCard({ name: p.name, school: x.name + " card", colorKey: p.colorKey, frame: x.key, pattern: p.pattern, initials: p.initials, title: p.title, motto: p.motto, tier: x, style: { maxWidth: 300, width: "100%" } });
    var hero = el("div.am-moment-hero", { "aria-hidden": "true", style: { width: "100%", height: 170 } }, el("div.am-halo", { html: AM.haloSVG(x.c[0]) }), card);
    var body = el("div.am-moment", { style: { "--gutter": gutter() + "px", background: bg } },
      el("div.am-moment-eyebrow", { style: { color: x.c[0] } }, "A new card tier"),
      hero,
      el("h1.am-moment-title", null, el("span.am-moment-big", { style: { fontSize: 64 } }, x.name)),
      el("p.am-moment-sub", null, t.days + " days with a full round. Your card wears " + x.name + " now" + (x.kind === "metal" ? "." : ", with its stone.")),
      t.next ? el("p.am-moment-note", null, t.next.allTopics ? "Next, Pearl: Diamond's days and every topic cleared." : "Next, " + t.next.name + " at " + t.next.days + " days.") : null);
    var footer = el("div", { style: { flex: "none", padding: "8px " + gutter() + "px 20px", display: "flex", justifyContent: "center", background: x.c[3] } },
      el("div", { style: { width: "100%", maxWidth: 520 } }, AM.Button({ label: "Continue", variant: "inverse", fullWidth: true, cta: true, onClick: go })));
    return {
      nav: null, chrome: false, body: body, footer: footer, onBack: go,
      after: function () {
        AM.announce("A new card tier: " + x.name + ".");
        var m = window.AbanteMinds && window.AbanteMinds.moments;
        if (!m) return;
        var tl = view.tl = new m.Timeline(), E = m.ease, sound = window.AbanteMinds.sound;
        tl.to(hero.firstChild, [{ opacity: 0, transform: "scale(0.7)" }, { opacity: 1, transform: "none" }], 700, 0.05)
          .to(card, [{ opacity: 0, transform: "scale(0.85) translateY(18px)" }, { opacity: 1, transform: "none" }], 700, 0.15, E.out)
          .call(function () { if (sound) sound.play("tier"); }, 0.1)
          .call(function () { var c = m.centre(card, 0.5); m.FX.confetti(c.x, c.y, -90, 170, 380, 800, 36); }, 1.1);
        Array.prototype.forEach.call(body.children, function (c, k) {
          if (c === hero) return;
          tl.to(c, [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], 440, 0.3 + k * 0.1, E.out);
        });
        tl.to(footer, [{ transform: "translateY(120px)" }, { transform: "none" }], 500, 1.2, E.backSoft);
        if (view.played || m.reduced()) tl.skip();
        else body.addEventListener("click", function () { tl.skip(); });
        view.played = true;
      }
    };
  };

  /* ---------- 16 · Session summary ---------- */
  /* 14 October, as Home writes the exam date. */
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function dayAndMonth(iso) {
    var p = String(iso).split("-");
    return +p[2] + " " + MONTHS[+p[1] - 1];
  }

  /* After a review: how it went, and when the next ones come back. */
  screens.reviewDone = function (app) {
    var r = app.scratch.review;
    if (!r) { app.go("home"); return screens.home(app); }
    function stat(value, label) {
      return el("div", {
        style: { background: "var(--surface-200)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)", padding: "var(--space-3)", textAlign: "center" }
      }, el("div.heading-lg", null, String(value)), el("div.caption", { style: { color: "var(--ink-600)" } }, label));
    }
    var later = r.due ? r.due + " more " + (r.due === 1 ? "is" : "are") + " due now."
      : r.next ? "The next ones come back on " + dayAndMonth(r.next) + "." : "Nothing else is waiting.";
    return {
      nav: "practice", bottomNav: false,
      banner: connectionBanner(),
      body: column([
        el("div", { style: { padding: "24px " + gutter() + "px 0" } },
          el("div.heading-lg", null, "Review done"),
          el("div.body-sm", { style: { color: "var(--ink-600)", marginTop: 4 } }, "Questions you missed before")),
        el("div", { style: { padding: "18px " + gutter() + "px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } },
          stat(r.attempted, "reviewed"), stat(r.correct, "right first time")),
        newBadgesCard(r.badges || (r.badges = takeBadges(anyBadge))),
        el("div", { style: { padding: "20px " + gutter() + "px 0" } },
          AM.Card({ style: { gap: 10 } },
            sectionLabel("How review works"),
            el("span.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } },
              "A question you miss comes back the next day. Right first time, and it comes back in 3 days, then in 7, and then it is done. A miss sends it back to the next day. " + later)))
      ], { paddingBottom: 24 }),
      footer: el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 24px", display: "flex", justifyContent: "center" } },
        el("div", { style: { width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 10 } },
          r.due ? AM.Button({ label: "Review more", fullWidth: true, onClick: function () { app.startReview(); } }) : null,
          AM.Button({ label: "Home", variant: r.due ? "ghost" : "primary", fullWidth: true, onClick: function () { app.go("home"); } })))
    };
  };

  /* The round in three numbers. Each tile says what it shows in a word, and
     the numbers count up once when the summary opens (Duolingo's end of
     lesson, kept calm: no points, no speed praise). */
  function accuracyWord(pct) { return pct === 100 ? "Perfect" : pct >= 80 ? "Sharp" : pct >= 50 ? "Steady" : "Building"; }
  function resultTiles(r) {
    var pct = r.attempted ? Math.round(100 * r.correct / r.attempted) : 0;
    function tile(kind, word, value, suffix, caption) {
      return el("div.am-tile.am-tile-" + kind, null,
        el("div.am-tile-word.caption", null, word),
        el("div.am-tile-face", null,
          el("span.am-tile-num.heading-lg", { "data-to": value, "data-suffix": suffix }, value + suffix),
          el("span.caption", { style: { color: "var(--ink-600)" } }, caption)));
    }
    return el("div.am-tiles", { style: { padding: "18px " + gutter() + "px 0" } },
      tile("acc", accuracyWord(pct), pct, "%", "right first time"),
      tile("run", "Best run", r.bestRun || 0, "", "in a row"),
      tile("time", "Time", r.minutes, "", r.minutes === 1 ? "minute" : "minutes"));
  }
  function countTiles(tiles, r) {
    var m = window.AbanteMinds && window.AbanteMinds.moments;
    if (!tiles || r.counted || !m || m.reduced()) { r.counted = true; return; }
    r.counted = true;
    var tl = new m.Timeline(), sound = window.AbanteMinds.sound;
    Array.prototype.forEach.call(tiles.querySelectorAll(".am-tile"), function (t, i) {
      var num = t.querySelector(".am-tile-num"), at = 0.15 + i * 0.28;
      num.textContent = "0" + num.dataset.suffix;
      delete num.dataset.done;
      tl.to(t, [{ opacity: 0, transform: "translateY(14px) scale(0.96)" }, { opacity: 1, transform: "none" }], 380, at, m.ease.backSoft)
        .call(function () { m.count(num, Number(num.dataset.to), num.dataset.suffix, 650); if (sound) sound.play("pop"); }, at + 0.1)
        .call(function () { num.dataset.done = "1"; num.textContent = num.dataset.to + num.dataset.suffix; }, at + 0.8, true);
    });
    tiles.addEventListener("click", function () { tl.skip(); });
  }

  screens.summary = function (app) {
    var r = app.scratch.result;
    if (!r) { app.go("home"); return screens.home(app); }
    var t = store.topicPath(r.topicKey) || store.basicsTopic(r.topicKey);
    var lv = t.levels.filter(function (x) { return x.id === r.levelId; })[0];
    if (r.facts) return factsSummary(app, r, t, lv);
    var nextLevel = t.levels[lv.number] || null;

    var missed = r.missed.length;
    var levelNote = r.redo ? "Redoing missed questions keeps your streak but does not count towards the level."
      : lv.cleared ? (nextLevel ? "Cleared. Level " + nextLevel.number + ", " + nextLevel.title.toLowerCase() + ", is open." : "Cleared. That was the last level in " + t.label.toLowerCase() + ".")
      : (lv.target - lv.correct) + " more right first time to clear it.";

    /* The round's moment: what it added, on the level's own bar. Short and
       still by itself; a tap isn't needed to move on. */
    var added = !r.redo && r.levelStart !== null && r.levelStart !== undefined ? Math.min(lv.correct, lv.target) - r.levelStart : 0;
    var moment = !r.redo && !lv.cleared;
    var title = r.redo ? (r.attempted && r.correct === r.attempted ? "All put right!" : "Round done")
      : r.attempted && r.correct === r.attempted ? "Perfect round!"
      : r.correct >= 7 ? "Great round!" : r.correct >= 4 ? "Good practice!" : "Round done";

    var tiles = resultTiles(r);
    var primary = (lv.cleared && nextLevel && nextLevel.unlocked && !nextLevel.cleared)
      ? AM.Button({ label: "Start level " + nextLevel.number, fullWidth: true, onClick: function () { app.startLevel(r.topicKey, nextLevel.id); } })
      : AM.Button({ label: lv.cleared ? "Review this level" : "Practise again", fullWidth: true, onClick: function () { app.startLevel(r.topicKey, r.levelId); } });

    return {
      nav: "practice", bottomNav: false,
      banner: connectionBanner(),
      after: function () {
        countTiles(tiles, r);
        if (r.sounded || !moment || added <= 0) return;
        r.sounded = true;
        var sound = window.AbanteMinds && window.AbanteMinds.sound;
        if (sound) sound.play("sparkle");
      },
      body: column([
        el("div", { style: { padding: "24px " + gutter() + "px 0" } },
          el("div.heading-lg", null, title),
          el("div.body-sm", { style: { color: "var(--ink-600)", marginTop: 4 } },
            r.topicLabel + " · Level " + r.levelNumber + " · " + r.minutes + " minute" + (r.minutes === 1 ? "" : "s"))),

        goalMet(app),
        tiles,

        el("div", { style: { padding: "20px " + gutter() + "px 0" } },
          AM.Card({ style: { gap: 10 } },
            sectionLabel("Level " + lv.number + " · " + lv.title),
            moment ? el("div.am-gain-row", { role: "img", "aria-label": lv.correct + " of " + lv.target + " right first time" },
              el("span", { style: { width: (r.levelStart || 0) / lv.target * 100 + "%", background: "var(--skill-" + t.colorKey + "-bright)" } }),
              added > 0 ? el("span.am-gain", { style: { width: added / lv.target * 100 + "%" } }) : null) : null,
            moment && added > 0 ? el("span.label", { style: { color: "var(--action-700)" } }, "+" + added + " towards the level") : null,
            moment ? null : AM.ProgressBar({ ratio: lv.correct / lv.target, height: 10, color: "var(--skill-" + t.colorKey + "-bright)", label: "Level progress" }),
            el("span.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } }, levelNote))),

        newBadgesCard(r.badges || (r.badges = takeBadges(anyBadge))),
        roadNewCard(app, r.road || (r.road = store.takeRoad())),
        reminderOffer(app, r),

        missed ? el("div", { style: { padding: "20px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: 10 } },
          sectionLabel("Do next"),
          AM.Card({ style: { flexDirection: "row", gap: "var(--space-3)", alignItems: "center", padding: 14, cursor: "pointer" },
            onClick: function () { app.startRedo(r); } },
            el("span", {
              style: {
                width: 36, height: 36, flex: "none", borderRadius: "var(--radius-sm)",
                background: "var(--skill-" + r.colorKey + "-tint)", color: "var(--skill-" + r.colorKey + "-deep)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }
            }, icon("retry", 20)),
            el("span.body", { style: { textWrap: "pretty" } },
              "Redo the " + missed + " you missed" + (r.missedTheme ? ", all " + r.missedTheme + " questions." : ".")))
        ) : null
      ], { paddingBottom: 24 }),
      footer: el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 24px", display: "flex", justifyContent: "center" } },
        el("div", { style: { width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 10 } },
          primary,
          AM.Button({ label: "Back to " + t.label.toLowerCase(), variant: "ghost", fullWidth: true, onClick: function () { app.backToTopic(r.topicKey); } })))
    };
  };

  /* A facts round: how many were quick, and the level's facts mastered.
     There is no redo card: a missed fact already came back in the round. */
  function factsSummary(app, r, t, lv) {
    function stat(value, label) {
      return el("div", {
        style: {
          background: "var(--surface-200)", borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-card)", padding: "var(--space-3)", textAlign: "center"
        }
      }, el("div.heading-lg", null, String(value)), el("div.caption", { style: { color: "var(--ink-600)" } }, label));
    }
    var note = lv.mastered + " of " + lv.facts + " facts mastered" +
      (r.masteredNow ? ", " + r.masteredNow + " of them this round. " : ". ") +
      "A fact is mastered when it is right in under 4 seconds on two different days.";
    var grid = t.grid ? C.grid(t.key) : null;
    return {
      nav: "practice", bottomNav: false,
      banner: connectionBanner(),
      body: column([
        el("div", { style: { padding: "24px " + gutter() + "px 0" } },
          el("div.heading-lg", null, "Round done"),
          el("div.body-sm", { style: { color: "var(--ink-600)", marginTop: 4 } },
            t.label + " · " + lv.title + " · " + r.minutes + " minute" + (r.minutes === 1 ? "" : "s"))),
        el("div", { style: { padding: "18px " + gutter() + "px 0", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 } },
          stat(r.attempted, "answered"), stat(r.correct, "right first time"), stat(r.quick, "quick")),
        newBadgesCard(r.badges || (r.badges = takeBadges(anyBadge))),
        el("div", { style: { padding: "20px " + gutter() + "px 0" } },
          AM.Card({ style: { gap: 10 } },
            sectionLabel(lv.title),
            AM.ProgressBar({ ratio: lv.facts ? lv.mastered / lv.facts : 0, height: 10, color: "var(--skill-" + t.colorKey + "-bright)", label: "Facts mastered" }),
            el("span.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } }, note))),
        grid ? el("div", { style: { padding: "20px " + gutter() + "px 0" } },
          AM.Card({ style: { gap: 12 } },
            sectionLabel(grid.title),
            AM.FactGrid({ grid: grid, colorKey: t.colorKey, state: factLook }))) : null
      ], { paddingBottom: 24 }),
      footer: el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 24px", display: "flex", justifyContent: "center" } },
        el("div", { style: { width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 10 } },
          AM.Button({ label: "Another round", fullWidth: true, onClick: function () { app.startLevel(r.topicKey, r.levelId); } }),
          AM.Button({ label: "Back to " + t.label.toLowerCase(), variant: "ghost", fullWidth: true, onClick: function () { app.backToTopic(r.topicKey); } })))
    };
  }

  /* ---------- Practice exam ----------
     A rehearsal of the real paper: mixed questions from every topic by the
     blueprint's weights, a clock, no hints, and right or wrong only at the
     end. Three screens: the rules before starting, the questions, and the
     results with every question reviewed. */
  function minutesSeconds(total) {
    var m = Math.floor(total / 60), s = total % 60;
    return m + " min " + (s < 10 ? "0" : "") + s + " s";
  }

  /* One line of a timed round's rules, with its icon. */
  function ruleLine(glyph, text) {
    return el("span", { style: { display: "flex", gap: "var(--space-3)", alignItems: "flex-start" } },
      el("span", { style: { flex: "none", color: "var(--brand-blue-600)" } }, icon(glyph, 22)),
      el("span.body", { style: { textWrap: "pretty" } }, text));
  }

  /* ---------- the challenge round ----------
     Pick a mode, then play. The rules are in app/challenge.js. */
  screens.challengeIntro = function (app) {
    if (!store.challengePool().length) { app.go("home"); return screens.home(app); }
    var Ch = AM.challenge;
    var mode = app.scratch.challengeMode || "sprint";
    var m = Ch.MODES[mode], stats = store.challengeStats(mode), today = store.challengeDaily(mode);
    var rules = mode === "sprint" ? [
      ["clock", "Answer as many as you can in " + m.seconds + " seconds. After " + Ch.SPRINT_EASY + " right, the numbers get bigger."],
      ["streak", "Each right answer scores " + Ch.POINTS + ". Five in a row doubles your points, and ten triples them."]
    ] : [
      ["clock", m.seconds + " seconds. Three right in a row steps the questions up, and a miss steps them back."],
      ["streak", "Step 1 scores 10, step 2 scores 20 and step 3 scores 30. Five in a row doubles your points, and ten triples them."]
    ];
    return {
      nav: "home",
      back: function () { app.go("home", "back"); },
      body: column([
        el("div", { style: { padding: "16px " + gutter() + "px 0" } },
          el("div.heading-lg", null, "Challenge"),
          el("div.body-sm", { style: { color: "var(--ink-600)", marginTop: 4 } }, "Quick rounds from levels you have cleared")),
        el("div", { style: { padding: "12px " + gutter() + "px 0" } },
          AM.Segmented({
            label: "Choose a round", value: mode,
            options: Object.keys(Ch.MODES).map(function (k) { return { value: k, label: Ch.MODES[k].name }; }),
            onChange: function (v) { app.scratch.challengeMode = v; app.keepScroll = true; app.render(); }
          })),
        el("div", { style: { padding: "8px " + gutter() + "px 0" } },
          AM.Card({ style: { gap: 14 } },
            rules.map(function (r) { return ruleLine(r[0], r[1]); }),
            ruleLine("lock", "No lives, and a miss only costs the seconds it took. It does not change your path or your Basics."))),
        el("div", { style: { padding: "20px " + gutter() + "px 0" } },
          AM.Card({ style: { gap: 6 } },
            sectionLabel("Your best"),
            el("span.heading-md", null, stats.best ? stats.best.score + " points" : "No record yet"),
            stats.best ? el("span.caption", { style: { color: "var(--ink-600)" } }, stats.best.right + " right · best run " + stats.best.bestRun) : null)),
        el("div", { style: { padding: "20px " + gutter() + "px 0" } },
          AM.Card({ style: { gap: 12 } },
            sectionLabel("Today's challenge"),
            el("span.body", { style: { textWrap: "pretty" } }, today ? "You played today's " + m.name.toLowerCase() + ": " + today.score + " points. Come back tomorrow for a new one." : "One go a day, with its own questions for today."),
            today ? null : AM.Button({ label: "Play today's challenge", variant: "ghost", fullWidth: true, onClick: function () { app.startChallenge(mode, true); } })))
      ], { paddingBottom: 24 }),
      footer: el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 24px", display: "flex", justifyContent: "center" } },
        el("div", { style: { width: "100%", maxWidth: 520 } },
          AM.Button({ label: "Start", fullWidth: true, onClick: function () { app.startChallenge(mode, false); } })))
    };
  };

  screens.challenge = function (app) {
    var ses = app.session;
    if (!ses || !ses.challenge) { app.go("home"); return screens.home(app); }
    var Ch = AM.challenge, g = ses.challenge, q = ses.questions[ses.index], now = Date.now();
    var desktop = AM.device() === "desktop";
    var asking = ses.phase === "ask", right = ses.phase === "correct";
    var multi = Ch.multiplier(g.run);

    var header = el("div.am-reset", {
      style: {
        display: "flex", alignItems: "center", gap: "var(--space-4)", padding: "var(--space-4) var(--space-6)",
        background: "var(--surface-100)", borderBottom: "1px solid var(--line-200)", flex: "none"
      }
    },
      el("button.am-reset.am-close", { type: "button", "aria-label": "Leave this round", onClick: openLeave }, icon("x", 22)),
      el("span.caption", {
        style: {
          display: "inline-flex", padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)",
          background: "var(--brand-blue-100)", color: "var(--brand-blue-600)", whiteSpace: "nowrap"
        }
      }, g.mode === "ladder" ? "Step " + g.step : Ch.MODES[g.mode].label),
      el("div", {
        role: "progressbar", "aria-label": "Time left",
        style: { flex: 1, height: 10, borderRadius: "var(--radius-pill)", background: "var(--surface-300)", overflow: "hidden" }
      }, el("span.am-chal-fill" + (Ch.isLow(g, now) ? ".am-chal-low" : ""), { style: { transform: "scaleX(" + Ch.shareLeft(g, now) + ")" } })),
      el("span.label.am-chal-clock", { role: "timer", style: { whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", minWidth: "4ch", textAlign: "right" } }, Ch.secondsLeft(g, now) + " s"));

    var hud = el("div", { style: { display: "flex", alignItems: "center", gap: "var(--space-2)", minHeight: 34 } },
      el("span", { style: { display: "inline-flex", alignItems: "center", gap: 4, color: g.run >= 3 ? "var(--action-700)" : "var(--ink-600)" } },
        AM.Flame ? AM.Flame(22, g.run >= 3) : icon("streak", 20),
        el("span.label", { style: { fontVariantNumeric: "tabular-nums" } }, String(g.run))),
      multi > 1 ? el("span.am-chal-multi" + (g.rose && right ? ".am-chal-pop" : ""), null, "×" + multi) : null,
      el("span.label", { style: { marginLeft: "auto", fontVariantNumeric: "tabular-nums" } }, g.score + " points"));

    var prompt = el("div.heading-lg", { style: { textAlign: "center", textWrap: "balance", padding: "16px 0 12px", minHeight: 84, display: "flex", alignItems: "center", justifyContent: "center" } }, q.prompt);
    var chart = q.chart ? el("div", { style: { display: "flex", paddingBottom: 12 } }, AM.Chart(q.chart)) : null;

    var answer;
    if (q.type === "choice") {
      answer = el("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" } },
        q.choices.map(function (label, i) {
          var state = asking ? "idle" : i === q.answerIndex ? "correct" : i === ses.picked ? "wrong" : "idle";
          return AM.AnswerTile({
            text: label, state: state, tall: true, figure: q.choiceFigures ? q.choiceFigures[i] : null, disabled: !asking,
            /* A tap is the answer: a timed round has no time for a second press. */
            onClick: function () { ses.picked = i; app.check(); }
          });
        }));
    } else if (asking) {
      answer = AM.AnswerField({ entry: ses.entry, prefix: q.unit, suffix: q.suffix, onFocusBox: app.focusBox });
    } else {
      answer = el("div.am-chal-verdict.heading-lg", { dataset: { state: ses.phase }, role: "status" },
        icon(right ? "check" : "x", 26, { glyph: true }), el("span", null, ses.shownAnswer));
    }
    var note = el("div.body-lg", { style: { minHeight: 30, textAlign: "center", fontWeight: 600, paddingTop: 8 } },
      !asking && !right ? "It was " + ses.rightAnswer : "");

    var keypad = q.type === "compute" ? AM.Keypad({
      kind: q.entry,
      onPress: function (d) { app.type(d); }, onDelete: function () { app.backspace(); }, onNext: function () { app.nextBox(); }
    }) : null;
    var ready = q.type === "compute" && asking && AM.entry.complete(ses.entry);
    var check = q.type === "compute" ? AM.Button({ label: "Check", fullWidth: true, disabled: !ready, onClick: function () { app.check(); } }) : null;

    if (desktop) {
      return {
        nav: "practice", bottomNav: false, header: header, onBack: openLeave,
        body: el("div", { style: { flex: 1, display: "flex", justifyContent: "center", padding: gutter() + "px", minHeight: 0, overflowY: "auto" } },
          el("div", { style: { width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: "var(--space-3)" } },
            hud, prompt, chart, answer, note, keypad, check))
      };
    }
    return {
      nav: "practice", bottomNav: false, header: header, onBack: openLeave,
      body: column([el("div", { style: { padding: "12px " + gutter() + "px 0" } }, hud, prompt, chart, answer, note)]),
      belowFold: keypad ? el("div", { style: { padding: "0 " + gutter() + "px" } }, keypad) : null,
      footer: check ? el("div", { style: { flex: "none", padding: "16px " + gutter() + "px 20px" } }, check) : null
    };
  };

  screens.challengeResult = function (app) {
    var r = app.scratch.challenge;
    if (!r) { app.go("home"); return screens.home(app); }
    var Ch = AM.challenge, m = Ch.MODES[r.mode];
    function stat(value, label) {
      return el("div", {
        style: { background: "var(--surface-200)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)", padding: "var(--space-3)", textAlign: "center" }
      }, el("div.heading-lg", null, String(value)), el("div.caption", { style: { color: "var(--ink-600)" } }, label));
    }
    var best = r.better ? r : r.previous;
    return {
      nav: "practice", bottomNav: false,
      banner: connectionBanner(),
      body: column([
        el("div", { style: { padding: "24px " + gutter() + "px 0" } },
          el("div.body-sm", { style: { color: "var(--ink-600)" } }, (r.daily ? "Today's challenge · " : "") + m.name),
          el("div", { style: { marginTop: 4, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 44, lineHeight: 1.1 } }, r.score + " points")),
        goalMet(app),
        el("div", { style: { padding: "18px " + gutter() + "px 0", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 } },
          stat(r.right, "right"), stat(r.bestRun, "best run"),
          r.mode === "ladder" ? stat(r.top, "top step") : stat(r.right + r.wrong, "answered")),
        el("div", { style: { padding: "18px " + gutter() + "px 0" } },
          r.better
            ? el("div.am-chal-record.label", null, el("span", null, "New personal best"), el("span", null, r.score + " points"))
            : AM.Card({ style: { gap: 2 } }, sectionLabel("Your best"), el("span.heading-md", null, best ? best.score + " points" : "No record yet"))),
        newBadgesCard(r.badges || (r.badges = takeBadges(anyBadge)))
      ], { paddingBottom: 24 }),
      footer: el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 24px", display: "flex", justifyContent: "center" } },
        el("div", { style: { width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 10 } },
          AM.Button({ label: "Play again", fullWidth: true, onClick: function () { app.startChallenge(r.mode, false); } }),
          AM.Button({ label: "Back to challenges", variant: "ghost", fullWidth: true, onClick: function () { app.go("challengeIntro", "back"); } })))
    };
  };

  screens.examIntro = function (app) {
    var stats = store.examStats();
    var rule = ruleLine;
    return {
      nav: "home",
      back: function () { app.go("home", "back"); },
      body: column([
        el("div", { style: { padding: "16px " + gutter() + "px 0" } },
          el("div.heading-lg", null, "Practice exam"),
          el("div.body-sm", { style: { color: "var(--ink-600)", marginTop: 4 } },
            app.EXAM_COUNT + " questions · " + app.EXAM_MINUTES + " minutes · every topic")),
        el("div", { style: { padding: "20px " + gutter() + "px 0" } },
          AM.Card({ style: { gap: 14 } },
            rule("clock", app.EXAM_COUNT + " questions in " + app.EXAM_MINUTES + " minutes. When the time is up, the exam ends where you are."),
            rule("level-up", "The questions come from all 13 topics, more from the ones the exam weighs more, like decimals and fractions."),
            rule("hint", "No hints, and no right or wrong until the end, as in the real exam. You can skip a question."),
            rule("check", "At the end you see your score, each topic, and the working for every question you missed."),
            rule("lock", "It does not change your path or your Basics."))),
        stats ? el("div", { style: { padding: "20px " + gutter() + "px 0" } },
          AM.Card({ style: { gap: 6 } },
            sectionLabel("Your exams · " + stats.taken),
            el("span.body", null, "Last: " + stats.last.score + " of " + stats.last.total + " · Best: " + stats.best.score + " of " + stats.best.total))) : null
      ], { paddingBottom: 24 }),
      footer: el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 24px", display: "flex", justifyContent: "center" } },
        el("div", { style: { width: "100%", maxWidth: 520 } },
          AM.Button({ label: "Start the exam", fullWidth: true, onClick: function () { app.startExam(); } })))
    };
  };

  screens.exam = function (app) {
    var ses = app.session;
    if (!ses || !ses.exam) { app.go("home"); return screens.home(app); }
    var q = ses.questions[ses.index];
    var desktop = AM.device() === "desktop";
    var last = ses.index + 1 >= ses.questions.length;
    var header = AM.PracticeHeader({
      onClose: openLeave, closeLabel: "Leave the practice exam",
      tier: app.examClock(ses) + " left", clock: true,
      questionIndex: ses.index, questionTotal: ses.questions.length
    });
    var prompt = el("div", { style: { padding: (desktop ? 0 : 24) + "px " + (desktop ? 0 : gutter()) + "px 0" } },
      el("div.caption", { style: { color: "var(--ink-600)", marginBottom: 6 } }, "Question " + (ses.index + 1) + " of " + ses.questions.length),
      el(desktop ? "div.heading-lg" : "div.body-lg", { style: desktop ? { textWrap: "pretty" } : { fontWeight: 500, textWrap: "pretty" } }, q.prompt));
    var chart = q.chart ? el("div", { style: { padding: desktop ? 0 : "16px " + gutter() + "px 0", display: "flex" } }, AM.Chart(q.chart)) : null;

    var answer;
    if (q.type === "choice") {
      answer = el("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", padding: desktop ? 0 : "24px " + gutter() + "px 0" } },
        q.choices.map(function (label, i) {
          return AM.AnswerTile({
            text: label, state: ses.picked === i ? "selected" : "idle", tall: true, figure: q.choiceFigures ? q.choiceFigures[i] : null,
            onClick: function () { ses.picked = i; app.render(); }
          });
        }));
    } else {
      answer = el("div", { style: { padding: desktop ? 0 : "20px " + gutter() + "px 0" } },
        AM.AnswerField({ entry: ses.entry, prefix: q.unit, suffix: q.suffix, tall: desktop, onFocusBox: app.focusBox }));
    }
    var ready = q.type === "choice" ? ses.picked !== null : AM.entry.complete(ses.entry);
    var buttons = el("div", { style: { display: "flex", flexDirection: desktop ? "row" : "column", gap: 10 } },
      AM.Button({ label: last ? "Finish the exam" : "Next", iconRight: last ? null : "next", fullWidth: !desktop, disabled: !ready, onClick: function () { app.check(); } }),
      AM.Button({ label: "Skip", variant: "ghost", fullWidth: !desktop, onClick: function () { app.skipQuestion(); } }));
    var keypad = q.type === "compute" ? AM.Keypad({
      kind: q.entry, tall: desktop,
      onPress: function (d) { app.type(d); }, onDelete: function () { app.backspace(); }, onNext: function () { app.nextBox(); }
    }) : null;

    if (desktop) {
      var left = el("div", { style: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "var(--space-4)" } },
        answer, buttons);
      var row = el("div", { style: { display: "flex", gap: 32, alignItems: "flex-start" } }, left,
        keypad ? el("div", { style: { flex: "none", width: 280 } }, keypad) : null);
      return {
        nav: "practice", bottomNav: false, header: header, onBack: openLeave,
        body: el("div", { style: { flex: 1, display: "flex", justifyContent: "center", padding: gutter() + "px", minHeight: 0, overflowY: "auto" } },
          el("div", { style: { width: "100%", maxWidth: 720, display: "flex", flexDirection: "column", gap: 32 } }, prompt, chart, row))
      };
    }
    return {
      nav: "practice", bottomNav: false, header: header, onBack: openLeave,
      body: column([prompt, chart, answer]),
      belowFold: keypad ? el("div", { style: { padding: "0 " + gutter() + "px" } }, keypad) : null,
      footer: el("div", { style: { flex: "none", padding: "16px " + gutter() + "px 20px" } }, buttons)
    };
  };

  screens.examResult = function (app) {
    var r = app.scratch.exam;
    if (!r) { app.go("home"); return screens.home(app); }
    function stat(value, label) {
      return el("div", {
        style: { background: "var(--surface-200)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)", padding: "var(--space-3)", textAlign: "center" }
      }, el("div.heading-lg", null, String(value)), el("div.caption", { style: { color: "var(--ink-600)" } }, label));
    }
    var review = el("div", { style: { display: "flex", flexDirection: "column", gap: "var(--space-3)" } });
    r.questions.forEach(function (q, i) {
      var a = r.answers[i] || { given: null, correct: false, shown: null };
      var right = q.type === "choice" ? AM.content.choiceText(q, q.answerIndex) : (q.unit || "") + q.answerText + q.suffix;
      var ink = a.correct ? "var(--success-700)" : "var(--danger-700)";
      /* A picture answer is shown as pictures: the right one, and the one
         picked if it was wrong. */
      var pictures = q.choiceFigures ? el("div", { style: { display: "flex", flexDirection: "column", gap: "var(--space-3)" } },
        [q.answerIndex].concat(!a.correct && a.given !== null ? [a.given] : []).map(function (k) {
          return AM.Chart(Object.assign({}, q.choiceFigures[k], {
            title: (k === q.answerIndex ? "The answer, picture " : "Your answer, picture ") + q.choices[k]
          }));
        })) : null;
      review.appendChild(AM.Card({ style: { gap: 10 } },
        el("span", { style: { display: "flex", alignItems: "center", gap: "var(--space-2)" } },
          el("span", { style: { color: ink, flex: "none" } }, icon(a.correct ? "check" : "x", 20, { glyph: true })),
          el("span.caption", { style: { color: "var(--ink-600)" } }, "Question " + (i + 1) + " · " + q.topicLabel)),
        el("span.body", { style: { textWrap: "pretty" } }, q.prompt),
        q.chart ? AM.Chart(q.chart) : null,
        pictures,
        el("span.body-sm", null,
          a.given === null ? "Not answered. " : (a.correct ? "Your answer, " + a.shown + ", is right." : "Your answer: " + a.shown + ". "),
          a.correct ? null : el("span", { style: { fontWeight: 700 } }, "The answer is " + right + ".")),
        a.correct ? null : el("div", { style: { display: "flex", flexDirection: "column", gap: 6 } },
          q.steps.map(function (st, k) { return el("span.body-sm", { style: { color: "var(--ink-600)" } }, (k + 1) + ". " + st); }))));
    });
    return {
      nav: "practice", bottomNav: false,
      banner: connectionBanner(),
      body: column([
        el("div", { style: { padding: "24px " + gutter() + "px 0" } },
          el("div.heading-lg", null, r.timedOut ? "Time is up" : "Exam done"),
          el("div.body-sm", { style: { color: "var(--ink-600)", marginTop: 4 } }, "Practice exam · " + minutesSeconds(r.seconds))),
        goalMet(app),
        el("div", { style: { padding: "18px " + gutter() + "px 0", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 } },
          stat(r.score + "/" + r.total, "right"), stat(Math.round(100 * r.score / r.total) + "%", "score"),
          stat(r.answers.filter(function (a) { return a && a.given === null; }).length + (r.total - r.answers.length), "not answered")),
        newBadgesCard(r.badges || (r.badges = takeBadges(anyBadge))),
        el("div", { style: { padding: "20px " + gutter() + "px 0" } },
          AM.Card({ style: { gap: 14 } },
            sectionLabel("By topic"),
            AM.TopicBars(r.byTopic.map(function (t) {
              return { label: t.label, correct: t.right, total: t.asked, caption: t.right + " of " + t.asked, color: "var(--skill-" + t.colorKey + "-bright)" };
            }), { height: 8 }))),
        el("div", { style: { padding: "20px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: 10 } },
          sectionLabel("Every question"), review)
      ], { paddingBottom: 24 }),
      footer: el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 24px", display: "flex", justifyContent: "center" } },
        el("div", { style: { width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 10 } },
          AM.Button({ label: "Another practice exam", fullWidth: true, onClick: function () { app.go("examIntro"); } }),
          AM.Button({ label: "Home", variant: "ghost", fullWidth: true, onClick: function () { app.go("home"); } })))
    };
  };

  /* What kind of problem each template is: its schema, for the strengths and
     gaps on Profile. Built once, after the pack has loaded. */
  var problemTypes = null;
  function problemType(templateId) {
    if (!problemTypes) {
      problemTypes = Object.create(null);
      C.templates().forEach(function (t) { problemTypes[t.id] = t.schema; });
    }
    return problemTypes[templateId] || null;
  }
  function kindsNote(k) {
    if (!k.types.length) return "Answer a few more questions on the path, and this shows which kinds of problem come easily and which need practice.";
    if (k.strongest) return "Strongest: " + k.strongest.name.charAt(0).toLowerCase() + k.strongest.name.slice(1) +
      ". Needs practice: " + k.weakest.name.charAt(0).toLowerCase() + k.weakest.name.slice(1) + ".";
    return "No kind of problem stands out yet: they are all about as strong.";
  }

  /* ---------- 20 · Profile ----------
     The learner's card. Editing it is a ghost, not the primary. */
  /* ---------- the reward road (app/road.js) ----------
     One permanent ladder of rewards on Profile: each step opens with a
     streak or with levels cleared, and what is earned stays. */
  var REWARD_NAMES = {
    frame: { silver: "Silver card frame", gold: "Gold card frame", year: "One-year card frame" },
    pattern: { binakol: "Binakol weave", kusikus: "Kusikus weave", triangles: "Triangle weave", hexagons: "Hexagon weave", stars: "Star weave" },
    flame: { blue: "Blue flame", purple: "Purple flame" }
  };
  /* A step's rewards as rows; its colours make one row. */
  function rewardRows(st) {
    var rows = [], colours = st.rewards.filter(function (r) { return r.kind === "colour"; });
    if (colours.length) rows.push({ kind: "colour", keys: colours.map(function (r) { return r.key; }), label: colours.length === 1 ? "A new card colour" : colours.length + " new card colours" });
    st.rewards.forEach(function (r) {
      if (r.kind === "colour") return;
      if (r.kind === "shield") rows.push({ kind: "shield", label: "A streak shield", note: "Keeps your streak on a missed day" });
      else if (r.kind === "certificate") rows.push({ kind: "certificate", key: r.key, label: r.key === 365 ? "One-year certificate" : "Certificate of practice" });
      else rows.push({ kind: r.kind, key: r.key, label: REWARD_NAMES[r.kind][r.key], note: r.key === "binakol" ? "Inspired by Ilocano binakol weaving" : r.key === "kusikus" ? "The binakol whirlpool, woven from your name" : null });
    });
    return rows;
  }
  /* A flame in one of the road's colours, whatever the learner has picked. */
  function flameIn(size, key) {
    var f = AM.Flame(size, true), c = AM.share && AM.share.FLAMES[key];
    if (c) ["--flame-shelf", "--flame-body", "--flame-mid", "--flame-core"].forEach(function (v, i) { f.style.setProperty(v, c[i]); });
    return f;
  }
  /* A tiny card wearing a frame, so a frame reads as a card's, not a box. */
  function miniCard(frame, colorKey) {
    return el("span", {
      style: {
        width: 28, height: 19, borderRadius: 4, boxSizing: "border-box", padding: "0 4px", display: "flex", alignItems: "center", gap: 3,
        background: "var(--surface-200)", boxShadow: frame ? AM.CARD_FRAMES[frame] : "inset 0 0 0 1px var(--line-200)"
      }
    }, el("span", { style: { width: 7, height: 7, flex: "none", borderRadius: 2, background: "var(--skill-" + (colorKey || 1) + "-bright)" } }),
      el("span", { style: { flex: 1, height: 2, borderRadius: 1, background: "var(--line-200)" } }));
  }
  function rewardIcon(row, colorKey) {
    var box = function (extra) {
      var st = { width: 36, height: 36, flex: "none", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", gap: 3, position: "relative", overflow: "hidden" };
      Object.keys(extra || {}).forEach(function (k) { st[k] = extra[k]; });
      return st;
    };
    if (row.kind === "colour") return el("span", { style: box({ background: "var(--surface-100)" }) }, row.keys.map(function (k) {
      return el("span", { style: { width: 13, height: 13, borderRadius: "50%", background: "var(--skill-" + k + "-bright)" } });
    }));
    if (row.kind === "shield") return el("span", { style: box({ background: "var(--brand-blue-100)", color: "var(--brand-blue-600)" }) }, icon("shield", 22));
    if (row.kind === "certificate") return el("span", { style: box({ background: "var(--gold-tint)", color: "var(--ink-900)" }) }, icon("certificate", 22));
    if (row.kind === "frame") return el("span", { style: box({ background: "var(--surface-100)", overflow: "visible" }) }, miniCard(row.key, colorKey));
    if (row.kind === "pattern") return el("span", { style: box({ background: "var(--surface-200)", boxShadow: "inset 0 0 0 1px var(--surface-300)" }) },
      AM.CardPattern(row.key, "var(--skill-" + (colorKey || 1) + "-bright)", 0.7));
    if (row.kind === "flame") return el("span", { style: box() }, flameIn(24, row.key));
    return el("span", { style: box() });
  }
  function rewardRow(row, colorKey) {
    return el("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
      rewardIcon(row, colorKey),
      el("span", { style: { display: "flex", flexDirection: "column", gap: 1, minWidth: 0 } },
        el("span.label", null, row.label),
        row.note ? el("span.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } }, row.note) : null));
  }
  function stepLabel(st) { return st.streak + "-day streak" + (st.levels ? " or " + st.levels + " levels" : ""); }
  function shieldCount(rd) {
    return AM.Chip({ icon: "shield", label: rd.shields + " of " + rd.maxShields + " shields" });
  }
  /* The step to come: how far each way is. */
  function routeBars(rd, st) {
    function bar(label, have, need) {
      return el("div", { style: { display: "flex", flexDirection: "column", gap: 4 } },
        el("span.body-sm", { style: { color: "var(--ink-600)" } }, label + ": " + Math.min(have, need) + " of " + need),
        AM.ProgressBar({ ratio: Math.min(1, have / need), height: 8, color: "var(--brand-blue-600)", label: label }));
    }
    return el("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
      bar("Days in a row", rd.streak, st.streak), st.levels ? bar("Levels cleared, with Basics", rd.levels, st.levels) : null);
  }

  /* A certificate is drawn when the road opens, so that the tap that shares
     it reaches the phone's share menu at once, as phones require. */
  function certificateFor(app, st, rd, p) {
    var log = rd.log[st.n] || {}, keep = app.scratch.certificates || (app.scratch.certificates = {});
    var o = { name: p.name, by: log.by || "streak", days: st.streak, levels: st.levels, day: log.day || store.today(), year: st.streak === 365 };
    var file = "abante-minds-certificate-" + (o.by === "levels" ? o.levels + "-levels" : o.days + "-days") + ".png";
    var job = keep[st.n] || (keep[st.n] = { drawing: AM.share.certificate(o).then(function (b) { job.blob = b; return b; }) });
    return function () {
      (job.blob ? AM.share.send(job.blob, file, "My certificate of practice from Abante Minds") : job.drawing.then(function (b) { return AM.share.send(b, file, "My certificate of practice from Abante Minds"); }))
        .then(function (how) {
          if (how === "saved") AM.announce("Certificate saved.");
          if (how === "failed") AM.announce("This phone could not share the certificate.");
        });
    };
  }

  /* What a round or a streak just reached on the road, once. */
  function roadNewCard(app, steps, bare) {
    if (!steps || !steps.length || !AM.road) return null;
    var p = store.get().profile || {}, rows = [];
    steps.forEach(function (n) { rewardRows(AM.road.step(n - 1)).forEach(function (r) { rows.push(r); }); });
    return el("div", { style: { padding: bare ? 0 : "18px " + gutter() + "px 0", width: "100%", boxSizing: "border-box", textAlign: "left" } },
      AM.Card({ style: { gap: 10 } },
        sectionLabel("New on your reward road · step " + (steps.length === 1 ? steps[0] : steps[0] + " to " + steps[steps.length - 1])),
        el("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, rows.map(function (r) { return rewardRow(r, p.colorKey); })),
        AM.Button({ label: "See the road", variant: "ghost", fullWidth: true, onClick: function () { app.go("road"); } })));
  }

  /* Profile's look at the road: the next step and how near it is. */
  function roadSection(app) {
    if (!AM.road) return null;
    var rd = store.road(), next = AM.road.step(rd.reached), p = store.get().profile || {};
    return el("div", { style: { padding: "18px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-2)" } },
      sectionLabel("Reward road" + (rd.reached ? " · step " + rd.reached + " reached" : "")),
      AM.Card({ style: { gap: 12 } },
        el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" } },
          el("span.label", null, "Next: " + stepLabel(next)), shieldCount(rd)),
        el("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, rewardRows(next).map(function (r) { return rewardRow(r, p.colorKey); })),
        routeBars(rd, next),
        AM.Button({ label: "See the road", variant: "ghost", fullWidth: true, onClick: function () { app.go("road"); } })));
  }

  /* The Road tab's two halves, the road and the trophy room, and where the
     learner stands: days in a row, levels cleared, shields held. */
  function roadHead(app, which) {
    var rd = store.road();
    function tab(key, label) {
      var on = key === which;
      return el("button.am-reset.am-roadtab", {
        type: "button", "aria-current": on ? "page" : null,
        onClick: function () { if (!on) { app.scratch.badgesBack = null; app.go(key, key === "road" ? "back" : "forward"); } }
      }, label);
    }
    return el("div", { style: { padding: "20px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: 12 } },
      el("h1.heading-lg", { style: { margin: 0 } }, "Reward road"),
      el("nav.am-roadtabs", { "aria-label": "Reward road" }, tab("road", "Road"), tab("badges", "Trophy room")),
      el("div.am-roadchips", null,
        el("span.am-rchip", null, AM.Flame ? AM.Flame(18, rd.streak > 0) : icon("streak", 16), el("b", null, String(rd.streak)), rd.streak === 1 ? "day" : "days"),
        el("span.am-rchip", null, icon("level-up", 16), el("b", null, String(rd.levels)), rd.levels === 1 ? "level" : "levels"),
        el("span.am-rchip", null, icon("shield", 16), el("b", null, String(rd.shields)), rd.shields === 1 ? "shield" : "shields")));
  }

  screens.road = function (app) {
    var rd = store.road(), p = store.get().profile || {};
    var shown = Math.max(rd.reached + 3, 11);
    /* A step's details, in a sheet from the map. */
    function detail(i) {
      var st = AM.road.step(i), reached = i < rd.reached, next = i === rd.reached, log = rd.log[st.n] || {};
      var cert = reached && st.rewards.some(function (r) { return r.kind === "certificate"; }) ? certificateFor(app, st, rd, p) : null;
      return el("div", { style: { display: "flex", flexDirection: "column", gap: 12, width: "100%" } },
        el("span", { style: { display: "flex", flexDirection: "column", gap: 2 } },
          el("span.heading-sm", null, "Step " + st.n + " · " + stepLabel(st)),
          el("span.body-sm", { style: { color: reached ? "var(--success-700)" : "var(--ink-600)" } },
            reached ? "Reached " + (log.by === "levels" ? "by clearing " + st.levels + " levels" : "with a " + st.streak + "-day streak")
              : next ? "Your next step" : "Opens after step " + (st.n - 1))),
        el("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, rewardRows(st).map(function (r) { return rewardRow(r, p.colorKey); })),
        next ? routeBars(rd, st) : null,
        cert ? AM.Button({ label: "Get your certificate", variant: "ghost", iconLeft: "certificate", fullWidth: true, onClick: cert }) : null);
    }
    /* The map: a winding route, the part walked filled in; a node for each
     step (reached, next, still to come); the chapters on bands of their own
     colour; and You at the next step. x is a share of the width, y pixels. */
    var REGIONS = { 0: "Your first week", 2: "Your first month", 4: "A hundred days", 6: "The long road", 10: "One year" };
    var REG = ["#ff9a3c", "#25a356", "#3b7bf0", "#7b6cf6", "#e2559f"];
    var pts = [], lift = 0, starts = [];
    for (var i = 0; i < shown; i++) {
      if (REGIONS[i] !== undefined || (i > 10 && (i - 10) % 4 === 0)) { if (i) lift += 40; starts.push(i); }
      pts.push([50 + Math.sin(i * 1.1 + 0.4) * 26, 104 + i * 150 + lift]);
    }
    var H = pts[pts.length - 1][1] + 110;
    function route(n) {
      var d = "M" + pts[0][0] + " " + (pts[0][1] - 70);
      for (var k = 0; k < n; k++) {
        var q = pts[k - 1], c = pts[k];
        if (!k) d += " L" + c[0] + " " + c[1];
        else { var my = (q[1] + c[1]) / 2; d += " C" + q[0] + " " + my + ", " + c[0] + " " + my + ", " + c[0] + " " + c[1]; }
      }
      return d;
    }
    var map = el("div.am-rmap", { style: { height: H + "px" } });
    starts.forEach(function (i0, r) {
      var i1 = starts[r + 1], t0 = r ? pts[i0][1] - 118 : 0, b0 = i1 !== undefined ? pts[i1][1] - 118 : H, c = REG[r % REG.length];
      map.appendChild(el("div.am-rband", { "aria-hidden": "true", style: {
        top: t0 + "px", height: (b0 - t0) + "px", background: "linear-gradient(180deg, " + c + "2b, " + c + "0f 55%, transparent)",
        borderTop: r ? "2px dashed " + c + "4d" : "0"
      } }));
    });
    map.appendChild(el("span", { "aria-hidden": "true", html: '<svg viewBox="0 0 100 ' + H + '" preserveAspectRatio="none">' +
      '<path d="' + route(shown) + '" fill="none" stroke="var(--surface-300)" stroke-width="16" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' +
      '<path d="' + route(shown) + '" fill="none" stroke="var(--surface-200)" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 16" vector-effect="non-scaling-stroke"/>' +
      (rd.reached ? '<path d="' + route(rd.reached) + '" fill="none" stroke="#3f78e0" stroke-width="16" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' : "") + "</svg>" }));
    pts.forEach(function (pt, i) {
      var st = AM.road.step(i), state = i < rd.reached ? "done" : i === rd.reached ? "next" : "locked", r = starts.indexOf(i);
      if (r > -1) {
        var name = REGIONS[i] !== undefined ? REGIONS[i] : "Day " + st.streak + " and on";
        map.appendChild(el("div.am-region", { "aria-hidden": "true", style: { top: (pt[1] - 100) + "px" } }, el("span", { style: { background: REG[r % REG.length] } }, name)));
      }
      var main = st.rewards[0].kind;
      var face = main === "certificate" ? icon("certificate", 30) : main === "shield" ? icon("shield", 30) : main === "flame" && AM.Flame ? AM.Flame(32, state !== "locked") : String(st.n);
      var rows = rewardRows(st), title = rows.length ? rows[0].label + (rows.length > 1 ? " and more" : "") : "Step " + st.n;
      map.appendChild(el("button.am-reset.am-rnode." + state, {
        type: "button", style: { left: pt[0] + "%", top: pt[1] + "px" },
        "aria-label": "Step " + st.n + ", " + title + ", " + (state === "done" ? "reached" : state === "next" ? "your next step" : "not reached yet"),
        onClick: function () { openSheet("Step " + st.n, detail(i)); }
      }, el("span.am-rnode-face", null, face),
        state === "next" ? null : el("span.am-rnode-badge", { "aria-hidden": "true" }, icon(state === "done" ? "check" : "lock", 14))));
      var onLeft = pt[0] > 50;
      map.appendChild(el("div.am-rlabel", { "aria-hidden": "true", style: onLeft
        ? { top: (pt[1] - 22) + "px", right: "calc(" + (100 - pt[0]) + "% + 46px)", textAlign: "right" }
        : { top: (pt[1] - 22) + "px", left: "calc(" + pt[0] + "% + 46px)" } },
        el("b", null, title), stepLabel(st)));
      if (state === "next") map.appendChild(el("div.am-you", { "aria-hidden": "true", style: { left: pt[0] + "%", top: pt[1] + "px" } },
        el("span", null, el("i", { html: AM.monogramSVG(AM.initialsOf(p.name, p.initials), p.colorKey, store.tier().tier) }), "You")));
    });
    return {
      nav: "road",
      banner: connectionBanner(),
      body: column([
        roadHead(app, "road"),
        el("p.body-sm", { style: { margin: 0, padding: "12px " + gutter() + "px 0", color: "var(--ink-600)", textWrap: "pretty" } },
          "Each step opens with a streak or with levels cleared, whichever comes first. What you earn stays yours."),
        el("div", { style: { padding: "0 " + gutter() + "px" } }, map),
        el("p.body-sm", { style: { margin: 0, padding: "4px " + gutter() + "px 0", color: "var(--ink-600)", textWrap: "pretty" } },
          "After 365 days: a streak shield at 400 days, at 500, and every 100 days after.")
      ], { paddingBottom: 24, maxWidth: 760 }),
      /* Open at the next step, not the top of the road. */
      after: function () {
        var b = document.querySelector(".am-slot-body"), n = map.querySelector(".am-rnode.next");
        if (b && n) b.scrollTop = Math.max(0, n.getBoundingClientRect().top - b.getBoundingClientRect().top + b.scrollTop - b.clientHeight * 0.62);
      }
    };
  };

  /* ---------- the practice reminder (app/reminder.js) ----------
     A daily event in the phone's own calendar, at an hour the learner
     picks. The app sends nothing; the reminder lives in the calendar. */
  /* A real link, opened from the tap, as phones require. */
  function openOut(url) {
    var a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
  }
  screens.reminder = function (app) {
    var R = AM.reminder, set = store.reminder();
    var view = app.scratch.reminderView || (app.scratch.reminderView = { hour: set ? set.hour : R.DEFAULT_HOUR, added: false });
    var apple = app.scratch.reminderApple !== undefined ? app.scratch.reminderApple : R.onApple();
    var online = store.isOnline();
    function leave() { var back = app.scratch.reminderBack || "profile"; app.scratch.reminderView = null; app.go(back, "back"); }
    function add() {
      if (!online) return;
      openOut(apple ? R.icsPath(view.hour) : R.googleLink(view.hour, store.today()));
      store.setReminder(view.hour);
      view.added = true;
      app.render();
    }
    var times = el("div.am-times", { role: "group", "aria-label": "Reminder time" }, R.HOURS.map(function (h) {
      var on = view.hour === h;
      return el("button.am-reset.am-pressable.am-time", {
        type: "button", "aria-pressed": on ? "true" : "false",
        onClick: function () { view.hour = h; view.added = false; app.render(); },
        style: {
          "--am-edge": on ? "var(--brand-blue-600)" : "var(--line-200)",
          background: on ? "var(--brand-blue-100)" : "var(--surface-200)", color: on ? "var(--brand-blue-600)" : "var(--ink-900)"
        }
      }, R.label(h));
    }));
    return {
      nav: null,
      back: leave,
      body: column([
        el("div", { style: { padding: "20px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: 8 } },
          el("div.heading-lg", null, "Practice reminder"),
          el("span.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } },
            "Pick a time. Your phone's calendar will remind you to practise every day.")),
        el("div", { style: { padding: "18px " + gutter() + "px 0" } }, times),
        view.added ? el("div", { style: { padding: "18px " + gutter() + "px 0" } },
          AM.Card({ style: { gap: 6 } },
            el("span.label", { style: { display: "inline-flex", alignItems: "center", gap: 6, color: "var(--success-700)" } }, icon("check", 18), "Added for " + R.label(view.hour) + "?"),
            el("span.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } },
              "If your calendar asked, say yes, and it will remind you every day. To change the time later, delete this reminder in your calendar, then add a new one here."))) : null,
        el("p.body-sm", { style: { margin: 0, padding: "18px " + gutter() + "px 0", color: "var(--ink-600)", textWrap: "pretty" } },
          "Abante Minds sends nothing and keeps nothing for this. The reminder lives in your calendar, and you can delete it there any time."),
        !online ? el("p.body-sm", { style: { margin: 0, padding: "10px " + gutter() + "px 0", color: "var(--danger-700)" } }, "Connect to the internet to add it.") : null,
        !apple ? el("div", { style: { padding: "6px " + gutter() + "px 0" } },
          el("button.am-reset.am-linkbtn.body-sm", { type: "button", style: { padding: "8px 0", textAlign: "left" },
            onClick: function () { if (online) openOut(R.icsPath(view.hour)); } }, "Using another calendar? Get the calendar file")) : null
      ], { paddingBottom: 24 }),
      footer: el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 24px", display: "flex", justifyContent: "center" } },
        el("div", { style: { width: "100%", maxWidth: 520 } },
          AM.Button({ label: apple ? "Add to Calendar" : "Add to Google Calendar", iconLeft: "clock", fullWidth: true, disabled: !online, onClick: add })))
    };
  };
  /* After a round, once: the offer of a reminder. */
  function reminderOffer(app, r) {
    if (r.reminderOffer === undefined) r.reminderOffer = !!AM.reminder && store.takeReminderOffer();
    if (!r.reminderOffer) return null;
    return el("div", { style: { padding: "18px " + gutter() + "px 0" } },
      AM.Card({ style: { gap: 10 } },
        el("span.label", { style: { display: "inline-flex", alignItems: "center", gap: 6 } }, icon("clock", 18), "A daily reminder?"),
        el("span.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } },
          "Your phone's calendar can remind you to practise each day, at a time you pick. Nothing is sent anywhere."),
        AM.Button({ label: "Set a reminder", variant: "ghost", fullWidth: true, onClick: function () { app.scratch.reminderBack = "summary"; app.go("reminder"); } })));
  }

  screens.profile = function (app) {
    var s = store.get();
    var p = s.profile || { name: "", school: "", colorKey: 2 };
    var path = store.path();
    var written = path.topics.filter(function (t) { return t.ready; });
    var readiness = store.readiness();

    function stat(value, label) {
      return el("div", {
        style: {
          flex: 1, background: "var(--surface-200)", borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-card)", padding: "var(--space-3)", textAlign: "center"
        }
      }, el("div.heading-md", null, String(value)), el("div.caption", { style: { color: "var(--ink-600)" } }, label));
    }

    return {
      nav: "profile",
      banner: connectionBanner(),
      body: column([
        el("div", { style: { padding: "20px " + gutter() + "px 0" } },
          AM.ProfileCard({
            name: p.name, greeting: "",
            school: (p.school ? p.school + " · " : "") + "Grade 6 · " + path.levelsCleared + " level" + (path.levelsCleared === 1 ? "" : "s") + " cleared",
            colorKey: p.colorKey, frame: p.frame || store.tier().tier.key, pattern: p.pattern,
            initials: p.initials, title: p.title, motto: p.motto,
            style: { maxWidth: "none", width: "100%" }
          })),
        tierSection(app),

        el("div", { style: { padding: "16px " + gutter() + "px 0", display: "flex", gap: 10 } },
          stat(s.streakDays, "days in a row"), stat(s.totalCorrect, "right first time"),
          store.basics().length ? stat(store.basics().reduce(function (n, t) { return n + t.mastered; }, 0), "facts mastered") : null),

        (function () {
          var cat = store.catalog(), shown = store.showcase();
          return el("div", { style: { padding: "18px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-2)" } },
            sectionLabel("Badges · " + cat.earned + " of " + cat.total),
            AM.Card({ style: { gap: 10 } },
              shown.length
                ? el("div", { style: { display: "flex", justifyContent: "space-around", alignItems: "flex-end" } },
                    shown.map(function (k) { return badgeButton(store.findBadge(k, cat), 64); }))
                : el("span.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } }, "Every level you clear is a badge. Clear one to earn your first."),
              AM.Button({ label: "See all badges", variant: "ghost", fullWidth: true, onClick: function () { app.scratch.badgesBack = null; app.go("badges"); } })));
        })(),

        roadSection(app),

        el("div", { style: { padding: "16px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-3)" } },
          sectionLabel("Progress by topic"),
          readiness.started ? el("span.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } },
            (readiness.percent ? "About " + readiness.percent + "% ready for the exam." : "Just getting started.") + " This is an estimate from your answers and the levels you have cleared, not the real exam.") : null,
          AM.TopicBars(written.map(function (t) {
            var band = readiness.topics.filter(function (x) { return x.key === t.key; })[0];
            return { label: t.label, correct: t.cleared, total: t.total, caption: t.cleared + " of " + t.total + " levels" + (band && band.started ? " · " + band.band : ""), color: "var(--skill-" + t.colorKey + "-bright)" };
          })),
          path.topics.length > written.length
            ? el("span.body-sm", { style: { color: "var(--ink-600)" } }, (path.topics.length - written.length) + " more topic" + (path.topics.length - written.length === 1 ? "" : "s") + " coming")
            : null),

        /* The same sums in different stories: which stories come easily. First
           tries on the path and in practice exams, the most recent ones. */
        (function () {
          var kinds = AM.insights.summarize(store.attempts(), problemType);
          return el("div", { style: { padding: "16px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-3)" } },
            sectionLabel("Kinds of problem"),
            kinds.types.length ? AM.TopicBars(kinds.types.map(function (t) {
              return { label: t.name, correct: t.right, total: t.asked, caption: t.right + " of " + t.asked, color: "var(--brand-blue-600)" };
            })) : null,
            el("span.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } }, kindsNote(kinds)));
        })(),

        /* Sound, vibration, calm and the theme, for this phone. */
        (function () {
          var set = store.settings();
          function change(name) { return function (v) { store.setSetting(name, v); app.keepScroll = true; app.render(); }; }
          return el("div", { style: { padding: "16px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-2)" } },
            sectionLabel("Settings"),
            AM.Card({ style: { gap: 0, paddingTop: 4, paddingBottom: 4 } },
              AM.Toggle({ label: "Sound", sub: "Gong-chimes for answers, streaks and levels. A phone on silent stays silent.", on: set.sound, onChange: change("sound") }),
              AM.Toggle({ label: "Vibration", sub: "A short buzz with answers and level-ups, on phones that can.", on: set.vibration, onChange: change("vibration") }),
              AM.Toggle({ label: "Calm animations", sub: "Celebrations show their end straight away, with no confetti or movement.", on: set.calm, onChange: change("calm") }),
              AM.Segmented({
                label: "Theme", sub: "Auto follows your phone's light or dark setting.", value: set.theme, onChange: change("theme"),
                options: [{ value: "auto", label: "Auto" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }]
              })));
        })(),

        /* The practice reminder, in the phone's own calendar. */
        AM.reminder ? (function () {
          var rem = store.reminder();
          return el("div", { style: { padding: "16px " + gutter() + "px 0" } },
            AM.Card({ style: { gap: 10 } },
              el("span", { style: { display: "flex", flexDirection: "column", gap: 2 } },
                el("span.label", null, "Practice reminder"),
                el("span.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } },
                  rem ? "Added for " + AM.reminder.label(rem.hour) + ", in your calendar." : "Your phone's calendar can remind you to practise each day.")),
              AM.Button({ label: rem ? "Change the time" : "Set a reminder", variant: "ghost", iconLeft: "clock", fullWidth: true,
                onClick: function () { app.scratch.reminderBack = "profile"; app.go("reminder"); } })));
        })() : null,

        /* One button, no card: it fits the space Profile had spare on a
           390x844 phone, so the footer and nav stay on screen. */
        app.canOfferInstall()
          ? el("div", { style: { padding: "18px " + gutter() + "px 0" } },
              AM.Button({ label: "Add to home screen", variant: "ghost", iconLeft: "home", fullWidth: true, onClick: function () { app.offerInstall(); } }))
          : null
      ], { paddingBottom: 24 }),
      footer: el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 20px", display: "flex", justifyContent: "center" } },
        el("div", { style: { width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 10 } },
          AM.Button({ label: "Edit my card", variant: "ghost", fullWidth: true, onClick: function () { app.go("setup"); } })))
    };
  };

  AM.screens = screens;
})();
