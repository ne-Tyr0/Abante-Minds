The one pill-shaped action control: an `action-500` face, an `action-on` label in `button-label`, and an `action-700` edge that wraps the pill and extends below it as a `press-depth` shelf. Pressing it moves the pill down exactly that far and collapses the shelf, so it bottoms out against the page.

The consumer provides a `label` and an `onClick`. Three variants:

- `primary` (default) — the single "go / continue / submit" action on a screen. Never two side by side.
- `ghost` — a secondary path out (Back, Skip). Same press mechanic, quieter body: a `surface-200` face with a `line-200` edge, so it still feels pressable without competing.
- `inverse` — for saturated Reward-mode grounds only, where the amber face would disappear against `celebration-gold-500`. A `surface-200` face with an `ink-900` edge.

Do:
- Keep one `primary` per screen so "the amber pill" always means the same thing.
- Reach for `inverse` the moment a button lands on a celebration field — not a recolored `primary`.
- Let the label be a real verb in sentence case ("Keep going", "Check"), sized by `button-label`.

Don't:
- Don't recolor `primary` per screen or mood — its whole job is to be the one predictable "go" signal.
- Don't use `ghost` for anything the learner must do to proceed; it reads as optional.
- Don't strip the edge or the shelf to make it look flatter. The edge is what carries the button's boundary at the 3:1 contrast floor against a pale page, and the shelf is the entire reason a press feels like it landed.
- Don't put white text on `primary`. `action-on` is dark on purpose — these phones get used in direct sun.
