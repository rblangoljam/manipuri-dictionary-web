const mysql = require("mariadb");

// Multi-token abbreviations expanded first (longest match wins).
const MULTI = [
  ["verb transitive", ["v.t.", "v. t.", "vt.", "vt", "v. t", "v.t"]],
  ["verb intransitive", ["v.i.", "v. i.", "vi.", "vi", "v. i", "v.i"]],
  ["verb reflexive", ["v.r.", "v. r."]],
  ["past participle", ["p.p.", "p. p.", "p.p", "p. p", "pp.", "pp"]],
  ["present participle", ["pres. part.", "p. pr. & vb. n."]],
  ["personal pronoun", ["pers. pron."]],
  ["third person singular present", ["3d pers. sing. pres.", "3d pers. sing."]],
  ["second person singular present", ["2d pers. sing. pres."]],
  ["imperfect", ["imp.", "imperf."]],
  ["transitive", ["t.", "t"]],
  ["intransitive", ["i.", "i"]],
  ["adjective & noun", ["a. & n.", "a & n.", "n. & a.", "n & a."]],
  ["adjective & adverb", ["a. & adv.", "a & adv.", "adv. & a.", "adv & a."]],
  ["adjective & verb", ["a. & v.", "a & v."]],
  ["noun & verb", ["n. & v.", "n & v.", "v. & n.", "v & n."]],
  ["adverb & conjunction", ["adv. & conj.", "adv & conj."]],
  ["adjective & pronoun", ["a. & pron.", "a & pron."]],
  ["adjective & participle", ["a. & p.", "a & p."]],
  ["preposition & adverb", ["prep. & adv."]],
  ["preposition & conjunction", ["prep. & conj."]],
  ["interjection & adverb", ["interj. & adv."]],
  ["noun feminine", ["n. f.", "n. fem."]],
  ["noun plural", ["n. pl.", "n.pl.", "n. pl", "n. sing. & pl.", "n.sing. & pl."]],
  ["third person singular present", ["3d pers. sing. pres."]],
  ["second person singular present", ["2d pers. sing. pres."]],
  ["question", ["q."]],
  ["object", ["obj.", "object."]],
];

const SINGLE = {
  n: "noun", "n.": "noun", "n,": "noun",
  v: "verb", "v.": "verb", "vt": "verb transitive",
  a: "adjective", "a.": "adjective", adj: "adjective", "adj.": "adjective",
  adv: "adverb", "adv.": "adverb", "ad.": "adverb", ad: "adverb",
  pron: "pronoun", "pron.": "pronoun",
  prep: "preposition", "prep.": "preposition",
  conj: "conjunction", "conj.": "conjunction",
  interj: "interjection", "interj.": "interjection", "int.": "interjection",
  num: "numeral", "num.": "numeral",
  pref: "prefix", "pref.": "prefix",
  suff: "suffix", "suff.": "suffix",
  pl: "plural", "pl.": "plural",
  sing: "singular", "sing.": "singular",
  comp: "comparative", "comparative.": "comparative",
  compar: "comparative", "compar.": "comparative",
  superl: "superlative", "superl.": "superlative", "supperl.": "superlative",
  aux: "auxiliary", "aux.": "auxiliary",
  fem: "feminine", "f.": "feminine", f: "feminine",
  m: "masculine", "m.": "masculine",
  pr: "present", "pr.": "present",
  part: "participle", "part.": "participle",
  obj: "object", "obj.": "object", object: "object",
  pers: "personal", "pers.": "personal",
  poss: "possessive", "poss.": "possessive",
  "3d": "third", "2d": "second",
  pres: "present", "pres.": "present",
  imp: "imperative", "imp.": "imperative",
};

// Canonical values we never touch.
const FULL = new Set([
  "noun", "adjective", "verb", "verb_transitive", "verb_intransitive", "verb_both",
  "adverb", "pronoun", "preposition", "conjunction", "interjection", "numeral",
  "prefix", "suffix", "plural", "noun_plural", "singular", "participial",
  "perfect_participle", "present_participle", "preterit", "preterit_perfect",
  "superlative", "comparative", "unknown", "adjective_noun", "noun_verb",
  "past_participle", "object", "verb reflexive", "transitive", "intransitive",
]);

