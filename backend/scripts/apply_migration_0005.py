"""Apply db_migrations/0005_add_documents_table.sql using the Flask app context.
Usage: python scripts/apply_migration_0005.py
"""
import sys, os
# Ensure backend package is on sys.path so `app` can be imported when running from the project root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import create_app, db
from sqlalchemy import text

app = create_app()

sql_path = os.path.join(os.path.dirname(__file__), '..', 'db_migrations', '0005_add_documents_table.sql')
with open(sql_path, 'r', encoding='utf-8') as f:
    sql = f.read()

with app.app_context():
    conn = db.engine.connect()
    trans = conn.begin()
    try:
        conn.execute(text(sql))
        trans.commit()
        print('Migration 0005 applied successfully')
    except Exception as e:
        trans.rollback()
        print('Migration 0005 failed:', e)
    finally:
        conn.close()