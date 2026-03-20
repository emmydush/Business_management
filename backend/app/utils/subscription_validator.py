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
                'plan_name': 'None',
                'plan_type': 'none'
            }
        
        return {
            'max_users': subscription.plan.max_users,
            'max_products': subscription.plan.max_products,
            'max_orders': subscription.plan.max_orders,
            'max_branches': subscription.plan.max_branches,
            'features': subscription.get_features(),  # Use the new method to get effective features
            'plan_name': subscription.plan.name,
            'plan_type': subscription.plan.plan_type.value
        }
    
    @staticmethod
    def check_feature_access(business_id, feature_name):
        """Check if business has access to a specific feature"""
        limits = SubscriptionValidator.get_business_limits(business_id)
        
        # All plans now have access to everything (except superadmin-specific features)
        # The features list already contains all features for all plan types
        return feature_name in limits['features']
    
    @staticmethod
    def check_resource_limit(business_id, resource_type, current_count):
        """Check if business has reached a resource limit"""
        limits = SubscriptionValidator.get_business_limits(business_id)
        
        # All plans now have unlimited resources (set to 999999 in seed_plans.py)
        # No need to check plan_type restrictions
        
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
            # Subscription restrictions removed: always allow access.
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
            # Subscription restrictions removed: always allow actions.
            return fn(*args, **kwargs)
        return wrapper
    return decorator