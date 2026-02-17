"""
Payment Integration Module for Stripe and PayPal
"""
import os
import requests
import uuid
from datetime import datetime
from flask import jsonify

# Stripe Integration
class StripePayment:
    def __init__(self):
        self.api_key = os.getenv('STRIPE_SECRET_KEY')
        self.api_version = '2023-10-16'
        self.base_url = 'https://api.stripe.com/v1'
    
    def _headers(self):
        return {
            'Authorization': f'Bearer {self.api_key}',
            'Stripe-Version': self.api_version
        }
    
    def create_customer(self, email, name, business_id):
        """Create a Stripe customer"""
        data = {
            'email': email,
            'name': name,
            'metadata[business_id]': str(business_id)
        }
        response = requests.post(f'{self.base_url}/customers', data=data, headers=self._headers())
        return response.json() if response.status_code == 200 else None
    
    def create_payment_intent(self, amount, currency, customer_id=None, metadata=None):
        """Create a payment intent"""
        data = {
            'amount': int(amount * 100),  # Convert to cents
            'currency': currency.lower(),
            'metadata[business_id]': str(metadata.get('business_id', '')) if metadata else {}
        }
        if customer_id:
            data['customer'] = customer_id
        
        if metadata:
            data['metadata'].update(metadata)
        
        response = requests.post(f'{self.base_url}/payment_intents', data=data, headers=self._headers())
        return response.json() if response.status_code == 200 else None
    
    def confirm_payment_intent(self, payment_intent_id):
        """Confirm a payment intent"""
        response = requests.post(f'{self.base_url}/payment_intents/{payment_intent_id}/confirm', headers=self._headers())
        return response.json() if response.status_code == 200 else None
    
    def get_payment_intent(self, payment_intent_id):
        """Get payment intent details"""
        response = requests.get(f'{self.base_url}/payment_intents/{payment_intent_id}', headers=self._headers())
        return response.json() if response.status_code == 200 else None
    
    def create_refund(self, payment_intent_id, amount=None):
        """Create a refund"""
        data = {'payment_intent': payment_intent_id}
        if amount:
            data['amount'] = int(amount * 100)
        
        response = requests.post(f'{self.base_url}/refunds', data=data, headers=self._headers())
        return response.json() if response.status_code == 200 else None
    
    def create_subscription(self, customer_id, price_id):
        """Create a subscription"""
        data = {
            'customer': customer_id,
            'items[0][price]': price_id
        }
        response = requests.post(f'{self.base_url}/subscriptions', data=data, headers=self._headers())
        return response.json() if response.status_code == 200 else None
    
    def cancel_subscription(self, subscription_id):
        """Cancel a subscription"""
        response = requests.post(f'{self.base_url}/subscriptions/{subscription_id}/cancel', headers=self._headers())
        return response.json() if response.status_code == 200 else None
    
    def get_invoice(self, invoice_id):
        """Get invoice details"""
        response = requests.get(f'{self.base_url}/invoices/{invoice_id}', headers=self._headers())
        return response.json() if response.status_code == 200 else None
    
    def create_checkout_session(self, line_items, success_url, cancel_url, customer_id=None):
        """Create a checkout session"""
        data = {
            'mode': 'payment',
            'line_items[0][price_data][currency]': line_items[0].get('currency', 'usd'),
            'line_items[0][price_data][product_data][name]': line_items[0].get('name', 'Product'),
            'line_items[0][price_data][unit_amount]': int(line_items[0].get('amount', 0) * 100),
            'line_items[0][quantity]': line_items[0].get('quantity', 1),
            'success_url': success_url,
            'cancel_url': cancel_url
        }
        if customer_id:
            data['customer'] = customer_id
        
        response = requests.post(f'{self.base_url}/checkout/sessions', data=data, headers=self._headers())
        return response.json() if response.status_code == 200 else None


