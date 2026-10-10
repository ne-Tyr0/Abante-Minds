/* Mutation test for tests/engine.js: break the engine one way at a time and
   require the unit tests to fail. A test suite that passes against a broken
   engine proves nothing; this shows each rule is held by a test.

   Run:  node tests/mutation/engine.js        Exits 1 if any mutant survives. */
"use strict";
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const os = require("os");
// The repository under test (default: this checkout) and a scratch folder to
// break copies in (default: a fresh temp folder).
const REPO = process.argv[2] || path.join(__dirname, "..", "..");
const WORK = process.argv[3] || fs.mkdtempSync(path.join(os.tmpdir(), "am-mutants-"));
const SRC = fs.readFileSync(path.join(REPO, "app/content.js"), "utf8").split("\r\n").join("\n");

const M = [
  ["round loses the half", "return div(rfloor(add(mul(a, scale), Q(1, 2))), scale);", "return div(rfloor(mul(a, scale)), scale);"],
  ["literals go through floats", "return Q(parseInt(m[1] + frac, 10), Math.pow(10, frac.length));", "var f = parseFloat(text); return Number.isInteger(f) ? Q(f) : new Rat(f, 1);"],
  ["fmt shows repeating decimals", "if (p < 0) throw ContentError(a.n + \"/\" + a.d + \" is a repeating decimal; it cannot be shown as written\");", "if (p < 0) return String(a.n / a.d);"],
  ["peso drops the padding", "return PESO + (isInt(r) ? String(r.n) : decimalString(r, 2));", "return PESO + fmt(r);"],
  ["no overflow guard", "if (!Number.isSafeInteger(x)) throw ContentError(\"a number grew too large to keep exact\");", ""],
  ["% on fractions", "case \"%\": int(l); int(r);", "case \"%\":"],
  ["no short-circuit", "if (ast.op === \"&&\") return bool(evaluate(ast.a, scope)) && bool(evaluate(ast.b, scope));", "if (ast.op === \"&&\") { var L = bool(evaluate(ast.a, scope)), R = bool(evaluate(ast.b, scope)); return L && R; }"],
  ["names reach the prototype", "if (!Object.prototype.hasOwnProperty.call(scope, ast.name)) throw ContentError(\"unknown name '\" + ast.name + \"'\");", "if (scope[ast.name] === undefined) throw ContentError(\"unknown name '\" + ast.name + \"'\");"],
  ["functions table has a prototype", "var FUNCS = Object.create(null);", "var FUNCS = {};"],
  ["number compares equal to text", "if (lr !== rr || (!lr && typeof l !== typeof r)) throw ContentError(\"cannot compare a number with text\");", ""],
  ["typed '36.' not read", "if (s.charAt(s.length - 1) === \".\") s = s.slice(0, -1);", ""],
  ["tiers do not fall back", "for (var t = tier; t >= 1; t--) if (spec.tiers[String(t)]) return spec.tiers[String(t)];", "if (spec.tiers[String(tier)]) return spec.tiers[String(tier)];"],
  ["where ignored", "if (!(t.where || []).every(function (c) { return bool(evalExpr(c, scope)); })) return null;", ""],
  ["maxDecimals ignored", "return p >= 0 && p <= (spec.maxDecimals === undefined ? 4 : spec.maxDecimals);", "return p >= 0;"],
  ["choice collisions allowed", "for (var b = a + 1; b < vals.length; b++) if (eq(vals[a], vals[b])) return false;", ""],
  ["choices not sorted", "values.sort(cmp);", ""],
  ["ambiguous mistakes still named", "return distractors.filter(function (o) { return eq(o.exact, d.exact); }).length === 1;", "return true;"],
  ["pinned item needs the random stream", ": r && t.formats.length > 1 ? t.formats", ": t.formats.length > 1 ? t.formats"],
  ["diagnose never names a mistake", "return match\n      ? { correct: false, error: match.error, feedback: match.feedback }", "return false\n      ? { correct: false, error: match.error, feedback: match.feedback }"],
  ["use() accepts duplicate ids", "if (templates[t.id]) throw ContentError(\"template id used twice: \" + t.id);", ""],
  ["sessions repeat templates", "if (i === last && n > 1) i = (i + 1) % n;", ""],
  ["pinned items skipped", "        if (out.length < o.count && level.templates.indexOf(t) > -1)", "        if (false)"],
  ["seed not recorded", "return render(t, pack, built.scope, built.format, { tier: tier, seed: seed >>> 0, r: r });", "return render(t, pack, built.scope, built.format, { tier: tier, seed: null, r: r });"],
  ["pinned items from another level", "        if (out.length < o.count && level.templates.indexOf(t) > -1)", "        if (out.length < o.count)"],
  ["sessions draw from the whole topic", "out.push(decorate(generateFrom(level.templates[i], PACK, o.tier, qseed), topic, level, out.length));", "out.push(decorate(generateFrom(topic.templates[i], PACK, o.tier, qseed), topic, level, out.length));"],
  ["coming-soon topics practisable", "    if (!topic || !topic.ready) throw ContentError(\"no topic '\" + topicKey + \"' to practise\");", "    if (!topic) throw ContentError(\"no topic '\" + topicKey + \"' to practise\");"],
  ["lesson ignores the example's numbers", "    var q = instanceFrom(template(card.example.template), PACK, 1, card.example.params, card.example.format);", "    var q = instanceFrom(template(card.example.template), PACK, 1, {}, card.example.format);"],
  ["words keeps the hundreds", "    if (n >= 100) { out.push(ONES[Math.floor(n / 100)] + \" hundred\"); n %= 100; }", "    if (n >= 100) { out.push(ONES[Math.floor(n / 100)] + \" hundred\"); }"],
  ["fixed pads one place too many", "  FUNCS.fixed = function (x, dp) { return decimalString(num(x), toNumber(int(dp))); };", "  FUNCS.fixed = function (x, dp) { return decimalString(num(x), toNumber(int(dp)) + 1); };"],
  ["mixed order ignored", "      if (t.answer.order === \"mixed\") shuffle(", "      if (false) shuffle("],
  ["level competencies dropped", "        return { id: lv.id, title: lv.title, competencies: lv.competencies.slice(), hasLesson: lv.lesson.length > 0 };", "        return { id: lv.id, title: lv.title, competencies: [], hasLesson: lv.lesson.length > 0 };"],
  ["unsimplified fractions accepted", "    return gcdInt(entry.num, entry.den) > 1 ? \"not-lowest-terms\" : null;", "    return null;"],
  ["improper accepted as mixed", "      if (entry.form !== \"mixed\") return \"not-a-mixed-number\";", ""],
  ["oversized fraction part accepted", "      if (entry.num >= entry.den) return \"fraction-part-not-proper\";", ""],
  ["fraction mistakes held to keypad rules", "    if (kind === \"number\") return validAnswer({ type: \"decimal\" }, x);", "    if (kind) return validAnswer({ type: \"decimal\" }, x);"],
  ["frac shows 4 as 4/1", "  function fracText(a) { return isInt(a) ? String(a.n) : a.n + \"/\" + a.d; }", "  function fracText(a) { return a.n + \"/\" + a.d; }"],
  ["mixed keeps the whole in the numerator", "    return whole + \" \" + (a.n - whole * a.d) + \"/\" + a.d;", "    return whole + \" \" + a.n + \"/\" + a.d;"],
  ["zero denominator read", "    if ((m = /^(\\d+)\\/(\\d+)$/.exec(s)) && +m[2] > 0)", "    if ((m = /^(\\d+)\\/(\\d+)$/.exec(s)))"],
  ["fraction answer may be whole", "    if (kind === \"fraction\") return !isInt(x) && x.n <= BOX_LIMIT && x.d <= BOX_LIMIT;", "    if (kind === \"fraction\") return x.n <= BOX_LIMIT && x.d <= BOX_LIMIT;"],
  ["percent loses its sign", "    if (spec.type === \"percent\") return \"%\";", "    if (spec.type === \"percent\") return \"\";"],
  ["mixed answer written as a fraction", "    if (kind === \"mixed\") return mixedText(x);", "    if (kind === \"mixed\") return fracText(x);"],
  ["choices held to keypad rules", "      if (!enterable(\"choice\", v)) return false;", "      if (!validAnswer({ type: \"decimal\" }, v)) return false;"],
  ["form mistakes get the generic fallback", "return { correct: false, error: wrongForm, feedback: q.formFeedback[wrongForm] || q.missExplain };", "return { correct: false, error: wrongForm, feedback: q.missExplain };"]
];

let caught = 0;
const missed = [];
fs.mkdirSync(path.join(WORK, "app"), { recursive: true });
fs.mkdirSync(path.join(WORK, "tests"), { recursive: true });
fs.copyFileSync(path.join(REPO, "tests/engine.js"), path.join(WORK, "tests/engine.js"));
for (const [name, from, to] of M) {
  const n = SRC.split(from).length - 1;
  if (n !== 1) { missed.push(name); console.log(`BAD   ${name}: pattern found ${n} times`); continue; }
  fs.writeFileSync(path.join(WORK, "app/content.js"), SRC.replace(from, to));
  const r = spawnSync(process.execPath, [path.join(WORK, "tests/engine.js")], { encoding: "utf8" });
  const fails = (r.stdout.match(/^FAIL .*/gm) || []).map((l) => l.slice(5));
  if (r.status === 1 && fails.length) { caught++; console.log(`ok    ${name}  <- ${fails.join("; ")}`); }
  else { missed.push(name); console.log(`MISS  ${name} (exit ${r.status})`); }
}
console.log(`\n${caught}/${M.length} engine mutants caught`);
process.exit(missed.length ? 1 : 0);
