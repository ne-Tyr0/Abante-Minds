# Item specifications

Generated from the question packs (math pack 1.30.0) by `node tools/item-spec.js`. Do not edit it by hand: CI fails when this file and the packs disagree, so it always describes what the app asks.

Each entry is a **template**, one kind of question. The app draws its numbers afresh every time, so one template stands for many items. A level starts at tier 1, moves to tier 2 after 3 answers right first time and to tier 3 after 6, and reviews a cleared level at tier 4; the practice exam asks at tier 3. **Draws** lists the ranges each tier uses. **Named mistakes** are the wrong answers the template recognises, each with its own feedback. The **example** is the question drawn at tier 1 from seed 1, exactly as the app would show it.

For a spreadsheet, or a panel of expert raters, `node tools/item-spec.js --csv` prints the same table, one row per template.

## Summary

| Topic | Weight | Levels | Templates | Competencies | Named mistakes |
|---|---:|---:|---:|---:|---:|
| Decimals | 13% | 6 | 26 | 20 | 68 |
| Fractions | 11% | 6 | 21 | 10 | 51 |
| Order of operations | 9% | 4 | 16 | 5 | 37 |
| Factors and primes | 4% | 4 | 15 | 5 | 38 |
| Ratio and proportion | 8% | 4 | 13 | 7 | 27 |
| Percentages | 5% | 3 | 14 | 2 | 30 |
| Time | 4% | 4 | 15 | 5 | 32 |
| Perimeter and area | 9% | 4 | 16 | 6 | 35 |
| Solids and volume | 9% | 5 | 24 | 13 | 64 |
| Circles | 8% | 4 | 17 | 7 | 36 |
| Graphs and data | 11% | 5 | 17 | 9 | 37 |
| Probability | 4% | 3 | 12 | 2 | 24 |
| Transformations | 5% | 4 | 15 | 3 | 36 |
| **All** | | **56** | **221** | **94** | **515** |

The path's templates serve 94 of the blueprint's 101 competencies: 79 of the 79 it marks practicable in the app, 15 of the 15 marked partly practicable, and 0 of the 7 marked not practicable.

Problem schemas on the path:

| Schema | Kind | Templates |
|---|---|---:|
| change | additive | 18 |
| combine | additive | 6 |
| compare | additive | 25 |
| equal-groups | multiplicative | 33 |
| rate | multiplicative | 5 |
| multiplicative-compare | multiplicative | 21 |
| part-whole | multiplicative | 56 |
| work-backwards | non-routine | 7 |
| missing-middle | non-routine | 4 |
| multi-step | non-routine | 37 |
| excess-info | non-routine | 9 |

Basics: 99 templates in 7 topics, practised beside the path and not counted towards the blueprint.

## The path

The blueprint's topics, in the order a learner meets them.

### 1. Decimals (`decimals`)

Blueprint weight 13%.

**Level 1: Place value** (`place-value`, 4 templates)

#### `decimals.digit-value`

Value of a digit from its place, to thousandths.

- **Competency:** G5.Q2.4, place value and digit value to thousandths
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** decimal
- **Draws:** `w: 1 to 9 (tiers 1–2), 10 to 99 (tiers 3–4)`; `d1: 1 to 9`; `d2: 1 to 9`; `d3: 1 to 9`; `p: 1 to 2 (tier 1), 1 to 3 (tiers 2–4)`
- **Kept only when:** `d1 != d2`; `d1 != d3`; `d2 != d3`; `w % 10 != g`; `floor(w / 10) != g`
- **Formats:** `value-of-digit`, `worth`, `expanded`
- **Named mistakes:** `gave-the-digit`, `one-place-too-far-left`, `one-place-too-far-right`
- **Example:** In 6.159, what is the value of the digit 5? **Answer: 0.05**

#### `decimals.write-from-words`

Write a decimal read in words, holding empty places with zeros.

- **Competency:** G5.Q2.5, read and write decimals to thousandths
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** decimal
- **Draws:** `w: 1 to 20 (tiers 1–2), 21 to 500 (tiers 3–4)`; `p: 1 to 2 (tier 1), 2 to 3 (tiers 2–4)`; `f: 1 to tenPow - 1`
- **Kept only when:** `p == 1 || f % 10 != 0`
- **Formats:** `words`, `ribbon`, `digits`
- **Named mistakes:** `missed-a-placeholder-zero`, `one-place-too-many`
- **Example:** Write 13 and 5 tenths as a decimal. **Answer: 13.5**

#### `decimals.to-fraction`

Write a terminating decimal as a fraction in lowest terms.

- **Competency:** G5.Q2.6, convert terminating decimals to fractions and back
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** fraction
- **Draws:** `p: 1 to 2 (tiers 1–2), 2 to 3 (tiers 3–4)`; `n: 1 to tenPow - 1`
- **Kept only when:** `g > 1`; `p == 1 || n % 10 != 0`
- **Formats:** `plain`, `jug`
- **Named mistakes:** `one-place-too-few`, `one-place-too-many`
- **Example:** A jug of water is 0.98 full. Write how full it is as a fraction in lowest terms. **Answer: 49/50**

#### `decimals.from-fraction`

Write a fraction as a terminating decimal.

- **Competency:** G5.Q2.6, convert terminating decimals to fractions and back
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** decimal
- **Draws:** `k: 1 to 3 (tier 1), 1 to 6 (tier 2), 4 to 9 (tiers 3–4)`; `num: 1 to den - 1`
- **Kept only when:** `gcd(num, den) == 1`
- **Formats:** `plain`, `jug`
- **Named mistakes:** `wrote-the-two-numbers`, `read-the-top-as-the-decimal`
- **Example:** A jug is 1/4 full. Write how full it is as a decimal. **Answer: 0.25**

**Level 2: Compare and round** (`compare-and-round`, 5 templates)

#### `decimals.greatest`

Compare decimals place by place, not by how many digits they have.

- **Competency:** G5.Q2.7, compare and order decimals to thousandths
- **Domain:** NA, Number and Algebra
- **Schema:** compare (additive)
- **Answer:** multiple choice
- **Draws:** `w: 0 to 0 (tiers 1–2), 1 to 9 (tiers 3–4)`; `x: 1 to 8`; `y: 1 to 9`
- **Formats:** `greatest`, `heaviest`, `farthest`
- **Named mistakes:** `longer-looks-bigger`, `stopped-at-the-tenths`, `read-past-the-zero`
- **Example:** Four children threw a ball. The distances are in metres. Which throw went farthest? Choices: 0.105; 0.1; 0.015; 0.15. **Answer: 0.15**

#### `decimals.between`

Find a decimal between two others.

- **Competency:** G5.Q2.7, compare and order decimals to thousandths
- **Domain:** NA, Number and Algebra
- **Schema:** compare (additive)
- **Answer:** multiple choice
- **Draws:** `w: 1 to 9 (tiers 1–2), 10 to 99 (tiers 3–4)`; `h: 11 to 89`; `m: 1 to 9`
- **Kept only when:** `h % 10 != 0`
- **Formats:** `between`, `greater-but-less`, `race`
- **Named mistakes:** `below-the-lower`, `above-the-upper`, `same-digits-wrong-places`
- **Example:** A runner's time was more than 6.11 seconds and less than 6.16 seconds. Which could it be? Choices: 6.115; 6.105; 6.011; 6.165. **Answer: 6.115**

#### `decimals.round`

Round a decimal to a given place by the digit after it.

- **Competency:** G5.Q2.8, round decimals to the nearest thousandth
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** decimal, up to 3 decimal places
- **Draws:** `w: 1 to 20 (tiers 1–2), 21 to 999 (tiers 3–4)`; `e: 1000 to 9999`; `p: 1 to 2 (tier 1), 1 to 3 (tiers 2–4)`
- **Kept only when:** `e % 10 != 0`
- **Formats:** `plain`, `scale`
- **Named mistakes:** `cut-off-instead-of-rounding`, `rounded-to-the-wrong-place`, `did-not-round`
- **Example:** A scale shows 13.1024 kg. Round the weight to the nearest hundredth of a kilogram. **Answer: 13.1**

#### `decimals.round-money`

Round an amount of money to the nearest peso by its centavos.

- **Competency:** G5.Q2.8, round decimals to the nearest thousandth
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** whole number, in ₱
- **Draws:** `n: 10 to 99 (tiers 1–2), 100 to 999 (tiers 3–4)`; `c: 1 to 99`
- **Kept only when:** `c != 50`
- **Formats:** `price`, `round`
- **Named mistakes:** `dropped-the-centavos`, `rounded-up-anyway`
- **Example:** Round ₱66.01 to the nearest peso. **Answer: ₱66**

#### `decimals.order`

Put four decimals in order from least to greatest, place by place.

- **Competency:** G5.Q2.7, compare and order decimals to thousandths
- **Domain:** NA, Number and Algebra
- **Schema:** compare (additive)
- **Answer:** multiple choice
- **Draws:** `w: 0 to 9 (tiers 1–2), 0 to 20 (tiers 3–4)`; `d1: 1 to 9`; `d2: 1 to 9`; `k: 1 to 4`
- **Formats:** `order`
- **Named mistakes:** `misplaced-a`, `misplaced-b`, `misplaced-c`
- **Example:** Put these numbers in order from least to greatest: 6.15, 6.015, 6.105, 6.1. Which comes fourth? Choices: 6.105; 6.1; 6.015; 6.15. **Answer: 6.15**

**Level 3: Add and subtract** (`add-and-subtract`, 4 templates)

#### `decimals.add`

Add decimals with different numbers of places by lining up the points.

- **Competency:** G5.Q2.9, add and subtract decimals to 3 decimal places
- **Domain:** NA, Number and Algebra
- **Schema:** combine (additive)
- **Answer:** decimal
- **Draws:** `pa: 2 to 2 (tiers 1–2), 3 to 3 (tiers 3–4)`; `w1: 1 to 9 (tier 1), 1 to 30 (tiers 2–4)`; `f1: 11 to aPow - 1`; `w2: 1 to 19 (tier 1), 10 to 60 (tiers 2–4)`; `f2: 1 to 9`
- **Kept only when:** `f1 % 10 != 0`
- **Formats:** `sum`, `walk`, `sum-of`
- **Named mistakes:** `lined-up-the-last-digits`, `added-tenths-as-smaller-places`
- **Example:** 1.57 + 19.9 = ? **Answer: 21.47**

#### `decimals.subtract`

Subtract a decimal of up to four places from a whole number.

- **Competency:** G6.Q1.4, add and subtract decimals to 4 decimal places
- **Domain:** NA, Number and Algebra
- **Schema:** change (additive)
- **Answer:** decimal
- **Draws:** `pb: 2 to 2 (tier 1), 2 to 3 (tier 2), 3 to 4 (tiers 3–4)`; `w2: 1 to 8 (tiers 1–2), 10 to 80 (tiers 3–4)`; `f2: 1 to bPow - 1`; `a: w2 + 1 to w2 + 9`
- **Kept only when:** `f2 % 10 != 0`
- **Formats:** `difference`, `rope`, `how-much-more`
- **Named mistakes:** `took-away-only-the-whole`, `added-instead-of-subtracted`
- **Example:** How much more is 10 than 1.53? **Answer: 8.47**

#### `decimals.change-money`

Two purchases and the change, in pesos and centavos.

- **Competency:** G5.Q2.10, multi-step add/subtract decimal problems, including money
- **Domain:** NA, Number and Algebra
- **Schema:** multi-step (non-routine)
- **Answer:** decimal, in ₱, up to 2 decimal places
- **Draws:** `p1: 15 to 60 in steps of 0.25 (tiers 1–2), 60 to 250 in steps of 0.25 (tiers 3–4)`; `p2: 10 to 40 in steps of 0.25 (tiers 1–2), 40 to 200 in steps of 0.25 (tiers 3–4)`; `bill: one of 100, 200, 500, 1000`
- **Kept only when:** `floor(p1) != p1`; `floor(p2) != p2`; `p1 + p2 < bill`
- **Formats:** `notebook`, `market`
- **Named mistakes:** `gave-the-amount-spent`, `left-out-the-second-item`, `left-out-the-first-item`
- **Example:** At the market, fish costs ₱59.25 and vegetables cost ₱39.25. How much is left from ₱200? **Answer: ₱101.5**

#### `decimals.what-is-left`

Take two amounts with different numbers of places from a total.

- **Competency:** G6.Q1.5, multi-step add/subtract decimal problems, including money
- **Domain:** NA, Number and Algebra
- **Schema:** multi-step (non-routine)
- **Answer:** decimal
- **Draws:** `total: 10 to 30 in steps of 0.5 (tiers 1–2), 30 to 90 in steps of 0.5 (tiers 3–4)`; `s1: 1.25 to 9.75 in steps of 0.25`; `s2: 1.125 to 9.875 in steps of 0.125`
- **Kept only when:** `s1 + s2 < total`; `floor(s2 * 100) != s2 * 100`
- **Formats:** `rice`, `water`
- **Named mistakes:** `gave-the-amount-used`, `took-away-only-one`, `added-the-second-back`
- **Example:** A tank holds 22.5 L of water. 7.5 L is used for cooking and 4.875 L for washing. How much water is left? **Answer: 10.125**

**Level 4: Multiply** (`multiply`, 5 templates)

#### `decimals.times-powers`

Multiply by 10, 100, 1000 or by 0.1, 0.01, 0.001 by moving the point.

- **Competency:** G6.Q1.6, mentally multiply decimals by 0.1, 0.01, 0.001, 10, 100, 1000
- **Domain:** NA, Number and Algebra
- **Schema:** multiplicative-compare (multiplicative)
- **Answer:** decimal
- **Draws:** `k: 1 to 3 (tier 1), 1 to 6 (tiers 2–4)`; `q: 1 to 1 (tier 1), 1 to 2 (tiers 2–4)`; `w: 1 to 99`; `f: 1 to qPow - 1`
- **Kept only when:** `q == 1 || f % 10 != 0`
- **Formats:** `product`, `mental`
- **Named mistakes:** `moved-the-wrong-way`, `ten-times-too-big`, `ten-times-too-small`
- **Example:** Work it out in your head: 53.9 × 100. **Answer: 5390**

#### `decimals.multiply`

Multiply decimals and place the point by counting decimal places.

- **Competency:** G5.Q3.10, multiply decimals to 2 decimal places
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** decimal
- **Draws:** `pa: 1 to 1 (tiers 1–2), 1 to 2 (tiers 3–4)`; `ai: 11 to 49 (tiers 1–2), 11 to 99 (tiers 3–4)`; `bi: 11 to 49`
- **Kept only when:** `ai % 10 != 0`; `bi % 10 != 0`
- **Formats:** `product`, `cloth`, `product-of`
- **Named mistakes:** `left-out-the-point`, `one-place-too-few`, `one-place-too-many`
- **Example:** Find the product of 1.1 and 3.1. **Answer: 3.41**

#### `decimals.estimate-product`

Estimate a product by rounding each factor to a whole number.

- **Competency:** G5.Q3.9, estimate a product of two decimals
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** multiple choice
- **Draws:** `A: 2 to 9 (tiers 1–2), 11 to 30 (tiers 3–4)`; `B: 3 to 9`; `da: 1 to 7`; `db: 1 to 7`
- **Kept only when:** `da != 4`; `db != 4`
- **Formats:** `best-estimate`, `about`
- **Named mistakes:** `ten-times-too-big`, `ten-times-too-small`, `added-instead-of-multiplied`
- **Example:** Which is the best estimate of 9.1 × 4.2? Choices: 36; 3.6; 13; 360. **Answer: 36**

#### `decimals.price-per-kilo`

Cost of a decimal number of kilograms at a price per kilogram.

- **Competency:** G5.Q3.11, multi-step decimal multiplication problems, including money
- **Domain:** NA, Number and Algebra
- **Schema:** rate (multiplicative)
- **Answer:** decimal, in ₱, up to 2 decimal places
- **Draws:** `p: 40 to 120 in steps of 0.5 (tiers 1–2), 120 to 380 in steps of 0.5 (tiers 3–4)`; `kgi: 12 to 35 (tiers 1–2), 12 to 75 (tiers 3–4)`
- **Kept only when:** `kgi % 10 != 0`
- **Formats:** `fish`, `galunggong`
- **Named mistakes:** `left-out-the-point`, `paid-only-for-whole-kilos`, `added-instead-of-multiplied`
- **Example:** Galunggong is sold at ₱90 per kilogram. What does 1.2 kg cost? **Answer: ₱108**

#### `decimals.multiply-money`

Two purchases of several items at decimal prices.

- **Competency:** G6.Q1.7, multi-step decimal multiplication problems, including money
- **Domain:** NA, Number and Algebra
- **Schema:** multi-step (non-routine)
- **Answer:** decimal, in ₱, up to 2 decimal places
- **Draws:** `n1: 2 to 5`; `p1: 12 to 45 in steps of 0.25 (tiers 1–2), 45 to 150 in steps of 0.25 (tiers 3–4)`; `n2: 2 to 5`; `p2: 5 to 30 in steps of 0.25 (tiers 1–2), 30 to 120 in steps of 0.25 (tiers 3–4)`
- **Kept only when:** `floor(p1) != p1`; `floor(p2) != p2`; `p1 != p2`
- **Formats:** `school`, `canteen`
- **Named mistakes:** `left-out-the-second-item`, `added-one-of-each`, `used-one-price-for-all`
- **Example:** Ana buys 2 notebooks at ₱25.25 each and 2 pens at ₱8.75 each. How much does she pay in all? **Answer: ₱68**

**Level 5: Divide** (`divide`, 4 templates)

#### `decimals.divide-powers`

Divide by 10, 100, 1000 or by 0.1, 0.01 by moving the point.

- **Competency:** G6.Q1.9, mentally divide decimals by 0.1/0.01/0.001 and 10/100/1000
- **Domain:** NA, Number and Algebra
- **Schema:** multiplicative-compare (multiplicative)
- **Answer:** decimal
- **Draws:** `k: 1 to 3 (tier 1), 1 to 5 (tiers 2–4)`; `w: 1 to 99 (tiers 1–2), 100 to 999 (tiers 3–4)`; `f: 1 to 9`
- **Formats:** `quotient`, `mental`
- **Named mistakes:** `moved-the-wrong-way`, `ten-times-too-big`, `ten-times-too-small`
- **Example:** Work it out in your head: 1.5 ÷ 100. **Answer: 0.015**

#### `decimals.divide-by-whole`

Divide a decimal by a whole number to a terminating quotient.

- **Competency:** G5.Q3.13, divide to a terminating decimal quotient
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** decimal
- **Draws:** `d: 2 to 5 (tiers 1–2), 3 to 9 (tiers 3–4)`; `w: 1 to 20`; `f: 1 to 99`
- **Kept only when:** `f % 10 != 0`
- **Formats:** `quotient`, `wire`, `sugar`
- **Named mistakes:** `left-out-the-point`, `point-one-place-off`, `multiplied-instead-of-divided`
- **Example:** 6.12 kg of sugar is shared equally among 4 bags. How much goes in each bag? **Answer: 1.53**

#### `decimals.divide-by-decimal`

Divide by a one-place decimal by making the divisor whole.

- **Competency:** G6.Q1.8, divide to a repeating decimal quotient; whole by 1dp decimal
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `k: 2 to 9`; `t: 2 to 20 (tiers 1–2), 11 to 60 (tiers 3–4)`
- **Formats:** `plain`, `cups`
- **Named mistakes:** `ignored-the-point-in-the-divisor`, `multiplied-instead-of-divided`
- **Example:** How many 0.7-litre cups can be filled from 1.4 litres of juice? **Answer: 2**

#### `decimals.estimate-quotient`

Estimate a quotient with compatible whole numbers.

- **Competency:** G5.Q3.12, estimate a quotient of two decimals
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** multiple choice
- **Draws:** `B: 3 to 9`; `Qt: 3 to 9 (tiers 1–2), 6 to 20 (tiers 3–4)`; `da: 1 to 7`; `db: 1 to 7`
- **Kept only when:** `da != 4`; `db != 4`
- **Formats:** `best-estimate`, `about`
- **Named mistakes:** `ten-times-too-big`, `ten-times-too-small`, `multiplied-instead-of-divided`
- **Example:** Which is the best estimate of 36.1 ÷ 9.2? Choices: 40; 0.4; 4; 324. **Answer: 4**

**Level 6: Word problems** (`word-problems`, 4 templates)

#### `decimals.share-cost`

Total a purchase, then share the cost equally.

- **Competency:** G5.Q4.1, multi-step decimal division problems, including money
- **Domain:** NA, Number and Algebra
- **Schema:** multi-step (non-routine)
- **Answer:** decimal, in ₱, up to 2 decimal places
- **Draws:** `people: 2 to 6`; `items: 2 to 4`; `price: 80 to 200 in steps of 0.5 (tiers 1–2), 150 to 450 in steps of 0.5 (tiers 3–4)`
- **Kept only when:** `floor(items * price * 100 / people) == items * price * 100 / people`; `floor(price) != price`
- **Formats:** `pizza`, `donuts`
- **Named mistakes:** `gave-the-total`, `shared-only-one-item`
- **Example:** 5 classmates buy 2 boxes of donuts at ₱143.50 a box and split the cost equally. How much does each one pay? **Answer: ₱57.4**

#### `decimals.how-many-pieces`

Divide a length by a decimal piece size, ignoring a number the question does not need.

- **Competency:** G6.Q1.10, solve problems involving division of decimals
- **Domain:** NA, Number and Algebra
- **Schema:** excess-info (non-routine)
- **Answer:** whole number
- **Draws:** `vi: one of 25, 50, 75, 125, 150`; `t: 4 to 20 (tiers 1–2), 12 to 40 (tiers 3–4)`; `p: 20 to 90`
- **Formats:** `ribbon`, `juice`
- **Named mistakes:** `used-the-price`, `multiplied-instead-of-divided`
- **Example:** A jug holds 5 L of juice and costs ₱57. How many 1.25 L cups can it fill? **Answer: 4**

#### `decimals.cost-of-more`

Find the price of 1 by dividing by a decimal, then the cost of several.

- **Competency:** G5.Q4.1, multi-step decimal division problems, including money
- **Domain:** NA, Number and Algebra
- **Schema:** multi-step (non-routine)
- **Answer:** decimal, in ₱, up to 2 decimal places
- **Draws:** `k: 4 to 18 (tiers 1–2), 8 to 36 (tiers 3–4)`; `w: one of 0.5, 0.75, 1.25, 1.5, 2.5, 3.5`; `n: 2 to 6`; `m: 1 to 2`
- **Formats:** `per-unit`
- **Named mistakes:** `gave-the-price-of-one`, `multiplied-the-whole-price`
- **Example:** A bag of rice weighing 0.5 kg costs ₱32.50. At the same price per kilogram, how much do 4 kg cost? **Answer: ₱260**

#### `decimals.money-left`

Share an amount equally, then take away what each one spends.

- **Competency:** G5.Q4.1, multi-step decimal division problems, including money
- **Domain:** NA, Number and Algebra
- **Schema:** multi-step (non-routine)
- **Answer:** decimal, in ₱, up to 2 decimal places
- **Draws:** `n: 2 to 5`; `share: 20 to 100 in steps of 0.25 (tiers 1–2), 50 to 250 in steps of 0.25 (tiers 3–4)`; `s: 5 to share - 5 in steps of 0.25`
- **Kept only when:** `floor(s) != s || floor(share) != share`; `floor((T - s) * 100 / n) == (T - s) * 100 / n`
- **Formats:** `nephews`, `officers`
- **Named mistakes:** `did-not-share`, `took-away-only-once`, `forgot-the-spending`
- **Example:** The 5 officers of a class share ₱487.50 from their fund equally. Each one spends ₱29.50 on supplies. How much does each officer have left? **Answer: ₱68**

### 2. Fractions (`fractions`)

Blueprint weight 11%.

**Level 1: Multiply** (`multiply`, 3 templates)

#### `fractions.multiply`

Multiply a proper fraction by a proper fraction and give the product in lowest terms.

- **Competency:** G5.Q1.8, multiply a fraction by a fraction
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** fraction
- **Draws:** `b: 2 to 6 (tiers 1–2), 3 to 10 (tiers 3–4)`; `a: 1 to b - 1`; `d: 2 to 6 (tiers 1–2), 3 to 10 (tiers 3–4)`; `c: 1 to d - 1`
- **Kept only when:** `gcd(a, b) == 1`; `gcd(c, d) == 1`
- **Formats:** `product`, `of`, `product-of`
- **Named mistakes:** `added-the-fractions`, `divided-instead`, `kept-the-denominator`
- **Example:** Find the product of 1/5 and 3/4. **Answer: 3/20**

#### `fractions.shaded-both`

Read a product of fractions from an area model: the part shaded twice.

- **Competency:** G5.Q1.7, multiply fractions using models
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** fraction
- **Draws:** `b: 2 to 5 (tiers 1–2), 3 to 8 (tiers 3–4)`; `a: 1 to b - 1`; `d: 2 to 5 (tiers 1–2), 3 to 8 (tiers 3–4)`; `c: 1 to d - 1`
- **Formats:** `square`, `bibingka`
- **Named mistakes:** `counted-only-the-columns`, `counted-only-the-rows`, `counted-either`
- **Example:** A tray of bibingka is cut into 4 equal columns and 4 equal rows. The pieces in 1 of the columns have cheese. The pieces in 3 of the rows have salted egg. What fraction of the tray has both cheese and salted egg? **Answer: 3/16**

#### `fractions.part-of-a-part`

A fraction of a fraction of a whole, in words.

- **Competency:** G5.Q1.8, multiply a fraction by a fraction
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** fraction
- **Draws:** `b: 2 to 6 (tiers 1–2), 3 to 10 (tiers 3–4)`; `a: 1 to b - 1`; `d: 2 to 6 (tiers 1–2), 3 to 10 (tiers 3–4)`; `c: 1 to d - 1`
- **Kept only when:** `gcd(a, b) == 1`; `gcd(c, d) == 1`
- **Formats:** `farm`, `pizza`, `savings`
- **Named mistakes:** `gave-the-fraction-of-the-part`, `added-the-fractions`
- **Example:** Mila saves 1/5 of her allowance. She puts 3/4 of her savings in the bank. What fraction of her allowance goes in the bank? **Answer: 3/20**

**Level 2: Multiply mixed numbers** (`mixed-numbers`, 4 templates)

#### `fractions.of-a-whole`

A fraction of a whole number, where the answer is a whole number.

- **Competency:** G6.Q1.11, products of fractions, whole numbers and mixed numbers
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** whole number
- **Draws:** `b: 3 to 5 (tiers 1–2), 3 to 12 (tiers 3–4)`; `a: 2 to b - 1`; `k: 2 to 10 (tiers 1–2), 4 to 25 (tiers 3–4)`
- **Kept only when:** `gcd(a, b) == 1`
- **Formats:** `of`, `rice`, `pupils`
- **Named mistakes:** `found-one-part`, `did-not-divide`, `flipped-the-fraction`
- **Example:** A store has 20 kg of rice. It sells 4/5 of it. How many kilograms of rice does it sell? **Answer: 16**

#### `fractions.whole-times-fraction`

A whole number times a proper fraction, answered as a mixed number.

- **Competency:** G6.Q1.11, products of fractions, whole numbers and mixed numbers
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** mixed number
- **Draws:** `n: 2 to 6 (tiers 1–2), 3 to 12 (tiers 3–4)`; `b: 2 to 6 (tiers 1–2), 3 to 12 (tiers 3–4)`; `a: 1 to b - 1`
- **Kept only when:** `gcd(a, b) == 1`; `floor(p) != p`; `p > 1`
- **Formats:** `product`, `juice`, `walk`
- **Named mistakes:** `multiplied-the-denominator-too`, `added-instead`
- **Example:** Ben walks 1/2 km to school. How far does he walk in 5 trips to school? **Answer: 2 1/2**

#### `fractions.mixed-times-mixed`

Multiply two mixed numbers through improper fractions.

