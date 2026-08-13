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
  language: string | null;
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

    const raw = await prisma.$queryRaw<SearchResult[]>`
      SELECT w.id, w.word, w.slug,
             (SELECT COUNT(*) FROM word_senses ws WHERE ws.word_id = w.id AND ws.status = 'approved') as sense_count,
             -- Meitei Mayek: prefer word_translations mayek, else word_senses
             COALESCE(
               (SELECT wt.mayek_unicode FROM word_translations wt
                WHERE wt.word_id = w.id AND wt.mayek_unicode IS NOT NULL AND wt.mayek_unicode != ''
                LIMIT 1),
               (SELECT ws2.meaning_mm_unicode FROM word_senses ws2
                WHERE ws2.word_id = w.id AND ws2.status = 'approved'
                  AND ws2.meaning_mm_unicode IS NOT NULL AND ws2.meaning_mm_unicode != ''
                LIMIT 1)
             ) as mayek,
             -- Translation: prefer the English meaning from the hub, else gloss
             COALESCE(
               (SELECT wt.translation FROM word_translations wt
                JOIN languages l ON l.id = wt.language_id
                WHERE wt.word_id = w.id AND l.language_code = 'english'
                  AND wt.translation IS NOT NULL AND wt.translation != ''
                LIMIT 1),
               (SELECT ws3.meaning_eng_man FROM word_senses ws3
                WHERE ws3.word_id = w.id AND ws3.status = 'approved'
                  AND ws3.meaning_eng_man IS NOT NULL AND ws3.meaning_eng_man != ''
                LIMIT 1)
             ) as translation,
             (SELECT l.language_code FROM languages l WHERE l.id = w.language_id) as language
      FROM words w
      WHERE LOWER(w.word) LIKE ${likeLq}
         OR w.search_index LIKE ${likeLq}
         OR EXISTS (
           SELECT 1 FROM word_translations wt
           WHERE wt.word_id = w.id AND wt.translation LIKE ${likeQ}
         )
         OR EXISTS (
           SELECT 1 FROM word_senses ws
           WHERE ws.word_id = w.id AND ws.status = 'approved'
             AND (ws.definition LIKE ${likeQ} OR ws.meaning_eng_man LIKE ${likeQ})
         )
      ORDER BY
        CASE
          WHEN LOWER(w.word) = ${lq} THEN 0
          WHEN LOWER(w.word) LIKE ${lq + "%"} THEN 1
          WHEN EXISTS (
            SELECT 1 FROM word_translations wt WHERE wt.word_id = w.id AND wt.translation LIKE ${likeQ}
          ) THEN 1.3
          WHEN EXISTS (
            SELECT 1 FROM word_senses ws
            WHERE ws.word_id = w.id AND ws.status = 'approved'
              AND (ws.definition LIKE ${likeQ} OR ws.meaning_eng_man LIKE ${likeQ})
          ) THEN 1.5
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
      language: r.language ?? null,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}