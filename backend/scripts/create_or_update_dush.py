"""
Create or update the user `dush` and set the password to `Jesus@12`.
Run: python create_or_update_dush.py
"""
import sys
import os
# Ensure backend package (parent dir) is on sys.path so `app` can be imported when running from anywhere
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import create_app, db
from app.models.user import User, UserRole
from app.models.business import Business

# Also keep scripts dir on path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


def main():
    app = create_app()
    with app.app_context():
        username = 'dush'
        password = 'Jesus@12'
        email = 'dush@example.com'
        first_name = 'Dush'
        last_name = 'User'
        role = UserRole.staff

        user = User.query.filter_by(username=username).first()
        if user:
            print(f"Found existing user '{username}' (id={user.id}), updating password and fields...")
            user.email = user.email or email
            user.first_name = user.first_name or first_name
            user.last_name = user.last_name or last_name
            user.role = user.role or role
            user.set_password(password)
        else:
            print(f"User '{username}' not found — creating new user...")
            user = User(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                role=role,
                profile_picture='https://via.placeholder.com/80'
            )
            user.set_password(password)
            db.session.add(user)
            db.session.flush()  # get user.id
            print(f"Created user with id={user.id}")

        # Ensure the user has a business — attach to an existing one or create a default
        if not user.business_id:
            business = Business.query.filter_by(email='dush-business@example.com').first()
            if not business:
                business = Business(
                    name='Dush Business',
                    email='dush-business@example.com',
                    phone='000-000-0000',
                    address='Auto-created business for user dush'
                )
                db.session.add(business)
                db.session.flush()
                print(f"Created business id={business.id} for user 'dush'")
            user.business_id = business.id

        db.session.commit()
        print(f"Done: username={user.username}, email={user.email}, business_id={user.business_id}")


if __name__ == '__main__':
    main()