# PayPal Integration
class PayPalPayment:
    def __init__(self):
        self.client_id = os.getenv('PAYPAL_CLIENT_ID')
        self.client_secret = os.getenv('PAYPAL_CLIENT_SECRET')
        self.mode = os.getenv('PAYPAL_MODE', 'sandbox')
        self.base_url = 'https://api-m.sandbox.paypal.com' if self.mode == 'sandbox' else 'https://api-m.paypal.com'
        self.access_token = None
    
    def _get_access_token(self):
        """Get OAuth access token"""
        if self.access_token:
            return self.access_token
        
        auth = (self.client_id, self.client_secret)
        response = requests.post(
            f'{self.base_url}/v1/oauth2/token',
            data={'grant_type': 'client_credentials'},
            auth=auth
        )
        if response.status_code == 200:
            self.access_token = response.json().get('access_token')
            return self.access_token
        return None
    
    def _headers(self):
        token = self._get_access_token()
        return {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def create_order(self, amount, currency, description, metadata=None):
        """Create a PayPal order"""
        data = {
            'intent': 'CAPTURE',
            'purchase_units': [{
                'reference_id': str(uuid.uuid4()),
                'description': description,
                'amount': {
                    'currency_code': currency.upper(),
                    'value': f'{amount:.2f}'
                }
            }]
        }
        
        if metadata:
            data['purchase_units'][0]['custom_id'] = str(metadata)
        
        response = requests.post(f'{self.base_url}/v2/checkout/orders', json=data, headers=self._headers())
        return response.json() if response.status_code in [200, 201] else None
    
    def capture_order(self, order_id):
        """Capture a PayPal order"""
        response = requests.post(f'{self.base_url}/v2/checkout/orders/{order_id}/capture', json={}, headers=self._headers())
        return response.json() if response.status_code in [200, 201] else None
    
    def get_order(self, order_id):
        """Get order details"""
        response = requests.get(f'{self.base_url}/v2/checkout/orders/{order_id}', headers=self._headers())
        return response.json() if response.status_code == 200 else None
    
    def refund_capture(self, capture_id, amount=None, reason=None):
        """Refund a capture"""
        data = {}
        if amount:
            data['amount'] = {
                'value': f'{amount:.2f}',
                'currency_code': 'USD'  # Would need to track original currency
            }
        if reason:
            data['note_to_payer'] = reason
        
        response = requests.post(f'{self.base_url}/v2/payments/captures/{capture_id}/refund', json=data if data else {}, headers=self._headers())
        return response.json() if response.status_code in [200, 201] else None
    
    def create_subscription(self, plan_id, subscriber, start_time):
        """Create a PayPal subscription"""
        data = {
            'plan_id': plan_id,
            'subscriber': subscriber,
            'start_time': start_time
        }
        response = requests.post(f'{self.base_url}/v1/billing/subscriptions', json=data, headers=self._headers())
        return response.json() if response.status_code in [200, 201] else None
    
    def cancel_subscription(self, subscription_id, reason):
        """Cancel a subscription"""
        data = {'reason': reason}
        response = requests.post(f'{self.base_url}/v1/billing/subscriptions/{subscription_id}/cancel', json=data, headers=self._headers())
        return response.status_code == 204
    
    def get_subscription(self, subscription_id):
        """Get subscription details"""
        response = requests.get(f'{self.base_url}/v1/billing/subscriptions/{subscription_id}', headers=self._headers())
        return response.json() if response.status_code == 200 else None


# Payment Factory
def get_payment_processor(processor):
    """Get payment processor instance"""
    if processor.lower() == 'stripe':
        return StripePayment()
    elif processor.lower() == 'paypal':
        return PayPalPayment()
    else:
        raise ValueError(f'Unknown payment processor: {processor}')


# Payment Record Model (to be added to models)
class PaymentTransaction:
    """In-app payment transaction record"""
    
    @staticmethod
    def create_record(db, business_id, payment_type, amount, currency, 
                     processor, transaction_id, status, metadata=None):
        """Create a payment transaction record"""
        from app.models.payment import Payment
        
        payment = Payment(
            business_id=business_id,
            payment_type=payment_type,
            amount=amount,
            currency=currency,
            payment_method=processor,
            transaction_id=transaction_id,
            status=status,
            payment_date=datetime.utcnow(),
            notes=str(metadata) if metadata else None
        )
        
        db.session.add(payment)
        db.session.commit()
        return payment
    
    @staticmethod
    def record_successful_payment(db, business_id, amount, currency, 
                                  processor, transaction_id, order_id=None,
                                  customer_id=None, metadata=None):
        """Record a successful payment"""
        return PaymentTransaction.create_record(
            db, business_id, 'sale', amount, currency,
            processor, transaction_id, 'completed', metadata
        )
    
    @staticmethod
    def record_failed_payment(db, business_id, amount, currency,
                             processor, transaction_id, error_message,
                             metadata=None):
        """Record a failed payment"""
        return PaymentTransaction.create_record(
            db, business_id, 'sale', amount, currency,
            processor, transaction_id, 'failed', metadata
        )


# Webhook handlers
def handle_stripe_webhook(payload, signature, webhook_secret):
    """Handle Stripe webhook"""
    import hmac
    import hashlib
    
    # Verify signature
    expected_signature = hmac.new(
        webhook_secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(signature, expected_signature):
        return {'error': 'Invalid signature'}, 400
    
    import json
    event = json.loads(payload)
    
    event_type = event.get('type')
    data = event.get('data', {}).get('object', {})
    
    if event_type == 'payment_intent.succeeded':
        # Handle successful payment
        return {'status': 'processed', 'event': event_type, 'data': data}
    elif event_type == 'payment_intent.payment_failed':
        # Handle failed payment
        return {'status': 'failed', 'event': event_type, 'data': data}
    elif event_type == 'checkout.session.completed':
        # Handle checkout completion
        return {'status': 'completed', 'event': event_type, 'data': data}
    elif event_type == 'customer.subscription.created':
        # Handle subscription created
        return {'status': 'active', 'event': event_type, 'data': data}
    elif event_type == 'customer.subscription.deleted':
        # Handle subscription cancelled
        return {'status': 'cancelled', 'event': event_type, 'data': data}
    elif event_type == 'invoice.paid':
        # Handle invoice paid
        return {'status': 'paid', 'event': event_type, 'data': data}
    
    return {'status': 'ignored', 'event': event_type}


def handle_paypal_webhook(payload):
    """Handle PayPal webhook"""
    event_type = payload.get('event_type')
    resource = payload.get('resource', {})
    
    if event_type == 'CHECKOUT.ORDER.APPROVED':
        return {'status': 'approved', 'event': event_type, 'data': resource}
    elif event_type == 'PAYMENT.CAPTURE.COMPLETED':
        return {'status': 'completed', 'event': event_type, 'data': resource}
    elif event_type == 'PAYMENT.CAPTURE.REFUNDED':
        return {'status': 'refunded', 'event': event_type, 'data': resource}
    elif event_type == 'BILLING.SUBSCRIPTION.CREATED':
        return {'status': 'active', 'event': event_type, 'data': resource}
    elif event_type == 'BILLING.SUBSCRIPTION.CANCELLED':
        return {'status': 'cancelled', 'event': event_type, 'data': resource}
    
    return {'status': 'ignored', 'event': event_type}
