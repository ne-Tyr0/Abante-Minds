/* Abante Minds — pictures made on the phone: the streak milestone picture
   and the reward road's certificate of practice.
   At a milestone (app/road.js) the streak screen offers a picture to share.
   It is drawn here and handed to the phone's own share menu; nothing is
   uploaded, and it goes nowhere unless the learner sends it. It carries the
   streak and the first name only (owner's decision, 3 November 2026), never a
   school, a code or a score. A certificate carries the name as typed, as a
   family would print it, and still no school or score. */
(function () {
  "use strict";

  var W = 1080, H = 1350;
  /* The flame's four colours: its ledge, body, inner flame and core. */
  var FLAMES = {
    orange: ["#b85c00", "#ff8a15", "#ffb000", "#fff1b8"],
    blue: ["#1d4fc4", "#3b82f6", "#7cc7ff", "#e8f5ff"],
    purple: ["#6b21a8", "#a855f7", "#e2b4ff", "#fbf0ff"]
  };
  var GLOWS = {
    orange: ["rgba(255, 176, 0, 0.42)", "rgba(255, 138, 21, 0.14)", "rgba(255, 138, 21, 0)"],
    blue: ["rgba(124, 199, 255, 0.42)", "rgba(59, 130, 246, 0.14)", "rgba(59, 130, 246, 0)"],
    purple: ["rgba(226, 180, 255, 0.45)", "rgba(168, 85, 247, 0.14)", "rgba(168, 85, 247, 0)"]
  };

  /* The first word of the name the learner gave, or nothing. */
  function firstName(name) {
    return (String(name || "").trim().split(/\s+/)[0] || "").slice(0, 20);
  }

  /* The line under the number: whose streak it is, if they gave a name. */
  function caption(days, name) {
    var who = firstName(name);
    return (who ? who + " practised" : "Practised") + " math " + days + " days in a row";
  }

  /* The app's flame, in fixed colours, as a picture the canvas can draw. */
  function flameImage(flame) {
    var c = FLAMES[flame] || FLAMES.orange;
    var svg = AM.Flame(400, true).querySelector("svg").outerHTML
      .replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ')
      .replace("var(--flame-shelf, var(--action-700))", c[0]).replace("var(--flame-body, var(--action-500))", c[1])
      .replace("var(--flame-mid, #ffb000)", c[2]).replace("var(--flame-core, #fff1b8)", c[3]);
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    });
  }

  function lines(c, text, max) {
    var words = text.split(" "), out = [""];
    words.forEach(function (w) {
      var line = out[out.length - 1], next = line ? line + " " + w : w;
      if (c.measureText(next).width > max && line) out.push(w);
      else out[out.length - 1] = next;
    });
    return out;
  }

  function markImage() {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = "assets/abante-minds-mark.png";
    });
  }

  function fontsReady() {
    return document.fonts && document.fonts.load
      ? Promise.all(["800 300px 'Baloo 2'", "800 84px 'Baloo 2'", "500 44px 'Lexend'"].map(function (f) { return document.fonts.load(f); }))
        .then(function () { return document.fonts.ready; }).catch(function () {})
      : Promise.resolve();
  }

  /* The milestone picture, as a PNG blob, with the learner's flame. */
  function picture(days, name, flame) {
    return Promise.all([fontsReady(), flameImage(flame), markImage()]).then(function (got) {
      var canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      var c = canvas.getContext("2d");
      var bg = c.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#16295a"); bg.addColorStop(1, "#0b1630");
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      var tone = FLAMES[flame] ? flame : "orange", g = GLOWS[tone];
      var glow = c.createRadialGradient(W / 2, 430, 0, W / 2, 430, 470);
      glow.addColorStop(0, g[0]); glow.addColorStop(0.45, g[1]); glow.addColorStop(1, g[2]);
      c.fillStyle = glow; c.fillRect(0, 0, W, H);
      c.drawImage(got[1], W / 2 - 200, 190, 400, 420);

      c.textAlign = "center";
      c.font = "800 300px 'Baloo 2', sans-serif";
      c.fillStyle = FLAMES[tone][0]; c.fillText(String(days), W / 2, 905);
      c.fillStyle = "#ffffff"; c.fillText(String(days), W / 2, 890);
      c.font = "800 84px 'Baloo 2', sans-serif";
      c.fillStyle = FLAMES[tone][2]; c.fillText("day streak!", W / 2, 1000);
      c.font = "500 44px 'Lexend', sans-serif";
      c.fillStyle = "rgba(255, 255, 255, 0.86)";
      lines(c, caption(days, name), W - 200).forEach(function (l, i) { c.fillText(l, W / 2, 1090 + i * 58); });
      c.font = "800 52px 'Baloo 2', sans-serif";
      c.fillStyle = "#ffffff";
      var mark = got[2], label = "Abante Minds", tw = c.measureText(label).width, size = 64, gap = 18;
      if (mark) {
        var x = (W - (size + gap + tw)) / 2;
        c.drawImage(mark, x, 1226, size, size);
        c.textAlign = "left"; c.fillText(label, x + size + gap, 1274);
      } else c.fillText(label, W / 2, 1274);
      return new Promise(function (resolve) { canvas.toBlob(resolve, "image/png"); });
    });
  }

  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function longDate(iso) {
    var p = String(iso).split("-");
    return Number(p[2]) + " " + MONTHS[Number(p[1]) - 1] + " " + p[0];
  }
  /* What a certificate says the learner did: the streak, or the levels, by
     whichever its step was reached. */
  function certificateLine(o) {
    return o.by === "levels" ? "for clearing " + o.levels + " levels of Grade 6 math"
      : "for practising math " + o.days + " days in a row";
  }

  /* A certificate of practice, landscape like a printed one, as a PNG blob:
     parchment in a double gold border with a band of diamonds, the mark,
     the name, what it was earned for, the date, and a gold seal on red
     ribbons with the step of the road (the owner's choice, November 2026:
     a real certificate). Drawn at 600 x 420 and scaled up.
     o: {name, by, days, levels, day, year, step}. */
  function certificate(o) {
    var S = 8 / 3, CW = 1600, CH = 1120;
    return Promise.all([fontsReady(), markImage()]).then(function (got) {
      var canvas = document.createElement("canvas");
      canvas.width = CW; canvas.height = CH;
      var c = canvas.getContext("2d");
      c.scale(S, S);
      function rule(x1, y1, x2, y2) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
      function spaced(px) { if ("letterSpacing" in c) c.letterSpacing = px; }
      c.fillStyle = "#fffaf0"; c.fillRect(0, 0, 600, 420);
      c.strokeStyle = "#c99a2e"; c.lineWidth = 3; c.strokeRect(18, 18, 564, 384);
      c.globalAlpha = 0.55; c.lineWidth = 1.2; c.strokeRect(26, 26, 548, 368); c.globalAlpha = 1;
      c.strokeStyle = "rgba(123, 108, 246, 0.45)"; c.lineWidth = 1.4;
      for (var k = 0; k < 24; k++) {
        [42, 378].forEach(function (y) { c.save(); c.translate(54 + k * 21.5, y); c.rotate(Math.PI / 4); c.strokeRect(-4, -4, 8, 8); c.restore(); });
      }
      var mark = got[1];
      if (mark) c.drawImage(mark, 281, 65, 38, 38);
      else { c.beginPath(); c.arc(300, 84, 19, 0, 6.2832); c.fillStyle = "#5b4de2"; c.fill(); }
      c.textAlign = "center";
      c.fillStyle = "#8a7a55"; c.font = "500 12px 'Lexend', sans-serif"; spaced("3px");
      c.fillText("ABANTE MINDS", 300, 124); spaced("0px");
      c.fillStyle = "#16295a"; c.font = "800 38px 'Baloo 2', sans-serif";
      c.fillText(o.year ? "A Year of Practice" : "Certificate of Practice", 300, 166);
      c.fillStyle = "#5b5b6b"; c.font = "400 14px 'Lexend', sans-serif";
      c.fillText("This is to certify that", 300, 196);
      var name = String(o.name || "").trim() || "A Grade 6 learner", size = 46;
      c.font = "800 " + size + "px 'Baloo 2', sans-serif";
      while (c.measureText(name).width > 430 && size > 22) { size -= 2; c.font = "800 " + size + "px 'Baloo 2', sans-serif"; }
      c.fillStyle = "#4f40cf"; c.fillText(name, 300, 246);
      c.strokeStyle = "#c99a2e"; c.lineWidth = 1.5; rule(160, 258, 440, 258);
      c.fillStyle = "#3b3b4b"; c.font = "400 14px 'Lexend', sans-serif";
      c.fillText(o.step ? "reached step " + o.step + " of the reward road" : "is awarded this certificate", 300, 286);
      c.fillText(certificateLine(o) + ".", 300, 306);
      c.textAlign = "left";
      c.fillStyle = "#3b3b4b"; c.font = "600 14px 'Lexend', sans-serif"; c.fillText(longDate(o.day), 84, 344);
      c.strokeStyle = "#c99a2e"; c.lineWidth = 1.2; rule(84, 352, 236, 352);
      c.fillStyle = "#8a8a9a"; c.font = "400 11px 'Lexend', sans-serif"; c.fillText("Date", 84, 368);
      /* The seal: gold, on two red ribbons, with the step (or the days or
         levels it was reached by). */
      c.save(); c.translate(486, 326);
      function poly(pts, fill) { c.beginPath(); pts.forEach(function (q, i) { if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.closePath(); c.fillStyle = fill; c.fill(); }
      poly([[-16, 30], [-26, 66], [-8, 56], [2, 72], [8, 34]], "#d6453a");
      poly([[16, 30], [26, 66], [8, 56], [-2, 72], [-8, 34]], "#b8352c");
      c.fillStyle = "#e9b93a";
      for (k = 0; k < 16; k++) { var an = k / 16 * Math.PI * 2; c.beginPath(); c.arc(34 * Math.cos(an), 34 * Math.sin(an), 9, 0, 6.2832); c.fill(); }
      c.beginPath(); c.arc(0, 0, 31, 0, 6.2832); c.fillStyle = "#f5c84a"; c.fill();
      c.beginPath(); c.arc(0, 0, 25, 0, 6.2832); c.strokeStyle = "rgba(255, 255, 255, 0.7)"; c.lineWidth = 1.5; c.stroke();
      c.textAlign = "center"; c.fillStyle = "#6e4d00";
      c.font = "700 9px 'Lexend', sans-serif"; spaced("1px");
      c.fillText(o.step ? "STEP" : o.by === "levels" ? "LEVELS" : "DAYS", 0, -3); spaced("0px");
      c.font = "800 22px 'Baloo 2', sans-serif";
      c.fillText(String(o.step || (o.by === "levels" ? o.levels : o.days)), 0, 17);
      c.restore();
      return new Promise(function (resolve) { canvas.toBlob(resolve, "image/png"); });
    });
  }

  /* Hands a ready picture to the phone's share menu, or saves it where the
     phone cannot share pictures. Call it straight from the tap: a phone only
     opens its share menu in answer to one. Resolves "shared", "cancelled",
     "saved" or "failed". */
  function send(blob, fileName, text) {
    var file = typeof File === "function" ? new File([blob], fileName, { type: "image/png" }) : null;
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      return navigator.share({ files: [file], text: text })
        .then(function () { return "shared"; }, function (e) { return e && e.name === "AbortError" ? "cancelled" : "failed"; });
    }
    try {
      var url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      return Promise.resolve("saved");
    } catch (e) {
      return Promise.resolve("failed");
    }
  }

  window.AM = window.AM || {};
  window.AM.share = { FLAMES: FLAMES, firstName: firstName, caption: caption, picture: picture, certificateLine: certificateLine, longDate: longDate, certificate: certificate, send: send };
})();
