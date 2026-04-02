#!/usr/bin/env python3
"""
Script to verify database persistence and list existing users
"""
import sys
import os

# Add the current directory to sys.path to import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User

def check_users():
    app = create_app()
    with app.app_context():
        users = User.query.all()
        print(f"Total users in database: {len(users)}")
        print("\nExisting users:")
        for user in users:
            print(f"- Username: {user.username}, Email: {user.email}, Role: {user.role}, Active: {user.is_active}")
        
        print(f"\nDatabase file location: {app.config['SQLALCHEMY_DATABASE_URI']}")

if __name__ == "__main__":
    check_users()
