# Abante Minds

Offline-first practice for the **Philippine Science High School System National Competitive
Examination (NCE)**, taken by **Grade 6** learners for admission to Grade 7. Vanilla JS PWA,
no build step, no backend. Implements `Abante Minds screens.dc.html`, the design spec
imported from the claude.ai design project.

**Next sitting: 30 January 2027.** The exam is dated, so the app is countdown-shaped, not
open-ended.

## Who the learner is

Not a struggling learner. To sit the NCE a Grade 6 pupil needs ≥85% in Grade 5 Science and
Maths, or evidence of being in the top 10% of their batch. For the 2026 intake, 27,965
applied and 1,738 qualified against 1,920 slots, at a national mean of 84.50%. These
learners need **depth, unusual problem structures and speed**, not remediation.

Two consequences that are easy to forget:

- Items pitched at "make change from a ₱100 bill" are below this audience.
- The exam is timed and competitive, so **speed is part of the construct**. Latency is a
  learner-facing concern, not only a logged variable.

## Commands

```bash
python devserver.py            # static server with no-store caching; also prints a LAN URL
node tests/engine.js           # question-engine unit tests; exits 1 on any failure
node tests/entry.js            # what each keypad key does to the answer boxes
node tests/progress.js         # the path's rules: clearing, unlocking, first tries
node tests/validate-packs.js   # every question pack against the schema and the blueprint
node tests/fuzz.js             # 160,000 generated questions; exits 1 on any violation
node poc/progress-code.js      # proves the backup-code codec; exits 1 if a claim fails
node tests/invariants.js       # repo rules that fail silently at runtime; exits 1 on any
node tests/cache-bump.js main  # did a precached file change without a CACHE bump?
```

All of these run in CI (`.github/workflows/ci.yml`) on every pull request to `main`, and
all but the cache-bump check run again on every push to it. A push to `main` deploys to
the live site, so work goes on a branch, through a pull request, and merges only when CI is
green.

Run `tests/engine.js`, `tests/validate-packs.js` and `tests/fuzz.js` before committing any
change to `app/content.js` or `content/packs/`. The fuzz has caught two shipped bugs: a
question whose answer was negative (the keypad has no minus key, so it was unanswerable)
and a hint telling learners to "break 9 into 10 and -1". Testing the validator caught a
third before it shipped: a pinned item on a template with more than one format crashed.

`tests/mutation/` breaks the engine, the entry rules, the facts drill, the progress rules
and the packs one way at a time and requires the tests to fail: `node tests/mutation/engine.js`,
`entry.js`, `facts.js`, `progress.js`, `validator.js` (the last takes a few minutes; `MUTANT=<name>` runs one). Not in CI. Run them when you add a rule, and add a
mutant for it, so a test that can never fail does not pass for one.

## Layout

| Path | What |
|---|---|
| `app/content.js` | The question engine: installs a pack, draws numbers, renders questions and their charts, checks answers and names mistakes. Expressions are parsed, never `eval`'d, and computed in exact fractions. No questions live in code |
| `app/entry.js` | What each keypad key does to the answer: one box for a number, numerator over denominator for a fraction, a whole number beside them for a mixed number |
| `app/facts.js` | The Basics drill: which facts a round asks, and where a missed one comes back. Pure, like `entry.js`; mastery itself is the store's |
| `content/packs/<subtest>/` | The questions, as JSON. `manifest.json` is the path: all 13 blueprint topics in order, the unwritten ones marked `comingSoon`. One file per written topic holds its levels, lessons and templates. Written so far: decimals, fractions, order of operations, factors, ratio, percentages, area, solids, circles, data, probability. The manifest's `basics` lists the Basics topics; written so far: adding and subtracting (`add-subtract.json`), the times tables (`times.json`), mental math (`mental.json`), pen-and-paper methods (`written.json`) and missing-number algebra (`missing.json`). How to write one: `content/packs/README.md` |
| `content/blueprint.json` | The table of specifications as data. The validator checks every template's competency, domain, schema and answer type against it |
| `app/store.js` | All learner state, in `localStorage`: progress level by level, each Basics fact, the streak |
| `app/screens.js` | One builder per route |
| `app/app.js` | Shell slots, router, practice loop, keyboard |
| `app/ui.js` | Design-system components as DOM builders, and the chart a question can carry (`AM.Chart`: bar, line and pie graphs in SVG, and tables) |
| `_ds/`, `motion/` | Vendored design system and motion layer. Do not edit; they come from the design project |
| `poc/` | Proofs for features not yet built. Not shipped, not loaded by the app |
| `tools/overview-pdf/` | Builds the teacher overview PDF from real screenshots. Its copy predates the retarget, so `build.py` refuses to run until it is rewritten |
| `abante-minds-claude-design/` | Original design kit; source of the brand mark |
| `RESEARCH-PLAN.md` | The ordered build plan: content rebuild, research instrumentation, citability. Read it before starting anything below |

