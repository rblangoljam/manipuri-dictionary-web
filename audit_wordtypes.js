const mysql = require("mariadb");
(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost", port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root", password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "manipuri_dictionary", charset: "utf8mb4",
  });
  const dump = async (label, sql) => {
    const rows = await c.query(sql);
    console.log("\n=== " + label + " (" + rows.length + " distinct) ===");
    rows.forEach((r) => console.log(`  "${r.wordtype || "(empty)"}"  x${r.c}`));
  };
  await dump("word_senses.wordtype (top 60)", "SELECT wordtype, COUNT(*) c FROM word_senses GROUP BY wordtype ORDER BY c DESC LIMIT 60");
  await dump("word_translations.wordtype (all)", "SELECT wordtype, COUNT(*) c FROM word_translations GROUP BY wordtype ORDER BY c DESC LIMIT 60");
  await c.end();
})().catch((e) => { console.error("FAIL:", e && e.message); process.exit(1); });