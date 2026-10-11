#!/usr/bin/env node
/* The item specification table, generated from the question packs so it
   cannot drift from them (RESEARCH-PLAN item 23). For every template: the
   competency it serves, the construct, the problem schema, the answer, what
   it draws at each tier, the mistakes it names, and one example item drawn
   by the real engine.

     node tools/item-spec.js           rewrite ITEM-SPECIFICATIONS.md
     node tools/item-spec.js --check   exit 1 if ITEM-SPECIFICATIONS.md is out of date (CI)
     node tools/item-spec.js --csv     print one row per template as CSV, for a
                                       spreadsheet or a panel of expert raters

   The CSV starts with a byte-order mark so Excel reads ₱ and ° correctly. */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const OUT = "ITEM-SPECIFICATIONS.md";
const PACK = "content/packs/math/";

/* The engine is a browser script that hangs its API off window.AM. */
global.window = global;
global.AM = {};
new Function(read("app/content.js")).call(global);
const C = global.AM.content;
const manifest = JSON.parse(read(PACK + "manifest.json"));
const blueprint = JSON.parse(read("content/blueprint.json"));
const files = new Map();
for (const t of [...manifest.topics, ...(manifest.basics || [])]) if (t.file) files.set(t.key + "/" + t.file, JSON.parse(read(PACK + t.file)));
const fileOf = (t) => files.get(t.key + "/" + t.file);
C.use(manifest, manifest.topics.map((t) => (t.comingSoon ? null : fileOf(t))), (manifest.basics || []).map(fileOf));

/* The example for every template: tier 1, seed 1, so it is the same on
   every run and changes only when the template or the engine does. */
const EXAMPLE_TIER = 1;
const EXAMPLE_SEED = 1;
const LAST_TIER = 4;

const COMPETENCY = new Map(blueprint.competencies.map((c) => [c.code, c]));
const DOMAIN = new Map(blueprint.domains.map((d) => [d.key, d.label]));
const SCHEMA_GROUP = new Map();
for (const [group, names] of Object.entries(blueprint.schemas)) for (const n of names) SCHEMA_GROUP.set(n, group);
const GROUP_NAME = { additive: "additive", multiplicative: "multiplicative", nonRoutine: "non-routine" };

/* ---------- describing a template ---------- */

const num = (x) => (typeof x === "number" ? String(x) : x);
function tierSpan(keys, i) {
  const from = keys[i], to = i + 1 < keys.length ? keys[i + 1] - 1 : LAST_TIER;
  return from === to ? `tier ${from}` : `tiers ${from}–${to}`;
}
function rangeText(r, step) {
  return `${num(r[0])} to ${num(r[1])}` + (step === undefined ? "" : ` in steps of ${step}`);
}
/* What a template draws: its drawn parameters, not the ones worked out from
   them. A range that changes with the tier lists the tiers it covers. */
function draws(t) {
  const out = [];
  for (const [name, spec] of Object.entries(t.params || {})) {
    if ("value" in spec) continue;
    if ("choose" in spec) out.push(`${name}: one of ${spec.choose.join(", ")}`);
    else if ("range" in spec) out.push(`${name}: ${rangeText(spec.range, spec.step)}`);
    else {
      const keys = Object.keys(spec.tiers).map(Number).sort((a, b) => a - b);
      out.push(`${name}: ` + keys.map((k, i) => `${rangeText(spec.tiers[k], spec.step)} (${tierSpan(keys, i)})`).join(", "));
    }
  }
  return out;
}

const TYPE_NAME = {
  integer: "whole number", decimal: "decimal", percent: "per cent", unit: "number with a unit",
  "pi-expression": "multiple of π", fraction: "fraction", mixed: "mixed number", choice: "multiple choice",
  time: "clock time"
};
function answerText(a) {
  if (a.figure) return "choice of pictures";
  const bits = [TYPE_NAME[a.type] || a.type];
  if (a.prefix) bits.push(`in ${a.prefix}`);
  if (a.unit) bits.push(`in ${a.unit}`);
  if (a.maxDecimals !== undefined) bits.push(`up to ${a.maxDecimals} decimal place${a.maxDecimals === 1 ? "" : "s"}`);
  return bits.join(", ");
}

function competencyText(t) {
  if (!t.competency) return "none (Basics: a fact or method under the blueprint)";
  const c = COMPETENCY.get(t.competency);
  return c ? `${t.competency}, ${c.text}` : t.competency;
}

function schemaText(s) {
  const g = SCHEMA_GROUP.get(s);
  return g ? `${s} (${GROUP_NAME[g] || g})` : s;
}

/* The example as a learner would meet it: its picture, its prompt, its
   choices, and the right answer written as the app would show it. Options
   that are pictures are given as the words a screen reader speaks for them. */
