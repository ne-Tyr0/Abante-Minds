# Abante Minds — table of specifications, NCE mathematics

Version 0.1, drafted 2026-10-01. **Curriculum-derived. Not official.** PSHS publishes no
table of specifications for the National Competitive Examination; this one is constructed
from the DepEd MATATAG mathematics curriculum and must never be presented as the exam's
own blueprint. See *Provenance* and *Revision triggers*.

Scope: the **mathematics / quantitative ability** subtest only. The NCE also tests
scientific ability, verbal ability and abstract reasoning, and ranks candidates across all
four; those are out of scope here.

## Provenance

| | |
|---|---|
| Primary source | MATATAG Mathematics Curriculum Guide 2023, Grades 1–10 (`Mathematics-CG-2023.pdf`, 68pp) |
| Competencies used | Grade 5 (49) and Grade 6 (52) = **101 competencies** |
| Past papers consulted | **None.** We have no access to any. |
| Commercial reviewers consulted | None used as a source. Item-count figures circulating online (~150 items total, ~60 maths) are vendor claims, not PSHS statements. |
| Item weights | **Assumed**, derived from competency counts. Not measured. |

Two consequences that must travel with any use of this document:

- **Weights are an assumption.** We cannot know how heavily the NCE samples each domain.
- **It cannot see above-level content.** The NCE is reputed to reach past Grade 6. A
  curriculum-derived blueprint is structurally blind to that. Expect a ceiling in the
  first cohort's data and treat it as a finding, not a defect.

## What a taker has actually been taught by exam day

Exam: **30 January 2027**. SY 2026–2027 runs 8 June 2026 – 8 April 2027 under DepEd Order
No. 009, s. 2026, which replaced four quarters with **three terms**: Term 1 to 15 Sept,
Term 2 to 18 Dec, Term 3 from 4 Jan.

So on exam day a Grade 6 taker has completed Terms 1 and 2 and roughly **four weeks of
Term 3**.

**This mapping is an assumption.** The MATATAG guide is organised in quarters; the calendar
is now in terms, and we do not have the redistribution. Assuming content order is
preserved and compressed proportionally, end of Term 2 ≈ two-thirds through the year ≈
through old Quarter 2 and a little into Quarter 3. On that basis:

| Source | Status on 30 Jan 2027 |
|---|---|
| All of Grade 5 | **taught** — complete and assumed |
| Grade 6 Quarter 1 | **taught** |
| Grade 6 Quarter 2 | **taught** |
| Grade 6 Quarter 3 | **partial** — some learners, some schools |
| Grade 6 Quarter 4 | **ahead** — not taught before the exam |

This is the most actionable thing in the document. **For `ahead` content the app is
teaching, not drilling** — it cannot assume a classroom has been there first. Two topics
carry the most risk:

- **`factors`** — divisibility and primes are Grade 5 (taught), but **GCF and LCM are
  Grade 6 Quarter 4**, after the exam. Entrance-exam reviewers emphasise factors heavily.
  A learner who meets a GCF item cold is exactly the blindsiding this app exists to prevent.
- **`circles`** — parts of a circle and circumference are Quarter 3, area of a circle is
  Quarter 4. Nearly the whole topic sits at or past the exam date.

Build these two first within their domains, with full teaching scaffolds rather than
practice-only items.

## Domain weights

Derived from competency counts across Grades 5 and 6, then rounded:

| Domain | Competencies | Raw share | **Assumed weight** |
|---|---|---|---|
| Number and Algebra (NA) | 49 | 48.5% | **50%** |
| Measurement and Geometry (MG) | 38 | 37.6% | **35%** |
| Data and Probability (DP) | 14 | 13.9% | **15%** |

Against an assumed 60-item maths subtest that is roughly 30 / 21 / 9 items.

**Weight governs how often the app draws from a topic. It does not govern how many
templates to author.** Authoring volume follows its own rule:

> **templates per topic = max(10, app-practicable competencies in that topic)**

