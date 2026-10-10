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
  ["level competencies dropped", "          id: lv.id, title: lv.title, kind: lv.kind, competencies: lv.competencies.slice(),", "          id: lv.id, title: lv.title, kind: lv.kind, competencies: [],"],
  ["a template with no competency adds one", "            if (t.competency && lv.competencies.indexOf(t.competency) < 0) lv.competencies.push(t.competency);", "            if (lv.competencies.indexOf(t.competency) < 0) lv.competencies.push(t.competency);"],
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
  ["form mistakes get the generic fallback", "return { correct: false, error: wrongForm, feedback: q.formFeedback[wrongForm] || q.missExplain };", "return { correct: false, error: wrongForm, feedback: q.missExplain };"],
  ["pow off by one", "    for (var i = 0; i < e.n; i++) r = mul(r, b);", "    for (var i = 1; i < e.n; i++) r = mul(r, b);"],
  ["sup prints plain digits", "    return String(x.n).split(\"\").map(function (d) { return SUPERSCRIPT.charAt(+d); }).join(\"\");", "    return String(x.n);"],
  ["pow without a limit", "    if (e.n < 0 || e.n > 20) throw ContentError(\"pow() takes a whole exponent from 0 to 20\");", ""],
  // Basics
  ["Basics land on the path", "      basics.push(install(meta, (basicsFiles || [])[i], \"basics\"));", "      list.push(install(meta, (basicsFiles || [])[i], \"basics\"));"],
  ["facts levels allowed on the path", "          if (kind !== \"practice\" && track !== \"basics\") throw ContentError(where + \": only a Basics level can be \" + kind);", ""],
  ["a review level asks nothing", "            lv.templates = topic.levels.filter(function (o) { return o.kind === \"facts\"; })", "            lv.templates = topic.levels.filter(function (o) { return false; })"],
  ["a fact listed twice", "        if (keys.indexOf(f.key) < 0) keys.push(f.key);", "        keys.push(f.key);"],
  ["facts ignore where", "        if (!(t.where || []).every(function (c) { return bool(evalExpr(c, scope)); })) return;\n        var answer = evalExpr(t.answer.value, scope);", "        var answer = evalExpr(t.answer.value, scope);"],
  ["facts with answers no one can give", "        if (!validAnswer(t.answer, answer)) return;\n        if (t.answer.type === \"choice\") {", "        if (t.answer.type === \"choice\") {"],
  ["a computed value enters the key", "        walk(i + 1, s, drawn);", "        walk(i + 1, s, drawn.concat(name));"],
  ["a key without its template", "          key: t.id + \":\" + drawn.map(", "          key: drawn.map("],
  ["tiers in a fact", "    if (!spec.range) throw ContentError(t.id + \": a fact's '\" + name + \"' must be a choose or a range, not tiers\");", "    if (!spec.range) return [];"],
  ["any fact in any level", "    if (found.level.kind === \"practice\" || factsOf(found.level).indexOf(key) < 0)\n      throw ContentError(\"level '\" + topicKey + \"/\" + levelId + \"' has no fact '\" + key + \"'\");", "    factsOf(found.level);"],
  ["one format for every seed", "    var format = t.formats[Math.floor(rng(seed)() * t.formats.length)];", "    var format = t.formats[0];"],
  ["the grid fills one side", "        cells[f.params.y + \",\" + f.params.x] = k;", ""],
  ["every template on the grid", "        if (!template(f.template).grid) return;", ""],
  // charts
  ["pick counts from 0", "    return arguments[i.n];", "    return arguments[i.n + 1];"],
  ["pick past the end", "    if (i.n < 1 || i.n >= arguments.length) throw ContentError(\"pick() has no item \" + i.n);", ""],
  ["every question gets a chart", "    if (t.chart) q.chart = renderChart(t.chart, scope);", "    q.chart = t.chart ? renderChart(t.chart, scope) : null;"],
  ["chart top not rounded up", "      var top = mul(FUNCS.max(Q(1), rceil(div(high, step))), step);", "      var top = high;"],
  ["chart gridlines stop short", "cmp(v, top) <= 0; v = add(v, step)) c.ticks.push", "cmp(v, top) < 0; v = add(v, step)) c.ticks.push"],
  ["a chart step of 0 allowed", "      if (step.n <= 0) throw ContentError(\"a chart's step must be more than 0\");", ""],
  ["chart labels ignore the template's", "    return interpolate(spec.label || \"{fmt(value)}\", ls);", "    return interpolate(\"{fmt(value)}\", ls);"],
  ["hidden slice shown", "          hidden: s.hidden === undefined ? false : bool(evalExpr(s.hidden, scope))", "          hidden: false"],
  ["hidden slice read out", "        return s.name + \" \" + (s.hidden ? \"not labelled\" : s.label);", "        return s.name + \" \" + s.label;"],
  ["two series not called double", "(c.series.length > 1 && c.kind !== \"table\" ? \"double \" : \"\")", "\"\""],
  ["lesson drops the chart", "chart: q.chart || null,", "chart: null,"],
  ["degree sign spaced", "(spec.unit === \"°\" ? \"\" : \" \") + spec.unit", "\" \" + spec.unit"],
  ["pinned items lose their place", "          q.pinnedAt = at;\n", ""],
  // figures
  ["overlapping shapes allowed", "      if (used > 360) throw ContentError(\"the shapes round the point overlap: \" + used + \"°\");\n", ""],
  ["any number of sides drawn", "        if (!SHAPE_NAMES[sides]) throw ContentError(\"a tiling picture cannot show a regular shape of \" + sides + \" sides\");\n", ""],
  ["one shape named as many", "count === 1 ? SHAPE_NAMES[sides][0] : count + \" \" + SHAPE_NAMES[sides][1]", "count + \" \" + SHAPE_NAMES[sides][1]"],
  ["a full point said to have a gap", "(c.gap ? \"with a gap left\" : \"with no gap\")", "\"with a gap left\""],
  ["clock hand past 12", "whole(spec.hand, scope, 1, 12, \"a clock hand\")", "whole(spec.hand, scope, 1, 13, \"a clock hand\")"],
  ["mirror side unchecked", "      if (c.side !== \"left\" && c.side !== \"right\") throw ContentError(\"a point is to the left or the right of the mirror line\");\n", ""],
  ["1 squares", "(c.distance === 1 ? \"\" : \"s\")", "\"s\""],
  // clock times
  ["noon called 12:00 p.m.", "    if (n === 720) return \"12:00 noon\";\n", ""],
  ["midnight called 12:00 a.m.", "    if (n === 0) return \"12:00 midnight\";\n", ""],
  ["clock12 shows 0 for 12", "(h % 12 === 0 ? 12 : h % 12)", "(h % 12)"],
  ["clock drops the leading zero", "    return (h < 10 ? \"0\" : \"\") + h + \":\"", "    return h + \":\""],
  ["hm says 1 hours", "(h === 1 ? \" hour\" : \" hours\")", "\" hours\""],
  ["clock past midnight", "    if (t.n < 0 || t.n >= DAY) throw", "    if (t.n < 0) throw"],
  ["hour 24 read", "if (!m || +m[1] > 23 || +m[2] > 59) return null;", "if (!m || +m[1] > 24 || +m[2] > 59) return null;"],
  ["60 minutes read", "if (!m || +m[1] > 23 || +m[2] > 59) return null;", "if (!m || +m[1] > 23 || +m[2] > 60) return null;"],
  ["time typed read as a number", "value = q.entry === \"time\" ? readTime(given) : readTyped(given);", "value = readTyped(given);"],
  ["time answer written as a number", "    if (kind === \"time\") return clockText(x);\n", ""],
  ["time answers past midnight", "    if (spec.type === \"integer\") return isInt(x);\n    if (kind === \"time\") return isInt(x) && x.n < DAY;", "    if (spec.type === \"integer\") return isInt(x);\n    if (kind === \"time\") return isInt(x);"]
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
