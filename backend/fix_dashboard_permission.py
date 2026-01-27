"""
Script to grant dashboard permission to users who don't have it
"""
from app import create_app, db
from app.models.user import User
from app.models.settings import UserPermission

app = create_app()

with app.app_context():
    # Get all users
    users = User.query.all()
    
    print("\n=== Checking User Permissions ===\n")
    
    for user in users:
        print(f"User: {user.username} (ID: {user.id}, Role: {user.role})")
        
        # Check if user has any custom permissions
        custom_perms = UserPermission.query.filter_by(user_id=user.id).all()
        
        if custom_perms:
            print(f"  Has {len(custom_perms)} custom permissions:")
            has_dashboard = False
            for perm in custom_perms:
                print(f"    - {perm.module}: {'Granted' if perm.granted else 'Denied'}")
                if perm.module == 'dashboard' and perm.granted:
                    has_dashboard = True
            
            if not has_dashboard:
                print(f"  ⚠️  Missing dashboard permission! Adding it now...")
                # Add dashboard permission
                dashboard_perm = UserPermission(
                    user_id=user.id,
                    module='dashboard',
                    granted=True
                )
                db.session.add(dashboard_perm)
                db.session.commit()
                print(f"  ✅ Dashboard permission granted!")
        else:
            print(f"  No custom permissions (using role-based defaults)")
        
        print()
    
    print("=== Permission Fix Complete ===\n")
