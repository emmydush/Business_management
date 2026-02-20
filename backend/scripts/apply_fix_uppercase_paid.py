#!/usr/bin/env python
"""
Script to apply migration 0027_fix_uppercase_paid_status.sql
Converts any uppercase 'PAID' status values to lowercase 'paid'
"""
from app import create_app, db
import os
import sys

def main():
    app = create_app()
    with app.app_context():
        try:
            result = db.session.execute(db.text("""
                UPDATE invoices SET status = 'paid' WHERE status = 'PAID';
            """))
            db.session.commit()
            
            rows_updated = result.rowcount
            print(f"Migration 0027_fix_uppercase_paid_status applied successfully")
            print(f"Updated {rows_updated} invoice(s) with uppercase 'PAID' to lowercase 'paid'")
            
            if rows_updated > 0:
                # Verify the fix
                verify = db.session.execute(db.text("""
                    SELECT COUNT(*) FROM invoices WHERE status = 'PAID'
                """)).scalar()
                
                if verify == 0:
                    print("✓ Verification successful: No more uppercase 'PAID' values in database")
                else:
                    print(f"⚠️  Warning: {verify} invoices still have uppercase 'PAID' status")
        
        except Exception as e:
            db.session.rollback()
            print(f"Error applying migration: {str(e)}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

if __name__ == '__main__':
    main()
