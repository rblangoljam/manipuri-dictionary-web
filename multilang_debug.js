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
  const eng = 8;
  const man = 1;
  const run = async (label, sql, params) => {
    try {
      const r = await c.query(sql, params || []);
      console.log("OK:", label, JSON.stringify(r && r.affectedRows !== undefined ? { affectedRows: r.affectedRows } : r));
    } catch (e) {
      console.log("ERR:", label);
      console.log("  message:", e && e.message);
      console.log("  code:", e && e.code);
      console.log("  stack:", e && e.stack);
    }
  };

  await run("count word_senses", "SELECT COUNT(*) c FROM word_senses");
  await run("sample imported rows", "SELECT ws.word_id, ws.meaning_eng_man, ws.meaning_mm_unicode, ws.wordtype FROM word_senses ws JOIN words w ON w.id=ws.word_id WHERE w.language_id=? AND ws.meaning_eng_man IS NOT NULL AND TRIM(ws.meaning_eng_man)!='' LIMIT 2", [man]);
  await run("A insert ignore", `
    INSERT IGNORE INTO word_translations (word_id, language_id, translation, mayek_unicode, wordtype, definition)
    SELECT DISTINCT ws.word_id, ?, ws.meaning_eng_man, ws.meaning_mm_unicode, ws.wordtype, ws.definition
    FROM word_senses ws JOIN words w ON w.id=ws.word_id
    WHERE w.language_id=? AND ws.meaning_eng_man IS NOT NULL AND TRIM(ws.meaning_eng_man)!=''`, [eng, man]);
  await run("B insert ignore", `
    INSERT IGNORE INTO word_translations (word_id, language_id, translation, mayek_unicode, wordtype, definition)
    SELECT DISTINCT ws.word_id, ?, ws.meaning_mm, ws.meaning_mm_unicode, ws.wordtype, ws.definition
    FROM word_senses ws JOIN words w ON w.id=ws.word_id
    WHERE w.language_id=? AND ws.meaning_mm IS NOT NULL AND TRIM(ws.meaning_mm)!=''`, [man, eng]);
  const total = await c.query("SELECT COUNT(*) c FROM word_translations");
  console.log("total translations:", Number(total[0].c));
  await c.end();
})().catch((e) => {
  console.error("FATAL:", e && e.stack || e);
  process.exit(1);
});