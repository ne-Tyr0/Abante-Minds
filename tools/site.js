/* The published site: the app's own files and nothing else (decided with the
   owner, 4 November 2026). The Publish workflow puts what this gathers on
   GitHub Pages, so design pages, tools, tests and notes stay in the
   repository and off the site, where a page loading outside code would share
   the app's address and its saved data.
   The list is sw.js's SHELL (every file the app precaches), sw.js itself, and
   the practice reminder's calendar files. index.html is the only page.

   Run:  node tools/site.js [dir]    copies the site into dir (default _site);
                                     exits 1 if a listed file is missing */
"use strict";
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");

function files() {
  const sw = fs.readFileSync(path.join(REPO, "sw.js"), "utf8");
  const shell = sw.slice(sw.indexOf("var SHELL = ["), sw.indexOf("];", sw.indexOf("var SHELL = [")));
  const listed = [...shell.matchAll(/^\s*"([^"]+)",?/gm)].map((m) => m[1]).filter((f) => f !== "./");
  const reminders = fs.readdirSync(path.join(REPO, "reminders")).filter((f) => f.endsWith(".ics")).map((f) => "reminders/" + f);
  return ["sw.js"].concat(listed, reminders);
}

function main() {
  const out = path.resolve(REPO, process.argv[2] || "_site");
  const list = files();
  const missing = list.filter((f) => !fs.existsSync(path.join(REPO, f)));
  if (missing.length) { console.log("missing: " + missing.join(", ")); process.exit(1); }
  const pages = list.filter((f) => /\.html?$/.test(f));
  if (pages.join() !== "index.html") { console.log("the site must have one page, index.html; it has: " + pages.join(", ")); process.exit(1); }
  fs.rmSync(out, { recursive: true, force: true });
  list.forEach((f) => {
    fs.mkdirSync(path.dirname(path.join(out, f)), { recursive: true });
    fs.copyFileSync(path.join(REPO, f), path.join(out, f));
  });
  console.log("site: " + list.length + " files in " + path.relative(REPO, out));
}

module.exports = { files: files };
if (require.main === module) main();
