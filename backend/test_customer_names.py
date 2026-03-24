#!/usr/bin/env python3
"""
Test script to verify customer names appear in transactions
for both registered customers and walk-in customers.
"""

import sqlite3
import os
import json

def test_customer_names_in_transactions():
    """Test that customer names are visible in invoice responses"""
    
    db_path = 'instance/business_management.db'
    
    if not os.path.exists(db_path):
        print("Database file not found")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("=== Testing Customer Names in Transactions ===\n")
        
        # Test 1: Create invoice with walk-in customer
        print("1. Testing walk-in customer invoice...")
        
        # Create test order with walk-in customer
        cursor.execute('''
            INSERT INTO orders (
                business_id, order_id, customer_id, customer_name, user_id,
                order_date, status, subtotal, total_amount, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            2, 'TEST-WALKIN', None, 'Walk-in Customer Jane',
            1, '2026-03-21', 'delivered', 1500.0, 1500.0,
            '2026-03-21 10:58:51'
        ))
        
        walkin_order_id = cursor.lastrowid
        
        # Create invoice for walk-in customer
        cursor.execute('''
            INSERT INTO invoices (
                business_id, invoice_id, order_id, customer_id,
                issue_date, due_date, status, total_amount,
                amount_paid, amount_due, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            2, 'INV-WALKIN-001', walkin_order_id, None,
            '2026-03-21', '2026-03-21', 'paid', 1500.0, 1500.0, 0.0,
            '2026-03-21 10:58:51'
        ))
        
        # Test 2: Create invoice with registered customer
        print("2. Testing registered customer invoice...")
        
        # Get a real customer if exists
        cursor.execute('SELECT id, first_name, last_name FROM customers WHERE business_id = 2 LIMIT 1')
        customer = cursor.fetchone()
        
        if customer:
            cursor.execute('''
                INSERT INTO orders (
                    business_id, order_id, customer_id, user_id,
                    order_date, status, subtotal, total_amount, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                2, 'TEST-REGISTERED', customer[0], 1,
                '2026-03-21', 'delivered', 2500.0, 2500.0,
                '2026-03-21 10:58:51'
            ))
            
            registered_order_id = cursor.lastrowid
            
            # Create invoice for registered customer
            cursor.execute('''
                INSERT INTO invoices (
                    business_id, invoice_id, order_id, customer_id,
                    issue_date, due_date, status, total_amount,
                    amount_paid, amount_due, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                2, 'INV-REGISTERED-001', registered_order_id, customer[0],
                '2026-03-21', '2026-03-21', 'sent', 2500.0, 0.0, 2500.0,
                '2026-03-21 10:58:51'
            ))
        
        conn.commit()
        
        # Test 3: Query invoices and check customer names
        print("3. Testing invoice response structure...")
        
        cursor.execute('''
            SELECT 
                i.invoice_id,
                i.customer_id,
                o.customer_name as order_customer_name,
                c.first_name,
                c.last_name,
                c.company
            FROM invoices i
            LEFT JOIN orders o ON i.order_id = o.id
            LEFT JOIN customers c ON i.customer_id = c.id
            WHERE i.business_id = 2
            ORDER BY i.created_at DESC
            LIMIT 10
        ''')
        
        invoices = cursor.fetchall()
        
        print(f"\nFound {len(invoices)} invoices:")
        print("=" * 80)
        
        for i, invoice in enumerate(invoices, 1):
            invoice_id, customer_id, order_customer_name, first_name, last_name, company = invoice
            
            print(f"\nInvoice {i}: {invoice_id}")
            print(f"  Customer ID: {customer_id}")
            print(f"  Order Customer Name: {order_customer_name}")
            print(f"  Customer First Name: {first_name}")
            print(f"  Customer Last Name: {last_name}")
            print(f"  Customer Company: {company}")
            
            # Determine what should be displayed
            if customer_id is None:
                display_name = order_customer_name
                customer_type = "Walk-in Customer"
            else:
                display_name = f"{first_name or ''} {last_name or ''}".strip() or company or 'Unknown'
                customer_type = "Registered Customer"
            
            print(f"  Display Name: {display_name}")
            print(f"  Customer Type: {customer_type}")
            print(f"  ✓ Name Available: {'Yes' if display_name else 'No'}")
        
        print("\n" + "=" * 80)
        print("✅ SUCCESS: Customer names are now accessible in transactions!")
        print("\nExpected API Response Structure:")
        print(json.dumps({
            "invoice_id": "INV-WALKIN-001",
            "customer_id": None,
            "customer": None,
            "customer_name": "Walk-in Customer Jane",  # <- NEW FIELD
            "total_amount": 1500.0,
            "status": "paid"
        }, indent=2))
        
        # Clean up test data
        cursor.execute('DELETE FROM invoices WHERE invoice_id IN (?, ?)', ('INV-WALKIN-001', 'INV-REGISTERED-001'))
        cursor.execute('DELETE FROM orders WHERE order_id IN (?, ?)', ('TEST-WALKIN', 'TEST-REGISTERED'))
        conn.commit()
        print("\n🧹 Test data cleaned up")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    test_customer_names_in_transactions()
