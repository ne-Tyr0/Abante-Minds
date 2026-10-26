# Abante Minds

NCE math practice that works offline. This is an implementation of
[`Abante Minds screens.dc.html`](Abante%20Minds%20screens.dc.html) — the twenty-screen
design document imported from the claude.ai design project *Abante Minds system overview* —
built on that project's own design system, imported unchanged.

**Target:** Grade 6 learners sitting the Philippine Science High School National
Competitive Examination (NCE) on 30 January 2027. The learner follows a path through the
13 topics of `TABLE-OF-SPECIFICATIONS.md`, level by level; decimals, fractions, order of operations, factors, ratio, percentages, time, area, solids, circles, data, probability and
transformations are all written. Beside the path, a Basics track drills
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
circle, so the art sits inside a 60% safe zone on white instead of bleeding to a transparent
edge. `assets/abante-minds-apple-touch.png` (180x180) is the iPhone home-screen icon: iOS
draws a transparent icon on black, so it is the mark at 72% on white. A phone keeps the icon
it was installed with; to see a new one, remove the app from the home screen and add it again.

The design document is kept as the specification. It needs the canvas host to render its
live React components, so it is a reference to read rather than a page to open; the
components it imports are reimplemented natively in `app/ui.js`.

## What was built

| File | Responsibility |
| --- | --- |
| `index.html` | Shell. Loads the design system, then the app |
| `app/icons.js` | The 22-glyph Phosphor Bold subset from the design system, and a drawn icon for each topic and Basics topic, in two tones of the topic's colour |
| `app/ui.js` | The design system components as DOM builders, plus the patterns the system deliberately left out (answer tile, keypad, nav) |
| `app/badgeart.js` | The badges, drawn: topic hexagons, Basics tokens, special badges |
| `app/content.js` | The question engine |
| `app/entry.js` | What each keypad key does to the answer boxes |
| `app/facts.js` | Which facts a Basics round asks, and when a missed one comes back |
| `content/packs/` | The questions, as JSON |
| `app/store.js` | Learner state: progress level by level, Basics facts mastered, the streak |
| `app/screens.js` | One builder per route |
| `app/app.js` | Shell slots, router, practice loop, keyboard |
| `app/app.css` | Shell layout, the three width rules, the seven topic colours, and how the celebrations look at rest |
| `motion/motion.js` | Press, fills, screen and question transitions, vibration |
| `motion/moments.js` | The combo, the level-up and the daily streak: a skippable timeline, confetti, the flame |
| `motion/sound.js` | Every sound, made on the phone: kulintang gong-chimes |
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
level), `basics` and `basicsTopic` (the Basics track and one of its topics), `examIntro`, `exam` and `examResult`
(the practice exam), `installSteps` (how to add the app to the home screen in a browser that cannot do
it in one tap), `badges` (the badge collection), `streak` (the day's streak, after the first session
finished that day) and `loadFailed` (shown if the question pack cannot load).

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
  next, and the level-cleared takeover is the only gold screen in the product.
- The numbers get harder as a level fills, and hardest when reviewing a cleared level. Within a
  round they also follow the learner: three first tries right in a row step one tier harder, and
  a first try wrong steps one back, never below the level's own floor and at most two above it.
  It rises one tier at a time, even when the floor rises on the same answer.
  The next question is drawn again at the new tier from the same recipe, so the attempt log
  still rebuilds exactly what was asked.
- Each topic has its own colour, one of seven, so no two topics side by side on the path or
  in Basics match; its tile, bars, path and badges all wear it, and its icon is drawn in two
  tones of it. None of the seven is a colour the app keeps for something else (amber for the
  main action, gold for rewards, teal and coral for right and wrong).
- Home counts down to 30 January and shows the share of the blueprint's competencies the
  cleared levels cover.
- A missed day resets the streak and nothing else.
- A round can be left at any question, from the X in its header or the phone's Back button,
  and both ask first. What it got right is kept. A level whose round was left can no longer
  earn a shiny badge, so leaving before a hard question is not a way to stay perfect, and
  the question says so only when there is still a shiny badge to lose. A practice exam left
  is not scored. Leaving on the last question, already answered, is finishing.
- The phone's Back button goes back inside the app, closing an open sheet first; on Home it
  leaves the app.

### Celebrations and badges

- **Every level is a badge**, 90 in all: each level on the path and each practice or facts
  level in Basics. A topic's badges are one hexagon in its colour that improves level by
  level. The rim has a segment per level and lights one more each time; laurels arrive at
  halfway, then a star, a gem, and at the last level a crown and a gold edge. Basics earn round
  tokens. A badge is shiny when its level was cleared with every first try right and no round
  of it left partway. Names come from one ladder, Starter to Master.
- **Special badges**: streaks of 3, 7, 14 and 30 days, practice exams at 60, 75 and 90 per cent,
  Improver (five missed questions put right in review) and Welcome back (practising again after
  three or more days away). A badge is never taken away.
- Badges began after levels did. The first time the app counts them, it awards what a learner
  had already earned, marked as earned before badges began, with no celebration.
- **The combo**: two right in a row shows a chip with an unlit flame, three lights it, every
  fifth turns it gold for a moment. A broken run of three or more goes out.
- **The level-up**, about seven seconds and skippable with a tap: gold rises; the badge turns
  over from grey into colour and gains what this level adds; the share right first time fills
  a ring; the learner's marker walks to the level that opens.
- **The daily streak**: after the first session finished each day, the flame lights and the
  count rolls on.
