#!/usr/bin/env python
"""
Script to check and fix invalid invoice status values in the database
"""
from app import create_app, db
from app.models.invoice import Invoice, InvoiceStatus
import sys

def main():
    app = create_app()
    with app.app_context():
        print("Checking for invalid invoice status values...")
        
        # Get all invoices and check their status
        try:
            from sqlalchemy import text
            
            # Query to get all distinct status values in the invoices table
            result = db.session.execute(text("""
                SELECT DISTINCT status FROM invoices WHERE status IS NOT NULL;
            """))
            
            status_values = result.fetchall()
            print(f"\nFound {len(status_values)} distinct status values in invoices table:")
            for row in status_values:
                status = row[0] if isinstance(row, tuple) else row
                print(f"  - {repr(status)}")
            
            # Get valid enum values
            valid_values = [e.value for e in InvoiceStatus]
            print(f"\nValid enum values: {valid_values}")
            
            # Check for invalid values
            invalid_found = False
            for row in status_values:
                status = row[0] if isinstance(row, tuple) else row
                if status not in valid_values:
                    print(f"\n⚠️  Invalid status found: {repr(status)}")
                    invalid_found = True
                    
                    # Find invoices with this status
                    count = db.session.execute(text(f"""
                        SELECT COUNT(*) FROM invoices WHERE status = :status
                    """), {"status": status}).scalar()
                    print(f"    {count} invoice(s) with this status")
            
            if not invalid_found:
                print("\n✓ All invoice status values are valid!")
            
            # Try to load an invoice to see if there's a deserialization error
            print("\nAttempting to load invoices...")
            try:
                invoices = Invoice.query.limit(5).all()
                print(f"✓ Successfully loaded {len(invoices)} invoices")
                for inv in invoices:
                    print(f"  Invoice {inv.invoice_id}: status = {inv.status.value if inv.status else 'None'}")
            except Exception as e:
                print(f"✗ Error loading invoices: {e}")
                print(f"  Details: {type(e).__name__}: {str(e)}")
        
        except Exception as e:
            print(f"Error during check: {e}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    main()
