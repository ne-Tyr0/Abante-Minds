/* Abante Minds — the question engine.

   Questions live in content packs, content/packs/<subtest>/, as data rather than
   code. A template is one question type: the numbers it draws, the constraints
   between them, the answer as an expression, one or more formats for presenting
   the same problem, three hints, three worked steps, and the wrong answers it
   expects, each tagged with the specific mistake it represents. Every question
   is that type in a randomly chosen format with freshly drawn numbers, so there
   is no fixed bank of answers to memorise.

   Expressions are read by the small parser below, never by eval, and evaluated
   in exact rational arithmetic: a fraction or a four-decimal answer cannot be
   checked reliably in floating point.

   Generation is deterministic. (template id, tier, seed) always yields the same
   question, so an attempt log can carry those three values instead of the
   question text and still reproduce exactly what a learner saw. */
(function () {
  "use strict";

  var AM = (window.AM = window.AM || {});
  var PESO = "₱";
  var MAX_TRIES = 500;
  var INPUTTABLE = { integer: true, decimal: true, choice: true };

  function ContentError(message) {
    var e = new Error(message);
    e.name = "ContentError";
    return e;
  }

  /* ---------- exact rationals ---------- */

  function Rat(n, d) { this.n = n; this.d = d; }

  function gcdInt(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = a % b; a = b; b = t; }
    return a;
  }
  function safe(x) {
    if (!Number.isSafeInteger(x)) throw ContentError("a number grew too large to keep exact");
    return x;
  }
  function Q(n, d) {
    if (d === undefined) d = 1;
    safe(n); safe(d);
    if (d === 0) throw ContentError("division by zero");
    if (d < 0) { n = -n; d = -d; }
    var g = gcdInt(n, d) || 1;
    return new Rat(n / g, d / g);
  }
  function isRat(v) { return v instanceof Rat; }
  function toRat(v) {
    if (isRat(v)) return v;
    if (v && typeof v === "object" && Number.isInteger(v.n) && Number.isInteger(v.d)) return Q(v.n, v.d);
    throw ContentError("not a number: " + JSON.stringify(v));
  }
  function add(a, b) { return Q(safe(a.n * b.d) + safe(b.n * a.d), safe(a.d * b.d)); }
  function sub(a, b) { return Q(safe(a.n * b.d) - safe(b.n * a.d), safe(a.d * b.d)); }
  function mul(a, b) { return Q(safe(a.n * b.n), safe(a.d * b.d)); }
  function div(a, b) {
    if (b.n === 0) throw ContentError("division by zero");
    return Q(safe(a.n * b.d), safe(a.d * b.n));
  }
  function cmp(a, b) { var x = safe(a.n * b.d) - safe(b.n * a.d); return x < 0 ? -1 : x > 0 ? 1 : 0; }
  function eq(a, b) { return a.n === b.n && a.d === b.d; }
  function floorInt(n, d) { return (n - (((n % d) + d) % d)) / d; }
  function rfloor(a) { return Q(floorInt(a.n, a.d)); }
  function rceil(a) { return Q(-floorInt(-a.n, a.d)); }
  /* Half rounds up, exactly like Math.round, so ported templates agree. */
  function rround(a, dp) {
    var scale = Q(Math.pow(10, dp || 0));
    return div(rfloor(add(mul(a, scale), Q(1, 2))), scale);
  }
  function toNumber(a) { return a.n / a.d; }
  function isInt(a) { return a.d === 1; }

  /* "1.12" -> 28/25. Literals stay exact; 0.1 + 0.2 is 3/10. */
  function fromLiteral(text) {
    var m = /^(\d+)(?:\.(\d+))?$/.exec(text);
    if (!m) throw ContentError("not a number literal: " + text);
    var frac = m[2] || "";
    return Q(parseInt(m[1] + frac, 10), Math.pow(10, frac.length));
  }
  function fromJSON(x) {
    if (typeof x === "string") return x;
    if (typeof x !== "number" || !isFinite(x) || x < 0) throw ContentError("unsupported number in a pack: " + x);
    return Number.isInteger(x) ? Q(x) : fromLiteral(String(x));
  }

  /* Decimal places of a terminating rational, or -1 if it never terminates. */
  function decimalPlaces(a) {
    var d = a.d, twos = 0, fives = 0;
    while (d % 2 === 0) { d /= 2; twos++; }
    while (d % 5 === 0) { d /= 5; fives++; }
    return d === 1 ? Math.max(twos, fives) : -1;
  }
  function decimalString(a, places) {
    var scaled = mul(a, Q(Math.pow(10, places)));
    if (!isInt(scaled)) throw ContentError("cannot show " + a.n + "/" + a.d + " in " + places + " places");
    var digits = String(Math.abs(scaled.n));
    while (digits.length <= places) digits = "0" + digits;
    var cut = digits.length - places;
    var s = places ? digits.slice(0, cut) + "." + digits.slice(cut) : digits;
    return (scaled.n < 0 ? "-" : "") + s;
  }
  /* How a number reads in prose: 24, 2.5, 0.32. A repeating decimal has no
     honest short form, so it is an authoring error rather than "0.3333333". */
  function fmt(a) {
    var p = decimalPlaces(a);
    if (p < 0) throw ContentError(a.n + "/" + a.d + " is a repeating decimal; it cannot be shown as written");
    return decimalString(a, p);
  }
  /* Money: whole pesos as they are, anything else to two places. */
  function peso(a) {
    var r = rround(a, 2);
    return PESO + (isInt(r) ? String(r.n) : decimalString(r, 2));
  }

  /* ---------- expressions ----------
     Arithmetic, comparisons, && || !, a ? b : c, numbers, 'strings', names
     bound by the template, and a fixed list of functions. There is no member
     access and no way to reach anything outside the template's own values. */

  var FUNCS = Object.create(null);
  FUNCS.floor = function (x) { return rfloor(num(x)); };
  FUNCS.ceil = function (x) { return rceil(num(x)); };
  FUNCS.round = function (x, dp) { return rround(num(x), dp === undefined ? 0 : toNumber(int(dp))); };
  FUNCS.abs = function (x) { x = num(x); return x.n < 0 ? Q(-x.n, x.d) : x; };
  FUNCS.min = function () { return [].slice.call(arguments).map(num).reduce(function (a, b) { return cmp(a, b) <= 0 ? a : b; }); };
  FUNCS.max = function () { return [].slice.call(arguments).map(num).reduce(function (a, b) { return cmp(a, b) >= 0 ? a : b; }); };
  FUNCS.gcd = function (a, b) { return Q(gcdInt(int(a).n, int(b).n)); };
  FUNCS.lcm = function (a, b) { a = int(a).n; b = int(b).n; return Q(safe(Math.abs(a * b) / (gcdInt(a, b) || 1))); };
  FUNCS.peso = function (x) { return peso(num(x)); };
  FUNCS.fmt = function (x) { return fmt(num(x)); };

  var RESERVED = { "true": true, "false": true, answer: true, value: true };
  Object.keys(FUNCS).forEach(function (k) { RESERVED[k] = true; });

  function num(v) { if (!isRat(v)) throw ContentError("expected a number, got " + typeof v); return v; }
  function int(v) { num(v); if (!isInt(v)) throw ContentError("expected a whole number"); return v; }
  function bool(v) { if (typeof v !== "boolean") throw ContentError("expected true or false"); return v; }

  function tokenize(src) {
    var re = /\s*(?:(\d+(?:\.\d+)?)|'([^']*)'|([A-Za-z_][A-Za-z0-9_]*)|(==|!=|<=|>=|&&|\|\||[-+*\/%<>!?:(),]))/y;
    var out = [], pos = 0, m;
    while (pos < src.length) {
      if (/^\s*$/.test(src.slice(pos))) break;
      re.lastIndex = pos;
      m = re.exec(src);
      if (!m) throw ContentError("cannot read expression at '" + src.slice(pos) + "' in: " + src);
      pos = re.lastIndex;
      if (m[1] !== undefined) out.push({ t: "num", v: fromLiteral(m[1]) });
      else if (m[2] !== undefined) out.push({ t: "str", v: m[2] });
      else if (m[3] !== undefined) out.push({ t: "id", v: m[3] });
      else out.push({ t: "op", v: m[4] });
    }
    return out;
  }

  var AST_CACHE = Object.create(null);

  function parse(src) {
    if (typeof src === "number") src = String(src);
    if (typeof src !== "string") throw ContentError("expression must be text: " + JSON.stringify(src));
    if (AST_CACHE[src]) return AST_CACHE[src];
    var toks = tokenize(src), i = 0;
    function peek(v) { var t = toks[i]; return t && t.t === "op" && t.v === v; }
    function take(v) { if (!peek(v)) throw ContentError("expected '" + v + "' in: " + src); i++; }
    function ternary() {
      var c = or();
      if (peek("?")) { i++; var a = ternary(); take(":"); return { k: "cond", c: c, a: a, b: ternary() }; }
      return c;
    }
    function or() { var a = and(); while (peek("||")) { i++; a = { k: "bin", op: "||", a: a, b: and() }; } return a; }
    function and() { var a = compare(); while (peek("&&")) { i++; a = { k: "bin", op: "&&", a: a, b: compare() }; } return a; }
    function compare() {
      var a = additive();
      var t = toks[i];
      if (t && t.t === "op" && /^(==|!=|<=|>=|<|>)$/.test(t.v)) { i++; return { k: "bin", op: t.v, a: a, b: additive() }; }
      return a;
    }
    function additive() {
      var a = multiplicative();
      while (peek("+") || peek("-")) { var op = toks[i++].v; a = { k: "bin", op: op, a: a, b: multiplicative() }; }
      return a;
    }
    function multiplicative() {
      var a = unary();
      while (peek("*") || peek("/") || peek("%")) { var op = toks[i++].v; a = { k: "bin", op: op, a: a, b: unary() }; }
      return a;
    }
    function unary() {
      if (peek("-")) { i++; return { k: "neg", a: unary() }; }
      if (peek("!")) { i++; return { k: "not", a: unary() }; }
      return primary();
    }
    function primary() {
      var t = toks[i++];
      if (!t) throw ContentError("expression ends too soon: " + src);
      if (t.t === "num") return { k: "num", v: t.v };
      if (t.t === "str") return { k: "str", v: t.v };
      if (t.t === "id") {
        if (peek("(")) {
          i++;
          var args = [];
          if (!peek(")")) { args.push(ternary()); while (peek(",")) { i++; args.push(ternary()); } }
          take(")");
          if (!FUNCS[t.v]) throw ContentError("unknown function '" + t.v + "' in: " + src);
          return { k: "call", name: t.v, args: args };
        }
        if (t.v === "true" || t.v === "false") return { k: "bool", v: t.v === "true" };
        return { k: "id", name: t.v };
      }
      if (t.t === "op" && t.v === "(") { var e = ternary(); take(")"); return e; }
      throw ContentError("unexpected '" + t.v + "' in: " + src);
    }
    var ast = ternary();
    if (i !== toks.length) throw ContentError("unexpected '" + toks[i].v + "' in: " + src);
    AST_CACHE[src] = ast;
    return ast;
  }

  /* Every name an expression refers to, so the validator can check them all,
     including ones on a branch no sampled seed happened to take. */
  function names(ast, out) {
    out = out || [];
    if (ast.k === "id") out.push(ast.name);
    ["a", "b", "c"].forEach(function (k) { if (ast[k]) names(ast[k], out); });
    (ast.args || []).forEach(function (x) { names(x, out); });
    return out;
  }

  function evaluate(ast, scope) {
    switch (ast.k) {
      case "num": case "str": case "bool": return ast.v;
      case "id":
        if (!Object.prototype.hasOwnProperty.call(scope, ast.name)) throw ContentError("unknown name '" + ast.name + "'");
        return scope[ast.name];
      case "neg": var x = num(evaluate(ast.a, scope)); return Q(-x.n, x.d);
      case "not": return !bool(evaluate(ast.a, scope));
      case "cond": return bool(evaluate(ast.c, scope)) ? evaluate(ast.a, scope) : evaluate(ast.b, scope);
      case "call": return FUNCS[ast.name].apply(null, ast.args.map(function (a) { return evaluate(a, scope); }));
      case "bin":
        if (ast.op === "&&") return bool(evaluate(ast.a, scope)) && bool(evaluate(ast.b, scope));
        if (ast.op === "||") return bool(evaluate(ast.a, scope)) || bool(evaluate(ast.b, scope));
        var l = evaluate(ast.a, scope), r = evaluate(ast.b, scope);
        if (ast.op === "==" || ast.op === "!=") {
          var lr = isRat(l), rr = isRat(r);
          if (lr !== rr || (!lr && typeof l !== typeof r)) throw ContentError("cannot compare a number with text");
          var same = lr ? eq(l, r) : l === r;
          return ast.op === "==" ? same : !same;
        }
        num(l); num(r);
        switch (ast.op) {
          case "+": return add(l, r);
          case "-": return sub(l, r);
          case "*": return mul(l, r);
          case "/": return div(l, r);
          case "%": int(l); int(r); if (r.n === 0) throw ContentError("division by zero"); return Q(l.n % r.n);
          case "<": return cmp(l, r) < 0;
          case "<=": return cmp(l, r) <= 0;
          case ">": return cmp(l, r) > 0;
          case ">=": return cmp(l, r) >= 0;
        }
    }
    throw ContentError("cannot evaluate " + ast.k);
  }

  function evalExpr(src, scope) { return evaluate(parse(src), scope); }

  var SLOT = /\{([^{}]+)\}/g;
  function interpolate(text, scope) {
    if (typeof text !== "string") throw ContentError("text expected, got " + JSON.stringify(text));
    var out = text.replace(SLOT, function (_, src) {
      var v = evalExpr(src, scope);
      if (isRat(v)) return fmt(v);
      if (typeof v === "string") return v;
      throw ContentError("{" + src + "} is true/false, which cannot be shown");
    });
    if (/[{}]/.test(out)) throw ContentError("unbalanced braces in: " + text);
    return out;
  }
  function slots(text) {
    var out = [], m;
    SLOT.lastIndex = 0;
    while ((m = SLOT.exec(text))) out.push(m[1]);
    return out;
  }

  /* ---------- randomness ----------
     mulberry32, unchanged from the original bank, so a ported template draws
     exactly the numbers it used to for the same seed. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- templates to questions ---------- */

  function tierRange(spec, tier) {
    if (spec.range) return spec.range;
    for (var t = tier; t >= 1; t--) if (spec.tiers[String(t)]) return spec.tiers[String(t)];
    throw ContentError("no range for tier " + tier);
  }
  function bound(x, scope) { return typeof x === "number" ? fromJSON(x) : num(evalExpr(x, scope)); }

  /* Parameters are drawn in the order they are declared, so a later bound can
     depend on an earlier value. */
  function drawParams(t, tier, r, fixed) {
    var scope = Object.create(null);
    Object.keys(t.params || {}).forEach(function (name) {
      var spec = t.params[name];
      if ("value" in spec) { scope[name] = evalExpr(spec.value, scope); return; }
      if (fixed) {
        if (!(name in fixed)) throw ContentError(t.id + ": pinned item does not set '" + name + "'");
        scope[name] = fromJSON(fixed[name]);
        return;
      }
      if ("choose" in spec) {
        scope[name] = fromJSON(spec.choose[Math.floor(r() * spec.choose.length)]);
        return;
      }
      var range = tierRange(spec, tier);
      var lo = bound(range[0], scope), hi = bound(range[1], scope);
      var step = spec.step === undefined ? Q(1) : fromJSON(spec.step);
      var span = div(sub(hi, lo), step);
      if (span.n < 0) throw ContentError(t.id + ": range for '" + name + "' is empty (" + fmt(lo) + " to " + fmt(hi) + ")");
      if (!isInt(span)) throw ContentError(t.id + ": range for '" + name + "' is not a whole number of steps");
      var k = Math.floor(r() * (toNumber(span) + 1));
      scope[name] = add(lo, mul(Q(k), step));
    });
    return scope;
  }

  function validAnswer(spec, x) {
    if (!isRat(x) || x.n < 0) return false;
    if (spec.type === "integer") return isInt(x);
    var p = decimalPlaces(x);
    return p >= 0 && p <= (spec.maxDecimals === undefined ? 4 : spec.maxDecimals);
  }

  function within(scope) {
    var s = Object.create(null);
    Object.keys(scope).forEach(function (k) { s[k] = scope[k]; });
    return s;
  }

  function render(t, pack, scope, format, meta) {
    var answer = scope.answer;
    /* A mistake whose value the keypad cannot express -- negative, repeating,
       too many places -- can never be matched from a typed answer, so it is
       left out of this question rather than rendered. Choice items have already
       been checked in choiceUsable. */
    var distractors = [];
    (t.distractors || []).forEach(function (d) {
      var ds = within(scope);
      ds.value = num(evalExpr(d.value, scope));
      if (!validAnswer({ type: "decimal" }, ds.value)) return;
      distractors.push({ error: d.error, exact: ds.value, value: toNumber(ds.value), feedback: interpolate(d.feedback, ds) });
    });
    /* Two mistakes that land on the same number cannot be told apart, so
       neither is named; a wrong answer there gets the honest fallback. One
       that lands on the right answer is not a mistake in this question. */
    distractors = distractors.filter(function (d) {
      if (eq(d.exact, answer)) return false;
      return distractors.filter(function (o) { return eq(o.exact, d.exact); }).length === 1;
    });
    var q = {
      templateId: t.id,
      tier: meta.tier,
      seed: meta.seed,
      pinned: !!meta.pinned,
      format: format.id,
      packVersion: pack.version,
      subtest: pack.subtest,
      competency: t.competency,
      domain: t.domain,
      schema: t.schema,
      answerType: t.answer.type,
      type: t.answer.type === "choice" ? "choice" : "compute",
      unit: t.answer.prefix || "",
      prompt: interpolate(format.prompt, scope),
      answer: toNumber(answer),
      answerExact: answer,
      hints: (format.hints || t.hints).map(function (h) { return interpolate(h, scope); }),
      steps: (format.steps || t.steps).map(function (h) { return interpolate(h, scope); }),
      explain: interpolate(format.explain || t.explain, scope),
      missExplain: interpolate(t.fallback || pack.fallbackFeedback, scope),
      distractors: distractors
    };
    if (q.type === "choice") {
      var values = [answer].concat(distractors.map(function (d) { return d.exact; }));
      values.sort(cmp);
      q.choiceValues = values;
      q.choices = values.map(function (v) {
        var ls = within(scope);
        ls.value = v;
        return interpolate(t.answer.label || "{fmt(value)}", ls);
      });
      q.answerIndex = values.findIndex(function (v) { return eq(v, answer); });
    }
    return q;
  }

  /* A choice item needs four different, sensible options, every one of them a
     named mistake. Rather than invent a filler option, draw again. */
  function choiceUsable(t, scope) {
    var vals = [scope.answer];
    for (var i = 0; i < (t.distractors || []).length; i++) {
      var v = evalExpr(t.distractors[i].value, scope);
      if (!validAnswer({ type: "decimal" }, v)) return false;
      vals.push(v);
    }
    for (var a = 0; a < vals.length; a++)
      for (var b = a + 1; b < vals.length; b++) if (eq(vals[a], vals[b])) return false;
    return true;
  }

  function build(t, pack, tier, r, fixed, formatId) {
    var scope = drawParams(t, tier, r, fixed);
    if (!(t.where || []).every(function (c) { return bool(evalExpr(c, scope)); })) return null;
    var answer = evalExpr(t.answer.value, scope);
    if (!validAnswer(t.answer, answer)) return null;
    scope.answer = answer;
    if (t.answer.type === "choice" && !choiceUsable(t, scope)) return null;
    /* A drawn question picks its format at random; a pinned one (no random
       stream) uses the format it names, or the first. */
    var format = formatId
      ? t.formats.filter(function (f) { return f.id === formatId; })[0]
      : r && t.formats.length > 1 ? t.formats[Math.floor(r() * t.formats.length)] : t.formats[0];
    if (!format) throw ContentError(t.id + ": no format '" + formatId + "'");
    return { scope: scope, format: format };
  }

  function generateFrom(t, pack, tier, seed) {
    var r = rng(seed);
    for (var n = 0; n < MAX_TRIES; n++) {
      var built = build(t, pack, tier, r);
      if (built) return render(t, pack, built.scope, built.format, { tier: tier, seed: seed >>> 0 });
    }
    throw ContentError(t.id + ": no usable question in " + MAX_TRIES + " draws at tier " + tier);
  }

  /* What the first draw for a seed did, and why it was turned down if it was.
     The validator reports how often each template rejects its own draws, and
     the migration check uses it to tell a deliberate redraw from a real
     difference. */
  function firstDrawFrom(t, tier, seed) {
    var scope = drawParams(t, tier, rng(seed));
    var params = {};
    Object.keys(scope).forEach(function (k) { params[k] = isRat(scope[k]) ? toNumber(scope[k]) : scope[k]; });
    if (!(t.where || []).every(function (c) { return bool(evalExpr(c, scope)); })) return { accepted: false, reason: "where", params: params };
    var answer = evalExpr(t.answer.value, scope);
    if (!validAnswer(t.answer, answer)) return { accepted: false, reason: "answer", params: params };
    scope.answer = answer;
    if (t.answer.type === "choice" && !choiceUsable(t, scope)) return { accepted: false, reason: "choice", params: params };
    return { accepted: true, reason: null, params: params };
  }

  function instanceFrom(t, pack, tier, params, formatId) {
    var built = build(t, pack, tier, null, params, formatId);
    if (!built) throw ContentError(t.id + ": pinned values break a constraint or give an unusable answer");
    return render(t, pack, built.scope, built.format, { tier: tier, seed: null, pinned: true });
  }

  /* ---------- packs ---------- */

  var PACK = null;
  var TOPIC_BY_KEY = Object.create(null);
  var TEMPLATE_BY_ID = Object.create(null);

  /* Installs a pack: a manifest plus one file per topic. The full schema check
     runs in CI (tests/validate-packs.js); this only refuses a pack that could
     not work at all, so a broken deploy fails loudly instead of quietly. */
  function use(manifest, topicFiles) {
    if (!manifest || !Array.isArray(manifest.topics)) throw ContentError("manifest has no topics");
    var topics = Object.create(null), templates = Object.create(null), list = [];
    manifest.topics.forEach(function (meta, i) {
      var file = topicFiles[i];
      if (!file || file.topic !== meta.key) throw ContentError("topic file for '" + meta.key + "' is missing or mislabelled");
      if (!file.templates || !file.templates.length) throw ContentError("topic '" + meta.key + "' has no templates");
      file.templates.forEach(function (t) {
        if (templates[t.id]) throw ContentError("template id used twice: " + t.id);
        templates[t.id] = t;
      });
      var topic = {
        key: meta.key, label: meta.label, icon: meta.icon, colorKey: meta.colorKey,
        templates: file.templates, pinned: file.pinned || []
      };
      topics[meta.key] = topic;
      list.push(topic);
    });
    PACK = { subtest: manifest.subtest, version: manifest.version, fallbackFeedback: manifest.fallbackFeedback };
    TOPIC_BY_KEY = topics;
    TEMPLATE_BY_ID = templates;
    AM.content.TOPICS = list.map(function (t) { return { key: t.key, label: t.label, icon: t.icon, colorKey: t.colorKey }; });
    AM.content.packVersion = PACK.version;
    AM.content.subtest = PACK.subtest;
    return AM.content.TOPICS;
  }

  function load(base) {
    base = base || "content/packs/math/";
    function json(url) {
      return fetch(url).then(function (r) {
        if (!r.ok) throw ContentError("could not load " + url + " (" + r.status + ")");
        return r.json();
      });
    }
    return json(base + "manifest.json").then(function (manifest) {
      return Promise.all(manifest.topics.map(function (t) { return json(base + t.file); }))
        .then(function (files) { return use(manifest, files); });
    });
  }

  function template(id) {
    var t = TEMPLATE_BY_ID[id];
    if (!t) throw ContentError("no template '" + id + "'");
    return t;
  }

  function decorate(q, topic, index) {
    q.id = topic.key + "-" + index;
    q.topicKey = topic.key;
    q.topicLabel = topic.label;
    q.topicIcon = topic.icon;
    q.colorKey = topic.colorKey;
    return q;
  }

  /* One session: pinned items first, then `count` drawn questions, never the
     same template twice running. Each question gets its own seed from the
     session's stream, so any one of them can be regenerated on its own. */
  function buildSession(topicKey, count, tier, seed) {
    if (!PACK) throw ContentError("no content pack installed yet");
    var topic = TOPIC_BY_KEY[topicKey] || TOPIC_BY_KEY[AM.content.TOPICS[0].key];
    var r = rng(seed === undefined ? Date.now() : seed);
    var out = [];
    topic.pinned.forEach(function (p) {
      if (out.length < count) out.push(decorate(instanceFrom(template(p.template), PACK, tier, p.params, p.format), topic, out.length));
    });
    var last = -1, n = topic.templates.length;
    while (out.length < count) {
      var i = Math.floor(r() * n);
      if (i === last && n > 1) i = (i + 1) % n;
      last = i;
      var qseed = Math.floor(r() * 4294967296) >>> 0;
      out.push(decorate(generateFrom(topic.templates[i], PACK, tier, qseed), topic, out.length));
    }
    return out;
  }

  /* ---------- answers ----------
     A typed answer is read exactly: "36", "36.0" and "36." are the same, and
     anything the keypad cannot produce is ignored. A wrong answer that matches
     an expected mistake gets that mistake's explanation; any other wrong answer
     gets the honest fallback, never a guess about what the learner did. */
  function readTyped(given) {
    var s = String(given === undefined || given === null ? "" : given).replace(/[^0-9.]/g, "");
    if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return null;
    if (s.charAt(0) === ".") s = "0" + s;
    if (s.charAt(s.length - 1) === ".") s = s.slice(0, -1);
    return fromLiteral(s);
  }

  function diagnose(q, given) {
    var exact = toRat(q.answerExact);
    var value;
    if (q.type === "choice") {
      if (given === q.answerIndex) return { correct: true, error: null, feedback: null };
      value = q.choiceValues && q.choiceValues[given] ? toRat(q.choiceValues[given]) : null;
    } else {
      value = readTyped(given);
      if (value && eq(value, exact)) return { correct: true, error: null, feedback: null };
    }
    var match = value && (q.distractors || []).filter(function (d) { return eq(toRat(d.exact), value); })[0];
    return match
      ? { correct: false, error: match.error, feedback: match.feedback }
      : { correct: false, error: null, feedback: q.missExplain };
  }

  function isCorrect(q, given) { return diagnose(q, given).correct; }

  AM.content = {
    TOPICS: [],
    packVersion: null,
    subtest: null,
    load: load,
    use: use,
    byKey: function (k) {
      var t = TOPIC_BY_KEY[k];
      return t ? { key: t.key, label: t.label, icon: t.icon, colorKey: t.colorKey } : undefined;
    },
    buildSession: buildSession,
    isCorrect: isCorrect,
    diagnose: diagnose,
    generate: function (id, tier, seed) { return generateFrom(template(id), PACK, tier, seed); },
    instance: function (id, tier, params, formatId) { return instanceFrom(template(id), PACK, tier, params, formatId); },
    firstDraw: function (id, tier, seed) { return firstDrawFrom(template(id), tier, seed); },
    templates: function () { return Object.keys(TEMPLATE_BY_ID).map(function (id) { return TEMPLATE_BY_ID[id]; }); },
    /* For the validator and tests: the parser, the arithmetic and the rules
       the engine applies, so they check the real thing rather than a copy. */
    engine: {
      parse: parse, names: names, slots: slots, evaluate: evalExpr, interpolate: interpolate,
      Q: Q, fromLiteral: fromLiteral, fmt: fmt, peso: peso, round: rround, eq: eq, isRat: isRat,
      readTyped: readTyped, FUNCS: Object.keys(FUNCS), RESERVED: Object.keys(RESERVED),
      INPUTTABLE: Object.keys(INPUTTABLE), MAX_TRIES: MAX_TRIES
    }
  };
})();
