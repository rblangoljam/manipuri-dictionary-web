import Link from "next/link";
import { Header } from "@/components/header";
import { Pencil, PlusCircle } from "lucide-react";

export const metadata = {
  title: "Contribute — Manipuri Dictionary",
  description:
    "Help grow the Manipuri Dictionary by suggesting new words or correcting existing entries.",
};

export default function ContributePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <h1 className="text-2xl font-bold mb-2">Contribute</h1>
          <p className="text-muted-foreground mb-8">
            Help grow the Manipuri Dictionary. Your suggestions are reviewed
            before being published.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/contribute/new"
              className="group rounded-xl border border-border bg-surface p-6 hover:border-brand-500 hover:shadow-card transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-300">
                  <PlusCircle className="w-5 h-5" />
                </span>
                <span className="font-semibold">Suggest a new word</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Add a word that is missing from the dictionary with its
                definition and translation.
              </p>
            </Link>
            <Link
              href="/search"
              className="group rounded-xl border border-border bg-surface p-6 hover:border-brand-500 hover:shadow-card transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-300">
                  <Pencil className="w-5 h-5" />
                </span>
                <span className="font-semibold">Suggest an edit</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Find a word and submit a correction or improvement to its
                entry.
              </p>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}