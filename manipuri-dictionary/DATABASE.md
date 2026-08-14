# Manipuri Dictionary — Database Schema

This document describes the current database schema of the Manipuri Dictionary web app. The database is **MySQL/MariaDB** (database name `manipuri_dictionary`), and the Prisma schema mirror lives at `prisma/schema.prisma`.

---

## Overview

| Table | Purpose |
|---|---|
| `words` | Every headword (English and Manipuri). Tagged with a source language. |
| `wordtypes` | **Part-of-speech reference table**: short form (`code`) → canonical long form (`long_form`). |
| `word_senses` | The definitions/meanings of a headword (the "sense" rows). |
| `word_translations` | **Cross-language hub** — a word's meaning in any other language (added for multilingual support). |
| `languages` | Registry of supported languages (Manipuri, English, Tangkhul (future), etc.). |
| `edit_proposals` | User-submitted new-word / edit suggestions pending moderation. |
| `proverbs` | Proverbs / idioms (paorou) content. |
| `word_of_day` | Word-of-the-day schedule. |
| `bookmarks` | Per-user saved words. |
| `users` | Registered users with roles and stats. |
| `moderation_logs` | Audit trail of moderation actions. |
| `editors` | Legacy editor registry (editor roles). |

---

## words

A headword in a specific language.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AUTO | |
| `word` | VARCHAR(255) | The headword as typed (e.g. `houminnaba`, `Contemporary`). |
| `slug` | VARCHAR(255) UNIQUE | URL slug. |
| `first_letter` | CHAR(1) | Index letter for A-Z browsing. |
| `search_index` | VARCHAR(255) | Lowercased search key. |
| `language_id` | INT NULL | FK → `languages.id` — the source language of this headword (e.g. `mn`, `english`). |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Relations:** `senses` (word_senses), `translations` (word_translations), `language` (languages), `bookmarks`, `editProposals`, `wordOfDay`.

---

## wordtypes  ← part-of-speech reference table (added)

A lookup/reference table mapping every part-of-speech **short form** (as stored across `word_senses.wordtype` / `word_translations.wordtype`) to a canonical **long form**. This is the single source of truth for POS names, so the UI can display `noun` instead of `n`, `verb transitive` instead of `v.t.`, etc.

| Column | Type | Notes |
|---|---|---|
| `id` | INT PK AUTO | |
| `code` | VARCHAR(128) UNIQUE | The value as stored in the DB (short/raw form), e.g. `n`, `v.t.`, `a. & adv.`, `noun`. |
| `long_form` | VARCHAR(128) | Canonical full name, e.g. `noun`, `verb transitive`, `adjective & adverb`. |
| `category` | VARCHAR(32) | `canonical` (already full, code == long_form) or `alias` (mapped short form). |

**Seeding (repo root `create_wordtypes_table.js`, idempotent):** canonical labels per category + abbreviation aliases + **all 292 distinct values** currently in the DB (each row tagged with its resolved category). Currently seeded: 363 rows.

**Categories (seed groups):**
- `word_type` — primary part of speech: noun, pronoun, verb, adjective, adverb, preposition, conjunction, interjection, numeral (+ aliases `n`, `v`, `a.`, `adv`, ...)
- `verb_type` — transitive, intransitive, both, auxiliary (+ aliases `vt`, `vi`, ...)
- `verb_form` — imperative, present/past/perfect participle, preterit, preterit perfect, imperfect (+ aliases `imp.`, `p.p.`, ...)
- `noun_feature` — singular, plural, masculine, feminine (+ aliases `pl`, `f.`, ...)
- `adjective_form` — comparative, superlative (+ aliases `compar.`, `superl.`, ...)
- `word_form` — prefix, suffix (+ aliases `pref.`, `suff.`)
- `other` — question, object, unknown, plus any legacy compound/raw values not resolvable to a canonical label

**Usage plan (not yet applied):** display `wordtype -> long_form` anywhere POS is shown; a future optional migration can rewrite `word_senses.wordtype` / `word_translations.wordtype` to canonical `long_form` (with `wordtype_raw` keeping the original marker). Future Manipuri grammar rows can then store a primary `word_type` plus optional feature columns (e.g. `verb_type`, `verb_form`, `noun_feature`). Helper scripts `audit_wordtypes.js` (inventory) and `normalize_wordtypes.js` (expansion logic, dry-run + `--apply`) exist at the repo root.

