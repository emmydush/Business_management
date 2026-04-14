import sqlite3

conn = sqlite3.connect('business_management.db')
cursor = conn.cursor()

# Check if products table exists
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='products'")
tables = cursor.fetchall()
print('Products table exists:', len(tables) > 0)

if tables:
    # Count products
    cursor.execute('SELECT COUNT(*) FROM products')
    count = cursor.fetchone()[0]
    print(f'Total products in database: {count}')
    
    if count > 0:
        # Get sample products
        cursor.execute('SELECT id, name, barcode, created_at FROM products LIMIT 5')
        products = cursor.fetchall()
        print('Sample products:')
        for product in products:
            print(f'  ID: {product[0]}, Name: {product[1]}, Barcode: {product[2]}, Created: {product[3]}')
    else:
        print('No products found in database')
        
        # Check if there are any other product-related tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%product%'")
        all_product_tables = cursor.fetchall()
        print('All product-related tables:', all_product_tables)
        
        # Check inventory table
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='inventory'")
        inventory_tables = cursor.fetchall()
        if inventory_tables:
            cursor.execute('SELECT COUNT(*) FROM inventory')
            inventory_count = cursor.fetchone()[0]
            print(f'Inventory count: {inventory_count}')

conn.close()
