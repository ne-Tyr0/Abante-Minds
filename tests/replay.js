/* Replay tests: a row of the attempt log rebuilds to the very question that
   was asked, its answer is shown as the app showed it, and anything that
   makes the rebuild less than certain is flagged.

   Run:  node tests/replay.js        Exits 1 on any failure. */
"use strict";
const assert = require("assert");
const R = require("../tools/replay.js");
const C = global.AM.content;

let failed = 0;
function test(name, fn) {
  try { fn(); console.log("ok   " + name); }
  catch (e) { failed++; console.log("FAIL " + name + "\n       " + e.message.split("\n")[0]); }
}

const AT = Date.UTC(2026, 9, 11, 6, 5, 0);
/* A row as the app logs it, for a question drawn from its recipe. */
function rowFor(topic, template, tier, seed, extra) {
  const q = C.rebuild({ topic, template, tier, seed, pinnedAt: null });
  return [Object.assign({
    at: AT, app: 39, session: "s1", topic, level: q.levelId, kind: "practice", template, tier, seed, pinned: null,
    format: q.format, fact: null, pack: C.packVersion, ordinal: 0, attempt: 1, given: q.answerText, correct: true,
    error: null, ms: 12300, hints: 1, steps: 0
  }, extra), q];
}

test("a row rebuilds to the question that was asked, unflagged", () => {
  for (const [topic, template] of [["decimals", "decimals.share-cost"], ["fractions", "fractions.pour-together"], ["time", "time.zone-convert"]]) {
    const [row, q] = rowFor(topic, template, 2, 4242);
    const x = R.replayRow(row);
    assert.strictEqual(x.q.prompt, q.prompt, template);
    assert.deepStrictEqual(x.flags, [], template);
    assert.strictEqual(x.answer, (q.unit || "") + q.answerText + q.suffix);
    assert.strictEqual(x.given, (q.unit || "") + q.answerText + q.suffix);
  }
});

test("a wrong answer is shown with the mistake it matched", () => {
  const [row, q] = rowFor("decimals", "decimals.share-cost", 1, 7);
  const d = q.distractors[0];
  row.given = String(d.value); row.correct = false; row.error = d.error;
  const out = R.text([row]);
  assert.ok(out.includes(`Given: ${q.unit}${d.value}, wrong (${d.error}).`), out);
  assert.ok(out.includes("12.3 s, 1 hint, 0 steps seen."));
});

test("a choice is shown by its label, and a picture choice by its picture", () => {
  const [row, q] = rowFor("transform", "transform.always-tiles", 1, 11, { given: 2 });
  assert.strictEqual(R.replayRow(row).given, q.choices[2]);
  const [pic, p] = rowFor("transform", "transform.pick-the-flip", 1, 5, { given: 1 });
  const x = R.replayRow(pic);
  assert.strictEqual(x.given, "Picture B");
  assert.strictEqual(x.answer, C.choiceText(p, p.answerIndex));
  assert.ok(R.text([pic]).includes("Choices: A: Picture: squared paper"), "each picture given in words");
});

test("a Basics fact is rebuilt from its fact and the seed that chose its format", () => {
  const key = C.facts("times", "2-5-10")[5];
  for (const seed of [3, 4, 5, 6]) {
    const q = C.factQuestion("times", "2-5-10", key, seed, 2);
    const row = { at: AT, app: 39, session: "s2", topic: "times", level: "2-5-10", kind: "facts", template: q.templateId, tier: 1, seed,
      pinned: null, format: q.format, fact: key, pack: C.packVersion, ordinal: 2, attempt: 1, given: q.answerText, correct: true,
      error: null, ms: 2100, hints: 0, steps: 0 };
    const x = R.replayRow(row);
    assert.strictEqual(x.q.prompt, q.prompt, "seed " + seed);
    assert.deepStrictEqual(x.flags, []);
  }
});

