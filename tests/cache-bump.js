/* Release rule from CLAUDE.md: when a precached file changes, CACHE in sw.js
   must change too. Otherwise an installed phone keeps serving its old copy
   until it happens to revalidate, and two learners on the same release can be
   running different code -- which matters once attempts are logged with a
   version.

   Run on a pull request:  node tests/cache-bump.js origin/main */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const base = process.argv[2] || "origin/main";
const git = (...args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" });

const cacheOf = (src) => (src.match(/var CACHE = "([^"]+)";/) || [])[1];
const shellOf = (src) => {
  const m = src.match(/var SHELL = \[([\s\S]*?)\];/);
  if (!m) return [];
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => (x[1] === "./" ? "index.html" : x[1]));
};

let baseSw;
try {
  baseSw = git("show", `${base}:sw.js`);
} catch {
  console.log(`no sw.js on ${base}; nothing to compare`);
  process.exit(0);
}

const headSw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
const changed = git("diff", "--name-only", `${base}...HEAD`).split("\n").filter(Boolean);
const precached = new Set(shellOf(headSw));
const shipped = changed.filter((f) => precached.has(f));

if (!shipped.length) {
  console.log("ok   no precached file changed, so CACHE may stay as it is");
  process.exit(0);
}

const before = cacheOf(baseSw);
const after = cacheOf(headSw);
console.log("precached files changed: " + shipped.join(", "));
if (before === after) {
  console.log(`FAIL CACHE is still "${after}". Bump it in sw.js so installed phones refetch.`);
  process.exit(1);
}
console.log(`ok   CACHE moved from "${before}" to "${after}"`);
