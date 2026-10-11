/* Content pack validator.
   Every pack in content/packs/ must pass before it ships. Generated items at
   volume will otherwise ship something wrong, and an installed phone keeps a
   bad question until it next has signal.

   Two passes:
   1. The schema, read statically: every field, every expression, every name an
      expression uses, every competency and schema tag against the blueprint.
   2. Generation: every template at every tier across many seeds, through the
      real engine, checking what a learner would actually be shown. A Basics
      facts template is checked fact by fact, in every one of its formats.

   Run:  node tests/validate-packs.js        Exits 1 on any problem. */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const SEEDS_PER_TIER = 250;
const MAX_REJECTION = 0.9;

global.window = global;
global.AM = {};
new Function(read("app/icons.js")).call(global);
new Function(read("app/content.js")).call(global);
const C = global.AM.content;
const E = C.engine;
const ICONS = new Set(global.AM.ICON_NAMES);

const blueprint = JSON.parse(read("content/blueprint.json"));
const COMPETENCY = Object.fromEntries(blueprint.competencies.map((c) => [c.code, c]));
const SCHEMAS = new Set(Object.values(blueprint.schemas).flat());
const ANSWER_TYPES = new Set(blueprint.answerTypes);
const INPUTTABLE = new Set(E.INPUTTABLE);
const RESERVED = new Set(E.RESERVED);
const BLUEPRINT_TOPICS = new Set(blueprint.topics.map((t) => t.key));

// The keypad's own length limit, from the entry rules the app uses, so the
// two cannot drift.
new Function(read("app/entry.js")).call(global);
const KEYPAD_MAX = global.AM.entry.NUMBER_MAX;

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
const TEMPLATE_KEYS = new Set(["id", "competency", "domain", "construct", "schema", "params", "where",
  "answer", "formats", "hints", "steps", "explain", "fallback", "distractors", "grid", "chart"]);
const ANSWER_KEYS = new Set(["type", "value", "prefix", "label", "maxDecimals", "unit", "form", "order", "figure"]);
const TOPIC_KEYS = new Set(["key", "label", "icon", "colorKey", "file", "comingSoon", "weight"]);
const LEVEL_KEYS = new Set(["id", "title", "templates", "lesson", "kind"]);
const BASICS_TOPIC_KEYS = new Set(["key", "label", "icon", "colorKey", "file"]);
const DOMAINS = new Set(blueprint.domains.map((d) => d.key));
const MAX_FACTS = 200;
const REACHABLE = blueprint.competencies.filter((c) => c.app !== "N").length;
const BLUEPRINT_TOPIC = Object.fromEntries(blueprint.topics.map((t) => [t.key, t]));
const FORM_ERRORS = new Set(E.FORM_ERRORS);
const NUMBER_TYPES_WITH_PLACES = new Set(["decimal", "percent", "unit", "pi-expression"]);
let usesFractionAnswers = false;
const FORMAT_KEYS = new Set(["id", "prompt", "hints", "steps", "explain"]);
const DISTRACTOR_KEYS = new Set(["value", "error", "feedback"]);
const CHART_KEYS = new Set(["kind", "title", "axis", "categories", "series", "step", "label", "unit", "slices",
  "shapes", "hand", "distance", "side", "cols", "rows", "points", "image", "line", "dot"]);
const CHART_KINDS = ["bar", "line", "pie", "table", "tiling", "clock", "mirror", "grid"];
/* A picture takes only its own fields: the shapes round a point, the hour a
   clock hand points to, or a point's distance and side from a mirror line. */
const FIGURE_FIELDS = { tiling: ["shapes"], clock: ["hand"], mirror: ["distance", "side"], grid: ["cols", "rows", "points", "image", "line", "dot"] };
const GRAPH_ONLY = ["axis", "categories", "series", "step", "label", "unit", "slices"];
const PIE_TOTAL = { "%": 100, "°": 360 };
/* What fits on a phone: the category names along a graph's bottom share its
   width, so more categories means shorter names; a graph has 2 to 10 steps
   up its side, so each step stays far enough apart to read. */
const CHART_ROOM = 40, CHART_MIN_STEPS = 2, CHART_MAX_STEPS = 10, CHART_NAME_MAX = 16, CHART_TITLE_MAX = 48;

const problems = [];
let where = "";
const fail = (msg) => problems.push(`${where}: ${msg}`);

/* ---------- expressions and text ---------- */

function namesOf(src) {
  try { return E.names(E.parse(src)); }
  catch (e) { fail(`cannot parse ${JSON.stringify(src)}: ${e.message}`); return null; }
}
function expr(src, allowed, label) {
  if (typeof src !== "string" && typeof src !== "number") { fail(`${label} must be an expression`); return; }
  const names = namesOf(src);
  if (!names) return;
  for (const n of names) if (!allowed.has(n)) fail(`${label} uses '${n}', which is not defined there`);
}
function text(t, allowed, label) {
  if (typeof t !== "string" || !t.trim()) { fail(`${label} must be non-empty text`); return; }
  const stripped = t.replace(/\{[^{}]+\}/g, "");
  if (/[{}]/.test(stripped)) fail(`${label} has unbalanced braces`);
  for (const s of E.slots(t)) expr(s, allowed, `${label} {${s}}`);
}
function textList(list, allowed, label) {
  if (!Array.isArray(list) || list.length !== 3) { fail(`${label} must be exactly 3 entries`); return; }
  list.forEach((t, i) => text(t, allowed, `${label}[${i}]`));
}
function unknownKeys(obj, allowed, label) {
  for (const k of Object.keys(obj)) if (!allowed.has(k)) fail(`${label} has an unknown field '${k}'`);
}

/* ---------- pass 1: the schema ---------- */

