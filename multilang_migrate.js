const mysql = require("mariadb");
(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "manipuri_dictionary",
    charset: "utf8mb4",
    multipleStatements: true,
  });

  console.log("=== MULTILINGUAL SCHEMA MIGRATION ===");

  // 0) Pre-checks (in case of re-run)
  const langs = await c.query("SELECT language_code FROM languages");
  const hasEnglish = langs.some((r) => r.language_code === "english");
  if (!hasEnglish) {
    await c.query("INSERT INTO languages (language_name, language_code) VALUES ('English','english')");
    console.log("Added language: english");
  }
  const eng = (await c.query("SELECT id FROM languages WHERE language_code='english' LIMIT 1"))[0].id;
  const man = (await c.query("SELECT id FROM languages WHERE language_code='manipuri' OR language_code='mn' LIMIT 1"))[0].id;
  console.log("en id:", eng, "| manipuri id:", man);

  // 1) Add language_id to words (nullable for the migration step)
  const col = await c.query("SHOW COLUMNS FROM words LIKE 'language_id'");
  if (col.length === 0) {
    await c.query("ALTER TABLE words ADD COLUMN language_id INT NULL, ADD KEY idx_words_lang (language_id)");
    console.log("Added words.language_id");
  }

  // 2) Create word_translations hub
  const tbl = await c.query("SHOW TABLES LIKE 'word_translations'");
  if (tbl.length === 0) {
    await c.query(`
      CREATE TABLE word_translations (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        word_id BIGINT NOT NULL,
        language_id INT NOT NULL,
        translation VARCHAR(255) NOT NULL,
        mayek_unicode TEXT NULL,
        wordtype VARCHAR(50) NOT NULL DEFAULT '',
        definition TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_wt (word_id, language_id, translation(100)),
        KEY idx_wt_word (word_id),
        KEY idx_wt_lang (language_id),
        CONSTRAINT fk_wt_word FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
        CONSTRAINT fk_wt_lang FOREIGN KEY (language_id) REFERENCES languages(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("Created word_translations");
  }

  // 3) Tag existing English headwords
  await c.query("UPDATE words SET language_id=? WHERE language_id IS NULL AND id NOT IN (SELECT word_id FROM word_senses WHERE submitted_by=1)", [eng]);
  console.log("Tagged existing English words");

  // 4) Tag imported Manipuri headwords
  await c.query("UPDATE words SET language_id=? WHERE language_id IS NULL AND id IN (SELECT word_id FROM word_senses WHERE submitted_by=1)", [man]);
  console.log("Tagged imported Manipuri words");

  const untagged = await c.query("SELECT COUNT(*) c FROM words WHERE language_id IS NULL");
  console.log("Untagged words:", Number(untagged[0].c));

  await c.end();
  console.log("SCHEMA_OK");
})().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});