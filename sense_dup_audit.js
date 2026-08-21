const mysql = require("mariadb");
(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost", port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root", password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "manipuri_dictionary", charset: "utf8mb4",
  });

  console.log("=== EXACT DUPLICATE SENSE AUDIT (read-only) ===");

  // 1) Duplicate groups: identical (word_id, wordtype, definition) with count > 1
  const groups = await c.query(`
    SELECT word_id, wordtype, definition, COUNT(*) cnt,
           MIN(id) keep_id
    FROM word_senses
    GROUP BY word_id, wordtype, definition
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
  `);
  const dupRows = groups.reduce((s, g) => s + (Number(g.cnt) - 1), 0);
  const dupTotal = groups.reduce((s, g) => s + Number(g.cnt), 0);
  console.log("Duplicate groups (unique word_id+wordtype+definition combos repeated):", groups.length);
  console.log("Rows involved in duplicates (all copies):", dupTotal);
  console.log("Rows that could be REMOVED (keeping one per group, zero-loss):", dupRows);
  console.log("Words affected:", new Set(groups.map((g) => Number(g.word_id))).size);

  // 2) Top 15 words by removable duplicate rows
  console.log("\n=== TOP 15 WORDS BY REMOVABLE DUPLICATES ===");
  const top = await c.query(`
    SELECT w.word, w.slug, groups.dup_groups, groups.removable
    FROM (
      SELECT word_id,
             COUNT(*) AS dup_groups,
             SUM(cnt - 1) AS removable
      FROM (
        SELECT word_id, wordtype, definition, COUNT(*) cnt
        FROM word_senses
        GROUP BY word_id, wordtype, definition
        HAVING COUNT(*) > 1
      ) t
      GROUP BY word_id
    ) groups
    JOIN words w ON w.id = groups.word_id
    ORDER BY groups.removable DESC
    LIMIT 15
  `);
  top.forEach((r) => console.log(`  ${r.word} (${r.slug}): ${r.dup_groups} dup groups, ${r.removable} removable rows`));

  // 3) Sample of actual duplicate content
  console.log("\n=== SAMPLE DUPLICATE SENSES (10) ===");
  const sample = await c.query(`
    SELECT w.word, ws.wordtype, LEFT(ws.definition, 60) def, COUNT(*) cnt
    FROM word_senses ws
    JOIN words w ON w.id = ws.word_id
    GROUP BY w.word, ws.wordtype, ws.definition
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
    LIMIT 10
  `);
  sample.forEach((r) => console.log(`  ${r.word} [${r.wordtype}] "${r.def}" x${r.cnt}`));

  await c.end();
  console.log("\nAUDIT_DONE — read-only, no changes made.");
})().catch((e) => { console.error("FAIL:", e && e.message); process.exit(1); });