The floor of 10 is psychometric — a defensible KR-20 or Cronbach's alpha needs roughly ten
items per subscale — so a 4%-weighted topic still needs ten templates, it just appears less
often. The second term stops a broad topic from leaving competencies with no template at
all: a flat floor of 10 would have under-covered `decimals` (20 practicable competencies)
and `solids` (13).

**Total: 143 templates.**

| Topic | Practicable | Templates | Note |
|---|---|---|---|
| `decimals` | 20 | **20** | widest topic in the blueprint |
| `solids` | 13 | **13** | |
| `fractions` | 10 | 10 | |
| `data` | 9 | 10 | |
| `circles` | 7 | 10 | |
| `ratio` | 7 | 10 | |
| `area` | 6 | 10 | |
| `factors` | 5 | 10 | |
| `gemdas` | 5 | 10 | |
| `time` | 5 | 10 | |
| `transform` | 3 | 10 | thin — needs deliberate schema variety |
| `percent` | 2 | 10 | thin — needs deliberate schema variety |
| `probability` | 2 | 10 | thin — needs deliberate schema variety |

The three thin topics are the authoring risk: five templates per competency will drift into
near-duplicates unless the problem schemas are varied on purpose. `percent` in particular
has only two competencies carrying a 5% weight, so its ten templates have to earn their
distinctness from structure rather than content.

## Topics

Thirteen topics replace the four Grade 9 placeholders (`money`, `percent`, `ratio`,
`measure`). Target ≥10 templates each, so **≥130 templates** total.

| Code | Topic | Domain | Weight | Status | Competencies | Answer types |
|---|---|---|---|---|---|---|
| `fractions` | Fractions: four operations | NA | 11% | taught | G5.Q1.7–9, G5.Q2.1–3, G6.Q1.11–14 | fraction, mixed |
| `decimals` | Decimals: place value and four operations | NA | 13% | taught | G5.Q2.4–10, G5.Q3.9–13, G6.Q1.4–10 | decimal (to 4dp), repeating |
| `gemdas` | Order of operations and exponents | NA | 9% | taught | G5.Q1.6, G5.Q4.1–2, G6.Q2.10–12 | integer, decimal, exponent |
| `ratio` | Ratio and proportion | NA | 8% | taught | G6.Q2.1–7 | integer, fraction, ratio pair |
| `percent` | Percentages, fractions and decimals | NA | 5% | taught | G6.Q2.8–9 | percent, fraction, decimal |
| `factors` | Divisibility, primes, GCF and LCM | NA | 4% | **partial → ahead** | G5.Q2.11–12, G6.Q4.11–13 | integer, factor list |
| `area` | Perimeter and area of plane figures | MG | 9% | partial | G5.Q1.10–12, G6.Q3.6–8 | integer, decimal + unit |
| `circles` | Circles: parts, circumference, area | MG | 8% | **partial → ahead** | G6.Q3.9–13, G6.Q4.1–4 | decimal, π-expression + unit |
| `solids` | Solids, nets, surface area, volume, capacity | MG | 9% | partial | G5.Q4.3–11, G6.Q3.1–5 | integer, decimal + unit |
| `transform` | Tessellation, translation, reflection, rotation | MG | 5% | taught | G5.Q4.12, G6.Q1.1–3 | **visual choice** |
| `time` | 12- and 24-hour time, world time zones | MG | 4% | taught | G5.Q1.1–5 | time, integer |
| `data` | Reading and reasoning from graphs and tables | DP | 11% | partial | G5.Q3.1–6, G6.Q4.5–10 | integer, percent, degrees |
| `probability` | Theoretical probability of simple events | DP | 4% | taught | G5.Q3.7–8 | fraction, percent |

### What this means for answer input

The blocking answer types are **fractions, mixed numbers, decimals to four places,
repeating decimals, exponents, π-expressions, and unit-bearing answers**.

**Negative numbers are not required.** Signed numbers do not appear in MATATAG Grade 5 or
6 — they arrive in Grade 7. This corrects an earlier assumption in `RESEARCH-PLAN.md`:
negatives matter only if we later add above-level content, which the NCE may reach but
this blueprint cannot see.

