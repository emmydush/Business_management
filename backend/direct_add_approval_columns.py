"""
Direct script to add approval columns to users table without using Flask app context.
This avoids the enum loading issue when the database has old values.
"""
import psycopg2
import urllib.parse
import os

# Get database URL from environment or use default
database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:Jesuslove%4012@localhost:5432/all_inone')

# Parse the database URL
if database_url.startswith('postgresql://'):
    # Remove the postgresql:// prefix
    connection_part = database_url[13:]
    # Split into credentials and host/database
    if '@' in connection_part:
        creds, host_db = connection_part.rsplit('@', 1)
        user_pass = creds.split(':')
        username = user_pass[0]
        password = ':'.join(user_pass[1:]) if len(user_pass) > 1 else ''
        
        if '/' in host_db:
            host_port, database = host_db.rsplit('/', 1)
            if ':' in host_port:
                host, port = host_port.split(':', 1)
            else:
                host = host_port
                port = '5432'
        else:
            host = host_db
            port = '5432'
            database = 'all_inone'
    else:
        print("Invalid database URL format")
        exit(1)

    # URL decode the password if needed
    password = urllib.parse.unquote(password)
    
    try:
        # Connect to the database
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=username,
            password=password
        )
        
        cur = conn.cursor()
        
        # Check if the approval_status column exists
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='approval_status'
        """)
        
        column_exists = cur.fetchone()
        
        if not column_exists:
            print("Adding approval_status column...")
            cur.execute("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'PENDING' NOT NULL
            """)
            print("approval_status column added successfully.")
        else:
            print("approval_status column already exists.")
        
        # Check if the approved_by column exists
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='approved_by'
        """)
        
        column_exists = cur.fetchone()
        
        if not column_exists:
            print("Adding approved_by column...")
            cur.execute("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id)
            """)
            print("approved_by column added successfully.")
        else:
            print("approved_by column already exists.")
            
        # Check if the approved_at column exists
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='approved_at'
        """)
        
        column_exists = cur.fetchone()
        
        if not column_exists:
            print("Adding approved_at column...")
            cur.execute("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS approved_at DATE
            """)
            print("approved_at column added successfully.")
        else:
            print("approved_at column already exists.")
        
        # Update any existing users with 'approved' status to 'APPROVED'
        print("Updating existing users with old approval status values...")
        cur.execute("""
            UPDATE users 
            SET approval_status = 'APPROVED' 
            WHERE approval_status = 'approved'
        """)
        
        cur.execute("""
            UPDATE users 
            SET approval_status = 'PENDING' 
            WHERE approval_status = 'pending'
        """)
        
        cur.execute("""
            UPDATE users 
            SET approval_status = 'REJECTED' 
            WHERE approval_status = 'rejected'
        """)
        
        print("Updated approval status values successfully.")
        
        # Commit changes
        conn.commit()
        
        # Close connections
        cur.close()
        conn.close()
        
        print("All approval columns added successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
else:
    print("Database URL format not supported")