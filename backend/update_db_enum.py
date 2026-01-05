from app import create_app, db
from sqlalchemy import text

app = create_app()
with app.app_context():
    try:
        # Try to add the value to the enum type
        db.session.execute(text("ALTER TYPE userrole ADD VALUE 'superadmin'"))
        db.session.commit()
        print("Enum 'userrole' updated with 'superadmin'.")
    except Exception as e:
        db.session.rollback()
        print(f"Error updating enum: {e}")
