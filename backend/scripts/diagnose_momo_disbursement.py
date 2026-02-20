#!/usr/bin/env python3
"""
Detailed diagnostic script for MoMo disbursement API credentials.
"""

import os
import sys
import json
import base64
import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

def print_header(text):
    print(f"\n{'='*70}")
    print(f"  {text}")
    print(f"{'='*70}\n")

def print_divider():
    print(f"\n{'-'*70}\n")

def diagnose_disbursement_credentials():
    """Diagnose disbursement credentials"""
    print_header("MOMO DISBURSEMENT CREDENTIALS DIAGNOSTIC")
    
    # Get credentials
    disbursement_api_user = os.getenv('MOMO_DISBURSEMENT_API_USER', os.getenv('MOMO_API_USER', ''))
    disbursement_api_key = os.getenv('MOMO_DISBURSEMENT_API_KEY', os.getenv('MOMO_API_KEY', ''))
    disbursement_sub_key = os.getenv('MOMO_DISBURSEMENT_SUBSCRIPTION_KEY', os.getenv('MOMO_SUBSCRIPTION_KEY', ''))
    
    collection_api_user = os.getenv('MOMO_API_USER', '')
    collection_api_key = os.getenv('MOMO_API_KEY', '')
    collection_sub_key = os.getenv('MOMO_SUBSCRIPTION_KEY', '')
    
    print("CONFIGURED CREDENTIALS:")
    print(f"  Disbursement API User: {disbursement_api_user[:20]}..." if disbursement_api_user else "  Disbursement API User: NOT SET")
    print(f"  Disbursement API Key: {disbursement_api_key[:20]}..." if disbursement_api_key else "  Disbursement API Key: NOT SET")
    print(f"  Disbursement Sub Key: {disbursement_sub_key[:20]}..." if disbursement_sub_key else "  Disbursement Sub Key: NOT SET")
    
    print_divider()
    print("COLLECTION CREDENTIALS (for comparison):")
    print(f"  Collection API User: {collection_api_user[:20]}..." if collection_api_user else "  Collection API User: NOT SET")
    print(f"  Collection API Key: {collection_api_key[:20]}..." if collection_api_key else "  Collection API Key: NOT SET")
    print(f"  Collection Sub Key: {collection_sub_key[:20]}..." if collection_sub_key else "  Collection Sub Key: NOT SET")
    
    print_divider()
    print("CREDENTIAL COMPARISON:")
    
    if disbursement_api_user == collection_api_user:
        print("  ⚠ Disbursement API User is SAME as Collection API User")
    else:
        print("  ✓ Disbursement API User is DIFFERENT from Collection API User")
    
    if disbursement_api_key == collection_api_key:
        print("  ⚠ Disbursement API Key is SAME as Collection API Key")
    else:
        print("  ✓ Disbursement API Key is DIFFERENT from Collection API Key")
    
    if disbursement_sub_key == collection_sub_key:
        print("  ⚠ Disbursement Subscription Key is SAME as Collection Subscription Key")
    else:
        print("  ✓ Disbursement Subscription Key is DIFFERENT from Collection Subscription Key")
    
    return {
        'disbursement_user': disbursement_api_user,
        'disbursement_key': disbursement_api_key,
        'disbursement_sub': disbursement_sub_key,
        'collection_user': collection_api_user,
        'collection_key': collection_api_key,
        'collection_sub': collection_sub_key,
    }

def test_disbursement_token_with_details(creds):
    """Test disbursement token generation with detailed error info"""
    print_header("TESTING DISBURSEMENT TOKEN WITH DETAILED DIAGNOSTICS")
    
    base_url = "https://sandbox.momodeveloper.mtn.com"
    url = f"{base_url}/disbursement/token/"
    
    print(f"URL: {url}")
    
    # Create Basic Auth
    credentials = f"{creds['disbursement_user']}:{creds['disbursement_key']}"
    encoded = base64.b64encode(credentials.encode()).decode()
    
    print(f"\nBasic Auth Credentials:")
    print(f"  User: {creds['disbursement_user']}")
    print(f"  Key: {creds['disbursement_key'][:20]}...")
    print(f"  Encoded: {encoded[:30]}...")
    
    headers = {
        "Authorization": f"Basic {encoded}",
        "Ocp-Apim-Subscription-Key": creds['disbursement_sub']
    }
    
    print(f"\nHeaders:")
    print(f"  Authorization: Basic {encoded[:30]}...")
    print(f"  Ocp-Apim-Subscription-Key: {creds['disbursement_sub'][:20]}...")
    
    try:
        print(f"\nSending request...")
        response = requests.post(url, headers=headers, timeout=10)
        
        print(f"\nRESPONSE:")
        print(f"  Status Code: {response.status_code}")
        print(f"  Reason: {response.reason}")
        
        print(f"\nResponse Headers:")
        for key, value in response.headers.items():
            print(f"  {key}: {value}")
        
        print(f"\nResponse Body:")
        try:
            data = response.json()
            print(json.dumps(data, indent=2))
        except:
            print(response.text[:500])
        
        # Analyze response
        print_divider()
        print("ANALYSIS:")
        
        if response.status_code == 200:
            print("  ✓ Disbursement token generation is WORKING")
        elif response.status_code == 401:
            print("  ✗ Authentication failed (401)")
            print("    - Invalid API user or API key")
            print("    - Check MOMO_DISBURSEMENT_API_USER and MOMO_DISBURSEMENT_API_KEY")
        elif response.status_code == 403:
            print("  ✗ Access forbidden (403)")
            print("    - Invalid subscription key or no disbursement permission")
            print("    - Check MOMO_DISBURSEMENT_SUBSCRIPTION_KEY")
            print("    - Verify this API user has disbursement module enabled")
        elif response.status_code == 404:
            print("  ✗ Endpoint not found (404)")
            print("    - The disbursement endpoint may not be available")
        elif response.status_code >= 500:
            print("  ✗ Server error")
            print("    - MoMo API server may be temporarily unavailable")
        else:
            print(f"  ✗ Unexpected status code: {response.status_code}")
        
    except requests.exceptions.Timeout:
        print("  ✗ Request timeout - API unreachable")
    except requests.exceptions.ConnectionError as e:
        print(f"  ✗ Connection error: {e}")
    except Exception as e:
        print(f"  ✗ Exception: {str(e)}")

