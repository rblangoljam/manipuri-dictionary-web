import Link from "next/link";
import { BookOpen, Users, Sparkles } from "lucide-react";
import { Header } from "@/components/header";

export const metadata = {
  title: "About — Manipuri Dictionary",
  description:
    "Learn about the Manipuri Dictionary — a modern digital home for the Manipuri language in Meitei Mayek script.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <h1 className="text-2xl font-bold mb-2">About</h1>
          <p className="text-muted-foreground mb-8">
            A digital home for the Manipuri language.
          </p>

          <div className="space-y-6">
            <section className="rounded-xl border border-border bg-surface p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-300">
                  <BookOpen className="w-5 h-5" />
                </span>
                <h2 className="text-lg font-semibold">The Dictionary</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The Manipuri Dictionary is a searchable reference for the
                Manipuri language (Meiteilon), with romanized entries and
                Meitei Mayek script support. It includes tens of thousands of
                words with definitions, translations, synonyms, and antonyms.
              </p>
            </section>

            <section className="rounded-xl border border-border bg-surface p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-300">
                  <Sparkles className="w-5 h-5" />
                </span>
                <h2 className="text-lg font-semibold">Meitei Mayek</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Meitei Mayek (Meetei Mayek) is the traditional script of the
                Manipuri language. This dictionary displays Meitei Mayek
                Unicode text prominently and provides a virtual keyboard and
                live converter to help contributors write in the script.
              </p>
            </section>

            <section className="rounded-xl border border-border bg-surface p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-300">
                  <Users className="w-5 h-5" />
                </span>
                <h2 className="text-lg font-semibold">Community</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Anyone can suggest new words or corrections. Submissions are
                reviewed by the community's editors before being published,
                keeping the dictionary accurate and trustworthy.
              </p>
            </section>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                Search the dictionary
              </Link>
              <Link
                href="/contribute"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors"
              >
                Contribute
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}