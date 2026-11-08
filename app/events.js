/* Abante Minds — the weekly challenge.
   One challenge a week, Monday to Sunday, the same for every learner, from a
   list of weeks in Filipino life that turns over: each with a goal from its
   own maths and a badge for meeting it (round 2, owner, 2026-11-06: events
   and challenges, a time-limited goal with a badge; no leaderboards, nothing
   lost for missing one). A week's badge can only be earned in its week.

   Pure, like facts.js and road.js: the store gives it the week's attempt
   rows and the levels cleared that week; it says how far along it is.
   Only first tries right on the path (and in needs-practice rounds) count
   for the topic goals, as the badges and the readiness count them. */
(function () {
  "use strict";

  var AM = (window.AM = window.AM || {});

  /* hue: a skill colour (1 to 7) or "action"; icon: one of the app's glyphs. */
  var THEMES = [
    { key: "palengke", name: "Palengke week", icon: "coins", hue: "action",
      goal: { kind: "right", topics: ["decimals", "percent"], need: 20 },
      what: "Get 20 right first time in Decimals or Percentages.",
      why: "At the palengke the prices are decimals, and a suki discount is a per cent." },
    { key: "bayanihan", name: "Bayanihan week", icon: "home", hue: 4,
      goal: { kind: "days", need: 4 },
      what: "Finish a full round of 10 on 4 days this week.",
      why: "In bayanihan, neighbours carry a whole house together, a little help at a time." },
    { key: "fiesta", name: "Fiesta week", icon: "star", hue: 3,
      goal: { kind: "levels", need: 2 },
      what: "Clear 2 levels this week.",
      why: "Fiesta is the town's big day: a good week to move up." },
    { key: "jeepney", name: "Jeepney week", icon: "map", hue: 1,
      goal: { kind: "right", topics: ["time", "ratio"], need: 20 },
      what: "Get 20 right first time in Time or Ratio and proportion.",
      why: "Every jeepney trip is a timetable and a fare: times, rates and ratios." },
    { key: "banig", name: "Banig week", icon: "triangle", hue: 2,
      goal: { kind: "right", topics: ["area", "transform"], need: 20 },
      what: "Get 20 right first time in Perimeter and area or Transformations.",
      why: "A banig is woven from shapes that fit together with no gaps." },
    { key: "sarisari", name: "Sari-sari week", icon: "scales", hue: 5,
      goal: { kind: "topics", need: 3, each: 5 },
      what: "Get 5 right first time in each of 3 different topics.",
      why: "The sari-sari store keeps a little of everything." }
  ];
  var ROUND = 10;                     /* answers in a full round, as the store counts a day */
  var EPOCH = new Date(2026, 0, 5, 12); /* a Monday: week 0 of the turning list */

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parse(day) { var p = String(day).split("-"); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  /* The phone's own date of a moment, as the store keeps days. */
  function dayOf(ms) { return iso(new Date(ms)); }

  /* The week a day falls in: Monday to Sunday, its id (the Monday) and its
     theme. Noon keeps a change of clocks from moving a day. */
  function weekOf(day) {
    var d = parse(day), mon = new Date(d.getTime()), sun;
    mon.setDate(d.getDate() - (d.getDay() + 6) % 7);
    sun = new Date(mon.getTime()); sun.setDate(mon.getDate() + 6);
    var n = Math.round((mon - EPOCH) / 864e5 / 7);
    return { id: iso(mon), start: iso(mon), end: iso(sun), theme: ((n % THEMES.length) + THEMES.length) % THEMES.length };
  }

  function counted(r) { return r.attempt === 1 && r.correct === true && (r.kind === "practice" || r.kind === "kind"); }

  /* How far a week's goal has come, from the week's rows (attempt log rows
     whose day is in the week) and the levels cleared in it. */
  function progress(theme, o) {
    var g = theme.goal, rows = o.rows || [], have = 0;
    if (g.kind === "right") {
      have = rows.filter(function (r) { return counted(r) && g.topics.indexOf(r.topic) > -1; }).length;
    } else if (g.kind === "days") {
      var per = Object.create(null);
      rows.forEach(function (r) { if (r.attempt === 1) { var d = dayOf(r.at); per[d] = (per[d] || 0) + 1; } });
      have = Object.keys(per).filter(function (d) { return per[d] >= ROUND; }).length;
    } else if (g.kind === "levels") {
      have = o.levels || 0;
    } else if (g.kind === "topics") {
      var by = Object.create(null);
      rows.forEach(function (r) { if (counted(r)) by[r.topic] = (by[r.topic] || 0) + 1; });
      have = Object.keys(by).filter(function (t) { return by[t] >= g.each; }).length;
    }
    return { have: Math.min(have, g.need), need: g.need, done: have >= g.need };
  }

  function themeByKey(key) { return THEMES.filter(function (t) { return t.key === key; })[0] || null; }

  /* For the screenshot harness only: show this theme whatever the week. */
  var preview = null;

  AM.events = {
    THEMES: THEMES, ROUND: ROUND, weekOf: weekOf, dayOf: dayOf, progress: progress, themeByKey: themeByKey,
    previewTheme: function (i) { preview = i === undefined ? null : i; },
    themeOfWeek: function (w) { return THEMES[preview === null ? w.theme : preview]; }
  };
})();
