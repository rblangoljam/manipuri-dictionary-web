import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    database='manipuri_dictionary',
    charset='utf8mb4'
)
cursor = conn.cursor()

cursor.execute('SELECT COUNT(*) FROM word_senses')
print('Total word_senses:', cursor.fetchone()[0])

cursor.execute("SELECT COUNT(*) FROM word_senses WHERE meaning_mm_unicode IS NOT NULL AND meaning_mm_unicode != ''")
print('With unicode:', cursor.fetchone()[0])

cursor.execute('SELECT COUNT(*) FROM words')
print('Total words:', cursor.fetchone()[0])

# Sample data - write to file to avoid console encoding issues
cursor.execute("""
    SELECT ws.id, ws.word_id, w.word, ws.wordtype, LEFT(ws.definition, 60), LEFT(ws.meaning_eng_man, 60), LEFT(ws.meaning_mm_unicode, 60)
    FROM word_senses ws
    JOIN words w ON ws.word_id = w.id
    WHERE ws.meaning_mm_unicode IS NOT NULL AND ws.meaning_mm_unicode != ''
    LIMIT 5
""")
with open('db_samples.txt', 'w', encoding='utf-8') as f:
    f.write('Sample data:\n')
    for r in cursor.fetchall():
        f.write(str(r) + '\n')

print('Samples written to db_samples.txt')

cursor.close()
conn.close()
