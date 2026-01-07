from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    # Query to find constraints on the customers table
    sql = text("""
        SELECT conname, pg_get_constraintdef(oid)
        FROM pg_constraint
        WHERE conrelid = 'customers'::regclass;
    """)
    
    try:
        result = db.session.execute(sql)
        print("Constraints on 'customers' table:")
        for row in result:
            print(f"- {row[0]}: {row[1]}")
    except Exception as e:
        print(f"Error: {e}")
