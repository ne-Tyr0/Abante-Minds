"""The design catalog PDF: every colour, type style, icon, component, badge and
picture in the app (catalog.html, drawn by the app's own code), then its
screens, captured through the screenshot harness and grouped by flow.

Needs the dev server on http://localhost:5179 (the abante-minds-nav launch
config) and Chrome. Run:  python tools/design-catalog/build.py
Writes tools/design-catalog/Abante-Minds-design-catalog.pdf (not committed)."""
import os, re, shutil, subprocess, sys, tempfile, urllib.parse, urllib.request
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
SHOTS = os.path.join(HERE, "shots")
PDF = os.path.join(HERE, "Abante-Minds-design-catalog.pdf")
CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe"
SERVER = "http://localhost:5179/"
HARNESS = SERVER + "tools/overview-pdf/shots.html?screen="

# (group, harness screen, caption). The groups are the catalog's parts 5 to 11.
SCREENS = [
    ("home", "splash", "Welcome: a first name, then the first lesson"),
    ("home", "home-new", "Home for a new learner"),
    ("home", "home", "Home"),
    ("home", "home-done", "Home, today's goal met"),
    ("home", "home-recap", "Home, the weekly look back"),
    ("home", "home-forgiven", "Home, a missed day forgiven"),
    ("home", "home-shield", "Home, a shield kept the streak"),
    ("home", "offline", "Home, offline"),
    ("home", "home-install", "Home, the install offer"),
    ("home", "install-steps", "Adding it to the home screen"),
    ("practice", "topics", "Practice: the topics"),
    ("practice", "topic", "A topic's levels"),
    ("practice", "lesson", "A lesson"),
    ("practice", "practice", "A question"),
    ("practice", "hint-sheet", "A hint, in its sheet"),
    ("practice", "hint", "Hints kept above the answer"),
    ("practice", "correct", "Right first time"),
    ("practice", "wrong", "A mistake, named"),
    ("practice", "combo", "In a row"),
    ("practice", "cleared-cue", "Level cleared, mid-round"),
    ("practice", "levelup", "Level up"),
    ("practice", "summary", "Round summary"),
    ("practice", "summary-sharp", "Round summary, a sharp round"),
    ("practice", "road-new", "New on the reward road"),
    ("practice", "summary-reminder", "The one-time reminder offer"),
    ("types", "fraction-entry", "Fraction answer"),
    ("types", "fraction-wrong-form", "Right amount, wrong form"),
    ("types", "percent-entry", "Per cent answer"),
    ("types", "data-lesson", "A data lesson"),
    ("types", "data-bar", "Bar graph"),
    ("types", "data-line", "Line graph"),
    ("types", "data-trend", "A trend"),
    ("types", "data-pie", "Pie chart"),
    ("types", "data-pie-degrees", "Pie chart in degrees"),
    ("types", "data-table", "Table"),
    ("types", "time-entry", "Time answer"),
    ("types", "time-correct", "Time, right"),
    ("types", "time-wrong", "Time, a mistake"),
    ("types", "time-choice", "Time, a choice"),
    ("types", "time-map", "Time zones"),
    ("types", "area-grid", "Area on squared paper"),
    ("types", "solids-cubes", "Counting cubes"),
    ("types", "solids-name", "Naming a solid"),
    ("types", "solids-pick", "Picking a solid"),
    ("types", "circles-part", "Parts of a circle"),
    ("types", "transform-pick-flip", "A flip"),
    ("types", "transform-pick-slide", "A slide"),
    ("types", "transform-pick-turn", "A turn"),
    ("types", "transform-gap", "Completing a shape"),
    ("types", "transform-fill", "Filling in the image"),
    ("types", "transform-clock", "Turning on a clock"),
    ("types", "transform-mirror", "A mirror line"),
    ("basics", "basics", "Basics"),
    ("basics", "basics-topic", "The times tables"),
    ("basics", "basics-adding", "Adding and subtracting"),
    ("basics", "basics-mental", "Mental math"),
    ("basics", "mental-practice", "A mental math question"),
    ("basics", "mental-levelup", "A Basics level-up"),
    ("basics", "facts", "A facts drill"),
    ("basics", "facts-correct", "A fact, quick and right"),
    ("basics", "facts-wrong", "A fact missed"),
    ("basics", "facts-summary", "Facts round summary"),
    ("rewards", "streak", "The daily streak"),
    ("rewards", "streak-milestone", "A milestone: 7 days"),
    ("rewards", "streak-blue", "A milestone with the blue flame"),
    ("rewards", "badges", "The badge collection"),
    ("rewards", "badge-card", "A badge's card"),
    ("rewards", "challenge-badges", "Challenge badges"),
    ("rewards", "road", "The reward road, as a map"),
    ("rewards", "road-step", "A step of the road"),
    ("rewards", "tier-veil", "A new card tier, held for"),
    ("rewards", "tier-up", "A new card tier: Silver"),
    ("rewards", "tier-emerald", "Emerald, with its stone"),
    ("rewards", "profile-road", "Profile: the next step on the road"),
    ("rewards", "card-styles", "Edit your card: rewards to choose"),
    ("challenge", "challenge-intro", "Challenge: the sprint"),
    ("challenge", "challenge-ladder-intro", "Challenge: the ladder"),
    ("challenge", "challenge", "A sprint question"),
    ("challenge", "challenge-right", "Sprint, right"),
    ("challenge", "challenge-wrong", "Sprint, a miss"),
    ("challenge", "challenge-ladder", "A ladder question"),
    ("challenge", "challenge-result", "Challenge result, a new best"),
    ("challenge", "challenge-result-plain", "Challenge result"),
    ("challenge", "exam-intro", "Practice exam"),
    ("challenge", "exam", "A practice exam question"),
    ("challenge", "exam-result", "Practice exam result"),
    ("challenge", "review-home", "Review waiting on Home"),
    ("challenge", "review", "A review question"),
    ("challenge", "review-done", "Review done"),
    ("profile", "profile", "Profile"),
    ("profile", "profile-motto", "Profile: a title and a motto"),
    ("profile", "profile-emerald", "Profile: an Emerald card"),
    ("profile", "profile-settings", "Profile: settings"),
    ("profile", "edit-card", "Edit your card"),
    ("profile", "profile-install", "Profile: install"),
    ("profile", "reminder", "Practice reminder on iPhone"),
    ("profile", "reminder&os=android", "Practice reminder on Android"),
    ("profile", "reminder-added", "A reminder added"),
    ("profile", "profile-reminder", "Profile: the reminder"),
]
DARK = [("home", "Home"), ("practice", "A question"), ("correct", "Right first time"), ("wrong", "A mistake, named"),
        ("summary-sharp", "Round summary"), ("levelup", "Level up"), ("streak-milestone", "A milestone"), ("badges", "Badges"),
        ("profile", "Profile"), ("road", "Reward road"), ("tier-emerald", "A new tier"), ("card-styles", "Edit your card"), ("reminder", "Practice reminder")]