function checkParams(t) {
  const defined = [];
  if (!t.params || typeof t.params !== "object" || Array.isArray(t.params)) { fail("params must be an object"); return defined; }
  for (const [name, spec] of Object.entries(t.params)) {
    const label = `param '${name}'`;
    if (!IDENT.test(name)) fail(`${label} is not a valid name`);
    if (RESERVED.has(name)) fail(`${label} is reserved`);
    const kinds = ["value", "choose", "range", "tiers"].filter((k) => k in spec);
    if (kinds.length !== 1) fail(`${label} needs exactly one of value, choose, range, tiers`);
    const extra = Object.keys(spec).filter((k) => !["value", "choose", "range", "tiers", "step"].includes(k));
    if (extra.length) fail(`${label} has unknown fields: ${extra.join(", ")}`);
    const scope = new Set(defined);
    if ("value" in spec) expr(spec.value, scope, label);
    if ("choose" in spec) {
      if (!Array.isArray(spec.choose) || !spec.choose.length) fail(`${label} choose must be a non-empty list`);
      else for (const v of spec.choose) {
        const okNum = typeof v === "number" && isFinite(v) && v >= 0 && !/e/i.test(String(v));
        if (!okNum && typeof v !== "string") fail(`${label} choose has ${JSON.stringify(v)}`);
      }
    }
    const ranges = "range" in spec ? [spec.range] : "tiers" in spec ? Object.values(spec.tiers || {}) : [];
    if ("tiers" in spec) {
      const keys = Object.keys(spec.tiers || {});
      if (!keys.includes("1")) fail(`${label} tiers must define tier 1`);
      if (keys.some((k) => !["1", "2", "3", "4"].includes(k))) fail(`${label} tiers may only be 1 to 4`);
    }
    for (const r of ranges) {
      if (!Array.isArray(r) || r.length !== 2) { fail(`${label} range must be [low, high]`); continue; }
      r.forEach((b, i) => expr(b, scope, `${label} ${i ? "high" : "low"} bound`));
      if (typeof r[0] === "number" && typeof r[1] === "number" && r[0] > r[1]) fail(`${label} range [${r}] is empty`);
    }
    if ("step" in spec && !(typeof spec.step === "number" && spec.step > 0)) fail(`${label} step must be a positive number`);
    if ("step" in spec && !ranges.length) fail(`${label} step only applies to a range`);
    defined.push(name);
  }
  return defined;
}

/* A chart is part of the question, so like the prompt it may only use the
   drawn values, never the answer. A picture option is drawn the same way,
   once per option, with that option's value; it has no title, since its
   letter names it. */
function checkChart(c, params, option) {
  if (!c || typeof c !== "object" || Array.isArray(c)) { fail("chart must be an object"); return; }
  unknownKeys(c, CHART_KEYS, "chart");
  if (!CHART_KINDS.includes(c.kind)) { fail(`chart kind is one of ${CHART_KINDS.join(", ")}`); return; }
  if (option) {
    if (!(c.kind in FIGURE_FIELDS)) { fail(`a picture option is a ${Object.keys(FIGURE_FIELDS).join(", ")} picture, not a ${c.kind}`); return; }
    if ("title" in c) fail("a picture option has no title: its letter names it");
  } else text(c.title, params, "chart title");
  if (c.kind in FIGURE_FIELDS) {
    const own = FIGURE_FIELDS[c.kind];
    for (const k of [...GRAPH_ONLY, ...Object.values(FIGURE_FIELDS).flat()]) if (k in c && !own.includes(k)) fail(`a ${c.kind} picture has no ${k}`);
    if (c.kind === "tiling") {
      if (!Array.isArray(c.shapes) || c.shapes.length < 1 || c.shapes.length > 2) { fail("a tiling picture has 1 or 2 kinds of shape"); return; }
      c.shapes.forEach((s, i) => {
        unknownKeys(s, new Set(["sides", "count"]), `shape ${i}`);
        expr(s.sides, params, `shape ${i} sides`);
        expr(s.count, params, `shape ${i} count`);
      });
    } else if (c.kind === "grid") {
      expr(c.cols, params, "chart cols");
      expr(c.rows, params, "chart rows");
      if (!Array.isArray(c.points) || c.points.length < 3 || c.points.length > 6) { fail("a grid picture has a shape of 3 to 6 corners"); return; }
      const spots = (list, what) => list.forEach((p, i) => {
        if (!Array.isArray(p) || p.length !== 2) { fail(`${what} ${i} is [across, up]`); return; }
        expr(p[0], params, `${what} ${i} across`);
        expr(p[1], params, `${what} ${i} up`);
      });
      spots(c.points, "corner");
      /* A move: the image has the shape's corners, in the same order. */
      if ("image" in c) {
        if (!Array.isArray(c.image) || c.image.length !== c.points.length) fail("an image has as many corners as its shape");
        else spots(c.image, "image corner");
      }
      if ("line" in c) {
        if (!Array.isArray(c.line) || c.line.length !== 2) fail("a mirror line is [from, to]");
        else spots(c.line, "line end");
      }
      if ("dot" in c) spots([c.dot], "dot");
    } else for (const k of own) expr(c[k], params, `chart ${k}`);
    return;
  }
  for (const k of Object.values(FIGURE_FIELDS).flat()) if (k in c) fail(`a ${c.kind} has no ${k}`);
  if (c.kind === "pie") {
    for (const k of ["axis", "categories", "series", "step", "label"]) if (k in c) fail(`a pie graph has no ${k}`);
    if (!(c.unit in PIE_TOTAL)) fail("a pie graph's unit is % or °");
    if (!Array.isArray(c.slices) || c.slices.length < 2 || c.slices.length > 6) { fail("a pie graph has 2 to 6 slices"); return; }
    c.slices.forEach((s, i) => {
      unknownKeys(s, new Set(["name", "value", "hidden"]), `slice ${i}`);
      text(s.name, params, `slice ${i} name`);
      expr(s.value, params, `slice ${i} value`);
      if ("hidden" in s) expr(s.hidden, params, `slice ${i} hidden`);
    });
    return;
  }
  for (const k of ["unit", "slices"]) if (k in c) fail(`a ${c.kind} has no ${k}`);
  text(c.axis, params, "chart axis");
  if ("label" in c) text(c.label, new Set([...params, "value"]), "chart label");
  if (c.kind === "table") { if ("step" in c) fail("a table has no step"); }
  else expr(c.step, params, "chart step");
  const n = Array.isArray(c.categories) ? c.categories.length : 0;
  if (n < 2 || n > 8) fail("a chart has 2 to 8 categories");
  else c.categories.forEach((x, i) => text(x, params, `chart category ${i}`));
  const most = c.kind === "table" ? 3 : 2;
  if (!Array.isArray(c.series) || !c.series.length || c.series.length > most) { fail(`a ${c.kind} has 1 to ${most} series`); return; }
  c.series.forEach((s, i) => {
    unknownKeys(s, new Set(["name", "values"]), `series ${i}`);
    text(s.name, params, `series ${i} name`);
    if (!Array.isArray(s.values) || s.values.length !== n) fail(`series ${i} needs one value per category`);
    else s.values.forEach((v, j) => expr(v, params, `series ${i} value ${j}`));
  });
}

