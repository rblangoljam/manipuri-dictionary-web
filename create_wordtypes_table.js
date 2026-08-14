const mysql = require("mariadb");

// ============================================================
// Canonical part-of-speech vocabulary, organized by category.
// A dictionary entry can have a PRIMARY wordType (category
// "word_type") plus OPTIONAL grammatical features from the
// other categories (verb_type, verb_form, noun_feature, ...).
// ============================================================

const CATEGORIES = {
  word_type: [
    "noun", "pronoun", "verb", "adjective", "adverb",
    "preposition", "conjunction", "interjection", "numeral",
  ],
  verb_type: [
    "transitive", "intransitive", "both", "auxiliary",
  ],
  verb_form: [
    "imperative", "present participle", "past participle", "perfect participle",
    "preterit", "preterit perfect", "imperfect",
  ],
  noun_feature: [
    "singular", "plural", "masculine", "feminine",
  ],
  adjective_form: [
    "comparative", "superlative",
  ],
  word_form: [
    "prefix", "suffix",
  ],
  other: [
    "question", "object", "unknown",
  ],
};

// Short form -> canonical long form (aliases), with the category
// derived from the canonical long form automatically.
const ALIASES = [
  // word_type aliases
  ["n", "noun"], ["n.", "noun"], ["n,", "noun"],
  ["v", "verb"], ["v.", "verb"],
  ["a", "adjective"], ["a.", "adjective"], ["adj", "adjective"], ["adj.", "adjective"],
  ["adv", "adverb"], ["adv.", "adverb"], ["ad", "adverb"], ["ad.", "adverb"],
  ["pron", "pronoun"], ["pron.", "pronoun"], ["pers. pron.", "pronoun"],
  ["prep", "preposition"], ["prep.", "preposition"],
  ["conj", "conjunction"], ["conj.", "conjunction"],
  ["interj", "interjection"], ["interj.", "interjection"], ["int.", "interjection"],
  ["num", "numeral"], ["num.", "numeral"],
  // verb_type aliases
  ["vt", "transitive"], ["vt.", "transitive"], ["v.t.", "transitive"], ["v. t.", "transitive"],
  ["vi", "intransitive"], ["vi.", "intransitive"], ["v.i.", "intransitive"], ["v. i.", "intransitive"],
  ["aux", "auxiliary"], ["aux.", "auxiliary"],
  // verb_form aliases
  ["imp", "imperative"], ["imp.", "imperative"],
  ["p.p.", "past participle"], ["p. p.", "past participle"], ["pp", "past participle"],
  ["pres. part.", "present participle"], ["p. pr. & vb. n.", "present participle"],
  ["perfect part.", "perfect participle"], ["p. p. & a.", "past participle"],
  ["preterit", "preterit"], ["pre.ter.", "preterit"],
  ["impf.", "imperfect"], ["imp.", "imperfect"],
  // noun_feature aliases
  ["pl", "plural"], ["pl.", "plural"],
  ["sing", "singular"], ["sing.", "singular"],
  ["m", "masculine"], ["m.", "masculine"],
  ["f", "feminine"], ["f.", "feminine"],
  // adjective_form aliases
  ["compar", "comparative"], ["compar.", "comparative"],
  ["superl", "superlative"], ["superl.", "superlative"], ["supperl.", "superlative"],
  // word_form aliases
  ["pref", "prefix"], ["pref.", "prefix"],
  ["suff", "suffix"], ["suff.", "suffix"],
  // other aliases
  ["q", "question"], ["q.", "question"],
  ["obj", "object"], ["obj.", "object"], ["object.", "object"],
];

// Determine the category for a canonical long form (or the raw value).
function categoryOf(longForm) {
  for (const [cat, list] of Object.entries(CATEGORIES)) {
    if (list.includes(longForm)) return cat;
  }
  // Simple fallback for compound values that don't match a single label
  const lf = longForm.toLowerCase();
  if (/\bnoun\b/.test(lf)) return "word_type";
  if (/\bverb\b/.test(lf)) return "word_type";
  if (/\badjective\b/.test(lf)) return "word_type";
  return "other";
}

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost", port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root", password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "manipuri_dictionary", charset: "utf8mb4",
  });

  console.log("=== CREATE wordtypes REFERENCE TABLE (categorized) ===");
  await c.query(`
    CREATE TABLE IF NOT EXISTS wordtypes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(128) NOT NULL,
      long_form VARCHAR(128) NOT NULL,
      category VARCHAR(32) NOT NULL DEFAULT 'other',
      UNIQUE KEY uq_wordtypes_code (code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await c.query("TRUNCATE TABLE wordtypes");
  console.log("Table ready (re-created/truncated for fresh seed)");

  let total = 0;
  const insert = async (code, longForm, category) => {
    await c.query(
      "INSERT IGNORE INTO wordtypes (code, long_form, category) VALUES (?,?,?)",
      [code, longForm, category]
    );
    total++;
  };

  // 1) Seed canonical long forms, grouped by category
  for (const [cat, list] of Object.entries(CATEGORIES)) {
    for (const lf of list) {
      await insert(lf, lf, cat);
    }
  }

  // 2) Seed short->long aliases (category derived from long_form)
  for (const [code, lf] of ALIASES) {
    await insert(code, lf, categoryOf(lf));
  }

  // 3) Seed every distinct wordtype value currently in the DB.
  //    long_form = known canonical if the value is an exact label or alias,
  //    else keep the value itself; category always resolved.
  const distinct = await c.query(
    "SELECT DISTINCT wordtype FROM (SELECT wordtype FROM word_senses UNION SELECT wordtype FROM word_translations) t WHERE wordtype != ''"
  );
  let mapped = 0;
  for (const r of distinct) {
    const code = r.wordtype;
    const existing = await c.query("SELECT long_form, category FROM wordtypes WHERE code = ? LIMIT 1", [code]);
    let long = code;
    let cat = categoryOf(code);
    if (existing.length) {
      long = existing[0].long_form;
      cat = existing[0].category;
    } else {
      // Case-insensitive match on the long form
      const ci = await c.query("SELECT long_form, category FROM wordtypes WHERE LOWER(long_form) = LOWER(?) LIMIT 1", [code]);
      if (ci.length) {
        long = ci[0].long_form;
        cat = ci[0].category;
      } else {
        cat = categoryOf(code);
      }
    }
    await insert(code, long, cat);
    if (long !== code) mapped++;
  }

  const count = (await c.query("SELECT COUNT(*) c FROM wordtypes"))[0].c;
  console.log("Seeded rows:", Number(count));
  console.log("Distinct DB wordtype values:", distinct.length, "| mapped to a canonical long_form:", mapped);

  console.log("\n=== Sample: short -> long [category] ===");
  const sample = await c.query("SELECT code, long_form, category FROM wordtypes ORDER BY category, id LIMIT 40");
  sample.forEach((x) => console.log(`  "${x.code}"  ->  "${x.long_form}"  [${x.category}]`));

  console.log("\n=== Category counts ===");
  const cats = await c.query("SELECT category, COUNT(*) c FROM wordtypes GROUP BY category ORDER BY category");
  cats.forEach((x) => console.log(`  ${x.category}: ${x.c}`));

  console.log("\nDONE — word_senses / word_translations were NOT modified.");
  await c.end();
})().catch((e) => { console.error("FAIL:", e && e.message); process.exit(1); });