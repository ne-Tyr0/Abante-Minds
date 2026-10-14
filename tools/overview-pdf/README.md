# Overview PDF builder

Builds `Abante-Minds-overview.pdf`, the six-page A4 overview for teachers, from real
screenshots of the running app, typeset in the app's own design tokens.

> **The copy is a draft, written in October 2026 for the Grade 6 / PSHS NCE app, and the
> owner has not yet read it.** Until they have, `DRAFT = True` in `build.py` marks every page
> "Draft for review: not to be sent". Set it to `False` once the copy is approved. The numbers
> in the PDF (topics, weights, levels, kinds of question, named mistakes, competencies reached,
> the app's size) are read from the packs and `sw.js` when it is built, so they stay current.

## Steps

```bash
python devserver.py 5176                       # from the repo root
python tools/overview-pdf/capture.py 5176      # -> tools/overview-pdf/shots/
python tools/overview-pdf/build.py             # -> tools/overview-pdf/Abante-Minds-overview.pdf
```

Needs Chrome and Pillow. Set `CHROME` if Chrome is not at the default Windows path. The
screenshots, the intermediate HTML and the PDF are generated, and are gitignored.

## Files

| File | What |
|---|---|
| `shots.html` | Harness: seeds a demo learner and holds the real app on one screen. Runs only on localhost |
| `capture.py` | Photographs each screen through the harness and cuts the three close-ups |
| `build.py` | Lays out the six pages and prints them with headless Chrome |

`shots.html` is published with the rest of the repo, so it guards itself: on any host other
than localhost it does nothing. Opened on the live site it would otherwise replace a real
learner's saved progress with the demo learner. `tests/invariants.js` fails CI if that guard
goes missing.

The close-up boxes in `capture.py` and the page layout in `build.py` were tuned against the
current screens. When a screen's layout changes, check both.

The harness takes `&w=360&h=640` to render a smaller phone; it defaults to 390x844, which is
what `capture.py` uses. The practice exam draws its paper from the clock, so the harness fixes
the paper (`&seed=` picks another) and the result looks the same every time it is taken. The
level-up is shown at the end of the moment, as a tap would leave it. Most of its screens are not in the PDF; they are there for reviewing
a screen by eye, such as the install offer (`home-install`, `profile-install`,
`install-steps`), each kind of answer box, and each kind of picture (`data-bar`, `area-grid`,
`solids-cubes`, `solids-pick`, `time-map`, `circles-part`, `transform-pick-flip` and more).

`capture.py` uses one fresh Chrome profile per run and loads the app twice before the first
picture. On a cold profile the app's service worker is still installing, and headless
Chrome's virtual clock does not wait for the files it fetches, so a capture could come out
with a stylesheet missing. It also tries a screen up to three times if the harness misses the
app or the picture comes out blank.
