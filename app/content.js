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
  /* Answer types the app can take today, and the box each is typed into:
     one box for a number, a numerator over a denominator for a fraction, a
     whole number beside a fraction for a mixed number. A choice is tapped,
     not typed. The blueprint's other types wait for their input. */
  var ENTRY = {
    integer: "number", decimal: "number", percent: "number", unit: "number",
    "pi-expression": "number", fraction: "fraction", mixed: "mixed", choice: null
  };
  var INPUTTABLE = {};
  Object.keys(ENTRY).forEach(function (k) { INPUTTABLE[k] = true; });
  var BOX_LIMIT = 999; /* three digits in each fraction box */
  /* Right value, wrong form: the mistakes the checker names on its own. */
  var FORM_ERRORS = ["not-lowest-terms", "not-a-mixed-number", "fraction-part-not-proper"];

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
  /* Fractions in prose, always in lowest terms: 3/4, 7/4. A whole number
     reads as itself. */
  function fracText(a) { return isInt(a) ? String(a.n) : a.n + "/" + a.d; }
  /* 2 3/4. Under one it is a plain fraction; a whole number is itself. */
  function mixedText(a) {
    if (isInt(a) || Math.abs(a.n) < a.d) return fracText(a);
    var whole = floorInt(a.n, a.d);
    return whole + " " + (a.n - whole * a.d) + "/" + a.d;
  }
  /* A whole number in words, as a Grade 6 textbook reads it: "four hundred
     five", "forty-five". No "and": in reading a decimal, "and" is the point. */
  var ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  var TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  function wordsUnderThousand(n) {
    var out = [];
    if (n >= 100) { out.push(ONES[Math.floor(n / 100)] + " hundred"); n %= 100; }
    if (n >= 20) out.push(TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : ""));
    else if (n > 0 || !out.length) out.push(ONES[n]);
    return out.join(" ");
  }
  function numberWords(n) {
    if (n < 1000) return wordsUnderThousand(n);
    return wordsUnderThousand(Math.floor(n / 1000)) + " thousand" + (n % 1000 ? " " + wordsUnderThousand(n % 1000) : "");
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
  FUNCS.frac = function (x) { return fracText(num(x)); };
  /* A number to a fixed count of places, so columns line up: fixed(2.4, 2) is 2.40. */
  FUNCS.fixed = function (x, dp) { return decimalString(num(x), toNumber(int(dp))); };
  FUNCS.words = function (x) {
    x = int(x);
    if (x.n < 0 || x.n > 999999) throw ContentError("words() takes a whole number from 0 to 999999");
    return numberWords(x.n);
  };
  FUNCS.mixed = function (x) { return mixedText(num(x)); };
  /* A power: pow(2, 5) is 32. The exponent is a whole number, kept small so
     the number stays exact. */
  FUNCS.pow = function (b, e) {
    e = int(e);
    if (e.n < 0 || e.n > 20) throw ContentError("pow() takes a whole exponent from 0 to 20");
    b = num(b);
    var r = Q(1);
    for (var i = 0; i < e.n; i++) r = mul(r, b);
    return r;
  };
  /* An exponent as it is printed: "{b}{sup(e)}" shows 2⁵. */
  var SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  FUNCS.sup = function (x) {
    x = int(x);
    if (x.n < 0) throw ContentError("sup() takes a whole number");
    return String(x.n).split("").map(function (d) { return SUPERSCRIPT.charAt(+d); }).join("");
  };

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

  /* Whether an answer of this type can be given at all. A number must be
     typeable on the keypad; a fraction must fit its boxes and not be a whole
     number; a choice can be any amount its label can show. */
  function validAnswer(spec, x) {
    if (!isRat(x) || x.n < 0) return false;
    var kind = ENTRY[spec.type];
    if (!kind) return true;
    if (spec.type === "integer") return isInt(x);
    if (kind === "fraction") return !isInt(x) && x.n <= BOX_LIMIT && x.d <= BOX_LIMIT;
    if (kind === "mixed") return !isInt(x) && x.n > x.d && floorInt(x.n, x.d) <= BOX_LIMIT && x.d <= BOX_LIMIT;
    var p = decimalPlaces(x);
    return p >= 0 && p <= (spec.maxDecimals === undefined ? 4 : spec.maxDecimals);
  }

  /* Whether a learner answering this type could enter this value, right or
     wrong. A mistake that cannot be entered can never be matched. */
  function enterable(type, x) {
    if (!isRat(x) || x.n < 0) return false;
    var kind = ENTRY[type];
    if (!kind) return true;
    if (kind === "number") return validAnswer({ type: "decimal" }, x);
    if (x.n === 0 || x.d > BOX_LIMIT) return false;
    return kind === "fraction" ? x.n <= BOX_LIMIT : floorInt(x.n, x.d) <= BOX_LIMIT;
  }

  function within(scope) {
    var s = Object.create(null);
    Object.keys(scope).forEach(function (k) { s[k] = scope[k]; });
    return s;
  }

  function render(t, pack, scope, format, meta) {
    var answer = scope.answer;
    /* A mistake whose value cannot be entered for this answer type --
       negative, a repeating decimal on the number keypad, too big for the
       fraction boxes -- can never be matched, so it is left out of this
       question rather than rendered. Choice items have already been checked in
       choiceUsable. */
    var distractors = [];
    (t.distractors || []).forEach(function (d) {
      var ds = within(scope);
      ds.value = num(evalExpr(d.value, scope));
      if (!enterable(t.answer.type, ds.value)) return;
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
      entry: ENTRY[t.answer.type],
      unit: t.answer.prefix || "",
      suffix: suffixFor(t.answer),
      form: ENTRY[t.answer.type] === "fraction" || ENTRY[t.answer.type] === "mixed" ? (t.answer.form || "lowest") : null,
      formFeedback: pack.formFeedback || {},
      prompt: interpolate(format.prompt, scope),
      answer: toNumber(answer),
      answerExact: answer,
      answerText: answerText(t.answer.type, answer),
      hints: (format.hints || t.hints).map(function (h) { return interpolate(h, scope); }),
      steps: (format.steps || t.steps).map(function (h) { return interpolate(h, scope); }),
      explain: interpolate(format.explain || t.explain, scope),
      missExplain: interpolate(t.fallback || pack.fallbackFeedback, scope),
      distractors: distractors
    };
    if (q.type === "choice") {
      var values = [answer].concat(distractors.map(function (d) { return d.exact; }));
      values.sort(cmp);
      /* In order of size unless that gives the answer away -- "which is the
         greatest?" would always be the last option -- in which case the
         options are shuffled, deterministically for the question. */
      if (t.answer.order === "mixed") shuffle(values, meta.r || rng(hashText(JSON.stringify(scope, ratJSON))));
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

  function shuffle(list, r) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1)), tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }
  /* FNV-1a: a stable number from text, to seed a pinned question's shuffle. */
  function hashText(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
    return h;
  }
  function ratJSON(k, v) { return isRat(v) ? v.n + "/" + v.d : v; }

  /* What follows the typed number: a per cent sign, a unit, or pi. */
  function suffixFor(spec) {
    if (spec.type === "percent") return "%";
    if (spec.type === "pi-expression") return "π";
    if (spec.type === "unit") return " " + spec.unit;
    return "";
  }

  /* The right answer as it would be typed: 36, 3/4, 2 3/4. */
  function answerText(type, x) {
    var kind = ENTRY[type];
    if (kind === "fraction") return fracText(x);
    if (kind === "mixed") return mixedText(x);
    return kind ? fmt(x) : null;
  }

  /* A choice item needs four different, sensible options, every one of them a
     named mistake. Rather than invent a filler option, draw again. */
  function choiceUsable(t, scope) {
    var vals = [scope.answer];
    for (var i = 0; i < (t.distractors || []).length; i++) {
      var v = evalExpr(t.distractors[i].value, scope);
      if (!enterable("choice", v)) return false;
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
      if (built) return render(t, pack, built.scope, built.format, { tier: tier, seed: seed >>> 0, r: r });
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

  /* ---------- packs ----------
     A pack is the learner's path: its topics in the order they are met, each
     split into levels that follow its competencies. A topic not yet written
     is on the path as "coming soon", so the path shows the whole blueprint
     from the start rather than pretending to be complete.

     Beside the path is the Basics track: the facts and methods under every
     topic (times tables, adding and subtracting, mental math), open at any
     time and never counted towards the blueprint. Its topics have the same
     files, plus two kinds of level the path does not use: "facts", practised
     fact by fact until each is mastered, and "review", which asks every fact
     of the topic. */

  var PACK = null;
  var TOPIC_BY_KEY = Object.create(null);
  var TEMPLATE_BY_ID = Object.create(null);
  var KINDS = ["practice", "facts", "review"];

  /* Installs a pack: a manifest, one file per written topic on the path
     (null for one coming soon), and one per Basics topic. The full schema
     check runs in CI (tests/validate-packs.js); this only refuses a pack that
     could not work at all, so a broken deploy fails loudly instead of quietly. */
  function use(manifest, topicFiles, basicsFiles) {
    if (!manifest || !Array.isArray(manifest.topics)) throw ContentError("manifest has no topics");
    var topics = Object.create(null), templates = Object.create(null), list = [], basics = [];

    function install(meta, file, track) {
      if (topics[meta.key]) throw ContentError("topic key used twice: " + meta.key);
      var topic = {
        key: meta.key, label: meta.label, icon: meta.icon, colorKey: meta.colorKey, track: track,
        ready: !meta.comingSoon, levels: [], templates: [], pinned: [], grid: null
      };
      if (meta.comingSoon) {
        if (file) throw ContentError("topic '" + meta.key + "' is coming soon but has a file");
      } else {
        if (!file || file.topic !== meta.key) throw ContentError("topic file for '" + meta.key + "' is missing or mislabelled");
        if (!file.templates || !file.templates.length) throw ContentError("topic '" + meta.key + "' has no templates");
        if (!file.levels || !file.levels.length) throw ContentError("topic '" + meta.key + "' has no levels");
        file.templates.forEach(function (t) {
          if (templates[t.id]) throw ContentError("template id used twice: " + t.id);
          templates[t.id] = t;
        });
        topic.levels = file.levels.map(function (lv) {
          var where = "level '" + meta.key + "/" + lv.id + "'";
          var kind = lv.kind || "practice";
          if (KINDS.indexOf(kind) < 0) throw ContentError(where + " has an unknown kind '" + kind + "'");
          if (kind !== "practice" && track !== "basics") throw ContentError(where + ": only a Basics level can be " + kind);
          var own = (lv.templates || []).map(function (id) {
            if (!templates[id]) throw ContentError(where + " names unknown template " + id);
            return templates[id];
          });
          if (kind === "review" && own.length) throw ContentError(where + ": a review level has no templates of its own");
          return { id: lv.id, title: lv.title, kind: kind, templates: own, competencies: [], lesson: lv.lesson || [], facts: null };
        });
        topic.levels.forEach(function (lv) {
          /* A review level asks every fact of the topic's facts levels. */
          if (lv.kind === "review") {
            lv.templates = topic.levels.filter(function (o) { return o.kind === "facts"; })
              .reduce(function (all, o) { return all.concat(o.templates); }, []);
          }
          if (!lv.templates.length) throw ContentError("level '" + meta.key + "/" + lv.id + "' has nothing to ask");
          lv.templates.forEach(function (t) {
            if (t.competency && lv.competencies.indexOf(t.competency) < 0) lv.competencies.push(t.competency);
          });
        });
        topic.templates = file.templates;
        topic.pinned = file.pinned || [];
        topic.grid = file.grid || null;
      }
      topics[meta.key] = topic;
      return topic;
    }

    manifest.topics.forEach(function (meta, i) { list.push(install(meta, topicFiles[i], "path")); });
    (manifest.basics || []).forEach(function (meta, i) {
      if (meta.comingSoon) throw ContentError("Basics topic '" + meta.key + "' cannot be coming soon");
      basics.push(install(meta, (basicsFiles || [])[i], "basics"));
    });
    PACK = {
      subtest: manifest.subtest, version: manifest.version,
      fallbackFeedback: manifest.fallbackFeedback, formFeedback: manifest.formFeedback || {},
      examDate: manifest.examDate || null, blueprintCompetencies: manifest.blueprintCompetencies || 0
    };
    TOPIC_BY_KEY = topics;
    TEMPLATE_BY_ID = templates;
    FACTS = Object.create(null);
    AM.content.TOPICS = list.map(publicTopic);
    AM.content.BASICS = basics.map(publicTopic);
    AM.content.packVersion = PACK.version;
    AM.content.subtest = PACK.subtest;
    AM.content.examDate = PACK.examDate;
    AM.content.blueprintCompetencies = PACK.blueprintCompetencies;
    return AM.content.TOPICS;
  }

  /* What the screens and the store see of a topic: its place on the path or
     in Basics, and its levels, never the templates themselves. */
  function publicTopic(t) {
    return {
      key: t.key, label: t.label, icon: t.icon, colorKey: t.colorKey, ready: t.ready, track: t.track,
      grid: !!t.grid,
      levels: t.levels.map(function (lv) {
        return {
          id: lv.id, title: lv.title, kind: lv.kind, competencies: lv.competencies.slice(),
          hasLesson: lv.lesson.length > 0, factCount: lv.kind === "practice" ? 0 : factsOf(lv).length
        };
      })
    };
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
      return Promise.all([
        Promise.all(manifest.topics.map(function (t) { return t.comingSoon ? null : json(base + t.file); })),
        Promise.all((manifest.basics || []).map(function (t) { return json(base + t.file); }))
      ]).then(function (files) { return use(manifest, files[0], files[1]); });
    });
  }

  function template(id) {
    var t = TEMPLATE_BY_ID[id];
    if (!t) throw ContentError("no template '" + id + "'");
    return t;
  }

  function levelOf(topicKey, levelId) {
    var topic = TOPIC_BY_KEY[topicKey];
    if (!topic || !topic.ready) throw ContentError("no topic '" + topicKey + "' to practise");
    var level = topic.levels.filter(function (lv) { return lv.id === levelId; })[0];
    if (!level) throw ContentError("topic '" + topicKey + "' has no level '" + levelId + "'");
    return { topic: topic, level: level };
  }

  function decorate(q, topic, level, index) {
    q.id = topic.key + "-" + level.id + "-" + index;
    q.topicKey = topic.key;
    q.topicLabel = topic.label;
    q.topicIcon = topic.icon;
    q.colorKey = topic.colorKey;
    q.levelId = level.id;
    q.levelTitle = level.title;
    return q;
  }

  /* One session of one level: its pinned items first when asked for (a
     level's first session), then drawn questions from the level's templates
     up to `count`, never the same template twice running. Each question gets
     its own seed from the session's stream, so any one of them can be
     regenerated on its own. */
  function buildSession(o) {
    if (!PACK) throw ContentError("no content pack installed yet");
    var found = levelOf(o.topic, o.level), topic = found.topic, level = found.level;
    var r = rng(o.seed === undefined ? Date.now() : o.seed);
    var out = [];
    if (o.pinned) {
      topic.pinned.forEach(function (p) {
        var t = template(p.template);
        if (out.length < o.count && level.templates.indexOf(t) > -1)
          out.push(decorate(instanceFrom(t, PACK, o.tier, p.params, p.format), topic, level, out.length));
      });
    }
    var last = -1, n = level.templates.length;
    while (out.length < o.count) {
      var i = Math.floor(r() * n);
      if (i === last && n > 1) i = (i + 1) % n;
      last = i;
      var qseed = Math.floor(r() * 4294967296) >>> 0;
      out.push(decorate(generateFrom(level.templates[i], PACK, o.tier, qseed), topic, level, out.length));
    }
    return out;
  }

  /* A level's lesson, ready to show: text cards as written, and worked
     examples rendered from their template with the numbers the lesson fixes,
     so the example and the practice that follows are the same kind of
     question. */
  function lesson(topicKey, levelId) {
    var level = levelOf(topicKey, levelId).level;
    return level.lesson.map(function (card) {
      if (!card.example) return { kind: "text", title: card.title, body: card.body };
      var q = instanceFrom(template(card.example.template), PACK, 1, card.example.params, card.example.format);
      return {
        kind: "example", title: card.title || "Worked example",
        prompt: q.prompt, steps: q.steps, explain: q.explain,
        /* Money shows as money (₱149.50), however the learner would type it. */
        answer: q.type === "choice" ? q.choices[q.answerIndex]
          : q.unit === PESO ? peso(q.answerExact) : q.unit + q.answerText + q.suffix
      };
    });
  }

  /* ---------- facts ----------
     A facts level is not drawn at random: its templates' params are listed
     out, and every combination that passes the template's `where` and has a
     usable answer is one fact, mastered on its own (app/facts.js). A fact's
     key is its template and its drawn values, "times.x7:7,8", so progress
     survives a reordered file, though not a change to what is asked. */
  var FACTS = Object.create(null);  /* key -> {key, template, params} */

  function factsOf(level) {
    if (level.facts) return level.facts;
    var keys = [];
    level.templates.forEach(function (t) {
      enumerate(t).forEach(function (f) {
        if (!FACTS[f.key]) FACTS[f.key] = f;
        if (keys.indexOf(f.key) < 0) keys.push(f.key);
      });
    });
    level.facts = keys;
    return keys;
  }

  function enumerate(t) {
    var names = Object.keys(t.params || {}), out = [];
    function walk(i, scope, drawn) {
      if (i === names.length) {
        if (!(t.where || []).every(function (c) { return bool(evalExpr(c, scope)); })) return;
        var answer = evalExpr(t.answer.value, scope);
        if (!validAnswer(t.answer, answer)) return;
        if (t.answer.type === "choice") {
          var withAnswer = within(scope);
          withAnswer.answer = answer;
          if (!choiceUsable(t, withAnswer)) return;
        }
        var params = {};
        drawn.forEach(function (n) { params[n] = isRat(scope[n]) ? toNumber(scope[n]) : scope[n]; });
        out.push({
          key: t.id + ":" + drawn.map(function (n) { return isRat(scope[n]) ? fmt(scope[n]) : scope[n]; }).join(","),
          template: t.id, params: params
        });
        return;
      }
      var name = names[i], spec = t.params[name];
      if ("value" in spec) {
        var s = within(scope);
        s[name] = evalExpr(spec.value, scope);
        walk(i + 1, s, drawn);
        return;
      }
      valuesOf(t, name, spec, scope).forEach(function (v) {
        var next = within(scope);
        next[name] = v;
        walk(i + 1, next, drawn.concat(name));
      });
    }
    walk(0, Object.create(null), []);
    return out;
  }

  /* Every value a param can take. A fact's numbers do not depend on how far
     the learner has got, so tiers have no place in one. */
  function valuesOf(t, name, spec, scope) {
    if ("choose" in spec) return spec.choose.map(fromJSON);
    if (!spec.range) throw ContentError(t.id + ": a fact's '" + name + "' must be a choose or a range, not tiers");
    var lo = bound(spec.range[0], scope), hi = bound(spec.range[1], scope);
    var step = spec.step === undefined ? Q(1) : fromJSON(spec.step);
    var span = div(sub(hi, lo), step);
    if (!isInt(span)) throw ContentError(t.id + ": range for '" + name + "' is not a whole number of steps");
    var list = [];
    for (var k = 0; k <= toNumber(span); k++) list.push(add(lo, mul(Q(k), step)));
    return list;
  }

  function factKeys(topicKey, levelId) {
    var level = levelOf(topicKey, levelId).level;
    return level.kind === "practice" ? [] : factsOf(level).slice();
  }

  /* One fact as a question in the level being practised. The seed picks its
     format, 7 × 8 or 8 × 7, so a logged fact question can be shown again. */
  function factQuestion(topicKey, levelId, key, seed, index) {
    var found = levelOf(topicKey, levelId);
    if (found.level.kind === "practice" || factsOf(found.level).indexOf(key) < 0)
      throw ContentError("level '" + topicKey + "/" + levelId + "' has no fact '" + key + "'");
    var f = FACTS[key], t = template(f.template);
    var format = t.formats[Math.floor(rng(seed)() * t.formats.length)];
    var q = decorate(instanceFrom(t, PACK, 1, f.params, format.id), found.topic, found.level, index);
    q.factKey = key;
    q.pinned = false;
    q.seed = seed >>> 0;
    return q;
  }

  /* A Basics topic's grid, such as the times table: the fact each cell
     belongs to, for the screen to colour by mastery. A template marked
     `grid` puts each of its facts on the cells x,y and y,x. */
  function grid(topicKey) {
    var topic = TOPIC_BY_KEY[topicKey];
    if (!topic || !topic.grid) return null;
    var cells = Object.create(null);
    topic.levels.forEach(function (lv) {
      if (lv.kind !== "facts") return;
      factsOf(lv).forEach(function (k) {
        var f = FACTS[k];
        if (!template(f.template).grid) return;
        cells[f.params.x + "," + f.params.y] = k;
        cells[f.params.y + "," + f.params.x] = k;
      });
    });
    var g = topic.grid, values = [];
    for (var v = g.from; v <= g.to; v++) values.push(v);
    return { title: g.title, sign: g.sign, values: values, cells: cells };
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

  /* A fraction entry, exactly as the boxes produce it: "3/4", "2 3/4", or a
     bare whole number from the mixed boxes. Anything else is not one. */
  function readFraction(given) {
    var s = String(given === undefined || given === null ? "" : given).trim(), m;
    if ((m = /^(\d+)\/(\d+)$/.exec(s)) && +m[2] > 0)
      return { form: "fraction", whole: 0, num: +m[1], den: +m[2], value: Q(+m[1], +m[2]) };
    if ((m = /^(\d+) (\d+)\/(\d+)$/.exec(s)) && +m[3] > 0)
      return { form: "mixed", whole: +m[1], num: +m[2], den: +m[3], value: add(Q(+m[1]), Q(+m[2], +m[3])) };
    if ((m = /^(\d+)$/.exec(s))) return { form: "whole", whole: +m[1], num: 0, den: 1, value: Q(+m[1]) };
    return null;
  }

  /* The right amount in the wrong form. NCE options are written in lowest
     terms, so the form is part of the answer, but it is a different mistake
     from a wrong amount and is named as one. */
  function formError(q, entry) {
    if (q.form !== "lowest") return null;
    if (q.entry === "mixed") {
      if (entry.form !== "mixed") return "not-a-mixed-number";
      if (entry.num >= entry.den) return "fraction-part-not-proper";
    }
    return gcdInt(entry.num, entry.den) > 1 ? "not-lowest-terms" : null;
  }

  function diagnose(q, given) {
    var exact = toRat(q.answerExact);
    var value;
    if (q.type === "choice") {
      if (given === q.answerIndex) return { correct: true, error: null, feedback: null };
      value = q.choiceValues && q.choiceValues[given] ? toRat(q.choiceValues[given]) : null;
    } else if (q.entry === "fraction" || q.entry === "mixed") {
      var entry = readFraction(given);
      value = entry && entry.value;
      if (value && eq(value, exact)) {
        var wrongForm = formError(q, entry);
        if (!wrongForm) return { correct: true, error: null, feedback: null };
        return { correct: false, error: wrongForm, feedback: q.formFeedback[wrongForm] || q.missExplain };
      }
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
    BASICS: [],
    packVersion: null,
    subtest: null,
    examDate: null,
    blueprintCompetencies: 0,
    load: load,
    use: use,
    byKey: function (k) {
      var t = TOPIC_BY_KEY[k];
      return t ? publicTopic(t) : undefined;
    },
    buildSession: buildSession,
    lesson: lesson,
    facts: factKeys,
    /* A listed fact's template and params, for checking it in every format. */
    fact: function (key) {
      var f = FACTS[key];
      return f ? { key: f.key, template: f.template, params: JSON.parse(JSON.stringify(f.params)) } : undefined;
    },
    factQuestion: factQuestion,
    grid: grid,
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
      readTyped: readTyped, readFraction: readFraction, frac: fracText, mixed: mixedText,
      ENTRY: ENTRY, FORM_ERRORS: FORM_ERRORS.slice(), BOX_LIMIT: BOX_LIMIT,
      FUNCS: Object.keys(FUNCS), RESERVED: Object.keys(RESERVED),
      INPUTTABLE: Object.keys(INPUTTABLE), MAX_TRIES: MAX_TRIES
    }
  };
})();
