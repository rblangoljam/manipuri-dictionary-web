"""Inspect existing database schema for Prisma configuration."""
import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    database='manipuri_dictionary',
    charset='utf8mb4'
)
cursor = conn.cursor()

cursor.execute('SHOW TABLES')
tables = [t[0] for t in cursor.fetchall()]

with open('schema_dump.txt', 'w', encoding='utf-8') as f:
    f.write(f'Tables: {tables}\n\n')
    for t in tables:
        cursor.execute(f'DESCRIBE {t}')
        f.write(f'=== {t} ===\n')
        for r in cursor.fetchall():
            f.write(f'  {r[0]}: {r[1]} (null={r[2]}, key={r[3]}, default={r[4]}, extra={r[5]})\n')
        f.write('\n')

print('Schema dumped to schema_dump.txt')
cursor.close()
conn.close()