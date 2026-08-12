// Meitei Mayek Keyboard Mapping
// Based on the E-Pao keyboard layout specification
// https://www.e-pao.net

export interface MeiteiMayekChar {
  /** ASCII keyboard key */
  key: string;
  /** Unicode codepoint */
  unicode: string;
  /** Unicode name */
  name: string;
  /** Display form */
  display: string;
}

// ============================================
// MAPUM MAYEK — MAIN CONSONANTS
// ============================================
export const CONSONANTS: Record<string, MeiteiMayekChar> = {
  k: { key: "k", unicode: "\uABC0", name: "Kok", display: "ꯀ" },
  s: { key: "s", unicode: "\uABC1", name: "Sam", display: "ꯁ" },
  l: { key: "l", unicode: "\uABC2", name: "Lai", display: "ꯂ" },
  m: { key: "m", unicode: "\uABC3", name: "Mit", display: "ꯃ" },
  p: { key: "p", unicode: "\uABC4", name: "Pa", display: "ꯄ" },
  n: { key: "n", unicode: "\uABC5", name: "Na", display: "ꯅ" },
  c: { key: "c", unicode: "\uABC6", name: "Chin", display: "ꯆ" },
  t: { key: "t", unicode: "\uABC7", name: "Tin", display: "ꯇ" },
  K: { key: "K", unicode: "\uABC8", name: "Khou", display: "ꯈ" },
  Z: { key: "Z", unicode: "\uABC9", name: "Ngou", display: "ꯉ" },
  T: { key: "T", unicode: "\uABCA", name: "Thou", display: "ꯊ" },
  w: { key: "w", unicode: "\uABCB", name: "Wai", display: "ꯋ" },
  y: { key: "y", unicode: "\uABCC", name: "Yang", display: "ꯌ" },
  h: { key: "h", unicode: "\uABCD", name: "Huk", display: "ꯍ" },
  U: { key: "U", unicode: "\uABCE", name: "Un", display: "ꯎ" },
  I: { key: "I", unicode: "\uABCF", name: "Ee", display: "ꯏ" },
  f: { key: "f", unicode: "\uABD0", name: "Fam", display: "ꯐ" },
  A: { key: "A", unicode: "\uABD1", name: "Atiya", display: "ꯑ" },
  g: { key: "g", unicode: "\uABD2", name: "Gok", display: "ꯒ" },
  J: { key: "J", unicode: "\uABD3", name: "Jham", display: "ꯓ" },
  r: { key: "r", unicode: "\uABD4", name: "Rai", display: "ꯔ" },
  b: { key: "b", unicode: "\uABD5", name: "Baa", display: "ꯕ" },
  j: { key: "j", unicode: "\uABD6", name: "Jil", display: "ꯖ" },
  d: { key: "d", unicode: "\uABD7", name: "Dil", display: "ꯗ" },
  G: { key: "G", unicode: "\uABD8", name: "Ghou", display: "ꯘ" },
  D: { key: "D", unicode: "\uABD9", name: "Dhou", display: "ꯙ" },
  B: { key: "B", unicode: "\uABDA", name: "Bham", display: "ꯚ" },
};

// ============================================
// CHEITAP MAYEK — VOWEL SIGNS
// ============================================
export const VOWELS: Record<string, MeiteiMayekChar> = {
  a: { key: "a", unicode: "\uABE5", name: "Aatap", display: "ꯥ" },
  e: { key: "e", unicode: "\uABE6", name: "Yetnap", display: "ꯦ" },
  u: { key: "u", unicode: "\uABE8", name: "Unap", display: "ꯨ" },
  i: { key: "i", unicode: "\uABE4", name: "Enap", display: "ꯤ" },
  E: { key: "E", unicode: "\uABE9", name: "Cheinap", display: "ꯩ" },
  o: { key: "o", unicode: "\uABE3", name: "Otnap", display: "ꯣ" },
  O: { key: "O", unicode: "\uABE7", name: "Sounap", display: "ꯧ" },
  q: { key: "q", unicode: "\uABEA", name: "Nung", display: "ꯪ" },
};

