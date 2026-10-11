#!/usr/bin/env node
/* Reprints the questions a learner was asked, exactly, from their attempt
   log (RESEARCH-PLAN item 21). Each row is rebuilt from its recipe by the
   same engine: template, tier and seed; or its place in the pinned list; or
   the Basics fact and the seed that chose its format. A thesis can attach
   the instrument as it was met, and a reviewer can check it.

     node tools/replay.js attempts.json          every attempt, as text
     node tools/replay.js attempts.json --csv    one row per attempt, for a spreadsheet

   attempts.json is the attempt log as the app keeps it: a JSON array of rows,
   the value saved under "abante-minds/attempts". A row made with another
   version of the pack is still rebuilt, but flagged, since its question may
   have changed since: to be exact, check out the commit with that pack
   version and replay from there. */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const PACK = "content/packs/math/";

global.window = global;
global.AM = {};
new Function(read("app/content.js")).call(global);
const C = global.AM.content;
const manifest = JSON.parse(read(PACK + "manifest.json"));
const fileOf = (t) => JSON.parse(read(PACK + t.file));
C.use(manifest, manifest.topics.map((t) => (t.comingSoon ? null : fileOf(t))), (manifest.basics || []).map(fileOf));

/* An answer as the app showed it: a choice by its label or picture, a
   number with its sign or unit. */
function shown(q, value) {
  if (value === null || value === undefined) return null;
  return q.type === "choice" ? C.choiceText(q, value) : (q.unit || "") + value + q.suffix;
}

/* One row of the log, rebuilt: the question, or why it could not be, and
   anything that makes the rebuilt question less than certain. */
function replayRow(row) {
  const flags = [];
  if (row.pack !== C.packVersion) flags.push(`asked with pack ${row.pack}; rebuilt with ${C.packVersion}, so it may differ`);
  let q = null;
  try {
    q = row.fact
      ? C.factQuestion(row.topic, row.level, row.fact, row.seed, row.ordinal || 0)
      : C.rebuild({ topic: row.topic, template: row.template, tier: row.tier, seed: row.seed, pinnedAt: row.pinned });
  } catch (e) { q = null; }
  if (!q) return { row, q: null, flags: flags.concat(`${row.fact || row.template} is not in pack ${C.packVersion}`) };
  if (q.format !== row.format) flags.push(`asked in format '${row.format}'; rebuilt as '${q.format}', so the pack has changed`);
  /* Marked again against the rebuilt question: a different verdict means
     the question is not the one that was asked. */
  if (row.given !== null && row.given !== undefined && C.isCorrect(q, row.given) !== !!row.correct)
    flags.push(`logged ${row.correct ? "right" : "wrong"}, but the rebuilt question marks it ${row.correct ? "wrong" : "right"}`);
  return {
    row, q, flags,
    answer: q.type === "choice" ? C.choiceText(q, q.answerIndex) : (q.unit || "") + q.answerText + q.suffix,
    given: shown(q, row.given)
  };
}

function choicesOf(q) {
  if (q.type !== "choice") return [];
  return q.choiceFigures ? q.choices.map((l, i) => `${l}: ${q.choiceFigures[i].text}`) : q.choices;
}

const when = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, "Z");
const recipe = (row) => row.fact ? `fact ${row.fact}, seed ${row.seed}`
  : row.pinned !== null && row.pinned !== undefined ? `${row.template}, tier ${row.tier}, pinned item ${row.pinned}`
  : `${row.template}, tier ${row.tier}, seed ${row.seed}`;

function text(rows) {
  const out = rows.map(replayRow);
  const sessions = new Set(rows.map((r) => r.session)).size;
  /* Rows logged before the participant code existed have none. */
  const who = new Set(rows.map((r) => r.participant).filter(Boolean)).size;
  const lines = [`${rows.length} attempt${rows.length === 1 ? "" : "s"} in ${sessions} session${sessions === 1 ? "" : "s"}` +
    (who ? ` from ${who} participant${who === 1 ? "" : "s"}` : "") +
    `, replayed with pack ${C.packVersion}; ${out.filter((x) => x.flags.length).length} flagged.`, ""];
  out.forEach((x, i) => {
    const r = x.row;
    lines.push(`${i + 1}. ${when(r.at)}${r.participant ? ` · ${r.participant}` : ""} · ${r.kind} · ${r.topic} / ${r.level} · try ${r.attempt}`);
    lines.push(`   ${recipe(r)} (format ${r.format}, pack ${r.pack}, app ${r.app})`);
    for (const f of x.flags) lines.push(`   ! ${f}`);
    if (x.q) {
      if (x.q.chart) lines.push(`   ${x.q.chart.text}`);
      lines.push(`   ${x.q.prompt}`);
      const choices = choicesOf(x.q);
      if (choices.length) lines.push(`   Choices: ${choices.join("; ")}`);
      lines.push(`   Answer: ${x.answer}. Given: ${x.given === null ? "not answered" : x.given}, ` +
        `${r.correct ? "right" : "wrong"}${r.error ? ` (${r.error})` : ""}. ` +
        `${(r.ms / 1000).toFixed(1)} s, ${r.hints} hint${r.hints === 1 ? "" : "s"}, ${r.steps} step${r.steps === 1 ? "" : "s"} seen.`);
    }
    lines.push("");
  });
  return lines.join("\n");
}

function csvCell(v) {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
const CSV_HEAD = ["n", "at", "participant", "session", "kind", "topic", "level", "template", "fact", "tier", "seed", "pinned", "format", "pack", "app",
  "attempt", "picture", "prompt", "choices", "answer", "given", "correct", "error", "ms", "hints", "steps", "flags"];
function csv(rows) {
  const lines = [CSV_HEAD.join(",")];
  rows.map(replayRow).forEach((x, i) => {
    const r = x.row, q = x.q;
    lines.push([i + 1, when(r.at), r.participant, r.session, r.kind, r.topic, r.level, r.template, r.fact, r.tier, r.seed, r.pinned, r.format,
      r.pack, r.app, r.attempt, q && q.chart ? q.chart.text : "", q ? q.prompt : "", q ? choicesOf(q).join("; ") : "",
      q ? x.answer : "", q ? x.given : r.given, r.correct, r.error, r.ms, r.hints, r.steps, x.flags.join("; ")].map(csvCell).join(","));
  });
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

if (require.main === module) {
  const [file, flag] = process.argv.slice(2);
  if (!file || (flag !== undefined && flag !== "--csv")) {
    console.error("usage: node tools/replay.js attempts.json [--csv]");
    process.exit(2);
  }
  const rows = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(rows)) { console.error(`${file} is not an attempt log: it should be a JSON array of rows`); process.exit(2); }
  process.stdout.write(flag === "--csv" ? csv(rows) : text(rows));
}

module.exports = { replayRow, text, csv, CSV_HEAD };
