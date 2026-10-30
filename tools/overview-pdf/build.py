"""Build the Abante Minds overview PDF.

Renders an A4 document in the app's own design tokens, embeds the screenshots
from capture.py as data URIs, and prints it with headless Chrome. The numbers
in it (topics, weights, levels, question types, named mistakes, competencies
reached, the app's size) are read from the packs and the service worker when it
is built, so they cannot go stale.

    python tools/overview-pdf/build.py [out.pdf]

See README.md in this folder for the full sequence.
"""
import base64, datetime, io, json, os, re, subprocess, sys

# Abante Minds is still being built. This edition is for testing inside the
# project, with teachers the owner knows, and every page says so.
EDITION = "For internal testing only &middot; not for outside distribution"
ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, "shots")
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
PACK = os.path.join(REPO, "content", "packs", "math")
CHROME = os.environ.get("CHROME", r"C:\Program Files\Google\Chrome\Application\chrome.exe")

if not os.path.isdir(SHOTS):
    sys.exit("No screenshots yet. Run capture.py first; see README.md.")


def data_uri(path):
    with open(path, "rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode()


SHOT = {n: data_uri(os.path.join(SHOTS, n + ".png"))
        for n in ["home", "home-dark", "topic", "practice", "wrong", "levelup", "exam-result",
                  "transform-pick-flip", "combo", "streak", "detail_hint", "detail_correct",
                  "detail_badges", "detail_settings", "detail_basics", "detail_offline"]}
MARK = data_uri(os.path.join(REPO, "assets", "abante-minds-mark.png"))
# The QR opens the live app. Made once with segno (version 3-M) and kept as a
# file, so building needs no QR library.
with open(os.path.join(HERE, "app-qr.svg"), "rb") as f:
    QR = "data:image/svg+xml;base64," + base64.b64encode(f.read()).decode()

# The owner's name and email go on the cover and the last page. They are kept
# out of the public repository: put them in contact.json beside this file
# (gitignored) as {"name": "...", "email": "..."}. Without it the PDF is built
# with no contact lines.
try:
    with io.open(os.path.join(HERE, "contact.json"), encoding="utf-8") as f:
        _c = json.load(f)
    OWNER, CONTACT = _c["name"], _c["email"]
except FileNotFoundError:
    OWNER = CONTACT = None


# ---------------------------------------------------------------- facts
def load(name):
    with io.open(os.path.join(PACK, name), encoding="utf-8") as f:
        return json.load(f)


MANIFEST = load("manifest.json")
BLUEPRINT = json.load(io.open(os.path.join(REPO, "content", "blueprint.json"), encoding="utf-8"))
TOPICS = []
for t in MANIFEST["topics"]:
    f = load(t["file"])
    TOPICS.append({"label": t["label"], "weight": t["weight"], "levels": len(f["levels"]),
                   "types": len(f["templates"]), "mistakes": sum(len(x["distractors"]) for x in f["templates"]),
                   "competencies": {x["competency"] for x in f["templates"]}})
BASICS = [t["label"] for t in MANIFEST.get("basics", [])]
# Every level is a badge, on the path and in Basics; review levels are not.
BADGES = sum(len([lv for lv in load(t["file"])["levels"] if lv.get("kind") != "review"])
             for t in MANIFEST["topics"] + MANIFEST.get("basics", []))
TYPES = sum(t["types"] for t in TOPICS)
MISTAKES = sum(t["mistakes"] for t in TOPICS)
SERVED = set().union(*(t["competencies"] for t in TOPICS))
ALL = len(BLUEPRINT["competencies"])
REACHABLE = len([c for c in BLUEPRINT["competencies"] if c["app"] != "N"])
REACHED = len([c for c in BLUEPRINT["competencies"] if c["app"] != "N" and c["code"] in SERVED])
EXAM_DATE = MANIFEST["examDate"]


def app_size_mb():
    """Every file the service worker stores on the phone, in megabytes."""
    sw = io.open(os.path.join(REPO, "sw.js"), encoding="utf-8").read()
    files = re.findall(r'"([^"]+)"', re.search(r"SHELL\s*=\s*\[([\s\S]*?)\];", sw).group(1))
    total = 0
    for f in files:
        p = f[2:] if f.startswith("./") else f
        total += os.path.getsize(os.path.join(REPO, p if p and not p.endswith("/") else p + "index.html"))
    return total / 1024 / 1024


SIZE = app_size_mb()
MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September",
          "October", "November", "December"]
