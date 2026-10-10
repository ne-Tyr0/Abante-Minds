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

  /* ---------- 5 / 6 / 17 · Home ----------
     The countdown to the exam, how much of the path is cleared, and the one
     level to do next. The streak stays; the tier ladder is gone, because the
     path replaced tiers. */
  function pct(ratio) { return Math.round(ratio * 100); }

  /* The coloured tile a topic carries everywhere: its icon on its skill hue. */
  function topicTile(t, size) {
    size = size || 40;
    return el("span", {
      style: {
        flex: "none", width: size, height: size, borderRadius: "var(--radius-sm)",
        background: t.ready ? "var(--skill-" + t.colorKey + "-100)" : "var(--surface-300)",
        color: t.ready ? "var(--skill-" + t.colorKey + "-600)" : "var(--ink-600)",
        display: "flex", alignItems: "center", justifyContent: "center"
      }
    }, icon(t.ready ? t.icon : "lock", Math.round(size / 2)));
  }

  function levelLabel(next) { return next.topic.label + " · Level " + next.level.number; }
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
          desktop ? null : AM.Chip({ icon: "streak", label: String(s.streakDays), large: true })
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
            el("span", { style: { display: "flex", flexDirection: "column", minWidth: 0 } },
              el("span.label", null, levelLabel(next)),
              el("span.body", { style: { color: "var(--ink-600)" } }, next.level.title))),
          AM.ProgressBar({ ratio: next.level.correct / next.level.target, height: 8, color: "var(--skill-" + next.topic.colorKey + "-600)", label: "Level progress" }),
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
          el("span.body", { style: { textWrap: "pretty" } }, "Every level written so far is cleared. More topics are on the way; review any level from the path."));

    var streakBlock = (first || desktop) ? null : el("div", { style: { display: "flex", flexDirection: "column", gap: "var(--space-2)" } },
      sectionLabel(s.streakDays + " day" + (s.streakDays === 1 ? "" : "s") + " in a row"),
      AM.StreakWeek({ days: s.streakDays, resetToday: s.resetToday, height: AM.device() === "phone" ? 38 : 48 })
    );

    var written = p.topics.filter(function (t) { return t.ready; });
    var pathCard = (first || AM.device() === "phone") ? null : AM.Card({ style: { padding: "var(--space-6)", gap: 14 } },
      sectionLabel("Your path"),
      AM.TopicBars(written.map(function (t) {
        return { label: t.label, correct: t.cleared, total: t.total, caption: t.cleared + " of " + t.total + " levels", color: "var(--skill-" + t.colorKey + "-600)" };
      }), { height: 10 }),
      el("span.body-sm", { style: { color: "var(--ink-600)" } }, (p.topics.length - written.length) + " more topics coming"));

    var badgeCard = (first || AM.device() === "phone") ? null : AM.Card({ style: { padding: "var(--space-6)", gap: "var(--space-3)" } },
      sectionLabel("Badges · " + store.badges().filter(function (b) { return b.earned; }).length + " of 4"),
      AM.BadgeShelf({ badges: store.badges(), lockedBackground: "var(--surface-100)" })
    );

    var offer = app.canOfferInstall() && !s.installCardDismissed ? installCard(app) : null;

    /* Tablet and desktop spend the extra width on a second card rather than on
       longer lines. */
    var cards = AM.device() === "phone"
      ? el("div", { style: { display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "0 " + gutter() + "px" } },
          offer, upNext, countdown, streakBlock)
      : el("div", { style: { display: "flex", flexDirection: "column", gap: desktop ? 32 : 24, padding: "0 " + gutter() + "px" } },
          offer,
          el("div.am-pair", null, upNext, countdown),
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
      footer: footer
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
          t.ready ? AM.ProgressBar({ ratio: t.total ? t.cleared / t.total : 0, height: 6, color: "var(--skill-" + t.colorKey + "-600)", label: t.label + " levels cleared" }) : null,
          el("span.caption", { style: { color: "var(--ink-600)" } }, caption)),
        t.ready ? el("span", { style: { flex: "none", color: "var(--ink-600)" } }, icon("next", 20)) : null));
    });

    return {
      nav: "practice", bottomNav: false,
      banner: connectionBanner(),
      back: function () { app.go("home", "back"); },
      body: column([
        el("div", { style: { padding: "20px " + gutter() + "px 0" } },
          el("div.heading-md", null, "Your path"),
          el("div.body-sm", { style: { color: "var(--ink-600)", marginTop: 4, textWrap: "pretty" } },
            p.levelsCleared + " of " + p.levelsTotal + " levels cleared" + (p.daysToExam === null ? "" : " · exam in " + p.daysToExam + " days"))),
        list
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
            background: lv.cleared ? "var(--skill-" + t.colorKey + "-600)" : lv.unlocked ? "var(--skill-" + t.colorKey + "-100)" : "var(--surface-300)",
            color: lv.cleared ? "var(--ink-inverse)" : lv.unlocked ? "var(--skill-" + t.colorKey + "-600)" : "var(--ink-600)"
          }
        }, icon(glyph, 20)),
        el("span", { style: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 } },
          el("span.label", null, "Level " + lv.number + " · " + lv.title),
          isCurrent ? AM.ProgressBar({ ratio: lv.correct / lv.target, height: 6, color: "var(--skill-" + t.colorKey + "-600)", label: "Level progress" }) : null,
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

  /* ---------- A level's lesson ----------
     Two or three cards before the first practice: the idea, a worked example
     with every step shown, and the mistake to avoid. One card at a time, so a
     small screen never has to scroll through a wall of text. */
  screens.lesson = function (app) {
    var l = app.scratch.lesson;
    if (!l) { app.go("home"); return screens.home(app); }
    var t = store.topicPath(l.topic);
    var lv = t.levels.filter(function (x) { return x.id === l.level; })[0];
    var card = l.cards[l.page];
    var last = l.page === l.cards.length - 1;

    var dots = el("span", { style: { display: "flex", gap: 6 }, "aria-label": "Card " + (l.page + 1) + " of " + l.cards.length });
    l.cards.forEach(function (_, i) {
      dots.appendChild(el("span", {
        style: {
          width: i === l.page ? 20 : 8, height: 8, borderRadius: "var(--radius-pill)",
          background: i <= l.page ? "var(--skill-" + t.colorKey + "-600)" : "var(--surface-300)"
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
      tier: (offline ? "Offline · level " : "Level ") + ses.levelNumber,
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
      var given = q.type === "choice" ? q.choices[ses.picked] : (q.unit || "") + AM.entry.text(ses.entry) + q.suffix;
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

    /* Correct explains how it works. Wrong names the mistake when the answer
       matches one the template expects, says so plainly when it does not, and
       reveals one worked step, with the rest still locked. */
    function explanation() {
      if (ses.phase === "correct") {
        return el("div", { style: { padding: "18px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-2)" } },
          sectionLabel("How it works"),
          el("span.body-lg", null, q.explain));
      }
      if (ses.phase === "wrong") {
        var block = el("div", { style: { padding: "16px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-3)" } },
          el("div.body", { style: { textWrap: "pretty" } }, (ses.diagnosis && ses.diagnosis.feedback) || q.missExplain),
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

    /* How far the level is from clearing. A redo session says it does not
       count, rather than show a bar that will not move. */
    function levelStrip() {
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
          AM.ProgressBar({ ratio: shown / store.CLEAR_TARGET, flex: true, label: "Level progress" })),
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
          q.entry === "number" ? "Type on the keyboard or use the keypad." : "Type on the keyboard or use the keypad. / or space moves to the next box."));
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
          levelStrip()
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
        keypadNode ? el("div", { style: { padding: "0 " + gutter() + "px" } }, keypadNode) : levelStrip()),
      footer: actions
    };
  };

  function minutesLabel(ses) {
    var mins = Math.max(1, Math.round((Date.now() - ses.startedAt) / 60000));
    return mins + " minute" + (mins === 1 ? "" : "s") + " today";
  }

  /* ---------- 14 · Level cleared ----------
     No header, no nav, one action. The only gold field in the product; the
     topic's levels below show the one just cleared and the one now open. */
  screens.levelup = function (app) {
    var s = store.get();
    var ses = app.session;
    if (!ses) { app.go("home"); return screens.home(app); }
    var t = store.topicPath(ses.topicKey);
    var nextLevel = t.levels[ses.levelNumber] || null;

    var ladder = el("div", { style: { padding: "24px " + gutter() + "px 0", display: "flex", gap: "var(--space-2)", alignItems: "stretch", flexWrap: "wrap", justifyContent: "center" } });
    t.levels.forEach(function (lv) {
      var here = lv.number === ses.levelNumber;
      var style = {
        flex: "1 0 44px", maxWidth: 72, background: "var(--surface-200)", borderRadius: "var(--radius-md)",
        padding: here ? "10px 6px" : "12px 6px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        color: here ? "var(--celebration-coral-600)" : lv.cleared ? "var(--success-700)" : lv.unlocked ? "var(--ink-900)" : "var(--ink-600)"
      };
      if (here) style.border = "2px solid var(--ink-900)";
      ladder.appendChild(el("span", { style: style },
        icon(here ? "trophy" : lv.cleared ? "check" : lv.unlocked ? "lesson" : "lock", 20),
        el(here ? "span.label" : "span.caption", { style: { color: here || lv.cleared || lv.unlocked ? "var(--ink-900)" : "var(--ink-600)" } }, String(lv.number))));
    });

    return {
      nav: null, onGold: true, chrome: false,
      body: el("div.am-celebrate", {
        style: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 0 }
      },
        AM.CelebrationBanner({
          headline: "Level " + ses.levelNumber,
          sublabel: "Cleared, " + ((s.profile && s.profile.name.split(" ")[0]) || "there"),
          icon: "level-up",
          style: { background: "transparent", boxShadow: "none", paddingBottom: 0 }
        }),
        el("div", { style: { padding: "0 32px", textAlign: "center" } },
          el("div.body-lg", { style: { color: "var(--ink-900)", textWrap: "pretty" } },
            store.CLEAR_TARGET + " right first time in " + ses.levelTitle.toLowerCase() + ". " +
            (nextLevel ? "Level " + nextLevel.number + ", " + nextLevel.title.toLowerCase() + ", is open."
                       : "That was the last level in " + t.label.toLowerCase() + "."))),
        ladder
      ),
      footer: el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 32px", display: "flex", justifyContent: "center" } },
        el("div", { style: { width: "100%", maxWidth: 520 } },
          AM.Button({ label: "Keep going", variant: "inverse", fullWidth: true, cta: true, onClick: function () { app.afterLevelUp(); } })))
    };
  };

  /* ---------- 16 · Session summary ---------- */
  screens.summary = function (app) {
    var r = app.scratch.result;
    if (!r) { app.go("home"); return screens.home(app); }
    var t = store.topicPath(r.topicKey);
    var lv = t.levels.filter(function (x) { return x.id === r.levelId; })[0];
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
    var earned = store.badges().filter(function (b) { return b.earned; }).length;
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
            AM.ProgressBar({ ratio: lv.correct / lv.target, height: 10, color: "var(--skill-" + t.colorKey + "-600)", label: "Level progress" }),
            el("span.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } }, levelNote))),

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
      ], { paddingBottom: 24 }),
      footer: el("div", { style: { flex: "none", padding: "0 " + gutter() + "px 24px", display: "flex", justifyContent: "center" } },
        el("div", { style: { width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 10 } },
          primary,
          AM.Button({ label: "Back to " + t.label.toLowerCase(), variant: "ghost", fullWidth: true, onClick: function () { app.openTopic(r.topicKey); } })))
    };
  };

  /* ---------- 20 · Profile ----------
     The ID card from login, reused. Sign out is a ghost, not the primary. */
  screens.profile = function (app) {
    var s = store.get();
    var p = s.profile || { name: "Ligaya Mendoza", school: "Poblacion, Pilar", colorKey: 2 };
    var earned = store.badges().filter(function (b) { return b.earned; }).length;
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
          stat(s.streakDays, "days in a row"), stat(s.totalCorrect, "right first time")),

        el("div", { style: { padding: "18px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-2)" } },
          sectionLabel("Badges · " + earned + " of 4"),
          AM.BadgeShelf({ badges: store.badges() })),

        el("div", { style: { padding: "16px " + gutter() + "px 0", display: "flex", flexDirection: "column", gap: "var(--space-3)" } },
          sectionLabel("Progress by topic"),
          AM.TopicBars(written.map(function (t) {
            return { label: t.label, correct: t.cleared, total: t.total, caption: t.cleared + " of " + t.total + " levels", color: "var(--skill-" + t.colorKey + "-600)" };
          })),
          el("span.body-sm", { style: { color: "var(--ink-600)" } }, (path.topics.length - written.length) + " more topics coming")),

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
