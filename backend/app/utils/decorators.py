from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from functools import wraps
from app.models.user import User, UserRole
from app import db
from datetime import datetime

def role_required(allowed_roles):
    """
    Decorator to require specific roles for accessing a route
    allowed_roles: list of roles that are allowed to access the route
    Example: @role_required([UserRole.admin, UserRole.manager])
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Verify JWT token
            verify_jwt_in_request()
            
            # Get current user ID from token
            current_user_id = get_jwt_identity()
            
            # Get user from database (refresh to ensure latest data)
            user = db.session.get(User, current_user_id)
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            if not user.is_active:
                return jsonify({'error': 'User account is deactivated'}), 401
            
            # Check if user's role is in allowed roles
            if user.role not in allowed_roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def superadmin_required(fn):
    """Decorator to require superadmin role"""
    return role_required([UserRole.superadmin])(fn)

def admin_required(fn):
    """Decorator to require admin or superadmin role"""
    return role_required([UserRole.superadmin, UserRole.admin])(fn)

def manager_required(fn):
    """Decorator to require manager, admin or superadmin role"""
    return role_required([UserRole.superadmin, UserRole.admin, UserRole.manager])(fn)

def staff_required(fn):
    """Decorator to require staff, manager, admin or superadmin role"""
    return role_required([UserRole.superadmin, UserRole.admin, UserRole.manager, UserRole.staff])(fn)

def subscription_required(fn):
    """
    Decorator to require an active subscription for the business
    This checks if the business has an active subscription plan
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # Verify JWT token
        verify_jwt_in_request()
        
        # Get current user ID from token
        current_user_id = get_jwt_identity()
        
        # Get user from database
        user = db.session.get(User, current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Superadmin bypass subscription check
        if user.role == UserRole.superadmin:
            return fn(*args, **kwargs)
        
        if not user.business_id:
            return jsonify({'error': 'No business associated with this user'}), 403
        
        # Import here to avoid circular imports
        from app.models.subscription import Subscription, SubscriptionStatus
        
        # Check for active subscription
        active_subscription = Subscription.query.filter_by(
            business_id=user.business_id,
            is_active=True
        ).filter(
            Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL])
        ).filter(
            Subscription.end_date >= datetime.utcnow()
        ).first()
        
        if not active_subscription:
            return jsonify({
                'error': 'No active subscription',
                'message': 'Please subscribe to a plan to access this feature',
                'requires_subscription': True
            }), 403
        
        return fn(*args, **kwargs)
    return wrapper