## Decisions already made

Settled with the project owner. Build on them; don't reopen them.

- **A solo practice app that a teacher recommends**, not a classroom tool. No teacher
  dashboard.
- **Four subtests eventually, maths first.** The NCE tests maths, science, verbal ability
  and abstract reasoning, and ranks candidates across all four. Only maths gets built now,
  but **the content-pack schema and the navigation are designed for four subtests from the
  start** so expanding is not a retrofit.
- **The blueprint is curriculum-derived, and must be labelled that way.** PSHS publishes no
  table of specifications. Ours is built from the official MATATAG Grade 6 mathematics
  curriculum — content domains Number and Algebra, Measurement and Geometry, Data and
  Probability. We have no past papers, so the blueprint will under-represent the
  above-level items the NCE is known for. Never present it as official.
- **Local-first, not local-only.** *This reverses the earlier "no backend, no analytics,
  permanently" decision, narrowly:* **opt-in, off by default, anonymous aggregate
  telemetry**, batched weekly. No accounts. No per-learner data on any server, ever.
- **Two data paths, two holders.** Per-learner research data is exported by explicit
  consent **directly to the researcher**, who holds the name-to-code key under their own
  institution's ethics clearance. We hold only aggregate anonymous counts. We never hold a
  file linking a child's name to her scores.
- **PIN login is to be removed**, replaced by local profiles: a name and a colour, no
  password. Siblings share phones, so profiles stay; authentication goes. Now also
  research-critical — a participant's data must not contain a sibling's attempts.
- **Progress moves as a 20-character code or a QR.** No server, no password. The code
  doubles as a backup. Codec proven in `poc/progress-code.js`.
- **Teachers see progress by scanning a learner's QR** into a class list stored on the
  teacher's own phone.
- **Content authoring: Claude drafts, the owner reviews and corrects.** A validator has to
  gate every pack, because generated items at volume will otherwise ship something wrong.
- **Language ladder**: mother tongue towards NCE English, driven by tier, with a
  one-question override that never changes the tier. Maths vocabulary is never translated.
  Tagalog and Cebuano first. Structure in `poc/language-ladder.js`.
- **Hosting is GitHub Pages.**
- **Adding to the home screen is on offer at any time until installed**: on the splash,
  as a Home card whose "Not now" removes it for good, and as a button on Profile that
  stays. Where the browser cannot install in one tap, the offer shows the steps instead.
- **Progression is a path of levels** (decided 2026-10-10). The topics run in a set order;
  each topic splits into levels that follow its competencies, and clearing a level unlocks
  the next. Home shows the days left to 30 January and how much of the blueprint is
  cleared. This replaces the tier ladder and "20 correct per topic".
- **Each new level opens with a short lesson**: two or three screens with a worked
  example, before any practice. Fuller for what is not taught by exam day (GCF and LCM,
  the area of a circle).
- **The 13 blueprint topics replace the placeholders as they are built.** Done for the
  switch: the placeholders are gone and the path holds all 13, unwritten ones as coming
  soon. Progress from the tier model was reset; name, install state and streak were kept.
- **A level clears at 8 answers right first time.** Retries and redoing missed questions
  never count. Every written topic is open; levels unlock in order within a topic. The
  missed-day demotion went with tiers: a missed day now resets only the streak.
