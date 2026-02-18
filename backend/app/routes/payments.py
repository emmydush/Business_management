"""
Payment Routes - MoMo Integration API

This module provides API endpoints for MoMo mobile money payments.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.utils.momo import initiate_momo_payment, request_to_pay, check_payment_status
from app.utils.payment_integrations import get_payment_processor
import uuid

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')


@payments_bp.route('/momo/initiate', methods=['POST'])
@jwt_required()
def initiate_momo():
    """
    Initiate a MoMo payment request.
    
    Request body:
    {
        "amount": "1000",           # Amount to charge
        "phone_number": "2507XXXXXXXX",  # Payer's phone number
        "external_id": "optional-external-id",
        "currency": "EUR",          # Currency (default: EUR)
        "description": "Payment description",
        "metadata": {}              # Optional metadata
    }
    
    Returns:
    {
        "success": true,
        "provider_reference": "uuid",
        "amount": 1000,
        "status": "pending",
        "instructions": {...}
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        # Validate required fields
        amount = data.get('amount')
        phone_number = data.get('phone_number')
        
        if not amount:
            return jsonify({'error': 'Amount is required'}), 400
        
        if not phone_number:
            return jsonify({'error': 'Phone number is required'}), 400
        
        # Get optional fields
        external_id = data.get('external_id', str(uuid.uuid4()))
        currency = data.get('currency', 'EUR')
        description = data.get('description', 'Payment')
        metadata = data.get('metadata', {})
        
        # Add business info to metadata
        business_id = get_jwt_identity()
        metadata['business_id'] = business_id
        
        # Initiate payment using the MoMo utility
        result = initiate_momo_payment(
            amount=amount,
            phone_number=phone_number,
            metadata=metadata
        )
        
        if result.get('success', False):
            return jsonify({
                'success': True,
                'provider_reference': result.get('provider_reference'),
                'external_id': result.get('external_id'),
                'amount': result.get('amount'),
                'currency': currency,
                'status': result.get('status', 'pending'),
                'instructions': result.get('instructions', {}),
                'message': 'Payment request initiated successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Payment initiation failed'),
                'details': result.get('details', '')
            }), 400
            
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Internal error: {str(e)}'}), 500


@payments_bp.route('/momo/status/<reference_id>', methods=['GET'])
@jwt_required()
def get_momo_status(reference_id):
    """
    Check the status of a MoMo payment.
    
    Args:
        reference_id: The provider reference ID from the payment request
        
    Returns:
    {
        "success": true,
        "status": "pending|completed|failed",
        "amount": 1000,
        "currency": "EUR"
    }
    """
    try:
        if not reference_id:
            return jsonify({'error': 'Reference ID is required'}), 400
        
        result = check_payment_status(reference_id)
        
        if result.get('success', False):
            return jsonify(result), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Status check failed'),
                'status': result.get('status', 'unknown')
            }), 400
            
    except Exception as e:
        return jsonify({'error': f'Internal error: {str(e)}'}), 500


@payments_bp.route('/momo/webhook', methods=['POST'])
def momo_webhook():
    """
    Handle MoMo webhook notifications for payment status updates.
    
    This endpoint receives async notifications from MoMo when
    payment status changes (e.g., payment completed, failed, etc.)
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data received'}), 400
        
        # Process the webhook notification
        # Extract relevant information
        external_id = data.get('externalId')
        status = data.get('status')
        amount = data.get('amount')
        reference_id = data.get('referenceId')
        
        # Map MoMo status to internal status
        status_mapping = {
            'SUCCESSFUL': 'completed',
            'FAILED': 'failed',
            'PENDING': 'pending',
            'CANCELLED': 'cancelled',
            'TIMEOUT': 'failed'
        }
        
        internal_status = status_mapping.get(status, 'pending')
        
        # TODO: Update payment record in database
        # For now, just acknowledge receipt
        print(f"MoMo Webhook: {external_id} - {status}")
        
        return jsonify({
            'success': True,
            'received': True,
            'status': internal_status
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Webhook processing error: {str(e)}'}), 500


@payments_bp.route('/momo/refund', methods=['POST'])
@jwt_required()
def refund_momo():
    """
    Process a refund for a MoMo payment.
    
    Request body:
    {
        "reference_id": "original-payment-reference-id",
        "amount": "500",           # Amount to refund (optional, full refund if not specified)
        "reason": "Customer request"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        reference_id = data.get('reference_id')
        amount = data.get('amount')
        reason = data.get('reason', 'Customer refund')
        
        if not reference_id:
            return jsonify({'error': 'Original payment reference_id is required'}), 400
        
        # Use payment processor to create refund
        momo = get_payment_processor('momo')
        result = momo.create_refund(
            reference_id=reference_id,
            amount=amount,
            reason=reason
        )
        
        if result.get('success', False):
            return jsonify({
                'success': True,
                'refund_reference_id': result.get('refund_reference_id'),
                'status': result.get('status'),
                'message': 'Refund initiated successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Refund failed')
            }), 400
            
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Internal error: {str(e)}'}), 500


@payments_bp.route('/momo/balance', methods=['GET'])
@jwt_required()
def get_momo_balance():
    """
    Get the account balance for the MoMo API user.
    
    Returns:
    {
        "available": 1000.00,
        "currency": "EUR"
    }
    """
    try:
        # This would typically call the MoMo API to get balance
        # For now, return a placeholder response
        # In production, implement: GET /collection/v1_0/account/balance
        
        return jsonify({
            'available': 0.00,
            'currency': 'EUR',
            'message': 'Balance check not implemented - requires additional API configuration'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal error: {str(e)}'}), 500
