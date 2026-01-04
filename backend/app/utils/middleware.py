from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from functools import wraps
from app.models.user import User, UserRole
from app import db

def authorization_middleware():
    """
    Middleware to handle authorization checks
    """
    # This would typically be implemented as a before_request handler
    # For now, we'll focus on route-level decorators which are already implemented
    pass

def check_module_access(user, module_name):
    """
    Check if a user has access to a specific module based on their role
    """
    module_permissions = {
        'users': [UserRole.ADMIN, UserRole.MANAGER],
        'dashboard': [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
        'customers': [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
        'suppliers': [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
        'inventory': [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
        'sales': [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
        'purchases': [UserRole.ADMIN, UserRole.MANAGER],
        'expenses': [UserRole.ADMIN, UserRole.MANAGER],
        'hr': [UserRole.ADMIN, UserRole.MANAGER],
        'reports': [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
        'settings': [UserRole.ADMIN]
    }
    
    allowed_roles = module_permissions.get(module_name, [UserRole.ADMIN])
    return user.role in allowed_roles

def module_required(module_name):
    """
    Decorator to require access to a specific module
    """
    def decorator(fn):
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
            
            if not user.is_active:
                return jsonify({'error': 'User account is deactivated'}), 401
            
            # Check module access
            if not check_module_access(user, module_name):
                return jsonify({'error': f'Insufficient permissions to access {module_name} module'}), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator