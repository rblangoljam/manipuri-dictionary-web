const mysql = require("mariadb");
(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "manipuri_dictionary",
  });
  const word = "houminnaba";
  const q = "contemporary";
  const lq = q.toLowerCase();
  console.log("1) Direct row check:", word);
  const a = await c.query(
    "SELECT w.word, ws.wordtype, LEFT(ws.definition,40) def, LEFT(ws.meaning_mm_unicode,18) mm FROM words w JOIN word_senses ws ON ws.word_id=w.id WHERE LOWER(w.word)=? LIMIT 3",
    [word]
  );
  a.forEach((r) => console.log(`   ${r.word} [${r.wordtype}] def="${r.def}" mm="${r.mm}"`));

  console.log("2) Does gloss 'contemporary' match houminnaba?");
  const b = await c.query(
    "SELECT id FROM word_senses WHERE word_id=(SELECT id FROM words WHERE LOWER(word)=?) AND (definition LIKE ? OR meaning_eng_man LIKE ?) LIMIT 3",
    [word, "%" + q + "%", "%" + q + "%"]
  );
  console.log("   gloss matches:", b.length);

  console.log("3) Full API-style query for q=contemporary:");
  const rows = await c.query(
    `SELECT w.id,w.word,w.slug,
            (SELECT ws2.meaning_mm_unicode FROM word_senses ws2 WHERE ws2.word_id=w.id AND ws2.status='approved' AND ws2.meaning_mm_unicode IS NOT NULL AND ws2.meaning_mm_unicode!='' LIMIT 1) mayek,
            (SELECT ws3.meaning_eng_man FROM word_senses ws3 WHERE ws3.word_id=w.id AND ws3.status='approved' AND ws3.meaning_eng_man IS NOT NULL AND ws3.meaning_eng_man!='' LIMIT 1) translation
     FROM words w
     WHERE LOWER(w.word) LIKE ?
        OR w.search_index LIKE ?
        OR EXISTS (SELECT 1 FROM word_senses ws WHERE ws.word_id=w.id AND ws.status='approved' AND (ws.definition LIKE ? OR ws.meaning_eng_man LIKE ?))
     ORDER BY CASE
        WHEN LOWER(w.word)=? THEN 0
        WHEN LOWER(w.word) LIKE ? THEN 1
        WHEN EXISTS (SELECT 1 FROM word_senses ws WHERE ws.word_id=w.id AND ws.status='approved' AND (ws.definition LIKE ? OR ws.meaning_eng_man LIKE ?)) AND w.word NOT LIKE '% %' THEN 1.5
        ELSE 2 END, w.word
     LIMIT 12`,
    ["%" + lq + "%", "%" + lq + "%", "%" + q + "%", "%" + q + "%", lq, lq + "%", "%" + q + "%", "%" + q + "%"]
  );
  rows.forEach((r) => console.log(`   ${r.id} ${r.word} mayek="${(r.mayek || "").slice(0, 16)}" trans="${(r.translation || "").slice(0, 30)}"`));
  await c.end();
})().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});