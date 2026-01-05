"""
Script to update the user approval status enum in the database to match the new format.
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
        
        # Check if the enum type exists
        cur.execute("""
            SELECT t.typname 
            FROM pg_type t 
            JOIN pg_namespace n ON t.typnamespace = n.oid 
            WHERE t.typname = 'userapprovalstatus'
        """)
        
        enum_exists = cur.fetchone()
        
        if enum_exists:
            print("User approval status enum already exists. Checking values...")
            
            # Get current enum values
            cur.execute("""
                SELECT enumlabel 
                FROM pg_enum 
                JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
                WHERE pg_type.typname = 'userapprovalstatus'
            """)
            
            current_values = [row[0] for row in cur.fetchall()]
            print(f"Current enum values: {current_values}")
            
            # Add missing enum values if needed
            needed_values = ['PENDING', 'APPROVED', 'REJECTED']
            missing_values = [v for v in needed_values if v not in current_values]
            
            if missing_values:
                print(f"Adding missing enum values: {missing_values}")
                for value in missing_values:
                    try:
                        # Create a new enum type with the additional value
                        cur.execute(f"ALTER TYPE userapprovalstatus ADD VALUE IF NOT EXISTS '{value}'")
                        print(f"Added '{value}' to enum type")
                    except psycopg2.errors.DuplicateObject:
                        print(f"'{value}' already exists in enum type")
                        conn.rollback()  # Rollback the error, but continue
                        continue
                    except Exception as e:
                        print(f"Error adding '{value}': {e}")
                        conn.rollback()  # Rollback and continue
                        continue
            else:
                print("All required enum values already exist.")
        else:
            print("Creating user approval status enum type...")
            # Create the enum type from scratch
            cur.execute("""
                CREATE TYPE userapprovalstatus AS ENUM ('PENDING', 'APPROVED', 'REJECTED')
            """)
            print("User approval status enum type created.")
        
        # Update the column to use the correct enum type if it's not already
        # First, we need to make sure the column uses the correct type
        # Since we already have values in the column, we'll need to update the column type carefully
        
        # Check the current column type
        cur.execute("""
            SELECT data_type, udt_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'approval_status'
        """)
        
        col_info = cur.fetchone()
        print(f"Current column type: {col_info}")
        
        # Commit changes
        conn.commit()
        
        # Close connections
        cur.close()
        conn.close()
        
        print("Enum update completed!")
        
    except Exception as e:
        print(f"Error: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
else:
    print("Database URL format not supported")