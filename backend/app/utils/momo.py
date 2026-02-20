"""
MTN MoMo Payment Integration Module

This module provides integration with MTN Mobile Money (MoMo) API.
It supports:
- Generating access tokens
- Initiating payment requests (Request to Pay)
- Checking payment status

Environment variables required:
- MOMO_API_USER: API User ID (from MTN MoMo developer portal)
- MOMO_API_KEY: API Key (from MTN MoMo developer portal)  
- MOMO_SUBSCRIPTION_KEY: Subscription Key for the application
- MOMO_ENVIRONMENT: 'sandbox' or 'production' (default: sandbox)
"""

import os
import uuid
import base64
import requests
from datetime import datetime, timedelta
from flask import current_app

# Default API endpoints
SANDBOX_BASE_URL = "https://sandbox.momodeveloper.mtn.com"
PRODUCTION_BASE_URL = "https://api.momodeveloper.mtn.com"

# Token cache
_token_cache = {
    'access_token': None,
    'expires_at': None
}

# Disbursement token cache
_disbursement_token_cache = {
    'access_token': None,
    'expires_at': None
}


def get_momo_config():
    """Get MoMo configuration from environment variables."""
    config = {
        'api_user': os.getenv('MOMO_API_USER', ''),
        'api_key': os.getenv('MOMO_API_KEY', ''),
        'subscription_key': os.getenv('MOMO_SUBSCRIPTION_KEY', '57b17dd5502f4e7b9cdc7aaafa840d12'),
        'environment': os.getenv('MOMO_ENVIRONMENT', 'sandbox'),
        'callback_url': os.getenv('MOMO_CALLBACK_URL', ''),
        # Disbursement-specific credentials
        'disbursement_api_user': os.getenv('MOMO_DISBURSEMENT_API_USER', os.getenv('MOMO_API_USER', '')),
        'disbursement_api_key': os.getenv('MOMO_DISBURSEMENT_API_KEY', os.getenv('MOMO_API_KEY', '')),
        'disbursement_subscription_key': os.getenv('MOMO_DISBURSEMENT_SUBSCRIPTION_KEY', os.getenv('MOMO_SUBSCRIPTION_KEY', '57b17dd5502f4e7b9cdc7aaafa840d12')),
    }
    
    # Validate basic configuration
    if not config['api_user']:
        raise ValueError("MoMo API user not configured. Please set MOMO_API_USER environment variable.")
    if not config['api_key']:
        raise ValueError("MoMo API key not configured. Please set MOMO_API_KEY environment variable.")
    if not config['subscription_key']:
        raise ValueError("MoMo subscription key not configured. Please set MOMO_SUBSCRIPTION_KEY environment variable.")
    
    return config


def get_base_url():
    """Get the base URL based on environment."""
    config = get_momo_config()
    if config['environment'] == 'production':
        return PRODUCTION_BASE_URL
    return SANDBOX_BASE_URL


def _is_token_valid():
    """Check if the cached token is still valid."""
    if _token_cache['access_token'] is None or _token_cache['expires_at'] is None:
        return False
    return datetime.utcnow() < _token_cache['expires_at']


