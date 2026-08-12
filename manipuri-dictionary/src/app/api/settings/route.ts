import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const userId = parseInt(session.user.id, 10);
    const name = typeof body?.name === "string" ? body.name.trim() : undefined;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : undefined;
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : undefined;
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : undefined;
    const confirmPassword = typeof body?.confirmPassword === "string" ? body.confirmPassword : undefined;

    // Name validation
    if (name !== undefined) {
      if (name.length < 2 || name.length > 100) {
        return NextResponse.json({ error: "Name must be 2-100 characters" }, { status: 400 });
      }
      await prisma.$executeRaw`
        UPDATE users SET name = ${name} WHERE id = ${userId}
      `;
      return NextResponse.json({ ok: true, message: "Profile updated" });
    }

    // Email validation
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
      }
      const existing = await prisma.$queryRaw`
        SELECT id FROM users WHERE email = ${email} AND id != ${userId} LIMIT 1
      `;
      if ((existing as unknown[]).length > 0) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
      }
      await prisma.$executeRaw`
        UPDATE users SET email = ${email} WHERE id = ${userId}
      `;
      return NextResponse.json({ ok: true, message: "Email updated" });
    }

    // Password change
    if (currentPassword !== undefined || newPassword !== undefined || confirmPassword !== undefined) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        return NextResponse.json({ error: "All password fields are required" }, { status: 400 });
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
      }
      if (newPassword !== confirmPassword) {
        return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
      }
      if (newPassword === currentPassword) {
        return NextResponse.json({ error: "New password must be different from current" }, { status: 400 });
      }

      const rows = await prisma.$queryRaw<Array<{ password_hash: string }>>`
        SELECT password_hash FROM users WHERE id = ${userId} LIMIT 1
      `;
      if (!rows[0]) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await prisma.$executeRaw`
        UPDATE users SET password_hash = ${passwordHash} WHERE id = ${userId}
      `;
      return NextResponse.json({ ok: true, message: "Password updated" });
    }

    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}