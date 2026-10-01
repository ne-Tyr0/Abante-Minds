# Overview PDF builder

Builds `Abante-Minds-overview.pdf`, the six-page A4 overview for teachers, from real
screenshots of the running app, typeset in the app's own design tokens.

> **The page copy in `build.py` is out of date, and `build.py` refuses to run until it is
> rewritten.** It predates the Grade 6 / PSHS NCE retarget: it says Grade 9, names the wrong
> exam, promises that nothing ever leaves the phone, and describes the removed sync as a
> feature. Per `RESEARCH-PLAN.md` Phase 0 item 4, the PDF is rebuilt once Phase 2 content
> exists. Do not send the old one.

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
what `capture.py` uses. It also has three screens the PDF does not use, for reviewing the
install offer: `home-install`, `profile-install` and `install-steps`.