function example(t) {
  const q = C.generate(t.id, EXAMPLE_TIER, EXAMPLE_SEED);
  const answer = q.answerType === "choice" ? C.choiceText(q, q.answerIndex) : (q.unit || "") + q.answerText + (q.suffix || "");
  const choices = q.answerType !== "choice" ? []
    : q.choiceFigures ? q.choices.map((letter, i) => `${letter}: ${q.choiceFigures[i].text}`) : q.choices;
  return { picture: q.chart ? q.chart.text : "", prompt: q.prompt, choices, answer };
}

function describe(topic, kind, level, levelNo, t) {
  return {
    part: kind,
    topic: topic.key,
    topicLabel: topic.label,
    level: level.id,
    levelNo,
    levelTitle: level.title,
    template: t.id,
    competency: t.competency || "",
    competencyText: competencyText(t),
    domain: t.domain,
    construct: t.construct,
    schema: t.schema,
    schemaText: schemaText(t.schema),
    answer: answerText(t.answer),
    draws: draws(t),
    where: t.where || [],
    formats: t.formats.map((f) => f.id),
    mistakes: t.distractors.map((d) => d.error),
    example: example(t)
  };
}

/* Every template in path order: topic by topic, level by level, in the
   order each level lists them. */
function rows() {
  const out = [];
  for (const [list, kind] of [[manifest.topics, "path"], [manifest.basics || [], "basics"]]) {
    for (const topic of list) {
      if (topic.comingSoon) continue;
      const file = fileOf(topic), byId = new Map(file.templates.map((t) => [t.id, t]));
      file.levels.forEach((level, i) => {
        for (const id of level.templates || []) out.push(describe(topic, kind, level, i + 1, byId.get(id)));
      });
    }
  }
  return out;
}

/* ---------- Markdown ---------- */

const code = (s) => "`" + s + "`";
const pct = (w) => Math.round(w * 100) + "%";

function summaryTable(rs, list) {
  const lines = ["| Topic | Weight | Levels | Templates | Competencies | Named mistakes |", "|---|---:|---:|---:|---:|---:|"];
  let levels = 0, templates = 0, mistakes = 0;
  const comps = new Set();
  for (const topic of list) {
    if (topic.comingSoon) continue;
    const mine = rs.filter((r) => r.topic === topic.key);
    const c = new Set(mine.map((r) => r.competency).filter(Boolean));
    const n = fileOf(topic).levels.length, m = mine.reduce((a, r) => a + r.mistakes.length, 0);
    levels += n; templates += mine.length; mistakes += m;
    c.forEach((x) => comps.add(x));
    lines.push(`| ${topic.label} | ${topic.weight === undefined ? "–" : pct(topic.weight)} | ${n} | ${mine.length} | ${c.size || "–"} | ${m} |`);
  }
  lines.push(`| **All** | | **${levels}** | **${templates}** | **${comps.size || "–"}** | **${mistakes}** |`);
  return lines.join("\n");
}

/* How much of the blueprint the path's templates reach, by how far the table
   of specifications says each competency can be practised in the app. */
function coverage(rs) {
  const served = new Set(rs.map((r) => r.competency).filter(Boolean));
  const of = (app) => blueprint.competencies.filter((c) => c.app === app);
  const hit = (app) => of(app).filter((c) => served.has(c.code)).length;
  return `The path's templates serve ${served.size} of the blueprint's ${blueprint.competencies.length} competencies: ` +
    `${hit("Y")} of the ${of("Y").length} it marks practicable in the app, ${hit("P")} of the ${of("P").length} marked partly practicable, ` +
    `and ${hit("N")} of the ${of("N").length} marked not practicable.`;
}

function schemaTable(rs) {
  const lines = ["| Schema | Kind | Templates |", "|---|---|---:|"];
  for (const [group, names] of Object.entries(blueprint.schemas)) {
    for (const s of names) lines.push(`| ${s} | ${GROUP_NAME[group] || group} | ${rs.filter((r) => r.schema === s).length} |`);
  }
  return lines.join("\n");
}

function block(r) {
  const e = r.example;
  const lines = [`#### ${code(r.template)}`, "", r.construct + (/[.?!]$/.test(r.construct) ? "" : "."), ""];
  lines.push(`- **Competency:** ${r.competencyText}`);
  lines.push(`- **Domain:** ${r.domain}, ${DOMAIN.get(r.domain) || r.domain}`);
  lines.push(`- **Schema:** ${r.schemaText}`);
  lines.push(`- **Answer:** ${r.answer}`);
  lines.push(`- **Draws:** ${r.draws.length ? r.draws.map(code).join("; ") : "nothing; every question is the same"}`);
  if (r.where.length) lines.push(`- **Kept only when:** ${r.where.map(code).join("; ")}`);
  lines.push(`- **Formats:** ${r.formats.map(code).join(", ")}`);
  lines.push(`- **Named mistakes:** ${r.mistakes.length ? r.mistakes.map(code).join(", ") : "none"}`);
  lines.push(`- **Example:** ${e.picture ? e.picture + " " : ""}${e.prompt}` +
    (e.choices.length ? ` Choices: ${e.choices.join("; ")}` + (/[.?!]$/.test(e.choices[e.choices.length - 1]) ? "" : ".") : "") +
    ` **Answer: ${e.answer}**`);
  return lines.join("\n");
}

