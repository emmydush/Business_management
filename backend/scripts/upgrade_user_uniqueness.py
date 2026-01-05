"""Run this script with the Flask app context to apply the SQL migration.
Usage: python scripts/upgrade_user_uniqueness.py

WARNING: Review duplicates before running. See db_migrations/0001_tenant_username_email_unique.sql
"""
from app import create_app, db
import os

app = create_app()

sql_path = os.path.join(os.path.dirname(__file__), '..', 'db_migrations', '0001_tenant_username_email_unique.sql')
with open(sql_path, 'r', encoding='utf-8') as f:
    sql = f.read()

with app.app_context():
    conn = db.engine.connect()
    trans = conn.begin()
    try:
        conn.execute(sql)
        trans.commit()
        print('Migration applied successfully')
    except Exception as e:
        trans.rollback()
        print('Migration failed:', e)
    finally:
        conn.close()