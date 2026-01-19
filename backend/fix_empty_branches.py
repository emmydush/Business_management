from app import create_app, db
from app.models.business import Business
from app.models.branch import Branch, UserBranchAccess
from app.models.user import User

app = create_app()
with app.app_context():
    businesses = Business.query.all()
    print(f"Total businesses: {len(businesses)}")
    for biz in businesses:
        branches = Branch.query.filter_by(business_id=biz.id).all()
        print(f"Business: {biz.name} (ID: {biz.id}) has {len(branches)} branches")
        if not branches:
            print(f"Creating default branch for {biz.name}...")
            main_branch = Branch(
                business_id=biz.id,
                name="Main Branch",
                code="MAIN",
                is_headquarters=True,
                is_active=True
            )
            db.session.add(main_branch)
            db.session.flush()
            
            # Give all users in this business access to the main branch
            users = User.query.filter_by(business_id=biz.id).all()
            for user in users:
                access = UserBranchAccess(
                    user_id=user.id,
                    branch_id=main_branch.id,
                    is_default=True
                )
                db.session.add(access)
            print(f"Created Main Branch and granted access to {len(users)} users.")
    
    db.session.commit()
    print("Done!")
