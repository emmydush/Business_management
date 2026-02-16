"""
Create a test Payment record in the app database for webhook testing.
Run: python create_test_payment.py
"""
import os
import sys
# Ensure backend package path is resolvable when running this script directly
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app import create_app, db
from app.models.payment import Payment
from app.models.business import Business

app = create_app()

with app.app_context():
    # Get first business or use TEST_BUSINESS_ID
    business_id = int(os.getenv('TEST_BUSINESS_ID', '0'))
    if business_id == 0:
        business = db.session.query(Business).first()
        if not business:
            print("ERROR: No business found in database. Please create a business first.")
            sys.exit(1)
        business_id = business.id
    
    provider_reference = os.getenv('TEST_PROVIDER_REFERENCE', f'test-ref-{business_id}-12345')

    p = Payment(
        business_id=business_id,
        subscription_id=None,
        amount=10.00,
        provider='momo',
        provider_reference=provider_reference,
        status='pending',
        meta={'test': True}
    )

    db.session.add(p)
    db.session.commit()
    print('✓ Created payment id:', p.id, 'provider_reference:', p.provider_reference)
