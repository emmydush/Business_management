#!/usr/bin/env python3
"""Apply migration 0023 - Add custom_features column to subscriptions"""
import os
import psycopg2
import urllib.parse

def apply_migration():
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
        
        # Run the migration
        sql = """
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS custom_features JSON;

ALTER TABLE subscriptions 
ALTER COLUMN custom_features SET DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_custom_features 
ON subscriptions(custom_features);
"""
        
        print("Running migration 0023_add_custom_features_to_subscriptions...")
        cursor.execute(sql)
        conn.commit()
        print("Migration applied successfully!")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"Migration failed: {e}")
        return False

if __name__ == '__main__':
    apply_migration()
