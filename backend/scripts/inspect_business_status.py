from app import create_app, db
from app.models.business import Business
from app.models.user import User

app = create_app()
with app.app_context():
    email = 'kubwimanatheophile02@gmail.com'
    
    print(f"Checking for business with email: {email}")
    business = Business.query.filter_by(email=email).first()
    if business:
        print(f"Business found: ID={business.id}, Name={business.name}, Active={business.is_active}")
        
        users = User.query.filter_by(business_id=business.id).all()
        print(f"Found {len(users)} users for this business:")
        for user in users:
            print(f"  - User: ID={user.id}, Username={user.username}, Email={user.email}, Role={user.role}, Status={user.approval_status}, Active={user.is_active}")
    else:
        print("No business found with this email.")
