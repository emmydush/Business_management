#!/usr/bin/env python3
"""
Check if the webhook endpoint exists in the Flask app
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app

app = create_app()

# List all registered routes
print("Registered routes in the Flask app:")
print("=" * 80)
for rule in app.url_map.iter_rules():
    if 'webhook' in rule.rule or 'payment' in rule.rule or 'momo' in rule.rule:
        print(f"{rule.rule} -> {rule.methods}")

print("\n\nLooking for /api/subscriptions routes:")
print("=" * 80)
for rule in app.url_map.iter_rules():
    if '/api/subscriptions' in rule.rule:
        print(f"{rule.rule} -> {rule.methods}")
