"""
Dump all glyph names from the EPAOMAYEK font to understand the Meitei Mayek mapping.
"""
from fontTools.ttLib import TTFont

font = TTFont('well-known/EPAOMAYEK.TTF')
glyph_order = font.getGlyphOrder()

with open('glyph_names.txt', 'w', encoding='utf-8') as f:
    f.write(f'Total glyphs: {len(glyph_order)}\n')
    f.write('All glyph names:\n')
    for i, name in enumerate(glyph_order):
        f.write(f'  {i}: {name}\n')

print(f'Dumped {len(glyph_order)} glyph names to glyph_names.txt')