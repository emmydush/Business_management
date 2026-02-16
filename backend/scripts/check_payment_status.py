#!/usr/bin/env python3
"""
Check the payment status after webhook processing
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.payment import Payment

app = create_app()

with app.app_context():
    # Find the test payment we created
    payment = Payment.query.filter_by(provider_reference='test-ref-9-12345').first()
    if payment:
        print(f"\n✓ Payment found:")
        print(f"  ID: {payment.id}")
        print(f"  Provider Reference: {payment.provider_reference}")
        print(f"  Status: {payment.status}")
        print(f"  Amount: {payment.amount}")
        print(f"  Provider: {payment.provider}")
        print(f"  Metadata: {payment.meta}")
        print(f"  Created: {payment.created_at}")
        print(f"  Updated: {payment.updated_at}")
    else:
        print("Payment not found")
