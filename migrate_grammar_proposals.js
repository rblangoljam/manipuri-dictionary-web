const mysql = require("mariadb");
(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost", port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root", password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "manipuri_dictionary", charset: "utf8mb4",
  });

  console.log("=== NON-DESTRUCTIVE MIGRATION ===");

  const addCol = async (table, col, ddl) => {
    const r = await c.query("SHOW COLUMNS FROM " + table + " LIKE ?", [col]);
    if (r.length === 0) {
      await c.query("ALTER TABLE " + table + " ADD COLUMN " + ddl);
      console.log("  added " + table + "." + col);
    } else {
      console.log("  exists " + table + "." + col);
    }
  };

  // 1) edit_proposals: proposal_type + proposed_data (non-destructive; word_id/sense_id kept as targets)
  await addCol("edit_proposals", "proposal_type", "proposal_type VARCHAR(32) NULL");
  await addCol("edit_proposals", "proposed_data", "proposed_data JSON NULL");
  // 1b) edit_proposals: language of the proposed word (nullable, non-destructive)
  await addCol("edit_proposals", "language_id", "language_id INT NULL");

  // 2) word_senses: nullable optional grammar metadata
  await addCol("word_senses", "verb_type", "verb_type VARCHAR(50) NULL");
  await addCol("word_senses", "verb_forms", "verb_forms JSON NULL");
  await addCol("word_senses", "noun_number", "noun_number VARCHAR(20) NULL");
  await addCol("word_senses", "noun_gender", "noun_gender VARCHAR(20) NULL");
  await addCol("word_senses", "pronoun_type", "pronoun_type VARCHAR(20) NULL");
  await addCol("word_senses", "adjective_degree", "adjective_degree VARCHAR(20) NULL");
  await addCol("word_senses", "numeral_type", "numeral_type VARCHAR(20) NULL");

  // 3) Register Tangkhul if missing (idempotent)
  const langs = await c.query("SELECT language_code FROM languages");
  if (!langs.some((l) => l.language_code === "tangkhul")) {
    await c.query("INSERT INTO languages (language_name, language_code) VALUES ('Tangkhul','tangkhul')");
    console.log("  added language tangkhul");
  } else {
    console.log("  exists language tangkhul");
  }

  console.log("MIGRATION_OK");
  await c.end();
})().catch((e) => { console.error("FAIL:", e && e.message); process.exit(1); });