from app import create_app, db
from app.models.business import Business
from app.models.user import User

app = create_app()
with app.app_context():
    email = 'kubwimanatheophile02@gmail.com'
    
    # Find businesses with this email
    businesses = Business.query.filter_by(email=email).all()
    
    for b in businesses:
        print(f"Cleaning up business: ID={b.id}, Name={b.name}")
        # Check if it has any users (just in case)
        user_count = User.query.filter_by(business_id=b.id).count()
        if user_count == 0:
            print(f"Deleting business ID {b.id} because it has 0 users.")
            db.session.delete(b)
        else:
            print(f"Business ID {b.id} has {user_count} users. Not deleting automatically.")
            
    db.session.commit()
    print("Cleanup complete.")
