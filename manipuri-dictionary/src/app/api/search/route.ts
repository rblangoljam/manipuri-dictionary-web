import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

interface SearchResult {
  id: bigint;
  word: string;
  slug: string;
  sense_count: bigint;
  mayek: string | null;
  translation: string | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? 12), 50);

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  try {
    const lq = q.toLowerCase();
    const likeQ = "%" + q + "%";
    const likeLq = "%" + lq + "%";
    const likePrefix = lq + "%";

    const raw = await prisma.$queryRaw<SearchResult[]>`
      SELECT w.id, w.word, w.slug,
             (SELECT COUNT(*) FROM word_senses ws WHERE ws.word_id = w.id AND ws.status = 'approved') as sense_count,
             (SELECT ws2.meaning_mm_unicode FROM word_senses ws2
              WHERE ws2.word_id = w.id AND ws2.status = 'approved'
                AND ws2.meaning_mm_unicode IS NOT NULL AND ws2.meaning_mm_unicode != ''
              LIMIT 1) as mayek,
             (SELECT ws3.meaning_eng_man FROM word_senses ws3
              WHERE ws3.word_id = w.id AND ws3.status = 'approved'
                AND ws3.meaning_eng_man IS NOT NULL AND ws3.meaning_eng_man != ''
              LIMIT 1) as translation
      FROM words w
      WHERE LOWER(w.word) LIKE ${likeLq}
         OR w.search_index LIKE ${likeLq}
         OR EXISTS (
           SELECT 1 FROM word_senses ws
           WHERE ws.word_id = w.id AND ws.status = 'approved'
             AND (ws.definition LIKE ${likeQ} OR ws.meaning_eng_man LIKE ${likeQ})
         )
      ORDER BY
        CASE
          WHEN LOWER(w.word) = ${lq} THEN 0
          WHEN EXISTS (
            SELECT 1 FROM word_senses ws
            WHERE ws.word_id = w.id AND ws.status = 'approved'
              AND (ws.definition LIKE ${likeQ} OR ws.meaning_eng_man LIKE ${likeQ})
          ) THEN 1
          WHEN LOWER(w.word) LIKE ${likePrefix} THEN 1.2
          ELSE 2
        END,
        w.word
      LIMIT ${limit}
    `;

    const results = raw.map((r) => ({
      id: r.id.toString(),
      word: r.word,
      slug: r.slug,
      sense_count: Number(r.sense_count),
      mayek: r.mayek ?? null,
      translation: r.translation ?? null,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}