import os
import sys
from datetime import datetime

# Add the app directory to the path so we can import from it
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

import os
from sqlalchemy import create_engine, text
from app.models.user import User

def apply_migration():
    # Read database URL from environment or use default
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        password = "Jesuslove@12"  # Same as in app/__init__.py
        import urllib.parse
        encoded_password = urllib.parse.quote_plus(password)
        db_url = f"postgresql://postgres:{encoded_password}@localhost/all_inone"
    
    print(f"[{datetime.now()}] Starting migration 0008 - Adding reset_token columns to users table...")
    print(f"Connecting to database: {db_url}")
    
    try:
        # Create engine directly without Flask app context
        engine = create_engine(db_url)
        
        # Read the SQL migration file
        sql_file_path = os.path.join(os.path.dirname(__file__), '..', 'db_migrations', '0008_add_reset_token_columns.sql')
        with open(sql_file_path, 'r') as f:
            sql_commands = f.read()
            
        # Split by semicolon and execute each command
        commands = [cmd.strip() for cmd in sql_commands.split(';') if cmd.strip() and not cmd.strip().startswith('--')]
        
        with engine.connect() as conn:
            trans = conn.begin()  # Begin transaction
            try:
                for command in commands:
                    if command.strip():
                        conn.execute(text(command))
                trans.commit()
                print(f"[{datetime.now()}] Migration 0008 completed successfully!")
                print("Added reset_token and reset_token_expiry columns to users table.")
            except Exception as e:
                trans.rollback()
                raise e
    
    except Exception as e:
        print(f"[{datetime.now()}] Error applying migration 0008: {str(e)}")
        return False
        
    return True

if __name__ == "__main__":
    apply_migration()