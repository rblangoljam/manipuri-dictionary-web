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

const POSMAP = {
  n: "noun", "n+": "noun", v: "verb", "v+": "verb", adv: "adverb", "adv+": "adverb",
  adj: "adjective", "adj+": "adjective", interj: "interjection", prep: "preposition",
  conj: "conjunction", pron: "pronoun", num: "numeral", int: "interjection",
  suffix: "suffix", prefix: "prefix",
};
const HW = /^[a-z][a-z.' -]{1,39}$/;
const clean = (s) => s.replace(/\s+/g, " ").replace(/\s+\./g, ".").trim();

const entries = [];
for (const file of files) {
  const n = parseInt(file.split("_")[1]);
  if (n < 9) continue; // skip front matter
  const html = fs.readFileSync(path.join(dir, file), "utf8");
  const m = html.match(/<p>(.*?)<\/p>/s);
  if (!m) continue;
  const text = dec(m[1]).replace(/Learners' Manipuri|English Dictionary/g, "");

  // Split into segments: Morph blocks end an entry, or a headword+/ipa/ starts one
  const segs = text.split(/\]\s+/);
  for (let seg of segs) {
    seg = seg.replace(/Morph\s*:.*?$/s, "").trim();
    // find all headword + mayek + /ipa/ anchors in this segment
    const regex = /([a-z][a-z.' -]{1,39})([^A-Za-z0-9/]+?)\/([a-z.' -]{1,40})\//g;
    let mm, lastEnd = 0, parts = [];
    while ((mm = regex.exec(seg)) !== null) {
      parts.push({
        pre: seg.slice(lastEnd, mm.index),
        word: mm[1].trim(),
        mayek: mm[2].trim(),
        ipa: mm[3].trim(),
      });
      lastEnd = mm.index + mm[0].length;
    }
    if (!parts.length) continue;
    // gloss = the text between this entry's ipa end and the next entry start
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (!HW.test(p.word)) continue;
      const nextStart = i + 1 < parts.length
        ? seg.indexOf(parts[i + 1].pre, lastEnd || 0)
        : seg.length;
      let end = i + 1 < parts.length ? parts[i + 1].pre.length : seg.length;
      // simpler: gloss is from after this ipa to before next headword's mayek
      const rawGloss = i + 1 < parts.length
        ? seg.slice(0, 0) // placeholder; recompute below
        : seg.slice(lastEnd);
      void rawGloss;
      let gloss = "";
      if (i + 1 < parts.length) {
        const idx = seg.indexOf(parts[i + 1].pre, lastEnd);
        if (idx >= 0) gloss = seg.slice(lastEnd, idx);
        else gloss = seg.slice(lastEnd);
      } else {
        gloss = seg.slice(lastEnd);
      }
      const posm = gloss.match(/^\s*(n|n\+|v|v\+|adv|adv\+|adj|adj\+|interj|prep|conj|pron|num|int|suffix|prefix)\.?\s*/);
      const pos = posm ? POSMAP[posm[1]] ?? posm[1] : "";
      const glossText = clean(posm ? gloss.slice(posm[0].length) : gloss).replace(/^\d+\s*/, "").replace(/^[,.;\s]+/, "");
      const mayek = /[^\x00-\x7F]/.test(p.mayek) ? clean(p.mayek) : "";
      if (glossText.length > 1) entries.push({ word: p.word, mayek, ipa: p.ipa, pos, gloss: glossText });
    }
  }
}

// dedupe
const seen = new Set();
const uniq = [];
for (const e of entries) {
  const k = e.word.toLowerCase() + "|" + e.gloss.slice(0, 80);
  if (seen.has(k)) continue;
  seen.add(k);
  uniq.push(e);
}

const slugify = (w) => (w.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "word");

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost", port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root", password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "manipuri_dictionary",
  });
  const existing = new Set((await c.query("SELECT LOWER(word) w FROM words")).map((r) => r.w));

  const toInsert = uniq.filter((e) => !existing.has(e.word.toLowerCase()));
  console.log("=== IMPORT REPORT (LIVE) ===");
  console.log(`Pages: ${files.length} | Clean unique entries: ${uniq.length} | New vs DB: ${toInsert.length}`);

  let inserted = 0, skipped = 0;
  for (const e of toInsert) {
    const sl = slugify(e.word);
    const fl = (e.word[0] || "?").toUpperCase();
    const existingSlug = await c.query("SELECT id FROM words WHERE slug = ? LIMIT 1", [sl]);
    const finalSlug = existingSlug.length ? sl + "-" + inserted : sl;
    const r = await c.query(
      "INSERT INTO words (word, slug, first_letter, search_index) VALUES (?,?,?,?)",
      [e.word, finalSlug, fl, e.word.toLowerCase()]
    );
    const wid = r.insertId;
    await c.query(
      `INSERT INTO word_senses (word_id, wordtype, wordtype_raw, definition, meaning_eng_man,
        meaning_mm, antonyms, synonyms, status, submitted_by, reviewed_by, reviewed_at)
       VALUES (?,?,?,?,?,'','','','approved',1,1,NOW())`,
      [wid, e.pos || "unknown", e.pos || "", e.gloss, e.gloss]
    );
    if (e.mayek) {
      await c.query("UPDATE word_senses SET meaning_mm_unicode = ? WHERE word_id = ?", [e.mayek, wid]);
    }
    inserted++;
    if (inserted % 500 === 0) console.log(`  ...${inserted} inserted`);
  }
  console.log(`Inserted: ${inserted} | Skipped (overlap): ${skipped}`);

  console.log("\n=== SAMPLE (10 inserted) ===");
  const s = await c.query("SELECT w.word, w.slug, ws.wordtype, LEFT(ws.definition,60) def, LEFT(ws.meaning_mm_unicode,20) mm FROM words w JOIN word_senses ws ON ws.word_id=w.id WHERE ws.submitted_by=1 ORDER BY w.id DESC LIMIT 10");
  s.forEach((r) => console.log(`- ${r.word} [${r.wordtype}] mm="${r.mm||''}" → ${r.def}`));

  const t = await c.query("SELECT COUNT(*) c FROM words");
  console.log(`\nTotal words now in DB: ${Number(t[0].c)}`);
  await c.end();
  console.log("DONE");
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });