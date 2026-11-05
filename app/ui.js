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
  var SKILL_INK = { 1: "var(--skill-1-bright)", 2: "var(--skill-2-bright)", 3: "var(--skill-3-bright)", 4: "var(--skill-4-bright)",
    5: "var(--skill-5-bright)", 6: "var(--skill-6-bright)" };

  /* From the reward road: frames are rings round the card, patterns a faint
     tile behind it in the card's own colour. Binakol is drawn after the
     Ilocano weave's whirl of squares, not copied from any cloth. */
  var CARD_FRAMES = {
    silver: "0 0 0 3px #c3cdd9, 0 0 0 4px rgba(22, 32, 44, 0.08)",
    gold: "0 0 0 3px #f5b400, 0 0 0 7px rgba(245, 180, 0, 0.22)",
    year: "0 0 0 3px #8b5cf6, 0 0 0 6px #f5b400"
  };
  var CARD_PATTERNS = {
    binakol: { w: 24, h: 24, d: '<rect x="2" y="2" width="20" height="20" fill="none" stroke="C" stroke-width="2"/><rect x="6.5" y="6.5" width="11" height="11" transform="rotate(18 12 12)" fill="none" stroke="C" stroke-width="2"/><rect x="9.8" y="9.8" width="4.4" height="4.4" transform="rotate(36 12 12)" fill="C"/>' },
    triangles: { w: 24, h: 21, d: '<path d="M0 21L12 0L24 21Z" fill="C"/>' },
    hexagons: { w: 24, h: 41.6, d: '<path d="M12 0L24 6.9V20.8L12 27.7L0 20.8V6.9ZM12 27.7V41.6" fill="none" stroke="C" stroke-width="1.6"/>' },
    stars: { w: 28, h: 28, d: '<path d="M7 1Q7 7 13 7Q7 7 7 13Q7 7 1 7Q7 7 7 1ZM21 15Q21 21 27 21Q21 21 21 27Q21 21 15 21Q21 21 21 15Z" fill="C"/>' }
  };
  var patternIds = 0;
  /* A pattern tile filling its parent, in a colour (any CSS colour). */
  function CardPattern(key, colour, opacity) {
    var p = CARD_PATTERNS[key];
    if (!p) return null;
    var id = "am-pat-" + (++patternIds), wrap = el("span", { "aria-hidden": "true", style: { position: "absolute", inset: 0, pointerEvents: "none", opacity: opacity === undefined ? 0.14 : opacity } });
    wrap.innerHTML = '<svg width="100%" height="100%" style="display:block"><defs><pattern id="' + id + '" width="' + p.w + '" height="' + p.h +
      '" patternUnits="userSpaceOnUse">' + p.d.split('"C"').join('"' + colour + '"') + '</pattern></defs><rect width="100%" height="100%" fill="url(#' + id + ')"/></svg>';
    return wrap;
  }

  function ProfileCard(o) {
    o = o || {};
    var name = o.name || "there";
    var greeting = o.greeting === undefined ? "Hello, " : o.greeting;
    var style = {
      position: "relative", overflow: "hidden",
      display: "flex", alignItems: "center", gap: "var(--space-4)",
      padding: "var(--space-4)", borderRadius: "var(--radius-md)",
      background: "var(--surface-200)", boxShadow: (CARD_FRAMES[o.frame] ? CARD_FRAMES[o.frame] + ", " : "") + "var(--shadow-card)", maxWidth: 320
    };
    if (o.style) Object.keys(o.style).forEach(function (k) { style[k] = o.style[k]; });
    /* A frame's outer ring is drawn outside the card, so it must not be cut. */
    if (CARD_FRAMES[o.frame]) style.overflow = "visible";

    return el("div.am-reset", { style: style },
      o.pattern ? el("span", { "aria-hidden": "true", style: { position: "absolute", inset: 0, borderRadius: "inherit", overflow: "hidden", pointerEvents: "none" } },
        CardPattern(o.pattern, SKILL_INK[o.colorKey] || SKILL_INK[2])) : null,
      el("div.heading-sm", {
        style: {
          width: 52, height: 52, borderRadius: "var(--radius-md)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, color: "var(--ink-inverse)",
          background: SKILL_INK[o.colorKey] || SKILL_INK[2], flexShrink: 0, position: "relative"
        }
      }, o.iconKey ? icon(o.iconKey, 24) : (o.initial || String(name).slice(0, 1).toUpperCase())),
      el("div.am-name", { style: { position: "relative" } },
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
  function SkillCard(o) {
    o = o || {};
    var k = o.colorKey >= 1 && o.colorKey <= 7 ? o.colorKey : 1;
    var c = { face: "var(--skill-" + k + "-100)", edge: "var(--skill-" + k + "-600)" };
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

  /* The bar is built once and kept: switching tabs calls amSetActive, which
     moves the highlight and the current item, so the bar itself never redraws
     or slides with the screen. */
  function BottomNav(active, onNavigate) {
    var nav = el("nav.am-bottomnav", { "aria-label": "Main",
      style: {
        flex: "none", display: "flex", background: "var(--surface-200)",
        borderTop: "1px solid var(--line-200)"
      }
    });
    var pill = el("span.am-navpill", { "aria-hidden": "true", style: { width: (100 / NAV_ITEMS.length) + "%" } });
    nav.appendChild(pill);
    var buttons = NAV_ITEMS.map(function (item) {
      var b = el("button.am-reset.am-navitem", {
        type: "button",
        onClick: function () { onNavigate(item.key); },
        style: {
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 2, border: 0, background: "none", cursor: "pointer"
        }
      }, icon(item.icon, 22), el("span.caption", null, item.label));
      nav.appendChild(b);
      return b;
    });
    nav.amSetActive = function (key) {
      var i = -1;
      NAV_ITEMS.forEach(function (item, k) {
        if (item.key === key) { i = k; buttons[k].setAttribute("aria-current", "page"); }
        else buttons[k].removeAttribute("aria-current");
      });
      pill.hidden = i < 0;
      if (i >= 0) pill.style.transform = "translateX(" + (i * 100) + "%)";
    };
    nav.amSetActive(active);
    return nav;
  }
  /* The order of the tabs, left to right: a move to a tab further right
     slides the new screen in from the right, and the other way from the left. */
  BottomNav.order = NAV_ITEMS.map(function (item) { return item.key; });

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

  /* ---------- Home in the redesign (stage 2) ---------- */
  /* A small ring, filled as far as a share (0 to 1). */
  function Ring(share, size, colour) {
    var r = 12, C = 2 * Math.PI * r, f = Math.max(0, Math.min(1, share || 0));
    var svg = '<svg viewBox="0 0 30 30" width="' + size + '" height="' + size + '" aria-hidden="true"><circle cx="15" cy="15" r="' + r + '" fill="none" stroke="var(--surface-300)" stroke-width="4"/>' +
      '<circle cx="15" cy="15" r="' + r + '" fill="none" stroke="' + (colour || "var(--success-700)") + '" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + (C * f).toFixed(1) + " " + C.toFixed(1) + '" transform="rotate(-90 15 15)"/></svg>';
    var s = el("span", { style: { flex: "none", display: "inline-flex" } }); s.innerHTML = svg; return s;
  }
  /* The readiness estimate as a gauge with the percent inside. */
  function Gauge(percent, size) {
    var r = 26, C = 2 * Math.PI * r, f = Math.max(0, Math.min(100, percent || 0)) / 100;
    var s = el("span", { role: "img", "aria-label": "About " + (percent || 0) + "% ready", style: { flex: "none", display: "inline-flex" } });
    s.innerHTML = '<svg viewBox="0 0 64 64" width="' + size + '" height="' + size + '" aria-hidden="true"><circle cx="32" cy="32" r="' + r + '" fill="none" stroke="var(--surface-300)" stroke-width="8"/>' +
      '<circle cx="32" cy="32" r="' + r + '" fill="none" stroke="var(--brand-blue-600)" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + (C * f).toFixed(1) + " " + C.toFixed(1) + '" transform="rotate(-90 32 32)"/>' +
      '<text x="32" y="38" text-anchor="middle" font-family="var(--font-display), sans-serif" font-weight="800" font-size="17" fill="var(--ink-900)">' + (percent || 0) + "%</text></svg>";
    return s;
  }
  /* The streak and today's goal in one panel: the flame and the count, the
     last seven days by name (today ringed until it is done), and the goal.
     The streak is a run of whole days, so the filled days are the last
     `days` of them, ending today once today counts and yesterday before. */
  /* The streak and today's goal, together: the count, this week day by day
     (store.weekStrip: practised, kept by the free day or a shield, today,
     still to come), and the goal. With no streak yet it invites one rather
     than showing a nought. */
  var WEEK_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
  var WEEK_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  function StreakPanel(o) {
    var days = o.days || 0, goal = o.goal || {}, strip = o.strip || [];
    var done = strip.filter(function (d) { return d.done; }).length;
    var week = el("span.am-sweek", { role: "img", "aria-label": "This week: practised on " + done + " day" + (done === 1 ? "" : "s") +
      strip.map(function (d, i) { return d.kept ? ". " + WEEK_NAMES[i] + " was kept for you" : ""; }).join("") + "." });
    strip.forEach(function (d, i) {
      var cls = d.done ? " on" : d.kept ? " kept" : d.today ? " today" : d.later ? " later" : "";
      week.appendChild(el("span.am-sweek-day", { "aria-hidden": "true", className: d.today ? "is-today" : null }, WEEK_LETTERS[i],
        el("span", { className: "am-sweek-dot" + cls }, d.done ? icon("check", 12, { glyph: true }) : null)));
    });
    return el("div.am-streak-panel", null,
      el("span.am-streak-count", null, AM.Flame ? AM.Flame(40, days > 0) : icon("streak", 32),
        days > 0 ? el("span", null, el("b", null, String(days)), el("small", null, days === 1 ? "day" : "days", el("br"), "in a row"))
          : el("span.am-streak-start", null, "Start a", el("br"), "streak today")),
      week,
      el("span.am-goal-row", null, Ring(goal.met ? 1 : 0, 28),
        el("span", null, goal.met ? el("b", null, "Today's goal done. ") : el("b", null, "Today's goal: "),
          goal.met ? (goal.done > 1 ? goal.done + " rounds today." : "Anything more is a bonus.") : "finish 1 round")));
  }
  /* "Up next" as the screen's lead: the topic's own colour, the level, how
     far it has got, and the button. The colours are the day ones in both
     themes, as the gold celebration is, so white text always reads. */
  var HERO = { 1: ["#7b6cf6", "#4f40cf"], 2: ["#13a3b3", "#0b6f7b"], 3: ["#e2559f", "#a8336f"], 4: ["#25a356", "#16703d"], 5: ["#2f95e0", "#17609c"], 6: ["#b14fd8", "#7a2d99"], 7: ["#679f14", "#426a0e"] };
  function HeroNext(o) {
    var c = HERO[o.colorKey] || HERO[1];
    return el("div.am-hero", { style: { background: "linear-gradient(160deg, " + c[0] + " 0%, " + c[1] + " 100%)" } },
      el("span.am-hero-row", null,
        el("span", { style: { minWidth: 0 } },
          el("span.am-hero-eyebrow", null, o.eyebrow), el("span.am-hero-title", null, o.title), el("span.am-hero-sub", null, o.sub)),
        o.art ? el("span.am-hero-art", null, o.art) : null),
      o.segments || null, o.meta ? el("span.am-hero-meta", null, o.meta) : null, o.button || null);
  }
  /* A topic's band: its colour, its picture on a white tile, how far it has
     got, and the way back. The colours are the hero's, the day ones in both
     themes, so white text always reads. */
  function TopicBand(o) {
    var c = HERO[o.colorKey] || HERO[1];
    return el("div.am-band", { style: { background: "linear-gradient(160deg, " + c[0] + " 0%, " + c[1] + " 100%)" } },
      o.onBack ? el("button.am-reset.am-band-back", { type: "button", "aria-label": o.backLabel || "Back", onClick: o.onBack }, icon("back", 22)) : null,
      el("span.am-band-row", null,
        o.art ? el("span.am-band-art", { "aria-hidden": "true" }, o.art) : null,
        el("span.am-band-text", null,
          el("h1.am-band-title", null, o.title),
          o.sub ? el("span.am-band-sub", null, o.sub) : null,
          typeof o.ratio === "number" ? el("span.am-band-bar", { role: "img", "aria-label": o.barLabel || Math.round(o.ratio * 100) + "% done" },
            el("i", { style: { width: Math.round(Math.max(0, Math.min(1, o.ratio)) * 100) + "%" } })) : null)));
  }
  /* ---------- Celebrations (redesign stage 4) ---------- */
  /* A soft glow and three fine rings behind the hero of a moment. It breathes
     slowly and never turns: no rays. */
  var haloCount = 0;
  function haloSVG(tint) {
    var id = "am-halo-" + (++haloCount), c = tint || "#ffffff";
    return '<svg viewBox="0 0 380 380" aria-hidden="true"><defs><radialGradient id="' + id + '"><stop offset="0" stop-color="' + c + '" stop-opacity=".34"/>' +
      '<stop offset=".5" stop-color="' + c + '" stop-opacity=".08"/><stop offset="1" stop-color="' + c + '" stop-opacity="0"/></radialGradient></defs>' +
      '<circle cx="190" cy="190" r="190" fill="url(#' + id + ')"/><circle cx="190" cy="190" r="92" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="1.5"/>' +
      '<circle cx="190" cy="190" r="130" fill="none" stroke="#fff" stroke-opacity=".1" stroke-width="1.5"/><circle cx="190" cy="190" r="170" fill="none" stroke="#fff" stroke-opacity=".06" stroke-width="1.5"/></svg>';
  }
  /* Each streak milestone has its own flame, scene and colour (the owner's
     choice, November 2026): 3, 7, 14, 30, 50, 100, 200 and 365 days. */
  var FL = { orange: ["#ff7a1a", "#ff9a2e", "#ffd23f", "#ffe27a", "#fff6d6"], soft: ["#ff9a2e", "#ffb45c", "#ffe27a", "#fff0b0", "#ffffff"], gold: ["#c9921a", "#f2c13e", "#fff0a8", "#fff8d6", "#ffffff"],
    blue: ["#2f6fe0", "#5b9bff", "#9fd0ff", "#d6ecff", "#ffffff"], ice: ["#5b9bff", "#a9d4ff", "#e6f4ff", "#ffffff", "#ffffff"], purple: ["#7a3fe0", "#9b5cff", "#d7b8ff", "#efe4ff", "#ffffff"] };
  function flameG(col, cx, cy, s) {
    var tx = cx - 100 * s, ty = cy - 105 * s;
    return '<g transform="translate(' + tx.toFixed(1) + " " + ty.toFixed(1) + ") scale(" + s + ')">' +
      '<path d="M100 18c6 30 26 46 42 64 15 17 22 34 22 52 0 36-29 58-64 58s-64-22-64-58c0-24 12-42 28-56 3 16 12 27 24 33-5-33-1-64 12-93z" fill="' + col[0] + '"/>' +
      '<path d="M100 18c6 30 26 46 42 64 15 17 22 34 22 52 0 36-29 58-64 58z" fill="' + col[1] + '"/>' +
      '<path d="M100 92c4 17 15 25 22 35 6 8 8 15 8 23 0 19-14 32-30 32s-30-13-30-31c0-14 8-24 17-31 1 9 5 15 11 19 0-18 0-32 2-47z" fill="' + col[2] + '"/>' +
      '<path d="M100 92c4 17 15 25 22 35 6 8 8 15 8 23 0 19-14 32-30 32z" fill="' + col[3] + '"/><ellipse cx="100" cy="162" rx="12" ry="14" fill="' + col[4] + '"/></g>';
  }
  function star4(x, y, s, col) { return '<path transform="translate(' + x + " " + y + ") scale(" + s + ')" d="M0-10 2-2 10 0 2 2 0 10-2 2-10 0-2-2z" fill="' + (col || "#fff") + '"/>'; }
  /* Each streak milestone has its own flame and its own scene. */
  var MILE = {
    3: { name: "First spark", sub: "Three days in a row. A habit is starting.", bg: "linear-gradient(180deg, #6e2477 0%, #4c1655 55%, #350e3b 100%)", mc: "#5b1a62", fl: "orange", tint: "#ffb347" },
    7: { name: "A whole week", sub: "Seven days in a row. Come back tomorrow to make it 8.", bg: "linear-gradient(180deg, #34248c 0%, #261868 55%, #1b104d 100%)", mc: "#3b1d8f", fl: "orange", tint: "#ffb347" },
    14: { name: "Two weeks strong", sub: "Fourteen days without a break. That takes real effort.", bg: "linear-gradient(180deg, #7c1a44 0%, #561030 55%, #3d0820 100%)", mc: "#7c1a44", fl: "orange", tint: "#ff9a6b" },
    30: { name: "A whole month", sub: "Thirty days. Practising is part of your day now.", bg: "linear-gradient(180deg, #11707a 0%, #0b4d54 55%, #06343a 100%)", mc: "#0d5c63", fl: "orange", tint: "#ffd27a" },
    50: { name: "Golden fifty", sub: "Fifty days in a row. Few learners get this far.", bg: "linear-gradient(180deg, #4d3812 0%, #2e2008 55%, #1a1204 100%)", mc: "#7a5a10", fl: "gold", tint: "#f5c84a" },
    100: { name: "One hundred days", sub: "A hundred days in a row. The blue flame is yours.", bg: "linear-gradient(180deg, #153f96 0%, #0d2a6a 55%, #071a45 100%)", mc: "#1d4fb8", fl: "blue", tint: "#9fd0ff" },
    200: { name: "Two hundred days", sub: "Two hundred days: a whole school year of practice.", bg: "linear-gradient(180deg, #21456a 0%, #142c46 55%, #0b1a2a 100%)", mc: "#24496d", fl: "ice", tint: "#cfe8ff" },
    365: { name: "One whole year", sub: "Every day for a year. The purple flame is yours.", bg: "linear-gradient(180deg, #5c1ca6 0%, #3a0f74 55%, #24064e 100%)", mc: "#5a1aa0", fl: "purple", tint: "#e0c8ff" }
  };
  function mileArt(d) {
    var h = "", k, col = FL[MILE[d].fl];
    if (d === 3) { h += flameG(col, 120, 118, .62) + star4(70, 70, 1.1) + star4(170, 58, .8, "#ffe27a") + star4(158, 112, .6); }
    if (d === 7) { h += flameG(col, 120, 112, .86); }
    if (d === 14) { h += flameG(FL.soft, 92, 124, .58) + flameG(col, 136, 112, .8); }
    if (d === 30) {
      for (k = 0; k < 30; k++) { var a = k / 30 * Math.PI * 2 - Math.PI / 2; h += '<rect x="-2.5" y="-7" width="5" height="14" rx="2.5" fill="' + (k % 2 ? "#ffd27a" : "#ff9a2e") + '" transform="translate(' + (120 + 100 * Math.cos(a)).toFixed(1) + " " + (112 + 100 * Math.sin(a)).toFixed(1) + ") rotate(" + (k * 12) + ')"/>'; }
      h += flameG(col, 120, 116, .68);
    }
    if (d === 50) { h += '<circle cx="120" cy="112" r="98" fill="none" stroke="url(#mgold)" stroke-width="7"/><circle cx="120" cy="112" r="86" fill="none" stroke="#f5c84a" stroke-opacity=".4" stroke-width="1.5"/>' + flameG(col, 120, 116, .7); }
    if (d === 100) {
      [-1, 1].forEach(function (side) {
        for (k = 0; k < 8; k++) {
          var an = (100 + k * 19) * Math.PI / 180, x = 120 + side * 94 * Math.cos(an) * -1, y = 112 + 94 * Math.sin(an);
          var rot = Math.atan2(Math.cos(an), side * Math.sin(an)) * 180 / Math.PI + (side < 0 ? -28 : 28);
          h += '<path d="M0 0C6-6 15-6 21 0C15 6 6 6 0 0Z" fill="' + (k % 2 ? "#cfe8ff" : "#9fd0ff") + '" transform="translate(' + x.toFixed(1) + " " + y.toFixed(1) + ") rotate(" + rot.toFixed(0) + ')"/>';
        }
      });
      h += '<path d="M104 210C112 214 128 214 136 210" fill="none" stroke="#9fd0ff" stroke-width="3" stroke-linecap="round"/>' + flameG(col, 120, 112, .72);
    }
    if (d === 200) {
      var stars = [[34, 40], [70, 22], [64, 78], [196, 30], [214, 84], [178, 60], [30, 150], [208, 162], [120, 12]];
      h += '<path d="M34 40 70 22 64 78M196 30 178 60 214 84M30 150 64 78M208 162 214 84" fill="none" stroke="#cfe8ff" stroke-opacity=".35" stroke-width="1.2"/>';
      stars.forEach(function (p, i) { h += star4(p[0], p[1], i % 3 ? .45 : .7, i % 2 ? "#ffffff" : "#cfe8ff"); });
      h += flameG(FL.blue, 98, 124, .58) + flameG(col, 138, 112, .76);
    }
    if (d === 365) {
      for (k = 0; k < 12; k++) { var am = k / 12 * Math.PI * 2 - Math.PI / 2, mx = 120 + 100 * Math.cos(am), my = 112 + 100 * Math.sin(am); h += '<rect x="' + (mx - 5).toFixed(1) + '" y="' + (my - 5).toFixed(1) + '" width="10" height="10" fill="' + (k % 3 ? "#f5c84a" : "#fff0a8") + '" transform="rotate(45 ' + mx.toFixed(1) + " " + my.toFixed(1) + ')"/>'; }
      h += '<circle cx="120" cy="112" r="100" fill="none" stroke="#f5c84a" stroke-opacity=".3" stroke-width="1.5"/>' + flameG(col, 120, 122, .66) +
        '<path d="M96 48 92 24 106 36 120 18 134 36 148 24 144 48z" fill="url(#mgold)" stroke="#a87a10" stroke-width="1.5" stroke-linejoin="round"/><circle cx="92" cy="24" r="3.5" fill="#fff0a8"/><circle cx="120" cy="18" r="4" fill="#fff0a8"/><circle cx="148" cy="24" r="3.5" fill="#fff0a8"/>';
    }
    return '<svg viewBox="0 0 240 224" aria-hidden="true"><defs><linearGradient id="mgold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2b0"/><stop offset=".45" stop-color="#f2c13e"/><stop offset="1" stop-color="#a87a10"/></linearGradient></defs>' + h + "</svg>";
  }
  AM.haloSVG = haloSVG;
  AM.MILE = MILE;
  AM.mileArt = mileArt;

  /* A row you can tap: a picture, a line and a caption, and where it goes.
     It stands on a shelf like every other pressable thing; a row that cannot
     be opened yet lies flat. */
  function RowCard(o) {
    var live = !!o.onClick && !o.disabled;
    var trail = o.trailing === undefined ? (live ? el("span.am-rowcard-chev", null, icon("next", 20)) : null)
      : typeof o.trailing === "string" ? el("span.am-rowcard-pill", null, o.trailing) : o.trailing;
    return el(live ? "button.am-reset.am-pressable.am-rowcard" : "div.am-rowcard.am-rowcard-flat", {
      type: live ? "button" : null, onClick: live ? o.onClick : null, "aria-label": o.ariaLabel || null,
      style: live ? { "--am-edge": "var(--surface-300)" } : null
    }, o.lead || null,
      el("span.am-rowcard-text", null, el("span.label", null, o.title), o.caption ? el("span.caption", null, o.caption) : null, o.extra || null),
      trail);
  }
  /* The square picture at the start of a row. */
  function LeadTile(name, tone) {
    return el("span.am-leadtile", { style: tone === "action" ? { background: "#fff1e0", color: "var(--action-700)" } : null }, icon(name, 22));
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
  /* ---------- Segmented ----------
     One choice among a few, all in view: the theme. A radio group drawn as
     one pill with the chosen part raised; each part is 44px tall inside a
     4px rim, so the target stays at 48. */
  function Segmented(o) {
    var group = el("div", {
      role: "radiogroup", "aria-label": o.label,
      style: { display: "flex", gap: 4, padding: 4, borderRadius: "var(--radius-pill)", background: "var(--surface-300)" }
    }, o.options.map(function (opt) {
      var on = opt.value === o.value;
      return el("button.am-reset", {
        type: "button", role: "radio", "aria-checked": on ? "true" : "false",
        onClick: function () { if (!on) o.onChange(opt.value); },
        style: {
          flex: 1, minHeight: 44, borderRadius: "var(--radius-pill)", border: 0, cursor: "pointer", font: "inherit",
          fontWeight: on ? 600 : 500, color: on ? "var(--ink-900)" : "var(--ink-600)",
          background: on ? "var(--segment-on)" : "transparent",
          boxShadow: on ? "0 1px 2px rgba(22, 32, 44, 0.3)" : "none"
        }
      }, opt.label);
    }));
    return el("div", { style: { display: "flex", flexDirection: "column", gap: 8, padding: "10px 0" } },
      el("span", { style: { display: "flex", flexDirection: "column", gap: 2 } },
        el("span.label", null, o.label),
        o.sub ? el("span.body-sm", { style: { color: "var(--ink-600)", textWrap: "pretty" } }, o.sub) : null),
      group);
  }

  function Toggle(o) {
    var on = !!o.on;
    var knob = el("span", {
      style: {
        position: "absolute", top: 3, left: on ? 23 : 3, width: 22, height: 22, borderRadius: "50%",
        background: "var(--knob)", boxShadow: "0 1px 2px rgba(22, 32, 44, 0.3)",
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
  AM.Segmented = Segmented;
  AM.append = append;
  AM.clear = clear;
  AM.Button = Button;
  AM.ProfileCard = ProfileCard;
  AM.CardPattern = CardPattern;
  AM.CARD_FRAMES = CARD_FRAMES;
  AM.PracticeHeader = PracticeHeader;
  AM.SkillCard = SkillCard;
  AM.CelebrationBanner = CelebrationBanner;
  AM.AnswerTile = AnswerTile;
  AM.AnswerField = AnswerField;
  AM.Keypad = Keypad;
  AM.ProgressBar = ProgressBar;
  AM.TopicBars = TopicBars;
  AM.BottomNav = BottomNav;
  AM.SideRail = SideRail;
  AM.Card = Card;
  AM.Ring = Ring;
  AM.Gauge = Gauge;
  AM.StreakPanel = StreakPanel;
  AM.HeroNext = HeroNext;
  AM.RowCard = RowCard;
  AM.TopicBand = TopicBand;
  AM.LeadTile = LeadTile;
  AM.Chip = Chip;
  AM.FactGrid = FactGrid;
  AM.Chart = Chart;
})();
