from app import create_app, db
from app.models.user import User

def check_user_password():
    app = create_app()
    with app.app_context():
        user = User.query.filter_by(username='adnan').first()
        if user:
            print(f"Username: {user.username}")
            print(f"Email: {user.email}")
            print(f"Role: {user.role}")
            print(f"Business ID: {user.business_id}")
            print(f"Password hash starts with: {user.password[:50]}")
        else:
            print("User 'adnan' not found")

if __name__ == '__main__':
    check_user_password()