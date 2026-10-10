# Question packs

The questions are data. `app/content.js` is the engine that reads them; nothing here is
code, and nothing here is ever `eval`'d.

A **template** is a question *type*, not a question. It draws fresh numbers each time,
harder as the learner gets further through a level, and can present the same problem in
more than one format,
so there is no fixed bank of answers to memorise. Given the same template, tier and seed
it always produces the same question, which is what lets an attempt log reproduce exactly
what a learner saw.

```
content/packs/<subtest>/
  manifest.json      the pack: the path of topics in order, the exam date
  <topic>.json       one file per written topic: its levels, lessons, templates
```

Only `math` exists. Its path holds all 13 blueprint topics; `decimals` and `fractions` are
written and the others are marked `comingSoon`. Beside the path, `basics` lists the Basics
topics: `times` is written.

## Before you commit

```bash
node tests/validate-packs.js   # the schema, the blueprint, then every template generated
node tests/fuzz.js             # whole sessions, every level and tier
```

Both run in CI. A pack file is precached, so any change to one also needs the `CACHE`
bump in `sw.js`, and a new file must be added to `SHELL` there.

Bump the manifest's `version` whenever a change alters the questions a template produces.
The version is what makes a logged `{template, tier, seed}` reproducible. Nothing enforces
this yet.

## The manifest

```json
{
  "subtest": "math",
  "version": "1.0.0",
  "examDate": "2027-01-30",
  "blueprintCompetencies": 94,
  "fallbackFeedback": "Start from the first step below.",
  "formFeedback": { "not-lowest-terms": "…", "not-a-mixed-number": "…", "fraction-part-not-proper": "…" },
  "topics": [
    { "key": "decimals", "label": "Decimals", "icon": "calculator", "colorKey": 1, "file": "decimals.json" },
    { "key": "fractions", "label": "Fractions", "icon": "scales", "colorKey": 2, "file": "fractions.json" },
    { "key": "gemdas", "label": "Order of operations", "icon": "add", "colorKey": 3, "comingSoon": true }
  ]
}
```

| Field | |
|---|---|
| `subtest` | Must match the folder name |
| `version` | `x.y.z` |
| `examDate` | The blueprint's exam date; Home counts down to it |
| `blueprintCompetencies` | How many of the blueprint's competencies are reachable (not marked N): 94. Home's coverage is the competencies of cleared levels over this |
| `topics` | The path, in the order the app teaches. Every blueprint topic appears exactly once |
| `topics[].file` | The topic's file. Absent for a topic marked `comingSoon` |
| `topics[].comingSoon` | `true` for a topic not yet written: shown on the path, locked |
| `fallbackFeedback` | What a wrong answer that matches no named mistake is told. A template can override it with `fallback` |
| `formFeedback` | Required once any template takes `fraction` or `mixed` answers: the words for `not-lowest-terms`, `not-a-mixed-number` and `fraction-part-not-proper` |
| `topics[].icon` | One of the 22 names in `app/icons.js` |
| `topics[].colorKey` | 1 to 4, the skill hue |
| `basics` | Optional: the Basics topics, each `{ key, label, icon, colorKey, file }`. Never `comingSoon`, and a key no topic on the path uses. Below |

## A topic: levels and lessons

```json
{
  "topic": "decimals",
  "levels": [
    {
      "id": "add-and-subtract",
      "title": "Add and subtract",
      "templates": ["decimals.add", "decimals.subtract", "decimals.change-money", "decimals.what-is-left"],
      "lesson": [
        { "title": "Line up the points", "body": "Write the numbers so their decimal points line up…" },
        { "title": "Worked example", "example": { "template": "decimals.subtract", "params": { "pb": 2, "w2": 2, "f2": 35, "a": 7 }, "format": "difference" } },
        { "title": "Check by estimating", "body": "7 − 2.35 should be a little less than 5…" }
      ]
    }
  ],
  "templates": [ … ]
}
```

Levels run in order and follow the topic's competencies, simplest first. Every template
sits in exactly one level, and a level has at least two, so its practice varies.

A level's `lesson` is two or three cards, shown one at a time before its first practice
and again on request. A card is plain text (`title` and `body`, no `{slots}`) or a worked
example: one of the level's own templates with fixed `params`, rendered with every step
shown and the answer. At least one card is an example.

A written topic must cover its part of the blueprint: every competency of the topic that
is practicable now (App `Y`) has a template, and there are at least the templates the
blueprint targets for the topic.

How hard the numbers are follows the level: tier 1 on a fresh level, tier 2 after 3
answers right first time, tier 3 after 6, and tier 4 when reviewing a cleared level. A
template's `tiers` ranges are how it gets harder.

## Basics

A Basics topic is a file like any other, with three differences: its templates have no
`competency` (Basics are not on the blueprint; `domain` is still one of its domains), a
level can be a `facts` level or a `review` level, and the topic can have a `grid`.

