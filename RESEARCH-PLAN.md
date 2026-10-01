# Abante Minds — research capability and content plan

Status: accepted 2026-10-01. `CLAUDE.md` points here as the ordered plan. Items marked
**Done** are built; nothing else is.

## The pivot

Abante Minds was built for **Grade 9 NCE maths**. The actual target is the **Philippine
Science High School System National Competitive Examination (NCE)**, taken by **Grade 6**
learners for admission to Grade 7.

What that means:

| | Was assumed | Actually |
|---|---|---|
| Learner | Grade 9, struggling with numeracy | Grade 6, already ≥85% in Science and Maths, or top 10% of batch |
| Goal | Practice basic skills | Beat a dated, nationally competitive exam |
| Deadline | None | 30 January 2027 |
| Scope | Maths | Four subtests: maths, science, verbal, abstract reasoning — ranked together |
| Selectivity | n/a | 27,965 applicants, 1,738 qualifiers, 1,920 slots (2026 intake); national mean 84.50% |

### There is no official blueprint

PSHS does not publish a table of specifications. Item and timing figures circulating
online (~150 items total, ~60 maths) come from commercial reviewers, not PSHS, and must
be labelled as unofficial wherever we use them.

So the blueprint has to be **constructed**, and labelled as such. We have no past papers,
so there is exactly one source: the **official MATATAG Grade 6 mathematics curriculum**,
across its three content domains — Number and Algebra; Measurement and Geometry; Data and
Probability.

Two honest consequences of having only that source:

- **Topic weights are assumed, not measured.** We cannot know how heavily the NCE samples
  each domain. The blueprint distributes items evenly across competencies until real
  attempt data suggests otherwise.
- **It will under-represent above-level items.** The NCE is known to reach past the Grade 6
  curriculum, and a curriculum-derived blueprint by definition cannot see that. Expect the
  first cohort's data to show a ceiling, and treat that as a finding rather than a defect.

This gap is also the opportunity. A published, teacher-validated table of specifications
for the NCE maths subtest, with real item difficulty and discrimination behind it, is a
citable contribution — and the honest route to filling the above-level gap is item
difficulty measured from learners, not guesswork. The app is the instrument that generates
it.

## Decisions this plan assumes

Confirmed with the owner on 2026-10-01:

- **Local-first, not local-only.** The "no backend, no analytics, permanently" decision in
  `CLAUDE.md` is reversed in one narrow way: **opt-in, off by default, anonymous aggregate
  telemetry**. No accounts. No per-learner data on any server.
- **Two data paths, two holders.**
  - *Researcher's data*: per-learner, linkable, exported by explicit consent **directly to
    the researcher**. Never touches our infrastructure. They are the data controller,
    under their own institution's ethics clearance.
  - *Our data*: aggregate, anonymous, batched. Feeds a public statistics page and tells us
    what works.
- **The researcher holds the re-identification key.** The app emits a pseudonymous
  participant code. The name-to-code sheet lives with the researcher. We never hold a file
  linking a child's name to her scores.
- **Freshness: weekly batch**, plus a dev-only live event tail for pilot debugging. Not a
  real-time dashboard: research is retrospective, and a stable `n` is worth more than low
  latency, because a cited figure must not move between submission and defence.
- **Consent: opt-in, off by default.**
- **Authoring: Claude drafts, owner reviews and corrects.** A pack validator gates every
  release, because generated items at volume will otherwise ship something wrong.
- **Four subtests eventually, maths first.** Only maths is built now, but the content-pack
  schema and the navigation are designed for all four subtests — maths, science, verbal
  ability, abstract reasoning — from the start, so expanding is not a retrofit. Abstract
  reasoning will need a visual question renderer rather than the keypad; the schema should
  not assume a numeric answer.
- **The blueprint is curriculum-derived from MATATAG alone**, with no past papers, and is
  never presented as official.
