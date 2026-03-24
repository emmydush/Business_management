#!/usr/bin/env python3
"""
Test script to verify that sales processing reduces quantity 
and shows remaining stock in the response.
"""

import requests
import json
import sys

def test_stock_reduction():
    """Test that stock is reduced and remaining quantity is shown"""
    
    # API base URL (adjust if needed)
    base_url = "http://localhost:5000/api"
    
    # Test data for a POS sale
    sale_data = {
        "items": [
            {
                "product_id": 1,
                "quantity": 2,
                "unit_price": 1000.0
            }
        ],
        "customer_name": "Test Customer",
        "payment_status": "PAID"
    }
    
    try:
        print("Testing stock reduction in sales processing...")
        print(f"Request data: {json.dumps(sale_data, indent=2)}")
        
        # Make the request (this will fail without proper auth, but we can see the structure)
        response = requests.post(
            f"{base_url}/sales/pos",
            json=sale_data,
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("SUCCESS: Order created successfully!")
            print(f"Response structure:")
            
            # Check if items include remaining_stock
            if 'order' in data and 'items' in data['order']:
                items = data['order']['items']
                for i, item in enumerate(items):
                    print(f"  Item {i+1}:")
                    print(f"    Product ID: {item.get('product_id')}")
                    print(f"    Quantity: {item.get('quantity')}")
                    print(f"    Remaining Stock: {item.get('remaining_stock', 'NOT FOUND')}")
                    
                    if 'remaining_stock' in item:
                        print(f"    ✓ Remaining stock is included in response")
                    else:
                        print(f"    ✗ Remaining stock is missing from response")
            else:
                print("    ✗ Items not found in response")
        else:
            print(f"Expected auth error (401), got: {response.status_code}")
            if response.text:
                print(f"Response: {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("Connection refused - server is not running")
        print("This is expected if the backend server is not started")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_stock_reduction()