y, mo, d = (int(x) for x in EXAM_DATE.split("-"))
EXAM_DAY = f"{d} {MONTHS[mo - 1]} {y}"
TODAY = datetime.date.today()
UPDATED = f"{TODAY.day} {MONTHS[TODAY.month - 1]} {TODAY.year}"


def phone(name, caption):
    return f"""<figure class="phone">
      <div class="bezel"><img src="{SHOT[name]}" alt="{caption}"></div>
      <figcaption>{caption}</figcaption>
    </figure>"""


def detail(name, caption):
    return f"""<figure class="detail">
      <img src="{SHOT[name]}" alt="">
      <figcaption>{caption}</figcaption>
    </figure>"""


CSS = """
@page { size: A4; margin: 0; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
html, body { margin:0; padding:0; }
body {
  font-family: "Lexend", system-ui, -apple-system, sans-serif;
  color: #16202c; background: #ffffff;
  font-size: 10pt; line-height: 1.55;
}
.page {
  width: 210mm; height: 297mm; padding: 16mm 15mm 26mm;
  page-break-after: always; position: relative; overflow: hidden;
  display: flex; flex-direction: column; background:#ffffff;
}
.page:last-child { page-break-after: auto; }

h1 { font-family:"Baloo 2", system-ui, sans-serif; font-size: 30pt; line-height:1.1;
     color:#2458c9; margin:0 0 2mm; font-weight:700; }
h2 { font-size: 15pt; line-height:1.2; margin:0 0 3mm; font-weight:700; color:#16202c;
     letter-spacing:-0.2px; }
h3 { font-size: 10.5pt; margin:0 0 1.5mm; font-weight:600; color:#2458c9; }
p  { margin:0 0 3mm; }
.lede { font-size: 11.5pt; line-height:1.5; color:#51617a; }
.muted { color:#51617a; }
small { font-size: 8.5pt; }

.eyebrow { font-size:8pt; font-weight:600; letter-spacing:1.4px; text-transform:uppercase;
           color:#51617a; margin:0 0 2.5mm; }
.rule { height:2px; background:#dbe7f8; margin:0 0 5mm; border-radius:2px; }

.foot { position:absolute; left:15mm; right:15mm; bottom:7mm;
        display:flex; justify-content:space-between; font-size:7.5pt; color:#6a87bd;
        border-top:1px solid #dbe7f8; padding-top:2mm; }
.edition { color:#c1440e; font-weight:600; }

/* screenshots */
.shots { display:flex; gap:5mm; justify-content:center; align-items:flex-start; }
.phone { margin:0; flex:1; min-width:0; }
.bezel { background:#c3cfe2; border-radius:5mm; padding:1.6mm; }
.bezel img { display:block; width:100%; border-radius:3.6mm; }
figcaption { font-size:7.5pt; line-height:1.35; color:#51617a; margin-top:2mm; text-align:center; }
.detail { margin:0; flex:1; min-width:0; }
.detail img { display:block; width:100%; border:1.5px solid #dbe7f8; border-radius:3mm; }
.detail figcaption { text-align:left; }

/* cards */
.card { background:#ffffff; border:1.5px solid #dbe7f8; border-radius:4mm; padding:4mm 4.5mm; }
.grid2 { display:grid; grid-template-columns:1fr 1fr; gap:4mm; }
.grid3 { display:grid; grid-template-columns:repeat(3,1fr); gap:3.5mm; }
.fact { background:#eef3fb; border-radius:3mm; padding:3.5mm 4mm; }
.fact b { display:block; font-size:13pt; color:#2458c9; line-height:1.2; }
.fact span { font-size:8.5pt; color:#51617a; }

ul { margin:0 0 3mm; padding-left:4.5mm; }
li { margin-bottom:1.2mm; }

table { width:100%; border-collapse:collapse; font-size:9pt; }
th { text-align:left; font-weight:600; color:#51617a; font-size:8pt;
     text-transform:uppercase; letter-spacing:0.8px; padding:0 0 1.5mm; }
td { padding:2mm 0; border-top:1px solid #dbe7f8; vertical-align:top; }
td.k { width:22mm; font-weight:600; color:#2458c9; white-space:nowrap; }
td.n { text-align:right; color:#51617a; white-space:nowrap; padding-left:2mm; }
table.topics td { padding:1.75mm 0; }

.chips { display:flex; gap:2mm; flex-wrap:wrap; margin-top:2mm; }
.chip { font-size:7.5pt; padding:1mm 2.5mm; border-radius:99px;
        background:#eef3fb; color:#51617a; border:1px solid #dbe7f8; }
.note { background:#fde3d2; border-left:3px solid #c1440e; border-radius:0 3mm 3mm 0;
        padding:3mm 4mm; font-size:9pt; }
.good { background:#d3f3ea; border-left:3px solid #0b7a63; border-radius:0 3mm 3mm 0;
        padding:3mm 4mm; font-size:9pt; }
"""


