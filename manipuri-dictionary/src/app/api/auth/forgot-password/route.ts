import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const TOKEN_TTL_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      // Avoid account enumeration.
      return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
    }

    const rows = await prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id FROM users WHERE email = ${email} AND status = 'active' LIMIT 1
    `;

    if (rows[0]) {
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + TOKEN_TTL_MS);
      await prisma.$executeRaw`
        UPDATE users SET reset_token = ${token}, reset_token_expires = ${expires}
        WHERE id = ${rows[0].id}
      `;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3100";
      console.log(`[password-reset] ${email}: ${appUrl}/reset-password?token=${token}`);
    }

    return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}