/* Mutation test for tests/challenge.js: break the challenge round one way at a
   time, in its rules, its questions or what it keeps, and require the tests to
   fail. A test that can never fail would otherwise pass for one.

   Run:  node tests/mutation/challenge.js        Exits 1 if any mutant survives. */
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const REPO = path.join(__dirname, "..", "..");
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "am-challenge-"));
const FILES = { rules: "app/challenge.js", content: "app/content.js", store: "app/store.js" };
const read = (f) => fs.readFileSync(path.join(REPO, f), "utf8").split("\r\n").join("\n");
const SRC = {};
Object.keys(FILES).forEach((k) => { SRC[k] = read(FILES[k]); });

const M = [
  // the rules
  ["rules", "a sprint runs 90 seconds", 'label: "Sprint", seconds: 60', 'label: "Sprint", seconds: 90'],
  ["rules", "a ladder runs 60 seconds", 'label: "Ladder", seconds: 90', 'label: "Ladder", seconds: 60'],
  ["rules", "no triple at ten", "run >= 10 ? 3 : run >= 5 ? 2 : 1", "run >= 5 ? 2 : 1"],
  ["rules", "doubled from four", "run >= 5 ? 2 : 1", "run >= 4 ? 2 : 1"],
  ["rules", "the run counted after scoring", "      g.run += 1;\n      g.bestRun = Math.max(g.bestRun, g.run);\n      g.score += POINTS * g.step * multiplier(g.run);", "      g.score += POINTS * g.step * multiplier(g.run);\n      g.run += 1;\n      g.bestRun = Math.max(g.bestRun, g.run);"],
  ["rules", "a ladder ignores its step", "POINTS * g.step * multiplier", "POINTS * multiplier"],
  ["rules", "best run forgets", "g.bestRun = Math.max(g.bestRun, g.run);", "g.bestRun = g.run;"],
  ["rules", "a miss keeps the run", "      g.wrong += 1;\n      g.run = 0;", "      g.wrong += 1;"],
  ["rules", "a miss not counted", "      g.wrong += 1;\n", ""],
  ["rules", "the ladder climbs at two", "var STEP_RUN = 3;", "var STEP_RUN = 2;"],
  ["rules", "the ladder has no top", "g.stepRun >= STEP_RUN && g.step < TOP_STEP", "g.stepRun >= STEP_RUN"],
  ["rules", "the climb does not restart after a step", "          g.step += 1;\n          g.stepRun = 0;", "          g.step += 1;"],
  ["rules", "the top step not kept", "          g.top = Math.max(g.top, g.step);\n", ""],
  ["rules", "a miss does not step back", "        g.step = Math.max(1, g.step - 1);\n", ""],
  ["rules", "a miss steps back below 1", "g.step = Math.max(1, g.step - 1);", "g.step = g.step - 1;"],
  ["rules", "a miss keeps the climb going", "        g.stepRun = 0;\n        g.step = Math.max", "        g.step = Math.max"],
  ["rules", "a sprint never gets harder", "return g.right < SPRINT_EASY ? 1 : 2;", "return 1;"],
  ["rules", "a sprint gets harder at seven", "var SPRINT_EASY = 8;", "var SPRINT_EASY = 7;"],
  ["rules", "a sprint eases after a miss", "return g.right < SPRINT_EASY ? 1 : 2;", "return g.run < SPRINT_EASY ? 1 : 2;"],
  ["rules", "the ladder ignores its step for tier", 'if (g.mode === "ladder") return g.step;\n', ""],
  ["rules", "rose always", "g.rose = multiplier(g.run) > before;", "g.rose = multiplier(g.run) >= before;"],
  ["rules", "rose on a fall", "g.rose = multiplier(g.run) > before;", "g.rose = multiplier(g.run) !== before;"],
  ["rules", "the clock rounds down", "Math.ceil((g.endsAt - now) / 1000)", "Math.floor((g.endsAt - now) / 1000)"],
  ["rules", "the clock goes negative", "return Math.max(0, Math.ceil((g.endsAt - now) / 1000));", "return Math.ceil((g.endsAt - now) / 1000);"],
  ["rules", "the bar goes negative", "return Math.max(0, Math.min(1,", "return (Math.min(1,"],
  ["rules", "low from twenty", "var LOW_SECONDS = 10;", "var LOW_SECONDS = 20;"],
  ["rules", "the day ignored in the seed", "(Math.imul(h, 31) + text.charCodeAt(i))", "(Math.imul(h, 31))"],
  ["rules", "the mode ignored in the seed", 'var h = mode === "ladder" ? 7 : 3,', "var h = 3,"],
  // the questions
  ["content", "any length counts as short", "q.prompt.length <= QUICK_PROMPT", "q.prompt.length <= 5000"],
  ["content", "a graph counts as short", "!q.chart && !q.choiceFigures && q.prompt.length", "!q.choiceFigures && q.prompt.length"],
  ["content", "the tier ignored", "PACK, o.tier, qseed), found.topic, found.level, o.index)", "PACK, 1, qseed), found.topic, found.level, o.index)"],
  ["content", "the place in the round ignored", "(o.seed + o.index * 2654435761) >>> 0", "o.seed >>> 0"],
  ["content", "the same kind twice", "if (q.templateId !== o.avoid) { chosen = q; break; }", "chosen = q; break;"],
  ["content", "facts at every tier", "var plain = o.tier === 1 ? o.pool : o.pool.filter(function (e) { return !e.facts; });", "var plain = o.pool;"],
  ["content", "no facts at all", "var plain = o.tier === 1 ? o.pool : o.pool.filter(function (e) { return !e.facts; });", "var plain = o.pool.filter(function (e) { return !e.facts; });"],
  ["content", "facts alone give nothing", "var entries = plain.length ? plain : o.pool;", "var entries = plain;"],
  ["content", "long questions first", "var out = chosen || quick || noFigure || last;", "var out = noFigure || last;"],
  ["content", "a graph before anything else", "var out = chosen || quick || noFigure || last;", "var out = chosen || quick || last;"],
  // what a round keeps
  ["store", "the pool ignores whether a level is cleared", "} else if (levelState(t.key, lv.id).cleared) out.push({ topic: t.key, level: lv.id });", "} else out.push({ topic: t.key, level: lv.id });"],
  ["store", "the pool takes every fact", ".filter(function (k) { return factState(k).mastered; });", ";"],
  ["store", "a tie is a best", "(!previous || r.score > previous.score)", "(!previous || r.score >= previous.score)"],
  ["store", "the last round is the best", "(!previous || r.score > previous.score)", "true"],
  ["store", "no points can be a best", "var better = r.score > 0 && ", "var better = "],
  ["store", "the best not kept", "    if (better) c.best[mode] = entry;\n", ""],
  ["store", "plays not counted", "    c.played[mode] = (c.played[mode] || 0) + 1;\n", ""],
  ["store", "every round is today's challenge", "if (daily && r.right + r.wrong > 0) {", "if (r.right + r.wrong > 0) {"],
  ["store", "an empty round uses today's play", "if (daily && r.right + r.wrong > 0) {", "if (daily) {"],
  ["store", "today's challenge never counted", "      c.daily[mode] = entry;\n", ""],
  ["store", "yesterday still counts", "return d && d.day === today() ? d[mode] || null : null;", "return d ? d[mode] || null : null;"],
  ["store", "one mode wipes the other's play", "if (!c.daily || c.daily.day !== today()) c.daily = { day: today() };", "c.daily = { day: today() };"],
  ["store", "sprint badges from the score", "if (r.right >= n) award(\"challenge:sprint:\"", "if (r.score >= n) award(\"challenge:sprint:\""],
  ["store", "a sprint earns ladder badges", 'if (mode === "sprint") {\n      SPRINT_BADGES', 'if (mode !== "nothing") {\n      LADDER_STEP_BADGES.forEach(function (n) { if (r.top >= n) award("challenge:ladder:" + n); });\n      SPRINT_BADGES'],
  ["store", "sprint badge at 7", "var SPRINT_BADGES = [8, 15, 25]", "var SPRINT_BADGES = [7, 15, 25]"],
  ["store", "ladder step badges start at 1", "LADDER_STEP_BADGES = [2, 3]", "LADDER_STEP_BADGES = [1, 3]"],
  ["store", "ladder score badge at 500", "LADDER_SCORE_BADGE = 600", "LADDER_SCORE_BADGE = 500"],
  ["store", "the streak counts an empty round", "if (r.right + r.wrong > 0) markPractice();", "markPractice();"],
  ["store", "no streak from a round", "    if (r.right + r.wrong > 0) markPractice();\n", ""],
  ["store", "a round moves the path", "    var c = challengeState();\n    var entry =", "    state.totalCorrect = (state.totalCorrect || 0) + r.right;\n    var c = challengeState();\n    var entry ="],
  ["store", "a record not saved", "    state.challenge = c;\n", ""],
  ["store", "stats read another mode", "return { best: c.best[mode] || null,", 'return { best: c.best.sprint || null,']
];

