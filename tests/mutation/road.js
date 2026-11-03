/* Mutation test for tests/road.js: break the reward road's steps, its
   milestones, how a step opens and what it gives, one way at a time, and
   require the tests to fail.

   Run:  node tests/mutation/road.js        Exits 1 if any mutant survives. */
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const REPO = path.join(__dirname, "..", "..");
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "am-road-"));
const FILE = "app/road.js";
const SRC = fs.readFileSync(path.join(REPO, FILE), "utf8").split("\r\n").join("\n");

const M = [
  ["a step's streak moved", "{ streak: 14, levels: 15,", "{ streak: 15, levels: 15,"],
  ["a step's levels moved", "{ streak: 30, levels: 25,", "{ streak: 30, levels: 30,"],
  ["a reward swapped", "{ kind: \"frame\", key: \"silver\" }", "{ kind: \"frame\", key: \"gold\" }"],
  ["no levels route", "return s.levels !== null && levels >= s.levels ? \"levels\" : null;", "return null;"],
  ["the levels route one short", "levels >= s.levels ? \"levels\"", "levels > s.levels ? \"levels\""],
  ["the streak route one short", "if (best >= s.streak) return \"streak\";", "if (best > s.streak) return \"streak\";"],
  ["levels named before the streak", "if (best >= s.streak) return \"streak\";\n    return s.levels !== null && levels >= s.levels ? \"levels\" : null;",
    "if (s.levels !== null && levels >= s.levels) return \"levels\";\n    return best >= s.streak ? \"streak\" : null;"],
  ["past the table every 50", "var AFTER = 400, EVERY = 100;", "var AFTER = 400, EVERY = 50;"],
  ["past the table starts later", "var AFTER = 400, EVERY = 100;", "var AFTER = 500, EVERY = 100;"],
  ["every long streak a milestone", "if (days >= AFTER) return (days - AFTER) % EVERY === 0;", "if (days >= AFTER) return true;"],
  ["milestones not from the table", "return STEPS.some(function (s) { return s.streak === days; });", "return days % 7 === 0;"],
  ["steps numbered from nought", "return { n: i + 1,", "return { n: i,"],
  ["no shield past the table", "levels: null, rewards: [{ kind: \"shield\" }] };", "levels: null, rewards: [] };"],
  ["reaching stops early", "while (reachedBy(step(n), best, levels)) n++;", "while (n < 10 && reachedBy(step(n), best, levels)) n++;"],
  ["one step too many given", "for (var i = 0; i < n; i++) step(i)", "for (var i = 0; i <= n; i++) step(i)"],
  ["three shields held", "var MAX_SHIELDS = 2;", "var MAX_SHIELDS = 3;"],
  ["no cap on shields", "return Math.min(MAX_SHIELDS, Math.max(0, held) + Math.max(0, fresh));", "return held + fresh;"]
];

fs.mkdirSync(path.join(WORK, "app"), { recursive: true });
fs.mkdirSync(path.join(WORK, "tests"), { recursive: true });
fs.copyFileSync(path.join(REPO, "tests/road.js"), path.join(WORK, "tests/road.js"));

let caught = 0, bad = 0;
for (const [name, from, to] of M) {
  if (SRC.split(from).length !== 2) { bad++; console.log("BAD   " + name + ": pattern not found once"); continue; }
  fs.writeFileSync(path.join(WORK, FILE), SRC.replace(from, () => to));
  const r = spawnSync(process.execPath, [path.join(WORK, "tests/road.js")], { encoding: "utf8" });
  const fails = (r.stdout.match(/^FAIL .*/gm) || []).map((l) => l.slice(5));
  if (r.status !== 0) { caught++; console.log("ok    " + name + "  <- " + (fails[0] || "crashed")); }
  else console.log("MISS  " + name);
}
fs.rmSync(WORK, { recursive: true, force: true });
console.log("TOTAL " + caught + "/" + M.length + " road mutants caught" + (bad ? ", " + bad + " patterns not found" : ""));
process.exit(caught === M.length ? 0 : 1);
