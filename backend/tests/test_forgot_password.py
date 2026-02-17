#!/usr/bin/env python3
"""
Test script to verify forgot password functionality
Run this from the backend directory: python test_forgot_password.py
"""
import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:5000/api"

def test_forgot_password():
    """Test the forgot password endpoint"""
    print("=" * 60)
    print("Testing Forgot Password Functionality")
    print("=" * 60)
    
    # Test 1: Forgot password with valid email
    print("\n[Test 1] Forgot password with valid email...")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/forgot-password",
            json={"email": "admin@test.com"},
            headers={"Content-Type": "application/json"}
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✓ Test 1 PASSED: Forgot password request processed successfully")
        else:
            print("✗ Test 1 FAILED: Unexpected status code")
    except Exception as e:
        print(f"✗ Test 1 ERROR: {str(e)}")
    
    # Test 2: Forgot password with invalid/non-existent email
    print("\n[Test 2] Forgot password with non-existent email...")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/forgot-password",
{