function checkTemplate(t, topic, ids, track = "path") {
  unknownKeys(t, TEMPLATE_KEYS, "template");
  if (typeof t.id !== "string" || !t.id.startsWith(topic + ".") || !KEBAB.test(t.id.slice(topic.length + 1)))
    fail(`id must be '${topic}.' followed by kebab-case`);
  if (ids.has(t.id)) fail(`id ${t.id} is used twice`);
  ids.add(t.id);

  if (track === "basics") {
    /* Basics are the facts and methods under the blueprint, not on it. */
    if ("competency" in t) fail("a Basics template has no competency: Basics are not part of the blueprint");
    if (!DOMAINS.has(t.domain)) fail(`domain ${t.domain} is not one of the blueprint's domains`);
  } else {
    const comp = COMPETENCY[t.competency];
    if (!comp) fail(`competency ${t.competency} is not in the blueprint`);
    else {
      if (comp.app === "N") fail(`competency ${t.competency} is marked not practicable in the blueprint`);
      if (t.domain !== comp.domain) fail(`domain ${t.domain} does not match ${t.competency}, which is ${comp.domain}`);
      if (comp.topic !== topic) fail(`competency ${t.competency} belongs to topic '${comp.topic}', not '${topic}'`);
    }
    if ("grid" in t) fail("grid is only for Basics facts");
  }
  if ("chart" in t) checkChart(t.chart, new Set(Object.keys(t.params || {})));
  if ("grid" in t && t.grid !== true) fail("grid is true or absent");
  if (t.grid) for (const p of ["x", "y"]) {
    if (!t.params || !t.params[p] || "value" in t.params[p]) fail(`a grid template needs a drawn param '${p}' for its cell`);
  }
  if (typeof t.construct !== "string" || !t.construct.trim()) fail("construct must be described");
  if (!SCHEMAS.has(t.schema)) fail(`schema '${t.schema}' is not one of the blueprint's problem schemas`);

  const params = new Set(checkParams(t));
  const withAnswer = new Set([...params, "answer"]);
  const withValue = new Set([...withAnswer, "value"]);

  if (t.where !== undefined) {
    if (!Array.isArray(t.where)) fail("where must be a list");
    else t.where.forEach((w, i) => expr(w, params, `where[${i}]`));
  }

  const a = t.answer || {};
  unknownKeys(a, ANSWER_KEYS, "answer");
  if (!ANSWER_TYPES.has(a.type)) fail(`answer type '${a.type}' is not in the blueprint`);
  else if (!INPUTTABLE.has(a.type)) fail(`answer type '${a.type}' cannot be entered yet; it needs the answer-input rebuild`);
  expr(a.value, params, "answer value");
  if ("maxDecimals" in a && (!NUMBER_TYPES_WITH_PLACES.has(a.type) || !Number.isInteger(a.maxDecimals) || a.maxDecimals < 0 || a.maxDecimals > 4))
    fail("maxDecimals is only for decimal, percent, unit and pi-expression answers, 0 to 4");
  if ("prefix" in a && typeof a.prefix !== "string") fail("prefix must be text");
  if (a.type === "unit") {
    if (typeof a.unit !== "string" || !a.unit.trim() || /[{}]/.test(a.unit)) fail("a unit answer needs its unit, such as cm²");
  } else if ("unit" in a) fail("unit is only for unit answers");
  const fractional = E.ENTRY[a.type] === "fraction" || E.ENTRY[a.type] === "mixed";
  if (fractional) usesFractionAnswers = true;
  if ("form" in a && (!fractional || !["lowest", "any"].includes(a.form)))
    fail("form is only for fraction and mixed answers, and is 'lowest' or 'any'");
  if ("figure" in a) {
    /* Options that are pictures: drawn per option, told apart by letter, and
       mixed, since in order of size the right picture would always sit in
       the same place. */
    if (a.type !== "choice") fail("figure is only for choice answers");
    if ("label" in a) fail("a choice of pictures has no label: its options are lettered");
    if (a.order !== "mixed") fail("a choice of pictures has order 'mixed'");
    checkChart(a.figure, withValue, true);
  } else if (a.type === "choice") text(a.label, withValue, "answer label");
  else if ("label" in a) fail("label is only for choice answers");
  if ("order" in a && (a.type !== "choice" || !["size", "mixed"].includes(a.order)))
    fail("order is only for choice answers, and is 'size' or 'mixed'");

  if (!Array.isArray(t.formats) || !t.formats.length) fail("needs at least one format");
  else {
    const fids = new Set();
    t.formats.forEach((f, i) => {
      const label = `format '${f.id || i}'`;
      unknownKeys(f, FORMAT_KEYS, label);
      if (typeof f.id !== "string" || !KEBAB.test(f.id)) fail(`${label} id must be kebab-case`);
      if (fids.has(f.id)) fail(`${label} id is used twice`);
      fids.add(f.id);
      // The prompt is the question; it must never be able to state the answer.
      text(f.prompt, params, `${label} prompt`);
      if (f.hints) textList(f.hints, withAnswer, `${label} hints`);
      if (f.steps) textList(f.steps, withAnswer, `${label} steps`);
      if (f.explain) text(f.explain, withAnswer, `${label} explain`);
    });
  }
  textList(t.hints, withAnswer, "hints");
  textList(t.steps, withAnswer, "steps");
  text(t.explain, withAnswer, "explain");
  if (t.fallback !== undefined) text(t.fallback, withAnswer, "fallback");

  const ds = t.distractors;
  if (!Array.isArray(ds)) fail("distractors must be a list");
  else {
    if (a.type === "choice" && ds.length !== 3) fail("a choice item needs exactly 3 distractors, one per wrong option");
    if (a.type !== "choice" && ds.length < 1) fail("name at least one expected mistake, so a wrong answer can be diagnosed");
    const codes = new Set();
    ds.forEach((d, i) => {
      const label = `distractor ${i}`;
      unknownKeys(d, DISTRACTOR_KEYS, label);
      expr(d.value, withAnswer, `${label} value`);
      if (typeof d.error !== "string" || !KEBAB.test(d.error)) fail(`${label} needs a kebab-case error code`);
      if (FORM_ERRORS.has(d.error)) fail(`${label}: '${d.error}' is a form mistake the checker names itself`);
      if (codes.has(d.error)) fail(`error code ${d.error} is used twice`);
      codes.add(d.error);
      text(d.feedback, withValue, `${label} feedback`);
    });
  }
}

