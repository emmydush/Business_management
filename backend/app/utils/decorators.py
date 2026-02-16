from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from functools import wraps
from app.models.user import User, UserRole
from app import db
from datetime import datetime

# Import the enhanced subscription validator
from .subscription_validator import subscription_required as enhanced_subscription_required, check_subscription_before_action

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

# Keep the original decorator for backward compatibility
def subscription_required(fn):
    """
    Backward compatible decorator - uses the enhanced subscription validator
    """
    return enhanced_subscription_required()(fn)

# Export the enhanced validators
__all__ = [
    'role_required',
    'superadmin_required', 
    'admin_required',
    'manager_required',
    'staff_required',
    'subscription_required',
    'enhanced_subscription_required',
    'check_subscription_before_action'
]