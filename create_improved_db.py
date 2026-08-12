"""
Script to create an improved database by copying and cleaning the mddatas table.
This creates a new SQL file with:
1. Proper utf8mb4 encoding (fixes broken Manipuri text)
2. Cleaned data (removes corrupt header-leak rows)
3. SEO-friendly slug field
4. Approval workflow fields
5. Word type normalization
6. Proper indexes and foreign keys
"""
import re
import sys
import os
from datetime import datetime

# ─── Configuration ───
SOURCE_FILE = 'manipuri_dictionary_new.sql'
OUTPUT_FILE = 'manipuri_dictionary_improved.sql'
DB_NAME = 'manipuri_dictionary'

# ─── Step 1: Extract mddatas data ───
print("=== Step 1: Extracting mddatas data ===")
with open(SOURCE_FILE, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

mddatas_start = content.find('CREATE TABLE `mddatas`')
if mddatas_start == -1:
    print("ERROR: mddatas table not found")
    sys.exit(1)

insert_start = content.find('INSERT INTO `mddatas`', mddatas_start)
if insert_start == -1:
    print("ERROR: INSERT INTO mddatas not found")
    sys.exit(1)

# Find end of insert section
next_table = content.find('CREATE TABLE', insert_start + 10)
next_alter = content.find('ALTER TABLE', insert_start + 10)
end_positions = [p for p in [next_table, next_alter] if p != -1]
insert_end = min(end_positions) if end_positions else len(content)

insert_section = content[insert_start:insert_end]
print(f"  Insert section extracted: {len(insert_section):,} chars")

# ─── Step 2: Parse rows ───
print("=== Step 2: Parsing rows ===")

values_match = re.search(r'VALUES\s*(.*)', insert_section, re.DOTALL)
if not values_match:
    print("ERROR: VALUES not found")
    sys.exit(1)

values_text = values_match.group(1)

rows = []
depth = 0
i = 0
in_string = False
row_start = -1

while i < len(values_text):
    ch = values_text[i]
    
    if in_string:
        if ch == '\\':
            i += 2
            continue
        if ch == "'":
            in_string = False
        i += 1
        continue
    
    if ch == "'":
        in_string = True
        i += 1
        continue
    
    if ch == '(':
        if depth == 0:
            row_start = i
        depth += 1
        i += 1
        continue
    
    if ch == ')':
        depth -= 1
        if depth == 0 and row_start != -1:
            rows.append(values_text[row_start:i+1])
            row_start = -1
        i += 1
        continue
    
    i += 1

print(f"  Parsed {len(rows):,} rows")

# ─── Step 3: Parse and clean each row ───
print("=== Step 3: Cleaning and transforming data ===")

def parse_row(row_text):
    """Parse a row tuple into fields"""
    inner = row_text.strip()
    if inner.startswith('('):
        inner = inner[1:]
    if inner.endswith(')'):
        inner = inner[:-1]
    if inner.endswith(','):
        inner = inner[:-1]
    
    fields = []
    current = []
    in_str = False
    j = 0
    while j < len(inner):
        ch = inner[j]
        if in_str:
            if ch == '\\':
                current.append(ch)
                if j + 1 < len(inner):
                    current.append(inner[j+1])
                j += 2
                continue
            if ch == "'":
                in_str = False
                current.append(ch)
                j += 1
                continue
            current.append(ch)
            j += 1
            continue
        if ch == "'":
            in_str = True
            current.append(ch)
            j += 1
            continue
        if ch == ',':
            fields.append(''.join(current).strip())
            current = []
            j += 1
            continue
        current.append(ch)
        j += 1
    fields.append(''.join(current).strip())
    
    cleaned = []
    for f in fields:
        f = f.strip()
        if len(f) >= 2 and f.startswith("'") and f.endswith("'"):
            f = f[1:-1]
        cleaned.append(f)
    
    return cleaned

def unescape_sql_string(s):
    """Unescape SQL string (handle \\', \\n, \\r, \\\\, etc.)"""
    result = []
    i = 0
    while i < len(s):
        ch = s[i]
        if ch == '\\' and i + 1 < len(s):
            nxt = s[i+1]
            escape_map = {
                'n': '\n',
                'r': '\r',
                't': '\t',
                '0': '\0',
                '\\': '\\',
                "'": "'",
                '"': '"',
                'b': '\b',
                'Z': '\x1a',
                '%': '%',
                '_': '_',
            }
            result.append(escape_map.get(nxt, nxt))
            i += 2
        else:
            result.append(ch)
            i += 1
    return ''.join(result)

def escape_sql_string(s):
    """Escape a string for SQL output (UTF-8 preserved for MySQL)"""
    if s is None:
        return "''"
    result = []
    for ch in s:
        if ch == '\\':
            result.append('\\\\')
        elif ch == "'":
            result.append("\\'")
        elif ch == '\n':
            result.append('\\n')
        elif ch == '\r':
            result.append('\\r')
        elif ch == '\t':
            result.append('\\t')
        elif ch == '\0':
            result.append('\\0')
        else:
            result.append(ch)
    return "'" + ''.join(result) + "'"

def make_slug(word):
    """Create a URL-friendly slug from a word"""
    slug = word.strip().lower()
    slug = re.sub(r'[\s_\-]+', '-', slug)
    slug = re.sub(r"[^a-z0-9\-']", '', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    if not slug:
        slug = 'word'
    return slug

def normalize_wordtype(wt):
    """Normalize word type abbreviations to full names"""
    wt = wt.strip().lower()
    mapping = {
        'n.': 'noun',
        'n': 'noun',
        'a.': 'adjective',
        'a': 'adjective',
        'adj.': 'adjective',
        'v. t.': 'verb_transitive',
        'v. t': 'verb_transitive',
        'v. i.': 'verb_intransitive',
        'v. i': 'verb_intransitive',
        'v.': 'verb',
        'adv.': 'adverb',
        'prep.': 'preposition',
        'pl.': 'plural',
        'n. pl.': 'noun_plural',
        'p. pr. & vb. n.': 'participial',
        'imp. & p. p.': 'preterit_perfect',
        'imp.': 'preterit',
        'p. p.': 'perfect_participle',
        'v. t. & i.': 'verb_both',
        'superl.': 'superlative',
        'interj.': 'interjection',
        'pron.': 'pronoun',
        'conj.': 'conjunction',
        'num.': 'numeral',
        'a. & n.': 'adjective_noun',
        'n. & v.': 'noun_verb',
        'p. pr.': 'present_participle',
        'vb. n.': 'verbal_noun',
    }
    return mapping.get(wt, wt if wt and len(wt) < 30 else 'unknown')

# Process all rows
cleaned_rows = []
skipped_corrupt = 0
skipped_missing = 0

for row_text in rows:
    fields = parse_row(row_text)
    if len(fields) < 10:
        continue
    
    word = fields[1]
    wordtype_raw = fields[2]
    definition = fields[3]
    meaning_eng_man = fields[4]
    meaning_mm = fields[5]
    antonyms = fields[6]
    synonyms = fields[7]
    time_val = fields[8]
    editor_id = fields[9]
    
    # Skip corrupt rows (where column headers leaked into data)
    if wordtype_raw == '`wordtype`' or editor_id == '`editor_id`':
        skipped_corrupt += 1
        continue
    
    # Clean data
    word = unescape_sql_string(word).strip()
    definition = unescape_sql_string(definition).strip()
    meaning_eng_man = unescape_sql_string(meaning_eng_man).strip()
    meaning_mm = unescape_sql_string(meaning_mm).strip()
    antonyms = unescape_sql_string(antonyms).strip()
    synonyms = unescape_sql_string(synonyms).strip()
    editor_id = unescape_sql_string(editor_id).strip()
    
    # Skip rows with empty word
    if not word:
        skipped_missing += 1
        continue
    
    wordtype = normalize_wordtype(wordtype_raw)
    slug = make_slug(word)
    
    cleaned_rows.append({
        'word': word,
        'slug': slug,
        'wordtype': wordtype,
        'wordtype_raw': wordtype_raw.strip(),
        'definition': definition,
        'meaning_eng_man': meaning_eng_man,
        'meaning_mm': meaning_mm,
        'antonyms': antonyms,
        'synonyms': synonyms,
        'time': time_val,
        'editor_id': editor_id,
    })

print(f"  Cleaned rows: {len(cleaned_rows):,}")
print(f"  Skipped corrupt rows: {skipped_corrupt:,}")
print(f"  Skipped empty-word rows: {skipped_missing:,}")

# ─── Step 4: Build word → senses mapping ───
print("=== Step 4: Building word grouping ===")

# Group senses by word (case-insensitive for grouping, but preserve original case)
word_groups = {}  # slug_lower -> {word, slug, senses: []}
for r in cleaned_rows:
    key = r['slug'].lower()
    if key not in word_groups:
        word_groups[key] = {
            'word': r['word'],
            'slug': r['slug'],
            'senses': []
        }
    word_groups[key]['senses'].append(r)

print(f"  Unique words: {len(word_groups):,}")

# ─── Step 5: Collect editors ───
print("=== Step 5: Collecting editors ===")

editor_ids = set()
for r in cleaned_rows:
    if r['editor_id']:
        editor_ids.add(r['editor_id'])

editor_names = {
    'apabining': 'Apabi',
    'thoiba': 'Thoiba Ningthoujam',
    'romesh_langoljam': 'Romesh Langoljam',
    'xlcsadf122': 'Langoljam Radhabinod',
}

print(f"  Found {len(editor_ids)} editors")

# ─── Step 6: Generate new SQL file ───
print("=== Step 6: Generating improved SQL file ===")

now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    f.write(f"""-- ============================================================
-- Improved Manipuri Dictionary Database
-- Generated from: {SOURCE_FILE}
-- Generated on: {now}
--
-- Changes from original:
--   1. Fixed encoding: latin1 → utf8mb4 (supports Meitei Mayek script)
--   2. Removed {skipped_corrupt:,} corrupt rows (header leakage)
--   3. Removed {skipped_missing:,} rows with empty words
--   4. Added wordtype normalization (n. → noun, etc.)
--   5. Added slug for SEO-friendly URLs
--   6. Added approval workflow fields (status, submitted_by, reviewed_by)
--   7. Added proper indexes and foreign keys
--   8. Split into words + word_senses (one word, multiple senses)
--   9. Added edit_proposals table for user-submitted edits
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------
-- Create Database
-- -----------------------------------------------------
CREATE DATABASE IF NOT EXISTS `{DB_NAME}`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `{DB_NAME}`;

-- -----------------------------------------------------
-- Table: editors
-- Editors who curated/contributed dictionary entries
-- -----------------------------------------------------
DROP TABLE IF EXISTS `editors`;
CREATE TABLE `editors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `editor_code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL DEFAULT '',
  `role` ENUM('admin', 'moderator', 'contributor') NOT NULL DEFAULT 'contributor',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: words
-- Each unique word (headword) - one row per unique word
-- -----------------------------------------------------
DROP TABLE IF EXISTS `words`;
CREATE TABLE `words` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `word` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `first_letter` CHAR(1) NOT NULL,
  `search_index` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_words_slug` (`slug`),
  KEY `idx_words_word` (`word`),
  KEY `idx_words_first_letter` (`first_letter`),
  KEY `idx_words_search` (`search_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: word_senses
-- Each sense/definition of a word (a word can have multiple senses)
-- This is the improved version of mddatas
-- -----------------------------------------------------
DROP TABLE IF EXISTS `word_senses`;
CREATE TABLE `word_senses` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `word_id` BIGINT NOT NULL,
  `wordtype` VARCHAR(50) NOT NULL DEFAULT '' COMMENT 'Normalized part of speech',
  `wordtype_raw` VARCHAR(50) NOT NULL DEFAULT '' COMMENT 'Original abbreviation (e.g. v. t.)',
  `definition` TEXT NOT NULL,
  `meaning_eng_man` TEXT NOT NULL COMMENT 'English to Manipuri meaning (romanized)',
  `meaning_mm` TEXT NOT NULL COMMENT 'Meaning in Meitei Mayek script',
  `antonyms` VARCHAR(255) NOT NULL DEFAULT '',
  `synonyms` VARCHAR(255) NOT NULL DEFAULT '',
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved' COMMENT 'Approval workflow',
  `editor_id` INT DEFAULT NULL COMMENT 'FK to editors table',
  `submitted_by` INT DEFAULT NULL COMMENT 'FK to users table',
  `reviewed_by` INT DEFAULT NULL COMMENT 'FK to editors table - who approved',
  `reviewed_at` DATETIME DEFAULT NULL,
  `rejection_reason` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_senses_word` (`word_id`),
  KEY `idx_senses_wordtype` (`wordtype`),
  KEY `idx_senses_status` (`status`),
  FULLTEXT KEY `ft_senses_definition` (`definition`, `meaning_eng_man`),
  CONSTRAINT `fk_senses_word` FOREIGN KEY (`word_id`) REFERENCES `words`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_senses_editor` FOREIGN KEY (`editor_id`) REFERENCES `editors`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: proverbs (paorou)
-- Manipuri proverbs
-- -----------------------------------------------------
DROP TABLE IF EXISTS `proverbs`;
CREATE TABLE `proverbs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `paorou` VARCHAR(255) NOT NULL,
  `paorou_mm` TEXT NOT NULL,
  `explaination` TEXT NOT NULL,
  `language` VARCHAR(5) NOT NULL DEFAULT 'man',
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `author_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: word_of_day
-- Featured word displayed on homepage
-- -----------------------------------------------------
DROP TABLE IF EXISTS `word_of_day`;
CREATE TABLE `word_of_day` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `word_id` BIGINT NOT NULL,
  `display_date` DATE NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_wod_date` (`display_date`),
  CONSTRAINT `fk_wod_word` FOREIGN KEY (`word_id`) REFERENCES `words`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: edit_proposals
-- User-submitted edits pending approval (approval workflow)
-- -----------------------------------------------------
DROP TABLE IF EXISTS `edit_proposals`;
CREATE TABLE `edit_proposals` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `sense_id` BIGINT DEFAULT NULL COMMENT 'FK to word_senses (NULL = new word proposal)',
  `word_id` BIGINT DEFAULT NULL,
  `proposed_word` VARCHAR(255) NOT NULL,
  `proposed_wordtype` VARCHAR(50) NOT NULL DEFAULT '',
  `proposed_definition` TEXT NOT NULL,
  `proposed_meaning_eng_man` TEXT NOT NULL,
  `proposed_meaning_mm` TEXT NOT NULL,
  `proposed_antonyms` VARCHAR(255) NOT NULL DEFAULT '',
  `proposed_synonyms` VARCHAR(255) NOT NULL DEFAULT '',
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `submitted_by` INT NOT NULL,
  `reviewed_by` INT DEFAULT NULL,
  `reviewed_at` DATETIME DEFAULT NULL,
  `rejection_reason` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_proposals_status` (`status`),
  KEY `idx_proposals_sense` (`sense_id`),
  KEY `idx_proposals_word` (`word_id`),
  CONSTRAINT `fk_proposals_sense` FOREIGN KEY (`sense_id`) REFERENCES `word_senses`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_proposals_word` FOREIGN KEY (`word_id`) REFERENCES `words`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: users
-- Registered users (for the approval workflow)
-- -----------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL DEFAULT '',
  `role` ENUM('user', 'contributor', 'moderator', 'admin') NOT NULL DEFAULT 'user',
  `google_id` VARCHAR(150) DEFAULT NULL,
  `facebook_id` VARCHAR(100) DEFAULT NULL,
  `nos_word_submitted` INT NOT NULL DEFAULT 0,
  `nos_word_approved` INT NOT NULL DEFAULT 0,
  `nos_word_rejected` INT NOT NULL DEFAULT 0,
  `status` ENUM('active', 'banned') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: languages
-- Supported languages
-- -----------------------------------------------------
DROP TABLE IF EXISTS `languages`;
CREATE TABLE `languages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `language_name` VARCHAR(100) NOT NULL,
  `language_code` VARCHAR(10) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DATA IMPORT
-- ============================================================

-- -----------------------------------------------------
-- Insert editors
-- -----------------------------------------------------
INSERT INTO `editors` (`editor_code`, `name`, `role`) VALUES
""")

    # Insert editors
    editor_rows = []
    for ed in sorted(editor_ids):
        name = editor_names.get(ed, ed)
        role = 'admin' if ed in ('xlcsadf122', 'apabining') else 'moderator'
        editor_rows.append(f"  ({escape_sql_string(ed)}, {escape_sql_string(name)}, '{role}')")
    f.write(",\n".join(editor_rows))
    f.write(";\n\n")

    # Insert languages
    f.write("""-- -----------------------------------------------------
-- Insert languages
-- -----------------------------------------------------
INSERT INTO `languages` (`language_name`, `language_code`) VALUES
  ('Manipuri', 'mn'),
  ('Aimol', 'aim'),
  ('Anal', 'an'),
  ('Chiru', 'chi'),
  ('Chothe', 'cho'),
  ('Hmar', 'hmr'),
  ('Koireng', 'koi');

-- -----------------------------------------------------
-- Insert words (unique headwords)
-- -----------------------------------------------------
""")

    # Insert words (in batches of 1000 to avoid max_allowed_packet issues)
    word_id = 1
    word_id_list = []
    for key, group in sorted(word_groups.items()):
        word_id_list.append((key, group))
    
    BATCH_SIZE = 1000
    for batch_start in range(0, len(word_id_list), BATCH_SIZE):
        batch = word_id_list[batch_start:batch_start + BATCH_SIZE]
        f.write("""-- -----------------------------------------------------
-- Insert words (batch {}/{} - {} rows)
-- -----------------------------------------------------
INSERT INTO `words` (`id`, `word`, `slug`, `first_letter`, `search_index`) VALUES
""".format(batch_start // BATCH_SIZE + 1, (len(word_id_list) + BATCH_SIZE - 1) // BATCH_SIZE, len(batch)))
        
        word_rows = []
        for key, group in batch:
            word = group['word']
            slug = group['slug']
            first_letter = word[0].upper() if word else '?'
            search_index = word.lower()
            word_rows.append(f"  ({word_id}, {escape_sql_string(word)}, {escape_sql_string(slug)}, {escape_sql_string(first_letter)}, {escape_sql_string(search_index)})")
            group['new_id'] = word_id
            word_id += 1
        f.write(",\n".join(word_rows))
        f.write(";\n\n")

    # Insert word_senses (in batches of 1000 to avoid max_allowed_packet issues)
    f.write("""-- -----------------------------------------------------
-- Insert word_senses (all definitions from mddatas)
-- -----------------------------------------------------
""")

    # Map editor codes to IDs
    editor_id_map = {}
    for idx, ed in enumerate(sorted(editor_ids)):
        editor_id_map[ed] = idx + 1

    # Build all sense rows first
    all_sense_rows = []
    for key, group in sorted(word_groups.items()):
        wid = group['new_id']
        for sense in group['senses']:
            ed_id = editor_id_map.get(sense['editor_id'], 'NULL')
            all_sense_rows.append(
                f"  ({wid}, {escape_sql_string(sense['wordtype'])}, {escape_sql_string(sense['wordtype_raw'])}, "
                f"{escape_sql_string(sense['definition'])}, {escape_sql_string(sense['meaning_eng_man'])}, "
                f"{escape_sql_string(sense['meaning_mm'])}, {escape_sql_string(sense['antonyms'])}, "
                f"{escape_sql_string(sense['synonyms'])}, 'approved', {ed_id})"
            )
    
    # Write senses in batches
    for batch_start in range(0, len(all_sense_rows), BATCH_SIZE):
        batch = all_sense_rows[batch_start:batch_start + BATCH_SIZE]
        f.write(f"-- -----------------------------------------------------\n")
        f.write(f"-- Insert word_senses (batch {batch_start // BATCH_SIZE + 1}/{(len(all_sense_rows) + BATCH_SIZE - 1) // BATCH_SIZE} - {len(batch)} rows)\n")
        f.write(f"-- -----------------------------------------------------\n")
        f.write("INSERT INTO `word_senses` (`word_id`, `wordtype`, `wordtype_raw`, `definition`, `meaning_eng_man`, `meaning_mm`, `antonyms`, `synonyms`, `status`, `editor_id`) VALUES\n")
        f.write(",\n".join(batch))
        f.write(";\n\n")

    # Insert proverbs from original paorou table
    print("=== Step 7: Extracting proverbs (paorou) ===")
    paorou_start = content.find('CREATE TABLE `paorou`')
    if paorou_start != -1:
        paorou_insert = content.find('INSERT INTO `paorou`', paorou_start)
        if paorou_insert != -1:
            next_t = content.find('CREATE TABLE', paorou_insert + 10)
            next_a = content.find('ALTER TABLE', paorou_insert + 10)
            ends = [p for p in [next_t, next_a] if p != -1]
            paorou_end = min(ends) if ends else len(content)
            paorou_section = content[paorou_insert:paorou_end]
            
            pv = re.search(r'VALUES\s*(.*)', paorou_section, re.DOTALL)
            if pv:
                ptext = pv.group(1)
                # Parse paorou rows
                prows = []
                depth = 0
                i = 0
                in_str = False
                rstart = -1
                while i < len(ptext):
                    ch = ptext[i]
                    if in_str:
                        if ch == '\\':
                            i += 2
                            continue
                        if ch == "'":
                            in_str = False
                        i += 1
                        continue
                    if ch == "'":
                        in_str = True
                        i += 1
                        continue
                    if ch == '(':
                        if depth == 0:
                            rstart = i
                        depth += 1
                        i += 1
                        continue
                    if ch == ')':
                        depth -= 1
                        if depth == 0 and rstart != -1:
                            prows.append(ptext[rstart:i+1])
                            rstart = -1
                        i += 1
                        continue
                    i += 1
                
                f.write("""-- -----------------------------------------------------
-- Insert proverbs (from original paorou table)
-- -----------------------------------------------------
INSERT INTO `proverbs` (`paorou`, `paorou_mm`, `explaination`, `language`, `status`, `author_id`) VALUES
""")
                proverb_rows = []
                for pr in prows:
                    pf = parse_row(pr)
                    if len(pf) >= 6:
                        paorou = unescape_sql_string(pf[1]).strip()
                        paorou_mm = unescape_sql_string(pf[2]).strip()
                        expl = unescape_sql_string(pf[3]).strip()
                        lang = unescape_sql_string(pf[4]).strip() or 'man'
                        author = unescape_sql_string(pf[5]).strip()
                        ed_id = editor_id_map.get(author, 'NULL')
                        proverb_rows.append(
                            f"  ({escape_sql_string(paorou)}, {escape_sql_string(paorou_mm)}, "
                            f"{escape_sql_string(expl)}, {escape_sql_string(lang)}, 'approved', {ed_id})"
                        )
                if proverb_rows:
                    f.write(",\n".join(proverb_rows))
                    f.write(";\n\n")
                print(f"  Inserted {len(proverb_rows)} proverbs")

    # Insert word_of_day from original
    print("=== Step 8: Extracting word_of_day ===")
    wod_start = content.find('CREATE TABLE `word_of_day`')
    if wod_start != -1:
        wod_insert = content.find('INSERT INTO `word_of_day`', wod_start)
        if wod_insert != -1:
            next_t = content.find('CREATE TABLE', wod_insert + 10)
            next_a = content.find('ALTER TABLE', wod_insert + 10)
            ends = [p for p in [next_t, next_a] if p != -1]
            wod_end = min(ends) if ends else len(content)
            wod_section = content[wod_insert:wod_end]
            
            wv = re.search(r'VALUES\s*(.*)', wod_section, re.DOTALL)
            if wv:
                wtext = wv.group(1)
                wrows = []
                depth = 0
                i = 0
                in_str = False
                rstart = -1
                while i < len(wtext):
                    ch = wtext[i]
                    if in_str:
                        if ch == '\\':
                            i += 2
                            continue
                        if ch == "'":
                            in_str = False
                        i += 1
                        continue
                    if ch == "'":
                        in_str = True
                        i += 1
                        continue
                    if ch == '(':
                        if depth == 0:
                            rstart = i
                        depth += 1
                        i += 1
                        continue
                    if ch == ')':
                        depth -= 1
                        if depth == 0 and rstart != -1:
                            wrows.append(wtext[rstart:i+1])
                            rstart = -1
                        i += 1
                        continue
                    i += 1
                
                f.write("""-- -----------------------------------------------------
-- Insert word_of_day (from original table)
-- -----------------------------------------------------
INSERT INTO `word_of_day` (`word_id`, `display_date`, `is_active`) VALUES
""")
                wod_rows = []
                for wr in wrows:
                    wf = parse_row(wr)
                    if len(wf) >= 2:
                        wod_word = unescape_sql_string(wf[1]).strip()
                        # Find matching word_id
                        slug_key = make_slug(wod_word).lower()
                        if slug_key in word_groups:
                            wid = word_groups[slug_key]['new_id']
                            wod_rows.append(f"  ({wid}, CURDATE(), 1)")
                if wod_rows:
                    f.write(",\n".join(wod_rows))
                    f.write(";\n\n")
                print(f"  Inserted {len(wod_rows)} word_of_day entries")

    # Final section
    # Count proverbs
    proverb_count = 0
    if 'proverb_rows' in dir():
        proverb_count = len(proverb_rows)
    
    f.write(f"""-- -----------------------------------------------------
-- Reset auto-increment counters
-- -----------------------------------------------------
ALTER TABLE `editors` AUTO_INCREMENT = 1;
ALTER TABLE `words` AUTO_INCREMENT = 1;
ALTER TABLE `word_senses` AUTO_INCREMENT = 1;
ALTER TABLE `proverbs` AUTO_INCREMENT = 1;
ALTER TABLE `word_of_day` AUTO_INCREMENT = 1;
ALTER TABLE `edit_proposals` AUTO_INCREMENT = 1;
ALTER TABLE `users` AUTO_INCREMENT = 1;
ALTER TABLE `languages` AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- SUMMARY
-- ============================================================
-- Words: {len(word_groups):,}
-- Word senses: {len(cleaned_rows):,}
-- Editors: {len(editor_ids)}
-- Proverbs: {proverb_count}
-- ============================================================
""")

print(f"\n=== DONE ===")
print(f"Output file: {OUTPUT_FILE}")
print(f"  Words: {len(word_groups):,}")
print(f"  Word senses: {len(cleaned_rows):,}")
print(f"  Editors: {len(editor_ids)}")
print(f"  File size: {os.path.getsize(OUTPUT_FILE):,} bytes")