- **Competency:** G6.Q1.11, products of fractions, whole numbers and mixed numbers
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** mixed number
- **Draws:** `w1: 1 to 3 (tiers 1–2), 1 to 6 (tiers 3–4)`; `b: 2 to 5 (tiers 1–2), 2 to 8 (tiers 3–4)`; `a: 1 to b - 1`; `w2: 1 to 2 (tiers 1–2), 1 to 4 (tiers 3–4)`; `d: 2 to 5 (tiers 1–2), 2 to 8 (tiers 3–4)`; `c: 1 to d - 1`
- **Kept only when:** `gcd(a, b) == 1`; `gcd(c, d) == 1`; `floor(p) != p`
- **Formats:** `product`, `garden`
- **Named mistakes:** `multiplied-the-parts-separately`, `added-instead`
- **Example:** 1 1/3 × 1 1/3 = ? **Answer: 1 7/9**

#### `fractions.recipe`

Scale a fraction of a cup or litre by a whole number, as a mixed number.

- **Competency:** G6.Q1.11, products of fractions, whole numbers and mixed numbers
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** mixed number
- **Draws:** `b: 2 to 8`; `a: 1 to b - 1`; `n: 2 to 6 (tiers 1–2), 3 to 12 (tiers 3–4)`
- **Kept only when:** `gcd(a, b) == 1`; `n * a > b`; `n * a % b != 0`
- **Formats:** `polvoron`, `paint`
- **Named mistakes:** `divided-instead`, `added-instead`, `multiplied-top-and-bottom`
- **Example:** Each chair needs 7/8 litre of paint. How much paint do 3 chairs need? **Answer: 2 5/8**

**Level 3: Multiply in steps** (`multiply-in-steps`, 4 templates)

#### `fractions.spent-then-spent`

Two spendings, the second a fraction of what is left.

- **Competency:** G5.Q1.9, multi-step problems multiplying fractions
- **Domain:** NA, Number and Algebra
- **Schema:** multi-step (non-routine)
- **Answer:** whole number, in ₱
- **Draws:** `b: 2 to 5 (tiers 1–2), 2 to 6 (tiers 3–4)`; `a: 1 to b - 1`; `d: 2 to 5 (tiers 1–2), 2 to 6 (tiers 3–4)`; `c: 1 to d - 1`; `k: 1 to 4 (tiers 1–2), 1 to 8 (tiers 3–4)`
- **Kept only when:** `gcd(a, b) == 1`; `gcd(c, d) == 1`; `m <= 2000`
- **Formats:** `allowance`, `savings`
- **Named mistakes:** `stopped-after-one-step`, `took-both-from-the-start`, `gave-the-second-amount`
- **Example:** Lito has ₱640. He spends 1/4 of it on a book, then 3/4 of what is left on a snack. How much money does he have left? **Answer: ₱120**

#### `fractions.part-of-a-group`

A fraction of a fraction of a group of things, counted.

- **Competency:** G5.Q1.9, multi-step problems multiplying fractions
- **Domain:** NA, Number and Algebra
- **Schema:** multi-step (non-routine)
- **Answer:** whole number
- **Draws:** `b: 2 to 5 (tiers 1–2), 2 to 6 (tiers 3–4)`; `a: 1 to b - 1`; `d: 2 to 5 (tiers 1–2), 2 to 6 (tiers 3–4)`; `c: 1 to d - 1`; `k: 1 to 4`
- **Kept only when:** `gcd(a, b) == 1`; `gcd(c, d) == 1`; `n >= 12`; `n <= 60`
- **Formats:** `club`, `mangoes`
- **Named mistakes:** `stopped-after-one-step`, `took-it-of-the-whole-group`
- **Example:** There are 16 pupils in a class. 1/2 of them are girls, and 1/2 of the girls are in the math club. How many girls are in the math club? **Answer: 4**

#### `fractions.part-of-the-total`

A fraction of a whole number of mixed-number amounts, in two multiplications.

- **Competency:** G6.Q1.12, multi-step multiplication with fraction combinations
- **Domain:** NA, Number and Algebra
- **Schema:** multi-step (non-routine)
- **Answer:** mixed number
- **Draws:** `w: 1 to 3 (tiers 1–2), 1 to 5 (tiers 3–4)`; `b: 2 to 4 (tiers 1–2), 2 to 8 (tiers 3–4)`; `a: 1 to b - 1`; `n: 2 to 4 (tiers 1–2), 2 to 6 (tiers 3–4)`; `d: 2 to 5 (tiers 1–2), 2 to 8 (tiers 3–4)`; `c: 1 to d - 1`
- **Kept only when:** `gcd(a, b) == 1`; `gcd(c, d) == 1`; `floor(p) != p`; `p > 1`
- **Formats:** `rice`, `paint`
- **Named mistakes:** `forgot-the-fraction`, `used-only-one`
- **Example:** A can holds 2 1/4 L of paint. Mang Ben opens 2 cans and uses 1/2 of all the paint on a wall. How many litres does he use? **Answer: 2 1/4**

#### `fractions.extra-group`

Take a fraction of part of a group, ignoring the size of the whole group.

- **Competency:** G5.Q1.9, multi-step problems multiplying fractions
- **Domain:** NA, Number and Algebra
- **Schema:** excess-info (non-routine)
- **Answer:** whole number
- **Draws:** `den: one of 2, 3, 4, 5`; `num: 1 to den - 1`; `k: 3 to 8`; `b: 8 to 20`
- **Formats:** `choir`, `garden`
- **Named mistakes:** `used-the-whole-group`, `gave-the-rest`
- **Example:** A garden has 44 plants, and 24 of them are tomato plants. 1/4 of the tomato plants have flowers. How many tomato plants have flowers? **Answer: 6**

**Level 4: Divide** (`divide`, 3 templates)

#### `fractions.how-many-fit`

Divide by a fraction as counting how many of it fit, with a whole-number answer.

- **Competency:** G5.Q2.1, divide fractions using models
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `d: 2 to 8 (tiers 1–2), 3 to 12 (tiers 3–4)`; `cmax: 1 to 1 (tiers 1–2), 11 to 11 (tiers 3–4)`; `c: 1 to min(cmax, d - 1)`; `k: 2 to 6 (tiers 1–2), 2 to 12 (tiers 3–4)`
- **Kept only when:** `gcd(c, d) == 1`
- **Formats:** `count`, `juice`, `ribbon`
- **Named mistakes:** `counted-how-many-fit-in-one`, `multiplied-instead`
- **Example:** How many pieces, each 1/6 m long, can be cut from a ribbon 1 m long? **Answer: 6**

#### `fractions.divide`

Divide a proper fraction by a larger proper fraction using the reciprocal.

- **Competency:** G5.Q2.2, divide a fraction by a fraction
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** fraction
- **Draws:** `b: 2 to 6 (tiers 1–2), 3 to 10 (tiers 3–4)`; `a: 1 to b - 1`; `d: 2 to 6 (tiers 1–2), 3 to 10 (tiers 3–4)`; `c: 1 to d - 1`
- **Kept only when:** `gcd(a, b) == 1`; `gcd(c, d) == 1`; `a * d < b * c`
- **Formats:** `quotient`, `divide`
- **Named mistakes:** `did-not-flip`, `flipped-the-first`
- **Example:** Divide 1/5 by 3/4. **Answer: 4/15**

#### `fractions.find-the-whole`

Find a number from a fraction of it, by dividing fractions.

- **Competency:** G5.Q2.2, divide a fraction by a fraction
- **Domain:** NA, Number and Algebra
- **Schema:** work-backwards (non-routine)
- **Answer:** fraction
- **Draws:** `f: 2 to 6 (tiers 1–2), 3 to 9 (tiers 3–4)`; `e: 1 to f - 1`; `d: 2 to 5 (tiers 1–2), 2 to 8 (tiers 3–4)`; `c: 1 to d - 1`
- **Kept only when:** `gcd(e, f) == 1`; `gcd(c, d) == 1`
- **Formats:** `number`, `wall`
- **Named mistakes:** `multiplied-instead`, `divided-the-wrong-way`
- **Example:** Mang Ben has painted 3/20 of a wall. That is 3/4 of the part he plans to paint today. What fraction of the wall does he plan to paint today? **Answer: 1/5**

**Level 5: Divide mixed numbers** (`divide-mixed-numbers`, 4 templates)

#### `fractions.whole-by-fraction`

Divide a whole number by a proper fraction, with a whole-number answer.

- **Competency:** G6.Q1.13, divide combinations of fractions, wholes and mixed numbers
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `d: 2 to 6 (tiers 1–2), 2 to 10 (tiers 3–4)`; `c: 1 to d - 1`; `m: 1 to 6 (tiers 1–2), 2 to 10 (tiers 3–4)`
- **Kept only when:** `gcd(c, d) == 1`; `n >= 2`
- **Formats:** `quotient`, `sugar`, `laps`
- **Named mistakes:** `multiplied-instead`, `multiplied-by-the-denominator-only`
- **Example:** One lap around the plaza is 1/5 km. How many laps make 4 km? **Answer: 20**

#### `fractions.fraction-by-whole`

Divide a proper fraction by a whole number: sharing a part.

- **Competency:** G6.Q1.13, divide combinations of fractions, wholes and mixed numbers
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** fraction
- **Draws:** `b: 2 to 6 (tiers 1–2), 2 to 10 (tiers 3–4)`; `a: 1 to b - 1`; `n: 2 to 5 (tiers 1–2), 2 to 9 (tiers 3–4)`
- **Kept only when:** `gcd(a, b) == 1`
- **Formats:** `quotient`, `pizza`, `land`
- **Named mistakes:** `multiplied-instead`, `divided-the-wrong-way`
- **Example:** Mang Jose divides 1/5 hectare of land equally among his 4 children. What part of a hectare does each child get? **Answer: 1/20**

#### `fractions.mixed-by-mixed`

Divide a mixed number by a mixed number or a fraction, through improper fractions.

- **Competency:** G6.Q1.13, divide combinations of fractions, wholes and mixed numbers
- **Domain:** NA, Number and Algebra
- **Schema:** rate (multiplicative)
- **Answer:** mixed number
- **Draws:** `w1: 1 to 4 (tiers 1–2), 2 to 9 (tiers 3–4)`; `b: 2 to 4 (tiers 1–2), 2 to 6 (tiers 3–4)`; `a: 1 to b - 1`; `w2: 0 to 1 (tiers 1–2), 0 to 3 (tiers 3–4)`; `d: 2 to 4 (tiers 1–2), 2 to 6 (tiers 3–4)`; `c: 1 to d - 1`
- **Kept only when:** `gcd(a, b) == 1`; `gcd(c, d) == 1`; `floor(p) != p`; `p > 1`
- **Formats:** `quotient`, `walk`
- **Named mistakes:** `did-not-flip`, `divided-the-parts-separately`, `divided-the-wrong-way`
- **Example:** Ana walks 3 1/2 km in 1 1/4 h at a steady pace. How many kilometres does she walk in 1 h? **Answer: 2 4/5**

#### `fractions.share-mixed`

Share a mixed number equally by a whole number, through an improper fraction.

- **Competency:** G6.Q1.13, divide combinations of fractions, wholes and mixed numbers
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** mixed number
- **Draws:** `d: 2 to 6`; `n: 2 to 5`; `k: n * d + 1 to 4 * n * d`
- **Kept only when:** `k % d != 0`; `k % (d * n) != 0`; `gcd(k, d) == 1`
- **Formats:** `rice`, `ribbon`
- **Named mistakes:** `multiplied-instead`, `divided-only-the-whole-number`, `took-away`
- **Example:** A ribbon 5 1/5 m long is cut into 2 equal pieces. How long is each piece, in metres? **Answer: 2 3/5**

**Level 6: Divide in steps** (`divide-in-steps`, 3 templates)

#### `fractions.cut-the-rest`

Take away a mixed amount, then count how many fraction-sized pieces the rest makes.

- **Competency:** G6.Q1.14, multi-step division with fraction combinations
- **Domain:** NA, Number and Algebra
- **Schema:** multi-step (non-routine)
- **Answer:** whole number
- **Draws:** `d: 2 to 4 (tiers 1–2), 2 to 8 (tiers 3–4)`; `c: 1 to d - 1`; `k: 2 to 8 (tiers 1–2), 4 to 15 (tiers 3–4)`; `j: 1 to 3 (tiers 1–2), 1 to 6 (tiers 3–4)`
- **Kept only when:** `gcd(c, d) == 1`
- **Formats:** `ribbon`, `rice`
- **Named mistakes:** `did-not-take-away`, `gave-what-is-left`
- **Example:** Aling Rosa has 2 2/3 kg of rice. She cooks 1 kg and packs the rest into bags of 1/3 kg each. How many bags does she fill? **Answer: 5**

#### `fractions.share-the-rest`

Take away a fraction, then share the rest equally: subtract, then divide.

- **Competency:** G5.Q2.3, multi-step problems dividing fractions
- **Domain:** NA, Number and Algebra
- **Schema:** multi-step (non-routine)
- **Answer:** fraction
- **Draws:** `b: 3 to 6 (tiers 1–2), 3 to 12 (tiers 3–4)`; `a: 2 to b - 1`; `e: 1 to a - 1`; `n: 2 to 4 (tiers 1–2), 2 to 6 (tiers 3–4)`
- **Kept only when:** `gcd(a, b) == 1`
- **Formats:** `cake`, `land`
- **Named mistakes:** `did-not-take-away`, `gave-the-rest`, `multiplied-instead`
- **Example:** Mang Jose owns 2/5 hectare of land. He keeps 1/5 hectare for his house and divides the rest equally among his 4 children. What part of a hectare does each child get? **Answer: 1/20**

#### `fractions.pour-together`

Add two mixed amounts, then count how many fraction-sized portions they make.

- **Competency:** G6.Q1.14, multi-step division with fraction combinations
- **Domain:** NA, Number and Algebra
- **Schema:** multi-step (non-routine)
- **Answer:** whole number
- **Draws:** `d: 2 to 4 (tiers 1–2), 2 to 8 (tiers 3–4)`; `c: 1 to d - 1`; `k1: 3 to 8 (tiers 1–2), 3 to 14 (tiers 3–4)`; `k2: 3 to 8 (tiers 1–2), 3 to 14 (tiers 3–4)`
- **Kept only when:** `gcd(c, d) == 1`; `k1 != k2`; `k1 * c > d`; `k2 * c > d`; `k1 * c % d != 0`; `k2 * c % d != 0`
- **Formats:** `juice`, `flour`
- **Named mistakes:** `used-only-one-amount`, `gave-the-total`, `multiplied-instead`
- **Example:** Lito has two jugs of juice: one holds 1 1/2 L and the other 1 3/4 L. He pours all of it into cups of 1/4 L each. How many cups does he fill? **Answer: 13**

### 3. Order of operations (`gemdas`)

Blueprint weight 9%.

**Level 1: Order of operations** (`gmdas`, 5 templates)

#### `gemdas.add-times`

Multiply before adding.

- **Competency:** G5.Q1.6, perform three or more operations applying GMDAS
- **Domain:** NA, Number and Algebra
- **Schema:** combine (additive)
- **Answer:** whole number
- **Draws:** `a: 2 to 20 (tiers 1–2), 10 to 99 (tiers 3–4)`; `b: 2 to 9 (tiers 1–2), 3 to 12 (tiers 3–4)`; `c: 2 to 9 (tiers 1–2), 3 to 12 (tiers 3–4)`
- **Formats:** `expression`
- **Named mistakes:** `worked-left-to-right`, `added-everything`
- **Example:** 13 + 2 × 6 = ? **Answer: 25**

#### `gemdas.take-divide`

Divide before taking away.

- **Competency:** G5.Q1.6, perform three or more operations applying GMDAS
- **Domain:** NA, Number and Algebra
- **Schema:** change (additive)
- **Answer:** whole number
- **Draws:** `q: 2 to 9 (tiers 1–2), 3 to 15 (tiers 3–4)`; `d: 2 to 9 (tiers 1–2), 3 to 12 (tiers 3–4)`; `a: n + 1 to n + 30`
- **Kept only when:** `a > q`
- **Formats:** `expression`
- **Named mistakes:** `worked-left-to-right`, `ignored-the-division`
- **Example:** 30 − 14 ÷ 2 = ? **Answer: 23**

#### `gemdas.brackets`

Work out brackets first.

- **Competency:** G5.Q1.6, perform three or more operations applying GMDAS
- **Domain:** NA, Number and Algebra
- **Schema:** combine (additive)
- **Answer:** whole number
- **Draws:** `a: 2 to 12 (tiers 1–2), 5 to 30 (tiers 3–4)`; `b: 2 to 12 (tiers 1–2), 5 to 30 (tiers 3–4)`; `c: 2 to 9 (tiers 1–2), 3 to 12 (tiers 3–4)`
- **Formats:** `expression`, `turned`
- **Named mistakes:** `ignored-the-brackets`, `multiplied-only-one`
- **Example:** 6 × (8 + 2) = ? **Answer: 60**

#### `gemdas.four-ops`

Three or more operations: multiply and divide, then add and take away from the left.

- **Competency:** G5.Q1.6, perform three or more operations applying GMDAS
- **Domain:** NA, Number and Algebra
- **Schema:** multi-step (non-routine)
- **Answer:** whole number
- **Draws:** `a: 2 to 9 (tiers 1–2), 3 to 12 (tiers 3–4)`; `b: 2 to 9 (tiers 1–2), 3 to 12 (tiers 3–4)`; `q: 2 to 6 (tiers 1–2), 2 to 9 (tiers 3–4)`; `d: 2 to 5 (tiers 1–2), 2 to 9 (tiers 3–4)`; `e: 1 to 9 (tiers 1–2), 2 to 20 (tiers 3–4)`
- **Kept only when:** `a * b > q + e`
- **Formats:** `expression`
- **Named mistakes:** `added-before-taking-away`, `worked-left-to-right`
- **Example:** 7 × 2 − 20 ÷ 5 + 9 = ? **Answer: 19**

#### `gemdas.shopping`

Write and work out a shopping total with GMDAS.

- **Competency:** G5.Q1.6, perform three or more operations applying GMDAS
- **Domain:** NA, Number and Algebra
- **Schema:** multi-step (non-routine)
- **Answer:** whole number, in ₱
- **Draws:** `p: 5 to 30 (tiers 1–2), 15 to 99 (tiers 3–4)`; `n: 2 to 6 (tiers 1–2), 3 to 9 (tiers 3–4)`; `c: 5 to 20 (tiers 1–2), 12 to 45 (tiers 3–4)`
- **Formats:** `notebooks`, `snacks`
- **Named mistakes:** `worked-left-to-right`, `bought-one`
- **Example:** Ben buys a drink for ₱21 and 2 pieces of bread at ₱13 each: 21 + 2 × 13. How much does he spend? **Answer: ₱47**

**Level 2: With decimals and fractions** (`decimals-fractions`, 3 templates)

#### `gemdas.decimal-ops`

GMDAS with decimals: multiply before adding.

- **Competency:** G5.Q4.2, three or more operations with fractions and decimals (GMDAS)
- **Domain:** NA, Number and Algebra
- **Schema:** combine (additive)
- **Answer:** decimal
- **Draws:** `ai: 11 to 99 (tiers 1–2), 101 to 999 (tiers 3–4)`; `bi: 11 to 49 (tiers 1–2), 11 to 99 (tiers 3–4)`; `c: 2 to 9 (tiers 1–2), 3 to 12 (tiers 3–4)`
- **Kept only when:** `ai % 10 != 0`; `bi % 10 != 0`
- **Formats:** `expression`
- **Named mistakes:** `worked-left-to-right`, `added-everything`
- **Example:** 6.6 + 1.1 × 6 = ? **Answer: 13.2**

#### `gemdas.decimal-brackets`

GMDAS with decimals: brackets first.

- **Competency:** G5.Q4.2, three or more operations with fractions and decimals (GMDAS)
- **Domain:** NA, Number and Algebra
- **Schema:** multi-step (non-routine)
- **Answer:** decimal
- **Draws:** `ai: 2 to 9 (tiers 1–2), 11 to 49 (tiers 3–4)`; `bi: 21 to 99 (tiers 1–2), 41 to 199 (tiers 3–4)`; `ci: 11 to 49 (tiers 1–2), 11 to 99 (tiers 3–4)`
- **Kept only when:** `b > c`; `bi % 10 != 0`; `ci % 10 != 0`
- **Formats:** `expression`
- **Named mistakes:** `ignored-the-brackets`, `forgot-to-multiply`
- **Example:** 0.9 × (9.7 − 2.1) = ? **Answer: 6.84**

#### `gemdas.fraction-ops`

GMDAS with fractions: multiply before adding.

- **Competency:** G5.Q4.2, three or more operations with fractions and decimals (GMDAS)
- **Domain:** NA, Number and Algebra
- **Schema:** combine (additive)
- **Answer:** mixed number
- **Draws:** `pb: one of 2, 3, 4, 5, 6, 8`; `pa: 1 to pb - 1`; `qb: one of 2, 3, 4, 5, 6, 8`; `qa: 1 to qb - 1`; `r: 2 to 4 (tiers 1–2), 2 to 6 (tiers 3–4)`
- **Kept only when:** `gcd(pa, pb) == 1`; `gcd(qa, qb) == 1`; `floor(s) != s`; `s > 1`
- **Formats:** `expression`
- **Named mistakes:** `worked-left-to-right`, `added-everything`
- **Example:** 1/5 + 4/5 × 4 = ? **Answer: 3 2/5**

**Level 3: Exponents** (`exponents`, 4 templates)

#### `gemdas.power-value`

Give the value of a number in exponential form.

- **Competency:** G6.Q2.11, give the value of numbers expressed in exponential form
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `b: 2 to 6 (tiers 1–2), 2 to 10 (tiers 3–4)`; `e: 2 to 4 (tiers 1–2), 2 to 5 (tiers 3–4)`
- **Kept only when:** `v <= 100000`
- **Formats:** `value`, `words`
- **Named mistakes:** `multiplied-base-by-exponent`, `one-factor-too-many`, `one-factor-short`
- **Example:** What is the value of 5²? **Answer: 25**

#### `gemdas.to-power`

Write a repeated product in exponential form: find the exponent.

- **Competency:** G6.Q2.10, write numbers in exponential form and back
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `b: 2 to 9 (tiers 1–2), 2 to 12 (tiers 3–4)`; `e: 2 to 4 (tiers 1–2), 3 to 6 (tiers 3–4)`
- **Formats:** `power`, `exponent`
- **Named mistakes:** `gave-the-value`, `counted-the-signs`
- **Example:** Write 7 × 7 in exponential form. What is the exponent? **Answer: 2**

#### `gemdas.from-power`

Write a number as a power of a given base: find the exponent.

- **Competency:** G6.Q2.10, write numbers in exponential form and back
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `b: one of 2, 3, 5, 10`; `e: 2 to 5 (tiers 1–2), 3 to 6 (tiers 3–4)`
- **Kept only when:** `v <= 1000000`
- **Formats:** `power`, `which`
- **Named mistakes:** `divided-once`, `one-short`
- **Example:** Which power of 5 is 25? **Answer: 2**

#### `gemdas.greatest-power`

Compare numbers in exponential form by working out each value.

- **Competency:** G6.Q2.11, give the value of numbers expressed in exponential form
- **Domain:** NA, Number and Algebra
- **Schema:** compare (additive)
- **Answer:** multiple choice
- **Draws:** `k: 1 to 6`
- **Formats:** `greatest`
- **Named mistakes:** `picked-a-smaller-power-a`, `picked-a-smaller-power-b`, `picked-a-smaller-power-c`
- **Example:** Which of these has the greatest value? Choices: 6²; 2⁵; 3³; 5². **Answer: 6²**

**Level 4: Exponents first** (`gemdas`, 4 templates)

#### `gemdas.power-ops`

GEMDAS: exponents before multiplying and adding.

- **Competency:** G6.Q2.12, calculations with exponential form applying GEMDAS
- **Domain:** NA, Number and Algebra
- **Schema:** multi-step (non-routine)
- **Answer:** whole number
- **Draws:** `a: 1 to 9 (tiers 1–2), 2 to 20 (tiers 3–4)`; `b: 2 to 5 (tiers 1–2), 2 to 9 (tiers 3–4)`; `c: 2 to 5 (tiers 1–2), 2 to 9 (tiers 3–4)`
- **Formats:** `expression`
- **Named mistakes:** `added-before-multiplying`, `squared-the-product`, `doubled-instead-of-squaring`
- **Example:** 6 + 2² × 4 = ? **Answer: 22**

#### `gemdas.power-brackets`

GEMDAS: brackets before the exponent.

- **Competency:** G6.Q2.12, calculations with exponential form applying GEMDAS
- **Domain:** NA, Number and Algebra
- **Schema:** multi-step (non-routine)
- **Answer:** whole number
- **Draws:** `a: 1 to 6 (tiers 1–2), 2 to 12 (tiers 3–4)`; `b: 1 to 6 (tiers 1–2), 2 to 12 (tiers 3–4)`
- **Formats:** `expression`
- **Named mistakes:** `squared-each-number`, `ignored-the-brackets`, `doubled-instead-of-squaring`
- **Example:** (4 + 1)² = ? **Answer: 25**

#### `gemdas.power-take`

GEMDAS: an exponent, then multiplying, then taking away.

- **Competency:** G6.Q2.12, calculations with exponential form applying GEMDAS
- **Domain:** NA, Number and Algebra
- **Schema:** multi-step (non-routine)
- **Answer:** whole number
- **Draws:** `b: 3 to 9 (tiers 1–2), 5 to 12 (tiers 3–4)`; `c: 2 to 5 (tiers 1–2), 2 to 9 (tiers 3–4)`; `d: 2 to 5 (tiers 1–2), 2 to 9 (tiers 3–4)`
- **Kept only when:** `b * b > c * d`
- **Formats:** `expression`
- **Named mistakes:** `worked-left-to-right`, `doubled-instead-of-squaring`
- **Example:** 7² − 2 × 4 = ? **Answer: 41**

#### `gemdas.which-first`

Say which part of an expression GEMDAS works out first.

- **Competency:** G6.Q2.12, calculations with exponential form applying GEMDAS
- **Domain:** NA, Number and Algebra
- **Schema:** compare (additive)
- **Answer:** multiple choice
- **Draws:** `i: 1 to 8`
- **Formats:** `first`
- **Named mistakes:** `picked-another-part`, `picked-a-second-part`, `picked-a-third-part`
- **Example:** In 7 × 4 − 10 ÷ 2 + 1, which part do you work out first? Choices: The subtraction; The addition; The division; The multiplication. **Answer: The multiplication**

### 4. Factors and primes (`factors`)

Blueprint weight 4%.

**Level 1: Divisibility rules** (`divisibility`, 4 templates)

#### `factors.rule-2-5-10`

Use the last-digit rules for 2, 5 and 10.

- **Competency:** G5.Q2.11, divisibility rules for 2,5,10 / 3,6,9 / 4,8,11,12
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** multiple choice
- **Draws:** `dv: one of 2, 5, 10`; `k: ceil(100 / dv) to floor(999 / dv) (tiers 1–2), ceil(1000 / dv) to floor(9999 / dv) (tiers 3–4)`
- **Formats:** `which`
- **Named mistakes:** `picked-one-above`, `picked-one-below`, `picked-a-far-one`
- **Example:** Which of these numbers can be divided by 5 exactly? Choices: 99; 100; 106; 101. **Answer: 100**

#### `factors.rule-3-6-9`

Use the digit-sum rules for 3, 6 and 9.

- **Competency:** G5.Q2.11, divisibility rules for 2,5,10 / 3,6,9 / 4,8,11,12
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** multiple choice
- **Draws:** `dv: one of 3, 6, 9`; `k: ceil(100 / dv) to floor(999 / dv) (tiers 1–2), ceil(1000 / dv) to floor(9999 / dv) (tiers 3–4)`
- **Formats:** `which`
- **Named mistakes:** `picked-one-above`, `picked-one-below`, `picked-a-near-miss`
- **Example:** Which of these numbers can be divided by 6 exactly? Choices: 101; 102; 105; 103. **Answer: 102**

#### `factors.rule-4-8-11-12`

Use the rules for 4, 8, 11 and 12.

- **Competency:** G5.Q2.11, divisibility rules for 2,5,10 / 3,6,9 / 4,8,11,12
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** multiple choice
- **Draws:** `dv: one of 4, 8, 11, 12`; `k: ceil(1000 / dv) to floor(9999 / dv) (tiers 1–4)`
- **Formats:** `which`
- **Named mistakes:** `picked-one-above`, `picked-one-below`, `picked-a-near-miss`
- **Example:** Which of these numbers can be divided by 11 exactly? Choices: 1022; 1023; 1033; 1024. **Answer: 1023**

#### `factors.missing-digit`