```json
{
  "topic": "times",
  "grid": { "title": "Times table", "sign": "×", "from": 2, "to": 12 },
  "levels": [
    { "id": "2-5-10", "title": "2, 5 and 10", "kind": "facts",
      "templates": ["times.x2", "times.x5", "times.x10", "times.div2", "times.div5", "times.div10"],
      "lesson": [ … ] },
    { "id": "all", "title": "All the tables", "kind": "review" }
  ],
  "templates": [ … ]
}
```

| Level `kind` | |
|---|---|
| absent | Practised like a level on the path: drawn questions, clears at 8 right first time. In Basics every level is open, and clearing one opens nothing |
| `facts` | Practised fact by fact (`app/facts.js`). Its templates' params are listed out, every combination that passes `where` and has a usable answer is one fact, and each fact is mastered on its own: right and quick on two different days. So its params are `choose` or `range` lists, never `tiers`, and a template lists at most 200 facts |
| `review` | Every fact of the topic's facts levels, the ones that need work first. No templates and no lesson of its own |

A fact's key is its template and its drawn values, `times.x7:7,8`, and that is what a
learner's progress is kept under. Never change what a template's params mean once it has
shipped: rename the template instead.

A template marked `"grid": true` puts each of its facts on the topic's grid, at the cells
`x,y` and `y,x`, so it needs drawn params named `x` and `y`. The validator checks that
every cell from `from` to `to` both ways holds a fact whose answer is `x × y` (or `x + y`
for a `+` grid).

Every named mistake must be usable on at least one fact of its template. With a single
fact (8 × 8) two mistakes can land on the same number, 7 × 8 and one group of 8 short
both being 56, and then neither can be named: leave one out.

## A template

```json
{
  "id": "decimals.change-money",
  "competency": "G5.Q2.10",
  "domain": "NA",
  "construct": "Two purchases and the change, in pesos and centavos",
  "schema": "multi-step",
  "params": {
    "p1": { "tiers": { "1": [15, 60], "3": [60, 250] }, "step": 0.25 },
    "p2": { "tiers": { "1": [10, 40], "3": [40, 200] }, "step": 0.25 },
    "bill": { "choose": [100, 200, 500, 1000] }
  },
  "where": ["floor(p1) != p1", "floor(p2) != p2", "p1 + p2 < bill"],
  "answer": { "type": "decimal", "value": "bill - p1 - p2", "maxDecimals": 2, "prefix": "₱" },
  "formats": [
    { "id": "notebook", "prompt": "Mila buys a notebook for {peso(p1)} and a pen for {peso(p2)}. She pays with a {peso(bill)} bill. How much change does she get?" }
  ],
  "hints": ["…", "…", "…"],
  "steps": ["…", "…", "…"],
  "explain": "{peso(bill)} − ({peso(p1)} + {peso(p2)}) = {peso(answer)}.",
  "distractors": [
    { "value": "p1 + p2", "error": "gave-the-amount-spent",
      "feedback": "{peso(value)} is how much was spent. The question asks what is left of the {peso(bill)}." }
  ]
}
```

| Field | |
|---|---|
| `id` | `<topic>.<kebab-case>`, unique. Never reuse an id for a different question: logged attempts refer to it |
| `competency` | A MATATAG code from `content/blueprint.json`, not one marked `app: "N"` |
| `domain` | Must equal that competency's domain |
| `construct` | One line: what the item measures |
| `schema` | One of the blueprint's problem schemas: `change`, `combine`, `compare`, `equal-groups`, `rate`, `multiplicative-compare`, `part-whole`, `work-backwards`, `missing-middle`, `multi-step`, `excess-info` |
| `params` | The numbers and words the question draws, below |
| `where` | Optional list of true/false expressions over the params. A draw that fails one is drawn again |
| `answer` | Below |
| `formats` | One or more ways of presenting the problem, below |
| `hints` | Exactly three, from a nudge to nearly the answer |
| `steps` | Exactly three worked steps. A wrong answer reveals the first |
| `explain` | Shown after a right answer |
| `fallback` | Optional: replaces the manifest's `fallbackFeedback` for this template |
| `distractors` | The mistakes the template expects, below |
| `grid` | Basics facts only: `true` puts the template's facts on the topic's grid. Above |

### Params

Drawn in the order they are written, so a later one can use an earlier one.

| Kind | Example | |
|---|---|---|
| `range` | `{ "range": [80, "budget - 60"], "step": 5 }` | A whole number of `step`s (default 1) from low to high, inclusive. Bounds can be expressions |
| `tiers` | `{ "tiers": { "1": [2, 9], "3": [10, 99] } }` | A range per tier. Tier 1 is required; a tier with no range of its own uses the nearest one below it, so tier 2 here draws from `[2, 9]` |
| `choose` | `{ "choose": ["eggs", "pandesal"] }` | One of a list: numbers (0 or more) or words |
| `value` | `{ "value": "share * people" }` | Computed, not drawn |

A name can't be one of the reserved words: `answer`, `value`, `true`, `false`, or a
function name.

### The answer

