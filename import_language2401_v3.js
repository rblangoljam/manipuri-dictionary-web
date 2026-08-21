const fs = require("fs");
const path = require("path");
const mysql = require("mariadb");

const dec = (s) =>
  s.replace(/\x26amp;/g, "\x26").replace(/\x26lt;/g, "\x3C")
    .replace(/\x26gt;/g, "\x3E").replace(/\x26quot;/g, "\x22").replace(/\x26#39;/g, "\x27");

const REPO = __dirname;
const dir = path.join(REPO, "data", "epub_unzipped", "EPUB");
const files = fs.readdirSync(dir).filter((f) => /^page_\d+\.html$/.test(f));
files.sort((a, b) => parseInt(a.split("_")[1]) - parseInt(b.split("_")[1]));

// E-Pao keyboard -> Unicode Meitei Mayek
const M = {
  k: "\uABC0", s: "\uABC1", l: "\uABC2", m: "\uABC3", p: "\uABC4", n: "\uABC5",
  c: "\uABC6", t: "\uABC7", K: "\uABC8", Z: "\uABC9", T: "\uABCA", w: "\uABCB",
  y: "\uABCC", h: "\uABCD", U: "\uABCE", I: "\uABCF", f: "\uABD0", A: "\uABD1",
  g: "\uABD2", J: "\uABD3", r: "\uABD4", b: "\uABD5", j: "\uABD6", d: "\uABD7",
  G: "\uABD8", D: "\uABD9", B: "\uABDA",
  a: "\uABE5", e: "\uABE6", u: "\uABE8", i: "\uABE4", E: "\uABE9", o: "\uABE3",
  O: "\uABE7", q: "\uABEA",
  Q: "\uABDB", L: "\uABDC", M: "\uABDD", P: "\uABDE", N: "\uABDF", Y: "\uABE0",
  H: "\uABE1",
};
const IND = { a: "\uABD1\uABE5", e: "\uABD1\uABE6", E: "\uABD1\uABE9", o: "\uABD1\uABE3", O: "\uABD1\uABE7", q: "\uABD1\uABEA" };
const CONS = new Set(Object.values(M).filter((u) => parseInt(u, 16) >= 0xabc0 && parseInt(u, 16) <= 0xabda));

function toMayek(t) {
  let out = "";
  for (const ch of t) {
    if (ch in IND) {
      const prev = out[out.length - 1];
      out += CONS.has(prev) ? (M[ch] || ch) : (IND[ch] || M[ch] || ch);
    } else out += M[ch] || ch;
  }
  return out;
}

const POSMAP = { n: "noun", "n+": "noun", v: "verb", "v+": "verb", adv: "adverb", "adv+": "adverb", adj: "adjective", "adj+": "adjective", interj: "interjection", prep: "preposition", conj: "conjunction", pron: "pronoun", num: "numeral" };
const clean = (s) => s.replace(/\s+/g, " ").replace(/\s+\./g, ".").trim();

// A "clean" romanized Manipuri headword: letters + apostrophe only, has a vowel,
// 2+ chars, no 3+ consecutive consonants (OCR Mayek fragments fail these).
function isCleanHeadword(w) {
  if (!/^[a-z][a-z']{1,39}$/.test(w)) return false;
  if (!/[aeiou]/i.test(w)) return false;
  if (/([^aeiou]){3}/.test(w)) return false;
  return true;
}

const entries = [];
for (const file of files) {
  const n = parseInt(file.split("_")[1]);
  if (n < 9) continue;
  const html = fs.readFileSync(path.join(dir, file), "utf8");
  const m = html.match(/<p>(.*?)<\/p>/s);
  if (!m) continue;
  const text = dec(m[1]).replace(/Learners' Manipuri|English Dictionary/g, "");

  const re = /\/([a-z.' ][^/]{0,40}?)\//g;
  let mm, last = 0, segs = [];
  while ((mm = re.exec(text)) !== null) {
    segs.push({ pre: text.slice(last, mm.index), tail: text.slice(mm.index + mm[0].length) });
    last = mm.index + mm[0].length;
  }

  for (let i = 0; i < segs.length; i++) {
    const { pre, tail } = segs[i];
    const hw = pre.match(/[a-z][a-z.' ]*$/);
    const word = hw ? hw[0].trim() : "";
    if (!isCleanHeadword(word)) continue;

    let gloss = tail.split(/[A-Z][a-z'/]{1,20}\s+\S/)[0];
    gloss = gloss.replace(/Morph\s*:.*$/s, "");
    const posm = gloss.match(/^\s*((?:n|v|adv|adj|interj|prep|conj|pron|num)\+?)\.?\s*/);
    const pos = posm ? (POSMAP[posm[1]] || posm[1] || "") : "";
    gloss = clean(posm ? gloss.slice(posm[0].length) : gloss).replace(/^\d+\s*/, "").replace(/^[,.;]\s*/, "");
    const mayek = toMayek(word);
    if (gloss.length > 2) entries.push({ word, mayek, pos, gloss, page: n });
  }
}

const seen = new Set();
const uniq = [];
for (const e of entries) {
  const k = e.word.toLowerCase() + "|" + e.gloss.slice(0, 60);
  if (seen.has(k)) continue;
  seen.add(k);
  uniq.push(e);
}
const slugify = (w) => (w.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "word");

(async () => {
  console.log("=== V3 CLEAN-HEADWORD IMPORT (LIVE) ===");
  console.log("Clean unique entries:", uniq.length, "| headwords:", new Set(uniq.map((e) => e.word.toLowerCase())).size);
  console.log("Sample (15):");
  uniq.slice(0, 15).forEach((e) => console.log(`- ${e.word} [${e.pos || "?"}] → ${e.mayek}  :: ${e.gloss.slice(0, 55)}`));

  const c = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost", port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root", password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "manipuri_dictionary",
  });
  const existing = new Set((await c.query("SELECT LOWER(word) w FROM words")).map((r) => r.w));
  const toInsert = uniq.filter((e) => !existing.has(e.word.toLowerCase()));
  await c.beginTransaction();
  let ins = 0;
  for (const e of toInsert) {
    const sl = slugify(e.word);
    const dup = await c.query("SELECT id FROM words WHERE slug = ? LIMIT 1", [sl]);
    const r = await c.query("INSERT INTO words (word, slug, first_letter, search_index) VALUES (?,?,?,?)", [e.word, dup.length ? sl + "-" + ins : sl, (e.word[0] || "?").toUpperCase(), e.word.toLowerCase()]);
    await c.query("INSERT INTO word_senses (word_id, wordtype, wordtype_raw, definition, meaning_eng_man, meaning_mm, meaning_mm_unicode, antonyms, synonyms, status, submitted_by, reviewed_by, reviewed_at) VALUES (?,?,?,?,?,?,?,'','','approved',1,1,NOW())", [r.insertId, e.pos || "unknown", e.pos || "", e.gloss, e.gloss, e.word, e.mayek]);
    ins++;
  }
  await c.commit();
  const t = await c.query("SELECT COUNT(*) c FROM words");
  await c.end();
  console.log(`Inserted: ${ins} | Skipped (overlap/garbage): ${entries.length - evict - 0}`.replace("evict - 0", "0"));
  console.log(`Total words now: ${Number(t[0].c)}`);
  console.log("DONE");
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });