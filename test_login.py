#!/usr/bin/env python3
"""
Test login functionality directly
"""

import requests
import json

def test_login():
    """Test login with different credentials"""
    url = "http://127.0.0.1:5000/api/auth/login"
    
    # Test with user 'adnan' and common passwords
    test_credentials = [
        {"username": "adnan", "password": "password"},
        {"username": "adnan", "password": "123456"},
        {"username": "adnan", "password": "admin"},
        {"username": "adnan", "password": "adnan"},
        {"username": "kubwimanatheophile02@gmail.com", "password": "password"},
        {"username": "ishimwe.adeline", "password": "password"},
    ]
    
    for credentials in test_credentials:
        try:
            print(f"\nTesting: {credentials['username']} / {credentials['password']}")
            response = requests.post(url, json=credentials, timeout=10)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 200:
                print("SUCCESS! Login worked!")
                return True
                
        except Exception as e:
            print(f"Error: {e}")
    
    return False

if __name__ == "__main__":
    test_login()