Find the smallest digit that makes a number divisible by 3 or 9.

- **Competency:** G5.Q2.11, divisibility rules for 2,5,10 / 3,6,9 / 4,8,11,12
- **Domain:** NA, Number and Algebra
- **Schema:** missing-middle (non-routine)
- **Answer:** whole number
- **Draws:** `dv: one of 3, 9`; `h: 1 to 9`; `o: 0 to 9`
- **Formats:** `box`
- **Named mistakes:** `not-the-smallest`, `gave-the-digit-total`
- **Example:** 1□5 can be divided by 9 exactly. What is the smallest digit that can go in the box? **Answer: 3**

**Level 2: Primes and prime factors** (`primes`, 4 templates)

#### `factors.which-prime`

Pick the prime number from a list.

- **Competency:** G5.Q2.12, distinguish prime from composite numbers
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** multiple choice
- **Draws:** `p: one of 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97`; `c1: one of 9, 15, 21, 25, 27, 33, 35, 39, 45, 49, 51, 55, 57, 63, 65, 69, 75, 77, 81, 85, 87, 91, 93, 95`; `c2: one of 9, 15, 21, 25, 27, 33, 35, 39, 45, 49, 51, 55, 57, 63, 65, 69, 75, 77, 81, 85, 87, 91, 93, 95`
- **Formats:** `which`
- **Named mistakes:** `picked-a-composite`, `picked-another-composite`, `picked-an-even-number`
- **Example:** Which of these is a prime number? Choices: 57; 9; 61; 62. **Answer: 61**

#### `factors.which-composite`

Pick the composite number from a list.

- **Competency:** G5.Q2.12, distinguish prime from composite numbers
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** multiple choice
- **Draws:** `c: one of 9, 15, 21, 25, 27, 33, 35, 39, 45, 49, 51, 55, 57, 63, 65, 69, 75, 77, 81, 85, 87, 91, 93, 95`; `p1: one of 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97`; `p2: one of 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97`; `p3: one of 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97`
- **Formats:** `which`
- **Named mistakes:** `picked-a-prime`, `picked-another-prime`, `picked-a-third-prime`
- **Example:** Which of these is a composite number? Choices: 69; 53; 11; 97. **Answer: 69**

#### `factors.smallest-prime-factor`

Find the smallest prime factor of a number.

- **Competency:** G5.Q2.12, distinguish prime from composite numbers
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** whole number
- **Draws:** `p: one of 2, 3, 5, 7`; `q: one of 3, 5, 7, 11, 13, 17, 19, 23`
- **Kept only when:** `q > p`
- **Formats:** `smallest`
- **Named mistakes:** `gave-1`, `gave-the-bigger-factor`, `gave-the-number`
- **Example:** What is the smallest prime factor of 115? **Answer: 5**

#### `factors.factor-exponent`

Count a prime in a prime factorisation by dividing.

- **Competency:** G6.Q4.11, GCF by listing, prime factorisation and continuous division
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** whole number
- **Draws:** `i: 1 to 3 (tiers 1–2), 2 to 5 (tiers 3–4)`; `j: 1 to 3`; `f: one of 1, 5, 7`
- **Formats:** `how-many`, `power`
- **Named mistakes:** `counted-all-the-primes`, `gave-the-power`
- **Example:** 60 = 2 to the power of what, times 15? **Answer: 2**

**Level 3: Greatest common factor** (`gcf`, 3 templates)

#### `factors.gcf`

Find the GCF of two numbers.

- **Competency:** G6.Q4.11, GCF by listing, prime factorisation and continuous division
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** whole number
- **Draws:** `g: 2 to 9 (tiers 1–2), 4 to 15 (tiers 3–4)`; `x: 1 to 8`; `y: x + 1 to 9`
- **Kept only when:** `gcd(x, y) == 1`
- **Formats:** `gcf`, `words`
- **Named mistakes:** `gave-the-lcm`, `not-the-greatest`, `gave-1`
- **Example:** What is the greatest common factor of 7 and 42? **Answer: 7**

#### `factors.gcf-word`

Solve a sharing problem with the GCF.

- **Competency:** G6.Q4.13, solve problems involving GCF and LCM
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `g: 2 to 9 (tiers 1–2), 4 to 15 (tiers 3–4)`; `x: 2 to 8`; `y: x + 1 to 9`
- **Kept only when:** `gcd(x, y) == 1`
- **Formats:** `bracelets`, `teams`
- **Named mistakes:** `gave-the-lcm`, `gave-one-group`
- **Example:** 72 boys and 81 girls are put into teams. Every team has the same number of boys and the same number of girls, and everyone is in a team. What is the greatest number of teams? **Answer: 9**

#### `factors.extra-ribbons`

Solve a GCF problem, ignoring a number the question does not use.

- **Competency:** G6.Q4.13, solve problems involving GCF and LCM
- **Domain:** NA, Number and Algebra
- **Schema:** excess-info (non-routine)
- **Answer:** whole number
- **Draws:** `g: 4 to 12`; `x: 2 to 7`; `y: 2 to 7`; `c: 25 to 45`
- **Kept only when:** `gcd(x, y) == 1`; `x != y`
- **Formats:** `ribbons`
- **Named mistakes:** `found-the-lcm`, `gave-the-class-size`
- **Example:** A class of 45 pupils has 18 red ribbons and 45 blue ribbons. The ribbons are tied into bundles, every bundle with the same number of red ribbons and the same number of blue, with none left over. What is the greatest number of bundles? **Answer: 9**

**Level 4: Least common multiple** (`lcm`, 4 templates)

#### `factors.lcm`

Find the LCM of two numbers.

- **Competency:** G6.Q4.12, LCM by listing, prime factorisation and continuous division
- **Domain:** NA, Number and Algebra
- **Schema:** multiplicative-compare (multiplicative)
- **Answer:** whole number
- **Draws:** `g: 2 to 6 (tiers 1–2), 2 to 12 (tiers 3–4)`; `x: 1 to 8`; `y: x + 1 to 9`
- **Kept only when:** `gcd(x, y) == 1`
- **Formats:** `lcm`, `words`
- **Named mistakes:** `multiplied-them`, `gave-the-gcf`
- **Example:** What is the least common multiple of 5 and 30? **Answer: 30**

#### `factors.lcm-word`

Solve a meeting-again problem with the LCM.

- **Competency:** G6.Q4.13, solve problems involving GCF and LCM
- **Domain:** NA, Number and Algebra
- **Schema:** multiplicative-compare (multiplicative)
- **Answer:** whole number
- **Draws:** `g: 2 to 5 (tiers 1–2), 2 to 10 (tiers 3–4)`; `x: 2 to 6`; `y: x + 1 to 7`
- **Kept only when:** `gcd(x, y) == 1`
- **Formats:** `buses`, `visits`
- **Named mistakes:** `multiplied-them`, `gave-the-gcf`
- **Example:** Ana visits Lola every 8 days and Ben visits every 20 days. Both visited today. In how many days will they next visit on the same day? **Answer: 40**

#### `factors.lcm-three`

Find the LCM of three numbers, two at a time.

- **Competency:** G6.Q4.12, LCM by listing, prime factorisation and continuous division
- **Domain:** NA, Number and Algebra
- **Schema:** multiplicative-compare (multiplicative)
- **Answer:** whole number
- **Draws:** `a: 2 to 8 (tiers 1–2), 2 to 12 (tiers 3–4)`; `b: a + 1 to 15`; `c: b + 1 to 16`; `cap: 120 to 120 (tiers 1–2), 240 to 240 (tiers 3–4)`
- **Kept only when:** `lcm(lcm(a, b), c) < a * b * c`; `lcm(a, b) % c != 0`; `lcm(lcm(a, b), c) != c`; `lcm(lcm(a, b), c) <= cap`
- **Formats:** `lcm`, `words`
- **Named mistakes:** `multiplied-them`, `left-one-out`
- **Example:** What is the least common multiple of 6, 7 and 12? **Answer: 84**

#### `factors.lcm-packs`

Find how many packs make two pack sizes come out even, with the LCM.

- **Competency:** G6.Q4.13, solve problems involving GCF and LCM
- **Domain:** NA, Number and Algebra
- **Schema:** multi-step (non-routine)
- **Answer:** whole number
- **Draws:** `g: 2 to 4 (tiers 1–2), 2 to 6 (tiers 3–4)`; `x: 2 to 5`; `y: x + 1 to 6`
- **Kept only when:** `gcd(x, y) == 1`
- **Formats:** `hotdogs`, `pencils`
- **Named mistakes:** `gave-the-lcm`, `counted-the-other-packs`, `crossed-the-pack-sizes`
- **Example:** Pencils come in packs of 6 and erasers in packs of 15. Teacher Ana wants the same number of pencils and erasers. What is the least number of packs of erasers she can buy? **Answer: 2**

### 5. Ratio and proportion (`ratio`)

Blueprint weight 8%.

**Level 1: What a ratio says** (`what-a-ratio-says`, 3 templates)

#### `ratio.part-whole`

Write a part-to-whole ratio.

- **Competency:** G6.Q2.1, describe quantities using part-whole and part-part ratio
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** whole number
- **Draws:** `b: 5 to 20 (tiers 1–2), 12 to 45 (tiers 3–4)`; `g: 5 to 20 (tiers 1–2), 12 to 45 (tiers 3–4)`
- **Kept only when:** `b != g`
- **Formats:** `class`, `basket`
- **Named mistakes:** `gave-the-other-part`, `repeated-the-part`
- **Example:** A basket has 15 mangoes and 5 bananas. Complete the ratio of bananas to all the fruit: 5 : ? **Answer: 20**

#### `ratio.part-part`

Write a part-to-part ratio from a part and the whole.

- **Competency:** G6.Q2.1, describe quantities using part-whole and part-part ratio
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** whole number
- **Draws:** `t: 20 to 40 (tiers 1–2), 30 to 99 (tiers 3–4)`; `b: 5 to t - 5`
- **Kept only when:** `2 * b != t`
- **Formats:** `class`, `eggs`
- **Named mistakes:** `gave-the-whole`, `added-instead`
- **Example:** A tray holds 33 eggs, and 5 are brown. The rest are white. Complete the ratio of brown eggs to white eggs: 5 : ? **Answer: 28**

#### `ratio.fraction-of`

Express one quantity as a fraction of the whole from a ratio.

- **Competency:** G6.Q2.2, express one number as a fraction of another from their ratio
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** fraction
- **Draws:** `x: 1 to 5 (tiers 1–2), 2 to 9 (tiers 3–4)`; `y: 1 to 5 (tiers 1–2), 2 to 9 (tiers 3–4)`
- **Kept only when:** `gcd(x, y) == 1`; `x != y`
- **Formats:** `class`, `juice`
- **Named mistakes:** `used-the-other-part`, `used-the-wrong-part`
- **Example:** A drink is made of juice and water in the ratio 4 : 1. What fraction of the drink is juice? **Answer: 4/5**

**Level 2: Equivalent ratios** (`equivalent`, 3 templates)

#### `ratio.simplest`

Write a ratio in simplest form.

- **Competency:** G6.Q2.3, identify and write equivalent ratios
- **Domain:** NA, Number and Algebra
- **Schema:** multiplicative-compare (multiplicative)
- **Answer:** whole number
- **Draws:** `g: 2 to 6 (tiers 1–2), 3 to 12 (tiers 3–4)`; `x: 1 to 5 (tiers 1–2), 2 to 9 (tiers 3–4)`; `y: 2 to 7 (tiers 1–2), 2 to 11 (tiers 3–4)`
- **Kept only when:** `gcd(x, y) == 1`; `x != y`
- **Formats:** `simplest`
- **Named mistakes:** `took-away-instead`, `left-the-term`
- **Example:** Write 5 : 25 in simplest form: 1 : ? **Answer: 5**

#### `ratio.missing-term`

Find the missing term of an equivalent ratio.

- **Competency:** G6.Q2.3, identify and write equivalent ratios
- **Domain:** NA, Number and Algebra
- **Schema:** multiplicative-compare (multiplicative)
- **Answer:** whole number
- **Draws:** `x: 1 to 6 (tiers 1–2), 2 to 9 (tiers 3–4)`; `y: 2 to 9 (tiers 1–2), 3 to 12 (tiers 3–4)`; `k: 2 to 5 (tiers 1–2), 3 to 9 (tiers 3–4)`
- **Kept only when:** `x != y`
- **Formats:** `equal`, `words`
- **Named mistakes:** `added-instead`, `added-the-terms`
- **Example:** Find the missing number so the ratios are equivalent: 4 : 2 = 16 : ? **Answer: 8**

#### `ratio.table`

Complete a ratio table.

- **Competency:** G6.Q2.5, illustrate ratio and proportion with tables or double number line
- **Domain:** NA, Number and Algebra
- **Schema:** multiplicative-compare (multiplicative)
- **Answer:** whole number
- **Draws:** `u: 2 to 9 (tiers 1–2), 3 to 15 (tiers 3–4)`; `m: 4 to 6 (tiers 1–2), 5 to 9 (tiers 3–4)`
- **Formats:** `bags`, `packs`
- **Named mistakes:** `counted-on-by-one`, `took-the-next-number`
- **Example:** A ratio table: 1 pack has 7 pencils, 2 packs have 14, 3 packs have 21. How many pencils are in 4 packs? **Answer: 28**

**Level 3: Ratio problems** (`problems`, 4 templates)

#### `ratio.share`

Share an amount in a given ratio.

- **Competency:** G6.Q2.4, solve problems involving ratio
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** whole number
- **Draws:** `x: 1 to 5 (tiers 1–2), 2 to 9 (tiers 3–4)`; `y: 1 to 5 (tiers 1–2), 2 to 9 (tiers 3–4)`; `p: 5 to 20 (tiers 1–2), 10 to 50 (tiers 3–4)`
- **Kept only when:** `gcd(x, y) == 1`; `x != y`
- **Formats:** `money`, `mangoes`
- **Named mistakes:** `shared-equally`, `gave-one-part`, `gave-the-other-share`
- **Example:** 65 mangoes are shared between two families in the ratio 4 : 1. How many does the first family get? **Answer: 52**

#### `ratio.from-part`

Find a quantity from a ratio and the other quantity.

- **Competency:** G6.Q2.4, solve problems involving ratio
- **Domain:** NA, Number and Algebra
- **Schema:** multiplicative-compare (multiplicative)
- **Answer:** whole number
- **Draws:** `x: 1 to 5 (tiers 1–2), 2 to 9 (tiers 3–4)`; `y: 1 to 5 (tiers 1–2), 2 to 9 (tiers 3–4)`; `p: 2 to 8 (tiers 1–2), 3 to 15 (tiers 3–4)`
- **Kept only when:** `gcd(x, y) == 1`; `x != y`
- **Formats:** `class`, `pets`
- **Named mistakes:** `added-the-difference`, `gave-one-part`
- **Example:** In a pet shop the ratio of cats to dogs is 4 : 1. There are 5 dogs. How many cats are there? **Answer: 20**

#### `ratio.times-larger`

Find how many times larger one quantity is than another.

- **Competency:** G6.Q2.6, find how many times one value is larger than another
- **Domain:** NA, Number and Algebra
- **Schema:** multiplicative-compare (multiplicative)
- **Answer:** whole number
- **Draws:** `s: 2 to 9 (tiers 1–2), 3 to 25 (tiers 3–4)`; `k: 2 to 9 (tiers 1–2), 3 to 12 (tiers 3–4)`
- **Formats:** `price`, `height`
- **Named mistakes:** `took-away-instead`, `added-instead`
- **Example:** A tree is 14 m tall and a fence is 7 m tall. How many times as tall as the fence is the tree? **Answer: 2**

#### `ratio.extra-club`

Find a quantity from a ratio and the other quantity, ignoring numbers the question does not use.

- **Competency:** G6.Q2.4, solve problems involving ratio
- **Domain:** NA, Number and Algebra
- **Schema:** excess-info (non-routine)
- **Answer:** whole number
- **Draws:** `b: 2 to 5`; `g: 2 to 5`; `k: 3 to 9`; `d: 2 to 5`; `fee: one of 20, 25, 30, 50`
- **Kept only when:** `gcd(b, g) == 1`; `b != g`
- **Formats:** `club`
- **Named mistakes:** `found-the-whole-club`, `turned-the-ratio-round`
- **Example:** A chess club meets 3 times a week, and each member pays ₱50 a month. The ratio of boys to girls in the club is 3:4. There are 32 girls. How many boys are there? **Answer: 24**

**Level 4: Proportion** (`proportion`, 3 templates)

#### `ratio.recipe`

Scale a recipe in proportion.

- **Competency:** G6.Q2.7, solve problems involving ratio and proportion
- **Domain:** NA, Number and Algebra
- **Schema:** rate (multiplicative)
- **Answer:** whole number
- **Draws:** `f: 2 to 5 (tiers 1–2), 2 to 9 (tiers 3–4)`; `s: 2 to 6 (tiers 1–2), 3 to 8 (tiers 3–4)`; `k: 2 to 4 (tiers 1–2), 2 to 6 (tiers 3–4)`
- **Formats:** `flour`, `rice`
- **Named mistakes:** `added-instead`, `multiplied-by-the-servings`
- **Example:** 4 cups of rice feed 2 people. How many cups feed 6 people? **Answer: 12**

#### `ratio.unit-rate`

Use a unit price to find the cost of a different quantity.

- **Competency:** G6.Q2.7, solve problems involving ratio and proportion
- **Domain:** NA, Number and Algebra
- **Schema:** rate (multiplicative)
- **Answer:** whole number, in ₱
- **Draws:** `u: 3 to 15 (tiers 1–2), 5 to 45 (tiers 3–4)`; `n: 2 to 6 (tiers 1–2), 3 to 9 (tiers 3–4)`; `m: 2 to 9 (tiers 1–2), 3 to 12 (tiers 3–4)`
- **Kept only when:** `m != n`
- **Formats:** `pencils`, `eggs`
- **Named mistakes:** `did-not-find-one`, `added-instead`
- **Example:** 2 eggs cost ₱22. How much do 6 eggs cost at the same price? **Answer: ₱66**

#### `ratio.map-scale`

Use a map scale.

- **Competency:** G6.Q2.7, solve problems involving ratio and proportion
- **Domain:** NA, Number and Algebra
- **Schema:** rate (multiplicative)
- **Answer:** whole number
- **Draws:** `s: one of 2, 5, 10, 20, 25, 50`; `d: 2 to 9 (tiers 1–2), 3 to 15 (tiers 3–4)`
- **Formats:** `towns`, `road`
- **Named mistakes:** `added-instead`, `gave-the-scale`
- **Example:** A map's scale is 1 cm to 20 km. A road is 2 cm long on the map. How long is the real road, in kilometres? **Answer: 40**

### 6. Percentages (`percent`)

Blueprint weight 5%.

**Level 1: Per cent, fraction and decimal** (`forms`, 4 templates)

#### `percent.to-fraction`

Write a per cent as a fraction in lowest terms.

- **Competency:** G6.Q2.8, relate percentages, fractions and decimals
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** fraction
- **Draws:** `p: 2 to 98 (tiers 1–2), 2 to 98 (tiers 3–4)`
- **Kept only when:** `g > 1`
- **Formats:** `write`
- **Named mistakes:** `used-tenths`, `turned-it-upside-down`
- **Example:** Write 62% as a fraction in lowest terms. **Answer: 31/50**

#### `percent.to-decimal`

Write a per cent as a decimal.

- **Competency:** G6.Q2.8, relate percentages, fractions and decimals
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** decimal
- **Draws:** `p: 11 to 99 (tiers 1–2), 1 to 250 (tiers 3–4)`
- **Kept only when:** `p % 10 != 0`
- **Formats:** `write`
- **Named mistakes:** `moved-one-place`, `did-not-move-the-point`, `moved-three-places`
- **Example:** Write 66% as a decimal. **Answer: 0.66**

#### `percent.from-fraction`

Write a fraction as a per cent by making the denominator 100.

- **Competency:** G6.Q2.8, relate percentages, fractions and decimals
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** per cent
- **Draws:** `b: one of 2, 4, 5, 10, 20, 25, 50`; `a: 1 to b - 1`
- **Kept only when:** `gcd(a, b) == 1`; `b != 10 || a % 2 == 1`
- **Formats:** `write`
- **Named mistakes:** `wrote-the-top`, `made-it-out-of-10`
- **Example:** Write 1/20 as a per cent. **Answer: 5%**

#### `percent.from-decimal`

Write a decimal as a per cent.

- **Competency:** G6.Q2.8, relate percentages, fractions and decimals
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** per cent
- **Draws:** `k: 1 to 99 (tiers 1–2), 1 to 250 (tiers 3–4)`
- **Kept only when:** `k % 10 != 0`
- **Formats:** `write`
- **Named mistakes:** `moved-one-place`, `did-not-move-the-point`
- **Example:** Write 0.63 as a per cent. **Answer: 63%**

**Level 2: Per cent of a number** (`of-a-number`, 3 templates)

#### `percent.of-number`

Find a per cent of a whole number.

- **Competency:** G6.Q2.8, relate percentages, fractions and decimals
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** whole number
- **Draws:** `p: one of 5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80`; `k: 1 to 10 (tiers 1–2), 3 to 25 (tiers 3–4)`
- **Formats:** `of`, `pupils`
- **Named mistakes:** `did-not-divide-by-100`, `gave-what-is-left`, `divided-by-10`
- **Example:** There are 20 pupils in a school, and 40% of them walk to school. How many walk to school? **Answer: 8**

#### `percent.what-percent`

Write one number as a per cent of another.

- **Competency:** G6.Q2.8, relate percentages, fractions and decimals
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** per cent
- **Draws:** `n: one of 10, 20, 25, 50`; `a: 1 to n - 1`
- **Kept only when:** `a * 100 / n != n - a`
- **Formats:** `glasses`, `test`
- **Named mistakes:** `gave-the-count`, `gave-the-rest`
- **Example:** Ana got 1 out of 25 on a test. What is her score as a per cent? **Answer: 4%**

#### `percent.find-whole`

Find the whole from a per cent and its part.

- **Competency:** G6.Q2.8, relate percentages, fractions and decimals
- **Domain:** NA, Number and Algebra
- **Schema:** work-backwards (non-routine)
- **Answer:** whole number
- **Draws:** `p: one of 10, 20, 25, 50, 75`; `k: 1 to 10 (tiers 1–2), 2 to 30 (tiers 3–4)`
- **Formats:** `number`, `money`
- **Named mistakes:** `took-the-percent-of-the-part`, `added-the-percent`
- **Example:** Mila saves 50% of her allowance. She saves ₱10. How much is her allowance? **Answer: 20**

**Level 3: Per cents in real life** (`real-life`, 7 templates)

#### `percent.discount`

Find a discount.

- **Competency:** G6.Q2.9, identify and explain the uses of percentages
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** whole number, in ₱
- **Draws:** `k: 5 to 25 (tiers 1–2), 10 to 60 (tiers 3–4)`; `p: one of 5, 10, 15, 20, 25, 30, 40, 50`
- **Formats:** `bag`, `shoes`
- **Named mistakes:** `gave-the-sale-price`, `took-the-percent-as-pesos`
- **Example:** Shoes priced at ₱360 are 5% off. How many pesos are taken off? **Answer: ₱18**

#### `percent.sale-price`

Find a sale price after a discount.

- **Competency:** G6.Q2.9, identify and explain the uses of percentages
- **Domain:** NA, Number and Algebra
- **Schema:** change (additive)
- **Answer:** whole number, in ₱
- **Draws:** `k: 5 to 25 (tiers 1–2), 10 to 60 (tiers 3–4)`; `p: one of 5, 10, 15, 20, 25, 30, 40, 50`
- **Formats:** `bag`, `shirt`
- **Named mistakes:** `gave-the-discount`, `took-off-the-percent-as-pesos`
- **Example:** A shirt is priced at ₱360, with a 5% discount. What is the sale price? **Answer: ₱342**

#### `percent.increase`

Increase a number by a per cent.

- **Competency:** G6.Q2.9, identify and explain the uses of percentages
- **Domain:** NA, Number and Algebra
- **Schema:** change (additive)
- **Answer:** whole number
- **Draws:** `k: 5 to 20 (tiers 1–2), 10 to 50 (tiers 3–4)`; `p: one of 5, 10, 15, 20, 25, 50`
- **Formats:** `school`, `harvest`
- **Named mistakes:** `gave-the-increase`, `added-the-percent`
- **Example:** A farm picked 300 kg of mangoes last year and 5% more this year. How many kilograms did it pick this year? **Answer: 315**

#### `percent.interest`

Find simple interest for one year.

- **Competency:** G6.Q2.9, identify and explain the uses of percentages
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** whole number, in ₱
- **Draws:** `k: 5 to 50 (tiers 1–2), 10 to 200 (tiers 3–4)`; `r: one of 2, 3, 4, 5, 6, 8, 10`
- **Formats:** `bank`, `coop`
- **Named mistakes:** `gave-the-total`, `did-not-divide-by-100`
- **Example:** A cooperative pays 2% interest a year. How much interest does ₱3300 earn in one year? **Answer: ₱66**

#### `percent.extra-wallet`

Find a discount, ignoring the money the buyer has.

- **Competency:** G6.Q2.9, identify and explain the uses of percentages
- **Domain:** NA, Number and Algebra
- **Schema:** excess-info (non-routine)
- **Answer:** whole number, in ₱
- **Draws:** `p: one of 400, 500, 600, 800, 1000, 1200, 1500`; `d: one of 10, 15, 20, 25, 30, 40`; `w: one of 1000, 2000`
- **Kept only when:** `w > p`
- **Formats:** `shoes`
- **Named mistakes:** `gave-the-sale-price`, `gave-the-change`
- **Example:** A pair of shoes costs ₱1000, and the store gives 10% off. There is ₱2000 in Mia's wallet. How much is the discount? **Answer: ₱100**

#### `percent.better-deal`

Compare two discounted prices to find the better deal.

- **Competency:** G6.Q2.9, identify and explain the uses of percentages
- **Domain:** NA, Number and Algebra
- **Schema:** compare (additive)
- **Answer:** whole number, in ₱
- **Draws:** `p1: 400 to 1200 in steps of 100`; `d1: one of 10, 15, 20, 25, 30, 40`; `p2: 400 to 1200 in steps of 100`; `d2: one of 10, 15, 20, 25, 30, 40`
- **Kept only when:** `s1 != s2`; `p1 != p2`; `d1 != d2`
- **Formats:** `bag`
- **Named mistakes:** `compared-the-discounts`, `compared-the-prices-before`
- **Example:** Store A sells a school bag for ₱900 at 10% off. Store B sells the same bag for ₱800 at 40% off. How much less do you pay at the store with the better deal? **Answer: ₱330**

#### `percent.rate-of-increase`

Find a percent increase from the old and new prices.

- **Competency:** G6.Q2.9, identify and explain the uses of percentages
- **Domain:** NA, Number and Algebra
- **Schema:** change (additive)
- **Answer:** per cent
- **Draws:** `a: one of 200, 250, 300, 400, 500, 800`; `r: one of 5, 10, 15, 20, 25, 40, 50`
- **Kept only when:** `a * r % 100 == 0`
- **Formats:** `bag`, `water`
- **Named mistakes:** `gave-the-increase-in-pesos`, `compared-with-the-new-amount`
- **Example:** A family's monthly water bill went up from ₱400 to ₱420. By what percent did it go up? **Answer: 5%**

### 7. Time (`time`)

Blueprint weight 4%.

**Level 1: The 24-hour clock** (`24-hour`, 3 templates)

#### `time.hours-after-midnight`

Say how many hours after midnight a 12-hour time is.

- **Competency:** G5.Q1.1, describe a 12- and 24-hour clock system
- **Domain:** MG, Measurement and Geometry
- **Schema:** change (additive)
- **Answer:** whole number
- **Draws:** `h: 1 to 23`; `m: one of 0, 15, 30, 45`
- **Kept only when:** `h != 12`
- **Formats:** `hours`
- **Named mistakes:** `forgot-to-add-12`, `added-12-in-the-morning`
- **Example:** The 24-hour clock counts the hours from midnight. How many whole hours after midnight is 3:00 p.m.? **Answer: 15**

#### `time.to-24`

Write a 12-hour time in 24-hour time.

