"""Create a test superadmin user with username 'superadmin' and password 'superadmin123'"""
import sys, os
# Ensure backend package is on sys.path so `app` can be imported when running from the project root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import create_app, db
from app.models.user import User, UserRole, UserApprovalStatus
from app.models.business import Business

app = create_app()

with app.app_context():
    # Check if superadmin exists
    user = User.query.filter_by(username='superadmin').first()
    if user:
        print('superadmin already exists')
        if not user.profile_picture:
            user.profile_picture = 'https://via.placeholder.com/80'
            db.session.commit()
            print('Added placeholder profile picture to existing superadmin')
    else:
        # Create a business for the superadmin (superadmin may not need a business, but set one)
        business = Business(name='Test Business', email='superadmin@example.com')
        db.session.add(business)
        db.session.flush()

        user = User(
            username='superadmin',
            email='superadmin@example.com',
            first_name='Super',
            last_name='Admin',
            role=UserRole.superadmin,
            business_id=business.id,
            approval_status=UserApprovalStatus.APPROVED,
            is_active=True,
            profile_picture='https://via.placeholder.com/80'
        )
        user.set_password('superadmin123')
        db.session.add(user)
        db.session.commit()
        print('superadmin created')