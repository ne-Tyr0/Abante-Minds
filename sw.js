/* Abante Minds — service worker.
   A full session runs with no signal, so the shell is precached on install and
   served cache-first afterwards. Nothing here touches learner data: progress
   lives in localStorage and never leaves the phone. */
"use strict";

var CACHE = "abante-minds-v2";

var SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "app/app.css",
  "app/fonts.css",
  "assets/fonts/lexend-latin.woff2",
  "assets/fonts/lexend-latin-ext.woff2",
  "assets/fonts/baloo2-latin.woff2",
  "assets/fonts/baloo2-latin-ext.woff2",
  "app/icons.js",
  "app/ui.js",
  "app/content.js",
  "app/store.js",
  "app/screens.js",
  "app/app.js",
  "motion/motion.css",
  "motion/motion.js",
  "assets/abante-minds-mark.png",
  "assets/abante-minds-maskable.png",
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
        return cache.add(url).catch(function () { return null; });
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

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;

  var url = new URL(req.url);
  var sameOrigin = url.origin === self.location.origin;

  /* Navigations fall back to the cached shell, so a cold start with no signal
     still lands on the app rather than the browser's offline page. */
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(function () {
        return caches.match("index.html").then(function (r) { return r || caches.match("./"); });
      })
    );
    return;
  }

  /* Same-origin only. The font CDN used to be allowed through here; the faces are
     self-hosted now, so there is nothing third-party left to cache and no reason to
     let a cross-origin request past. */
  if (!sameOrigin) return;

  /* Stale-while-revalidate: the cached copy answers straight away, which is
     what a 2019 budget Android on no signal needs, and the network copy
     replaces it in the background so the next launch is current. */
  event.respondWith(
    caches.match(req).then(function (hit) {
      var network = fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (cache) { cache.put(req, copy).catch(function () {}); });
        }
        return res;
      }).catch(function () { return hit || caches.match("index.html"); });

      return hit || network;
    })
  );
});
