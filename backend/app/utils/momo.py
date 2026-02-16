import os
import uuid
from urllib.parse import urljoin

def initiate_momo_payment(amount, phone_number=None, callback_url=None, metadata=None):
    """
    Initiate a Mobile Money payment request. This is a minimal placeholder
    implementation that returns a provider_reference and instructions.

    Replace this with real provider SDK/API calls (MTN MoMo, Orange Money, etc.).
    """
    # provider configuration from env (placeholders)
    provider = os.getenv('MOMO_PROVIDER', 'momo')

    # Create a unique provider reference for this transaction
    provider_reference = f"momo_{uuid.uuid4().hex}"

    # In a real integration we would call the provider's API and receive
    # a checkout URL or USSD code or payment instruction.
    instructions = {
        'type': 'ussd',
        'message': f"Dial *182*8*1*902094# to complete payment of {amount}",
        'phone': phone_number,
        'code': '*182*8*1*902094#',
    }

    # Return a minimal payload to the caller
    return {
        'provider': provider,
        'provider_reference': provider_reference,
        'amount': float(amount),
        'instructions': instructions,
        'callback_url': callback_url,
        'metadata': metadata or {}
    }
