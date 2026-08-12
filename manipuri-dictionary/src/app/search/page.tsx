import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { SearchBar } from "@/components/search-bar";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

interface SearchResult {
  id: bigint;
  word: string;
  slug: string;
  sense_count: bigint;
}

async function searchWords(q: string): Promise<SearchResult[]> {
  if (!q.trim()) return [];
  try {
    return await prisma.$queryRaw<SearchResult[]>`
      SELECT w.id, w.word, w.slug,
             (SELECT COUNT(*) FROM word_senses ws WHERE ws.word_id = w.id AND ws.status = 'approved') as sense_count
      FROM words w
      WHERE w.word LIKE ${`%${q}%`} OR w.search_index LIKE ${`%${q}%`}
      ORDER BY
        CASE
          WHEN w.word = ${q} THEN 0
          WHEN w.word LIKE ${`${q}%`} THEN 1
          ELSE 2
        END,
        w.word
      LIMIT 60
    `;
  } catch {
    return [];
  }
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Search: ${q}` : "Search",
    description: `Search results for "${q || "words"}" in the Manipuri Dictionary.`,
  };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const results = await searchWords(q);

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <h1 className="text-2xl font-bold mb-6">Search</h1>

          <div className="mb-8">
            <SearchBar />
          </div>

          {q.trim() ? (
            <>
              <p className="text-sm text-muted-2 mb-4">
                {results.length > 0
                  ? `${results.length} result${results.length === 1 ? "" : "s"} for “${q}”`
                  : `No results found for “${q}”`}
              </p>

              {results.length > 0 ? (
                <ul className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-surface">
                  {results.map((r) => (
                    <li key={r.id.toString()}>
                      <Link
                        href={`/word/${r.slug}`}
                        className="flex items-center justify-between px-4 py-3 hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors"
                      >
                        <span className="font-medium">{r.word}</span>
                        <span className="text-xs text-muted-2">
                          {Number(r.sense_count)} {Number(r.sense_count) === 1 ? "sense" : "senses"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-2 mb-4">We couldn't find this word in the dictionary.</p>
                  <Link
                    href="/contribute/new"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
                  >
                    Suggest a word
                  </Link>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-2">Type a word above to search the dictionary.</p>
          )}
        </div>
      </main>
    </>
  );
}