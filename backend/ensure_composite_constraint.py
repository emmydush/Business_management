from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    sql = text("""
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'customers'::regclass;
    """)
    
    try:
        result = db.session.execute(sql)
        constraint_names = [row[0] for row in result]
        print(f"Current constraints: {constraint_names}")
        
        if '_business_customer_uc' not in constraint_names:
            print("Composite constraint '_business_customer_uc' missing. Adding it...")
            # We need to make sure there are no duplicates before adding it
            # But for now let's just try to add it. If it fails, it means there are duplicates.
            add_sql = text("ALTER TABLE customers ADD CONSTRAINT _business_customer_uc UNIQUE (business_id, customer_id);")
            db.session.execute(add_sql)
            db.session.commit()
            print("Successfully added '_business_customer_uc'.")
        else:
            print("Composite constraint '_business_customer_uc' already exists.")

    except Exception as e:
        print(f"Error: {e}")
