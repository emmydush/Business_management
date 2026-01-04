from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from functools import wraps
from app.models.user import User, UserRole
from app import db

def role_required(allowed_roles):
    """
    Decorator to require specific roles for accessing a route
    allowed_roles: list of roles that are allowed to access the route
    Example: @role_required([UserRole.ADMIN, UserRole.MANAGER])
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

def admin_required(fn):
    """Decorator to require admin role"""
    return role_required([UserRole.ADMIN])(fn)

def manager_required(fn):
    """Decorator to require manager or admin role"""
    return role_required([UserRole.ADMIN, UserRole.MANAGER])(fn)

def staff_required(fn):
    """Decorator to require staff, manager, or admin role"""
    return role_required([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF])(fn)