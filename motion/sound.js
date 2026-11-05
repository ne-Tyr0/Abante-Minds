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


  /* ---------- the sounds the owner kept (the Sound Lab, November 2026) ----------
     Each has one job, so no single tone repeats for everything: number
     notes for the keypad, soft wood for picking, a ladder that climbs with
     a run of right answers, a drum pick-up at 3, 5 and 10 in a row, a held
     gong for a wrong answer, a kulintang run for a level, a procession for
     a streak milestone, and the rest below. Each sound is a list of events:
     [when, instrument, note, loudness, length]. */
  var INST = {
    gong: function (f, t, g, l) { g = g || .18; l = l || 1; tone(f * 1.012, t, 1.3 * l, { g: g, f2: f, glide: .08, lp: 2400 }); tone(f * 2, t, .7 * l, { g: g * .33, lp: 3000 }); tone(f * 2.76, t, .35 * l, { g: g * .12, lp: 3500 }); tone(f * 4.07, t, .18 * l, { g: g * .05, lp: 4000 }); noise(t, .04, { f: 900, g: g * .25 }); },
    muted: function (f, t, g) { g = g || .16; tone(f * 1.01, t, .3, { g: g, f2: f, glide: .05, lp: 1300 }); tone(f * 2, t, .12, { g: g * .2, lp: 1500 }); noise(t, .05, { f: 450, g: g * .3 }); },
    agung: function (f, t, g, l) { f = f || 112; g = g || .3; l = l || 1; tone(f, t, 2.6 * l, { g: g, f2: f * .965, glide: .4, lp: 900 }); tone(f * 1.014, t, 2.4 * l, { g: g * .6, lp: 900 }); tone(f * 2.42, t, .9 * l, { g: g * .15, lp: 1200 }); noise(t, .08, { f: 400, g: g * .3 }); },
    babendil: function (f, t, g) { f = f || 1180; g = g || .06; tone(f, t, .22, { g: g, lp: 6000, type: "triangle" }); tone(f * 1.47, t, .14, { g: g * .6, lp: 7000 }); tone(f * 2.09, t, .08, { g: g * .4, lp: 8000 }); noise(t, .025, { type: "bandpass", f: 3200, q: 2, g: g * .8 }); },
    drum: function (f, t, g) { f = f || 150; g = g || .3; tone(f, t, .32, { g: g, f2: f * .45, glide: .12, lp: 800 }); noise(t, .05, { f: 700, g: g * .35 }); },
    slap: function (f, t, g) { g = g || .12; noise(t, .06, { type: "bandpass", f: 1900, q: 1.2, g: g }); tone(320, t, .06, { g: g * .4, lp: 1500 }); },
    wood: function (f, t, g) { g = g || .14; tone(f, t, .16, { g: g, lp: 5000, att: .002 }); tone(f * 3.93, t, .05, { g: g * .25, lp: 7000, att: .002 }); noise(t, .012, { type: "bandpass", f: Math.min(8000, f * 2.2), q: 3, g: g * .5, att: .001 }); },
    shimmer: function (f, t, g) { g = g || .05; tone(f, t, .5, { g: g, lp: 9000, type: "triangle" }); tone(f * 2.01, t, .35, { g: g * .5, lp: 10000 }); },
    air: function (f, t, g, l) { l = l || 1; var up = !(f < 0), lo = 260, hi = 1300; noise(t, .45 * l, { f: up ? lo : hi, f2: up ? hi : lo, g: g || .07, att: .15 * l }); }
  };
  var N = { G3: 196, D4: 293.66, E4: 329.63, G4: 392, A4: 440, B4: 493.88, D5: 587.33, E5: 659.26, G5: 783.99, A5: 880, B5: 987.77, D6: 1174.66, E6: 1318.51, G6: 1567.98 };
  var LADDER = ["D4", "E4", "G4", "A4", "B4", "D5", "E5", "G5", "A5", "B5", "D6", "E6"];
  var KEYNOTE = { "0": "D4", "1": "E4", "2": "G4", "3": "A4", "4": "B4", "5": "D5", "6": "E5", "7": "G5", "8": "A5", "9": "B5" };
  var at = function (dt, evs) { return evs.map(function (e) { return [e[0] + dt, e[1], e[2], e[3], e[4]]; }); };
  var T = {
    charge: function () { return ["D4", "E4", "G4", "A4"].map(function (f, i) { return [i * .09, "gong", f, .08, .4]; }); },
    roll: function () { return ["D4", "E4", "G4"].map(function (f, i) { return [i * .05, "gong", f, .06, .3]; }); },
    fanfare: function () { return ["D5", "E5", "G5", "E5", "A5"].map(function (f, i) { return [i * .09, "gong", f, .14, .7]; }).concat([[.46, "agung", 112, .28, 1], [.48, "gong", "D5", .1, 1.2], [.48, "gong", "A4", .1, 1.2]]); }
  };
  var tapN = 0;
  /* Each kept sound and its job. */
  var SFX = {
    keys: function (k) { k = String(k); if (k === ".") return [[0, "wood", "D6", .07]]; if (k === "del") return [[0, "wood", "G3", .1]]; return [[0, "wood", KEYNOTE[k] || "G4", .12]]; },     /* Number notes: the keypad */
    tap: function () { tapN++; return [[0, "wood", ["G5", "A5", "E5"][tapN % 3], .08]]; },                                                                    /* Soft wood: picking things */
    tab: function (back) { return back ? [[0, "wood", "A5", .06], [.05, "wood", "E5", .06]] : [[0, "wood", "E5", .06], [.05, "wood", "A5", .06]]; },        /* Tab tap */
    sheetUp: function () { return [[0, "air", 1, .045, .8], [.2, "wood", "G5", .045]]; },                                                                     /* Sheet up */
    sheetDown: function () { return [[0, "air", -1, .045, .8], [.2, "wood", "D5", .045]]; },                                                                  /* Sheet down */
    right: function (n) { n = Math.min(n || 0, 7); var e = [[0, "gong", LADDER[n + 2], .16, .7], [.1, "gong", LADDER[n + 4], .17, .9]]; if (n >= 2) e.push([.18, "shimmer", LADDER[Math.min(n + 6, 11)], .04]); return e; }, /* Climbing ladder */
    row: function (n) {                                                                                                                                           /* Drum pick-up: 3, 5, 10 in a row */
      n = n || 3; var start = n >= 10 ? 5 : n >= 5 ? 4 : 2, e = [[0, "slap", 0, .11], [.09, "slap", 0, .1], [.18, "drum", 150, .28]];
      for (var i = 0; i < (n >= 10 ? 4 : 3); i++) e.push([.2 + i * .08, "gong", LADDER[start + i + (i > 1 ? 1 : 0)], .15, .75]);
      if (n >= 5) e.push([.2, "babendil", 1180, .05], [.36, "babendil", 1180, .045]);
      if (n >= 10) e.push([.2, "agung", 112, .22, .8], [.52, "shimmer", "D6", .05]);
      return e;
    },
    wrong: function () { return [[0, "muted", "E4", .17], [.15, "muted", "D4", .14]]; },                                                                     /* Held gong: a wrong answer */
    nope: function () { return [[0, "gong", "E4", .1, .6], [.15, "gong", "D4", .09, .7]]; },                                                                  /* Today's two-note fall: something still locked */
    hint: function () { return [[0, "wood", "A5", .08], [.14, "wood", "E5", .07]]; },                                                                        /* Tick-tock */
    goal: function () { return [[0, "gong", "G4", .12, .7], [.08, "gong", "B4", .12, .7], [.16, "gong", "D5", .15, 1], [.16, "babendil", 1180, .05], [.3, "shimmer", "G5", .04]]; }, /* Bright three */
    count: function () { var e = []; for (var i = 0; i < 12; i++) e.push([i * .06, "wood", LADDER[i % 12], .04 + i * .004]); return e.concat([[.8, "gong", "D5", .12, 1.2], [.8, "gong", "A4", .1, 1.2], [.8, "babendil", 1180, .045]]); }, /* Counting up */
    level: function () {                                                                                                                                          /* Kulintang run */
      var notes = ["D5", "E5", "G5", "A5", "B5", "A5", "D6"], ts = [0, .09, .18, .27, .42, .51, .66];
      return notes.map(function (f, i) { return [ts[i], "gong", f, i === 6 ? .16 : .13, i === 6 ? 1.5 : .6]; }).concat([[0, "slap", 0, .09], [.18, "slap", 0, .09], [.42, "drum", 150, .26], [.66, "drum", 130, .3], [.66, "agung", 112, .26, 1], [.09, "babendil", 1180, .04], [.27, "babendil", 1180, .04], [.51, "babendil", 1180, .04], [.72, "shimmer", "D6", .04]]);
    },
    step: function () {                                                                                                                                           /* Call and answer: a road step */
      return [[0, "gong", "A5", .12, .5], [.1, "gong", "G5", .12, .5], [.2, "gong", "A5", .13, .6], [.42, "gong", "D5", .13, .5], [.52, "gong", "B4", .13, .5], [.62, "gong", "D5", .14, .6],
        [.86, "gong", "D5", .14, 1.5], [.86, "gong", "A4", .12, 1.5], [.86, "agung", 112, .24, 1], [.92, "shimmer", "D6", .04], [.98, "shimmer", "A5", .03]];
    },
    cert: function () { return T.charge().concat(at(.6, T.roll()), at(1.0, [[0, "agung", 112, .32, 1]]), at(1.0, T.fanfare())); },                      /* Today's level-up: the certificate */
    milestone: function () {                                                                                                                                      /* Procession: streak milestones */
      var b = .16, e = [[0, "agung", 112, .24, 1]];
      [1, 3, 5, 7, 9, 11, 13].forEach(function (k) { e.push([k * b, "babendil", 1180, .04]); });
      [0, 4, 8, 12].forEach(function (k) { e.push([k * b, "drum", 150, .24]); });
      [2, 6, 7, 10].forEach(function (k) { e.push([k * b, "slap", 0, .08]); });
      [[0, "D5"], [2, "E5"], [3, "G5"], [4, "A5"], [6, "G5"], [7, "A5"], [8, "B5"], [10, "A5"], [11, "G5"], [12, "E5"]].forEach(function (m) { e.push([m[0] * b, "gong", m[1], .13, .7]); });
      return e.concat([[14 * b, "gong", "D5", .16, 1.8], [14 * b, "gong", "A4", .12, 1.8], [14 * b, "agung", 112, .3, 1.1], [14 * b + .06, "shimmer", "D6", .05], [14 * b + .12, "shimmer", "G6", .03]]);
    },
    tier: function () {                                                                                                                                           /* Sunrise: a new tier */
      var e = ["D4", "G4", "A4", "D5", "E5", "G5", "A5", "D6"].map(function (f, i) { return [i * .14, "gong", f, .08 + i * .011, 1.2]; });
      return e.concat([[0, "agung", 112, .18, 1.3], [1.1, "agung", 112, .26, 1.1], [1.15, "shimmer", "D6", .05], [1.22, "shimmer", "B5", .045], [1.29, "shimmer", "A5", .04], [1.1, "gong", "D5", .1, 1.6]]);
    },
    badge: function () { var e = ["D5", "E5", "G5", "A5", "B5", "D6", "E6"].map(function (f, i) { return [i * .045, "shimmer", f, .045 + i * .004]; }); return e.concat([[.32, "gong", "A5", .1, .9], [.32, "babendil", 1180, .04]]); }, /* Shine */
    reward: function () { return [[0, "gong", "D5", .12, 1.4], [0, "gong", "A5", .09, 1.4], [0, "agung", 112, .14, .9], [.12, "shimmer", "E6", .035]]; },  /* Bronze bloom */
    sparkle: function () { return ["D5", "E5", "G5"].map(function (f, i) { return [i * .06, "gong", f, .07, .4]; }); },                                     /* Today's sparkle: small wins */
    hello: function () { return [[0, "gong", "D5", .13, .6], [.12, "gong", "E5", .13, .6], [.24, "gong", "A5", .15, 1], [.42, "gong", "G5", .16, 1.4], [.42, "agung", 112, .2, .9], [0, "babendil", 1180, .035], [.24, "babendil", 1180, .035]]; } /* Abante motif */
  };
  /* Play a list of events, a moment from now. */
  function run(events) {
    events.forEach(function (ev) {
      var f = ev[1] === "air" ? ev[2] : typeof ev[2] === "number" ? ev[2] : N[ev[2]] || 440;
      INST[ev[1]](f, 0.02 + ev[0], ev[3], ev[4]);
    });
  }
  var SOUNDS = {
    tap: function () { run(SFX.tap()); },
    correct: function (n) { run(SFX.right(n)); },
    /* Three rising notes, starting higher the longer the run. */
    combo: function (n) { run(SFX.row(n)); },
    wrong: function () { run(SFX.wrong()); },
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
    /* New jobs. */
    keys: function (k) { run(SFX.keys(k)); },
    tab: function (back) { run(SFX.tab(back)); },
    sheetUp: function () { run(SFX.sheetUp()); },
    sheetDown: function () { run(SFX.sheetDown()); },
    hint: function () { run(SFX.hint()); },
    nope: function () { run(SFX.nope()); },
    goal: function () { run(SFX.goal()); },
    count: function () { run(SFX.count()); },
    level: function () { run(SFX.level()); },
    roadStep: function () { run(SFX.step()); },
    cert: function () { run(SFX.cert()); },
    milestone: function () { run(SFX.milestone()); },
    tier: function () { run(SFX.tier()); },
    badge: function () { run(SFX.badge()); },
    reward: function () { run(SFX.reward()); },
    hello: function () { run(SFX.hello()); },
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
