#!/usr/bin/env python3
"""
Test the new password
"""

import requests

def test_new_password():
    """Test login with new password"""
    url = "http://127.0.0.1:5000/api/auth/login"
    credentials = {"username": "adnan", "password": "password123"}
    
    try:
        response = requests.post(url, json=credentials, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print("LOGIN SUCCESSFUL!")
            print(f"User: {data.get('user', {}).get('username')}")
            print(f"Role: {data.get('user', {}).get('role')}")
            return True
        else:
            print("Login failed")
            return False
            
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    test_new_password()
