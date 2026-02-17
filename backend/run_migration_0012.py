#!/usr/bin/env python3
"""Standalone migration script that doesn't require flask"""
import os
import sys
import psycopg2
import urllib.parse

def apply_migration():
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not found in environment")
        return False
    
    # Parse the database URL
    parsed = urllib.parse.urlparse(database_url)
    password = urllib.parse.unquote(parsed.password)
    
    print(f"Connecting to database: {parsed.hostname}:{parsed.port or 5432}/{parsed.path[1:]}")
    
    try:
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port or 5432,
            database=parsed.path[1:],  # Remove leading '/'
            user=parsed.username,
            password=password
        )
        
        cursor = conn.cursor()
        
        # Read and execute the SQL migration
        with open('db_migrations/0012_add_failed_login_attempts_to_users.sql', 'r') as f:
            sql = f.read()
            cursor.execute(sql)
        
        conn.commit()
        cursor.close()
        conn.close()
        print("✅ Migration applied successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == '__main__':
    apply_migration()
