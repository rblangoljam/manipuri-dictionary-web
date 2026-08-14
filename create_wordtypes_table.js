const mysql = require("mariadb");

// Canonical long/full part-of-speech vocabulary (identity rows).
const CORE = [
  "noun", "adjective", "verb", "verb transitive", "verb intransitive", "verb both",
  "adverb", "pronoun", "personal pronoun", "preposition", "conjunction",
  "interjection", "numeral", "prefix", "suffix", "plural", "singular",
  "participial", "past participle", "present participle", "perfect participle",
  "preterit", "preterit perfect", "superlative", "comparative", "object", "unknown",
  "adjective & noun", "adjective & adverb", "adjective & verb", "noun & verb",
  "adverb & conjunction", "adjective & pronoun", "adjective & participle",
  "preposition & adverb", "preposition & conjunction", "interjection & adverb",
  "noun feminine", "noun plural", "transitive", "intransitive", "imperative",
  "imperfect", "auxiliary", "masculine", "feminine", "third person singular present",
  "second person singular present", "question",
];

// Common abbreviation aliases (short -> long).
const ALIASES = [
  ["n", "noun"], ["v", "verb"], ["vt", "verb transitive"], ["vi", "verb intransitive"],
  ["a", "adjective"], ["adj", "adjective"], ["adv", "adverb"], ["pron", "pronoun"],
  ["prep", "preposition"], ["conj", "conjunction"], ["interj", "interjection"],
  ["num", "numeral"], ["pref", "prefix"], ["suff", "suffix"], ["pl", "plural"],
  ["compar", "comparative"], ["superl", "superlative"], ["aux", "auxiliary"],
  ["f", "feminine"], ["m", "masculine"], ["obj", "object"],
  ["n.", "noun"], ["v.", "verb"], ["a.", "adjective"], ["adv.", "adverb"],
  ["ad.", "adverb"], ["pron.", "pronoun"], ["prep.", "preposition"],
  ["conj.", "conjunction"], ["interj.", "interjection"], ["num.", "numeral"],
  ["pref.", "prefix"], ["suff.", "suffix"], ["pl.", "plural"], ["sing.", "singular"],
  ["compar.", "comparative"], ["superl.", "superlative"], ["q.", "question"],
  ["obj.", "object"], ["suffix", "suffix"], ["prefix", "prefix"],
];

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost", port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root", password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "manipuri_dictionary", charset: "utf8mb4",
  });

  console.log("=== CREATE wordtypes REFERENCE TABLE ===");
  await c.query(`
    CREATE TABLE IF NOT EXISTS wordtypes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(128) NOT NULL,
      long_form VARCHAR(128) NOT NULL,
      category VARCHAR(32) NOT NULL DEFAULT 'alias',
      UNIQUE KEY uq_wordtypes_code (code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await c.query("TRUNCATE TABLE wordtypes");
  console.log("Table ready (re-created/truncated for fresh seed)");

  // 1) Seed canonical long forms (identity: code = long_form)
  for (const lf of CORE) {
    await c.query("INSERT IGNORE INTO wordtypes (code, long_form, category) VALUES (?,?,?)", [lf, lf, "canonical"]);
  }
  // 2) Seed explicit short->long aliases
  for (const [code, lf] of ALIASES) {
    await c.query("INSERT IGNORE INTO wordtypes (code, long_form, category) VALUES (?,?,?)", [code, lf, "alias"]);
  }

  // 3) Seed every distinct wordtype value actually present in the DB
  //    (short form = existing value; long form = mapped canonical if known, else itself)
  const distinct = await c.query(
    "SELECT DISTINCT wordtype FROM (SELECT wordtype FROM word_senses UNION SELECT wordtype FROM word_translations) t WHERE wordtype != ''"
  );
  let auto = 0;
  for (const r of distinct) {
    const code = r.wordtype;
    const row = await c.query("SELECT long_form FROM wordtypes WHERE code = ? LIMIT 1", [code]);
    let long = row.length ? row[0].long_form : code;
    if (!row.length) {
      // Try case-insensitive match on the long form (e.g. "Adverb" -> "adverb")
      const ci = await c.query("SELECT long_form FROM wordtypes WHERE LOWER(long_form) = LOWER(?) LIMIT 1", [code]);
      if (ci.length) { long = ci[0].long_form; }
    }
    const cat = long === code ? "canonical" : "alias";
    await c.query("INSERT IGNORE INTO wordtypes (code, long_form, category) VALUES (?,?,?)", [code, long, cat]);
    if (long !== code) auto++;
  }

  const count = (await c.query("SELECT COUNT(*) c FROM wordtypes"))[0].c;
  console.log("Seeded rows:", Number(count));
  console.log("Distinct DB wordtype values found:", distinct.length, "| mapped to a different long_form:", auto);

  console.log("\n=== Sample: short -> long ===");
  const sample = await c.query("SELECT code, long_form, category FROM wordtypes ORDER BY id LIMIT 30");
  sample.forEach((x) => console.log(`  "${x.code}"  ->  "${x.long_form}"  [${x.category}]`));

  console.log("\nDONE — word_senses / word_translations were NOT modified.");
  await c.end();
})().catch((e) => { console.error("FAIL:", e && e.message); process.exit(1); });