import requests

BASE_URL = "http://127.0.0.1:5000"

def test_api_endpoints():
    print("Testing API endpoints...")
    
    # Test health check
    try:
        response = requests.get(f"{BASE_URL}/api/auth/profile", headers={"Authorization": "Bearer invalid_token"})
        print(f"Auth endpoint test - Status: {response.status_code}")
    except:
        print("Could not connect to API server. Server might not be running.")
        return
    
    # Test various endpoints
    endpoints = [
        "/api/users/",
        "/api/customers/",
        "/api/inventory/products",
        "/api/sales/orders",
        "/api/dashboard/stats"
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers={"Authorization": "Bearer invalid_token"})
            print(f"{endpoint} - Status: {response.status_code}")
        except Exception as e:
            print(f"{endpoint} - Error: {str(e)}")

if __name__ == "__main__":
    test_api_endpoints()