/* Abante Minds — the badges, drawn.
   A topic's badges are one rounded hexagon in the topic's bright colour,
   with the topic's icon, on a ledge of its deep shade like every pressable
   thing in the app. There is no number on it: the level shows in the rim,
   which has one segment per level and lights one more each time, and in
   what is added as the topic goes on: laurels from halfway, a star, a gem,
   and at the last level a crown and a gold edge. Basics earn round tokens
   with the same rim. Special badges have their own shapes: a flame for a
   streak, a rosette for an exam, a bolt for the challenge round, an arrow
   for Improver, a heart for Welcome back. A badge not yet earned is its grey shape with a question mark.

   Colours come from the tokens in app.css through style="fill: var(...)",
   so there is one place to change them. Every drawing is decorative: the
   element around it carries the words. */
(function () {
  "use strict";

  var AM = window.AM;
  var HEX = "M100 22L170 62V142L100 182L30 142V62Z";
  var HEX_IN = "M100 38L156 70V134L100 166L44 134V70Z";
  var RING_IN = "M100 34A66 66 0 1 1 99.9 34";
  var GOLD = "#ffd23f", GOLD_DEEP = "#b98400";

  function fill(v) { return 'style="fill:' + v + '"'; }
  function hue(k, part) { return "var(--skill-" + k + "-" + part + ")"; }
  /* A badge not yet earned: the greys are tokens, so a dark page dims them. */
  var GREY = { b: "var(--badge-locked, #cfd8e6)", d: "var(--badge-locked-deep, #aebbd0)", t: "#ffffff" };
  function palette(o) {
    if (o.locked) return GREY;
    return { b: hue(o.colorKey, "bright"), d: hue(o.colorKey, "deep"), t: "#ffffff" };
  }

  /* What a level has added by now, from how far through its topic it is. */
  function ornaments(f) { return { laurel: f >= 0.5, star: f >= 0.66 && f < 1, gem: f >= 0.8, crown: f >= 1 }; }

  /* Rim segments `from` to `to` of `n`, drawn as one dashed stroke. */
  function segments(d, n, from, to, attrs) {
    if (to <= from) return "";
    var dash = ["0", String(from * 10)];
    for (var i = from; i < to; i++) dash.push("8.4", "1.6");
    dash.push("0", String(n * 10 + 20));
    return '<path d="' + d + '" pathLength="' + n * 10 + '" fill="none" stroke-dasharray="' + dash.join(" ") + '" stroke-dashoffset="-0.8" ' + attrs + "/>";
  }

  function glyph(name, color, x, y, s) {
    return '<svg x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '" viewBox="0 0 256 256" fill="currentColor" style="color:' + color + '">' + AM.iconMarkup(name) + "</svg>";
  }

  function frame(size, inner) {
    return '<svg class="am-badge-art" viewBox="-14 -20 228 240" width="' + size + '" height="' + Math.round(size * 240 / 228) +
      '" aria-hidden="true" focusable="false" style="overflow:visible;display:block">' + inner + "</svg>";
  }

  var QUESTION = '<text x="100" y="126" text-anchor="middle" font-family="Baloo 2, Lexend, sans-serif" font-weight="800" font-size="66" style="fill:#fff">?</text>';
  var SHINE = '<path d="M58 40L84 30L58 170L32 160Z" style="fill:#fff" opacity=".22"/>' +
    '<path d="M160 6l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" style="fill:#fff"/><path d="M30 150l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" style="fill:#fff"/>';

  /* A topic level's hexagon. `fresh` marks this level's own additions (its
     rim segment, and the ornament it brought, if any) so the level-up can
     animate them in. */
  function hexagon(o) {
    var p = palette(o), n = o.levels, L = o.locked ? 0 : o.level, f = L / n;
    var now = ornaments(f), was = ornaments((L - 1) / n), fresh = !!o.fresh && !o.locked;
    var mark = function (k) { return fresh && now[k] && !was[k] ? " am-b-new" : ""; };
    var s = "";
    if (now.laurel) {
      s += '<g class="am-b-laurel' + mark("laurel") + '">';
      [[22, 150, -50], [12, 124, -75], [12, 96, -100], [20, 70, -125]].forEach(function (a) {
        s += '<ellipse cx="' + a[0] + '" cy="' + a[1] + '" rx="14" ry="7" transform="rotate(' + a[2] + " " + a[0] + " " + a[1] + ')" ' + fill(p.d) + "/>" +
          '<ellipse cx="' + (200 - a[0]) + '" cy="' + a[1] + '" rx="14" ry="7" transform="rotate(' + (-a[2]) + " " + (200 - a[0]) + " " + a[1] + ')" ' + fill(p.d) + "/>";
      });
      s += "</g>";
    }
    if (now.crown) s += '<g class="am-b-goldedge' + mark("crown") + '"><path d="' + HEX + '" transform="translate(0 11)" stroke="' + GOLD_DEEP + '" stroke-width="32" stroke-linejoin="round" ' + fill(GOLD_DEEP) + '/><path d="' + HEX + '" stroke="' + GOLD + '" stroke-width="32" stroke-linejoin="round" ' + fill(GOLD) + "/></g>";
    s += '<path d="' + HEX + '" transform="translate(0 11)" stroke-width="18" stroke-linejoin="round" style="fill:' + p.d + ";stroke:" + p.d + '"/>' +
      '<path d="' + HEX + '" stroke-width="18" stroke-linejoin="round" style="fill:' + p.b + ";stroke:" + p.b + '"/>' +
      (o.locked ? "" : '<path d="M30 62L100 22L170 62L100 96Z" style="fill:#fff" opacity=".16"/>');
    s += segments(HEX_IN, n, 0, n, 'stroke="#fff" stroke-opacity="' + (o.locked ? 0.6 : 0.32) + '" stroke-width="7"');
    s += segments(HEX_IN, n, 0, fresh ? L - 1 : L, 'stroke="#fff" stroke-width="7"');
    if (fresh) s += segments(HEX_IN, n, L - 1, L, 'class="am-b-newseg" stroke="#fff" stroke-width="7"');
    s += o.locked ? QUESTION : glyph(o.icon, p.t, 66, 66, 68);
    if (now.star) s += '<g class="am-b-star' + mark("star") + '"><path d="M100 -8l6.5 13 14 2-10 9.8 2.4 14-12.9-6.8-12.9 6.8 2.4-14-10-9.8 14-2z" stroke="' + GOLD_DEEP + '" stroke-width="3" stroke-linejoin="round" ' + fill(GOLD) + "/></g>";
    if (now.gem) s += '<g class="am-b-gem' + mark("gem") + '"><path d="M100 178L115 194L100 210L85 194Z" stroke="#2b8fb0" stroke-width="3" stroke-linejoin="round" ' + fill("#8ee6ff") + '/><path d="M100 184L107 194L100 194Z" style="fill:#fff" opacity=".8"/></g>';
    if (now.crown) s += '<g class="am-b-crown' + mark("crown") + '"><path d="M70 18L73 -8L88 6L100 -14L112 6L127 -8L130 18Z" stroke="' + GOLD_DEEP + '" stroke-width="3.5" stroke-linejoin="round" ' + fill(GOLD) + '/><circle cx="100" cy="-14" r="4" style="fill:#fff"/></g>';
    if (o.shiny && !o.locked) s += '<path d="' + HEX + '" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round" opacity=".9"/>' + SHINE;
    return frame(o.size || 84, s);
  }

  /* A Basics level's token: a coin with the same rim, gold-rimmed when the
     topic's last level is done. */
  function token(o) {
    var p = palette(o), n = o.levels, L = o.locked ? 0 : o.level, s = "";
    if (L === n) s += '<circle cx="100" cy="111" r="92" ' + fill(GOLD_DEEP) + '/><circle cx="100" cy="100" r="92" ' + fill(GOLD) + "/>";
    s += '<circle cx="100" cy="111" r="82" ' + fill(p.d) + '/><circle cx="100" cy="100" r="82" ' + fill(p.b) + "/>" +
      (o.locked ? "" : '<path d="M36 84A66 66 0 0 1 164 84" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="16" stroke-linecap="round"/>');
    s += segments(RING_IN, n, 0, n, 'stroke="#fff" stroke-opacity="' + (o.locked ? 0.6 : 0.32) + '" stroke-width="7"');
    s += segments(RING_IN, n, 0, o.fresh ? L - 1 : L, 'stroke="#fff" stroke-width="7"');
    if (o.fresh && !o.locked) s += segments(RING_IN, n, L - 1, L, 'class="am-b-newseg" stroke="#fff" stroke-width="7"');
    s += o.locked ? QUESTION : glyph(o.icon, p.t, 68, 68, 64);
    if (o.shiny && !o.locked) s += '<circle cx="100" cy="100" r="82" fill="none" stroke="#fff" stroke-width="5" opacity=".9"/>' + SHINE;
    return frame(o.size || 84, s);
  }

  /* Bronze, silver, gold and gem rims for a special badge's tier. */
  var TIER = { 1: "#d9905a", 2: "#c3ccd9", 3: GOLD, 4: "#8ee6ff" };
  var FLAME = "M220 144A92 92 0 0 1 36 144C36 115.2 47.3 85.8 69.5 56.7A12 12 0 0 1 87.4 55.4L107.1 74.5L127 19.9A12 12 0 0 1 145.9 14.8C168.2 33.3 220 82.9 220 144Z";
  function special(o) {
    var g = !!o.locked, s = "";
    if (o.kind === "exam") {
      s += '<path d="M70 130L54 212L76 200L90 222L104 140Z" ' + fill(g ? "#c9d3e2" : "var(--action-500)") + '/>' +
        '<path d="M130 130L146 212L124 200L110 222L96 140Z" ' + fill(g ? "#b5c1d3" : "var(--brand-blue-600)") + '/>' +
        '<circle cx="100" cy="102" r="76" ' + fill(g ? GREY.d : "#173f99") + '/><circle cx="100" cy="94" r="76" ' + fill(g ? GREY.b : TIER[o.tier]) + '/>' +
        '<circle cx="100" cy="94" r="60" ' + fill(g ? GREY.b : "var(--brand-blue-600)") + '/>' +
        '<path d="M72 96l18 18 38-40" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>';
      return frame(o.size || 64, s);
    }
    var body = { streak: ["var(--action-500)", "var(--action-700)"], challenge: [hue(3, "bright"), hue(3, "deep")], improver: [hue(4, "bright"), hue(4, "deep")], welcome: [hue(2, "bright"), hue(2, "deep")] }[o.kind];
    if (g) body = [GREY.b, GREY.d];
    s += '<circle cx="100" cy="111" r="82" ' + fill(body[1]) + '/><circle cx="100" cy="100" r="82" ' + fill(body[0]) + "/>";
    if ((o.kind === "streak" || o.kind === "challenge") && !g) s += '<circle cx="100" cy="100" r="76" fill="none" stroke="' + TIER[o.tier] + '" stroke-width="10"/>';
    if (o.kind === "streak") s += '<path d="' + FLAME + '" transform="translate(57 54) scale(.34)" style="fill:#fff"/>';
    if (o.kind === "challenge") s += '<path d="M112 42L62 112H95L85 158L138 86H104Z" stroke="#fff" stroke-width="6" stroke-linejoin="round" style="fill:#fff"/>';
    if (o.kind === "improver") s += '<path d="M100 150V62M64 96L100 60L136 96" fill="none" stroke="#fff" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>';
    if (o.kind === "welcome") s += '<path d="M100 148C62 122 48 102 48 82A25 25 0 0 1 100 70A25 25 0 0 1 152 82C152 102 138 122 100 148Z" style="fill:#fff"/>';
    return frame(o.size || 64, s);
  }

  /* Any badge from the store's catalogue (store.catalog / findBadge). */
  function art(found, size, opts) {
    var b = found.badge, t = found.topic, o = opts || {};
    if (!t) return special({ kind: b.kind, tier: b.tier, locked: !b.earned, size: size });
    var spec = { colorKey: t.colorKey, icon: t.icon, level: b.number, levels: b.total, locked: !b.earned, shiny: b.shiny, fresh: o.fresh, size: size };
    return t.track === "basics" ? token(spec) : hexagon(spec);
  }

  /* The element: the drawing, with the words a screen reader says. */
  function Badge(found, size, opts) {
    var b = found.badge;
    var words = b.name + (b.earned ? (b.shiny ? ", shiny" : "") : ", not earned yet");
    return AM.el("span.am-badge", { role: "img", "aria-label": words, style: { display: "inline-block", lineHeight: 0 }, html: art(found, size, opts) });
  }

  AM.badgeArt = { hexagon: hexagon, token: token, special: special, art: art, ornaments: ornaments };
  AM.Badge = Badge;
})();
