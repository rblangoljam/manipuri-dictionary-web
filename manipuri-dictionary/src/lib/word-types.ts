// ============================================================
// Central, configuration-driven Word Type / Grammar system.
//
// A dictionary entry has MULTIPLE meanings. Each meaning has a
// PRIMARY word type (e.g. "noun") plus OPTIONAL grammar fields
// that appear dynamically based on the selected word type.
//
// Normalized values are lowercase snake_case (e.g. `past_participle`);
// display labels are user-friendly strings.
// ============================================================

export interface GrammarOption {
  value: string;
  label: string;
}

export interface GrammarField {
  key: string; // e.g. "number", "gender", "verbType", "forms"
  label: string; // e.g. "Number", "Verb Form / Tense"
  kind: "single" | "multi"; // single = one select, multi = multi-select
  /** First select option is the "not specified" default. */
  options: GrammarOption[];
}

export interface WordTypeConfig {
  value: string; // normalized primary word type, e.g. "noun"
  label: string; // "Noun"
  /** Grammar fields unique to this word type. Empty = no extra fields. */
  fields?: GrammarField[];
}

// Primary word types offered to users. Combinations (e.g. "noun & verb")
// are intentionally NOT included — represent them as separate meanings.
export const WORD_TYPES: WordTypeConfig[] = [
  { value: "noun", label: "Noun" },
  { value: "pronoun", label: "Pronoun" },
  { value: "verb", label: "Verb" },
  { value: "adjective", label: "Adjective" },
  { value: "adverb", label: "Adverb" },
  { value: "preposition", label: "Preposition" },
  { value: "conjunction", label: "Conjunction" },
  { value: "interjection", label: "Interjection" },
  { value: "numeral", label: "Numeral" },
  { value: "prefix", label: "Prefix" },
  { value: "suffix", label: "Suffix" },
];

const NOT_SPECIFIED = "not_specified";

export const WORD_TYPE_OPTIONS: GrammarOption[] = WORD_TYPES.map((t) => ({
  value: t.value,
  label: t.label,
}));

/** Word-type -> dynamic grammar fields (config-driven, extensible). */
export const WORD_TYPE_FIELDS: Record<string, GrammarField[]> = {
  noun: [
    {
      key: "number",
      label: "Number",
      kind: "single",
      options: [
        { value: NOT_SPECIFIED, label: "Not specified" },
        { value: "singular", label: "Singular" },
        { value: "plural", label: "Plural" },
        { value: "both", label: "Both" },
      ],
    },
    {
      key: "gender",
      label: "Gender",
      kind: "single",
      options: [
        { value: NOT_SPECIFIED, label: "Not specified" },
        { value: "masculine", label: "Masculine" },
        { value: "feminine", label: "Feminine" },
        { value: "common", label: "Common / Both" },
      ],
    },
  ],
  pronoun: [
    {
      key: "pronounType",
      label: "Pronoun Type",
      kind: "single",
      options: [
        { value: NOT_SPECIFIED, label: "Not specified" },
        { value: "personal", label: "Personal" },
        { value: "possessive", label: "Possessive" },
        { value: "demonstrative", label: "Demonstrative" },
        { value: "interrogative", label: "Interrogative" },
        { value: "relative", label: "Relative" },
        { value: "reflexive", label: "Reflexive" },
        { value: "indefinite", label: "Indefinite" },
      ],
    },
  ],
  verb: [
    {
      key: "verbType",
      label: "Verb Type",
      kind: "single",
      options: [
        { value: NOT_SPECIFIED, label: "Not specified" },
        { value: "transitive", label: "Transitive" },
        { value: "intransitive", label: "Intransitive" },
        { value: "both", label: "Both" },
        { value: "auxiliary", label: "Auxiliary" },
      ],
    },
    {
      key: "forms",
      label: "Verb Form / Tense",
      kind: "multi",
      options: [
        { value: "present", label: "Present" },
        { value: "past", label: "Past" },
        { value: "imperative", label: "Imperative" },
        { value: "present_participle", label: "Present Participle" },
        { value: "past_participle", label: "Past Participle" },
        { value: "perfect_participle", label: "Perfect Participle" },
        { value: "preterit", label: "Preterit" },
        { value: "preterit_perfect", label: "Preterit Perfect" },
        { value: "imperfect", label: "Imperfect" },
        { value: "third_person_singular_present", label: "Third Person Singular Present" },
        { value: "second_person_singular_present", label: "Second Person Singular Present" },
      ],
    },
  ],
  adjective: [
    {
      key: "degree",
      label: "Degree",
      kind: "single",
      options: [
        { value: "positive", label: "Positive" },
        { value: "comparative", label: "Comparative" },
        { value: "superlative", label: "Superlative" },
      ],
    },
  ],
  numeral: [
    {
      key: "numeralType",
      label: "Numeral Type",
      kind: "single",
      options: [
        { value: NOT_SPECIFIED, label: "Not specified" },
        { value: "cardinal", label: "Cardinal" },
        { value: "ordinal", label: "Ordinal" },
        { value: "collective", label: "Collective" },
        { value: "fractional", label: "Fractional" },
      ],
    },
  ],
  // adverb, preposition, conjunction, interjection, prefix, suffix: no extra fields
};

