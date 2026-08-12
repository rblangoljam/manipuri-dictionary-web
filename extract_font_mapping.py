"""
Extract the ASCII key to Meitei Mayek Unicode mapping from the EPAOMAYEK.TTF font.
Uses fontTools to properly parse the font's cmap table.
"""
import json
from fontTools.ttLib import TTFont

FONT_PATH = 'well-known/EPAOMAYEK.TTF'

print(f'Loading font: {FONT_PATH}')
font = TTFont(FONT_PATH)

# Get font name
name_table = font['name']
font_family = name_table.getDebugName(1) or name_table.getDebugName(4) or 'Unknown'
print(f'Font family: {font_family}')

# Get cmap table - this maps character codes to glyph IDs
cmap = font.getBestCmap()
print(f'Total character mappings: {len(cmap)}')

# Get glyph names
glyph_order = font.getGlyphOrder()
print(f'Total glyphs: {len(glyph_order)}')

# Build reverse mapping: character code -> glyph name
print('\n=== CHARACTER TO GLYPH NAME MAPPING ===')
result = {}
for code, glyph_name in sorted(cmap.items()):
    if 32 <= code < 127:  # Printable ASCII
        char = chr(code)
        result[char] = {'glyph_name': glyph_name}
        print(f'  {char!r} (U+{code:04X}) -> glyph {glyph_name!r}')

# Save mapping
with open('epaomayek_mapping.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, indent=2, ensure_ascii=False)

print(f'\nMapping saved to epaomayek_mapping.json')
print(f'Total ASCII mappings: {len(result)}')

# Also show non-ASCII mappings that might be relevant
print('\n=== NON-ASCII MAPPINGS (first 30) ===')
count = 0
for code, glyph_id in sorted(cmap.items()):
    if code >= 127:
        char = f'U+{code:04X}'
        glyph_name = glyph_order[glyph_id] if glyph_id < len(glyph_order) else f'gid{glyph_id}'
        print(f'  {char} -> glyph {glyph_id} {glyph_name!r}')
        count += 1
        if count >= 30:
            break