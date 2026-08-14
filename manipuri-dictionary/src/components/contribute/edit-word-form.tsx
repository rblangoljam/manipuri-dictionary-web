"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { MeaningEditor } from "@/components/contribute/meaning-editor";
import { MeaningKey, emptyGrammar, normalizeLegacyWordType } from "@/lib/word-types";

interface FieldErrors {
  meanings?: string;
  word?: string[];
  [key: string]: string[] | string | undefined;
}

interface SenseData {
  senseId: string;
  wordtype: string;
  definition: string;
  meaningEngMan: string;
  meaningMmUnicode: string | null;
  synonyms: string;
  antonyms: string;
}

interface WordData {
  id: string;
  word: string;
  senses: SenseData[];
}

function senseToMeaning(s: SenseData): MeaningKey {
  const { wordType, grammar } = normalizeLegacyWordType(s.wordtype);
  return {
    definition: s.definition,
    wordType,
    wordtypeRaw: s.wordtype,
    grammar: { ...emptyGrammar(wordType), ...grammar },
    meaningEngMan: s.meaningEngMan,
    meaningMm: s.meaningMmUnicode ?? "",
    synonyms: s.synonyms,
    antonyms: s.antonyms,
  };
}

function defaultMeaning(): MeaningKey {
  return {
    definition: "",
    wordType: "noun",
    wordtypeRaw: "noun",
    grammar: emptyGrammar("noun"),
    meaningEngMan: "",
    meaningMm: "",
    synonyms: "",
    antonyms: "",
  };
}

export function EditWordForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingWord, setLoadingWord] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [wordId, setWordId] = useState("");
  const [word, setWord] = useState("");
  const [meanings, setMeanings] = useState<MeaningKey[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadWord() {
      try {
        const res = await fetch(`/api/contribute/word?slug=${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.word) {
          setNotFound(true);
          return;
        }
        const w: WordData = data.word;
        setWordId(w.id);
        setWord(w.word);
        setMeanings(w.senses.length ? w.senses.map(senseToMeaning) : [defaultMeaning()]);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoadingWord(false);
      }
    }
    loadWord();
    return () => { cancelled = true; };
  }, [slug]);

  const updateMeaning = (i: number, m: MeaningKey) =>
    setMeanings((arr) => arr.map((x, idx) => (idx === i ? m : x)));

  const addMeaning = () => setMeanings((arr) => [...arr, defaultMeaning()]);
  const removeMeaning = (i: number) =>
    setMeanings((arr) => (arr.length > 1 ? arr.filter((_, idx) => idx !== i) : arr));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/contribute/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId, word, meanings }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        setError(data.error ?? "Failed to submit edit");
        return;
      }

      router.push(`/word/${slug}`);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";

  if (loadingWord) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Loading word…{" "}
        <span className="inline-block w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin align-middle" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground mb-4">
          We couldn't find that word in the dictionary.
        </p>
        <a
          href="/search"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          Search dictionary
        </a>
      </div>
    );
  }

  const meaningsError = (fieldErrors.meanings as string) || undefined;
  const wordError = Array.isArray(fieldErrors.word) ? fieldErrors.word[0] : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="word" className="block text-sm font-medium mb-1.5">
          Word *
        </label>
        <input
          id="word"
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          className={inputClass}
          required
        />
        {wordError && <p className="text-sm text-danger mt-1">{wordError}</p>}
      </div>

      <div className="space-y-4">
        <p className="text-sm font-semibold text-muted-foreground">
          Meanings{" "}
          <span className="font-normal text-muted-2">
            (each meaning has its own word type)
          </span>
        </p>
        {meanings.map((m, i) => (
          <MeaningEditor
            key={i}
            index={i}
            meaning={m}
            canRemove={meanings.length > 1}
            onRemove={() => removeMeaning(i)}
            onChange={(updated) => updateMeaning(i, updated)}
          />
        ))}
        {meaningsError && <p className="text-sm text-danger">{meaningsError}</p>}
      </div>

      <button
        type="button"
        onClick={addMeaning}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border text-sm font-medium text-muted-foreground hover:border-brand-500 hover:text-brand-600 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Another Meaning
      </button>

      {error && (
        <p role="alert" className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Submitting…" : "Submit edit suggestion"}
      </button>
    </form>
  );
}