---

## word_senses

The definition/gloss rows for a headword (this is what the word-page displays).

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AUTO | |
| `word_id` | BIGINT | FK → `words.id`, indexed. |
| `wordtype` | VARCHAR(50) | e.g. `noun`, `verb`, `adjective`, `adverb`... |
| `wordtype_raw` | VARCHAR(50) | Raw POS marker from source (e.g. `n`, `v`). |
| `definition` | TEXT | English definition / gloss. |
| `meaning_eng_man` | TEXT | English→Manipuri (romanized) meaning. |
| `meaning_mm` | TEXT | Manipuri meaning in romanized transliteration. |
| `meaning_mm_unicode` | TEXT NULL | Manipuri meaning in **Meitei Mayek Unicode** (e.g. ꯍꯑꯣꯨꯃꯤꯅ ꯅ ꯕ ꯑ). |
| `antonyms` | VARCHAR(255) | |
| `synonyms` | VARCHAR(255) | |
| `status` | ENUM(`pending`,`approved`,`rejected`) | Moderation state. |
| `editor_id` | INT NULL | Legacy editor reference. |
| `submitted_by` | INT NULL | → users.id of submitter (821 imported rows use this marker). |
| `reviewed_by` | INT NULL | → users.id of reviewer. |
| `reviewed_at` | DATETIME NULL | |
| `rejection_reason` | VARCHAR(500) NULL | |
| `created_at` / `updated_at` | TIMESTAMP | |

**Relations:** `word` (words), `editProposals`.

---

## word_translations  ← multilingual hub (added)

Links any headword to its meaning expressed in **another language**. This is the table that makes English → Manipuri → Tangkhul (future) lookups possible without schema changes.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AUTO | |
| `word_id` | BIGINT | FK → `words.id` (the headword being translated). |
| `language_id` | INT | FK → `languages.id` (the language of this translation). |
| `translation` | VARCHAR(255) | The meaning in that language (romanized). |
| `mayek_unicode` | TEXT NULL | The meaning in Meitei Mayek Unicode when applicable. |
| `wordtype` | VARCHAR(50) | POS of the translation. |
| `definition` | TEXT | Full definition / gloss in that language. |
| `created_at` | TIMESTAMP | |

**Uniqueness:** `(word_id, language_id, translation)` — no duplicate (word, language, meaning) rows.

**Current backfill (13,703 rows):**
- 821 imported Manipuri headwords → English translation rows.
- 12,882 existing English headwords → Manipuri translation rows (where `meaning_mm` existed).

---

## languages

The language registry. Already seeded with Manipur's languages.

| Column | Type | Notes |
|---|---|---|
| `id` | INT PK AUTO | |
| `language_name` | VARCHAR(100) | e.g. `Manipuri`, `English`. |
| `language_code` | VARCHAR(10) UNIQUE | e.g. `mn`, `english`, `aimol`, `anal`, ... |

**Seeded codes:** `mn` (Manipuri), `english` (added by migration), plus Aimol, Anal, Chiru, Chothe, Hmar, Koireng (from the original import).

---

## edit_proposals

Moderation queue for user submissions.

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AUTO | |
| `sense_id` | BIGINT NULL | FK → word_senses.id (for edits to existing senses). |
| `word_id` | BIGINT NULL | FK → words.id. |
| `proposed_word` | VARCHAR(255) | Proposed headword. |
| `proposed_wordtype` | VARCHAR(50) | |
| `proposed_definition` | TEXT | |
| `proposed_meaning_eng_man` | TEXT | |
| `proposed_meaning_mm` | TEXT | |
| `proposed_antonyms` / `proposed_synonyms` | VARCHAR(255) | |
| `status` | ENUM(`pending`,`approved`,`rejected`) | |
| `submitted_by` | INT | → users.id. |
| `reviewed_by` | INT NULL | |
| `reviewed_at` | DATETIME NULL | |
| `rejection_reason` | VARCHAR(500) NULL | |
| `created_at` | TIMESTAMP | |

