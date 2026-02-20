#!/usr/bin/env python
"""
Script to apply the 0026_ensure_invoicestatus_enum_values migration
Ensures the invoicestatus enum has all required values: draft, sent, viewed, paid, partially_paid, overdue, cancelled
"""
from app import create_app, db
import os
import sys

def main():
    app = create_app()
    with app.app_context():
        migration_file = os.path.join(
            os.path.dirname(__file__),
            '..',
            'db_migrations',
            '0026_ensure_invoicestatus_enum_values.sql'
        )
        
        if not os.path.exists(migration_file):
            print(f"Migration file not found: {migration_file}")
            sys.exit(1)
        
        with open(migration_file, 'r') as f:
            sql_content = f.read()
        
        try:
            db.session.execute(db.text(sql_content))
            db.session.commit()
            print("Migration 0026_ensure_invoicestatus_enum_values applied successfully")
        except Exception as e:
            db.session.rollback()
            print(f"Error applying migration: {str(e)}")
            sys.exit(1)

if __name__ == '__main__':
    main()
