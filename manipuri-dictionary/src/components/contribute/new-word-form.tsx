"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MeiteiMayekEditor } from "@/components/meitei-mayek/editor";

interface FieldErrors {
  [key: string]: string[] | undefined;
}

export function NewWordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    word: "",
    wordtype: "",
    definition: "",
    meaningEngMan: "",
    meaningMm: "",
    synonyms: "",
    antonyms: "",
  });

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((fe) => ({ ...fe, [field]: undefined }));
  };

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
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        }
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
  const labelClass = "block text-sm font-medium mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="word" className={labelClass}>
            Word *
          </label>
          <input
            id="word"
            type="text"
            value={form.word}
            onChange={(e) => update("word", e.target.value)}
            placeholder="e.g. ꯋꯥꯍꯩ"
            className={inputClass}
            required
          />
          {fieldErrors.word && (
            <p className="text-sm text-danger mt-1">{fieldErrors.word[0]}</p>
          )}
        </div>
        <div>
          <label htmlFor="wordtype" className={labelClass}>
            Word type *
          </label>
          <input
            id="wordtype"
            type="text"
            value={form.wordtype}
            onChange={(e) => update("wordtype", e.target.value)}
            placeholder="e.g. noun, verb, adjective"
            className={inputClass}
            required
          />
          {fieldErrors.wordtype && (
            <p className="text-sm text-danger mt-1">{fieldErrors.wordtype[0]}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="definition" className={labelClass}>
          Definition *
        </label>
        <textarea
          id="definition"
          value={form.definition}
          onChange={(e) => update("definition", e.target.value)}
          rows={3}
          placeholder="Describe the meaning of the word…"
          className={inputClass}
          required
        />
        {fieldErrors.definition && (
          <p className="text-sm text-danger mt-1">{fieldErrors.definition[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="meaningEngMan" className={labelClass}>
          English / Manipuri meaning *
        </label>
        <textarea
          id="meaningEngMan"
          value={form.meaningEngMan}
          onChange={(e) => update("meaningEngMan", e.target.value)}
          rows={2}
          placeholder="Translation or English meaning…"
          className={inputClass}
          required
        />
        {fieldErrors.meaningEngMan && (
          <p className="text-sm text-danger mt-1">
            {fieldErrors.meaningEngMan[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="meaningMm" className={labelClass}>
          Meitei Mayek meaning
        </label>
        <MeiteiMayekEditor
          id="meaningMm"
          value={form.meaningMm}
          onChange={(v) => update("meaningMm", v)}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="synonyms" className={labelClass}>
            Synonyms
          </label>
          <input
            id="synonyms"
            type="text"
            value={form.synonyms}
            onChange={(e) => update("synonyms", e.target.value)}
            placeholder="Comma separated"
            className={inputClass}
          />
          {fieldErrors.synonyms && (
            <p className="text-sm text-danger mt-1">{fieldErrors.synonyms[0]}</p>
          )}
        </div>
        <div>
          <label htmlFor="antonyms" className={labelClass}>
            Antonyms
          </label>
          <input
            id="antonyms"
            type="text"
            value={form.antonyms}
            onChange={(e) => update("antonyms", e.target.value)}
            placeholder="Comma separated"
            className={inputClass}
          />
          {fieldErrors.antonyms && (
            <p className="text-sm text-danger mt-1">{fieldErrors.antonyms[0]}</p>
          )}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2"
        >
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Submitting…" : "Submit suggestion"}
        </button>
      </div>
    </form>
  );
}