function checkPinned(p, templatesById, topic, what = "pinned") {
  const t = templatesById[p.template];
  if (!t || !t.id.startsWith(topic + ".")) { fail(`${what} item names unknown template ${p.template}`); return; }
  const drawn = Object.keys(t.params).filter((k) => !("value" in t.params[k]));
  const given = Object.keys(p.params || {});
  const missing = drawn.filter((k) => !given.includes(k));
  const extra = given.filter((k) => !drawn.includes(k));
  if (missing.length) fail(`${what} ${t.id} does not set ${missing.join(", ")}`);
  if (extra.length) fail(`${what} ${t.id} sets ${extra.join(", ")}, which are not drawn values`);
  if (p.format && !t.formats.some((f) => f.id === p.format)) fail(`${what} ${t.id}: no format '${p.format}'`);
  if (missing.length || extra.length) return;

  /* Walk the params in order with the pinned values, as the engine does, and
     check each is a value the template could have drawn itself at some tier. */
  const scope = Object.create(null);
  const IN_RANGE = "v >= lo && v <= hi && floor((v - lo) / step) == (v - lo) / step";
  try {
    for (const [k, spec] of Object.entries(t.params)) {
      if ("value" in spec) { scope[k] = E.evaluate(spec.value, scope); continue; }
      const v = p.params[k];
      if ("choose" in spec) {
        if (!spec.choose.includes(v)) fail(`${what} ${t.id}: ${k}=${v} is not one of its choices`);
      } else {
        const ranges = spec.range ? [spec.range] : Object.values(spec.tiers);
        const ok = typeof v === "number" && ranges.some(([lo, hi]) => E.evaluate(IN_RANGE, {
          v: E.fromLiteral(String(v)), lo: E.evaluate(lo, scope), hi: E.evaluate(hi, scope),
          step: E.fromLiteral(String(spec.step === undefined ? 1 : spec.step))
        }));
        if (!ok) fail(`${what} ${t.id}: ${k}=${v} is outside the values it draws`);
      }
      scope[k] = typeof v === "number" ? E.fromLiteral(String(v)) : v;
    }
  } catch (e) { fail(`${what} ${t.id}: ${e.message}`); }
}

/* A topic's levels: the order a learner meets its templates. Every template
   sits in exactly one level, a level has at least two (so practice varies),
   and each level opens with a lesson of two or three cards, at least one of
   them a worked example drawn from the level's own templates. */
