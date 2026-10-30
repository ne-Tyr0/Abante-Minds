/* Abante Minds — the weekly totals server (Cloudflare Worker + D1).

   Counts only (LEGAL-RESEARCH.md, "Update, 26 October"). A phone that shares
   sends one report per finished week: the week, the app's build and plain
   totals (app/tally.js). This Worker checks the report against a strict
   shape, adds every number into running totals for that week, and keeps
   nothing else: no report, no row per phone, no IP address, no headers, no
   logs. The results are read through the views in views.sql, which hide any
   total built from fewer than five reports.

   Not deployed. server/README.md has the steps for when the owner approves. */

export const ALLOWED_ORIGIN = "https://ne-tyr0.github.io";
export const MAX_BYTES = 32768;     /* a full week of a busy learner is a few KB */
export const CAP = 5000;            /* the same cap the phone counts to */
export const MAX_ITEMS = 120;       /* levels, facts levels or topics in one report */

const MEASURES = {
  levels: ["answered", "right", "hints", "finished", "left"],
  facts: ["answered", "right", "quick"],
  review: ["right", "wrong"],
  examTopics: ["right", "asked"]
};
const INTERVALS = ["1", "3", "7"];
const FEATURES = ["streak-screen", "badge-card",
  "sound-on", "sound-off", "vibration-on", "vibration-off", "calm-on", "calm-off",
  "theme-auto", "theme-light", "theme-dark"];
const TOP = ["v", "week", "app", "levels", "review", "facts", "exams", "features", "errors"];
const LEVEL_KEY = /^[a-z0-9-]{1,40}\/[a-z0-9-]{1,40}$/;
const TOPIC_KEY = /^[a-z0-9-]{1,40}$/;
const ERROR_KEY = /^[a-z0-9-]{1,40}$/;

function isObject(x) { return x !== null && typeof x === "object" && !Array.isArray(x); }
function isCount(n) { return Number.isInteger(n) && n >= 0 && n <= CAP; }

/* The ISO week number of a date, as the phone writes it: 2026-W44. */
export function isoWeek(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
  return t.getUTCFullYear() + "-W" + (week < 10 ? "0" : "") + week;
}
/* Weeks a report may name: finished ones up to eight weeks back. The phone's
   own week (not finished) and the future are refused. */
export function acceptableWeeks(now) {
  const out = [];
  for (let i = 1; i <= 8; i++) out.push(isoWeek(new Date(now.getTime() - i * 7 * 86400000)));
  return out;
}

/* A report in the one shape the phone sends, or the reason it is refused.
   Every key is known, every number a whole count within the cap. */
export function validate(body, now) {
  if (!isObject(body)) return { ok: false, why: "not an object" };
  for (const k of Object.keys(body)) if (!TOP.includes(k)) return { ok: false, why: "unknown field " + k };
  if (body.v !== 1) return { ok: false, why: "unknown version" };
  if (typeof body.week !== "string" || !acceptableWeeks(now || new Date()).includes(body.week)) return { ok: false, why: "week out of range" };
  if (typeof body.app !== "string" || !/^[0-9]{1,6}$/.test(body.app)) return { ok: false, why: "bad app build" };
  const groups = [["levels", LEVEL_KEY, MEASURES.levels], ["facts", LEVEL_KEY, MEASURES.facts]];
  for (const [name, keyRe, measures] of groups) {
    const g = body[name];
    if (!isObject(g) || Object.keys(g).length > MAX_ITEMS) return { ok: false, why: "bad " + name };
    for (const [k, row] of Object.entries(g)) {
      if (!keyRe.test(k) || !isObject(row)) return { ok: false, why: "bad " + name + " key" };
      for (const [m, n] of Object.entries(row)) if (!measures.includes(m) || !isCount(n)) return { ok: false, why: "bad " + name + " count" };
    }
  }
  if (!isObject(body.review)) return { ok: false, why: "bad review" };
  for (const [k, row] of Object.entries(body.review)) {
    if (!INTERVALS.includes(k) || !isObject(row)) return { ok: false, why: "bad review key" };
    for (const [m, n] of Object.entries(row)) if (!MEASURES.review.includes(m) || !isCount(n)) return { ok: false, why: "bad review count" };
  }
  const ex = body.exams;
  if (!isObject(ex) || !isCount(ex.taken) || !isObject(ex.topics)) return { ok: false, why: "bad exams" };
  for (const k of Object.keys(ex)) if (k !== "taken" && k !== "topics") return { ok: false, why: "unknown field exams." + k };
  if (Object.keys(ex.topics).length > MAX_ITEMS) return { ok: false, why: "too many exam topics" };
  for (const [k, row] of Object.entries(ex.topics)) {
    if (!TOPIC_KEY.test(k) || !isObject(row)) return { ok: false, why: "bad exam topic" };
    for (const [m, n] of Object.entries(row)) if (!MEASURES.examTopics.includes(m) || !isCount(n)) return { ok: false, why: "bad exam count" };
  }
  if (!isObject(body.features)) return { ok: false, why: "bad features" };
  for (const [k, n] of Object.entries(body.features)) if (!FEATURES.includes(k) || !isCount(n)) return { ok: false, why: "bad feature" };
  if (!isObject(body.errors) || Object.keys(body.errors).length > 30) return { ok: false, why: "bad errors" };
  for (const [k, n] of Object.entries(body.errors)) if (!ERROR_KEY.test(k) || !isCount(n)) return { ok: false, why: "bad error" };
  return { ok: true };
}