- **Competency:** G5.Q1.2, convert 12-hour time to 24-hour time and back
- **Domain:** MG, Measurement and Geometry
- **Schema:** change (additive)
- **Answer:** clock time
- **Draws:** `h: 0 to 23`; `m: 0 to 59`
- **Formats:** `write`
- **Named mistakes:** `forgot-to-add-12`, `added-12-in-the-morning`
- **Example:** Write 3:00 p.m. in 24-hour time. **Answer: 15:00**

#### `time.to-12`

Write a 24-hour time in 12-hour time.

- **Competency:** G5.Q1.2, convert 12-hour time to 24-hour time and back
- **Domain:** MG, Measurement and Geometry
- **Schema:** change (additive)
- **Answer:** multiple choice
- **Draws:** `h: 13 to 21`; `m: 0 to 59`
- **Formats:** `write`
- **Named mistakes:** `swapped-a-m-and-p-m`, `took-away-10`, `an-hour-out`
- **Example:** What is 18:00 in 12-hour time? Choices: 6:00 a.m.; 5:00 p.m.; 6:00 p.m.; 8:00 p.m. **Answer: 6:00 p.m.**

**Level 2: How long?** (`how-long`, 4 templates)

#### `time.elapsed`

Find a length of time by counting on.

- **Competency:** G5.Q1.3, solve problems involving 12- and 24-hour time
- **Domain:** MG, Measurement and Geometry
- **Schema:** change (additive)
- **Answer:** whole number
- **Draws:** `sh: 6 to 18`; `sm: 5 to 55 in steps of 5`; `d: 40 to 220 in steps of 5`
- **Kept only when:** `e % 60 < sm`; `e < 1440`
- **Formats:** `bus`, `fair`
- **Named mistakes:** `subtracted-like-numbers`, `counted-whole-hours`
- **Example:** A school fair opens at 18:55 and the last game ends at 20:25. How many minutes is that? **Answer: 90**

#### `time.store-hours`

Find a length of time across noon.

- **Competency:** G5.Q1.3, solve problems involving 12- and 24-hour time
- **Domain:** MG, Measurement and Geometry
- **Schema:** change (additive)
- **Answer:** multiple choice
- **Draws:** `s: 360 to 570 in steps of 15`; `e: s + 735 to 1320 in steps of 15`
- **Formats:** `store`, `clinic`
- **Named mistakes:** `took-away-the-clock-numbers`, `an-hour-short`, `an-hour-over`
- **Example:** A clinic is open from 8:15 a.m. to 8:30 p.m. on Saturdays. How long is it open? Choices: 11 hours 15 minutes; 15 minutes; 12 hours 15 minutes; 13 hours 15 minutes. **Answer: 12 hours 15 minutes**

#### `time.overnight`

Find a length of time across midnight.

- **Competency:** G5.Q1.3, solve problems involving 12- and 24-hour time
- **Domain:** MG, Measurement and Geometry
- **Schema:** change (additive)
- **Answer:** multiple choice
- **Draws:** `s: 1140 to 1410 in steps of 5`; `e: 60 to 480 in steps of 5`
- **Formats:** `bus`, `province`
- **Named mistakes:** `took-the-times-the-wrong-way`, `stopped-at-midnight`, `an-hour-short`
- **Example:** Lola's night bus to the province leaves at 21:25 and arrives at 07:55 the next day. How long is the trip? Choices: 2 hours 35 minutes; 10 hours 30 minutes; 13 hours 30 minutes; 9 hours 30 minutes. **Answer: 10 hours 30 minutes**

#### `time.extra-bus`

Find a length of time, ignoring numbers that are not times.

- **Competency:** G5.Q1.3, solve problems involving 12- and 24-hour time
- **Domain:** MG, Measurement and Geometry
- **Schema:** excess-info (non-routine)
- **Answer:** whole number
- **Draws:** `sh: 5 to 15`; `sm: 5 to 55 in steps of 5`; `d: 95 to 300 in steps of 5`; `p: 20 to 45`; `km: one of 40, 60, 80, 100`
- **Kept only when:** `e % 60 < sm`; `e < 1440`
- **Formats:** `bus`
- **Named mistakes:** `subtracted-like-numbers`, `gave-the-distance`
- **Example:** A bus with 30 passengers leaves the terminal at 06:30 and arrives 100 km away at 08:15. How many minutes does the trip take? **Answer: 105**

**Level 3: Start and end times** (`start-and-end`, 3 templates)

#### `time.end-time`

Add a length of time to a 24-hour time.

- **Competency:** G5.Q1.3, solve problems involving 12- and 24-hour time
- **Domain:** MG, Measurement and Geometry
- **Schema:** change (additive)
- **Answer:** clock time
- **Draws:** `s: 420 to 1260 in steps of 5`; `d: 65 to 200 in steps of 5`
- **Kept only when:** `s % 60 + d % 60 >= 60`; `s + d < 1440`
- **Formats:** `movie`, `bus`
- **Named mistakes:** `did-not-carry-the-hour`, `added-only-the-minutes`
- **Example:** A bus leaves at 20:35, and the trip takes 1 hour 40 minutes. At what time does it arrive? **Answer: 22:15**

#### `time.start-time`

Take a length of time from a 24-hour time.

- **Competency:** G5.Q1.3, solve problems involving 12- and 24-hour time
- **Domain:** MG, Measurement and Geometry
- **Schema:** work-backwards (non-routine)
- **Answer:** clock time
- **Draws:** `e: 600 to 1260 in steps of 5`; `d: 65 to 200 in steps of 5`
- **Kept only when:** `e % 60 < d % 60`
- **Formats:** `trip`, `bus`
- **Named mistakes:** `added-instead`, `kept-the-borrowed-hour`
- **Example:** A field trip ends at 15:00. It lasted 2 hours 10 minutes. At what time did it start? **Answer: 12:50**

#### `time.wake-up`

Work back from a deadline through two lengths of time.

- **Competency:** G5.Q1.3, solve problems involving 12- and 24-hour time
- **Domain:** MG, Measurement and Geometry
- **Schema:** work-backwards (non-routine)
- **Answer:** clock time
- **Draws:** `e: 420 to 480 in steps of 5`; `r: 40 to 90 in steps of 5`; `w: 10 to 35 in steps of 5`
- **Formats:** `school`, `mia`
- **Named mistakes:** `forgot-the-walk`, `forgot-getting-ready`
- **Example:** Mia's class starts at 07:40. She needs 40 minutes to get ready and 25 minutes to walk to school. What is the latest time she can wake up? **Answer: 06:35**

**Level 4: Time zones** (`time-zones`, 5 templates)

#### `time.zone-convert`

Change Philippine time to the time in another country.

- **Competency:** G5.Q1.5, solve problems comparing world time zones to PH time
- **Domain:** MG, Measurement and Geometry
- **Schema:** change (additive)
- **Answer:** clock time
- **Draws:** `p: 1 to 6`; `t: 0 to 1435 in steps of 5`
- **Kept only when:** `t + off * 60 >= 0`; `t + off * 60 < 1440`; `t - off * 60 >= 0`; `t - off * 60 < 1440`
- **Formats:** `convert`
- **Named mistakes:** `went-the-wrong-way`
- **Example:** Riyadh is 5 hours behind Manila. When it is 06:40 in Manila, what time is it in Riyadh? **Answer: 01:40**

#### `time.zone-to-manila`

Change the time in another country to Philippine time.

- **Competency:** G5.Q1.5, solve problems comparing world time zones to PH time
- **Domain:** MG, Measurement and Geometry
- **Schema:** change (additive)
- **Answer:** clock time
- **Draws:** `p: 1 to 6`; `t: 0 to 1435 in steps of 5`
- **Kept only when:** `t + off * 60 >= 0`; `t + off * 60 < 1440`; `t - off * 60 >= 0`; `t - off * 60 < 1440`
- **Formats:** `call`
- **Named mistakes:** `went-the-wrong-way`
- **Example:** Tita Liza works in Riyadh, which is 5 hours behind Manila. She calls home at 06:40, Riyadh time. What time is it in Manila? **Answer: 11:40**

#### `time.zone-flight`

Find the local time a flight lands in another time zone.

- **Competency:** G5.Q1.5, solve problems comparing world time zones to PH time
- **Domain:** MG, Measurement and Geometry
- **Schema:** multi-step (non-routine)
- **Answer:** clock time
- **Draws:** `p: 1 to 6`; `t: 0 to 1435 in steps of 5`
- **Kept only when:** `land < 1440`; `land + off * 60 >= 0`; `land + off * 60 < 1440`; `land - off * 60 >= 0`; `land - off * 60 < 1440`
- **Formats:** `flight`
- **Named mistakes:** `forgot-the-time-difference`, `went-the-wrong-way`
- **Example:** A plane leaves Manila at 00:00, Manila time. The flight to Jakarta takes 4 hours 15 minutes, and Jakarta is 1 hour behind Manila. What is the time in Jakarta when the plane lands? **Answer: 03:15**

#### `time.zone-map`

Read two cities' time zones off a map, then change Philippine time.

- **Competency:** G5.Q1.4, compare time in world time zones to PH time using a map
- **Domain:** MG, Measurement and Geometry
- **Schema:** change (additive)
- **Answer:** clock time
- **Draws:** `p: 1 to 6`; `t: 0 to 1435 in steps of 5`
- **Kept only when:** `t + off * 60 >= 0`; `t + off * 60 < 1440`; `t - off * 60 >= 0`; `t - off * 60 < 1440`
- **Formats:** `map`
- **Named mistakes:** `went-the-wrong-way`, `read-the-wrong-city`
- **Example:** Picture: a time zone map, one column for each hour, from UTC+2 to UTC+9. Manila is in UTC+8; Riyadh is in UTC+3; Bangkok is in UTC+7. The map shows time zones, one hour apart. When it is 06:40 in Manila, what time is it in Riyadh? **Answer: 01:40**

#### `time.zone-map-hours`

Read how many hours apart two cities are from a time zone map.

- **Competency:** G5.Q1.4, compare time in world time zones to PH time using a map
- **Domain:** MG, Measurement and Geometry
- **Schema:** compare (additive)
- **Answer:** whole number
- **Draws:** `p: 1 to 6`
- **Formats:** `apart`, `ahead`
- **Named mistakes:** `gave-the-zone`, `read-the-wrong-city`, `counted-the-columns`
- **Example:** Picture: a time zone map, one column for each hour, from UTC+2 to UTC+9. Manila is in UTC+8; Jakarta is in UTC+7; Riyadh is in UTC+3. Use the map. How many hours apart are the times in Manila and Jakarta? **Answer: 1**

### 8. Perimeter and area (`area`)

Blueprint weight 9%.

**Level 1: Parallelograms and triangles** (`parallelograms-triangles`, 6 templates)

#### `area.parallelogram`

Find the area of a parallelogram, telling the height from the slanted side.

- **Competency:** G5.Q1.11, find the area of a parallelogram, triangle, trapezoid
- **Domain:** MG, Measurement and Geometry
- **Schema:** equal-groups (multiplicative)
- **Answer:** number with a unit, in cm²
- **Draws:** `b: 4 to 15 (tiers 1–2), 8 to 30 (tiers 3–4)`; `h: 3 to 12 (tiers 1–2), 5 to 25 (tiers 3–4)`
- **Formats:** `shape`, `card`
- **Named mistakes:** `used-the-slanted-side`, `gave-the-perimeter`, `halved-it`
- **Example:** A piece of card is cut as a parallelogram with a base of 11 cm, slanted sides of 5 cm and a height of 3 cm. What is its area? **Answer: 33 cm²**

#### `area.triangle`

Find the area of a triangle.

- **Competency:** G5.Q1.11, find the area of a parallelogram, triangle, trapezoid
- **Domain:** MG, Measurement and Geometry
- **Schema:** equal-groups (multiplicative)
- **Answer:** number with a unit, in cm²
- **Draws:** `b: 4 to 16 (tiers 1–2), 6 to 30 (tiers 3–4)`; `h: 3 to 12 (tiers 1–2), 5 to 24 (tiers 3–4)`
- **Kept only when:** `b * h % 2 == 0`
- **Formats:** `shape`, `flag`
- **Named mistakes:** `forgot-to-halve`, `used-a-side-as-height`
- **Example:** A triangular flag is 12 cm along the bottom and 3 cm high. What is its area? **Answer: 18 cm²**

#### `area.height`

Find the height of a triangle from its area and base.

- **Competency:** G5.Q1.10, identify the height of a parallelogram, triangle, trapezoid
- **Domain:** MG, Measurement and Geometry
- **Schema:** work-backwards (non-routine)
- **Answer:** number with a unit, in cm
- **Draws:** `b: 4 to 12 (tiers 1–2), 6 to 20 (tiers 3–4)`; `h: 3 to 12 (tiers 1–2), 5 to 20 (tiers 3–4)`
- **Kept only when:** `b * h % 2 == 0`
- **Formats:** `shape`, `flag`
- **Named mistakes:** `forgot-to-double`, `took-away-instead`
- **Example:** A triangular flag has an area of 48 cm² and a base of 8 cm. What is its height? **Answer: 12 cm**

#### `area.extra-side`

Find the area of a triangle when its slanted side is given too.

- **Competency:** G5.Q1.11, find the area of a parallelogram, triangle, trapezoid
- **Domain:** MG, Measurement and Geometry
- **Schema:** excess-info (non-routine)
- **Answer:** number with a unit, in m²
- **Draws:** `b: 4 to 20`; `h: 3 to 15`; `s: h + 1 to h + 6`
- **Kept only when:** `b * h % 2 == 0`
- **Formats:** `garden`
- **Named mistakes:** `used-the-slanted-side`, `forgot-to-halve`
- **Example:** A triangular garden has a base of 14 m and a height of 3 m. Its slanted side is 7 m long. What is its area? **Answer: 21 m²**

#### `area.grid-triangle`

Find the area of a triangle drawn on squared paper.

- **Competency:** G5.Q1.12, estimate areas of triangles and quadrilaterals using grids
- **Domain:** MG, Measurement and Geometry
- **Schema:** part-whole (multiplicative)
- **Answer:** number with a unit, in square units, up to 1 decimal place
- **Draws:** `b: 2 to 8`; `h: 2 to 6`; `cx: 0 to b`
- **Formats:** `grid`
- **Named mistakes:** `forgot-to-halve`, `added-base-and-height`
- **Example:** Picture: squared paper 8 squares across and 4 up, with a shape whose corners are at 1 across and 1 up; 7 across and 1 up; 4 across and 3 up. Each square is 1 square unit. Each small square on the grid is 1 square unit. What is the area of the triangle? **Answer: 6 square units**

#### `area.grid-parallelogram`

Find the area of a parallelogram drawn on squared paper.

- **Competency:** G5.Q1.12, estimate areas of triangles and quadrilaterals using grids
- **Domain:** MG, Measurement and Geometry
- **Schema:** part-whole (multiplicative)
- **Answer:** number with a unit, in square units, up to 1 decimal place
- **Draws:** `b: 2 to 7`; `h: 2 to 5`; `s: 1 to 3`
- **Formats:** `grid`
- **Named mistakes:** `used-the-full-width`, `halved-it`
- **Example:** Picture: squared paper 9 squares across and 4 up, with a shape whose corners are at 1 across and 1 up; 6 across and 1 up; 8 across and 3 up; 3 across and 3 up. Each square is 1 square unit. Each small square on the grid is 1 square unit. What is the area of the parallelogram? **Answer: 10 square units**

**Level 2: Trapezoids** (`trapezoids`, 3 templates)

#### `area.trapezoid`

Find the area of a trapezoid.

- **Competency:** G5.Q1.11, find the area of a parallelogram, triangle, trapezoid
- **Domain:** MG, Measurement and Geometry
- **Schema:** equal-groups (multiplicative)
- **Answer:** number with a unit, in cm²
- **Draws:** `a: 3 to 12 (tiers 1–2), 5 to 25 (tiers 3–4)`; `b: 5 to 18 (tiers 1–2), 8 to 35 (tiers 3–4)`; `h: 2 to 10 (tiers 1–2), 4 to 20 (tiers 3–4)`
- **Kept only when:** `a < b`; `(a + b) * h % 2 == 0`
- **Formats:** `shape`, `label`
- **Named mistakes:** `forgot-to-halve`, `multiplied-the-sides`, `used-one-side`
- **Example:** A paper label is cut as a trapezoid with parallel sides of 12 cm and 18 cm, and a height of 4 cm. What is its area? **Answer: 60 cm²**

#### `area.trapezoid-lot`

Solve a problem with the area of a trapezoid.

- **Competency:** G6.Q3.8, perimeter and area problems including trapezoids and composites
- **Domain:** MG, Measurement and Geometry
- **Schema:** multi-step (non-routine)
- **Answer:** number with a unit, in m²
- **Draws:** `a: 6 to 20 (tiers 1–2), 10 to 40 (tiers 3–4)`; `b: 10 to 30 (tiers 1–2), 15 to 60 (tiers 3–4)`; `h: 4 to 12 (tiers 1–2), 6 to 25 (tiers 3–4)`
- **Kept only when:** `a < b`; `(a + b) * h % 2 == 0`
- **Formats:** `lot`, `garden`
- **Named mistakes:** `forgot-to-halve`, `added-the-sides`
- **Example:** A garden plot is a trapezoid with parallel sides of 20 m and 30 m, 6 m apart. How many square metres is it? **Answer: 150 m²**

#### `area.grid-trapezoid`

Find the area of a trapezoid drawn on squared paper.

- **Competency:** G5.Q1.12, estimate areas of triangles and quadrilaterals using grids
- **Domain:** MG, Measurement and Geometry
- **Schema:** part-whole (multiplicative)
- **Answer:** number with a unit, in square units, up to 1 decimal place
- **Draws:** `a: 3 to 8`; `t: 1 to a - 1`; `h: 2 to 5`; `o: 0 to a - t`
- **Formats:** `grid`
- **Named mistakes:** `used-only-the-bottom`, `forgot-to-halve`
- **Example:** Picture: squared paper 8 squares across and 6 up, with a shape whose corners are at 1 across and 1 up; 7 across and 1 up; 7 across and 5 up; 6 across and 5 up. Each square is 1 square unit. Each small square on the grid is 1 square unit. What is the area of the trapezoid? **Answer: 14 square units**

**Level 3: Square units** (`square-units`, 3 templates)

#### `area.m2-to-cm2`

Convert square metres to square centimetres.

- **Competency:** G6.Q3.6, convert square centimetres to square metres and back
- **Domain:** MG, Measurement and Geometry
- **Schema:** multiplicative-compare (multiplicative)
- **Answer:** number with a unit, in cm²
- **Draws:** `m: 2 to 9 (tiers 1–2), 2 to 60 (tiers 3–4)`
- **Formats:** `convert`
- **Named mistakes:** `used-100`, `used-1000`
- **Example:** 7 m² = ? cm² **Answer: 70000 cm²**

#### `area.cm2-to-m2`

Convert square centimetres to square metres.

- **Competency:** G6.Q3.6, convert square centimetres to square metres and back
- **Domain:** MG, Measurement and Geometry
- **Schema:** multiplicative-compare (multiplicative)
- **Answer:** number with a unit, in m²
- **Draws:** `k: 1 to 30 (tiers 1–2), 1 to 150 (tiers 3–4)`
- **Formats:** `convert`
- **Named mistakes:** `divided-by-100`, `divided-by-1000`
- **Example:** 9500 cm² = ? m² **Answer: 0.95 m²**

#### `area.tiles`

Count square tiles for a floor, converting metres to centimetres.

- **Competency:** G6.Q3.8, perimeter and area problems including trapezoids and composites
- **Domain:** MG, Measurement and Geometry
- **Schema:** multi-step (non-routine)
- **Answer:** whole number
- **Draws:** `t: one of 20, 25, 50`; `W: 2 to 4 (tiers 1–2), 2 to 8 (tiers 3–4)`; `L: 2 to 5 (tiers 1–2), 3 to 10 (tiers 3–4)`
- **Formats:** `floor`, `store`
- **Named mistakes:** `did-not-convert`, `added-instead`
- **Example:** The floor of a sari-sari store is 2 m by 4 m. It is covered with square tiles 25 cm on each side. How many tiles are used? **Answer: 128**

**Level 4: Composite figures** (`composite`, 4 templates)

#### `area.l-shape`

Find the area of an L-shaped figure by taking a corner away.

- **Competency:** G6.Q3.7, area of composite figures from triangles, squares, rectangles
- **Domain:** MG, Measurement and Geometry
- **Schema:** part-whole (multiplicative)
- **Answer:** number with a unit, in m²
- **Draws:** `W: 6 to 12 (tiers 1–2), 8 to 20 (tiers 3–4)`; `H: 5 to 10 (tiers 1–2), 7 to 18 (tiers 3–4)`; `w: 2 to W - 2`; `h: 2 to H - 2`
- **Formats:** `room`, `garden`
- **Named mistakes:** `added-the-corner`, `gave-the-whole-rectangle`
- **Example:** A garden is a rectangle 10 m by 5 m, with a corner 5 m by 3 m taken out for a shed. What is the area of the garden? **Answer: 35 m²**

#### `area.house-wall`

Find the area of a rectangle with a triangle on top.

- **Competency:** G6.Q3.7, area of composite figures from triangles, squares, rectangles
- **Domain:** MG, Measurement and Geometry
- **Schema:** part-whole (multiplicative)
- **Answer:** number with a unit, in m²
- **Draws:** `w: 4 to 10 (tiers 1–2), 6 to 16 (tiers 3–4)`; `h: 2 to 6 (tiers 1–2), 3 to 9 (tiers 3–4)`; `t: 2 to 6 (tiers 1–2), 2 to 8 (tiers 3–4)`
- **Kept only when:** `w * t % 2 == 0`
- **Formats:** `wall`, `billboard`
- **Named mistakes:** `forgot-to-halve-the-triangle`, `left-out-the-triangle`
- **Example:** A billboard is a rectangle 8 m wide and 2 m high, with a triangle 4 m high on top along its whole width. What is the area of the billboard? **Answer: 32 m²**

#### `area.l-perimeter`

Find the perimeter of an L-shaped figure.

- **Competency:** G6.Q3.8, perimeter and area problems including trapezoids and composites
- **Domain:** MG, Measurement and Geometry
- **Schema:** part-whole (multiplicative)
- **Answer:** number with a unit, in m
- **Draws:** `W: 6 to 12 (tiers 1–2), 8 to 20 (tiers 3–4)`; `H: 5 to 10 (tiers 1–2), 7 to 18 (tiers 3–4)`; `w: 2 to W - 2`; `h: 2 to H - 2`
- **Formats:** `lot`
- **Named mistakes:** `added-the-four-given`, `took-off-the-corner`, `gave-the-area`
- **Example:** An L-shaped lot is made from a rectangle 10 m by 5 m, with a corner 5 m by 3 m cut away. How many metres of fence go around it? **Answer: 30 m**

#### `area.paint`

Solve a painting problem with area.

- **Competency:** G6.Q3.8, perimeter and area problems including trapezoids and composites
- **Domain:** MG, Measurement and Geometry
- **Schema:** multi-step (non-routine)
- **Answer:** whole number
- **Draws:** `c: one of 4, 5, 6, 8, 10`; `w: 3 to 8 (tiers 1–2), 4 to 12 (tiers 3–4)`; `h: 2 to 4 (tiers 1–2), 2 to 5 (tiers 3–4)`
- **Kept only when:** `A % c == 0`
- **Formats:** `wall`, `store`
- **Named mistakes:** `gave-the-area`, `used-the-perimeter`
- **Example:** A wall is 4 m long and 4 m high. One can of paint covers 8 m². How many cans are needed to paint the wall once? **Answer: 2**

### 9. Solids and volume (`solids`)

Blueprint weight 9%.

**Level 1: Faces, edges and vertices** (`parts`, 8 templates)

#### `solids.prism-parts`

Count the faces, edges or vertices of a prism.

- **Competency:** G5.Q4.5, differentiate prisms and pyramids by vertices, faces, edges
- **Domain:** MG, Measurement and Geometry
- **Schema:** part-whole (multiplicative)
- **Answer:** whole number
- **Draws:** `n: one of 3, 4, 5, 6, 8`; `what: one of faces, edges, vertices`
- **Formats:** `prism`
- **Named mistakes:** `gave-the-faces`, `gave-the-edges`, `gave-the-vertices`, `counted-one-base`
- **Example:** A hexagonal prism has two hexagonal bases with 6 sides each. How many faces does it have? **Answer: 8**

#### `solids.pyramid-parts`

Count the faces, edges or vertices of a pyramid.

- **Competency:** G5.Q4.5, differentiate prisms and pyramids by vertices, faces, edges
- **Domain:** MG, Measurement and Geometry
- **Schema:** part-whole (multiplicative)
- **Answer:** whole number
- **Draws:** `n: one of 3, 4, 5, 6, 8`; `what: one of faces, edges, vertices`
- **Formats:** `pyramid`
- **Named mistakes:** `mixed-up-the-counts`, `counted-like-a-prism`, `counted-the-base-only`
- **Example:** A hexagonal pyramid has a hexagonal base with 6 sides. How many faces does it have? **Answer: 7**

#### `solids.cube-edges`

Find the total length of a cube's edges.

- **Competency:** G5.Q4.10, describe and distinguish cubes and rectangular prisms
- **Domain:** MG, Measurement and Geometry
- **Schema:** equal-groups (multiplicative)
- **Answer:** number with a unit, in cm
- **Draws:** `s: 2 to 12 (tiers 1–2), 5 to 40 (tiers 3–4)`
- **Formats:** `wire`, `lito`
- **Named mistakes:** `counted-faces`, `counted-vertices`, `counted-one-face`
- **Example:** A wire frame is made in the shape of a cube with edges 8 cm long. How many centimetres of wire does it use? **Answer: 96 cm**

#### `solids.box-edges`

Find the total length of a rectangular prism's edges.

- **Competency:** G5.Q4.10, describe and distinguish cubes and rectangular prisms
- **Domain:** MG, Measurement and Geometry
- **Schema:** equal-groups (multiplicative)
- **Answer:** number with a unit, in cm
- **Draws:** `a: 3 to 12 (tiers 1–2), 5 to 30 (tiers 3–4)`; `b: 2 to 10 (tiers 1–2), 4 to 25 (tiers 3–4)`; `c: 2 to 8 (tiers 1–2), 3 to 20 (tiers 3–4)`
- **Kept only when:** `a != b`; `b != c`; `a != c`
- **Formats:** `frame`, `ribbon`
- **Named mistakes:** `counted-one-of-each`, `counted-two-of-each`, `gave-the-volume`
- **Example:** Ribbon is glued along every edge of a gift box 9 cm long, 2 cm wide and 5 cm high. How many centimetres of ribbon are used? **Answer: 64 cm**

#### `solids.solid-from-faces`

Name a solid from the flat shapes of its faces.

- **Competency:** G5.Q4.4, relate plane figures to solid figures
- **Domain:** MG, Measurement and Geometry
- **Schema:** part-whole (multiplicative)
- **Answer:** multiple choice
- **Draws:** `s: 1 to 8`
- **Formats:** `faces`
- **Named mistakes:** `picked-a-similar-solid`, `picked-another-solid`, `picked-a-third-solid`
- **Example:** Which solid has 2 equal circular faces joined by one curved surface? Choices: A rectangular prism; A cylinder; A cone; A sphere. **Answer: A cylinder**

#### `solids.from-a-net`

Name the solid a net folds into.

- **Competency:** G5.Q4.6, illustrate and describe solid figures and their nets
- **Domain:** MG, Measurement and Geometry
- **Schema:** part-whole (multiplicative)
- **Answer:** multiple choice
- **Draws:** `s: 1 to 7`
- **Formats:** `net`
- **Named mistakes:** `picked-a-similar-solid`, `picked-another-solid`, `picked-a-third-solid`
- **Example:** A net is a flat pattern that folds up into a solid. A net is made of 4 equal triangles. Which solid does it fold into? Choices: A triangular prism; A square pyramid; A triangular pyramid; A cone. **Answer: A triangular pyramid**

#### `solids.name-the-solid`

Name a solid from a picture of it.

- **Competency:** G5.Q4.3, illustrate solid figures with concrete and pictorial models
- **Domain:** MG, Measurement and Geometry
- **Schema:** compare (additive)
- **Answer:** multiple choice
- **Draws:** `s: 1 to 8`
- **Formats:** `name`, `which`
- **Named mistakes:** `picked-a-similar-solid`, `picked-another-solid`, `picked-a-third-solid`
- **Example:** Picture: a solid drawn in outline, its hidden edges dashed: 2 circular ends joined by one curved surface. What is the name of this solid? Choices: A rectangular prism; A cylinder; A sphere; A cone. **Answer: A cylinder**