test("a skipped exam question is shown as not answered", () => {
  const [row] = rowFor("percent", "percent.of-number", 3, 99, { kind: "exam", given: null, correct: false, hints: 0 });
  assert.strictEqual(R.replayRow(row).given, null);
  assert.ok(R.text([row]).includes("Given: not answered, wrong."));
});

test("a row from another pack is rebuilt, but flagged", () => {
  const [row, q] = rowFor("area", "area.triangle", 1, 3, { pack: "1.0.0" });
  const x = R.replayRow(row);
  assert.strictEqual(x.q.prompt, q.prompt);
  assert.deepStrictEqual(x.flags, [`asked with pack 1.0.0; rebuilt with ${C.packVersion}, so it may differ`]);
});

test("an answer marked differently by the rebuilt question is flagged", () => {
  const [row, q] = rowFor("area", "area.triangle", 1, 3, { correct: false });
  assert.deepStrictEqual(R.replayRow(row).flags, ["logged wrong, but the rebuilt question marks it right"]);
  const [pic] = rowFor("transform", "transform.pick-the-flip", 1, 5);
  pic.given = (C.rebuild({ topic: "transform", template: "transform.pick-the-flip", tier: 1, seed: 5, pinnedAt: null }).answerIndex + 1) % 4;
  assert.deepStrictEqual(R.replayRow(pic).flags, ["logged right, but the rebuilt question marks it wrong"]);
  assert.deepStrictEqual(R.replayRow(rowFor("area", "area.triangle", 1, 3, { given: null, correct: false })[0]).flags, [], "an unanswered row is not marked");
  assert.ok(q);
});

test("a row whose format no longer matches is flagged", () => {
  const [row] = rowFor("area", "area.triangle", 1, 3, { format: "nope" });
  assert.ok(R.replayRow(row).flags.some((f) => /asked in format 'nope'/.test(f)));
});

test("a template the pack no longer has is reported, not rebuilt", () => {
  const [row] = rowFor("area", "area.triangle", 1, 3, { template: "area.gone" });
  const x = R.replayRow(row);
  assert.strictEqual(x.q, null);
  assert.ok(x.flags.some((f) => /area\.gone is not in pack/.test(f)));
  assert.ok(R.text([row]).includes("! area.gone is not in pack"));
});

test("the summary counts attempts, sessions and flags", () => {
  const rows = [rowFor("area", "area.triangle", 1, 3)[0], rowFor("area", "area.triangle", 1, 5)[0],
    rowFor("area", "area.triangle", 1, 4, { session: "s9", pack: "1.0.0" })[0]];
  assert.strictEqual(R.text(rows).split("\n")[0], `3 attempts in 2 sessions, replayed with pack ${C.packVersion}; 1 flagged.`);
});

test("the CSV has one row per attempt, every row the same width", () => {
  const rows = [rowFor("decimals", "decimals.share-cost", 1, 7, { session: 'a "quoted", id' })[0], rowFor("transform", "transform.pick-the-turn", 1, 2, { given: 0 })[0],
    rowFor("area", "area.triangle", 1, 3, { template: "area.gone" })[0]];
  const text = R.csv(rows);
  assert.strictEqual(text.charCodeAt(0), 0xfeff, "starts with a byte-order mark, for Excel");
  const table = parse(text.slice(1));
  assert.strictEqual(table.length, rows.length + 1);
  assert.deepStrictEqual(table[0], R.CSV_HEAD);
  assert.ok(table.every((r) => r.length === R.CSV_HEAD.length));
  assert.strictEqual(table[1][R.CSV_HEAD.indexOf("prompt")], R.replayRow(rows[0]).q.prompt, "quoting round-trips");
  assert.strictEqual(table[1][R.CSV_HEAD.indexOf("session")], 'a "quoted", id', "a quote inside a cell is doubled");
  assert.strictEqual(table[1][R.CSV_HEAD.indexOf("at")], "2026-10-11T06:05:00Z");
});

/* A CSV reader for the test, quoted cells and doubled quotes included. */
function parse(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\r" && text[i + 1] === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; i++; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
console.log("\nok: replay rebuilds what was asked");
