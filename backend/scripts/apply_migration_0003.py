"""Apply db_migrations/0003_add_approval_columns.sql using the Flask app context.
Usage: python scripts/apply_migration_0003.py
"""
from app import create_app, db
from sqlalchemy import text
import os

app = create_app()

sql_path = os.path.join(os.path.dirname(__file__), '..', 'db_migrations', '0003_add_approval_columns.sql')
with open(sql_path, 'r', encoding='utf-8') as f:
    sql = f.read()

with app.app_context():
    conn = db.engine.connect()
    trans = conn.begin()
    try:
        conn.execute(text(sql))
        trans.commit()
        print('Migration 0003 applied successfully')
    except Exception as e:
        trans.rollback()
        print('Migration 0003 failed:', e)
    finally:
        conn.close()