`transform` needs a **visual question renderer** — answer options are pictures, not
numbers. That is the same renderer the abstract reasoning subtest will need, so building
it for `transform` pays for itself twice.

**`circles` also needs a π glyph the app does not currently have.** The self-hosted faces
ship the latin and latin-ext subsets; π (U+03C0) is in neither, so it would fall back to a
system font mid-sentence. Resolve it when `circles` is authored — see the note in
`app/fonts.css`.

## Competency inventory

Codes are `G<grade>.Q<quarter>.<n>`, where `n` is the competency's number within that
quarter in the MATATAG guide. Quarter numbering runs across domains within a quarter, so
the domain is carried as a separate field rather than embedded in the code.

`App` column: **Y** practicable as a generated item · **P** partial, needs a visual
renderer or a reduced form · **N** not practicable — a physical or classroom task.

### Grade 5, Quarter 1 — taught

| Code | Domain | Competency | Topic | App |
|---|---|---|---|---|
| G5.Q1.1 | MG | describe a 12- and 24-hour clock system | `time` | Y |
| G5.Q1.2 | MG | convert 12-hour to 24-hour time and back | `time` | Y |
| G5.Q1.3 | MG | solve problems involving 12- and 24-hour time | `time` | Y |
| G5.Q1.4 | MG | compare time across world time zones using a map | `time` | P |
| G5.Q1.5 | MG | solve problems comparing world time zones to PH time | `time` | Y |
| G5.Q1.6 | NA | perform three or more operations applying GMDAS | `gemdas` | Y |
| G5.Q1.7 | NA | multiply fractions using models | `fractions` | P |
| G5.Q1.8 | NA | multiply a fraction by a fraction | `fractions` | Y |
| G5.Q1.9 | NA | multi-step problems multiplying fractions | `fractions` | Y |
| G5.Q1.10 | MG | identify the height of a parallelogram, triangle, trapezoid | `area` | P |
| G5.Q1.11 | MG | find the area of a parallelogram, triangle, trapezoid | `area` | Y |
| G5.Q1.12 | MG | estimate areas of triangles and quadrilaterals using grids | `area` | P |

### Grade 5, Quarter 2 — taught

| Code | Domain | Competency | Topic | App |
|---|---|---|---|---|
| G5.Q2.1 | NA | divide fractions using models | `fractions` | P |
| G5.Q2.2 | NA | divide a fraction by a fraction | `fractions` | Y |
| G5.Q2.3 | NA | multi-step problems dividing fractions | `fractions` | Y |
| G5.Q2.4 | NA | place value and digit value to thousandths | `decimals` | Y |
| G5.Q2.5 | NA | read and write decimals to thousandths | `decimals` | Y |
| G5.Q2.6 | NA | convert terminating decimals to fractions and back | `decimals` | Y |
| G5.Q2.7 | NA | compare and order decimals to thousandths | `decimals` | Y |
| G5.Q2.8 | NA | round decimals to the nearest thousandth | `decimals` | Y |
| G5.Q2.9 | NA | add and subtract decimals to 3 decimal places | `decimals` | Y |
| G5.Q2.10 | NA | multi-step add/subtract decimal problems, incl. money | `decimals` | Y |
| G5.Q2.11 | NA | divisibility rules for 2,5,10 · 3,6,9 · 4,8,11,12 | `factors` | Y |
| G5.Q2.12 | NA | distinguish prime from composite (Sieve of Eratosthenes) | `factors` | Y |

### Grade 5, Quarter 3 — taught

