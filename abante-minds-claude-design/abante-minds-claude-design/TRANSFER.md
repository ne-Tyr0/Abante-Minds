# Transferring Abante Minds into Claude Design

This folder is the Abante Minds design system rebuilt in the layout claude.ai/design
expects. It is generated from the Design System artifact, which stays the source of
truth. Nothing here should be hand-edited except as a one-off experiment.

## What changed in the conversion

The artifact type and Claude Design store the same system differently, so this is a
conversion, not a copy:

- **Tokens.** The artifact type reads a structured `tokens.json`. Claude Design has no
  equivalent schema, so the tokens are compiled into `styles.css` as CSS custom
  properties plus type-style classes, and are additionally rendered as four foundation
  cards (`Colors`, `Type`, `SpacingDepth`, `Icons`) so they stay browsable rather than
  buried in a stylesheet.
- **Previews.** `preview.html` becomes `components/<Name>/index.html`, and each one is
  now a complete standalone HTML document with the styles and the bundle inlined. In the
  artifact type the preview frame preloads those; Claude Design's preload contract is not
  documented, so each card carries what it needs. If the pane does preload `styles.css`
  and `bundle.js`, the inlined copies are harmless.
- **Guidelines.** `README.md` per component becomes `usage.md`, the name the design-sync
  tree uses.
- **Assets.** `assets/Icons` and `assets/Logos` become `icons/` and `logo/`. The icon SVGs
  keep their hardcoded `ink-900` fill; the Icons card swaps it to `currentColor` for
  display, which is also what the app should do.
- **The `@dsCard` marker on line 1 of every preview is load-bearing.** It builds the card
  index and its group labels. Do not strip it.

## Two ways to load this

**With the sync skill.** Run `/design-sync` in Claude Code or Cowork, point it at this
folder, and let it create or update the project. It works one component at a time and
shows the exact file list before writing anything. Use this if you expect to re-sync as
the system changes.

**By hand.** Create a design-system project at claude.ai/design and upload the tree as it
stands. The project type is fixed at creation, so make sure it is created as a design
system and not a regular project — pushing to a regular project never converts it.

## Keeping it in sync

The Design System artifact remains the source of truth. When a token changes there, this
folder is regenerated rather than patched: every card's inlined `<style>` comes from the
same compile step, so hand-editing one card silently desynchronises it from the rest.
