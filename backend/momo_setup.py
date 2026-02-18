"""
MoMo API Setup Script - Follow these steps to configure your MoMo sandbox credentials
"""

import requests
import uuid
import base64
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Your MoMo credentials
SUBSCRIPTION_KEY = "57b17dd5502f4e7b9cdc7aaafa840d12"
SANDBOX_URL = "https://sandbox.momodeveloper.mtn.com"
CALLBACK_HOST = "localhost:3000"  # Update this to your actual domain

def step_3_create_api_user():
    """
    STEP 3: Generate API User
    This creates an API User that you'll use to get an API Key
    """
    print("\n" + "="*60)
    print("STEP 3: Creating API User")
    print("="*60)
    
    # Generate a UUID for the X-Reference-Id
    api_user_reference_id = str(uuid.uuid4())
    print(f"\n✓ Generated X-Reference-Id: {api_user_reference_id}")
    
    url = f"{SANDBOX_URL}/v1_0/apiuser"
    
    headers = {
        "X-Reference-Id": api_user_reference_id,
        "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
        "Content-Type": "application/json"
    }
    
    body = {
        "providerCallbackHost": CALLBACK_HOST
    }
    
    print(f"\n📤 Sending POST request to: {url}")
    print(f"Headers: {json.dumps(headers, indent=2)}")
    print(f"Body: {json.dumps(body, indent=2)}")
    
    try:
        response = requests.post(url, headers=headers, json=body, timeout=30)
        
        print(f"\n📥 Response Status: {response.status_code}")
        
        if response.status_code == 201:
            print("✅ API User created successfully!")
            print(f"\n📋 Save this information:")
            print(f"   X-Reference-Id (API User ID): {api_user_reference_id}")
            print(f"\nNext: Use this ID in STEP 4 to generate API Key")
            return api_user_reference_id
        else:
            print(f"❌ Failed to create API User: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None


def step_4_generate_api_key(api_user_id):
    """
    STEP 4: Generate API Key
    This creates an API Key for the API User you just created
    """
    print("\n" + "="*60)
    print("STEP 4: Generating API Key")
    print("="*60)
    
    url = f"{SANDBOX_URL}/v1_0/apiuser/{api_user_id}/apikey"
    
    headers = {
        "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
        "Content-Type": "application/json"
    }
    
    print(f"\n📤 Sending POST request to: {url}")
    print(f"Headers: {json.dumps(headers, indent=2)}")
    
    try:
        response = requests.post(url, headers=headers, timeout=30)
        
        print(f"\n📥 Response Status: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            api_key = data.get('apiKey')
            print("✅ API Key generated successfully!")
            print(f"\n📋 Save this information:")
            print(f"   API Key: {api_key}")
            return api_key
        else:
            print(f"❌ Failed to generate API Key: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None


def step_5_generate_access_token(api_user_id, api_key):
    """
    STEP 5: Generate Access Token
    This authenticates you to use the MoMo API
    """
    print("\n" + "="*60)
    print("STEP 5: Generating Access Token")
    print("="*60)
    
    url = f"{SANDBOX_URL}/collection/token/"
    
    # Create Basic Auth: base64(apiUserId:apiKey)
    credentials = f"{api_user_id}:{api_key}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()
    
    headers = {
        "Authorization": f"Basic {encoded_credentials}",
        "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
        "Content-Type": "application/json"
    }
    
    print(f"\n📤 Sending POST request to: {url}")
    print(f"Basic Auth (base64): {encoded_credentials}")
    
    try:
        response = requests.post(url, headers=headers, timeout=30)
        
        print(f"\n📥 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            access_token = data.get('access_token')
            expires_in = data.get('expires_in', 3600)
            print("✅ Access Token generated successfully!")
            print(f"\n📋 Token Information:")
            print(f"   Access Token: {access_token[:50]}...")
            print(f"   Expires In: {expires_in} seconds ({expires_in/3600:.1f} hours)")
            return access_token
        else:
            print(f"❌ Failed to generate Access Token: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None


def create_env_file(api_user_id, api_key):
    """
    Create .env file with the credentials
    """
    print("\n" + "="*60)
    print("Creating .env file with credentials")
    print("="*60)
    
    env_content = f"""# MoMo API Configuration
MOMO_API_USER={api_user_id}
MOMO_API_KEY={api_key}
MOMO_SUBSCRIPTION_KEY={SUBSCRIPTION_KEY}
MOMO_ENVIRONMENT=sandbox
MOMO_CALLBACK_URL=http://{CALLBACK_HOST}/api/payments/momo/webhook
"""
    
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    
    try:
        with open(env_path, 'a') as f:
            f.write(env_content)
        print(f"\n✅ Created/Updated .env file: {env_path}")
        print("\n📝 Added:")
        print(f"   MOMO_API_USER={api_user_id}")
        print(f"   MOMO_API_KEY=****")
        print(f"   MOMO_SUBSCRIPTION_KEY={SUBSCRIPTION_KEY}")
        print(f"   MOMO_ENVIRONMENT=sandbox")
    except Exception as e:
        print(f"⚠️  Could not write to .env file: {e}")
        print("\nManually add these to your .env file:")
        print(env_content)


def main():
    print("\n" + "█"*60)
    print("  MoMo API Sandbox Setup")
    print("█"*60)
    
    print(f"\nSubscription Key: {SUBSCRIPTION_KEY}")
    print(f"Sandbox URL: {SANDBOX_URL}")
    print(f"Callback Host: {CALLBACK_HOST}")
    
    # Step 3: Create API User
    api_user_id = step_3_create_api_user()
    if not api_user_id:
        print("\n❌ Setup failed at Step 3")
        return
    
    # Step 4: Generate API Key
    api_key = step_4_generate_api_key(api_user_id)
    if not api_key:
        print("\n❌ Setup failed at Step 4")
        return
    
    # Step 5: Generate Access Token (test)
    access_token = step_5_generate_access_token(api_user_id, api_key)
    if not access_token:
        print("\n❌ Setup failed at Step 5")
        return
    
    # Create .env file
    create_env_file(api_user_id, api_key)
    
    print("\n" + "█"*60)
    print("✅ MoMo API Setup Complete!")
    print("█"*60)
    print("\nNext steps:")
    print("1. Restart your backend server (python run.py)")
    print("2. Go to http://localhost:3000/subscription")
    print("3. Try the payment flow with a test number")
    print("\n")


if __name__ == "__main__":
    main()
