from app import create_app, db
from app.models.user import User
from app.models.branch import UserBranchAccess, Branch

app = create_app()
with app.app_context():
    users = User.query.all()
    for user in users:
        print(f"User: {user.username} (ID: {user.id}), Role: {user.role.value}")
        accesses = UserBranchAccess.query.filter_by(user_id=user.id).all()
        for access in accesses:
            branch = Branch.query.get(access.branch_id)
            print(f"  - Branch: {branch.name} (ID: {branch.id}), Default: {access.is_default}")
        if not accesses:
            print("  - No branch access records.")