function part(rs, list, heading, intro) {
  const out = [`## ${heading}`, "", intro, ""];
  let n = 0;
  for (const topic of list) {
    if (topic.comingSoon) continue;
    n++;
    const file = fileOf(topic);
    out.push(`### ${n}. ${topic.label} (${code(topic.key)})`, "");
    if (topic.weight !== undefined) out.push(`Blueprint weight ${pct(topic.weight)}.`, "");
    file.levels.forEach((level, i) => {
      const mine = rs.filter((r) => r.topic === topic.key && r.level === level.id);
      const head = `**Level ${i + 1}: ${level.title}** (${code(level.id)}`;
      if (level.kind === "review") {
        out.push(`${head}): asks every fact of the topic again, so it has no templates of its own.`, "");
        return;
      }
      const facts = level.kind === "facts" ? `, ${C.facts(topic.key, level.id).length} facts practised one by one` : "";
      out.push(`${head}, ${mine.length} template${mine.length === 1 ? "" : "s"}${facts})`, "");
      for (const r of mine) out.push(block(r), "");
    });
  }
  return out.join("\n");
}

function markdown() {
  const rs = rows();
  const path = rs.filter((r) => r.part === "path"), basics = rs.filter((r) => r.part === "basics");
  return [
    "# Item specifications",
    "",
    `Generated from the question packs (${manifest.subtest} pack ${manifest.version}) by ${code("node tools/item-spec.js")}. ` +
      "Do not edit it by hand: CI fails when this file and the packs disagree, so it always describes what the app asks.",
    "",
    "Each entry is a **template**, one kind of question. The app draws its numbers afresh every time, so one template stands " +
      "for many items. A level starts at tier 1, moves to tier 2 after 3 answers right first time and to tier 3 after 6, and " +
      "reviews a cleared level at tier 4; the practice exam asks at tier 3. **Draws** lists the ranges each tier uses. " +
      "**Named mistakes** are the wrong answers the template recognises, each with its own feedback. The **example** is the " +
      `question drawn at tier ${EXAMPLE_TIER} from seed ${EXAMPLE_SEED}, exactly as the app would show it.`,
    "",
    "For a spreadsheet, or a panel of expert raters, " + code("node tools/item-spec.js --csv") + " prints the same table, one row per template.",
    "",
    "## Summary",
    "",
    summaryTable(path, manifest.topics),
    "",
    coverage(path),
    "",
    "Problem schemas on the path:",
    "",
    schemaTable(path),
    "",
    `Basics: ${basics.length} templates in ${(manifest.basics || []).length} topics, practised beside the path and not counted towards the blueprint.`,
    "",
    part(path, manifest.topics, "The path", "The blueprint's topics, in the order a learner meets them."),
    part(basics, manifest.basics || [], "Basics", "The facts and methods under the path's topics. They serve no blueprint competency of their own."),
  ].join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

/* ---------- CSV ---------- */

function csvCell(v) {
  const s = String(v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function csv() {
  const head = ["part", "topic", "topic_label", "level_no", "level", "level_title", "template", "competency", "competency_text",
    "domain", "construct", "schema", "answer", "draws", "kept_only_when", "formats", "named_mistakes",
    "example_picture", "example_prompt", "example_choices", "example_answer"];
  const lines = [head.join(",")];
  for (const r of rows()) {
    lines.push([r.part, r.topic, r.topicLabel, r.levelNo, r.level, r.levelTitle, r.template, r.competency,
      r.competency ? COMPETENCY.get(r.competency).text : "", r.domain, r.construct, r.schema, r.answer,
      r.draws.join("; "), r.where.join("; "), r.formats.join("; "), r.mistakes.join("; "),
      r.example.picture, r.example.prompt, r.example.choices.join("; "), r.example.answer].map(csvCell).join(","));
  }
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

/* Whether a copy of the file says what the packs say. Line endings do not
   count: a Windows checkout has CRLF. */
function check(text) { return text.replace(/\r\n/g, "\n") === markdown(); }

/* ---------- main ---------- */

if (require.main === module) {
  const arg = process.argv[2];
  if (arg === "--csv") process.stdout.write(csv());
  else if (arg === "--check") {
    if (!check(fs.existsSync(path.join(ROOT, OUT)) ? read(OUT) : "")) {
      console.error(`FAIL ${OUT} is out of date with the packs. Run: node tools/item-spec.js`);
      process.exit(1);
    }
    console.log(`ok: ${OUT} matches the packs`);
  } else if (arg === undefined) {
    fs.writeFileSync(path.join(ROOT, OUT), markdown());
    console.log(`wrote ${OUT}`);
  } else {
    console.error("usage: node tools/item-spec.js [--check | --csv]");
    process.exit(2);
  }
}

module.exports = { rows, markdown, csv, check, draws, answerText, csvCell, EXAMPLE_TIER, EXAMPLE_SEED };
