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
    bronze: "0 0 0 3px #c98a55, 0 0 0 5px rgba(156, 90, 44, 0.22)",
    silver: "0 0 0 3px #c3cdd9, 0 0 0 4px rgba(22, 32, 44, 0.08)",
    gold: "0 0 0 3px #f5b400, 0 0 0 7px rgba(245, 180, 0, 0.22)",
    platinum: "0 0 0 3px #e8edf4, 0 0 0 6px #aab6c8",
    emerald: "0 0 0 3px #36d688, 0 0 0 6px #f5c94a",
    sapphire: "0 0 0 3px #5b8cff, 0 0 0 6px #d7dee8",
    ruby: "0 0 0 3px #f04a6c, 0 0 0 6px #f5c94a",
    diamond: "0 0 0 3px #eef9ff, 0 0 0 6px #9fd0f2, 0 0 16px 6px rgba(159, 208, 242, 0.55)",
    pearl: "0 0 0 3px #f6ecdf, 0 0 0 6px #dccbb8, 0 0 14px 5px rgba(255, 246, 230, 0.6)",
    year: "0 0 0 3px #8b5cf6, 0 0 0 6px #f5b400"
  };
  /* ---------- the card tiers' art ----------
     Ported as drawn from the approved prototype (owner, 2026-11-06: "port
     the approved draft exactly"): a coin for each metal tier, a cut stone for
     each gem (an emerald step cut; oval, cushion and round brilliants, the
     diamond with fire), a pearl; a crest above the card (a seal for the
     metals, the stone in a mount with prongs and filigree wings for the
     gems, side stones from Sapphire, a crown for Ruby, a halo and soft
     blurred light for Diamond and Pearl); the frame in the mount's metal;
     and from Emerald up a card body that is the gem, with its facets. */
  function TIERS() { return (AM.store && AM.store.CARD_TIERS) || []; }
  function tierIndexOf(t) { var T = TIERS(); for (var i = 0; i < T.length; i++) if (T[i].key === t.key) return i; return 0; }
  function metalGrad(c, ang) { return "linear-gradient(" + (ang || 135) + "deg," + c[1] + " 0%," + c[0] + " 16%," + c[2] + " 36%," + c[1] + " 52%," + c[0] + " 64%," + c[2] + " 82%," + c[3] + " 100%)"; }
  function settingOf(t) { return t.kind === "metal" ? t : t.kind === "pearl" ? t : TIERS()[t.setting === "gold" ? 2 : 3]; }
  function frameGrad(t) {
    if (t.kind === "pearl") return "linear-gradient(135deg,#fffaf2 0%,#f3e2d0 18%,#ffe3ec 34%,#fffaf2 48%,#dff7ec 62%,#e9e2ff 78%,#f3e2d0 100%)";
    return metalGrad(settingOf(t).c);
  }

  /* ---------- shading: mix the four tones by a brightness from 0 to 1 ---------- */
  function hex2(h) { var n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function mix(a, b, k) { var x = hex2(a), y = hex2(b); return "rgb(" + [0, 1, 2].map(function (i) { return Math.round(x[i] + (y[i] - x[i]) * k); }).join(",") + ")"; }
  function tone(c, b) {
    b = Math.max(0, Math.min(1, b));
    if (b < 1 / 3) return mix(c[3], c[2], b * 3);
    if (b < 2 / 3) return mix(c[2], c[1], (b - 1 / 3) * 3);
    return mix(c[1], c[0], (b - 2 / 3) * 3);
  }
  var LIGHT = -128;
  function lit(angle, tilt, base) { var d = (angle - LIGHT) * Math.PI / 180; return base + tilt * Math.cos(d); }
  function poly(pts, fill, extra) { return '<polygon points="' + pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ") + '" fill="' + fill + '"' + (extra || "") + "/>"; }
  function cen(pts) { var x = 0, y = 0; pts.forEach(function (p) { x += p[0]; y += p[1]; }); return [x / pts.length, y / pts.length]; }
  function ang(p) { return Math.atan2(p[1] - 50, p[0] - 50) * 180 / Math.PI; }
  var FIRE = ["#ffd1e8", "#d1f0ff", "#fff3c4", "#d9ffd6", "#e6d9ff"];

  /* A round brilliant seen from above; squashed into an oval, or pushed toward a square for a cushion. */
  function brilliant(t) {
    var sx = t.cut === "oval" ? .8 : 1, sy = 1, sq = t.cut === "cushion";
    var R = function (deg, r) {
      if (sq && r > 40) { var a = deg * Math.PI / 180, p = 4; r = r / Math.pow(Math.pow(Math.abs(Math.cos(a)), p) + Math.pow(Math.abs(Math.sin(a)), p), 1 / p) * .9; }
      var b = deg * Math.PI / 180; return [50 + r * Math.cos(b) * sx, 50 + r * Math.sin(b) * sy];
    };
    var T = [], Sx = [], G = [], H = [], k, h = "";
    for (k = 0; k < 8; k++) { T.push(R(k * 45 + 22.5, 21)); Sx.push(R(k * 45, 33)); G.push(R(k * 45 + 22.5, 46)); H.push(R(k * 45, 46)); }
    var c = t.c, f = 0;
    for (k = 0; k < 8; k++) {
      var km = (k + 7) % 8, kp = (k + 1) % 8;
      var g1 = [Sx[k], G[km], H[k]], g2 = [Sx[k], H[k], G[k]];
      [g1, g2].forEach(function (pp, j) { var b = lit(ang(cen(pp)), .42, .42) + (j ? -.06 : .05); f++; h += poly(pp, t.fire && f % 3 === 0 ? FIRE[f % 5] : tone(c, b)); });
      var kite = [T[k], Sx[kp], G[k], Sx[k]];
      h += poly(kite, tone(c, lit(ang(cen(kite)), .38, .55)));
      var star = [T[km], Sx[k], T[k]];
      h += poly(star, t.fire && k % 2 ? FIRE[k % 5] : tone(c, lit(ang(cen(star)), .3, .66)));
    }
    h += poly(T, tone(c, .8));
    h += poly([T[5], T[6], T[7]], "rgba(255,255,255,.35)");
    return h;
  }
  /* The emerald cut: a step cut, rings of long facets like a hall of mirrors. */
  function stepCut(t) {
    var ring = function (w, hh, ch) { return [[-w + ch, -hh], [w - ch, -hh], [w, -hh + ch], [w, hh - ch], [w - ch, hh], [-w + ch, hh], [-w, hh - ch], [-w, -hh + ch]].map(function (p) { return [50 + p[0], 50 + p[1]]; }); };
    var rings = [ring(44, 33, 11), ring(36, 25, 8.5), ring(28, 17.5, 6), ring(21, 11, 4)], normals = [-90, -45, 0, 45, 90, 135, 180, -135], h = "";
    for (var r = 0; r < rings.length - 1; r++) {
      var A = rings[r], B = rings[r + 1];
      for (var i = 0; i < 8; i++) {
        var j = (i + 1) % 8, b = lit(normals[i], .4 - r * .06, .45 + r * .1) + (r % 2 ? .08 : -.04);
        h += poly([A[i], A[j], B[j], B[i]], tone(t.c, b));
      }
    }
    h += poly(rings[3], tone(t.c, .74)) + poly([rings[3][7], rings[3][0], rings[3][1], [50, 50]], "rgba(255,255,255,.25)");
    return h;
  }
  function glint(x, y, s, d) { return '<path class="am-glint" style="animation-delay:' + d + 's" transform="translate(' + x + " " + y + ") scale(" + s + ')" d="M0-10 1.8-1.8 10 0 1.8 1.8 0 10-1.8 1.8-10 0-1.8-1.8z" fill="#fff"/>'; }
  var gemUid = 0;
  /* gem(tier, {glints}) : a 100 x 100 picture of the tier's stone or medal. */
  function drawGem(t, o) {
    o = o || {}; var id = "am-tg" + (gemUid++), h = "", c = t.c;
    if (t.kind === "metal") {
      h += '<defs><linearGradient id="' + id + 'a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset=".45" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[3] + '"/></linearGradient>' +
        '<linearGradient id="' + id + 'b" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + c[0] + '"/><stop offset=".5" stop-color="' + c[2] + '"/><stop offset="1" stop-color="' + c[3] + '"/></linearGradient>' +
        '<radialGradient id="' + id + 'c" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="' + c[0] + '"/><stop offset=".55" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[2] + '"/></radialGradient></defs>';
      h += '<circle cx="50" cy="53" r="46" fill="' + c[3] + '" opacity=".5"/><circle cx="50" cy="50" r="46" fill="url(#' + id + 'a)"/>';
      for (var n = 0; n < 48; n++) { var a = n * 7.5 * Math.PI / 180; h += '<line x1="' + (50 + 42 * Math.cos(a)).toFixed(1) + '" y1="' + (50 + 42 * Math.sin(a)).toFixed(1) + '" x2="' + (50 + 46 * Math.cos(a)).toFixed(1) + '" y2="' + (50 + 46 * Math.sin(a)).toFixed(1) + '" stroke="' + c[3] + '" stroke-opacity=".28" stroke-width="1.2"/>'; }
      h += '<circle cx="50" cy="50" r="37" fill="url(#' + id + 'b)"/><circle cx="50" cy="50" r="32" fill="url(#' + id + 'c)"/>';
      var star = []; for (var s = 0; s < 10; s++) { var r2 = s % 2 ? 9 : 21, b2 = (s * 36 - 90) * Math.PI / 180; star.push([50 + r2 * Math.cos(b2), 51 + r2 * Math.sin(b2)]); }
      h += poly(star.map(function (p) { return [p[0] + 1, p[1] + 1.5]; }), c[3], ' opacity=".35"') + poly(star, "url(#" + id + "a)", ' stroke="' + c[0] + '" stroke-width="1.2"');
      if (t.sheen) h += '<ellipse cx="50" cy="40" rx="24" ry="9" fill="#cfe6ff" opacity=".22"/>';
    } else if (t.kind === "pearl") {
      h += '<defs><radialGradient id="' + id + '" cx=".36" cy=".3" r=".85"><stop offset="0" stop-color="#ffffff"/><stop offset=".32" stop-color="#fcf6ee"/><stop offset=".72" stop-color="#eadccc"/><stop offset="1" stop-color="#c8b29c"/></radialGradient>' +
        '<radialGradient id="' + id + 'p" cx=".7" cy=".72" r=".5"><stop offset="0" stop-color="#ffc9dc" stop-opacity=".55"/><stop offset="1" stop-color="#ffc9dc" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="' + id + 'g" cx=".25" cy=".7" r=".45"><stop offset="0" stop-color="#c9ffe6" stop-opacity=".5"/><stop offset="1" stop-color="#c9ffe6" stop-opacity="0"/></radialGradient></defs>';
      h += '<ellipse cx="50" cy="92" rx="30" ry="5" fill="#000" opacity=".12"/><circle cx="50" cy="50" r="40" fill="url(#' + id + ')"/><circle cx="50" cy="50" r="40" fill="url(#' + id + 'p)"/><circle cx="50" cy="50" r="40" fill="url(#' + id + 'g)"/>' +
        '<ellipse cx="37" cy="33" rx="11" ry="7" fill="#fff" opacity=".85" transform="rotate(-30 37 33)"/><circle cx="62" cy="66" r="3" fill="#fff" opacity=".5"/>';
    } else {
      h += '<g filter="url(#' + id + 's)">' + (t.cut === "emerald" ? stepCut(t) : brilliant(t)) + "</g>";
      h = '<defs><filter id="' + id + 's" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="' + c[3] + '" flood-opacity=".45"/></filter></defs>' + h;
    }
    if (o.glints !== false) h += glint(t.kind === "metal" ? 30 : 34, 30, .9, 0) + glint(70, 64, .55, 1.7) + (t.fire ? glint(64, 28, .7, .9) : "");
    return '<svg viewBox="0 0 100 100" class="am-gem" aria-hidden="true">' + h + "</svg>";
  }

  function nest(svg, x, y, w, h) { return svg.replace('<svg viewBox="0 0 100 100" class="am-gem"', '<svg x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" viewBox="0 0 100 100" class="am-gem"'); }
  /* crest(tier): 140 x 70. A seal for the metals; for the gems, the stone in a mount with prongs,
     filigree wings, side stones (Sapphire up), a crown (Ruby), a halo and rays (Diamond). */
  function drawCrest(t) {
    var i = tierIndexOf(t), mt = t.kind === "pearl" ? TIERS()[2] : settingOf(t), mc = mt.c, id = "am-cr" + (gemUid++), h = "", M = "url(#" + id + ")";
    h += '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + mc[0] + '"/><stop offset=".4" stop-color="' + mc[1] + '"/><stop offset=".75" stop-color="' + mc[2] + '"/><stop offset="1" stop-color="' + mc[3] + '"/></linearGradient>' +
      '<radialGradient id="' + id + 'g"><stop offset="0" stop-color="' + (t.kind === "metal" ? mc[0] : t.c[1]) + '" stop-opacity=".75"/><stop offset="1" stop-color="' + (t.kind === "metal" ? mc[1] : t.c[1]) + '" stop-opacity="0"/></radialGradient></defs>';
    if (i >= 3) h += '<circle class="am-cr-glow" cx="70" cy="34" r="' + (i >= 7 ? 36 : 30) + '" fill="url(#' + id + 'g)"/>';
    if (i >= 7) {
      var bc = t.kind === "pearl" ? "#fff0d8" : "#ffffff";
      h += '<defs><radialGradient id="' + id + 'b" gradientUnits="userSpaceOnUse" cx="70" cy="34" r="66"><stop offset="0" stop-color="' + bc + '" stop-opacity=".95"/><stop offset=".3" stop-color="' + bc + '" stop-opacity=".5"/><stop offset=".7" stop-color="' + bc + '" stop-opacity=".12"/><stop offset="1" stop-color="' + bc + '" stop-opacity="0"/></radialGradient>' +
        '<filter id="' + id + 'f" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><g filter="url(#' + id + 'f)">';
      [[-90, 66, 7], [-111, 58, 5], [-69, 58, 5], [-132, 50, 4], [-48, 50, 4], [-153, 42, 3.4], [-27, 42, 3.4], [-100, 46, 2.6], [-80, 46, 2.6], [-170, 32, 2.6], [-10, 32, 2.6]].forEach(function (bm, k) {
        var a0 = (bm[0] - bm[2]) * Math.PI / 180, a1 = (bm[0] + bm[2]) * Math.PI / 180, L = bm[1];
        h += '<path class="am-cr-ray" style="animation-delay:' + (k * .55).toFixed(2) + 's" d="M70 34L' + (70 + L * Math.cos(a0)).toFixed(1) + " " + (34 + L * Math.sin(a0)).toFixed(1) + "Q" + (70 + L * 1.04 * Math.cos(bm[0] * Math.PI / 180)).toFixed(1) + " " + (34 + L * 1.04 * Math.sin(bm[0] * Math.PI / 180)).toFixed(1) + " " + (70 + L * Math.cos(a1)).toFixed(1) + " " + (34 + L * Math.sin(a1)).toFixed(1) + 'Z" fill="url(#' + id + 'b)"/>';
      });
      h += "</g>";
    }
    var wing = function (lvl) {
      var w = '<path d="M50 38C42 30 31 29 24 35C19 40 21 47 27 46C31 45 31 40 27.5 40" fill="none" stroke="' + M + '" stroke-width="3.2" stroke-linecap="round"/><circle cx="27.5" cy="40" r="2.2" fill="' + M + '"/>';
      if (lvl >= 2) w += '<path d="M50 30C43 21 32 17 22 21C16 24 15 30 19.5 31" fill="none" stroke="' + M + '" stroke-width="2.5" stroke-linecap="round"/><circle cx="19.5" cy="31" r="2.2" fill="' + M + '"/>';
      if (lvl >= 4) w += '<path d="M50 44C44 47 38 48 33 48" fill="none" stroke="' + M + '" stroke-width="2" stroke-linecap="round"/><path d="M36 24l-3-6M42 21l-1-6" stroke="' + M + '" stroke-width="2" stroke-linecap="round"/>';
      return w;
    };
    if (i >= 1) { var wg = wing(i); h += "<g>" + wg + '</g><g transform="translate(140 0) scale(-1 1)">' + wg + "</g>"; }
    if (i === 3) h += '<circle cx="40" cy="44" r="3" fill="' + M + '"/><circle cx="100" cy="44" r="3" fill="' + M + '"/>';
    if (t.kind === "metal") {
      h += nest(gem(t, { glints: i >= 2 }), 50, 14, 40, 40);
    } else if (t.kind === "pearl") {
      h += nest(gem(TIERS()[8], { glints: false }), 29, 36, 14, 14) + nest(gem(TIERS()[8], { glints: false }), 97, 36, 14, 14);
      h += '<path d="M54 44C56 54 84 54 86 44Z" fill="' + M + '"/><path d="M56 45C60 50 80 50 84 45" fill="none" stroke="' + mc[0] + '" stroke-width="1.4"/>';
      h += nest(gem(t), 50, 10, 40, 40);
    } else {
      if (i >= 5) h += nest(gem(TIERS()[7], { glints: false }), 33, 39, 13, 13) + nest(gem(TIERS()[7], { glints: false }), 94, 39, 13, 13);
      if (i === 6) h += '<path d="M58 14l3-8 4 6 5-9 5 9 4-6 3 8z" fill="' + M + '" stroke="' + mc[3] + '" stroke-opacity=".4" stroke-width="1"/><circle cx="70" cy="5" r="2.4" fill="' + t.c[1] + '"/>';
      if (i === 7) for (var q = 0; q < 14; q++) { var b = q / 14 * Math.PI * 2; h += '<circle cx="' + (70 + 25 * Math.cos(b)).toFixed(1) + '" cy="' + (34 + 25 * Math.sin(b)).toFixed(1) + '" r="2.7" fill="#f4fbff" stroke="' + mc[2] + '" stroke-width=".8"/>'; }
      h += t.cut === "emerald" ? '<rect x="49" y="17" width="42" height="34" rx="7" fill="' + M + '" stroke="' + mc[3] + '" stroke-opacity=".45" stroke-width="1"/>' : '<circle cx="70" cy="34" r="21.5" fill="' + M + '" stroke="' + mc[3] + '" stroke-opacity=".45" stroke-width="1"/>';
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (d) { var px = 70 + d[0] * (t.cut === "emerald" ? 19 : 15.5), py = 34 + d[1] * (t.cut === "emerald" ? 15 : 15.5); h += '<circle cx="' + px + '" cy="' + py + '" r="3.1" fill="' + M + '" stroke="' + mc[3] + '" stroke-opacity=".5" stroke-width=".8"/>'; });
      h += t.cut === "emerald" ? nest(gem(t), 50, 13, 40, 42) : nest(gem(t), 51, 15, 38, 38);
    }
    return '<svg class="am-crest" viewBox="0 0 140 70" aria-hidden="true">' + h + "</svg>";
  }
  /* From Emerald up the card body is the gem, with the learner's colour kept as an accent. */
  var BODY = { emerald: ["#22c172", "#0a6b3c"], sapphire: ["#4a7ff2", "#112f86"], ruby: ["#ea4166", "#7d0a2c"], diamond: ["#6aa9dc", "#1b3f6e"], pearl: ["#fdf7f0", "#e4d3c1"] };
  function drawFacets(t) {
    if (t.kind === "pearl") return "";
    var h = "", k;
    if (t.cut === "emerald") {
      var ring = function (d) { var c = 6 + d * .4; return [[d + c, d * .6], [100 - d - c, d * .6], [100 - d, d * .6 + c * .6], [100 - d, 60 - d * .6 - c * .6], [100 - d - c, 60 - d * .6], [d + c, 60 - d * .6], [d, 60 - d * .6 - c * .6], [d, d * .6 + c * .6]]; };
      var R = [ring(2), ring(9), ring(16), ring(23)];
      for (var r = 0; r < 3; r++) for (k = 0; k < 8; k++) { var j = (k + 1) % 8; h += poly([R[r][k], R[r][j], R[r + 1][j], R[r + 1][k]], k < 2 || k > 6 ? "rgba(255,255,255," + (.1 - r * .02) + ")" : k > 2 && k < 6 ? "rgba(0,0,0," + (.1 - r * .02) + ")" : "rgba(255,255,255,.03)"); }
      return '<svg viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">' + h + "</svg>";
    }
    var cx = 74, cy = 20, n = 18, P = [];
    for (k = 0; k < n; k++) { var a = k / n * Math.PI * 2; P.push([cx + 160 * Math.cos(a), cy + 160 * Math.sin(a)]); }
    for (k = 0; k < n; k++) h += poly([[cx, cy], P[k], P[(k + 1) % n]], k % 2 ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.07)");
    if (t.fire) for (k = 0; k < n; k += 3) h += poly([[cx, cy], P[k], P[(k + 1) % n]], FIRE[k % 5], ' opacity=".12"');
    return '<svg viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">' + h + "</svg>";
  }

  var BODY = { emerald: ["#22c172", "#0a6b3c"], sapphire: ["#4a7ff2", "#112f86"], ruby: ["#ea4166", "#7d0a2c"], diamond: ["#6aa9dc", "#1b3f6e"], pearl: ["#fdf7f0", "#e4d3c1"] };
  function gemAura(c) { return "radial-gradient(90% 130% at 100% 100%, " + c + "66, transparent 62%), radial-gradient(70% 100% at 0% 0%, " + c + "40, transparent 60%)"; }
  var AURA = {
    gold: "radial-gradient(120% 90% at 0% 0%, rgba(255,216,99,.3), transparent 55%)",
    platinum: "linear-gradient(120deg, transparent 25%, rgba(200,230,255,.2) 42%, rgba(255,220,250,.16) 55%, transparent 72%)",
    emerald: gemAura("#36d688"), sapphire: gemAura("#5b8cff"), ruby: gemAura("#ff4f74"),
    diamond: "conic-gradient(from 200deg at 70% 30%, rgba(255,200,230,.2), rgba(200,240,255,.22), rgba(255,250,200,.2), rgba(210,255,220,.18), rgba(255,200,230,.2))",
    pearl: "conic-gradient(from 120deg at 30% 60%, rgba(255,214,230,.3), rgba(214,255,236,.26), rgba(220,226,255,.3), rgba(255,240,214,.26), rgba(255,214,230,.3))"
  };
  /* The frames a road gave before tiers, kept: drawn as rings, as they were. */
  var KEPT_FRAMES = { year: true };

  var CARD_PATTERNS = {
    binakol: { w: 24, h: 24, d: '<rect x="2" y="2" width="20" height="20" fill="none" stroke="C" stroke-width="2"/><rect x="6.5" y="6.5" width="11" height="11" transform="rotate(18 12 12)" fill="none" stroke="C" stroke-width="2"/><rect x="9.8" y="9.8" width="4.4" height="4.4" transform="rotate(36 12 12)" fill="C"/>' },
    triangles: { w: 24, h: 21, d: '<path d="M0 21L12 0L24 21Z" fill="C"/>' },
    hexagons: { w: 24, h: 41.6, d: '<path d="M12 0L24 6.9V20.8L12 27.7L0 20.8V6.9ZM12 27.7V41.6" fill="none" stroke="C" stroke-width="1.6"/>' },
    stars: { w: 28, h: 28, d: '<path d="M7 1Q7 7 13 7Q7 7 7 13Q7 7 1 7Q7 7 7 1ZM21 15Q21 21 27 21Q21 21 21 27Q21 21 15 21Q21 21 21 15Z" fill="C"/>' },
    kusikus: { w: 24, h: 24, d: '<rect x="3" y="3" width="18" height="18" fill="none" stroke="C" stroke-width="2"/><rect x="6.5" y="6.5" width="11" height="11" transform="rotate(20 12 12)" fill="none" stroke="C" stroke-width="2"/><rect x="9.5" y="9.5" width="5" height="5" transform="rotate(40 12 12)" fill="C"/>' }
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

  /* ---------- the learner's card ----------
     In the card's colour, with a weave made from the learner's name (the
     same name always weaves the same cloth; a binakol whirl, after the
     Ilocano weave, not copied from any one cloth), an initials monogram
     ringed in the tier's metal, a title earned, a motto of their own, and
     the tier. Its frame is the tier's, or one kept from the road. */
  function hashStr(s) { var h = 2166136261 >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
  function seeded(a) { return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  var weaveCount = 0;
  function drawWeave(name, style) {
    var r = seeded(hashStr(String(name || "").toLowerCase().replace(/\s+/g, " ").trim() + "|1|" + style));
    var size = [36, 42, 48, 54][Math.floor(r() * 4)], m = size / 2, rings = 2 + Math.floor(r() * 3), sw = (1.3 + r() * 1.3).toFixed(2), th = "#ffffff", t = "", k;
    var line = function (d, op) { return '<path d="' + d + '" fill="none" stroke="' + th + '" stroke-opacity="' + op + '" stroke-width="' + sw + '" stroke-linejoin="round"/>'; };
    var diamond = function (cx, cy, d) { return "M" + cx + " " + (cy - d) + "L" + (cx + d) + " " + cy + "L" + cx + " " + (cy + d) + "L" + (cx - d) + " " + cy + "Z"; };
    if (style === "binakol") {
      [[m, m], [0, 0], [size, 0], [0, size], [size, size]].forEach(function (p) {
        for (k = 0; k < rings; k++) t += line(diamond(p[0], p[1], m * (0.9 - k * (0.72 / rings))), k % 2 ? 0.28 : 0.7);
      });
      if (r() < 0.7) t += '<path d="' + diamond(m, m, m * 0.14) + '" fill="' + th + '" fill-opacity=".8"/>';
    } else if (style === "kusikus") {
      var spin = 12 + r() * 10;
      for (k = 0; k < rings + 2; k++) { var s = m * (0.92 - k * 0.17); if (s < 2) break; t += '<rect x="' + (m - s) + '" y="' + (m - s) + '" width="' + 2 * s + '" height="' + 2 * s + '" fill="none" stroke="' + th + '" stroke-opacity="' + (k % 2 ? 0.3 : 0.72) + '" stroke-width="' + sw + '" transform="rotate(' + (k * spin).toFixed(1) + " " + m + " " + m + ')"/>'; }
    } else if (style === "triangles") {
      t += line("M0 " + size + "L" + m + " 0L" + size + " " + size, 0.7) + line("M" + m * 0.5 + " " + size + "L" + m + " " + m + "L" + m * 1.5 + " " + size, 0.3);
    } else if (style === "hexagons") {
      var hx = function (rr) { var p = []; for (var i = 0; i < 6; i++) { var a = (60 * i - 30) * Math.PI / 180; p.push((m + rr * Math.cos(a)).toFixed(1) + " " + (m + rr * Math.sin(a)).toFixed(1)); } return "M" + p.join("L") + "Z"; };
      for (k = 0; k < rings; k++) t += line(hx(m * (0.95 - k * 0.3)), k % 2 ? 0.3 : 0.7);
    } else {
      var sq = function (rr) { return '<rect x="' + (m - rr) + '" y="' + (m - rr) + '" width="' + 2 * rr + '" height="' + 2 * rr + '"/>'; };
      t += '<g fill="none" stroke="' + th + '" stroke-opacity=".7" stroke-width="' + sw + '">' + sq(m * 0.55) + '<g transform="rotate(45 ' + m + " " + m + ')">' + sq(m * 0.55) + "</g></g>";
    }
    var id = "am-weave-" + (++weaveCount), bands = "", nb = 1 + Math.floor(r() * 2);
    for (k = 0; k < nb; k++) bands += '<rect x="0" y="' + (18 + r() * 64).toFixed(1) + '%" width="100%" height="5" fill="' + th + '" fill-opacity=".35"/>';
    return '<svg width="100%" height="100%" aria-hidden="true"><defs><pattern id="' + id + '" width="' + size + '" height="' + size + '" patternUnits="userSpaceOnUse">' + t + '</pattern></defs><rect width="100%" height="100%" fill="url(#' + id + ')"/>' + bands + "</svg>";
  }
  function initialsOf(name, own) {
    if (own && String(own).trim()) return String(own).trim().toUpperCase().slice(0, 3);
    var w = String(name || "?").trim().split(/\s+/);
    return (((w[0] || "?")[0] || "?") + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase();
  }
  var monoCount = 0;
  function drawMonogram(initials, colorKey, tier) {
    var hue = HERO[colorKey] || HERO[2], id = "am-mono-" + (++monoCount), big = initials.length > 2;
    var ring = !tier ? ["#ffffff", "#e8edf4", "#aab6c8", "#6b7a92"] : tier.kind === "pearl" ? ["#fffaf2", "#f1dfcb", "#ffe0ea", "#d8c2ab"] : settingOf(tier).c;
    var safe = initials.replace(/[&<>"]/g, "");
    var text = function (dy, fill, op) { return '<text x="32" y="' + ((big ? 38 : 40) + dy) + '" text-anchor="middle" style="font-family: var(--font-display)" font-weight="800" font-size="' + (big ? 19 : 24) + '" fill="' + fill + '"' + (op ? ' fill-opacity="' + op + '"' : "") + ">" + safe + "</text>"; };
    return '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="' + id + 'r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + ring[0] + '"/><stop offset=".35" stop-color="' + ring[1] + '"/><stop offset=".7" stop-color="' + ring[2] + '"/><stop offset="1" stop-color="' + ring[3] + '"/></linearGradient>' +
      '<radialGradient id="' + id + 'd" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="' + hue[0] + '"/><stop offset="1" stop-color="' + hue[1] + '"/></radialGradient></defs>' +
      '<circle cx="32" cy="32" r="31" fill="url(#' + id + 'r)"/><circle cx="32" cy="32" r="25.5" fill="' + ring[3] + '" opacity=".5"/><circle cx="32" cy="32.6" r="24.5" fill="url(#' + id + 'd)"/>' +
      text(1.5, "#000", 0.22) + text(0, "#ffffff") + "</svg>";
  }
  function flameFor(key, lit) {
    if (!AM.Flame) return null;
    var f = AM.Flame(20, lit), c = key && AM.share && AM.share.FLAMES && AM.share.FLAMES[key];
    if (c) ["--flame-shelf", "--flame-body", "--flame-mid", "--flame-core"].forEach(function (v, i) { f.style.setProperty(v, c[i]); });
    return f;
  }
  /* ---------- drawn once ----------
     A tier's stone and crest, a card's weave and its monogram are the same
     for the same inputs, and drawing them (a brilliant's facets most of all)
     cost more than the rest of a screen. Each is drawn once and kept as
     markup; every copy gets ids of its own, so two on a page never share a
     gradient (one hidden would take the other's colour with it). */
  var KEPT = Object.create(null), idRun = 0;
  function freshIds(s) {
    var ids = Object.create(null), any = false;
    s.replace(/ id="([^"]+)"/g, function (m, id) { ids[id] = any = true; return m; });
    if (!any) return s;
    var tag = "-" + (++idRun).toString(36);
    return s.replace(/(id="|url\(#|href="#)([^")]+)/g, function (m, pre, id) { return ids[id] ? pre + id + tag : m; });
  }
  function kept(key, draw) { var s = KEPT[key]; if (s === undefined) s = KEPT[key] = draw(); return freshIds(s); }
  function gem(t, o) { return kept("g|" + t.key + (o && o.glints === false ? "|0" : "|1"), function () { return drawGem(t, o); }); }
  function crest(t) { return kept("c|" + t.key, function () { return drawCrest(t); }); }
  function facets(t) { return kept("f|" + t.key, function () { return drawFacets(t); }); }
  function weaveSVG(name, style) {
    return kept("w|" + style + "|" + String(name || "").toLowerCase().replace(/\s+/g, " ").trim(), function () { return drawWeave(name, style); });
  }
  function monogramSVG(initials, colorKey, tier) {
    return kept("m|" + initials + "|" + colorKey + "|" + (tier ? tier.key : ""), function () { return drawMonogram(initials, colorKey, tier); });
  }

  function ProfileCard(o) {
    o = o || {};
    var hue = HERO[o.colorKey] || HERO[2], T = TIERS();
    var tier = o.tier || (AM.store && AM.store.tier ? AM.store.tier().tier : T[0]);
    /* A frame the road gave before tiers is drawn as it was; otherwise the frame is the tier's. */
    var kept = KEPT_FRAMES[o.frame] ? o.frame : null;
    var shown = !kept && o.frame ? (T.filter(function (x) { return x.key === o.frame; })[0] || tier) : tier;
    var ti = tierIndexOf(shown), gemBody = ti >= 4, body = gemBody ? BODY[shown.key] : hue, bw = [4, 4, 5, 5, 6, 6, 6, 7, 7][ti] || 4;
    var weave = o.pattern === "plain" ? null : (o.pattern || "binakol");
    var style = {
      "--c1": body[0], "--c2": body[1], "--acc": hue[1], "--frame": kept ? "linear-gradient(135deg,#8b5cf6,#f5b400)" : frameGrad(shown),
      borderWidth: bw + "px", maxWidth: 340
    };
    if (o.style) Object.keys(o.style).forEach(function (k) { style[k] = o.style[k]; });
    var parts = [];
    if (weave) parts.push(el("span.am-lc-wv", { "aria-hidden": "true", html: weaveSVG(o.name, weave) }));
    parts.push(el("span.am-lc-aura", { "aria-hidden": "true", style: { background: AURA[shown.key] || "none" } }));
    if (gemBody) parts.push(el("span.am-lc-facets", { "aria-hidden": "true", html: facets(shown) }));
    if (shown.kind === "gem" || shown.kind === "pearl") parts.push(el("span.am-lc-inlay", { "aria-hidden": "true", style: { "--inlay": shown.kind === "pearl" ? "#fff7ee" : shown.c[0] } }));
    if (shown.key === "diamond") [[14, 26, 0], [58, 18, 1.2], [86, 60, 2.1], [40, 72, 0.6], [70, 82, 2.8], [8, 74, 1.7], [30, 44, 3.2]].forEach(function (q) {
      parts.push(el("span.am-lc-spk", { "aria-hidden": "true", style: { left: q[0] + "%", top: q[1] + "%" },
        html: '<svg viewBox="-10 -10 20 20"><path style="animation-delay:' + q[2] + 's" d="M0-10 1.8-1.8 10 0 1.8 1.8 0 10-1.8 1.8-10 0-1.8-1.8z" fill="#fff"/></svg>' }));
    });
    if (gemBody) parts.push(el("span.am-lc-accent", { "aria-hidden": "true", style: { background: "linear-gradient(90deg," + hue[0] + "," + hue[1] + ")" } }));
    parts.push(el("span.am-lc-sweep", { "aria-hidden": "true" }));
    parts.push(el("span.am-lc-crest", { "aria-hidden": "true", html: crest(shown) }));
    parts.push(el("div.am-lc-row1", null,
      el("span.am-mono", { "aria-hidden": "true", html: monogramSVG(initialsOf(o.name, o.initials), o.colorKey, shown) }),
      el("div.am-lc-who", null,
        o.title ? el("span.am-lc-ttl", null, o.title) : null,
        el("b.am-lc-name", null, o.name || "Your name"),
        o.school ? el("small", null, o.school) : null),
      typeof o.streak === "number" ? el("span.am-lc-fl", null, flameFor(o.flame, o.streak > 0), String(o.streak)) : null));
    parts.push(el("div.am-lc-row2", null,
      el("span.am-lc-motto", null, o.motto ? "\u201c" + o.motto + "\u201d" : ""),
      el("span.am-lc-tchip", null, el("span", { "aria-hidden": "true", html: gem(shown, { glints: false }) }), shown.name)));
    return el("div.am-reset.am-lcard.am-lc-tier-" + shown.key + (gemBody ? ".am-lc-gembody" : ""), { style: style, role: "img", "aria-label": (o.name || "Your card") + ", " + shown.name + " card" + (o.title ? ", " + o.title : "") }, parts);
  }

  /* ---------- the maths, drawn (content.js renderModel) ----------
     Shown after a right answer and in a lesson's worked example, in the
     topic's colours. Each says in words what it shows. */
  function MathModel(m, colorKey) {
    var k = colorKey || 1, bright = "var(--skill-" + k + "-bright)", deep = "var(--skill-" + k + "-deep)", tint = "var(--skill-" + k + "-tint)";
    var fill = function (c) { return ' style="fill:' + c + '"'; };
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]; }); };
    var f1 = function (x) { return (Math.round(x * 10) / 10).toString(); };
    var txt = function (x, y, s, o) {
      o = o || {};
      return '<text x="' + f1(x) + '" y="' + f1(y) + '" text-anchor="' + (o.anchor || "middle") + '" font-size="' + (o.size || 12) + '" font-weight="' + (o.weight || 600) + '" style="fill:' + (o.ink || "var(--ink-900)") + '">' + esc(s) + "</text>";
    };
    var svg = function (w, h, inner) { return el("span", { html: '<svg viewBox="0 0 ' + f1(w) + " " + f1(h) + '" width="' + f1(w) + '" height="' + f1(h) + '" aria-hidden="true">' + inner + "</svg>" }); };
    var plural = function (n, one) { return n + " " + one + (n === 1 ? "" : "s"); };
    var art, words, i, j;
    if (m.kind === "columns") {
      var split = m.rows.concat([m.result]).map(function (r) { var p = r.split("."); return { w: p[0], f: p[1] || "" }; });
      var w = Math.max.apply(null, split.map(function (r) { return r.w.length; })), d = split[0].f.length;
      var row = function (r, sign, cls) {
        var cells = [el("span.am-col-sign", null, sign || "")];
        for (j = 0; j < w; j++) cells.push(el("span", null, r.w[r.w.length - w + j] || ""));
        if (d) { cells.push(el("span.am-col-dot", null, ".")); for (j = 0; j < d; j++) cells.push(el("span", null, r.f[j])); }
        return el("div.am-col-row" + (cls || ""), null, cells);
      };
      art = el("div.am-columns", null, row(split[0]), row(split[1], m.op), el("div.am-col-rule"), row(split[2], "", ".am-col-result"));
      art.style.setProperty("--model-ink", deep);
      words = m.rows[0] + (m.op === "+" ? " plus " : " minus ") + m.rows[1] + " is " + m.result + ", in columns with the points lined up";
    } else if (m.kind === "array") {
      var s = Math.max(8, Math.min(22, Math.floor(280 / m.cols))), g = Math.max(3, Math.round(s * 0.3)), W = m.cols * (s + g) + g, H = m.rows * (s + g) + g, h = "";
      for (var r = 0; r < m.rows; r++) {
        if (r < m.tint) h += '<rect x="0" y="' + (r * (s + g) + g / 2) + '" width="' + W + '" height="' + (s + g) + '" rx="' + (s / 2) + '"' + fill(tint) + "/>";
        for (var c = 0; c < m.cols; c++) {
          var x = g + c * (s + g) + s / 2, y = g + r * (s + g) + s / 2;
          h += r < m.tint && c < m.mark ? '<circle cx="' + x + '" cy="' + y + '" r="' + (s / 2) + '"' + fill(bright) + "/>"
            : r < m.tint ? '<circle cx="' + x + '" cy="' + y + '" r="' + (s / 2 - 1) + '" style="fill:#fff;stroke:' + bright + ';stroke-width:1.5"/>'
            : '<circle cx="' + x + '" cy="' + y + '" r="' + (s / 2 - 1) + '"' + fill("var(--surface-300)") + "/>";
        }
      }
      art = svg(W, H, h);
      words = m.rows * m.cols + " dots in " + plural(m.rows, "row") + "; " + plural(m.tint, "row") + " picked out, and " + m.tint * m.mark + " of " + (m.tint === 1 ? "its" : "their") + " dots coloured";
    } else if (m.kind === "hundred") {
      var q = 21, gp = 3, side = 10 * (q + gp) + gp, hh = "";
      for (var n = 0; n < 100; n++) hh += '<rect x="' + (gp + (n % 10) * (q + gp)) + '" y="' + (gp + Math.floor(n / 10) * (q + gp)) + '" width="' + q + '" height="' + q + '" rx="4"' + fill(n < m.shaded ? bright : "var(--surface-300)") + "/>";
      art = svg(side, side, hh);
      words = "A hundred square with " + m.shaded + " of its 100 squares coloured";
    } else if (m.kind === "tape") {
      var total = 0; m.parts.forEach(function (p, ii) { total += p * m.sizes[ii]; });
      var TW = 300, sc = TW / total, inks = [bright, "var(--action-500)", "var(--brand-blue-600)"], th = "", at = 0, np = m.parts.length;
      m.parts.forEach(function (p, ii) {
        var bw = m.sizes[ii] * sc, x0 = at;
        for (var jj = 0; jj < p; jj++) {
          th += '<rect x="' + f1(at + 1) + '" y="1" width="' + f1(Math.max(1, bw - 2)) + '" height="34" rx="5"' + fill(inks[ii]) + "/>";
          if (bw >= 24) th += txt(at + bw / 2, 23, m.units[ii], { size: bw >= 36 ? 13 : 11, weight: 700, ink: "#fff" });
          at += bw;
        }
        var xa = x0 + 2, xb = at - 2, anchor = np === 2 ? (ii === 0 ? "start" : "end") : "middle";
        th += '<path d="M' + f1(xa) + " 42v6H" + f1(xb) + 'v-6" style="fill:none;stroke:var(--ink-600);stroke-width:1.5"/>';
        th += txt(anchor === "start" ? xa : anchor === "end" ? xb : (xa + xb) / 2, 66, m.names ? m.names[ii] : plural(p, "part"), { anchor: anchor, size: 12.5 });
      });
      art = svg(TW, 72, th);
      words = "A bar in " + m.parts.map(function (p, ii) { return (m.names ? m.names[ii] + ": " : "") + plural(p, "part") + " of " + m.units[ii]; }).join(", and ");
    } else if (m.kind === "line") {
      var P = m.points, LW = 300, pad = 16, avail = LW - 2 * pad, span = P[P.length - 1].at - P[0].at, gaps = [];
      for (i = 1; i < P.length; i++) gaps.push((P[i].at - P[i - 1].at) / span * avail);
      /* Hops in proportion, but none too short to label. */
      var floorW = Math.min(64, avail / gaps.length), small = gaps.map(function (gw) { return gw < floorW; });
      var rest = avail - floorW * small.filter(Boolean).length, big = gaps.reduce(function (s2, gw, ii) { return s2 + (small[ii] ? 0 : gw); }, 0);
      var xs = [pad]; gaps.forEach(function (gw, ii) { xs.push(xs[ii] + (small[ii] ? floorW : gw / big * rest)); });
      var lh = '<path d="M' + (pad - 6) + " 60H" + (LW - pad + 6) + '" style="stroke:var(--ink-600);stroke-width:2"/>';
      for (i = 0; i < P.length; i++) {
        lh += '<path d="M' + f1(xs[i]) + " 54V66" + '" style="stroke:var(--ink-900);stroke-width:2"/>';
        lh += txt(xs[i], 84, P[i].label, { anchor: i === 0 ? "start" : i === P.length - 1 ? "end" : "middle", size: 11.5 });
      }
      for (i = 1; i < P.length; i++) {
        var mx = (xs[i - 1] + xs[i]) / 2;
        lh += '<path d="M' + f1(xs[i - 1] + 2) + " 54Q" + f1(mx) + " 14 " + f1(xs[i] - 2) + ' 54" style="fill:none;stroke:' + bright + ';stroke-width:2.5;stroke-linecap:round"/>';
        lh += '<path d="M' + f1(xs[i] - 9) + " 48L" + f1(xs[i] - 2) + " 54L" + f1(xs[i] - 4) + ' 45" style="fill:none;stroke:' + bright + ';stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round"/>';
        lh += txt(mx, 24, m.hops[i - 1], { size: 12, weight: 700, ink: deep });
      }
      art = svg(LW, 92, lh);
      words = "A number line from " + P[0].label + " to " + P[P.length - 1].label + ", in hops of " + m.hops.join(", then ");
    } else if (m.kind === "lists") {
      art = el("div.am-ml", null, m.lists.map(function (l) {
        return el("div.am-ml-row", null, el("span.am-ml-label", null, l.label), el("span.am-ml-chips", null, l.items.map(function (vv) {
          var shared = m.common.indexOf(vv) > -1;
          return el("span.am-ml-chip" + (shared && vv === m.ring ? ".is-answer" : shared ? ".is-common" : ""), null, String(vv));
        })));
      }));
      art.style.setProperty("--ml-bright", bright); art.style.setProperty("--ml-tint", tint);
      words = m.lists.map(function (l) { return l.label + ": " + l.items.join(", "); }).join(". ") + ". Shared: " + m.common.join(", ");
    } else if (m.kind === "rect") {
      var sc2 = Math.min(230 / m.width, 130 / m.height), rw = m.width * sc2, rh = m.height * sc2, ox = 52, oy = 10, rs = "";
      if (m.half) {
        var apex = ox + rw * 0.35;
        rs += '<rect x="' + ox + '" y="' + oy + '" width="' + f1(rw) + '" height="' + f1(rh) + '" style="fill:none;stroke:var(--ink-600);stroke-width:1.5;stroke-dasharray:5 4"/>';
        rs += '<path d="M' + ox + " " + f1(oy + rh) + "H" + f1(ox + rw) + "L" + f1(apex) + " " + oy + 'Z" style="fill:' + tint + ";stroke:" + bright + ';stroke-width:2;stroke-linejoin:round"/>';
        rs += '<path d="M' + f1(apex) + " " + oy + "V" + f1(oy + rh) + '" style="stroke:' + deep + ';stroke-width:1.5;stroke-dasharray:4 3"/>';
        rs += txt(apex + 6, oy + rh / 2 + 4, m.labels[1], { anchor: "start", size: 12 });
      } else if (m.cut) {
        var cw = m.cut[0] * sc2, ch = m.cut[1] * sc2;
        rs += '<path d="M' + ox + " " + oy + "H" + f1(ox + rw - cw) + "V" + f1(oy + ch) + "H" + f1(ox + rw) + "V" + f1(oy + rh) + "H" + ox + 'Z" style="fill:' + tint + ";stroke:" + bright + ';stroke-width:2;stroke-linejoin:round"/>';
        rs += '<rect x="' + f1(ox + rw - cw) + '" y="' + oy + '" width="' + f1(cw) + '" height="' + f1(ch) + '" style="fill:none;stroke:var(--action-500);stroke-width:1.5;stroke-dasharray:5 4"/>';
        if (m.labels.length === 4 && cw > 34 && ch > 16) rs += txt(ox + rw - cw / 2, oy + ch / 2 + 4, m.labels[2] + " × " + m.labels[3], { size: 11, ink: "var(--action-600)" });
        rs += txt(ox - 6, oy + rh / 2 + 4, m.labels[1], { anchor: "end", size: 12 });
      } else {
        rs += '<rect x="' + ox + '" y="' + oy + '" width="' + f1(rw) + '" height="' + f1(rh) + '" style="fill:' + tint + ";stroke:" + bright + ';stroke-width:2"/>';
        rs += txt(ox - 6, oy + rh / 2 + 4, m.labels[1], { anchor: "end", size: 12 });
      }
      rs += txt(ox + rw / 2, oy + rh + 18, m.labels[0], { size: 12 });
      art = svg(ox + rw + 12, oy + rh + 26, rs);
      words = "A rectangle " + m.labels[0] + " by " + m.labels[1] + (m.half ? ", with the triangle on its base shaded: half of it" : m.cut ? ", with a corner " + (m.labels[2] ? m.labels[2] + " by " + m.labels[3] + " " : "") + "cut away" : "");
    } else if (m.kind === "circle") {
      var R = 70, cx = 100, cy = 84, ra = 130 * Math.PI / 180, cs = "";
      cs += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" style="fill:' + tint + ";stroke:" + bright + ';stroke-width:2.5"/>';
      cs += '<path d="M' + (cx - R) + " " + cy + "H" + (cx + R) + '" style="stroke:' + deep + ';stroke-width:2.5"/>';
      cs += '<path d="M' + cx + " " + cy + "L" + f1(cx + R * Math.cos(ra)) + " " + f1(cy + R * Math.sin(ra)) + '" style="stroke:var(--action-500);stroke-width:2.5;stroke-linecap:round"/>';
      cs += '<circle cx="' + cx + '" cy="' + cy + '" r="3.5"' + fill("var(--ink-900)") + "/>";
      cs += txt(cx, cy - 9, "diameter " + m.diameter, { size: 12, weight: 700, ink: deep });
      cs += txt(cx, cy + R + 20, "radius " + m.radius, { size: 12, weight: 700, ink: "var(--action-600)" });
      art = svg(200, 182, cs);
      words = "A circle with a radius of " + m.radius + " and a diameter of " + m.diameter;
    } else if (m.kind === "turn") {
      var TR = 72, tx = 100, ty = 84, ts = "", start = -90;
      var wedge = function (a0, a1) {
        var p0 = [tx + TR * Math.cos(a0 * Math.PI / 180), ty + TR * Math.sin(a0 * Math.PI / 180)], p1 = [tx + TR * Math.cos(a1 * Math.PI / 180), ty + TR * Math.sin(a1 * Math.PI / 180)];
        return "M" + tx + " " + ty + "L" + f1(p0[0]) + " " + f1(p0[1]) + "A" + TR + " " + TR + " 0 " + (a1 - a0 > 180 ? 1 : 0) + " 1 " + f1(p1[0]) + " " + f1(p1[1]) + "Z";
      };
      var label = function (a0, a1, s2, ink) { var mid = (a0 + a1) / 2 * Math.PI / 180; return txt(tx + TR * 0.6 * Math.cos(mid), ty + TR * 0.6 * Math.sin(mid) + 4, s2, { size: 11.5, weight: 700, ink: ink }); };
      for (i = 0; i < m.count; i++) {
        var a0 = start + i * m.angle, a1 = a0 + m.angle;
        /* Copies alternate; an odd last one that would meet the first in the same colour gets a shade of its own. */
        var odd = i === m.count - 1 && m.count % 2 === 1 && m.count > 1 && !(m.gap > 0);
        ts += '<path d="' + wedge(a0, a1) + '" style="fill:' + (i % 2 ? tint : bright) + (odd ? ";fill-opacity:.55" : "") + ';stroke:var(--surface-200);stroke-width:2;stroke-linejoin:round"/>';
        if (m.angle >= 30) ts += label(a0, a1, m.angle + "°", i % 2 ? deep : "#fff");
      }
      if (m.gap > 0) {
        var g0 = start + m.count * m.angle;
        ts += '<path d="' + wedge(g0, g0 + m.gap) + '" style="fill:none;stroke:var(--action-500);stroke-width:2;stroke-dasharray:4 3;stroke-linejoin:round"/>';
        if (m.gap >= 20) ts += label(g0, g0 + m.gap, m.gap + "°", "var(--action-600)");
      }
      ts += '<circle cx="' + tx + '" cy="' + ty + '" r="3.5"' + fill("var(--ink-900)") + "/>";
      art = svg(200, 168, ts);
      words = m.count + " angles of " + m.angle + "° round a point" + (m.gap > 0 ? ", leaving a gap of " + m.gap + "°" : ", making the whole 360°");
    } else return null;
    return el("div.am-model", { role: "img", "aria-label": words + (m.caption ? ". " + m.caption : "") },
      art, m.caption ? el("span.am-model-cap", { "aria-hidden": "true" }, m.caption) : null);
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
    { key: "road", icon: "map", label: "Road" },
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
      el("span.am-streak-count", null, AM.Flame ? AM.Flame(32, days > 0) : icon("streak", 28),
        days > 0 ? el("span", null, el("b", null, String(days)), el("small", null, days === 1 ? "day" : "days", el("br"), "in a row"))
          : el("span.am-streak-start", null, "Start a", el("br"), "streak today")),
      week,
      el("span.am-goal-row", null, Ring(goal.met ? 1 : 0, 22),
        el("span", { style: { flex: 1, minWidth: 0 } }, goal.met ? el("b", null, "Today's goal done. ") : el("b", null, "Today: "),
          goal.met ? (goal.done > 1 ? goal.done + " rounds today." : "Anything more is a bonus.") : "one full round"),
        o.chip || null));
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
  AM.MathModel = MathModel;
  AM.tierGem = gem;
  AM.tierCrest = crest;
  AM.tierFrame = frameGrad;
  AM.weaveSVG = weaveSVG;
  AM.initialsOf = initialsOf;
  AM.monogramSVG = monogramSVG;
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