| `type` | |
|---|---|
| `integer` | A whole number |
| `decimal` | Up to `maxDecimals` places (0 to 4, default 4) |
| `percent` | A number shown with % after it. `maxDecimals` as for `decimal` |
| `unit` | A number shown with its `unit` after it, such as `"cm²"`. `maxDecimals` as for `decimal` |
| `pi-expression` | The number in front of π, shown with π after it: 12 for 12π |
| `fraction` | Typed as a numerator over a denominator. Never a whole number; each part at most three digits |
| `mixed` | Typed as a whole number beside a fraction. More than 1 and not a whole number |
| `choice` | Four options: the answer and exactly three distractors, shown in order of size. Needs a `label`, such as `"{value} km"` or `"{frac(value)}"`, to print each option. Set `"order": "mixed"` when order of size would give the answer away ("which is the greatest?"); the options are then shuffled, the same way every time for a given question |

The keypad has no minus key, so a draw whose answer is negative or has too many decimal
places is drawn again, as is a choice item whose options collide. The engine tries 500
times before giving up, and the validator flags any template that turns down more than
90% of its first draws.

A typed answer must also be at most seven characters, the keypad's limit. That is not
redrawn: the validator and the fuzz fail a template that can produce a longer one, so keep
the ranges inside it.

For `fraction` and `mixed`, the form is part of the answer unless `"form": "any"` is set:
the right amount not in lowest terms, or not as a mixed number where one is asked for, is
named as its own mistake (`not-lowest-terms`, `not-a-mixed-number`,
`fraction-part-not-proper`) and gets the words in the manifest's `formFeedback`. Those
three codes are the checker's own; a distractor cannot use them. A pack with any fraction
answer must supply all three.

A fraction mistake is matched by amount, so 2/4 entered for a mistake worth 1/2 still
finds it. Write fraction amounts in text with `{frac(x)}` or `{mixed(x)}`: `{x}` would
print 0.5, and a repeating amount such as 1/3 cannot be shown as a decimal at all.

The blueprint's other answer types (repeating decimals, exponents, ratio pairs, clock
times) are refused by the validator until their input is built (`RESEARCH-PLAN.md`,
item 7).

`prefix` is shown in front of the answer field, for example `"₱"`.

### Formats

```json
"formats": [
  { "id": "fish", "prompt": "Aling Rosa sells {have} kilos of fish for {peso(total)}. …" },
  { "id": "table", "prompt": "…", "hints": ["…", "…", "…"] }
]
```

A question picks one at random. Ids are kebab-case and unique within the template. A
format can carry its own `hints`, `steps` or `explain`; anything it leaves out comes from
the template.

### Distractors

Each is a mistake the template expects: the number it produces, a kebab-case `error` code
that will appear in the research log, and `feedback` that names the mistake.

A wrong answer that equals a distractor's value gets that feedback. Any other wrong
answer gets the fallback, which must never guess at what the learner did. A typed item
needs at least one distractor; a choice item needs exactly three, one per wrong option.

In a given question a distractor is left out, so its feedback cannot be shown, when its
value:

- cannot be typed: negative, a repeating decimal, or more than four places
- equals the answer: at 50% off, the discount and the sale price are the same number
- equals another distractor's value: two mistakes that look identical can't be told
  apart, so neither is named

The validator fails a distractor that is left out of every question it generates.

### Text

Any text can include `{expression}`. A number is shown as a plain decimal, which must
terminate, so `{1 / 3}` is an error rather than `0.3333333`. Use `{peso(x)}` for money: whole
pesos as they are, anything else to two places.

What each piece of text can refer to:

| Text | Params | `answer` | `value` |
|---|:-:|:-:|:-:|
| `prompt` | yes | no, so the question can never state its answer | no |
| `where` | yes | | |
| `hints`, `steps`, `explain`, `fallback`, distractor `value` | yes | yes | |
| distractor `feedback`, choice `label` | yes | yes | that option's value |

## Expressions

Arithmetic in exact fractions, so `0.1 + 0.2 == 0.3` is true and `round(2.345, 2)` is
`2.35`.

| | |
|---|---|
| Numbers | `12`, `1.12`. No `1e3` notation |
| Words | `'kg'` in single quotes |
| Operators | `+ - * /`, `%` on whole numbers, `== != < <= > >=`, `&& \|\| !`, `a ? b : c` |
| Functions | `floor`, `ceil`, `round(x)` or `round(x, places)` (halves round up), `abs`, `min`, `max`, `gcd`, `lcm`, `peso`, `fmt`, `frac` (3/4), `mixed` (2 3/4), `fixed(x, places)` (2.40), `words(n)` (forty-five) |

There is no member access, no indexing, and nothing outside the template's own values.
Comparing a number with a word is an error. `&&` and `||` stop early, so
`b != 0 && a / b > 1` is safe.

## Pinned items

```json
"pinned": [
  { "template": "decimals.subtract", "params": { "pb": 2, "w2": 2, "f2": 35, "a": 7 } }
]
```

Fixed questions that open the first session of their template's level, before any drawn
ones. Use them sparingly: a lesson's worked example usually does the job better.

`params` sets every drawn param (computed ones follow from them), each to a value its
template could have drawn itself. `format` is optional; without it the first is used.
