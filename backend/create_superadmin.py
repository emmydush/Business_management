import os
import sys
from getpass import getpass
from app import create_app, db
from app.models.user import User, UserRole, UserApprovalStatus

def create_superadmin():
    """
    Script to create a superadmin account from the command line.
    """
    app = create_app()
    with app.app_context():
        print("--- Create Superadmin Account ---")
        
        username = input("Enter username: ").strip()
        email = input("Enter email: ").strip()
        first_name = input("Enter first name: ").strip()
        last_name = input("Enter last name: ").strip()
        password = getpass("Enter password: ").strip()
        confirm_password = getpass("Confirm password: ").strip()

        if password != confirm_password:
            print("Error: Passwords do not match.")
            return

        # Check if user already exists
        existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
        if existing_user:
            print(f"Error: A user with username '{username}' or email '{email}' already exists.")
            return

        try:
            new_user = User(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                role=UserRole.superadmin,
                approval_status=UserApprovalStatus.APPROVED,
                is_active=True,
                business_id=None  # Superadmins don't necessarily belong to a specific business
            )
            new_user.set_password(password)
            
            db.session.add(new_user)
            db.session.commit()
            
            print(f"\nSuccess! Superadmin '{username}' created successfully.")
            
        except Exception as e:
            db.session.rollback()
            print(f"\nError: Could not create superadmin. {str(e)}")

if __name__ == "__main__":
    create_superadmin()
