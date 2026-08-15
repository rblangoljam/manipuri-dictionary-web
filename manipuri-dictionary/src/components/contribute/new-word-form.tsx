"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { MeaningEditor } from "@/components/contribute/meaning-editor";
import { MeaningKey, emptyGrammar } from "@/lib/word-types";

interface FieldErrors {
  meanings?: string;
  word?: string[];
  [key: string]: string[] | string | undefined;
}

interface LanguageOption {
  id: number;
  name: string;
  code: string;
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

export function NewWordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [word, setWord] = useState("");
  const [languageId, setLanguageId] = useState<number | null>(1);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [meanings, setMeanings] = useState<MeaningKey[]>([defaultMeaning()]);

  useEffect(() => {
    fetch("/api/languages")
      .then((r) => r.json())
      .then((d) => {
        const list: LanguageOption[] = d.languages ?? [];
        setLanguages(list);
        const mn = list.find((l) => l.code === "mn");
        setLanguageId(mn ? mn.id : list[0]?.id ?? null);
      })
      .catch(() => setLanguages([]));
  }, []);

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
      const res = await fetch("/api/contribute/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, languageId, meanings }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        setError(data.error ?? "Failed to submit suggestion");
        return;
      }

      router.push("/contribute?submitted=1");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";

  const meaningsError = (fieldErrors.meanings as string) || undefined;
  const wordError = Array.isArray(fieldErrors.word) ? fieldErrors.word[0] : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="word" className="block text-sm font-medium mb-1.5">
            Word *
          </label>
          <input
            id="word"
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="e.g. ꯋꯥꯍꯩ"
            className={inputClass}
            required
          />
          {wordError && <p className="text-sm text-danger mt-1">{wordError}</p>}
        </div>
        <div>
          <label htmlFor="language" className="block text-sm font-medium mb-1.5">
            Language
          </label>
          <select
            id="language"
            value={languageId ?? ""}
            onChange={(e) => setLanguageId(Number(e.target.value) || null)}
            className={inputClass}
          >
            {languages.length === 0 && <option value="">Manipuri</option>}
            {languages.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
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
        {loading ? "Submitting…" : "Submit suggestion"}
      </button>
    </form>
  );
}