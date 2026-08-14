import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

interface WordRow {
  id: bigint;
  word: string;
  slug: string;
  senseId: bigint | null;
  wordtype: string;
  wordtypeRaw: string;
  definition: string;
  meaningEngMan: string;
  meaningMmUnicode: string | null;
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

    // Return ALL approved senses (each is an independent meaning).
    const rows = await prisma.$queryRaw<WordRow[]>`
      SELECT
        w.id, w.word, w.slug,
        ws.id AS senseId,
        ws.wordtype,
        ws.wordtype_raw AS wordtypeRaw,
        ws.definition,
        ws.meaning_eng_man AS meaningEngMan,
        ws.meaning_mm_unicode AS meaningMmUnicode,
        ws.synonyms,
        ws.antonyms
      FROM words w
      LEFT JOIN word_senses ws ON ws.word_id = w.id AND ws.status = 'approved'
      WHERE w.slug = ${slug}
      ORDER BY ws.id
    `;

    if (!rows[0]) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    const word = {
      id: rows[0].id.toString(),
      word: rows[0].word,
      slug: rows[0].slug,
      senses: rows
        .filter((r) => r.senseId !== null)
        .map((r) => ({
          senseId: r.senseId!.toString(),
          wordtype: r.wordtype,
          wordtypeRaw: r.wordtypeRaw,
          definition: r.definition,
          meaningEngMan: r.meaningEngMan,
          meaningMmUnicode: r.meaningMmUnicode,
          synonyms: r.synonyms,
          antonyms: r.antonyms,
        })),
    };

    return NextResponse.json({ word });
  } catch (error) {
    console.error("Contribute word error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}