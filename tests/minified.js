/* The site as published behaves as the source does.
   The Publish workflow minifies the app's scripts, styles and question packs
   (tools/site.js --minify). This builds that site into a scratch folder, lays
   the minified scripts and packs over a copy of the repository, and runs
   there every test that loads them: the engine, the rules, the replay, the
   packs and the fuzz. A minifier that changed what the code does fails here
   before it reaches a learner. The repository's own rules (invariants,
   cache-bump) read the source, so they are not run on the copy.

   Run:  npm ci --ignore-scripts && node tests/minified.js     Exits 1 on any failure. */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "am-minified-"));
const SKIP = new Set([".git", "node_modules", "_site", ".claude"]);
const TESTS = ["engine", "entry", "facts", "insights", "progress", "readiness", "challenge", "share", "road", "reminder", "replay", "validate-packs", "item-spec", "fuzz"];

fs.cpSync(REPO, WORK, { recursive: true, filter: (src) => !SKIP.has(path.basename(src)) || path.dirname(src) !== REPO });
const built = path.join(WORK, "_min");
const site = spawnSync(process.execPath, [path.join(REPO, "tools/site.js"), built, "--minify"], { cwd: REPO, encoding: "utf8" });
if (site.status !== 0) { console.log("FAIL the minified site did not build\n" + site.stdout + site.stderr); process.exit(1); }
console.log(site.stdout.trim());

/* The minified copies, laid over the repository copy. */
let laid = 0;
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name), rel = path.relative(built, full).split(path.sep).join("/");
    if (fs.statSync(full).isDirectory()) { walk(full); continue; }
    if (/^(app|motion)\/.+\.js$/.test(rel) || /^content\/.+\.json$/.test(rel)) { fs.copyFileSync(full, path.join(WORK, rel)); laid++; }
  }
})(built);
console.log("laid " + laid + " minified scripts and packs over the copy");

let failed = 0;
for (const t of TESTS) {
  const r = spawnSync(process.execPath, [path.join(WORK, "tests", t + ".js")], { cwd: WORK, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const last = (r.stdout || "").trim().split("\n").pop();
  if (r.status === 0) console.log("ok   " + t + ": " + last);
  else { failed++; console.log("FAIL " + t + " (exit " + r.status + ")\n" + (r.stdout || "").split("\n").filter((l) => /FAIL|Error|error/.test(l)).slice(0, 8).join("\n") + (r.stderr || "").slice(0, 800)); }
}
try { fs.rmSync(WORK, { recursive: true, force: true }); } catch (e) { /* a scratch folder */ }
console.log(failed ? `\n${failed} failed on the minified site` : "\nok: the minified site behaves as the source");
process.exit(failed ? 1 : 0);