| Code | Domain | Competency | Topic | App |
|---|---|---|---|---|
| G5.Q3.1 | DP | collect bivariate data by interview or questionnaire | `data` | **N** |
| G5.Q3.2 | DP | identify the appropriate graph for a data set | `data` | Y |
| G5.Q3.3 | DP | construct double bar and double line graphs | `data` | **N** |
| G5.Q3.4 | DP | interpret a double bar or double line graph | `data` | Y |
| G5.Q3.5 | DP | draw conclusions from a double bar or line graph | `data` | Y |
| G5.Q3.6 | DP | solve problems using double bar or line graph data | `data` | Y |
| G5.Q3.7 | DP | describe probability as the chance of an event | `probability` | Y |
| G5.Q3.8 | DP | theoretical probability of a simple event by listing | `probability` | Y |
| G5.Q3.9 | NA | estimate a product of two decimals | `decimals` | Y |
| G5.Q3.10 | NA | multiply decimals to 2 decimal places | `decimals` | Y |
| G5.Q3.11 | NA | multi-step decimal multiplication problems, incl. money | `decimals` | Y |
| G5.Q3.12 | NA | estimate a quotient of two decimals | `decimals` | Y |
| G5.Q3.13 | NA | divide to a terminating decimal quotient | `decimals` | Y |

### Grade 5, Quarter 4 — taught

| Code | Domain | Competency | Topic | App |
|---|---|---|---|---|
| G5.Q4.1 | NA | multi-step decimal division problems, incl. money | `decimals` | Y |
| G5.Q4.2 | NA | three or more operations with fractions and decimals (GMDAS) | `gemdas` | Y |
| G5.Q4.3 | MG | illustrate solid figures with concrete and pictorial models | `solids` | P |
| G5.Q4.4 | MG | relate plane figures to solid figures | `solids` | P |
| G5.Q4.5 | MG | differentiate prisms and pyramids by vertices, faces, edges | `solids` | Y |
| G5.Q4.6 | MG | illustrate and describe solid figures and their nets | `solids` | P |
| G5.Q4.7 | MG | make models of solid figures | `solids` | **N** |
| G5.Q4.8 | MG | illustrate and find the surface area of solid figures | `solids` | Y |
| G5.Q4.9 | MG | solve problems involving surface area | `solids` | Y |
| G5.Q4.10 | MG | describe and distinguish cubes and rectangular prisms | `solids` | Y |
| G5.Q4.11 | MG | estimate volume using non-standard units | `solids` | P |
| G5.Q4.12 | MG | draw the image of an object after rotation about a point | `transform` | P |

### Grade 6, Quarter 1 — taught

| Code | Domain | Competency | Topic | App |
|---|---|---|---|---|
| G6.Q1.1 | MG | explore whether or not a shape tessellates | `transform` | Y |
| G6.Q1.2 | MG | tessellate a surface using different shapes | `transform` | **N** |
| G6.Q1.3 | MG | draw images after translation, reflection, rotation | `transform` | P |
| G6.Q1.4 | NA | add and subtract decimals to 4 decimal places | `decimals` | Y |
| G6.Q1.5 | NA | multi-step add/subtract decimal problems, incl. money | `decimals` | Y |
| G6.Q1.6 | NA | mentally multiply decimals by 0.1, 0.01, 0.001, 10, 100, 1000 | `decimals` | Y |
| G6.Q1.7 | NA | multi-step decimal multiplication problems, incl. money | `decimals` | Y |
| G6.Q1.8 | NA | divide to a repeating decimal quotient; whole ÷ 1dp decimal | `decimals` | Y |
| G6.Q1.9 | NA | mentally divide decimals by 0.1/0.01/0.001 and 10/100/1000 | `decimals` | Y |
| G6.Q1.10 | NA | solve problems involving division of decimals | `decimals` | Y |
| G6.Q1.11 | NA | products of fractions, whole numbers, mixed numbers | `fractions` | Y |
| G6.Q1.12 | NA | multi-step multiplication with fraction combinations | `fractions` | Y |
| G6.Q1.13 | NA | divide combinations of fractions, wholes, mixed numbers | `fractions` | Y |
| G6.Q1.14 | NA | multi-step division with fraction combinations | `fractions` | Y |

### Grade 6, Quarter 2 — taught

