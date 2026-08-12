import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to bookmark words" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const wordId = String(body?.wordId ?? "");
    if (!wordId) {
      return NextResponse.json({ error: "Missing wordId" }, { status: 400 });
    }

    const userId = parseInt(session.user.id, 10);

    // Verify the word exists
    const existing = await prisma.$queryRaw`
      SELECT id FROM words WHERE id = ${BigInt(wordId)} LIMIT 1
    `;
    if ((existing as unknown[]).length === 0) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    // Insert bookmark (ignore duplicate)
    await prisma.$executeRaw`
      INSERT IGNORE INTO bookmarks (user_id, word_id)
      VALUES (${userId}, ${BigInt(wordId)})
    `;

    return NextResponse.json({ bookmarked: true });
  } catch (error) {
    console.error("Bookmark add error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to manage bookmarks" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const wordId = searchParams.get("wordId");
    if (!wordId) {
      return NextResponse.json({ error: "Missing wordId" }, { status: 400 });
    }

    const userId = parseInt(session.user.id, 10);

    await prisma.$executeRaw`
      DELETE FROM bookmarks
      WHERE user_id = ${userId} AND word_id = ${BigInt(wordId)}
    `;

    return NextResponse.json({ bookmarked: false });
  } catch (error) {
    console.error("Bookmark remove error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}