- **Target intervention length: 4–8 weeks** (typical Master's quasi-experiment).

## Phase 0 — Decide and record. No feature code.

1. **Rewrite `CLAUDE.md`** for the Grade 6 / PSHS NCE pivot. **Done 2026-10-01** — the
   learner, the four subtests, the reversed telemetry decision and the new topic scope.
2. **Build the table of specifications.** **Done 2026-10-01** — `TABLE-OF-SPECIFICATIONS.md`
   and `content/blueprint.json`: 101 competencies across Grades 5 and 6, 13 topics, 143
   templates targeted, validated for internal consistency. Three findings fed back into
   this plan: negatives are not needed in the keypad; `factors` and `circles` sit at or
   past the exam date so the app must teach them rather than drill them; and the template
   floor had to become `max(10, practicable competencies)` or `decimals` and `solids` would
   have been under-covered.

   Original scope of this step: document work, no code. Per competency: MATATAG
   code, content domain, assumed item weight, intended difficulty band, and the problem
   schemas it should be exercised through. Weights are assumed and must be marked as such —
   revise them once attempt data exists. This is the spine of the content rebuild, the item
   spec table, the content-validity evidence and the research instrument. Everything
   downstream depends on getting it right, so it goes first.
3. **Delete the fake sync.** **Done 2026-10-01** — `startSync()` animated a progress bar
   and zeroed `pendingAnswers` with no request behind it, so a teacher watching it would
   have believed data was sent. It and the sync banner are gone.
4. **Correct the teacher-facing overview PDF**: "nothing leaves the phone unless you choose
   to share it." **Held 2026-10-01**: the existing PDF also predates the Grade 6 retarget, so
   it must not be sent. It is rebuilt once Phase 2 content exists, so its screenshots show
   items pitched at this audience rather than the placeholders. The builder is in
   `tools/overview-pdf/`, and refuses to run until its copy is rewritten.

## Phase 1 — Foundation

Unblocks everything else. Do not start Phase 2 content before this is done: migrating 20
templates is an afternoon, migrating 300 is a project.

5. **Self-host the fonts.** **Done 2026-10-01** — Lexend and Baloo 2 in `assets/fonts/`,
   `@font-face` in `app/fonts.css`, token files loaded individually in `index.html` so
   `_ds/` stays untouched. CI now fails any shipped file containing a third-party URL.
   This matters more once telemetry exists: the network story has to be exactly one
   honest request.
6. **JSON content packs, with the research schema designed in from the start.** Per item
   template: stable id, **subtest**, topic, MATATAG competency code, content domain,
   construct, **problem-schema type**, tier number ranges, **answer type** (integer,
   negative, fraction, decimal, exponent, choice, visual), distractor **error codes**,
   hints, worked steps, pack version. Build it for rendering only and all 300 items get
   re-authored later; omit `subtest` or hardcode a numeric answer type and the other three
   subtests become a retrofit.
7. **Rebuild answer input.** Fractions, mixed numbers, decimals to 4 places, repeating
   decimals, exponents, π-expressions and unit-bearing answers. The current numeric keypad
   cannot express most NCE answers. Prerequisite for Phase 2.

   **Correction to an earlier assumption in this plan: negative numbers are not needed.**
   Signed numbers are Grade 7 in MATATAG, absent from Grades 5 and 6. They matter only if
   above-level content is added later. Fractions and mixed numbers are the real blocker.

   `transform` additionally needs a **visual question renderer** — picture answer options
   rather than numbers. It unlocks 15 partial competencies, and it is the same renderer the
   abstract reasoning subtest will need, so it pays for itself twice.
8. **Attempt log.** Append-only, ring-buffered (~5,000 attempts). Per answer: timestamp,
   session id, topic, template id, tier, **question seed**, answer given, correct, latency
   ms, hint depth (0–3), steps viewed, ordinal in session, pack version, app version,
   condition flags.

   Because `content.js` is deterministic (`rng(seed)` / `buildSession(topic, n, tier, seed)`),
   `{template id, seed, tier}` reconstructs the exact item. The export carries no question
   text and no PII, yet the full stimulus set is re-derivable. Half this plumbing already
   exists and is discarded: `app/app.js:174` tracks `hintsRevealed`, `:182` tracks
   `startedAt`, and only a rounded minute count survives the session.
9. **Local profiles, replacing PIN auth.** Already planned. Now research-critical: siblings
   share phones, and a participant's data must not contain a sibling's attempts.
10. **GitHub Pages from `main`** — **done**, live at https://ne-tyr0.github.io/Abante-Minds/.
    Still to do: test on a real low-end Android via that HTTPS URL.
11. **CI**: **done** for `tests/fuzz.js`, `poc/progress-code.js`, `tests/invariants.js` and
    `tests/cache-bump.js` (`.github/workflows/ci.yml`). Still to add: the **pack
    validator**, which enforces the schema, checks every answer is expressible in the
    keypad, and rejects an item whose distractors lack error codes.

## Phase 2 — Content, rebuilt to the blueprint

12. **New topic set from the table of specifications**, replacing the four placeholders.
    Target **≥10 templates per topic**. That number is driven by two independent
    constraints that happen to agree: an 8-week intervention is ~320 attempts and template
    *shapes* go stale long before parameterised numbers do; and a defensible KR-20 needs
    roughly 10 items per subscale. Claude drafts per topic, owner reviews and corrects.
13. **Problem-schema tagging and varied word-problem structures per topic.** The owner's
    core idea, and the strongest in the plan. Tag each template with its schema — change,
    combine, compare for additive; equal-groups, rate, multiplicative comparison for the
    rest — and the app can report *this learner handles change problems but fails compare
    problems carrying identical arithmetic*. A real diagnostic for the learner, and a
    finding almost nothing in Philippine maths-app research reports. Costs one schema field.
14. **Timed mode and exam simulation.** The real exam is timed and competitive at an 84.50%
    mean. Speed is part of the construct, so latency becomes a learner-facing feature, not
    only a research variable.
15. **Replace the progression model.** Tier bars and "20 correct per topic" answer the
    wrong question. A learner counting down to 30 January wants blueprint coverage and a
    readiness estimate. Add an exam-date countdown.
16. **Make the demotion rule configurable, default off.** `rollDay()` currently costs a
    full tier for one missed day. Over a 4–8 week study it is a serious confound, and it is
    itself the most interesting design question here: does streak-linked demotion raise or
    lower return rate? It cannot be studied while hardcoded.
17. **Spaced review.** Resurface missed items at 1/3/7 days. Needed for an 8-week
    intervention to measure skill rather than recall of specific items, and it yields a
    retention measure.

## Phase 3 — Research instrumentation

18. **Pseudonymous participant code** (e.g. `AM-7K2Q-9XD4`), stable across sessions,
    generated locally, in every exported row.
19. **Consent-gated export**, extending `poc/progress-code.js`: a screen stating exactly
    what is inside and that it carries no name, producing a QR plus **two CSV shapes** —
    wide (one row per participant, for t-tests and ANCOVA) and long (one row per attempt,
    for mixed models). Both import cleanly into SPSS, JASP and Jamovi.
20. **Fixed Forms A and B**: ~20 pinned seeds each, matched template-for-template so the
    forms are equivalent. Adaptive generated items cannot serve as a measure; this is what
    makes a pretest–posttest design possible.
21. **`tools/replay.js`**: reprints the exact items a participant saw, from the seeds. A
    thesis must attach its instrument as an appendix, and a reviewer can verify the
    stimulus set — which few student instruments can offer.
22. **`tools/psychometrics.js`**: item difficulty (p-values), discrimination indices, KR-20
    and Cronbach's alpha from a collected CSV. `tests/fuzz.js` proves items are
    well-formed; this proves they measure something.
23. **Item specification table, generated from the packs** so it cannot drift. Per
    template: competency code, construct, schema type, tier ranges, distractor error codes.
    This is what a methodology chapter cites and what expert validators rate to produce a
    content validity index.
24. **Condition flags** (`#cfg=` or `research.json`): hint-first vs worked-example-first,
    demotion on/off, spaced review on/off, timed vs untimed. Recorded in every log row.
    Without these there is no manipulation to study.

## Phase 4 — Citability and telemetry

25. **`CITATION.cff`** plus a tagged release, archived through Zenodo for a DOI. Gives
    GitHub a "Cite this repository" button and gives researchers a versioned citation.
26. **Dataset licensed CC BY 4.0**, so attribution is a licence condition rather than a
    courtesy.
27. **Versioned public statistics snapshots**: `stats/2026-10.json` plus a page, tagged per
    release. A student citing a frozen snapshot with a known `n` can be checked by their
    panel; a number emailed last March cannot.
28. **Opt-in anonymous aggregate telemetry.** Off by default. One POST per completed
    session: pack version, app version, tier, topic, template id, correct, latency bucket,
    hint depth, condition flags, random install id, coarse date. No name, no profile, no IP
    retained. Queued offline, which finally makes the sync indicator honest. Google Apps
    Script bound to a Sheet is the lowest-friction host; Cloudflare Workers + D1 if
    durability matters later.
29. **Dev-only live event tail**: last 50 events, behind a key, owner's eyes only. Buys the
    pilot-debugging benefit of real-time without building a dashboard or reopening the
    no-teacher-dashboard decision.
30. **Data-use page**: what is shared, in what form, under what terms, with the
    selection-bias caveat stated plainly.
31. **Ethics pack in-repo**, for researchers to adapt: parental consent and child assent
    forms (English and Filipino), a data-management statement, and a documented, reachable
    "delete my data" (`reset()` exists but needs surfacing).

## Research designs this supports, in order of cheapness

1. **Item analysis / instrument validation.** One administration, no control group, works
   with whatever sample arrives. Everything else depends on it: the first reviewer question
   about any gain claim is whether the items measure anything consistently.
2. **Error-type and problem-schema reduction over time.** Within-subject. Nearly free once
   error codes and schema tags exist, and the most interesting "what works" signal.
3. **Usability and engagement.** A standard scale plus the log: completion, time-on-task,
   return rate. Viable with very few participants.
4. **Pretest–posttest with a comparison group.** Needs Forms A/B and condition flags, and
   needs a researcher with a captive class. Deliberately last: the app is a solo tool a
   teacher recommends, so we do not control administration.

## Permanent limitations to disclose

- **Selection bias.** Users are high-achieving, self-selected Grade 6 learners (≥85% in
  Grade 5 Science and Maths, or top 10%). Findings do not generalise to all Grade 6
  learners. Every study using this app must say so.
- **Self-selected telemetry.** Opt-in data over-represents engaged learners.
- **Unofficial blueprint.** Until PSHS publishes a table of specifications, ours is
  practitioner-derived and must be labelled that way.

## Parked

- **Building the other three subtests** (science, verbal, abstract reasoning). Decided:
  they are coming, so the pack schema and navigation accommodate them now, but no content
  gets authored until maths is done properly. Abstract reasoning is the most under-served
  and most trainable of the four, and is the natural second — it needs no curriculum
  blueprint, but it does need a visual question renderer.
- **The language ladder.** Already parked: no native reviewers, and an unreviewed pack
  teaches the wrong thing with confidence.

## Sources

- https://pshs.edu.ph/nce-faqs/ — official NCE FAQs (blocks automated fetch; read manually)
- https://pshs.edu.ph/how-to-be-a-pshs-scholar/ — eligibility
- https://nce.pshs.edu.ph/ — application portal
- https://www.flipscience.ph/news/press-releases/pisay-announces-list-of-2026-qualifiers-reveals-plans-to-establish-10-more-campuses-nationwide/ — 2026 applicant and qualifier counts, national mean, four sections
- https://www.manilatimes.net/2026/04/04/tmt-newswire/dost-reveals-new-pisay-scholars-posts-plans-to-expand-pshs-campus-to-2-per-region/ — same intake, campus expansion
- https://jontotheworld.com/pisay-scholarship/ — 2027 exam date, fees, eligibility, four content areas
- https://www.deped.gov.ph/wp-content/uploads/MATATAG-Mathematics-CG-Grades1-4-and-7.pdf — MATATAG mathematics curriculum guide
- https://www.academ-e.ph/wp-content/uploads/2023/09/Mathematics-CG-2023.pdf — MATATAG mathematics CG, grades 1–10
- https://lsctutorial.com/philippine-science-high-school-entrance-test-reviewer/ — indicative subtest content (commercial reviewer)