#### `solids.pick-the-solid`

Choose the picture of a named solid.

- **Competency:** G5.Q4.3, illustrate solid figures with concrete and pictorial models
- **Domain:** MG, Measurement and Geometry
- **Schema:** compare (additive)
- **Answer:** choice of pictures
- **Draws:** `s: 1 to 8`
- **Formats:** `pick`
- **Named mistakes:** `picked-a-similar-solid`, `picked-another-solid`, `picked-a-third-solid`
- **Example:** Which picture shows a cylinder? Choices: A: Picture: a solid drawn in outline, its hidden edges dashed: one curved surface and no flat faces.; B: Picture: a solid drawn in outline, its hidden edges dashed: a circular base and a curved surface that comes to a point.; C: Picture: a solid drawn in outline, its hidden edges dashed: 2 circular ends joined by one curved surface.; D: Picture: a solid drawn in outline, its hidden edges dashed: 6 rectangular faces, not all the same size. **Answer: Picture C**

**Level 2: Surface area** (`surface-area`, 3 templates)

#### `solids.cube-surface`

Find the surface area of a cube.

- **Competency:** G5.Q4.8, illustrate and find the surface area of solid figures
- **Domain:** MG, Measurement and Geometry
- **Schema:** equal-groups (multiplicative)
- **Answer:** number with a unit, in cm²
- **Draws:** `s: 2 to 10 (tiers 1–2), 4 to 25 (tiers 3–4)`
- **Kept only when:** `s != 6`
- **Formats:** `cube`, `paper`
- **Named mistakes:** `gave-the-volume`, `gave-one-face`, `counted-four-faces`
- **Example:** A cube has edges 7 cm long. What is its surface area? **Answer: 294 cm²**

#### `solids.box-surface`

Find the surface area of a rectangular prism.

- **Competency:** G5.Q4.8, illustrate and find the surface area of solid figures
- **Domain:** MG, Measurement and Geometry
- **Schema:** multi-step (non-routine)
- **Answer:** number with a unit, in cm²
- **Draws:** `a: 3 to 10 (tiers 1–2), 5 to 20 (tiers 3–4)`; `b: 2 to 8 (tiers 1–2), 4 to 15 (tiers 3–4)`; `c: 2 to 6 (tiers 1–2), 3 to 12 (tiers 3–4)`
- **Kept only when:** `a != b`; `b != c`
- **Formats:** `box`, `wrap`
- **Named mistakes:** `counted-one-of-each`, `gave-the-volume`
- **Example:** How much paper covers a box 8 cm long, 2 cm wide and 4 cm high exactly, with no overlap? **Answer: 112 cm²**

#### `solids.open-box`

Solve a surface area problem: a box with no lid.

- **Competency:** G5.Q4.9, solve problems involving surface area
- **Domain:** MG, Measurement and Geometry
- **Schema:** multi-step (non-routine)
- **Answer:** number with a unit, in cm²
- **Draws:** `a: 4 to 12 (tiers 1–2), 6 to 25 (tiers 3–4)`; `b: 3 to 10 (tiers 1–2), 5 to 20 (tiers 3–4)`; `c: 2 to 8 (tiers 1–2), 3 to 15 (tiers 3–4)`
- **Kept only when:** `a != b`
- **Formats:** `paint`, `paper`
- **Named mistakes:** `counted-the-lid`, `left-out-the-bottom`
- **Example:** Ana covers the outside of an open box, 9 cm by 3 cm and 5 cm high, with paper: the bottom and the four sides. How much paper does she need? **Answer: 147 cm²**

**Level 3: Volume** (`volume`, 7 templates)

#### `solids.cube-volume`

Find the volume of a cube.

- **Competency:** G6.Q3.3, find the volume of a cube and of a rectangular prism
- **Domain:** MG, Measurement and Geometry
- **Schema:** equal-groups (multiplicative)
- **Answer:** number with a unit, in cm³
- **Draws:** `s: 2 to 10 (tiers 1–2), 3 to 30 (tiers 3–4)`
- **Kept only when:** `s != 6`
- **Formats:** `cube`, `space`
- **Named mistakes:** `multiplied-by-3`, `gave-the-surface-area`, `gave-one-face`
- **Example:** A cube has edges 7 cm long. What is its volume? **Answer: 343 cm³**

#### `solids.box-volume`

Find the volume of a rectangular prism.

- **Competency:** G6.Q3.3, find the volume of a cube and of a rectangular prism
- **Domain:** MG, Measurement and Geometry
- **Schema:** equal-groups (multiplicative)
- **Answer:** number with a unit, in cm³
- **Draws:** `a: 2 to 12 (tiers 1–2), 5 to 30 (tiers 3–4)`; `b: 2 to 10 (tiers 1–2), 4 to 20 (tiers 3–4)`; `c: 2 to 8 (tiers 1–2), 3 to 15 (tiers 3–4)`
- **Formats:** `box`, `aquarium`
- **Named mistakes:** `added-instead`, `gave-the-surface-area`
- **Example:** An aquarium is 8 cm long, 2 cm wide and 5 cm deep. What is its volume in cubic centimetres? **Answer: 80 cm³**

#### `solids.missing-edge`

Find a missing edge from the volume.

- **Competency:** G6.Q3.4, solve problems involving volumes of cubes and prisms
- **Domain:** MG, Measurement and Geometry
- **Schema:** work-backwards (non-routine)
- **Answer:** number with a unit, in cm
- **Draws:** `a: 2 to 10 (tiers 1–2), 4 to 20 (tiers 3–4)`; `b: 2 to 8 (tiers 1–2), 3 to 15 (tiers 3–4)`; `c: 2 to 9 (tiers 1–2), 3 to 15 (tiers 3–4)`
- **Formats:** `box`, `sand`
- **Named mistakes:** `took-away-instead`, `divided-by-one-edge`
- **Example:** A small box holds 84 cm³ of sand when full. Its base is 7 cm by 2 cm. How high is it? **Answer: 6 cm**

#### `solids.cubes-in-box`

Count how many small cubes fit in a box.

- **Competency:** G6.Q3.4, solve problems involving volumes of cubes and prisms
- **Domain:** MG, Measurement and Geometry
- **Schema:** multi-step (non-routine)
- **Answer:** whole number
- **Draws:** `e: one of 2, 3, 5`; `p: 2 to 6`; `q: 2 to 6`; `r: 1 to 5`
- **Formats:** `cubes`, `blocks`
- **Named mistakes:** `gave-the-box-volume`, `divided-by-the-edge`
- **Example:** Wooden blocks shaped like cubes, with 3 cm edges, are packed into a box 6 cm long, 12 cm wide and 15 cm high, with no gaps. How many blocks fill it? **Answer: 40**

#### `solids.extra-parcel`

Find the volume of a box, ignoring its mass and cost.

- **Competency:** G6.Q3.3, find the volume of a cube and of a rectangular prism
- **Domain:** MG, Measurement and Geometry
- **Schema:** excess-info (non-routine)
- **Answer:** number with a unit, in cm³
- **Draws:** `l: 5 to 20`; `w: 3 to 12`; `h: 2 to 10`; `kg: one of 1, 2, 3, 5`; `fee: one of 150, 180, 250`
- **Kept only when:** `l != w`
- **Formats:** `parcel`
- **Named mistakes:** `added-the-edges`, `found-the-surface-area`
- **Example:** A parcel box is 15 cm long, 3 cm wide and 6 cm tall. It weighs 5 kg, and sending it costs ₱250. What is its volume? **Answer: 270 cm³**

#### `solids.count-cubes`

Count the cubes in a block by its layers, hidden ones included.

- **Competency:** G5.Q4.11, estimate volume using non-standard units
- **Domain:** MG, Measurement and Geometry
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `l: 2 to 4 (tiers 1–2), 3 to 6 (tiers 3–4)`; `w: 2 to 3 (tiers 1–2), 2 to 4 (tiers 3–4)`; `h: 2 to 3 (tiers 1–2), 2 to 5 (tiers 3–4)`
- **Formats:** `count`, `volume`
- **Named mistakes:** `counted-only-the-cubes-you-see`, `counted-the-front-only`, `counted-the-faces`, `added-the-edges`
- **Example:** Picture: a block built from small cubes with no gaps, 3 cubes long, 2 cubes deep and 3 cubes high. Each small cube is one unit of volume. What is the volume of the block, in cubes? **Answer: 18**

#### `solids.one-more-layer`

Find how many cubes one more layer on a block takes.

- **Competency:** G5.Q4.11, estimate volume using non-standard units
- **Domain:** MG, Measurement and Geometry
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `l: 2 to 4 (tiers 1–2), 3 to 6 (tiers 3–4)`; `w: 2 to 3 (tiers 1–2), 2 to 4 (tiers 3–4)`; `h: 2 to 3 (tiers 1–2), 2 to 5 (tiers 3–4)`
- **Formats:** `add`, `taller`
- **Named mistakes:** `gave-the-whole-block`, `gave-the-new-total`, `used-the-front`, `added-the-edges`
- **Example:** Picture: a block built from small cubes with no gaps, 3 cubes long, 2 cubes deep and 3 cubes high. This block of small cubes is made one layer taller. How many more cubes does it need? **Answer: 6**

**Level 4: Units of volume and capacity** (`units`, 3 templates)

#### `solids.best-unit`

Choose a sensible unit for a volume or a capacity.

- **Competency:** G6.Q3.1, determine appropriate units for volume and capacity
- **Domain:** MG, Measurement and Geometry
- **Schema:** compare (additive)
- **Answer:** multiple choice
- **Draws:** `item: 1 to 8`
- **Formats:** `which`
- **Named mistakes:** `picked-the-next-unit`, `picked-another-unit`, `picked-a-third-unit`
- **Example:** Which unit is best for measuring a water tank for a house? Choices: cubic centimetres (cm³); cubic metres (m³); millilitres (mL); litres (L). **Answer: litres (L)**

#### `solids.cm3-to-litres`

Convert cubic centimetres to litres.

- **Competency:** G6.Q3.2, convert cubic centimetres to litres and back
- **Domain:** MG, Measurement and Geometry
- **Schema:** multiplicative-compare (multiplicative)
- **Answer:** number with a unit, in L
- **Draws:** `k: 1 to 20 (tiers 1–2), 1 to 90 (tiers 3–4)`
- **Formats:** `convert`
- **Named mistakes:** `divided-by-100`, `multiplied-instead`
- **Example:** 3250 cm³ = ? L **Answer: 3.25 L**

#### `solids.litres-to-cm3`

Convert litres to cubic centimetres.

- **Competency:** G6.Q3.2, convert cubic centimetres to litres and back
- **Domain:** MG, Measurement and Geometry
- **Schema:** multiplicative-compare (multiplicative)
- **Answer:** number with a unit, in cm³
- **Draws:** `k: 1 to 20 (tiers 1–2), 1 to 60 (tiers 3–4)`
- **Formats:** `convert`, `ml`
- **Named mistakes:** `multiplied-by-100`, `divided-instead`
- **Example:** 3.25 L = ? cm³ **Answer: 3250 cm³**

**Level 5: Capacity problems** (`capacity`, 3 templates)

#### `solids.tank-litres`

Find how many litres a tank holds.

- **Competency:** G6.Q3.5, solve problems involving capacity
- **Domain:** MG, Measurement and Geometry
- **Schema:** multi-step (non-routine)
- **Answer:** number with a unit, in L
- **Draws:** `a: one of 20, 25, 30, 40, 50, 60`; `b: one of 10, 20, 25, 30, 40`; `c: one of 10, 15, 20, 25, 30, 40`
- **Formats:** `tank`, `aquarium`
- **Named mistakes:** `did-not-convert`, `divided-by-100`
- **Example:** An aquarium is 40 cm long, 10 cm wide and 25 cm high. How many litres of water fill it? **Answer: 10 L**

#### `solids.pails`

Find how many containers fill a tank.

- **Competency:** G6.Q3.5, solve problems involving capacity
- **Domain:** MG, Measurement and Geometry
- **Schema:** multi-step (non-routine)
- **Answer:** whole number
- **Draws:** `p: one of 2, 4, 5, 8, 10`; `a: one of 40, 50, 60, 80, 100`; `b: one of 20, 25, 40, 50`; `c: one of 20, 25, 40, 50`
- **Kept only when:** `floor(L) == L && L % p == 0`
- **Formats:** `pails`, `mang-ben`
- **Named mistakes:** `gave-the-litres`, `did-not-convert`
- **Example:** Mang Ben fills a tank 40 cm long, 40 cm wide and 50 cm high, using a pail that holds 8 L. How many pails of water does it take? **Answer: 10**

#### `solids.water-depth`

Find how deep water stands from its volume in litres and the floor of the tank.

- **Competency:** G6.Q3.5, solve problems involving capacity
- **Domain:** MG, Measurement and Geometry
- **Schema:** multi-step (non-routine)
- **Answer:** number with a unit, in cm
- **Draws:** `a: one of 20, 25, 40, 50, 60, 80`; `b: one of 20, 25, 30, 40, 50`; `h: 4 to 30`
- **Kept only when:** `floor(L * 10) == L * 10`
- **Formats:** `tank`, `box`
- **Named mistakes:** `used-100-cm3-a-litre`, `divided-by-the-length-only`
- **Example:** A water container shaped like a box has a base 50 cm by 20 cm. It holds 18 L of water. How high does the water reach, in centimetres? **Answer: 18 cm**

### 10. Circles (`circles`)

Blueprint weight 8%.

**Level 1: Parts of a circle** (`parts`, 3 templates)

#### `circles.diameter`

Find the diameter from the radius.

- **Competency:** G6.Q3.10, identify and describe the parts of a circle
- **Domain:** MG, Measurement and Geometry
- **Schema:** multiplicative-compare (multiplicative)
- **Answer:** number with a unit, in cm
- **Draws:** `r: 2 to 25 (tiers 1–2), 5 to 90 (tiers 3–4)`
- **Formats:** `circle`, `plate`
- **Named mistakes:** `halved-instead`, `gave-the-radius`
- **Example:** A circle has a radius of 17 cm. What is its diameter? **Answer: 34 cm**

#### `circles.radius`

Find the radius from the diameter.

- **Competency:** G6.Q3.10, identify and describe the parts of a circle
- **Domain:** MG, Measurement and Geometry
- **Schema:** multiplicative-compare (multiplicative)
- **Answer:** number with a unit, in cm
- **Draws:** `d: 4 to 50 (tiers 1–2), 9 to 99 (tiers 3–4)`
- **Formats:** `circle`, `clock`
- **Named mistakes:** `doubled-instead`, `gave-the-diameter`
- **Example:** A circle has a diameter of 33 cm. What is its radius? **Answer: 16.5 cm**

#### `circles.parts`

Name a part of a circle from its description.

- **Competency:** G6.Q3.10, identify and describe the parts of a circle
- **Domain:** MG, Measurement and Geometry
- **Schema:** part-whole (multiplicative)
- **Answer:** multiple choice
- **Draws:** `item: 1 to 4`
- **Formats:** `name`
- **Named mistakes:** `picked-the-next-part`, `picked-another-part`, `picked-a-third-part`
- **Example:** What is the name for a line joining two points on a circle that does not pass through the centre? Choices: radius; diameter; chord; circumference. **Answer: chord**

**Level 2: Circumference** (`circumference`, 5 templates)

#### `circles.circumference-pi`

Find a circumference in terms of π.

- **Competency:** G6.Q3.13, find the circumference of a circle
- **Domain:** MG, Measurement and Geometry
- **Schema:** multiplicative-compare (multiplicative)
- **Answer:** multiple of π
- **Draws:** `d: 2 to 30 (tiers 1–2), 5 to 99 (tiers 3–4)`
- **Formats:** `diameter`
- **Named mistakes:** `doubled-the-diameter`, `found-the-area`, `used-the-radius`
- **Example:** A circle has a diameter of 20 cm. What is its circumference, in terms of π? **Answer: 20π**

#### `circles.circumference-314`

Find a circumference with π = 3.14.

- **Competency:** G6.Q3.13, find the circumference of a circle
- **Domain:** MG, Measurement and Geometry
- **Schema:** multiplicative-compare (multiplicative)
- **Answer:** decimal
- **Draws:** `r: 1 to 15 (tiers 1–2), 5 to 50 (tiers 3–4)`
- **Formats:** `radius`, `fence`
- **Named mistakes:** `forgot-to-double`, `found-the-area`
- **Example:** Use π = 3.14. A circle has a radius of 10 cm. What is its circumference? **Answer: 62.8**

#### `circles.wheel-227`

Find how far a wheel rolls in one turn, with π = 22/7.

- **Competency:** G6.Q3.13, find the circumference of a circle
- **Domain:** MG, Measurement and Geometry
- **Schema:** multiplicative-compare (multiplicative)
- **Answer:** number with a unit, in cm
- **Draws:** `k: 1 to 6 (tiers 1–2), 2 to 14 (tiers 3–4)`
- **Formats:** `wheel`, `wheelbarrow`
- **Named mistakes:** `used-the-diameter-as-radius`, `gave-the-diameter`
- **Example:** Use π = 22/7. A wheel has a diameter of 28 cm. How far does it roll in one full turn? **Answer: 88 cm**

#### `circles.extra-table`

Find a circumference with π = 3.14, ignoring a height.

- **Competency:** G6.Q3.13, find the circumference of a circle
- **Domain:** MG, Measurement and Geometry
- **Schema:** excess-info (non-routine)
- **Answer:** number with a unit, in cm, up to 2 decimal places
- **Draws:** `d: one of 50, 60, 80, 100, 120, 150`; `h: one of 70, 75, 80`
- **Formats:** `table`
- **Named mistakes:** `used-the-height`, `used-the-diameter-as-radius`
- **Example:** A round table is 100 cm across and stands 70 cm tall. Using π = 3.14, how far is it around the edge of the table? **Answer: 314 cm**

#### `circles.pi-from-measuring`

Find pi as the circumference over the diameter, from measurements.

- **Competency:** G6.Q3.12, approximate pi as the ratio of circumference to diameter
- **Domain:** MG, Measurement and Geometry
- **Schema:** multiplicative-compare (multiplicative)
- **Answer:** decimal, up to 2 decimal places
- **Draws:** `d: one of 10, 20, 25, 30, 40, 50`; `e: 0 to 4`
- **Formats:** `plate`, `can`
- **Named mistakes:** `divided-the-wrong-way`, `took-away`
- **Example:** The distance round a can is 94 cm, and the can is 30 cm across. What is the distance round divided by the distance across, to the nearest hundredth? **Answer: 3.13**

**Level 3: Area of a circle** (`area`, 4 templates)

#### `circles.area-pi`

Find the area of a circle in terms of π from its radius.

- **Competency:** G6.Q4.2, find the area of a circle using the formula
- **Domain:** MG, Measurement and Geometry
- **Schema:** equal-groups (multiplicative)
- **Answer:** multiple of π
- **Draws:** `r: 2 to 12 (tiers 1–2), 5 to 30 (tiers 3–4)`
- **Kept only when:** `r != 2`
- **Formats:** `radius`
- **Named mistakes:** `found-the-circumference`, `used-the-diameter`
- **Example:** A circle has a radius of 8 cm. What is its area, in terms of π? **Answer: 64π**

#### `circles.area-from-diameter`

Find the area of a circle in terms of π from its diameter.

- **Competency:** G6.Q4.2, find the area of a circle using the formula
- **Domain:** MG, Measurement and Geometry
- **Schema:** equal-groups (multiplicative)
- **Answer:** multiple of π
- **Draws:** `r: 2 to 12 (tiers 1–2), 5 to 30 (tiers 3–4)`
- **Kept only when:** `r != 2`
- **Formats:** `diameter`
- **Named mistakes:** `used-the-diameter`, `found-the-circumference`
- **Example:** A circle has a diameter of 16 cm. What is its area, in terms of π? **Answer: 64π**

#### `circles.area-314`

Find the area of a circle with π = 3.14.

- **Competency:** G6.Q4.2, find the area of a circle using the formula
- **Domain:** MG, Measurement and Geometry
- **Schema:** equal-groups (multiplicative)
- **Answer:** decimal
- **Draws:** `r: 1 to 10 (tiers 1–2), 3 to 20 (tiers 3–4)`
- **Kept only when:** `r != 2`
- **Formats:** `radius`, `rug`
- **Named mistakes:** `found-the-circumference`, `used-the-diameter`
- **Example:** Use π = 3.14. A circle has a radius of 7 cm. What is its area? **Answer: 153.86**

#### `circles.slices-to-parallelogram`

See why a circle's area is pi times r times r, by cutting it into slices.

- **Competency:** G6.Q4.1, explore inductively the area of a circle toward the formula
- **Domain:** MG, Measurement and Geometry
- **Schema:** multi-step (non-routine)
- **Answer:** number with a unit, in cm
- **Draws:** `k: 1 to 4`
- **Formats:** `slices`
- **Named mistakes:** `gave-the-whole-circumference`, `gave-the-radius`
- **Example:** A circle with a radius of 21 cm is cut into many equal slices. The slices are laid side by side, points up and points down, to make a shape very close to a parallelogram. Its height is the radius, and its base is half the circumference. With π = 22/7, how long is the base? **Answer: 66 cm**

**Level 4: Circle problems** (`composite`, 5 templates)

#### `circles.semicircle`

Find the area of a semicircle with π = 3.14.

- **Competency:** G6.Q4.3, area of composites of triangle, square, rectangle, circle, semicircle
- **Domain:** MG, Measurement and Geometry
- **Schema:** part-whole (multiplicative)
- **Answer:** number with a unit, in cm²
- **Draws:** `r: 2 to 10 (tiers 1–2), 3 to 20 (tiers 3–4)`
- **Formats:** `half`, `window`
- **Named mistakes:** `gave-the-whole-circle`, `used-the-diameter`
- **Example:** Use π = 3.14. A semicircle has a diameter of 14 cm. What is its area? **Answer: 76.93 cm²**

#### `circles.window`

Find the area of a square with a semicircle on top, with π = 3.14.

- **Competency:** G6.Q4.3, area of composites of triangle, square, rectangle, circle, semicircle
- **Domain:** MG, Measurement and Geometry
- **Schema:** part-whole (multiplicative)
- **Answer:** number with a unit, in cm²
- **Draws:** `r: 2 to 10 (tiers 1–2), 5 to 25 (tiers 3–4)`
- **Formats:** `window`
- **Named mistakes:** `added-a-whole-circle`, `left-out-the-semicircle`
- **Example:** Use π = 3.14. A window is a square 14 cm wide with a semicircle on top. The semicircle's diameter is the square's top side. What is the area of the window? **Answer: 272.93 cm²**

#### `circles.track`

Find the distance around a running track: two straights and two semicircles.

- **Competency:** G6.Q4.4, problems involving circumference and area of circles and composites
- **Domain:** MG, Measurement and Geometry
- **Schema:** multi-step (non-routine)
- **Answer:** number with a unit, in m
- **Draws:** `L: 20 to 60 (tiers 1–2), 40 to 120 (tiers 3–4)`; `k: 2 to 6 (tiers 1–2), 3 to 9 (tiers 3–4)`
- **Formats:** `track`
- **Named mistakes:** `counted-two-whole-circles`, `left-out-the-curves`
- **Example:** Use π = 3.14. A running track has two straight sides, each 45 m long, joined by two semicircles with a diameter of 20 m. How long is one lap? **Answer: 152.8 m**

#### `circles.wheel-distance`

Find how far a wheel travels in a number of turns, with π = 22/7.

- **Competency:** G6.Q4.4, problems involving circumference and area of circles and composites
- **Domain:** MG, Measurement and Geometry
- **Schema:** multi-step (non-routine)
- **Answer:** number with a unit, in m
- **Draws:** `n: one of 5, 10, 20, 25, 50, 100`
- **Formats:** `bike`
- **Named mistakes:** `did-not-change-to-metres`, `used-the-diameter`
- **Example:** Use π = 22/7. A bicycle wheel has a diameter of 70 cm. How many metres does the bicycle go when the wheel turns 25 times? **Answer: 55 m**

#### `circles.ring`

Find the area of a ring in terms of π.

- **Competency:** G6.Q4.3, area of composites of triangle, square, rectangle, circle, semicircle
- **Domain:** MG, Measurement and Geometry
- **Schema:** part-whole (multiplicative)
- **Answer:** multiple of π
- **Draws:** `R: 4 to 12 (tiers 1–2), 6 to 25 (tiers 3–4)`; `r: 1 to R - 2`
- **Formats:** `ring`, `path`
- **Named mistakes:** `squared-the-width`, `added-the-circles`
- **Example:** A round pond has a radius of 1 m, and a path goes around it out to a radius of 9 m. What is the area of the path, in terms of π? **Answer: 80π**

### 11. Graphs and data (`data`)

Blueprint weight 11%.

**Level 1: Choosing and reading graphs** (`reading`, 3 templates)

#### `data.which-graph`

Choose the graph that suits a data set.

- **Competency:** G5.Q3.2, identify the appropriate graph for a data set
- **Domain:** DP, Data and Probability
- **Schema:** compare (additive)
- **Answer:** multiple choice
- **Draws:** `s: 1 to 10`
- **Formats:** `situation`
- **Named mistakes:** `one-set-or-two`, `time-or-categories`, `parts-or-amounts`
- **Example:** Which graph would show this data best: the monthly sales of two stores from January to June? Choices: A double bar graph; A line graph; A double line graph; A pie graph. **Answer: A double line graph**

#### `data.read-bar`

Read one value from a double bar graph.

- **Competency:** G5.Q3.4, interpret a double bar or double line graph
- **Domain:** DP, Data and Probability
- **Schema:** compare (additive)
- **Answer:** whole number
- **Draws:** `ctx: 1 to 3`; `a1: 1 to 10`; `a2: 1 to 10`; `a3: 1 to 10`; `a4: 1 to 10`; `b1: 1 to 10`; `b2: 1 to 10`; `b3: 1 to 10`; `b4: 1 to 10`; `sr: 1 to 2`; `m: 1 to 4`
- **Kept only when:** `max(a1, a2, a3, a4, b1, b2, b3, b4) >= 4`
- **Formats:** `read`
- **Named mistakes:** `read-the-other-bar`, `read-another-group`
- **Example:** Double bar graph: Mangoes sold (Kilograms). Aling Rosa: Mon 2, Tue 12, Wed 20, Thu 20. Mang Ben: Mon 6, Tue 14, Wed 16, Thu 10. The graph shows the kilograms of mangoes Aling Rosa and Mang Ben sold. How many kilograms of mangoes did Mang Ben sell on Tuesday? **Answer: 14**

#### `data.read-line`

Read one value from a double line graph.

- **Competency:** G5.Q3.4, interpret a double bar or double line graph
- **Domain:** DP, Data and Probability
- **Schema:** compare (additive)
- **Answer:** whole number
- **Draws:** `ctx: 1 to 3`; `a1: 1 to 10`; `a2: 1 to 10`; `a3: 1 to 10`; `a4: 1 to 10`; `a5: 1 to 10`; `b1: 1 to 10`; `b2: 1 to 10`; `b3: 1 to 10`; `b4: 1 to 10`; `b5: 1 to 10`; `sr: 1 to 2`; `m: 1 to 5`
- **Kept only when:** `max(a1, a2, a3, a4, a5, b1, b2, b3, b4, b5) >= 4`
- **Formats:** `read`
- **Named mistakes:** `read-the-other-line`, `read-another-point`
- **Example:** Double line graph: Jeepney trips (Trips). Mang Tony: Mon 2, Tue 12, Wed 20, Thu 20, Fri 6. Mang Rudy: Mon 14, Tue 16, Wed 10, Thu 20, Fri 10. The graph shows the trips two jeepney drivers made each day. How many trips did Mang Tony make on Monday? **Answer: 2**

**Level 2: Comparing and adding** (`comparing`, 3 templates)

#### `data.bar-difference`

Find how many more from a double bar graph.

