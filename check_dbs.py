"""Check which database contains the dictionary data."""
import mysql.connector

conn = mysql.connector.connect(host='localhost', user='root', charset='utf8mb4')
cursor = conn.cursor()

cursor.execute('SHOW DATABASES')
dbs = [r[0] for r in cursor.fetchall()]

with open('dbs_check.txt', 'w', encoding='utf-8') as f:
    f.write(f'Databases: {dbs}\n\n')
    for db in dbs:
        if 'manipuri' in db or 'dictionary' in db:
            try:
                cursor.execute(f'SELECT COUNT(*) FROM `{db}`.words')
                count = cursor.fetchone()[0]
                f.write(f'{db}: words count = {count}\n')
            except Exception as e:
                f.write(f'{db}: error = {e}\n')

print('Written to dbs_check.txt')
cursor.close()
conn.close()