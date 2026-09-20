/* Abante Minds — the question bank.
   Four topics, twenty correct answers each to clear a tier. Rather than 80
   hand-written items that a learner exhausts in a week, each topic is a set of
   parameterised templates: the numbers change, the scaffold is derived from the
   same numbers, so every question arrives with three real hints and three real
   worked steps. The items the design document shows verbatim are seeded first,
   so a fresh session opens on exactly the screens in the spec. */
(function () {
  "use strict";

  var AM = (window.AM = window.AM || {});
  var P = "₱"; /* peso */

  function peso(n) {
    var s = Math.round(n * 100) / 100;
    return P + (Number.isInteger(s) ? s : s.toFixed(2));
  }

  /* A small mulberry32 so a session is reproducible from its seed — useful for
     "redo the 3 you missed" and for anyone debugging a reported question. */
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
  function pick(r, list) { return list[Math.floor(r() * list.length)]; }
  function between(r, lo, hi, step) {
    step = step || 1;
    var n = Math.floor(r() * ((hi - lo) / step + 1));
    return lo + n * step;
  }

  /* Distractors for multiple choice: plausible near-misses, never random noise.
     Each one is a mistake a learner actually makes, which is what lets the
     wrong state name the specific error. */
  function choicesFrom(answer, wrongs, format) {
    var all = [answer].concat(wrongs).filter(function (v, i, a) { return a.indexOf(v) === i; }).slice(0, 4);
    while (all.length < 4) all.push(all[all.length - 1] + Math.max(1, Math.round(answer * 0.1)));
    all.sort(function (x, y) { return x - y; });
    return { labels: all.map(format), index: all.indexOf(answer) };
  }

  /* ---------- Topic 1 · Change and money ---------- */
  var MONEY = [
    function (r) {
      var price = between(r, 23, 89), bill = pick(r, [100, 200, 500]);
      if (price >= bill) price = bill - between(r, 15, 60);
      var ans = bill - price;
      var toTen = Math.ceil(price / 10) * 10 - price;
      return {
        type: "compute", unit: P,
        prompt: "Ana buys bread for " + peso(price) + " and pays with a " + peso(bill) + " bill. How much change should she get?",
        answer: ans,
        hints: [
          "Change is what is left of the " + peso(bill) + " after the " + peso(price) + " is taken out.",
          "Count up instead of borrowing. From " + price + ", how many pesos reach the next ten?",
          "That is " + toTen + " to reach " + (price + toTen) + ". Now count from " + (price + toTen) + " up to " + bill + "."
        ],
        steps: [
          price + " + " + toTen + " = " + (price + toTen),
          (price + toTen) + " + " + (bill - price - toTen) + " = " + bill,
          toTen + " + " + (bill - price - toTen) + " = " + ans
        ],
        explain: peso(bill) + " − " + peso(price) + " = " + peso(ans) + ".",
        missExplain: "Check the direction: the bill is the bigger number, so the change is " + bill + " − " + price + "."
      };
    },
    function (r) {
      var each = between(r, 7, 24), n = between(r, 4, 9);
      var item = pick(r, ["eggs", "pandesal", "sachets of coffee", "bananas"]);
      var ans = each * n;
      return {
        type: "compute", unit: P,
        prompt: "A sari-sari store sells " + item + " at " + peso(each) + " each. What do " + n + " cost?",
        answer: ans,
        hints: [
          "Same price " + n + " times over — that is multiplication.",
          "Split it: " + n + " × " + each + " is " + n + " × " + (each - (each % 10)) + " plus " + n + " × " + (each % 10) + ".",
          n + " × " + (each - (each % 10)) + " = " + (n * (each - (each % 10))) + ", and " + n + " × " + (each % 10) + " = " + (n * (each % 10)) + "."
        ],
        steps: [
          n + " × " + (each - (each % 10)) + " = " + (n * (each - (each % 10))),
          n + " × " + (each % 10) + " = " + (n * (each % 10)),
          (n * (each - (each % 10))) + " + " + (n * (each % 10)) + " = " + ans
        ],
        explain: n + " × " + peso(each) + " = " + peso(ans) + ".",
        missExplain: "Every one of the " + n + " costs " + peso(each) + ", so they are added " + n + " times, not once."
      };
    },
    function (r) {
      var fare = between(r, 11, 18), riders = between(r, 3, 6);
      var ans = fare * riders;
      return {
        type: "compute", unit: P,
        prompt: "A jeepney fare is " + peso(fare) + ". What do " + riders + " passengers pay?",
        answer: ans,
        hints: [
          "Each passenger pays the same fare, so this is " + riders + " lots of " + fare + ".",
          "Round " + fare + " up to " + (fare + (10 - (fare % 10))) + " if it helps, then take the extra back off.",
          riders + " × 10 = " + (riders * 10) + ", and " + riders + " × " + (fare - 10) + " = " + (riders * (fare - 10)) + "."
        ],
        steps: [
          riders + " × 10 = " + (riders * 10),
          riders + " × " + (fare - 10) + " = " + (riders * (fare - 10)),
          (riders * 10) + " + " + (riders * (fare - 10)) + " = " + ans
        ],
        explain: riders + " × " + peso(fare) + " = " + peso(ans) + ".",
        missExplain: "That is the fare for one. The question asks what all " + riders + " pay together."
      };
    },
    function (r) {
      var share = between(r, 45, 120, 5), people = pick(r, [2, 4, 5]);
      var total = share * people;
      return {
        type: "compute", unit: P,
        prompt: people + " friends share a " + peso(total) + " order equally. What does each one pay?",
        answer: share,
        hints: [
          "Equal shares means dividing the total by " + people + ".",
          "Halve it first if " + people + " is even — halving twice is dividing by four.",
          total + " ÷ " + people + " lands on a whole number of pesos here."
        ],
        steps: [
          "Total is " + peso(total),
          "Shared between " + people,
          total + " ÷ " + people + " = " + share
        ],
        explain: peso(total) + " ÷ " + people + " = " + peso(share) + " each.",
        missExplain: "That is the whole bill. Each person pays only their share of it."
      };
    },
    function (r) {
      var start = pick(r, [300, 500, 1000]);
      var a = between(r, 80, 190, 5), b = between(r, 60, 150, 5);
      var ans = start - a - b;
      var w = choicesFrom(ans, [start - a, a + b, start - a + b], peso);
      return {
        type: "choice", unit: P,
        prompt: "Mila has " + peso(start) + ". She spends " + peso(a) + " on rice and " + peso(b) + " on fish. How much is left?",
        answer: ans, choices: w.labels, answerIndex: w.index,
        hints: [
          "Two things came out of the same " + peso(start) + ".",
          "Add the two amounts she spent before you subtract.",
          a + " + " + b + " = " + (a + b) + ". Take that off " + start + "."
        ],
        steps: [
          a + " + " + b + " = " + (a + b),
          start + " − " + (a + b) + " = " + ans,
          "She has " + peso(ans) + " left"
        ],
        explain: peso(a) + " + " + peso(b) + " = " + peso(a + b) + ", and " + peso(start) + " − " + peso(a + b) + " = " + peso(ans) + ".",
        missExplain: "Both purchases come out of the same money. Add them together first, then subtract once."
      };
    }
  ];

  /* ---------- Topic 2 · Percentages ---------- */
  var PERCENT = [
    function (r) {
      var price = between(r, 120, 480, 20), pct = pick(r, [5, 10, 15, 20, 25]);
      var ans = (price * pct) / 100;
      return {
        type: "compute", unit: P,
        prompt: "A sari-sari store marks up a " + peso(price) + " item by " + pct + "%. How much is added?",
        answer: ans,
        hints: [
          "Find 10% of " + peso(price) + " first. Move the decimal one place left.",
          "10% of " + price + " is " + (price / 10) + ". Build " + pct + "% out of that.",
          pct + "% is " + (pct / 10) + " lots of 10%, so " + (pct / 10) + " × " + (price / 10) + "."
        ],
        steps: [
          "10% of " + peso(price) + " = " + peso(price / 10),
          pct + "% is " + (pct / 10) + " × 10%",
          (pct / 10) + " × " + (price / 10) + " = " + ans
        ],
        explain: "10% of " + peso(price) + " = " + peso(price / 10) + ", so " + pct + "% = " + peso(ans) + ".",
        missExplain: "That is the new price, not the markup. The question asks only for the amount added."
      };
    },
    function (r) {
      var price = between(r, 200, 900, 50), pct = pick(r, [10, 20, 25, 50]);
      var off = (price * pct) / 100, ans = price - off;
      return {
        type: "compute", unit: P,
        prompt: "A " + peso(price) + " bag is on sale at " + pct + "% off. What do you pay?",
        answer: ans,
        hints: [
          "Two steps: work out the discount, then take it off the price.",
          pct + "% of " + price + " is the discount.",
          "Discount is " + peso(off) + ". Subtract it from " + peso(price) + "."
        ],
        steps: [
          pct + "% of " + peso(price) + " = " + peso(off),
          peso(price) + " − " + peso(off) + " = " + peso(ans),
          "You pay " + peso(ans)
        ],
        explain: "The discount is " + peso(off) + ", so you pay " + peso(price) + " − " + peso(off) + " = " + peso(ans) + ".",
        missExplain: "That is how much came off. The question asks what you actually pay."
      };
    },
    function (r) {
      var total = between(r, 20, 60, 4), pct = pick(r, [25, 50, 75]);
      var ans = (total * pct) / 100;
      return {
        type: "compute", unit: "",
        prompt: "There are " + total + " learners in a class. " + pct + "% brought a calculator. How many is that?",
        answer: ans,
        hints: [
          "Per cent means out of a hundred.",
          pct + "% is the same as " + (pct === 25 ? "one quarter" : pct === 50 ? "one half" : "three quarters") + ".",
          "So take " + (pct === 50 ? "half" : pct === 25 ? "a quarter" : "three quarters") + " of " + total + "."
        ],
        steps: [
          "1% of " + total + " = " + (total / 100),
          pct + " × " + (total / 100) + " = " + ans,
          ans + " learners"
        ],
        explain: pct + "% of " + total + " = " + ans + " learners.",
        missExplain: "Check which way round it goes: you want part of the " + total + ", so the answer is smaller than " + total + "."
      };
    },
    function (r) {
      var whole = pick(r, [20, 25, 40, 50]), part = Math.round(whole * pick(r, [0.2, 0.4, 0.6, 0.8]));
      var ans = Math.round((part / whole) * 100);
      var w = choicesFrom(ans, [part, 100 - ans, Math.round(ans / 2)], function (n) { return n + "%"; });
      return {
        type: "choice", unit: "",
        prompt: part + " of " + whole + " questions were correct. What per cent is that?",
        answer: ans, choices: w.labels, answerIndex: w.index,
        hints: [
          "A per cent is a fraction out of a hundred.",
          "Write it as " + part + " over " + whole + " first.",
          "Scale " + whole + " up to 100: multiply both numbers by " + (100 / whole) + "."
        ],
        steps: [
          part + " ÷ " + whole + " = " + (part / whole),
          (part / whole) + " × 100 = " + ans,
          ans + "%"
        ],
        explain: part + " ÷ " + whole + " = " + (part / whole) + ", which is " + ans + "%.",
        missExplain: "That is the count, not the per cent. Divide by the total first, then scale to 100."
      };
    },
    function (r) {
      var base = between(r, 150, 600, 50);
      var ans = Math.round(base * 1.12 * 100) / 100;
      return {
        type: "compute", unit: P,
        prompt: "A repair costs " + peso(base) + " plus 12% service. What is the total?",
        answer: ans,
        hints: [
          "The total is the base plus the service charge.",
          "10% of " + base + " is " + (base / 10) + "; 2% is a fifth of that.",
          "Service is " + peso(base * 0.12) + ". Add it to " + peso(base) + "."
        ],
        steps: [
          "10% of " + peso(base) + " = " + peso(base / 10),
          "2% of " + peso(base) + " = " + peso(base * 0.02),
          peso(base) + " + " + peso(base * 0.12) + " = " + peso(ans)
        ],
        explain: "12% of " + peso(base) + " is " + peso(base * 0.12) + ", so the total is " + peso(ans) + ".",
        missExplain: "That is only the service charge. The question asks for the base plus the service."
      };
    }
  ];

  /* ---------- Topic 3 · Ratio and rate ---------- */
  var RATIO = [
    function (r) {
      var perKilo = between(r, 90, 180, 10), have = pick(r, [3, 4]), want = have + between(r, 1, 3);
      var total = perKilo * have, ans = perKilo * want;
      var w = choicesFrom(ans, [total, perKilo * (want + 1), Math.round(total * 1.5)], peso);
      return {
        type: "choice", unit: P,
        prompt: "Aling Rosa sells " + have + " kilos of fish for " + peso(total) + ". At the same rate, what do " + want + " kilos cost?",
        answer: ans, choices: w.labels, answerIndex: w.index,
        hints: [
          "Find the price of one kilo first.",
          peso(total) + " ÷ " + have + " gives the price per kilo.",
          "One kilo is " + peso(perKilo) + ". Now multiply by " + want + "."
        ],
        steps: [
          have + " kilos = " + peso(total) + ", so 1 kilo = " + peso(perKilo),
          want + " × " + peso(perKilo) + " = " + peso(ans),
          want + " kilos cost " + peso(ans)
        ],
        explain: have + " kilos = " + peso(total) + ", so 1 kilo = " + peso(perKilo) + ". " + want + " × " + peso(perKilo) + " = " + peso(ans) + ".",
        missExplain: "Find the price of one kilo first: " + total + " ÷ " + have + ". Then multiply by " + want + "."
      };
    },
    function (r) {
      var perKilo = between(r, 60, 120, 5), kilos = between(r, 8, 15);
      var ans = perKilo * kilos;
      return {
        type: "compute", unit: P,
        prompt: "A fisherman sells " + kilos + " kilos at " + peso(perKilo) + " a kilo. How much does he collect?",
        answer: ans,
        hints: [
          "The rate is per kilo, so multiply it by how many kilos.",
          "Break " + kilos + " into 10 and " + (kilos - 10) + ".",
          "10 × " + perKilo + " = " + (10 * perKilo) + ", and " + (kilos - 10) + " × " + perKilo + " = " + ((kilos - 10) * perKilo) + "."
        ],
        steps: [
          "10 × " + peso(perKilo) + " = " + peso(10 * perKilo),
          (kilos - 10) + " × " + peso(perKilo) + " = " + peso((kilos - 10) * perKilo),
          peso(10 * perKilo) + " + " + peso((kilos - 10) * perKilo) + " = " + peso(ans)
        ],
        explain: kilos + " × " + peso(perKilo) + " = " + peso(ans) + ".",
        missExplain: "That is the price of one kilo. He sold " + kilos + " of them."
      };
    },
    function (r) {
      var cups = between(r, 2, 4), people = between(r, 4, 6), scale = between(r, 2, 3);
      var ans = cups * scale;
      return {
        type: "compute", unit: "",
        prompt: "A recipe uses " + cups + " cups of rice for " + people + " people. How many cups for " + (people * scale) + " people?",
        answer: ans,
        hints: [
          "How many times bigger is the new group?",
          (people * scale) + " ÷ " + people + " = " + scale + ", so it is " + scale + " times the recipe.",
          "Multiply the rice by the same " + scale + "."
        ],
        steps: [
          (people * scale) + " ÷ " + people + " = " + scale,
          scale + " × " + cups + " = " + ans,
          ans + " cups"
        ],
        explain: "The group is " + scale + " times bigger, so the rice is too: " + scale + " × " + cups + " = " + ans + " cups.",
        missExplain: "Scale the rice by the same factor as the people, not by the difference between them."
      };
    },
    function (r) {
      var speed = between(r, 30, 60, 5), hours = between(r, 2, 5);
      var ans = speed * hours;
      var w = choicesFrom(ans, [speed + hours, speed, Math.round(speed * hours * 1.5)], function (n) { return n + " km"; });
      return {
        type: "choice", unit: "",
        prompt: "A bus travels at " + speed + " km per hour for " + hours + " hours. How far does it go?",
        answer: ans, choices: w.labels, answerIndex: w.index,
        hints: [
          "Per hour tells you the distance covered each hour.",
          "That same distance happens " + hours + " times.",
          speed + " × " + hours + " is the whole trip."
        ],
        steps: [
          "Each hour: " + speed + " km",
          hours + " hours: " + hours + " × " + speed,
          ans + " km"
        ],
        explain: speed + " km/h × " + hours + " h = " + ans + " km.",
        missExplain: "Speed and time multiply here. Adding them mixes two different units."
      };
    },
    function (r) {
      var a = between(r, 2, 5), b = between(r, 2, 5), unit = between(r, 20, 60, 10);
      var total = (a + b) * unit, ans = a * unit;
      return {
        type: "compute", unit: P,
        prompt: peso(total) + " is shared in the ratio " + a + ":" + b + ". How much is the " + a + " part?",
        answer: ans,
        hints: [
          "The ratio " + a + ":" + b + " splits the money into " + (a + b) + " equal parts.",
          peso(total) + " ÷ " + (a + b) + " gives one part.",
          "One part is " + peso(unit) + ". The " + a + " share is " + a + " of them."
        ],
        steps: [
          a + " + " + b + " = " + (a + b) + " parts",
          total + " ÷ " + (a + b) + " = " + unit + " per part",
          a + " × " + unit + " = " + ans
        ],
        explain: "There are " + (a + b) + " parts of " + peso(unit) + ", so the " + a + " share is " + peso(ans) + ".",
        missExplain: "Divide by the total number of parts (" + (a + b) + "), not by one side of the ratio."
      };
    }
  ];

  /* ---------- Topic 4 · Measurement ---------- */
  var MEASURE = [
    function (r) {
      var w = between(r, 3, 12), h = between(r, 3, 12);
      var ans = 2 * (w + h);
      return {
        type: "compute", unit: "",
        prompt: "A garden plot is " + w + " m by " + h + " m. What is the perimeter in metres?",
        answer: ans,
        hints: [
          "Perimeter is the distance all the way around.",
          "There are two sides of " + w + " m and two of " + h + " m.",
          "Add one of each first: " + w + " + " + h + " = " + (w + h) + ", then double it."
        ],
        steps: [
          w + " + " + h + " = " + (w + h),
          "2 × " + (w + h) + " = " + ans,
          ans + " metres"
        ],
        explain: "2 × (" + w + " + " + h + ") = " + ans + " m.",
        missExplain: "That is the area. Perimeter adds the four sides instead of multiplying two of them."
      };
    },
    function (r) {
      var w = between(r, 3, 12), h = between(r, 3, 12);
      var ans = w * h;
      return {
        type: "compute", unit: "",
        prompt: "A floor is " + w + " m by " + h + " m. What is its area in square metres?",
        answer: ans,
        hints: [
          "Area counts the squares that fit inside.",
          "Each row holds " + w + " squares.",
          "There are " + h + " rows of " + w + "."
        ],
        steps: [
          "One row: " + w + " squares",
          h + " rows: " + h + " × " + w,
          ans + " square metres"
        ],
        explain: w + " × " + h + " = " + ans + " m².",
        missExplain: "That is the perimeter. Area multiplies the two sides."
      };
    },
    function (r) {
      var kind = pick(r, [
        { from: "m", to: "cm", factor: 100, n: between(r, 2, 9) },
        { from: "kg", to: "g", factor: 1000, n: between(r, 2, 9) },
        { from: "L", to: "mL", factor: 1000, n: between(r, 2, 9) }
      ]);
      var ans = kind.n * kind.factor;
      return {
        type: "compute", unit: "",
        prompt: "How many " + kind.to + " are in " + kind.n + " " + kind.from + "?",
        answer: ans,
        hints: [
          "One " + kind.from + " is " + kind.factor + " " + kind.to + ".",
          "Going to a smaller unit makes the number bigger.",
          "So multiply " + kind.n + " by " + kind.factor + "."
        ],
        steps: [
          "1 " + kind.from + " = " + kind.factor + " " + kind.to,
          kind.n + " × " + kind.factor + " = " + ans,
          ans + " " + kind.to
        ],
        explain: kind.n + " " + kind.from + " × " + kind.factor + " = " + ans + " " + kind.to + ".",
        missExplain: "Smaller unit, bigger number. Dividing would take you the other way."
      };
    },
    function (r) {
      var l = between(r, 2, 6), w = between(r, 2, 6), h = between(r, 2, 5);
      var ans = l * w * h;
      var c = choicesFrom(ans, [l + w + h, l * w, 2 * (l * w + w * h + l * h)], function (n) { return n + " cm³"; });
      return {
        type: "choice", unit: "",
        prompt: "A box is " + l + " cm by " + w + " cm by " + h + " cm. What is its volume?",
        answer: ans, choices: c.labels, answerIndex: c.index,
        hints: [
          "Volume counts the little cubes that fill the box.",
          "One layer holds " + l + " × " + w + " = " + (l * w) + " cubes.",
          "The box is " + h + " layers deep."
        ],
        steps: [
          "One layer: " + l + " × " + w + " = " + (l * w),
          h + " layers: " + (l * w) + " × " + h,
          ans + " cm³"
        ],
        explain: l + " × " + w + " × " + h + " = " + ans + " cm³.",
        missExplain: "Volume multiplies all three sides. Adding them gives a length, not a space."
      };
    },
    function (r) {
      var minutes = between(r, 70, 200, 5);
      var ans = Math.floor(minutes / 60);
      var rem = minutes % 60;
      return {
        type: "compute", unit: "",
        prompt: minutes + " minutes is how many whole hours?",
        answer: ans,
        hints: [
          "One hour is 60 minutes.",
          "How many 60s fit inside " + minutes + "?",
          ans + " × 60 = " + (ans * 60) + ", with " + rem + " minutes left over."
        ],
        steps: [
          "1 hour = 60 minutes",
          minutes + " ÷ 60 = " + ans + " remainder " + rem,
          ans + " whole hours"
        ],
        explain: minutes + " ÷ 60 = " + ans + " hours and " + rem + " minutes, so " + ans + " whole hours.",
        missExplain: "Count whole hours only — the " + rem + " leftover minutes do not make another one."
      };
    }
  ];

  /* The exact items the design document prints. Seeded at the front of their
     topic so a fresh install opens on the screens in the spec. */
  var SEEDED = {
    money: [{
      type: "compute", unit: P,
      prompt: "Ana buys bread for " + P + "63 and pays with a " + P + "100 bill. How much change should she get?",
      answer: 37,
      hints: [
        "Change is what is left of the " + P + "100 after the " + P + "63 is taken out.",
        "Count up from 63 to 70 first.",
        "That is 7 to reach 70. Now count from 70 up to 100."
      ],
      steps: ["63 + 7 = 70", "70 + 30 = 100", "7 + 30 = 37"],
      explain: "Tama. " + P + "100 − " + P + "63 = " + P + "37.",
      missExplain: "Not yet. Count up from 63 to 70, then to 100."
    }],
    percent: [{
      type: "compute", unit: P,
      prompt: "A sari-sari store marks up a " + P + "240 item by 15%. How much is added?",
      answer: 36,
      hints: [
        "Find 10% of " + P + "240 first. Move the decimal one place left.",
        "10% of 240 is 24. Half of 10% is 5%.",
        "15% is 10% + 5%, so 24 + 12."
      ],
      steps: ["10% of " + P + "240 = " + P + "24", "5% of " + P + "240 = " + P + "12", P + "24 + " + P + "12 = " + P + "36"],
      explain: "10% of " + P + "240 = " + P + "24, and half of that is " + P + "12. " + P + "24 + " + P + "12 = " + P + "36.",
      missExplain: P + "276 is the new price. The question asks only for the amount added."
    }],
    ratio: [{
      type: "choice", unit: P,
      prompt: "Aling Rosa sells 3 kilos of fish for " + P + "450. At the same rate, what do 5 kilos cost?",
      answer: 750, choices: [P + "650", P + "700", P + "750", P + "900"], answerIndex: 2,
      hints: [
        "Find the price of one kilo first.",
        P + "450 ÷ 3 gives the price per kilo.",
        "One kilo is " + P + "150. Now multiply by 5."
      ],
      steps: ["3 kilos = " + P + "450, so 1 kilo = " + P + "150", "5 × " + P + "150 = " + P + "750", "5 kilos cost " + P + "750"],
      explain: "3 kilos = " + P + "450, so 1 kilo = " + P + "150. 5 × " + P + "150 = " + P + "750.",
      missExplain: "Find the price of one kilo first: " + P + "450 ÷ 3. Then multiply by 5."
    }],
    measure: []
  };

  var TOPICS = [
    { key: "money",   label: "Change and money", icon: "coins",   colorKey: 1, templates: MONEY,   seeded: SEEDED.money },
    { key: "percent", label: "Percentages",      icon: "percent", colorKey: 2, templates: PERCENT, seeded: SEEDED.percent },
    { key: "ratio",   label: "Ratio and rate",   icon: "scales",  colorKey: 3, templates: RATIO,   seeded: SEEDED.ratio },
    { key: "measure", label: "Measurement",      icon: "ruler",   colorKey: 4, templates: MEASURE, seeded: SEEDED.measure }
  ];

  var BY_KEY = {};
  TOPICS.forEach(function (t) { BY_KEY[t.key] = t; });

  /* Build one session: `count` questions from a topic, seeded ones first.
     Tier only widens the numbers the templates may draw, so a tier-3 question
     is the same shape as a tier-1 one with more to carry. */
  function buildSession(topicKey, count, tier, seed) {
    var topic = BY_KEY[topicKey] || TOPICS[0];
    var r = rng(seed === undefined ? Date.now() : seed);
    var out = [];

    topic.seeded.forEach(function (q) {
      if (out.length < count) out.push(decorate(q, topic, out.length));
    });

    var lastTemplate = -1;
    while (out.length < count) {
      var i = Math.floor(r() * topic.templates.length);
      if (i === lastTemplate && topic.templates.length > 1) { i = (i + 1) % topic.templates.length; }
      lastTemplate = i;
      out.push(decorate(topic.templates[i](r), topic, out.length));
    }
    return out;
  }

  function decorate(q, topic, index) {
    var copy = {};
    Object.keys(q).forEach(function (k) { copy[k] = q[k]; });
    copy.id = topic.key + "-" + index;
    copy.topicKey = topic.key;
    copy.topicLabel = topic.label;
    copy.topicIcon = topic.icon;
    copy.colorKey = topic.colorKey;
    return copy;
  }

  /* A typed answer matches if it is the same number. "36", "36.0" and " 36 "
     are the same answer; "P36" is too, because the field already shows the sign. */
  function isCorrect(question, given) {
    if (question.type === "choice") return given === question.answerIndex;
    var n = parseFloat(String(given).replace(/[^0-9.\-]/g, ""));
    if (isNaN(n)) return false;
    return Math.abs(n - question.answer) < 0.005;
  }

  AM.content = {
    TOPICS: TOPICS,
    byKey: function (k) { return BY_KEY[k]; },
    buildSession: buildSession,
    isCorrect: isCorrect,
    peso: peso,
    PESO: P
  };
})();
