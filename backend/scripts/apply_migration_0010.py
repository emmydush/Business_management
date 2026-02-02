import os
import sys
from app import create_app, db
from sqlalchemy import text

def apply_migration():
    app = create_app()
    with app.app_context():
        try:
            # Read the SQL migration file
            migration_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'db_migrations', '0010_add_departments_table.sql')
            
            with open(migration_file, 'r') as f:
                sql_commands = f.read()
            
            # Split commands by semicolon and execute each
            commands = [cmd.strip() for cmd in sql_commands.split(';') if cmd.strip()]
            
            for command in commands:
                if command:
                    print(f"Executing: {command[:50]}...")
                    db.session.execute(text(command))
            
            db.session.commit()
            print("Migration applied successfully!")
            
        except Exception as e:
            db.session.rollback()
            print(f"Error applying migration: {e}")
            raise

if __name__ == "__main__":
    apply_migration()