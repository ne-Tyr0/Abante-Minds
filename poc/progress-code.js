/* Proof of concept: the progress code. NOT shipped code.

   Claim: a learner's whole state fits in a code short enough to write in the
   back of a notebook, with no server anywhere. This packs it into 12 bytes,
   checksums it, renders it in Crockford base32 (no I/L/O/U, so it survives
   handwriting), and proves the round trip plus rejection of every
   single-character typo.

   Run:  node poc/progress-code.js        Exits 1 if any claim fails. */
"use strict";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford
const EPOCH = Date.UTC(2026, 0, 1);

/* ---------- bit packing ---------- */
class Bits {
  constructor() { this.bytes = []; this.bit = 0; this.cur = 0; }
  write(value, width) {
    for (let i = width - 1; i >= 0; i--) {
      this.cur = (this.cur << 1) | ((value >> i) & 1);
      if (++this.bit === 8) { this.bytes.push(this.cur); this.cur = 0; this.bit = 0; }
    }
  }
  finish() { if (this.bit) { this.cur <<= (8 - this.bit); this.bytes.push(this.cur); } return this.bytes; }
}
class Reader {
  constructor(bytes) { this.bytes = bytes; this.pos = 0; }
  read(width) {
    let v = 0;
    for (let i = 0; i < width; i++) {
      const byte = this.bytes[this.pos >> 3] || 0;
      v = (v << 1) | ((byte >> (7 - (this.pos & 7))) & 1);
      this.pos++;
    }
    return v;
  }
}

/* ---------- the schema: 82 bits ---------- */
const TOPICS = ["money", "percent", "ratio", "measure"];
const FIELDS = [
  ["version", 4], ["tier", 2], ["tierProgress", 5],
  ["t0", 5], ["t1", 5], ["t2", 5], ["t3", 5],
  ["streakDays", 9], ["totalCorrect", 14], ["day", 15],
  ["week", 7], ["lastTopic", 2], ["demoted", 1], ["recoveryRun", 3],
];

function crc8(bytes) {
  let crc = 0;
  for (const b of bytes) {
    crc ^= b;
    for (let i = 0; i < 8; i++) crc = (crc & 0x80) ? ((crc << 1) ^ 0x07) & 0xff : (crc << 1) & 0xff;
  }
  return crc;
}

function encode(state) {
  const day = Math.round((Date.parse(state.lastActiveDay + "T00:00:00Z") - EPOCH) / 86400000);
  const weekBits = state.week.reduce((acc, on, i) => acc | (on ? 1 << (6 - i) : 0), 0);
  const v = {
    version: 1, tier: state.tier - 1, tierProgress: state.tierProgress,
    t0: state.topics[TOPICS[0]], t1: state.topics[TOPICS[1]],
    t2: state.topics[TOPICS[2]], t3: state.topics[TOPICS[3]],
    streakDays: Math.min(511, state.streakDays), totalCorrect: Math.min(16383, state.totalCorrect),
    day, week: weekBits, lastTopic: TOPICS.indexOf(state.lastTopic),
    demoted: state.demoted ? 1 : 0, recoveryRun: state.recoveryRun,
  };
  const bits = new Bits();
  for (const [name, width] of FIELDS) bits.write(v[name], width);
  const body = bits.finish();
  const payload = body.concat([crc8(body)]);

  let out = "", acc = 0, accBits = 0;
  for (const byte of payload) {
    acc = (acc << 8) | byte; accBits += 8;
    while (accBits >= 5) { out += ALPHABET[(acc >> (accBits - 5)) & 31]; accBits -= 5; }
  }
  if (accBits) out += ALPHABET[(acc << (5 - accBits)) & 31];
  return { code: out.match(/.{1,5}/g).join("-"), bytes: payload.length };
}

function decode(code) {
  const clean = code.toUpperCase().replace(/[^0-9A-Z]/g, "")
    .replace(/O/g, "0").replace(/[IL]/g, "1").replace(/U/g, "V"); // handwriting rescue
  let acc = 0, accBits = 0; const bytes = [];
  for (const ch of clean) {
    const idx = ALPHABET.indexOf(ch);
    if (idx < 0) throw new Error("bad character: " + ch);
    acc = (acc << 5) | idx; accBits += 5;
    if (accBits >= 8) { bytes.push((acc >> (accBits - 8)) & 0xff); accBits -= 8; }
  }
  // 20 chars carry 100 bits but the payload is 96, so 4 bits are padding.
  // Unvalidated padding means a typo in the last character can decode clean.
  if (accBits && (acc & ((1 << accBits) - 1)) !== 0) throw new Error("padding bits set: code was mistyped");
  const body = bytes.slice(0, -1), given = bytes[bytes.length - 1];
  if (crc8(body) !== given) throw new Error("checksum failed: code was mistyped");

  const r = new Reader(body); const v = {};
  for (const [name, width] of FIELDS) v[name] = r.read(width);
  return {
    tier: v.tier + 1, tierProgress: v.tierProgress,
    topics: { money: v.t0, percent: v.t1, ratio: v.t2, measure: v.t3 },
    streakDays: v.streakDays, totalCorrect: v.totalCorrect,
    lastActiveDay: new Date(EPOCH + v.day * 86400000).toISOString().slice(0, 10),
    week: Array.from({ length: 7 }, (_, i) => !!(v.week & (1 << (6 - i)))),
    lastTopic: TOPICS[v.lastTopic], demoted: !!v.demoted, recoveryRun: v.recoveryRun,
  };
}

/* ---------- proof ---------- */
const learner = {
  tier: 3, tierProgress: 12, topics: { money: 18, percent: 12, ratio: 5, measure: 0 },
  streakDays: 41, totalCorrect: 386, lastActiveDay: "2026-09-20",
  week: [true, true, true, true, false, false, false],
  lastTopic: "percent", demoted: false, recoveryRun: 0,
};

let ok = true;
const { code, bytes } = encode(learner);
console.log(`code:        ${code}  (${code.replace(/-/g, "").length} chars, ${bytes} bytes)`);

const roundTrip = JSON.stringify(decode(code)) === JSON.stringify(learner);
console.log(`round trip:  ${roundTrip ? "identical" : "MISMATCH"}`);
ok = ok && roundTrip;

const chars = code.replace(/-/g, "").split("");
let caught = 0, silent = 0;
for (let i = 0; i < chars.length; i++) {
  for (const sub of ALPHABET) {
    if (sub === chars[i]) continue;
    const bad = chars.slice(); bad[i] = sub;
    try { decode(bad.join("")); silent++; } catch { caught++; }
  }
}
console.log(`typos:       ${caught + silent} single-character substitutions, ${silent} accepted silently`);
ok = ok && silent === 0;

const messy = code.toLowerCase().replace(/0/g, "O").replace(/1/g, "l");
let handwriting = false;
try { handwriting = JSON.stringify(decode(messy)) === JSON.stringify(learner); } catch {}
console.log(`handwriting: "${messy}" ${handwriting ? "still decodes" : "FAILED"}`);
ok = ok && handwriting;

console.log(ok ? "ok" : "FAIL");
process.exit(ok ? 0 : 1);
