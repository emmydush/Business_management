#!/usr/bin/env python3
"""
Simulate sending a signed MoMo webhook to the local backend webhook endpoint.
This version loads MOMO_SECRET_KEY from .env file.
Usage: python simulate_momo_webhook_with_env.py
"""
import os
import sys
import json
import hmac
import hashlib
import requests
from dotenv import load_dotenv

# Load .env file
load_dotenv()

WEBHOOK_URL = os.getenv('WEBHOOK_URL', 'http://localhost:5000/api/subscriptions/payments/momo/webhook')
SECRET = os.getenv('MOMO_SECRET_KEY', '')

def make_payload(provider_reference='test-ref-9-12345', status='completed'):
    """Create a webhook payload with the test payment reference"""
    return {
        'provider_reference': provider_reference,
        'status': status,
        'metadata': {'test': True}
    }

def sign(body_bytes, secret):
    """Sign the payload using HMAC-SHA256"""
    return hmac.new(secret.encode('utf-8'), body_bytes, hashlib.sha256).hexdigest()

def send_webhook():
    """Send the signed webhook to the backend"""
    payload = make_payload()
    body = json.dumps(payload).encode('utf-8')
    sig = sign(body, SECRET)

    headers = {
        'Content-Type': 'application/json',
        'X-Momo-Signature': sig
    }

    print(f'Sending webhook to {WEBHOOK_URL}')
    print(f'Payload: {json.dumps(payload, indent=2)}')
    print(f'Signature: {sig}')
    
    try:
        resp = requests.post(WEBHOOK_URL, data=body, headers=headers)
        print(f'\nStatus: {resp.status_code}')
        print(f'Response: {resp.text}')
        return resp.status_code == 200
    except Exception as e:
        print(f'ERROR: {e}')
        return False

if __name__ == '__main__':
    if not SECRET:
        print('ERROR: MOMO_SECRET_KEY not set in environment or .env file')
        sys.exit(1)
    
    success = send_webhook()
    sys.exit(0 if success else 1)
