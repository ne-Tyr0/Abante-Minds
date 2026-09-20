A color-coded tile in the topic/skill picker — one hue pair per skill area (`skill-N-100` face, `skill-N-600` edge, icon and progress fill), so a learner orients by color and shape before reading the label. It presses like a button, on the same mechanic at `press-depth-lg`: a bigger object earns a deeper throw.

The consumer provides a `label`, a short `icon` glyph, a `colorKey` (1–4, one per skill area, assigned consistently — Numbers & Arithmetic is always the same color, every time it appears), an `onClick`, and optionally a `progress` (0–1) fill for that skill's mastery-so-far. The progress fill eases to its new width over 400ms, so returning to the picker after a session shows the gain arriving rather than just being there.

Do:
- Assign each skill area its color once and keep it fixed everywhere that skill appears (picker, headers, badges).
- Reserve `skill-1..4` for skill/topic identity — don't borrow them for unrelated status or chrome.

Don't:
- Don't mix skill colors with `action-500`, `success-700`, or `danger-700` — those already mean something else.
- Don't swap the `skill-N-600` edge for a soft shadow to make the picker look calmer. Without that edge the pastel face sits at roughly 1.1:1 against `surface-100` and the card stops reading as a control at all.
- Don't ship more than 4 skill areas without adding new, equally distinct hue pairs first (a fifth area sharing a color with another breaks the "recognize by color" premise).
