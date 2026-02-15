import os
import sys
from app import create_app
import psycopg2

def check_database():
    """Check database connection and existing tables"""
    try:
        # Get database URL from environment
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("❌ DATABASE_URL not found in environment")
            return False
            
        # Parse the database URL
        # Format: postgresql://user:password@host:port/database
        import urllib.parse
        parsed = urllib.parse.urlparse(database_url)
        
        # Decode the password
        password = urllib.parse.unquote(parsed.password)
        
        print(f"Connecting to database: {parsed.hostname}:{parsed.port or 5432}/{parsed.path[1:]}")
        
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port or 5432,
            database=parsed.path[1:],  # Remove leading '/'
            user=parsed.username,
            password=password
        )
        
        cursor = conn.cursor()
        
        # Check if migrations table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'migrations'
            );
        """)
        migrations_table_exists = cursor.fetchone()[0]
        
        if not migrations_table_exists:
            print("Creating migrations table...")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS migrations (
                    id SERIAL PRIMARY KEY,
                    migration_name VARCHAR(255) UNIQUE NOT NULL,
                    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.commit()
            print("✅ Migrations table created")
        else:
            print("✅ Migrations table exists")
        
        # Get applied migrations
        cursor.execute("SELECT migration_name FROM migrations ORDER BY id;")
        applied_migrations = [row[0] for row in cursor.fetchall()]
        print(f"Applied migrations: {applied_migrations}")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def apply_migration(migration_file):
    """Apply a single migration"""
    try:
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("❌ DATABASE_URL not found")
            return False
            
        import urllib.parse
        parsed = urllib.parse.urlparse(database_url)
        password = urllib.parse.unquote(parsed.password)
        
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port or 5432,
            database=parsed.path[1:],
            user=parsed.username,
            password=password
        )
        
        cursor = conn.cursor()
        
        # Read and execute migration
        with open(os.path.join('db_migrations', migration_file), 'r') as f:
            sql = f.read()
            cursor.execute(sql)
        
        # Record migration
        cursor.execute(
            "INSERT INTO migrations (migration_name) VALUES (%s)",
            (migration_file,)
        )
        
        conn.commit()
        cursor.close()
        conn.close()
        print(f"✅ Applied {migration_file}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to apply {migration_file}: {e}")
        return False

def main():
    print("🔍 Checking database...")
    if not check_database():
        print("❌ Cannot proceed with migrations")
        return
    
    # List all migration files
    migration_files = sorted([
        f for f in os.listdir('db_migrations') 
        if f.endswith('.sql') and f.startswith('00')
    ])
    
    print(f"\n📋 Found {len(migration_files)} migrations:")
    for mf in migration_files:
        print(f"  - {mf}")
    
    # Apply each migration
    print("\n🚀 Applying migrations...")
    for migration_file in migration_files:
        apply_migration(migration_file)
    
    print("\n✅ All migrations completed!")

if __name__ == '__main__':
    main()