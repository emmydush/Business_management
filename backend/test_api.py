import requests
import json

# Test API to see if customer_name is included
try:
    response = requests.get('http://localhost:5000/api/sales/orders', timeout=5)
    if response.status_code == 200:
        data = response.json()
        orders = data.get('orders', [])
        if orders:
            first_order = orders[0]
            print('First Order Structure:')
            print(f'  Order ID: {first_order.get("order_id")}')
            print(f'  Customer ID: {first_order.get("customer_id")}')
            print(f'  Customer Name: {first_order.get("customer_name")}')
            print(f'  Customer Object: {first_order.get("customer")}')
            print(f'  Keys: {list(first_order.keys())}')
        else:
            print('No orders found')
    else:
        print(f'API Error: {response.status_code}')
        print(f'Response: {response.text}')
        
except requests.exceptions.ConnectionError:
    print('Backend server not accessible')
except Exception as e:
    print(f'Error: {e}')
