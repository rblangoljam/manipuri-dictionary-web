import { z } from "zod";

// ============================================================
// Per-meaning grammar — each meaning has its OWN word type and
// optional grammar fields, validated independently.
// ============================================================

const grammarValue = z.union([z.string(), z.array(z.string())]);

export const meaningSchema = z.object({
  definition: z.string().min(1, "Definition is required"),
  wordType: z
    .string()
    .min(1, "Word type is required")
    .refine((v) => ["noun","pronoun","verb","adjective","adverb","preposition","conjunction","interjection","numeral","prefix","suffix"].includes(v), {
      message: "Select a valid word type",
    }),
  wordtypeRaw: z.string().optional(),
  grammar: z.record(z.string(), grammarValue).optional(),
  meaningEngMan: z.string().optional(),
  meaningMm: z.string().optional(),
  synonyms: z.string().optional(),
  antonyms: z.string().optional(),
});

export type MeaningInput = z.infer<typeof meaningSchema>;

const meaningsField = z
  .array(meaningSchema)
  .min(1, "Add at least one meaning")
  .max(50, "Too many meanings");

export const newWordSchema = z.object({
  word: z
    .string()
    .min(1, "Word is required")
    .max(255, "Word must be at most 255 characters"),
  meanings: meaningsField,
  // Backward compatibility: legacy single-meaning fields are still accepted
  wordtype: z.string().optional(),
  definition: z.string().optional(),
  meaningEngMan: z.string().optional(),
  meaningMm: z.string().optional(),
  synonyms: z.string().optional(),
  antonyms: z.string().optional(),
});

export const editWordSchema = z.object({
  wordId: z.string().min(1, "Word is required"),
  senseId: z.string().optional(),
  word: z
    .string()
    .min(1, "Word is required")
    .max(255, "Word must be at most 255 characters"),
  meanings: meaningsField,
  // Backward compatibility: legacy single-meaning fields
  wordtype: z.string().optional(),
  definition: z.string().optional(),
  meaningEngMan: z.string().optional(),
  meaningMm: z.string().optional(),
  synonyms: z.string().optional(),
  antonyms: z.string().optional(),
});

export type NewWordInput = z.infer<typeof newWordSchema>;
export type EditWordInput = z.infer<typeof editWordSchema>;
