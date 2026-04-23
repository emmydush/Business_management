from app import create_app, db
from app.models.user import User

app = create_app()
with app.app_context():
    # Find Emmanuel's account
    emmanuel = User.query.filter_by(username='emmanuel').first()
    
    if emmanuel:
        print(f"Found Emmanuel: {emmanuel.first_name} {emmanuel.last_name}")
        print(f"Email: {emmanuel.email}")
        print(f"Role: {emmanuel.role.value}")
        print(f"Business ID: {emmanuel.business_id}")
        print(f"Business Name: {emmanuel.business.name if emmanuel.business else 'None'}")
        print(f"Account Active: {emmanuel.is_active}")
        print("\n" + "="*50)
        print("TEAM MEMBERS ON EMMANUEL'S BUSINESS ACCOUNT:")
        print("="*50)
        
        # Get all users in the same business
        team_members = User.query.filter_by(business_id=emmanuel.business_id).all()
        
        if team_members:
            for i, member in enumerate(team_members, 1):
                status = "✓ ACTIVE" if member.is_active else "✗ INACTIVE"
                print(f"{i}. {member.first_name} {member.last_name}")
                print(f"   Username: {member.username}")
                print(f"   Email: {member.email}")
                print(f"   Role: {member.role.value}")
                print(f"   Phone: {member.phone or 'Not set'}")
                print(f"   Status: {status}")
                print(f"   Created: {member.created_at.strftime('%Y-%m-%d') if member.created_at else 'Unknown'}")
                print("-" * 30)
        else:
            print("No team members found.")
    else:
        print("Emmanuel not found in the system.")
