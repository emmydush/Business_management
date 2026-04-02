import os
import sys
import time
from sqlalchemy import text, create_engine

from app import create_app, db

def initialize_database(app):
    """Initialize database tables and default user on startup."""
    db_url = app.config.get('SQLALCHEMY_DATABASE_URI')
    if not db_url:
        print("WARNING: Database URL not configured. Skipping database initialization.")
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
            print("Checking database tables...")
            # Import models first
            from app.models.user import User, UserRole, UserApprovalStatus
            
            # Check if tables exist, only create if needed
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            existing_tables = inspector.get_table_names()
            
            print(f"Current database has {len(existing_tables)} tables.")
            print("Creating any missing database tables...")
            db.create_all()
            print("OK: Database tables verified/created")

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
            else:
                print("OK: Superadmin user already exists")

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
    
    # Use environment variable for port, default to 5000
    port = int(os.environ.get('PORT', 5000))
    print(f"Backend server running on http://0.0.0.0:{port}\n")
    app.run(debug=True, host='0.0.0.0', port=port)
