# Abante Minds

NCE math practice that works offline. This is an implementation of
[`Abante Minds screens.dc.html`](Abante%20Minds%20screens.dc.html) — the twenty-screen
design document imported from the claude.ai design project *Abante Minds system overview* —
built on that project's own design system, imported unchanged.

**Target:** Grade 6 learners sitting the Philippine Science High School National
Competitive Examination (NCE) on 30 January 2027. The learner follows a path through the
13 topics of `TABLE-OF-SPECIFICATIONS.md`, level by level; decimals, fractions, order of operations, factors, ratio, percentages, time, area, solids, circles, data and probability are
written and the rest are on the path as coming soon. Beside the path, a Basics track drills
the facts under every topic, starting with adding and subtracting and the times tables,
until they come without a calculator. `CLAUDE.md` and `RESEARCH-PLAN.md` hold the decisions and the plan.

Open `index.html` through any static server. There is no build step.

```bash
python devserver.py
```

It binds every interface and prints a LAN address so a phone on the same Wi-Fi can open it.
See [Testing on a phone](#testing-on-a-phone).

## What came from the design project

Imported verbatim, and not edited:

| Path | What it is |
| --- | --- |
| `Abante Minds screens.dc.html` | The design document: 20 screens, plus tablet and desktop treatments |
| `_ds/abante-minds-design-system-.../tokens/*.css` | Colour, type, spacing and depth tokens |
| `_ds/abante-minds-design-system-.../foundations/press.css` | The press mechanic |
| `_ds/abante-minds-design-system-.../styles.css` | The import entry point |
| `motion/motion.css`, `motion/motion.js` | The motion foundation |
| `support.js` | The design-canvas runtime the `.dc.html` is authored against |

`assets/` is the exception. `DesignSync.get_file` caps a read at 256 KiB, so the brand mark
came back truncated at 38% of its pixel data — no `IEND`, and only the top of the artwork
rendered. The full file was taken from the source kit already on disk at
`abante-minds-claude-design/abante-minds-claude-design/logo/abante-minds-mark.png` and downscaled to 512x512 (93 KB
rather than 693 KB, and still 3x for the 104px box the splash gives it).
`assets/abante-minds-maskable.png` is derived from it: Android crops a maskable icon to a
circle, so the art sits inside a 60% safe zone on `--surface-100` instead of bleeding to a
transparent edge.

The design document is kept as the specification. It needs the canvas host to render its
live React components, so it is a reference to read rather than a page to open; the
components it imports are reimplemented natively in `app/ui.js`.

## What was built

| File | Responsibility |
| --- | --- |
| `index.html` | Shell. Loads the design system, then the app |
| `app/icons.js` | The 22-glyph Phosphor Bold subset from the design system |
| `app/ui.js` | The design system components as DOM builders, plus the patterns the system deliberately left out (answer tile, keypad, nav) |
| `app/content.js` | The question engine |
| `app/entry.js` | What each keypad key does to the answer boxes |
| `app/facts.js` | Which facts a Basics round asks, and when a missed one comes back |
| `content/packs/` | The questions, as JSON |
| `app/store.js` | Learner state: progress level by level, Basics facts mastered, the streak |
| `app/screens.js` | One builder per route |
| `app/app.js` | Shell slots, router, practice loop, keyboard |
| `app/app.css` | Shell layout and the three width rules |
| `sw.js`, `manifest.webmanifest` | Install to home screen, and a full session with no signal |

### Screens to routes

The document draws twenty frames. Several of them are one screen in two states — home is
drawn four times because it has a first-run state, a returning state, an offline banner and
a sync banner — so the twenty frames land on eleven routes. Frame 19, the sync banner, is
deliberately not built: the app sends nothing, so there is nothing to report as syncing.

| Frames | Route |
| --- | --- |
| 1 | `splash` |
| 2 | `signin` |
| 3 / 3b | `recover`, `recoverSent` |
| 4 | `setup` |
| 5, 6, 17 | `home` |
| 7, 8 | `topics` |
| 9, 10, 11, 12, 13, 18 | `practice` |
| 14 | `levelup` |
| 16 | `summary` |
| 20 | `profile` |

The path changed what some frames show: Home leads with the next level and the countdown
to the exam rather than a tier ladder, Topics is the whole path, frame 14 celebrates a
cleared level rather than a tier, and frame 15, the demotion card, is gone with tiers.

Routes not in the document: `topic` (a topic's levels), `lesson` (the cards that open a
level), `basics` and `basicsTopic` (the Basics track and one of its topics), `installSteps` (how to add the app to the home screen in a browser that cannot do
it in one tap) and `loadFailed` (shown if the question pack cannot load).

### The questions

Eighty hand-written items would be exhausted in a week, and a fixed bank can be memorised,
so each topic is a set of question types, kept as data in `content/packs/`. A type draws
fresh numbers for every question, harder as the learner gets further through the level,
and can present the same problem in more than one format. The three hints and three worked steps are derived from
the same numbers, so every question arrives with a real scaffold rather than generic
advice.

Each type also names the mistakes it expects. A wrong answer that matches one gets that
mistake's own explanation; any other wrong answer is told plainly to start from the first
step, rather than given a guess about what went wrong.

Writing a pack: `content/packs/README.md`.

### Progression

- The path runs through the 13 topics in a set order: decimals, fractions, order of
  operations, factors, ratio, percentages, time, area, solids, circles, data, probability,
  transformations. Any written topic can be opened; the next one is marked.
- Each topic splits into levels that follow its competencies. A level opens with a short
  lesson the first time and clears at 8 answers right first time; a retry, or redoing a
  missed question after seeing its solution, does not count. Clearing a level opens the
  next, and the level-cleared takeover is the only gold field in the product.
- The numbers get harder as a level fills, and hardest when reviewing a cleared level.
- Home counts down to 30 January and shows the share of the blueprint's competencies the
  cleared levels cover.
- A missed day resets the streak and nothing else.

### Basics

Beside the path, open at any time and never counted on it: the facts and methods under
every topic, so a learner can work without a calculator. Written so far:

- **Add and subtract**: 158 facts in five groups (small sums, make 10, doubles and near
  doubles, adding 10, bridging through 10), which between them hold every sum of two
  numbers from 1 to 10 exactly once and the take-aways that undo them; then two practice
  levels of two-digit adding and taking away in your head (tens then ones, round and
  adjust, counting up when the numbers are close).
- **Times tables**: 180 facts (66 times facts from 2 × 2 to 12 × 12, and their divide
  facts) in five groups.
- **Mental math**: six practice levels: times and divide by 10, 100 and 1000; double and
  halve; times 5, 9 and 11; split and multiply; divide in your head; and estimate to
  check an answer.
- **Pen and paper**: four practice levels: column adding with carrying, column taking
  away with borrowing (across a zero too), long multiplication, and long division by
  chunks, with remainders. Each worked step is one column, so a learner sees where the
  carry or the borrow happens.
- **Missing numbers**: six practice levels, the step towards algebra: a missing number in
  adding, taking away, times and divide; letters for numbers (4n = 24); two-step
  equations undone in reverse; number machines and tables; and number patterns, up to
  the 100th number.

The facts topics each have a review level of all their facts.

- A facts level is practised fact by fact, in rounds of 20. A fact is **mastered when it
  is right in under 4 seconds, without a hint, on two different days**. A miss sends it
  back to be learnt again, mastered or not, and it comes back later in the same round, so
  the course is always worth repeating.
- A round asks first the facts being learnt, then a few new ones (at most 6), and always a
  few mastered ones, so a fact that has slipped is caught.
- Each group opens with strategy cards (turn it round, double and double again, times 10
  then halve, make 10 first) and a worked example. The times and addition tables fill in
  as facts are mastered.
- A right fact moves on by itself after a moment; a wrong one shows its answer and every
  step, with no second try on the spot.

### Offline

The service worker precaches the shell and serves it stale-while-revalidate, so a cold
start with no signal still opens the app. Answers given offline count immediately, so levels
clear whether or not there is signal. Nothing is sent anywhere, so there is nothing to sync.

Learner state lives in `localStorage` and never leaves the device.

### Adding to the home screen

The splash offers it first. After sign-in it stays on offer: a card on Home, which "Not
now" (the corner ×) removes for good, and a button on Profile that stays until the app is
installed. Where the browser can install in one tap it does; where it cannot, such as
iPhone Safari, the offer opens three short steps for that browser.

The app counts as installed only on evidence: the browser reporting the install, or the
app running from the home screen. Tapping the button is not evidence, and a removed
install is noticed when the browser offers to install again.

## Testing on a phone

`python devserver.py` binds every interface and prints its own LAN URL. Open that on a
phone on the same Wi-Fi — no pairing, no tunnel.

Two things tend to get in the way:

**The firewall.** On Windows, a Wi-Fi network classed as Public blocks inbound connections,
and a dismissed Windows prompt can leave a standing *block* rule for `python.exe`. A block
rule beats an allow rule, so check for one and disable it as well as opening the port. In
an elevated PowerShell:

```powershell
Get-NetFirewallRule -DisplayName 'python.exe' -Direction Inbound | Where-Object { $_.Action -eq 'Block' } | Disable-NetFirewallRule
New-NetFirewallRule -DisplayName 'Abante Minds dev (5176)' -Direction Inbound -Protocol TCP -LocalPort 5176 -Action Allow -Profile Public
```

That exposes the server to everyone on that Wi-Fi for as long as it runs, so undo it after:

```powershell
Remove-NetFirewallRule -DisplayName 'Abante Minds dev (5176)'
Get-NetFirewallRule -DisplayName 'python.exe' -Direction Inbound | Enable-NetFirewallRule
```

**No service worker over plain HTTP.** A LAN address is an insecure origin, so
`navigator.serviceWorker` is undefined, offline caching is off and the browser will not
offer to install the app. The practice loop, progress and `localStorage` all work normally;
only the install and offline-launch behaviour is missing. To exercise those on the phone,
add the origin to Chrome's insecure-origin allowlist at
`chrome://flags/#unsafely-treat-insecure-origin-as-secure`, or serve over HTTPS.

If the phone still cannot reach the address after that, check for a VPN or a secure-DNS
client (Cloudflare WARP and similar) and pause it.

## Responsive

The gutter steps 24 → 32 → 48. The reading column caps at 720 on phone and tablet; on
desktop the cap moves to the cards so the extra width becomes a second column rather than
a longer line. Tap targets stay at 48 everywhere. The bottom-anchored action is a
thumb-reach rule, so it survives on tablet and becomes an inline action on desktop, where
the bottom nav turns into a left rail and the keypad moves beside the answer field.

Content scrolls inside the screen, between the status bar and the anchored keypad, action
and nav, so those never move under a thumb. The content never shrinks below 200px; only on
a phone too short for that, such as a 360x640 phone with hints open, does the whole page
scroll.

## Tests

```bash
node tests/engine.js
node tests/entry.js
node tests/facts.js
node tests/progress.js
node tests/validate-packs.js
node tests/fuzz.js
node tests/invariants.js
```

`tests/engine.js` pins the engine's behaviour to small examples: exact arithmetic, the
expression language and its limits, formats, tiers, constraints, and how a wrong answer is
diagnosed.

`tests/entry.js` pins what each keypad key does to the answer: digits and the decimal
point for a number, the Next key and the boxes for a fraction or mixed number.

`tests/facts.js` pins the Basics drill: which facts a round asks, in what order, and when
a missed one comes back.

`tests/progress.js` pins the path's rules: what clears a level, what opens the next, what
counts as right first time, and how an older saved record is carried over. It also pins
Basics mastery: right and quick on two days, lost on a miss, and never moving the path.

`tests/validate-packs.js` checks every pack against its schema and the blueprint, then
generates every template at every tier and checks what a learner would be shown. Every
Basics fact is checked in every one of its formats, and every cell of the times-table grid
against the fact it holds.

`tests/fuzz.js` builds whole sessions for every level at every tier (600 seeds each, over a
million questions), and plays Basics rounds for learners at every stage. It fails if any
question can produce a negative answer or one too long for the keypad, an incomplete
scaffold, a hint with an unfollowable number, a negative number anywhere in its words, "a"
before a number read with a vowel sound ("a 8 m ribbon"), a broken multiple choice, an answer the checker rejects, or a named mistake that does not
bring back its own feedback.
The app is offline, so a bad question cannot be hotfixed on a phone that has already
installed it; these are the guard.

`tests/invariants.js` checks the repository rules that would otherwise fail silently: every
precached path exists, everything the page loads is precached, every question-pack file is
precached, `.nojekyll` is present, and no shipped file contains a third-party URL. All of
them run in CI on every pull request.

`poc/` holds proofs for features that are designed but not built, the progress code and the
language ladder. They are not loaded by the app.

## Notes for reviewing

- The offline screens respond to real connectivity. To reach them without pulling the
  plug, load the app with `#offline`, or run `AM.store.setOffline(true)` in the console.
- `AM.store.reset()` clears the learner and returns the app to the splash screen.
- `AM.store.set({ installed: false, installCardDismissed: false })` brings the install
  offer back on Home and Profile.
- On desktop the answer field also takes the hardware keyboard: digits, `.`, backspace,
  and Enter to check.
