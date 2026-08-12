import Link from "next/link";
import { Search } from "lucide-react";
import { Header } from "@/components/header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="text-center px-4 max-w-md">
          <div className="meetei text-7xl font-bold text-brand-600 dark:text-brand-400 mb-4">
            ꯄꯤ
          </div>
          <h1 className="text-2xl font-bold mb-2">Word not found</h1>
          <p className="text-muted-foreground mb-6">
            The word you're looking for doesn't exist or is not currently
            published.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Search className="w-4 h-4" />
            Search dictionary
          </Link>
        </div>
      </main>
    </>
  );
}