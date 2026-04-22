#!/usr/bin/env python3
"""
Apply slug column migration to fix businesses table
This fixes the login issue caused by missing slug column
"""

import os
import sys
from sqlalchemy import text, create_engine
from app import create_app, db

def apply_slug_migration():
    """Apply the slug column migration to businesses table"""
    
    app = create_app()
    
    with app.app_context():
        try:
            # Check if slug column already exists
            inspector = db.inspect(db.engine)
            businesses_columns = [col['name'] for col in inspector.get_columns('businesses')]
            
            if 'slug' in businesses_columns:
                print("Slug column already exists in businesses table")
                return True
            
            print("Adding slug column to businesses table...")
            
            # Add slug column
            db.session.execute(text("ALTER TABLE businesses ADD COLUMN IF NOT EXISTS slug VARCHAR(100)"))
            
            # Create unique index
            db.session.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug)"))
            
            # Update existing businesses with slugs
            db.session.execute(text("""
                UPDATE businesses 
                SET slug = LOWER(REPLACE(name, ' ', '-')) 
                WHERE slug IS NULL
            """))
            
            # Handle duplicate slugs by appending ID
            result = db.session.execute(text("""
                SELECT id, name, slug 
                FROM businesses 
                WHERE slug IN (
                    SELECT slug 
                    FROM businesses 
                    GROUP BY slug 
                    HAVING COUNT(*) > 1
                )
                ORDER BY id
            """))
            
            duplicates = result.fetchall()
            for i, (business_id, name, slug) in enumerate(duplicates):
                if i > 0:  # Skip first occurrence, make others unique
                    new_slug = f"{slug}-{business_id}"
                    db.session.execute(text(
                        "UPDATE businesses SET slug = :new_slug WHERE id = :business_id"
                    ), {"new_slug": new_slug, "business_id": business_id})
                    print(f"Updated duplicate slug for business {business_id}: {new_slug}")
            
            db.session.commit()
            print("Successfully applied slug migration!")
            return True
            
        except Exception as e:
            print(f"Error applying slug migration: {e}")
            db.session.rollback()
            return False

if __name__ == '__main__':
    print("Applying slug migration fix...")
    success = apply_slug_migration()
    if success:
        print("Migration applied successfully!")
    else:
        print("Migration failed!")
        sys.exit(1)
