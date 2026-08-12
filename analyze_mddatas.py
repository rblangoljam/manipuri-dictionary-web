import re
import sys

# Read the SQL file
with open('manipuri_dictionary_new.sql', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Find the mddatas INSERT section
# The mddatas table starts at CREATE TABLE `mddatas` and its data follows
mddatas_start = content.find('CREATE TABLE `mddatas`')
if mddatas_start == -1:
    print("ERROR: mddatas table not found")
    sys.exit(1)

# Find the INSERT INTO for mddatas
insert_start = content.find('INSERT INTO `mddatas`', mddatas_start)
if insert_start == -1:
    print("ERROR: INSERT INTO mddatas not found")
    sys.exit(1)

# Find the end of the INSERT (next CREATE TABLE or ALTER TABLE)
next_table = content.find('CREATE TABLE', insert_start + 10)
next_alter = content.find('ALTER TABLE', insert_start + 10)
end_positions = [p for p in [next_table, next_alter] if p != -1]
insert_end = min(end_positions) if end_positions else len(content)

insert_section = content[insert_start:insert_end]
print(f"INSERT section length: {len(insert_section)} chars")

# Parse individual row values using regex
# Pattern: (id, 'word', 'wordtype', 'definition', 'meaning_eng_man', 'meaning_mm', 'm_antonyms', 'm_synonyms', 'time', 'editor_id')
# Rows can span multiple lines, so we need to handle that
# Strategy: find all complete row tuples

# Extract the VALUES part
values_match = re.search(r'VALUES\s*(.*)', insert_section, re.DOTALL)
if not values_match:
    print("ERROR: VALUES not found")
    sys.exit(1)

values_text = values_match.group(1)

# Parse rows - each row starts with ( and ends with ), or ); for the last one
# We'll use a simple state machine
rows = []
current_row = []
depth = 0
i = 0
in_string = False
string_char = ''
row_start = -1

while i < len(values_text):
    ch = values_text[i]
    
    if in_string:
        if ch == '\\':
            i += 2
            continue
        if ch == string_char:
            in_string = False
        i += 1
        continue
    
    if ch == "'":
        in_string = True
        string_char = ch
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
            row_text = values_text[row_start:i+1]
            rows.append(row_text)
            row_start = -1
        i += 1
        continue
    
    i += 1

print(f"Total rows parsed: {len(rows)}")

# Parse each row into fields
def parse_row(row_text):
    """Parse a row like (1, 'A', '', 'definition...', ...) into fields"""
    # Remove outer parens
    inner = row_text.strip()
    if inner.startswith('('):
        inner = inner[1:]
    if inner.endswith(')'):
        inner = inner[:-1]
    if inner.endswith(','):
        inner = inner[:-1]
    
    # Parse comma-separated values respecting quotes
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
    
    # Clean up fields - remove surrounding quotes
    cleaned = []
    for f in fields:
        f = f.strip()
        if len(f) >= 2 and f.startswith("'") and f.endswith("'"):
            f = f[1:-1]
        cleaned.append(f)
    
    return cleaned

# Analyze the data
unique_words = set()
word_types = {}
total_rows = 0
rows_with_manipuri = 0
rows_with_definition = 0
rows_with_editor = 0
editors = {}
max_word_len = 0
empty_wordtype = 0

for row_text in rows:
    fields = parse_row(row_text)
    if len(fields) < 10:
        continue
    total_rows += 1
    word = fields[1]
    wordtype = fields[2]
    definition = fields[3]
    meaning_eng_man = fields[4]
    meaning_mm = fields[5]
    editor_id = fields[9]
    
    unique_words.add(word)
    max_word_len = max(max_word_len, len(word))
    
    if wordtype:
        word_types[wordtype] = word_types.get(wordtype, 0) + 1
    else:
        empty_wordtype += 1
    
    if meaning_eng_man or meaning_mm:
        rows_with_manipuri += 1
    if definition:
        rows_with_definition += 1
    if editor_id:
        rows_with_editor += 1
        editors[editor_id] = editors.get(editor_id, 0) + 1

print(f"\n=== ANALYSIS RESULTS ===")
print(f"Total rows: {total_rows}")
print(f"Unique words: {len(unique_words)}")
print(f"Max word length: {max_word_len}")
print(f"Rows with Manipuri meaning: {rows_with_manipuri}")
print(f"Rows with definition: {rows_with_definition}")
print(f"Rows with editor: {rows_with_editor}")
print(f"Rows with empty wordtype: {empty_wordtype}")

print(f"\n=== WORD TYPES (top 20) ===")
for wt, count in sorted(word_types.items(), key=lambda x: -x[1])[:20]:
    print(f"  '{wt}': {count}")

print(f"\n=== EDITORS ===")
for ed, count in sorted(editors.items(), key=lambda x: -x[1]):
    print(f"  '{ed}': {count}")

print(f"\n=== SAMPLE WORDS (first 30 unique) ===")
for w in sorted(unique_words)[:30]:
    print(f"  {w}")