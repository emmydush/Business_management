from app import create_app, db
from sqlalchemy import text

app = create_app()
with app.app_context():
    tables = ['products', 'orders', 'customers', 'suppliers']
    for table in tables:
        total = db.session.execute(text(f"SELECT count(*) FROM {table}")).scalar()
        with_branch = db.session.execute(text(f"SELECT count(*) FROM {table} WHERE branch_id IS NOT NULL")).scalar()
        without_branch = db.session.execute(text(f"SELECT count(*) FROM {table} WHERE branch_id IS NULL")).scalar()
        print(f"Table: {table}, Total: {total}, With Branch: {with_branch}, Without Branch: {without_branch}")
