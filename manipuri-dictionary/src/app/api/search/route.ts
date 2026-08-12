import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

interface SearchResult {
  id: bigint;
  word: string;
  slug: string;
  sense_count: bigint;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? 8), 50);

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  try {
    const raw = await prisma.$queryRaw<SearchResult[]>`
      SELECT w.id, w.word, w.slug,
             (SELECT COUNT(*) FROM word_senses ws WHERE ws.word_id = w.id AND ws.status = 'approved') as sense_count
      FROM words w
      WHERE w.word LIKE ${`%${q}%`} OR w.search_index LIKE ${`%${q}%`}
      ORDER BY
        CASE
          WHEN w.word = ${q} THEN 0
          WHEN w.word LIKE ${`${q}%`} THEN 1
          ELSE 2
        END,
        w.word
      LIMIT ${limit}
    `;

    // Convert BigInt to strings for JSON serialization
    const results = raw.map((r) => ({
      id: r.id.toString(),
      word: r.word,
      slug: r.slug,
      sense_count: Number(r.sense_count),
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}