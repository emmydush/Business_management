"""
Apply all database migrations in order
"""

import os
import sys
from sqlalchemy import text

# Add the parent directory to the path so we can import app
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import create_app, db

def apply_all_migrations():
    app = create_app()
    
    with app.app_context():
        print("🚀 Starting database migrations...\n")
        
        # List of migrations in order
        migrations = [
            '0001_tenant_username_email_unique.sql',
            '0002_add_product_image.sql',
            '0003_add_approval_columns.sql',
            '0004_add_profile_picture.sql',
            '0005_add_documents_table.sql',
            '0006_add_document_tracking_columns.sql',
            '0007_add_assets_table.sql',
            '0008_add_reset_token_columns.sql',
            '0009_add_completed_order_status.sql',
            '0010_add_departments_table.sql',
            '0011_update_employees_table.sql',
            '001_create_payments_table.sql',
        ]
        
        successful = []
        failed = []
        
        for migration_file in migrations:
            try:
                migration_path = os.path.join(os.path.dirname(__file__), '..', 'db_migrations', migration_file)
                
                if not os.path.exists(migration_path):
                    print(f"⚠️  Skipping {migration_file} - file not found")
                    continue
                
                print(f"📋 Applying {migration_file}...")
                
                with open(migration_path, 'r') as f:
                    sql_content = f.read()
                
                # Split by semicolon and filter out comments and empty lines
                commands = []
                for line in sql_content.split(';'):
                    line = line.strip()
                    # Skip comments and empty lines
                    if line and not line.startswith('--') and not line.startswith('/*'):
                        commands.append(line)
                
                for command in commands:
                    if command:
                        db.session.execute(text(command))
                
                db.session.commit()
                print(f"✅ {migration_file} applied successfully!\n")
                successful.append(migration_file)
                
            except Exception as e:
                db.session.rollback()
                error_msg = str(e)
                
                # Check if table already exists - this is not an error
                if 'already exists' in error_msg or 'already' in error_msg.lower():
                    print(f"⚠️  {migration_file} - already applied (table exists)\n")
                    successful.append(migration_file)
                else:
                    print(f"❌ Error applying {migration_file}: {error_msg}\n")
                    failed.append((migration_file, error_msg))
        
        print("\n" + "="*60)
        print("📊 MIGRATION SUMMARY")
        print("="*60)
        print(f"✅ Successful: {len(successful)}")
        for mig in successful:
            print(f"   - {mig}")
        
        if failed:
            print(f"\n❌ Failed: {len(failed)}")
            for mig, error in failed:
                print(f"   - {mig}")
                print(f"     Error: {error[:100]}")
        else:
            print(f"\n✅ All migrations completed successfully!")
        
        print("="*60)

if __name__ == "__main__":
    apply_all_migrations()
