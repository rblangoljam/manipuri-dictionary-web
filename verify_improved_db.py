"""
Verify the generated improved database SQL file.
"""
import re

OUTPUT_FILE = 'manipuri_dictionary_improved.sql'

print("=== Verifying improved database SQL file ===")

with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"File size: {len(content):,} chars")

# 1. Check word_senses INSERT exists
idx = content.find('INSERT INTO `word_senses`')
if idx == -1:
    print("ERROR: word_senses INSERT not found!")
else:
    print("[OK] word_senses INSERT found")
    # Show first few lines of word_senses
    snippet = content[idx:idx+1000]
    lines = snippet.split('\n')[:16]
    print("  Sample word_senses rows:")
    for line in lines:
        print(f"    {line[:160]}")

# 2. Check editors INSERT
idx = content.find('INSERT INTO `editors`')
if idx != -1:
    print("\n[OK] editors INSERT found")
    snippet = content[idx:idx+500]
    for line in snippet.split('\n')[:8]:
        print(f"    {line[:160]}")

# 3. Check words count
words_insert = content.find('INSERT INTO `words`')
words_end = content.find(';\n\n', words_insert)
words_section = content[words_insert:words_end]
word_rows = [l for l in words_section.split('\n') if l.strip().startswith('(')]
print(f"\n[OK] Words INSERT rows: {len(word_rows):,}")

# 4. Check word_senses count
senses_insert = content.find('INSERT INTO `word_senses`')
senses_end = content.find(';\n\n', senses_insert)
senses_section = content[senses_insert:senses_end]
sense_rows = [l for l in senses_section.split('\n') if l.strip().startswith('(')]
print(f"[OK] word_senses INSERT rows: {len(sense_rows):,}")

# 5. Check proverbs
pv_idx = content.find('INSERT INTO `proverbs`')
if pv_idx != -1:
    pv_end = content.find(';\n\n', pv_idx)
    pv_section = content[pv_idx:pv_end]
    pv_rows = [l for l in pv_section.split('\n') if l.strip().startswith('(')]
    print(f"[OK] proverbs INSERT rows: {len(pv_rows)}")

# 6. Check word_of_day
wod_idx = content.find('INSERT INTO `word_of_day`')
if wod_idx != -1:
    wod_end = content.find(';\n\n', wod_idx)
    wod_section = content[wod_idx:wod_end]
    wod_rows = [l for l in wod_section.split('\n') if l.strip().startswith('(')]
    print(f"[OK] word_of_day INSERT rows: {len(wod_rows)}")

# 7. Check encoding - look for latin1 references
latin1_count = content.lower().count('latin1')
utf8mb4_count = content.lower().count('utf8mb4')
print(f"\n[OK] Encoding check: latin1 refs = {latin1_count}, utf8mb4 refs = {utf8mb4_count}")

# 8. Check corrupt rows removed
corrupt_count = content.count('`wordtype`')
print(f"[OK] Corrupt header rows in data: {corrupt_count}")

# 9. Check end of file
print(f"\n=== END OF FILE (last 400 chars) ===")
print(content[-400:])

# 10. Verify data quality - check a known word
if "Abacus" in content:
    print("\n[OK] 'Abacus' found in data")
else:
    print("\n[WARN] 'Abacus' NOT found in data")

# Check Manipuri meaning sample
if "khutlai" in content.lower():
    print("[OK] Manipuri meaning data found (contains 'khutlai')")
else:
    print("[WARN] No Manipuri meaning data found in sample")

# 11. Check no NULL word entries
null_words = re.findall(r'\(\d+, \'\', \'\',', content)
print(f"[OK] Empty word entries: {len(null_words)}")

print("\n=== VERIFICATION COMPLETE ===")