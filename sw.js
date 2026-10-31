/* Abante Minds — service worker.
   A full session runs with no signal, so the shell is precached on install and
   served cache-first afterwards. Nothing here touches learner data: progress
   lives in localStorage and never leaves the phone. */
"use strict";

var CACHE = "abante-minds-v62";

var SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "app/app.css",
  "app/fonts.css",
  "assets/fonts/lexend-latin.woff2",
  "assets/fonts/lexend-latin-ext.woff2",
  "assets/fonts/baloo2-latin.woff2",
  "app/icons.js",
  "app/ui.js",
  "app/badgeart.js",
  "app/content.js",
  "app/entry.js",
  "app/facts.js",
  "app/challenge.js",
  "app/insights.js",
  "app/readiness.js",
  "app/store.js",
  "app/screens.js",
  "app/app.js",
  /* The question pack. content.js fetches it on every launch, so it must be
     here for the first launch with no signal. */
  "content/packs/math/manifest.json",
  "content/packs/math/decimals.json",
  "content/packs/math/fractions.json",
  "content/packs/math/gemdas.json",
  "content/packs/math/factors.json",
  "content/packs/math/ratio.json",
  "content/packs/math/percent.json",
  "content/packs/math/add-subtract.json",
  "content/packs/math/times.json",
  "content/packs/math/mental.json",
  "content/packs/math/written.json",
  "content/packs/math/missing.json",
  "content/packs/math/equivalents.json",
  "content/packs/math/powers.json",
  "content/packs/math/area.json",
  "content/packs/math/solids.json",
  "content/packs/math/circles.json",
  "content/packs/math/probability.json",
  "content/packs/math/data.json",
  "content/packs/math/time.json",
  "content/packs/math/transform.json",
  "motion/motion.css",
  "motion/motion.js",
  "motion/sound.js",
  "motion/moments.js",
  "assets/abante-minds-mark.png",
  "assets/abante-minds-maskable.png",
  "assets/abante-minds-apple-touch.png",
  /* styles.css and tokens/fonts.css are deliberately absent: index.html lists the
     token files individually and loads app/fonts.css instead, so the CDN import in
     tokens/fonts.css is never reached. */
  "_ds/abante-minds-design-system-561b7534-fa3f-47b6-9ed0-b8f880eb666b/tokens/colors.css",
  "_ds/abante-minds-design-system-561b7534-fa3f-47b6-9ed0-b8f880eb666b/tokens/typography.css",
  "_ds/abante-minds-design-system-561b7534-fa3f-47b6-9ed0-b8f880eb666b/tokens/spacing.css",
  "_ds/abante-minds-design-system-561b7534-fa3f-47b6-9ed0-b8f880eb666b/tokens/depth.css",
  "_ds/abante-minds-design-system-561b7534-fa3f-47b6-9ed0-b8f880eb666b/foundations/press.css"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      /* One missing file must not fail the whole install — a shell that is 90%
         cached still opens without signal. */
      return Promise.all(SHELL.map(function (url) {
        /* no-cache: past the browser's own cache, or this release could keep a
           file from the last one, with nothing to replace it until the next. */
        return cache.add(new Request(url, { cache: "no-cache" })).catch(function () { return null; });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Everything is answered from the phone first, so the app opens at once on no
   signal, on bad signal and on a budget Android, and opening it uses no data.
   A release changes CACHE, and that new install is how new files arrive, all
   together, so a phone never runs a mix of two releases. The browser checks
   sw.js for itself each time the app is opened. */
var DEV = /^(localhost|127\.0\.0\.1)$/.test(self.location.hostname);

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;

  var url = new URL(req.url);
  /* Same-origin only: the faces are self-hosted, so nothing third-party is left. */
  if (url.origin !== self.location.origin) return;

  /* On a dev server the files on disk win, and the cache still answers offline. */
  if (DEV) {
    event.respondWith(fetch(req).catch(function () {
      return caches.match(req).then(function (hit) { return hit || (req.mode === "navigate" ? caches.match("index.html") : Response.error()); });
    }));
    return;
  }

  /* Opening the app, by the home-screen icon or the link, is the shell. Any
     other page on the site, such as the screenshot harness, is its own. */
  var scope = new URL(self.registration.scope).pathname;
  var isApp = url.pathname === scope || url.pathname === scope + "index.html";
  var lookup = req.mode === "navigate" && isApp ? "index.html" : req;

  event.respondWith(
    caches.match(lookup).then(function (hit) {
      if (hit) return hit;
      /* Not stored, such as a file a failed install missed: fetch it and keep it. */
      return fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (cache) { cache.put(req, copy).catch(function () {}); });
        }
        return res;
      }).catch(function () {
        return req.mode === "navigate" ? caches.match("index.html") : Response.error();
      });
    })
  );
});