function checkLevels(file, topic, byId, track = "path") {
  const levels = file.levels;
  if (!Array.isArray(levels) || !levels.length) { fail("needs at least one level"); return; }
  const levelIds = new Set(), placed = new Map();
  levels.forEach((lv, i) => {
    const label = `level '${lv.id || i}'`;
    unknownKeys(lv, LEVEL_KEYS, label);
    if (typeof lv.id !== "string" || !KEBAB.test(lv.id)) fail(`${label} id must be kebab-case`);
    if (levelIds.has(lv.id)) fail(`${label} id is used twice`);
    levelIds.add(lv.id);
    if (typeof lv.title !== "string" || !lv.title.trim() || /[{}]/.test(lv.title)) fail(`${label} needs a plain title`);
    const kind = lv.kind === undefined ? "practice" : lv.kind;
    if ("kind" in lv && !(track === "basics" && ["facts", "review"].includes(lv.kind)))
      fail(`${label} kind is facts or review, and only in a Basics topic`);
    /* A review level asks every fact of the topic's facts levels. */
    if (kind === "review") {
      if ("templates" in lv) fail(`${label}: a review level asks every fact of the topic, so lists no templates`);
      if ("lesson" in lv) fail(`${label}: a review level has no lesson`);
      if (!levels.some((o) => o.kind === "facts")) fail(`${label}: there are no facts levels to review`);
      return;
    }
    if (!Array.isArray(lv.templates) || lv.templates.length < 2) fail(`${label} needs at least two templates`);
    for (const id of lv.templates || []) {
      const t = byId[id];
      if (!t) continue;
      if (kind === "facts") {
        for (const [name, spec] of Object.entries(t.params || {}))
          if ("tiers" in spec) fail(`${label}: ${id} '${name}' has tiers, but a fact's numbers do not change as the learner goes`);
      } else if (t.grid) fail(`${label}: ${id} is on the grid, so it belongs in a facts level`);
    }
    for (const id of lv.templates || []) {
      if (!byId[id] || !id.startsWith(topic + ".")) fail(`${label} names unknown template ${id}`);
      else if (placed.has(id)) fail(`${id} is in level '${placed.get(id)}' and '${lv.id}'`);
      else placed.set(id, lv.id);
    }
    const cards = lv.lesson;
    if (!Array.isArray(cards) || cards.length < 2 || cards.length > 3) { fail(`${label} lesson must be two or three cards`); return; }
    let examples = 0;
    cards.forEach((c, j) => {
      const cl = `${label} lesson card ${j + 1}`;
      if (c.example) {
        examples++;
        unknownKeys(c, new Set(["title", "example"]), cl);
        unknownKeys(c.example, new Set(["template", "params", "format"]), cl);
        if (!(lv.templates || []).includes(c.example.template)) fail(`${cl} uses ${c.example.template}, which is not in this level`);
        else if (byId[c.example.template].answer && byId[c.example.template].answer.figure)
          fail(`${cl} uses ${c.example.template}, whose options are pictures; a worked example gives its answer in words`);
        else checkPinned(c.example, byId, topic, "lesson example");
      } else {
        unknownKeys(c, new Set(["title", "body"]), cl);
        if (typeof c.body !== "string" || !c.body.trim() || /[{}]/.test(c.body)) fail(`${cl} needs plain body text`);
      }
      if ("title" in c || !c.example) {
        if (typeof c.title !== "string" || !c.title.trim() || /[{}]/.test(c.title)) fail(`${cl} needs a plain title`);
      }
    });
    if (!examples) fail(`${label} lesson needs a worked example`);
  });
  for (const t of file.templates || []) if (!placed.has(t.id)) fail(`${t.id} is in no level`);
}

/* A Basics grid, such as the times table: the cells are numbers from `from`
   to `to` both ways, and the facts of templates marked `grid` fill them. */
function checkGrid(file) {
  const g = file.grid;
  if (g === undefined) {
    if ((file.templates || []).some((t) => t.grid)) fail("templates are marked grid, but the topic has no grid");
    return;
  }
  unknownKeys(g, new Set(["title", "sign", "from", "to"]), "grid");
  if (typeof g.title !== "string" || !g.title.trim() || /[{}]/.test(g.title)) fail("grid needs a plain title");
  if (!["×", "+"].includes(g.sign)) fail("grid sign is × or +");
  if (!Number.isInteger(g.from) || !Number.isInteger(g.to) || g.from < 0 || g.from > g.to || g.to - g.from > 12)
    fail("grid from and to are whole numbers, from no more than to, at most 13 across");
  if (!(file.templates || []).some((t) => t.grid)) fail("a grid needs templates marked grid");
}

/* A written topic covers its part of the blueprint: every competency that
   can be practised in the app as it is (App Y) has a template, and the topic
   has at least the templates the blueprint targets. */
function checkCoverage(file, topic) {
  const bt = BLUEPRINT_TOPIC[topic];
  if (!bt) return; /* reported already: the topic is not in the blueprint */
  const covered = new Set((file.templates || []).map((t) => t.competency));
  const needed = blueprint.competencies.filter((c) => c.topic === topic && c.app === "Y");
  const missing = needed.filter((c) => !covered.has(c.code)).map((c) => c.code);
  if (missing.length) fail(`no template for ${missing.join(", ")}`);
  const count = (file.templates || []).length;
  if (count < bt.templateTarget) fail(`${count} templates; the blueprint targets ${bt.templateTarget}`);
}

/* ---------- pass 2: generation ---------- */

function sweep(t, pinnedFor) {
  const formats = new Set(), errorsSeen = new Set();
  let rejected = 0, drawn = 0;
  for (let tier = 1; tier <= 4; tier++) {
    for (let seed = 0; seed < SEEDS_PER_TIER; seed++) {
      let q;
      try {
        if (!C.firstDraw(t.id, tier, seed).accepted) rejected++;
        drawn++;
        q = C.generate(t.id, tier, seed);
      } catch (e) { fail(`tier ${tier} seed ${seed}: ${e.message}`); return; }
      inspect(q, `tier ${tier} seed ${seed}`);
      formats.add(q.format);
      q.distractors.forEach((d) => errorsSeen.add(d.error));
    }
  }
  for (const f of t.formats) if (!formats.has(f.id)) fail(`format '${f.id}' never appeared in ${drawn} questions`);
  for (const d of t.distractors) if (!errorsSeen.has(d.error))
    fail(`mistake '${d.error}' was never usable in ${drawn} questions: its value could not be typed, was the answer, or matched another mistake`);
  const rate = rejected / drawn;
  if (rate > MAX_REJECTION) fail(`rejects ${(100 * rate).toFixed(0)}% of its draws; loosen the ranges or the constraints`);
  for (const p of pinnedFor) {
    try { inspect(C.instance(t.id, 1, p.params, p.format), "pinned item"); }
    catch (e) { fail(`pinned item: ${e.message}`); }
  }
  return rate;
}

/* A facts template: every fact it lists, in every format, and once as the
   question a round would ask. Each named mistake must be usable on at least
   one of its facts. */
