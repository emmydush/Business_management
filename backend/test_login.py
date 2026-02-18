import requests
import json

# Test login with provided credentials
def test_login():
    url = 'http://localhost:5000/api/auth/login'
    
    credentials = {
        'username': 'adnan',
        'password': 'Jesuslove@12'
    }
    
    print("Testing login with credentials:")
    print(f"  Username: {credentials['username']}")
    print(f"  Password: {credentials['password']}")
    print(f"\nMaking request to: {url}\n")
    
    try:
        response = requests.post(url, json=credentials)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"\nResponse Body:")
        print(json.dumps(response.json(), indent=2))
        
        if response.status_code == 200:
            print("\n✓ Login successful!")
            token = response.json().get('access_token')
            if token:
                print(f"Access Token: {token[:50]}...")
        else:
            print(f"\n✗ Login failed with status code {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("✗ Error: Cannot connect to backend server at http://localhost:5000")
        print("  Make sure the backend is running: cd backend && python run.py")
    except Exception as e:
        print(f"✗ Error: {str(e)}")

if __name__ == '__main__':
    test_login()
