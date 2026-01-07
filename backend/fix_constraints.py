from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    sql = text("""
        SELECT conname, pg_get_constraintdef(oid)
        FROM pg_constraint
        WHERE conrelid = 'customers'::regclass;
    """)
    
    try:
        result = db.session.execute(sql)
        constraints = list(result)
        print(f"Found {len(constraints)} constraints:")
        for row in constraints:
            print(f"NAME: {row[0]} | DEF: {row[1]}")
            
        # Check for the problematic constraint
        bad_constraint = next((row for row in constraints if row[0] == 'customers_customer_id_key'), None)
        if bad_constraint:
            print("\nFound problematic constraint 'customers_customer_id_key'. Dropping it...")
            drop_sql = text("ALTER TABLE customers DROP CONSTRAINT customers_customer_id_key;")
            db.session.execute(drop_sql)
            db.session.commit()
            print("Successfully dropped 'customers_customer_id_key'.")
        else:
            print("\nConstraint 'customers_customer_id_key' not found.")

    except Exception as e:
        print(f"Error: {e}")
