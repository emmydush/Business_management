#!/usr/bin/env python3
"""
Test script to verify MoMo API is working.
Tests token generation and optionally a payment request.
"""

import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

# Import MoMo utilities
from app.utils.momo import (
    get_momo_config,
    generate_access_token,
    get_access_token,
    request_to_pay,
    check_payment_status,
    clear_token_cache
)

def test_momo_config():
    """Test 1: Check if MoMo configuration is loaded."""
    print("=" * 60)
    print("TEST 1: Checking MoMo Configuration")
    print("=" * 60)
    
    config = get_momo_config()
    
    print(f"API User: {config['api_user'][:20]}..." if config['api_user'] else "API User: NOT SET")
    print(f"API Key: {config['api_key'][:20]}..." if config['api_key'] else "API Key: NOT SET")
    print(f"Subscription Key: {config['subscription_key'][:20]}..." if config['subscription_key'] else "Subscription Key: NOT SET")
    print(f"Environment: {config['environment']}")
    print(f"Callback URL: {config['callback_url']}")
    
    # Validate
    if not config['api_user'] or not config['api_key'] or not config['subscription_key']:
        print("\n❌ FAILED: Missing required MoMo credentials")
        return False
    
    print("\n✅ PASSED: Configuration is present")
    return True


def test_token_generation():
    """Test 2: Test access token generation."""
    print("\n" + "=" * 60)
    print("TEST 2: Testing Access Token Generation")
    print("=" * 60)
    
    # Clear any cached tokens
    clear_token_cache()
    
    try:
        print("Attempting to generate access token...")
        token = generate_access_token()
        
        if token:
            print(f"Access Token: {token[:30]}...")
            print("\n✅ PASSED: Successfully generated access token")
            return True
        else:
            print("\n❌ FAILED: No token returned")
            return False
            
    except Exception as e:
        print(f"\n❌ FAILED: {str(e)}")
        return False


def test_payment_request():
    """Test 3: Test payment request (Request to Pay)."""
    print("\n" + "=" * 60)
    print("TEST 3: Testing Payment Request (Request to Pay)")
    print("=" * 60)
    
    # Use a test phone number (sandbox usually requires specific test numbers)
    # For MTN Sandbox, you can use: 250700000001 - 250700000010
    test_phone = "250700000001"
    test_amount = "10"  # Small test amount
    
    print(f"Phone Number: {test_phone}")
    print(f"Amount: {test_amount} EUR")
    
    try:
        result = request_to_pay(
            amount=test_amount,
            phone_number=test_phone,
            payer_message="Test payment from API check",
            payee_note="API Test"
        )
        
        print(f"\nResult: {result}")
        
        if result.get('success'):
            print(f"\n✅ PASSED: Payment request initiated successfully")
            print(f"   Reference ID: {result.get('reference_id')}")
            print(f"   External ID: {result.get('external_id')}")
            print(f"   Status: {result.get('status')}")
            return result
        else:
            print(f"\n⚠️ WARNING: Payment request failed or pending")
            print(f"   Error: {result.get('error', 'Unknown')}")
            print(f"   Details: {result.get('details', 'N/A')}")
            return None
            
    except Exception as e:
        print(f"\n❌ FAILED: {str(e)}")
        return None


def test_payment_status(reference_id):
    """Test 4: Test payment status check."""
    print("\n" + "=" * 60)
    print("TEST 4: Testing Payment Status Check")
    print("=" * 60)
    
    if not reference_id:
        print("No reference ID provided, skipping test")
        return None
    
    print(f"Reference ID: {reference_id}")
    
    try:
        result = check_payment_status(reference_id)
        
        print(f"\nResult: {result}")
        
        if result.get('success'):
            print(f"\n✅ PASSED: Successfully retrieved payment status")
            print(f"   Status: {result.get('status')}")
            print(f"   Amount: {result.get('amount')}")
            print(f"   Currency: {result.get('currency')}")
            return result
        else:
            print(f"\n⚠️ INFO: Status check response: {result.get('error', 'Unknown')}")
            return result
            
    except Exception as e:
        print(f"\n❌ FAILED: {str(e)}")
        return None


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("       MTN MoMo API Integration Test")
    print("=" * 60)
    
    all_passed = True
    
    # Test 1: Configuration
    if not test_momo_config():
        all_passed = False
        print("\n" + "=" * 60)
        print("STOPPED: Configuration test failed")
        print("=" * 60)
        return
    
    # Test 2: Token Generation
    if not test_token_generation():
        all_passed = False
        print("\n" + "=" * 60)
        print("STOPPED: Token generation failed")
        print("=" * 60)
        return
    
    # Test 3: Payment Request (optional - might require specific test user)
    payment_result = test_payment_request()
    
    # Test 4: Payment Status (if we got a reference ID)
    if payment_result and payment_result.get('reference_id'):
        test_payment_status(payment_result.get('reference_id'))
    
    # Summary
    print("\n" + "=" * 60)
    print("       TEST SUMMARY")
    print("=" * 60)
    
    if all_passed:
        print("✅ All critical tests passed!")
        print("\nThe MoMo API is configured and working.")
        print("Note: For sandbox, payment requests may need test phone numbers")
        print("from https://momodeveloper.mtn.com/")
    else:
        print("❌ Some tests failed. Please check the configuration.")
    
    print("=" * 60)


if __name__ == "__main__":
    main()
