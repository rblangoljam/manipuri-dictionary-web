"""
Check what characters appear in the meaning_mm field to ensure the keyboard mapping is complete.
"""
import mysql.connector
import sys
import io

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    database='manipuri_dictionary',
    charset='utf8mb4'
)
cursor = conn.cursor()

cursor.execute("SELECT meaning_mm FROM word_senses WHERE meaning_mm != '' LIMIT 10000")

all_chars = set()
for (mm,) in cursor.fetchall():
    for ch in mm:
        all_chars.add(ch)

print(f"Total unique characters in meaning_mm: {len(all_chars)}")
print("\nCharacters (sorted by ASCII code):")
for ch in sorted(all_chars, key=lambda c: ord(c)):
    code = ord(ch)
    if 32 <= code < 127:
        print(f"  {ch!r} (U+{code:04X})")
    else:
        print(f"  U+{code:04X}")

# Keyboard mapping from specification
keyboard_mapping = {
    'consonants': {
        'k': '\uABC0', 's': '\uABC1', 'l': '\uABC2', 'm': '\uABC3',
        'p': '\uABC4', 'n': '\uABC5', 'c': '\uABC6', 't': '\uABC7',
        'K': '\uABC8', 'Z': '\uABC9', 'T': '\uABCA', 'w': '\uABCB',
        'y': '\uABCC', 'h': '\uABCD', 'U': '\uABCE', 'I': '\uABCF',
        'f': '\uABD0', 'A': '\uABD1', 'g': '\uABD2', 'J': '\uABD3',
        'r': '\uABD4', 'b': '\uABD5', 'j': '\uABD6', 'd': '\uABD7',
        'G': '\uABD8', 'D': '\uABD9', 'B': '\uABDA',
    },
    'vowels': {
        'a': '\uABE5', 'e': '\uABE6', 'u': '\uABE8', 'i': '\uABE4',
        'E': '\uABE9', 'o': '\uABE3', 'O': '\uABE7', 'q': '\uABEA',
    },
    'lonsum': {
        'Q': '\uABDB', 'L': '\uABDC', 'M': '\uABDD', 'P': '\uABDE',
        'N': '\uABDF', 'Y': '\uABE0', 'H': '\uABE1', 'I': '\uABE2',
    },
    'digits': {
        '0': '\uABF0', '1': '\uABF1', '2': '\uABF2', '3': '\uABF3',
        '4': '\uABF4', '5': '\uABF5', '6': '\uABF6', '7': '\uABF7',
        '8': '\uABF8', '9': '\uABF9',
    },
    'marks': {
        '|': '\uABEB', '.': '\uABEC', '_': '\uABED',
    }
}

# Build combined mapping
combined = {}
for cat in ['marks', 'digits', 'lonsum', 'vowels', 'consonants']:
    for k, v in keyboard_mapping[cat].items():
        combined[k] = v

# Check for conflicts
conflicts = {}
for cat in ['consonants', 'vowels', 'lonsum', 'digits', 'marks']:
    for k, v in keyboard_mapping[cat].items():
        if k in conflicts:
            conflicts[k].append((cat, v))
        else:
            conflicts[k] = [(cat, v)]

print("\n=== CONFLICTS (same key in multiple categories) ===")
for k, cats in sorted(conflicts.items()):
    if len(cats) > 1:
        print(f"  {k!r}: {cats}")

print("\n=== Characters in data NOT in mapping ===")
unmapped = []
for ch in sorted(all_chars, key=lambda c: ord(c)):
    if ch not in combined:
        code = ord(ch)
        if 32 <= code < 127:
            print(f"  {ch!r} (U+{code:04X})")
        else:
            print(f"  U+{code:04X}")
        unmapped.append(ch)

print(f"\nTotal unmapped characters: {len(unmapped)}")

cursor.close()
conn.close()