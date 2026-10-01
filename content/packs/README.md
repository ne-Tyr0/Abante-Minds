# Question packs

The questions are data. `app/content.js` is the engine that reads them; nothing here is
code, and nothing here is ever `eval`'d.

A **template** is a question *type*, not a question. It draws fresh numbers each time,
scaled to the learner's tier, and can present the same problem in more than one format,
so there is no fixed bank of answers to memorise. Given the same template, tier and seed
it always produces the same question, which is what lets an attempt log reproduce exactly
what a learner saw.

```
content/packs/<subtest>/
  manifest.json      the pack: subtest, version, topics in display order
  <topic>.json       one file per topic: its templates and pinned items
```

Only `math` exists. The four topics in it are **placeholders** carried over from the
Grade 9 framing; Phase 2 of `RESEARCH-PLAN.md` replaces them with the blueprint's topics.

## Before you commit

```bash
node tests/validate-packs.js   # the schema, the blueprint, then every template generated
node tests/fuzz.js             # whole sessions, every topic and tier
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
  "version": "0.1.0",
  "placeholder": true,
  "fallbackFeedback": "Start from the first step below.",
  "topics": [
    { "key": "money", "label": "Change and money", "icon": "coins", "colorKey": 1, "file": "money.json" }
  ]
}
```

| Field | |
|---|---|
| `subtest` | Must match the folder name |
| `version` | `x.y.z` |
| `placeholder` | `true` skips the checks that tie topics and competencies to the blueprint's topic list. Remove it once the topics come from the blueprint |
| `fallbackFeedback` | What a wrong answer that matches no named mistake is told. A template can override it with `fallback` |
| `topics[].icon` | One of the 22 names in `app/icons.js` |
| `topics[].colorKey` | 1 to 4, the skill hue |

## A template

```json
{
  "id": "money.change-from-bill",
  "competency": "G5.Q2.10",
  "domain": "NA",
  "construct": "Subtract a price from a bill to find the change",
  "schema": "change",
  "params": {
    "price": { "range": [23, 89] },
    "bill": { "choose": [100, 200, 500] }
  },
  "answer": { "type": "integer", "value": "bill - price", "prefix": "₱" },
  "formats": [
    { "id": "bread", "prompt": "Ana buys bread for {peso(price)} and pays with a {peso(bill)} bill. How much change should she get?" }
  ],
  "hints": ["…", "…", "…"],
  "steps": ["…", "…", "…"],
  "explain": "{peso(bill)} − {peso(price)} = {peso(answer)}.",
  "distractors": [
    { "value": "bill + price", "error": "added-instead-of-subtracted",
      "feedback": "{peso(value)} is the bill and the price added together. Change is what is left once the price is taken away." }
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
| `choice` | Four options: the answer and exactly three distractors, shown in order of size. Needs a `label`, such as `"{value} km"`, to print each option |

The keypad has no minus key, so a draw whose answer is negative or has too many decimal
places is drawn again, as is a choice item whose options collide. The engine tries 500
times before giving up, and the validator flags any template that turns down more than
90% of its first draws.

A typed answer must also be at most seven characters, the keypad's limit. That is not
redrawn: the validator and the fuzz fail a template that can produce a longer one, so keep
the ranges inside it.

The other answer types in the blueprint (fractions, mixed numbers, exponents, π, units
and so on) are refused by the validator until answer input is rebuilt
(`RESEARCH-PLAN.md`, item 7).

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
| Functions | `floor`, `ceil`, `round(x)` or `round(x, places)` (halves round up), `abs`, `min`, `max`, `gcd`, `lcm`, `peso`, `fmt` |

There is no member access, no indexing, and nothing outside the template's own values.
Comparing a number with a word is an error. `&&` and `||` stop early, so
`b != 0 && a / b > 1` is safe.

## Pinned items

```json
"pinned": [
  { "template": "money.change-from-bill", "params": { "price": 63, "bill": 100 } }
]
```

Fixed questions that open a topic's session before any drawn ones. The items the design
spec prints verbatim are pinned, so a fresh install opens on exactly the screens it draws.

`params` sets every drawn param (computed ones follow from them), each to a value its
template could have drawn itself. `format` is optional; without it the first is used.
