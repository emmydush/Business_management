MoMo Integration (Mobile Money - MTN)
=====================================

Overview
--------
This project includes a full MTN Mobile Money (MoMo) integration. It supports:
- Generating access tokens
- Initiating payment requests (Request to Pay)
- Checking payment status
- Processing refunds
- Webhook handling for payment notifications

Files added/changed
-------------------
- `app/utils/momo.py` - Full MoMo API integration with token generation, payment requests, and status checking
- `app/utils/payment_integrations.py` - Added MoMoPayment class following the same pattern as Stripe/PayPal
- `app/models/payment.py` - Payment model for recording transactions
- `.env.example` - Updated with required MoMo environment variables
- `requirements.txt` - Added `requests` library

Required Environment Variables
-------------------------------
Get these credentials from https://momodeveloper.mtn.com/

- `MOMO_API_USER` - API User ID from MTN MoMo developer portal
- `MOMO_API_KEY` - API Key from MTN MoMo developer portal
- `MOMO_SUBSCRIPTION_KEY` - Subscription Key for your application
- `MOMO_ENVIRONMENT` - 'sandbox' (testing) or 'production' (live)
- `MOMO_CALLBACK_URL` - Public webhook URL the provider will call
- `MOMO_DEFAULT_PHONE` - Default phone number for testing (optional)

Usage Examples
--------------

### 1. Using the standalone momo.py functions

```python
from app.utils.momo import initiate_momo_payment, check_payment_status, request_to_pay

# Initiate a payment
result = initiate_momo_payment(
    amount=1000,
    phone_number="2507XXXXXXXX",
    metadata={"description": "Subscription payment"}
)
print(result)

# Check payment status
status = check_payment_status(reference_id="your-reference-id")
print(status)
```

### 2. Using the payment processor factory

```python
from app.utils.payment_integrations import get_payment_processor

# Get MoMo payment processor
momo = get_payment_processor('momo')

# Create payment request
result = momo.create_payment_request(
    amount=1000,
    phone_number="2507XXXXXXXX",
    external_id="your-external-id"
)
print(result)

# Check status
status = momo.get_payment_status(reference_id="your-reference-id")
print(status)

# Create refund
refund = momo.create_refund(
    reference_id="original-payment-reference",
    amount=500,
    reason="Customer request"
)
print(refund)
```

Local Testing
-------------
1. Sign up at https://momodeveloper.mtn.com/ to get sandbox credentials
2. Apply the migration `db_migrations/001_create_payments_table.sql` to create the `payments` table
3. Set your environment variables:
   ```
   MOMO_API_USER=your_api_user_id
   MOMO_API_KEY=your_api_key
   MOMO_SUBSCRIPTION_KEY=your_subscription_key
   MOMO_ENVIRONMENT=sandbox
   ```
4. Run the backend and test the integration

API Endpoints
-------------
- `POST /api/subscriptions/<id>/initiate-momo` - Initiate MoMo payment
- `POST /api/payments/momo/webhook` - Receive payment notifications
- `GET /api/payments/momo/status/<reference_id>` - Check payment status

Production Considerations
--------------------------
- Always use HTTPS in production
- Implement signature verification for webhook events
- Add retry logic for failed API calls
- Implement idempotency handling for payment requests
- Monitor API rate limits
- Set up proper error logging and alerting
