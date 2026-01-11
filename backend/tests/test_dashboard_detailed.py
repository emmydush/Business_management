import requests
import json

# Configuration
BASE_URL = "http://localhost:5000/api"

def test_login():
    """Test login and get token"""
    print("=" * 50)
    print("Testing Login...")
    print("=" * 50)
    
    # Try to login with a test user
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            return response.json().get('access_token')
        else:
            print("\n❌ Login failed!")
            return None
    except Exception as e:
        print(f"❌ Error during login: {str(e)}")
        return None

def test_dashboard_endpoints(token):
    """Test all dashboard endpoints"""
    if not token:
        print("\n❌ No token available. Cannot test dashboard endpoints.")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    endpoints = [
        "/dashboard/stats",
        "/dashboard/recent-activity",
        "/dashboard/sales-chart",
        "/dashboard/revenue-expense-chart",
        "/dashboard/product-performance-chart"
    ]
    
    for endpoint in endpoints:
        print("\n" + "=" * 50)
        print(f"Testing: {endpoint}")
        print("=" * 50)
        
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ Success!")
                data = response.json()
                print(f"Response keys: {list(data.keys())}")
                print(f"Sample data: {json.dumps(data, indent=2)[:500]}...")
            else:
                print(f"❌ Failed!")
                print(f"Response: {response.text}")
        except Exception as e:
            print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("\n🔍 Testing Dashboard API Endpoints")
    print("=" * 50)
    
    # Step 1: Login and get token
    token = test_login()
    
    # Step 2: Test dashboard endpoints
    if token:
        print("\n✅ Got token successfully!")
        test_dashboard_endpoints(token)
    else:
        print("\n❌ Could not get authentication token. Please check:")
        print("   1. Backend server is running on http://localhost:5000")
        print("   2. Database is initialized with a user")
        print("   3. Credentials are correct (default: admin/admin123)")
