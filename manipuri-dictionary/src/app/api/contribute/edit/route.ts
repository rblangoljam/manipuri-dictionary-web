import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { editWordSchema } from "@/lib/validation/contribute";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to suggest an edit" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = editWordSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: errors },
        { status: 400 }
      );
    }

    const { wordId, senseId, word, wordtype, definition, meaningEngMan, meaningMm, synonyms, antonyms } =
      parsed.data;
    const userId = parseInt(session.user.id, 10);

    // Verify the word exists
    const existing = await prisma.$queryRaw`
      SELECT id FROM words WHERE id = ${BigInt(wordId)} LIMIT 1
    `;

    if ((existing as unknown[]).length === 0) {
      return NextResponse.json(
        { error: "Word not found" },
        { status: 404 }
      );
    }

    const result = await prisma.$executeRaw`
      INSERT INTO edit_proposals (
        sense_id, word_id, proposed_word, proposed_wordtype,
        proposed_definition, proposed_meaning_eng_man, proposed_meaning_mm,
        proposed_antonyms, proposed_synonyms, status, submitted_by
      )
      VALUES (
        ${senseId ? BigInt(senseId) : null}, ${BigInt(wordId)}, ${word}, ${wordtype},
        ${definition}, ${meaningEngMan}, ${meaningMm},
        ${antonyms}, ${synonyms}, 'pending', ${userId}
      )
    `;

    if (result !== 1) {
      return NextResponse.json(
        { error: "Failed to submit edit proposal" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Edit suggestion submitted for review" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Contribute edit error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}