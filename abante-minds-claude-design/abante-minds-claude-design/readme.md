Free, offline-capable NCE math practice for ambitious, under-resourced kids, starting with Camotes Islands — shared low-spec Android phones, patchy or no internet, weak mental math, often calculator-dependent. Every decision below optimizes for that device and that kid, not for a portfolio screenshot.

The mark is in `logo/` — a blue brain crossed by a rising amber arrow, in `brand-blue-600` and `action-500`. Set the wordmark beside it in `heading-lg`/`celebration-heading` (Baloo 2). Still open: a vector original (the mark is currently only a PNG) and a simplified small-size version for launcher and tab icons. No mascot exists and none is implied.

## Content fundamentals

- Address the learner directly and warmly — "Hello, Ligaya" beats "Welcome, User." This is solo practice, not a classroom tool, so the voice is one kid and one companion, never generic-tool-voice.
- Root problem contexts in what these kids actually see — sari-sari store change-making, jeepney fare and seating, fishing catch and weight — over generic or foreign scenarios, wherever the math allows it.
- Run two distinct voices, never blended: calm and matter-of-fact on Practice/question screens (no hype, no exclamation points competing with the math); energetic and celebratory only inside a Reward moment (streak, level-up, badge). Mixing them defeats the point of separating the two modes visually (below).
- No slang or trend-chasing copy ("Academic Slayer," meme phrasing) — it ages within a year and may not translate locally. Plain, warm, and current beats clever.
- Math content itself (questions, answers, solution steps) is adviser-verified before it ships. AI-drafted question or solution text is a starting point only, never the correctness check — the same reason AI shouldn't grade its own math.

## Visual foundations

**Two modes, kept visually distinct.** Practice/question screens run calm: `surface-100`'s blue-leaning tint, `brand-blue-600` for the identity accent (header, active tab, selected-answer border), minimal saturated color so nothing competes with the math itself. Reward moments (streak up, level-up, badge earned) are their own full-screen mode built from the `celebration-*` tokens and `Celebration` type group (Baloo 2) — energetic where Practice is quiet. Never bleed one mode's palette into the other; the contrast between them is what makes a celebration feel like one.

**Color means one thing, consistently.** `action-500` is the *only* color used for a primary "go / continue / submit" action, everywhere it appears, and used for nothing else — a learner should recognize "the amber pill = do this next" without reading it. If a color marks something meaningful inside a question (e.g. highlighting the number that matters), no unrelated chrome nearby may reuse that same color for something else.

`action-500` and `celebration-gold-500` are both warm, and that is only safe because they never share a screen: the amber CTA belongs to Practice mode, the gold field to Reward mode. The one place they would meet — a "Continue" button on a celebration screen — is exactly where the button inverts to a white face with an `ink-900` edge instead. Keep that separation or both colors stop meaning anything.

**Bright fills take dark labels.** `action-500` and `celebration-gold-500` carry `action-on`/`ink-900`, never `ink-inverse`. This is not a style call: these are shared phones used outdoors in strong daylight, where dark-on-bright survives glare and washed-out screens that white-on-mid-tone does not. `ink-inverse` is reserved for the genuinely dark fills — `brand-blue-600`, `celebration-coral-600`, `celebration-teal-600`, the skill `-600`s.

**Buttons and tappable chips are pill-shaped** (`radius-pill`) — the one consistent silhouette for anything actionable, no thick outline or comic-panel treatment. Cards use `radius-md`; inputs and answer tiles use `radius-sm`.

**Pressing something has to feel like it landed.** Every pressable control is built as a solid object on a shelf: a `edge-width` border in the control's own darker shade, plus a shelf of `press-depth` (`press-depth-lg` on large targets) in that same shade beneath it. On press the control travels down by exactly the shelf height and the shelf collapses to zero, so the object bottoms out against the page. The travel and the shelf are the same number on purpose — that equality is what reads as a real object rather than a rectangle sliding around. Transitions run 80ms, fast enough to feel like a consequence of the finger rather than an animation playing at you, and `prefers-reduced-motion` drops them to instant without losing the position change, because the position change *is* the feedback. Kill the Android tap-highlight flash (`-webkit-tap-highlight-color: transparent`) and set `touch-action: manipulation` — the press is the feedback, and a 300ms double-tap delay undoes all of it.

