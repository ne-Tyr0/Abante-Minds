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
import urllib.request

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, "shots")
CHROME = os.environ.get("CHROME", r"C:\Program Files\Google\Chrome\Application\chrome.exe")

SCREENS = ["splash", "home", "topics", "practice", "hint", "correct",
           "wrong", "tierup", "summary", "profile", "offline"]

# Close-ups cut from the 2x captures, as (source screen, box). They were placed
# against the current layout: if one of these screens changes, re-check its box
# against the full capture before rebuilding.
DETAILS = {
    "detail_hint": ("hint", (0, 325, 780, 800)),        # the three hints
    "detail_correct": ("correct", (0, 280, 780, 800)),  # verdict and working
    "detail_tierup": ("tierup", (0, 500, 780, 1420)),   # the celebration
}

CHROME_ARGS = ["--headless=new", "--disable-gpu", "--hide-scrollbars",
               "--force-device-scale-factor=2", "--virtual-time-budget=4000",
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
    for screen in SCREENS:
        url = f"{origin}/tools/overview-pdf/shots.html?screen={screen}"

        # Chrome photographs whatever is on screen, including a half-driven app.
        # The harness titles itself READY-<screen> only once it got there, so
        # check that first rather than trust the picture.
        dom = subprocess.run([CHROME, *CHROME_ARGS, "--dump-dom", url],
                             capture_output=True, text=True, timeout=120).stdout
        title = (re.search(r"<title>([^<]*)</title>", dom) or [None, "no title"])[1]
        if title != f"READY-{screen}":
            sys.exit(f"{screen}: harness did not reach the screen (title: {title!r})")

        out = os.path.join(SHOTS, screen + ".png")
        subprocess.run([CHROME, *CHROME_ARGS, f"--screenshot={out}", url],
                       check=True, capture_output=True, timeout=120)
        size = Image.open(out).size
        if size != (780, 1688):
            sys.exit(f"{screen}: expected a 780x1688 capture, got {size}")
        print(f"  {screen:9} ok")

    for name, (source, box) in DETAILS.items():
        Image.open(os.path.join(SHOTS, source + ".png")).crop(box).save(os.path.join(SHOTS, name + ".png"))
        print(f"  {name:15} cut from {source}")

    print(f"\n{len(SCREENS)} screens and {len(DETAILS)} close-ups in {SHOTS}")


if __name__ == "__main__":
    main()