- **Competency:** G5.Q3.4, interpret a double bar or double line graph
- **Domain:** DP, Data and Probability
- **Schema:** compare (additive)
- **Answer:** whole number
- **Draws:** `ctx: 1 to 3`; `a1: 1 to 10`; `a2: 1 to 10`; `a3: 1 to 10`; `a4: 1 to 10`; `b1: 1 to 10`; `b2: 1 to 10`; `b3: 1 to 10`; `b4: 1 to 10`; `m: 1 to 4`
- **Kept only when:** `pick(m, a1, a2, a3, a4) != pick(m, b1, b2, b3, b4)`; `max(a1, a2, a3, a4, b1, b2, b3, b4) >= 4`
- **Formats:** `more`
- **Named mistakes:** `added-the-bars`, `gave-the-taller-bar`
- **Example:** Double bar graph: Mangoes sold (Kilograms). Aling Rosa: Mon 2, Tue 12, Wed 20, Thu 20. Mang Ben: Mon 6, Tue 14, Wed 16, Thu 10. The graph shows the kilograms of mangoes Aling Rosa and Mang Ben sold. How many more kilograms of mangoes did Aling Rosa sell than Mang Ben on Thursday? **Answer: 10**

#### `data.line-change`

Find the change between two points of a line graph.

- **Competency:** G5.Q3.4, interpret a double bar or double line graph
- **Domain:** DP, Data and Probability
- **Schema:** change (additive)
- **Answer:** whole number
- **Draws:** `ctx: 1 to 3`; `a1: 1 to 10`; `a2: 1 to 10`; `a3: 1 to 10`; `a4: 1 to 10`; `a5: 1 to 10`; `b1: 1 to 10`; `b2: 1 to 10`; `b3: 1 to 10`; `b4: 1 to 10`; `b5: 1 to 10`; `sr: 1 to 2`; `m: 1 to 4`
- **Kept only when:** `v1 != v2`; `max(a1, a2, a3, a4, a5, b1, b2, b3, b4, b5) >= 4`
- **Formats:** `change`
- **Named mistakes:** `gave-the-later-value`, `read-the-other-line`
- **Example:** Double line graph: Jeepney trips (Trips). Mang Tony: Mon 2, Tue 12, Wed 20, Thu 20, Fri 6. Mang Rudy: Mon 14, Tue 16, Wed 10, Thu 20, Fri 10. The graph shows the trips two jeepney drivers made each day. How much did the line for Mang Tony go up from Monday to Tuesday? **Answer: 10**

#### `data.bar-total`

Add the values of one series of a double bar graph.

- **Competency:** G5.Q3.6, solve problems using double bar or line graph data
- **Domain:** DP, Data and Probability
- **Schema:** combine (additive)
- **Answer:** whole number
- **Draws:** `ctx: 1 to 3`; `a1: 1 to 10`; `a2: 1 to 10`; `a3: 1 to 10`; `a4: 1 to 10`; `b1: 1 to 10`; `b2: 1 to 10`; `b3: 1 to 10`; `b4: 1 to 10`; `sr: 1 to 2`
- **Kept only when:** `max(a1, a2, a3, a4, b1, b2, b3, b4) >= 4`
- **Formats:** `total`
- **Named mistakes:** `left-one-out`, `added-both-series`
- **Example:** Double bar graph: Mangoes sold (Kilograms). Aling Rosa: Mon 2, Tue 12, Wed 20, Thu 20. Mang Ben: Mon 6, Tue 14, Wed 16, Thu 10. The graph shows the kilograms of mangoes Aling Rosa and Mang Ben sold. How many kilograms of mangoes did Mang Ben sell from Monday to Thursday? **Answer: 46**

**Level 3: Drawing conclusions** (`conclusions`, 3 templates)

#### `data.most-difference`

Find where two series of a double bar graph differ most.

- **Competency:** G5.Q3.5, draw conclusions from a double bar or line graph
- **Domain:** DP, Data and Probability
- **Schema:** compare (additive)
- **Answer:** multiple choice
- **Draws:** `ctx: 1 to 3`; `k: 1 to 4`; `e1: 1 to 3`; `e2: 1 to 3`; `e3: 1 to 3`; `e4: 1 to 3`; `w: 1 to 3`; `p1: 1 to 10 - d1`; `p2: 1 to 10 - d2`; `p3: 1 to 10 - d3`; `p4: 1 to 10 - d4`; `s1: 0 to 1`; `s2: 0 to 1`; `s3: 0 to 1`; `s4: 0 to 1`
- **Formats:** `most`
- **Named mistakes:** `picked-a-smaller-gap`, `picked-another-smaller-gap`, `picked-a-third-smaller-gap`
- **Example:** Double bar graph: Mangoes sold (Kilograms). Aling Rosa: Mon 8, Tue 6, Wed 14, Thu 10. Mang Ben: Mon 18, Tue 12, Wed 20, Thu 12. The graph shows the kilograms of mangoes Aling Rosa and Mang Ben sold. On which day was the difference between the two sellers greatest? Choices: Monday; Tuesday; Wednesday; Thursday. **Answer: Monday**

#### `data.trend`

Describe the trend of a line graph.

- **Competency:** G5.Q3.5, draw conclusions from a double bar or line graph
- **Domain:** DP, Data and Probability
- **Schema:** change (additive)
- **Answer:** multiple choice
- **Draws:** `ctx: 1 to 2`; `tr: 1 to 4`; `u1: 1 to 2`; `u2: 1 to 2`; `u3: 1 to 2`; `u4: 1 to 2`; `b: 1 to 10`
- **Kept only when:** `min(v1, v2, v3, v4, v5) >= 1`; `max(v1, v2, v3, v4, v5) <= 10`
- **Formats:** `trend`
- **Named mistakes:** `read-the-direction-backwards`, `missed-or-added-a-turn`, `misread-both-halves`
- **Example:** Line graph: Price of tomatoes (Price per kilo). Price: Jan ₱30, Feb ₱40, Mar ₱50, Apr ₱60, May ₱80. The graph shows the price of a kilo of tomatoes from January to May. Which sentence describes the price? Choices: It rose all the way.; It fell all the way.; It rose, then fell.; It fell, then rose. **Answer: It rose all the way.**

#### `data.average`

Find the average of the values in a bar graph.

- **Competency:** G5.Q3.6, solve problems using double bar or line graph data
- **Domain:** DP, Data and Probability
- **Schema:** multi-step (non-routine)
- **Answer:** whole number
- **Draws:** `ctx: 1 to 2`; `a1: 1 to 10`; `a2: 1 to 10`; `a3: 1 to 10`; `a4: 1 to 10`; `mean: 4 to 7`
- **Kept only when:** `a5 >= 1`; `a5 <= 10`
- **Formats:** `average`
- **Named mistakes:** `gave-the-total`, `divided-by-four`
- **Example:** Bar graph: Glasses of juice sold (Glasses). Glasses: Mon 25, Tue 15, Wed 10, Thu 25, Fri 25. The graph shows the glasses of calamansi juice a canteen sold each day. What was the average number sold per day? **Answer: 20**

**Level 4: Pie graphs** (`pie-graphs`, 4 templates)

#### `data.pie-missing`

Find the unlabelled slice of a pie graph.

- **Competency:** G6.Q4.7, interpret data presented in a pie graph
- **Domain:** DP, Data and Probability
- **Schema:** part-whole (multiplicative)
- **Answer:** per cent
- **Draws:** `ctx: 1 to 3`; `p1: 10 to 35 in steps of 5`; `p2: 10 to 35 in steps of 5`; `p3: 10 to 30 in steps of 5`; `sl: 1 to 4`
- **Kept only when:** `p4 >= 10`
- **Formats:** `missing`
- **Named mistakes:** `gave-the-labelled-total`, `took-it-from-360`
- **Example:** Pie graph: Favourite fruits. Clockwise from the top: Banana 10%, Apple 25%, Pineapple 30%, Mango not labelled. The pie graph shows the favourite fruits of a Grade 6 class. The mango slice has lost its label. What percent of the pupils chose mango? **Answer: 35%**

#### `data.pie-angle`

Find the angle of a slice from its percent.

- **Competency:** G6.Q4.5, find angle measures and percentages from pie graph data
- **Domain:** DP, Data and Probability
- **Schema:** part-whole (multiplicative)
- **Answer:** number with a unit, in °
- **Draws:** `ctx: 1 to 3`; `p1: 10 to 35 in steps of 5`; `p2: 10 to 35 in steps of 5`; `p3: 10 to 30 in steps of 5`; `sl: 1 to 4`
- **Kept only when:** `p4 >= 10`
- **Formats:** `angle`
- **Named mistakes:** `gave-the-percent`, `gave-the-rest-of-the-circle`
- **Example:** Pie graph: Favourite fruits. Clockwise from the top: Banana 10%, Apple 25%, Pineapple 30%, Mango 35%. The pie graph shows the favourite fruits of a Grade 6 class. What is the angle at the centre of the mango slice? **Answer: 126°**

#### `data.pie-percent`

Find the percent a slice stands for from its angle.

- **Competency:** G6.Q4.5, find angle measures and percentages from pie graph data
- **Domain:** DP, Data and Probability
- **Schema:** part-whole (multiplicative)
- **Answer:** per cent
- **Draws:** `ctx: 1 to 2`; `d1: 36 to 108 in steps of 18`; `d2: 36 to 108 in steps of 18`; `d3: 36 to 108 in steps of 18`; `sl: 1 to 4`
- **Formats:** `percent`
- **Named mistakes:** `gave-the-angle`, `left-it-as-a-fraction`
- **Example:** Pie graph: Getting to school. Clockwise from the top: Car 36°, Tricycle 72°, Jeepney 108°, Walk 144°. The pie graph shows how the pupils of a school get to school. What percent of the pupils walk? **Answer: 40%**

#### `data.pie-fraction`

Read a slice of a pie graph as a fraction of the whole.

- **Competency:** G6.Q4.9, draw conclusions or inferences from a pie graph
- **Domain:** DP, Data and Probability
- **Schema:** part-whole (multiplicative)
- **Answer:** fraction
- **Draws:** `ctx: 1 to 3`; `p1: 10 to 35 in steps of 5`; `p2: 10 to 35 in steps of 5`; `p3: 10 to 30 in steps of 5`; `sl: 1 to 4`
- **Kept only when:** `p4 >= 10`
- **Formats:** `fraction`
- **Named mistakes:** `fraction-of-the-rest`, `put-it-over-360`
- **Example:** Pie graph: Favourite fruits. Clockwise from the top: Banana 10%, Apple 25%, Pineapple 30%, Mango 35%. The pie graph shows the favourite fruits of a Grade 6 class. What fraction of the pupils chose mango? Give it in lowest terms. **Answer: 7/20**

**Level 5: Graph and table problems** (`problems`, 4 templates)

#### `data.pie-amount`

Find the amount a slice of a pie graph stands for.

- **Competency:** G6.Q4.10, solve problems using data presented in a pie graph
- **Domain:** DP, Data and Probability
- **Schema:** part-whole (multiplicative)
- **Answer:** whole number, in ₱
- **Draws:** `ctx: one of 1, 3`; `p1: 10 to 35 in steps of 5`; `p2: 10 to 35 in steps of 5`; `p3: 10 to 30 in steps of 5`; `sl: 1 to 4`; `amt: one of 200, 300, 400, 500, 600, 800, 1000`
- **Kept only when:** `p4 >= 10`
- **Formats:** `amount`
- **Named mistakes:** `gave-the-rest`, `gave-the-percent`
- **Example:** Pie graph: A class fund. Clockwise from the top: Prizes 10%, Decorations 25%, Cleaning 30%, Snacks 35%. The pie graph shows how a class fund was spent. The class fund was ₱300. How much went to snacks? **Answer: ₱105**

#### `data.pie-count`

Find how many a slice of a pie graph stands for.

- **Competency:** G6.Q4.10, solve problems using data presented in a pie graph
- **Domain:** DP, Data and Probability
- **Schema:** part-whole (multiplicative)
- **Answer:** whole number
- **Draws:** `ctx: 1 to 2`; `d1: 36 to 108 in steps of 18`; `d2: 36 to 108 in steps of 18`; `d3: 36 to 108 in steps of 18`; `sl: 1 to 4`; `n: one of 20, 40, 60, 80, 120, 200`
- **Formats:** `count`
- **Named mistakes:** `gave-the-angle`, `used-the-angle-as-a-percent`
- **Example:** Pie graph: Getting to school. Clockwise from the top: Car 36°, Tricycle 72°, Jeepney 108°, Walk 144°. The pie graph shows how the pupils of a school get to school. 40 pupils were asked. How many walk? **Answer: 16**

#### `data.table-difference`

Compare two values in a table from a website.

- **Competency:** G6.Q4.8, interpret data from digital media in tabular or graphical form
- **Domain:** DP, Data and Probability
- **Schema:** compare (additive)
- **Answer:** decimal, in ₱, up to 2 decimal places
- **Draws:** `u1: 0 to 30`; `v1: 0 to 30`; `u2: 0 to 30`; `v2: 0 to 30`; `u3: 0 to 30`; `v3: 0 to 30`; `u4: 0 to 30`; `v4: 0 to 30`; `w: 1 to 4`
- **Kept only when:** `pick(w, a1, a2, a3, a4) != pick(w, b1, b2, b3, b4)`
- **Formats:** `rice`
- **Named mistakes:** `read-another-week`, `gave-a-price`
- **Example:** Table: Price of a kilo of rice (Week). Week 1: Store A ₱49.50, Store B ₱40.00. Week 2: Store A ₱48.00, Store B ₱55.00. Week 3: Store A ₱55.00, Store B ₱44.00. Week 4: Store A ₱49.00, Store B ₱51.00. A website lists the price of a kilo of rice at two stores each week. In Week 2, how much cheaper was it at Store A than at Store B? **Answer: ₱7**

#### `data.table-average`

Find the average of the values in a table.

- **Competency:** G6.Q4.8, interpret data from digital media in tabular or graphical form
- **Domain:** DP, Data and Probability
- **Schema:** multi-step (non-routine)
- **Answer:** whole number
- **Draws:** `k1: 12 to 48`; `k2: 12 to 48`; `k3: 12 to 48`; `k4: 12 to 48`; `mean: 20 to 40`
- **Kept only when:** `k5 >= 10`; `k5 <= 50`
- **Formats:** `visits`
- **Named mistakes:** `gave-the-total`, `divided-by-four`
- **Example:** Table: Visits to a school website (Day). Monday: Visits 280. Tuesday: Visits 300. Wednesday: Visits 170. Thursday: Visits 260. Friday: Visits 240. A school website shows how many visits its page had each day. What was the average number of visits per day? **Answer: 250**

### 12. Probability (`probability`)

Blueprint weight 4%.

**Level 1: How likely?** (`how-likely`, 3 templates)

#### `probability.likely`

Describe the chance of an event in words.

- **Competency:** G5.Q3.7, describe probability as the chance of an event occurring
- **Domain:** DP, Data and Probability
- **Schema:** compare (additive)
- **Answer:** multiple choice
- **Draws:** `r: 0 to 8`; `b: 0 to 8`
- **Kept only when:** `r + b >= 2`
- **Formats:** `bag`
- **Named mistakes:** `picked-the-next-word`, `picked-another-word`, `picked-a-third-word`
- **Example:** A bag has 5 red marbles and 0 blue marbles. You pick one without looking. How likely is it to be red? Choices: impossible; unlikely; as likely as not; certain. **Answer: certain**

#### `probability.not-happen`

Find the probability that an event does not happen.

- **Competency:** G5.Q3.7, describe probability as the chance of an event occurring
- **Domain:** DP, Data and Probability
- **Schema:** part-whole (multiplicative)
- **Answer:** fraction
- **Draws:** `d: 3 to 10`; `a: 1 to d - 1`
- **Kept only when:** `gcd(a, d) == 1`; `2 * a != d`
- **Formats:** `rain`, `win`
- **Named mistakes:** `gave-the-same-probability`
- **Example:** The probability that a team wins its next game is 1/8. There are no draws. What is the probability that it does not win? **Answer: 7/8**

#### `probability.percent-chance`

Give a probability as a per cent.

- **Competency:** G5.Q3.8, theoretical probability of a simple event by listing outcomes
- **Domain:** DP, Data and Probability
- **Schema:** part-whole (multiplicative)
- **Answer:** per cent
- **Draws:** `total: one of 4, 5, 10, 20, 25, 50`; `w: 1 to total - 1`
- **Kept only when:** `2 * w != total`
- **Formats:** `tickets`
- **Named mistakes:** `gave-the-count`, `gave-the-chance-of-losing`
- **Example:** A box has 20 raffle tickets, and 1 of them win a prize. What is the probability of picking a winning ticket, as a per cent? **Answer: 5%**

**Level 2: Listing outcomes** (`outcomes`, 6 templates)

#### `probability.die`

Find a probability on one die by listing the outcomes.

- **Competency:** G5.Q3.8, theoretical probability of a simple event by listing outcomes
- **Domain:** DP, Data and Probability
- **Schema:** part-whole (multiplicative)
- **Answer:** fraction
- **Draws:** `ev: 1 to 6`
- **Formats:** `die`
- **Named mistakes:** `compared-with-the-rest`, `counted-one-too-many`
- **Example:** A fair die is rolled. What is the probability of rolling a multiple of 3? **Answer: 1/3**

#### `probability.bag`

Find the probability of picking a colour from a bag.

- **Competency:** G5.Q3.8, theoretical probability of a simple event by listing outcomes
- **Domain:** DP, Data and Probability
- **Schema:** part-whole (multiplicative)
- **Answer:** fraction
- **Draws:** `r: 1 to 9`; `g: 1 to 9`; `bl: 1 to 9`; `colour: one of red, green, blue`
- **Formats:** `marbles`
- **Named mistakes:** `counted-colours`, `compared-with-the-rest`
- **Example:** A bag has 6 red, 1 green and 5 blue marbles. You pick one without looking. What is the probability that it is blue? **Answer: 5/12**

#### `probability.spinner`

Find a probability on a numbered spinner.

- **Competency:** G5.Q3.8, theoretical probability of a simple event by listing outcomes
- **Domain:** DP, Data and Probability
- **Schema:** part-whole (multiplicative)
- **Answer:** fraction
- **Draws:** `sides: one of 4, 5, 6, 8, 10, 12`; `k: 3 to sides`
- **Kept only when:** `k - 1 < sides`
- **Formats:** `spinner`
- **Named mistakes:** `counted-the-number-itself`, `compared-with-the-rest`
- **Example:** A spinner has 8 equal parts numbered 1 to 8. What is the probability that it lands on a number less than 3? **Answer: 1/4**

#### `probability.cards`

Find the probability of picking a multiple from numbered cards.

- **Competency:** G5.Q3.8, theoretical probability of a simple event by listing outcomes
- **Domain:** DP, Data and Probability
- **Schema:** part-whole (multiplicative)
- **Answer:** fraction
- **Draws:** `cn: one of 10, 12, 15, 20, 24, 30`; `m: one of 2, 3, 4, 5`
- **Formats:** `cards`
- **Named mistakes:** `used-one-in-m`, `counted-one-too-many`
- **Example:** Cards numbered 1 to 20 are shuffled. You pick one. What is the probability that it is a multiple of 2? **Answer: 1/2**

#### `probability.better-bag`

Compare the chance of red in two bags of different sizes.

- **Competency:** G5.Q3.8, theoretical probability of a simple event by listing outcomes
- **Domain:** DP, Data and Probability
- **Schema:** compare (additive)
- **Answer:** multiple choice
- **Draws:** `r2: 1 to 4`; `n2: r2 + 1 to r2 + 4`; `r1: r2 + 1 to r2 + 6`; `n1: r1 + 2 to 20`; `s: 0 to 1`
- **Kept only when:** `r1 * n2 < r2 * n1`
- **Formats:** `bags`
- **Named mistakes:** `picked-the-bag-with-more-red`, `said-both-the-same`, `said-you-cannot-tell`
- **Example:** Bag A has 3 red marbles out of 4. Bag B has 7 red marbles out of 20. You pick one marble from one bag without looking. Which bag gives a better chance of red? Choices: Bag A; Bag B; Both the same; You cannot tell. **Answer: Bag A**

#### `probability.how-many-in-bag`

Work back from a probability and a count to the number of outcomes.

- **Competency:** G5.Q3.8, theoretical probability of a simple event by listing outcomes
- **Domain:** DP, Data and Probability
- **Schema:** work-backwards (non-routine)
- **Answer:** whole number
- **Draws:** `num: one of 1, 2, 3`; `den: one of 3, 4, 5, 6`; `k: 2 to 8`
- **Kept only when:** `gcd(num, den) == 1`; `num < den`
- **Formats:** `marbles`
- **Named mistakes:** `gave-the-blue`, `multiplied-by-the-bottom`
- **Example:** A bag holds red and blue marbles. The probability of picking red is 2/3. There are 10 red marbles. How many marbles are in the bag? **Answer: 15**

**Level 3: Two at once** (`two-at-once`, 3 templates)

#### `probability.coins`

Find a probability with two or three coins by listing the outcomes.

- **Competency:** G5.Q3.8, theoretical probability of a simple event by listing outcomes
- **Domain:** DP, Data and Probability
- **Schema:** part-whole (multiplicative)
- **Answer:** fraction
- **Draws:** `ev: 1 to 5`
- **Formats:** `coins`
- **Named mistakes:** `missed-outcomes`
- **Example:** Three coins are tossed. What is the probability of getting three heads? **Answer: 1/8**

#### `probability.two-dice`

Find the probability of a total with two dice.

- **Competency:** G5.Q3.8, theoretical probability of a simple event by listing outcomes
- **Domain:** DP, Data and Probability
- **Schema:** multi-step (non-routine)
- **Answer:** fraction
- **Draws:** `s: 2 to 12`
- **Formats:** `dice`
- **Named mistakes:** `treated-totals-as-equal`, `used-one-die`
- **Example:** Two fair dice are rolled and the numbers are added. What is the probability that the total is 8? **Answer: 5/36**

#### `probability.expect`

Find how many times to expect an outcome.

- **Competency:** G5.Q3.7, describe probability as the chance of an event occurring
- **Domain:** DP, Data and Probability
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `parts: one of 4, 5, 8, 10`; `red: 1 to parts - 1`; `m: 2 to 10 (tiers 1–2), 5 to 30 (tiers 3–4)`
- **Kept only when:** `2 * red != parts`
- **Formats:** `spinner`
- **Named mistakes:** `gave-the-not-red`, `did-not-divide`
- **Example:** A spinner has 8 equal parts, and 1 of them are red. It is spun 48 times. About how many times would you expect it to land on red? **Answer: 6**

### 13. Transformations (`transform`)

Blueprint weight 5%.

**Level 1: Angles at a point** (`angles-at-a-point`, 3 templates)

#### `transform.regular-angle`

Find each angle of a regular polygon.

- **Competency:** G6.Q1.1, explore whether or not a shape tessellates
- **Domain:** MG, Measurement and Geometry
- **Schema:** multi-step (non-routine)
- **Answer:** number with a unit, in °
- **Draws:** `i: 1 to 7`
- **Formats:** `angle`
- **Named mistakes:** `gave-the-angle-sum`, `gave-the-turn-at-each-corner`
- **Example:** How big is each angle of a regular nonagon? **Answer: 140°**

#### `transform.around-a-point`

Find how many copies of a regular shape meet at a point.

- **Competency:** G6.Q1.1, explore whether or not a shape tessellates
- **Domain:** MG, Measurement and Geometry
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `i: 1 to 3`
- **Formats:** `floor`, `point`
- **Named mistakes:** `gave-the-number-of-sides`, `used-a-straight-angle`
- **Example:** A floor is tiled with copies of a square, with no gaps. How many tiles meet at each corner point? **Answer: 4**

#### `transform.gap-at-a-point`

Find the gap left when a regular shape cannot fill a point.

- **Competency:** G6.Q1.1, explore whether or not a shape tessellates
- **Domain:** MG, Measurement and Geometry
- **Schema:** multi-step (non-routine)
- **Answer:** number with a unit, in °
- **Draws:** `i: 1 to 5`
- **Formats:** `gap`
- **Named mistakes:** `gave-the-angles-used`, `gave-one-angle`
- **Example:** Picture: 2 regular decagons round a point, with a gap left. As many copies of a regular decagon as will fit are placed round a point, without overlapping. How big is the gap that is left? **Answer: 72°**

**Level 2: Which shapes tile?** (`which-tile`, 3 templates)

#### `transform.tessellates`

Choose the regular shape that tessellates.

- **Competency:** G6.Q1.1, explore whether or not a shape tessellates
- **Domain:** MG, Measurement and Geometry
- **Schema:** compare (additive)
- **Answer:** multiple choice
- **Draws:** `t: one of 3, 4, 6`; `j: 1 to 5`
- **Formats:** `which`
- **Named mistakes:** `picked-a-shape-that-leaves-a-gap`, `picked-another-shape-that-leaves-a-gap`, `picked-a-third-shape-that-leaves-a-gap`
- **Example:** Which of these shapes can tile a floor on its own, with no gaps or overlaps? Choices: A square; A regular pentagon; A regular nonagon; A regular octagon. **Answer: A square**

#### `transform.does-not-tessellate`

Choose the regular shape that does not tessellate.

- **Competency:** G6.Q1.1, explore whether or not a shape tessellates
- **Domain:** MG, Measurement and Geometry
- **Schema:** compare (additive)
- **Answer:** multiple choice
- **Draws:** `j: 1 to 5`
- **Formats:** `which`
- **Named mistakes:** `picked-the-triangle`, `picked-the-square`, `picked-the-hexagon`
- **Example:** Which of these shapes can NOT tile a floor on its own? Choices: A regular decagon; A regular hexagon; A square; An equilateral triangle. **Answer: A regular decagon**

#### `transform.always-tiles`

Choose the shape whose copies always tile: any triangle or any four-sided shape.

- **Competency:** G6.Q1.1, explore whether or not a shape tessellates
- **Domain:** MG, Measurement and Geometry
- **Schema:** compare (additive)
- **Answer:** multiple choice
- **Draws:** `t: one of 1, 2`; `j: 1 to 4`
- **Formats:** `which`
- **Named mistakes:** `picked-a-shape-that-leaves-a-gap`, `picked-another-shape-that-leaves-a-gap`, `picked-a-third-shape-that-leaves-a-gap`
- **Example:** Copies of which of these will always tile a floor with no gaps or overlaps, however it is drawn? Choices: Any four-sided shape; A regular pentagon; A circle; A regular octagon. **Answer: Any four-sided shape**

**Level 3: Tiling with any shape** (`any-shape`, 3 templates)

#### `transform.triangle-tiles`

Use the angles of a triangle to see why any triangle tiles.

- **Competency:** G6.Q1.1, explore whether or not a shape tessellates
- **Domain:** MG, Measurement and Geometry
- **Schema:** missing-middle (non-routine)
- **Answer:** number with a unit, in °
- **Draws:** `a: 30 to 100 in steps of 5`; `b: 20 to 150 - a in steps of 5`
- **Kept only when:** `180 - a - b >= 20`
- **Formats:** `triangle`
- **Named mistakes:** `took-them-from-360`, `added-the-two`
- **Example:** Copies of any triangle can tile a floor: six corners meet at each point, two of each angle. A triangle has angles of 75° and 20°. What is its third angle? **Answer: 85°**

#### `transform.quadrilateral-tiles`

Use the angles of a quadrilateral to see why any quadrilateral tiles.

- **Competency:** G6.Q1.1, explore whether or not a shape tessellates
- **Domain:** MG, Measurement and Geometry
- **Schema:** missing-middle (non-routine)
- **Answer:** number with a unit, in °
- **Draws:** `a: 50 to 130 in steps of 5`; `b: 50 to 130 in steps of 5`; `c: 50 to 130 in steps of 5`
- **Kept only when:** `360 - a - b - c >= 40`; `360 - a - b - c <= 150`
- **Formats:** `quad`
- **Named mistakes:** `added-the-three`, `left-out-an-angle`
- **Example:** Copies of any four-sided shape can tile a floor: its four corners meet at each point. A four-sided tile has angles of 100°, 50° and 90°. What is its fourth angle? **Answer: 120°**

#### `transform.fill-the-gap`

Fill a point with two kinds of regular shape.

- **Competency:** G6.Q1.1, explore whether or not a shape tessellates
- **Domain:** MG, Measurement and Geometry
- **Schema:** missing-middle (non-routine)
- **Answer:** whole number
- **Draws:** `c: 1 to 6`
- **Formats:** `fill`
- **Named mistakes:** `filled-the-whole-point`, `filled-the-used-part`
- **Example:** Picture: 2 regular octagons round a point, with a gap left. 2 regular octagons meet at a point, taking up 270° of the 360°. How many squares fill the gap that is left? **Answer: 1**