PAGES = 8


def page(inner, n):
    return f"""<section class="page">{inner}
  <div class="foot"><span><span class="edition">{EDITION}</span> &middot; updated {UPDATED}</span>
  <span>{n} / {PAGES}</span></div></section>"""


# ---------------------------------------------------------------- page 1
p1 = f"""
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center">
    <img src="{MARK}" style="width:30mm;height:30mm;object-fit:contain;margin-bottom:5mm">
    <h1 style="font-size:40pt">Abante Minds</h1>
    <p class="lede" style="max-width:125mm;font-size:13pt;margin-bottom:7mm">
      Practice for the mathematics of the PSHS National Competitive Examination,
      on the phone a learner already has.
    </p>
    <div style="width:22mm;height:2px;background:#ff8a15;border-radius:2px;margin-bottom:7mm"></div>
    <p class="muted" style="max-width:135mm">
      A free practice app for Grade&nbsp;6 learners preparing for the mathematics part of the
      Philippine Science High School System National Competitive Examination. It opens from a
      link, installs to the home screen, works with no signal, and keeps each learner's
      progress on their own phone.
    </p>
    <div class="chips" style="justify-content:center;margin-top:5mm">
      <span class="chip">Works offline</span>
      <span class="chip">No account needed</span>
      <span class="chip">Free to run</span>
      <span class="chip">MATATAG Grades 5 and 6</span>
      <span class="chip">Light and dark</span>
    </div>
    <div style="display:flex;gap:5mm;align-items:center;margin-top:9mm;text-align:left;padding:4mm 5mm;border:1.5px solid #dbe7f8;border-radius:4mm">
      <img src="{QR}" style="width:27mm;height:27mm" alt="QR code to open Abante Minds">
      <div>
        <b style="font-size:11pt">Open it on a phone</b><br>
        <span style="color:#2458c9">ne-tyr0.github.io/Abante-Minds</span><br>
        <small class="muted">Scan with the phone's camera, then add it to the home screen.</small>
      </div>
    </div>
  </div>
  <div style="text-align:center"><small class="muted">Project overview &middot; internal testing edition{'<br>' + OWNER + ' &middot; ' + CONTACT if OWNER else ''}</small></div>
"""