That darker edge is doing accessibility work, not just decoration: a bright fill on a pale page clears only about 2:1 on its own, so the `-700`/`-600` border is what makes the control's boundary legible at the 3:1 floor. Never ship a pressable control without it. A disabled control is drawn already-pressed — flat, no shelf, nothing left to push — which says "not now" through shape rather than through a washed-out color alone.

**Skill/topic picker uses pastel-to-saturated color coding**, one hue pair per skill area (`skill-1-100/600` … `skill-4-100/600`) plus a flat icon, so a learner can orient by color and shape before reading the label. These hues are reserved for that purpose — don't reuse them as generic UI chrome, or the picker stops meaning anything at a glance.

**Correct/wrong states are never color-only.** `success-700`/`success-100` pairs with a check glyph, `danger-700`/`danger-100` with an X glyph — the colors are already chosen off the red-green axis for colorblind safety, but the icon is what actually carries the meaning; never ship a state that drops it.

**Every interactive control gets a visible `focus-ring`** — solid, ≥3:1 against whatever surface it lands on. These are often shared or public devices; a focus state that only shows on desktop hover isn't enough.

**Layout for the real device.** Assume a small, low-end Android screen on a patchy connection: buttons are at least 48px tall and every tap target clears 44px, screens are short with one clear next action, and nothing decorative costs bytes without teaching something. `shadow-card` is a one-step, low-blur shadow kept for panels that are *not* pressable — the profile card, modals. Anything pressable gets the solid shelf instead of a blur: it costs a weak GPU nothing, and it reads in sunlight where a soft shadow disappears.

**A personal touch at login, not corporate chrome.** The profile/ID-card moment (name, school/barangay, a chosen icon or color) is where personalization lives — simple and card-like, never a glossy sticker-badge treatment. PIN entry itself stays plain and calm (`surface-300` keys, `radius-sm`), since it's a functional step, not a reward moment.

## Iconography

**The icon set is Phosphor Bold**, subset to the 22 icons in `icons/` and nothing else. Phosphor is MIT licensed. Bold rather than regular because the mark is solid two-tone shapes and every control sits on a solid shelf — a thin-stroke icon reads underweight beside them. Phosphor ships six weights, so the whole set can drop to regular later without changing libraries. Don't introduce a second icon family for anything; if something is missing, take it from Phosphor Bold and add it to the group.

Flat, single-ink vector only — no photography, no complex illustration, no gradients outside Reward mode. This isn't a style preference: it's what stays legible and cheap to render on shared low-end phones over a weak connection. A single-ink icon takes its color from context (a skill card's `-600` token inside its white chip, `action-on` on an amber button, `success-700`/`danger-700` on the answer states, `ink-inverse` on a `brand-blue-600` fill) — never bake color into the icon in code. The files in `icons/` carry a hardcoded `ink-900` only so the tiles are visible there; inline them as one sprite with `currentColor` and let context set the color.

**Operators are type, not icons.** `+ − × ÷ % =` are real characters set in Lexend, so they match the question text exactly, scale with the type tokens, and weigh nothing. Fractions are typography too. An icon of a plus sign is a worse plus sign. Icons carry the things type can't: measurement, balance, money, time, streak, badge, lock, correct and wrong. `add.svg` and `percent.svg` are topic identity for the skill picker, never operators inside a question.

**Ship the subset, never the pack.** All 22 come to roughly 10 KB of raw SVG; inline them in the app shell as one sprite. No icon font, no CDN request — on a patchy Camotes connection that's a blocking request for something that should already be cached.

Money icons stay currency-neutral. `coins.svg` is chosen over anything carrying a `$`, which is the wrong currency and the wrong signal here.

## What is in this project

| path | what |
| --- | --- |
| `readme.md` | this brand book |
| `styles.css` | every token as a CSS custom property, the type styles as classes, and the component styles. Generated from the source `tokens.json` — change it there, not here |
| `bundle.js` | the five components as one classic script, assigning `window.AbanteMinds` |
| `index.d.ts` | component props, as documentation |
| `components/<Name>/index.html` | the live preview card, standalone |
| `components/<Name>/usage.md` | that component's guidelines |
| `icons/*.svg` | the 22-icon Phosphor Bold subset |
| `logo/` | the brand mark |

`components/Colors`, `Type`, `SpacingDepth` and `Icons` are foundation cards: they render the tokens themselves, since tokens have no schema of their own here. Read those before building anything.

Every preview card inlines its own copy of the styles so it renders standalone. That duplication is deliberate and generated — never hand-edit a card's inlined `<style>`. Change `tokens.json` upstream, rebuild, and re-sync.
