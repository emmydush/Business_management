from app import create_app, db
from app.models.business import Business
from app.models.user import User

app = create_app()
with app.app_context():
    print("Cleaning up all ghost businesses (0 users)...")
    all_businesses = Business.query.all()
    deleted_count = 0
    for b in all_businesses:
        user_count = User.query.filter_by(business_id=b.id).count()
        if user_count == 0:
            print(f"Deleting ghost: ID={b.id}, Name={b.name}, Email={b.email}")
            db.session.delete(b)
            deleted_count += 1
            
    db.session.commit()
    print(f"Cleanup complete. Deleted {deleted_count} ghost businesses.")