# ---------------------------------------------------------------- page 2
p2 = f"""
  <div class="eyebrow">What it is</div>
  <h2>A path through the exam's mathematics, ten questions at a time</h2>
  <div class="rule"></div>
  <div style="display:flex;gap:7mm">
    <div style="flex:1">
      <p>The mathematics the NCE draws on is laid out as {len(TOPICS)} topics, from decimals and
      fractions to graphs, probability and transformations, in the order a learner meets them.
      Each topic is a path of short levels, and each level opens with a lesson: a few cards and
      a worked example.</p>

      <p>A practice round is ten questions. Eight right on the first try clears the level, earns
      its badge and opens the next. The numbers change every time, and grow harder as the
      learner does well, so there are no answers to memorise.</p>

      <h3>Basics, beside the path</h3>
      <p>The facts and methods every topic leans on, in {len(BASICS)} topics of their own:
      {', '.join(b[0].lower() + b[1:] for b in BASICS[:-1])}, and {BASICS[-1][0].lower() + BASICS[-1][1:]}.
      A fact counts as mastered only when it is answered right, and quickly, on two different
      days.</p>

      <h3>Ready for the day itself</h3>
      <p>A practice exam asks 20 questions in 30 minutes from every topic, in proportion to how
      much each is expected to count, with no hints and the answers only at the end. Home counts
      down to the exam, {EXAM_DAY}. A question missed comes back a day, three days and a week
      later, so it sticks.</p>

      <div class="good">
        <b>Nothing leaves the phone.</b> There is no sign-up, no email, no analytics and no
        server. A learner's name and progress are kept on their own device and nowhere else.
      </div>
    </div>
    <div style="width:66mm;flex:none">{phone("home", "Home: the next level, the countdown to the exam, and the practice exam")}</div>
  </div>

  <div style="margin-top:auto">
    <div class="rule" style="margin-bottom:4mm"></div>
    <h3 style="margin-bottom:3mm">A round, start to finish</h3>
    <div style="display:flex;gap:3mm">
      <div class="fact" style="flex:1"><b>1</b><span>Read the lesson</span></div>
      <div class="fact" style="flex:1"><b>2</b><span>Answer on the keypad</span></div>
      <div class="fact" style="flex:1"><b>3</b><span>Check, and see why</span></div>
      <div class="fact" style="flex:1"><b>4</b><span>Ten questions</span></div>
      <div class="fact" style="flex:1"><b>5</b><span>Eight right clears it</span></div>
    </div>
  </div>
"""

# ---------------------------------------------------------------- page 3
p3 = f"""
  <div class="eyebrow">The practice loop</div>
  <h2>Answer, check, and find out why</h2>
  <div class="rule"></div>
  <p style="margin-bottom:4mm">There is no calculator. Answers are typed on the app's own keypad:
  whole numbers, decimals, fractions and mixed numbers, and times on the 24-hour clock. Some
  questions are read off a graph, a table or a picture, and some ask the learner to pick the
  right picture. The X at the top leaves a round at any question, and the answers already
  right are kept.</p>

  <div class="shots" style="margin-bottom:4mm">
    <div style="width:52mm;flex:none">{phone("practice", "<b>Answering.</b> The question keeps the most room, and the keypad is the only way in.")}</div>
    <div style="width:52mm;flex:none">{phone("wrong", "<b>Not yet.</b> The app names the mistake, then shows the first worked step and holds the others back.")}</div>
    <div style="width:52mm;flex:none">{phone("transform-pick-flip", "<b>Pictures.</b> Which picture shows the shape flipped over the mirror line?")}</div>
  </div>

  <div class="shots" style="align-items:stretch;margin-bottom:4mm">
    {detail("detail_hint", "<b>Three hints, one at a time.</b> Asking for help never costs the question.")}
    {detail("detail_correct", "<b>Right.</b> The working is shown even then: it is what carries over to the next question.")}
  </div>

  <div class="good" style="margin-top:auto">
    <b>Mistakes are named, not just marked.</b> Each kind of question knows the wrong answers
    learners commonly give, such as halving instead of doubling or reading the wrong line of a
    graph, and answers each with its own explanation: {MISTAKES} of them across the path.
  </div>
"""

# ---------------------------------------------------------------- page 4
topic_rows = "".join(f"""
    <tr><td>{t['label']}</td><td class="n">{round(t['weight'] * 100)}%</td>
      <td class="n">{t['levels']} levels</td><td class="n">{t['types']} kinds</td></tr>""" for t in TOPICS)

