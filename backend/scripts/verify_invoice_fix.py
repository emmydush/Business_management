#!/usr/bin/env python
"""
Simple verification that the invoicestatus enum issue is fixed
"""
from app import create_app, db
from app.models.invoice import Invoice

def main():
    app = create_app()
    with app.app_context():
        try:
            # Try to load a few invoices to verify they deserialize correctly
            print("Loading invoices to verify enum fix...")
            invoices = Invoice.query.limit(10).all()
            
            if not invoices:
                print("✓ No invoices in database (that's fine)")
                return
            
            print(f"✓ Successfully loaded {len(invoices)} invoices")
            
            # Check all status values
            status_values = set()
            for inv in invoices:
                if inv.status:
                    status_values.add(inv.status.value)
            
            print(f"Invoice status values found: {sorted(status_values)}")
            
            # Verify no uppercase 'PAID'
            result = db.session.execute(db.text("""
                SELECT COUNT(*) FROM invoices WHERE status = 'PAID'
            """)).scalar()
            
            if result == 0:
                print("\n✓ SUCCESS: No uppercase 'PAID' values found in database")
                print("✓ Orders data should now load without enum errors")
            else:
                print(f"\n⚠️  WARNING: {result} invoices still have uppercase 'PAID' status")
        
        except Exception as e:
            print(f"✗ Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    main()
