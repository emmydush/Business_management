#!/usr/bin/env python
"""
Run all database migrations in sequence
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
from psycopg2 import sql

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:Jesuslove%4012@localhost:5432/all_inone')

def extract_db_info(db_url):
    """Extract connection parameters from DATABASE_URL"""
    # Format: postgresql://user:password@host:port/database
    try:
        from sqlalchemy.engine.url import make_url
        url = make_url(db_url)
        return {
            'user': url.username,
            'password': url.password,
            'host': url.host,
            'port': url.port or 5432,
            'database': url.database,
        }
    except:
        print("Error parsing DATABASE_URL")
        raise

def get_migration_files():
    """Get all migration files sorted by name"""
    migrations_dir = Path(__file__).parent / 'db_migrations'
    migration_files = sorted([f for f in migrations_dir.glob('*.sql')])
    return migration_files

def split_sql_statements(sql_content):
    """Split SQL statements handling PL/pgSQL dollar-quoted strings"""
    statements = []
    current_statement = []
    in_dollar_quote = False
    dollar_quote_delimiter = None
    i = 0
    
    while i < len(sql_content):
        # Check for dollar quote start/end
        if sql_content[i] == '$':
            # Look for dollar quote pattern (e.g., $$, $tag$)
            j = i + 1
            while j < len(sql_content) and sql_content[j] != '$':
                j += 1
            
            if j < len(sql_content) and sql_content[j] == '$':
                delimiter = sql_content[i:j+1]
                
                if not in_dollar_quote:
                    in_dollar_quote = True
                    dollar_quote_delimiter = delimiter
                    current_statement.append(sql_content[i:j+1])
                    i = j + 1
                    continue
                elif delimiter == dollar_quote_delimiter:
                    in_dollar_quote = False
                    dollar_quote_delimiter = None
                    current_statement.append(sql_content[i:j+1])
                    i = j + 1
                    continue
        
        # Handle semicolon as statement separator (only outside dollar quotes)
        if sql_content[i] == ';' and not in_dollar_quote:
            current_statement.append(';')
            stmt = ''.join(current_statement).strip()
            if stmt:
                statements.append(stmt)
            current_statement = []
            i += 1
            continue
        
        current_statement.append(sql_content[i])
        i += 1
    
    # Add any remaining statement
    stmt = ''.join(current_statement).strip()
    if stmt and stmt != ';':
        statements.append(stmt)
    
    return [s for s in statements if s]


def apply_migrations():
    """Apply all migrations in sequence"""
    db_info = extract_db_info(DATABASE_URL)
    migration_files = get_migration_files()
    
    if not migration_files:
        print("No migration files found!")
        return False
    
    print(f"Found {len(migration_files)} migration files")
    print(f"Connecting to database: {db_info['database']}")
    
    try:
        conn = psycopg2.connect(
            user=db_info['user'],
            password=db_info['password'],
            host=db_info['host'],
            port=db_info['port'],
            database=db_info['database']
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        # Create migrations tracking table if it doesn't exist
        try:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS migration_history (
                    id SERIAL PRIMARY KEY,
                    migration_name VARCHAR(255) NOT NULL UNIQUE,
                    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            print("Migration history table ready")
        except Exception as e:
            print(f"Warning: Could not create migration history table: {e}")
        
        # Apply each migration
        failed = []
        succeeded = []
        skipped = []
        
        for migration_file in migration_files:
            migration_name = migration_file.name
            
            # Check if migration has already been applied
            try:
                cur.execute(
                    "SELECT 1 FROM migration_history WHERE migration_name = %s",
                    (migration_name,)
                )
                if cur.fetchone():
                    # Use plain ASCII markers to avoid Windows console encoding issues
                    print(f"[SKIP] {migration_name} (already applied)")
                    skipped.append(migration_name)
                    continue
            except Exception as e:
                print(f"Warning: Could not check migration history: {e}")
            
            # Read and execute migration
            try:
                with open(migration_file, 'r', encoding='utf-8') as f:
                    sql_content = f.read().strip()
                
                if not sql_content:
                    print(f"[SKIP] {migration_name} (empty file)")
                    skipped.append(migration_name)
                    continue
                
                print(f"[RUN ] Applying {migration_name}...", end=' ', flush=True)
                
                # Split SQL statements properly handling dollar quotes
                statements = split_sql_statements(sql_content)
                if not statements:
                    print("[SKIP] (no executable statements)")
                    skipped.append(migration_name)
                    continue
                
                for statement in statements:
                    if statement.strip():
                        cur.execute(statement)
                
                # Record migration
                try:
                    cur.execute(
                        "INSERT INTO migration_history (migration_name) VALUES (%s)",
                        (migration_name,)
                    )
                except:
                    pass  # Migration history may not be available
                
                succeeded.append(migration_name)
                print("[OK]")
                
            except Exception as e:
                error_msg = str(e).lower()
                # Skip errors for already existing objects (they may have been created by SQLAlchemy)
                if any(phrase in error_msg for phrase in [
                    'already exists', 'already defined', 'duplicate key',
                    'already exist', 'already in use'
                ]):
                    print("[SKIP] (object already exists)")
                    skipped.append(migration_name)
                else:
                    print(f"[FAIL] {str(e)[:100]}")
                    failed.append((migration_name, str(e)))
        
        cur.close()
        conn.close()
        
        # Print summary
        print("\n" + "="*60)
        print("MIGRATION SUMMARY")
        print("="*60)
        print(f"Succeeded: {len(succeeded)}")
        print(f"Skipped:   {len(skipped)}")
        print(f"Failed:    {len(failed)}")
        
        if failed:
            print("\nFailed migrations:")
            for name, error in failed:
                print(f"  - {name}: {error[:80]}")
            return False
        
        return True
        
    except psycopg2.OperationalError as e:
        print(f"Connection error: {e}")
        print("\nMake sure:")
        print("  1. PostgreSQL is running")
        print("  2. DATABASE_URL is correct")
        print("  3. Database user has proper permissions")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("Running database migrations...\n")
    success = apply_migrations()
    sys.exit(0 if success else 1)
