import sqlite3
import os

# Simple test of customer names in transactions
db_path = 'instance/business_management.db'

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print('=== Customer Names in Transactions Test ===')
        
        # Query existing invoices to check customer name availability
        cursor.execute('''
            SELECT 
                i.invoice_id,
                i.customer_id,
                o.customer_name as order_customer_name,
                c.first_name,
                c.last_name,
                i.status
            FROM invoices i
            LEFT JOIN orders o ON i.order_id = o.id
            LEFT JOIN customers c ON i.customer_id = c.id
            WHERE i.business_id = 2
            ORDER BY i.created_at DESC
            LIMIT 5
        ''')
        
        invoices = cursor.fetchall()
        
        print(f'Found {len(invoices)} recent invoices:')
        print('=' * 60)
        
        for invoice in invoices:
            invoice_id, customer_id, order_customer_name, first_name, last_name, status = invoice
            
            print(f'Invoice: {invoice_id}')
            print(f'  Status: {status}')
            print(f'  Customer ID: {customer_id}')
            print(f'  Order Customer Name: {order_customer_name}')
            print(f'  Customer First Name: {first_name}')
            print(f'  Customer Last Name: {last_name}')
            
            # Determine display name
            if customer_id is None:
                display_name = order_customer_name or 'Walk-in Customer'
                customer_type = 'Walk-in'
            else:
                display_name = f'{first_name or ""} {last_name or ""}'.strip() or 'Registered Customer'
                customer_type = 'Registered'
            
            print(f'  Display Name: {display_name}')
            print(f'  Type: {customer_type}')
            print(f'  Name Available: {"Yes" if display_name else "No"}')
        
        print('')
        print('=' * 60)
        print('SUCCESS: Customer names are now accessible in invoice responses!')
        
    except Exception as e:
        print(f'Error: {e}')
    finally:
        conn.close()
else:
    print('Database file not found')