**Level 4: Slides, flips and turns** (`moves`, 6 templates)

#### `transform.name-the-move`

Name a translation, reflection, rotation or tessellation.

- **Competency:** G6.Q1.3, draw images after translation, reflection, rotation
- **Domain:** MG, Measurement and Geometry
- **Schema:** compare (additive)
- **Answer:** multiple choice
- **Draws:** `s: 1 to 8`
- **Formats:** `name`
- **Named mistakes:** `picked-the-next-word`, `picked-another-word`, `picked-a-third-word`
- **Example:** What is this: the hand of a clock moves from 12 to 3? Choices: A translation; A reflection; A rotation; A tessellation. **Answer: A rotation**

#### `transform.mirror-distance`

Find how far a point and its reflection are apart.

- **Competency:** G6.Q1.3, draw images after translation, reflection, rotation
- **Domain:** MG, Measurement and Geometry
- **Schema:** multiplicative-compare (multiplicative)
- **Answer:** whole number
- **Draws:** `d: 1 to 6 (tiers 1–2), 4 to 10 (tiers 3–4)`; `side: one of left, right`
- **Formats:** `grid`
- **Named mistakes:** `gave-the-distance-to-the-line`
- **Example:** Picture: squared paper with a mirror line, and a point 4 squares to its left. On squared paper, a point is 4 squares to the left of a mirror line. It is reflected in the line. How many squares apart are the point and its image? **Answer: 8**

#### `transform.clock-turn`

Turn a clock hand about the centre.

- **Competency:** G5.Q4.12, draw the image of an object after rotation about a point
- **Domain:** MG, Measurement and Geometry
- **Schema:** change (additive)
- **Answer:** whole number
- **Draws:** `h: 1 to 12`; `q: one of 90, 180, 270, 60, 120, 150`
- **Formats:** `clock`
- **Named mistakes:** `turned-anticlockwise`, `gave-the-numbers-moved`
- **Example:** Picture: a clock face, with its hand pointing to 8. The hand of a clock points to 8. It turns 90° clockwise about the centre of the clock. Which number does it point to now? **Answer: 11**

#### `transform.pick-the-flip`

Choose the picture of a shape reflected in a mirror line.

- **Competency:** G6.Q1.3, draw images after translation, reflection, rotation
- **Domain:** MG, Measurement and Geometry
- **Schema:** compare (additive)
- **Answer:** choice of pictures
- **Draws:** `w: 2 to 4`; `t: 1 to w - 1`; `h: 2 to 4`; `d: 0 to 1`; `s: 1 to 2`
- **Formats:** `reflection`, `flip`
- **Named mistakes:** `slid-instead-of-flipped`, `turned-it-round`, `flipped-top-to-bottom`
- **Example:** Picture: squared paper 10 squares across and 6 up, with a shape whose corners are at 6 across and 1 up; 9 across and 1 up; 7 across and 4 up; 6 across and 4 up. A mirror line runs from 5 across and 0 up to 5 across and 6 up. Each square is 1 square unit. Which picture shows the reflection of the shape in the dashed mirror line? Choices: A: Picture: squared paper 10 squares across and 6 up, with a shape whose corners are at 6 across and 1 up; 9 across and 1 up; 7 across and 4 up; 6 across and 4 up. Its image after the move has corners at 1 across and 1 up; 4 across and 1 up; 2 across and 4 up; 1 across and 4 up. A mirror line runs from 5 across and 0 up to 5 across and 6 up. Each square is 1 square unit.; B: Picture: squared paper 10 squares across and 6 up, with a shape whose corners are at 6 across and 1 up; 9 across and 1 up; 7 across and 4 up; 6 across and 4 up. Its image after the move has corners at 4 across and 1 up; 1 across and 1 up; 3 across and 4 up; 4 across and 4 up. A mirror line runs from 5 across and 0 up to 5 across and 6 up. Each square is 1 square unit.; C: Picture: squared paper 10 squares across and 6 up, with a shape whose corners are at 6 across and 1 up; 9 across and 1 up; 7 across and 4 up; 6 across and 4 up. Its image after the move has corners at 1 across and 4 up; 4 across and 4 up; 2 across and 1 up; 1 across and 1 up. A mirror line runs from 5 across and 0 up to 5 across and 6 up. Each square is 1 square unit.; D: Picture: squared paper 10 squares across and 6 up, with a shape whose corners are at 6 across and 1 up; 9 across and 1 up; 7 across and 4 up; 6 across and 4 up. Its image after the move has corners at 4 across and 4 up; 1 across and 4 up; 3 across and 1 up; 4 across and 1 up. A mirror line runs from 5 across and 0 up to 5 across and 6 up. Each square is 1 square unit. **Answer: Picture B**

#### `transform.pick-the-slide`

Choose the picture of a shape after a translation.

- **Competency:** G6.Q1.3, draw images after translation, reflection, rotation
- **Domain:** MG, Measurement and Geometry
- **Schema:** compare (additive)
- **Answer:** choice of pictures
- **Draws:** `w: 2 to 4`; `t: 1 to w - 1`; `h: 2 to 3`; `a: 3 to 5`; `b: 1 to 3`
- **Kept only when:** `a != b`
- **Formats:** `translation`, `slide`
- **Named mistakes:** `swapped-the-moves`, `flipped-it-too`, `turned-it-too`
- **Example:** Picture: squared paper 10 squares across and 10 up, with a shape whose corners are at 1 across and 1 up; 4 across and 1 up; 2 across and 4 up; 1 across and 4 up. Each square is 1 square unit. Which picture shows the shape after a translation of 5 squares to the right and 3 squares up? Choices: A: Picture: squared paper 10 squares across and 10 up, with a shape whose corners are at 1 across and 1 up; 4 across and 1 up; 2 across and 4 up; 1 across and 4 up. Its image after the move has corners at 4 across and 6 up; 7 across and 6 up; 5 across and 9 up; 4 across and 9 up. Each square is 1 square unit.; B: Picture: squared paper 10 squares across and 10 up, with a shape whose corners are at 1 across and 1 up; 4 across and 1 up; 2 across and 4 up; 1 across and 4 up. Its image after the move has corners at 6 across and 4 up; 9 across and 4 up; 7 across and 7 up; 6 across and 7 up. Each square is 1 square unit.; C: Picture: squared paper 10 squares across and 10 up, with a shape whose corners are at 1 across and 1 up; 4 across and 1 up; 2 across and 4 up; 1 across and 4 up. Its image after the move has corners at 9 across and 7 up; 6 across and 7 up; 8 across and 4 up; 9 across and 4 up. Each square is 1 square unit.; D: Picture: squared paper 10 squares across and 10 up, with a shape whose corners are at 1 across and 1 up; 4 across and 1 up; 2 across and 4 up; 1 across and 4 up. Its image after the move has corners at 9 across and 4 up; 6 across and 4 up; 8 across and 7 up; 9 across and 7 up. Each square is 1 square unit. **Answer: Picture B**

#### `transform.pick-the-turn`

Choose the picture of a shape after a quarter turn about a point.

- **Competency:** G5.Q4.12, draw the image of an object after rotation about a point
- **Domain:** MG, Measurement and Geometry
- **Schema:** compare (additive)
- **Answer:** choice of pictures
- **Draws:** `w: 2 to 4`; `t: 1 to w - 1`; `h: 2 to 3`; `dir: 1 to 2`
- **Formats:** `rotation`, `turn`
- **Named mistakes:** `turned-the-other-way`, `turned-half-way`, `flipped-instead-of-turned`
- **Example:** Picture: squared paper 10 squares across and 8 up, with a shape whose corners are at 5 across and 4 up; 8 across and 4 up; 6 across and 7 up; 5 across and 7 up. A dot marks the point 5 across and 4 up. Each square is 1 square unit. The shape turns a quarter of the way round anticlockwise, about the dot. Which picture shows where it lands? Choices: A: Picture: squared paper 10 squares across and 8 up, with a shape whose corners are at 5 across and 4 up; 8 across and 4 up; 6 across and 7 up; 5 across and 7 up. Its image after the move has corners at 5 across and 4 up; 5 across and 7 up; 2 across and 5 up; 2 across and 4 up. A dot marks the point 5 across and 4 up. Each square is 1 square unit.; B: Picture: squared paper 10 squares across and 8 up, with a shape whose corners are at 5 across and 4 up; 8 across and 4 up; 6 across and 7 up; 5 across and 7 up. Its image after the move has corners at 5 across and 4 up; 2 across and 4 up; 4 across and 1 up; 5 across and 1 up. A dot marks the point 5 across and 4 up. Each square is 1 square unit.; C: Picture: squared paper 10 squares across and 8 up, with a shape whose corners are at 5 across and 4 up; 8 across and 4 up; 6 across and 7 up; 5 across and 7 up. Its image after the move has corners at 5 across and 4 up; 2 across and 4 up; 4 across and 7 up; 5 across and 7 up. A dot marks the point 5 across and 4 up. Each square is 1 square unit.; D: Picture: squared paper 10 squares across and 8 up, with a shape whose corners are at 5 across and 4 up; 8 across and 4 up; 6 across and 7 up; 5 across and 7 up. Its image after the move has corners at 5 across and 4 up; 5 across and 1 up; 8 across and 3 up; 8 across and 4 up. A dot marks the point 5 across and 4 up. Each square is 1 square unit. **Answer: Picture A**

## Basics

The facts and methods under the path's topics. They serve no blueprint competency of their own.

### 1. Add and subtract (`add-subtract`)

**Level 1: Small sums** (`small-sums`, 2 templates, 36 facts practised one by one)

#### `add-subtract.small`

Add two numbers whose sum is less than 10, counting on from the bigger.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** combine (additive)
- **Answer:** whole number
- **Draws:** `x: 1 to 4`; `y: x + 2 to 9 - x`
- **Formats:** `xy`, `yx`
- **Named mistakes:** `one-short`, `one-too-many`, `took-away-instead`
- **Example:** 5 + 3 = ? **Answer: 8**

#### `add-subtract.take-small`

Take away within 10 by thinking of the adding fact.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** change (additive)
- **Answer:** whole number
- **Draws:** `x: 1 to 4`; `y: x + 2 to 9 - x`; `s: one of 0, 1`
- **Formats:** `take`
- **Named mistakes:** `added-instead`, `one-too-many`, `one-short`
- **Example:** 8 − 5 = ? **Answer: 3**

**Level 2: Make 10** (`make-10`, 3 templates, 22 facts practised one by one)

#### `add-subtract.make-10`

Recall a pair that makes 10.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** combine (additive)
- **Answer:** whole number
- **Draws:** `x: 1 to 4`; `y: 10 - x to 10 - x`
- **Formats:** `xy`, `yx`
- **Named mistakes:** `one-short`, `one-too-many`, `took-away-instead`
- **Example:** 7 + 3 = ? **Answer: 10**

#### `add-subtract.to-10`

Find the number that makes 10 with another.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** missing-middle (non-routine)
- **Answer:** whole number
- **Draws:** `x: 1 to 9`
- **Formats:** `missing`, `pair`
- **Named mistakes:** `added-instead`, `one-too-many`, `one-short`
- **Example:** 6 + ? = 10 **Answer: 4**

#### `add-subtract.from-10`

Take a number away from 10, using the pairs that make 10.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** change (additive)
- **Answer:** whole number
- **Draws:** `taken: 1 to 9`
- **Formats:** `take`
- **Named mistakes:** `added-instead`, `one-too-many`, `one-short`
- **Example:** 10 − 6 = ? **Answer: 4**

**Level 3: Doubles and near doubles** (`doubles`, 4 templates, 47 facts practised one by one)

#### `add-subtract.doubles`

Recall a double.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** combine (additive)
- **Answer:** whole number
- **Draws:** `x: 1 to 10`; `y: x to x`
- **Formats:** `xy`, `yx`
- **Named mistakes:** `one-short`, `one-too-many`
- **Example:** 7 + 7 = ? **Answer: 14**

#### `add-subtract.near-doubles`

Add two numbers next to each other, from the double.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** combine (additive)
- **Answer:** whole number
- **Draws:** `x: 1 to 9`; `y: x + 1 to x + 1`
- **Formats:** `xy`, `yx`
- **Named mistakes:** `one-short`, `one-too-many`, `took-away-instead`
- **Example:** 7 + 6 = ? **Answer: 13**

#### `add-subtract.halves`

Take half of a double away.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** change (additive)
- **Answer:** whole number
- **Draws:** `x: 1 to 10`
- **Formats:** `take`, `half`
- **Named mistakes:** `added-instead`, `one-too-many`, `one-short`
- **Example:** 14 − 7 = ? **Answer: 7**

#### `add-subtract.near-halves`

Take away from a near double.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** change (additive)
- **Answer:** whole number
- **Draws:** `x: 1 to 9`; `s: one of 0, 1`
- **Formats:** `take`
- **Named mistakes:** `added-instead`, `one-too-many`, `one-short`
- **Example:** 13 − 6 = ? **Answer: 7**

**Level 4: Adding 10** (`adding-10`, 2 templates, 17 facts practised one by one)

#### `add-subtract.ten`

Add 10 to a one-digit number.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** combine (additive)
- **Answer:** whole number
- **Draws:** `x: 1 to 8`; `y: one of 10`
- **Formats:** `xy`, `yx`
- **Named mistakes:** `one-short`, `one-too-many`, `took-away-instead`
- **Example:** 10 + 6 = ? **Answer: 16**

#### `add-subtract.take-ten`

Take 10 away from a teen number.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** change (additive)
- **Answer:** whole number
- **Draws:** `x: 1 to 9`
- **Formats:** `take`, `words`
- **Named mistakes:** `added-instead`, `one-too-many`, `one-short`
- **Example:** 16 − 10 = ? **Answer: 6**

**Level 5: Bridge through 10** (`bridge-10`, 2 templates, 36 facts practised one by one)

#### `add-subtract.bridge`

Add across 10 by making 10 first.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** combine (additive)
- **Answer:** whole number
- **Draws:** `x: 2 to 7`; `y: max(x + 2, 11 - x) to 9`
- **Formats:** `xy`, `yx`
- **Named mistakes:** `one-short`, `one-too-many`, `took-away-instead`
- **Example:** 7 + 5 = ? **Answer: 12**

#### `add-subtract.take-bridge`

Take away across 10 by going back to 10 first.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** change (additive)
- **Answer:** whole number
- **Draws:** `x: 2 to 7`; `y: max(x + 2, 11 - x) to 9`; `s: one of 0, 1`
- **Formats:** `take`
- **Named mistakes:** `added-instead`, `one-too-many`, `one-short`
- **Example:** 12 − 7 = ? **Answer: 5**

**Level 6: All the facts** (`all`): asks every fact of the topic again, so it has no templates of its own.

**Level 7: Add two-digit numbers** (`add-two-digit`, 3 templates)

#### `add-subtract.add-tens`

Add a multiple of 10 to a two-digit number.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** combine (additive)
- **Answer:** whole number
- **Draws:** `a: 11 to 59 (tiers 1–2), 11 to 89 (tiers 3–4)`; `t: 1 to 4 (tiers 1–2), 1 to 9 (tiers 3–4)`
- **Kept only when:** `a % 10 != 0`
- **Formats:** `sum`, `add`
- **Named mistakes:** `added-ones-not-tens`, `one-ten-short`
- **Example:** Add 10 to 41. **Answer: 51**

#### `add-subtract.add-two-digit`

Add two two-digit numbers in your head: tens, then ones.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** combine (additive)
- **Answer:** whole number
- **Draws:** `a: 11 to 59 (tiers 1–2), 15 to 89 (tiers 3–4)`; `b: 11 to 39 (tiers 1–2), 15 to 89 (tiers 3–4)`
- **Kept only when:** `b % 10 != 0`
- **Formats:** `sum`, `total`
- **Named mistakes:** `lost-the-carried-ten`, `took-away-instead`, `forgot-the-ones`
- **Example:** Mila has 41 stickers and Ben has 11. How many do they have together? **Answer: 52**

#### `add-subtract.add-nines`

Add 9, 19, 29 and so on by adding the next ten and taking 1 back.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** combine (additive)
- **Answer:** whole number
- **Draws:** `a: 11 to 69 (tiers 1–2), 21 to 89 (tiers 3–4)`; `k: 1 to 3 (tiers 1–2), 1 to 6 (tiers 3–4)`
- **Formats:** `sum`, `money`
- **Named mistakes:** `did-not-take-1-back`, `took-1-too-many`
- **Example:** Ana has ₱47. She is given ₱9 more. How much does she have now? **Answer: 56**

**Level 8: Take away two-digit numbers** (`take-two-digit`, 4 templates)

#### `add-subtract.take-tens`

Take a multiple of 10 from a two- or three-digit number.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** change (additive)
- **Answer:** whole number
- **Draws:** `a: 41 to 99 (tiers 1–2), 110 to 199 (tiers 3–4)`; `t: 1 to 4 (tiers 1–2), 2 to 9 (tiers 3–4)`
- **Kept only when:** `a % 10 != 0`; `a - n >= 10`
- **Formats:** `difference`, `take`
- **Named mistakes:** `took-ones-not-tens`, `added-instead`
- **Example:** Take 10 away from 77. **Answer: 67**

#### `add-subtract.take-two-digit`

Take a two-digit number from another in your head: tens, then ones.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** change (additive)
- **Answer:** whole number
- **Draws:** `a: 31 to 99 (tiers 1–2), 52 to 99 (tiers 3–4)`; `b: 11 to 29 (tiers 1–2), 15 to 49 (tiers 3–4)`
- **Kept only when:** `b % 10 != 0`; `a > b`
- **Formats:** `difference`, `left`
- **Named mistakes:** `took-the-smaller-ones-digit`, `added-instead`, `forgot-the-ones`
- **Example:** A box has 74 mangoes. 11 are sold. How many are left? **Answer: 63**

#### `add-subtract.take-nines`

Take away 9, 19, 29 and so on by taking the next ten and giving 1 back.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** change (additive)
- **Answer:** whole number
- **Draws:** `a: 31 to 99 (tiers 1–2), 52 to 99 (tiers 3–4)`; `k: 1 to 3 (tiers 1–2), 1 to 5 (tiers 3–4)`
- **Kept only when:** `a > b + 1`
- **Formats:** `difference`, `money`
- **Named mistakes:** `did-not-give-1-back`, `gave-back-too-much`
- **Example:** Lito has ₱74. He spends ₱9. How much is left? **Answer: 65**

#### `add-subtract.count-up`

Find the difference between close numbers by counting up through the next ten.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** compare (additive)
- **Answer:** whole number
- **Draws:** `b: 21 to 88 (tiers 1–2), 21 to 185 (tiers 3–4)`; `d: 2 to 9 (tiers 1–2), 3 to 15 (tiers 3–4)`
- **Kept only when:** `b % 10 != 0`; `floor(a / 10) != floor(b / 10)`; `a != up`
- **Formats:** `difference`, `between`, `trip`
- **Named mistakes:** `counted-one-jump`, `added-instead`
- **Example:** A jeepney trip is 65 km. Mang Ben has driven 56 km. How many kilometres are left? **Answer: 9**

### 2. Times tables (`times`)

**Level 1: 2, 5 and 10** (`2-5-10`, 6 templates, 54 facts practised one by one)

#### `times.x2`

Recall a times fact with 2.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 2`; `y: one of 2, 3, 4, 5, 6, 7, 8, 9, 10`
- **Formats:** `xy`, `yx`
- **Named mistakes:** `one-group-short`, `one-group-too-many`, `added-instead`
- **Example:** 2 × 2 = ? **Answer: 4**

#### `times.x5`

Recall a times fact with 5.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 5`; `y: one of 3, 4, 5, 6, 7, 8, 9, 10`
- **Formats:** `xy`, `yx`
- **Named mistakes:** `one-group-short`, `one-group-too-many`, `added-instead`, `used-the-table-below`
- **Example:** 3 × 5 = ? **Answer: 15**

#### `times.x10`

Recall a times fact with 10.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 10`; `y: one of 3, 4, 6, 7, 8, 9, 10`
- **Formats:** `xy`, `yx`
- **Named mistakes:** `one-group-short`, `one-group-too-many`, `added-instead`, `used-the-table-below`
- **Example:** 3 × 10 = ? **Answer: 30**

#### `times.div2`

Recall a divide fact by 2, from its times fact.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 2`; `q: 1 to 10`
- **Formats:** `divide`, `missing`, `how-many`
- **Named mistakes:** `one-too-many`, `one-too-few`, `took-away-instead`
- **Example:** ? × 2 = 2 **Answer: 1**

#### `times.div5`

Recall a divide fact by 5, from its times fact.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 5`; `q: 1 to 10`
- **Formats:** `divide`, `missing`, `how-many`
- **Named mistakes:** `one-too-many`, `one-too-few`, `took-away-instead`
- **Example:** ? × 5 = 5 **Answer: 1**

#### `times.div10`

Recall a divide fact by 10, from its times fact.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 10`; `q: 1 to 10`
- **Formats:** `divide`, `missing`, `how-many`
- **Named mistakes:** `one-too-many`, `one-too-few`, `took-away-instead`
- **Example:** ? × 10 = 10 **Answer: 1**

**Level 2: 3 and 4** (`3-and-4`, 4 templates, 31 facts practised one by one)

#### `times.x3`

Recall a times fact with 3.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 3`; `y: one of 3, 4, 6, 7, 8, 9`
- **Formats:** `xy`, `yx`
- **Named mistakes:** `one-group-short`, `one-group-too-many`, `added-instead`, `used-the-table-below`
- **Example:** 3 × 3 = ? **Answer: 9**

#### `times.x4`

Recall a times fact with 4.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 4`; `y: one of 4, 6, 7, 8, 9`
- **Formats:** `xy`, `yx`
- **Named mistakes:** `one-group-short`, `one-group-too-many`, `added-instead`, `used-the-table-below`
- **Example:** 4 × 4 = ? **Answer: 16**

#### `times.div3`

Recall a divide fact by 3, from its times fact.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 3`; `q: 1 to 10`
- **Formats:** `divide`, `missing`, `how-many`
- **Named mistakes:** `one-too-many`, `one-too-few`, `took-away-instead`
- **Example:** ? × 3 = 3 **Answer: 1**

#### `times.div4`

Recall a divide fact by 4, from its times fact.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 4`; `q: 1 to 10`
- **Formats:** `divide`, `missing`, `how-many`
- **Named mistakes:** `one-too-many`, `one-too-few`, `took-away-instead`
- **Example:** ? × 4 = 4 **Answer: 1**

**Level 3: 6 and 9** (`6-and-9`, 4 templates, 27 facts practised one by one)

#### `times.x6`

Recall a times fact with 6.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 6`; `y: one of 6, 7, 8, 9`
- **Formats:** `xy`, `yx`
- **Named mistakes:** `one-group-short`, `one-group-too-many`, `added-instead`, `used-the-table-below`
- **Example:** 6 × 6 = ? **Answer: 36**

#### `times.x9`

Recall a times fact with 9.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 9`; `y: one of 7, 8, 9`
- **Formats:** `xy`, `yx`
- **Named mistakes:** `one-group-short`, `one-group-too-many`, `added-instead`, `used-the-table-below`
- **Example:** 7 × 9 = ? **Answer: 63**

#### `times.div6`

Recall a divide fact by 6, from its times fact.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 6`; `q: 1 to 10`
- **Formats:** `divide`, `missing`, `how-many`
- **Named mistakes:** `one-too-many`, `one-too-few`, `took-away-instead`
- **Example:** ? × 6 = 6 **Answer: 1**

#### `times.div9`

Recall a divide fact by 9, from its times fact.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 9`; `q: 1 to 10`
- **Formats:** `divide`, `missing`, `how-many`
- **Named mistakes:** `one-too-many`, `one-too-few`, `took-away-instead`
- **Example:** ? × 9 = 9 **Answer: 1**

**Level 4: 7 and 8** (`7-and-8`, 4 templates, 23 facts practised one by one)

#### `times.x7`

Recall a times fact with 7.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 7`; `y: one of 7, 8`
- **Formats:** `xy`, `yx`
- **Named mistakes:** `one-group-short`, `one-group-too-many`, `added-instead`, `used-the-table-below`
- **Example:** 7 × 7 = ? **Answer: 49**

#### `times.x8`

Recall a times fact with 8.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 8`; `y: one of 8`
- **Formats:** `xy`, `yx`
- **Named mistakes:** `one-group-short`, `one-group-too-many`, `added-instead`
- **Example:** 8 × 8 = ? **Answer: 64**

#### `times.div7`

Recall a divide fact by 7, from its times fact.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 7`; `q: 1 to 10`
- **Formats:** `divide`, `missing`, `how-many`
- **Named mistakes:** `one-too-many`, `one-too-few`, `took-away-instead`
- **Example:** ? × 7 = 7 **Answer: 1**

#### `times.div8`

Recall a divide fact by 8, from its times fact.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 8`; `q: 1 to 10`
- **Formats:** `divide`, `missing`, `how-many`
- **Named mistakes:** `one-too-many`, `one-too-few`, `took-away-instead`
- **Example:** ? × 8 = 8 **Answer: 1**

**Level 5: 11 and 12** (`11-and-12`, 4 templates, 45 facts practised one by one)

#### `times.x11`

Recall a times fact with 11.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 11`; `y: one of 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12`
- **Formats:** `xy`, `yx`
- **Named mistakes:** `one-group-short`, `one-group-too-many`, `added-instead`, `used-the-table-below`
- **Example:** 2 × 11 = ? **Answer: 22**

#### `times.x12`

Recall a times fact with 12.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 12`; `y: one of 2, 3, 4, 5, 6, 7, 8, 9, 10, 12`
- **Formats:** `xy`, `yx`
- **Named mistakes:** `one-group-short`, `one-group-too-many`, `added-instead`, `used-the-table-below`
- **Example:** 2 × 12 = ? **Answer: 24**

#### `times.div11`

Recall a divide fact by 11, from its times fact.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 11`; `q: 1 to 12`
- **Formats:** `divide`, `missing`, `how-many`
- **Named mistakes:** `one-too-many`, `one-too-few`, `took-away-instead`
- **Example:** ? × 11 = 11 **Answer: 1**

#### `times.div12`

Recall a divide fact by 12, from its times fact.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 12`; `q: 1 to 12`
- **Formats:** `divide`, `missing`, `how-many`
- **Named mistakes:** `one-too-many`, `one-too-few`, `took-away-instead`
- **Example:** ? × 12 = 12 **Answer: 1**

**Level 6: All the tables** (`all`): asks every fact of the topic again, so it has no templates of its own.

### 3. Mental math (`mental`)

**Level 1: Times and divide by 10, 100, 1000** (`tens`, 3 templates)

#### `mental.times-tens`

Multiply a whole number by 10, 100 or 1000.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `a: 2 to 99 (tiers 1–2), 11 to 999 (tiers 3–4)`; `k: 1 to 2 (tiers 1–2), 1 to 3 (tiers 3–4)`
- **Kept only when:** `a % 10 != 0`
- **Formats:** `product`, `turned`
- **Named mistakes:** `one-zero-short`, `one-zero-too-many`, `added-instead`
- **Example:** 10 × 63 = ? **Answer: 630**

#### `mental.divide-tens`

Divide a whole number by 10, 100 or 1000 when the answer is whole.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `a: 2 to 99 (tiers 1–2), 11 to 999 (tiers 3–4)`; `k: 1 to 2 (tiers 1–2), 1 to 3 (tiers 3–4)`
- **Kept only when:** `a % 10 != 0`
- **Formats:** `quotient`, `groups`
- **Named mistakes:** `one-zero-too-many`, `one-zero-too-few`, `took-away-instead`
- **Example:** How many groups of 10 make 630? **Answer: 63**

#### `mental.tens-times`

