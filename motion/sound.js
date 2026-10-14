/* Abante Minds — sound.
   Every sound is made on the phone with the Web Audio API, so there is no
   file to download and nothing to cache. The voice is the kulintang: a row
   of tuned bronze gong-chimes from Mindanao, with the agung, the big low
   gong, under the biggest moments. Synthesised impressions, not recordings.

   The shape follows what makes a reward sound feel good: rising for right
   and falling for wrong, notes from one five-note scale, most of the sound
   in the middle range with a little shimmer on top, a small sound for a
   frequent moment and the whole phrase only for a rare one. A wrong answer
   is soft and low, never a buzzer.

   Sound plays only with the learner's Sound setting on and the page in
   view. A phone's browser starts audio only after a tap, so the context is
   created and resumed inside the first one. */
(function () {
  "use strict";

  var ac = null, master = null;

  function enabled() {
    var store = window.AM && window.AM.store;
    return !document.hidden && (!store || store.settings().sound);
  }

  function ctx() {
    if (!ac) {
      var A = window.AudioContext || window.webkitAudioContext;
      if (!A) return null;
      try { ac = new A(); } catch (e) { return null; }
      master = ac.createGain();
      master.gain.value = 0.5;
      var comp = ac.createDynamicsCompressor();
      master.connect(comp);
      comp.connect(ac.destination);
    }
    if (ac.state === "suspended" && ac.resume) ac.resume();
    return ac;
  }

  /* One tone: a pitch that can slide, through a soft low-pass, on a quick
     rise and an exponential fall. */
  function tone(f, t, d, o) {
    o = o || {};
    var a = ctx(); if (!a) return;
    var now = a.currentTime + t, osc = a.createOscillator(), v = a.createGain(), lp = a.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = o.lp || 4000; lp.Q.value = 0.7;
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(f, now);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, now + (o.glide || d));
    v.gain.setValueAtTime(0.0001, now);
    v.gain.exponentialRampToValueAtTime(o.g || 0.2, now + (o.att || 0.006));
    v.gain.exponentialRampToValueAtTime(0.0001, now + d);
    osc.connect(lp); lp.connect(v); v.connect(master);
    osc.start(now); osc.stop(now + d + 0.05);
  }

  function noise(t, d, o) {
    o = o || {};
    var a = ctx(); if (!a) return;
    var now = a.currentTime + t, len = Math.max(1, Math.floor(a.sampleRate * d));
    var buf = a.createBuffer(1, len, a.sampleRate), ch = buf.getChannelData(0);
    for (var i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    var src = a.createBufferSource(); src.buffer = buf;
    var fl = a.createBiquadFilter(); fl.type = o.type || "lowpass"; fl.Q.value = o.q || 0.7;
    fl.frequency.setValueAtTime(o.f || 800, now);
    if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, now + d);
    var v = a.createGain();
    v.gain.setValueAtTime(0.0001, now);
    v.gain.exponentialRampToValueAtTime(o.g || 0.1, now + (o.att || 0.01));
    v.gain.exponentialRampToValueAtTime(0.0001, now + d);
    src.connect(fl); fl.connect(v); v.connect(master);
    src.start(now); src.stop(now + d + 0.05);
  }

  /* A gong-chime settles onto its pitch, rings with a few uneven overtones,
     and is struck with a padded mallet. */
  function gong(f, t, g, len) {
    g = g || 0.18; len = len || 1;
    tone(f * 1.012, t, 1.3 * len, { g: g, f2: f, glide: 0.08, lp: 2400 });
    tone(f * 2.0, t, 0.7 * len, { g: g * 0.33, lp: 3000 });
    tone(f * 2.76, t, 0.35 * len, { g: g * 0.12, lp: 3500 });
    tone(f * 4.07, t, 0.18 * len, { g: g * 0.05, lp: 4000 });
    noise(t, 0.04, { f: 900, g: g * 0.25 });
  }
  /* The agung: a big low gong with a slow beat in its ring. */
  function agung(t, g) {
    g = g || 0.3;
    tone(112, t, 2.6, { g: g, f2: 108, glide: 0.4, lp: 900 });
    tone(113.6, t, 2.4, { g: g * 0.6, lp: 900 });
    tone(112 * 2.42, t, 0.9, { g: g * 0.15, lp: 1200 });
    noise(t, 0.08, { f: 400, g: g * 0.3 });
  }

  /* The five-note scale the phrases are drawn from. */
  var D4 = 293.7, E4 = 329.6, G4 = 392, A4 = 440, D5 = 587.3, E5 = 659.3, G5 = 784, A5 = 880;
  var RISE = [G4, A4, D5, E5, G5, A5];

  var SOUNDS = {
    tap: function () { gong(G5, 0, 0.04, 0.2); },
    correct: function () { gong(A4, 0, 0.18, 0.8); gong(D5, 0.11, 0.18, 0.9); },
    /* Three rising notes, starting higher the longer the run. */
    combo: function (n) { var s = Math.min(Math.max((n || 3) - 3, 0), 3); RISE.slice(s, s + 3).forEach(function (f, i) { gong(f, i * 0.09, 0.16, 0.7); }); },
    wrong: function () { gong(E4, 0, 0.13, 0.6); gong(D4, 0.15, 0.12, 0.7); },
    ignite: function () { noise(0, 0.5, { f: 250, f2: 1100, g: 0.09, att: 0.18 }); gong(D4, 0.1, 0.16, 1); },
    fizzle: function () { noise(0, 0.4, { f: 900, f2: 250, g: 0.07 }); gong(D4, 0, 0.07, 0.5); },
    whoosh: function () { noise(0, 0.45, { f: 250, f2: 1200, g: 0.09, att: 0.15 }); },
    thump: function () { agung(0, 0.32); },
    pop: function () { gong(E5, 0, 0.08, 0.4); },
    sparkle: function () { [D5, E5, G5].forEach(function (f, i) { gong(f, i * 0.06, 0.07, 0.4); }); },
    roll: function () { [D4, E4, G4].forEach(function (f, i) { gong(f, i * 0.05, 0.06, 0.3); }); },
    check: function () { gong(G4, 0, 0.14, 0.6); gong(D5, 0.09, 0.14, 0.7); },
    unlock: function () { gong(E5, 0, 0.12, 0.6); gong(A5 * 0.75, 0.1, 0.12, 0.7); },
    step: function (i) { gong(RISE[Math.min(i || 0, RISE.length - 1)], 0, 0.15, 0.8); },
    charge: function () { [D4, E4, G4, A4].forEach(function (f, i) { gong(f, i * 0.09, 0.08, 0.4); }); },
    fanfare: function () {
      [D5, E5, G5, E5, A5].forEach(function (f, i) { gong(f, i * 0.09, 0.14, 0.7); });
      agung(0.46, 0.28); gong(D5, 0.48, 0.1, 1.2); gong(A4, 0.48, 0.1, 1.2);
    }
  };

  /* play("correct"), play("combo", 5). Silent, and harmless, wherever audio
     is unavailable or the learner has turned sound off. */
  function play(name, arg) {
    if (!enabled() || !SOUNDS[name]) return;
    try { SOUNDS[name](arg); } catch (e) { /* a browser that refuses is a quiet browser */ }
  }

  /* A phone lets audio start only inside a tap: a finger's pointerup or
     touchend, a mouse's pointerdown, a key. Each of them wakes the audio,
     with a silent note so iOS counts it as started, until it is running,
     so the first sound is not lost. */
  var WAKERS = ["pointerdown", "pointerup", "touchend", "keydown"];
  function wake() {
    if (!enabled()) return;
    var a = ctx();
    if (!a) return;
    if (a.state === "running") {
      WAKERS.forEach(function (ev) { document.removeEventListener(ev, wake, true); });
      return;
    }
    try {
      var src = a.createBufferSource();
      src.buffer = a.createBuffer(1, 1, a.sampleRate);
      src.connect(a.destination);
      src.start(0);
    } catch (e) { /* nothing to wake */ }
  }
  WAKERS.forEach(function (ev) { document.addEventListener(ev, wake, true); });

  window.AbanteMinds = window.AbanteMinds || {};
  window.AbanteMinds.sound = { play: play, wake: wake, NAMES: Object.keys(SOUNDS) };
})();
