The calm-mode strip above a question: current tier, progress toward the next tier/promotion, and a plain question count. Built from `surface-100`, `brand-blue-600`, and `brand-blue-100` — the identity accent, kept quiet on purpose.

The consumer provides `tier` (a short label like "Tier 2"), `questionIndex`, and `questionTotal`; the track fills proportionally.

Do:
- Keep this header the calmest element on the practice screen — it's orientation, not a reward.
- Update it deterministically alongside the promote/demote streak logic (N correct → tier up + reset, 1 wrong → tier down + reset), so the number on screen always matches the underlying state.

Don't:
- Don't add celebration colors or motion here — a streak worth celebrating gets its own full-screen `CelebrationBanner` moment instead, not a flourish bolted onto this header.
