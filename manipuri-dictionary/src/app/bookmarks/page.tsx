import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark } from "lucide-react";
import { Header } from "@/components/header";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Bookmarks — Manipuri Dictionary",
  description: "Your bookmarked words in the Manipuri Dictionary.",
};

interface BookmarkRow {
  id: bigint;
  word: string;
  slug: string;
  sense_count: bigint | number;
}

export default async function BookmarksPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/bookmarks");
  }

  const userId = parseInt(session.user.id, 10);
  const bookmarks = await prisma.$queryRaw<BookmarkRow[]>`
    SELECT w.id, w.word, w.slug,
           (SELECT COUNT(*) FROM word_senses ws WHERE ws.word_id = w.id AND ws.status = 'approved') AS sense_count
    FROM bookmarks b
    JOIN words w ON w.id = b.word_id
    WHERE b.user_id = ${userId}
    ORDER BY b.created_at DESC
  `;

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <h1 className="text-2xl font-bold mb-6">My Bookmarks</h1>

          {bookmarks.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-border bg-surface-muted dark:bg-slate-900">
              <Bookmark className="w-12 h-12 mx-auto text-muted-2 mb-4" />
              <p className="text-muted-foreground mb-4">
                You haven't bookmarked any words yet.
              </p>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                Discover words
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-surface">
              {bookmarks.map((b) => (
                <li key={b.id.toString()}>
                  <Link
                    href={`/word/${b.slug}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="font-medium">{b.word}</span>
                    <span className="text-xs text-muted-2">
                      {Number(b.sense_count)}{" "}
                      {Number(b.sense_count) === 1 ? "sense" : "senses"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}