import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface ContributionRow {
  id: bigint;
  type: string;
  proposed_word: string;
  status: string;
  created_at: Date;
  reviewed_at: Date | null;
  reviewed_name: string | null;
  rejection_reason: string | null;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);

    const rows = await prisma.$queryRaw<ContributionRow[]>`
      SELECT
        ep.id,
        CASE WHEN ep.word_id IS NULL AND ep.sense_id IS NULL THEN 'new' ELSE 'edit' END AS type,
        ep.proposed_word,
        ep.status,
        ep.created_at,
        ep.reviewed_at,
        rv.name AS reviewed_name,
        ep.rejection_reason
      FROM edit_proposals ep
      LEFT JOIN users rv ON rv.id = ep.reviewed_by
      WHERE ep.submitted_by = ${userId}
      ORDER BY ep.created_at DESC
      LIMIT 100
    `;

    const total = rows.length;
    const approved = rows.filter((r) => r.status === "approved").length;
    const pending = rows.filter((r) => r.status === "pending").length;
    const rejected = rows.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      stats: { total, approved, pending, rejected },
      contributions: rows.map((r) => ({
        ...r,
        id: r.id.toString(),
      })),
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}