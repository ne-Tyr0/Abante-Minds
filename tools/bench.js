/* How long the app takes to draw its screens, on a phone-like CPU.
   Starts headless Chrome, slows its CPU (default 4x, roughly a budget
   Android phone against a desktop), opens the screenshot harness and times
   each screen: going to it from another screen, the page built, put in and
   laid out. Medians of many runs after a warm-up, so one slow frame does not
   decide it. Also times the app's start: the harness reloaded, from the
   navigation to the app's first screen.

   Run:  node tools/bench.js [--rate 4] [--runs 15] [--base http://localhost:5179/]
                             [--screens home,topics,profile,badges,tiers,road] [--json out.json]
   Needs the dev server (python devserver.py) or --base pointing at a copy
   of the site that includes tools/overview-pdf/shots.html. */
"use strict";
const { spawn, execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const arg = (name, dflt) => { const i = process.argv.indexOf("--" + name); return i > -1 ? process.argv[i + 1] : dflt; };
const RATE = +arg("rate", 4), RUNS = +arg("runs", 15), BASE = arg("base", "http://localhost:5179/");
const SCREENS = arg("screens", "home,topics,profile,badges,tiers,road").split(",");
const OUT = arg("json", null);
const PORT = 9300 + Math.floor(Math.random() * 500);
const CHROME = process.env.CHROME || (process.platform === "win32" ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
  : process.platform === "darwin" ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" : "google-chrome");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function target() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch (e) { /* not up yet */ }
    await sleep(250);
  }
  throw new Error("Chrome did not open its debugging port");
}

function client(url) {
  const ws = new WebSocket(url);
  let id = 0;
  const waiting = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && waiting.has(msg.id)) { const w = waiting.get(msg.id); waiting.delete(msg.id); msg.error ? w.reject(new Error(msg.error.message)) : w.resolve(msg.result); }
  };
  const open = new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  return {
    open,
    send(method, params) { return new Promise((resolve, reject) => { const n = ++id; waiting.set(n, { resolve, reject }); ws.send(JSON.stringify({ id: n, method, params: params || {} })); }); },
    async eval(expr) {
      const r = await this.send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text);
      return r.result.value;
    },
    close() { ws.close(); }
  };
}

/* Runs in the harness page: the app is in its iframe. */
const MEASURE = (screens, runs) => `(async () => {
  const w = document.querySelector("iframe").contentWindow, AM = w.AM, P = w.performance;
  const med = (a) => { a = a.slice().sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
  /* The Back guard pushes and pops a history entry as Home comes and goes;
     flipping screens this fast would pop the harness page itself. */
  w.history.pushState = () => {}; w.history.back = () => {};
  const out = {};
  for (const s of ${JSON.stringify(screens)}) {
    const other = s === "road" ? "home" : "road";
    for (let i = 0; i < 3; i++) { AM.app.go(other); w.document.body.offsetHeight; AM.app.go(s); w.document.body.offsetHeight; }
    const t = [];
    for (let i = 0; i < ${runs}; i++) {
      AM.app.go(other); w.document.body.offsetHeight;
      await new Promise((r) => setTimeout(r, 0));
      const a = P.now(); AM.app.go(s); w.document.body.offsetHeight; t.push(P.now() - a);
    }
    out[s] = { median: +med(t).toFixed(1), best: +Math.min(...t).toFixed(1), nodes: w.document.querySelectorAll(".am-frame *").length };
  }
  return out;
})()`;

async function readyTitle(c, want) {
  for (let i = 0; i < 240; i++) {
    let t = "";
    try { t = await c.eval("document.title"); } catch (e) { /* mid-navigation */ }
    if (t === want) return;
    await sleep(250);
  }
  throw new Error("the harness never reported " + want);
}

async function main() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "am-bench-"));
  const chrome = spawn(CHROME, ["--headless=new", "--mute-audio", "--disable-gpu", "--no-first-run", "--window-size=390,844",
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
  const kill = () => {
    try { process.platform === "win32" ? execFileSync("taskkill", ["/F", "/T", "/PID", String(chrome.pid)], { stdio: "ignore" }) : chrome.kill("SIGKILL"); } catch (e) { /* gone */ }
  };
  try {
    const c = client(await target());
    await c.open;
    await c.send("Runtime.enable");
    await c.send("Page.enable");
    const harness = BASE + "tools/overview-pdf/shots.html?w=390&h=844&screen=";
    /* First visit installs the service worker and its cache; the start is
       timed on the visits after, as a learner opening the app again. */
    await c.send("Page.navigate", { url: harness + "home" });
    await readyTitle(c, "READY-home");
    await c.send("Emulation.setCPUThrottlingRate", { rate: RATE });
    const starts = [], scripts = [];
    for (let i = 0; i < 7; i++) {
      await c.send("Page.navigate", { url: harness + "home&n=" + i });
      await readyTitle(c, "READY-home");
      const t = await c.eval(`(() => { const w = document.querySelector("iframe").contentWindow; const n = w.performance.getEntriesByType("navigation")[0]; const r = w.performance.getEntriesByName("am-first-screen")[0]; return [n.domContentLoadedEventEnd, r ? r.startTime : null]; })()`);
      scripts.push(t[0]); starts.push(t[1] === null ? t[0] : t[1]);
    }
    const mid = (a) => +a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)].toFixed(0);
    const result = { rate: RATE, runs: RUNS, scripts: mid(scripts), start: mid(starts), screens: await c.eval(MEASURE(SCREENS, RUNS)) };
    c.close();
    console.log(`CPU ${RATE}x slower, median of ${RUNS} runs (ms)`);
    console.log(`  start: scripts run by ${result.scripts}, first screen by ${result.start} (from the app's reload)`);
    for (const s of SCREENS) console.log(`  ${s.padEnd(8)} ${String(result.screens[s].median).padStart(6)}   best ${String(result.screens[s].best).padStart(6)}   ${result.screens[s].nodes} elements`);
    if (OUT) fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
  } finally {
    kill();
    await sleep(500);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* Chrome may still hold it */ }
  }
}

main().catch((e) => { console.error(e.stack || e.message); process.exit(1); });