Multiply multiples of 10 and 100: the digits, then the zeros.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: 2 to 9`; `y: 2 to 9`; `i: 1 to 1 (tiers 1–2), 1 to 2 (tiers 3–4)`; `j: 0 to 1 (tiers 1–2), 1 to 2 (tiers 3–4)`
- **Formats:** `product`, `boxes`
- **Named mistakes:** `a-zero-short`, `a-zero-too-many`, `added-instead`
- **Example:** A shop packs 20 boxes with 70 pencils each. How many pencils is that? **Answer: 1400**

**Level 2: Double and halve** (`double-halve`, 3 templates)

#### `mental.double`

Double a two- or three-digit number in parts.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `a: 11 to 49 (tiers 1–2), 51 to 499 (tiers 3–4)`
- **Kept only when:** `a % 10 != 0`
- **Formats:** `double`, `times-2`, `twice`
- **Named mistakes:** `doubled-only-the-tens`, `added-2`
- **Example:** Double 35 = ? **Answer: 70**

#### `mental.halve`

Halve an even number in parts that are easy to halve.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `a: 11 to 49 (tiers 1–2), 26 to 499 (tiers 3–4)`
- **Kept only when:** `r != 0`
- **Formats:** `half`, `divide`, `share`
- **Named mistakes:** `dropped-the-odd-ten`, `doubled-instead`
- **Example:** Half of 70 = ? **Answer: 35**

#### `mental.halve-double`

Multiply by halving one number and doubling the other.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `b: one of 5, 15, 25, 35, 45, 50`; `h: 2 to 9 (tiers 1–2), 2 to 24 (tiers 3–4)`
- **Formats:** `product`, `turned`
- **Named mistakes:** `halved-without-doubling`, `doubled-both`
- **Example:** 35 × 4 = ? **Answer: 140**

**Level 3: Times 5, 9 and 11** (`five-nine-eleven`, 3 templates)

#### `mental.times-5`

Multiply by 5 as times 10, then halve.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `a: 12 to 48 (tiers 1–2), 52 to 198 (tiers 3–4)`
- **Kept only when:** `a % 10 != 0`
- **Formats:** `product`, `coins`
- **Named mistakes:** `did-not-halve`, `halved-instead`
- **Example:** 35 × 5 = ? **Answer: 175**

#### `mental.times-9`

Multiply by 9 as times 10, minus one group.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `a: 12 to 49 (tiers 1–2), 51 to 199 (tiers 3–4)`
- **Kept only when:** `a % 10 != 0`
- **Formats:** `product`, `turned`
- **Named mistakes:** `did-not-take-one-away`, `took-away-9`
- **Example:** 35 × 9 = ? **Answer: 315**

#### `mental.times-11`

Multiply by 11 as times 10, plus one group.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `a: 12 to 49 (tiers 1–2), 51 to 199 (tiers 3–4)`
- **Kept only when:** `a % 10 != 0`
- **Formats:** `product`, `turned`
- **Named mistakes:** `did-not-add-one-more`, `added-instead`
- **Example:** 35 × 11 = ? **Answer: 385**

**Level 4: Split and multiply** (`split`, 2 templates)

#### `mental.split-times`

Multiply by a one-digit number by splitting into tens and ones.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `a: 12 to 49 (tiers 1–2), 52 to 249 (tiers 3–4)`; `m: 3 to 6 (tiers 1–2), 3 to 9 (tiers 3–4)`
- **Kept only when:** `a % 10 != 0`
- **Formats:** `product`, `price`
- **Named mistakes:** `forgot-the-ones`, `multiplied-only-the-ones`
- **Example:** One notebook costs ₱35. How much do 3 notebooks cost? **Answer: 105**

#### `mental.split-two-digit`

Multiply two two-digit numbers by splitting one into tens and ones.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `a: 12 to 29 (tiers 1–2), 12 to 49 (tiers 3–4)`; `b: 11 to 19 (tiers 1–2), 11 to 29 (tiers 3–4)`
- **Kept only when:** `b % 10 != 0`
- **Formats:** `product`, `rows`
- **Named mistakes:** `forgot-the-ones`, `forgot-the-tens`
- **Example:** A hall has 11 rows of 23 chairs. How many chairs is that? **Answer: 253**

**Level 5: Divide in your head** (`divide`, 2 templates)

#### `mental.split-divide`

Divide in your head by splitting into easy parts.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `d: 2 to 5 (tiers 1–2), 3 to 9 (tiers 3–4)`; `q: 11 to 29 (tiers 1–2), 12 to 99 (tiers 3–4)`
- **Kept only when:** `q % 10 != 0`
- **Formats:** `quotient`, `share`
- **Named mistakes:** `divided-only-one-part`, `took-away-instead`
- **Example:** ₱44 is shared equally among 4 friends. How much does each get? **Answer: 11**

#### `mental.divide-by-5`

Divide by 5 by doubling, then dividing by 10.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `q: 11 to 39 (tiers 1–2), 21 to 199 (tiers 3–4)`
- **Kept only when:** `q % 10 != 0`
- **Formats:** `quotient`, `coins`
- **Named mistakes:** `did-not-divide-by-10`, `halved-instead`
- **Example:** 145 ÷ 5 = ? **Answer: 29**

**Level 6: Estimate** (`estimate`, 2 templates)

#### `mental.estimate-product`

Estimate a product by rounding each number to the nearest ten.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `a: 11 to 98 (tiers 1–2), 21 to 98 (tiers 3–4)`; `b: 11 to 98 (tiers 1–2), 21 to 98 (tiers 3–4)`
- **Kept only when:** `a % 10 != 0`; `b % 10 != 0`; `a % 10 != 5`; `b % 10 != 5`
- **Formats:** `about`
- **Named mistakes:** `worked-it-out-exactly`, `rounded-both-down`
- **Example:** Round each number to the nearest ten. About how much is 66 × 11? **Answer: 700**

#### `mental.estimate-sum`

Estimate a sum by rounding each number to the nearest hundred.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** combine (additive)
- **Answer:** whole number
- **Draws:** `a: 110 to 890 (tiers 1–4)`; `b: 110 to 890 (tiers 1–4)`
- **Kept only when:** `a % 100 != 50`; `b % 100 != 50`; `a % 100 != 0`; `b % 100 != 0`
- **Formats:** `about`, `money`
- **Named mistakes:** `worked-it-out-exactly`, `rounded-both-down`
- **Example:** Lito buys a bag for ₱599 and shoes for ₱112. Rounding each to the nearest hundred, about how much does he spend? **Answer: 700**

### 4. Pen and paper (`written`)

**Level 1: Column adding** (`column-add`, 2 templates)

#### `written.column-add`

Add two three-digit numbers in columns, carrying.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** combine (additive)
- **Answer:** whole number
- **Draws:** `a: 100 to 499 (tiers 1–2), 100 to 999 (tiers 3–4)`; `b: 100 to 499 (tiers 1–2), 100 to 999 (tiers 3–4)`
- **Kept only when:** `a % 10 + b % 10 >= 10 || floor(a / 10) % 10 + floor(b / 10) % 10 >= 10`
- **Formats:** `sum`, `votes`
- **Named mistakes:** `forgot-to-carry`, `took-away-instead`
- **Example:** In a school vote, 310 pupils chose Ana and 492 chose Ben. How many voted? **Answer: 802**

#### `written.add-three`

Add three three-digit numbers in columns, carrying 1 or 2.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** combine (additive)
- **Answer:** whole number
- **Draws:** `a: 100 to 299 (tiers 1–2), 100 to 599 (tiers 3–4)`; `b: 100 to 299 (tiers 1–2), 100 to 599 (tiers 3–4)`; `e: 100 to 299 (tiers 1–2), 100 to 599 (tiers 3–4)`
- **Kept only when:** `c1 > 0`
- **Formats:** `sum`, `harvest`
- **Named mistakes:** `forgot-to-carry`, `left-one-out`
- **Example:** A farm picks 225 mangoes on Monday, 100 on Tuesday and 205 on Wednesday. How many mangoes is that? **Answer: 530**

**Level 2: Column taking away** (`column-take`, 2 templates)

#### `written.column-take`

Take away three-digit numbers in columns, borrowing.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** change (additive)
- **Answer:** whole number
- **Draws:** `a: 300 to 999 (tiers 1–2), 300 to 999 (tiers 3–4)`; `b: 100 to 299 (tiers 1–2), 100 to a - 1 (tiers 3–4)`
- **Kept only when:** `a > b`; `a % 10 < b % 10 || floor(a / 10) % 10 < floor(b / 10) % 10`; `floor(a / 10) % 10 != 0`
- **Formats:** `difference`, `left`
- **Named mistakes:** `took-smaller-from-bigger`, `did-not-pay-back`, `added-instead`
- **Example:** A library has 669 books. 296 are borrowed. How many are left on the shelves? **Answer: 373**

#### `written.take-across-zero`

Take away from a number with a zero in the tens, borrowing across it.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** change (additive)
- **Answer:** whole number
- **Draws:** `hund: 3 to 9 (tiers 1–4)`; `o: 0 to 8`; `b: 101 to a - 1`
- **Kept only when:** `b % 10 > o`; `floor(b / 10) % 10 != 0`
- **Formats:** `difference`, `change`
- **Named mistakes:** `took-smaller-from-bigger`, `did-not-pay-back`, `added-instead`
- **Example:** Mila has ₱700. She spends ₱416. How much is left? **Answer: 284**

**Level 3: Long multiplication** (`long-times`, 2 templates)

#### `written.times-one-digit`

Multiply a three-digit number by a one-digit number in columns, carrying.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `a: 102 to 399 (tiers 1–2), 102 to 999 (tiers 3–4)`; `m: 3 to 6 (tiers 1–2), 3 to 9 (tiers 3–4)`
- **Kept only when:** `a % 10 != 0`; `c1 + c2 > 0`
- **Formats:** `product`, `boxes`
- **Named mistakes:** `forgot-the-carries`, `added-instead`
- **Example:** A box holds 288 pencils. How many pencils are in 3 boxes? **Answer: 864**

#### `written.times-two-digit`

Long multiplication: a number times a two-digit number, the ones row then the tens row.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `a: 12 to 49 (tiers 1–2), 102 to 499 (tiers 3–4)`; `b: 11 to 29 (tiers 1–2), 12 to 59 (tiers 3–4)`
- **Kept only when:** `b % 10 != 0`
- **Formats:** `product`, `rows`
- **Named mistakes:** `forgot-the-zero`, `forgot-the-tens-row`
- **Example:** A field has 11 rows of 35 corn plants. How many plants is that? **Answer: 385**

**Level 4: Long division** (`long-divide`, 3 templates)

#### `written.divide-one-digit`

Divide by a one-digit number by taking away chunks.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `d: 2 to 5 (tiers 1–2), 3 to 9 (tiers 3–4)`; `q: 21 to 199 (tiers 1–2), 101 to 999 (tiers 3–4)`
- **Kept only when:** `q % 10 != 0`
- **Formats:** `quotient`, `share`
- **Named mistakes:** `left-out-a-zero`, `took-away-instead`, `stopped-early`
- **Example:** 84 kg of rice is packed equally into 4 sacks. How many kilograms go in each sack? **Answer: 21**

#### `written.remainder`

Find the remainder of a division.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `d: 3 to 6 (tiers 1–2), 3 to 9 (tiers 3–4)`; `q: 11 to 49 (tiers 1–2), 21 to 199 (tiers 3–4)`; `r: 1 to d - 1`
- **Formats:** `remainder`, `eggs`
- **Named mistakes:** `gave-the-quotient`, `remainder-too-big`
- **Example:** 58 eggs are packed in trays of 5. How many eggs are left over? **Answer: 3**

#### `written.divide-two-digit`

Divide by a two-digit number by taking away chunks.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `d: 11 to 25 (tiers 1–2), 12 to 49 (tiers 3–4)`; `q: 11 to 39 (tiers 1–2), 21 to 99 (tiers 3–4)`
- **Kept only when:** `q % 10 != 0`
- **Formats:** `quotient`, `teams`
- **Named mistakes:** `one-too-few`, `one-too-many`, `stopped-early`
- **Example:** 220 pupils make teams of 20. How many teams are there? **Answer: 11**

### 5. Missing numbers (`missing`)

**Level 1: Missing in adding and taking away** (`add-take`, 3 templates)

#### `missing.add-missing`

Find a missing number in an addition by taking away.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** change (additive)
- **Answer:** whole number
- **Draws:** `a: 3 to 40 (tiers 1–2), 25 to 400 (tiers 3–4)`; `b: 3 to 40 (tiers 1–2), 25 to 400 (tiers 3–4)`
- **Formats:** `first`, `second`, `marbles`
- **Named mistakes:** `added-instead`, `gave-the-total`
- **Example:** 3 + ? = 29 **Answer: 26**

#### `missing.take-what`

Find how much was taken away.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** change (additive)
- **Answer:** whole number
- **Draws:** `a: 3 to 40 (tiers 1–2), 25 to 400 (tiers 3–4)`; `b: 3 to 40 (tiers 1–2), 25 to 400 (tiers 3–4)`
- **Formats:** `symbols`, `eggs`
- **Named mistakes:** `added-instead`, `gave-what-is-left`
- **Example:** There were 29 eggs. Some were used and 3 are left. How many were used? **Answer: 26**

#### `missing.take-from`

Find the starting number of a taking away by adding back.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** change (additive)
- **Answer:** whole number
- **Draws:** `a: 3 to 40 (tiers 1–2), 25 to 400 (tiers 3–4)`; `b: 3 to 40 (tiers 1–2), 25 to 400 (tiers 3–4)`
- **Formats:** `symbols`, `money`
- **Named mistakes:** `took-away-instead`, `gave-what-is-left`
- **Example:** Lito spent ₱26 and has ₱3 left. How much did he have at first? **Answer: 29**

**Level 2: Missing in times and divide** (`times-divide`, 3 templates)

#### `missing.times-missing`

Find a missing factor by dividing.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `a: 2 to 10 (tiers 1–2), 2 to 25 (tiers 3–4)`; `b: 2 to 10 (tiers 1–2), 2 to 12 (tiers 3–4)`
- **Formats:** `first`, `second`, `bags`
- **Named mistakes:** `multiplied-instead`, `took-away-instead`
- **Example:** 2 × ? = 14 **Answer: 7**

#### `missing.divide-by-what`

Find the number something was divided by.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `a: 2 to 10 (tiers 1–2), 2 to 25 (tiers 3–4)`; `b: 2 to 10 (tiers 1–2), 2 to 12 (tiers 3–4)`
- **Formats:** `symbols`, `teams`
- **Named mistakes:** `multiplied-instead`, `gave-the-answer-shown`
- **Example:** 14 pupils make 7 teams of the same size. How many pupils are in each team? **Answer: 2**

#### `missing.divide-what`

Find the number that was divided, by multiplying.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `a: 2 to 10 (tiers 1–2), 2 to 25 (tiers 3–4)`; `b: 2 to 10 (tiers 1–2), 2 to 12 (tiers 3–4)`
- **Formats:** `symbols`, `share`
- **Named mistakes:** `divided-instead`, `added-instead`
- **Example:** Some mangoes were shared equally among 2 families. Each family got 7. How many mangoes were there? **Answer: 14**

**Level 3: Letters for numbers** (`letters`, 3 templates)

#### `missing.letter-add`

Solve a one-step equation with a letter: adding.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** change (additive)
- **Answer:** whole number
- **Draws:** `L: one of n, x, y, m`; `a: 3 to 40 (tiers 1–2), 25 to 400 (tiers 3–4)`; `b: 3 to 40 (tiers 1–2), 25 to 400 (tiers 3–4)`
- **Formats:** `first`, `second`
- **Named mistakes:** `added-instead`, `gave-the-total`
- **Example:** 23 + y = 26. What is y? **Answer: 3**

#### `missing.letter-times`

Solve a one-step equation with a letter: multiplying, written 4n.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `L: one of n, x, y, m`; `a: 2 to 10 (tiers 1–2), 2 to 25 (tiers 3–4)`; `b: 2 to 10 (tiers 1–2), 2 to 12 (tiers 3–4)`
- **Formats:** `times`, `short`
- **Named mistakes:** `multiplied-instead`, `took-away-instead`
- **Example:** 6y = 12. What is y? **Answer: 2**

#### `missing.letter-divide`

Solve a one-step equation with a letter: dividing.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `L: one of n, x, y, m`; `a: 2 to 10 (tiers 1–2), 2 to 25 (tiers 3–4)`; `b: 2 to 10 (tiers 1–2), 2 to 12 (tiers 3–4)`
- **Formats:** `symbols`
- **Named mistakes:** `divided-instead`, `added-instead`
- **Example:** y ÷ 6 = 2. What is y? **Answer: 12**

**Level 4: Two steps** (`two-steps`, 2 templates)

#### `missing.two-step`

Solve a two-step equation by undoing the steps in reverse: times, then add.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** work-backwards (non-routine)
- **Answer:** whole number
- **Draws:** `L: one of n, x, y, m`; `a: 2 to 9 (tiers 1–2), 3 to 15 (tiers 3–4)`; `m: 2 to 5 (tiers 1–2), 2 to 9 (tiers 3–4)`; `k: 1 to 9 (tiers 1–2), 2 to 20 (tiers 3–4)`
- **Formats:** `short`, `times`, `think`
- **Named mistakes:** `undid-in-the-wrong-order`, `forgot-to-divide`, `added-instead`
- **Example:** I think of a number. I multiply it by 4, then add 9. I get 17. What is my number? **Answer: 2**

#### `missing.two-step-take`

Solve a two-step equation by undoing the steps in reverse: times, then take away.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** work-backwards (non-routine)
- **Answer:** whole number
- **Draws:** `L: one of n, x, y, m`; `a: 2 to 9 (tiers 1–2), 3 to 15 (tiers 3–4)`; `m: 2 to 5 (tiers 1–2), 2 to 9 (tiers 3–4)`; `k: 1 to 9 (tiers 1–2), 2 to 20 (tiers 3–4)`
- **Kept only when:** `r > 0`
- **Formats:** `short`, `think`
- **Named mistakes:** `forgot-to-divide`, `took-away-instead`
- **Example:** 4m − 7 = 9. What is m? **Answer: 4**

**Level 5: Input and output** (`machines`, 3 templates)

#### `missing.machine`

Run a two-step number machine forwards.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** multi-step (non-routine)
- **Answer:** whole number
- **Draws:** `x: 2 to 9 (tiers 1–2), 5 to 20 (tiers 3–4)`; `m: 2 to 5 (tiers 1–2), 2 to 9 (tiers 3–4)`; `k: 1 to 9 (tiers 1–2), 2 to 20 (tiers 3–4)`
- **Formats:** `machine`
- **Named mistakes:** `added-first`, `forgot-a-step`
- **Example:** A number machine multiplies by 2, then adds 5. What comes out when 7 goes in? **Answer: 19**

#### `missing.machine-back`

Run a two-step number machine backwards.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** work-backwards (non-routine)
- **Answer:** whole number
- **Draws:** `x: 2 to 9 (tiers 1–2), 5 to 20 (tiers 3–4)`; `m: 2 to 5 (tiers 1–2), 2 to 9 (tiers 3–4)`; `k: 1 to 9 (tiers 1–2), 2 to 20 (tiers 3–4)`
- **Kept only when:** `r > 0`
- **Formats:** `machine`
- **Named mistakes:** `ran-it-forwards`, `forgot-to-divide`
- **Example:** A number machine multiplies by 2, then takes away 5. 9 comes out. What number went in? **Answer: 7**

#### `missing.table`

Find the rule of a table and use it further on.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** multi-step (non-routine)
- **Answer:** whole number
- **Draws:** `m: 2 to 5 (tiers 1–2), 2 to 9 (tiers 3–4)`; `k: 1 to 5 (tiers 1–2), 1 to 9 (tiers 3–4)`; `x: 6 to 10 (tiers 1–2), 10 to 20 (tiers 3–4)`
- **Formats:** `table`
- **Named mistakes:** `took-the-next-number`, `left-out-the-add`
- **Example:** When x is 1, 2, 3 and 4, y is 5, 9, 13 and 17. What is y when x is 8? **Answer: 33**

**Level 6: Number patterns** (`patterns`, 4 templates)

#### `missing.next`

Continue a number pattern that goes up by the same step.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** multi-step (non-routine)
- **Answer:** whole number
- **Draws:** `s: 1 to 20 (tiers 1–2), 5 to 99 (tiers 3–4)`; `d: 2 to 9 (tiers 1–2), 3 to 25 (tiers 3–4)`
- **Formats:** `next`
- **Named mistakes:** `added-1`, `skipped-one`
- **Example:** What comes next: 13, 15, 17, 19, … ? **Answer: 21**

#### `missing.gap`

Find a missing number in the middle of a pattern.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** missing-middle (non-routine)
- **Answer:** whole number
- **Draws:** `s: 1 to 20 (tiers 1–2), 5 to 99 (tiers 3–4)`; `d: 2 to 9 (tiers 1–2), 3 to 25 (tiers 3–4)`
- **Formats:** `gap`
- **Named mistakes:** `added-1`, `copied-the-next-number`
- **Example:** What is the missing number: 13, 15, ?, 19, 21? **Answer: 17**

#### `missing.nth`

Find a far-off number in a pattern by counting the steps.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** multi-step (non-routine)
- **Answer:** whole number
- **Draws:** `s: 1 to 10 (tiers 1–2), 2 to 30 (tiers 3–4)`; `d: 2 to 5 (tiers 1–2), 3 to 12 (tiers 3–4)`; `n: one of 10, 20, 25, 30, 50, 100`
- **Formats:** `nth`
- **Named mistakes:** `counted-one-step-too-many`, `forgot-the-start`
- **Example:** The pattern 7, 9, 11, 13, … goes on. What is the 30th number? **Answer: 65**

#### `missing.doubling`

Continue a doubling pattern.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** multi-step (non-routine)
- **Answer:** whole number
- **Draws:** `s: 1 to 5 (tiers 1–2), 2 to 12 (tiers 3–4)`
- **Formats:** `next`
- **Named mistakes:** `added-the-last-step-again`, `added-1`
- **Example:** What comes next: 4, 8, 16, 32, … ? **Answer: 64**

### 6. Fractions and per cents (`equivalents`)

**Level 1: Halves, quarters and tenths** (`halves-quarters-tenths`, 3 templates, 21 facts practised one by one)

#### `equivalents.halves-quarters-tenths-decimal`

Recall a fraction as a decimal.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** decimal, up to 3 decimal places
- **Draws:** `k: one of 1, 2, 3, 4, 5, 6, 7`
- **Formats:** `decimal`
- **Named mistakes:** `gave-the-per-cent`, `wrote-the-digits-with-a-point`
- **Example:** 3/10 as a decimal = ? **Answer: 0.3**

#### `equivalents.halves-quarters-tenths-percent`

Recall a fraction as a per cent.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** per cent, up to 1 decimal place
- **Draws:** `k: one of 1, 2, 3, 4, 5, 6, 7`
- **Formats:** `percent`
- **Named mistakes:** `gave-the-decimal`, `times-ten-not-a-hundred`
- **Example:** 3/10 = ?% **Answer: 30%**

#### `equivalents.halves-quarters-tenths-fraction`

Recall a per cent as a fraction in lowest terms.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** fraction
- **Draws:** `k: one of 1, 2, 3, 4, 5, 6, 7`
- **Formats:** `fraction`
- **Named mistakes:** `one-over-the-per-cent`, `turned-it-upside-down`
- **Example:** 30% as a fraction in lowest terms = ? **Answer: 3/10**

**Level 2: Fifths, twentieths and fiftieths** (`fifths`, 3 templates, 24 facts practised one by one)

#### `equivalents.fifths-decimal`

Recall a fraction as a decimal.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** decimal, up to 3 decimal places
- **Draws:** `k: one of 1, 2, 3, 4, 5, 6, 7, 8`
- **Formats:** `decimal`
- **Named mistakes:** `gave-the-per-cent`, `wrote-the-digits-with-a-point`
- **Example:** 3/20 as a decimal = ? **Answer: 0.15**

#### `equivalents.fifths-percent`

Recall a fraction as a per cent.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** per cent, up to 1 decimal place
- **Draws:** `k: one of 1, 2, 3, 4, 5, 6, 7, 8`
- **Formats:** `percent`
- **Named mistakes:** `gave-the-decimal`, `times-ten-not-a-hundred`
- **Example:** 3/20 = ?% **Answer: 15%**

#### `equivalents.fifths-fraction`

Recall a per cent as a fraction in lowest terms.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** fraction
- **Draws:** `k: one of 1, 2, 3, 4, 5, 6, 7, 8`
- **Formats:** `fraction`
- **Named mistakes:** `one-over-the-per-cent`, `turned-it-upside-down`
- **Example:** 15% as a fraction in lowest terms = ? **Answer: 3/20**

**Level 3: Eighths** (`eighths`, 3 templates, 12 facts practised one by one)

#### `equivalents.eighths-decimal`

Recall a fraction as a decimal.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** decimal, up to 3 decimal places
- **Draws:** `k: one of 1, 2, 3, 4`
- **Formats:** `decimal`
- **Named mistakes:** `gave-the-per-cent`, `wrote-the-digits-with-a-point`
- **Example:** 5/8 as a decimal = ? **Answer: 0.625**

#### `equivalents.eighths-percent`

Recall a fraction as a per cent.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** per cent, up to 1 decimal place
- **Draws:** `k: one of 1, 2, 3, 4`
- **Formats:** `percent`
- **Named mistakes:** `gave-the-decimal`, `times-ten-not-a-hundred`
- **Example:** 5/8 = ?% **Answer: 62.5%**

#### `equivalents.eighths-fraction`

Recall a per cent as a fraction in lowest terms.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** part-whole (multiplicative)
- **Answer:** fraction
- **Draws:** `k: one of 1, 2, 3, 4`
- **Formats:** `fraction`
- **Named mistakes:** `one-over-the-per-cent`, `turned-it-upside-down`
- **Example:** 62.5% as a fraction in lowest terms = ? **Answer: 5/8**

**Level 4: All of them** (`all`): asks every fact of the topic again, so it has no templates of its own.

### 7. Squares and cubes (`powers`)

**Level 1: Squares to 10 × 10** (`squares-to-10`, 2 templates, 18 facts practised one by one)

#### `powers.square-small`

Recall a square number.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 2, 3, 4, 5, 6, 7, 8, 9, 10`
- **Formats:** `power`, `times`, `words`
- **Named mistakes:** `doubled-instead`, `one-group-too-many`, `one-group-too-few`
- **Example:** 7² = ? **Answer: 49**

#### `powers.root-small`

Recall which number a square number is the square of.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** work-backwards (non-routine)
- **Answer:** whole number
- **Draws:** `x: one of 2, 3, 4, 5, 6, 7, 8, 9, 10`
- **Formats:** `times-itself`, `missing`
- **Named mistakes:** `halved-it`, `one-too-big`, `one-too-small`
- **Example:** Which number times itself makes 49? **Answer: 7**

**Level 2: Squares to 15 × 15** (`squares-to-15`, 2 templates, 10 facts practised one by one)

#### `powers.square-teens`

Recall a square number.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 11, 12, 13, 14, 15`
- **Formats:** `power`, `times`, `words`
- **Named mistakes:** `doubled-instead`, `one-group-too-many`, `one-group-too-few`
- **Example:** 14² = ? **Answer: 196**

#### `powers.root-teens`

Recall which number a square number is the square of.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** work-backwards (non-routine)
- **Answer:** whole number
- **Draws:** `x: one of 11, 12, 13, 14, 15`
- **Formats:** `times-itself`, `missing`
- **Named mistakes:** `halved-it`, `one-too-big`, `one-too-small`
- **Example:** Which number times itself makes 196? **Answer: 14**

**Level 3: Cubes** (`cubes`, 2 templates, 10 facts practised one by one)

#### `powers.cube`

Recall a cube number.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** equal-groups (multiplicative)
- **Answer:** whole number
- **Draws:** `x: one of 2, 3, 4, 5, 10`
- **Formats:** `power`, `times`, `words`
- **Named mistakes:** `times-three`, `squared-instead`
- **Example:** 5³ = ? **Answer: 125**

#### `powers.cube-root`

Recall which number a cube number is the cube of.

- **Competency:** none (Basics: a fact or method under the blueprint)
- **Domain:** NA, Number and Algebra
- **Schema:** work-backwards (non-routine)
- **Answer:** whole number
- **Draws:** `x: one of 2, 3, 4, 5, 10`
- **Formats:** `cubed`, `missing`
- **Named mistakes:** `divided-by-three`, `one-too-big`
- **Example:** Which number cubed makes 125? **Answer: 5**

**Level 4: All of them** (`all`): asks every fact of the topic again, so it has no templates of its own.
