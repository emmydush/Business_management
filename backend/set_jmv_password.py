from app import create_app, db
from app.models.user import User

app = create_app()
with app.app_context():
    # Set a known password for jmv02
    jmv02 = User.query.filter_by(username='jmv02').first()
    
    if jmv02:
        new_password = "jmv123"
        print(f"Setting password for user: {jmv02.first_name} {jmv02.last_name}")
        print(f"Username: {jmv02.username}")
        
        # Set new password
        jmv02.set_password(new_password)
        db.session.commit()
        
        # Test the new password
        print(f"\nTesting new password '{new_password}': {jmv02.check_password(new_password)}")
        
        print("\n" + "="*40)
        print("LOGIN CREDENTIALS FOR JMV02:")
        print("="*40)
        print(f"Username: {jmv02.username}")
        print(f"Password: {new_password}")
        print("="*40)
        print("User can now login with these credentials!")
    else:
        print("User jmv02 not found!")
