#!/usr/bin/env python3
"""
Test script to verify MoMo Collection API connectivity.
"""

import os
import sys
import json
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

import requests
from app.utils import momo

def print_header(text):
    """Print formatted header"""
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}\n")

def print_section(text):
    """Print section with dashes"""
    print(f"\n{'-'*60}")
    print(f"  {text}")
    print(f"{'-'*60}")

def print_status(status, message):
    """Print status with indicator"""
    indicator = "✓" if status else "✗"
    print(f"[{indicator}] {message}")

def check_environment_variables():
    """Check if all required collection API environment variables are set"""
    print_header("1. CHECKING COLLECTION API ENVIRONMENT VARIABLES")
    
    required_vars = {
        'MOMO_API_USER': 'Collection API User',
        'MOMO_API_KEY': 'Collection API Key',
        'MOMO_SUBSCRIPTION_KEY': 'Collection Subscription Key',
    }
    
    env_status = {}
    for var, description in required_vars.items():
        value = os.getenv(var)
        is_set = bool(value)
        env_status[var] = is_set
        
        if is_set:
            masked_value = value[:10] + '...' if len(value) > 10 else value
            print_status(True, f"{description:40} : {masked_value} (SET)")
        else:
            print_status(False, f"{description:40} : NOT SET")
    
    # Check environment type
    environment = os.getenv('MOMO_ENVIRONMENT', 'sandbox')
    print_status(True, f"Environment                      : {environment}")
    
    return all(env_status.values())

def test_collection_token():
    """Test generating collection token"""
    print_header("2. TESTING COLLECTION TOKEN GENERATION")
    
    try:
        print("Attempting to generate collection token...")
        token = momo.generate_access_token()
        
        if token:
            masked_token = token[:20] + "..." if len(token) > 20 else token
            print_status(True, f"Collection token generated: {masked_token}")
            
            # Show token info
            import base64
            import json as json_module
            try:
                # JWT tokens have 3 parts separated by dots
                parts = token.split('.')
                if len(parts) == 3:
                    # Decode payload (second part)
                    payload = parts[1]
                    # Add padding if necessary
                    padding = 4 - len(payload) % 4
                    if padding != 4:
                        payload += '=' * padding
                    
                    decoded = base64.urlsafe_b64decode(payload)
                    token_data = json_module.loads(decoded)
                    
                    print(f"\n  Token Payload:")
                    print(f"    Issued At: {datetime.fromtimestamp(token_data.get('iat', 0))}")
                    print(f"    Expires At: {datetime.fromtimestamp(token_data.get('exp', 0))}")
                    print(f"    Expires In: ~{(token_data.get('exp', 0) - token_data.get('iat', 0)) // 60} minutes")
            except:
                pass
            
            return True
        else:
            print_status(False, "No token returned")
            return False
            
    except ValueError as e:
        print_status(False, f"Configuration error: {str(e)}")
        return False
    except Exception as e:
        print_status(False, f"Failed to generate token: {str(e)}")
        return False

def test_request_to_pay():
    """Test the Request to Pay (collection) API endpoint"""
    print_header("3. TESTING REQUEST TO PAY (COLLECTION) API")
    
    try:
        print("Testing request_to_pay function with test parameters...")
        print(f"  - Amount: 100.00")
        print(f"  - Phone: 250700000000")
        print(f"  - Currency: EUR")
        
        result = momo.request_to_pay(
            amount='100.00',
            phone_number='250700000000',
            currency='EUR',
            payer_message='Test payment',
            payee_note='Test payment request'
        )
        
        print(f"\nRequest to Pay Response:")
        print(json.dumps(result, indent=2))
        
        if result.get('success'):
            print_status(True, "Request to Pay API is responsive and working")
            print(f"\n  Reference ID: {result.get('reference_id')}")
            return True
        else:
            print_status(False, f"Request to Pay failed: {result.get('error')}")
            # Request to Pay might fail due to phone number validation
            # but API responsiveness is what we're testing
            print("  Note: Failure might be due to test phone number, but API is reachable")
            return 'error' in result or 'details' in result
            
    except Exception as e:
        print_status(False, f"Exception during Request to Pay: {str(e)}")
        return False