p4 = f"""
  <div class="eyebrow">Topics and progress</div>
  <h2>{len(TOPICS)} topics, weighted as the exam is expected to weigh them</h2>
  <div class="rule"></div>
  <div style="display:flex;gap:7mm;flex:1">
    <div style="flex:1;display:flex;flex-direction:column">
      <table class="topics" style="margin-bottom:4mm">
        <tr><th>Topic</th><th style="text-align:right">Weight</th><th style="text-align:right">Path</th>
          <th style="text-align:right">Question kinds</th></tr>{topic_rows}
      </table>
      <p style="font-size:9pt">{TYPES} kinds of question in all, each drawn with fresh numbers every
      time. A learner who practises daily until the exam will not reach the end of them.</p>

      <div class="note" style="margin-top:2mm">
        <b>Built from the curriculum, not from past papers.</b> PSHS publishes no table of
        specifications, so the topics and their weights come from the DepEd MATATAG curriculum
        for Grades 5 and 6 ({ALL} competencies). {'All ' + str(REACHABLE) if REACHED == REACHABLE else str(REACHED) + ' of the ' + str(REACHABLE)}
        that can be practised on a phone have questions; the other {ALL - REACHABLE} are tasks
        such as drawing with compasses. The weights are an estimate, and the exam may reach
        beyond Grade 6.
      </div>

      <div class="card" style="margin-top:auto">
        <h3>The numbers follow the learner</h3>
        <p style="margin:0;font-size:9pt">A level starts with small numbers and draws bigger ones
        as it fills. Within a round, three first tries right in a row step the numbers up, and a
        miss steps them back, never below where the level stands.</p>
      </div>
    </div>
    <div style="width:56mm;flex:none">
      {phone("topic", "A topic's path: each level opens with a lesson, and each topic has its own colour.")}
      <div style="height:5mm"></div>
      {detail("detail_basics", "<b>Basics.</b> The times tables, one square a fact: mastered, being learnt, or not yet practised.")}
    </div>
  </div>
"""

# ---------------------------------------------------------------- page 5
p5 = f"""
  <div class="eyebrow">Badges and celebrations</div>
  <h2>Every level is a badge, and good work gets its moment</h2>
  <div class="rule"></div>
  <p style="margin-bottom:4mm">Celebrations are short and calm: a tap skips to the end, and a
  setting turns them into a still picture. The sounds are gentle gong-chimes in the voice of
  the kulintang, and a phone on silent stays silent. Phones that can also give a short buzz.</p>

  <div class="shots" style="margin-bottom:5mm">
    <div style="width:52mm;flex:none">{phone("combo", "<b>A run.</b> Three right in a row lights the flame, and every fifth turns it gold.")}</div>
    <div style="width:52mm;flex:none">{phone("levelup", "<b>Level cleared.</b> The badge is earned, with the share right first time and the best run.")}</div>
    <div style="width:52mm;flex:none">{phone("streak", "<b>A daily streak.</b> Practising lights the day, and the flame counts the days in a row.")}</div>
  </div>

  <div style="display:flex;gap:6mm;align-items:flex-start">
    <div class="card" style="flex:1">
      <h3>Badges</h3>
      <ul style="font-size:9pt;margin:0">
        <li>{BADGES} level badges: one for every level on the path and in Basics.</li>
        <li>A topic's badge grows level by level: its rim fills, then laurels, a star, a gem
          and, at the last level, a crown.</li>
        <li>A badge is shiny when every first try in its level was right.</li>
        <li>Special badges mark streaks of 3, 7, 14 and 30 days, practice exam scores of 60, 75
          and 90 per cent, five missed questions put right, and coming back after time away.</li>
      </ul>
    </div>
    <div style="width:62mm;flex:none">{detail("detail_badges", "The collection. Up to three badges are pinned to the learner's profile.")}</div>
  </div>

  <div class="good" style="margin-top:auto">
    <b>No leaderboards, no loot boxes.</b> Badges reward a learner's own progress, never a rank
    against classmates, and a badge once earned is never taken away.
  </div>
"""

