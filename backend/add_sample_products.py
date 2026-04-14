import sqlite3
from datetime import datetime

# Connect to database
conn = sqlite3.connect('business_management.db')
cursor = conn.cursor()

# First, let's check what tables exist and create products table if needed
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [table[0] for table in cursor.fetchall()]
print('Available tables:', tables)

# Create products table if it doesn't exist
if 'products' not in tables:
    print('Creating products table...')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            barcode TEXT UNIQUE,
            sku TEXT UNIQUE,
            category_id INTEGER,
            business_id INTEGER,
            price DECIMAL(10,2),
            cost_price DECIMAL(10,2),
            stock_quantity INTEGER DEFAULT 0,
            min_stock_level INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT 1,
            image TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    print('Products table created')

# Add some sample products
sample_products = [
    {
        'name': 'Laptop Computer',
        'description': 'High-performance laptop for business use',
        'barcode': '1234567890123',
        'sku': 'LAP-001',
        'price': 999.99,
        'cost_price': 750.00,
        'stock_quantity': 50,
        'min_stock_level': 10,
        'business_id': 1
    },
    {
        'name': 'Wireless Mouse',
        'description': 'Ergonomic wireless mouse',
        'barcode': '1234567890124',
        'sku': 'MOU-001',
        'price': 29.99,
        'cost_price': 15.00,
        'stock_quantity': 100,
        'min_stock_level': 20,
        'business_id': 1
    },
    {
        'name': 'USB Keyboard',
        'description': 'Mechanical USB keyboard',
        'barcode': '1234567890125',
        'sku': 'KEY-001',
        'price': 79.99,
        'cost_price': 45.00,
        'stock_quantity': 75,
        'min_stock_level': 15,
        'business_id': 1
    },
    {
        'name': 'Monitor 24"',
        'description': '24-inch LED monitor',
        'barcode': '1234567890126',
        'sku': 'MON-001',
        'price': 199.99,
        'cost_price': 120.00,
        'stock_quantity': 30,
        'min_stock_level': 5,
        'business_id': 1
    },
    {
        'name': 'Webcam HD',
        'description': 'High definition webcam',
        'barcode': '1234567890127',
        'sku': 'CAM-001',
        'price': 49.99,
        'cost_price': 25.00,
        'stock_quantity': 60,
        'min_stock_level': 10,
        'business_id': 1
    }
]

# Insert sample products
for product in sample_products:
    try:
        cursor.execute('''
            INSERT INTO products (name, description, barcode, sku, price, cost_price, 
                                 stock_quantity, min_stock_level, business_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            product['name'],
            product['description'],
            product['barcode'],
            product['sku'],
            product['price'],
            product['cost_price'],
            product['stock_quantity'],
            product['min_stock_level'],
            product['business_id'],
            datetime.now(),
            datetime.now()
        ))
        print(f"Added product: {product['name']}")
    except sqlite3.IntegrityError as e:
        print(f"Error adding {product['name']}: {e}")

# Commit changes
conn.commit()

# Verify products were added
cursor.execute('SELECT COUNT(*) FROM products')
count = cursor.fetchone()[0]
print(f'\nTotal products in database: {count}')

if count > 0:
    cursor.execute('SELECT id, name, barcode, stock_quantity FROM products LIMIT 5')
    products = cursor.fetchall()
    print('Sample products:')
    for product in products:
        print(f'  ID: {product[0]}, Name: {product[1]}, Barcode: {product[2]}, Stock: {product[3]}')

conn.close()
print('\nSample products added successfully!')
