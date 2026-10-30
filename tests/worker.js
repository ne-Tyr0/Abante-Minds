/* Weekly totals server tests: server/worker.js. A report is taken only in
   the one shape the phone sends, from the app's own address, for a finished
   week; every number becomes a running total with one "reports" mark per
   item; and the Worker never reads the caller's address.

   Run:  node tests/worker.js        Exits 1 on any failure. */
"use strict";
const path = require("path");
const assert = require("assert");
const { pathToFileURL } = require("url");

let failed = 0;
const results = [];
function test(name, fn) { results.push([name, fn]); }

const NOW = new Date("2026-10-28T09:00:00Z");      /* a Wednesday in 2026-W44 */
function report(over) {
  return Object.assign({
    v: 1, week: "2026-W43", app: "56",
    levels: { "decimals/add-and-subtract": { answered: 10, right: 7, hints: 2, finished: 1 } },
    review: { 3: { right: 2, wrong: 1 } },
    facts: { "times/2-5-10": { answered: 20, right: 18, quick: 12 } },
    exams: { taken: 1, topics: { decimals: { right: 2, asked: 3 } } },
    features: { "badge-card": 3 },
    errors: {}
  }, over || {});
}

function fakeDB() {
  const db = { statements: [], batches: 0 };
  db.prepare = (sql) => ({ bind: (...args) => ({ sql, args }) });
  db.batch = (list) => { db.batches++; db.statements = db.statements.concat(list); return Promise.resolve(); };
  return db;
}
function request(method, body, headers, url) {
  const h = Object.assign({ Origin: "https://ne-tyr0.github.io" }, headers || {});
  const read = [];
  return {
    read,
    method,
    url: url || "https://totals.example/v1/tally",
    headers: { get: (k) => { read.push(k); return h[k] === undefined ? null : h[k]; } },
    text: () => Promise.resolve(typeof body === "string" ? body : JSON.stringify(body))
  };
}

