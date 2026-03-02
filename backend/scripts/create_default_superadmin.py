import os
import sys
from dotenv import load_dotenv

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, base_dir)
load_dotenv(os.path.join(base_dir, '.env'))

from app import create_app, db
from app.models.user import User, UserRole, UserApprovalStatus

def main():
    app = create_app()
    with app.app_context():
        username = os.getenv('SUPERADMIN_USERNAME', 'superadmin')
        email = os.getenv('SUPERADMIN_EMAIL', 'superadmin@business.com')
        password = os.getenv('SUPERADMIN_PASSWORD', 'admin123')
        first_name = os.getenv('SUPERADMIN_FIRST_NAME', 'Super')
        last_name = os.getenv('SUPERADMIN_LAST_NAME', 'Admin')

        existing = User.query.filter(
            (User.username == username) | (User.email == email)
        ).first()

        if existing:
            print(f"✓ Superadmin exists: {existing.username} ({existing.email})")
            return

        user = User(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=UserRole.superadmin,
            approval_status=UserApprovalStatus.APPROVED,
            is_active=True
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        print(f"✓ Default superadmin created: {username} / {email}")

if __name__ == "__main__":
    main()
