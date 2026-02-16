from app.models.subscription import Subscription, Plan, SubscriptionStatus
from app.models.user import User, UserRole
from app.models.business import Business
from app import db
from datetime import datetime
from flask import jsonify
import functools

class SubscriptionValidator:
    """Utility class for validating subscription-based access"""
    
    @staticmethod
    def get_active_subscription(business_id):
        """Get the active subscription for a business"""
        return Subscription.query.filter_by(
            business_id=business_id,
            is_active=True
        ).filter(
            Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL])
        ).filter(
            Subscription.end_date >= datetime.utcnow()
        ).first()
    
    @staticmethod
    def has_active_subscription(business_id):
        """Check if business has an active subscription"""
        return SubscriptionValidator.get_active_subscription(business_id) is not None
    
    @staticmethod
    def get_pending_subscription(business_id):
        """Get the pending subscription for a business"""
        return Subscription.query.filter_by(
            business_id=business_id,
            is_active=True,
            status=SubscriptionStatus.PENDING
        ).first()
    
    @staticmethod
    def get_business_limits(business_id):
        """Get the limits for the business based on their subscription"""
        subscription = SubscriptionValidator.get_active_subscription(business_id)
        
        if not subscription:
            return {
                'max_users': 0,
                'max_products': 0,
                'max_orders': 0,
                'max_branches': 0,
                'features': [],
                'plan_name': 'None'
            }
        
        return {
            'max_users': subscription.plan.max_users,
            'max_products': subscription.plan.max_products,
            'max_orders': subscription.plan.max_orders,
            'max_branches': subscription.plan.max_branches,
            'features': subscription.plan.features or [],
            'plan_name': subscription.plan.name,
            'plan_type': subscription.plan.plan_type.value
        }
    
    @staticmethod
    def check_feature_access(business_id, feature_name):
        """Check if business has access to a specific feature"""
        limits = SubscriptionValidator.get_business_limits(business_id)
        
        # Professional and Enterprise plan users have access to everything
        if limits['plan_type'] in ['professional', 'enterprise']:
            return True
        
        return feature_name in limits['features']
    
    @staticmethod
    def check_resource_limit(business_id, resource_type, current_count):
        """Check if business has reached a resource limit"""
        limits = SubscriptionValidator.get_business_limits(business_id)
        
        # Professional and Enterprise plan users have unlimited access
        if limits.get('plan_type') in ['professional', 'enterprise']:
            return True
        
        limit_mapping = {
            'users': limits['max_users'],
            'products': limits['max_products'],
            'orders': limits['max_orders'],
            'branches': limits['max_branches']
        }
        
        limit = limit_mapping.get(resource_type, 0)
        return current_count < limit
    
    @staticmethod
    def get_current_counts(business_id):
        """Get current counts of various resources for a business"""
        from app.models.user import User
        from app.models.product import Product
        from app.models.order import Order
        from app.models.branch import Branch
        
        counts = {}
        
        # Count users
        counts['users'] = User.query.filter_by(
            business_id=business_id,
            is_active=True
        ).count()
        
        # Count products
        counts['products'] = Product.query.filter_by(
            business_id=business_id,
            is_active=True
        ).count()
        
        # Count orders
        counts['orders'] = Order.query.filter_by(
            business_id=business_id
        ).count()
        
        # Count branches
        counts['branches'] = Branch.query.filter_by(
            business_id=business_id,
            is_active=True
        ).count()
        
        return counts

def subscription_required(feature=None, resource_check=None):
    """
    Enhanced decorator to require subscription with optional feature/resource checks
    
    Args:
        feature: Specific feature name to check access for
        resource_check: Tuple of (resource_type, current_count) to check limits
    """
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
            
            # Verify JWT token
            verify_jwt_in_request()
            
            # Get current user ID from token
            current_user_id = get_jwt_identity()
            
            # Get user from database
            user = db.session.get(User, current_user_id)
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Superadmin bypass all checks
            if user.role == UserRole.superadmin:
                return fn(*args, **kwargs)
            
            if not user.business_id:
                return jsonify({
                    'error': 'No business associated',
                    'message': 'User must belong to a business to access subscription features'
                }), 403
            
            # Check for active subscription
            if not SubscriptionValidator.has_active_subscription(user.business_id):
                # Check if it's pending
                pending = SubscriptionValidator.get_pending_subscription(user.business_id)
                if pending:
                    return jsonify({
                        'error': 'Subscription pending',
                        'message': 'Your subscription request is pending superadmin approval. Please wait for approval to access this feature.',
                        'subscription_pending': True,
                        'business_id': user.business_id
                    }), 403
                
                return jsonify({
                    'error': 'No active subscription',
                    'message': 'Please subscribe to a plan to access this feature',
                    'requires_subscription': True,
                    'business_id': user.business_id
                }), 403
            
            # Check specific feature access if requested
            if feature and not SubscriptionValidator.check_feature_access(user.business_id, feature):
                return jsonify({
                    'error': 'Feature not available',
                    'message': f'The {feature} feature is not available in your current plan',
                    'feature_required': feature,
                    'available_features': SubscriptionValidator.get_business_limits(user.business_id)['features']
                }), 403
            
            # Check resource limits if requested
            if resource_check:
                resource_type, current_count = resource_check
                if not SubscriptionValidator.check_resource_limit(user.business_id, resource_type, current_count):
                    limits = SubscriptionValidator.get_business_limits(user.business_id)
                    return jsonify({
                        'error': 'Resource limit exceeded',
                        'message': f'You have reached the maximum limit of {limits[f"max_{resource_type}"]} {resource_type}',
                        'current_count': current_count,
                        'limit': limits[f'max_{resource_type}'],
                        'upgrade_required': True
                    }), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def check_subscription_before_action(resource_type):
    """
    Decorator to check subscription limits before creating new resources
    
    Args:
        resource_type: Type of resource being created ('users', 'products', 'orders', 'branches')
    """
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
            
            # Verify JWT token
            verify_jwt_in_request()
            
            # Get current user ID from token
            current_user_id = get_jwt_identity()
            
            # Get user from database
            user = db.session.get(User, current_user_id)
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Superadmin bypass all checks
            if user.role == UserRole.superadmin:
                return fn(*args, **kwargs)
            
            if not user.business_id:
                return jsonify({'error': 'No business associated'}), 403
            
            # Get current counts
            counts = SubscriptionValidator.get_current_counts(user.business_id)
            current_count = counts.get(resource_type, 0)
            
            # Check if adding one more would exceed the limit
            if not SubscriptionValidator.check_resource_limit(user.business_id, resource_type, current_count + 1):
                limits = SubscriptionValidator.get_business_limits(user.business_id)
                return jsonify({
                    'error': 'Resource limit exceeded',
                    'message': f'You have reached the maximum limit of {limits[f"max_{resource_type}"]} {resource_type}. Please upgrade your subscription.',
                    'current_count': current_count,
                    'limit': limits[f'max_{resource_type}'],
                    'upgrade_required': True
                }), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator