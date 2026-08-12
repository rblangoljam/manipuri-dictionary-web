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
  mayek: string | null;
  translation: string | null;
}

async function searchWords(q: string): Promise<SearchResult[]> {
  if (!q.trim()) return [];
  const lq = q.toLowerCase();
  const likeQ = "%" + q + "%";
  const likeLq = "%" + lq + "%";
  const likePrefix = lq + "%";
  try {
    return await prisma.$queryRaw<SearchResult[]>`
      SELECT w.id, w.word, w.slug,
             (SELECT COUNT(*) FROM word_senses ws WHERE ws.word_id = w.id AND ws.status = 'approved') as sense_count,
             (SELECT ws2.meaning_mm_unicode FROM word_senses ws2
              WHERE ws2.word_id = w.id AND ws2.status = 'approved'
                AND ws2.meaning_mm_unicode IS NOT NULL AND ws2.meaning_mm_unicode != ''
              LIMIT 1) as mayek,
             (SELECT ws3.meaning_eng_man FROM word_senses ws3
              WHERE ws3.word_id = w.id AND ws3.status = 'approved'
                AND ws3.meaning_eng_man IS NOT NULL AND ws3.meaning_eng_man != ''
              LIMIT 1) as translation
      FROM words w
      WHERE LOWER(w.word) LIKE ${likeLq}
         OR w.search_index LIKE ${likeLq}
         OR EXISTS (
           SELECT 1 FROM word_senses ws
           WHERE ws.word_id = w.id AND ws.status = 'approved'
             AND (ws.definition LIKE ${likeQ} OR ws.meaning_eng_man LIKE ${likeQ})
         )
      ORDER BY
        CASE
          WHEN LOWER(w.word) = ${lq} THEN 0
          WHEN EXISTS (
            SELECT 1 FROM word_senses ws
            WHERE ws.word_id = w.id AND ws.status = 'approved'
              AND (ws.definition LIKE ${likeQ} OR ws.meaning_eng_man LIKE ${likeQ})
          ) THEN 1
          WHEN LOWER(w.word) LIKE ${likePrefix} THEN 1.2
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
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="font-medium">{r.word}</span>
                          {r.mayek && (
                            <span className="meetei text-brand-600 dark:text-brand-400 truncate">
                              {r.mayek}
                            </span>
                          )}
                          {r.translation && (
                            <span className="text-muted-2 truncate">· {r.translation}</span>
                          )}
                        </span>
                        <span className="text-xs text-muted-2 shrink-0 ml-3">
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