---

## proverbs

| Column | Type | Notes |
|---|---|---|
| `id` | INT PK AUTO | |
| `paorou` | VARCHAR(255) | Proverb text (romanized). |
| `paorou_mm` | TEXT | Meitei Mayek version. |
| `explaination` | TEXT | Explanation. |
| `language` | VARCHAR(5) | Default `man`. |
| `status` | ENUM(`pending`,`approved`,`rejected`) | |
| `author_id` | INT NULL | |
| `created_at` / `updated_at` | TIMESTAMP | |

---

## word_of_day

| Column | Type | Notes |
|---|---|---|
| `id` | INT PK AUTO | |
| `word_id` | BIGINT | FK → words.id. |
| `display_date` | DATE | The day this word is featured. |
| `is_active` | TINYINT(1) | |
| `created_at` | TIMESTAMP | |

---

## bookmarks

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AUTO | |
| `user_id` | INT | FK → users.id. |
| `word_id` | BIGINT | FK → words.id. |
| `created_at` | TIMESTAMP | |

**Uniqueness:** `(user_id, word_id)`.

---

## users

| Column | Type | Notes |
|---|---|---|
| `id` | INT PK AUTO | |
| `name` | VARCHAR(100) | |
| `email` | VARCHAR(100) UNIQUE | |
| `password_hash` | VARCHAR(255) | bcrypt. |
| `role` | ENUM(`user`,`contributor`,`moderator`,`admin`) | |
| `google_id` / `facebook_id` | VARCHAR NULL | Social login placeholders. |
| `nos_word_submitted` / `nos_word_approved` / `nos_word_rejected` | INT | Contribution stats. |
| `status` | ENUM(`active`,`banned`) | |
| `reset_token` | VARCHAR(64) NULL | Password-reset token. |
| `reset_token_expires` | DATETIME NULL | |
| `created_at` / `updated_at` | TIMESTAMP | |

---

## moderation_logs

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK AUTO | |
| `moderator_id` | INT | FK → users.id. |
| `proposal_id` | BIGINT NULL | FK → edit_proposals.id. |
| `action` | VARCHAR(20) | `approve` / `reject`. |
| `note` | TEXT NULL | |
| `created_at` | TIMESTAMP | |

---

## editors

Legacy editor registry (not used by the current auth).

| Column | Type | Notes |
|---|---|---|
| `id` | INT PK AUTO | |
| `editor_code` | VARCHAR(50) UNIQUE | |
| `name` | VARCHAR(255) | |
| `role` | ENUM(`admin`,`moderator`,`contributor`) | |
| `created_at` | TIMESTAMP | |

---

## Key Relationships (ER summary)

```
languages 1 ─── N words 1 ─── N word_senses
   │                  │
   │                  └──── N word_translations N ─── 1 languages
   │
   └────────────────────────────────── 1 (word_translations.language_id)

words 1 ─── N bookmarks N ─── 1 users
words 1 ─── N word_of_day
words 1 ─── N edit_proposals
edit_proposals 1 ─── N moderation_logs N ─── 1 users
```

---

## Multilingual usage notes

- **Why `word_translations`?** A headword and its translation are different concepts. One English word can have many Manipuri translations, and one Manipuri word can have many English meanings. The hub table stores each (headword, language, meaning) once.
- **Adding a language (e.g. Tangkhul):**
  1. `INSERT INTO languages (language_name, language_code) VALUES ('Tangkhul','tangkhul');`
  2. Add Tangkhul headwords → `words` with `language_id` = tangkhul.
  3. Add meanings → `word_translations` (language = Manipuri and/or English).
- **Search:** `/api/search` reads `word_translations` for translation + Mayek and matches across all languages, returning a `language` field on each result.

---

## Migration scripts (repo root)

| Script | What it does |
|---|---|
| `multilang_migrate.js` | Adds `english` language, `words.language_id` column + index, creates `word_translations`, tags all words with their language. |
| `multilang_backfill.js` | Populates `word_translations` from `word_senses` (imported + English rows). Idempotent (`INSERT IGNORE`). |

Both scripts are idempotent/safe to re-run.