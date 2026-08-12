"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

interface Proposal {
  id: string;
  type: string;
  proposed_word: string;
  proposed_wordtype: string;
  proposed_definition: string;
  proposed_meaning_eng_man: string;
  proposed_meaning_mm: string;
  proposed_synonyms: string;
  proposed_antonyms: string;
  submitted_name: string | null;
  submitted_email: string | null;
  created_at: string;
  current_definition: string | null;
  current_wordtype: string | null;
}

export function ReviewPanel({ proposals }: { proposals: Proposal[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const review = async (id: string, action: "approve" | "reject") => {
    if (busy) return;
    setBusy(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId: id, action, note: notes[id] ?? "" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to review proposal");
        return;
      }
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setBusy(null);
    }
  };

  if (proposals.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl border border-border bg-surface">
        <p className="text-muted-foreground mb-2">No proposals to review.</p>
        <p className="text-sm text-muted-2">
          New word suggestions and edits will appear here for approval.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {proposals.map((p) => (
        <div key={p.id} className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-900 text-brand-700 dark:text-brand-300 mr-2">
                {p.type === "new" ? "New word" : "Edit"}
              </span>
              <span className="font-semibold">{p.proposed_word}</span>
            </div>
            <span className="text-xs text-muted-2">
              {p.submitted_name ?? "Unknown"} · {new Date(p.created_at).toLocaleDateString()}
            </span>
          </div>

          <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {p.type === "edit" && p.current_definition && (
              <div>
                <h3 className="text-xs font-medium text-muted-2 uppercase tracking-wide mb-2">
                  Current {p.current_wordtype ? `(${p.current_wordtype})` : ""}
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {p.current_definition}
                </p>
              </div>
            )}
            <div className={p.type === "edit" ? "" : "md:col-span-2"}>
              <h3 className="text-xs font-medium text-muted-2 uppercase tracking-wide mb-2">
                Proposed {p.proposed_wordtype ? `(${p.proposed_wordtype})` : ""}
              </h3>
              <p className="text-sm whitespace-pre-line leading-relaxed">{p.proposed_definition}</p>
              {p.proposed_meaning_eng_man && (
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="font-medium text-foreground">Translation:</span>{" "}
                  {p.proposed_meaning_eng_man}
                </p>
              )}
              {p.proposed_meaning_mm && (
                <p className="meetei text-lg mt-2 text-brand-700 dark:text-brand-400">
                  {p.proposed_meaning_mm}
                </p>
              )}
            </div>
          </div>

          <div className="px-5 py-3 border-t border-border bg-surface-muted dark:bg-slate-900 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <input
              type="text"
              value={notes[p.id] ?? ""}
              onChange={(e) => setNotes((n) => ({ ...n, [p.id]: e.target.value }))}
              placeholder="Add a note (optional)"
              className="w-full sm:max-w-xs px-3 py-1.5 rounded-lg border border-border bg-surface text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => review(p.id, "reject")}
                disabled={busy === p.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-danger/30 text-danger text-sm font-medium hover:bg-danger/10 disabled:opacity-60 transition-colors"
              >
                <X className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={() => review(p.id, "approve")}
                disabled={busy === p.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors"
              >
                <Check className="w-4 h-4" />
                Approve
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}