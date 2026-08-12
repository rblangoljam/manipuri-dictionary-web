import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

interface WordRow {
  id: bigint;
  word: string;
  slug: string;
  sense_id: bigint | null;
  wordtype: string;
  definition: string;
  meaning_eng_man: string;
  meaning_mm_unicode: string | null;
  synonyms: string;
  antonyms: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const rows = await prisma.$queryRaw<WordRow[]>`
      SELECT
        w.id, w.word, w.slug,
        ws.id AS sense_id,
        ws.wordtype,
        ws.definition,
        ws.meaning_eng_man,
        ws.meaning_mm_unicode,
        ws.synonyms,
        ws.antonyms
      FROM words w
      LEFT JOIN word_senses ws ON ws.word_id = w.id AND ws.status = 'approved'
      WHERE w.slug = ${slug}
      ORDER BY ws.id
      LIMIT 1
    `;

    if (!rows[0]) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    // Convert BigInt fields to strings for JSON serialization
    const row = rows[0];
    const word = {
      ...row,
      id: row.id.toString(),
      sense_id: row.sense_id ? row.sense_id.toString() : null,
    };

    return NextResponse.json({ word });
  } catch (error) {
    console.error("Contribute word error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}