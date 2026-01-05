from app import create_app, db
from sqlalchemy import text
import traceback

try:
    app = create_app()

    with app.app_context():
        # Create tables if they don't exist
        db.create_all()
        print("Tables created successfully.")
        
        # Verify tables exist
        with db.engine.connect() as connection:
            result = connection.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            tables = [row[0] for row in result]
            print("Tables in database:", tables)
            
            if 'leads' in tables and 'tasks' in tables:
                print("Leads and Tasks tables verified.")
            else:
                print("Error: Leads or Tasks tables missing.")
except Exception as e:
    traceback.print_exc()
