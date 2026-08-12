// Meitei Mayek utilities barrel export

export {
  CONSONANTS,
  VOWELS,
  LONSUM,
  DIGITS,
  MARKS,
  INDEPENDENT_VOWELS,
  KEYBOARD_MAPPING,
  MEITEI_CONSONANTS,
  CONTEXTUAL_VOWEL_KEYS,
  ALL_KEYS,
  EE_CONSONANT,
  EE_LONSUM,
  type MeiteiMayekChar,
} from "./mapping";

export {
  convertToUnicode,
  isMeiteiConsonant,
  isMeiteiMayekUnicode,
  normalizeMeiteiMayek,
  getKeyboardLayout,
} from "./converter";