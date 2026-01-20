import os
import urllib.parse
from sqlalchemy import text, create_engine
from dotenv import load_dotenv

load_dotenv()

def update_db():
    # Handle password with @ in it
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        password = urllib.parse.quote_plus("Jesuslove@12")
        db_url = f"postgresql://postgres:{password}@localhost:5432/all_inone"
    
    print(f"Connecting to {db_url.split('@')[1]}...")
    engine = create_engine(db_url)
    
    tables_to_update = [
        ('products', 'branch_id'),
        ('orders', 'branch_id'),
        ('employees', 'branch_id'),
        ('expenses', 'branch_id'),
        ('purchase_orders', 'branch_id'),
        ('tasks', 'branch_id'),
        ('inventory_transactions', 'branch_id'),
        ('warehouses', 'branch_id'),
        ('leads', 'branch_id'),
        ('assets', 'branch_id'),
        ('invoices', 'branch_id'),
        ('returns', 'branch_id'),
        ('audit_logs', 'branch_id'),
        ('notifications', 'branch_id'),
        ('messages', 'branch_id'),
        ('announcements', 'branch_id'),
        ('customers', 'branch_id'),
        ('suppliers', 'branch_id'),
        ('attendance', 'branch_id'),
        ('leave_requests', 'branch_id'),
        ('payrolls', 'branch_id')
    ]
    
    with engine.connect() as conn:
        # Special case for branches status column
        try:
            check_status = text("SELECT count(*) FROM information_schema.columns WHERE table_name='branches' AND column_name='status';")
            if conn.execute(check_status).scalar() == 0:
                print("Adding status to branches...")
                conn.execute(text("ALTER TABLE branches ADD COLUMN status VARCHAR(20) DEFAULT 'approved' NOT NULL;"))
                conn.commit()
                print("Successfully added status to branches.")
            else:
                print("Status column already exists in branches.")
        except Exception as e:
            print(f"Error adding status to branches: {e}")

        for table, column in tables_to_update:
            try:
                # Check if column exists
                check_query = text(f"""
                    SELECT count(*) 
                    FROM information_schema.columns 
                    WHERE table_name='{table}' AND column_name='{column}';
                """)
                result = conn.execute(check_query).scalar()
                
                if result == 0:
                    print(f"Adding {column} to {table}...")
                    alter_query = text(f"ALTER TABLE {table} ADD COLUMN {column} INTEGER REFERENCES branches(id);")
                    conn.execute(alter_query)
                    conn.commit()
                    print(f"Successfully added {column} to {table}.")
                else:
                    print(f"Column {column} already exists in {table}.")
            except Exception as e:
                print(f"Error updating {table}: {e}")

if __name__ == "__main__":
    update_db()