def generate_access_token():
    """
    Generate an access token for MTN MoMo API.
    
    Returns:
        str: Access token if successful, None otherwise
    """
    config = get_momo_config()
    
    url = f"{get_base_url()}/collection/token/"
    
    # Create Basic Auth credentials
    credentials = f"{config['api_user']}:{config['api_key']}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()
    
    headers = {
        "Authorization": f"Basic {encoded_credentials}",
        "Ocp-Apim-Subscription-Key": config['subscription_key']
    }
    
    try:
        response = requests.post(url, headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            access_token = data.get('access_token')
            
            # Cache the token with expiration (default 3600 seconds - 1 hour)
            expires_in = data.get('expires_in', 3600)
            _token_cache['access_token'] = access_token
            _token_cache['expires_at'] = datetime.utcnow() + timedelta(seconds=expires_in - 60)  # Buffer of 60 seconds
            
            return access_token
        elif response.status_code == 401:
            raise ValueError("Invalid MoMo API credentials. Please check your API user and key.")
        elif response.status_code == 403:
            raise ValueError("MoMo API access forbidden. Please check your subscription key.")
        else:
            raise Exception(f"Failed to generate access token: {response.status_code} - {response.text}")
            
    except requests.exceptions.RequestException as e:
        raise Exception(f"Network error while generating access token: {str(e)}")


def get_access_token():
    """
    Get a valid access token, using cached token if available.
    
    Returns:
        str: Valid access token
    """
    if _is_token_valid():
        return _token_cache['access_token']
    
    return generate_access_token()


def _is_disbursement_token_valid():
    """Check if the cached disbursement token is still valid."""
    if _disbursement_token_cache['access_token'] is None or _disbursement_token_cache['expires_at'] is None:
        return False
    return datetime.utcnow() < _disbursement_token_cache['expires_at']


def generate_disbursement_token():
    """
    Generate an access token for MTN MoMo Disbursement API.
    
    Returns:
        str: Access token if successful, None otherwise
    """
    config = get_momo_config()
    
    # SANDBOX FALLBACK: If in sandbox and disbursement credentials are not configured
    # Use collection token as fallback (not ideal, but allows testing)
    use_collection_fallback = (
        config['environment'] == 'sandbox' and
        config['disbursement_api_user'] == config['api_user'] and
        config['disbursement_api_key'] == config['api_key']
    )
    
    if use_collection_fallback:
        # In sandbox, use collection token for disbursement (workaround for testing)
        try:
            collection_token = get_access_token()
            _disbursement_token_cache['access_token'] = collection_token
            _disbursement_token_cache['expires_at'] = _token_cache['expires_at']
            return collection_token
        except Exception as e:
            raise Exception(f"Fallback to collection token failed: {str(e)}")
    
    url = f"{get_base_url()}/disbursement/token/"
    
    # Use disbursement-specific credentials
    credentials = f"{config['disbursement_api_user']}:{config['disbursement_api_key']}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()
    
    headers = {
        "Authorization": f"Basic {encoded_credentials}",
        "Ocp-Apim-Subscription-Key": config['disbursement_subscription_key']
    }
    
    try:
        response = requests.post(url, headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            access_token = data.get('access_token')
            
            # Cache the token with expiration (default 3600 seconds - 1 hour)
            expires_in = data.get('expires_in', 3600)
            _disbursement_token_cache['access_token'] = access_token
            _disbursement_token_cache['expires_at'] = datetime.utcnow() + timedelta(seconds=expires_in - 60)
            
            return access_token
        elif response.status_code == 401:
            raise ValueError("Invalid MoMo Disbursement API credentials. Please check your disbursement API user and key.")
        elif response.status_code == 403:
            raise ValueError("MoMo Disbursement API access forbidden. Please check your disbursement subscription key.")
        else:
            raise Exception(f"Failed to generate disbursement token: {response.status_code} - {response.text}")
            
    except requests.exceptions.RequestException as e:
        raise Exception(f"Network error while generating disbursement token: {str(e)}")


def get_disbursement_token():
    """
    Get a valid disbursement access token, using cached token if available.
    
    Returns:
        str: Valid disbursement access token
    """
    if _is_disbursement_token_valid():
        return _disbursement_token_cache['access_token']
    
    return generate_disbursement_token()


def request_to_pay(amount, phone_number, external_id=None, currency="EUR", payer_message="Payment", payee_note="Payment"):
    """
    Initiate a Request to Pay transaction.
    
    Args:
        amount (str): Amount to charge (e.g., "1000")
        phone_number (str): Payer's phone number (MSISDN format, e.g., "2507XXXXXXXX")
        external_id (str, optional): External reference ID for the transaction
        currency (str): Currency code (default: "EUR")
        payer_message (str): Message to display to the payer
        payee_note (str): Note for the payee
        
    Returns:
        dict: Transaction details including reference_id and status
    """
    config = get_momo_config()
    
    # Generate reference ID if not provided
    reference_id = str(uuid.uuid4())
    
    # Use provided external_id or generate one
    if external_id is None:
        external_id = str(uuid.uuid4())
    
    url = f"{get_base_url()}/collection/v1_0/requesttopay"
    
    # Get access token
    access_token = get_access_token()
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "X-Reference-Id": reference_id,
        "X-Target-Environment": config['environment'],
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": config['subscription_key']
    }
    
    data = {
        "amount": str(amount),
        "currency": currency,
        "externalId": external_id,
        "payer": {
            "partyIdType": "MSISDN",
            "partyId": phone_number
        },
        "payerMessage": payer_message,
        "payeeNote": payee_note
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        
        if response.status_code in [200, 201, 202]:
            return {
                'success': True,
                'reference_id': reference_id,
                'external_id': external_id,
                'status': 'pending',
                'amount': amount,
                'currency': currency,
                'phone_number': phone_number,
                'message': 'Payment request initiated successfully'
            }
        else:
            return {
                'success': False,
                'reference_id': reference_id,
                'status': 'failed',
                'error': f"Request failed with status {response.status_code}",
                'details': response.text
            }
            
    except requests.exceptions.RequestException as e:
        return {
            'success': False,
            'reference_id': reference_id,
            'status': 'failed',
            'error': f"Network error: {str(e)}"
        }


def check_payment_status(reference_id):
    """
    Check the status of a payment request.
    
    Args:
        reference_id (str): The reference ID returned from request_to_pay
        
    Returns:
        dict: Payment status details
    """
    config = get_momo_config()
    
    status_url = f"{get_base_url()}/collection/v1_0/requesttopay/{reference_id}"
    
    # Get access token
    access_token = get_access_token()
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "X-Target-Environment": config['environment'],
        "Ocp-Apim-Subscription-Key": config['subscription_key']
    }
    
    try:
        response = requests.get(status_url, headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            return {
                'success': True,
                'reference_id': reference_id,
                'status': data.get('status', 'unknown'),
                'amount': data.get('amount'),
                'currency': data.get('currency'),
                'external_id': data.get('externalId'),
                'payer': data.get('payer'),
                'created_at': data.get('createdAt'),
                'completed_at': data.get('completedAt'),
                'reason': data.get('reason')
            }
        elif response.status_code == 404:
            return {
                'success': False,
                'reference_id': reference_id,
                'status': 'not_found',
                'error': 'Transaction not found'
            }
        else:
            return {
                'success': False,
                'reference_id': reference_id,
                'status': 'error',
                'error': f"Status check failed with status {response.status_code}",
                'details': response.text
            }
            
    except requests.exceptions.RequestException as e:
        return {
            'success': False,
            'reference_id': reference_id,
            'status': 'error',
            'error': f"Network error: {str(e)}"
        }


def initiate_momo_payment(amount, phone_number=None, callback_url=None, metadata=None):
    """
    High-level function to initiate a MoMo payment.
    This is the main entry point used by other parts of the application.
    
    Args:
        amount: Payment amount
        phone_number: Payer's phone number (MSISDN format)
        callback_url: Optional callback URL for webhook notifications
        metadata: Optional additional metadata
        
    Returns:
        dict: Payment initiation result with provider_reference and instructions
    """
    config = get_momo_config()
    
    # Use phone number from params or config
    payer_phone = phone_number or config.get('default_phone', '')
    
    if not payer_phone:
        raise ValueError("Phone number is required for MoMo payment")
    
    # Generate external ID
    external_id = str(uuid.uuid4())
    
    # Initiate payment
    result = request_to_pay(
        amount=str(amount),
        phone_number=payer_phone,
        external_id=external_id,
        payer_message=metadata.get('description', 'Payment') if metadata else 'Payment',
        payee_note=metadata.get('note', 'Payment') if metadata else 'Payment'
    )
    
    if result['success']:
        return {
            'success': True,
            'provider': 'mtn_momo',
            'provider_reference': result['reference_id'],
            'external_id': result['external_id'],
            'amount': float(amount),
            'status': result['status'],
            'instructions': {
                'type': 'momo_push',
                'message': f'Payment request sent to {payer_phone}. Please approve on your phone.',
                'phone': payer_phone,
                'reference_id': result['reference_id']
            },
            'callback_url': callback_url,
            'metadata': metadata or {}
        }
    else:
        return {
            'success': False,
            'provider': 'mtn_momo',
            'provider_reference': result.get('reference_id', ''),
            'amount': float(amount),
            'status': 'failed',
            'instructions': {
                'type': 'error',
                'message': result.get('error', 'Payment failed'),
                'error_details': result.get('details', '')
            },
            'callback_url': callback_url,
            'metadata': metadata or {}
        }


def refund_momo_payment(reference_id, amount, reason=None):
    """
    Initiate a refund for a MoMo payment.
    
    Args:
        reference_id: The original payment reference ID
        amount: Amount to refund
        reason: Optional reason for refund
        
    Returns:
        dict: Refund result
    """
    config = get_momo_config()
    
    if not config['api_user'] or not config['api_key'] or not config['subscription_key']:
        raise ValueError("MoMo API credentials not configured.")
    
    refund_reference_id = str(uuid.uuid4())
    
    url = f"{get_base_url()}/collection/v1_0/refund"
    
    access_token = get_access_token()
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "X-Reference-Id": refund_reference_id,
        "X-Target-Environment": config['environment'],
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": config['subscription_key']
    }
    
    data = {
        "amount": str(amount),
        "currency": "EUR",
        "referenceId": reference_id,
        "reason": reason or "Customer refund"
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        
        if response.status_code in [200, 201]:
            return {
                'success': True,
                'refund_reference_id': refund_reference_id,
                'status': 'pending',
                'message': 'Refund initiated successfully'
            }
        else:
            return {
                'success': False,
                'refund_reference_id': refund_reference_id,
                'status': 'failed',
                'error': f"Refund failed: {response.status_code}",
                'details': response.text
            }
            
    except requests.exceptions.RequestException as e:
        return {
            'success': False,
            'refund_reference_id': refund_reference_id,
            'status': 'error',
            'error': f"Network error: {str(e)}"
        }


def clear_token_cache():
    """Clear the cached access token (useful for testing or force refresh)."""
    global _token_cache, _disbursement_token_cache
    _token_cache = {
        'access_token': None,
        'expires_at': None
    }
    _disbursement_token_cache = {
        'access_token': None,
        'expires_at': None
    }


def disburse_to_wallet(amount, phone_number, external_id=None, currency="EUR", payee_note="Payroll disbursement"):
    """
    Disburse funds to a mobile wallet (payout / transfer).

    Args:
        amount (str|float): Amount to disburse
        phone_number (str): Recipient MSISDN
        external_id (str, optional): External reference ID
        currency (str): Currency code
        payee_note (str): Note for recipient

    Returns:
        dict: Result with success flag and reference_id/status
    """
    config = get_momo_config()

    reference_id = str(uuid.uuid4())
    if external_id is None:
        external_id = str(uuid.uuid4())

    # Disbursement (payout) endpoint
    url = f"{get_base_url()}/disbursement/v1_0/transfer"

    # Use disbursement-specific token
    access_token = get_disbursement_token()

    headers = {
        "Authorization": f"Bearer {access_token}",
        "X-Reference-Id": reference_id,
        "X-Target-Environment": config['environment'],
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": config['disbursement_subscription_key']
    }

    data = {
        "amount": str(amount),
        "currency": currency,
        "externalId": external_id,
        "payee": {
            "partyIdType": "MSISDN",
            "partyId": phone_number
        },
        "payerMessage": payee_note,
        "payeeNote": payee_note
    }

    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)

        if response.status_code in [200, 201, 202]:
            return {
                'success': True,
                'reference_id': reference_id,
                'external_id': external_id,
                'status': 'pending',
                'amount': amount,
                'currency': currency,
                'phone_number': phone_number,
                'message': 'Disbursement initiated'
            }
        else:
            return {
                'success': False,
                'reference_id': reference_id,
                'status': 'failed',
                'error': f"Disbursement failed with status {response.status_code}",
                'details': response.text
            }

    except requests.exceptions.RequestException as e:
        return {
            'success': False,
            'reference_id': reference_id,
            'status': 'error',
            'error': f"Network error: {str(e)}"
        }


def check_disbursement_status(reference_id):
    """
    Check status of a disbursement (transfer) request.

    Args:
        reference_id (str): The X-Reference-Id used when initiating the transfer

    Returns:
        dict: Status information or error
    """
    config = get_momo_config()
    url = f"{get_base_url()}/disbursement/v1_0/transfer/{reference_id}"

    try:
        # Use disbursement-specific token
        access_token = get_disbursement_token()
    except Exception as e:
        return {'success': False, 'error': f'Failed to get disbursement access token: {e}'}

    headers = {
        "Authorization": f"Bearer {access_token}",
        "X-Target-Environment": config['environment'],
        "Ocp-Apim-Subscription-Key": config['disbursement_subscription_key']
    }

    try:
        response = requests.get(url, headers=headers, timeout=30)
        if response.status_code == 200:
            data = response.json()
            return {
                'success': True,
                'reference_id': reference_id,
                'status': data.get('status'),
                'data': data
            }
        elif response.status_code == 404:
            return {'success': False, 'reference_id': reference_id, 'status': 'not_found'}
        else:
            return {'success': False, 'reference_id': reference_id, 'status': 'error', 'details': response.text}
    except requests.exceptions.RequestException as e:
        return {'success': False, 'reference_id': reference_id, 'status': 'error', 'error': str(e)}
