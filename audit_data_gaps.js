const mysql = require("mariadb");

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "manipuri_dictionary",
  });

  const n = (r) => Number(r[0].c);

  console.log("=== OVERALL COUNTS ===");
  const total = n(await c.query("SELECT COUNT(*) c FROM word_senses"));
  const approved = n(await c.query("SELECT COUNT(*) c FROM word_senses WHERE status='approved'"));
  const noEng = n(await c.query("SELECT COUNT(*) c FROM word_senses WHERE status='approved' AND (meaning_eng_man IS NULL OR TRIM(meaning_eng_man)='')"));
  const noDef = n(await c.query("SELECT COUNT(*) c FROM word_senses WHERE status='approved' AND (definition IS NULL OR TRIM(definition)='')"));
  const noMM = n(await c.query("SELECT COUNT(*) c FROM word_senses WHERE status='approved' AND (meaning_mm IS NULL OR TRIM(meaning_mm)='' OR meaning_mm IN ('\r','\n','\r\n'))"));
  const noMMU = n(await c.query("SELECT COUNT(*) c FROM word_senses WHERE status='approved' AND (meaning_mm_unicode IS NULL OR TRIM(meaning_mm_unicode)='')"));
  console.log("total senses:", total);
  console.log("approved senses:", approved);
  console.log("EMPTY meaning_eng_man:", noEng, "(" + Math.round((noEng / approved) * 100) + "%)");
  console.log("EMPTY definition:", noDef, "(" + Math.round((noDef / approved) * 100) + "%)");
  console.log("EMPTY meaning_mm:", noMM, "(" + Math.round((noMM / approved) * 100) + "%)");
  console.log("EMPTY meaning_mm_unicode:", noMMU, "(" + Math.round((noMMU / approved) * 100) + "%)");

  console.log("\n=== WORDS WITH SENSES MISSING meaning_eng_man (sample 15) ===");
  const gapWords = await c.query(`
    SELECT w.word, w.slug,
      COUNT(ws.id) AS total_senses,
      SUM(CASE WHEN ws.meaning_eng_man IS NULL OR TRIM(ws.meaning_eng_man)='' THEN 1 ELSE 0 END) AS missing_eng
    FROM words w
    JOIN word_senses ws ON ws.word_id = w.id AND ws.status='approved'
    WHERE ws.meaning_eng_man IS NULL OR TRIM(ws.meaning_eng_man)=''
    GROUP BY w.id, w.word, w.slug
    ORDER BY missing_eng DESC
    LIMIT 15
  `);
  for (const r of gapWords) {
    console.log(`${r.word} (${r.slug}): ${r.missing_eng}/${r.total_senses} senses missing eng_man`);
  }

  console.log("\n=== WORDS WITH MULTI-SENSES WHERE SOME MEANINGS MISSING (partial coverage) ===");
  const partial = await c.query(`
    SELECT w.word, w.slug,
      COUNT(ws.id) AS total_senses,
      SUM(CASE WHEN ws.meaning_eng_man IS NULL OR TRIM(ws.meaning_eng_man)='' THEN 1 ELSE 0 END) AS missing_eng
    FROM words w
    JOIN word_senses ws ON ws.word_id = w.id AND ws.status='approved'
    GROUP BY w.id, w.word, w.slug
    HAVING COUNT(ws.id) > 1
      AND SUM(CASE WHEN ws.meaning_eng_man IS NULL OR TRIM(ws.meaning_eng_man)='' THEN 1 ELSE 0 END) > 0
    ORDER BY total_senses DESC
    LIMIT 20
  `);
  for (const r of partial) {
    console.log(`${r.word} (${r.slug}): ${r.missing_eng}/${r.total_senses} senses missing eng_man`);
  }

  console.log("\n=== SAMPLE MISSING-translation ROWS (10) ===");
  const sample = await c.query(`
    SELECT w.word, ws.id AS sense_id, ws.wordtype, LEFT(ws.definition, 100) AS def, LEFT(ws.meaning_mm, 60) AS mm
    FROM word_senses ws
    JOIN words w ON w.id = ws.word_id
    WHERE ws.status='approved' AND (ws.meaning_eng_man IS NULL OR TRIM(ws.meaning_eng_man)='')
    LIMIT 10
  `);
  for (const r of sample) {
    console.log(`- ${r.word} [${r.wordtype}] def="${r.def || ''}" mm="${r.mm || ''}"`);
  }

  await c.end();
})().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});