test("a report in the phone's shape is taken", (W) => {
  assert.deepStrictEqual(W.validate(report(), NOW), { ok: true });
});
test("the week must be one of the last eight finished weeks", (W) => {
  assert.strictEqual(W.isoWeek(NOW), "2026-W44");
  assert.ok(!W.validate(report({ week: "2026-W44" }), NOW).ok, "this week is not finished");
  assert.ok(!W.validate(report({ week: "2026-W45" }), NOW).ok, "the future");
  assert.ok(W.validate(report({ week: "2026-W36" }), NOW).ok, "eight weeks back");
  assert.ok(!W.validate(report({ week: "2026-W35" }), NOW).ok, "nine weeks back");
  assert.ok(!W.validate(report({ week: "last week" }), NOW).ok);
});
test("an unknown field anywhere is refused", (W) => {
  assert.ok(!W.validate(report({ id: "abc" }), NOW).ok, "no ID at the top");
  assert.ok(!W.validate(report({ levels: { "decimals/add-and-subtract": { answered: 1, name: 2 } } }), NOW).ok, "no unknown measure");
  assert.ok(!W.validate(report({ exams: { taken: 1, topics: {}, when: 3 } }), NOW).ok, "no extra exam field");
  assert.ok(!W.validate(report({ features: { "home-visits": 2 } }), NOW).ok, "only known features");
  assert.ok(!W.validate(report({ review: { 2: { right: 1 } } }), NOW).ok, "only the 1, 3 and 7 day intervals");
  assert.ok(!W.validate(report({ v: 2 }), NOW).ok, "only version 1");
});
test("keys must look like the app's own", (W) => {
  assert.ok(!W.validate(report({ levels: { "Decimals/Add": { answered: 1 } } }), NOW).ok);
  assert.ok(!W.validate(report({ levels: { "decimals": { answered: 1 } } }), NOW).ok, "a level key has a topic and a level");
  assert.ok(!W.validate(report({ facts: { "<script>/x": { answered: 1 } } }), NOW).ok);
  assert.ok(!W.validate(report({ errors: { "Load Failed": 1 } }), NOW).ok);
  assert.ok(!W.validate(report({ app: "56a" }), NOW).ok);
});
test("every number is a whole count from 0 to the cap", (W) => {
  assert.ok(W.validate(report({ features: { "badge-card": 5000 } }), NOW).ok);
  for (const bad of [-1, 5001, 1.5, "3", null, true]) {
    assert.ok(!W.validate(report({ features: { "badge-card": bad } }), NOW).ok, JSON.stringify(bad));
  }
  assert.ok(!W.validate(report({ exams: { taken: -1, topics: {} } }), NOW).ok);
});
test("a report may name at most 120 levels and 30 error codes", (W) => {
  const many = {};
  for (let i = 0; i < 121; i++) many["t" + i + "/l"] = { answered: 1 };
  assert.ok(!W.validate(report({ levels: many }), NOW).ok);
  delete many["t120/l"];
  assert.ok(W.validate(report({ levels: many }), NOW).ok);
  const errs = {};
  for (let i = 0; i < 31; i++) errs["e" + i] = 1;
  assert.ok(!W.validate(report({ errors: errs }), NOW).ok);
});
test("a report becomes totals, with one reports mark per item", (W) => {
  const r = W.rows(report());
  assert.deepStrictEqual(r, [
    ["level", "decimals/add-and-subtract", "reports", 1],
    ["level", "decimals/add-and-subtract", "answered", 10],
    ["level", "decimals/add-and-subtract", "right", 7],
    ["level", "decimals/add-and-subtract", "hints", 2],
    ["level", "decimals/add-and-subtract", "finished", 1],
    ["facts", "times/2-5-10", "reports", 1],
    ["facts", "times/2-5-10", "answered", 20],
    ["facts", "times/2-5-10", "right", 18],
    ["facts", "times/2-5-10", "quick", 12],
    ["review", "3", "reports", 1],
    ["review", "3", "right", 2],
    ["review", "3", "wrong", 1],
    ["exam-topic", "decimals", "reports", 1],
    ["exam-topic", "decimals", "right", 2],
    ["exam-topic", "decimals", "asked", 3],
    ["exam", "all", "taken", 1],
    ["feature", "badge-card", "count", 3]
  ]);
  assert.ok(!W.rows(report({ features: { "badge-card": 0 } })).some((x) => x[0] === "feature"), "a zero adds nothing");
});
test("the server takes a good report: one batch, every total plus the week's count", async (W) => {
  const env = { DB: fakeDB() };
  const req = request("POST", report());
  const res = await W.handle(req, env, NOW);
  assert.strictEqual(res.status, 204);
  assert.strictEqual(env.DB.batches, 1);
  assert.strictEqual(env.DB.statements.length, W.rows(report()).length + 1);
  const last = env.DB.statements[env.DB.statements.length - 1];
  assert.ok(/INSERT INTO reports/.test(last.sql) && last.args[0] === "2026-W43" && last.args[1] === "56");
  assert.ok(env.DB.statements.slice(0, -1).every((s) => /ON CONFLICT .* value \+ excluded\.value/.test(s.sql)), "totals only ever add");
  assert.strictEqual(res.headers["Access-Control-Allow-Origin"], "https://ne-tyr0.github.io");
  assert.deepStrictEqual(req.read, ["Origin"], "the only header read is Origin: never the caller's address");
});
test("anything else is refused before the database is touched", async (W) => {
  const cases = [
    [request("POST", report(), { Origin: "https://elsewhere.example" }), 403],
    [request("POST", report(), { Origin: undefined }), 403],
    [request("GET", report()), 405],
    [request("POST", report(), {}, "https://totals.example/other"), 404],
    [request("POST", "{not json"), 400],
    [request("POST", report({ id: "x" })), 400],
    [request("POST", "x".repeat(40000)), 413]
  ];
  for (const [req, status] of cases) {
    const env = { DB: fakeDB() };
    const res = await W.handle(req, env, NOW);
    assert.strictEqual(res.status, status, req.method + " " + req.url);
    assert.strictEqual(env.DB.batches, 0);
  }
});
test("a preflight is answered for the app's address only", async (W) => {
  assert.strictEqual((await W.handle(request("OPTIONS", ""), { DB: fakeDB() }, NOW)).status, 204);
  const other = await W.handle(request("OPTIONS", "", { Origin: "https://elsewhere.example" }), { DB: fakeDB() }, NOW);
  assert.strictEqual(other.status, 403);
  assert.strictEqual(other.headers["Access-Control-Allow-Origin"], undefined);
});

/* Response is global in Node 18+, but its headers are a Headers object; read
   them through a plain object so the tests stay simple. */
const RealResponse = global.Response;
global.Response = function (body, init) {
  const r = new RealResponse(body, init);
  const h = {};
  if (init && init.headers) Object.assign(h, init.headers);
  return { status: r.status, headers: h };
};

(async () => {
  const W = await import(pathToFileURL(path.join(__dirname, "..", "server/worker.js")).href);
  for (const [name, fn] of results) {
    try { await fn(W); console.log("ok   " + name); }
    catch (e) { failed++; console.log("FAIL " + name + "\n       " + e.message.split("\n")[0]); }
  }
  console.log(failed ? `\n${failed} failed` : "\nok: the totals server takes only what it should");
  process.exit(failed ? 1 : 0);
})();
