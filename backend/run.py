import os
import sys
import time
from sqlalchemy import text, create_engine

from app import create_app, db

def initialize_database(app):
    """Initialize database tables and default user on startup."""
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("WARNING: DATABASE_URL not set. Skipping database initialization.")
        return False

    # Test database connection with retries
    max_attempts = 30
    for attempt in range(max_attempts):
        try:
            engine = create_engine(db_url)
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            print("OK: Database connection established")
            engine.dispose()
            break
        except Exception as e:
            if attempt < max_attempts - 1:
                print(f"Waiting for database... (attempt {attempt + 1}/{max_attempts})")
                time.sleep(2)
            else:
                print(f"ERROR: Database connection failed after {max_attempts} attempts")
                print(f"Error: {str(e)[:150]}")
                return False

    # Create app and initialize database
    with app.app_context():
        try:
            print("Creating database tables...")
            db.create_all()
            print("OK: Database tables synchronized")

            # Import models after app context
            from app.models.user import User, UserRole, UserApprovalStatus

            # Create default superadmin if it doesn't exist
            superadmin = User.query.filter_by(username='superadmin').first()
            if not superadmin:
                print("Creating default superadmin user...")
                superadmin = User(
                    username='superadmin',
                    email='superadmin@business.com',
                    first_name='Super',
                    last_name='Admin',
                    role=UserRole.superadmin,
                    approval_status=UserApprovalStatus.APPROVED,
                    is_active=True
                )
                superadmin.set_password('admin123')
                db.session.add(superadmin)
                db.session.commit()
                print("OK: Default superadmin created (username: superadmin, password: admin123)")

            return True
        except Exception as e:
            try:
                db.session.rollback()
            except:
                pass
            print(f"ERROR: Error during database initialization: {e}")
            import traceback
            traceback.print_exc()
            return False

app = create_app()

if __name__ == '__main__':
    print("\n" + "="*60)
    print("Starting Business Management Backend")
    print("="*60)
    print("Initializing database...")
    initialize_database(app)
    print("="*60)
    print("Backend server running on http://0.0.0.0:5000\n")
    app.run(debug=True, host='0.0.0.0', port=5000)
