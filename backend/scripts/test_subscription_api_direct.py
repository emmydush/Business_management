import requests
import json

# Test the subscription status API directly
def test_subscription_api():
    # First, let's login to get a token
    login_url = "http://localhost:5000/api/auth/login"
    login_data = {
        "username": "adnan",
        "password": "adnan123"  # Use the correct password for the adnan user
    }
    
    try:
        # Login
        login_response = requests.post(login_url, json=login_data)
        print(f"Login status: {login_response.status_code}")
        print(f"Login response: {login_response.json()}")
        
        if login_response.status_code == 200:
            token = login_response.json().get('access_token')
            if token:
                # Test subscription status
                headers = {
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json'
                }
                
                subscription_url = "http://localhost:5000/api/auth/subscription-status"
                sub_response = requests.get(subscription_url, headers=headers)
                print(f"\nSubscription status: {sub_response.status_code}")
                print(f"Subscription response: {json.dumps(sub_response.json(), indent=2)}")
                
                # Check if has_subscription is True
                has_subscription = sub_response.json().get('has_subscription', False)
                print(f"\nHas subscription: {has_subscription}")
                if has_subscription:
                    print("✅ User has active subscription")
                else:
                    print("❌ User does not have active subscription")
            else:
                print("Failed to get token from login response")
        else:
            print("Login failed")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_subscription_api()