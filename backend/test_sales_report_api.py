import requests
from datetime import datetime, timedelta

# Test the sales report API
base_url = "http://127.0.0.1:5000/api"

# First, we need to login to get a token
print("Testing Sales Report API...")
print("=" * 50)

# You'll need to replace these with actual credentials
login_data = {
    "username": "admin",  # Change this to your username
    "password": "admin123"  # Change this to your password
}

try:
    response = requests.post(f"{base_url}/auth/login", json=login_data)
    if response.status_code == 200:
        token = response.json().get('access_token')
        print(f"✓ Login successful")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test sales report endpoint
        params = {
            'start_date': (datetime.utcnow() - timedelta(days=30)).isoformat(),
            'end_date': datetime.utcnow().isoformat()
        }
        
        print(f"\nFetching sales report for last 30 days...")
        response = requests.get(f"{base_url}/reports/sales", headers=headers, params=params)
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ API Response received")
            print(f"\nSales Report Data:")
            print(f"  Total Sales: ${data.get('sales_report', {}).get('total_sales', 0):.2f}")
            print(f"  Total Orders: {data.get('sales_report', {}).get('total_orders', 0)}")
            print(f"  Average Order Value: ${data.get('sales_report', {}).get('avg_order_value', 0):.2f}")
            
            top_products = data.get('sales_report', {}).get('top_products', [])
            if top_products:
                print(f"\n  Top Products:")
                for p in top_products[:3]:
                    print(f"    - {p['name']}: ${p['revenue']:.2f} ({p['orders']} orders)")
            else:
                print(f"\n  No top products data")
        else:
            print(f"✗ API Error: {response.text}")
    else:
        print(f"✗ Login failed: {response.text}")
        print("\nPlease check your credentials in this script.")
except Exception as e:
    print(f"✗ Error: {e}")
    print("\nMake sure the backend server is running on http://127.0.0.1:5000")
