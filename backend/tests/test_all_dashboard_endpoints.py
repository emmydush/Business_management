import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_all_dashboard_endpoints():
    # Login
    print("Testing Login...")
    login_data = {"username": "admin", "password": "admin123"}
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Login successful\n")
    
    endpoints = [
        "/dashboard/stats",
        "/dashboard/recent-activity",
        "/dashboard/sales-chart",
        "/dashboard/revenue-expense-chart",
        "/dashboard/product-performance-chart"
    ]
    
    all_passed = True
    for endpoint in endpoints:
        print(f"Testing {endpoint}...")
        res = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
        
        if res.status_code == 200:
            print(f"  ✅ Status: {res.status_code} - Success")
            data = res.json()
            print(f"  📊 Keys: {list(data.keys())}")
        else:
            print(f"  ❌ Status: {res.status_code} - Failed")
            print(f"  Error: {res.text}")
            all_passed = False
        print()
    
    if all_passed:
        print("\n🎉 All dashboard endpoints are working correctly!")
    else:
        print("\n❌ Some endpoints failed. Please check the errors above.")

if __name__ == "__main__":
    test_all_dashboard_endpoints()
