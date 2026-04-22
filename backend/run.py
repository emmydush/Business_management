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

            # Apply slug migration if needed
            print("Checking for slug column in businesses table...")
            try:
                inspector = inspect(db.engine)
                businesses_columns = [col['name'] for col in inspector.get_columns('businesses')]
                
                if 'slug' not in businesses_columns:
                    print("Adding slug column to businesses table...")
                    db.session.execute(text("ALTER TABLE businesses ADD COLUMN IF NOT EXISTS slug VARCHAR(100)"))
                    db.session.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug)"))
                    db.session.execute(text("""
                        UPDATE businesses 
                        SET slug = LOWER(REPLACE(name, ' ', '-')) 
                        WHERE slug IS NULL
                    """))
                    
                    # Handle duplicate slugs
                    result = db.session.execute(text("""
                        SELECT id, name, slug 
                        FROM businesses 
                        WHERE slug IN (
                            SELECT slug 
                            FROM businesses 
                            GROUP BY slug 
                            HAVING COUNT(*) > 1
                        )
                        ORDER BY id
                    """))
                    
                    duplicates = result.fetchall()
                    for i, (business_id, name, slug) in enumerate(duplicates):
                        if i > 0:  # Skip first occurrence
                            new_slug = f"{slug}-{business_id}"
                            db.session.execute(text(
                                "UPDATE businesses SET slug = :new_slug WHERE id = :business_id"
                            ), {"new_slug": new_slug, "business_id": business_id})
                    
                    db.session.commit()
                    print("OK: Slug migration applied")
                else:
                    print("OK: Slug column already exists")
            except Exception as e:
                print(f"WARNING: Could not apply slug migration: {e}")
                db.session.rollback()

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
    
    # Use environment variable for port, default to 10000 (Render standard)
    port = int(os.environ.get('PORT', 10000))
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"Backend server binding to 0.0.0.0:{port}")
    app.run(debug=debug_mode, host='0.0.0.0', port=port)