function sweepFacts(t, file) {
  const level = file.levels.find((lv) => (lv.templates || []).includes(t.id));
  let keys;
  try { keys = C.facts(file.topic, level.id).filter((k) => k.startsWith(t.id + ":")); }
  catch (e) { fail(e.message); return; }
  if (!keys.length) { fail("lists no facts: every combination is ruled out"); return; }
  if (keys.length > MAX_FACTS) fail(`lists ${keys.length} facts; a template holds at most ${MAX_FACTS}`);
  const errorsSeen = new Set();
  for (const k of keys) {
    const f = C.fact(k);
    for (const fm of t.formats) {
      try {
        const q = C.instance(t.id, 1, f.params, fm.id);
        inspect(q, `${k} (${fm.id})`);
        q.distractors.forEach((d) => errorsSeen.add(d.error));
      } catch (e) { fail(`${k} (${fm.id}): ${e.message}`); }
    }
    try { inspect(C.factQuestion(file.topic, level.id, k, 1, 0), `${k} as a round asks it`); }
    catch (e) { fail(`${k}: ${e.message}`); }
  }
  for (const d of t.distractors) if (!errorsSeen.has(d.error))
    fail(`mistake '${d.error}' was never usable on any of its ${keys.length} facts: its value could not be typed, was the answer, or matched another mistake`);
  return keys.length;
}

function inspect(q, label) {
  const all = [q.prompt, q.explain, q.missExplain, ...q.hints, ...q.steps, ...q.distractors.map((d) => d.feedback)];
  if (q.choices) all.push(...q.choices);
  for (const s of all) if (typeof s !== "string" || !s.trim() || /[{}]/.test(s)) fail(`${label}: bad text ${JSON.stringify(s)}`);
  if (!Number.isFinite(q.answer) || q.answer < 0) fail(`${label}: answer ${q.answer} cannot be entered`);
  else if (q.entry === "number" && q.answerText.length > KEYPAD_MAX)
    fail(`${label}: answer ${q.answerText} is longer than the keypad's ${KEYPAD_MAX} characters`);
  if (q.type === "choice") {
    if (q.choices.length !== 4 || new Set(q.choices).size !== 4) fail(`${label}: choices are not four different options`);
    if (!(q.answerIndex >= 0 && q.answerIndex < 4)) fail(`${label}: the answer is not among the choices`);
    if (q.choiceFigures) {
      if (q.choiceFigures.length !== 4 || new Set(q.choiceFigures.map((f) => f.text)).size !== 4) fail(`${label}: picture options are not four different pictures`);
      q.choiceFigures.forEach((f, i) => inspectChart(f, `${label} option ${q.choices[i]}`, true));
    }
  }
  if (!C.isCorrect(q, q.type === "choice" ? q.answerIndex : q.answerText)) fail(`${label}: the checker rejects its own answer`);
  if (q.chart) inspectChart(q.chart, label);
}

/* A chart as the learner would see it: every value readable, every label
   short enough to fit, and a pie that is one whole. */
function inspectChart(c, label, option) {
  const bad = (msg) => fail(`${label}: chart ${msg}`);
  const words = option ? [c.text] : [c.title, c.text];
  if (c.kind === "tiling") {
    if (!(c.gap >= 0)) bad(`shapes overlap round the point`);
    words.push(...c.shapes.map((s) => s.name));
  } else if (c.kind === "clock") {
    if (!(Number.isInteger(c.hand) && c.hand >= 1 && c.hand <= 12)) bad(`hand points to ${c.hand}`);
  } else if (c.kind === "grid") {
    /* A real shape: no corner twice, and an area to count (the shoelace sum). */
    const twice = c.points.reduce((a, p, i) => a + p[0] * c.points[(i + 1) % c.points.length][1] - c.points[(i + 1) % c.points.length][0] * p[1], 0);
    if (twice === 0) bad("shape has no area");
    if (new Set(c.points.map((p) => p.join(","))).size !== c.points.length) bad("shape has a corner twice");
    /* A slide, flip or turn keeps every distance: corner by corner, the
       image is the shape moved, not stretched or redrawn. */
    if (c.image) {
      const far = (ps, i, j) => (ps[i][0] - ps[j][0]) ** 2 + (ps[i][1] - ps[j][1]) ** 2;
      const kept = c.points.every((p, i) => c.points.every((q, j) => far(c.points, i, j) === far(c.image, i, j)));
      if (!kept) bad("image is not the shape moved: the distances between its corners differ");
    }
    if (c.line && c.line[0].join(",") === c.line[1].join(",")) bad("mirror line has no length");
  } else if (c.kind === "mirror") {
    if (!["left", "right"].includes(c.side)) bad(`point is to the ${c.side} of the line`);
  } else if (c.kind === "pie") {
    words.push(...c.slices.flatMap((s) => [s.name, s.label]));
    const total = c.slices.reduce((a, s) => a + s.value, 0);
    if (Math.abs(total - PIE_TOTAL[c.unit]) > 1e-9) bad(`slices add up to ${total}${c.unit}, not ${PIE_TOTAL[c.unit]}${c.unit}`);
    for (const s of c.slices) {
      if (!Number.isInteger(s.value)) bad(`slice ${s.name} is ${s.value}${c.unit}, not a whole number`);
      if (s.value < PIE_TOTAL[c.unit] / 10) bad(`slice ${s.name} is ${s.value}${c.unit}, too thin to label`);
      if (s.name.length > CHART_NAME_MAX) bad(`slice name '${s.name}' is longer than ${CHART_NAME_MAX} characters`);
    }
    if (c.slices.filter((s) => s.hidden).length > 1) bad("hides more than one slice");
    if (new Set(c.slices.map((s) => s.name)).size !== c.slices.length) bad("names two slices the same");
  } else {
    words.push(c.axis, ...c.categories, ...c.series.flatMap((s) => [s.name, ...s.labels]));
    if (new Set(c.categories).size !== c.categories.length) bad("names two categories the same");
    if (new Set(c.series.map((s) => s.name)).size !== c.series.length) bad("names two series the same");
    for (const s of c.series) {
      if (s.name.length > CHART_NAME_MAX) bad(`series name '${s.name}' is longer than ${CHART_NAME_MAX} characters`);
      for (const v of s.values) if (!Number.isFinite(v) || v < 0) bad(`has the value ${v}`);
    }
    if (c.kind !== "table") {
      const longest = Math.max(...c.categories.map((x) => x.length));
      if (longest * c.categories.length > CHART_ROOM)
        bad(`categories do not fit: ${c.categories.length} of up to ${longest} characters; their count times the longest may be at most ${CHART_ROOM}`);
      const steps = c.ticks.length - 1;
      if (steps < CHART_MIN_STEPS || steps > CHART_MAX_STEPS) bad(`has ${steps} steps up its side; it needs ${CHART_MIN_STEPS} to ${CHART_MAX_STEPS}`);
      words.push(...c.ticks.map((k) => k.label));
      for (const s of c.series) for (const v of s.values) {
        const k = v / c.step;
        if (Math.abs(k - Math.round(k)) > 1e-9) bad(`value ${v} in ${s.name} is between gridlines ${c.step} apart, so it cannot be read`);
      }
    }
  }
  if (c.title.length > CHART_TITLE_MAX) bad(`title is longer than ${CHART_TITLE_MAX} characters`);
  for (const s of words) if (typeof s !== "string" || !s.trim() || /[{}]/.test(s)) bad(`has bad text ${JSON.stringify(s)}`);
}

