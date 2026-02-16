"""
Simulate sending a signed MoMo webhook to the local backend webhook endpoint.
Usage: set MOMO_SECRET_KEY env var, then run:
  python simulate_momo_webhook.py
"""
import os
import json
import hmac
import hashlib
import requests

WEBHOOK_URL = os.getenv('WEBHOOK_URL', 'http://localhost:5000/api/payments/momo/webhook')
SECRET = os.getenv('MOMO_SECRET_KEY', '')

def make_payload(provider_reference='test-ref-12345', status='completed'):
    return {
        'provider_reference': provider_reference,
        'status': status,
        'metadata': {'test': True}
    }

def sign(body_bytes, secret):
    return hmac.new(secret.encode('utf-8'), body_bytes, hashlib.sha256).hexdigest()

def send_webhook():
    payload = make_payload()
    body = json.dumps(payload).encode('utf-8')
    sig = sign(body, SECRET)

    headers = {
        'Content-Type': 'application/json',
        'X-Momo-Signature': sig
    }

    print('Sending webhook to', WEBHOOK_URL)
    resp = requests.post(WEBHOOK_URL, data=body, headers=headers)
    print('Status:', resp.status_code)
    print(resp.text)

if __name__ == '__main__':
    if not SECRET:
        print('Set MOMO_SECRET_KEY in environment before running the script')
    else:
        send_webhook()
