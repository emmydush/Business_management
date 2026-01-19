from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from functools import wraps
from app.models.user import User, UserRole
from app import db

def get_business_id():
    """
    Helper to get business_id from JWT claims
    """
    claims = get_jwt()
    return claims.get('business_id')

def check_module_access(user, module_name):
    """
    Check if a user has access to a specific module based on their role
    """
    module_permissions = {
        'users': [UserRole.superadmin, UserRole.admin, UserRole.manager],
        'dashboard': [UserRole.superadmin, UserRole.admin, UserRole.manager, UserRole.staff],
        'customers': [UserRole.superadmin, UserRole.admin, UserRole.manager, UserRole.staff],
        'suppliers': [UserRole.superadmin, UserRole.admin, UserRole.manager, UserRole.staff],
        'inventory': [UserRole.superadmin, UserRole.admin, UserRole.manager, UserRole.staff],
        'sales': [UserRole.superadmin, UserRole.admin, UserRole.manager, UserRole.staff],
        'purchases': [UserRole.superadmin, UserRole.admin, UserRole.manager],
        'expenses': [UserRole.superadmin, UserRole.admin, UserRole.manager],
        'hr': [UserRole.superadmin, UserRole.admin, UserRole.manager],
        'reports': [UserRole.superadmin, UserRole.admin, UserRole.manager, UserRole.staff],
        'settings': [UserRole.superadmin, UserRole.admin],
        'superadmin': [UserRole.superadmin],
        'leads': [UserRole.superadmin, UserRole.admin, UserRole.manager, UserRole.staff],
        'tasks': [UserRole.superadmin, UserRole.admin, UserRole.manager, UserRole.staff],
        'projects': [UserRole.superadmin, UserRole.admin, UserRole.manager, UserRole.staff],
        'documents': [UserRole.superadmin, UserRole.admin, UserRole.manager, UserRole.staff],
        'assets': [UserRole.superadmin, UserRole.admin, UserRole.manager, UserRole.staff],
        'warehouses': [UserRole.superadmin, UserRole.admin, UserRole.manager]
    }
    
    allowed_roles = module_permissions.get(module_name, [UserRole.superadmin, UserRole.admin])
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
            
            # Ensure user has a business_id (unless superadmin)
            if user.role != UserRole.superadmin:
                if not user.business_id:
                    return jsonify({'error': 'User is not associated with any business'}), 403
                
                # Check if business is active
                from app.models.business import Business
                business = db.session.get(Business, user.business_id)
                if not business or not business.is_active:
                    return jsonify({'error': 'Business account is blocked. Please contact support.'}), 403
                
            return fn(*args, **kwargs)
        return wrapper
    return decorator