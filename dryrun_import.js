const fs = require("fs");
const path = require("path");
const htmlDecode = (s) =>
  s
    .replace(/\x26amp;/g, "\x26")
    .replace(/\x26lt;/g, "\x3C")
    .replace(/\x26gt;/g, "\x3E")
    .replace(/\x26quot;/g, "\x22")
    .replace(/\x26#39;/g, "\x27");

const dir = path.join(__dirname, "data", "epub_unzipped", "EPUB");
const files = fs.readdirSync(dir).filter((f) => /^page_\d+\.html$/.test(f));
files.sort((a, b) => parseInt(a.split("_")[1]) - parseInt(b.split("_")[1]));

const POS = {
  "n+": "noun", "n": "noun", "v+": "verb", "v": "verb", "adv+": "adverb",
  "adv": "adverb", "adj+": "adjective", "adj": "adjective", "interj": "interjection",
  "prep": "preposition", "conj": "conjunction", "pron": "pronoun",
  "num": "numeral", "int": "interjection", "suffix": "suffix", "prefix": "prefix",
};

const entries = [];
let rawChars = 0;

for (const file of files) {
  const html = fs.readFileSync(path.join(dir, file), "utf8");
  const m = html.match(/<p>(.*?)<\/p>/s);
  if (!m) continue;
  const text = htmlDecode(m[1]);
  rawChars += text.length;
  // Remove page headers/footers noise
  const body = text.replace(/Learners' Manipuri|English Dictionary|\d+$/g, "");

  // SP LIT on IPA segments: every entry has one /ipa/ block
  const ipaRe = /([a-z. ]+?)\//g;
  const parts = [];
  let last = 0;
  let mm;
  while ((mm = ipaRe.exec(body)) !== null) {
    const ipa = mm[1].trim();
    const start = last;
    const end = mm.index;
    parts.push({ pre: body.slice(start, end), ipa });
    last = mm.index + mm[0].length;
  }
  if (parts.length === 0) continue;

  for (let i = 0; i < parts.length; i++) {
    const { pre, ipa } = parts[i];
    // Headword = last romanized token before the (garbled) Mayek run
    const hwMatch = pre.match(/([a-z][a-z.' -]{0,24})[^a-z.' -]*$/);
    if (!hwMatch) continue;
    const word = hwMatch[1].trim();
    // Mayek run = garbled glyph block between headword and ipa
    const mayekRaw = pre.slice(0, pre.length - hwMatch[0].length);
    const mayek = mayekRaw.replace(/[^A-Za-z\u00C0-\uFFFF0-9~][^A-Za-z\u00C0-\uFFFF0-9~]*$/, "").trim();

    // Gloss = everything up to next entry headword (approximate)
    let gloss = "";
    for (let j = i + 1; j < parts.length; j++) {
      const nextHw = parts[j].pre.match(/([a-z][a-z.' -]{0,24})[^a-z.' -]*$/);
      const cut = nextHw ? parts[j].pre.length - nextHw[0].length : 0;
      gloss = parts[j].pre.slice(0, cut);
      break;
    }
    if (i === parts.length - 1) gloss = "";

    // POS marker
    const posMatch = gloss.match(/^\s*(n|v|adv|adj|interj|prep|conj|pron|num|int|suffix|prefix)\.?/);
    const pos = posMatch ? POS[posMatch[1]] ?? posMatch[1] : "";
    const glossClean = (posMatch ? gloss.slice(posMatch[0].length) : gloss)
      .replace(/\s+~.*$/, "") // strip "Morph" tails for now
      .replace(/^[.,\s]+/, "")
      .trim();

    entries.push({ word, mayek, ipa, pos, gloss: glossClean, page: file });
  }
}

// Dedupe by (word, gloss)
const seen = new Set();
const uniq = [];
for (const e of entries) {
  const k = e.word.toLowerCase() + "|" + e.gloss.slice(0, 60);
  if (seen.has(k)) continue;
  seen.add(k);
  uniq.push(e);
}

// Overlap check with existing DB words (romanized)
const mysql = require("mariadb");
(async () => {
  console.log("=== DRY-RUN IMPORT REPORT: Learners' Manipuri-English Dictionary ===");
  console.log("Source: data/dli.language.2401.epub (H. Surmangol Sharma)");
  console.log(`Pages parsed : ${files.length}`);
  console.log(`Raw text     : ${(rawChars / 1024).toFixed(1)} KB`);
  console.log(`Entries found: ${entries.length}`);
  console.log(`Unique (word+gloss): ${uniq.length}`);
  const uniqueWords = new Set(uniq.map((e) => e.word.toLowerCase()));
  console.log(`Unique headwords   : ${uniqueWords.size}`);

  // Existing overlap
  let existing = [];
  try {
    const c = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "manipuri_dictionary",
    });
    const rows = await c.query("SELECT LOWER(word) w FROM words");
    existing = rows.map((r) => r.w);
    await c.end();
    console.log(`Overlap with existing DB words: ${[...uniqueWords].filter((w) => existing.includes(w)).length}`);
    console.log(`NEW headwords to insert      : ${[...uniqueWords].filter((w) => !existing.includes(w)).length}`);
  } catch (e) {
    console.log("DB overlap check skipped:", e.message);
  }

  const byPos = {};
  for (const e of uniq) byPos[e.pos || "(none)"] = (byPos[e.pos || "(none)"] || 0) + 1;
  console.log("\n=== Part-of-speech distribution ===");
  for (const [k, v] of Object.entries(byPos).sort((a, b) => b[1] - a[1])) console.log(`${k}: ${v}`);

  console.log("\n=== SAMPLE ENTRIES (20) ===");
  uniq.slice(0, 20).forEach((e) =>
    console.log(`- "${e.word}" [${e.pos}] /${e.ipa}/ mayek="${(e.mayek || "").slice(0, 20)}" → ${e.gloss.slice(0, 80)}`)
  );

  const withMayek = uniq.filter((e) => e.mayek.length > 2).length;
  console.log(`\nEntries with (partially recoverable) Meitei Mayek glyph run: ${withMayek} / ${uniq.length}`);
  console.log("\nNOTE: dry-run only — no rows were written to the database.");
})().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});