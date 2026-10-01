/* Proof of concept: the language ladder. NOT shipped code.

   !! The Tagalog and Cebuano below is an unreviewed placeholder written to
   !! prove the structure. It must not ship. Native reviewers who also know
   !! NCE maths register are the gate on this feature, not the engineering.

   Claim 1: "pick your language" is the wrong control. The right one is a dial
   from mother tongue to NCE English, moved by the tier the learner is already
   climbing, so the app weans them onto exam register.

   Claim 2: because questions are generated from templates, a language is ~20
   template strings x 4 rungs, not ~80 translated questions. That is what makes
   Philippine languages affordable on a low-end handset.

   Run:  node poc/language-ladder.js */
"use strict";
const zlib = require("zlib");

/* L1 mother tongue, English maths nouns kept from day one
   L2 mother tongue setup, English question stem
   L3 English, mother-tongue gloss on the load-bearing term
   L4 exam register, no support                                           */
const PACKS = {
  en: {
    change: {
      1: "Ana buys bread for {price} and pays {bill}. How much is the change?",
      2: "Ana buys bread for {price} and pays {bill}. How much change should she get?",
      3: "Ana buys bread for {price} and pays with a {bill} bill. How much change should she get?",
      4: "Ana purchases bread costing {price} and tenders {bill}. Determine the change due.",
    },
    markup: {
      1: "A store adds {pct} percent to a {price} item. How much is added?",
      2: "A store marks up a {price} item by {pct}%. How much is added?",
      3: "A sari-sari store marks up a {price} item by {pct}%. How much is added?",
      4: "A retailer applies a {pct}% markup to an item priced at {price}. Determine the amount added.",
    },
  },
  tl: {
    change: {
      1: "Bumili si Ana ng tinapay na {price} at nagbayad ng {bill}. Magkano ang sukli?",
      2: "Bumili si Ana ng tinapay na {price} at nagbayad ng {bill}. How much change should she get?",
      3: "Ana buys bread for {price} and pays with a {bill} bill. How much change (sukli) should she get?",
      4: "Ana purchases bread costing {price} and tenders {bill}. Determine the change due.",
    },
    markup: {
      1: "May tindahan na nagdagdag ng {pct} percent sa item na {price}. Magkano ang naidagdag?",
      2: "May sari-sari store na nag-markup ng {pct}% sa item na {price}. How much is added?",
      3: "A sari-sari store marks up a {price} item by {pct}%. How much is added (naidagdag)?",
      4: "A retailer applies a {pct}% markup to an item priced at {price}. Determine the amount added.",
    },
  },
  ceb: {
    change: {
      1: "Nagpalit si Ana ug pan nga {price} ug nagbayad ug {bill}. Pila ang sukli?",
      2: "Nagpalit si Ana ug pan nga {price} ug nagbayad ug {bill}. How much change should she get?",
      3: "Ana buys bread for {price} and pays with a {bill} bill. How much change (sukli) should she get?",
      4: "Ana purchases bread costing {price} and tenders {bill}. Determine the change due.",
    },
    markup: {
      1: "Adunay tindahan nga nagdugang ug {pct} percent sa item nga {price}. Pila ang nadugang?",
      2: "Adunay sari-sari store nga nag-markup ug {pct}% sa item nga {price}. How much is added?",
      3: "A sari-sari store marks up a {price} item by {pct}%. How much is added (nadugang)?",
      4: "A retailer applies a {pct}% markup to an item priced at {price}. Determine the amount added.",
    },
  },
};

const NAMES = { tl: "Tagalog", ceb: "Cebuano (Bisaya)" };
const RUNG = { 1: "mother tongue, English maths nouns", 2: "local setup, English question",
               3: "English, glossed", 4: "NCE register" };
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k]);

for (const lang of ["tl", "ceb"]) {
  console.log(`\n${NAMES[lang]}: the same question as the learner climbs`);
  for (const tier of [1, 2, 3, 4]) {
    console.log(`  tier ${tier}  ${RUNG[tier]}`);
    console.log(`          ${fill(PACKS[lang].change[tier], { price: "\u20B163", bill: "\u20B1100" })}`);
  }
}

console.log("\nMaths vocabulary never translates. That is the exam prep:");
console.log("  " + fill(PACKS.ceb.markup[1], { price: "\u20B1240", pct: 15 }));
console.log("  'percent' and 'item' are English from tier 1, so no NCE word is ever new.");

/* ---------- cost of a language ----------
   Measured on one real pack, compressed once and scaled linearly. Compressing a
   string repeated many times flatters the ratio, so this does not do that. */
const TEMPLATES = 20, RUNGS = 4, MEASURED = 2;
const pack = Buffer.from(JSON.stringify(PACKS.tl));
const rawKB = (pack.length * TEMPLATES / MEASURED) / 1024;
const gzKB = (zlib.gzipSync(pack).length * TEMPLATES / MEASURED) / 1024;
const uiKB = 1.5; // ~120 interface strings, gzipped
console.log("\nCost of one language pack");
console.log(`  ${TEMPLATES} templates x ${RUNGS} rungs = ${TEMPLATES * RUNGS} strings`);
console.log(`  ~${rawKB.toFixed(1)} KB raw, ~${(gzKB + uiKB).toFixed(1)} KB over the wire with UI strings, lazy-loaded`);
console.log(`  The whole app shell is ~42 KB gzipped. Language is not what makes it heavy.`);

const HANDWRITTEN = 80;
console.log("\nWhy only templates make this affordable");
console.log(`  hand-written bank: ${HANDWRITTEN} questions x ${RUNGS} rungs = ${HANDWRITTEN * RUNGS} strings per language`);
console.log(`  template bank:     ${TEMPLATES} templates x ${RUNGS} rungs = ${TEMPLATES * RUNGS} strings per language`);