# ---------------------------------------------------------------- page 6
p6 = f"""
  <div class="eyebrow">Offline, comfort and design</div>
  <h2>Built for a cheap phone with no data left</h2>
  <div class="rule"></div>
  <p>The whole app is stored on the phone the first time it is opened. After that there is
  nothing to download and nothing to wait for: a learner can practise on a jeepney, at home with
  the data gone, or anywhere the signal drops. When there is no signal the app says so once,
  plainly, and gets out of the way: levels, Basics, exams and reviews all work the same, because
  none of them depends on a server.</p>
  <div style="display:flex;gap:6mm;align-items:center;margin-bottom:5mm">
    <div style="width:84mm;flex:none">{detail("detail_offline", "Offline: one line at the top, and nothing blocked.")}</div>
    <p style="flex:1;margin:0">Every control presses down when tapped, and nothing is smaller than
    48&nbsp;pixels. Right and wrong are shown in teal and coral rather than green and red, always
    with a symbol beside them.</p>
  </div>

  <h3 style="margin-bottom:2.5mm">Comfortable to use, day or night</h3>
  <div style="display:flex;gap:5mm;align-items:flex-start;justify-content:center;margin-bottom:4mm">
    <div style="width:40mm;flex:none">{phone("home", "Light")}</div>
    <div style="width:40mm;flex:none">{phone("home-dark", "Dark: it follows the phone, or the learner picks it")}</div>
    <div style="width:80mm;flex:none">{detail("detail_settings", "Settings on Profile: sound, vibration, calm animations, and the theme.")}</div>
  </div>

  <div class="grid3" style="margin-top:auto">
    <div class="card"><h3>Costs nothing to run</h3><p style="margin:0;font-size:9pt">No servers,
      no database, no monthly bill. It can stay online indefinitely.</p></div>
    <div class="card"><h3>Small enough to matter</h3><p style="margin:0;font-size:9pt">The whole
      app, questions included, is {SIZE:.1f}&nbsp;MB: about one photo from a phone camera.</p></div>
    <div class="card"><h3>Reads on any screen</h3><p style="margin:0;font-size:9pt">Phone, tablet
      and desktop, for a shared computer lab as well as a learner's own handset.</p></div>
  </div>
"""

# ---------------------------------------------------------------- page 7
def step(n, title, text):
    return f"""<div class="card" style="display:flex;gap:3.5mm;align-items:flex-start;padding:3mm 4mm">
        <span style="flex:none;width:7mm;height:7mm;border-radius:50%;background:#dbe8ff;color:#2458c9;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:9pt">{n}</span>
        <div><b style="font-size:9.5pt">{title}</b><p style="margin:0.5mm 0 0;font-size:9pt">{text}</p></div>
      </div>"""

p7 = f"""
  <div class="eyebrow">For teachers</div>
  <h2>Using it with a class</h2>
  <div class="rule"></div>
  <div style="display:flex;gap:7mm;margin-bottom:5mm">
    <div style="flex:1;display:flex;flex-direction:column;gap:3mm">
      {step(1, "Free and optional", "Learners open the link or scan the code on the cover. There is nothing to buy, so no learner should ever be asked to pay or contribute.")}
      {step(2, "Nothing for you to enter", "Teachers do not enter names, learner reference numbers or grades. Each learner's progress stays on their own phone.")}
      {step(3, "Phones in class", "Follow your school's rules on phones during lessons. The app works offline, so it suits homework and review at home just as well.")}
      {step(4, "What each learner needs", "A phone with an up-to-date browser, a few megabytes free, and a signal once, to open it the first time. On iPhone, add it to the home screen.")}
      {step(5, "An independent project", "Abante Minds is not a DepEd or PSHS product. Please do not present it as approved or endorsed by either.")}
      <h3 style="margin:2mm 0 0">Ways to use it</h3>
      <ul style="font-size:9pt;margin:0">
        <li>A level a day as homework: ten questions.</li>
        <li>The practice exam as a timed rehearsal: 20 questions in 30 minutes, with results by topic.</li>
        <li>Basics facts as a warm-up before a lesson.</li>
        <li>Missed questions come back on their own after one, three and seven days.</li>
      </ul>
    </div>
    <div style="width:54mm;flex:none">{phone("exam-result", "After a practice exam: the score, each topic, and the working for every question missed.")}</div>
  </div>

  <div class="note" style="margin-top:auto">
    <b>For researchers.</b> Each question is drawn from a recipe (its kind, how hard, and a number
    that fixes its values), so any question a learner met can be rebuilt exactly. The app keeps
    a record of each answer on the phone under a code such as
    <i style="white-space:nowrap">AM-7K2Q-9XD4</i> rather than a name. Sharing it with a
    researcher will be the learner's choice, behind a consent screen not yet built. The table of
    specifications ({ALL} competencies) and the item specifications for every kind of question
    are published with the source code.
  </div>
"""

