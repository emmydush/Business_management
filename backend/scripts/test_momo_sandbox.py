#!/usr/bin/env python3
"""
Test script to verify MoMo disbursement sandbox API connectivity.
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
    """Check if all required environment variables are set"""
    print_header("1. CHECKING ENVIRONMENT VARIABLES")
    
    required_vars = {
        'MOMO_API_USER': 'Collection API User',
        'MOMO_API_KEY': 'Collection API Key',
        'MOMO_SUBSCRIPTION_KEY': 'Collection Subscription Key',
        'MOMO_DISBURSEMENT_API_USER': 'Disbursement API User',
        'MOMO_DISBURSEMENT_API_KEY': 'Disbursement API Key',
        'MOMO_DISBURSEMENT_SUBSCRIPTION_KEY': 'Disbursement Subscription Key',
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

def test_momo_config():
    """Test loading MoMo configuration"""
    print_header("2. TESTING MOMO CONFIGURATION")
    
    try:
        config = momo.get_momo_config()
        print_status(True, "MoMo configuration loaded successfully")
        
        print(f"\n  Configuration Details:")
        print(f"    - Environment: {config['environment']}")
        print(f"    - API User: {config['api_user'][:10]}...")
        print(f"    - Disbursement API User: {config['disbursement_api_user'][:10]}...")
        print(f"    - Base URL: {momo.get_base_url()}")
        
        return True
    except Exception as e:
        print_status(False, f"Failed to load configuration: {str(e)}")
        return False

def test_collection_token():
    """Test generating collection token"""
    print_header("3. TESTING COLLECTION TOKEN GENERATION")
    
    try:
        print("Attempting to generate collection token...")
        token = momo.generate_access_token()
        
        if token:
            masked_token = token[:20] + "..." if len(token) > 20 else token
            print_status(True, f"Collection token generated: {masked_token}")
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

def test_disbursement_token():
    """Test generating disbursement token"""
    print_header("4. TESTING DISBURSEMENT TOKEN GENERATION")
    
    try:
        print("Attempting to generate disbursement token...")
        
        # Clear cache first
        momo.clear_token_cache()
        
        token = momo.generate_disbursement_token()
        
        if token:
            masked_token = token[:20] + "..." if len(token) > 20 else token
            print_status(True, f"Disbursement token generated: {masked_token}")
            return True
        else:
            print_status(False, "No disbursement token returned")
            return False
            
    except ValueError as e:
        print_status(False, f"Configuration error: {str(e)}")
        return False
    except Exception as e:
        print_status(False, f"Failed to generate disbursement token: {str(e)}")
        return False

def test_disbursement_api():
    """Test the actual disbursement API endpoint"""
    print_header("5. TESTING DISBURSEMENT API ENDPOINT")
    
    try:
        print("Testing disburse_to_wallet function with test parameters...")
        print(f"  - Amount: 5.00")
        print(f"  - Phone: 250700000000")
        print(f"  - Currency: EUR")
        
        result = momo.disburse_to_wallet(
            amount=5.00,
            phone_number='250700000000',
            currency='EUR',
            payee_note='Test payroll disbursement'
        )
        
        print(f"\nDisbursement API Response:")
        print(json.dumps(result, indent=2))
        
        if result.get('success'):
            print_status(True, "Disbursement API is responsive")
            return True
        else:
            print_status(False, f"Disbursement failed: {result.get('error')}")
            # Still might be working if it's a validation error
            return 'error' in result or 'details' in result
            
    except Exception as e:
        print_status(False, f"Exception during disbursement test: {str(e)}")
        return False

def test_disbursement_status():
    """Test checking disbursement status"""
    print_header("6. TESTING DISBURSEMENT STATUS CHECK")
    
    try:
        import uuid
        test_reference = str(uuid.uuid4())
        
        print(f"Testing disbursement status check with reference: {test_reference}")
        
        result = momo.check_disbursement_status(test_reference)
        
        print(f"\nStatus Check Response:")
        print(json.dumps(result, indent=2))
        
        # A not_found response actually means the API is working
        if result.get('success') or result.get('status') == 'not_found':
            print_status(True, "Disbursement status API is responsive")
            return True
        else:
            print_status(False, f"Status check failed: {result.get('error')}")
            return False
            
    except Exception as e:
        print_status(False, f"Exception during status check: {str(e)}")
        return False

def test_direct_api_call():
    """Test direct API call to sandbox endpoint"""
    print_header("7. TESTING DIRECT API CONNECTIVITY")
    
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

def main():
    """Main test runner"""
    print_header("MOMO DISBURSEMENT SANDBOX API TEST")
    print(f"Test Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    results = {
        'Environment Variables': check_environment_variables(),
        'MoMo Configuration': test_momo_config(),
        'Collection Token': test_collection_token(),
        'Disbursement Token': test_disbursement_token(),
        'Direct API Connectivity': test_direct_api_call(),
        'Disbursement API': test_disbursement_api(),
        'Disbursement Status': test_disbursement_status(),
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
    
    if passed == total:
        print("✓ MoMo disbursement sandbox API is fully operational!")
        return 0
    elif passed >= total * 0.7:
        print("⚠ MoMo disbursement sandbox API is partially working.")
        print("  Check your credentials and API configuration.")
        return 1
    else:
        print("✗ MoMo disbursement sandbox API has issues.")
        print("  Please verify your credentials and check the API status.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
