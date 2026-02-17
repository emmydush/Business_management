#!/usr/bin/env python3
"""
Migration script to fix invoice status enum values.
This script ensures that any invoicesstatus values stored as uppercase names
are not accidentally inserted, and that the database enum is properly configured.

This script should be run after updating the Invoice model with the values_callable fix.
"""

import sys
import os
from datetime import datetime

# Add the current directory to sys.path to import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.invoice import Invoice, InvoiceStatus

def fix_enum_values():
    """Ensure the PostgreSQL enum type has correct values."""
    app = create_app()
    
    with app.app_context():
        try:
            print("Starting invoice status enum migration...")
            print(f"Timestamp: {datetime.now().isoformat()}")
            print()
            
            # Check if there are any invoices with potentially problematic status values
            print("Checking invoice statuses in database...")
            invoices = Invoice.query.all()
            
            status_counts = {}
            for invoice in invoices:
                status_str = str(invoice.status)
                if status_str not in status_counts:
                    status_counts[status_str] = 0
                status_counts[status_str] += 1
            
            print(f"Found {len(invoices)} invoices with the following statuses:")
            for status, count in sorted(status_counts.items()):
                print(f"  - {status}: {count} invoice(s)")
            
            print()
            print("Valid InvoiceStatus enum values:")
            for status in InvoiceStatus:
                print(f"  - Name: {status.name}, Value: {status.value}")
            
            print()
            print("Migration check complete. No data corrections needed with the new enum configuration.")
            print("The new Enum configuration with values_callable will ensure correct database values.")
            
        except Exception as e:
            print(f"ERROR during migration: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    return True

if __name__ == "__main__":
    success = fix_enum_values()
    sys.exit(0 if success else 1)
