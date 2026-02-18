"""Create or update the user 'adnan' with the specified password and APPROVED status."""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.user import User, UserRole, UserApprovalStatus
from app.models.business import Business


def main():
    app = create_app()
    with app.app_context():
        username = 'adnan'
        password = 'Jesuslove@12'
        email = 'adnan@example.com'
        first_name = 'Adnan'
        last_name = 'User'
        role = UserRole.admin

        user = User.query.filter_by(username=username).first()
        if user:
            print(f"Found existing user '{username}' (id={user.id}), updating password and status...")
            user.email = email
            user.first_name = first_name
            user.last_name = last_name
            user.role = role
            user.set_password(password)
            user.approval_status = UserApprovalStatus.APPROVED
            user.is_active = True
        else:
            print(f"User '{username}' not found — creating new user...")
            # Ensure a business exists
            business = Business.query.first()
            if not business:
                business = Business(
                    name='Default Business',
                    email='business@example.com'
                )
                db.session.add(business)
                db.session.flush()
                print(f"Created business id={business.id}")

            user = User(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                role=role,
                business_id=business.id,
                approval_status=UserApprovalStatus.APPROVED,
                is_active=True,
                profile_picture='https://via.placeholder.com/80'
            )
            user.set_password(password)
            db.session.add(user)
            db.session.flush()
            print(f"Created user with id={user.id}")

        db.session.commit()
        print(f"Done: username={user.username}, email={user.email}, approval_status={user.approval_status.value}, is_active={user.is_active}")
        print(f"\nYou can now login with:")
        print(f"  Username: {username}")
        print(f"  Password: {password}")


if __name__ == '__main__':
    main()
