"""Approve the default superadmin user so they can log in for testing.
Usage: python scripts/approve_superadmin.py
"""
from app import create_app, db
from app.models.user import User, UserApprovalStatus

app = create_app()

with app.app_context():
    user = User.query.filter_by(username='superadmin').first()
    if not user:
        print('No superadmin user found')
    else:
        user.approval_status = UserApprovalStatus.APPROVED
        db.session.commit()
        print('Superadmin approved')