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
        app.canOfferInstall()
          ? [
              el("div.body", { style: { textWrap: "pretty" } }, INSTALL_PITCH),
              AM.Button({ label: "Add to home screen", fullWidth: true, onClick: function () { app.offerInstall("signin"); } }),
              AM.Button({ label: "Not now", variant: "ghost", fullWidth: true, onClick: function () { app.go("signin"); } })
            ]
          : AM.Button({ label: "Get started", fullWidth: true, onClick: function () { app.go("signin"); } })
      )
    };
  };

  /* ---------- Add to home screen, anytime ----------
     The splash makes the offer first. After sign-in it lives on Profile for
     good, and on Home until the learner says "Not now" there. Both disappear
     once the app is installed. */
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
      if (t.next) app.go(t.next);
      else app.go(t.from || "home", "back");
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
                background: "var(--skill-2-bright)", color: "var(--ink-inverse)",
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
            step(3, "You sign in with it. Your progress and streak are untouched.")
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
          "--am-edge": on ? "var(--ink-900)" : "var(--skill-" + k + "-deep)",
          width: 56, height: 56, borderRadius: "50%",
          background: on ? "var(--skill-" + k + "-bright)" : "var(--skill-" + k + "-tint)",
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
  function startLabel(next) {
    return (next.level.attempts || next.level.lessonSeen ? "Continue: " : "Start: ") + next.level.title;
  }

  screens.home = function (app) {
    var s = store.get();
    var p = store.path();
    var first = !store.hasProgress();
    var desktop = AM.device() === "desktop";
    var next = p.next;

    var headline = first
      ? el("div", { style: { padding: "24px " + gutter() + "px 0" } },
          el("div.heading-lg", null, "Hello, " + ((s.profile && s.profile.name.split(" ")[0]) || "there")),
          el("div.body-sm", { style: { color: "var(--ink-600)", marginTop: 4 } }, "Grade 6 · NCE math practice"))
      : el("div", {
          style: { padding: "24px " + gutter() + "px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-3)" }
        },
          greetingBlock(s, "Back for day " + s.streakDays),
          desktop ? null : streakBadge(s.streakDays)
        );

    var countdown = AM.Card({ style: { gap: 10 } },
      el("span", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-2)" } },
        el("span.heading-sm", null, p.daysToExam === null ? "Your path" : "Exam in " + p.daysToExam + " day" + (p.daysToExam === 1 ? "" : "s")),
        el("span.caption", { style: { color: "var(--ink-600)" } }, "30 January")),
      AM.ProgressBar({ ratio: p.coverage, height: 10, label: "Blueprint cleared" }),
      el("span.body", { style: { color: "var(--ink-600)", textWrap: "pretty" } },
        p.levelsCleared + " level" + (p.levelsCleared === 1 ? "" : "s") + " cleared · " + pct(p.coverage) + "% of the exam blueprint"));

    var upNext = next
      ? AM.Card({ style: { gap: 12 } },
          sectionLabel("Up next"),
          el("span", { style: { display: "flex", gap: "var(--space-3)", alignItems: "center" } },
            topicTile(next.topic),
            el("span", { style: { display: "flex", flexDirection: "column", minWidth: 0, flex: 1 } },
              el("span.label", null, levelLabel(next)),
              el("span.body", { style: { color: "var(--ink-600)" } }, next.level.title)),
            (function () {
              var nb = store.findBadge("lv:" + next.topic.key + "/" + next.level.id);
              return nb ? badgeButton(nb, 44) : null;
            })()),
          AM.ProgressBar({ ratio: next.level.correct / next.level.target, height: 8, color: "var(--skill-" + next.topic.colorKey + "-bright)", label: "Level progress" }),
          el("span.caption", { style: { color: "var(--ink-600)" } },
            !next.level.lessonSeen && next.level.hasLesson
              ? "Starts with a short lesson. " + next.level.target + " right first time clears it."
              : next.level.correct + " of " + next.level.target + " right first time to clear it"),
          desktop ? el("span", { style: { display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)", flexWrap: "wrap" } },
            AM.Button({ label: startLabel(next), onClick: function () { app.startLevel(next.topic.key, next.level.id); } }),
            AM.Button({ label: "See the whole path", variant: "ghost", onClick: function () { app.go("topics"); } })
          ) : null)
      : AM.Card({ style: { gap: 10 } },
          sectionLabel("Up next"),
          el("span.body", { style: { textWrap: "pretty" } }, "Every level on the path is cleared. Review any level from the path, or try a practice exam."));

    var streakBlock = (first || desktop) ? null : el("div", { style: { display: "flex", flexDirection: "column", gap: "var(--space-2)" } },
      sectionLabel(s.streakDays + " day" + (s.streakDays === 1 ? "" : "s") + " in a row"),
      AM.StreakWeek({ days: s.streakDays, resetToday: s.resetToday, height: AM.device() === "phone" ? 38 : 48 })
    );

    var written = p.topics.filter(function (t) { return t.ready; });
    var pathCard = (first || AM.device() === "phone") ? null : AM.Card({ style: { padding: "var(--space-6)", gap: 14 } },
      sectionLabel("Your path"),
      AM.TopicBars(written.map(function (t) {
        return { label: t.label, correct: t.cleared, total: t.total, caption: t.cleared + " of " + t.total + " levels", color: "var(--skill-" + t.colorKey + "-bright)" };
      }), { height: 10 }),
      p.topics.length > written.length
        ? el("span.body-sm", { style: { color: "var(--ink-600)" } }, (p.topics.length - written.length) + " more topic" + (p.topics.length - written.length === 1 ? "" : "s") + " coming")
        : null);

    var badgeCard = (first || AM.device() === "phone") ? null : (function () {
      var cat = store.catalog(), shown = store.showcase();
      return AM.Card({ style: { padding: "var(--space-6)", gap: "var(--space-3)" } },
        sectionLabel("Badges · " + cat.earned + " of " + cat.total),
        shown.length ? el("div", { style: { display: "flex", gap: "var(--space-4)", alignItems: "flex-end" } },
          shown.map(function (k) { return badgeButton(store.findBadge(k, cat), 64); })) : null,
        AM.Button({ label: "See all badges", variant: "ghost", onClick: function () { app.scratch.badgesBack = null; app.go("badges"); } }));
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
    var reviewCard = due ? AM.Card({ style: { gap: 12 } },
      sectionLabel("Review"),
      el("span", { style: { display: "flex", gap: "var(--space-3)", alignItems: "center" } },
        el("span", {
          style: {
            width: 40, height: 40, flex: "none", borderRadius: "var(--radius-sm)", background: "var(--brand-blue-100)",
            color: "var(--brand-blue-600)", display: "flex", alignItems: "center", justifyContent: "center"
          }
        }, icon("retry", 22)),
        el("span", { style: { display: "flex", flexDirection: "column", minWidth: 0 } },
          el("span.label", null, due + " question" + (due === 1 ? "" : "s") + " to try again"),
          el("span.caption", { style: { color: "var(--ink-600)" } }, "Ones you missed, back so they stick"))),
      AM.Button({ label: "Start review", variant: "ghost", fullWidth: true, onClick: function () { app.startReview(); } })) : null;

    /* The practice exam: the whole paper at once, against the clock. */
    var exam = store.examStats();
    var examCard = first ? null : AM.Card({ style: { gap: 12 } },
      sectionLabel("Practice exam"),
      el("span", { style: { display: "flex", gap: "var(--space-3)", alignItems: "center" } },
        el("span", {
          style: {
            width: 40, height: 40, flex: "none", borderRadius: "var(--radius-sm)", background: "var(--brand-blue-100)",
            color: "var(--brand-blue-600)", display: "flex", alignItems: "center", justifyContent: "center"
          }
        }, icon("clock", 22)),
        el("span", { style: { display: "flex", flexDirection: "column", minWidth: 0 } },
          el("span.label", null, app.EXAM_COUNT + " questions · " + app.EXAM_MINUTES + " minutes"),
          el("span.caption", { style: { color: "var(--ink-600)" } },
            exam ? "Last " + exam.last.score + " of " + exam.last.total + " · best " + exam.best.score + " of " + exam.best.total
              : "Every topic, as the exam weighs them"))),
      AM.Button({ label: exam ? "Take another" : "Try a practice exam", variant: "ghost", fullWidth: true, onClick: function () { app.go("examIntro"); } }));

    var offer = app.canOfferInstall() && !s.installCardDismissed ? installCard(app) : null;

    /* Tablet and desktop spend the extra width on a second card rather than on
       longer lines. */
    var cards = AM.device() === "phone"
      ? el("div", { style: { display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "0 " + gutter() + "px" } },
          offer, upNext, reviewCard, countdown, examCard, basicsCard, streakBlock)
      : el("div", { style: { display: "flex", flexDirection: "column", gap: desktop ? 32 : 24, padding: "0 " + gutter() + "px" } },
          offer,
          el("div.am-pair", null, upNext, countdown),
          reviewCard,
          el("div.am-pair", null, examCard, basicsCard),
          streakBlock,
          el("div.am-pair", null, pathCard, badgeCard));

    var footer = (desktop) ? null : el("div", {
      style: { flex: "none", padding: "0 " + gutter() + "px 20px", display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }
    }, el("div", { style: { width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 10 } },
        next ? AM.Button({ label: startLabel(next), fullWidth: true, onClick: function () { app.startLevel(next.topic.key, next.level.id); } }) : null,
        AM.Button({ label: "See the whole path", variant: next ? "ghost" : "primary", fullWidth: true, onClick: function () { app.go("topics"); } })
      ));

    return {
      nav: "home",
      banner: connectionBanner(),
      railFooter: el("span.am-rail-note", {
        style: { background: "var(--brand-blue-100)", color: "var(--brand-blue-600)" }
      }, icon("streak", 22), el("span.label", { style: { color: "var(--ink-900)" } },
        s.streakDays + " day" + (s.streakDays === 1 ? "" : "s") + " in a row")),
      body: column([headline, el("div", { style: { height: 20 } }), cards], { gap: 0, paddingBottom: 24 }),
      footer: footer,
      /* The one question about sharing weekly totals, on Home after a round
         has been finished: a calm moment, never inside a lesson. */
      after: function () { if (!s.sharingAsked && s.lastSession) openShareAsk(); }
    };
  };

  /* ---------- 7 / 8 · The path ----------
     Every topic of the blueprint in the order the app teaches them. Any
     written topic can be opened; the one to do next is marked. A topic not yet
     written is shown, locked, as coming soon, so the path never pretends to be
     the whole exam when it is not. */
  screens.topics = function (app) {
    var p = store.path();
    var nextKey = p.next ? p.next.topic.key : null;

    var list = el("div", { style: { display: "flex", flexDirection: "column", gap: 10, padding: "18px " + gutter() + "px 0" } });
    p.topics.forEach(function (t) {
      var caption = !t.ready ? "Coming soon"
        : t.done ? "All " + t.total + " levels cleared"
        : t.cleared + " of " + t.total + " levels";
      list.appendChild(el("button.am-reset.am-pressable.am-path-row", {
        type: "button", disabled: !t.ready,
        "aria-label": t.label + ", " + caption + (t.key === nextKey ? ", up next" : ""),
        onClick: function () { if (t.ready) app.openTopic(t.key); },
        style: {
          "--am-edge": t.key === nextKey ? "var(--brand-blue-600)" : "var(--line-200)",
          display: "flex", alignItems: "center", gap: "var(--space-3)", width: "100%", textAlign: "left",
          padding: "12px 14px", borderRadius: "var(--radius-md)",
          background: t.ready ? "var(--surface-200)" : "var(--surface-100)",
          color: t.ready ? "var(--ink-900)" : "var(--ink-600)", cursor: t.ready ? "pointer" : "default"
        }
      },
        topicTile(t),
        el("span", { style: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 } },
          el("span", { style: { display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" } },
            el("span.label", null, t.label),
            t.key === nextKey ? AM.Chip({ label: "Up next" }) : null),
          t.ready ? AM.ProgressBar({ ratio: t.total ? t.cleared / t.total : 0, height: 6, color: "var(--skill-" + t.colorKey + "-bright)", label: t.label + " levels cleared" }) : null,
          el("span.caption", { style: { color: "var(--ink-600)" } }, caption)),
        t.ready ? el("span", { style: { flex: "none", color: "var(--ink-600)" } }, icon("next", 20)) : null));
    });

    var basics = store.basics();
    var basicsRow = basics.length ? el("div", { style: { display: "flex", flexDirection: "column", gap: 10, padding: "24px " + gutter() + "px 0" } },
      sectionLabel("Beside the path"),
      el("button.am-reset.am-pressable.am-path-row", {
        type: "button", "aria-label": "Basics: " + basics.map(function (t) { return t.label; }).join(", ") + ". Practise any time.",
        onClick: function () { app.go("basics"); },
        style: {
          "--am-edge": "var(--line-200)", display: "flex", alignItems: "center", gap: "var(--space-3)", width: "100%", textAlign: "left",
          padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--surface-200)", color: "var(--ink-900)", cursor: "pointer"
        }
      },
        topicTile(basics[0]),
        el("span", { style: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 } },
          el("span.label", null, "Basics"),
          el("span.caption", { style: { color: "var(--ink-600)", textWrap: "pretty" } },
            basics.map(function (t) { return t.label; }).join(", ") + ". Practise any time; they don't open or close anything here.")),
        el("span", { style: { flex: "none", color: "var(--ink-600)" } }, icon("next", 20)))) : null;

    return {
      nav: "practice", bottomNav: false,
      banner: connectionBanner(),
      back: function () { app.go("home", "back"); },
      body: column([
        el("div", { style: { padding: "20px " + gutter() + "px 0" } },
          el("div.heading-md", null, "Your path"),
          el("div.body-sm", { style: { color: "var(--ink-600)", marginTop: 4, textWrap: "pretty" } },
            p.levelsCleared + " of " + p.levelsTotal + " levels cleared" + (p.daysToExam === null ? "" : " · exam in " + p.daysToExam + " days"))),
        list,
        basicsRow
      ], { paddingBottom: 24 }),
      footer: p.next ? el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 24px", display: "flex", justifyContent: "center" } },
        el("div", { style: { width: "100%", maxWidth: 520 } },
          AM.Button({ label: startLabel(p.next), fullWidth: true, onClick: function () { app.startLevel(p.next.topic.key, p.next.level.id); } }))) : null
    };
  };

  /* ---------- A topic's levels ----------
     Levels open in order: a cleared one can be reviewed, the current one
     continued, a locked one waits for the one before it. */
  screens.topic = function (app) {
    var t = store.topicPath(app.scratch.topic);
    if (!t || !t.ready) { app.go("topics"); return screens.topics(app); }
    var current = t.current;

    var list = el("div", { style: { display: "flex", flexDirection: "column", gap: 10, padding: "18px " + gutter() + "px 0" } });
    t.levels.forEach(function (lv) {
      var isCurrent = current && current.id === lv.id;
      var glyph = lv.cleared ? "check" : lv.unlocked ? "lesson" : "lock";
      var caption = lv.cleared ? "Cleared · tap to review"
        : lv.unlocked ? lv.correct + " of " + lv.target + " right first time to clear"
        : "Clear level " + (lv.number - 1) + " to open";
      list.appendChild(el("button.am-reset.am-pressable.am-path-row", {
        type: "button", disabled: !lv.unlocked,
        "aria-label": "Level " + lv.number + ", " + lv.title + ", " + caption,
        onClick: function () { if (lv.unlocked) app.startLevel(t.key, lv.id); },
        style: {
          "--am-edge": isCurrent ? "var(--brand-blue-600)" : "var(--line-200)",
          display: "flex", alignItems: "center", gap: "var(--space-3)", width: "100%", textAlign: "left",
          padding: "12px 14px", borderRadius: "var(--radius-md)",
          background: lv.unlocked ? "var(--surface-200)" : "var(--surface-100)",
          color: lv.unlocked ? "var(--ink-900)" : "var(--ink-600)", cursor: lv.unlocked ? "pointer" : "default"
        }
      },
        el("span", {
          style: {
            flex: "none", width: 40, height: 40, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: lv.cleared ? "var(--skill-" + t.colorKey + "-bright)" : lv.unlocked ? "var(--skill-" + t.colorKey + "-tint)" : "var(--surface-300)",
            color: lv.cleared ? "var(--ink-inverse)" : lv.unlocked ? "var(--skill-" + t.colorKey + "-deep)" : "var(--ink-600)"
          }
        }, icon(glyph, 20)),
        el("span", { style: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 } },
          el("span.label", null, "Level " + lv.number + " · " + lv.title),
          isCurrent ? AM.ProgressBar({ ratio: lv.correct / lv.target, height: 6, color: "var(--skill-" + t.colorKey + "-bright)", label: "Level progress" }) : null,
          el("span.caption", { style: { color: "var(--ink-600)" } }, caption))));
    });

    var actions = [];
    if (current) actions.push(AM.Button({
      label: (current.attempts || current.lessonSeen ? "Continue level " : "Start level ") + current.number,
      fullWidth: true, onClick: function () { app.startLevel(t.key, current.id); }
    }));
    if (current && current.lessonSeen && current.hasLesson) actions.push(AM.Button({
      label: "See the lesson again", variant: "ghost", fullWidth: true,
      onClick: function () { app.openLesson(t.key, current.id); }
    }));
    if (!current) actions.push(AM.Button({ label: "Back to the path", fullWidth: true, onClick: function () { app.go("topics", "back"); } }));

    return {
      nav: "practice", bottomNav: false,
      banner: connectionBanner(),
      back: function () { app.go("topics", "back"); },
      body: column([
        el("div", { style: { padding: "20px " + gutter() + "px 0", display: "flex", gap: "var(--space-3)", alignItems: "center" } },
          topicTile(t, 48),
          el("span", null,
            el("div.heading-md", null, t.label),
            el("div.body-sm", { style: { color: "var(--ink-600)", marginTop: 2 } },
              t.done ? "All " + t.total + " levels cleared" : t.cleared + " of " + t.total + " levels cleared"))),
        list
      ], { paddingBottom: 24 }),
      footer: el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 24px", display: "flex", justifyContent: "center" } },
        el("div", { style: { width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 10 } }, actions))
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
      list.appendChild(basicsRowButton(t, function () { app.openBasicsTopic(t.key); }, basicsCaption(t), basicsRatio(t)));
    });
    return {
      nav: "practice", bottomNav: false,
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

    return {
      nav: "practice", bottomNav: false,
      banner: connectionBanner(),
      back: function () { app.go("basics", "back"); },
      body: column([
        el("div", { style: { padding: "20px " + gutter() + "px 0", display: "flex", gap: "var(--space-3)", alignItems: "center" } },
          topicTile(t, 48),
          el("span", null,
            el("div.heading-md", null, t.label),
            el("div.body-sm", { style: { color: "var(--ink-600)", marginTop: 2 } }, basicsCaption(t)))),
        gridCard,
        list
      ], { paddingBottom: 24 }),
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
          el("span.label", {
            style: {
              flex: "none", width: 28, height: 28, borderRadius: "50%", background: "var(--brand-blue-100)",
              color: "var(--brand-blue-600)", display: "flex", alignItems: "center", justifyContent: "center"
            }
          }, String(i + 1)),
          el("span.body-lg", { style: { textWrap: "pretty" } }, st)));
      });
      content = el("div", { style: { padding: "20px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-3)" } },
        el("div.heading-md", null, card.title),
        el("div.body-lg", { style: { fontWeight: 500, textWrap: "pretty" } }, card.prompt),
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
          el("span.caption", { style: { color: "var(--ink-600)" } }, t.label + " · Level " + lv.number + " · " + lv.title),
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
      var given = q.type === "choice" ? AM.content.choiceText(q, ses.picked) : (q.unit || "") + AM.entry.text(ses.entry) + q.suffix;
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
        ),
        /* On a phone the options are gone once answered, so a picture answer
           shows the picture picked. Not the right one: a retry follows. */
        q.choiceFigures && !desktop ? el("div", { style: { paddingTop: "var(--space-3)", display: "flex" } },
          AM.Chart(Object.assign({}, q.choiceFigures[ses.picked], { title: "Your answer, picture " + q.choices[ses.picked] }))) : null);
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
        : lv.cleared ? "Level " + ses.levelNumber + " cleared · reviewing"
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
          verdict(), explanation(), streakChip(),
          hintPanel(),
          levelStrip()
        ));

      return {
        nav: "practice", bottomNav: false, header: header, onBack: openLeave, banner: null,
        railFooter: el("span.am-rail-note", { style: { background: "var(--surface-100)", color: "var(--ink-600)" } },
          icon("clock", 22), el("span.label", { style: { color: "var(--ink-900)" } }, minutesLabel(ses))),
        body: deskBody,
        footer: (ses.phase === "ask") ? null : el("div", { style: { display: "flex", justifyContent: "center", padding: "0 " + gutter() + "px 24px" } },
          el("div", { style: { width: "100%", maxWidth: 520 } }, actions))
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
        verdict(),
        explanation(),
        streakChip()
      ]),
      belowFold: el("div", null,
        hintsUsedCard(),
        keypadNode ? el("div", { style: { padding: "0 " + gutter() + "px" } }, keypadNode) : levelStrip()),
      footer: actions
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
    if (AM.tally) AM.tally.feature("badge-card");
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
    var exam = !!s.exam;
    var badged = !exam && !s.redo && !s.review && (s.kind === "practice" || s.kind === "facts");
    var lines = exam ? ["It won't be scored, and the clock stops."]
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

  /* ---------- sharing weekly totals ----------
     Counts only (tally.js): totals per level, never anything that points to
     a learner. Asked once; both answers weigh the same, and Not now is a no. */
  var SHARE_LINE = "Totals like questions right in each level, to help improve the app. Never your name or anything that shows it is you.";
  function openShareAsk() {
    var a = app(), frame = document.querySelector(".am-frame");
    if (!frame) return;
    store.markSharingAsked();
    clearSheets(frame);
    var previous = document.activeElement;
    var scrim = el("div.am-sheet-scrim", { onClick: function () { close(); } });
    function answer(yes) { return function () { if (yes) store.setSetting("sharing", true); close(); }; }
    var yes = AM.Button({ label: "Yes, share totals", variant: "ghost", fullWidth: true, onClick: answer(true) });
    var no = AM.Button({ label: "Not now", variant: "ghost", fullWidth: true, onClick: answer(false) });
    var sheet = el("div.am-sheet", { role: "dialog", "aria-modal": "true", "aria-labelledby": "am-share-title" },
      el("div.heading-md", { id: "am-share-title" }, "Help make Abante Minds better?"),
      el("div.body", { style: { color: "var(--ink-900)", textWrap: "pretty", maxWidth: 380 } },
        "Once a week, the app can send totals, like how many questions were answered right in each level. It never sends your name, your school or anything that shows it is you."),
      el("div.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty", maxWidth: 380 } },
        "Ask a grown-up if you are not sure. You can change this any time in Profile."),
      el("div", { style: { width: "100%", maxWidth: 420, display: "flex", gap: 10, marginTop: 12 } }, yes, no),
      el("button.am-reset", {
        type: "button", onClick: function () { close(); a.go("privacy"); },
        style: { minHeight: 44, background: "none", border: 0, cursor: "pointer", color: "var(--brand-blue-600)" }
      }, el("span.label", null, "What is shared")));
    function close() {
      if (a.closeSheet === close) a.closeSheet = null;
      if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
      if (scrim.parentNode) scrim.parentNode.removeChild(scrim);
      document.removeEventListener("keydown", onKey);
      if (previous && previous.focus) previous.focus();
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);
    frame.appendChild(scrim);
    frame.appendChild(sheet);
    a.closeSheet = close;
    var m = window.AbanteMinds && window.AbanteMinds.moments;
    if (m && !m.reduced()) {
      sheet.animate([{ transform: "translateY(100%)" }, { transform: "none" }], { duration: 320, easing: m.ease.backSoft });
      scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
    }
  }

  /* What is shared, in plain words, and what is not. */
  screens.privacy = function (app) {
    var set = store.settings(), live = !!(AM.tally && AM.tally.endpoint());
    var status = !live ? "This version of the app sends nothing yet. Totals stay on this phone."
      : set.sharing ? "Sharing is on." : "Sharing is off. Nothing is counted or sent.";
    function part(title, lines) {
      return el("div", { style: { padding: "18px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: 8 } },
        el("div.label", null, title),
        AM.Card({ style: { gap: 6 } }, lines.map(function (l) { return el("div.body", { style: { textWrap: "pretty" } }, l); })));
    }
    return {
      nav: null,
      back: function () { app.go("profile", "back"); },
      body: column([
        el("div", { style: { padding: "20px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-2)" } },
          el("div.heading-md", null, "What is shared"),
          el("div.body", { style: { color: "var(--ink-600)", textWrap: "pretty" } }, status)),
        part("Sent once a week, only if Share weekly totals is on", [
          "For each level practised: questions answered, right first time, hints used, and rounds finished or left early.",
          "Reviews: how many were right and wrong. Basics facts: answered, right and quick. Practice exams: right and asked in each topic.",
          "How often the streak screen and badge cards are opened, and which settings are switched.",
          "Error codes, if something goes wrong. The app's version and the week."
        ]),
        part("Never sent", [
          "Your name, your school, any code or ID for you or this phone, where you are, the time of day, or anything you type."
        ]),
        part("Where it goes", [
          "To a small server on Cloudflare, mostly in the Asia-Pacific region. It adds your totals to everyone else's and throws the report away, so nothing there belongs to you or this phone. Totals from fewer than five reports are hidden when they are read."
        ]),
        part("Stopping", [
          "Turn off Share weekly totals in Profile. Totals not yet sent are deleted from this phone. Totals already sent cannot be picked out again, because nothing links them to you."
        ]),
        part("Questions", ["Write to ron.baraneta@gmail.com."])
      ], { gap: 0, paddingBottom: 24 })
    };
  };

  /* New badges, as a card on a summary. */
  function newBadgesCard(keys) {
    if (!keys || !keys.length) return null;
    var cat = store.catalog();
    var found = keys.map(function (k) { return store.findBadge(k, cat); }).filter(Boolean);
    if (!found.length) return null;
    return el("div", { style: { padding: "18px " + gutter() + "px 0" } },
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
      nav: "profile",
      back: function () { if (resume) resume(); else app.go("profile", "back"); },
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
          window.setTimeout(function () { var c = m.centre(btn); m.FX.stars(c.x, c.y, 8, ["#7b6cf6", "#ffd23f", "#ffffff"]); if (window.AbanteMinds.sound) window.AbanteMinds.sound.play("sparkle"); }, 420);
        }
      },
      body: column([
        el("div", { style: { padding: "12px " + gutter() + "px 0" } },
          el("div", { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 } },
            el("div.heading-lg", null, "Your badges"),
            el("span.label", { style: { color: "var(--ink-600)" } }, cat.earned + " of " + cat.total)),
          el("div", { style: { marginTop: 8 } }, AM.ProgressBar({ ratio: cat.total ? cat.earned / cat.total : 0, height: 10, label: "Badges collected" }))),
        el("div", { style: { padding: "16px " + gutter() + "px 0" } },
          AM.Card({ style: { gap: 6 } },
            sectionLabel("Showcase"),
            shown.length
              ? el("div", { style: { display: "flex", justifyContent: "space-around", alignItems: "flex-end" } },
                  shown.map(function (k) { return badgeButton(store.findBadge(k, cat), 72); }))
              : el("span.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } }, "Clear a level to earn your first badge. Your newest three show here, or pick your own from any badge's card."))),
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
    var right = Math.min(ls.correct, store.CLEAR_TARGET), tries = Math.max(ls.attempts, right);
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
    var keep = AM.Button({ label: "Keep going", variant: "inverse", fullWidth: true, cta: true, onClick: function () { view.played = true; if (view.tl) view.tl.skip(); app.afterLevelUp(); } });
    var see = el("button.am-reset.am-linkbtn.label", { type: "button", onClick: function () { view.played = true; if (view.tl) view.tl.skip(); app.levelUpToBadges(); } }, "See my badges");
    var footer = el("div.am-lvup-foot", { style: { flex: "none", padding: "0 " + gutter() + "px 24px", display: "flex", justifyContent: "center" } },
      el("div", { style: { width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 4 } }, see, keep));

    var body = el("div.am-celebrate.am-lvup", { style: { "--gutter": gutter() + "px" } },
      el("div.am-rays", { "aria-hidden": "true" }),
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
      .to(q(".am-rays"), [{ opacity: 0, transform: "scale(0.6)" }, { opacity: 1, transform: "none" }], 1200, 1.7);
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
        play("thump")(); play("fanfare")();
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
    var fresh = newBadgesCard(view.badges);
    var go = function () {
      if (view.tl) view.tl.skip();
      var next = app.scratch.afterStreak || "home";
      app.scratch.streak = null;
      app.go(next);
    };
    var body = el("div.am-streak", { style: { "--gutter": gutter() + "px", position: "relative" } },
      el("div.am-streak-glow", { "aria-hidden": "true" }),
      el("div", { style: { position: "relative", lineHeight: 0 } }, fl),
      num,
      el("div.am-streak-label", null, days === 1 ? "day of practice!" : "day streak!"),
      week,
      fresh ? el("div", { style: { width: "100%", maxWidth: 420, textAlign: "left" } }, fresh) : null,
      el("p.body", { style: { color: "var(--ink-600)", margin: "14px 0 0", maxWidth: 300, textWrap: "balance" } }, copy));
    var footer = el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 24px", display: "flex", justifyContent: "center", background: "var(--surface-200)" } },
      el("div", { style: { width: "100%", maxWidth: 520 } }, AM.Button({ label: "Continue", fullWidth: true, cta: true, onClick: go })));
    return {
      nav: null, chrome: false, body: body, footer: footer, onBack: go,
      after: function () {
        AM.announce(days + (days === 1 ? " day of practice." : " day streak."));
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
          .to(footer, [{ transform: "translateY(110px)" }, { transform: "none" }], 500, 3.3, E.backSoft);
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

  screens.summary = function (app) {
    var r = app.scratch.result;
    if (!r) { app.go("home"); return screens.home(app); }
    var t = store.topicPath(r.topicKey) || store.basicsTopic(r.topicKey);
    var lv = t.levels.filter(function (x) { return x.id === r.levelId; })[0];
    if (r.facts) return factsSummary(app, r, t, lv);
    var nextLevel = t.levels[lv.number] || null;

    function stat(value, label) {
      return el("div", {
        style: {
          background: "var(--surface-200)", borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-card)", padding: "var(--space-3)", textAlign: "center"
        }
      }, el("div.heading-lg", null, String(value)), el("div.caption", { style: { color: "var(--ink-600)" } }, label));
    }

    var missed = r.missed.length;
    var levelNote = r.redo ? "Redoing missed questions keeps your streak but does not count towards the level."
      : lv.cleared ? (nextLevel ? "Cleared. Level " + nextLevel.number + ", " + nextLevel.title.toLowerCase() + ", is open." : "Cleared. That was the last level in " + t.label.toLowerCase() + ".")
      : (lv.target - lv.correct) + " more right first time to clear it.";

    var primary = (lv.cleared && nextLevel && nextLevel.unlocked && !nextLevel.cleared)
      ? AM.Button({ label: "Start level " + nextLevel.number, fullWidth: true, onClick: function () { app.startLevel(r.topicKey, nextLevel.id); } })
      : AM.Button({ label: lv.cleared ? "Review this level" : "Practice again", fullWidth: true, onClick: function () { app.startLevel(r.topicKey, r.levelId); } });

    return {
      nav: "practice", bottomNav: false,
      banner: connectionBanner(),
      body: column([
        el("div", { style: { padding: "24px " + gutter() + "px 0" } },
          el("div.heading-lg", null, "Session done"),
          el("div.body-sm", { style: { color: "var(--ink-600)", marginTop: 4 } },
            r.topicLabel + " · Level " + r.levelNumber + " · " + r.minutes + " minute" + (r.minutes === 1 ? "" : "s"))),

        el("div", { style: { padding: "18px " + gutter() + "px 0", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 } },
          stat(r.attempted, "attempted"), stat(r.correct, "right first time"), stat(lv.correct + "/" + lv.target, "level")),

        el("div", { style: { padding: "20px " + gutter() + "px 0" } },
          AM.Card({ style: { gap: 10 } },
            sectionLabel("Level " + lv.number + " · " + lv.title),
            AM.ProgressBar({ ratio: lv.correct / lv.target, height: 10, color: "var(--skill-" + t.colorKey + "-bright)", label: "Level progress" }),
            el("span.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } }, levelNote))),

        newBadgesCard(r.badges || (r.badges = takeBadges(anyBadge))),

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

  screens.examIntro = function (app) {
    var stats = store.examStats();
    var rule = function (glyph, text) {
      return el("span", { style: { display: "flex", gap: "var(--space-3)", alignItems: "flex-start" } },
        el("span", { style: { flex: "none", color: "var(--brand-blue-600)" } }, icon(glyph, 22)),
        el("span.body", { style: { textWrap: "pretty" } }, text));
    };
    return {
      nav: "home", bottomNav: false,
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
     The ID card from login, reused. Sign out is a ghost, not the primary. */
  screens.profile = function (app) {
    var s = store.get();
    var p = s.profile || { name: "Ligaya Mendoza", school: "Poblacion, Pilar", colorKey: 2 };
    var path = store.path();
    var written = path.topics.filter(function (t) { return t.ready; });

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
            school: p.school + " · Grade 6 · " + path.levelsCleared + " level" + (path.levelsCleared === 1 ? "" : "s") + " cleared",
            colorKey: p.colorKey, iconKey: p.iconKey,
            style: { maxWidth: "none", width: "100%" }
          })),

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

        el("div", { style: { padding: "16px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-3)" } },
          sectionLabel("Progress by topic"),
          AM.TopicBars(written.map(function (t) {
            return { label: t.label, correct: t.cleared, total: t.total, caption: t.cleared + " of " + t.total + " levels", color: "var(--skill-" + t.colorKey + "-bright)" };
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
          function change(name) {
            return function (v) {
              store.setSetting(name, v);
              if (name === "sharing" && !v && AM.tally) AM.tally.clear();  /* off: nothing kept */
              if (AM.tally && name !== "sharing") AM.tally.feature(name + "-" + (v === true ? "on" : v === false ? "off" : v));
              app.keepScroll = true; app.render();
            };
          }
          return el("div", { style: { padding: "16px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-2)" } },
            sectionLabel("Settings"),
            AM.Card({ style: { gap: 0, paddingTop: 4, paddingBottom: 4 } },
              AM.Toggle({ label: "Sound", sub: "Gong-chimes for answers, streaks and levels. A phone on silent stays silent.", on: set.sound, onChange: change("sound") }),
              AM.Toggle({ label: "Vibration", sub: "A short buzz with answers and level-ups, on phones that can.", on: set.vibration, onChange: change("vibration") }),
              AM.Toggle({ label: "Calm animations", sub: "Celebrations show their end straight away, with no confetti or movement.", on: set.calm, onChange: change("calm") }),
              AM.Segmented({
                label: "Theme", sub: "Auto follows your phone's light or dark setting.", value: set.theme, onChange: change("theme"),
                options: [{ value: "auto", label: "Auto" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }]
              }),
              AM.Toggle({ label: "Share weekly totals", sub: SHARE_LINE, on: set.sharing, onChange: change("sharing") }),
              el("button.am-reset.am-backlink", {
                type: "button", onClick: function () { app.go("privacy"); },
                style: { alignSelf: "flex-start", minHeight: 44, padding: "0 0 4px", background: "none", border: 0, cursor: "pointer", color: "var(--brand-blue-600)" }
              }, el("span.label", null, "What is shared"))));
        })(),

        /* One button, no card: it fits the space Profile had spare on a
           390x844 phone, so the footer and nav stay on screen. */
        app.canOfferInstall()
          ? el("div", { style: { padding: "18px " + gutter() + "px 0" } },
              AM.Button({ label: "Add to home screen", variant: "ghost", iconLeft: "home", fullWidth: true, onClick: function () { app.offerInstall(); } }))
          : null
      ], { paddingBottom: 24 }),
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
