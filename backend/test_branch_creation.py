"""
Test script to verify branch creation access
"""
import requests
import json

# Test endpoint - you'll need to replace with your actual server URL
BASE_URL = "http://localhost:5000"

def test_branch_creation():
    # First login to get JWT token
    login_data = {
        "username": "admin",  # Replace with actual admin username
        "password": "password"  # Replace with actual password
    }
    
    try:
        # Login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.text}")
            return
            
        token = login_response.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        
        # Test branch creation
        branch_data = {
            "name": "Test Branch",
            "code": "TEST001",
            "address": "123 Test Street",
            "city": "Test City",
            "phone": "123-456-7890"
        }
        
        response = requests.post(f"{BASE_URL}/api/branches", 
                               json=branch_data, 
                               headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 201:
            print("✅ Branch creation successful!")
        elif response.status_code == 403:
            print("❌ Access denied - check subscription and permissions")
        else:
            print(f"⚠️  Unexpected response: {response.status_code}")
            
    except Exception as e:
        print(f"Error testing branch creation: {e}")

if __name__ == '__main__':
    test_branch_creation()