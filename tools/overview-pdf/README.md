# Overview PDF builder

Builds `Abante-Minds-overview.pdf`, the eight-page A4 overview for teachers and schools, from
real screenshots of the running app, typeset in the app's own design tokens.

> **This is the internal testing edition.** Abante Minds is still being built, so every page
> says "For internal testing only · not for outside distribution", with the date it was built.
> The numbers in the PDF (topics, weights, levels, kinds of question, named mistakes, badges,
> competencies reached, the app's size) are read from the packs and `sw.js` when it is built,
> so they stay current.

The cover and the last page carry the owner's name and email. They are kept out of this
public repository: put them in `contact.json` beside `build.py` (gitignored), as
`{"name": "...", "email": "..."}`. Without it the PDF is built with no contact lines. The QR
code on both pages opens the live app; `app-qr.svg` was made once with segno (version 3-M)
and is kept as a file, so building needs no QR library.

## Steps

```bash
python devserver.py 5176                       # from the repo root
python tools/overview-pdf/capture.py 5176      # -> tools/overview-pdf/shots/
python tools/overview-pdf/build.py             # -> tools/overview-pdf/Abante-Minds-overview.pdf
```

Needs Chrome and Pillow. Set `CHROME` if Chrome is not at the default Windows path. The
screenshots, the intermediate HTML, the PDF and `contact.json` are gitignored.

## Files

| File | What |
|---|---|
| `shots.html` | Harness: seeds a demo learner and holds the real app on one screen. Runs only on localhost |
| `capture.py` | Photographs each screen through the harness, the home screen again in dark, and cuts the close-ups |
| `build.py` | Lays out the eight pages and prints them with headless Chrome |
| `app-qr.svg` | The QR code that opens the live app |

`shots.html` is published with the rest of the repo, so it guards itself: on any host other
than localhost it does nothing. Opened on the live site it would otherwise replace a real
learner's saved progress with the demo learner. `tests/invariants.js` fails CI if that guard
goes missing.

The close-up boxes in `capture.py` and the page layout in `build.py` were tuned against the
current screens. When a screen's layout changes, check both.

The harness takes `&w=360&h=640` to render a smaller phone; it defaults to 390x844, which is
what `capture.py` uses. The practice exam draws its paper from the clock, so the harness fixes
the paper (`&seed=` picks another) and the result looks the same every time it is taken. The
level-up is shown at the end of the moment, as a tap would leave it, and the combo with its
word still up.

Chrome takes its picture when its time budget runs out, wherever a moment has got to. So the
harness covers the app, waits a moment, finishes every animation that has an end, and only
then uncovers it and titles itself `READY-<screen>`. A picture taken too early comes out
blank, and `capture.py` tries again. Dark captures pass `preferredColorScheme` to Chrome;
every other capture asks for light, so the machine's own setting never leaks in. Most of its screens are not in the PDF; they are there for reviewing
a screen by eye, such as the install offer (`home-install`, `profile-install`,
`install-steps`), each kind of answer box, and each kind of picture (`data-bar`, `area-grid`,
`solids-cubes`, `solids-pick`, `time-map`, `circles-part`, `transform-pick-flip` and more).

`capture.py` uses one fresh Chrome profile per run and loads the app twice before the first
picture. On a cold profile the app's service worker is still installing, and headless
Chrome's virtual clock does not wait for the files it fetches, so a capture could come out
with a stylesheet missing. It also tries a screen up to three times if the harness misses the
app or the picture comes out blank.
