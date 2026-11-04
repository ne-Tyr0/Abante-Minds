/* The app page's Content Security Policy: the browser runs only the app's own
   scripts and sends requests only to the app's own site, so even a bug or a
   tampered file could not send a learner's data anywhere else. The one inline
   script (the theme before first paint) is allowed by its hash, which this
   recomputes, so editing that script means running this again.

   Run:  node tools/csp.js           writes the policy into index.html
         node tools/csp.js --check   exits 1 if the policy is missing or out of date (CI) */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const FILE = path.join(__dirname, "..", "index.html");

/* The policy for a page whose inline scripts have these hashes. Styles may be
   inline: the screens set them on every element. Images may be data: or blob:
   for the pictures drawn on the phone. frame-ancestors cannot be set from a
   meta tag, and GitHub Pages sets no headers, so it is left out. */
function policy(hashes) {
  return [
    "default-src 'self'",
    "script-src 'self' " + hashes.map((h) => "'sha256-" + h + "'").join(" "),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'"
  ].join("; ");
}

/* Every inline <script> on the page (one with no src), hashed as the browser
   does. index.html is LF everywhere (.gitattributes), as the site serves it. */
function inlineHashes(html) {
  return [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => crypto.createHash("sha256").update(m[1].split("\r\n").join("\n"), "utf8").digest("base64"));
}

const TAG = /<meta http-equiv="Content-Security-Policy" content="[^"]*">/;
function expected(html) {
  return '<meta http-equiv="Content-Security-Policy" content="' + policy(inlineHashes(html)) + '">';
}

function main() {
  const html = fs.readFileSync(FILE, "utf8");
  const want = expected(html);
  const have = (html.match(TAG) || [])[0];
  if (process.argv.includes("--check")) {
    if (have === want) { console.log("index.html's security policy is current"); return; }
    console.log(have ? "index.html's security policy is out of date: run node tools/csp.js" : "index.html has no security policy: run node tools/csp.js");
    process.exit(1);
  }
  if (have) fs.writeFileSync(FILE, html.replace(TAG, want));
  else fs.writeFileSync(FILE, html.replace('<meta charset="utf-8">\n', '<meta charset="utf-8">\n' + want + "\n"));
  console.log("wrote the security policy into index.html");
}

module.exports = { policy: policy, inlineHashes: inlineHashes, expected: expected };
if (require.main === module) main();
