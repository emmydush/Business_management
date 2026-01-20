from app import create_app, db
from app.models.branch import UserBranchAccess, Branch
from app.models.user import User

app = create_app()
with app.app_context():
    target_branch_id = 1
    
    # Ensure branch 1 exists
    branch1 = Branch.query.get(target_branch_id)
    if not branch1:
        print(f"Error: Branch {target_branch_id} not found.")
        exit(1)
        
    users = User.query.all()
    for user in users:
        print(f"Updating user: {user.username}")
        
        # Set all existing accesses to non-default
        UserBranchAccess.query.filter_by(user_id=user.id).update({'is_default': False})
        
        # Check if user already has access to branch 1
        access1 = UserBranchAccess.query.filter_by(user_id=user.id, branch_id=target_branch_id).first()
        if access1:
            access1.is_default = True
            print(f"  - Set existing access to branch {target_branch_id} as default.")
        else:
            # Create new access
            new_access = UserBranchAccess(
                user_id=user.id,
                branch_id=target_branch_id,
                is_default=True
            )
            db.session.add(new_access)
            print(f"  - Created new default access to branch {target_branch_id}.")
            
    db.session.commit()
    print("User branch access update complete.")