function expandWords(s) {
  let out = s;
  // 1) Longest multi-token abbreviations first
  for (const [full, alts] of MULTI) {
    for (const alt of alts) {
      // replace with boundary-safe regex (avoids matching inside longer words)
      const re = new RegExp("(?<![a-z])" + alt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![a-z])", "gi");
      out = out.replace(re, (m) => (m[0] === m[0].toUpperCase() ? full.charAt(0).toUpperCase() + full.slice(1) : full));
    }
  }
  // 2) Normalize separators: commas and slashes become "&"-ish separators
  out = out.replace(/\s*[,\/]\s*/g, " ");
  out = out.replace(/\s+&\s+/g, " & ");
  // 3) Expand remaining single tokens
  const pieces = out.split(/\s+/);
  const mapped = pieces.map((p) => {
    if (p === "&" || p === "or") return p;
    const key = p.replace(/\.+$/, ".").toLowerCase();
    return SINGLE[key] || SINGLE[p.toLowerCase()] || (FULL.has(p) ? p : p.replace(/\.+$/g, "").replace(/^\.+/, ""));
  });
  let joined = mapped.join(" ").replace(/\s+/g, " ").replace(/\s+&/g, " &").replace(/&\s+/g, "& ").replace(/\s+or\s+/g, " or ").trim();
  // 4) Remove duplicate consecutive full words ("past participle past participle" -> "past participle", "adjective adjective" -> "adjective", "& &" -> "&")
  joined = joined
    .replace(/\b(\w+)\s+\1\b/g, "$1")
    .replace(/\s*&\s*&\s*/g, " & ")
    .replace(/\(&\s*\)/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/\s*&\s*$/g, "")
    .trim();
  return joined;
}

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost", port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root", password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "manipuri_dictionary", charset: "utf8mb4",
  });

  console.log("=== WORDTYPE NORMALIZATION (DRY-RUN) ===");
  const distinct = await c.query(
    "SELECT DISTINCT wordtype FROM (SELECT wordtype FROM word_senses UNION SELECT wordtype FROM word_translations) t WHERE wordtype != ''"
  );
  let willChange = 0;
  const changes = [];
  for (const r of distinct) {
    const before = r.wordtype;
    const after = expandWords(before);
    if (after !== before) {
      willChange++;
      changes.push({ before, after });
    }
  }
  console.log("Distinct wordtype values:", distinct.length);
  console.log("Distinct values that would change:", willChange);
  console.log("\nSample of changes (max 60):");
  changes.slice(0, 60).forEach((ch) => console.log(`  "${ch.before}"  ->  "${ch.after}"`));

  if (process.argv.includes("--apply")) {
    console.log("\nApplying…");
    await c.beginTransaction();
    let n1 = 0;
    for (const ch of changes) {
      const r = await c.query("UPDATE word_senses SET wordtype = ? WHERE wordtype = ?", [ch.after, ch.before]);
      n1 += r.affectedRows;
    }
    let n2 = 0;
    for (const ch of changes) {
      const r = await c.query("UPDATE word_translations SET wordtype = ? WHERE wordtype = ?", [ch.after, ch.before]);
      n2 += r.affectedRows;
    }
    await c.commit();
    console.log(`Updated word_senses rows: ${n1}`);
    console.log(`Updated word_translations rows: ${n2}`);
    const distinctAfter = await c.query(
      "SELECT DISTINCT wordtype FROM (SELECT wordtype FROM word_senses UNION SELECT wordtype FROM word_translations) t WHERE wordtype != '' ORDER BY wordtype"
    );
    console.log("\nDistinct values after:", distinctAfter.length);
    distinctAfter.slice(0, 80).forEach((r) => console.log("  ", r.wordtype));
  } else {
    console.log("\nDRY-RUN only — pass --apply to write changes.");
  }

  await c.end();
})().catch((e) => { console.error("FAIL:", e && e.message); process.exit(1); });