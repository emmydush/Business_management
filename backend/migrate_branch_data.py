from app import create_app, db
from sqlalchemy import text

app = create_app()
with app.app_context():
    # Identify the target branch ID. Usually the first one created.
    # Based on check_branches.py, ID 1 is a "Main Branch".
    target_branch_id = 1
    
    tables = [
        'products', 'orders', 'employees', 'expenses', 'purchase_orders',
        'tasks', 'inventory_transactions', 'warehouses', 'leads', 'assets',
        'invoices', 'returns', 'audit_logs', 'notifications', 'messages',
        'announcements', 'customers', 'suppliers', 'attendance', 'leave_requests',
        'payrolls'
    ]
    
    print(f"Migrating NULL branch_id values to branch ID {target_branch_id}...")
    
    for table in tables:
        try:
            # Check if table exists and has branch_id column
            check_query = text(f"""
                SELECT count(*) 
                FROM information_schema.columns 
                WHERE table_name='{table}' AND column_name='branch_id';
            """)
            col_exists = db.session.execute(check_query).scalar()
            
            if col_exists:
                update_query = text(f"UPDATE {table} SET branch_id = :branch_id WHERE branch_id IS NULL")
                result = db.session.execute(update_query, {"branch_id": target_branch_id})
                db.session.commit()
                print(f"Updated {result.rowcount} rows in {table}.")
            else:
                print(f"Table {table} does not have branch_id column or does not exist.")
        except Exception as e:
            print(f"Error updating {table}: {e}")
            db.session.rollback()

    print("Migration complete.")