/* ---------- run ---------- */

const packRoot = path.join(ROOT, "content", "packs");
const packs = fs.readdirSync(packRoot, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
let templateCount = 0, formatCount = 0, mistakeCount = 0, factCount = 0;
const rates = [];

for (const packName of packs) {
  where = `${packName}/manifest.json`;
  const manifest = JSON.parse(read(`content/packs/${packName}/manifest.json`));
  if (manifest.subtest !== packName) fail(`subtest '${manifest.subtest}' does not match its folder '${packName}'`);
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version || "")) fail("version must be x.y.z");
  if (typeof manifest.fallbackFeedback !== "string" || !manifest.fallbackFeedback.trim()) fail("fallbackFeedback is required");
  usesFractionAnswers = false;
  if (manifest.examDate !== blueprint.exam.date) fail(`examDate must be the blueprint's exam date, ${blueprint.exam.date}`);
  if (manifest.blueprintCompetencies !== REACHABLE)
    fail(`blueprintCompetencies must be ${REACHABLE}, the blueprint's competencies that are not marked N`);

  /* The path is the whole blueprint, each topic once; a topic not yet
     written is marked comingSoon and has no file. */
  const keys = (manifest.topics || []).map((t) => t.key);
  for (const k of BLUEPRINT_TOPICS) if (!keys.includes(k)) fail(`blueprint topic '${k}' is not on the path`);
  keys.forEach((k, i) => { if (keys.indexOf(k) !== i) fail(`topic '${k}' is on the path twice`); });

  const ids = new Set(), byId = {}, files = [];
  for (const topic of manifest.topics || []) {
    where = `${packName}/${topic.file || topic.key}`;
    unknownKeys(topic, TOPIC_KEYS, `topic '${topic.key}'`);
    if (!KEBAB.test(topic.key || "")) fail(`topic key '${topic.key}' must be kebab-case`);
    if (!BLUEPRINT_TOPICS.has(topic.key)) fail(`topic '${topic.key}' is not in the blueprint`);
    if (!ICONS.has(topic.icon)) fail(`icon '${topic.icon}' is not in the icon set`);
    if (![1, 2, 3, 4].includes(topic.colorKey)) fail("colorKey must be 1 to 4");
    if (typeof topic.label !== "string" || !topic.label.trim()) fail("topic needs a label");
    /* The practice exam shares its questions out by these weights. */
    const weight = (BLUEPRINT_TOPIC[topic.key] || {}).weight;
    if (topic.weight !== weight) fail(`weight must be the blueprint's, ${weight}`);
    if (topic.comingSoon) {
      if (topic.comingSoon !== true) fail("comingSoon is true or absent");
      if ("file" in topic) fail("a topic coming soon has no file yet");
      files.push(null);
      continue;
    }
    if (typeof topic.file !== "string") { fail("a written topic needs its file"); files.push(null); continue; }
    const file = JSON.parse(read(`content/packs/${packName}/${topic.file}`));
    files.push(file);
    if (file.topic !== topic.key) fail(`file says topic '${file.topic}', manifest says '${topic.key}'`);
    unknownKeys(file, new Set(["topic", "levels", "pinned", "templates"]), "topic file");
    for (const t of file.templates || []) {
      where = `${packName}/${topic.file} ${t.id}`;
      checkTemplate(t, topic.key, ids);
      byId[t.id] = t;
      templateCount++;
      formatCount += (t.formats || []).length;
      mistakeCount += (t.distractors || []).length;
    }
    where = `${packName}/${topic.file} pinned`;
    for (const p of file.pinned || []) checkPinned(p, byId, topic.key);
    where = `${packName}/${topic.file} levels`;
    checkLevels(file, topic.key, byId);
    where = `${packName}/${topic.file} coverage`;
    checkCoverage(file, topic.key);
  }
  /* Beside the path, the Basics track: topics that are not in the blueprint,
     always open, never coming soon. */
  const basicsFiles = [], basicsKeys = new Set();
  if (manifest.basics !== undefined && !Array.isArray(manifest.basics)) fail("basics must be a list");
  for (const topic of Array.isArray(manifest.basics) ? manifest.basics : []) {
    where = `${packName}/${topic.file || topic.key} (Basics)`;
    unknownKeys(topic, BASICS_TOPIC_KEYS, `Basics topic '${topic.key}'`);
    if (!KEBAB.test(topic.key || "")) fail(`Basics topic key '${topic.key}' must be kebab-case`);
    if (BLUEPRINT_TOPICS.has(topic.key) || keys.includes(topic.key)) fail(`Basics topic '${topic.key}' has the key of a topic on the path`);
    if (basicsKeys.has(topic.key)) fail(`Basics topic '${topic.key}' is listed twice`);
    basicsKeys.add(topic.key);
    if (!ICONS.has(topic.icon)) fail(`icon '${topic.icon}' is not in the icon set`);
    if (![1, 2, 3, 4].includes(topic.colorKey)) fail("colorKey must be 1 to 4");
    if (typeof topic.label !== "string" || !topic.label.trim()) fail("topic needs a label");
    if (typeof topic.file !== "string") { fail("a Basics topic needs its file"); basicsFiles.push(null); continue; }
    const file = JSON.parse(read(`content/packs/${packName}/${topic.file}`));
    basicsFiles.push(file);
    if (file.topic !== topic.key) fail(`file says topic '${file.topic}', manifest says '${topic.key}'`);
    unknownKeys(file, new Set(["topic", "levels", "templates", "grid"]), "topic file");
    for (const t of file.templates || []) {
      where = `${packName}/${topic.file} ${t.id}`;
      checkTemplate(t, topic.key, ids, "basics");
      byId[t.id] = t;
      templateCount++;
      formatCount += (t.formats || []).length;
      mistakeCount += (t.distractors || []).length;
    }
    where = `${packName}/${topic.file} levels`;
    checkLevels(file, topic.key, byId, "basics");
    where = `${packName}/${topic.file} grid`;
    checkGrid(file);
  }

  /* A fraction answer in the right amount but the wrong form gets the pack's
     own words for that, so a pack with fraction answers must supply them. */
  where = `${packName}/manifest.json`;
  const ff = manifest.formFeedback;
  if (ff !== undefined || usesFractionAnswers) {
    if (!ff || typeof ff !== "object") fail("formFeedback is required when a template takes fraction or mixed answers");
    else {
      for (const k of Object.keys(ff)) if (!FORM_ERRORS.has(k)) fail(`formFeedback has an unknown entry '${k}'`);
      for (const k of FORM_ERRORS) if (typeof ff[k] !== "string" || !ff[k].trim() || /[{}]/.test(ff[k])) fail(`formFeedback needs plain text for '${k}'`);
    }
  }
  if (problems.length) continue;

  where = `${packName}`;
  try { C.use(manifest, files, basicsFiles); }
  catch (e) { fail(`engine refused the pack: ${e.message}`); continue; }
  files.forEach((file) => {
    if (!file) return;
    for (const t of file.templates) {
      where = `${packName} ${t.id}`;
      const pinnedFor = (file.pinned || []).filter((p) => p.template === t.id);
      const rate = sweep(t, pinnedFor);
      if (rate !== undefined) rates.push([t.id, rate]);
    }
    /* Every lesson renders, with no slot left unfilled. */
    for (const lv of file.levels) {
      where = `${packName} ${file.topic}/${lv.id} lesson`;
      try {
        for (const card of C.lesson(file.topic, lv.id)) {
          const texts = card.kind === "example" ? [card.title, card.prompt, card.answer, card.explain, ...card.steps] : [card.title, card.body];
          for (const s of texts) if (typeof s !== "string" || !s.trim() || /[{}]/.test(s)) fail(`bad text ${JSON.stringify(s)}`);
          if (card.chart) inspectChart(card.chart, card.title);
        }
      } catch (e) { fail(e.message); }
    }
  });

  basicsFiles.forEach((file) => {
    if (!file) return;
    const factTemplates = new Set(file.levels.filter((lv) => lv.kind === "facts").flatMap((lv) => lv.templates));
    for (const t of file.templates) {
      where = `${packName} ${t.id}`;
      if (factTemplates.has(t.id)) {
        const n = sweepFacts(t, file);
        if (n) factCount += n;
      } else {
        const rate = sweep(t, []);
        if (rate !== undefined) rates.push([t.id, rate]);
      }
    }
    for (const lv of file.levels) {
      if (lv.kind === "review") continue;
      where = `${packName} ${file.topic}/${lv.id} lesson`;
      try {
        for (const card of C.lesson(file.topic, lv.id)) {
          const texts = card.kind === "example" ? [card.title, card.prompt, card.answer, card.explain, ...card.steps] : [card.title, card.body];
          for (const s of texts) if (typeof s !== "string" || !s.trim() || /[{}]/.test(s)) fail(`bad text ${JSON.stringify(s)}`);
        }
      } catch (e) { fail(e.message); }
    }
    /* Every cell of the grid holds the fact whose answer it shows. */
    if (file.grid) {
      where = `${packName} ${file.topic} grid`;
      const g = C.grid(file.topic);
      for (const x of g.values) for (const y of g.values) {
        const k = g.cells[x + "," + y];
        if (!k) { fail(`no fact for ${x} ${g.sign} ${y}`); continue; }
        const f = C.fact(k);
        const want = g.sign === "×" ? x * y : x + y;
        const got = C.instance(f.template, 1, f.params).answer;
        if (got !== want) fail(`the cell ${x} ${g.sign} ${y} holds ${k}, whose answer is ${got}, not ${want}`);
      }
    }
  });
}

console.log(`${packs.length} pack(s), ${templateCount} templates, ${formatCount} formats, ${mistakeCount} named mistakes, ${factCount} Basics facts`);
console.log(`each template generated at 4 tiers x ${SEEDS_PER_TIER} seeds`);
const busy = rates.filter(([, r]) => r > 0.2).sort((a, b) => b[1] - a[1]);
if (busy.length) console.log("templates that redraw often: " + busy.map(([id, r]) => `${id} ${(100 * r).toFixed(0)}%`).join(", "));
if (problems.length) {
  console.log(`\nFAIL ${problems.length} problem(s):`);
  for (const p of problems) console.log("  " + p);
  process.exit(1);
}
console.log("ok: every pack is valid");