- **Settings** on Profile: Sound, Vibration and Calm animations. Calm, or a phone set to reduce
  motion, shows every celebration's end straight away, with no confetti or movement.
- Sounds are made on the phone with Web Audio in the voice of the kulintang, so there is
  nothing to download. Practice exams have no celebration until their result.
- **Every press** goes down at the touch, stays down long enough to be seen even on a quick
  tap, and springs back a pixel past rest, with a soft tap sound. A tap that redraws its own
  screen (a key, a choice) springs back the button that replaced the one pressed.

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
- **Fractions and per cents**: 57 facts in three groups (halves, quarters and tenths;
  fifths, twentieths and fiftieths; eighths): each fraction as a decimal and as a per cent,
  and each per cent back as a fraction in lowest terms, so 3/4, 0.75 and 75% are the same
  thing at a glance.
- **Squares and cubes**: 38 facts: the squares to 15 × 15, the cubes of 2 to 5 and 10, and
  the other way round (which number times itself makes 169?).

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

### Practice exam

A rehearsal of the real paper, opened from a card on Home.
- **20 questions in 30 minutes**, drawn from all 13 topics in proportion to the blueprint's
  weights: each topic gets the whole part of its share, and the questions left go to the
  largest remainders, so decimals get 3 and time gets 1.
- **No hints, and no right or wrong until the end**, as in the exam. A question can be
  skipped; when the clock runs out, the exam ends where it stands.
- **The results** give the score, the time taken, each topic, and every question with the
  learner's answer, the right one, and the working for a miss.
- **Kept apart from the path and Basics**: an exam never clears a level or masters a fact.
  It keeps the streak, and Home shows the last and the best score.

### Spaced review

A question missed on its first try, on the path or in a practice exam, comes back to be
tried again: a day later, then 3 days after that, then 7, and then it is done. A miss sends
it back to the next day. It comes back as the same question, rebuilt from its seed. Home
shows a Review card when questions are due, and a review session takes up to 10 of them,
the longest waiting first. Reviews keep the streak and never move the path.

### Kinds of problem

Every template is tagged with the kind of problem it is (change, comparing, equal groups,
working backwards, setting aside extra information...). Profile shows, from the learner's
own first tries on the path and in practice exams, how each kind goes, once it has been
met five times, and names the strongest and the one needing practice when they are at
least 20 points apart. The same sums in different stories, told apart.

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
node tests/insights.js
node tests/progress.js
node tests/validate-packs.js
node tests/fuzz.js
node tests/item-spec.js
node tests/replay.js
node tests/invariants.js
```

`tests/engine.js` pins the engine's behaviour to small examples: exact arithmetic, the
expression language and its limits, formats, tiers, constraints, and how a wrong answer is
diagnosed.

`tests/entry.js` pins what each keypad key does to the answer: digits and the decimal
point for a number, the Next key and the boxes for a fraction or mixed number.

`tests/facts.js` pins the Basics drill: which facts a round asks, in what order, and when
a missed one comes back.

`tests/insights.js` pins the strengths and gaps on Profile: which answers count (a first
try on the path or in a practice exam), how each kind of problem is tallied, and when the
strongest and the weakest are named.

`tests/progress.js` pins the path's rules: what clears a level, what opens the next, what
counts as right first time, and how an older saved record is carried over. It also pins
Basics mastery: right and quick on two days, lost on a miss, and never moving the path; the
badges (when each is earned, shiny, never taken away, and how progress from before badges is
counted once); leaving a round (its answers kept, its level no longer shiny, and what the
learner is told before leaving); the settings; and the participant code on every logged answer, whose check
character catches any one character copied wrong.

`tests/validate-packs.js` checks every pack against its schema and the blueprint, then
generates every template at every tier and checks what a learner would be shown. Every
Basics fact is checked in every one of its formats, and every cell of the times-table grid
against the fact it holds.

`tests/fuzz.js` builds whole sessions for every level at every tier (600 seeds each, over a
million questions), and plays Basics rounds for learners at every stage. It fails if any
question can produce a negative answer or one too long for the keypad, an incomplete
scaffold, a hint with an unfollowable number, a negative number anywhere in its words, "a"
before a number read with a vowel sound ("a 8 m ribbon"), two full stops in a row ("9:30
p.m.."), a count of one read with a plural ("1 squares"), a time answer that is not on the clock, a broken multiple choice, an answer the
checker rejects, or a named mistake that does not bring back its own feedback. It reads a
question's chart too.
The app is offline, so a bad question cannot be hotfixed on a phone that has already
installed it; these are the guard.

`ITEM-SPECIFICATIONS.md` describes every template: the competency it serves, its construct
and schema, the answer, what it draws at each tier, the mistakes it names, and an example
drawn by the engine. `node tools/item-spec.js` writes it from the packs, and CI fails while
the file and the packs disagree, so it can be cited as the instrument. `--csv` prints the
same as one row per template, for a spreadsheet or a panel of expert raters.
`tests/item-spec.js` pins what the generator says.

`node tools/replay.js attempts.json` reprints the questions in an attempt log (the app keeps
it under `abante-minds/attempts`, each row with the learner's pseudonymous participant code)
exactly as they were asked: each row is rebuilt from its
template, tier and seed, or its Basics fact, by the same engine, with the answer given and
the mistake it matched. A row asked with another pack version, in another format, or that
the rebuilt question would mark differently is flagged. `--csv` gives one row per attempt.
`tests/replay.js` pins it.

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
