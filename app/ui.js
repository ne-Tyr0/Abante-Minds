/* Abante Minds — the design system components, as DOM builders.
   Straight ports of the React bundle (components/**), plus the handful of
   patterns the screens use that the system deliberately never made components:
   the answer tile, the keypad, the tier ladder, the status bar, the nav.
   Every colour, radius, and gap comes from a token — there are no literals here
   beyond the pixel sizes the screen document itself specifies. */
(function () {
  "use strict";

  var AM = (window.AM = window.AM || {});
  var icon = AM.icon;

  /* ---------- tiny DOM helper ----------
     el("div.card", {style, onClick, ...}, child, child) — the class shorthand
     keeps the screen files readable next to the design document they mirror. */
  /* CSSOM takes strings: `style.width = 52` is silently dropped, where JSX
     would have written 52px. Numbers get px unless the property is one of the
     unitless ones. */
  var UNITLESS = {
    animationIterationCount: 1, aspectRatio: 1, borderImageOutset: 1, borderImageSlice: 1,
    borderImageWidth: 1, boxFlex: 1, columnCount: 1, flex: 1, flexGrow: 1, flexShrink: 1,
    fillOpacity: 1, fontWeight: 1, gridArea: 1, gridColumn: 1, gridColumnEnd: 1,
    gridColumnStart: 1, gridRow: 1, gridRowEnd: 1, gridRowStart: 1, lineHeight: 1,
    opacity: 1, order: 1, orphans: 1, strokeOpacity: 1, tabSize: 1, widows: 1, zIndex: 1, zoom: 1
  };

  function cssValue(prop, v) {
    if (typeof v !== "number" || UNITLESS[prop]) return String(v);
    return v === 0 ? "0" : v + "px";
  }

  function el(spec, props) {
    var parts = String(spec).split(".");
    var node = document.createElement(parts[0] || "div");
    for (var i = 1; i < parts.length; i++) node.classList.add(parts[i]);

    var p = props || {};
    Object.keys(p).forEach(function (key) {
      var v = p[key];
      if (v === null || v === undefined || v === false) return;
      if (key === "style") {
        if (typeof v === "string") node.style.cssText = v;
        else Object.keys(v).forEach(function (k) {
          if (v[k] === null || v[k] === undefined) return;
          if (k.indexOf("--") === 0) node.style.setProperty(k, String(v[k]));
          else node.style[k] = cssValue(k, v[k]);
        });
      } else if (key === "class" || key === "className") {
        String(v).split(/\s+/).filter(Boolean).forEach(function (c) { node.classList.add(c); });
      } else if (key === "text") {
        node.textContent = v;
      } else if (key === "html") {
        node.innerHTML = v;
      } else if (key === "onClick") {
        node.addEventListener("click", v);
      } else if (key === "dataset") {
        Object.keys(v).forEach(function (k) { node.dataset[k] = v[k]; });
      } else if (key in node && key !== "list" && key !== "type") {
        node[key] = v;
      } else {
        node.setAttribute(key, v === true ? "" : v);
      }
    });

    for (var a = 2; a < arguments.length; a++) append(node, arguments[a]);
    return node;
  }

  function append(parent, child) {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) { child.forEach(function (c) { append(parent, c); }); return; }
    parent.appendChild(child.nodeType ? child : document.createTextNode(String(child)));
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }

  /* ---------- Button ----------
     The one pill-shaped action control, on the shelf press mechanic.
     Amber is primary and appears nowhere else; inverse exists only so the
     celebration can carry an action without amber and gold sharing a screen. */
  var FACES = {
    primary: { "--am-edge": "var(--action-700)", background: "var(--action-500)", color: "var(--action-on)" },
    ghost:   { "--am-edge": "var(--line-200)",   background: "var(--surface-200)", color: "var(--ink-600)" },
    inverse: { "--am-edge": "var(--ink-900)",    background: "var(--surface-200)", color: "var(--ink-900)" }
  };
  var DISABLED = { "--am-edge": "var(--surface-300)", background: "var(--surface-300)", color: "var(--ink-600)" };

  function Button(o) {
    o = o || {};
    var face = o.disabled ? DISABLED : (FACES[o.variant] || FACES.primary);
    var style = {
      display: o.fullWidth ? "flex" : "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "var(--space-2)",
      minHeight: "var(--tap-button)",
      padding: "var(--space-3) var(--space-6)",
      borderRadius: "var(--radius-pill)",
      lineHeight: 1
    };
    if (o.fullWidth) style.width = "100%";
    Object.keys(face).forEach(function (k) { style[k] = face[k]; });
    if (o.style) Object.keys(o.style).forEach(function (k) { style[k] = o.style[k]; });

    return el("button.am-reset.am-pressable.button-label", {
      type: "button",
      disabled: !!o.disabled,
      style: style,
      onClick: o.onClick,
      "data-am-cta": o.cta ? "" : null
    }, o.iconLeft ? icon(o.iconLeft, 20) : null, o.label, o.iconRight ? icon(o.iconRight, 20) : null);
  }

  /* ---------- ProfileCard ----------
     The personalised ID-card moment at login, reused on the profile tab. */
  var SKILL_INK = { 1: "var(--skill-1-600)", 2: "var(--skill-2-600)", 3: "var(--skill-3-600)", 4: "var(--skill-4-600)" };

  function ProfileCard(o) {
    o = o || {};
    var name = o.name || "there";
    var greeting = o.greeting === undefined ? "Hello, " : o.greeting;
    var style = {
      display: "flex", alignItems: "center", gap: "var(--space-4)",
      padding: "var(--space-4)", borderRadius: "var(--radius-md)",
      background: "var(--surface-200)", boxShadow: "var(--shadow-card)", maxWidth: 320
    };
    if (o.style) Object.keys(o.style).forEach(function (k) { style[k] = o.style[k]; });

    return el("div.am-reset", { style: style },
      el("div.heading-sm", {
        style: {
          width: 52, height: 52, borderRadius: "var(--radius-md)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, color: "var(--ink-inverse)",
          background: SKILL_INK[o.colorKey] || SKILL_INK[2], flexShrink: 0
        }
      }, o.iconKey ? icon(o.iconKey, 24) : (o.initial || String(name).slice(0, 1).toUpperCase())),
      el("div", { style: { minWidth: 0 } },
        el("div.heading-sm", { style: { color: "var(--ink-900)" } }, greeting + name),
        o.school ? el("div.body-sm", { style: { color: "var(--ink-600)" } }, o.school) : null
      )
    );
  }

  /* ---------- PracticeHeader ----------
     The calm-mode strip above a question: tier, progress, count. The fill is a
     bare span so motion.css can scale it instead of resizing it. */
  function PracticeHeader(o) {
    o = o || {};
    var total = o.questionTotal || 0;
    var ratio = total ? Math.max(0, Math.min(1, o.questionIndex / total)) : 0;
    /* --am-fill carries the value itself, so the bar is right the moment it is
       parsed. motion.js's upgradeFills() would zero it and restore it on a
       double rAF, which never arrives in a background tab. */
    var fill = el("span", {
      style: { display: "block", height: "100%", borderRadius: "var(--radius-pill)", background: "var(--brand-blue-600)", "--am-fill": ratio },
      dataset: { amFill: ratio }
    });

    var header = el("div.am-reset", {
      style: {
        display: "flex", alignItems: "center", gap: "var(--space-4)",
        padding: "var(--space-4) var(--space-6)",
        background: "var(--surface-100)", borderBottom: "1px solid var(--line-200)",
        flex: "none"
      }
    },
      el("span.caption", {
        style: {
          display: "inline-flex", alignItems: "center", gap: "var(--space-1)",
          padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)",
          background: "var(--brand-blue-100)", color: "var(--brand-blue-600)", whiteSpace: "nowrap"
        }
      }, o.tier || "Tier 1"),
      el("div.am-practice-header-track", {
        role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100",
        "aria-label": "Questions answered",
        style: { flex: 1, height: 8, borderRadius: "var(--radius-pill)", background: "var(--surface-300)", overflow: "hidden" }
      }, fill),
      el("span.body-sm", { style: { color: "var(--ink-600)", whiteSpace: "nowrap" } }, o.questionIndex + " / " + total)
    );
    return header;
  }

  /* ---------- SkillCard ----------
     One colour-coded tile in the topic picker. Hue is topic identity only. */
  var SKILL = {
    1: { face: "var(--skill-1-100)", edge: "var(--skill-1-600)" },
    2: { face: "var(--skill-2-100)", edge: "var(--skill-2-600)" },
    3: { face: "var(--skill-3-100)", edge: "var(--skill-3-600)" },
    4: { face: "var(--skill-4-100)", edge: "var(--skill-4-600)" }
  };

  function SkillCard(o) {
    o = o || {};
    var c = SKILL[o.colorKey] || SKILL[1];
    var style = {
      "--am-depth": "var(--press-depth-lg)",
      "--am-edge": o.locked ? "var(--surface-300)" : c.edge,
      display: "flex", flexDirection: "column", gap: "var(--space-2)",
      width: 148, minHeight: 148, padding: "var(--space-4)",
      borderRadius: "var(--radius-md)", textAlign: "left",
      background: o.locked ? "var(--surface-300)" : c.face,
      color: o.locked ? "var(--ink-600)" : "var(--ink-900)"
    };
    if (o.selected) style["--am-edge"] = "var(--ink-900)";
    if (o.style) Object.keys(o.style).forEach(function (k) { style[k] = o.style[k]; });

    var bar = null;
    if (typeof o.progress === "number") {
      bar = el("span.am-skill-card-progress", {
        style: { display: "block", height: 6, borderRadius: "var(--radius-pill)", background: "var(--surface-200)", overflow: "hidden" }
      }, el("span", {
        style: { display: "block", height: "100%", borderRadius: "var(--radius-pill)", background: c.edge, "--am-fill": Math.max(0, Math.min(1, o.progress)) },
        dataset: { amFill: Math.max(0, Math.min(1, o.progress)) }
      }));
    }

    return el("button.am-reset.am-pressable", {
      type: "button", disabled: !!o.locked, style: style, onClick: o.onClick,
      "aria-pressed": o.selected ? "true" : "false"
    },
      el("span", {
        style: {
          width: 36, height: 36, borderRadius: "var(--radius-sm)",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--surface-200)", color: o.locked ? "var(--ink-600)" : c.edge
        }
      }, icon(o.locked ? "lock" : (o.icon || "calculator"), 20)),
      el("span.label", { style: { flex: 1 } }, o.label || "Skill area"),
      bar
    );
  }

  /* ---------- CelebrationBanner ----------
     The full-screen reward moment, and the only gold field in the product. */
  function CelebrationBanner(o) {
    o = o || {};
    var style = {
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: "var(--space-2)", textAlign: "center",
      padding: "var(--space-12) var(--space-6)", borderRadius: "var(--radius-md)",
      background: "var(--celebration-gold-500)", color: "var(--ink-900)"
    };
    if (o.style) Object.keys(o.style).forEach(function (k) { style[k] = o.style[k]; });

    return el("div.am-reset", { style: style },
      el("div", {
        dataset: { amBadge: "" },
        style: {
          width: 64, height: 64, borderRadius: "50%",
          background: "var(--surface-200)", color: "var(--celebration-coral-600)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "var(--space-2)"
        }
      }, icon(o.icon || "streak", 32)),
      el("div.celebration-display", null, o.headline || "Streak!"),
      o.sublabel ? el("div.celebration-heading", null, o.sublabel) : null,
      o.actionLabel ? el("div", { style: { marginTop: "var(--space-6)" } },
        Button({ label: o.actionLabel, variant: "inverse", onClick: o.onAction, cta: true })) : null
    );
  }

  /* ---------- Patterns ----------
     Not components: the design document is explicit that the answer tile and
     the keypad are patterns, so they live with the app, not the system. */

  var TILE_FACES = {
    idle:     { bg: "var(--surface-200)",    edge: "var(--line-200)",       ink: "var(--ink-900)" },
    selected: { bg: "var(--brand-blue-100)", edge: "var(--brand-blue-600)", ink: "var(--ink-900)" },
    correct:  { bg: "var(--success-100)",    edge: "var(--success-700)",    ink: "var(--success-700)" },
    wrong:    { bg: "var(--danger-100)",     edge: "var(--danger-700)",     ink: "var(--danger-700)" }
  };

  function AnswerTile(o) {
    var face = TILE_FACES[o.state] || TILE_FACES.idle;
    return el("button.am-reset.am-pressable.am-answer-tile.heading-md", {
      type: "button", onClick: o.onClick, disabled: !!o.disabled,
      dataset: { state: o.state },
      "aria-pressed": o.state === "selected" ? "true" : "false",
      style: {
        "--am-edge": face.edge, background: face.bg, color: face.ink,
        borderRadius: "var(--radius-sm)", minHeight: o.tall ? 76 : "var(--tap-button)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)"
      }
    }, el("span", null, o.text),
       o.state === "correct" ? icon("check", 22, { glyph: true }) : null,
       o.state === "wrong" ? icon("x", 22, { glyph: true }) : null);
  }

  /* The keypad is the only way into a computation answer: no options, no
     calculator. Delete is a word rather than a glyph — the subset has no
     backspace and the rule is not to invent one. */
  function Keypad(o) {
    var keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "Delete"];
    var grid = el("div.am-keypad", {
      style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "var(--space-2)" }
    });
    keys.forEach(function (k) {
      var isDelete = k === "Delete";
      grid.appendChild(el("button.am-reset.am-pressable" + (isDelete ? ".label" : ".heading-md"), {
        type: "button",
        "aria-label": isDelete ? "Delete last digit" : k,
        onClick: function () { isDelete ? o.onDelete() : o.onPress(k); },
        style: {
          "--am-edge": "var(--line-200)", background: "var(--surface-200)",
          color: isDelete ? "var(--ink-600)" : "var(--ink-900)",
          borderRadius: "var(--radius-sm)", height: o.tall ? 56 : 52,
          display: "flex", alignItems: "center", justifyContent: "center"
        }
      }, k));
    });
    return grid;
  }

  /* The answer field. The caret is a painted rule, not a real input: the value
     only ever arrives through the keypad or a hardware keyboard. */
  function AnswerField(o) {
    return el("div.am-answer-field", {
      role: "status", "aria-live": "polite",
      "aria-label": "Your answer: " + (o.value || "empty"),
      style: {
        height: o.tall ? 76 : 64,
        border: "2px solid " + (o.active ? "var(--brand-blue-600)" : "var(--line-200)"),
        borderRadius: "var(--radius-sm)", background: "var(--surface-200)",
        display: "flex", alignItems: "center", gap: "var(--space-2)",
        padding: o.tall ? "0 20px" : "0 var(--space-4)"
      }
    },
      o.prefix ? el(o.tall ? "span.heading-lg" : "span.heading-md", { style: { color: "var(--ink-600)" } }, o.prefix) : null,
      el("span.heading-lg", null, o.value || ""),
      el("span.am-caret", { style: { width: 2, height: o.tall ? 32 : 28, background: "var(--brand-blue-600)" } })
    );
  }

  function ProgressBar(o) {
    var height = o.height || 8;
    var style = { display: "block", height: height, borderRadius: "var(--radius-pill)", background: "var(--surface-300)", overflow: "hidden" };
    /* Inside a flex row the track has to claim the space itself, or it
       collapses to nothing between the chip and the count. */
    if (o.flex) style.flex = 1;
    var track = el("span", { style: style });
    if (o.ratio > 0) {
      track.appendChild(el("span.am-fill", {
        style: { display: "block", height: "100%", borderRadius: "var(--radius-pill)", background: o.color || "var(--brand-blue-600)", "--am-fill": Math.max(0, Math.min(1, o.ratio)) },
        dataset: { amFill: Math.max(0, Math.min(1, o.ratio)) }
      }));
    }
    if (o.label) {
      track.setAttribute("role", "progressbar");
      track.setAttribute("aria-label", o.label);
      track.setAttribute("aria-valuemin", "0");
      track.setAttribute("aria-valuemax", "100");
      track.setAttribute("aria-valuenow", Math.round((o.ratio || 0) * 100));
    }
    return track;
  }

  /* Tier ladder — four rungs: cleared, current, locked, and the trophy at the
     top. The current rung is the only one that carries an edge. */
  function TierLadder(o) {
    var current = o.current || 1;
    var lockedBg = o.lockedBackground || "var(--surface-200)";
    var row = el("span", { style: { display: "flex", gap: "var(--space-2)" } });
    [1, 2, 3, 4].forEach(function (n) {
      var cleared = n < current;
      var here = n === current;
      var glyph = cleared ? "check" : here ? "lesson" : n === 4 ? "trophy" : "lock";
      var style = {
        flex: 1, borderRadius: "var(--radius-md)",
        padding: here ? "10px 6px" : "12px 6px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-1)"
      };
      if (cleared) { style.background = "var(--brand-blue-600)"; style.color = "var(--ink-inverse)"; }
      else if (here) { style.background = "var(--brand-blue-100)"; style.border = "2px solid var(--brand-blue-600)"; style.color = "var(--brand-blue-600)"; }
      else { style.background = lockedBg; style.color = "var(--ink-600)"; }

      row.appendChild(el("span", { style: style },
        icon(glyph, 20),
        el(here ? "span.label" : "span.caption", { style: here ? { color: "var(--ink-900)" } : null }, String(n))
      ));
    });
    return row;
  }

  /* Seven blocks, one per day of the week. A reset day is a dashed outline
     rather than a red block: the app does not perform disappointment. */
  function StreakWeek(o) {
    var row = el("span", { style: { display: "flex", gap: o.gap || 6 } });
    for (var i = 0; i < 7; i++) {
      var style = { flex: 1, height: o.height || 38, borderRadius: o.radius || "var(--radius-sm)" };
      if (i < o.days) style.background = "var(--brand-blue-600)";
      else if (i === o.days && o.resetToday) style.border = "2px dashed var(--line-200)";
      else style.background = "var(--surface-300)";
      row.appendChild(el("span", { style: style }));
    }
    return row;
  }

  function BadgeShelf(o) {
    var lockedBg = o.lockedBackground || "var(--surface-200)";
    var row = el("span", { style: { display: "flex", gap: "var(--space-2)" } });
    o.badges.forEach(function (b) {
      var style = {
        flex: 1, borderRadius: "var(--radius-md)", padding: "10px 4px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-1)",
        background: b.earned ? (b.face || "var(--brand-blue-100)") : lockedBg,
        color: b.earned ? (b.ink || "var(--brand-blue-600)") : "var(--ink-600)"
      };
      row.appendChild(el("span", { style: style },
        icon(b.earned ? b.icon : "lock", 20),
        el("span.caption", { style: { color: b.earned ? "var(--ink-900)" : "var(--ink-600)", textAlign: "center" } }, b.label)
      ));
    });
    return row;
  }

  function TopicBars(topics, o) {
    o = o || {};
    var wrap = el("div", { style: { display: "flex", flexDirection: "column", gap: o.gap || "var(--space-3)" } });
    topics.forEach(function (t) {
      wrap.appendChild(el("span", { style: { display: "flex", flexDirection: "column", gap: 6 } },
        el("span", { style: { display: "flex", justifyContent: "space-between", gap: "var(--space-2)" } },
          el("span.label", null, t.label),
          el("span.caption", { style: { color: "var(--ink-600)" } }, t.correct + " of " + t.total)
        ),
        ProgressBar({ ratio: t.correct / t.total, color: t.color, height: o.height || 8, label: t.label + " progress" })
      ));
    });
    return wrap;
  }

  /* The phone chrome. Purely decorative, so it is hidden from the reader. */
  function StatusBar(o) {
    o = o || {};
    var ink = o.onGold ? "var(--ink-900)" : "var(--line-200)";
    var pip = function (w, hollow) {
      return el("span", {
        style: hollow
          ? { width: w, height: 8, borderRadius: 2, border: "1px solid " + ink }
          : { width: w, height: 8, borderRadius: 2, background: ink }
      });
    };
    /* A desktop window keeps the clock and drops the phone pips. */
    return el("div.am-statusbar", { "aria-hidden": "true",
      style: {
        height: o.minimal ? 32 : 28, flex: "none", display: "flex", alignItems: "center",
        justifyContent: o.minimal ? "flex-end" : "space-between",
        padding: o.minimal ? "0 var(--space-12)" : "0 var(--space-4)"
      }
    },
      el("span.caption", { style: { color: o.onGold ? "var(--ink-900)" : "var(--ink-600)" } }, o.time || "9:41"),
      o.minimal ? null : el("span", { style: { display: "flex", gap: "var(--space-1)", alignItems: "center" } },
        pip(14), pip(8, !!o.offline), pip(18))
    );
  }

  var NAV_ITEMS = [
    { key: "home", icon: "home", label: "Home" },
    { key: "practice", icon: "lesson", label: "Practice" },
    { key: "profile", icon: "profile", label: "Profile" }
  ];

  function BottomNav(active, onNavigate) {
    var nav = el("nav.am-bottomnav", { "aria-label": "Main",
      style: {
        flex: "none", display: "flex", background: "var(--surface-200)",
        borderTop: "1px solid var(--line-200)"
      }
    });
    NAV_ITEMS.forEach(function (item) {
      var on = item.key === active;
      nav.appendChild(el("button.am-reset.am-navitem", {
        type: "button",
        "aria-current": on ? "page" : null,
        onClick: function () { onNavigate(item.key); },
        style: {
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 2, border: 0, background: "none", cursor: "pointer",
          color: on ? "var(--brand-blue-600)" : "var(--ink-600)"
        }
      }, icon(item.icon, 22), el("span.caption", null, item.label)));
    });
    return nav;
  }

  /* On desktop the bottom nav becomes a left rail — there is no thumb at the
     bottom of a desktop screen. */
  function SideRail(active, onNavigate, footer) {
    var rail = el("nav.am-rail", { "aria-label": "Main" },
      el("span.am-rail-brand", null,
        el("img", { src: "assets/abante-minds-mark.png", alt: "", width: 40, height: 40, style: { objectFit: "contain" } }),
        el("span.am-wordmark", null, "Abante Minds")
      )
    );
    var list = el("span", { style: { display: "flex", flexDirection: "column", gap: "var(--space-2)" } });
    NAV_ITEMS.forEach(function (item) {
      var on = item.key === active;
      list.appendChild(el("button.am-reset.am-railitem", {
        type: "button",
        "aria-current": on ? "page" : null,
        onClick: function () { onNavigate(item.key); },
        style: {
          display: "flex", alignItems: "center", gap: "var(--space-3)",
          padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-pill)",
          border: 0, cursor: "pointer", textAlign: "left",
          background: on ? "var(--brand-blue-100)" : "transparent",
          color: on ? "var(--brand-blue-600)" : "var(--ink-600)"
        }
      }, icon(item.icon, 22), el("span.label", { style: on ? { color: "var(--ink-900)" } : null }, item.label)));
    });
    rail.appendChild(list);
    rail.appendChild(el("span", { style: { flex: 1 } }));
    if (footer) rail.appendChild(footer);
    return rail;
  }

  function Card(props) {
    var style = {
      background: "var(--surface-200)", borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-card)", padding: "var(--space-4)",
      display: "flex", flexDirection: "column", gap: "var(--space-3)"
    };
    if (props && props.style) Object.keys(props.style).forEach(function (k) { style[k] = props.style[k]; });
    var node = el("div.am-card", { style: style });
    for (var i = 1; i < arguments.length; i++) append(node, arguments[i]);
    return node;
  }

  /* A pill that states a fact — streak, tier, topic. Never an action. */
  function Chip(o) {
    return el("span.caption", {
      style: {
        display: "inline-flex", alignItems: "center", gap: o.gap || "var(--space-2)",
        padding: o.large ? "8px 14px" : "var(--space-1) var(--space-3)",
        borderRadius: "var(--radius-pill)",
        background: o.background || "var(--brand-blue-100)",
        color: o.color || "var(--brand-blue-600)",
        whiteSpace: "nowrap"
      }
    }, o.icon ? icon(o.icon, o.large ? 20 : 14) : null,
       el(o.large ? "span.label" : "span", null, o.label));
  }

  AM.el = el;
  AM.append = append;
  AM.clear = clear;
  AM.Button = Button;
  AM.ProfileCard = ProfileCard;
  AM.PracticeHeader = PracticeHeader;
  AM.SkillCard = SkillCard;
  AM.CelebrationBanner = CelebrationBanner;
  AM.AnswerTile = AnswerTile;
  AM.AnswerField = AnswerField;
  AM.Keypad = Keypad;
  AM.ProgressBar = ProgressBar;
  AM.TierLadder = TierLadder;
  AM.StreakWeek = StreakWeek;
  AM.BadgeShelf = BadgeShelf;
  AM.TopicBars = TopicBars;
  AM.StatusBar = StatusBar;
  AM.BottomNav = BottomNav;
  AM.SideRail = SideRail;
  AM.Card = Card;
  AM.Chip = Chip;
})();
