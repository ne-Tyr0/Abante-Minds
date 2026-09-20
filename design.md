# Abante Minds — Design Doc

_Living document. Add references/research below decisions as they come in — some choices here may change as evidence comes in._

## Mission

Free, offline-capable practice platform for NCE (PSHS entrance exam) math review, aimed at ambitious but under-resourced kids, starting with Camotes Islands. Sister/twin product to **Shukanlo** (paid, general-audience, gacha-driven, multi-subject — parked, not in scope here).

## Timeline

- **Oct 10** — proof of concept. Small, real, working.
- **November** — hardened public launch. Same scope, more resilient.
- Both dates assume continued iteration after — this is not a "ship and forget."

## Target users

- Grade 9 and under, NCE reviewees
- Camotes Islands first (via adviser's existing promise to students there), then scalable to other underserved communities
- Likely shared/low-spec Android devices, patchy/no internet, little to no prior tech-account experience
- Weak mental math, often calculator-dependent (see Pedagogy)

## Scope — Oct 10

**In:**
- PIN-based login (no email/OAuth required)
- 30–50 hand-written, adviser-verified NCE math questions across 2–3 difficulty tiers
- Simple deterministic practice loop: promote tier on streak (e.g. 3 correct in a row), demote on wrong answer, no fuzzy logic yet
- Deployed as a PWA, reachable and installable from a basic Android phone browser

**Out (parked):**
- Multi-subject content
- Gacha / Shukanlo merge
- Mastery tracking (BKT), fuzzy-logic adaptive difficulty
- Offline sync, teacher dashboards, leaderboards
- Paid tier, startup/payment model, government/B2B conversations

## Scope — November

Adds on top of Oct 10:
- Full offline resilience (service worker caching, works with no connection)
- PIN recovery via adviser/teacher (not self-service — matches how these communities already resolve "I forgot my login" informally)
- Still single-subject, still no gacha/multi-subject/payments

## Platform: PWA, not native

- Installable from browser ("Add to Home Screen"), works offline, no app store submission/review needed
- Chosen over native (React Native/Flutter) because of the compressed timeline and solo/small-team build
- **iOS caveats** (lower priority — target users are majority Android):
  - Must install via Safari specifically (not Chrome/Facebook in-app browser)
  - iOS may evict cached/local data after ~7 days of inactivity (Safari ITP) — don't rely purely on local storage for progress without an eventual sync plan
  - Push notifications need iOS 16.4+ (not in scope yet anyway)
- Free to test on iPhone with no Apple Developer fee, since PWAs skip the App Store entirely

## Auth: PIN-based, not email/OAuth

- Rationale: target users often lack email accounts, or find account creation confusing; a username + 4–6 digit PIN is closer to a phone-lock mental model
- Teacher/adviser-assisted reset instead of self-service recovery (matches existing informal trust patterns)
- Teacher-bulk-created accounts (roster paste → generate username/PIN per student → print/hand out) preferred over self-signup where a teacher/adviser is available
- Guest/anonymous mode considered for pure walk-up use (local-only progress, "claim on signup" merge later) — not required for Oct 10

## Practice loop logic

- Challenge-mode-style deterministic state machine (not fuzzy logic — that's parked for later):
  - `state = {tier, streak, score}`
  - N correct in a row → tier up, streak resets
  - 1 wrong → tier down, streak resets
  - Tiered point values (e.g. Easy/Medium/Hard scaling)
- Fuzzy-logic adaptive engine (weighing accuracy + response time + confidence) is the future upgrade once the deterministic version is proven — not needed for a correct, honest MVP

## Pedagogy — mental math focus

Core stated concern: rural kids are ambitious but calculator-dependent, weak mental math. Design responses:
- **Calculator-free by default**, especially at lower tiers — this is a headline differentiator, not a buried setting
- CRA progression (Concrete → Representational → Abstract) before formulas — visual/manipulable before symbolic
- Worked examples with fading scaffolds, not just a "hint" button, for genuinely weak-foundation learners
- Interleaved practice (mix skill types) once a skill is initially learned, not blocked repetition
- Error-pattern-specific feedback for common misconceptions where feasible (not AI-verified — needs human/adviser review, see below)
- Locally-familiar problem contexts (sari-sari store, jeepney, fishing, etc.) over generic/foreign scenarios where natural

## Content correctness

- Math content (questions, answers, solution steps) verified by adviser before shipping — **not** finalized by AI alone
- AI (Opus 5) used for code generation, debugging, and code review — appropriate use, since code correctness is verifiable/testable
- AI used to help draft question/solution text is fine as a starting point, but is not the correctness check — same logic risk as AI grading its own math

## Visual design / vibe

Decision: **gamified-but-focused**, not purely calm/minimal, and not loud/chaotic either. Backed by research, not just taste — see References.

- Practice/question screens: calmer, less visually busy, blue-leaning (research links blue to lower cognitive load and better focus/learning atmosphere)
- Reward/feedback moments (correct streaks, level-ups, badges): where the brighter, energetic, game-like elements live
- Color should be **consistent between UI chrome and content signaling** — e.g. if a color marks "important" in a question, don't let unrelated UI colors compete with it
- Gamification elements (clear goals, immediate feedback, streaks) should reduce cognitive load, not add to it, when the underlying structure is clean — the "fun" isn't decoration, it does real design work
- No evidence found that a "slow, calm" pace is inherently better for this age group — the common assumption that kids need muted/slow design is not well-supported

### Synthesis from references (locked)

Sage and Folderly pull in different directions — Sage reads as a bold, group-oriented *tool*; Folderly reads as a soft, personal *companion*. Neither is copied outright; elements are mapped to the screen/moment they fit best.

**Taking from Sage:**
- Color-coded category system — each skill/subject area gets its own pastel-to-saturated color + emoji, for instant visual orientation without reading labels
- One consistent CTA color used everywhere it means "go/continue/submit," never used for anything else
- Full-screen celebration moments kept as their own distinct visual mode, separate from the calm working screens (matches the color-consistency/reward-separation research above)
- Simple flat vector icons over photos/complex illustration — cheap to produce consistently and lighter on low-end phones/slow connections

**Leaving behind from Sage:**
- The thick black comic-outline treatment (too recognizable as that specific site's signature)
- The classroom/group-game framing (live class codes, simultaneous play) — Abante Minds is solo-practice-first

**Taking from Folderly:**
- The custom ID/student-card *concept* (not its execution) — a simple personalizable card at signup (name, school/barangay, chosen icon or color) for identity and pride
- Warm, personal address ("Hello, [name]") over a generic tool-voice, since usage is solo, not classroom-group
- Literal folder/tab shapes for subject grouping — back-pocket idea for if/when multi-subject happens, not needed for single-subject Oct 10 scope

**Leaving behind from Folderly:**
- The glossy chrome-gradient sticker badge style and youth-slang branding ("Academic Slayer") — ages fast, may not translate well locally
- The skeuomorphic decorative widgets (e.g. iPod-style schedule player) — charming but not functionally relevant
- Uniform soft-pastel-everywhere as the whole app — research supports contrast between a calmer practice mode and an energetic reward mode, not softness throughout

**Screen-by-screen mapping:**

| Screen/moment | Direction |
|---|---|
| Practice/question screen | Calmer, blue-leaning, simple flat icons, minimal competing color |
| Topic/skill picker | Sage-style color-coded pastel cards, one color + icon per skill area |
| Streak/level-up/correct-answer moments | Full-screen celebration, saturated colors, its own energetic mode |
| Login/profile | Folderly-style simple personalization, warm "Hello, [name]" tone |
| Buttons/CTAs | One consistent action color, rounded (Sage's pill shape), no thick comic outline |

- Palette specifics (exact hex values), logo, mascot/branding: **not yet decided** — open pending adviser/EAGLES input

## Naming

- **Abante Minds** — free NCE-prep product (this doc)
- **Shukanlo** — reserved for the paid/general-audience twin product (parked)
- Considered and rejected: "Sulong" (already heavily used by DepEd's Sulong EduKalidad and other PH gov/NGO programs — collision risk), "Pundasyon" (safe but generic/plain), "Abante" alone (weaker trademark/domain distinctiveness as a bare dictionary word), "Abante Isip" (fully Filipino, strong grassroots feel, but less legible to non-Filipino funders/institutions — Abante Minds preferred for code-switch familiarity and institutional legibility given funding path)

## Business model (parked, not Oct 10 concern)

- Long-term: likely B2B2C (schools/NGOs/government pay, free/underserved kids don't), possibly blended with paying families for the Shukanlo/general side
- Explicitly **not** monetized via gacha or pay-to-play mechanics aimed at kids — real-money randomized rewards for minors is both an ethical and likely regulatory problem
- Revenue model, government/B2B conversations, and Shukanlo merge are deliberately deferred until Abante Minds has real, proven usage

## References

_(add citations/links here as you gather them — noting what each one supports or challenges)_

- **sageteachers.com** — visual/vibe reference (seen directly via screenshots). Thick black outlines on everything (cards, buttons, nav — sticker/comic-panel feel), warm cream background, bold black geometric headlines, fully pill-shaped buttons, pastel-to-saturated gradient thumbnails with flat vector icons per app, one consistent green used for all primary CTAs, small mascot character as logo, color-coded category tabs with emoji. See Synthesis above for what's actually being taken from this vs. left behind.
- **Folderly (Academic Organizer app)** — visual/vibe reference (seen directly via screenshots). Elegant italic serif display headers, custom ID-card personalization with glossy Y2K-chrome sticker badge text, literal manila-folder shapes (with tab cutout) color-coded per subject, thin soft-rounded outlines, pastel palette, skeuomorphic touches (iPod-style widget). See Synthesis above for what's actually being taken from this vs. left behind.
-