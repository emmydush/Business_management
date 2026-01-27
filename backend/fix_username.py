from app import create_app, db
from app.models.user import User

app = create_app()

with app.app_context():
    # Find the user with the problematic username
    user = User.query.filter_by(username='kubwimana ').first()  # With trailing space
    
    if user:
        print(f'Found user: "{user.username}" (ID: {user.id})')
        print(f'Current username: {repr(user.username)}')
        
        # Store the original username for reference
        original_username = user.username
        
        # Trim the trailing spaces
        corrected_username = user.username.strip()
        print(f'Corrected username: {repr(corrected_username)}')
        
        # Check if the corrected username already exists for this business
        existing_user = User.query.filter_by(username=corrected_username, business_id=user.business_id).first()
        
        if existing_user and existing_user.id != user.id:
            print(f'Error: Username "{corrected_username}" already exists for this business!')
        else:
            # Update the username
            user.username = corrected_username
            db.session.commit()
            print(f'Successfully updated username from {repr(original_username)} to {repr(corrected_username)}')
    else:
        print('User with trailing spaces in username not found')
        # Let's also check if there are any other similar issues
        users = User.query.filter(User.username.like('% %')).all()  # Users with any spaces
        for u in users:
            if u.username != u.username.strip():
                print(f'Found user with leading/trailing spaces: {repr(u.username)} (ID: {u.id})')