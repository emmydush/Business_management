#!/usr/bin/env python3
"""
Apply migration 0016: Add 'partially_paid' to invoicestatus enum type.
This fixes the error: invalid input value for enum invoicestatus: "partially_paid"
"""

import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from dotenv import load_dotenv

def apply_migration():
    load_dotenv()
    
    # Get database URL
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        db_user = os.getenv('DB_USER', 'postgres')
        db_password = os.getenv('DB_PASSWORD')
        if not db_password:
            print("ERROR: DB_PASSWORD environment variable not set")
            return False
        import urllib.parse
        password = urllib.parse.quote_plus(db_password)
        db_host = os.getenv('DB_HOST', 'localhost')
        db_port = os.getenv('DB_PORT', '5432')
        db_name = os.getenv('DB_NAME', 'all_inone')
        db_url = f"postgresql://{db_user}:{password}@{db_host}:{db_port}/{db_name}"
    
    print(f"Connecting to database...")
    engine = create_engine(db_url)
    
    try:
        with engine.connect() as conn:
            # Check current enum values first
            print("\nChecking current invoicestatus enum values...")
            result = conn.execute(text("""
                SELECT enumlabel 
                FROM pg_enum 
                WHERE enumtypid = (SELECT typid FROM pg_type WHERE typname = 'invoicestatus'::regtype)
                ORDER BY enumsortorder
            """))
            current_values = [row[0] for row in result]
            print(f"Current enum values: {current_values}")
            
            # Add the missing 'partially_paid' value
            if 'partially_paid' not in current_values:
                print("\nAdding 'partially_paid' to invoicestatus enum...")
                conn.execute(text("ALTER TYPE invoicestatus ADD VALUE 'partially_paid'"))
                conn.commit()
                print("Successfully added 'partially_paid' to enum!")
            else:
                print("\n'partially_paid' already exists in enum - no changes needed.")
            
            # Verify the enum values after migration
            print("\nVerifying enum values after migration...")
            result = conn.execute(text("""
                SELECT enumlabel 
                FROM pg_enum 
                WHERE enumtypid = (SELECT typid FROM pg_type WHERE typname = 'invoicestatus'::regtype)
                ORDER BY enumsortorder
            """))
            final_values = [row[0] for row in result]
            print(f"Final enum values: {final_values}")
            
            print("\n✓ Migration 0016 applied successfully!")
            return True
            
    except Exception as e:
        print(f"\nERROR applying migration: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = apply_migration()
    sys.exit(0 if success else 1)
