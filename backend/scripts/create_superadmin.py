"""Create a superadmin user with custom credentials"""
import sys
import os
import argparse
from werkzeug.security import generate_password_hash

# Ensure backend package is on sys.path so `app` can be imported when running from the project root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.user import User, UserRole, UserApprovalStatus
from app.models.business import Business


def create_superadmin(username, email, password, first_name=None, last_name=None):
    """Create a superadmin user with the provided credentials"""
    app = create_app()

    with app.app_context():
        # Check if superadmin already exists
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            print(f'Error: User with username "{username}" already exists')
            return False

        # Check if email already exists
        existing_email = User.query.filter_by(email=email).first()
        if existing_email:
            print(f'Error: User with email "{email}" already exists')
            return False

        # Create a business for the superadmin
        business = Business(name='Main Business', email=email)
        db.session.add(business)
        db.session.flush()

        # Create the superadmin user
        user = User(
            username=username,
            email=email,
            first_name=first_name or 'Super',
            last_name=last_name or 'Admin',
            role=UserRole.superadmin,
            business_id=business.id,
            approval_status=UserApprovalStatus.APPROVED,
            is_active=True
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        print(f'Successfully created superadmin user: {username}')
        print(f'Email: {email}')
        print(f'Role: {user.role.value}')
        return True


def main():
    parser = argparse.ArgumentParser(description='Create a superadmin user')
    parser.add_argument('--username', required=True, help='Username for the superadmin')
    parser.add_argument('--email', required=True, help='Email for the superadmin')
    parser.add_argument('--password', required=True, help='Password for the superadmin')
    parser.add_argument('--first-name', help='First name for the superadmin')
    parser.add_argument('--last-name', help='Last name for the superadmin')

    args = parser.parse_args()

    success = create_superadmin(
        username=args.username,
        email=args.email,
        password=args.password,
        first_name=args.first_name,
        last_name=args.last_name
    )

    if success:
        print("Superadmin creation completed successfully")
        sys.exit(0)
    else:
        print("Superadmin creation failed")
        sys.exit(1)


if __name__ == '__main__':
    main()