def test_collection_token_for_comparison(creds):
    """Test collection token for comparison"""
    print_header("TESTING COLLECTION TOKEN (for comparison)")
    
    base_url = "https://sandbox.momodeveloper.mtn.com"
    url = f"{base_url}/collection/token/"
    
    print(f"URL: {url}")
    
    credentials = f"{creds['collection_user']}:{creds['collection_key']}"
    encoded = base64.b64encode(credentials.encode()).decode()
    
    print(f"\nBasic Auth Credentials:")
    print(f"  User: {creds['collection_user']}")
    print(f"  Key: {creds['collection_key'][:20]}...")
    
    headers = {
        "Authorization": f"Basic {encoded}",
        "Ocp-Apim-Subscription-Key": creds['collection_sub']
    }
    
    try:
        print(f"\nSending request...")
        response = requests.post(url, headers=headers, timeout=10)
        
        print(f"\nRESPONSE:")
        print(f"  Status Code: {response.status_code}")
        print(f"  Reason: {response.reason}")
        
        if response.status_code == 200:
            print("  ✓ Collection token generation is WORKING")
            data = response.json()
            token = data.get('access_token', '')
            print(f"  Token: {token[:30]}...")
        elif response.status_code == 401:
            print("  ✗ Collection token auth failed (401)")
        else:
            print(f"  ✗ Collection token failed with status {response.status_code}")
        
    except Exception as e:
        print(f"  ✗ Exception: {str(e)}")

def print_recommendations():
    """Print recommendations"""
    print_header("RECOMMENDATIONS TO FIX DISBURSEMENT API")
    
    print("""
1. VERIFY DISBURSEMENT API CREDENTIALS:
   - Go to https://momodeveloper.mtn.com/
   - Login with your account
   - Navigate to "Products" or "Applications"
   - Make sure you have a DISBURSEMENT API application/product
   - Verify the API User, API Key, and Subscription Key for disbursement
   - These are DIFFERENT from collection credentials

2. SEPARATE CREDENTIALS:
   - Collection API: Used for receiving payments (Request to Pay)
   - Disbursement API: Used for sending payments (Payouts)
   - You MUST have separate applications registered for each

3. UPDATE ENVIRONMENT VARIABLES:
   - Set MOMO_DISBURSEMENT_API_USER with your disbursement API user
   - Set MOMO_DISBURSEMENT_API_KEY with your disbursement API key
   - Set MOMO_DISBURSEMENT_SUBSCRIPTION_KEY with your disbursement subscription key
   - These should be different from the collection credentials

4. TEST AGAIN:
   - After updating .env file, run this script again
   - Verify both collection and disbursement tokens work

5. IF STILL FAILING:
   - Check if your MTN MoMo account has disbursement module enabled
   - Contact MTN MoMo support: https://momodeveloper.mtn.com/
   - Verify your account is not in sandbox-only mode

6. ALTERNATIVE APPROACH:
   - You can initially set disbursement credentials same as collection
   - While testing functionality, then upgrade to production later
   - But this may have limitations in what operations are allowed
    """)

def main():
    print("\n" + "="*70)
    print("  MoMo Disbursement API Credential Diagnostic Tool")
    print("="*70)
    
    # Get credentials
    creds = diagnose_disbursement_credentials()
    
    # Test disbursement token with details
    test_disbursement_token_with_details(creds)
    
    # Test collection token for comparison
    test_collection_token_for_comparison(creds)
    
    # Print recommendations
    print_recommendations()
    
    print("\n" + "="*70)
    print("  End of Diagnostic Report")
    print("="*70 + "\n")

if __name__ == '__main__':
    main()
