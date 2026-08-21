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
  if (!t) return "";
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

const entries = [];
for (const file of files) {
  const n = parseInt(file.split("_")[1]);
  if (n < 9) continue;
  const html = fs.readFileSync(path.join(dir, file), "utf8");
  const m = html.match(/<p>(.*?)<\/p>/s);
  if (!m) continue;
  const text = dec(m[1]).replace(/Learners' Manipuri|English Dictionary/g, "");

  // Split on /ipa/ blocks (like the successful first dry-run)
  const re = /\/([a-z.' ][^/]{0,40}?)\//g;
  let mm, last = 0, segs = [];
  while ((mm = re.exec(text)) !== null) {
    segs.push({ pre: text.slice(last, mm.index), tail: text.slice(mm.index + mm[0].length), ipa: mm[1] });
    last = mm.index + mm[0].length;
  }

  for (let i = 0; i < segs.length; i++) {
    const { pre, tail } = segs[i];
    // headword: drop trailing non-roman chars (the garbled mayek run) -> keep romanized word
    const hw = pre.match(/[a-z][a-z.' ]*$/);
    const word = hw ? hw[0].trim() : "";
    if (!/^[a-z][a-z.' -]{0,39}$/.test(word) || word.split(" ").length > 2) continue;

    // gloss of THIS entry = tail up to the next /ipa/ (next entry starts there)
    let gloss = tail;
    if (i + 1 < segs.length) {
      const nextIpaStart = text.indexOf("/", text.lastIndexOf(segs[i + 1].pre));
      // find where next entry's headword begins inside next pre: use next pre length
      const cut = text.length;
      void cut;
      // simpler robust: gloss runs until the next /ipa/ (which is the next entry's ipa block start
      // minus its headword+mayek). We approximate: take tail up to the next entry's romanized headword.
      const nextHw = segs[i + 1].pre.match(/[a-z][a-z.' ]*$/);
      const nextHwLen = nextHw ? nextHw[0].length : 0;
      gloss = tail.slice(0, tail.length - (segs[i + 1].pre.length - 0));
      void nextHwLen;
      gloss = tail.slice(0, tail.lastIndexOf(segs[i + 1].pre) ); // tail already excludes pre
    }
    // simplify: gloss = tail trimmed, then cut at next headword marker list
    gloss = tail.split(/[A-Z][a-z'/]{1,20}\s+\S/)[0];
    gloss = gloss.replace(/Morph\s*:.*$/s, "");
    const posm = gloss.match(/^\s*((?:n|v|adv|adj|interj|prep|conj|pron|num)\+?)\.?\s*/);
    const pos = posm ? (POSMAP[posm[1]] || posm[1] || "") : "";
    gloss = clean(posm ? gloss.slice(posm[0].length) : gloss).replace(/^\d+\s*/, "").replace(/^[,.;]\s*/, "");
    const mayek = toMayek(word);
    if (gloss.length > 2 && mayek) entries.push({ word, mayek, pos, gloss, page: n });
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
  console.log("=== V2 PARSED + MAYEK (sample 25) ===");
  uniq.slice(0, 25).forEach((e) => console.log(`- ${e.word} [${e.pos || "?"}] → ${e.mayek}  :: ${e.gloss.slice(0, 60)}`));
  console.log(`\nTotal clean entries: ${uniq.length} | Unique headwords: ${new Set(uniq.map((e) => e.word.toLowerCase())).size}`);

  if (!process.argv.includes("--dry")) return;
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost", port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root", password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "manipuri_dictionary",
  });
  const existing = new Set((await c.query("SELECT LOWER(word) w FROM words")).map((r) => r.w));
  const toInsert = uniq.filter((e) => !existing.has(e.word.toLowerCase()));
  let ins = 0;
  for (const e of toInsert) {
    const sl = slugify(e.word);
    const dup = await c.query("SELECT id FROM words WHERE slug = ? LIMIT 1", [sl]);
    const r = await c.query("INSERT INTO words (word, slug, first_letter, search_index) VALUES (?,?,?,?)", [e.word, dup.length ? sl + "-" + ins : sl, (e.word[0] || "?").toUpperCase(), e.word.toLowerCase()]);
    await c.query("INSERT INTO word_senses (word_id, wordtype, wordtype_raw, definition, meaning_eng_man, meaning_mm, meaning_mm_unicode, antonyms, synonyms, status, submitted_by, reviewed_by, reviewed_at) VALUES (?,?,?,?,?,?,?,'','','approved',1,1,NOW())", [r.insertId, e.pos || "unknown", e.pos || "", e.gloss, e.gloss, e.word, e.mayek]);
    ins++;
  }
  const t = await c.query("SELECT COUNT(*) c FROM words");
  await c.end();
  console.log(`Inserted: ${ins} | Total words now: ${Number(t[0].c)}`);
  console.log("DONE (live)");
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });