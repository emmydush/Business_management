#!/usr/bin/env python3
"""Fix all users by setting their approval_status to APPROVED and is_active to True.
This script should fix login issues after code deployments.
"""
import os
import sys

# Add the current directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User, UserApprovalStatus

def fix_users():
    app = create_app()
    
    with app.app_context():
        print("=" * 60)
        print("Fixing user approval status...")
        print("=" * 60)
        
        # Get all users
        users = User.query.all()
        
        if not users:
            print("No users found in database.")
            return False
        
        fixed_count = 0
        for user in users:
            changes = []
            
            if user.approval_status != UserApprovalStatus.APPROVED:
                user.approval_status = UserApprovalStatus.APPROVED
                changes.append("approval_status -> APPROVED")
            
            if not user.is_active:
                user.is_active = True
                changes.append("is_active -> True")
            
            if changes:
                print(f"User: {user.username} ({user.email})")
                print(f"  Changes: {', '.join(changes)}")
                fixed_count += 1
        
        if fixed_count > 0:
            db.session.commit()
            print(f"\n✅ Fixed {fixed_count} users")
        else:
            print("\n✅ All users are already approved and active")
        
        # Print summary
        print("\n" + "=" * 60)
        print("User Summary:")
        print("=" * 60)
        
        approved_users = User.query.filter_by(approval_status=UserApprovalStatus.APPROVED).count()
        pending_users = User.query.filter_by(approval_status=UserApprovalStatus.PENDING).count()
        rejected_users = User.query.filter_by(approval_status=UserApprovalStatus.REJECTED).count()
        active_users = User.query.filter_by(is_active=True).count()
        inactive_users = User.query.filter_by(is_active=False).count()
        
        print(f"Total users: {len(users)}")
        print(f"  Approved: {approved_users}")
        print(f"  Pending: {pending_users}")
        print(f"  Rejected: {rejected_users}")
        print(f"Active: {active_users}, Inactive: {inactive_users}")
        
        return True

if __name__ == '__main__':
    if fix_users():
        print("\n✅ Done!")
    else:
        print("\n❌ Failed!")
        sys.exit(1)
