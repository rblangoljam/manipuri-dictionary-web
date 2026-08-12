"use client";

import { useCallback, useEffect, useState } from "react";
import { getKeyboardLayout } from "@/lib/meitei-mayek";

interface KeyboardProps {
  onKey: (char: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
  onEnter?: () => void;
}

/**
 * On-screen Meitei Mayek keyboard.
 * Users can click keys to insert characters into a focused input.
 * The physical keyboard continues to work as normal.
 */
export function MeiteiMayekKeyboard({
  onKey,
  onBackspace,
  onSpace,
  onEnter,
}: KeyboardProps) {
  const rows = getKeyboardLayout();
  const [shifted, setShifted] = useState(false);

  // Physical keyboard support: backspace/space/enter handled by parent.
  const handleKeyClick = useCallback(
    (key: string) => {
      onKey(key);
    },
    [onKey]
  );

  return (
    <div className="select-none">
      {/* Keyboard rows */}
      <div className="space-y-1.5">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className="flex justify-center gap-1">
            {row.map((keyInfo) => {
              const active =
                shifted && /[A-Z]/.test(keyInfo.key);
              return (
                <button
                  key={`${keyInfo.key}-${keyInfo.unicode}`}
                  type="button"
                  onClick={() => handleKeyClick(keyInfo.key)}
                  className="w-9 h-10 md:w-10 rounded-md border border-border bg-surface text-sm font-medium hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                  aria-label={`Meitei Mayek key ${keyInfo.key}`}
                  title={`Key: ${keyInfo.key} — ${keyInfo.display}`}
                >
                  <span className="meetei text-lg">{keyInfo.display}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Control keys */}
      <div className="flex justify-center gap-1 mt-2">
        <button
          type="button"
          onClick={() => onBackspace()}
          className="h-10 px-4 rounded-md border border-border bg-surface text-sm font-medium hover:bg-danger/10 hover:text-danger transition-colors"
          aria-label="Backspace"
        >
          ⌫
        </button>
        <button
          type="button"
          onClick={() => onSpace()}
          className="h-10 px-8 rounded-md border border-border bg-surface text-sm font-medium hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors"
          aria-label="Space"
        >
          Space
        </button>
        {onEnter && (
          <button
            type="button"
            onClick={() => onEnter()}
            className="h-10 px-4 rounded-md border border-border bg-surface text-sm font-medium hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors"
            aria-label="Enter"
          >
            ⏎
          </button>
        )}
      </div>
    </div>
  );
}