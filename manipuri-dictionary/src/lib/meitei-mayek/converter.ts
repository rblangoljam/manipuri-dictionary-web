// Meitei Mayek ASCII → Unicode Converter
// Implements the E-Pao keyboard contextual rules

import {
  CONSONANTS,
  LONSUM,
  VOWELS,
  DIGITS,
  MARKS,
  INDEPENDENT_VOWELS,
  KEYBOARD_MAPPING,
  MEITEI_CONSONANTS,
  CONTEXTUAL_VOWEL_KEYS,
  EE_CONSONANT,
  EE_LONSUM,
} from "./mapping";

/**
 * Check if a character is a Meitei Mayek consonant (Unicode).
 */
export function isMeiteiConsonant(ch: string): boolean {
  return MEITEI_CONSONANTS.has(ch);
}

/**
 * Determine if the previous output character indicates that a vowel
 * should be a vowel sign (after a consonant) vs an independent vowel.
 *
 * We look at the *input* context: if the character before the vowel key
 * was a consonant key (lowercase or uppercase that maps to a consonant),
 * then the vowel is a vowel sign.
 */
function isAfterConsonantKey(text: string, index: number): boolean {
  if (index === 0) return false;
  const prev = text[index - 1];
  // If previous key is a consonant key in the input
  return prev in CONSONANTS;
}

/**
 * Convert a single word/segment. Vowels at the start of a word
 * become independent vowels; after consonants they become vowel signs.
 */
function convertSegment(segment: string): string {
  if (!segment) return segment;

  let result = "";
  const chars = segment.split("");

  for (let i = 0; i < chars.length; i++) {
    const key = chars[i];

    // Not a mapped key — preserve as-is
    if (!(key in KEYBOARD_MAPPING)) {
      result += key;
      continue;
    }

    // Vowel keys that have contextual forms
    if (CONTEXTUAL_VOWEL_KEYS.has(key)) {
      // Independent vowel if at word start OR previous char is not a consonant key
      const prevKey = i > 0 ? chars[i - 1] : null;
      const isIndependent = prevKey === null || !(prevKey in CONSONANTS);

      if (isIndependent) {
        result += INDEPENDENT_VOWELS[key];
      } else {
        result += VOWELS[key].unicode;
      }
      continue;
    }

    // 'I' is context-sensitive: consonant form (ꯏ) vs lonsum (ꯢ)
    // For direct keyboard input, default to consonant form.
    // Lonsum form is produced by typing 'I' after a vowel sign or
    // in a final position context. A user can also use the on-screen
    // keyboard's Lonsum section for the explicit lonsum form.
    if (key === "I" && !(key in CONSONANTS)) {
      result += key in LONSUM ? LONSUM[key].unicode : EE_LONSUM;
      continue;
    }

    // Regular mapping
    result += KEYBOARD_MAPPING[key].unicode;
  }

  return result;
}

/**
 * Convert ASCII keyboard input to Unicode Meitei Mayek.
 *
 * Rules:
 * - If a key has a mapping, convert it
 * - If a key does NOT have a mapping, preserve it unchanged
 * - Spaces, punctuation, line breaks preserved
 * - Contextual vowels: at word start → independent vowel, after consonant → vowel sign
 *
 * Examples:
 *   napi → ꯅꯥꯄꯤ
 *   hOb  → ꯍꯧꯕ
 *   lM   → ꯂꯝ
 *   lMpaQ → ꯂꯝꯄꯥꯛ
 */
export function convertToUnicode(input: string): string {
  if (!input) return input;

  // Split on word boundaries but keep separators
  // We process each word segment, preserving spaces/punctuation
  // Use regex to split into word chars and non-word separators
  const parts = input.split(/([^\w\s]|\s+)/g);
  // Note: \w includes underscore, digits, letters. This keeps
  // punctuation and spaces as separators.

  let result = "";
  for (const part of parts) {
    if (part === "" || part === undefined) continue;
    // If it's a separator (space or punctuation that isn't mapped), keep as-is
    // but check mapped punctuation like '.' and '_' and '|'
    if (/^\s+$/.test(part)) {
      result += part;
    } else if (part.length === 1 && part in KEYBOARD_MAPPING && !CONTEXTUAL_VOWEL_KEYS.has(part)) {
      // Single mapped char that isn't a contextual vowel
      // but need to handle 'I' carefully
      if (part === "I") {
        // Consonant Ee by default
        result += EE_CONSONANT;
      } else {
        result += KEYBOARD_MAPPING[part].unicode;
      }
    } else {
      // Multi-char word segment — process with context
      result += convertSegment(part);
    }
  }

  return result;
}

/**
 * Check if a string is already Meitei Mayek Unicode (not ASCII keyboard).
 */
export function isMeiteiMayekUnicode(input: string): boolean {
  if (!input) return false;
  // Meitei Mayek block: U+ABC0–U+ABFF
  const regex = /[\uABC0-\uABFF]/;
  return regex.test(input);
}

/**
 * Normalize Meitei Mayek text (NFC normalization has no effect for Meitei
 * Mayek, but keep for future-proofing).
 */
export function normalizeMeiteiMayek(input: string): string {
  return input.normalize("NFC");
}

/**
 * Get the list of available keyboard keys with their labels/display chars.
 */
export function getKeyboardLayout() {
  const rows: Array<
    Array<{ key: string; unicode: string; display: string; type: "consonant" | "vowel" | "lonsum" | "digit" | "mark" }>
  > = [];

  const consonantKeys = Object.entries(CONSONANTS).map(([key, c]) => ({
    key,
    unicode: c.unicode,
    display: c.display,
    type: "consonant" as const,
  }));

  const vowelKeys = Object.entries(VOWELS).map(([key, c]) => ({
    key,
    unicode: c.unicode,
    display: c.display,
    type: "vowel" as const,
  }));

  const lonsumKeys = Object.entries(LONSUM).map(([key, c]) => ({
    key,
    unicode: c.unicode,
    display: c.display,
    type: "lonsum" as const,
  }));

  const digitKeys = Object.entries(DIGITS).map(([key, c]) => ({
    key,
    unicode: c.unicode,
    display: c.display,
    type: "digit" as const,
  }));

  const markKeys = Object.entries(MARKS).map(([key, c]) => ({
    key,
    unicode: c.unicode,
    display: c.display,
    type: "mark" as const,
  }));

  // Keyboard rows (roughly QWERTY-like)
  rows.push(consonantKeys.slice(0, 13));
  rows.push(consonantKeys.slice(13, 26));
  rows.push(vowelKeys);
  rows.push(lonsumKeys);
  rows.push(digitKeys);
  rows.push(markKeys);

  return rows;
}