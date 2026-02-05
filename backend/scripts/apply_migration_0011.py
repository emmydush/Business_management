"""
Apply migration 0011: Update employees table structure
"""

import os
import sys
from sqlalchemy import text

# Add the parent directory to the path so we can import app
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import create_app, db

def apply_migration():
    app = create_app()
    
    with app.app_context():
        print("Applying migration 0011: Update employees table structure...")
        
        try:
            # Read the SQL migration file
            migration_file = os.path.join(os.path.dirname(__file__), '..', 'db_migrations', '0011_update_employees_table.sql')
            
            with open(migration_file, 'r') as f:
                sql_content = f.read()
            
            # Split by semicolon and filter out comments and empty lines
            commands = []
            for line in sql_content.split(';'):
                line = line.strip()
                # Skip comments and empty lines
                if line and not line.startswith('--') and not line.startswith('/*'):
                    commands.append(line)
            
            for i, command in enumerate(commands, 1):
                if command:
                    print(f"Executing command {i}: {command[:50]}...")
                    db.session.execute(text(command))
            
            db.session.commit()
            print("✅ Migration 0011 applied successfully!")
            print("Employees table structure updated.")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error applying migration: {str(e)}")
            raise

if __name__ == "__main__":
    apply_migration()