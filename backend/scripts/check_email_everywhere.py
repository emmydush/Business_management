from app import create_app, db
from app.models.business import Business
from app.models.user import User

app = create_app()
with app.app_context():
    email = 'kubwimanatheophile02@gmail.com'
    
    print(f"Checking for ANY user with email: {email}")
    users = User.query.filter_by(email=email).all()
    if users:
        print(f"Found {len(users)} users:")
        for user in users:
            print(f"  - User: ID={user.id}, Username={user.username}, BusinessID={user.business_id}, Status={user.approval_status}")
    else:
        print("No users found with this email.")
        
    print(f"\nChecking for ANY business with email: {email}")
    businesses = Business.query.filter_by(email=email).all()
    if businesses:
        for b in businesses:
            print(f"  - Business: ID={b.id}, Name={b.name}")
    else:
        print("No businesses found with this email.")