// ============================================
// ATIYADAGI THOKPA KHONTHOK — INDEPENDENT VOWELS
// Contextual: a → ꯑꯥ, e → ꯑꯦ, etc.
// Only used when vowel is at word start or standalone
// ============================================
export const INDEPENDENT_VOWELS: Record<string, string> = {
  a: "\uABD1\uABE5", // ꯑꯥ
  e: "\uABD1\uABE6", // ꯑꯦ
  E: "\uABD1\uABE9", // ꯑꯩ
  o: "\uABD1\uABE3", // ꯑꯣ
  O: "\uABD1\uABE7", // ꯑꯧ
  q: "\uABD1\uABEA", // ꯑꯪ
};

// ============================================
// LONSUM MAYEK — FINAL CONSONANTS
// ============================================
export const LONSUM: Record<string, MeiteiMayekChar> = {
  Q: { key: "Q", unicode: "\uABDB", name: "Kok Lonsum", display: "ꯛ" },
  L: { key: "L", unicode: "\uABDC", name: "Lai Lonsum", display: "ꯜ" },
  M: { key: "M", unicode: "\uABDD", name: "Mit Lonsum", display: "ꯝ" },
  P: { key: "P", unicode: "\uABDE", name: "Pa Lonsum", display: "ꯞ" },
  N: { key: "N", unicode: "\uABDF", name: "Na Lonsum", display: "ꯟ" },
  Y: { key: "Y", unicode: "\uABE0", name: "Tin Lonsum", display: "ꯠ" },
  H: { key: "H", unicode: "\uABE1", name: "Ngou Lonsum", display: "ꯡ" },
  I: { key: "I", unicode: "\uABE2", name: "Ee Lonsum", display: "ꯢ" },
};

// ============================================
// MASHING MAYEK — MEITEI MAYEK DIGITS
// ============================================
export const DIGITS: Record<string, MeiteiMayekChar> = {
  "0": { key: "0", unicode: "\uABF0", name: "zero", display: "꯰" },
  "1": { key: "1", unicode: "\uABF1", name: "one", display: "꯱" },
  "2": { key: "2", unicode: "\uABF2", name: "two", display: "꯲" },
  "3": { key: "3", unicode: "\uABF3", name: "three", display: "꯳" },
  "4": { key: "4", unicode: "\uABF4", name: "four", display: "꯴" },
  "5": { key: "5", unicode: "\uABF5", name: "five", display: "꯵" },
  "6": { key: "6", unicode: "\uABF6", name: "six", display: "꯶" },
  "7": { key: "7", unicode: "\uABF7", name: "seven", display: "꯷" },
  "8": { key: "8", unicode: "\uABF8", name: "eight", display: "꯸" },
  "9": { key: "9", unicode: "\uABF9", name: "nine", display: "꯹" },
};

// ============================================
// KHUDAM MAYEK / MARKS
// ============================================
export const MARKS: Record<string, MeiteiMayekChar> = {
  "|": { key: "|", unicode: "\uABEB", name: "Cheikhei", display: "꯫" },
  ".": { key: ".", unicode: "\uABEC", name: "Lum Iyek", display: "꯬" },
  _: { key: "_", unicode: "\uABED", name: "Apun Iyek", display: "꯭" },
};

// ============================================
// COMBINED MAPPING
// Priority: consonants > lonsum > vowels > digits > marks
// Note: In the actual keyboard, letters like 'I' and 'i' need context
// ============================================
export const KEYBOARD_MAPPING: Record<string, MeiteiMayekChar> = {
  ...CONSONANTS,
  ...LONSUM,
  ...VOWELS,
  ...DIGITS,
  ...MARKS,
};

/** Set of Meitei Mayek consonant Unicode characters (for context detection) */
export const MEITEI_CONSONANTS = new Set(
  Object.values(CONSONANTS).map((c) => c.unicode)
);

/** Characters that are vowel signs when after a consonant but independent vowels at start */
export const CONTEXTUAL_VOWEL_KEYS = new Set(Object.keys(INDEPENDENT_VOWELS));

/** All mapped keyboard keys */
export const ALL_KEYS = new Set(Object.keys(KEYBOARD_MAPPING));

/** The Ee consonant (consonant form of I) */
export const EE_CONSONANT = "\uABCF"; // ꯏ

/** The Ee lonsum (final form of I) */
export const EE_LONSUM = "\uABE2"; // ꯢ