PROFILE = []


def profile():
    """One browser profile for the whole run, warmed up first: on a cold
    profile the app's service worker is still fetching every file while the
    picture is taken, which is slow and can leave a stylesheet out. Warm, it
    answers from its cache at once."""
    if not PROFILE:
        PROFILE.append(tempfile.mkdtemp(prefix="am-cat-"))
        for _ in range(2):
            run([CHROME, "--headless=new", "--mute-audio", "--disable-gpu", "--virtual-time-budget=10000", "--window-size=390,844",
                 "--user-data-dir=" + PROFILE[0], "--dump-dom", HARNESS + "home"], 300)
    return PROFILE[0]


def run(args, timeout):
    """Run Chrome; True if it finished. A hung Chrome is killed with every
    process it started, which would otherwise keep the profile locked."""
    p = subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        p.wait(timeout=timeout)
        return True
    except subprocess.TimeoutExpired:
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(p.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return False


def shoot(query, out, dark=False):
    """One screen at 390x844, twice the pixels, saved as a compact JPEG."""
    png = out + ".png"
    for attempt in range(3):
        if os.path.exists(png):
            os.remove(png)
        done = run([CHROME, "--headless=new", "--mute-audio", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=2",
                    "--virtual-time-budget=10000", "--window-size=390,844", "--user-data-dir=" + profile(),
                    "--blink-settings=preferredColorScheme=" + ("0" if dark else "1"), "--screenshot=" + png, HARNESS + query], 150)
        ok = done and os.path.exists(png) and len(Image.open(png).convert("RGB").resize((40, 80)).getcolors(3200) or [0] * 99) > 8
        if ok:
            im = Image.open(png).convert("RGB")
            im.resize((520, round(im.height * 520 / im.width)), Image.LANCZOS).save(out, "JPEG", quality=84, optimize=True)
            os.remove(png)
            return True
    print("  failed:", query, flush=True)
    return False


def main():
    try:
        urllib.request.urlopen(SERVER, timeout=5)
    except Exception:
        sys.exit("Start the dev server first (localhost:5179).")
    build = re.search(r'var CACHE = "abante-minds-v(\d+)"', open(os.path.join(REPO, "sw.js"), encoding="utf-8").read()).group(1)
    os.makedirs(SHOTS, exist_ok=True)
    entries = []
    jobs = [(g, s, c, False) for g, s, c in SCREENS] + [("dark", s, c, True) for s, c in DARK]
    for i, (group, screen, caption, dark) in enumerate(jobs, 1):
        name = (group + "-" + re.sub(r"[^a-z0-9]+", "-", screen) + ".jpg")
        out = os.path.join(SHOTS, name)
        if not os.path.exists(out):
            print("[%d/%d] %s%s" % (i, len(jobs), screen, " (dark)" if dark else ""), flush=True)
            if not shoot(screen, out, dark):
                continue
        # Encoded twice over: the page's query is decoded once, and a caption
        # may hold commas, the separator between screens.
        entries.append(group + ":" + name + ":" + urllib.parse.quote(caption, safe=""))
    url = SERVER + "tools/design-catalog/catalog.html?build=" + build + "&shots=" + urllib.parse.quote(",".join(entries), safe=":,")
    profile = tempfile.mkdtemp(prefix="am-cat-")
    subprocess.run([CHROME, "--headless=new", "--mute-audio", "--no-pdf-header-footer", "--virtual-time-budget=90000",
                    "--user-data-dir=" + profile, "--blink-settings=preferredColorScheme=1",
                    "--print-to-pdf=" + PDF, url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=300)
    shutil.rmtree(profile, ignore_errors=True)
    print("wrote", PDF, "(%d screens)" % len(entries), flush=True)


if __name__ == "__main__":
    main()
