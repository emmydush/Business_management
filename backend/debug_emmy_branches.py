from app import create_app, db
from app.models.business import Business
from app.models.branch import Branch, UserBranchAccess
from app.models.user import User

app = create_app()
with app.app_context():
    biz = Business.query.filter(Business.name.ilike('%EMMY%')).first()
    if biz:
        print(f"Found business: {biz.name} (ID: {biz.id})")
        branches = Branch.query.filter_by(business_id=biz.id).all()
        print(f"Branches: {[b.name for b in branches]}")
        
        users = User.query.filter_by(business_id=biz.id).all()
        for user in users:
            access = UserBranchAccess.query.filter_by(user_id=user.id).all()
            print(f"User {user.username} has access to: {[a.branch.name for a in access if a.branch]}")
    else:
        print("Business 'EMMY' not found")
