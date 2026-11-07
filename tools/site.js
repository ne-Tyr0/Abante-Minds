/* The published site: the app's own files and nothing else (decided with the
   owner, 4 November 2026). The Publish workflow puts what this gathers on
   GitHub Pages, so design pages, tools, tests and notes stay in the
   repository and off the site, where a page loading outside code would share
   the app's address and its saved data.
   The list is sw.js's SHELL (every file the app precaches), sw.js itself, and
   the practice reminder's calendar files. index.html is the only page.

   With --minify (the Publish workflow, decided with the owner 6 November
   2026), the copies are made smaller on the way: the app's scripts by terser
   (pinned in package.json, installed only by that workflow), its stylesheets
   with their comments and spare spaces taken out, and the question packs
   without their indentation. The repository keeps every comment; nothing
   else changes, and index.html (whose inline script the security policy
   hashes), sw.js and the calendar files are copied as they are.

   Run:  node tools/site.js [dir] [--minify]   copies the site into dir (default _site);
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

/* A stylesheet without its comments, with runs of spaces made one and none
   around braces and semicolons. Strings are copied as they are. Nothing is
   reordered or rewritten, so what the rules say cannot change. */
function minifyCss(src) {
  const parts = [];
  let i = 0, plain = "";
  while (i < src.length) {
    const ch = src[i];
    if (ch === "/" && src[i + 1] === "*") { const end = src.indexOf("*/", i + 2); i = end < 0 ? src.length : end + 2; plain += " "; continue; }
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < src.length && src[j] !== ch) j += src[j] === "\\" ? 2 : 1;
      parts.push(plain, src.slice(i, j + 1)); plain = ""; i = j + 1; continue;
    }
    plain += ch; i++;
  }
  parts.push(plain);
  return parts.map((p, k) => k % 2 ? p : p.replace(/\s+/g, " ").replace(/\s*([{};])\s*/g, "$1").replace(/;}/g, "}")).join("").trim();
}

/* Which files are made smaller, and how. */
function minifierFor(f) {
  if (/^(app|motion)\/.+\.js$/.test(f)) return "js";
  if (/\.css$/.test(f)) return "css";
  if (/^content\/.+\.json$/.test(f)) return "json";
  return null;
}

async function minified(f, src) {
  const kind = minifierFor(f);
  if (kind === "css") return minifyCss(src);
  if (kind === "json") return JSON.stringify(JSON.parse(src));
  if (kind === "js") {
    const out = await require("terser").minify(src, { compress: { passes: 2 }, mangle: true, format: { comments: false }, safari10: true });
    return out.code;
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2), minify = args.includes("--minify");
  const out = path.resolve(REPO, args.filter((a) => a !== "--minify")[0] || "_site");
  const list = files();
  const missing = list.filter((f) => !fs.existsSync(path.join(REPO, f)));
  if (missing.length) { console.log("missing: " + missing.join(", ")); process.exit(1); }
  const pages = list.filter((f) => /\.html?$/.test(f));
  if (pages.join() !== "index.html") { console.log("the site must have one page, index.html; it has: " + pages.join(", ")); process.exit(1); }
  fs.rmSync(out, { recursive: true, force: true });
  let before = 0, after = 0;
  for (const f of list) {
    const from = path.join(REPO, f), to = path.join(out, f);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    const small = minify && minifierFor(f) ? await minified(f, fs.readFileSync(from, "utf8")) : null;
    if (small === null) { fs.copyFileSync(from, to); continue; }
    fs.writeFileSync(to, small);
    before += fs.statSync(from).size; after += Buffer.byteLength(small);
  }
  console.log("site: " + list.length + " files in " + path.relative(REPO, out) +
    (minify ? "; scripts, styles and packs " + Math.round(before / 1024) + " KB -> " + Math.round(after / 1024) + " KB" : ""));
}

module.exports = { files: files, minifyCss: minifyCss };
if (require.main === module) main().catch((e) => { console.log(e.message); process.exit(1); });
