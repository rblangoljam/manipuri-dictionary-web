"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface PronounceButtonProps {
  text: string;
  label?: string;
}

/**
 * Text-to-speech button using the Web Speech API.
 * Speaks the given text (word or Meitei Mayek reading).
 * Falls back to a disabled state with a hint if speech synthesis is unsupported.
 */
export function PronounceButton({ text, label = "Listen" }: PronounceButtonProps) {
  const [supported, setSupported] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }
    // Cancel any pending speech if the component unmounts
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const stop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const speak = () => {
    if (!text || !("speechSynthesis" in window)) return;

    // Toggle off if already speaking
    if (speaking) {
      stop();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // Prefer a voice that can handle Indic scripts; fall back to default.
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => /hi[-_]IN/i.test(v.lang)) ||
      voices.find((v) => /en[-_](US|GB)/i.test(v.lang));
    if (preferred) {
      utterance.voice = preferred;
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm opacity-50 cursor-not-allowed"
        title="Text-to-speech is not supported in this browser"
        aria-label="Text-to-speech not supported"
      >
        <VolumeX className="w-4 h-4" />
        Listen
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={speak}
      aria-label={speaking ? "Stop pronunciation" : "Listen to pronunciation"}
      title={speaking ? "Stop" : "Listen"}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
        speaking
          ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300"
          : "border-border bg-surface hover:bg-surface-muted dark:hover:bg-slate-800"
      }`}
    >
      {speaking ? (
        <>
          <Volume2 className="w-4 h-4 animate-pulse" />
          Stop
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4" />
          {label}
        </>
      )}
    </button>
  );
}