/* The totals a valid report adds, as [scope, item, measure, value]. Each
   item also adds one to its "reports" measure, so a view can hide any item
   too few phones reported. */
export function rows(body) {
  const out = [];
  const group = (scope, obj) => {
    for (const [item, row] of Object.entries(obj)) {
      out.push([scope, item, "reports", 1]);
      for (const [m, n] of Object.entries(row)) if (n > 0) out.push([scope, item, m, n]);
    }
  };
  group("level", body.levels);
  group("facts", body.facts);
  group("review", body.review);
  group("exam-topic", body.exams.topics);
  if (body.exams.taken > 0) out.push(["exam", "all", "taken", body.exams.taken]);
  for (const [k, n] of Object.entries(body.features)) if (n > 0) out.push(["feature", k, "count", n]);
  for (const [k, n] of Object.entries(body.errors)) if (n > 0) out.push(["error", k, "count", n]);
  return out;
}

const ADD = "INSERT INTO totals (week, app, scope, item, measure, value) VALUES (?1, ?2, ?3, ?4, ?5, ?6) " +
  "ON CONFLICT (week, app, scope, item, measure) DO UPDATE SET value = value + excluded.value";
const COUNT = "INSERT INTO reports (week, app, n) VALUES (?1, ?2, 1) ON CONFLICT (week, app) DO UPDATE SET n = n + 1";

function corsHeaders(origin) {
  return origin === ALLOWED_ORIGIN
    ? { "Access-Control-Allow-Origin": ALLOWED_ORIGIN, "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400", "Vary": "Origin" }
    : { "Vary": "Origin" };
}

export async function handle(request, env, now) {
  const origin = request.headers.get("Origin");
  const headers = corsHeaders(origin);
  const path = new URL(request.url).pathname;
  if (path !== "/v1/tally") return new Response("Not found", { status: 404, headers });
  if (request.method === "OPTIONS") return new Response(null, { status: origin === ALLOWED_ORIGIN ? 204 : 403, headers });
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers });
  if (origin !== ALLOWED_ORIGIN) return new Response("Forbidden", { status: 403, headers });
  const text = await request.text();
  if (text.length > MAX_BYTES) return new Response("Too large", { status: 413, headers });
  let body;
  try { body = JSON.parse(text); } catch (e) { return new Response("Not JSON", { status: 400, headers }); }
  const checked = validate(body, now || new Date());
  if (!checked.ok) return new Response("Refused: " + checked.why, { status: 400, headers });
  const statements = rows(body).map(([scope, item, measure, value]) => env.DB.prepare(ADD).bind(body.week, body.app, scope, item, measure, value));
  statements.push(env.DB.prepare(COUNT).bind(body.week, body.app));
  await env.DB.batch(statements);
  return new Response(null, { status: 204, headers });
}

export default { fetch: (request, env) => handle(request, env) };
