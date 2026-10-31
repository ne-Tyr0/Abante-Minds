/* Mutation test for tests/readiness.js: break the estimate, the look back and
   today's goal one way at a time, and require the tests to fail.

   Run:  node tests/mutation/readiness.js        Exits 1 if any mutant survives. */
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const REPO = path.join(__dirname, "..", "..");
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "am-readiness-"));
const FILES = { rules: "app/readiness.js", store: "app/store.js" };
const read = (f) => fs.readFileSync(path.join(REPO, f), "utf8").split("\r\n").join("\n");
const SRC = {};
Object.keys(FILES).forEach((k) => { SRC[k] = read(FILES[k]); });

const M = [
  ["rules", "first tries only", "return row.attempt === 1 && (row.kind", "return (row.kind"],
  ["rules", "exams do not count", "(row.kind === \"practice\" || row.kind === \"exam\")", "(row.kind === \"practice\")"],
  ["rules", "every kind counts", "(row.kind === \"practice\" || row.kind === \"exam\")", "true"],
  ["rules", "the oldest first tries are used", "for (var i = rows.length - 1; i >= 0; i--) {", "for (var i = 0; i < rows.length; i++) {"],
  ["rules", "no limit on how far back", "if (t.asked >= RECENT) continue;", ""],
  ["rules", "too few are trusted", "asked >= MIN ? seen.right / asked : UNSEEN", "asked ? seen.right / asked : UNSEEN"],
  ["rules", "the share is ignored", "(t.cleared / t.total) * share", "(t.cleared / t.total)"],
  ["rules", "what is cleared is ignored", "(t.cleared / t.total) * share", "share"],
  ["rules", "answered topics read not started", "!t.cleared && !asked ?", "!t.cleared ?"],
  ["rules", "strong is too easy", "var STRONG = 0.7,", "var STRONG = 0.6,"],
  ["rules", "strong line excluded", "score >= STRONG ?", "score > STRONG ?"],
  ["rules", "building line excluded", "score >= BUILDING ?", "score > BUILDING ?"],
  ["rules", "started needs nothing", "started: t.cleared > 0 || asked >= MIN", "started: true"],
  ["rules", "a few tries are started", "started: t.cleared > 0 || asked >= MIN", "started: t.cleared > 0 || asked > 0"],
  ["rules", "weightless topics kept", "t.weight > 0 && t.total > 0", "t.total > 0"],
  ["rules", "levelless topics kept", "t.weight > 0 && t.total > 0", "t.weight > 0"],
  ["rules", "weights ignored", "a + t.weight * t.score", "a + t.score"],
  ["rules", "rounds up", "Math.floor((share * 100 + 1e-9) / STEP) * STEP", "Math.ceil((share * 100 - 1e-9) / STEP) * STEP"],
  ["rules", "focus ignores weight", "var g = t.weight * (1 - t.score);", "var g = 1 - t.score;"],
  ["rules", "focus ignores the score", "var g = t.weight * (1 - t.score);", "var g = t.weight;"],
  ["rules", "focus on a finished topic", "if (g > gain) {", "if (g >= gain) {"],
  ["rules", "a week starts early", "if (row.at < from || row.at >= to) return;", "if (row.at >= to) return;"],
  ["rules", "a week runs on", "if (row.at < from || row.at >= to) return;", "if (row.at < from) return;"],
  ["rules", "a week counts retries", "if (row.attempt !== 1) return;\n", ""],
  ["rules", "an empty week is offered", "if (!any) return null;", ""],
  ["rules", "a week counts facts as a topic", "if (!counted(row)) return;\n      var t = tally", "var t = tally"],
  ["rules", "a strongest topic from too few", "if (t.asked < MIN) return;", ""],
  ["rules", "the weakest called strongest", "t.right / t.asked > best.right / best.asked", "t.right / t.asked < best.right / best.asked"],
  ["store", "yesterday's rounds count", "state.rounds && state.rounds.day === today() ? state.rounds.n : 0", "state.rounds ? state.rounds.n : 0"],
  ["store", "the goal is two rounds", "var DAILY_GOAL = 1;", "var DAILY_GOAL = 2;"],
  ["store", "every round meets the goal", "return !before && dailyGoal().met;", "return dailyGoal().met;"],
  ["store", "rounds not added up", "n: dailyGoal().done + 1", "n: 1"],
  ["store", "the look back offered this week", "var to = d.getTime();\n    d.setDate(d.getDate() - 7);", "d.setDate(d.getDate() + 7);\n    var to = d.getTime();\n    d.setDate(d.getDate() - 7);"],
  ["store", "put away does nothing", "if (state.recapSeen === now) return null;\n", ""],
  ["store", "put away not kept", "state.recapSeen = weekOf(today());\n    commit();", "state.recapSeen = weekOf(today());"],
  ["store", "levels of any week", "b.at >= fromDay && b.at < now", "true"],
  ["store", "levels from before badges", "return k.indexOf(\"lv:\") === 0 && !b.before &&", "return k.indexOf(\"lv:\") === 0 &&"],
];

for (const dir of ["app", "tests"]) fs.mkdirSync(path.join(WORK, dir), { recursive: true });
fs.copyFileSync(path.join(REPO, "tests/readiness.js"), path.join(WORK, "tests/readiness.js"));
Object.keys(FILES).forEach((k) => fs.writeFileSync(path.join(WORK, FILES[k]), SRC[k]));

let caught = 0, bad = 0;
for (const [which, name, from, to] of M) {
  if (SRC[which].split(from).length !== 2) { bad++; console.log("BAD   " + name + ": pattern not found once"); continue; }
  fs.writeFileSync(path.join(WORK, FILES[which]), SRC[which].replace(from, () => to));
  const r = spawnSync(process.execPath, [path.join(WORK, "tests/readiness.js")], { encoding: "utf8" });
  fs.writeFileSync(path.join(WORK, FILES[which]), SRC[which]);
  const fails = (r.stdout.match(/^FAIL .*/gm) || []).map((l) => l.slice(5));
  if (r.status !== 0) { caught++; console.log("ok    " + name + "  <- " + (fails[0] || "crashed")); }
  else console.log("MISS  " + name);
}
fs.rmSync(WORK, { recursive: true, force: true });
console.log("TOTAL " + caught + "/" + M.length + " readiness mutants caught" + (bad ? ", " + bad + " patterns not found" : ""));
process.exit(caught === M.length ? 0 : 1);
