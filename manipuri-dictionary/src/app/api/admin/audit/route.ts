import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canModerate } from "@/lib/permissions";

export const dynamic = "force-dynamic";

interface AuditRow {
  id: bigint;
  action: string;
  note: string | null;
  moderator_name: string | null;
  moderator_email: string | null;
  proposed_word: string | null;
  created_at: Date;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || !canModerate(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await prisma.$queryRaw<AuditRow[]>`
      SELECT
        ml.id,
        ml.action,
        ml.note,
        u.name AS moderator_name,
        u.email AS moderator_email,
        ep.proposed_word,
        ml.created_at
      FROM moderation_logs ml
      LEFT JOIN users u ON u.id = ml.moderator_id
      LEFT JOIN edit_proposals ep ON ep.id = ml.proposal_id
      ORDER BY ml.created_at DESC
      LIMIT 200
    `;

    const logs = rows.map((r) => ({ ...r, id: r.id.toString() }));

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Audit log error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}