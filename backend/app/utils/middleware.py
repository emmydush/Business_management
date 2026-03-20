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
    business_id = claims.get('business_id')
    if business_id is None:
        # Try to get from user
        try:
            from flask_jwt_extended import get_jwt_identity
            from app.models.user import User
            current_user_id = get_jwt_identity()
            user = db.session.get(User, current_user_id)
            if user:
                return user.business_id
        except Exception:
            pass
    return business_id

def get_active_branch_id():
    """
    Helper to get the current user's active branch ID
    """
    from app.models.branch import UserBranchAccess
    current_user_id = get_jwt_identity()
    access = UserBranchAccess.query.filter_by(user_id=current_user_id, is_default=True).first()
    return access.branch_id if access and access.branch_id else None

def check_module_access(user, module_name, permission_type='view'):
    """
    Module restrictions removed - all authenticated users have full platform access.
    Returns True for all users (except inactive users which are handled in module_required).
    
    Args:
        user: The user object
        module_name: The module to check access for (ignored)
        permission_type: The type of permission to check (ignored)
    """
    # All users now have full access to all modules
    return True

def check_permission(user, module_name, permission_type='view'):
    """
    Convenience function to check if user has a specific permission.
    Permission restrictions removed - all users have full access.
    Returns True for all users.
    
    Args:
        user: The user object
        module_name: The module name (ignored)
        permission_type: The permission type (ignored)
    """
    return True

def module_required(module_name):
    """
    Decorator to require access to a specific module.
    Module restrictions removed - this now just validates JWT token and user status.
    
    Args:
        module_name: The module name (ignored, kept for API compatibility)
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
            
            # Module restrictions removed - all authenticated users have full access
            # Keep business validation for non-superadmin users
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

def check_subscription_status(business_id):
    """
    Check if a business has an active subscription
    Returns: (has_subscription: bool, subscription: Subscription or None)
    """
    # Subscription restrictions removed across the platform.
    # Keep shape-compatible return for any legacy callers.
    return True, None

def subscription_required(allow_read=True):
    """
    Decorator to require an active subscription for write operations
    
    Args:
        allow_read: If True, allows GET requests even without subscription
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Subscription restrictions removed: always allow.
            return fn(*args, **kwargs)
        return wrapper
    return decorator
