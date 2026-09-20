The full-screen reward moment for a streak, tier level-up, or badge — its own energetic visual mode: a flat `celebration-gold-500` field, `ink-900` text in the `Celebration` display group (Baloo 2), and a `surface-200` badge disc carrying a `celebration-coral-600` glyph. Deliberately never shares a screen with Practice-mode chrome.

The field is flat rather than a gradient, and its text is dark rather than white, because white on gold reads at about 2:1 — the celebration was the least readable screen in the system before this. Dark ink on full-value gold reads at 8.9:1 and looks louder, not quieter.

The consumer provides a `headline` (the big number or word — "5!", "Tier up!"), an optional `sublabel`, an optional `icon` glyph for the badge, and an optional `actionLabel`/`onAction` — which renders an `inverse` Button inside the field, since the amber `primary` would disappear against the gold.

Do:
- Reserve this component for moments the deterministic streak/tier state machine actually triggers (N-correct promotion, badge earned) — not for routine positive feedback, which stays inside the calm answer-state colors (`success-700`/`success-100`).
- Let it take the full screen; it's a distinct mode switch, not an inline toast.

Don't:
- Don't reuse `celebration-*` tokens on Practice/question screens — the whole effect depends on this palette appearing rarely and meaning something.
- Don't put `ink-inverse` text or an `action-500` button on the gold field. Both vanish; use `ink-900` and the `inverse` Button variant.
- Don't stack more than one celebration at once; let a streak resolve before the next one fires.
