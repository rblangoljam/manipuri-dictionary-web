import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canModerate } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || !canModerate(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const published = await prisma.$queryRaw<Array<{ c: bigint }>>`
      SELECT COUNT(*) AS c FROM words
    `;
    const pending = await prisma.$queryRaw<Array<{ c: bigint }>>`
      SELECT COUNT(*) AS c FROM edit_proposals WHERE status = 'pending'
    `;
    const users = await prisma.$queryRaw<Array<{ c: bigint }>>`
      SELECT COUNT(*) AS c FROM users
    `;
    const moderators = await prisma.$queryRaw<Array<{ c: bigint }>>`
      SELECT COUNT(*) AS c FROM users WHERE role IN ('moderator', 'admin')
    `;

    const recentContributions = await prisma.$queryRaw<Array<{ id: bigint; proposed_word: string; status: string; submitted_name: string | null; created_at: Date }>>`
      SELECT ep.id, ep.proposed_word, ep.status, u.name AS submitted_name, ep.created_at
      FROM edit_proposals ep
      LEFT JOIN users u ON u.id = ep.submitted_by
      ORDER BY ep.created_at DESC
      LIMIT 10
    `;

    const recentActivity = await prisma.$queryRaw<Array<{ id: bigint; action: string; moderator_name: string | null; proposed_word: string | null; created_at: Date }>>`
      SELECT ml.id, ml.action, u.name AS moderator_name, ep.proposed_word, ml.created_at
      FROM moderation_logs ml
      LEFT JOIN users u ON u.id = ml.moderator_id
      LEFT JOIN edit_proposals ep ON ep.id = ml.proposal_id
      ORDER BY ml.created_at DESC
      LIMIT 10
    `;

    return NextResponse.json({
      published: Number(published[0]?.c ?? 0),
      pending: Number(pending[0]?.c ?? 0),
      users: Number(users[0]?.c ?? 0),
      moderators: Number(moderators[0]?.c ?? 0),
      recentContributions: recentContributions.map((r) => ({
        ...r,
        id: r.id.toString(),
      })),
      recentActivity: recentActivity.map((r) => ({
        ...r,
        id: r.id.toString(),
      })),
    });
  } catch (error) {
    console.error("Admin metrics error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}