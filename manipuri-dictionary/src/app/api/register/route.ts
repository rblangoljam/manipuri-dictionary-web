import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validation/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input with Zod
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: errors },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    // Check if email already registered
    const existing = await prisma.$queryRaw`
      SELECT id FROM users WHERE email = ${normalizedEmail} LIMIT 1
    `;

    if ((existing as unknown[]).length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password securely
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with USER role and active status
    const result = await prisma.$executeRaw`
      INSERT INTO users (name, email, password_hash, role, status, nos_word_submitted, nos_word_approved, nos_word_rejected)
      VALUES (${name}, ${normalizedEmail}, ${passwordHash}, 'user', 'active', 0, 0, 0)
    `;

    if (result !== 1) {
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}