// ============================================================
// Grammar state helpers (normalized data <-> UI)
// ============================================================

export interface MeaningKey {
  definition: string;
  wordType: string;
  wordtypeRaw?: string;
  grammar: Record<string, string | string[]>;
  meaningEngMan?: string;
  meaningMm?: string;
  synonyms?: string;
  antonyms?: string;
}

/** Build an empty grammar object with defaults for a word type. */
export function emptyGrammar(wordType: string): Record<string, string | string[]> {
  const fields = WORD_TYPE_FIELDS[wordType] ?? [];
  const g: Record<string, string | string[]> = {};
  for (const f of fields) {
    if (f.kind === "multi") g[f.key] = [];
    else g[f.key] = f.options[0]?.value ?? NOT_SPECIFIED;
  }
  return g;
}

/** Grammar fields valid for a given word type. */
export function fieldsForWordType(wordType: string): GrammarField[] {
  return WORD_TYPE_FIELDS[wordType] ?? [];
}

/** Label for a normalized value (e.g. "past_participle" -> "Past Participle"). */
export function labelFor(value: string, fallback: string): string {
  const found = WORD_TYPES.find((t) => t.value === value);
  if (found) return found.label;
  if (value === "not_specified") return "Not specified";
  return fallback;
}

/** Convert legacy flat wordtype (e.g. "verb_transitive", "n", "v.t.") to a
 *  primary type + grammar, so existing data loads in the new UI. */
const LEGACY_TO_PRIMARY: Record<string, { primary: string; grammar?: Partial<Record<string, string | string[]>> }> = {
  n: { primary: "noun" },
  noun: { primary: "noun" },
  noun_plural: { primary: "noun", grammar: { number: "plural" } },
  pronoun: { primary: "pronoun" },
  v: { primary: "verb" },
  verb: { primary: "verb" },
  verb_transitive: { primary: "verb", grammar: { verbType: "transitive" } },
  verb_intransitive: { primary: "verb", grammar: { verbType: "intransitive" } },
  verb_both: { primary: "verb", grammar: { verbType: "both" } },
  adjective: { primary: "adjective" },
  adverb: { primary: "adverb" },
  preposition: { primary: "preposition" },
  conjunction: { primary: "conjunction" },
  interjection: { primary: "interjection" },
  numeral: { primary: "numeral" },
  prefix: { primary: "prefix" },
  suffix: { primary: "suffix" },
};

export function normalizeLegacyWordType(raw: string): { wordType: string; grammar: Record<string, string | string[]> } {
  const r = (raw || "").trim().toLowerCase().replace(/[.\s]+/g, "_");
  const mapped = LEGACY_TO_PRIMARY[r] ?? LEGACY_TO_PRIMARY[raw?.trim().toLowerCase()];
  if (mapped) {
    return { wordType: mapped.primary, grammar: emptyGrammar(mapped.primary) };
  }
  // Fallback: if it's a known primary word type, use it; else mark unknown/other
  if (WORD_TYPES.some((t) => t.value === r)) {
    return { wordType: r, grammar: emptyGrammar(r) };
  }
  return { wordType: "noun", grammar: emptyGrammar("noun") };
}