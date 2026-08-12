"""
Convert meaning_mm from E-Pao keyboard encoding to Unicode Meitei Mayek.
"""
import mysql.connector
import sys
import io

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# E-Pao keyboard mapping
KEYBOARD_MAPPING = {
    # Consonants (Mapum Mayek)
    'k': '\uABC0',  # ꯀ Kok
    's': '\uABC1',  # ꯁ Sam
    'l': '\uABC2',  # ꯂ Lai
    'm': '\uABC3',  # ꯃ Mit
    'p': '\uABC4',  # ꯄ Pa
    'n': '\uABC5',  # ꯅ Na
    'c': '\uABC6',  # ꯆ Chin
    't': '\uABC7',  # ꯇ Tin
    'K': '\uABC8',  # ꯈ Khou
    'Z': '\uABC9',  # ꯉ Ngou
    'T': '\uABCA',  # ꯊ Thou
    'w': '\uABCB',  # ꯋ Wai
    'y': '\uABCC',  # ꯌ Yang
    'h': '\uABCD',  # ꯍ Huk
    'U': '\uABCE',  # ꯎ Un
    'I': '\uABCF',  # ꯏ Ee (consonant - prioritized over lonsum)
    'f': '\uABD0',  # ꯐ Fam
    'A': '\uABD1',  # ꯑ Atiya
    'g': '\uABD2',  # ꯒ Gok
    'J': '\uABD3',  # ꯓ Jham
    'r': '\uABD4',  # ꯔ Rai
    'b': '\uABD5',  # ꯕ Baa
    'j': '\uABD6',  # ꯖ Jil
    'd': '\uABD7',  # ꯗ Dil
    'G': '\uABD8',  # ꯘ Ghou
    'D': '\uABD9',  # ꯙ Dhou
    'B': '\uABDA',  # ꯚ Bham
    
    # Vowel signs (Cheitap Mayek)
    'a': '\uABE5',  # ꯥ Aatap
    'e': '\uABE6',  # ꯦ Yetnap
    'u': '\uABE8',  # ꯨ Unap
    'i': '\uABE4',  # ꯤ Enap
    'E': '\uABE9',  # ꯩ Cheinap
    'o': '\uABE3',  # ꯣ Otnap
    'O': '\uABE7',  # ꯧ Sounap
    'q': '\uABEA',  # ꯪ Nung
    
    # Final consonants (Lonsum Mayek)
    'Q': '\uABDB',  # ꯛ Kok Lonsum
    'L': '\uABDC',  # ꯜ Lai Lonsum
    'M': '\uABDD',  # ꯝ Mit Lonsum
    'P': '\uABDE',  # ꯞ Pa Lonsum
    'N': '\uABDF',  # ꯟ Na Lonsum
    'Y': '\uABE0',  # ꯠ Tin Lonsum
    'H': '\uABE1',  # ꯡ Ngou Lonsum
    'I': '\uABE2',  # ꯢ Ee Lonsum (conflict with consonant - consonant prioritized)
    
    # Digits (Mashing Mayek)
    '0': '\uABF0',  # ꯰
    '1': '\uABF1',  # ꯱
    '2': '\uABF2',  # ꯲
    '3': '\uABF3',  # ꯳
    '4': '\uABF4',  # ꯴
    '5': '\uABF5',  # ꯵
    '6': '\uABF6',  # ꯶
    '7': '\uABF7',  # ꯷
    '8': '\uABF8',  # ꯸
    '9': '\uABF9',  # ꯹
    
    # Marks (Khudam Mayek)
    '|': '\uABEB',  # ꯫ Cheikhei
    '.': '\uABEC',  # ꯬ Lum Iyek
    '_': '\uABED',  # ꯭ Apun Iyek
}

# Independent vowel sequences (contextual forms)
INDEPENDENT_VOWELS = {
    'a': '\uABD1\uABE5',  # ꯑꯥ
    'e': '\uABD1\uABE6',  # ꯑꯦ
    'E': '\uABD1\uABE9',  # ꯑꯩ
    'o': '\uABD1\uABE3',  # ꯑꯣ
    'O': '\uABD1\uABE7',  # ꯑꯧ
    'q': '\uABD1\uABEA',  # ꯑꯪ
}

