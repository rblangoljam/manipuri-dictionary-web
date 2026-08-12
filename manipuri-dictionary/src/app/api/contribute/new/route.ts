import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { newWordSchema } from "@/lib/validation/contribute";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to suggest a word" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = newWordSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: errors },
        { status: 400 }
      );
    }

    const { word, wordtype, definition, meaningEngMan, meaningMm, synonyms, antonyms } =
      parsed.data;
    const userId = parseInt(session.user.id, 10);

    // Check if word already exists (match on word or search_index)
    const existing = await prisma.$queryRaw`
      SELECT id FROM words WHERE word = ${word} LIMIT 1
    `;

    let wordId: bigint | null = null;
    if ((existing as unknown[]).length > 0) {
      wordId = (existing as Array<{ id: bigint }>)[0].id;
    }

    const result = await prisma.$executeRaw`
      INSERT INTO edit_proposals (
        sense_id, word_id, proposed_word, proposed_wordtype,
        proposed_definition, proposed_meaning_eng_man, proposed_meaning_mm,
        proposed_antonyms, proposed_synonyms, status, submitted_by
      )
      VALUES (
        NULL, ${wordId}, ${word}, ${wordtype},
        ${definition}, ${meaningEngMan}, ${meaningMm},
        ${antonyms}, ${synonyms}, 'pending', ${userId}
      )
    `;

    if (result !== 1) {
      return NextResponse.json(
        { error: "Failed to submit proposal" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Word suggestion submitted for review" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Contribute new error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}