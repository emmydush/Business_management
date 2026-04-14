import sqlite3
from datetime import datetime

# Connect to database
conn = sqlite3.connect('business_management.db')
cursor = conn.cursor()

# Check if returns table exists
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='returns'")
tables = cursor.fetchall()
print('Returns table exists:', len(tables) > 0)

if tables:
    # Count returns
    cursor.execute('SELECT COUNT(*) FROM returns')
    count = cursor.fetchone()[0]
    print(f'Total returns in database: {count}')
    
    if count > 0:
        # Get sample returns
        cursor.execute('SELECT id, return_id, customer, status, total_amount, created_at FROM returns LIMIT 5')
        returns = cursor.fetchall()
        print('Sample returns:')
        for ret in returns:
            print(f'  ID: {ret[0]}, Return ID: {ret[1]}, Customer: {ret[2]}, Status: {ret[3]}, Amount: {ret[4]}, Created: {ret[5]}')
    else:
        print('No returns found in database')
        # Create sample returns
        sample_returns = [
            ('RET-001', 'John Doe', 'pending', 150.00, datetime.now()),
            ('RET-002', 'Jane Smith', 'approved', 75.50, datetime.now()),
            ('RET-003', 'Bob Johnson', 'rejected', 200.00, datetime.now()),
            ('RET-004', 'Alice Brown', 'processed', 125.75, datetime.now()),
            ('RET-005', 'Charlie Wilson', 'processing', 300.00, datetime.now())
        ]
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS returns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                return_id TEXT UNIQUE,
                customer TEXT,
                status TEXT,
                total_amount DECIMAL(10,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        for ret_data in sample_returns:
            try:
                cursor.execute('''
                    INSERT INTO returns (return_id, customer, status, total_amount, created_at)
                    VALUES (?, ?, ?, ?, ?)
                ''', ret_data)
                print(f"Added return: {ret_data[0]} - {ret_data[1]} - {ret_data[2]}")
            except sqlite3.IntegrityError as e:
                print(f"Error adding {ret_data[0]}: {e}")
        
        conn.commit()
        print('Sample returns added successfully!')
else:
    print('Returns table does not exist')

conn.close()
