"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

interface SearchResult {
  id: bigint;
  word: string;
  slug: string;
  sense_count: bigint | number;
  mayek?: string | null;
  translation?: string | null;
}

export function SearchBar({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json();
      setResults(data.results ?? []);
      setOpen(true);
      setActiveIndex(-1);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, performSearch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % Math.max(results.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const active = results[activeIndex];
      if (active) {
        router.push(`/word/${active.slug}`);
      } else if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const submit = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 shadow-card focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500">
        <Search className="w-5 h-5 text-muted-2 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search for a word…"
          className="flex-1 bg-transparent outline-none text-base py-1 placeholder:text-muted-2"
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          aria-label="Search dictionary"
        />
        {loading && (
          <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin shrink-0" />
        )}
        {query && !loading && (
          <button
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="text-muted-2 hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={submit}
          className="px-4 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 shrink-0"
        >
          Search
        </button>
      </div>

      {open && (
        <div className="absolute top-full mt-2 w-full rounded-xl border border-border bg-surface shadow-popover z-50 overflow-hidden">
          {results.length === 0 && !loading && (
            <div className="px-4 py-6 text-center text-sm text-muted-2">
              No results found for “{query}”
            </div>
          )}
          <ul className="max-h-80 overflow-y-auto">
            {results.map((r, i) => (
              <li key={r.id.toString()}>
                <button
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => router.push(`/word/${r.slug}`)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors ${
                    i === activeIndex ? "bg-brand-50 dark:bg-slate-800" : ""
                  }`}
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
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}