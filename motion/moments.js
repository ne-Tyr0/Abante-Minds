/* Abante Minds — moments: the combo, the streak, the level-up.
   Built on the Web Animations API, as motion.js is, so there is no library
   to download. Three pieces:

   - A timeline: animations and calls placed at times. A tap can skip it to
     its end, and a skip runs the calls that change what the screen shows,
     but not the sounds and confetti along the way.
   - Particles: confetti that falls and flutters, sparks, stars, embers and
     smoke, on one canvas laid over the app and removed when still.
   - The flame: the app's streak glyph filled in, on a ledge of its deep
     shade, with a gold inner flame and a pale core. Idle, one slow wave
     bends only its tip and side curl while the base stays put, and the
     inner flames follow it a moment later, so it moves as one body.

   With Calm animations on, or the phone asking for reduced motion, there
   is no particle and no idle movement, and a timeline lands at its end at
   once. One beat at a time, nothing random, nothing that loops but the
   flame: that is the house style for motion. */
(function () {
  "use strict";

  var motion = window.AbanteMinds && window.AbanteMinds.motion;
  function reduced() { return motion ? motion.reduced() : false; }

  var EASE_OUT = "cubic-bezier(0.2, 0.8, 0.2, 1)";
  var EASE_IN = "cubic-bezier(0.4, 0, 1, 1)";
  var BACK = "cubic-bezier(0.34, 1.56, 0.64, 1)";
  var BACK_SOFT = "cubic-bezier(0.34, 1.3, 0.64, 1)";

  /* ---------- timeline ---------- */
  function Timeline() { this.anims = []; this.calls = []; this.skipped = false; }
  /* An animation that starts at `at` seconds. fill: both, so an element waits
     in its first frame and stays in its last. */
  Timeline.prototype.to = function (el, frames, ms, at, easing) {
    if (!el || !el.animate) return this;
    var a = el.animate(frames, { duration: ms, delay: (at || 0) * 1000, easing: easing || EASE_OUT, fill: "both" });
    this.anims.push(a);
    return this;
  };
  /* A call at `at` seconds. `keep` marks one that changes what the screen
     shows, so a skip still makes it. */
  Timeline.prototype.call = function (fn, at, keep) {
    var rec = { fn: fn, keep: !!keep, ran: false };
    var self = this;
    rec.id = window.setTimeout(function () { if (!rec.ran && !self.skipped) { rec.ran = true; fn(); } }, (at || 0) * 1000);
    this.calls.push(rec);
    return this;
  };
  Timeline.prototype.skip = function () {
    if (this.skipped) return;
    this.skipped = true;
    this.anims.forEach(function (a) { try { a.finish(); } catch (e) { /* already gone */ } });
    this.calls.forEach(function (r) {
      window.clearTimeout(r.id);
      if (!r.ran && r.keep) { r.ran = true; try { r.fn(); } catch (e) { /* the screen has moved on */ } }
    });
  };

  /* ---------- particles ---------- */
  var FX = (function () {
    var cv = null, c = null, W = 0, H = 0, ps = [], raf = 0, last = 0;
    var CONF = ["#f5b400", "#ff8a15", "#2458c9", "#c93830", "#7b6cf6", "#13a3b3", "#e2559f", "#25a356", "#ffd23f"];
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
    function shade(hex) { var n = parseInt(hex.slice(1), 16); return "rgb(" + ((n >> 16) * 0.7 | 0) + "," + (((n >> 8) & 255) * 0.7 | 0) + "," + ((n & 255) * 0.7 | 0) + ")"; }
    function ensure() {
      if (!cv) {
        cv = document.createElement("canvas");
        cv.className = "am-fx";
        cv.setAttribute("aria-hidden", "true");
        cv.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:50";
        c = cv.getContext("2d");
      }
      if (!cv.isConnected) document.body.appendChild(cv);
      var d = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * d); cv.height = Math.round(H * d);
      c.setTransform(d, 0, 0, d, 0, 0);
    }
    function add(p) {
      if (reduced() || document.hidden) return;
      if (!raf) { ensure(); last = performance.now(); raf = requestAnimationFrame(tick); }
      ps.push(p);
    }
    function tick(now) {
      var dt = Math.min(0.034, (now - last) / 1000); last = now;
      c.clearRect(0, 0, W, H);
      for (var i = ps.length - 1; i >= 0; i--) {
        var p = ps[i];
        p.life -= dt;
        if (p.life <= 0 || p.y > H + 60) { ps.splice(i, 1); continue; }
        var k = Math.pow(p.drag, dt * 60);
        p.vx *= k; p.vy *= k; p.vy += p.g * dt;
        if (p.term && p.vy > p.term) p.vy += (p.term - p.vy) * Math.min(1, dt * 4);
        p.tilt += p.vt * dt; p.rot += p.vr * dt;
        p.x += (p.vx + (p.wob ? Math.sin(p.tilt * 0.9) * p.wob : 0)) * dt; p.y += p.vy * dt;
        if (p.grow) p.r += p.grow * dt;
        draw(p);
      }
      c.globalAlpha = 1;
      if (ps.length) raf = requestAnimationFrame(tick);
      else { raf = 0; c.clearRect(0, 0, W, H); if (cv.parentNode) cv.parentNode.removeChild(cv); }
    }
    function draw(p) {
      c.globalAlpha = Math.max(0, Math.min(1, p.life / p.fade));
      if (p.kind === "conf") {
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
        var s = Math.cos(p.tilt); c.scale(1, Math.abs(s) < 0.08 ? 0.08 : s);
        c.fillStyle = s > 0 ? p.c : p.c2;
        if (p.shape === 1) { c.beginPath(); c.arc(0, 0, p.w * 0.45, 0, 6.283); c.fill(); }
        else c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        c.restore();
      } else if (p.kind === "spark") {
        c.strokeStyle = p.c; c.lineWidth = p.r; c.lineCap = "round";
        c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035); c.stroke();
      } else if (p.kind === "star") {
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.c; c.beginPath();
        for (var j = 0; j < 8; j++) { var ang = j * Math.PI / 4, rr = j % 2 ? p.r * 0.36 : p.r; c.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); }
        c.closePath(); c.fill(); c.restore();
      } else {
        c.fillStyle = p.c;
        if (p.kind === "ember") { var a = c.globalAlpha; c.globalAlpha = a * 0.16; c.beginPath(); c.arc(p.x, p.y, p.r * 1.9, 0, 6.283); c.fill(); c.globalAlpha = a; }
        c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill();
      }
    }
    function base(o) { o.tilt = o.tilt || 0; o.vt = o.vt || 0; o.rot = o.rot || 0; o.vr = o.vr || 0; return o; }
    return {
      /* A burst of confetti from (x, y), up and out at `ang` degrees. */
      confetti: function (x, y, ang, spread, s0, s1, n) {
        for (var i = 0; i < n; i++) {
          var a = (ang + (Math.random() - 0.5) * spread) * Math.PI / 180, sp = rnd(s0, s1), col = pick(CONF);
          add({ kind: "conf", x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 900, drag: 0.972, term: rnd(110, 210),
            rot: rnd(0, 6.28), vr: rnd(-7, 7), tilt: rnd(0, 6.28), vt: rnd(5, 13), wob: rnd(20, 60),
            w: rnd(7, 12), h: rnd(4, 7), shape: Math.random() < 0.16 ? 1 : 0, c: col, c2: shade(col), life: rnd(2.6, 3.6), fade: 0.7 });
        }
      },
      sparks: function (x, y, n, colors) { for (var i = 0; i < n; i++) { var a = rnd(0, 6.283), sp = rnd(220, 460); add(base({ kind: "spark", x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 500, drag: 0.92, r: rnd(2, 3.2), c: pick(colors), life: rnd(0.3, 0.5), fade: 0.3 })); } },
      stars: function (x, y, n, colors) { for (var i = 0; i < n; i++) { var a = rnd(0, 6.283), sp = rnd(100, 260); add(base({ kind: "star", x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, g: 380, drag: 0.95, r: rnd(4, 7), rot: rnd(0, 3), vr: rnd(-6, 6), c: pick(colors), life: rnd(0.6, 1), fade: 0.5 })); } },
      embers: function (x, y, n) { for (var i = 0; i < n; i++) add(base({ kind: "ember", x: x + rnd(-14, 14), y: y + rnd(-6, 6), vx: rnd(-14, 14), vy: rnd(-70, -35), g: -12, drag: 0.985, r: rnd(1.6, 2.8), wob: rnd(6, 14), tilt: rnd(0, 6), vt: rnd(2, 4), c: pick(["#ffd23f", "#ff8a15", "#ffb000"]), life: rnd(0.9, 1.5), fade: 1 })); },
      smoke: function (x, y, n) { for (var i = 0; i < n; i++) add(base({ kind: "smoke", x: x + rnd(-10, 10), y: y + rnd(-6, 6), vx: rnd(-18, 18), vy: rnd(-70, -40), g: -10, drag: 0.98, r: rnd(5, 9), grow: rnd(16, 28), c: "rgba(81,97,122,0.28)", life: rnd(0.7, 1.1), fade: 0.9 })); },
      clear: function () { ps.length = 0; }
    };
  })();

  /* A number counting up to `to`, easing out, ending exactly on it with its
     suffix. */
  function count(el, to, suffix, ms) {
    if (!el) return;
    var start = performance.now();
    function frame(now) {
      var t = Math.min(1, (now - start) / ms);
      el.textContent = Math.round(to * (1 - Math.pow(1 - t, 2))) + (suffix || "");
      if (t < 1 && el.isConnected) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* The middle of an element, on screen. */
  function centre(el, fy) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * (fy === undefined ? 0.5 : fy), w: r.width, h: r.height };
  }

  /* ---------- the flame ---------- */
  function flamePath(px, py, sx, sy) {
    var f = function (n) { return n.toFixed(1); };
    return "M220 144A92 92 0 0 1 36 144C36 115.2 " + f(47.3 + sx * 0.3) + " " + f(85.8 + sy * 0.5) + " " + f(69.5 + sx) + " " + f(56.7 + sy) +
      "A12 12 0 0 1 " + f(87.4 + sx) + " " + f(55.4 + sy) + "L" + f(107.1 + (sx + px) / 2) + " " + f(74.5 + (sy + py) / 2) +
      "L" + f(127 + px) + " " + f(19.9 + py) + "A12 12 0 0 1 " + f(145.9 + px) + " " + f(14.8 + py) +
      "C" + f(168.2 + px * 0.6) + " " + f(33.3 + py * 0.6) + " 220 82.9 220 144Z";
  }
  var REST = flamePath(0, 0, 0, 0);
  /* A flame `size` pixels wide. lit: false draws it grey, as a run of two
     waits for its third. */
  function Flame(size, lit) {
    var w = AM.el("span.am-flame", { "aria-hidden": "true", style: { display: "inline-flex", width: size, height: Math.round(size * 1.05), flex: "none" } });
    w.innerHTML = '<svg viewBox="0 -12 256 268" width="100%" height="100%" style="overflow:visible;display:block">' +
      '<path class="am-f-shelf" transform="translate(0 10)" style="fill:var(--action-700)" d="' + REST + '"/>' +
      '<path class="am-f-body" style="fill:var(--action-500)" d="' + REST + '"/>' +
      '<g transform="translate(128 236) scale(0.6) translate(-128 -236)"><path class="am-f-mid" style="fill:#ffb000" d="' + REST + '"/></g>' +
      '<g transform="translate(128 236) scale(0.3) translate(-128 -236)"><path class="am-f-core" style="fill:#fff1b8" d="' + REST + '"/></g></svg>';
    if (lit === false) { w.style.filter = "grayscale(1)"; w.style.opacity = "0.45"; }
    return w;
  }
  /* The idle wave, for as long as the flame is on screen. */
  function flow(w, amp) {
    if (!w || reduced()) return;
    var svg = w.querySelector("svg");
    var body = svg.querySelector(".am-f-body"), shelf = svg.querySelector(".am-f-shelf"),
      mid = svg.querySelector(".am-f-mid"), core = svg.querySelector(".am-f-core");
    var TAU = Math.PI * 2, t0 = performance.now();
    function wave(t, k) {
      return { px: k * (6 * Math.sin(TAU * t / 1.9) + 2.5 * Math.sin(TAU * t / 0.95 + 1.3)), py: k * 5 * Math.sin(TAU * t / 1.4 + 0.6),
        sx: k * 3 * Math.sin(TAU * t / 1.7 + 2), sy: k * 4 * Math.sin(TAU * t / 1.25 + 0.4) };
    }
    function step(now) {
      if (!w.isConnected || reduced()) return;
      if (!document.hidden) {
        var t = (now - t0) / 1000, p = wave(t, amp), q = wave(t - 0.22, amp * 1.7), r = wave(t - 0.4, amp * 2.6);
        var d = flamePath(p.px, p.py, p.sx, p.sy);
        body.setAttribute("d", d); shelf.setAttribute("d", d);
        mid.setAttribute("d", flamePath(q.px, q.py, q.sx, q.sy));
        core.setAttribute("d", flamePath(r.px, r.py, r.sx, r.sy));
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  /* Lights a flame: a spark at its base rises into it, height first and
     width a beat later, with a few embers. */
  function ignite(tl, w, at, amp) {
    tl.to(w, [{ transform: "scale(0.3, 0.04)", filter: "grayscale(1)", opacity: 0.45 }, { transform: "scale(1, 1)", filter: "grayscale(0)", opacity: 1 }], 650, at, BACK_SOFT)
      .call(function () { w.style.filter = ""; w.style.opacity = ""; var p = centre(w, 0.3); FX.embers(p.x, p.y, 5); }, at + 0.3, true)
      .call(function () { flow(w, amp); }, at + 0.7, true);
    w.style.transformOrigin = "50% 92%";
  }

  /* ---------- the combo ----------
     After a right answer that makes a run of two or more. Two: the chip
     arrives with its flame unlit. Three: the flame lights. Every fifth: the
     chip turns gold, the frame glows once, a little confetti, and a word
     floats up. Otherwise the chip gives a small bump. */
  function combo(chip, run) {
    if (!chip) return;
    var fl = chip.querySelector(".am-flame");
    if (reduced()) { if (run >= 3) chip.querySelector(".am-flame").style.cssText += ";filter:none;opacity:1"; return; }
    var tl = new Timeline();
    if (run === 2) tl.to(chip, [{ transform: "scale(0.3) translateY(18px)", opacity: 0 }, { transform: "none", opacity: 1 }], 550, 0.05, BACK);
    else tl.to(chip, [{ transform: "scale(1)" }, { transform: "scale(1.16)" }, { transform: "scale(1)" }], 520, 0.05, BACK_SOFT);
    if (run === 3) ignite(tl, fl, 0.15, 0.5);
    else if (run > 3) tl.call(function () { flow(fl, 0.5); }, 0, true);
    if (run % 5 === 0) {
      var frame = document.querySelector(".am-frame");
      var glow = AM.el("div.am-edge-glow", { "aria-hidden": "true" });
      if (frame) frame.appendChild(glow);
      tl.to(glow, [{ opacity: 0 }, { opacity: 0.9 }, { opacity: 0 }], 900, 0.1, "ease-in-out")
        .call(function () {
          var p = centre(chip);
          FX.confetti(p.x - p.w / 2, p.y, -125, 50, 360, 640, 28);
          FX.confetti(p.x + p.w / 2, p.y, -55, 50, 360, 640, 28);
          var word = chip.parentNode.querySelector(".am-combo-word");
          if (word) word.animate([{ transform: "translate(-10px, -50%) scale(0.6)", opacity: 0 }, { transform: "translate(0, -50%) scale(1)", opacity: 1, offset: 0.3 }, { transform: "translate(0, -50%) scale(1)", opacity: 1, offset: 0.75 }, { transform: "translate(6px, -70%)", opacity: 0 }], { duration: 1800, easing: EASE_OUT, fill: "both" });
          if (window.AbanteMinds.sound) window.AbanteMinds.sound.play("sparkle");
        }, 0.15)
        .call(function () { if (glow.parentNode) glow.parentNode.removeChild(glow); }, 1.1, true);
    }
  }
  /* A run of three or more broken: the flame goes out in a little smoke. */
  function putOut(chip) {
    if (!chip || reduced()) return;
    var fl = chip.querySelector(".am-flame");
    var tl = new Timeline();
    fl.style.transformOrigin = "50% 92%";
    tl.to(fl, [{ transform: "scale(1, 1)" }, { transform: "scale(0.5, 0.05)" }], 380, 0.1, EASE_IN)
      .call(function () { var p = centre(fl, 0.5); FX.smoke(p.x, p.y, 6); if (window.AbanteMinds.sound) window.AbanteMinds.sound.play("fizzle"); }, 0.15)
      .to(chip, [{ opacity: 1 }, { opacity: 0.55 }], 300, 0.45);
  }

  window.AbanteMinds = window.AbanteMinds || {};
  window.AbanteMinds.moments = {
    Timeline: Timeline, FX: FX, Flame: Flame, flow: flow, ignite: ignite, centre: centre, count: count,
    combo: combo, putOut: putOut, reduced: reduced,
    ease: { out: EASE_OUT, in: EASE_IN, back: BACK, backSoft: BACK_SOFT }
  };
  /* The flame is drawn by screens.js through AM, beside the badges. */
  window.AM.Flame = Flame;
})();
