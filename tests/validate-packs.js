/* Content pack validator.
   Every pack in content/packs/ must pass before it ships. Generated items at
   volume will otherwise ship something wrong, and an installed phone keeps a
   bad question until it next has signal.

   Two passes:
   1. The schema, read statically: every field, every expression, every name an
      expression uses, every competency and schema tag against the blueprint.
   2. Generation: every template at every tier across many seeds, through the
      real engine, checking what a learner would actually be shown.

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

// The keypad's own length limit, read from app.js so the two cannot drift.
const keypad = read("app/app.js").match(/s\.typed\.length >= (\d+)/);
if (!keypad) { console.log("FAIL could not find the keypad length limit in app/app.js"); process.exit(1); }
const KEYPAD_MAX = Number(keypad[1]);

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
const TEMPLATE_KEYS = new Set(["id", "competency", "domain", "construct", "schema", "params", "where",
  "answer", "formats", "hints", "steps", "explain", "fallback", "distractors"]);
const ANSWER_KEYS = new Set(["type", "value", "prefix", "label", "maxDecimals"]);
const FORMAT_KEYS = new Set(["id", "prompt", "hints", "steps", "explain"]);
const DISTRACTOR_KEYS = new Set(["value", "error", "feedback"]);

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

function checkTemplate(t, topic, ids, placeholder) {
  unknownKeys(t, TEMPLATE_KEYS, "template");
  if (typeof t.id !== "string" || !t.id.startsWith(topic + ".") || !KEBAB.test(t.id.slice(topic.length + 1)))
    fail(`id must be '${topic}.' followed by kebab-case`);
  if (ids.has(t.id)) fail(`id ${t.id} is used twice`);
  ids.add(t.id);

  const comp = COMPETENCY[t.competency];
  if (!comp) fail(`competency ${t.competency} is not in the blueprint`);
  else {
    if (comp.app === "N") fail(`competency ${t.competency} is marked not practicable in the blueprint`);
    if (t.domain !== comp.domain) fail(`domain ${t.domain} does not match ${t.competency}, which is ${comp.domain}`);
    if (!placeholder && comp.topic !== topic) fail(`competency ${t.competency} belongs to topic '${comp.topic}', not '${topic}'`);
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
  if ("maxDecimals" in a && (a.type !== "decimal" || !Number.isInteger(a.maxDecimals) || a.maxDecimals < 0 || a.maxDecimals > 4))
    fail("maxDecimals is only for decimal answers, 0 to 4");
  if ("prefix" in a && typeof a.prefix !== "string") fail("prefix must be text");
  if (a.type === "choice") text(a.label, withValue, "answer label");
  else if ("label" in a) fail("label is only for choice answers");

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
      if (codes.has(d.error)) fail(`error code ${d.error} is used twice`);
      codes.add(d.error);
      text(d.feedback, withValue, `${label} feedback`);
    });
  }
}

function checkPinned(p, templatesById, topic) {
  const t = templatesById[p.template];
  if (!t || !t.id.startsWith(topic + ".")) { fail(`pinned item names unknown template ${p.template}`); return; }
  const drawn = Object.keys(t.params).filter((k) => !("value" in t.params[k]));
  const given = Object.keys(p.params || {});
  const missing = drawn.filter((k) => !given.includes(k));
  const extra = given.filter((k) => !drawn.includes(k));
  if (missing.length) fail(`pinned ${t.id} does not set ${missing.join(", ")}`);
  if (extra.length) fail(`pinned ${t.id} sets ${extra.join(", ")}, which are not drawn values`);
  if (p.format && !t.formats.some((f) => f.id === p.format)) fail(`pinned ${t.id}: no format '${p.format}'`);
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
        if (!spec.choose.includes(v)) fail(`pinned ${t.id}: ${k}=${v} is not one of its choices`);
      } else {
        const ranges = spec.range ? [spec.range] : Object.values(spec.tiers);
        const ok = typeof v === "number" && ranges.some(([lo, hi]) => E.evaluate(IN_RANGE, {
          v: E.fromLiteral(String(v)), lo: E.evaluate(lo, scope), hi: E.evaluate(hi, scope),
          step: E.fromLiteral(String(spec.step === undefined ? 1 : spec.step))
        }));
        if (!ok) fail(`pinned ${t.id}: ${k}=${v} is outside the values it draws`);
      }
      scope[k] = typeof v === "number" ? E.fromLiteral(String(v)) : v;
    }
  } catch (e) { fail(`pinned ${t.id}: ${e.message}`); }
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

function inspect(q, label) {
  const all = [q.prompt, q.explain, q.missExplain, ...q.hints, ...q.steps, ...q.distractors.map((d) => d.feedback)];
  if (q.choices) all.push(...q.choices);
  for (const s of all) if (typeof s !== "string" || !s.trim() || /[{}]/.test(s)) fail(`${label}: bad text ${JSON.stringify(s)}`);
  if (!Number.isFinite(q.answer) || q.answer < 0) fail(`${label}: answer ${q.answer} cannot be entered`);
  else if (q.type === "compute" && E.fmt(q.answerExact).length > KEYPAD_MAX)
    fail(`${label}: answer ${E.fmt(q.answerExact)} is longer than the keypad's ${KEYPAD_MAX} characters`);
  if (q.type === "choice") {
    if (q.choices.length !== 4 || new Set(q.choices).size !== 4) fail(`${label}: choices are not four different options`);
    if (!(q.answerIndex >= 0 && q.answerIndex < 4)) fail(`${label}: the answer is not among the choices`);
  }
  if (!C.isCorrect(q, q.type === "choice" ? q.answerIndex : String(q.answer))) fail(`${label}: the checker rejects its own answer`);
}

/* ---------- run ---------- */