for (const dir of ["app", "tests", "content"]) fs.mkdirSync(path.join(WORK, dir), { recursive: true });
fs.cpSync(path.join(REPO, "content"), path.join(WORK, "content"), { recursive: true });
fs.copyFileSync(path.join(REPO, "tests/challenge.js"), path.join(WORK, "tests/challenge.js"));
Object.keys(FILES).forEach((k) => fs.writeFileSync(path.join(WORK, FILES[k]), SRC[k]));

let caught = 0, bad = 0;
for (const [which, name, from, to] of M) {
  if (SRC[which].split(from).length !== 2) { bad++; console.log(`BAD   ${name}: pattern not found once`); continue; }
  fs.writeFileSync(path.join(WORK, FILES[which]), SRC[which].replace(from, () => to));
  const r = spawnSync(process.execPath, [path.join(WORK, "tests/challenge.js")], { encoding: "utf8" });
  fs.writeFileSync(path.join(WORK, FILES[which]), SRC[which]);
  const fails = (r.stdout.match(/^FAIL .*/gm) || []).map((l) => l.slice(5));
  if (r.status !== 0) { caught++; console.log(`ok    ${name}  <- ${fails[0] || "crashed"}`); }
  else console.log(`MISS  ${name}`);
}
fs.rmSync(WORK, { recursive: true, force: true });
console.log(`\n${caught}/${M.length} challenge mutants caught${bad ? `, ${bad} patterns not found` : ""}`);
process.exit(caught === M.length ? 0 : 1);
