import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { editWordSchema } from "@/lib/validation/contribute";

export const dynamic = "force-dynamic";

async function ensureColumns() {
  try {
    await prisma.$executeRaw`ALTER TABLE edit_proposals ADD COLUMN IF NOT EXISTS proposed_meanings JSON NULL`;
    await prisma.$executeRaw`ALTER TABLE edit_proposals ADD COLUMN IF NOT EXISTS proposal_type VARCHAR(32) NULL`;
    await prisma.$executeRaw`ALTER TABLE edit_proposals ADD COLUMN IF NOT EXISTS proposed_data JSON NULL`;
    await prisma.$executeRaw`ALTER TABLE edit_proposals ADD COLUMN IF NOT EXISTS language_id INT NULL`;
  } catch {
    // Older MySQL may not support ADD COLUMN IF NOT EXISTS; ignore.
  }
}

export async function POST(request: Request) {
  await ensureColumns();
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

    const { wordId, senseId, word, meanings, languageId } = parsed.data;
    const first = meanings[0];
    const wordtype = first.wordtypeRaw ?? first.wordType;
    const definition = first.definition;
    const meaningEngMan = first.meaningEngMan ?? "";
    const meaningMm = first.meaningMm ?? "";
    const synonyms = first.synonyms ?? "";
    const antonyms = first.antonyms ?? "";
    const meaningsJson = JSON.stringify(meanings);
    const proposedData = JSON.stringify({ proposal_type: "update_meaning", languageId: languageId ?? null, word, meanings });
    const userId = parseInt(session.user.id, 10);

    const lang = languageId
      ? await prisma.$queryRaw<Array<{ id: number }>>`
          SELECT id FROM languages WHERE id = ${Number(languageId)} OR language_code = ${String(languageId)} LIMIT 1
        `
      : await prisma.$queryRaw<Array<{ id: number }>>`
          SELECT id FROM languages WHERE language_code = 'mn' LIMIT 1
        `;
    const languageDbId = lang[0]?.id ?? null;

    const result = await prisma.$executeRaw`
      INSERT INTO edit_proposals (
        sense_id, word_id, proposed_word, proposed_wordtype,
        proposed_definition, proposed_meaning_eng_man, proposed_meaning_mm,
        proposed_antonyms, proposed_synonyms, proposed_meanings,
        proposal_type, proposed_data, language_id, status, submitted_by
      )
      VALUES (
        ${senseId || null}, ${parseInt(wordId, 10) || null}, ${word}, ${wordtype},
        ${definition}, ${meaningEngMan}, ${meaningMm},
        ${antonyms}, ${synonyms}, ${meaningsJson},
        'update_meaning', ${proposedData}, ${languageDbId}, 'pending', ${userId}
      )
    `;

    if (result !== 1) {
      return NextResponse.json(
        { error: "Failed to submit edit" },
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