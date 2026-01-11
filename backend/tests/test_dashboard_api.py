import requests

BASE_URL = "http://localhost:5000/api"

def test_dashboard():
    # Login
    login_data = {"username": "admin", "password": "admin123"}
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.status_code} - {response.text}")
        return

    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    endpoints = [
        "/dashboard/stats",
        "/dashboard/recent-activity",
        "/dashboard/sales-chart"
    ]

    for endpoint in endpoints:
        print(f"Testing {endpoint}...")
        res = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
        print(f"Status: {res.status_code}")
        if res.status_code != 200:
            print(f"Error: {res.text}")
        else:
            print(f"Success: {res.json().keys()}")

if __name__ == "__main__":
    test_dashboard()