| Code | Domain | Competency | Topic | App |
|---|---|---|---|---|
| G6.Q2.1 | NA | describe quantities using part–whole and part–part ratio | `ratio` | Y |
| G6.Q2.2 | NA | express one number as a fraction of another from their ratio | `ratio` | Y |
| G6.Q2.3 | NA | identify and write equivalent ratios | `ratio` | Y |
| G6.Q2.4 | NA | solve problems involving ratio | `ratio` | Y |
| G6.Q2.5 | NA | illustrate ratio and proportion with tables or double number line | `ratio` | P |
| G6.Q2.6 | NA | find how many times one value is larger than another | `ratio` | Y |
| G6.Q2.7 | NA | solve problems involving ratio and proportion | `ratio` | Y |
| G6.Q2.8 | NA | relate percentages, fractions and decimals | `percent` | Y |
| G6.Q2.9 | NA | identify and explain the uses of percentages | `percent` | P |
| G6.Q2.10 | NA | write numbers in exponential form and back | `gemdas` | Y |
| G6.Q2.11 | NA | give the value of numbers in exponential form | `gemdas` | Y |
| G6.Q2.12 | NA | calculations with exponential form applying GEMDAS | `gemdas` | Y |

### Grade 6, Quarter 3 — partial on exam day

| Code | Domain | Competency | Topic | App |
|---|---|---|---|---|
| G6.Q3.1 | MG | determine appropriate units for volume and capacity | `solids` | Y |
| G6.Q3.2 | MG | convert cu. cm to L and back | `solids` | Y |
| G6.Q3.3 | MG | find the volume of a cube and a rectangular prism | `solids` | Y |
| G6.Q3.4 | MG | solve problems involving volumes of cubes and prisms | `solids` | Y |
| G6.Q3.5 | MG | solve problems involving capacity | `solids` | Y |
| G6.Q3.6 | MG | convert sq. cm to sq. m and back | `area` | Y |
| G6.Q3.7 | MG | area of composite figures from triangles, squares, rectangles | `area` | Y |
| G6.Q3.8 | MG | perimeter and area problems incl. trapezoids and composites | `area` | Y |
| G6.Q3.9 | MG | draw circles with different radii using compasses | `circles` | **N** |
| G6.Q3.10 | MG | identify and describe the parts of a circle | `circles` | Y |
| G6.Q3.11 | MG | measure the circumference of circles using tools | `circles` | **N** |
| G6.Q3.12 | MG | approximate the value of π as circumference ÷ diameter | `circles` | P |
| G6.Q3.13 | MG | find the circumference of a circle | `circles` | Y |

### Grade 6, Quarter 4 — not taught on exam day

| Code | Domain | Competency | Topic | App |
|---|---|---|---|---|
| G6.Q4.1 | MG | explore inductively the area of a circle toward the formula | `circles` | P |
| G6.Q4.2 | MG | find the area of a circle using the formula | `circles` | Y |
| G6.Q4.3 | MG | area of composites of triangle, square, rectangle, circle, semicircle | `circles` | Y |
| G6.Q4.4 | MG | problems involving circumference and area of circles and composites | `circles` | Y |
| G6.Q4.5 | DP | find angle measures and percentages from pie graph data | `data` | Y |
| G6.Q4.6 | DP | construct a pie graph using appropriate tools | `data` | **N** |
| G6.Q4.7 | DP | interpret data presented in a pie graph | `data` | Y |
| G6.Q4.8 | DP | interpret data from digital media in tabular or graphical form | `data` | Y |
| G6.Q4.9 | DP | draw conclusions or inferences from a pie graph | `data` | Y |
| G6.Q4.10 | DP | solve problems using data presented in a pie graph | `data` | Y |
| G6.Q4.11 | NA | GCF by listing, prime factorisation, continuous division | `factors` | Y |
| G6.Q4.12 | NA | LCM by listing, prime factorisation, continuous division | `factors` | Y |
| G6.Q4.13 | NA | solve problems involving GCF and LCM | `factors` | Y |

## Not practicable in the app

