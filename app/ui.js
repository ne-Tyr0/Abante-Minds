/* Abante Minds — the design system components, as DOM builders.
   Straight ports of the React bundle (components/**), plus the handful of
   patterns the screens use that the system deliberately never made components:
   the answer tile, the keypad, the status bar, the nav.
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
  var SKILL_INK = { 1: "var(--skill-1-bright)", 2: "var(--skill-2-bright)", 3: "var(--skill-3-bright)", 4: "var(--skill-4-bright)" };

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
     The calm-mode strip above a question: level, progress, count. The fill is a
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
      /* Leaving: the round's own way out, which asks first (screens.js). */
      o.onClose ? el("button.am-reset.am-close", { type: "button", "aria-label": o.closeLabel || "Leave this round", onClick: o.onClose }, icon("x", 22)) : null,
      el("span.caption" + (o.clock ? ".am-exam-clock" : ""), {
        role: o.clock ? "timer" : null,
        style: {
          display: "inline-flex", alignItems: "center", gap: "var(--space-1)",
          padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)",
          background: "var(--brand-blue-100)", color: "var(--brand-blue-600)", whiteSpace: "nowrap",
          fontVariantNumeric: o.clock ? "tabular-nums" : null
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

  /* An option to tap: words, or a picture with its letter under it. A
     picture's words name it for a screen reader. */
  function AnswerTile(o) {
    var face = TILE_FACES[o.state] || TILE_FACES.idle;
    var mark = el("span", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)" } },
      el("span", null, o.text),
      o.state === "correct" ? icon("check", 22, { glyph: true }) : null,
      o.state === "wrong" ? icon("x", 22, { glyph: true }) : null);
    return el("button.am-reset.am-pressable.am-answer-tile.heading-md", {
      type: "button", onClick: o.onClick, disabled: !!o.disabled,
      dataset: { state: o.state },
      "aria-pressed": o.state === "selected" ? "true" : "false",
      "aria-label": o.figure ? "Picture " + o.text + ". " + o.figure.text : null,
      style: {
        "--am-edge": face.edge, background: face.bg, color: face.ink,
        borderRadius: "var(--radius-sm)", minHeight: o.tall ? 76 : "var(--tap-button)",
        display: "flex", flexDirection: o.figure ? "column" : "row", alignItems: o.figure ? "stretch" : "center",
        justifyContent: "center", gap: "var(--space-2)", padding: o.figure ? "var(--space-2)" : null
      }
    }, o.figure ? el("span", { "aria-hidden": "true", style: { display: "block", width: "100%", maxWidth: 240, margin: "0 auto" } }, figureParts(o.figure)) : null, mark);
  }

  /* The keypad is the only way into a computation answer: no options, no
     calculator. Delete is a word rather than a glyph — the subset has no
     backspace and the rule is not to invent one. */
  /* A fraction has no decimal point, so its keypad trades the point for a
     Next key that moves from box to box. */
  function Keypad(o) {
    var boxes = o.kind === "fraction" || o.kind === "mixed" || o.kind === "time";
    var keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", boxes ? "Next" : ".", "0", "Delete"];
    var grid = el("div.am-keypad", {
      style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "var(--space-2)" }
    });
    keys.forEach(function (k) {
      var isDelete = k === "Delete", isNext = k === "Next", isWord = isDelete || isNext;
      grid.appendChild(el("button.am-reset.am-pressable" + (isWord ? ".label" : ".heading-md"), {
        type: "button",
        "aria-label": isDelete ? "Delete last digit" : isNext ? "Next box" : k,
        onClick: function () { isDelete ? o.onDelete() : isNext ? o.onNext() : o.onPress(k); },
        style: {
          "--am-edge": "var(--line-200)", background: "var(--surface-200)",
          color: isWord ? "var(--ink-600)" : "var(--ink-900)",
          borderRadius: "var(--radius-sm)", height: o.tall ? 56 : 52,
          display: "flex", alignItems: "center", justifyContent: "center"
        }
      }, k));
    });
    return grid;
  }

  /* The answer field. The caret is a painted rule, not a real input: the value
     only ever arrives through the keypad or a hardware keyboard. */
  /* The answer as typed. A number is one line with a caret; a fraction is a
     numerator box over a denominator box, with a whole-number box beside them
     for a mixed number. Each box is a full tap target and the one being typed
     into carries the caret and the blue edge. A prefix (the peso sign) sits
     before the answer and a suffix (%, a unit, pi) after it. */
  var BOX_NAMES = { whole: "Whole number", num: "Numerator", den: "Denominator", hour: "Hours", minute: "Minutes" };

  function AnswerField(o) {
    var e = o.entry;
    var active = !AM.entry.isEmpty(e);
    var affix = function (text) {
      return text ? el(o.tall ? "span.heading-lg" : "span.heading-md", { style: { color: "var(--ink-600)", whiteSpace: "pre" } }, text) : null;
    };
    var caret = function () {
      return el("span.am-caret", { style: { width: 2, height: o.tall ? 32 : 28, background: "var(--brand-blue-600)" } });
    };

    if (e.kind === "number") {
      return el("div.am-answer-field", {
        role: "status", "aria-live": "polite",
        "aria-label": "Your answer: " + (e.parts.value ? (o.prefix || "") + e.parts.value + (o.suffix || "") : "empty"),
        style: {
          height: o.tall ? 76 : 64,
          border: "2px solid " + (active ? "var(--brand-blue-600)" : "var(--line-200)"),
          borderRadius: "var(--radius-sm)", background: "var(--surface-200)",
          display: "flex", alignItems: "center", gap: "var(--space-2)",
          padding: o.tall ? "0 20px" : "0 var(--space-4)"
        }
      },
        affix(o.prefix),
        el("span.heading-lg", null, e.parts.value),
        caret(),
        e.parts.value ? affix(o.suffix) : null
      );
    }

    function box(name) {
      var on = e.box === name, value = e.parts[name];
      return el("button.am-reset.am-answer-box.heading-lg", {
        type: "button",
        "aria-label": BOX_NAMES[name] + ", " + (value || "empty"),
        "aria-pressed": on ? "true" : "false",
        onClick: function () { if (o.onFocusBox) o.onFocusBox(name); },
        style: {
          minWidth: 56, height: 48, padding: "0 var(--space-2)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 2,
          border: "2px " + (value || on ? "solid " : "dashed ") + (on ? "var(--brand-blue-600)" : "var(--line-200)"),
          borderRadius: "var(--radius-sm)", background: "var(--surface-100)",
          color: "var(--ink-900)", cursor: "pointer"
        }
      }, value, on ? caret() : null);
    }

    /* A clock time reads across: hours, a colon, minutes. */
    if (e.kind === "time") {
      return el("div.am-answer-field", {
        role: "group",
        "aria-label": "Your answer: " + (active ? AM.entry.text(e) : "empty"),
        style: {
          border: "2px solid " + (active ? "var(--brand-blue-600)" : "var(--line-200)"),
          borderRadius: "var(--radius-sm)", background: "var(--surface-200)",
          display: "flex", alignItems: "center", gap: "var(--space-2)",
          padding: "var(--space-2) " + (o.tall ? "20px" : "var(--space-4)")
        }
      },
        box("hour"),
        el("span.heading-lg", { "aria-hidden": "true", style: { color: "var(--ink-900)" } }, ":"),
        box("minute"),
        affix(o.suffix)
      );
    }

    var stacked = el("span", { style: { display: "inline-flex", flexDirection: "column", alignItems: "stretch", gap: 4 } },
      box("num"),
      el("span", { "aria-hidden": "true", style: { height: 3, borderRadius: 2, background: "var(--ink-900)" } }),
      box("den"));

    return el("div.am-answer-field", {
      role: "group",
      "aria-label": "Your answer: " + (active ? (o.prefix || "") + AM.entry.text(e) + (o.suffix || "") : "empty"),
      style: {
        border: "2px solid " + (active ? "var(--brand-blue-600)" : "var(--line-200)"),
        borderRadius: "var(--radius-sm)", background: "var(--surface-200)",
        display: "flex", alignItems: "center", gap: "var(--space-3)",
        padding: "var(--space-2) " + (o.tall ? "20px" : "var(--space-4)")
      }
    },
      affix(o.prefix),
      e.kind === "mixed" ? box("whole") : null,
      stacked,
      affix(o.suffix)
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

  function TopicBars(topics, o) {
    o = o || {};
    var wrap = el("div", { style: { display: "flex", flexDirection: "column", gap: o.gap || "var(--space-3)" } });
    topics.forEach(function (t) {
      wrap.appendChild(el("span", { style: { display: "flex", flexDirection: "column", gap: 6 } },
        el("span", { style: { display: "flex", justifyContent: "space-between", gap: "var(--space-2)" } },
          el("span.label", null, t.label),
          el("span.caption", { style: { color: "var(--ink-600)" } }, t.caption || t.correct + " of " + t.total)
        ),
        ProgressBar({ ratio: t.correct / t.total, color: t.color, height: o.height || 8, label: t.label + " progress" })
      ));
    });
    return wrap;
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

  /* ---------- FactGrid ----------
     A fact table, such as the times table: the numbers along the top and
     down the side, and in each cell its answer, shaded by how well the
     learner knows that fact. Mastered is a solid cell in the topic's hue,
     being learnt a light one, not yet met a plain one; the legend says so in
     words, and so does each cell's label, so the shade is never the only
     signal. Rows are flex rows so a screen reader reads it as a table. */
  function FactGrid(o) {
    var g = o.grid;
    var hue = "var(--skill-" + o.colorKey + "-600)", light = "var(--skill-" + o.colorKey + "-100)";
    var LOOK = {
      mastered: { background: hue, color: "var(--ink-inverse)", fontWeight: 700 },
      learning: { background: light, color: "var(--ink-900)" },
      fresh: { background: "var(--surface-100)", color: "var(--ink-600)" }
    };
    var WORD = { mastered: "mastered", learning: "being learnt", fresh: "not yet practised" };
    function cell(text, look, role, label) {
      var style = { flex: "1 1 0", minWidth: 0, aspectRatio: "1", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" };
      Object.keys(look || {}).forEach(function (k) { style[k] = look[k]; });
      return el("span.am-fact-cell", { role: role, "aria-label": label || null, style: style }, text);
    }
    var head = el("div", { role: "row", style: { display: "flex", gap: 2 } },
      cell(g.sign, { color: "var(--ink-600)" }, "columnheader", g.sign));
    g.values.forEach(function (v) { head.appendChild(cell(String(v), { color: "var(--ink-600)", fontWeight: 700 }, "columnheader")); });
    var table = el("div.am-fact-grid", { role: "table", "aria-label": g.title, style: { display: "flex", flexDirection: "column", gap: 2 } }, head);
    g.values.forEach(function (x) {
      var row = el("div", { role: "row", style: { display: "flex", gap: 2 } },
        cell(String(x), { color: "var(--ink-600)", fontWeight: 700 }, "rowheader"));
      g.values.forEach(function (y) {
        var key = g.cells[x + "," + y];
        var answer = g.sign === "×" ? x * y : x + y;
        var state = key ? o.state(key) : null;
        row.appendChild(state
          ? cell(String(answer), LOOK[state], "cell", x + " " + g.sign + " " + y + " = " + answer + ", " + WORD[state])
          : cell("", null, "cell", x + " " + g.sign + " " + y + ", not in this course"));
      });
      table.appendChild(row);
    });
    var legend = el("span", { style: { display: "flex", gap: "var(--space-3)", flexWrap: "wrap" } });
    ["mastered", "learning", "fresh"].forEach(function (k) {
      legend.appendChild(el("span.caption", { style: { display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink-600)" } },
        el("span", { "aria-hidden": "true", style: { width: 14, height: 14, borderRadius: 4, background: LOOK[k].background, boxShadow: "inset 0 0 0 1px var(--line-200)" } }),
        WORD[k].charAt(0).toUpperCase() + WORD[k].slice(1)));
    });
    /* Past phone width the cells would only grow; 480px keeps 144 readable
       without the table taking over a desktop page. */
    return el("div", { style: { display: "flex", flexDirection: "column", gap: "var(--space-3)", width: "100%", maxWidth: 480 } }, table, legend);
  }

  /* ---------- Chart ----------
     The graph or table that comes with a question; content.js works out its
     numbers (renderChart). A graph is SVG in a fixed 320-wide box that scales
     with the column, so a phone and a desktop see the same picture, and its
     accessible name is the whole data in words. A table is a real table.
     Two series differ in more than colour: the second is striped in a bar
     graph and dashed with square points in a line graph. A pie's slices carry
     their labels, and the key beside it lists them clockwise from the top. */
  var SVG_NS = "http://www.w3.org/2000/svg";
  var SERIES_INK = ["var(--brand-blue-600)", "var(--skill-4-600)"];
  var SLICE_INK = ["var(--brand-blue-600)", "var(--skill-4-600)", "var(--skill-2-600)",
    "var(--skill-3-600)", "var(--skill-1-600)", "var(--ink-600)"];
  var chartCount = 0;

  function svg(tag, attrs, kids) {
    var node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (k) {
      if (k) node.appendChild(typeof k === "string" ? document.createTextNode(k) : k);
    });
    return node;
  }
  function label(x, y, text, o) {
    o = o || {};
    return svg("text", {
      x: x, y: y, "text-anchor": o.anchor || "start", "font-size": o.size || 11,
      style: "fill: " + (o.ink || "var(--ink-600)") + (o.bold ? "; font-weight: 700" : "")
    }, [text]);
  }
  function seriesFill(si, id) { return si ? "url(#" + id + ")" : SERIES_INK[0]; }
  /* A sample of a series, for the key: a swatch of a bar, or a stretch of
     line with its point. */
  function seriesMark(kind, si, id) {
    if (kind === "bar") {
      return svg("svg", { width: 16, height: 16, viewBox: "0 0 16 16", "aria-hidden": "true" },
        [svg("rect", { x: 1, y: 1, width: 14, height: 14, style: "fill: " + seriesFill(si, id) })]);
    }
    return svg("svg", { width: 28, height: 16, viewBox: "0 0 28 16", "aria-hidden": "true" }, [
      svg("line", { x1: 1, x2: 27, y1: 8, y2: 8, style: "stroke: " + SERIES_INK[si] + "; stroke-width: 2.5" + (si ? "; stroke-dasharray: 6 4" : "") }),
      si ? svg("rect", { x: 10, y: 4, width: 8, height: 8, style: "fill: " + SERIES_INK[1] })
        : svg("circle", { cx: 14, cy: 8, r: 4.5, style: "fill: " + SERIES_INK[0] })
    ]);
  }
  function keyItem(mark, text) {
    return el("span.caption", { style: { display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink-900)" } }, mark, text);
  }

  function axisChart(c, id) {
    var W = 320, H = 204, T = 24, B = 22, R = 8;
    var longest = Math.max.apply(null, c.ticks.map(function (k) { return k.label.length; }));
    var L = Math.round(longest * 6.6 + 12);
    var plotW = W - L - R, plotH = H - T - B, n = c.categories.length, gw = plotW / n;
    function y(v) { return T + plotH - (v / c.top) * plotH; }
    function x(i) { return L + gw * (i + 0.5); }
    var root = svg("svg", { viewBox: "0 0 " + W + " " + H, width: "100%", focusable: "false", "aria-hidden": "true" });
    root.style.display = "block";
    root.style.overflow = "visible";
    root.appendChild(svg("defs", {}, [svg("pattern", { id: id, width: 6, height: 6, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, [
      svg("rect", { width: 6, height: 6, style: "fill: " + SERIES_INK[1] }),
      svg("line", { x1: 1, y1: 0, x2: 1, y2: 6, style: "stroke: var(--surface-200); stroke-width: 2; stroke-opacity: 0.6" })
    ])]));
    root.appendChild(label(0, 12, c.axis));
    c.ticks.forEach(function (k) {
      root.appendChild(svg("line", { x1: L, x2: W - R, y1: y(k.value), y2: y(k.value), style: "stroke: var(--surface-300); stroke-width: 1" }));
      root.appendChild(label(L - 6, y(k.value) + 4, k.label, { anchor: "end" }));
    });
    var two = c.series.length > 1;
    if (c.kind === "bar") {
      var bw = two ? Math.min(gw * 0.34, 26) : Math.min(gw * 0.5, 36);
      c.series.forEach(function (s, si) {
        s.values.forEach(function (v, i) {
          if (v <= 0) return;
          var left = two ? x(i) - bw + si * bw : x(i) - bw / 2;
          root.appendChild(svg("rect", { x: left, y: y(v), width: bw, height: y(0) - y(v), style: "fill: " + seriesFill(si, id) }));
        });
      });
    } else {
      c.series.forEach(function (s, si) {
        var pts = s.values.map(function (v, i) { return [x(i), y(v)]; });
        root.appendChild(svg("polyline", {
          points: pts.map(function (p) { return p[0] + "," + p[1]; }).join(" "),
          style: "fill: none; stroke: " + SERIES_INK[si] + "; stroke-width: 2.5; stroke-linejoin: round" + (si ? "; stroke-dasharray: 6 4" : "")
        }));
        pts.forEach(function (p) {
          root.appendChild(si
            ? svg("rect", { x: p[0] - 4, y: p[1] - 4, width: 8, height: 8, style: "fill: " + SERIES_INK[1] })
            : svg("circle", { cx: p[0], cy: p[1], r: 4.5, style: "fill: " + SERIES_INK[0] }));
        });
      });
    }
    root.appendChild(svg("line", { x1: L, x2: L, y1: T - 6, y2: y(0), style: "stroke: var(--line-200); stroke-width: 1.5" }));
    root.appendChild(svg("line", { x1: L, x2: W - R, y1: y(0), y2: y(0), style: "stroke: var(--line-200); stroke-width: 1.5" }));
    c.categories.forEach(function (cat, i) { root.appendChild(label(x(i), H - 6, cat, { anchor: "middle", ink: "var(--ink-900)" })); });
    var key = two ? el("div", { style: { display: "flex", gap: "var(--space-4)", flexWrap: "wrap", justifyContent: "center" } },
      c.series.map(function (s, si) { return keyItem(seriesMark(c.kind, si, id), s.name); })) : null;
    return [root, key];
  }

  function pieChart(c) {
    var r = 96, cx = 100, cy = 100, total = 0, a = -Math.PI / 2;
    c.slices.forEach(function (s) { total += s.value; });
    var root = svg("svg", { viewBox: "0 0 200 200", width: "100%", focusable: "false", "aria-hidden": "true" });
    root.style.display = "block";
    root.style.maxWidth = "190px";
    root.style.margin = "0 auto";
    function at(angle, radius) { return (cx + radius * Math.cos(angle)).toFixed(2) + " " + (cy + radius * Math.sin(angle)).toFixed(2); }
    c.slices.forEach(function (s, i) {
      var sweep = s.value / total * 2 * Math.PI, end = a + sweep, mid = a + sweep / 2;
      root.appendChild(svg("path", {
        d: "M" + cx + " " + cy + " L" + at(a, r) + " A" + r + " " + r + " 0 " + (sweep > Math.PI ? 1 : 0) + " 1 " + at(end, r) + " Z",
        style: "fill: " + SLICE_INK[i] + "; stroke: var(--surface-200); stroke-width: 2; stroke-linejoin: round"
      }));
      var p = at(mid, r * 0.62).split(" ");
      root.appendChild(label(p[0], +p[1] + 5, s.hidden ? "?" : s.label, { anchor: "middle", size: 14, bold: true, ink: "var(--ink-inverse)" }));
      a = end;
    });
    var key = el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "var(--space-2) var(--space-4)" } },
      c.slices.map(function (s, i) {
        return keyItem(svg("svg", { width: 16, height: 16, viewBox: "0 0 16 16", "aria-hidden": "true" },
          [svg("rect", { x: 1, y: 1, width: 14, height: 14, rx: 3, style: "fill: " + SLICE_INK[i] })]),
          s.name + " " + (s.hidden ? "?" : s.label));
      }));
    return [root, key];
  }

  function tableChart(c) {
    var cell = { padding: "8px 10px", borderBottom: "1px solid var(--surface-300)", textAlign: "right" };
    function first(o) { var s = {}; Object.keys(cell).forEach(function (k) { s[k] = cell[k]; }); s.textAlign = "left"; Object.keys(o || {}).forEach(function (k) { s[k] = o[k]; }); return s; }
    var head = el("tr", null, el("th.label", { scope: "col", style: first({ color: "var(--ink-600)" }) }, c.axis),
      c.series.map(function (s) { return el("th.label", { scope: "col", style: { padding: cell.padding, borderBottom: "2px solid var(--line-200)", textAlign: "right", color: "var(--ink-600)" } }, s.name); }));
    head.firstChild.style.borderBottom = "2px solid var(--line-200)";
    var rows = c.categories.map(function (cat, i) {
      return el("tr", null, el("th.body", { scope: "row", style: first({ fontWeight: 500 }) }, cat),
        c.series.map(function (s) { return el("td.body", { style: cell }, s.labels[i]); }));
    });
    return el("table", { style: { borderCollapse: "collapse", width: "100%", fontVariantNumeric: "tabular-nums" } },
      el("caption.label", { style: { captionSide: "top", textAlign: "left", paddingBottom: 8, color: "var(--ink-900)" } }, c.title),
      el("thead", null, head), el("tbody", null, rows));
  }

  /* ---------- figures ----------
     Pictures for the shape topics, drawn from the question's numbers like a
     graph: regular shapes fitted round a point with the gap they leave, a
     clock face, and squared paper with a mirror line. They show the
     situation, never the answer. */
  var TILE_INK = [["var(--brand-blue-100)", "var(--brand-blue-600)"], ["var(--skill-4-100)", "var(--skill-4-600)"]];

  /* A regular polygon with one corner at the point O, its two edges from O
     at the angles `from` and from + its angle: walk round it, turning by the
     outside angle at each corner. */
  function polygonAt(sides, from, size) {
    var pts = [[0, 0]], x = 0, y = 0, dir = from;
    for (var i = 0; i < sides - 1; i++) {
      x += size * Math.cos(dir * Math.PI / 180);
      y -= size * Math.sin(dir * Math.PI / 180);
      pts.push([x, y]);
      dir += 360 / sides;
    }
    return pts;
  }
  function reach(sides) {
    return Math.max.apply(null, polygonAt(sides, 0, 1).map(function (p) { return Math.sqrt(p[0] * p[0] + p[1] * p[1]); }));
  }

  function tilingFigure(c) {
    var size = 96 / Math.max.apply(null, c.shapes.map(function (s) { return reach(s.sides); }));
    var root = svg("svg", { width: "100%", focusable: "false", "aria-hidden": "true" });
    root.style.display = "block";
    root.style.maxWidth = "220px";
    root.style.margin = "0 auto";
    /* The frame fits what is drawn, so a lone shape is not lost in a corner. */
    var drawn = [[0, 0]], at = 0, r = 34;
    c.shapes.forEach(function (s, si) {
      for (var k = 0; k < s.count; k++) {
        var pts = polygonAt(s.sides, at, size);
        drawn = drawn.concat(pts);
        root.appendChild(svg("polygon", {
          points: pts.map(function (p) { return p[0].toFixed(2) + "," + p[1].toFixed(2); }).join(" "),
          style: "fill: " + TILE_INK[si][0] + "; stroke: " + TILE_INK[si][1] + "; stroke-width: 2; stroke-linejoin: round"
        }));
        at += s.angle;
      }
    });
    for (var d = at; d <= 360; d += 5) drawn.push([r * Math.cos(d * Math.PI / 180), -r * Math.sin(d * Math.PI / 180)]);
    var xs = drawn.map(function (p) { return p[0]; }), ys = drawn.map(function (p) { return p[1]; });
    var x0 = Math.min.apply(null, xs) - 6, y0 = Math.min.apply(null, ys) - 6;
    var w = Math.max.apply(null, xs) + 6 - x0, h = Math.max.apply(null, ys) + 6 - y0, side = Math.max(w, h);
    x0 -= (side - w) / 2;
    y0 -= (side - h) / 2;
    root.setAttribute("viewBox", x0.toFixed(2) + " " + y0.toFixed(2) + " " + side.toFixed(2) + " " + side.toFixed(2));
    if (c.gap > 0) {
      var a0 = at * Math.PI / 180, a1 = 2 * Math.PI, mid = (a0 + a1) / 2;
      root.appendChild(svg("path", {
        d: "M0 0 L" + (r * Math.cos(a0)).toFixed(2) + " " + (-r * Math.sin(a0)).toFixed(2) +
          " A" + r + " " + r + " 0 " + (a1 - a0 > Math.PI ? 1 : 0) + " 0 " + r + " 0 Z",
        style: "fill: var(--skill-3-100); stroke: var(--skill-3-600); stroke-width: 1.5; stroke-dasharray: 4 3"
      }));
      root.appendChild(label((r * 0.62 * Math.cos(mid)).toFixed(2), (-r * 0.62 * Math.sin(mid) + 5).toFixed(2), "?",
        { anchor: "middle", size: 14, bold: true, ink: "var(--skill-3-600)" }));
    }
    root.appendChild(svg("circle", { cx: 0, cy: 0, r: 3.5, style: "fill: var(--ink-900)" }));
    return [root];
  }

  function clockFigure(c) {
    var root = svg("svg", { viewBox: "-100 -100 200 200", width: "100%", focusable: "false", "aria-hidden": "true" });
    root.style.display = "block";
    root.style.maxWidth = "200px";
    root.style.margin = "0 auto";
    root.appendChild(svg("circle", { cx: 0, cy: 0, r: 94, style: "fill: var(--surface-100); stroke: var(--ink-900); stroke-width: 3" }));
    for (var n = 1; n <= 12; n++) {
      var a = (n * 30 - 90) * Math.PI / 180;
      root.appendChild(label((76 * Math.cos(a)).toFixed(2), (76 * Math.sin(a) + 6).toFixed(2), String(n),
        { anchor: "middle", size: 17, bold: true, ink: "var(--ink-900)" }));
    }
    var h = (c.hand * 30 - 90) * Math.PI / 180;
    root.appendChild(svg("line", { x1: 0, y1: 0, x2: (58 * Math.cos(h)).toFixed(2), y2: (58 * Math.sin(h)).toFixed(2),
      style: "stroke: var(--brand-blue-600); stroke-width: 6; stroke-linecap: round" }));
    root.appendChild(svg("circle", { cx: 0, cy: 0, r: 6, style: "fill: var(--brand-blue-600)" }));
    return [root];
  }

  function mirrorFigure(c) {
    /* The paper widens with the distance; the label grows with it, so it
       reads the same size on screen. */
    var cols = 2 * c.distance + 4, rows = 5, cell = 20, W = cols * cell, H = rows * cell, fs = Math.round(cols * 0.85);
    var root = svg("svg", { viewBox: "-2 " + -(fs + 10) + " " + (W + 4) + " " + (H + fs + 12), width: "100%", focusable: "false", "aria-hidden": "true" });
    root.style.display = "block";
    for (var i = 0; i <= cols; i++) root.appendChild(svg("line", { x1: i * cell, x2: i * cell, y1: 0, y2: H, style: "stroke: var(--surface-300); stroke-width: 1" }));
    for (var j = 0; j <= rows; j++) root.appendChild(svg("line", { x1: 0, x2: W, y1: j * cell, y2: j * cell, style: "stroke: var(--surface-300); stroke-width: 1" }));
    var mid = (cols / 2) * cell;
    root.appendChild(svg("line", { x1: mid, x2: mid, y1: -6, y2: H + 2, style: "stroke: var(--skill-3-600); stroke-width: 3; stroke-dasharray: 8 5" }));
    root.appendChild(label(mid, -8, "mirror line", { anchor: "middle", size: fs, ink: "var(--skill-3-600)" }));
    var px = mid + (c.side === "left" ? -1 : 1) * c.distance * cell;
    root.appendChild(svg("circle", { cx: px, cy: 3 * cell, r: 6, style: "fill: var(--brand-blue-600)" }));
    return [root];
  }

  /* A shape on squared paper, its corners on grid points, counted from the
     bottom left, so its area can be found by counting squares. */
  function gridFigure(c) {
    var cell = 24, W = c.cols * cell, H = c.rows * cell;
    var root = svg("svg", { viewBox: "-3 -3 " + (W + 6) + " " + (H + 6), width: "100%", focusable: "false", "aria-hidden": "true" });
    root.style.display = "block";
    root.style.maxWidth = Math.min(420, c.cols * 36) + "px";
    root.style.margin = "0 auto";
    for (var i = 0; i <= c.cols; i++) root.appendChild(svg("line", { x1: i * cell, x2: i * cell, y1: 0, y2: H, style: "stroke: var(--surface-300); stroke-width: 1" }));
    for (var j = 0; j <= c.rows; j++) root.appendChild(svg("line", { x1: 0, x2: W, y1: j * cell, y2: j * cell, style: "stroke: var(--surface-300); stroke-width: 1" }));
    var at = function (p) { return [p[0] * cell, H - p[1] * cell]; };
    var shape = function (pts, style) {
      return svg("polygon", { points: pts.map(function (p) { return at(p).join(","); }).join(" "), style: style });
    };
    var solid = "fill: var(--brand-blue-100); fill-opacity: 0.85; stroke: var(--brand-blue-600); stroke-width: 2.5; stroke-linejoin: round";
    /* After a move the shape it started as is dashed, and its image is the
       one coloured in. */
    root.appendChild(shape(c.points, c.image ? "fill: none; stroke: var(--ink-600); stroke-width: 2; stroke-dasharray: 6 4; stroke-linejoin: round" : solid));
    if (c.line) {
      var ends = c.line.map(at);
      root.appendChild(svg("line", { x1: ends[0][0], y1: ends[0][1], x2: ends[1][0], y2: ends[1][1], style: "stroke: var(--skill-3-600); stroke-width: 3; stroke-dasharray: 8 5" }));
    }
    if (c.image) root.appendChild(shape(c.image, solid));
    (c.image || c.points).forEach(function (p) {
      var xy = at(p);
      root.appendChild(svg("circle", { cx: xy[0], cy: xy[1], r: 3.5, style: "fill: var(--brand-blue-600)" }));
    });
    if (c.dot) {
      var d = at(c.dot);
      root.appendChild(svg("circle", { cx: d[0], cy: d[1], r: 5.5, style: "fill: var(--skill-3-600)" }));
    }
    return [root];
  }

  /* A block of small cubes drawn at a slant: its front, top and right side,
     each ruled into the faces of the cubes, so the layers can be counted. */
  function cubesFigure(c) {
    var s = 26, dx = s * 0.55, dy = s * 0.45;
    var L = c.length * s, D = c.width, H = c.height * s, top = D * dy;
    var W = L + D * dx, T = top + H;
    var root = svg("svg", { viewBox: "-3 -3 " + (W + 6) + " " + (T + 6), width: "100%", focusable: "false", "aria-hidden": "true" });
    root.style.display = "block";
    root.style.maxWidth = Math.min(360, Math.round(W * 1.4)) + "px";
    root.style.margin = "0 auto";
    var edge = "stroke: var(--brand-blue-600); stroke-width: 1.5; stroke-linejoin: round";
    var face = function (pts, fill) {
      root.appendChild(svg("polygon", { points: pts.map(function (p) { return p.join(","); }).join(" "), style: "fill: " + fill + "; " + edge }));
    };
    var rule = function (a, b) { root.appendChild(svg("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], style: edge })); };
    face([[0, top], [L, top], [L, T], [0, T]], "var(--brand-blue-100)");
    face([[0, top], [L, top], [W, 0], [D * dx, 0]], "var(--surface-200)");
    face([[L, top], [W, 0], [W, H], [L, T]], "var(--skill-1-100)");
    var i, k;
    for (i = 1; i < c.length; i++) { rule([i * s, top], [i * s, T]); rule([i * s, top], [i * s + D * dx, 0]); }
    for (k = 1; k < c.height; k++) { rule([0, top + k * s], [L, top + k * s]); rule([L, top + k * s], [W, k * s]); }
    for (k = 1; k < D; k++) { rule([k * dx, top - k * dy], [L + k * dx, top - k * dy]); rule([L + k * dx, top - k * dy], [L + k * dx, T - k * dy]); }
    return [root];
  }

  /* A solid in outline, drawn at a slant: faces lightly filled, the edges
     in front solid and the hidden ones dashed. Numbered as the engine
     numbers them. */
  var SOLID_DRAWINGS = [
    /* cube */ { faces: [[[20, 50], [100, 50], [130, 28], [50, 28]], [[100, 50], [130, 28], [130, 108], [100, 130]], [[20, 50], [100, 50], [100, 130], [20, 130]]],
      hidden: [[[50, 28], [50, 108]], [[50, 108], [130, 108]], [[20, 130], [50, 108]]] },
    /* rectangular prism */ { faces: [[[12, 66], [112, 66], [142, 44], [42, 44]], [[112, 66], [142, 44], [142, 98], [112, 120]], [[12, 66], [112, 66], [112, 120], [12, 120]]],
      hidden: [[[42, 44], [42, 98]], [[42, 98], [142, 98]], [[12, 120], [42, 98]]] },
    /* triangular prism */ { faces: [[[85, 122], [50, 62], [110, 37], [145, 97]], [[15, 122], [85, 122], [50, 62]]],
      hidden: [[[75, 97], [110, 37]], [[75, 97], [145, 97]], [[15, 122], [75, 97]]] },
    /* square pyramid */ { faces: [[[100, 122], [130, 100], [75, 25]], [[20, 122], [100, 122], [75, 25]]],
      hidden: [[[50, 100], [20, 122]], [[50, 100], [130, 100]], [[50, 100], [75, 25]]] },
    /* triangular pyramid */ { faces: [[[100, 122], [135, 96], [68, 28]], [[22, 122], [100, 122], [68, 28]]],
      hidden: [[[22, 122], [135, 96]]] },
    /* cylinder */ { paths: [{ d: "M30 38 L30 116 A45 14 0 0 0 120 116 L120 38 Z", fill: true }, { d: "M30 38 A45 14 0 1 1 120 38 A45 14 0 1 1 30 38 Z", fill: true }],
      dashed: ["M30 116 A45 14 0 0 1 120 116"] },
    /* cone */ { paths: [{ d: "M75 22 L30 116 A45 14 0 0 0 120 116 Z", fill: true }], dashed: ["M30 116 A45 14 0 0 1 120 116"] },
    /* sphere */ { paths: [{ d: "M25 75 A50 50 0 1 1 125 75 A50 50 0 1 1 25 75 Z", fill: true }, { d: "M25 75 A50 14 0 0 0 125 75", fill: false }],
      dashed: ["M25 75 A50 14 0 0 1 125 75"] }
  ];
  function solidFigure(c) {
    var d = SOLID_DRAWINGS[c.shape - 1];
    var root = svg("svg", { viewBox: "0 0 160 145", width: "100%", focusable: "false", "aria-hidden": "true" });
    root.style.display = "block";
    root.style.maxWidth = "220px";
    root.style.margin = "0 auto";
    var edge = "stroke: var(--brand-blue-600); stroke-width: 2.5; stroke-linejoin: round";
    var hidden = "fill: none; stroke: var(--ink-600); stroke-width: 1.5; stroke-dasharray: 5 4";
    var at = function (pts) { return pts.map(function (p) { return p.join(","); }).join(" "); };
    (d.hidden || []).forEach(function (h) { root.appendChild(svg("polyline", { points: at(h), style: hidden })); });
    (d.dashed || []).forEach(function (p) { root.appendChild(svg("path", { d: p, style: hidden })); });
    var face = "fill: var(--brand-blue-100); fill-opacity: 0.45; " + edge;
    (d.faces || []).forEach(function (f) { root.appendChild(svg("polygon", { points: at(f), style: face })); });
    (d.paths || []).forEach(function (p) { root.appendChild(svg("path", { d: p.d, style: p.fill ? face : "fill: none; " + edge })); });
    return [root];
  }

  /* A strip of time zones, one column an hour, each headed by its UTC name,
     with the cities marked in theirs. A name sits on the side of its dot
     with more room. */
  function zonesFigure(c) {
    var n = c.to - c.from + 1, col = 44, head = 26, row = 24;
    var W = n * col, H = head + Math.max(3, c.cities.length) * row + 10;
    var root = svg("svg", { viewBox: "-1 -1 " + (W + 2) + " " + (H + 2), width: "100%", focusable: "false", "aria-hidden": "true" });
    root.style.display = "block";
    root.style.maxWidth = Math.min(480, Math.round(W * 1.25)) + "px";
    root.style.margin = "0 auto";
    for (var i = 0; i < n; i++) {
      root.appendChild(svg("rect", { x: i * col, y: 0, width: col, height: H,
        style: "fill: " + (i % 2 ? "var(--surface-100)" : "var(--surface-200)") + "; stroke: var(--surface-300); stroke-width: 1" }));
      var z = c.from + i;
      root.appendChild(label(i * col + col / 2, 17, z ? "UTC+" + z : "UTC", { anchor: "middle", size: 10, bold: true }));
    }
    root.appendChild(svg("line", { x1: 0, x2: W, y1: head, y2: head, style: "stroke: var(--line-200); stroke-width: 1" }));
    c.cities.forEach(function (city, k) {
      var at = city.zone - c.from, x = at * col + col / 2, y = head + 16 + k * row, east = at >= n / 2;
      root.appendChild(svg("circle", { cx: x, cy: y - 4, r: 4.5, style: "fill: var(--brand-blue-600)" }));
      root.appendChild(label(east ? x - 8 : x + 8, y, city.name, { anchor: east ? "end" : "start", size: 12, ink: "var(--ink-900)", bold: true }));
    });
    return [root];
  }

  /* A circle with its centre, and one part marked in a heavier line:
     numbered as the engine numbers them. */
  function circleFigure(c) {
    var root = svg("svg", { viewBox: "0 0 160 160", width: "100%", focusable: "false", "aria-hidden": "true" });
    root.style.display = "block";
    root.style.maxWidth = "200px";
    root.style.margin = "0 auto";
    var thin = "fill: var(--brand-blue-100); fill-opacity: 0.45; stroke: var(--ink-600); stroke-width: 1.5";
    var bold = "fill: none; stroke: var(--brand-blue-600); stroke-width: 4; stroke-linecap: round";
    /* The circumference is the edge itself, so it is the circle drawn heavier. */
    var edge = c.part === 4 ? "fill: var(--brand-blue-100); fill-opacity: 0.45; stroke: var(--brand-blue-600); stroke-width: 4" : thin;
    root.appendChild(svg("circle", { cx: 80, cy: 80, r: 60, style: edge }));
    var mark = [
      "M80 80 L132 50", "M23.6 59.5 L136.4 100.5", "M28 110 L132 110", null, "M80 20 A60 60 0 0 1 140 80"
    ][c.part - 1];
    if (mark) root.appendChild(svg("path", { d: mark, style: bold }));
    root.appendChild(svg("circle", { cx: 80, cy: 80, r: 3.5, style: "fill: var(--ink-900)" }));
    return [root];
  }

  /* A picture with no frame or title, for an answer tile. */
  function figureParts(c) {
    return c.kind === "tiling" ? tilingFigure(c) : c.kind === "clock" ? clockFigure(c) : c.kind === "mirror" ? mirrorFigure(c)
      : c.kind === "cubes" ? cubesFigure(c) : c.kind === "solid" ? solidFigure(c) : c.kind === "zones" ? zonesFigure(c) : c.kind === "circle" ? circleFigure(c) : gridFigure(c);
  }

  function Chart(c) {
    var box = {
      background: "var(--surface-200)", borderRadius: "var(--radius-md)", boxShadow: "inset 0 0 0 1px var(--surface-300)",
      padding: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-3)",
      width: "100%", maxWidth: 480, boxSizing: "border-box", margin: 0
    };
    if (c.kind === "table") return el("div.am-chart", { style: box }, tableChart(c));
    var parts = c.kind === "pie" ? pieChart(c) : c.kind === "tiling" ? tilingFigure(c) : c.kind === "clock" ? clockFigure(c)
      : c.kind === "mirror" ? mirrorFigure(c) : c.kind === "grid" ? gridFigure(c) : c.kind === "cubes" ? cubesFigure(c)
      : c.kind === "solid" ? solidFigure(c) : c.kind === "zones" ? zonesFigure(c)
      : c.kind === "circle" ? circleFigure(c) : axisChart(c, "am-chart-" + (++chartCount));
    return el("figure.am-chart", { role: "img", "aria-label": c.text, style: box },
      el("div.label", { "aria-hidden": "true", style: { color: "var(--ink-900)" } }, c.title), parts);
  }

  /* ---------- Toggle ----------
     A setting that is on or off: the label and a line on what it does, and a
     switch drawn as a track and a knob. The whole row is the target, and a
     screen reader hears a switch and its state. */
  function Toggle(o) {
    var on = !!o.on;
    var knob = el("span", {
      style: {
        position: "absolute", top: 3, left: on ? 23 : 3, width: 22, height: 22, borderRadius: "50%",
        background: "var(--surface-200)", boxShadow: "0 1px 2px rgba(22, 32, 44, 0.3)",
        transition: "left var(--dur-fast) var(--ease-out)"
      }
    });
    var track = el("span", {
      "aria-hidden": "true",
      style: {
        position: "relative", flex: "none", width: 48, height: 28, borderRadius: "var(--radius-pill)",
        background: on ? "var(--success-700)" : "var(--surface-300)",
        transition: "background-color var(--dur-fast) var(--ease-out)"
      }
    }, knob);
    return el("button.am-reset.am-toggle", {
      type: "button", role: "switch", "aria-checked": on ? "true" : "false",
      onClick: function () { o.onChange(!on); },
      style: {
        display: "flex", alignItems: "center", gap: "var(--space-3)", width: "100%", textAlign: "left",
        minHeight: "var(--tap-button)", padding: "10px 0", background: "none", border: 0, cursor: "pointer", color: "var(--ink-900)"
      }
    },
      el("span", { style: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 } },
        el("span.label", null, o.label),
        o.sub ? el("span.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } }, o.sub) : null),
      track);
  }

  /* A pill that states a fact — streak, level, topic. Never an action. */
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
  AM.Toggle = Toggle;
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
  AM.StreakWeek = StreakWeek;
  AM.TopicBars = TopicBars;
  AM.BottomNav = BottomNav;
  AM.SideRail = SideRail;
  AM.Card = Card;
  AM.Chip = Chip;
  AM.FactGrid = FactGrid;
  AM.Chart = Chart;
})();
