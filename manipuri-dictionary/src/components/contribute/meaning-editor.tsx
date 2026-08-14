"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { MeiteiMayekEditor } from "@/components/meitei-mayek/editor";
import {
  GrammarField,
  MeaningKey,
  WORD_TYPE_OPTIONS,
  emptyGrammar,
  fieldsForWordType,
} from "@/lib/word-types";

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";

function Select({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${inputClass} flex items-center justify-between text-left ${!selected ? "text-muted-2" : ""}`}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronsUpDown className="w-4 h-4 shrink-0 text-muted-2" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-border bg-surface shadow-popover">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-surface-muted dark:hover:bg-slate-800 ${o.value === value ? "bg-brand-50 dark:bg-slate-800" : ""}`}
            >
              {o.label}
              {o.value === value && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GrammarFieldRow({ field, value, onChange }: {
  field: GrammarField;
  value: string | string[];
  onChange: (v: string | string[]) => void;
}) {
  if (field.kind === "multi") {
    const sel = Array.isArray(value) ? value : [];
    return (
      <div>
        <span className="block text-sm font-medium mb-1.5">{field.label}</span>
        <div className="flex flex-wrap gap-2">
          {field.options.map((o) => {
            const on = sel.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange(on ? sel.filter((s) => s !== o.value) : [...sel, o.value])}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${on ? "bg-brand-600 text-white border-brand-600" : "border-border bg-surface hover:bg-surface-muted dark:hover:bg-slate-800"}`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <div>
      <span className="block text-sm font-medium mb-1.5">{field.label}</span>
      <Select
        placeholder={`Select ${field.label.toLowerCase()}...`}
        value={String(value ?? "")}
        options={field.options}
        onChange={(v) => onChange(v)}
      />
    </div>
  );
}

export function MeaningEditor({
  index,
  meaning,
  onRemove,
  canRemove,
  errors,
  onChange,
}: {
  index: number;
  meaning: MeaningKey;
  onRemove?: () => void;
  canRemove?: boolean;
  errors?: { definition?: string[]; wordType?: string[] };
  onChange: (m: MeaningKey) => void;
}) {
  const fields = fieldsForWordType(meaning.wordType);
  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted-foreground">Meaning {index + 1}</p>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-sm text-danger hover:underline">
            Remove
          </button>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Meaning / Definition *</label>
        <textarea
          value={meaning.definition}
          onChange={(e) => onChange({ ...meaning, definition: e.target.value })}
          rows={2}
          placeholder="Describe this meaning..."
          className={inputClass}
        />
        {errors?.definition && <p className="text-sm text-danger mt-1">{errors.definition[0]}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Word Type *</label>
        <Select
          placeholder="Select word type..."
          value={meaning.wordType}
          options={WORD_TYPE_OPTIONS}
          onChange={(wordType) =>
            onChange({ ...meaning, wordType, grammar: emptyGrammar(wordType), wordtypeRaw: wordType })
          }
        />
        {errors?.wordType && <p className="text-sm text-danger mt-1">{errors.wordType[0]}</p>}
      </div>

      {fields.length > 0 && (
        <div className="rounded-lg bg-surface-muted dark:bg-slate-900 p-3 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-2">
            Additional Grammar Information
          </p>
          {fields.map((f) => (
            <GrammarFieldRow
              key={f.key}
              field={f}
              value={meaning.grammar[f.key] ?? ""}
              onChange={(v) => onChange({ ...meaning, grammar: { ...meaning.grammar, [f.key]: v } })}
            />
          ))}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5">English / Manipuri meaning</label>
        <textarea
          value={meaning.meaningEngMan ?? ""}
          onChange={(e) => onChange({ ...meaning, meaningEngMan: e.target.value })}
          rows={2}
          placeholder="Translation or English meaning..."
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Meitei Mayek meaning</label>
        <MeiteiMayekEditor
          value={meaning.meaningMm ?? ""}
          onChange={(v) => onChange({ ...meaning, meaningMm: v })}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1.5">Synonyms</label>
          <input
            value={meaning.synonyms ?? ""}
            onChange={(e) => onChange({ ...meaning, synonyms: e.target.value })}
            placeholder="Comma separated"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Antonyms</label>
          <input
            value={meaning.antonyms ?? ""}
            onChange={(e) => onChange({ ...meaning, antonyms: e.target.value })}
            placeholder="Comma separated"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}