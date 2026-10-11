/* Mutation test for tests/progress.js: break the store's path rules one way
   at a time and require the progress tests to fail.

   Run:  node tests/mutation/progress.js        Exits 1 if any mutant survives. */
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");
// The repository under test (default: this checkout) and a scratch folder to
// break copies in (default: a fresh temp folder).
const REPO = process.argv[2] || path.join(__dirname, "..", "..");
const WORK = process.argv[3] || fs.mkdtempSync(path.join(os.tmpdir(), "am-mutants-"));
const SRC = fs.readFileSync(path.join(REPO, "app/store.js"), "utf8").split("\r\n").join("\n");

const M = [
  ["clears at seven", "  var CLEAR_TARGET = 8;", "  var CLEAR_TARGET = 7;"],
  ["retries count", "    if (firstTry) {\n      s.attempts += 1;", "    if (true) {\n      s.attempts += 1;"],
  ["clearing announced every time", "        if (!s.cleared && s.correct >= CLEAR_TARGET) { s.cleared = true; clearedNow = true; }", "        if (s.correct >= CLEAR_TARGET) { s.cleared = true; clearedNow = true; }"],
  ["every level open", "    levels.forEach(function (lv, i) { lv.unlocked = i === 0 || levels[i - 1].cleared; });", "    levels.forEach(function (lv) { lv.unlocked = true; });"],
  ["numbers never get harder", "    return s.correct >= 6 ? 3 : s.correct >= 3 ? 2 : 1;", "    return 1;"],
  ["review not hardest", "    if (s.cleared) return 4;", ""],
  ["old progress carried over", "    CARRIED.forEach(function (k) { if (k in saved) base[k] = saved[k]; });", "    Object.keys(saved).forEach(function (k) { base[k] = saved[k]; });"],
  ["migration not saved at launch", "  write(state); /* saves a migrated record straight away */", ""],
  ["coverage counts levels, not competencies", "      coverage: reachable ? Object.keys(covered).length / reachable : 0,", "      coverage: reachable ? levelsCleared / reachable : 0,"],
  ["next ignores the level last practised", "      if (lt && lt.current) next = { topic: lt, level: lt.current };", ""],
  ["lesson seen not kept", "    s.lessonSeen = true;\n    saveLevel(topic, level, s);", "    s.lessonSeen = true;"],
  ["topic badge for one level", "earned: p.topics.some(function (t) { return t.done; }),", "earned: p.topics.some(function (t) { return t.cleared > 0; }),"],
  // Basics facts
  ["mastered in one day", "  var MASTERY_DAYS = 2;", "  var MASTERY_DAYS = 1;"],
  ["slow answers count towards mastery", "      if (quick && f.days.indexOf(t) < 0) f.days", "      if (f.days.indexOf(t) < 0) f.days"],
  ["one day counted twice", "      if (quick && f.days.indexOf(t) < 0) f.days", "      if (quick) f.days"],
  ["days kept forever", "f.days = f.days.concat(t).slice(-MASTERY_DAYS);", "f.days = f.days.concat(t);"],
  ["a miss keeps mastery", "      f.miss += 1;\n      f.days = [];", "      f.miss += 1;"],
  ["mastery announced every time", "    return { mastered: now && !was, lost: was && !now };", "    return { mastered: now, lost: was && !now };"],
  ["facts do not count as right", "      f.right += 1;\n      state.totalCorrect += 1;", "      f.right += 1;"],
  ["facts do not keep the streak", "  function recordFact(key, right, quick) {\n    rollDay();\n    markPractice();", "  function recordFact(key, right, quick) {\n    rollDay();"],
  ["facts are not progress", " || Object.keys(state.facts).length > 0;", ";"],
  ["review counted twice", "    var factLevels = levels.filter(function (lv) { return lv.kind === \"facts\"; });", "    var factLevels = levels.filter(function (lv) { return lv.kind !== \"practice\"; });"],
  ["Basics levels locked", "        unlocked: true,", "        unlocked: i === 0,"],
  ["next ignores what is done", "      next: own.filter(function (lv) { return !lv.done; })[0] || null", "      next: own[0]"],
  ["Basics move the path", "    var topics = AM.content.TOPICS.map(topicPath);", "    var topics = AM.content.TOPICS.concat(AM.content.BASICS).map(topicPath);"],
  // practice exams
  ["exam moves the path", "    state.exams = (state.exams || []).concat(", "    state.totalCorrect += r.score;\n    state.exams = (state.exams || []).concat("],
  ["exam breaks the streak", "    rollDay();\n    markPractice();\n    state.exams", "    rollDay();\n    state.exams"],
  ["every exam kept", "      .slice(-EXAMS_KEPT);", "      ;"],
  ["best tie goes to the earlier", "x.score / x.total >= b.score / b.total ? x : b", "x.score / x.total > b.score / b.total ? x : b"],
  // the attempt log
  ["log kept without its cap", "    if (log.length > LOG_MAX) log.splice(0, log.length - LOG_MAX);\n", ""],
  ["log not saved", "    saveLog();\n    return row;", "    return row;"],
  ["log rows unstamped", "    var row = { at: Date.now(), app: APP_BUILD };", "    var row = {};"],
  ["a full phone loses the new answer", "      catch (e) { attemptLog.splice(0, Math.max(1, Math.floor(attemptLog.length / 5))); }", "      catch (e) { attemptLog.pop(); }"],
  ["log handed out by reference", "    attempts: function () { return loadLog().slice(); },", "    attempts: function () { return loadLog(); },"],
];

fs.mkdirSync(path.join(WORK, "app"), { recursive: true });
fs.mkdirSync(path.join(WORK, "tests"), { recursive: true });
fs.copyFileSync(path.join(REPO, "tests/progress.js"), path.join(WORK, "tests/progress.js"));
let caught = 0;
for (const [name, from, to] of M) {
  if (SRC.split(from).length !== 2) { console.log(`BAD   ${name}: pattern not found once`); continue; }
  fs.writeFileSync(path.join(WORK, "app/store.js"), SRC.replace(from, to));
  const r = spawnSync(process.execPath, [path.join(WORK, "tests/progress.js")], { encoding: "utf8" });
  const fails = (r.stdout.match(/^FAIL .*/gm) || []).map((l) => l.slice(5));
  if (r.status === 1 && fails.length) { caught++; console.log(`ok    ${name}  <- ${fails.join("; ")}`); }
  else console.log(`MISS  ${name}`);
}
console.log(`\n${caught}/${M.length} progress mutants caught`);
process.exit(caught === M.length ? 0 : 1);
