import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body?.token ?? "");
    const password = String(body?.password ?? "");

    if (!token || password.length < 8) {
      return NextResponse.json({ error: "Invalid token or weak password" }, { status: 400 });
    }

    const rows = await prisma.$queryRaw<Array<{ id: number; reset_token: string | null; reset_token_expires: Date | null }>>`
      SELECT id, reset_token, reset_token_expires
      FROM users
      WHERE reset_token = ${token}
      LIMIT 1
    `;

    const user = rows[0];
    if (!user || !user.reset_token_expires) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    const now = Date.now();
    const expires = new Date(user.reset_token_expires).getTime();
    if (now > expires) {
      return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$executeRaw`
      UPDATE users
      SET password_hash = ${passwordHash}, reset_token = NULL, reset_token_expires = NULL
      WHERE id = ${user.id}
    `;

    return NextResponse.json({ message: "Password updated. You can now sign in." });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}