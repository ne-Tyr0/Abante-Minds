/* Abante Minds — the streak milestone picture.
   At a streak of 3, 7, 14 or 30 days the streak screen offers a picture to
   share. It is drawn here, on the phone, and handed to the phone's own share
   menu; nothing is uploaded, and it goes nowhere unless the learner sends it.
   It carries the streak and the first name only (owner's decision,
   3 November 2026), never a school, a code or a score. */
(function () {
  "use strict";

  var MILESTONES = [3, 7, 14, 30];
  var W = 1080, H = 1350;

  /* The first word of the name the learner gave, or nothing. */
  function firstName(name) {
    return (String(name || "").trim().split(/\s+/)[0] || "").slice(0, 20);
  }

  /* The longest streak milestone among newly earned badge keys, or null. */
  function milestone(keys) {
    var best = null;
    (keys || []).forEach(function (k) {
      var m = /^streak:(\d+)$/.exec(k);
      var n = m ? Number(m[1]) : 0;
      if (MILESTONES.indexOf(n) > -1 && (best === null || n > best)) best = n;
    });
    return best;
  }

  /* The line under the number: whose streak it is, if they gave a name. */
  function caption(days, name) {
    var who = firstName(name);
    return (who ? who + " practised" : "Practised") + " math " + days + " days in a row";
  }

  /* The app's flame, in fixed colours, as a picture the canvas can draw. */
  function flameImage() {
    var svg = AM.Flame(400, true).querySelector("svg").outerHTML
      .replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ')
      .replace("var(--action-700)", "#b85c00").replace("var(--action-500)", "#ff8a15");
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

  /* The picture, as a PNG blob. */
  function picture(days, name) {
    var fonts = document.fonts && document.fonts.load
      ? Promise.all(["800 300px 'Baloo 2'", "800 84px 'Baloo 2'", "500 44px 'Lexend'"].map(function (f) { return document.fonts.load(f); })).catch(function () {})
      : Promise.resolve();
    return Promise.all([fonts, flameImage(), markImage()]).then(function (got) {
      var canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      var c = canvas.getContext("2d");
      var bg = c.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#16295a"); bg.addColorStop(1, "#0b1630");
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      var glow = c.createRadialGradient(W / 2, 430, 0, W / 2, 430, 470);
      glow.addColorStop(0, "rgba(255, 176, 0, 0.42)"); glow.addColorStop(0.45, "rgba(255, 138, 21, 0.14)"); glow.addColorStop(1, "rgba(255, 138, 21, 0)");
      c.fillStyle = glow; c.fillRect(0, 0, W, H);
      c.drawImage(got[1], W / 2 - 200, 190, 400, 420);

      c.textAlign = "center";
      c.font = "800 300px 'Baloo 2', sans-serif";
      c.fillStyle = "#b85c00"; c.fillText(String(days), W / 2, 905);
      c.fillStyle = "#ffffff"; c.fillText(String(days), W / 2, 890);
      c.font = "800 84px 'Baloo 2', sans-serif";
      c.fillStyle = "#ffb000"; c.fillText("day streak!", W / 2, 1000);
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

  /* Hands a ready picture to the phone's share menu, or saves it where the
     phone cannot share pictures. Call it straight from the tap: a phone only
     opens its share menu in answer to one. Resolves "shared", "cancelled",
     "saved" or "failed". */
  function send(blob, days) {
    var fileName = "abante-minds-" + days + "-day-streak.png";
    var file = typeof File === "function" ? new File([blob], fileName, { type: "image/png" }) : null;
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      return navigator.share({ files: [file], text: days + " days of math practice in a row!" })
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
  window.AM.share = { MILESTONES: MILESTONES, firstName: firstName, milestone: milestone, caption: caption, picture: picture, send: send };
})();
