#!/usr/bin/env python3
"""
Create New Superadmin with Secure Password
This script creates a new superadmin user with a strong, secure password
"""

import sys
import os
import secrets
import string

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.user import User, UserRole
from werkzeug.security import generate_password_hash

def generate_secure_password(length=16):
    """Generate a strong, secure password"""
    # Define character sets
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    special = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    
    # Ensure at least one character from each set
    password = [
        secrets.choice(lowercase),
        secrets.choice(uppercase),
        secrets.choice(digits),
        secrets.choice(special)
    ]
    
    # Fill the rest with random characters from all sets
    all_chars = lowercase + uppercase + digits + special
    for _ in range(length - 4):
        password.append(secrets.choice(all_chars))
    
    # Shuffle the password
    secrets.SystemRandom().shuffle(password)
    
    return ''.join(password)

def create_secure_superadmin():
    """Create a new superadmin user with secure credentials"""
    app = create_app()
    
    with app.app_context():
        try:
            # Generate secure credentials
            username = f"superadmin_{secrets.token_hex(3)[:6]}"
            email = f"{username}@secure-system.com"
            password = generate_secure_password(16)
            
            print(f"🔐 Creating secure superadmin user...")
            print(f"📝 Username: {username}")
            print(f"📧 Email: {email}")
            print(f"🔑 Password: {password}")
            
            # Check if username already exists
            existing_user = User.query.filter_by(username=username).first()
            if existing_user:
                print(f"⚠️  User {username} already exists! Generating new username...")
                username = f"superadmin_{secrets.token_hex(3)[:6]}"
                email = f"{username}@secure-system.com"
                print(f"📝 New Username: {username}")
                print(f"📧 New Email: {email}")
            
            # Create the superadmin user
            superadmin = User(
                username=username,
                email=email,
                password_hash=generate_password_hash(password, method='pbkdf2:sha256'),
                first_name="System",
                last_name="Administrator",
                phone=None,
                role=UserRole.superadmin,
                is_active=True,
                business_id=None  # Superadmin doesn't belong to a specific business
            )
            
            db.session.add(superadmin)
            db.session.commit()
            
            print(f"\n✅ Secure superadmin created successfully!")
            print(f"🆔 User ID: {superadmin.id}")
            print(f"📊 Role: {superadmin.role.value}")
            print(f"✅ Active: {superadmin.is_active}")
            
            # Verify the user was created
            created_user = User.query.filter_by(username=username).first()
            if created_user:
                print(f"✅ User verification successful!")
            else:
                print(f"❌ User verification failed!")
                return False
            
            return username, password
            
        except Exception as e:
            print(f"❌ Error creating secure superadmin: {e}")
            db.session.rollback()
            return None, None

def save_credentials_to_file(username, password):
    """Save credentials to a secure file"""
    try:
        credentials_file = os.path.join(os.path.dirname(__file__), 'superadmin_credentials.txt')
        with open(credentials_file, 'w') as f:
            f.write("🔐 SECURE SUPERADMIN CREDENTIALS 🔐\n")
            f.write("=" * 50 + "\n")
            f.write(f"Username: {username}\n")
            f.write(f"Password: {password}\n")
            f.write(f"Email: {username}@secure-system.com\n")
            f.write(f"Created: {sys.argv[0]}\n")
            f.write("=" * 50 + "\n")
            f.write("⚠️  Keep this file secure and delete after use!\n")
        
        print(f"📁 Credentials saved to: {credentials_file}")
        return True
    except Exception as e:
        print(f"❌ Error saving credentials: {e}")
        return False

if __name__ == '__main__':
    print("🚀 Creating new secure superadmin user...")
    
    username, password = create_secure_superadmin()
    
    if username and password:
        print(f"\n🎯 LOGIN CREDENTIALS:")
        print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print(f"Username: {username}")
        print(f"Password: {password}")
        print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        
        print(f"\n🌐 ACCESS URLS:")
        print(f"Frontend: http://localhost:3000")
        print(f"Superadmin: http://localhost:3000/superadmin")
        
        # Save to file
        save_credentials_to_file(username, password)
        
        print(f"\n🔒 SECURITY NOTES:")
        print(f"• Password is 16 characters with mixed case, numbers, and symbols")
        print(f"• Username is randomized for uniqueness")
        print(f"• Credentials saved to file for backup")
        print(f"• Delete the credentials file after storing securely")
        
        print(f"\n🎉 Secure superadmin ready for use!")
    else:
        print(f"\n❌ Failed to create secure superadmin!")
        sys.exit(1)
