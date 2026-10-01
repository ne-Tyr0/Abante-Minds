/* Repository invariants.
   Each check turns a rule from CLAUDE.md into something CI enforces, chosen
   because breaking it fails silently at runtime: the app keeps loading, and
   the damage only shows on a phone with no signal or on the live site.

   Run:  node tests/invariants.js        Exits 1 on any violation. */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const exists = (p) => fs.existsSync(path.join(ROOT, p));

let failed = 0;
function check(name, problems) {
  console.log((problems.length ? "FAIL " : "ok   ") + name);
  for (const p of problems) console.log("       " + p);
  if (problems.length) failed++;
}

/* The precache list. "./" is the directory index, which GitHub Pages serves
   as index.html. */
const swSrc = read("sw.js");
const shellMatch = swSrc.match(/var SHELL = \[([\s\S]*?)\];/);
if (!shellMatch) {
  console.log("FAIL could not find `var SHELL = [...]` in sw.js");
  process.exit(1);
}
const SHELL = [...shellMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
const precached = new Set(SHELL.map((p) => (p === "./" ? "index.html" : p)));

/* 1. sw.js wraps every cache.add in a catch, so a bad path here installs
      cleanly and that file is simply absent offline. */
check("every path in the sw.js precache list exists",
  SHELL.filter((p) => p !== "./" && !exists(p)).map((p) => "missing: " + p));

/* 2. Anything index.html loads that the service worker never cached breaks
      the first launch without signal. */
const html = read("index.html");
const isLocal = (u) => !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(u);
const htmlRefs = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)]
  .map((m) => m[1])
  .filter(isLocal);
check("every local file index.html loads is precached",
  htmlRefs.filter((u) => !precached.has(u)).map((u) => "loaded but not precached: " + u));

/* 3. The same for files a precached stylesheet pulls in with url(), such as
      the self-hosted fonts. */
const cssRefs = [];
for (const css of SHELL.filter((p) => p.endsWith(".css"))) {
  for (const m of read(css).matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    const ref = m[1].trim();
    if (!isLocal(ref)) continue;
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(css), ref));
    if (!precached.has(resolved)) cssRefs.push(`${css} -> ${resolved}`);
  }
}
check("every url() in a precached stylesheet is precached", cssRefs);

/* 4. GitHub Pages runs Jekyll unless this file exists, and Jekyll drops every
      path that starts with an underscore: all of _ds/. The site then returns
      200 for index.html and loads with no design system at all. */
check(".nojekyll exists at the repo root",
  exists(".nojekyll") ? [] : ["missing .nojekyll"]);

/* 5. The app promises no third-party requests. Any absolute URL in a shipped
      file is treated as one, apart from XML namespace identifiers, which are
      names rather than addresses. */
const NAMESPACES = new Set(["http://www.w3.org/2000/svg", "http://www.w3.org/1999/xlink"]);
const urlHits = [];
for (const file of precached) {
  if (!/\.(?:js|css|html|webmanifest|json)$/.test(file) || !exists(file)) continue;
  for (const m of read(file).matchAll(/https?:\/\/[^\s"'`)<>]+/g)) {
    if (!NAMESPACES.has(m[0])) urlHits.push(`${file}: ${m[0]}`);
  }
}
check("no third-party URL in any shipped file", urlHits);

/* 6. The vendored design system's styles.css @imports tokens/fonts.css, which
      fetches from Google. index.html loads the token files one by one so that
      import is never reached. */
const cdnEntry = /_ds\/[^"]*\/(?:styles\.css|tokens\/fonts\.css)"/;
check("index.html does not load the design system's CDN font import",
  cdnEntry.test(html) ? ["index.html references _ds styles.css or tokens/fonts.css"] : []);

/* 7. The bump check compares this string between branches. */
check("sw.js declares a CACHE version",
  /var CACHE = "[^"]+";/.test(swSrc) ? [] : ['no `var CACHE = "...";` line in sw.js']);

/* 8. Everything in the repo is published, so any page other than the app that
      writes saved progress must refuse to run off localhost. The screenshot
      harness seeds a demo learner; opened on the live site, it would wipe a
      real one. */
const walk = (dir) =>
  fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) => {
    const rel = dir ? `${dir}/${e.name}` : e.name;
    if (e.isDirectory()) return /^(?:\.git|\.claude|node_modules)$/.test(e.name) ? [] : walk(rel);
    return e.name.endsWith(".html") ? [rel] : [];
  });
const writers = walk("")
  .filter((f) => f !== "index.html")
  .filter((f) => /localStorage\.(?:setItem|removeItem|clear)\b/.test(read(f)));
check("every non-app page that writes saved progress refuses to run off localhost",
  writers.filter((f) => !/location\.hostname/.test(read(f))).map((f) => "no localhost guard: " + f));

console.log(failed ? `\n${failed} invariant(s) violated` : "\nall invariants hold");
process.exit(failed ? 1 : 0);
