"""Build the Abante Minds overview PDF.

Renders an A4 document in the app's own design tokens, embeds the screenshots
from capture.py as data URIs, and prints it with headless Chrome.

    python tools/overview-pdf/build.py [out.pdf]

See README.md in this folder for the full sequence.
"""
import base64, io, os, subprocess, sys

# The page copy below predates the Grade 6 / PSHS NCE retarget: it says Grade 9,
# names the wrong exam, promises that nothing ever leaves the phone, and describes
# the removed sync as a feature. Rewrite it (RESEARCH-PLAN.md Phase 0 item 4),
# then set this to False. --allow-stale builds it anyway, to test the pipeline
# only. Never send what that produces.
COPY_IS_STALE = True
ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
if COPY_IS_STALE and "--allow-stale" not in sys.argv:
    sys.exit("build.py: the page copy is out of date and must be rewritten before "
             "this PDF is built. See tools/overview-pdf/README.md.")

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, "shots")
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
CHROME = os.environ.get("CHROME", r"C:\Program Files\Google\Chrome\Application\chrome.exe")

if not os.path.isdir(SHOTS):
    sys.exit("No screenshots yet. Run capture.py first; see README.md.")


def data_uri(path):
    with open(path, "rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode()


SHOT = {n: data_uri(os.path.join(SHOTS, n + ".png"))
        for n in ["splash", "home", "topics", "practice", "hint", "correct",
                  "wrong", "tierup", "summary", "profile", "offline",
                  "detail_hint", "detail_correct", "detail_tierup"]}
MARK = data_uri(os.path.join(REPO, "assets", "abante-minds-mark.png"))


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

.topic { display:flex; gap:3mm; align-items:flex-start; }
.swatch { width:7mm; height:7mm; border-radius:2mm; flex:none; margin-top:0.5mm; }
.pill { display:inline-block; padding:0.8mm 2.5mm; border-radius:99px;
        font-size:8pt; font-weight:600; }
.chips { display:flex; gap:2mm; flex-wrap:wrap; margin-top:2mm; }
.chip { font-size:7.5pt; padding:1mm 2.5mm; border-radius:99px;
        background:#eef3fb; color:#51617a; border:1px solid #dbe7f8; }
.note { background:#fde3d2; border-left:3px solid #c1440e; border-radius:0 3mm 3mm 0;
        padding:3mm 4mm; font-size:9pt; }
.good { background:#d3f3ea; border-left:3px solid #0b7a63; border-radius:0 3mm 3mm 0;
        padding:3mm 4mm; font-size:9pt; }
"""


def page(inner, n, total=6):
    return f"""<section class="page">{inner}
  <div class="foot"><span>Abante Minds &middot; project overview</span>
  <span>{n} / {total}</span></div></section>"""


# ---------------------------------------------------------------- page 1
p1 = f"""
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center">
    <img src="{MARK}" style="width:32mm;height:32mm;object-fit:contain;margin-bottom:6mm">
    <h1 style="font-size:40pt">Abante Minds</h1>
    <p class="lede" style="max-width:120mm;font-size:13pt;margin-bottom:8mm">
      NCE math practice that keeps working when the signal does not.
    </p>
    <div style="width:22mm;height:2px;background:#ff8a15;border-radius:2px;margin-bottom:8mm"></div>
    <p class="muted" style="max-width:130mm">
      A practice app for Grade&nbsp;9 learners preparing for the National Career Entrance
      examination. It installs to the home screen, runs a full session with no data,
      and keeps every learner's progress on their own phone.
    </p>
    <div class="chips" style="justify-content:center;margin-top:6mm">
      <span class="chip">Works offline</span>
      <span class="chip">No account needed</span>
      <span class="chip">Free to run</span>
      <span class="chip">Installs from a QR code</span>
    </div>
  </div>
  <div style="text-align:center"><small class="muted">Project overview &middot; 30 September 2026</small></div>
"""

# ---------------------------------------------------------------- page 2
p2 = f"""
  <div class="eyebrow">What it is</div>
  <h2>Ten questions at a time, on the phone already in their pocket</h2>
  <div class="rule"></div>
  <div style="display:flex;gap:7mm">
    <div style="flex:1">
      <p>A learner opens Abante Minds, picks one of four topics, and answers ten
      questions. Every question comes with three hints they can reveal and three
      worked steps if they get it wrong. A session takes about nine minutes.</p>

      <p>The questions are set in places learners recognise &mdash; a sari-sari store
      marking up stock, a fish vendor pricing by the kilo, change from a hundred-peso
      bill &mdash; because the NCE tests the same arithmetic in the same everyday framing.</p>

      <h3>Why it works without signal</h3>
      <p>The whole app is stored on the phone the first time it is opened. After that
      there is nothing to download and nothing to wait for. A learner can practise on a
      jeepney, at home with the data gone, or anywhere the signal drops &mdash; and their
      streak and tier still move.</p>

      <h3>What a teacher needs to do</h3>
      <p>Share a link or put a QR code on the board. There are no accounts to create, no
      class lists to maintain, and no logins for anyone to forget.</p>

      <div class="good">
        <b>Nothing leaves the phone.</b> No sign-up, no email, no analytics, no server.
        A learner's name and progress are stored on their own device and nowhere else.
      </div>
    </div>
    <div style="width:68mm;flex:none">{phone("home", "Home &mdash; tier, streak and what to do next")}</div>
  </div>

  <div style="margin-top:auto">
    <div class="rule" style="margin-bottom:4mm"></div>
    <h3 style="margin-bottom:3mm">A session, start to finish</h3>
    <div style="display:flex;gap:3mm">
      <div class="fact" style="flex:1"><b>1</b><span>Pick a topic</span></div>
      <div class="fact" style="flex:1"><b>2</b><span>Answer on the keypad</span></div>
      <div class="fact" style="flex:1"><b>3</b><span>Check &mdash; see why</span></div>
      <div class="fact" style="flex:1"><b>4</b><span>Ten questions</span></div>
      <div class="fact" style="flex:1"><b>5</b><span>Summary and streak</span></div>
    </div>
  </div>
"""

# ---------------------------------------------------------------- page 3
p3 = f"""
  <div class="eyebrow">The practice loop</div>
  <h2>Answer, check, and find out why</h2>
  <div class="rule"></div>
  <p style="margin-bottom:4mm">Computation questions have no multiple choice and no calculator
  &mdash; the on-screen keypad is the only way in, so a learner has to actually work the answer out.</p>

  <div class="shots" style="margin-bottom:5mm">
    <div style="width:55mm;flex:none">{phone("practice", "<b>Answering.</b> The question keeps the most room on the screen, and the keypad is the only input.")}</div>
    <div style="width:55mm;flex:none">{phone("wrong", "<b>Not yet.</b> Names the specific mistake, then opens the first worked step and holds the other two back.")}</div>
  </div>

  <div class="shots" style="align-items:stretch;margin-bottom:4mm">
    {detail("detail_hint", "<b>Three hints, revealed one at a time.</b> Using every one still counts the question &mdash; asking for help is never penalised.")}
    {detail("detail_correct", "<b>Correct.</b> The working is shown even when the answer was right, because that is what transfers to the next question.")}
  </div>

  <div class="good" style="margin-top:auto">
    <b>The scaffold is the point.</b> A learner who cannot do a question is walked through it a
    step at a time rather than just marked wrong, and the same question type returns later with
    different numbers.
  </div>
"""

# ---------------------------------------------------------------- page 4
TOPICS = [
    ("#4c46b0", "#e3e2fa", "Change and money", "Making change, unit prices, splitting a bill, what is left after spending."),
    ("#0b7a89", "#d1eef2", "Percentages", "Mark-ups, discounts, percentage of a quantity, and what per cent one number is of another."),
    ("#8c3379", "#f5dcef", "Ratio and rate", "Unit rates, scaling a recipe, distance and speed, sharing in a ratio."),
    ("#8a670a", "#f5ecc8", "Measurement", "Perimeter and area, unit conversion, volume, and time."),
]
topic_rows = "".join(f"""
  <div class="topic" style="margin-bottom:3.5mm">
    <div class="swatch" style="background:{c}"></div>
    <div><b style="font-size:10pt">{name}</b><br><span class="muted" style="font-size:9pt">{desc}</span></div>
  </div>""" for c, _, name, desc in TOPICS)

p4 = f"""
  <div class="eyebrow">Topics and progression</div>
  <h2>Four topics, twenty correct answers each</h2>
  <div class="rule"></div>
  <div style="display:flex;gap:7mm;flex:1">
    <div style="flex:1">
      {topic_rows}
      <h3 style="margin-top:5mm">Climbing the tiers</h3>
      <p>Twenty correct answers on a tier opens the next one, and there are four. Higher
      tiers ask longer questions. The one full-screen celebration in the whole app is
      reserved for reaching a new tier &mdash; everywhere else the tone stays calm.</p>

      <h3>Streaks, without the guilt</h3>
      <p>Practising on consecutive days builds a streak. Missing a day resets it and drops
      the learner one tier, which five correct answers in a row restores. The app states
      this in a plain card inside the ordinary screen. There is no alarm, no red, and the
      next question is already waiting.</p>

      <div class="note" style="margin-top:4mm">
        <b>Questions never run out.</b> Each topic is built from templates rather than a
        fixed list, so the numbers and names change every time. A learner who practises
        daily for a year will not reach the end of the bank.
      </div>
    </div>
    <div style="width:56mm;flex:none">
      {phone("topics", "Picking a topic. Progress and stars show per topic.")}
      <div style="height:5mm"></div>
      {detail("detail_tierup", "Reaching a new tier &mdash; the one full-screen celebration in the app.")}
    </div>
  </div>
"""

# ---------------------------------------------------------------- page 5
p5 = f"""
  <div class="eyebrow">Offline, privacy and design</div>
  <h2>Built for a cheap phone with no data left</h2>
  <div class="rule"></div>
  <div style="display:flex;gap:7mm;margin-bottom:5mm">
    <div style="flex:1.3">
      <p>When there is no signal the app says so once, plainly, and then gets out of the
      way. Answers are counted immediately and held on the phone; when signal returns the
      app mentions it is catching up but never makes the learner wait.</p>
      <p style="margin-bottom:4mm">Tiers and streaks move whether or not there is a
      connection, because none of the progression depends on a server.</p>
      <div class="card">
        <h3>The design system</h3>
        <p style="margin:0 0 2.5mm">The interface is built on a small set of fixed rules rather
        than page-by-page decisions.</p>
        <table>
          <tr><td class="k">Colour</td><td>One amber, used for the primary action and nothing
            else. Each topic owns a hue. Gold appears only on a tier-up.</td></tr>
          <tr><td class="k">Feedback</td><td>Teal and coral rather than green and red, always
            paired with a symbol.</td></tr>
          <tr><td class="k">Touch</td><td>Every control sits on a visible shelf and presses
            down when tapped. Nothing smaller than 48&nbsp;pixels.</td></tr>
          <tr><td class="k">Type</td><td>Lexend for reading, chosen for legibility. A rounded
            display face appears only in the celebration.</td></tr>
        </table>
      </div>
    </div>
    <div style="flex:1">{phone("offline", "Offline. The banner states the fact and never blocks the next action.")}</div>
  </div>

  <div class="grid3">
    <div class="card"><h3>Costs nothing to run</h3><p style="margin:0;font-size:9pt">No servers,
      no database, no monthly bill. It can stay online indefinitely.</p></div>
    <div class="card"><h3>Small enough to matter</h3><p style="margin:0;font-size:9pt">The whole
      app is a fraction of a single photo &mdash; it will not eat a prepaid load.</p></div>
    <div class="card"><h3>Reads on any screen</h3><p style="margin:0;font-size:9pt">Phone, tablet
      and desktop, for a shared computer lab as well as a personal handset.</p></div>
  </div>
"""

# ---------------------------------------------------------------- page 6
p6 = f"""
  <div class="eyebrow">Where it is going</div>
  <h2>Next: the learner's own language, and moving between phones</h2>
  <div class="rule"></div>

  <div style="display:flex;gap:7mm;margin-bottom:5mm">
    <div style="flex:1.4">
      <h3>A language ladder, not a language switch</h3>
      <p style="margin-bottom:3mm">The plan is not simply to translate the app. A learner
      starts in their own language and is moved towards English as they climb the tiers, so
      that by the time they sit the NCE the exam's phrasing is already familiar. Mathematical
      words &mdash; <i>percent</i>, <i>ratio</i>, <i>item</i> &mdash; stay in English from the
      very first question. Tagalog and Cebuano come first.</p>
      <table style="margin-bottom:4mm">
        <tr><th>Tier</th><th>What the learner reads</th></tr>
        <tr><td class="k">Tier 1</td><td><i>Nagpalit si Ana ug pan nga &#8369;63&hellip; Pila ang sukli?</i></td></tr>
        <tr><td class="k">Tier 2</td><td><i>Nagpalit si Ana ug pan nga &#8369;63&hellip;</i> How much change should she get?</td></tr>
        <tr><td class="k">Tier 3</td><td>Ana buys bread for &#8369;63&hellip; How much change <b>(sukli)</b> should she get?</td></tr>
        <tr><td class="k">Tier 4</td><td>Ana purchases bread costing &#8369;63 and tenders &#8369;100. Determine the change due.</td></tr>
      </table>
      <p style="font-size:9pt" class="muted">A learner who finds a question hard can always drop
      back a rung for that question without losing their place.</p>
    </div>
    <div style="width:56mm;flex:none">{phone("summary", "End of a session: what was attempted, and what to do next.")}</div>
  </div>

  <div class="grid2" style="margin-bottom:4mm">
    <div class="card">
      <h3>Moving to a new phone</h3>
      <p style="margin:0">Because nothing is stored on a server, progress travels as a short
      code the learner can scan or write down &mdash; twenty characters, no password, no account.
      It doubles as a backup if the phone is wiped.</p>
    </div>
    <div class="card">
      <h3>A teacher can check in</h3>
      <p style="margin:0">A learner can show that same code as a QR for a teacher to scan.
      The class list is built on the teacher's own phone. Still no server, and still nothing
      collected centrally.</p>
    </div>
  </div>

  <div class="note">
    <b>Known limits, stated plainly.</b> Because progress lives only on the device, a phone that
    is wiped or replaced loses everything unless the learner saved their code &mdash; there is no
    password reset. On iPhone the app must be added to the home screen or the phone clears it
    after a week. And four topics is a useful slice of the NCE, not the whole syllabus.
  </div>

  <div style="margin-top:auto;padding-top:4mm">
    <div class="rule" style="margin-bottom:3mm"></div>
    <div style="display:flex;justify-content:space-between;align-items:flex-end">
      <div><small class="muted">Status: the practice loop, all four topics, tiers, streaks and
      offline use are built and working. The language ladder, progress code and teacher
      check-in are designed and not yet built.</small></div>
      <img src="{MARK}" style="width:13mm;height:13mm;object-fit:contain;opacity:.9">
    </div>
  </div>
"""

html = f"""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>Abante Minds — project overview</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=Baloo+2:wght@600;700&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body>
{page(p1,1)}{page(p2,2)}{page(p3,3)}{page(p4,4)}{page(p5,5)}{page(p6,6)}
</body></html>"""

src = os.path.join(HERE, "overview.html")
io.open(src, "w", encoding="utf-8").write(html)
print(f"html: {len(html)/1024:.0f} KB -> {src}")

out = os.path.abspath(ARGS[0]) if ARGS else os.path.join(HERE, "Abante-Minds-overview.pdf")
subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                "--virtual-time-budget=20000", f"--print-to-pdf={out}", src],
               check=True, capture_output=True, timeout=180)
print(f"pdf:  {os.path.getsize(out)/1024:.0f} KB -> {out}")
