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
node tests/fuzz.js             # 160,000 generated questions; exits 1 on any violation
node poc/progress-code.js      # proves the backup-code codec; exits 1 if a claim fails
```

Run `tests/fuzz.js` before committing any change to `app/content.js`. It has caught two
shipped bugs: a question whose answer was negative (the keypad has no minus key, so it was
unanswerable) and a hint telling learners to "break 9 into 10 and -1".

## Layout

| Path | What |
|---|---|
| `app/content.js` | Question generators: 4 topics x 5 templates. **The current four topics are placeholders** from the Grade 9 framing; see `RESEARCH-PLAN.md`. Hints and worked steps are derived from each question's own numbers |
| `app/store.js` | All learner state, in `localStorage` |
| `app/screens.js` | One builder per route |
| `app/app.js` | Shell slots, router, practice loop, keyboard |
| `app/ui.js` | Design-system components as DOM builders |
| `_ds/`, `motion/` | Vendored design system and motion layer. Do not edit; they come from the design project |
| `poc/` | Proofs for features not yet built. Not shipped, not loaded by the app |
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
4. **JSON content packs**, with the research schema and four-subtest shape designed in from
   the start. Do this while there are only 20 templates — migrating 20 is an afternoon,
   migrating 300 is a project.
5. **Rebuild answer input**: fractions, mixed numbers, decimals to 4 places, repeating
   decimals, exponents, π-expressions, unit-bearing answers. Blocking for most NCE content.
   **Not negatives** — signed numbers are Grade 7 in MATATAG and absent from the blueprint.
6. **Attempt log**: timestamps, seeds, latency, hint depth, pack version.
7. **Enable GitHub Pages** from `main`.
8. **Test on a real low-end Android** through the Pages URL. A plain-HTTP LAN address can't
   register the service worker, so install and offline only work on the HTTPS URL.
9. **CI**: a GitHub Action running `tests/fuzz.js`, `poc/progress-code.js` and the new pack
   validator on every push.

Then the content rebuild (Phase 2), research instrumentation (Phase 3) and citability
(Phase 4), all in `RESEARCH-PLAN.md`.

**Parked:** the other three subtests. The language ladder — there are no native reviewers
yet, and an unreviewed pack teaches the wrong thing with confidence. Do not ship the
placeholder strings in `poc/`.

## Releasing

Change `CACHE` in `sw.js` on every release. Installed phones keep the old precache list
until `sw.js` itself changes.

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
- **The keypad is numeric-only.** Any item whose answer is a fraction, mixed number,
  exponent, π-expression or unit-bearing value is currently unanswerable — which is most of
  the blueprint. `tests/fuzz.js` guards this; it is also why answer input has to be rebuilt
  before most NCE content can be authored.
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
- The service worker serves from cache first. During development use `devserver.py`, or
  clear site data, or an edit will look as if it did nothing.
