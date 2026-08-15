import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await prisma.$queryRaw<
      Array<{ id: number; language_name: string; language_code: string }>
    >`
      SELECT id, language_name, language_code FROM languages ORDER BY language_name
    `;
    return NextResponse.json({
      languages: rows.map((r) => ({
        id: r.id,
        name: r.language_name,
        code: r.language_code,
      })),
    });
  } catch (error) {
    console.error("Languages error:", error);
    return NextResponse.json({ languages: [] }, { status: 500 });
  }
}