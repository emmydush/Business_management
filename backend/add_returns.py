import sqlite3
from datetime import datetime

conn = sqlite3.connect('business_management.db')
cursor = conn.cursor()

# Create returns table
cursor.execute('''
    CREATE TABLE IF NOT EXISTS returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        return_id TEXT UNIQUE,
        customer TEXT,
        status TEXT,
        total_amount DECIMAL(10,2),
        invoice_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
''')

# Add sample returns
sample_returns = [
    ('RET-001', 'John Doe', 'pending', 150.00, 'INV-001', datetime.now()),
    ('RET-002', 'Jane Smith', 'approved', 75.50, 'INV-002', datetime.now()),
    ('RET-003', 'Bob Johnson', 'rejected', 200.00, 'INV-003', datetime.now()),
    ('RET-004', 'Alice Brown', 'processed', 125.75, 'INV-004', datetime.now()),
    ('RET-005', 'Charlie Wilson', 'processing', 300.00, 'INV-005', datetime.now())
]

for ret_data in sample_returns:
    try:
        cursor.execute('''
            INSERT INTO returns (return_id, customer, status, total_amount, invoice_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', ret_data)
        print(f'Added return: {ret_data[0]} - {ret_data[1]} - {ret_data[2]}')
    except sqlite3.IntegrityError as e:
        print(f'Error adding {ret_data[0]}: {e}')

conn.commit()
cursor.execute('SELECT COUNT(*) FROM returns')
count = cursor.fetchone()[0]
print(f'Total returns in database: {count}')
conn.close()
print('Sample returns added successfully!')
