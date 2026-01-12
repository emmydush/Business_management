from app import create_app, db
from app.models.business import Business
from app.models.user import User

app = create_app()
with app.app_context():
    print("Checking for ghost businesses (0 users)...")
    ghosts = []
    all_businesses = Business.query.all()
    for b in all_businesses:
        user_count = User.query.filter_by(business_id=b.id).count()
        if user_count == 0:
            ghosts.append(b)
            print(f"Ghost found: ID={b.id}, Name={b.name}, Email={b.email}")
            
    if not ghosts:
        print("No ghost businesses found.")
    else:
        print(f"Found {len(ghosts)} ghost businesses.")
        # Optional: delete them
        # for g in ghosts:
        #     db.session.delete(g)
        # db.session.commit()
        # print("Deleted all ghosts.")
