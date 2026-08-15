import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canModerate } from "@/lib/permissions";

export const dynamic = "force-dynamic";

interface ProposalRow {
  id: bigint;
  type: string;
  proposed_word: string;
  proposed_wordtype: string;
  proposed_definition: string;
  proposed_meaning_eng_man: string;
  proposed_meaning_mm: string;
  proposed_synonyms: string;
  proposed_antonyms: string;
  status: string;
  submitted_by: number;
  submitted_name: string;
  submitted_email: string;
  created_at: Date;
  reviewed_at: Date | null;
  reviewed_name: string | null;
  rejection_reason: string | null;
  current_definition: string | null;
  current_wordtype: string | null;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !canModerate(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "pending";

    const rows = await prisma.$queryRaw<ProposalRow[]>`
      SELECT
        ep.id,
        CASE WHEN ep.word_id IS NULL AND ep.sense_id IS NULL THEN 'new' ELSE 'edit' END AS type,
        ep.proposed_word,
        ep.proposed_wordtype,
        ep.proposed_definition,
        ep.proposed_meaning_eng_man,
        ep.proposed_meaning_mm,
        ep.proposed_synonyms,
        ep.proposed_antonyms,
        ep.status,
        ep.submitted_by,
        u.name AS submitted_name,
        u.email AS submitted_email,
        ep.created_at,
        ep.reviewed_at,
        rv.name AS reviewed_name,
        ep.rejection_reason,
        ws.definition AS current_definition,
        ws.wordtype AS current_wordtype
      FROM edit_proposals ep
      LEFT JOIN users u ON u.id = ep.submitted_by
      LEFT JOIN users rv ON rv.id = ep.reviewed_by
      LEFT JOIN word_senses ws ON ws.id = ep.sense_id
      WHERE ep.status = ${status}
      ORDER BY ep.created_at DESC
      LIMIT 100
    `;

    const proposals = rows.map((r) => ({
      ...r,
      id: r.id.toString(),
      submitted_by: r.submitted_by,
    }));

    return NextResponse.json({ proposals });
  } catch (error) {
    console.error("Moderation list error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !canModerate(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const proposalId = String(body?.proposalId ?? "");
    const action = String(body?.action ?? ""); // "approve" | "reject"
    const note = String(body?.note ?? "");

    if (!proposalId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const moderatorId = parseInt(session.user.id, 10);
    const status = action === "approve" ? "approved" : "rejected";

    const rows = await prisma.$queryRaw<Array<{
      id: bigint;
      sense_id: bigint | null;
      word_id: bigint | null;
      proposed_word: string;
      proposed_wordtype: string;
      proposed_definition: string;
      proposed_meaning_eng_man: string;
      proposed_meaning_mm: string;
      proposed_synonyms: string;
      proposed_antonyms: string;
      submitted_by: number;
    }>>`
      SELECT id, sense_id, word_id, proposed_word, proposed_wordtype,
             proposed_definition, proposed_meaning_eng_man, proposed_meaning_mm,
             proposed_synonyms, proposed_antonyms, submitted_by
      FROM edit_proposals
      WHERE id = ${BigInt(proposalId)} AND status = 'pending'
      LIMIT 1
    `;

    if (!rows[0]) {
      return NextResponse.json({ error: "Proposal not found or already reviewed" }, { status: 404 });
    }

    const proposal = rows[0];
    const userId = proposal.submitted_by;

    let insertedWordId: bigint | null = null;
    if (status === "approved") {
      const existing = await prisma.$queryRaw<Array<{ id: bigint }>>`
        SELECT id FROM words WHERE word = ${proposal.proposed_word} LIMIT 1
      `;

      if (existing[0]) {
        await prisma.$executeRaw`
          INSERT INTO word_senses (
            word_id, wordtype, wordtype_raw, definition, meaning_eng_man,
            meaning_mm, antonyms, synonyms, status, submitted_by, reviewed_by, reviewed_at
          ) VALUES (
            ${existing[0].id}, ${proposal.proposed_wordtype}, ${proposal.proposed_wordtype},
            ${proposal.proposed_definition}, ${proposal.proposed_meaning_eng_man},
            ${proposal.proposed_meaning_mm}, ${proposal.proposed_antonyms},
            ${proposal.proposed_synonyms}, 'approved', ${userId}, ${moderatorId}, NOW()
          )
        `;
        insertedWordId = existing[0].id;
      } else {
        const slug = proposal.proposed_word.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "word";
        const firstLetter = proposal.proposed_word.charAt(0).toUpperCase() || "?";
        await prisma.$executeRaw`
          INSERT INTO words (word, slug, first_letter, search_index)
          VALUES (${proposal.proposed_word}, ${slug}, ${firstLetter}, ${proposal.proposed_word.toLowerCase()})
        `;

        const newWord = await prisma.$queryRaw<Array<{ id: bigint }>>`
          SELECT id FROM words WHERE slug = ${slug} LIMIT 1
        `;
        insertedWordId = newWord[0]?.id ?? null;

        if (insertedWordId) {
          await prisma.$executeRaw`
            INSERT INTO word_senses (
              word_id, wordtype, wordtype_raw, definition, meaning_eng_man,
              meaning_mm, antonyms, synonyms, status, submitted_by, reviewed_by, reviewed_at
            ) VALUES (
              ${insertedWordId}, ${proposal.proposed_wordtype}, ${proposal.proposed_wordtype},
              ${proposal.proposed_definition}, ${proposal.proposed_meaning_eng_man},
              ${proposal.proposed_meaning_mm}, ${proposal.proposed_antonyms},
              ${proposal.proposed_synonyms}, 'approved', ${userId}, ${moderatorId}, NOW()
            )
          `;
        }
      }
    }

    // Copy the proposal's language onto the created word (non-destructive)
    if (status === "approved" && insertedWordId) {
      const langRow = await prisma.$queryRaw<Array<{ language_id: number | null }>>`
        SELECT language_id FROM edit_proposals WHERE id = ${BigInt(proposalId)} LIMIT 1
      `;
      const langId = langRow[0]?.language_id ?? null;
      if (langId) {
        await prisma.$executeRaw`
          UPDATE words SET language_id = ${langId} WHERE id = ${insertedWordId}
        `;
      }
    }

    // Update the proposal status
    await prisma.$executeRaw`
      UPDATE edit_proposals
      SET status = ${status}, reviewed_by = ${moderatorId}, reviewed_at = NOW(),
          rejection_reason = ${action === "reject" ? note : null}
      WHERE id = ${BigInt(proposalId)}
    `;

    if (status === "approved") {
      await prisma.$executeRaw`
        UPDATE users SET nos_word_approved = nos_word_approved + 1 WHERE id = ${userId}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE users SET nos_word_rejected = nos_word_rejected + 1 WHERE id = ${userId}
      `;
    }

    await prisma.$executeRaw`
      INSERT INTO moderation_logs (moderator_id, proposal_id, action, note)
      VALUES (${moderatorId}, ${BigInt(proposalId)}, ${action}, ${note || null})
    `;

    return NextResponse.json({ ok: true, status });
  } catch (error) {
    console.error("Moderation action error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}