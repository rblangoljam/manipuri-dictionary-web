import { z } from "zod";

export const newWordSchema = z.object({
  word: z
    .string()
    .min(1, "Word is required")
    .max(255, "Word must be at most 255 characters"),
  wordtype: z
    .string()
    .min(1, "Word type is required")
    .max(50, "Word type must be at most 50 characters"),
  definition: z.string().min(1, "Definition is required"),
  meaningEngMan: z.string().min(1, "English/Manipuri meaning is required"),
  meaningMm: z.string().default(""),
  synonyms: z
    .string()
    .max(255, "Synonyms must be at most 255 characters")
    .default(""),
  antonyms: z
    .string()
    .max(255, "Antonyms must be at most 255 characters")
    .default(""),
});

export const editWordSchema = z.object({
  wordId: z.string().min(1, "Word is required"),
  senseId: z.string().optional(),
  word: z
    .string()
    .min(1, "Word is required")
    .max(255, "Word must be at most 255 characters"),
  wordtype: z
    .string()
    .min(1, "Word type is required")
    .max(50, "Word type must be at most 50 characters"),
  definition: z.string().min(1, "Definition is required"),
  meaningEngMan: z.string().min(1, "English/Manipuri meaning is required"),
  meaningMm: z.string().default(""),
  synonyms: z
    .string()
    .max(255, "Synonyms must be at most 255 characters")
    .default(""),
  antonyms: z
    .string()
    .max(255, "Antonyms must be at most 255 characters")
    .default(""),
});

export type NewWordInput = z.infer<typeof newWordSchema>;
export type EditWordInput = z.infer<typeof editWordSchema>;