# Meitei Mayek consonants (for context detection)
MEITEI_CONSONANTS = set('\uABC0\uABC1\uABC2\uABC3\uABC4\uABC5\uABC6\uABC7\uABC8\uABC9\uABCA\uABCB\uABCC\uABCD\uABCE\uABCF\uABD0\uABD1\uABD2\uABD3\uABD4\uABD5\uABD6\uABD7\uABD8\uABD9\uABDA')


def is_meitei_consonant(ch):
    """Check if a character is a Meitei Mayek consonant."""
    return ch in MEITEI_CONSONANTS


def convert_keyboard_to_unicode(text):
    """
    Convert E-Pao keyboard-encoded text to Unicode Meitei Mayek.
    
    Rules:
    1. If a key has an explicit mapping, convert it
    2. If no mapping, preserve the character unchanged
    3. Preserve spaces, line breaks, punctuation
    4. Handle contextual independent vowels (standalone vs after consonant)
    """
    if not text:
        return text
    
    result = []
    i = 0
    text_len = len(text)
    
    while i < text_len:
        ch = text[i]
        
        # Check if character is in keyboard mapping
        if ch in KEYBOARD_MAPPING:
            # Check for contextual independent vowel
            if ch in INDEPENDENT_VOWELS:
                # Determine if this is standalone or after a consonant
                if i == 0:
                    # Start of string - standalone independent vowel
                    result.append(INDEPENDENT_VOWELS[ch])
                else:
                    # Check previous character
                    prev_ch = text[i - 1]
                    
                    # If previous is a Meitei Mayek consonant, this is a vowel sign
                    if is_meitei_consonant(prev_ch):
                        result.append(KEYBOARD_MAPPING[ch])
                    else:
                        # Standalone independent vowel
                        result.append(INDEPENDENT_VOWELS[ch])
            else:
                # Regular mapping
                result.append(KEYBOARD_MAPPING[ch])
        else:
            # No mapping - preserve character as-is
            result.append(ch)
        
        i += 1
    
    return ''.join(result)


def convert_database():
    """Convert all meaning_mm values to Unicode and store in meaning_mm_unicode."""
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        database='manipuri_dictionary',
        charset='utf8mb4'
    )
    cursor = conn.cursor()
    
    # Get total count
    cursor.execute("SELECT COUNT(*) FROM word_senses WHERE meaning_mm != ''")
    total = cursor.fetchone()[0]
    print(f"Converting {total} rows...")
    
    # Process in batches
    batch_size = 1000
    offset = 0
    converted = 0
    
    while offset < total:
        # Get batch
        cursor.execute("""
            SELECT id, meaning_mm FROM word_senses 
            WHERE meaning_mm != '' 
            LIMIT %s OFFSET %s
        """, (batch_size, offset))
        
        rows = cursor.fetchall()
        if not rows:
            break
        
        # Convert each row
        updates = []
        for row_id, mm_text in rows:
            unicode_text = convert_keyboard_to_unicode(mm_text)
            updates.append((unicode_text, row_id))
        
        # Batch update
        cursor.executemany("""
            UPDATE word_senses SET meaning_mm_unicode = %s WHERE id = %s
        """, [(u[0], u[1]) for u in updates])
        
        conn.commit()
        converted += len(updates)
        print(f"  Converted {converted}/{total} rows...")
        
        offset += batch_size
    
    print(f"\nConversion complete! {converted} rows converted.")
    
    # Show some samples
    print("\n=== SAMPLE CONVERSIONS ===")
    cursor.execute("""
        SELECT meaning_mm, meaning_mm_unicode 
        FROM word_senses 
        WHERE meaning_mm != '' AND meaning_mm_unicode IS NOT NULL
        LIMIT 10
    """)
    
    for mm, unicode_mm in cursor.fetchall():
        print(f"\nOriginal:    {mm}")
        print(f"Unicode:     {unicode_mm}")
    
    cursor.close()
    conn.close()


if __name__ == '__main__':
    # Test conversion first
    print("=== TEST CONVERSIONS ===")
    test_cases = [
        "na",      # ꯅꯥ
        "k",       # ꯀ
        "am",      # ꯑꯝ
        "eeba",    # ꯑꯦꯕꯥ
        "123",     # ꯱꯲꯳
        "hello",   # ꯍꯦꯜꯂꯣ
        "test",    # ꯇꯦꯁꯇ
    ]
    
    for test in test_cases:
        result = convert_keyboard_to_unicode(test)
        print(f"{test:15} -> {result}")
    
    print("\n" + "="*50)
    
    # Convert database
    convert_database()