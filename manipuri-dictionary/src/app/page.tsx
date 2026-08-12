import { Header } from "@/components/header";
import { SearchBar } from "@/components/search-bar";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

interface PopularWord {
  id: bigint;
  word: string;
  slug: string;
  sense_count: bigint;
  meaning_mm_unicode: string | null;
  meaning_eng_man: string | null;
}

export default async function Home() {
  // Fetch popular words (words with most senses, approved)
  const popular = (await prisma
    .$queryRaw<PopularWord[]>`
      SELECT w.id, w.word, w.slug,
             COUNT(ws.id) as sense_count,
             MAX(ws.meaning_mm_unicode) as meaning_mm_unicode,
             MAX(ws.meaning_eng_man) as meaning_eng_man
      FROM words w
      JOIN word_senses ws ON ws.word_id = w.id AND ws.status = 'approved'
      WHERE ws.meaning_mm_unicode IS NOT NULL AND ws.meaning_mm_unicode != ''
      GROUP BY w.id, w.word, w.slug
      ORDER BY COUNT(ws.id) DESC, w.word
      LIMIT 8
    `
    .catch(() => [])) as PopularWord[];

  // Fetch recently added words
  const recent = (await prisma
    .$queryRaw<PopularWord[]>`
      SELECT w.id, w.word, w.slug,
             (SELECT COUNT(*) FROM word_senses ws WHERE ws.word_id = w.id AND ws.status = 'approved') as sense_count,
             (SELECT meaning_mm_unicode FROM word_senses ws WHERE ws.word_id = w.id AND ws.status = 'approved' AND ws.meaning_mm_unicode IS NOT NULL AND ws.meaning_mm_unicode != '' LIMIT 1) as meaning_mm_unicode,
             (SELECT meaning_eng_man FROM word_senses ws WHERE ws.word_id = w.id AND ws.status = 'approved' AND ws.meaning_eng_man IS NOT NULL AND ws.meaning_eng_man != '' LIMIT 1) as meaning_eng_man
      FROM words w
      ORDER BY w.created_at DESC
      LIMIT 8
    `
    .catch(() => [])) as PopularWord[];

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero / Search Section */}
        <section className="py-16 md:py-24 bg-surface-muted dark:bg-slate-900/60 border-b border-border">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
              Discover Words
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Explore the{" "}
              <span className="meetei text-2xl align-middle">ꯃꯩꯇꯩꯂꯣꯟ</span>{" "}
              Manipuri language
            </p>

            <div className="max-w-xl mx-auto">
              <SearchBar autoFocus />
            </div>
          </div>
        </section>

        {/* Popular words */}
        <section className="py-12">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-2xl font-bold mb-6">
              Popular Words
            </h2>

            {popular.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {popular.map((w) => (
                  <a
                    key={w.id.toString()}
                    href={`/word/${w.slug}`}
                    className="group rounded-xl border border-border bg-surface p-5 hover:shadow-card hover:border-brand-300 transition-all"
                  >
                    <div className="font-semibold text-lg group-hover:text-brand-600 transition-colors">
                      {w.word}
                    </div>
                    <div className="meetei text-xl mt-1 text-brand-700 dark:text-brand-400">
                      {w.meaning_mm_unicode || ""}
                    </div>
                    {w.meaning_eng_man && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-snug">
                        <span className="font-medium text-foreground">Meaning:</span>{" "}
                        {w.meaning_eng_man}
                      </p>
                    )}
                    <div className="text-xs text-muted-2 mt-2">
                      {Number(w.sense_count)}{" "}
                      {Number(w.sense_count) === 1 ? "sense" : "senses"}
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-muted-2">Loading popular words…</p>
            )}
          </div>
        </section>

        {/* Recently added */}
        {recent.length > 0 && (
          <section className="py-12 border-t border-border">
            <div className="mx-auto max-w-6xl px-4">
              <h2 className="text-2xl font-bold mb-6">
                Recently Added
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {recent.map((w) => (
                  <a
                    key={w.id.toString()}
                    href={`/word/${w.slug}`}
                    className="group rounded-xl border border-border bg-surface p-5 hover:shadow-card hover:border-brand-300 transition-all"
                  >
                    <div className="font-semibold text-lg group-hover:text-brand-600 transition-colors">
                      {w.word}
                    </div>
                    {w.meaning_mm_unicode && (
                      <div className="meetei text-xl mt-1 text-brand-700 dark:text-brand-400">
                        {w.meaning_mm_unicode}
                      </div>
                    )}
                    {w.meaning_eng_man && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-snug">
                        <span className="font-medium text-foreground">Meaning:</span>{" "}
                        {w.meaning_eng_man}
                      </p>
                    )}
                    <div className="text-xs text-muted-2 mt-2">
                      {Number(w.sense_count)}{" "}
                      {Number(w.sense_count) === 1 ? "sense" : "senses"}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-2">
          © {new Date().getFullYear()} Manipuri Dictionary · A digital home for the Manipuri language
        </div>
      </footer>
    </>
  );
}