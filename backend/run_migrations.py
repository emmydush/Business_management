#!/usr/bin/env python3
"""Run all pending database migrations"""
import os
import sys
import psycopg2
import urllib.parse

def apply_migrations():
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        password = urllib.parse.quote_plus("Jesuslove@12")
        database_url = f"postgresql://postgres:{password}@localhost:5432/all_inone"
    
    # Parse the database URL
    parsed = urllib.parse.urlparse(database_url)
    password = urllib.parse.unquote(parsed.password)
    
    print(f"Connecting to database: {parsed.hostname}:{parsed.port or 5432}/{parsed.path[1:]}")
    
    try:
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port or 5432,
            database=parsed.path[1:],
            user=parsed.username,
            password=password
        )
        
        cursor = conn.cursor()
        
        # List of migration files to run in order
        migrations = [
            'db_migrations/0013_add_company_profile_fields.sql',
            'db_migrations/0014_add_extended_business_fields.sql',
        ]
        
        for migration_file in migrations:
            if not os.path.exists(migration_file):
                print(f"⚠️  Skipping {migration_file} - file not found")
                continue
            
            print(f"\n📋 Running migration: {migration_file}")
            try:
                with open(migration_file, 'r') as f:
                    sql = f.read()
                    if sql.strip():
                        cursor.execute(sql)
                        conn.commit()
                        print(f"✅ {migration_file} completed")
                    else:
                        print(f"⏭️  {migration_file} is empty, skipping")
            except Exception as e:
                conn.rollback()
                print(f"❌ {migration_file} failed: {e}")
                continue
        
        cursor.close()
        conn.close()
        print("\n✅ All migrations completed!")
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == '__main__':
    apply_migrations()
