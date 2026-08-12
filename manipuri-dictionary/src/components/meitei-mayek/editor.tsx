"use client";

import { useRef, useState } from "react";
import { convertToUnicode } from "@/lib/meitei-mayek";
import { MeiteiMayekKeyboard } from "./keyboard";
import { Keyboard } from "lucide-react";

interface EditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  rows?: number;
  id?: string;
  label?: string;
}

/**
 * Text input with integrated Meitei Mayek virtual keyboard.
 * Users can type with physical keyboard (ASCII → converters automatically)
 * or use the on-screen keyboard for direct Unicode insertion.
 */
export function MeiteiMayekEditor({
  value = "",
  onChange,
  placeholder = "Type in Meitei Mayek…",
  rows = 4,
  id,
  label,
}: EditorProps) {
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target.value;
    setDisplayValue(input);
    onChange?.(input);
  };

  const insertAtCursor = (insertText: string) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const current = el.value;
    const next =
      current.slice(0, start) + insertText + current.slice(end);

    setDisplayValue(next);
    onChange?.(next);

    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + insertText.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleVirtualKey = (key: string) => {
    insertAtCursor(key);
  };

  const handleBackspace = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    if (start === end && start > 0) {
      const next = el.value.slice(0, start - 1) + el.value.slice(end);
      setDisplayValue(next);
      onChange?.(next);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start - 1;
        el.setSelectionRange(pos, pos);
      });
    } else if (end > start) {
      const next = el.value.slice(0, start) + el.value.slice(end);
      setDisplayValue(next);
      onChange?.(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start, start);
      });
    }
  };

  const handleSpace = () => insertAtCursor(" ");

  // Live preview of converted Meitei Mayek
  const convertedPreview = displayValue
    ? convertToUnicode(displayValue)
    : "";

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium mb-1.5">
          {label}
        </label>
      )}

      <textarea
        ref={textareaRef}
        id={id}
        value={displayValue}
        onChange={handleChange}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-mono"
        spellCheck={false}
      />

      {/* Live Meitei Mayek preview */}
      {convertedPreview && (
        <div className="rounded-lg bg-brand-50 dark:bg-slate-800 px-3 py-2">
          <div className="text-xs font-medium text-muted-2 uppercase tracking-wide mb-1">
            Meitei Mayek preview
          </div>
          <div className="meetei text-xl text-brand-700 dark:text-brand-400">
            {convertedPreview}
          </div>
        </div>
      )}

      {/* Keyboard toggle */}
      <button
        type="button"
        onClick={() => setShowKeyboard((v) => !v)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-sm hover:bg-surface-muted dark:hover:bg-slate-800 transition-colors"
        aria-expanded={showKeyboard}
      >
        <Keyboard className="w-4 h-4" />
        {showKeyboard ? "Hide keyboard" : "Show Meitei Mayek keyboard"}
      </button>

      {showKeyboard && (
        <div className="rounded-xl border border-border bg-surface-muted dark:bg-slate-900 p-3">
          <MeiteiMayekKeyboard
            onKey={handleVirtualKey}
            onBackspace={handleBackspace}
            onSpace={handleSpace}
          />
        </div>
      )}
    </div>
  );
}