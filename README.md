# Abante Minds

NCE math practice that works offline. This is an implementation of
[`Abante Minds screens.dc.html`](Abante%20Minds%20screens.dc.html) — the twenty-screen
design document imported from the claude.ai design project *Abante Minds system overview* —
built on that project's own design system, imported unchanged.

**Target:** Grade 6 learners sitting the Philippine Science High School National
Competitive Examination (NCE) on 30 January 2027. The four topics below are placeholders
from an earlier Grade 9 framing; their replacement is specified in
`TABLE-OF-SPECIFICATIONS.md`. `CLAUDE.md` and `RESEARCH-PLAN.md` hold the decisions and
the plan.

Open `index.html` through any static server. There is no build step.

```bash
python devserver.py
```

It binds every interface and prints a LAN address so a phone on the same Wi-Fi can open it.
See [Testing on a phone](#testing-on-a-phone).

## What came from the design project

Imported verbatim, and not edited:

| Path | What it is |
| --- | --- |
| `Abante Minds screens.dc.html` | The design document: 20 screens, plus tablet and desktop treatments |
| `_ds/abante-minds-design-system-.../tokens/*.css` | Colour, type, spacing and depth tokens |
| `_ds/abante-minds-design-system-.../foundations/press.css` | The press mechanic |
| `_ds/abante-minds-design-system-.../styles.css` | The import entry point |
| `motion/motion.css`, `motion/motion.js` | The motion foundation |
| `support.js` | The design-canvas runtime the `.dc.html` is authored against |

`assets/` is the exception. `DesignSync.get_file` caps a read at 256 KiB, so the brand mark
came back truncated at 38% of its pixel data — no `IEND`, and only the top of the artwork
rendered. The full file was taken from the source kit already on disk at
`abante-minds-claude-design/abante-minds-claude-design/logo/abante-minds-mark.png` and downscaled to 512x512 (93 KB
rather than 693 KB, and still 3x for the 104px box the splash gives it).
`assets/abante-minds-maskable.png` is derived from it: Android crops a maskable icon to a
circle, so the art sits inside a 60% safe zone on `--surface-100` instead of bleeding to a
transparent edge.

The design document is kept as the specification. It needs the canvas host to render its
live React components, so it is a reference to read rather than a page to open; the
components it imports are reimplemented natively in `app/ui.js`.

## What was built

| File | Responsibility |
| --- | --- |
| `index.html` | Shell. Loads the design system, then the app |
| `app/icons.js` | The 22-glyph Phosphor Bold subset from the design system |
| `app/ui.js` | The design system components as DOM builders, plus the patterns the system deliberately left out (answer tile, keypad, tier ladder, nav) |
| `app/content.js` | The question bank |
| `app/store.js` | Learner state: tier, streak, per-topic progress |
| `app/screens.js` | The twenty screens |
| `app/app.js` | Shell slots, router, practice loop, keyboard |
| `app/app.css` | Shell layout and the three width rules |
| `sw.js`, `manifest.webmanifest` | Install to home screen, and a full session with no signal |

### Screens to routes

The document draws twenty frames. Several of them are one screen in two states — home is
drawn four times because it has a first-run state, a returning state, an offline banner and
a sync banner — so the twenty frames land on eleven routes. Frame 19, the sync banner, is
deliberately not built: the app sends nothing, so there is nothing to report as syncing.

| Frames | Route |
| --- | --- |
| 1 | `splash` |
| 2 | `signin` |
| 3 / 3b | `recover`, `recoverSent` |
| 4 | `setup` |
| 5, 6, 17 | `home` |
| 7, 8 | `topics` |
| 9, 10, 11, 12, 13, 15, 18 | `practice` |
| 14 | `tierup` |
| 16 | `summary` |
| 20 | `profile` |

### The question bank

Eighty hand-written items would be exhausted in a week, so each topic is a set of
parameterised templates. The numbers change per question and the three hints and three
worked steps are derived from the same numbers, so every question arrives with a real
scaffold rather than generic advice. The items the document prints verbatim — the ₱240
markup, the three kilos of fish for ₱450, the ₱63 loaf paid with ₱100 — are seeded at the
front of their topic, so a fresh install opens on exactly the screens in the spec.

### Progression

- Twenty correct on a tier opens the next one, and the tier-up takeover is the only gold
  field in the product.
- A missed day resets the streak and drops one tier. Five correct in a row restores it.
  The demote is stated in a card inside the ordinary practice layout — no takeover.
- Every topic counts to twenty.

### Offline

The service worker precaches the shell and serves it stale-while-revalidate, so a cold
start with no signal still opens the app. Answers given offline count immediately, so tiers
move whether or not there is signal. Nothing is sent anywhere, so there is nothing to sync.

Learner state lives in `localStorage` and never leaves the device.

## Testing on a phone

`python devserver.py` binds every interface and prints its own LAN URL. Open that on a
phone on the same Wi-Fi — no pairing, no tunnel.

Two things tend to get in the way:

**The firewall.** On Windows, a Wi-Fi network classed as Public blocks inbound connections,
and a dismissed Windows prompt can leave a standing *block* rule for `python.exe`. A block
rule beats an allow rule, so check for one and disable it as well as opening the port. In
an elevated PowerShell:

```powershell
Get-NetFirewallRule -DisplayName 'python.exe' -Direction Inbound | Where-Object { $_.Action -eq 'Block' } | Disable-NetFirewallRule
New-NetFirewallRule -DisplayName 'Abante Minds dev (5176)' -Direction Inbound -Protocol TCP -LocalPort 5176 -Action Allow -Profile Public
```

That exposes the server to everyone on that Wi-Fi for as long as it runs, so undo it after:

```powershell
Remove-NetFirewallRule -DisplayName 'Abante Minds dev (5176)'
Get-NetFirewallRule -DisplayName 'python.exe' -Direction Inbound | Enable-NetFirewallRule
```

**No service worker over plain HTTP.** A LAN address is an insecure origin, so
`navigator.serviceWorker` is undefined, offline caching is off and the browser will not
offer to install the app. The practice loop, progress and `localStorage` all work normally;
only the install and offline-launch behaviour is missing. To exercise those on the phone,
add the origin to Chrome's insecure-origin allowlist at
`chrome://flags/#unsafely-treat-insecure-origin-as-secure`, or serve over HTTPS.

If the phone still cannot reach the address after that, check for a VPN or a secure-DNS
client (Cloudflare WARP and similar) and pause it.

## Responsive

The gutter steps 24 → 32 → 48. The reading column caps at 720 on phone and tablet; on
desktop the cap moves to the cards so the extra width becomes a second column rather than
a longer line. Tap targets stay at 48 everywhere. The bottom-anchored action is a
thumb-reach rule, so it survives on tablet and becomes an inline action on desktop, where
the bottom nav turns into a left rail and the keypad moves beside the answer field.

## Tests

```bash
node tests/fuzz.js
node tests/invariants.js
```

Drives every question template across 4,000 seeds per topic, 160,000 questions in all, and
fails if any can produce a negative answer, an incomplete scaffold, a hint with an
unfollowable number, a broken multiple choice, or an answer the checker rejects. The app is
offline, so a bad question cannot be hotfixed on a phone that has already installed it;
this is the guard.

`tests/invariants.js` checks the repository rules that would otherwise fail silently: every
precached path exists, everything the page loads is precached, `.nojekyll` is present, and
no shipped file contains a third-party URL. Both run in CI on every pull request.

`poc/` holds proofs for features that are designed but not built, the progress code and the
language ladder. They are not loaded by the app.

## Notes for reviewing

- The offline screens respond to real connectivity. To reach them without pulling the
  plug, load the app with `#offline`, or run `AM.store.setOffline(true)` in the console.
- `AM.store.reset()` clears the learner and returns the app to the splash screen.
- On desktop the answer field also takes the hardware keyboard: digits, `.`, backspace,
  and Enter to check.
