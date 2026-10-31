"""Capture the screenshots the overview PDF embeds.

Needs a dev server running from the repo root, Chrome, and Pillow. Every screen
is photographed through shots.html at 390x844, device scale 2.

    python devserver.py 5176                        # from the repo root
    python tools/overview-pdf/capture.py 5176       # writes tools/overview-pdf/shots/

Set CHROME if Chrome is not at the default Windows path.
"""
import os
import re
import subprocess
import sys
import tempfile
import urllib.request

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, "shots")
CHROME = os.environ.get("CHROME", r"C:\Program Files\Google\Chrome\Application\chrome.exe")

SCREENS = ["home", "topic", "practice", "hint", "correct", "wrong", "levelup", "offline",
           "exam-result", "transform-pick-flip", "combo", "streak", "badges", "profile-settings",
           "basics-topic"]

# The same screens with the phone set to dark, saved as <screen>-dark.png.
# Every other capture asks for light, so the machine's own setting never leaks in.
DARK = ["home"]

# Close-ups cut from the 2x captures, as (source screen, box). They were placed
# against the current layout: if one of these screens changes, re-check its box
# against the full capture before rebuilding.
DETAILS = {
    "detail_hint": ("hint", (0, 236, 780, 664)),        # the three hints
    "detail_correct": ("correct", (0, 204, 780, 540)),  # verdict and working
    "detail_badges": ("badges", (0, 80, 780, 500)),     # the count and the showcase
    "detail_settings": ("profile-settings", (0, 590, 780, 1380)),  # the settings card
    "detail_basics": ("basics-topic", (40, 236, 740, 1230)),        # the times-table grid
    "detail_offline": ("offline", (0, 0, 780, 300)),                # the offline line
}

CHROME_ARGS = ["--headless=new", "--disable-gpu", "--hide-scrollbars",
               "--force-device-scale-factor=2", "--virtual-time-budget=10000",
               "--window-size=390,844"]


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5176
    origin = f"http://localhost:{port}"
    try:
        urllib.request.urlopen(origin + "/index.html", timeout=5)
    except Exception:
        sys.exit(f"No dev server at {origin}. Run `python devserver.py {port}` from the repo root.")
    if not os.path.exists(CHROME):
        sys.exit(f"Chrome not found at {CHROME}. Set CHROME to its path.")

    os.makedirs(SHOTS, exist_ok=True)
    # One fresh profile for the whole run, warmed up first. On a cold profile
    # the app's service worker is still installing while the picture is taken,
    # and headless Chrome's virtual clock does not wait for the files it
    # fetches, so a stylesheet can be missing from the capture. Once warm, the
    # worker answers from its cache at once.
    profile = tempfile.mkdtemp(prefix="am-capture-")
    CHROME_ARGS.append(f"--user-data-dir={profile}")
    for _ in range(2):
        subprocess.run([CHROME, *CHROME_ARGS, "--dump-dom", f"{origin}/tools/overview-pdf/shots.html?screen=home"],
                       capture_output=True, text=True, timeout=120)
    def shoot(screen, dark):
        url = f"{origin}/tools/overview-pdf/shots.html?screen={screen}"
        scheme = [f"--blink-settings=preferredColorScheme={0 if dark else 1}"]

        # Chrome photographs whatever is on screen, including a half-driven app.
        # The harness titles itself READY-<screen> only once it got there, so
        # check that first rather than trust the picture.
        # A cold headless start sometimes misses the app (NO-APP); try again.
        for attempt in range(3):
            dom = subprocess.run([CHROME, *CHROME_ARGS, *scheme, "--dump-dom", url],
                                 capture_output=True, text=True, timeout=120).stdout
            title = (re.search(r"<title>([^<]*)</title>", dom) or [None, "no title"])[1]
            if title == f"READY-{screen}":
                break
        else:
            sys.exit(f"{screen}: harness did not reach the screen in 3 tries (title: {title!r})")

        # The picture is a separate run, and can come out blank; try again. A
        # real screen has many colours, a blank one (light or dark) a handful.
        name = screen + ("-dark" if dark else "")
        out = os.path.join(SHOTS, name + ".png")
        for attempt in range(3):
            subprocess.run([CHROME, *CHROME_ARGS, *scheme, f"--screenshot={out}", url],
                           check=True, capture_output=True, timeout=120)
            if len(Image.open(out).convert("RGB").resize((40, 80)).getcolors(40 * 80)) > 8:
                break
        else:
            sys.exit(f"{name}: the capture came out blank in 3 tries")
        size = Image.open(out).size
        if size != (780, 1688):
            sys.exit(f"{name}: expected a 780x1688 capture, got {size}")
        print(f"  {name:19} ok")

    for screen in SCREENS:
        shoot(screen, False)
    for screen in DARK:
        shoot(screen, True)

    for name, (source, box) in DETAILS.items():
        Image.open(os.path.join(SHOTS, source + ".png")).crop(box).save(os.path.join(SHOTS, name + ".png"))
        print(f"  {name:15} cut from {source}")

    print(f"\n{len(SCREENS)} screens, {len(DARK)} in dark, and {len(DETAILS)} close-ups in {SHOTS}")


if __name__ == "__main__":
    main()
