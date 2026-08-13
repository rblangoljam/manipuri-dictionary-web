const mysql = require("mariadb");
(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "manipuri_dictionary",
    charset: "utf8mb4",
  });
  const eng = 8; // english id from migration
  const man = 1; // manipuri id
  const already = await c.query("SELECT COUNT(*) c FROM word_translations");
  if (Number(already[0].c) > 0) {
    console.log("word_translations already has rows:", Number(already[0].c), "- abort backfill");
    await c.end();
    return;
  }

  console.log("Backfilling word_translations…");

  // A) Imported Manipuri headwords -> English translation (their gloss)
  const r1 = await c.query(`
    INSERT IGNORE INTO word_translations (word_id, language_id, translation, mayek_unicode, wordtype, definition)
    SELECT DISTINCT ws.word_id, ${eng}, ws.meaning_eng_man, ws.meaning_mm_unicode, ws.wordtype, ws.definition
    FROM word_senses ws
    JOIN words w ON w.id = ws.word_id
    WHERE w.language_id = ${man}
      AND ws.meaning_eng_man IS NOT NULL AND TRIM(ws.meaning_eng_man) != ''
  `);
  console.log("  Imported->English translations inserted:", r1.affectedRows);

  // B) English headwords -> Manipuri translation (their Mayek where present)
  const r2 = await c.query(`
    INSERT IGNORE INTO word_translations (word_id, language_id, translation, mayek_unicode, wordtype, definition)
    SELECT DISTINCT ws.word_id, ${man}, ws.meaning_mm, ws.meaning_mm_unicode, ws.wordtype, ws.definition
    FROM word_senses ws
    JOIN words w ON w.id = ws.word_id
    WHERE w.language_id = ${eng}
      AND ws.meaning_mm IS NOT NULL AND TRIM(ws.meaning_mm) != ''
  `);
  console.log("  English->Manipuri translations inserted:", r2.affectedRows);

  const total = (await c.query("SELECT COUNT(*) c FROM word_translations"))[0].c;
  console.log("Total word_translations rows:", Number(total));
  const sample = await c.query(`
    SELECT wt.id, w.word, l.language_code, wt.translation, LEFT(wt.mayek_unicode,12) mayek, wt.wordtype
    FROM word_translations wt
    JOIN words w ON w.id = wt.word_id
    JOIN languages l ON l.id = wt.language_id
    WHERE w.word IN ('houminnaba','contemporary') LIMIT 6
  `);
  sample.forEach((r) =>
    console.log(`  ${r.word} [${r.language_code}] -> ${r.translation || ""} ${r.mayek || ""} (${r.wordtype})`)
  );
  await c.end();
  console.log("BACKFILL_OK");
})().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});