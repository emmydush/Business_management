from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.audit_log import AuditLog, AuditAction, create_audit_log
from app.models.user import User
from app.models.business import Business
from app.utils.middleware import module_required, get_business_id
from datetime import datetime
from sqlalchemy import desc

audit_log_bp = Blueprint('audit_log', __name__)

@audit_log_bp.route('/logs', methods=['GET'])
@jwt_required()
@module_required('audit_log')
def get_audit_logs():
    try:
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Get filter parameters
        action = request.args.get('action')
        entity_type = request.args.get('entity_type')
        user_id = request.args.get('user_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Build query
        query = AuditLog.query
        
        # Apply business filter
        business_id = get_business_id()
        if business_id:
            query = query.filter(AuditLog.business_id == business_id)
        
        # Apply filters
        if action:
            query = query.filter(AuditLog.action == AuditAction(action))
        if entity_type:
            query = query.filter(AuditLog.entity_type == entity_type)
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if start_date:
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(AuditLog.created_at >= start_dt)
        if end_date:
            end_dt = datetime.strptime(end_date, '%Y-%m-%d')
            query = query.filter(AuditLog.created_at <= end_dt)
        
        # Order by creation date descending
        query = query.order_by(desc(AuditLog.created_at))
        
        # Paginate results
        audit_logs = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'audit_logs': [log.to_dict() for log in audit_logs.items],
            'total': audit_logs.total,
            'pages': audit_logs.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except ValueError as e:
        return jsonify({'error': f'Invalid parameter: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audit_log_bp.route('/logs/<int:log_id>', methods=['GET'])
@jwt_required()
@module_required('audit_log')
def get_audit_log(log_id):
    try:
        business_id = get_business_id()
        log = AuditLog.query.filter_by(id=log_id, business_id=business_id).first()
        
        if not log:
            return jsonify({'error': 'Audit log not found'}), 404
        
        return jsonify({'audit_log': log.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Helper function to log actions - this will be used internally
def log_action(user_id, business_id, action, entity_type, entity_id, old_values=None, new_values=None, metadata=None):
    """
    Helper function to create an audit log entry.
    This can be called from other route handlers to log actions.
    """
    try:
        # Get IP address and user agent from request
        ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        user_agent = request.headers.get('User-Agent')
        
        create_audit_log(
            user_id=user_id,
            business_id=business_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
            additional_metadata=metadata
        )
    except Exception as e:
        # Don't let audit logging errors affect the main operation
        print(f"Audit logging error: {str(e)}")

# The helper function is available for use in other modules