- **Fractions are typed into boxes, and their form counts.** The right amount not in
  lowest terms, or not as a mixed number where one is asked for, is named as its own
  mistake rather than marked right: NCE options are written in lowest terms.
- **A Basics track sits beside the path** (decided 2026-10-10): the facts and methods
  under every topic, so a learner can calculate without a calculator. Always open,
  repeatable, never locks or unlocks the path, never counts towards blueprint coverage.
  Scope: times tables and divide facts, adding and subtracting, mental math strategies,
  pen-and-paper methods, and missing-number algebra.
- **A Basics fact is mastered when it is right and quick (under 4 seconds, no hint) on two
  different days.** A miss sends it back, mastered or not. A slow right answer is practice,
  not mastery.
- **Basics teach understanding first**: each group opens with strategy cards (arrays and
  turning round, doubling, times 10 then halve, the 9s check), and the times table is
  shown as a grid that fills in as facts are mastered.

## Next, in order

`RESEARCH-PLAN.md` holds the full ordered plan. The near-term items, in sequence:

1. ~~Draft the table of specifications.~~ **Done** — `TABLE-OF-SPECIFICATIONS.md` and
   `content/blueprint.json`. 101 MATATAG competencies (Grades 5 and 6), 13 topics, 143
   templates targeted. **Read these before authoring any content.**
2. ~~Delete the fake sync.~~ **Done.** `startSync`, `isSyncing`, `syncRatio` and
   `pendingAnswers` are gone, along with the sync banner and the "answers held on this
   phone" note. `isOnline()` stays: offline is real and the app says so honestly.
3. ~~Self-host the fonts.~~ **Done.** Four variable woff2 files in `assets/fonts/` (132 KB),
   `@font-face` rules in `app/fonts.css`, and `index.html` now lists the `_ds` token files
   individually, skipping `tokens/fonts.css`. `_ds/` is untouched. **The app now makes no
   third-party request at all.**
4. ~~**JSON content packs**.~~ **Done** — `content/packs/math/`, read by `app/content.js`.
   A template is a question *type*: fresh numbers per tier, one or more formats, and named
   mistakes that each carry their own feedback, so there is no fixed bank to memorise.
   `tests/validate-packs.js` gates every pack. Authoring guide: `content/packs/README.md`.
5. **Rebuild answer input.** **Partly done** — fractions and mixed numbers (typed into
   boxes, checked for lowest terms and mixed form), decimals to 4 places, and numbers with
   a %, a unit or π after them. Still to do, each when the topic that needs it is built:
   repeating decimals, exponents, ratio pairs and clock times. **Not negatives** — signed
   numbers are Grade 7 in MATATAG and absent from the blueprint.
6. **Attempt log**: timestamps, seeds, latency, hint depth, pack version.
7. ~~**Enable GitHub Pages**.~~ **Done** — live at https://ne-tyr0.github.io/Abante-Minds/.
8. **Test on a real low-end Android** through the Pages URL. A plain-HTTP LAN address can't
   register the service worker, so install and offline only work on the HTTPS URL.
9. ~~**CI**.~~ **Done** — `.github/workflows/ci.yml` runs the engine, entry, facts and
   progress tests, the pack validator, the fuzz, the codec proof, `tests/invariants.js` and, on
   pull requests, `tests/cache-bump.js`.

10. ~~**The path of levels**.~~ **Done** — replaces tiers: levels per topic, lessons,
    the countdown and blueprint coverage on Home (`RESEARCH-PLAN.md` item 15).
11. **Write the remaining 2 topics**, in path order: time, transformations.
    Written: decimals, fractions, order of operations, factors, ratio, percentages, area, solids, circles, data, probability. Each topic needs its answer input first where it uses a
    type not yet typeable.
12. ~~**Basics**.~~ **Done** — five topics beside the path: adding and subtracting (158
    facts and two practice levels), the times tables (180 facts), mental math (six
    practice levels), pen-and-paper methods (four) and missing-number algebra (six).

