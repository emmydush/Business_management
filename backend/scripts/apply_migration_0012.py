#!/usr/bin/env python3
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db

def apply_migration():
    app = create_app()
    with app.app_context():
        # Read and execute the SQL migration
        migration_file = 'db_migrations/0012_add_failed_login_attempts_to_users.sql'
        with open(migration_file, 'r') as f:
            sql = f.read()
        
        db.session.execute(db.text(sql))
        db.session.commit()
        print(f"✓ Migration applied successfully: {migration_file}")

if __name__ == '__main__':
    apply_migration()
