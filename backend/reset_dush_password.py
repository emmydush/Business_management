"""Reset password for superadmin user 'dush'"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User, UserRole, UserApprovalStatus

app = create_app()

def reset_password():
    with app.app_context():
        # Find the user 'dush'
        user = User.query.filter_by(username='dush').first()
        
        if not user:
            print("ERROR: User 'dush' not found!")
            print("\nAvailable superadmin users:")
            superadmins = User.query.filter_by(role=UserRole.superadmin).all()
            for su in superadmins:
                print(f"  - {su.username} ({su.email})")
            return False
        
        # Set new password
        new_password = 'admin123'
        user.set_password(new_password)
        
        # Ensure user is active and approved
        user.is_active = True
        user.approval_status = UserApprovalStatus.APPROVED
        
        # Make sure role is superadmin
        if user.role != UserRole.superadmin:
            print(f"WARNING: User 'dush' is not a superadmin! Current role: {user.role.value}")
            print("Setting role to superadmin...")
            user.role = UserRole.superadmin
        
        db.session.commit()
        
        print("=" * 60)
        print("PASSWORD RESET SUCCESSFUL!")
        print("=" * 60)
        print(f"Username: {user.username}")
        print(f"Email: {user.email}")
        print(f"New Password: {new_password}")
        print(f"Role: {user.role.value}")
        print(f"Status: {'Active' if user.is_active else 'Inactive'}")
        print(f"Approval: {user.approval_status.value}")
        print("=" * 60)
        print("\nYou can now login with these credentials.")
        return True

if __name__ == '__main__':
    reset_password()