# ---------------------------------------------------------------- page 8
def soon(title, text):
    return f"""<div class="card"><h3>{title}</h3><p style="margin:0;font-size:9pt">{text}</p></div>"""

p8 = f"""
  <div class="eyebrow">What's next</div>
  <h2>Coming next, and what to know now</h2>
  <div class="rule"></div>
  <div class="grid2" style="margin-bottom:5mm">
    {soon("A challenge round", "Two quick modes: a 60-second sprint, and a 90-second speed ladder that climbs as the learner gets questions right. Only levels already cleared, no lives, a personal best, challenge badges and a daily challenge.")}
    {soon("More questions", "New kinds of question and new wordings in every level, checked the same way as the ones there now.")}
    {soon("The other NCE subtests", "Science, verbal ability and abstract reasoning, each starting with a curriculum plan before any question is written.")}
    {soon("Moving progress to a new phone", "A way to carry a learner's progress to another phone, still with no account and no password.")}
  </div>

  <div class="note" style="margin-bottom:5mm">
    <b>Known limits, stated plainly.</b> Progress lives only on the phone: a phone that is wiped
    or replaced loses it, and there is no password to reset. On iPhone the app must be added to
    the home screen, or Safari may clear it after a week. The topics and weights are built from
    the curriculum and are not the exam's own. Only the mathematics subtest is covered; the NCE
    also tests science, verbal ability and abstract reasoning.
  </div>

  <h3 style="margin-bottom:2mm">Testing it: what helps most</h3>
  <ul style="font-size:9.5pt">
    <li>Use the phone a learner would. Older and cheaper phones show problems that newer ones hide.</li>
    <li>Try it with no signal: open it once, then turn on airplane mode and practise a level.</li>
    <li>On iPhone, add it to the home screen first: Share, then Add to Home Screen.</li>
    <li>Note anything wrong or unclear, such as a question, an answer or a hint. A screenshot that
      shows the topic and level is ideal.</li>
    <li>Say how long a level takes, and whether the questions feel too easy or too hard.</li>
  </ul>

  <div style="margin-top:auto;padding-top:4mm">
    <div class="rule" style="margin-bottom:4mm"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8mm">
      <div>
        <small class="muted">Status, {UPDATED}: all {len(TOPICS)} topics, Basics, the practice exam,
        review of missed questions, badges, difficulty that follows the learner, and dark mode are
        built and work offline. The challenge round, moving progress to a new phone, sharing
        answers with a researcher, and the other three subtests are not yet built.</small>
        {f'<p style="margin:3mm 0 0;font-size:9.5pt"><b>Questions or feedback:</b> {OWNER}, {CONTACT}</p>' if OWNER else ''}
      </div>
      <img src="{QR}" style="width:24mm;height:24mm;flex:none" alt="QR code to open Abante Minds">
    </div>
  </div>
"""

html = f"""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>Abante Minds — project overview, internal testing edition</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=Baloo+2:wght@600;700&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body>
{"".join(page(p, i + 1) for i, p in enumerate([p1, p2, p3, p4, p5, p6, p7, p8]))}
</body></html>"""

src = os.path.join(HERE, "overview.html")
io.open(src, "w", encoding="utf-8").write(html)
print(f"html: {len(html)/1024:.0f} KB -> {src}")
if not OWNER:
    print("note: no contact.json, so the PDF has no contact lines")
print(f"facts: {len(TOPICS)} topics, {TYPES} kinds of question, {MISTAKES} named mistakes, {BADGES} level badges, "
      f"{REACHED} of {REACHABLE} reachable competencies, {SIZE:.2f} MB")

out = os.path.abspath(ARGS[0]) if ARGS else os.path.join(HERE, "Abante-Minds-overview.pdf")
subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                "--virtual-time-budget=20000", f"--print-to-pdf={out}", src],
               check=True, capture_output=True, timeout=180)
print(f"pdf:  {os.path.getsize(out)/1024:.0f} KB -> {out}")