Then research instrumentation (Phase 3) and citability (Phase 4), in `RESEARCH-PLAN.md`.

**Parked:** the other three subtests. The language ladder — there are no native reviewers
yet, and an unreviewed pack teaches the wrong thing with confidence. Do not ship the
placeholder strings in `poc/`.

## Releasing

Change `CACHE` in `sw.js` whenever a precached file changes. Installed phones keep the old
copies until `sw.js` itself changes. CI enforces this on pull requests
(`tests/cache-bump.js`). The question packs are precached too, so a pack edit needs the
bump, and a new pack file must be added to `SHELL` (`tests/invariants.js` fails if not).

Hosted at **https://ne-tyr0.github.io/Abante-Minds/**, built from `main` at the repo root.

**Never delete `.nojekyll`.** GitHub Pages runs Jekyll by default, and Jekyll silently drops
every path beginning with an underscore — which is the whole of `_ds/`. Without that file the
site builds and returns 200 for `index.html` while every design-system token 404s, so the app
loads completely unstyled. It is an empty file at the repo root and it is the only thing
keeping the vendored design system on the live site.

## Gotchas

- **Do not reintroduce a sync indicator without a real request behind it.** The app once
  shipped a `startSync()` that animated a progress bar and sent nothing; a teacher watching
  it would reasonably believe data was uploaded. It is gone. `app/store.js` carries a note
  at the top saying so. When opt-in telemetry lands, the indicator comes back only with an
  actual request underneath.
- **Fonts: both subsets are needed, and π is missing.** ₱ (U+20B1) is in `latin-ext`, not
  `latin`, so both Lexend files are preloaded. π (U+03C0) is in neither subset and will fall
  back to a system face — it is needed by the blueprint's `circles` topic. See the note in
  `app/fonts.css`.
- **The keypad takes numbers and fractions, nothing else yet**: seven characters and one
  decimal point for a number, three digits per box for a fraction. An answer that is a
  repeating decimal, an exponent, a ratio pair or a clock time is still unanswerable. The
  validator refuses those answer types until their input exists, and it and the fuzz check
  every typed answer fits, reading the limits from `app/entry.js`.
- **`factors` and `circles` are not taught before the exam.** GCF and LCM are Grade 6
  Quarter 4; area of a circle likewise. The exam is 30 January, about four weeks into
  Term 3. For these topics the app **teaches**, and cannot assume a classroom went first.
  Reviewers emphasise factors heavily, so this is where a learner gets blindsided.
- **The learner population is self-selected and high-achieving.** Nothing measured here
  generalises to all Grade 6 learners. Any study using the app must disclose it.
- `C:\Users\tire0` is itself a git repository, pointed at an unrelated project. This folder
  has its own `.git`, which takes precedence, but confirm `git rev-parse --show-toplevel`
  is this folder before committing.
- `.claude/worktrees/abante-minds-screens-9c5311/` is a stale copy of the code from an
  earlier session, attached to that home-directory repo. It is gitignored. Don't edit it.
- **Service workers can't be tested in the Claude desktop browser pane against a dev server
  started from a shell.** The page loads, but the pane never delivers the worker's script
  request to the server, so registration fails with *An unknown error occurred when fetching
  the script*. That is not an app bug: the live site registers and precaches all 29 files.
  Check offline behaviour on https://ne-tyr0.github.io/Abante-Minds/ or in a normal browser.
  A server started through the pane's own preview tool does register: on 2026-10-01 it
  precached all 29 files and served the pack with the server's copy removed.
- The service worker serves from cache first. During development use `devserver.py`, or
  clear site data, or an edit will look as if it did nothing.
- **On iPhone, a home-screen web app is expected to keep its own storage, apart from
  Safari's.** If so, progress made in a Safari tab does not follow the learner into the
  installed app, which starts fresh. Not yet confirmed on a real iPhone. The progress code
  (`poc/progress-code.js`) is the bridge once it is built.
- **Anything that drives the app from outside waits for `AM.app.ready`.** The first screen
  waits for the question pack, so driving the app sooner gets overwritten when it lands.
  `tools/overview-pdf/shots.html` does this.
