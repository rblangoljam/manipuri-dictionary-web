const mysql = require("mariadb");
(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost", port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root", password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "manipuri_dictionary", charset: "utf8mb4",
  });
  const q = "contemporary", lq = q.toLowerCase(), likeQ = "%" + q + "%", likeLq = "%" + lq + "%";
  try {
    const rows = await c.query(`
      SELECT w.id, w.word, w.slug,
        (SELECT COUNT(*) FROM word_senses ws WHERE ws.word_id = w.id AND ws.status='approved') sense_count,
        COALESCE(
          (SELECT wt.mayek_unicode FROM word_translations wt WHERE wt.word_id=w.id AND wt.mayek_unicode IS NOT NULL AND wt.mayek_unicode!='' LIMIT 1),
          (SELECT ws2.meaning_mm_unicode FROM word_senses ws2 WHERE ws2.word_id=w.id AND ws2.status='approved' AND ws2.meaning_mm_unicode IS NOT NULL AND ws2.meaning_mm_unicode!='' LIMIT 1)
        ) mayek,
        COALESCE(
          (SELECT wt.translation FROM word_translations wt JOIN languages l ON l.id=wt.language_id WHERE wt.word_id=w.id AND l.language_code='english' AND wt.translation IS NOT NULL AND wt.translation!='' LIMIT 1),
          (SELECT ws3.meaning_eng_man FROM word_senses ws3 WHERE ws3.word_id=w.id AND ws3.status='approved' AND ws3.meaning_eng_man IS NOT NULL AND ws3.meaning_eng_man!='' LIMIT 1)
        ) translation,
        (SELECT l.language_code FROM languages l WHERE l.id=w.language_id) language
      FROM words w
      WHERE LOWER(w.word) LIKE ? OR w.search_index LIKE ?
        OR EXISTS (SELECT 1 FROM word_translations wt WHERE wt.word_id=w.id AND wt.translation LIKE ?)
        OR EXISTS (SELECT 1 FROM word_senses ws WHERE ws.word_id=w.id AND ws.status='approved' AND (ws.definition LIKE ? OR ws.meaning_eng_man LIKE ?))
      ORDER BY CASE
        WHEN LOWER(w.word)=? THEN 0
        WHEN LOWER(w.word) LIKE ? THEN 1
        WHEN EXISTS (SELECT 1 FROM word_translations wt WHERE wt.word_id=w.id AND wt.translation LIKE ?) THEN 1.3
        WHEN EXISTS (SELECT 1 FROM word_senses ws WHERE ws.word_id=w.id AND ws.status='approved' AND (ws.definition LIKE ? OR ws.meaning_eng_man LIKE ?)) THEN 1.5
        ELSE 2 END, w.word
      LIMIT 6`,
      [likeLq, likeLq, likeQ, likeQ, likeQ, lq, lq + "%", likeQ, likeQ, likeQ]);
    console.log("rows:", rows.length);
    rows.forEach((r) => console.log("-", r.word, "lang=" + (r.language || ""), "mayek=" + (r.mayek || "").slice(0, 10), "trans=" + (r.translation || "").slice(0, 24)));
  } catch (e) {
    console.log("SQL ERR:", e && e.message);
    console.log("SQL code:", e && e.code);
  }
  await c.end();
})().catch((e) => { console.error("FATAL:", e && e.message); process.exit(1); });