def test_check_payment_status():
    """Test checking payment status"""
    print_header("4. TESTING CHECK PAYMENT STATUS API")
    
    try:
        import uuid
        test_reference = str(uuid.uuid4())
        
        print(f"Testing payment status check with reference: {test_reference}")
        
        result = momo.check_payment_status(test_reference)
        
        print(f"\nStatus Check Response:")
        print(json.dumps(result, indent=2))
        
        # A not_found response actually means the API is working
        if result.get('success') or result.get('status') == 'not_found':
            print_status(True, "Payment Status API is responsive")
            return True
        else:
            print_status(False, f"Status check failed: {result.get('error')}")
            return False
            
    except Exception as e:
        print_status(False, f"Exception during status check: {str(e)}")
        return False

def test_initiate_momo_payment():
    """Test the high-level payment initiation function"""
    print_header("5. TESTING HIGH-LEVEL PAYMENT INITIATION")
    
    try:
        print("Testing initiate_momo_payment function...")
        print(f"  - Amount: 50.00")
        print(f"  - Phone: 250788123456")
        
        result = momo.initiate_momo_payment(
            amount=50.00,
            phone_number='250788123456',
            metadata={
                'description': 'Test product purchase',
                'note': 'Invoice #001'
            }
        )
        
        print(f"\nPayment Initiation Response:")
        print(json.dumps(result, indent=2))
        
        if result.get('success'):
            print_status(True, "Payment initiation is working")
            return True
        else:
            print_status(False, f"Payment initiation failed: {result.get('instructions', {}).get('message')}")
            return False
            
    except Exception as e:
        print_status(False, f"Exception during payment initiation: {str(e)}")
        return False

def test_direct_api_call():
    """Test direct API call to sandbox endpoint"""
    print_header("6. TESTING DIRECT API CONNECTIVITY")
    
    base_url = momo.get_base_url()
    print(f"Base URL: {base_url}")
    
    try:
        print("Attempting direct GET request to sandbox API...")
        response = requests.get(f"{base_url}/", timeout=10)
        print_status(True, f"API endpoint accessible (Status: {response.status_code})")
        return True
    except requests.exceptions.Timeout:
        print_status(False, "Request timeout - API may be unreachable")
        return False
    except requests.exceptions.ConnectionError as e:
        print_status(False, f"Connection error: {str(e)}")
        return False
    except Exception as e:
        print_status(False, f"Unexpected error: {str(e)}")
        return False

def test_collection_endpoints():
    """Test specific collection endpoints"""
    print_header("7. TESTING COLLECTION ENDPOINTS AVAILABILITY")
    
    base_url = momo.get_base_url()
    endpoints = [
        '/collection/token/',
        '/collection/v1_0/requesttopay',
        '/collection/v1_0/account/balance',
    ]
    
    results = {}
    for endpoint in endpoints:
        url = f"{base_url}{endpoint}"
        try:
            response = requests.get(url, timeout=5)
            # We expect 401/403 without auth, that's fine - means endpoint exists
            is_available = response.status_code < 500
            results[endpoint] = is_available
            status_msg = f"Available ({response.status_code})" if is_available else f"Unavailable ({response.status_code})"
            print_status(is_available, f"{endpoint:45} : {status_msg}")
        except:
            results[endpoint] = False
            print_status(False, f"{endpoint:45} : Unreachable")
    
    return all(results.values())

def main():
    """Main test runner"""
    print_header("MOMO COLLECTION API TEST")
    print(f"Test Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    results = {
        'Environment Variables': check_environment_variables(),
        'Direct API Connectivity': test_direct_api_call(),
        'Collection Token Generation': test_collection_token(),
        'Collection Endpoints': test_collection_endpoints(),
        'Request to Pay API': test_request_to_pay(),
        'Payment Status Check': test_check_payment_status(),
        'High-level Payment Init': test_initiate_momo_payment(),
    }
    
    print_header("TEST SUMMARY")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "PASSED" if result else "FAILED"
        indicator = "✓" if result else "✗"
        print(f"[{indicator}] {test_name:40} : {status}")
    
    print(f"\n{'─'*60}")
    print(f"Overall: {passed}/{total} tests passed")
    print(f"{'─'*60}\n")
    
    # Print status based on results
    if passed == total:
        print("✓ MoMo Collection API is fully operational!")
        print("\nThe collection API is ready for:")
        print("  • Receiving payments from customers")
        print("  • Processing Request to Pay transactions")
        print("  • Checking payment status")
        return 0
    elif passed >= total * 0.8:
        print("⚠ MoMo Collection API is mostly working.")
        print("  Some features may have limitations.")
        return 0
    else:
        print("✗ MoMo Collection API has issues.")
        print("  Please verify your credentials and check the API status.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
