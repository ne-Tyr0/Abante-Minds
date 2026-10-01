# Abante Minds

Offline-first NCE maths practice for Grade 9 learners in the Philippines. Vanilla JS PWA,
no build step, no backend. Implements `Abante Minds screens.dc.html`, the design spec
imported from the claude.ai design project.

## Commands

```bash
python devserver.py            # static server with no-store caching; also prints a LAN URL
node tests/fuzz.js             # 160,000 generated questions; exits 1 on any violation
node poc/progress-code.js      # proves the backup-code codec; exits 1 if a claim fails
```

Run `tests/fuzz.js` before committing any change to `app/content.js`. It has caught two
shipped bugs: a question whose answer was negative (the keypad has no minus key, so it
was unanswerable) and a hint telling learners to "break 9 into 10 and -1".

## Layout

| Path | What |
|---|---|
| `app/content.js` | Question generators: 4 topics x 5 templates. Hints and worked steps are derived from each question's own numbers |
| `app/store.js` | All learner state, in `localStorage` |
| `app/screens.js` | One builder per route |
| `app/app.js` | Shell slots, router, practice loop, keyboard |
| `app/ui.js` | Design-system components as DOM builders |
| `_ds/`, `motion/` | Vendored design system and motion layer. Do not edit; they come from the design project |
| `poc/` | Proofs for features not yet built. Not shipped, not loaded by the app |
| `abante-minds-claude-design/` | Original design kit; source of the brand mark |

## Decisions already made

Settled with the project owner. Build on them; don't reopen them.

- **A solo practice app that a teacher recommends**, not a classroom tool. No teacher dashboard.
- **Local-only, permanently.** No accounts, no backend, no analytics. Progress never leaves the device.
- **PIN login is to be removed**, replaced by local profiles: a name and a colour, no password.
  Siblings share phones, so profiles stay; authentication goes.
- **Progress moves as a 20-character code or a QR.** No server, no password. The code
  doubles as a backup. Codec proven in `poc/progress-code.js`.
- **Teachers see progress by scanning a learner's QR** into a class list stored on the
  teacher's own phone.
- **Language ladder**: mother tongue towards NCE English, driven by tier, with a
  one-question override that never changes the tier. Maths vocabulary is never translated.
  Tagalog and Cebuano first. Structure in `poc/language-ladder.js`.
- **Hosting is GitHub Pages.**

## Next, in order

1. **Self-host the fonts.** Lexend and Baloo 2 load from Google's CDN, which is the app's
   only third-party request. The overview PDF given to teachers promises nothing leaves the
   phone, so this has to make that true. Put the woff2 files in `assets/fonts/`, give them
   `@font-face` rules in the app's own CSS, and in `index.html` load the token files
   individually instead of `_ds/.../styles.css`, skipping `tokens/fonts.css`. That leaves
   the vendored design system untouched.
2. **Enable GitHub Pages** from `main`.
3. **Test on a real low-end Android** through the Pages URL. A plain-HTTP LAN address can't
   register the service worker, so install and offline only work on the HTTPS URL.
4. **CI**: a GitHub Action that runs `tests/fuzz.js` and `poc/progress-code.js` on every push.

Then:

- Remove PIN auth: the `signin`, `recover` and `recoverSent` routes, and `signedIn` and
  `recoveryRequested` in the store. Add local profiles.
- Progress code: backup and restore UI, built from `poc/progress-code.js`.
- `navigator.storage.persist()` on boot; prompt for install around streak day 3 or 4.
- Move question templates and strings out of code into versioned JSON packs **before**
  adding topics or languages, while there are only 20 templates.

**Parked:** the language ladder. There are no native reviewers yet, and an unreviewed pack
teaches the wrong thing with confidence. Do not ship the placeholder strings in `poc/`.

## Releasing

Change `CACHE` in `sw.js` on every release. Installed phones keep the old precache list
until `sw.js` itself changes.

## Gotchas

- `C:\Users\tire0` is itself a git repository, pointed at an unrelated project. This folder
  has its own `.git`, which takes precedence, but confirm `git rev-parse --show-toplevel`
  is this folder before committing.
- `.claude/worktrees/abante-minds-screens-9c5311/` is a stale copy of the code from an
  earlier session, attached to that home-directory repo. It is gitignored. Don't edit it.
- The service worker serves from cache first. During development use `devserver.py`, or
  clear site data, or an edit will look as if it did nothing.
