"""
Analyze the EPAOMAYEK.TTF font to understand character mapping.
"""
import struct
import sys

FONT_PATH = 'well-known/EPAOMAYEK.TTF'

with open(FONT_PATH, 'rb') as f:
    data = f.read()

print(f'Font size: {len(data):,} bytes')
offset_version, num_tables = struct.unpack('>IH', data[0:6])
print(f'Version: {hex(offset_version)}, Tables: {num_tables}')
    
tables = {}
for i in range(num_tables):
    offset = 12 + i * 16
    tag = data[offset:offset+4].decode('ascii', errors='replace')
    checksum, toffset, tlength = struct.unpack('>III', data[offset+4:offset+16])
    tables[tag] = (toffset, tlength)

print('Tables found:')
for tag, (toffset, tlength) in tables.items():
    print(f'  {tag} @ {toffset}, len {tlength}')

# Name table
if 'name' in tables:
    offset, length = tables['name']
    # name table format 0: 2 bytes format, 2 bytes count, 2 bytes stringOffset (for format 0)
    # For format 0, the structure is: count (2), stringOffset (2), then records of 
    # platformID, encodingID, languageID, nameID, length, offset (each 2 bytes = 12 bytes)
    fmt, num_records, string_offset = struct.unpack('>HHH', data[offset:offset+6])
    print(f'\n=== NAME TABLE (format {fmt}, {num_records} records) ===')
    for i in range(num_records):
        # Records start after 6 bytes header
        rec_off = offset + 6 + i * 12
        plt, enc, lang, nid, lnid, slen, soff = struct.unpack('>HHHHHHH', data[rec_off:rec_off+12])
        if nid in (1, 2, 4, 6):
            name_data = data[offset+soff:offset+soff+slen]
            try:
                name_str = name_data.decode('utf-16-be') if enc == 3 else name_data.decode('latin-1')
                print(f'  ID {nid}: {name_str}')
            except Exception as e:
                print(f'  ID {nid}: (decode error: {e})')

# cmap table
if 'cmap' in tables:
    offset, length = tables['cmap']
    version, num_subtables = struct.unpack('>HH', data[offset:offset+4])
    print(f'\n=== CMAP TABLE: version {version}, subtables: {num_subtables} ===')
    
    char_map = {}
    for i in range(num_subtables):
        sub_off = offset + 4 + i * 8
        plt, enc, sub_offset_val = struct.unpack('>HHI', data[sub_off:sub_off+8])
        print(f'  Subtable {i}: platform={plt}, encoding={enc}, offset={sub_offset_val}')
        actual_offset = offset + sub_offset_val
        fmt = struct.unpack('>H', data[actual_offset:actual_offset+2])[0]
        print(f'    Format: {fmt}')
        
        if fmt == 4:
            # Format 4: segment mapping for double-byte
            segCountX2 = struct.unpack('>H', data[actual_offset+6:actual_offset+8])[0]
            segCount = segCountX2 // 2
            print(f'    Segments: {segCount}')
            # Read end codes, start codes, and glyph id arrays
            end_codes = []
            for s in range(segCount):
                end_codes.append(struct.unpack('>H', data[actual_offset+14+s*2:actual_offset+16+s*2])[0])
            # Skip reservedPad (2 bytes) and end codes (segCount*2) → start codes begin at 16+segCount*2
            start_codes_off = actual_offset + 16 + segCount * 2
            start_codes = []
            for s in range(segCount):
                start_codes.append(struct.unpack('>H', data[start_codes_off+s*2:start_codes_off+2+s*2])[0])
            # idDelta after start codes
            id_delta_off = start_codes_off + segCount * 2
            id_deltas = []
            for s in range(segCount):
                id_deltas.append(struct.unpack('>h', data[id_delta_off+s*2:id_delta_off+2+s*2])[0])
            
            # Print first 50 mappings (character code -> glyph)
            print('    First 60 character mappings:')
            count = 0
            for s in range(segCount):
                start = start_codes[s]
                end = end_codes[s]
                delta = id_deltas[s]
                if end < start or end > 0xFFFF:
                    continue
                for code in range(start, min(end + 1, start + 5)):  # Only show first few per segment
                    glyph = (code + delta) & 0xFFFF if delta != 0 else None
                    char = chr(code) if 32 <= code < 127 else f'U+{code:04X}'
                    print(f'      {char!r} ({code}) -> glyph {glyph}')
                    count += 1
                    if count >= 60:
                        break
                if count >= 60:
                    break
        elif fmt == 12:
            # Format 12: segmented coverage
            n_groups = struct.unpack('>I', data[actual_offset+12:actual_offset+16])[0]
            print(f'    Groups: {n_groups}')
            print('    First 30 mappings:')
            for g in range(min(n_groups, 30)):
                goff = actual_offset + 16 + g * 12
                start, end, start_glyph = struct.unpack('>III', data[goff:goff+12])
                print(f'      U+{start:04X} - U+{end:04X} -> glyph {start_glyph}')

print('\n=== REFERENCE CHECK ===')
# Compare a known meaning_mm value against font characters
# Example from database: 'Iqlis ki AhaNb myeQ' 
# Check what characters exist in the font
test_strings = [
    'Iqlis ki AhaNb myeQ',
    'msiH Tib tMnb KuYlaI Ama',
    'tuHAoInna,tuHloMd',
    'AebasineY tObgi matO',
]
print('Font coverage check for sample strings:')
for s in test_strings:
    print(f'  "{s}"')
    for ch in s:
        code = ord(ch)
        # Would need full cmap lookup; just show chars that are ASCII
        if 32 <= code < 127:
            print(f'    {ch} (U+{code:04X}) = ASCII')
        else:
            print(f'    {ch} (U+{code:04X}) = NON-ASCII')