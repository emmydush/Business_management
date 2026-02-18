"""
Script to approve all pending users in the database.
Run this to allow all pending users to login.
"""
import sys
import os

# Add the current directory to sys.path to import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User, UserApprovalStatus

def approve_all_pending_users():
    app = create_app()
    with app.app_context():
        # Find all pending users
        pending_users = User.query.filter_by(approval_status=UserApprovalStatus.PENDING).all()
        
        print(f"Found {len(pending_users)} pending users:")
        
        for user in pending_users:
            print(f"  - {user.username} ({user.email}) - Current status: {user.approval_status.value}")
            user.approval_status = UserApprovalStatus.APPROVED
            print(f"    -> Updated to: APPROVED")
        
        # Also check for inactive users
        inactive_users = User.query.filter_by(is_active=False).all()
        
        if inactive_users:
            print(f"\nFound {len(inactive_users)} inactive users:")
            for user in inactive_users:
                print(f"  - {user.username} ({user.email}) - is_active: {user.is_active}")
        
        db.session.commit()
        print("\n✓ All pending users have been approved!")
        print("✓ Users can now log in with their credentials.")

if __name__ == '__main__':
    approve_all_pending_users()
