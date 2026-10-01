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
    return el("span", null,
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

  /* ---------- 1 · Splash with install hint ---------- */
  screens.splash = function (app) {
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
          flex: "none", margin: "0 " + gutter() + "px 28px", background: "var(--surface-200)",
          borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)", padding: "var(--space-4)",
          display: "flex", flexDirection: "column", gap: "var(--space-3)"
        }
      },
        el("div.body", { style: { textWrap: "pretty" } }, "Add Abante Minds to your home screen. It keeps working when there is no signal."),
        AM.Button({
          label: "Add to home screen", fullWidth: true,
          onClick: function () {
            app.install(function () {
              store.set({ installed: true });
              app.go("signin");
            });
          }
        }),
        AM.Button({ label: "Not now", variant: "ghost", fullWidth: true, onClick: function () { app.go("signin"); } })
      )
    };
  };

  /* ---------- 2 · PIN login ---------- */
  screens.signin = function (app) {
    var s = store.get();
    var pin = app.scratch.pin || "";
    var username = (s.profile && s.profile.username) || "ligaya.m";

    function setPin(next) { app.scratch.pin = next; app.render(); }

    var dots = el("div", { style: { display: "flex", gap: 10 } });
    for (var i = 0; i < 4; i++) {
      var filled = i < pin.length;
      var active = i === pin.length;
      dots.appendChild(el("div", {
        style: {
          flex: 1, height: 56,
          border: "2px solid " + (active ? "var(--brand-blue-600)" : "var(--line-200)"),
          borderRadius: "var(--radius-sm)", background: "var(--surface-200)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }
      }, filled
        ? el("span", { style: { width: 12, height: 12, borderRadius: "50%", background: "var(--ink-900)" } })
        : (active ? el("span.am-caret", { style: { width: 2, height: 24, background: "var(--brand-blue-600)" } }) : null)));
    }

    /* The sign-in keypad has no decimal point, so the 0 row leaves a gap where
       the dot would sit on the practice keypad. */
    var keys = el("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "var(--space-2)" } });
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "Delete"].forEach(function (k) {
      if (k === "") { keys.appendChild(el("div", { style: { height: 54 } })); return; }
      var isDelete = k === "Delete";
      keys.appendChild(el("button.am-reset.am-pressable" + (isDelete ? ".label" : ".heading-md"), {
        type: "button",
        "aria-label": isDelete ? "Delete last digit" : k,
        onClick: function () {
          if (isDelete) setPin(pin.slice(0, -1));
          else if (pin.length < 4) setPin(pin + k);
        },
        style: {
          "--am-edge": "var(--line-200)", background: "var(--surface-200)",
          color: isDelete ? "var(--ink-600)" : "var(--ink-900)",
          borderRadius: "var(--radius-sm)", height: 54,
          display: "flex", alignItems: "center", justifyContent: "center"
        }
      }, k));
    });

    return {
      nav: null,
      body: el("div", { style: { flex: "none", padding: "20px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-2)" } },
        el("div.heading-md", null, "Sign in"),
        el("div.caption", { style: { color: "var(--ink-600)", marginTop: 6 } }, "Username"),
        el("div", { style: { height: 52, border: "2px solid var(--line-200)", borderRadius: "var(--radius-sm)", background: "var(--surface-200)", display: "flex", alignItems: "center", padding: "0 14px" } },
          el("span.body-lg", null, username)),
        el("div.caption", { style: { color: "var(--ink-600)", marginTop: "var(--space-2)" } }, "Enter your PIN"),
        dots,
        el("div", { style: { paddingTop: 10 } },
          el("a.body-sm", { href: "#", onClick: function (e) { e.preventDefault(); app.go("recover"); } }, "Forgot your PIN?"))
      ),
      footer: el("div", { style: { flex: "none", display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "0 " + gutter() + "px 24px" } },
        keys,
        AM.Button({
          label: "Sign in", fullWidth: true, disabled: pin.length < 4,
          onClick: function () {
            app.scratch.pin = "";
            store.set({ signedIn: true });
            app.go(store.get().profile ? "home" : "setup");
          }
        })
      )
    };
  };

  /* ---------- 3 · PIN recovery, learner side ---------- */
  screens.recover = function (app) {
    function step(n, text) {
      return el("span", {
        style: {
          display: "flex", gap: "var(--space-3)", alignItems: "center",
          background: "var(--surface-200)", borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-card)", padding: 14
        }
      },
        el("span.label", {
          style: {
            width: 28, height: 28, flex: "none", borderRadius: "50%",
            background: "var(--brand-blue-100)", color: "var(--brand-blue-600)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }
        }, String(n)),
        el("span.body", { style: { flex: 1 } }, text)
      );
    }

    return {
      nav: null,
      back: function () { app.go("signin", "back"); },
      body: el("div", { style: { display: "flex", flexDirection: "column" } },
        el("div", { style: { flex: "none", padding: "20px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-3)" } },
          el("div.heading-md", null, "Forgot your PIN"),
          el("div.body", { style: { textWrap: "pretty" } },
            "Ask your adviser to reset it. This phone will send them a request — you do not need signal right now."),
          el("div", {
            style: {
              background: "var(--surface-200)", borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-card)", padding: "var(--space-4)",
              display: "flex", alignItems: "center", gap: 14
            }
          },
            el("span", {
              style: {
                width: 48, height: 48, flex: "none", borderRadius: "var(--radius-md)",
                background: "var(--skill-2-600)", color: "var(--ink-inverse)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }
            }, icon("profile", 24)),
            el("span", null,
              el("span.heading-sm", { style: { display: "block" } }, "Mr. Dela Cruz"),
              el("span.body-sm", { style: { color: "var(--ink-600)" } }, "Adviser · Poblacion NHS"))
          ),
          el("div", { style: { display: "flex", flexDirection: "column", gap: 10, marginTop: "var(--space-2)" } },
            sectionLabel("What happens next"),
            step(1, "The request leaves this phone the next time it has signal."),
            step(2, "Mr. Dela Cruz gives you a new four-digit PIN."),
            step(3, "You sign in with it. Your tier and streak are untouched.")
          )
        )
      ),
      footer: el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 24px", display: "flex", flexDirection: "column", gap: 10 } },
        AM.Button({
          label: "Ask adviser to reset it", fullWidth: true,
          onClick: function () { store.set({ recoveryRequested: true }); app.go("recoverSent"); }
        }),
        AM.Button({ label: "Back to sign in", variant: "ghost", fullWidth: true, onClick: function () { app.go("signin", "back"); } })
      )
    };
  };

  /* ---------- 3b · Request sent ----------
     The confirmation is a screen, not a toast: nothing is queued invisibly. */
  screens.recoverSent = function (app) {
    return {
      nav: null,
      body: el("div", {
        style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-4)", padding: "32px 28px" }
      },
        el("span", {
          dataset: { amBadge: "" },
          style: {
            width: 72, height: 72, borderRadius: "50%", background: "var(--success-100)",
            color: "var(--success-700)", display: "flex", alignItems: "center", justifyContent: "center"
          }
        }, icon("check", 36, { glyph: true })),
        el("div.heading-md", null, "Request sent"),
        el("div.body", { style: { color: "var(--ink-600)", textAlign: "center", textWrap: "pretty" } },
          "Mr. Dela Cruz has your request. Ask him for the new PIN, then sign in with it.")
      ),
      footer: el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 28px" } },
        AM.Button({ label: "Back to sign in", fullWidth: true, onClick: function () { app.go("signin", "back"); } }))
    };
  };

  /* ---------- 4 · First-run profile setup ----------
     Skill hues do the colour-picking work; the chosen swatch takes an ink-900
     edge rather than a tick. */
  screens.setup = function (app) {
    var draft = app.scratch.setup || (app.scratch.setup = {
      name: "Ligaya Mendoza", school: "Poblacion, Pilar", colorKey: 1, iconKey: "triangle"
    });

    function field(labelText, key) {
      return [
        el("div.caption", { style: { color: "var(--ink-600)", marginTop: "var(--space-2)" } }, labelText),
        el("input.body-lg.am-input", {
          type: "text", value: draft[key], "aria-label": labelText,
          oninput: function (e) { draft[key] = e.target.value; },
          onchange: function () { app.render(); }
        })
      ];
    }

    var swatches = el("div", { style: { display: "flex", gap: "var(--space-3)" } });
    [1, 2, 3, 4].forEach(function (k) {
      var on = draft.colorKey === k;
      swatches.appendChild(el("button.am-reset.am-pressable", {
        type: "button",
        "aria-label": "Colour " + k, "aria-pressed": on ? "true" : "false",
        onClick: function () { draft.colorKey = k; app.render(); },
        style: {
          "--am-edge": on ? "var(--ink-900)" : "var(--skill-" + k + "-600)",
          width: 56, height: 56, borderRadius: "50%",
          background: on ? "var(--skill-" + k + "-600)" : "var(--skill-" + k + "-100)",
          display: "block", padding: 0
        }
      }));
    });

    var glyphs = el("div", { style: { display: "flex", gap: "var(--space-3)" } });
    ["star", "triangle", "scales", "coins"].forEach(function (g) {
      var on = draft.iconKey === g;
      glyphs.appendChild(el("button.am-reset.am-pressable", {
        type: "button",
        "aria-label": g, "aria-pressed": on ? "true" : "false",
        onClick: function () { draft.iconKey = g; app.render(); },
        style: {
          "--am-edge": on ? "var(--ink-900)" : "var(--line-200)",
          width: 56, height: 56, borderRadius: "var(--radius-sm)",
          background: on ? "var(--brand-blue-100)" : "var(--surface-200)",
          color: on ? "var(--brand-blue-600)" : "var(--ink-600)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }
      }, icon(g, 24)));
    });

    return {
      nav: null,
      body: el("div", { style: { flex: "none", padding: "20px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-2)" } },
        el("div.heading-md", null, "Set up your profile"),
        el("div.body-sm", { style: { color: "var(--ink-600)" } }, "This stays on the phone. You can change it later."),
        field("Your name", "name"),
        field("School or barangay", "school"),
        el("div.caption", { style: { color: "var(--ink-600)", marginTop: "var(--space-3)" } }, "Pick a colour"),
        swatches,
        el("div.caption", { style: { color: "var(--ink-600)", marginTop: "var(--space-3)" } }, "Pick an icon"),
        glyphs,
        el("div.caption", { style: { color: "var(--ink-600)", marginTop: "var(--space-3)" } }, "This is how your card will look"),
        AM.ProfileCard({
          name: draft.name, school: draft.school, colorKey: draft.colorKey,
          iconKey: draft.iconKey, style: { maxWidth: "none", width: "100%" }
        })
      ),
      footer: el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 24px" } },
        AM.Button({
          label: "Create profile", fullWidth: true,
          onClick: function () {
            store.set({
              profile: {
                name: draft.name || "Ligaya Mendoza",
                school: draft.school || "Poblacion, Pilar",
                colorKey: draft.colorKey, iconKey: draft.iconKey,
                username: (draft.name || "ligaya").toLowerCase().split(" ")[0] + ".m"
              },
              signedIn: true
            });
            app.scratch.setup = null;
            app.go("home");
          }
        }))
    };
  };

  /* ---------- 5 / 6 / 17 / 19 · Home ----------
     First run and returning are the same screen at two states; the offline and
     sync strips are the same screen with a banner. */
  screens.home = function (app) {
    var s = store.get();
    var first = !store.hasProgress();
    var topics = store.topicList();
    var tierRatio = s.tierProgress / store.TIER_TARGET;
    var remaining = store.TIER_TARGET - s.tierProgress;
    var lastTopic = s.lastTopic ? C.byKey(s.lastTopic) : null;
    var desktop = AM.device() === "desktop";

    var headline = first
      ? el("div", { style: { padding: "24px " + gutter() + "px 0" } },
          el("div.heading-lg", null, "Hello, " + ((s.profile && s.profile.name.split(" ")[0]) || "there")),
          el("div.body-sm", { style: { color: "var(--ink-600)", marginTop: 4 } }, "Grade 6 · NCE math practice"))
      : el("div", {
          style: { padding: "24px " + gutter() + "px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-3)" }
        },
          greetingBlock(s, "Back for day " + s.streakDays),
          desktop ? null : AM.Chip({ icon: "streak", label: String(s.streakDays), large: true })
        );

    /* The progress card. On desktop the actions move inside it — there is no
       thumb at the bottom of a desktop screen. */
    var progressCard = first
      ? AM.Card({ style: { gap: 10 } },
          el("div.heading-sm", null, "Nothing attempted yet"),
          el("div.body", { style: { textWrap: "pretty" } }, "Start with 10 questions on change and money. About eight minutes."),
          el("div", { style: { display: "flex", alignItems: "center", gap: "var(--space-3)", marginTop: 4 } },
            AM.Chip({ label: "Tier 1" }),
            AM.ProgressBar({ ratio: 0, flex: true, label: "Tier 1 progress" }),
            el("span.caption", { style: { color: "var(--ink-600)", whiteSpace: "nowrap" } }, "0 of " + store.TIER_TARGET))
        )
      : AM.Card({ style: { gap: 10 } },
          el("span", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-2)" } },
            el("span.heading-sm", null, "Tier " + s.tier),
            el("span.caption", { style: { color: "var(--ink-600)" } },
              s.tier < 4 ? s.tierProgress + " of " + store.TIER_TARGET + " to tier " + (s.tier + 1)
                         : s.tierProgress + " of " + store.TIER_TARGET)),
          AM.ProgressBar({ ratio: tierRatio, height: 10, label: "Tier " + s.tier + " progress" }),
          el("span.body", { style: { color: "var(--ink-600)", textWrap: "pretty" } },
            !store.isOnline()
              ? "All four topics are downloaded. 60 questions ready without signal."
              : s.lastSession
                ? "Last session: " + s.lastSession.topicLabel.toLowerCase() + ", " + s.lastSession.correct + " of " + s.lastSession.attempted + " correct."
                : "Pick up where you left off."),
          desktop ? el("span", { style: { display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)", flexWrap: "wrap" } },
            AM.Button({ label: continueLabel(lastTopic), onClick: function () { app.startPractice(s.lastTopic); } }),
            AM.Button({ label: "Pick another topic", variant: "ghost", onClick: function () { app.go("topics"); } })
          ) : null
        );

    var ladderCard = el("div", { style: { display: "flex", flexDirection: "column", gap: "var(--space-2)" } },
      sectionLabel("Tier ladder"),
      AM.TierLadder({ current: s.tier, lockedBackground: desktop || AM.device() === "tablet" ? "var(--surface-100)" : "var(--surface-200)" }),
      el("span.body-sm", { style: { color: "var(--ink-600)" } },
        first ? "Twenty correct on tier 1 opens tier 2."
              : !store.isOnline() ? "Tiers move whether or not there is signal."
              : s.tier < 4 ? remaining + " more correct opens tier " + (s.tier + 1) + "."
              : "Every tier is open.")
    );

    var streakBlock = (first || desktop) ? null : el("div", { style: { display: "flex", flexDirection: "column", gap: "var(--space-2)" } },
      sectionLabel(s.streakDays + " day" + (s.streakDays === 1 ? "" : "s") + " in a row"),
      AM.StreakWeek({ days: s.streakDays, resetToday: s.resetToday, height: AM.device() === "phone" ? 38 : 48 })
    );

    var topicCard = (first || AM.device() === "phone") ? null : AM.Card({ style: { padding: "var(--space-6)", gap: 14 } },
      sectionLabel("Progress by topic"),
      AM.TopicBars(topics, { height: 10 })
    );

    var badgeCard = (first || AM.device() === "phone") ? null : AM.Card({ style: { padding: "var(--space-6)", gap: "var(--space-3)" } },
      sectionLabel("Badges · " + store.badges().filter(function (b) { return b.earned; }).length + " of 4"),
      AM.BadgeShelf({ badges: store.badges(), lockedBackground: "var(--surface-100)" }),
      el("span.body-sm", { style: { color: "var(--ink-600)" } }, "Tier 3 unlocks the badge and longer questions.")
    );

    /* Tablet and desktop spend the extra width on a second card rather than on
       longer lines. */
    var cards = AM.device() === "phone"
      ? el("div", { style: { display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "0 " + gutter() + "px" } },
          progressCard, ladderCard, streakBlock)
      : el("div", { style: { display: "flex", flexDirection: "column", gap: desktop ? 32 : 24, padding: "0 " + gutter() + "px" } },
          el("div.am-pair", null, progressCard, AM.Card({ style: { padding: "var(--space-6)", gap: "var(--space-3)" } }, ladderCard)),
          streakBlock,
          el("div.am-pair", null, topicCard, badgeCard));

    var footer = (desktop) ? null : el("div", {
      style: { flex: "none", padding: "0 " + gutter() + "px 20px", display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }
    }, el("div", { style: { width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 10 } },
        first
          ? AM.Button({ label: "Start practicing", fullWidth: true, onClick: function () { app.go("topics"); } })
          : AM.Button({ label: continueLabel(lastTopic), fullWidth: true, onClick: function () { app.startPractice(s.lastTopic); } }),
        first ? null : AM.Button({ label: "Pick another topic", variant: "ghost", fullWidth: true, onClick: function () { app.go("topics"); } })
      ));

    return {
      nav: "home",
      banner: connectionBanner(),
      railFooter: el("span.am-rail-note", {
        style: { background: "var(--brand-blue-100)", color: "var(--brand-blue-600)" }
      }, icon("streak", 22), el("span.label", { style: { color: "var(--ink-900)" } },
        s.streakDays + " day" + (s.streakDays === 1 ? "" : "s") + " in a row")),
      body: column([headline, el("div", { style: { height: first ? 20 : 20 } }), cards], { gap: 0, paddingBottom: 24 }),
      footer: footer
    };
  };

  function continueLabel(topic) {
    return topic ? "Continue " + topic.label.toLowerCase() : "Start practicing";
  }

  /* ---------- 7 / 8 · Topic picker ----------
     Nothing picked yet, so the action is drawn already-pressed and flat —
     shape says "not now" before colour does. */
  screens.topics = function (app) {
    var s = store.get();
    var first = !store.hasProgress();
    var picked = app.scratch.pickedTopic || (first ? null : s.lastTopic);
    var topics = store.topicList();

    var grid = el("div", {
      style: {
        display: "grid", gridTemplateColumns: "148px 148px", gap: "14px 12px",
        justifyContent: "center", padding: "18px " + gutter() + "px 0"
      }
    });

    topics.forEach(function (t) {
      /* Three stars, one per third of the twenty, rounded to the nearest — the
         levels the design document prints: 0 of 20 none, 5 one, 12 two, 18 all
         three. */
      var litCount = Math.round((t.correct / t.total) * 3);
      var stars = el("span", { style: { display: "flex", gap: "var(--space-1)" } });
      for (var i = 0; i < 3; i++) {
        var lit = i < litCount;
        stars.appendChild(el("span", { style: { color: lit ? "var(--skill-" + t.colorKey + "-600)" : "var(--surface-300)" } }, icon("star", 15)));
      }
      var isPicked = picked === t.key;
      grid.appendChild(el("span", { style: { display: "flex", flexDirection: "column", gap: "var(--space-1)" } },
        AM.SkillCard({
          label: t.label, icon: t.icon, colorKey: t.colorKey, progress: t.ratio,
          selected: isPicked,
          onClick: function () { app.scratch.pickedTopic = t.key; app.render(); }
        }),
        stars,
        el("span.caption", { style: { color: isPicked ? "var(--brand-blue-600)" : "var(--ink-600)" } },
          t.correct + " of " + t.total + (isPicked ? " · picked" : (t.correct === 0 && !first ? " · not started" : "")))
      ));
    });

    var pickedTopic = picked ? C.byKey(picked) : null;

    return {
      nav: "practice", bottomNav: false,
      banner: connectionBanner(),
      back: function () { app.go("home", "back"); },
      body: column([
        el("div", { style: { padding: "20px " + gutter() + "px 0" } },
          el("div.heading-md", null, "Pick a topic"),
          el("div.body-sm", { style: { color: "var(--ink-600)", marginTop: 4 } },
            first ? "Four topics. Twenty questions each."
                  : (pickedTopic ? pickedTopic.label + " is where you left off." : "Four topics. Twenty questions each."))),
        grid
      ]),
      footer: el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 24px", display: "flex", justifyContent: "center" } },
        el("div", { style: { width: "100%", maxWidth: 520 } },
          AM.Button({
            label: pickedTopic ? continueLabel(pickedTopic) : "Start practicing",
            fullWidth: true, disabled: !picked,
            onClick: function () { app.scratch.pickedTopic = null; app.startPractice(picked); }
          })))
    };
  };

  /* ---------- 9–13, 15, 18 · Practice ----------
     One screen. Question text gets the most room at every width; correct and
     wrong each carry a glyph, never a fill alone. */
  screens.practice = function (app) {
    var s = store.get();
    var ses = app.session;
    if (!ses) { app.go("home"); return screens.home(app); }

    var q = ses.questions[ses.index];
    var desktop = AM.device() === "desktop";
    var offline = !store.isOnline();
    var tierLabel = (offline ? "Offline · tier " : "Tier ") + s.tier;

    var header = AM.PracticeHeader({
      tier: tierLabel, questionIndex: ses.index, questionTotal: ses.questions.length
    });

    /* ----- the demote notice (15). Calm, not punishing: a card in the ordinary
       layout, and the next question is already there. ----- */
    var demoteCard = (s.demoted && !ses.demoteSeen) ? el("div", { style: { padding: "18px " + gutter() + "px 0" } },
      AM.Card({ style: { flexDirection: "row", gap: "var(--space-3)", alignItems: "flex-start" } },
        el("span", {
          style: {
            width: 36, height: 36, flex: "none", borderRadius: "var(--radius-sm)",
            background: "var(--brand-blue-100)", color: "var(--brand-blue-600)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }
        }, icon("streak", 20)),
        el("span", null,
          el("span.heading-sm", { style: { display: "block" } }, "Back to tier " + s.tier),
          el("span.body", { style: { color: "var(--ink-600)", textWrap: "pretty" } },
            "Your streak reset. " + store.RECOVERY_RUN + " correct in a row puts you back on tier " + (s.tier + 1) + "."))
      )) : null;

    /* ----- question text ----- */
    var answered = ses.phase !== "ask";
    var promptNode = answered
      ? el("div", { style: { padding: "20px " + gutter() + "px 0" } },
          el("div.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } }, q.prompt))
      : el("div", { style: { padding: "24px " + gutter() + "px 0" } },
          el(desktop ? "div.heading-lg" : "div.body-lg", {
            style: desktop ? { textWrap: "pretty" } : { fontWeight: 500, textWrap: "pretty" }
          }, q.prompt));

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
            text: label, state: state, tall: true, disabled: answered,
            onClick: function () { if (!answered) { ses.picked = i; app.render(); } }
          }));
        });
        return grid;
      }
      return el("div", { style: { padding: "20px " + gutter() + "px 0" } },
        AM.AnswerField({ value: ses.typed, prefix: q.unit, active: ses.typed.length > 0, tall: desktop }));
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
          list.appendChild(AM.Card({ style: { flexDirection: "row", gap: "var(--space-3)", alignItems: "flex-start", padding: 14 } },
            el("span", { style: { color: "var(--brand-blue-600)", flex: "none" } }, icon("hint", 22)),
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
             el("span.body-sm", null, "Hint " + (i + 1) + " · " + (desktop ? "click" : "tap") + " to reveal")));
        }
      });
      wrap.appendChild(list);
      return wrap;
    }

    /* ----- verdict (11 / 12) ----- */
    function verdict() {
      if (ses.phase === "ask") return null;
      var right = ses.phase === "correct";
      var given = q.type === "choice" ? q.choices[ses.picked] : (q.unit || "") + (ses.typed || "0");
      return el("div", { style: { padding: "16px " + gutter() + "px 0" } },
        el("div", {
          style: {
            border: "2px solid " + (right ? "var(--success-700)" : "var(--danger-700)"),
            background: right ? "var(--success-100)" : "var(--danger-100)",
            borderRadius: "var(--radius-md)", padding: "var(--space-4)",
            display: "flex", alignItems: "center", gap: 14
          }
        },
          el("span", {
            style: {
              width: 44, height: 44, flex: "none", borderRadius: "50%", background: "var(--surface-200)",
              color: right ? "var(--success-700)" : "var(--danger-700)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }
          }, icon(right ? "check" : "x", 24, { glyph: true })),
          el("span", null,
            el("span.heading-md", { style: { display: "block" } }, given),
            el("span.label", { style: { color: right ? "var(--success-700)" : "var(--danger-700)" } }, right ? "Tama" : "Not yet"))
        ));
    }

    /* Correct explains how it works; wrong names the specific mistake and
       reveals one worked step, with the rest still locked. */
    function explanation() {
      if (ses.phase === "correct") {
        return el("div", { style: { padding: "18px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-2)" } },
          sectionLabel("How it works"),
          el("span.body-lg", null, q.explain));
      }
      if (ses.phase === "wrong") {
        var block = el("div", { style: { padding: "16px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-3)" } },
          el("div.body", { style: { textWrap: "pretty" } }, q.missExplain),
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

    /* The streak is stated, not celebrated — gold stays out of practice. */
    function streakChip() {
      if (ses.phase !== "correct" || ses.run < 2) return null;
      return el("div", { style: { padding: "18px " + gutter() + "px 0", display: "flex" } },
        AM.Chip({ icon: "streak", label: ses.run + " in a row", large: true }));
    }

    function tierStrip() {
      if (s.tier >= 4) return null;
      var remaining = store.TIER_TARGET - s.tierProgress;
      return el("div", {
        style: {
          flex: "none", margin: "0 " + gutter() + "px 16px", background: "var(--surface-200)",
          borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)",
          padding: "12px var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-3)"
        }
      },
        el("span", { style: { flex: "none", color: "var(--brand-blue-600)" } }, icon("level-up", 20)),
        el("span", { style: { flex: 1, display: "flex", flexDirection: "column", gap: 6 } },
          el("span.caption", { style: { color: "var(--ink-600)" } },
            "Tier " + (s.tier + 1) + " in " + remaining + " correct" + (offline ? " · counts offline" : "")),
          AM.ProgressBar({ ratio: s.tierProgress / store.TIER_TARGET, flex: true, label: "Tier progress" })),
        el("span.body-sm", { style: { flex: "none", color: "var(--ink-600)" } },
          s.tierProgress + " of " + store.TIER_TARGET));
    }

    /* ----- actions ----- */
    function checkButton() {
      return AM.Button({
        label: "Check", fullWidth: !desktop,
        disabled: q.type === "choice" ? ses.picked === null : ses.typed.length === 0,
        onClick: function () { app.check(); }
      });
    }
    /* Revealing is one way: the list becomes the control, and the button does
       not come back. Revealing costs nothing but is visibly counted. */
    function hintButton() {
      return AM.Button({
        label: "Show a hint", variant: "ghost", fullWidth: false,
        onClick: function () {
          ses.showHints = true;
          if (ses.hintsRevealed === 0) ses.hintsRevealed = 1;
          app.render();
        }
      });
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
        el("span", { style: { flex: "none", color: "var(--brand-blue-600)" } }, icon("hint", 20)),
        el("span.body-sm", { style: { flex: 1, color: "var(--ink-600)" } },
          "Hints used this session: " + ses.hintsRevealed + " of " + q.hints.length + ". Using them all still counts the question."));
    }

    var actions;
    if (ses.phase === "ask") {
      actions = desktop ? null : el("div", { style: { flex: "none", padding: "16px " + gutter() + "px 20px" } }, checkButton());
    } else if (ses.phase === "correct") {
      actions = el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 24px" } },
        AM.Button({
          label: ses.index + 1 >= ses.questions.length ? "Finish session" : "Next question",
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
      ? AM.Keypad({ tall: desktop, onPress: function (d) { app.type(d); }, onDelete: function () { app.backspace(); } })
      : null;

    if (desktop) {
      var left = el("div", { style: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "var(--space-4)" } });
      if (q.type === "compute") {
        left.appendChild(AM.AnswerField({ value: ses.typed, prefix: q.unit, active: ses.typed.length > 0, tall: true }));
        if (ses.phase === "ask") left.appendChild(el("div.body-sm", { style: { color: "var(--ink-600)" } }, "Type on the keyboard or use the keypad."));
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
          q.type === "choice" ? answerArea() : null,
          row,
          verdict(), explanation(), streakChip(),
          hintPanel(),
          tierStrip()
        ));

      return {
        nav: "practice", bottomNav: false, header: header, banner: null,
        railFooter: el("span.am-rail-note", { style: { background: "var(--surface-100)", color: "var(--ink-600)" } },
          icon("clock", 22), el("span.label", { style: { color: "var(--ink-900)" } }, minutesLabel(ses))),
        body: deskBody,
        footer: (ses.phase === "ask") ? null : el("div", { style: { display: "flex", justifyContent: "center", padding: "0 " + gutter() + "px 24px" } },
          el("div", { style: { width: "100%", maxWidth: 520 } }, actions))
      };
    }

    return {
      nav: "practice", bottomNav: false,
      header: header,
      banner: null,
      /* Screen 13 moves the answer field below the scaffold once a hint is
         open, so the worked step and the box you type into read in order. */
      body: column([
        demoteCard,
        promptNode,
        (ses.phase === "ask" && !ses.showHints) ? answerArea() : null,
        (ses.phase === "ask" && !ses.showHints)
          ? el("div", { style: { padding: "12px " + gutter() + "px 0", display: "flex" } }, hintButton())
          : null,
        hintPanel(),
        (ses.phase === "ask" && ses.showHints) ? answerArea() : null,
        verdict(),
        explanation(),
        streakChip()
      ]),
      belowFold: el("div", null,
        hintsUsedCard(),
        keypadNode ? el("div", { style: { padding: "0 " + gutter() + "px" } }, keypadNode) : tierStrip()),
      footer: actions
    };
  };

  function minutesLabel(ses) {
    var mins = Math.max(1, Math.round((Date.now() - ses.startedAt) / 60000));
    return mins + " minute" + (mins === 1 ? "" : "s") + " today";
  }

  /* ---------- 14 · Tier up ----------
     No header, no nav, one action. The only gold field in the product; the
     button inverts to a white face because amber and gold never share a screen. */
  screens.tierup = function (app) {
    var s = store.get();
    var topicLabel = app.session ? app.session.topicLabel : "practice";

    var ladder = el("div", { style: { padding: "24px " + gutter() + "px 0", display: "flex", gap: "var(--space-2)", alignItems: "stretch" } });
    [1, 2, 3, 4].forEach(function (n) {
      var cleared = n < s.tier, here = n === s.tier;
      var style = {
        flex: 1, background: "var(--surface-200)", borderRadius: "var(--radius-md)",
        padding: here ? "10px 8px" : "12px 8px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        color: cleared ? "var(--success-700)" : here ? "var(--celebration-coral-600)" : "var(--ink-600)"
      };
      if (here) style.border = "2px solid var(--ink-900)";
      ladder.appendChild(el("span", { style: style },
        icon(cleared ? "check" : here ? "trophy" : "lock", 20),
        el(here ? "span.label" : "span.caption", { style: { color: here ? "var(--ink-900)" : (cleared ? "var(--ink-900)" : "var(--ink-600)") } }, "Tier " + n)));
    });

    return {
      nav: null, onGold: true, chrome: false,
      body: el("div.am-celebrate", {
        style: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 0 }
      },
        AM.CelebrationBanner({
          headline: "Tier " + s.tier,
          sublabel: "Unlocked, " + ((s.profile && s.profile.name.split(" ")[0]) || "there"),
          icon: "level-up",
          style: { background: "transparent", boxShadow: "none", paddingBottom: 0 }
        }),
        el("div", { style: { padding: "0 32px", textAlign: "center" } },
          el("div.body-lg", { style: { color: "var(--ink-900)", textWrap: "pretty" } },
            store.TIER_TARGET + " of " + store.TIER_TARGET + " in " + topicLabel.toLowerCase() + ". The questions get longer from here.")),
        ladder
      ),
      footer: el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 32px", display: "flex", justifyContent: "center" } },
        el("div", { style: { width: "100%", maxWidth: 520 } },
          AM.Button({ label: "Keep going", variant: "inverse", fullWidth: true, cta: true, onClick: function () { app.afterTierUp(); } })))
    };
  };

  /* ---------- 16 · Session summary ---------- */
  screens.summary = function (app) {
    var s = store.get();
    var r = app.scratch.result;
    if (!r) { app.go("home"); return screens.home(app); }

    function stat(value, label) {
      return el("div", {
        style: {
          background: "var(--surface-200)", borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-card)", padding: "var(--space-3)", textAlign: "center"
        }
      }, el("div.heading-lg", null, String(value)), el("div.caption", { style: { color: "var(--ink-600)" } }, label));
    }

    var missed = r.missed.length;
    var earned = store.badges().filter(function (b) { return b.earned; }).length;

    return {
      nav: "practice", bottomNav: false,
      banner: connectionBanner(),
      body: column([
        el("div", { style: { padding: "24px " + gutter() + "px 0" } },
          el("div.heading-lg", null, "Session done"),
          el("div.body-sm", { style: { color: "var(--ink-600)", marginTop: 4 } },
            r.topicLabel + " · " + r.minutes + " minute" + (r.minutes === 1 ? "" : "s"))),

        el("div", { style: { padding: "18px " + gutter() + "px 0", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 } },
          stat(r.attempted, "attempted"), stat(r.correct, "correct"), stat(s.tier, "tier")),

        el("div", { style: { padding: "20px " + gutter() + "px 0" } },
          AM.Card({ style: { gap: 10 } },
            sectionLabel("Tier " + s.tier + " progress"),
            AM.ProgressBar({ ratio: s.tierProgress / store.TIER_TARGET, height: 10, label: "Tier progress" }),
            el("span.body-sm", { style: { color: "var(--ink-600)" } },
              s.tier < 4
                ? s.tierProgress + " of " + store.TIER_TARGET + ". " + (store.TIER_TARGET - s.tierProgress) + " more correct to reach tier " + (s.tier + 1) + "."
                : "Every tier is open."))),

        missed ? el("div", { style: { padding: "20px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: 10 } },
          sectionLabel("Do next"),
          AM.Card({ style: { flexDirection: "row", gap: "var(--space-3)", alignItems: "center", padding: 14, cursor: "pointer" },
            onClick: function () { app.startRedo(r); } },
            el("span", {
              style: {
                width: 36, height: 36, flex: "none", borderRadius: "var(--radius-sm)",
                background: "var(--skill-" + r.colorKey + "-100)", color: "var(--skill-" + r.colorKey + "-600)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }
            }, icon("retry", 20)),
            el("span.body", { style: { textWrap: "pretty" } },
              "Redo the " + missed + " you missed" + (r.missedTheme ? ", all " + r.missedTheme + " questions." : ".")))
        ) : null,

        el("div", { style: { padding: "18px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-2)" } },
          sectionLabel("Badges · " + earned + " of 4"),
          AM.BadgeShelf({ badges: store.badges() }))
      ]),
      footer: el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 24px", display: "flex", justifyContent: "center" } },
        el("div", { style: { width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 10 } },
          AM.Button({ label: "Practice again", fullWidth: true, onClick: function () { app.startPractice(r.topicKey); } }),
          AM.Button({ label: "Back home", variant: "ghost", fullWidth: true, onClick: function () { app.go("home", "back"); } })))
    };
  };

  /* ---------- 20 · Profile ----------
     The ID card from login, reused. Sign out is a ghost, not the primary. */
  screens.profile = function (app) {
    var s = store.get();
    var p = s.profile || { name: "Ligaya Mendoza", school: "Poblacion, Pilar", colorKey: 2 };
    var earned = store.badges().filter(function (b) { return b.earned; }).length;

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
            school: p.school + " · Grade 6 · Tier " + s.tier,
            colorKey: p.colorKey, iconKey: p.iconKey,
            style: { maxWidth: "none", width: "100%" }
          })),

        el("div", { style: { padding: "16px " + gutter() + "px 0", display: "flex", gap: 10 } },
          stat(s.streakDays, "days in a row"), stat(s.totalCorrect, "correct so far")),

        el("div", { style: { padding: "18px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-2)" } },
          sectionLabel("Badges · " + earned + " of 4"),
          AM.BadgeShelf({ badges: store.badges() })),

        el("div", { style: { padding: "16px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-3)" } },
          sectionLabel("Progress by topic"),
          AM.TopicBars(store.topicList()))
      ]),
      footer: el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 20px", display: "flex", justifyContent: "center" } },
        el("div", { style: { width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 10 } },
          AM.Button({ label: "Back to practice", fullWidth: true, onClick: function () { app.go("topics"); } }),
          AM.Button({
            label: "Sign out", variant: "ghost", fullWidth: true,
            onClick: function () { store.set({ signedIn: false }); app.go("signin", "back"); }
          })))
    };
  };

  AM.screens = screens;
})();