const packRoot = path.join(ROOT, "content", "packs");
const packs = fs.readdirSync(packRoot, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
let templateCount = 0, formatCount = 0, mistakeCount = 0;
const rates = [];

for (const packName of packs) {
  where = `${packName}/manifest.json`;
  const manifest = JSON.parse(read(`content/packs/${packName}/manifest.json`));
  if (manifest.subtest !== packName) fail(`subtest '${manifest.subtest}' does not match its folder '${packName}'`);
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version || "")) fail("version must be x.y.z");
  if (typeof manifest.fallbackFeedback !== "string" || !manifest.fallbackFeedback.trim()) fail("fallbackFeedback is required");
  const placeholder = manifest.placeholder === true;

  const ids = new Set(), byId = {}, files = [];
  for (const topic of manifest.topics || []) {
    where = `${packName}/${topic.file}`;
    if (!KEBAB.test(topic.key || "")) fail(`topic key '${topic.key}' must be kebab-case`);
    if (!placeholder && !BLUEPRINT_TOPICS.has(topic.key)) fail(`topic '${topic.key}' is not in the blueprint`);
    if (!ICONS.has(topic.icon)) fail(`icon '${topic.icon}' is not in the icon set`);
    if (![1, 2, 3, 4].includes(topic.colorKey)) fail("colorKey must be 1 to 4");
    if (typeof topic.label !== "string" || !topic.label.trim()) fail("topic needs a label");
    const file = JSON.parse(read(`content/packs/${packName}/${topic.file}`));
    files.push(file);
    if (file.topic !== topic.key) fail(`file says topic '${file.topic}', manifest says '${topic.key}'`);
    for (const t of file.templates || []) {
      where = `${packName}/${topic.file} ${t.id}`;
      checkTemplate(t, topic.key, ids, placeholder);
      byId[t.id] = t;
      templateCount++;
      formatCount += (t.formats || []).length;
      mistakeCount += (t.distractors || []).length;
    }
    where = `${packName}/${topic.file} pinned`;
    for (const p of file.pinned || []) checkPinned(p, byId, topic.key);
  }
  if (problems.length) continue;

  where = `${packName}`;
  try { C.use(manifest, files); }
  catch (e) { fail(`engine refused the pack: ${e.message}`); continue; }
  files.forEach((file) => {
    for (const t of file.templates) {
      where = `${packName} ${t.id}`;
      const pinnedFor = (file.pinned || []).filter((p) => p.template === t.id);
      const rate = sweep(t, pinnedFor);
      if (rate !== undefined) rates.push([t.id, rate]);
    }
  });
}

console.log(`${packs.length} pack(s), ${templateCount} templates, ${formatCount} formats, ${mistakeCount} named mistakes`);
console.log(`each template generated at 4 tiers x ${SEEDS_PER_TIER} seeds`);
const busy = rates.filter(([, r]) => r > 0.2).sort((a, b) => b[1] - a[1]);
if (busy.length) console.log("templates that redraw often: " + busy.map(([id, r]) => `${id} ${(100 * r).toFixed(0)}%`).join(", "));
if (problems.length) {
  console.log(`\nFAIL ${problems.length} problem(s):`);
  for (const p of problems) console.log("  " + p);
  process.exit(1);
}
console.log("ok: every pack is valid");
