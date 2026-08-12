"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bookmark } from "lucide-react";

interface BookmarkButtonProps {
  wordId: string;
  initialBookmarked: boolean;
  signedIn: boolean;
}

export function BookmarkButton({ wordId, initialBookmarked, signedIn }: BookmarkButtonProps) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!signedIn) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      if (bookmarked) {
        const res = await fetch(`/api/bookmarks?wordId=${encodeURIComponent(wordId)}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setBookmarked(false);
        }
      } else {
        const res = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wordId }),
        });
        if (res.ok) {
          setBookmarked(true);
        }
      }
    } finally {
      setLoading(false);
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
      title={bookmarked ? "Remove bookmark" : "Add bookmark"}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
        bookmarked
          ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300"
          : "border-border bg-surface hover:bg-surface-muted dark:hover:bg-slate-800"
      }`}
    >
      <Bookmark
        className={`w-4 h-4 ${bookmarked ? "fill-current" : ""}`}
      />
      {bookmarked ? "Bookmarked" : "Bookmark"}
    </button>
  );
}