Seven of the 101 competencies cannot be generated as answerable items, because they are
physical or classroom tasks. They are recorded so coverage reporting is honest about its
own gaps — the app must never claim blueprint completeness it does not have.

| Code | Why not | Nearest practicable substitute |
|---|---|---|
| G5.Q3.1 | Data collection by interview | — none; genuinely out of scope |
| G5.Q3.3 | Constructing graphs by hand | G5.Q3.2 choosing the right graph; G5.Q3.4 interpreting one |
| G5.Q4.7 | Making physical models | G5.Q4.5 differentiating prisms and pyramids from a figure |
| G6.Q1.2 | Tessellating a surface | G6.Q1.1 judging whether a shape tessellates |
| G6.Q3.9 | Drawing with compasses | G6.Q3.10 identifying parts of a circle |
| G6.Q3.11 | Physical measurement | G6.Q3.13 computing circumference |
| G6.Q4.6 | Constructing a pie graph | G6.Q4.5 computing its angles and percentages |

**Coverage arithmetic: 79 practicable (Y) · 15 partial (P) · 7 not practicable (N) = 101.**

The 15 partial (**P**) competencies need either the **visual question renderer** or a
reduced form: G5.Q1.4, G5.Q1.7, G5.Q1.10, G5.Q1.12, G5.Q2.1, G5.Q4.3, G5.Q4.4, G5.Q4.6,
G5.Q4.11, G5.Q4.12, G6.Q1.3, G6.Q2.5, G6.Q2.9, G6.Q3.12, G6.Q4.1.

Most need the renderer. Three are different: G5.Q1.7 and G5.Q2.1 specify "using models",
which a numeric item can only approximate, and G6.Q2.9 ("explain the uses of percentages")
is explanatory rather than computational — practicable only as a multiple-choice item, and
a weak one. So **94 of 101 competencies are reachable**, 15 of them only after the renderer
exists.

## Problem schemas

Every topic should be exercised through varied word-problem structures, not just varied
numbers. Tag each template with one, and the app can report that a learner handles *change*
problems but fails *compare* problems carrying identical arithmetic.

- **Additive**: `change` · `combine` · `compare`
- **Multiplicative**: `equal-groups` · `rate` · `multiplicative-compare` · `part-whole`
- **Non-routine**: `work-backwards` · `missing-middle` · `multi-step` · `excess-info`

`excess-info` matters more here than in ordinary practice: a selective, timed exam rewards
learners who can discard an irrelevant number, and nothing in the current app ever presents
one.

## Revision triggers

This document is version 0.1 and is expected to be wrong in measurable ways. Revise it when:

1. **Past papers become available.** Replaces assumed weights with observed ones. Highest-
   value single input, and worth actively seeking.
2. **The first cohort's attempt data arrives.** Item difficulty per competency shows where
   the blueprint is pitched wrongly. A topic where strong learners cluster near 100% is
   under-pitched relative to the real exam.
3. **DepEd publishes the three-term redistribution** of MATATAG competencies. Replaces the
   quarter-to-term assumption above, and may move topics between `taught` and `ahead`.
4. **PSHS publishes any specification.** Supersedes this document entirely.
5. **Teacher validation.** Ratings from 3–5 Grade 6 maths teachers convert assumed weights
   into content-validity evidence and produce a CVI.

## Sources

- MATATAG Mathematics Curriculum Guide 2023, Grades 1–10 — https://www.academ-e.ph/wp-content/uploads/2023/09/Mathematics-CG-2023.pdf
- DepEd three-term calendar, SY 2026–2027 (DepEd Order No. 009, s. 2026) — https://www.dzrh.com.ph/post/deped-school-year-2026-2027-to-start-june-8-end-april-8
- NCE exam date, eligibility and the four content areas — https://jontotheworld.com/pisay-scholarship/
- 2026 intake figures and the four ranked sections — https://www.flipscience.ph/news/press-releases/pisay-announces-list-of-2026-qualifiers-reveals-plans-to-establish-10-more-campuses-nationwide/
- Official NCE FAQs — https://pshs.edu.ph/nce-faqs/
