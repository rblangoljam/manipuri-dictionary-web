import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Header } from "@/components/header";
import { BookmarkButton } from "@/components/bookmark-button";
import { PronounceButton } from "@/components/pronounce-button";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface WordSense {
  id: bigint;
  wordtype: string;
  definition: string;
  meaning_eng_man: string;
  meaning_mm_unicode: string | null;
  synonyms: string;
  antonyms: string;
}

interface WordDetail {
  id: bigint;
  word: string;
  slug: string;
  first_letter: string;
  senses: WordSense[];
}

async function getWord(slug: string): Promise<WordDetail | null> {
  try {
    const word = await prisma.$queryRaw<Array<{ id: bigint; word: string; slug: string; first_letter: string }>>`
      SELECT id, word, slug, first_letter FROM words WHERE slug = ${slug} LIMIT 1
    `;

    if (!word[0]) return null;

    const senses = await prisma.$queryRaw<WordSense[]>`
      SELECT id, wordtype, definition, meaning_eng_man, meaning_mm_unicode, synonyms, antonyms
      FROM word_senses
      WHERE word_id = ${word[0].id} AND status = 'approved'
      ORDER BY id
    `;

    return { ...word[0], senses };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const word = await getWord(slug);

  if (!word) {
    return {
      title: "Word not found",
    };
  }

  const mmPreview =
    word.senses.find((s) => s.meaning_mm_unicode)?.meaning_mm_unicode ?? "";
  const definitionPreview =
    word.senses[0]?.definition?.split("\n")[0]?.slice(0, 150) ?? "";

  return {
    title: `${word.word} — Meaning, Definition & Examples`,
    description:
      definitionPreview ||
      `${word.word} meaning in Manipuri${mmPreview ? `: ${mmPreview}` : ""}.`,
    alternates: {
      canonical: `/word/${word.slug}`,
    },
    openGraph: {
      title: `${word.word} — Manipuri Dictionary`,
      description: mmPreview
        ? `${mmPreview} · ${word.word} meaning in Manipuri.`
        : `${word.word} meaning in Manipuri.`,
      url: `/word/${word.slug}`,
      type: "website",
    },
  };
}

export default async function WordPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const word = await getWord(slug);

  if (!word) {
    notFound();
  }

  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;

  let bookmarked = false;
  if (userId) {
    try {
      const rows = await prisma.$queryRaw<Array<{ id: bigint }>>`
        SELECT id FROM bookmarks
        WHERE user_id = ${userId} AND word_id = ${word.id}
        LIMIT 1
      `;
      bookmarked = rows.length > 0;
    } catch {
      bookmarked = false;
    }
  }

  // Related words: words that share a synonym with this word, or start with
  // the same first letter (excluding the current word), limited to 8.
  const relatedRows = await prisma.$queryRaw<Array<{ word: string; slug: string }>>`
    SELECT w.word, w.slug
    FROM words w
    WHERE w.id != ${word.id}
      AND (
        w.search_index LIKE ${`${word.word.slice(0, 3).toLowerCase()}%`}
        OR EXISTS (
          SELECT 1 FROM word_senses ws
          WHERE ws.word_id = w.id AND ws.status = 'approved'
            AND ws.synonyms != ''
            AND ws.synonyms IN (
              SELECT synonyms FROM word_senses
              WHERE word_id = ${word.id} AND status = 'approved' AND synonyms != ''
            )
        )
      )
    ORDER BY w.word
    LIMIT 8
  `;

  const relatedWords = relatedRows.map((r) => ({ ...r }));

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-10">
          {/* Breadcrumb */}
          <nav className="text-sm text-muted-2 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Dictionary</span>
            <span className="mx-2">/</span>
            <span className="text-foreground font-medium">{word.word}</span>
          </nav>

          {/* Word header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight">{word.word}</h1>

            {word.senses.some((s) => s.meaning_mm_unicode) && (
              <div className="meetei text-3xl mt-2 text-brand-700 dark:text-brand-400">
                {
                  word.senses.find((s) => s.meaning_mm_unicode)?.meaning_mm_unicode
                }
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              <PronounceButton text={word.word} />
              <BookmarkButton
                wordId={word.id.toString()}
                initialBookmarked={bookmarked}
                signedIn={!!userId}
              />
            </div>
          </div>

          {/* Definitions */}
          {word.senses.map((sense, i) => (
            <section
              key={sense.id.toString()}
              className="mb-8 pb-8 border-b border-border-light dark:border-slate-800 last:border-0"
            >
              {sense.wordtype && (
                <div className="inline-block px-2 py-0.5 rounded bg-surface-muted dark:bg-slate-800 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  {sense.wordtype}
                </div>
              )}

              {sense.definition && (
                <div className="space-y-3">
                  <p className="text-lg leading-relaxed whitespace-pre-line">
                    {sense.definition}
                  </p>
                </div>
              )}

              {sense.meaning_eng_man && (
                <div className="mt-3 text-muted-foreground">
                  <span className="font-medium text-foreground">Translation:</span>{" "}
                  {sense.meaning_eng_man}
                </div>
              )}

              {sense.meaning_mm_unicode && (
                <div className="mt-3 meetei text-2xl text-brand-700 dark:text-brand-400">
                  {sense.meaning_mm_unicode}
                </div>
              )}

              {(sense.synonyms || sense.antonyms) && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {sense.synonyms && (
                    <div>
                      <span className="font-semibold text-muted-foreground">Synonyms:</span>{" "}
                      {sense.synonyms}
                    </div>
                  )}
                  {sense.antonyms && (
                    <div>
                      <span className="font-semibold text-muted-foreground">Antonyms:</span>{" "}
                      {sense.antonyms}
                    </div>
                  )}
                </div>
              )}
            </section>
          ))}

          {/* Related words */}
          {relatedWords.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-semibold mb-3">Related Words</h2>
              <div className="flex flex-wrap gap-2">
                {relatedWords.map((rw) => (
                  <Link
                    key={rw.slug}
                    href={`/word/${rw.slug}`}
                    className="px-3 py-1.5 rounded-lg border border-border bg-surface text-sm font-medium hover:bg-brand-50 dark:hover:bg-slate-800 hover:border-brand-500 transition-colors"
                  >
                    {rw.word}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* FAQ-style feedback */}
          <section className="mt-10 rounded-xl border border-border bg-surface-muted dark:bg-slate-900 p-6 text-center">
            <p className="text-muted-foreground mb-4">Was this definition helpful?</p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors"
                aria-label="Yes, this was helpful"
              >
                👍 Yes
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors"
                aria-label="No, this was not helpful"
              >
                👎 No
              </button>
            </div>
          </section>

          {/* Suggest an edit */}
          <div className="mt-6 rounded-xl border border-border bg-surface-muted dark:bg-slate-900 p-6 text-center">
            <p className="text-muted-foreground mb-2">
              Is something incorrect?
            </p>
            <Link
              href={`/contribute/edit?word=${encodeURIComponent(word.slug)}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Suggest an edit
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}