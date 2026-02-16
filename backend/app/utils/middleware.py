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

def get_active_branch_id():
    """
    Helper to get the current user's active branch ID
    """
    from app.models.branch import UserBranchAccess
    current_user_id = get_jwt_identity()
    access = UserBranchAccess.query.filter_by(user_id=current_user_id, is_default=True).first()
    return access.branch_id if access else None

def check_module_access(user, module_name):
    """
    Check if a user has access to a specific module based on their role and database permissions
    """
    # Superadmins always have access to everything
    if user.role == UserRole.superadmin:
        return True

    from app.models.settings import UserPermission
    
    # Check if this user has ANY specific permissions defined in the database
    # If they do, we strictly follow the database permissions and ignore the role fallback
    has_custom_permissions = UserPermission.query.filter_by(user_id=user.id).first() is not None
    
    if has_custom_permissions:
        db_permission = UserPermission.query.filter_by(
            user_id=user.id, 
            module=module_name, 
            granted=True
        ).first()
        return db_permission is not None

    # Fallback to default role-based permissions ONLY if no custom permissions are set
    module_permissions = {
        'business': [UserRole.admin, UserRole.manager, UserRole.staff],
        'users': [UserRole.admin, UserRole.manager],
        'dashboard': [UserRole.admin, UserRole.manager, UserRole.staff],
        'customers': [UserRole.admin, UserRole.manager, UserRole.staff],
        'suppliers': [UserRole.admin, UserRole.manager, UserRole.staff],
        'inventory': [UserRole.admin, UserRole.manager, UserRole.staff],
        'sales': [UserRole.admin, UserRole.manager, UserRole.staff],
        'purchases': [UserRole.admin, UserRole.manager],
        'expenses': [UserRole.admin, UserRole.manager],
        'hr': [UserRole.admin, UserRole.manager],
        'reports': [UserRole.admin, UserRole.manager, UserRole.staff],
        'settings': [UserRole.admin],
        'leads': [UserRole.admin, UserRole.manager, UserRole.staff],
        'tasks': [UserRole.admin, UserRole.manager, UserRole.staff],
        'projects': [UserRole.admin, UserRole.manager, UserRole.staff],
        'documents': [UserRole.admin, UserRole.manager, UserRole.staff],
        'assets': [UserRole.admin, UserRole.manager, UserRole.staff],
        'warehouses': [UserRole.admin, UserRole.manager],
        'communication': [UserRole.admin, UserRole.manager, UserRole.staff],
        'audit_log': [UserRole.admin, UserRole.manager]
    }
    
    allowed_roles = module_permissions.get(module_name, [UserRole.admin])
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

def check_subscription_status(business_id):
    """
    Check if a business has an active subscription
    Returns: (has_subscription: bool, subscription: Subscription or None)
    """
    from app.models.business import Business
    from app.models.subscription import Subscription, SubscriptionStatus
    from datetime import datetime
    
    business = db.session.get(Business, business_id)
    if not business:
        return False, None
    
    # Get the latest active subscription
    subscription = Subscription.query.filter_by(
        business_id=business_id,
        is_active=True
    ).filter(
        Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL])
    ).filter(
        Subscription.end_date >= datetime.utcnow()
    ).order_by(Subscription.end_date.desc()).first()
    
    return subscription is not None, subscription

def subscription_required(allow_read=True):
    """
    Decorator to require an active subscription for write operations
    
    Args:
        allow_read: If True, allows GET requests even without subscription
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
            
            # Superadmins bypass subscription checks
            if user.role == UserRole.superadmin:
                return fn(*args, **kwargs)
            
            # For read operations (GET), we can allow access even without subscription
            if allow_read and request.method == 'GET':
                return fn(*args, **kwargs)
            
            # Check if user has a business
            if not user.business_id:
                return jsonify({'error': 'User is not associated with any business'}), 403
            
            # Check subscription status for write operations (POST, PUT, DELETE, PATCH)
            has_subscription, subscription = check_subscription_status(user.business_id)
            
            if not has_subscription:
                return jsonify({
                    'error': 'Subscription required',
                    'message': 'Your business subscription has expired or is inactive. Please renew your subscription to continue using this feature.',
                    'subscription_expired': True
                }), 402  # 402 Payment Required
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator