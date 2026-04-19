#!/usr/bin/env python3
"""
Script to update admin user permissions to match the new settings
"""

import sys
import os

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app, db
from app.models.user import User, UserRole
from app.models.settings import UserPermission, ROLE_DEFAULT_PERMISSIONS, PermissionType

def update_admin_permissions():
    """Update all admin users to have full permissions according to ROLE_DEFAULT_PERMISSIONS"""
    app = create_app()
    
    with app.app_context():
        print("Updating admin user permissions...")
        
        # Get all admin users
        admin_users = User.query.filter_by(role=UserRole.admin).all()
        
        if not admin_users:
            print("No admin users found.")
            return
        
        print(f"Found {len(admin_users)} admin users")
        
        for admin_user in admin_users:
            print(f"\nUpdating permissions for admin: {admin_user.username} ({admin_user.email})")
            
            # Remove existing permissions
            UserPermission.query.filter_by(user_id=admin_user.id).delete()
            
            # Add new permissions based on ROLE_DEFAULT_PERMISSIONS
            admin_permissions = ROLE_DEFAULT_PERMISSIONS['admin']
            
            for module, permissions in admin_permissions.items():
                if permissions:  # Only add if there are permissions
                    permission = UserPermission(
                        business_id=admin_user.business_id,
                        user_id=admin_user.id,
                        module=module,
                        permissions=permissions,
                        granted=True,
                        granted_by=admin_user.id  # Self-granted
                    )
                    db.session.add(permission)
                    print(f"  + {module}: {permissions}")
        
        # Commit changes
        try:
            db.session.commit()
            print("\nSuccessfully updated admin permissions!")
        except Exception as e:
            print(f"\nError updating permissions: {e}")
            db.session.rollback()
            return False
        
        return True

if __name__ == "__main__":
    success = update_admin_permissions()
    if success:
        print("Admin permissions updated successfully!")
        print("Please restart the backend server for changes to take effect.")
    else:
        print("Failed to update admin permissions.")
        sys.exit(1)
