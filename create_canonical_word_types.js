const mysql = require("mariadb");

// One canonical record per grammar concept.
const CANONICAL = {
  word_type: [
    ["noun", "Noun"], ["pronoun", "Pronoun"], ["verb", "Verb"], ["adjective", "Adjective"],
    ["adverb", "Adverb"], ["preposition", "Preposition"], ["conjunction", "Conjunction"],
    ["interjection", "Interjection"], ["numeral", "Numeral"], ["prefix", "Prefix"],
    ["suffix", "Suffix"], ["article", "Article"], ["determiner", "Determiner"],
  ],
  verb_type: [
    ["transitive", "Transitive"], ["intransitive", "Intransitive"], ["both", "Both"], ["auxiliary", "Auxiliary"],
  ],
  verb_form: [
    ["imperative", "Imperative"], ["present_participle", "Present Participle"],
    ["past_participle", "Past Participle"], ["perfect_participle", "Perfect Participle"],
    ["preterit", "Preterit"], ["preterit_perfect", "Preterit Perfect"],
    ["imperfect", "Imperfect"], ["third_person_singular_present", "Third Person Singular Present"],
    ["second_person_singular_present", "Second Person Singular Present"],
  ],
  noun_feature: [
    ["singular", "Singular"], ["plural", "Plural"], ["masculine", "Masculine"],
    ["feminine", "Feminine"], ["common", "Common / Both"],
  ],
  adjective_form: [
    ["positive", "Positive"], ["comparative", "Comparative"], ["superlative", "Superlative"],
  ],
  word_form: [["prefix", "Prefix"], ["suffix", "Suffix"]],
  other: [["unknown", "Unknown"]],
};

// Clean alias resolution -> canonical code (only unambiguous, safe mappings).
const ALIAS_TO_CANONICAL = {
  n: "noun", "n.": "noun", "n,": "noun", noun: "noun",
  v: "verb", "v.": "verb", verb: "verb",
  a: "adjective", "a.": "adjective", adj: "adjective", "adj.": "adjective", adjective: "adjective",
  adv: "adverb", "adv.": "adverb", "ad.": "adverb", ad: "adverb", adverb: "adverb",
  pron: "pronoun", "pron.": "pronoun", pronoun: "pronoun",
  prep: "preposition", "prep.": "preposition", preposition: "preposition",
  conj: "conjunction", "conj.": "conjunction", conjunction: "conjunction",
  interj: "interjection", "interj.": "interjection", "int.": "interjection", interjection: "interjection",
  num: "numeral", "num.": "numeral", numeral: "numeral",
  pref: "prefix", "pref.": "prefix", prefix: "prefix",
  suff: "suffix", "suff.": "suffix", suffix: "suffix",
  article: "article", determiner: "determiner",
  vt: "transitive", "vt.": "transitive", "v.t.": "transitive", "v. t.": "transitive", transitive: "transitive",
  vi: "intransitive", "vi.": "intransitive", "v.i.": "intransitive", "v. i.": "intransitive", intransitive: "intransitive",
  aux: "auxiliary", auxiliiary: "auxiliary", "aux.": "auxiliary",
  pl: "plural", "pl.": "plural", plural: "plural",
  sing: "singular", "sing.": "singular", singular: "singular",
  m: "masculine", "m.": "masculine", masculine: "masculine",
  f: "feminine", "f.": "feminine", feminine: "feminine",
  compar: "comparative", "compar.": "comparative", comparative: "comparative",
  superl: "superlative", "superl.": "superlative", "supperl.": "superlative", superlative: "superlative",
  imp: "imperative", "imp.": "imperative", imperative: "imperative",
  "p.p.": "past_participle", "p. p.": "past_participle", "pp": "past_participle", past_participle: "past_participle",
  "pres. part.": "present_participle", present_participle: "present_participle",
  preterit: "preterit", preterit_perfect: "preterit_perfect",
  noun_plural: "plural", noun_numeral: "numeral",
};

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost", port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root", password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "manipuri_dictionary", charset: "utf8mb4",
  });

  console.log("=== CANONICAL WORD_TYPES MIGRATION ===");

  // 1) Create canonical table (idempotent)
  await c.query(`
    CREATE TABLE IF NOT EXISTS word_types (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(100) NOT NULL,
      name VARCHAR(100) NOT NULL,
      category VARCHAR(32) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_word_types_code (code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("table ready");

  // 2) Seed one row per canonical concept (idempotent via IGNORE)
  let seeded = 0;
  for (const [cat, rows] of Object.entries(CANONICAL)) {
    for (const [code, name] of rows) {
      await c.query(
        "INSERT IGNORE INTO word_types (code, name, category) VALUES (?,?,?)",
        [code, name, cat]
      );
      seeded++;
    }
  }
  const cnt = await c.query("SELECT COUNT(*) c FROM word_types");
  console.log("canonical rows now:", Number(cnt[0].c), "(seeded", seeded, "concepts)");

  // 3) Add mapper column to the legacy wordtypes reference table
  const col = await c.query("SHOW COLUMNS FROM wordtypes LIKE 'canonical_code'");
  if (col.length === 0) {
    await c.query("ALTER TABLE wordtypes ADD COLUMN canonical_code VARCHAR(100) NULL");
    console.log("added wordtypes.canonical_code");
  } else {
    console.log("wordtypes.canonical_code exists");
  }

  // 4) Backfill canonical_code for clean algebra only
  let mapped = 0;
  for (const [alias, code] of Object.entries(ALIAS_TO_CANONICAL)) {
    const r = await c.query(
      "UPDATE wordtypes SET canonical_code = ? WHERE code = ? AND canonical_code IS NULL",
      [code, alias]
    );
    mapped += r.affectedRows;
  }
  // Map rows whose code is already an exact canonical code (identity)
  const canonicalRows = await c.query("SELECT code FROM word_types");
  for (const row of canonicalRows) {
    const r = await c.query(
      "UPDATE wordtypes SET canonical_code = ? WHERE code = ? AND canonical_code IS NULL",
      [row.code, row.code]
    );
    mapped += r.affectedRows;
  }
  console.log("backfilled canonical_code on", mapped, "wordtypes rows");

  const unmapped = await c.query("SELECT COUNT(*) c FROM wordtypes WHERE canonical_code IS NULL");
  console.log("rows remaining unmapped (aliases/OCR/combined, kept readable):", Number(unmapped[0].c));

  console.log("MIGRATION_OK");
  await c.end();
})().catch((e) => { console.error("FAIL:", e && e.message); process.exit(1); });