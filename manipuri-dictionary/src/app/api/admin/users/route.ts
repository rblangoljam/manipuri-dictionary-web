import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  nos_word_submitted: number;
  nos_word_approved: number;
  nos_word_rejected: number;
  created_at: Date;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await prisma.$queryRaw<UserRow[]>`
      SELECT id, name, email, role, status, nos_word_submitted, nos_word_approved, nos_word_rejected, created_at
      FROM users
      ORDER BY id ASC
    `;

    return NextResponse.json({ users: rows });
  } catch (error) {
    console.error("Admin users list error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const targetId = Number(body?.userId);
    const action = String(body?.action ?? ""); // "role" | "status"
    const value = String(body?.value ?? "");

    if (!targetId || !action) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const currentAdminId = parseInt(session.user.id, 10);

    // Prevent an admin from demoting themselves
    if (targetId === currentAdminId && (action === "role")) {
      return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });
    }

    if (action === "role") {
      if (!["user", "contributor", "moderator", "admin"].includes(value)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      await prisma.$executeRaw`
        UPDATE users SET role = ${value} WHERE id = ${targetId}
      `;
    } else if (action === "status") {
      if (!["active", "banned"].includes(value)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      // Prevent banning yourself
      if (targetId === currentAdminId && value === "banned") {
        return NextResponse.json({ error: "You cannot ban yourself" }, { status: 400 });
      }
      await prisma.$executeRaw`
        UPDATE users SET status = ${value} WHERE id = ${targetId}
      `;
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin users update error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}