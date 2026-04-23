from app import create_app, db
from app.models.user import User

app = create_app()
with app.app_context():
    # Set a known test password for the user
    username = 'emmanuel'
    new_password = 'test123'
    
    user = User.query.filter_by(username=username).first()
    if user:
        print(f"Setting password for user: {user.username}")
        user.set_password(new_password)
        db.session.commit()
        
        # Test the new password
        print(f"Testing new password '{new_password}': {user.check_password(new_password)}")
        print("Password updated successfully!")
        print(f"User can now login with:")
        print(f"Username: {user.username}")
        print(f"Password: {new_password}")
    else:
        print("User not found")
