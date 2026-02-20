import os
from dotenv import load_dotenv
import psycopg2

# Load env from backend/.env
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print('DATABASE_URL not set in', env_path)
    raise SystemExit(1)

sql_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'db_migrations', '0025_add_payroll_disbursement_columns.sql')
if not os.path.exists(sql_file):
    print('Migration file not found:', sql_file)
    raise SystemExit(1)

with open(sql_file, 'r', encoding='utf-8') as f:
    sql_content = f.read()

print('Connecting to', DATABASE_URL)
conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True
cur = conn.cursor()
try:
    cur.execute(sql_content)
    print('Migration applied successfully')
except Exception as e:
    print('Error applying migration:', e)
    raise
finally:
    cur.close()
    conn.close()
