from flask import request, jsonify
from app.utils.subscription_validator import SubscriptionValidator
from app.models.user import User, UserRole
from app import db
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

class SubscriptionMiddleware:
    """Middleware to check subscription status for protected routes"""
    
    # Routes that require subscription validation
    SUBSCRIPTION_REQUIRED_ROUTES = [
        '/api/users',
        '/api/customers',
        '/api/products',
        '/api/orders',
        '/api/suppliers',
        '/api/inventory',
        '/api/hr',
        '/api/expenses',
        '/api/reports',
        '/api/dashboard'
    ]
    
    # Feature-specific routes mapping
    FEATURE_ROUTES_MAPPING = {
        'HR & Payroll': ['/api/hr', '/api/employees', '/api/payroll'],
        'Inventory Management': ['/api/inventory', '/api/products', '/api/suppliers'],
        'Advanced Reporting': ['/api/reports'],
        'Multi-branch': ['/api/branches'],
        'Asset Management': ['/api/assets']
    }
    
    @staticmethod
    def check_subscription_access():
        """Check if the current request requires subscription validation"""
        # Skip OPTIONS requests (CORS preflight)
        if request.method == 'OPTIONS':
            return None
            
        # Check if route requires subscription
        path = request.path
        
        # Skip authentication routes
        if path.startswith('/api/auth'):
            return None
            
        # Skip subscription-related routes to avoid circular dependency
        if path.startswith('/api/subscriptions'):
            return None
            
        # Check if path requires subscription
        requires_subscription = any(
            path.startswith(route) for route in SubscriptionMiddleware.SUBSCRIPTION_REQUIRED_ROUTES
        )
        
        if not requires_subscription:
            return None
            
        # Verify JWT token
        try:
            verify_jwt_in_request()
        except Exception:
            return jsonify({'error': 'Authentication required'}), 401
            
        # Get current user
        current_user_id = get_jwt_identity()
        user = db.session.get(User, current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        # Superadmin bypass all checks
        if user.role == UserRole.superadmin:
            return None
            
        if not user.business_id:
            return jsonify({
                'error': 'No business associated',
                'message': 'User must belong to a business to access business features'
            }), 403
            
        # Check for active subscription
        # Allow GET requests (read-only) to bypass strict subscription check
        # This matches the @subscription_required(allow_read=True) decorator behavior
        if request.method != 'GET' and not SubscriptionValidator.has_active_subscription(user.business_id):
            return jsonify({
                'error': 'No active subscription',
                'message': 'Please subscribe to a plan to access business features',
                'requires_subscription': True,
                'business_id': user.business_id
            }), 403
            
        # Check feature-specific access
        feature_check = SubscriptionMiddleware._check_feature_access(path, user.business_id)
        if feature_check:
            return feature_check
            
        return None
    
    @staticmethod
    def check_subscription_access():
        """Check if the current request requires subscription validation"""
        # Skip OPTIONS requests (CORS preflight)
        if request.method == 'OPTIONS':
            return None
            
        # Check if route requires subscription
        path = request.path
        
        # Skip authentication routes
        if path.startswith('/api/auth'):
            return None
            
        # Skip subscription-related routes to avoid circular dependency
        if path.startswith('/api/subscriptions'):
            return None
            
        # Check if path requires subscription
        requires_subscription = any(
            path.startswith(route) for route in SubscriptionMiddleware.SUBSCRIPTION_REQUIRED_ROUTES
        )
        
        if not requires_subscription:
            return None
            
        # Verify JWT token
        try:
            verify_jwt_in_request()
        except Exception:
            return jsonify({'error': 'Authentication required'}), 401
            
        # Get current user
        current_user_id = get_jwt_identity()
        user = db.session.get(User, current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        # Superadmin bypass all checks
        if user.role == UserRole.superadmin:
            return None
            
        if not user.business_id:
            return jsonify({
                'error': 'No business associated',
                'message': 'User must belong to a business to access business features'
            }), 403
            
        # Check for active subscription
        # Allow GET requests (read-only) to bypass strict subscription check
        # This matches the @subscription_required(allow_read=True) decorator behavior
        if request.method != 'GET' and not SubscriptionValidator.has_active_subscription(user.business_id):
            return jsonify({
                'error': 'No active subscription',
                'message': 'Please subscribe to a plan to access business features',
                'requires_subscription': True,
                'business_id': user.business_id
            }), 403
            
        # Check feature-specific access
        feature_check = SubscriptionMiddleware._check_feature_access(path, user.business_id)
        if feature_check:
            return feature_check
            
        return None

    
    @staticmethod
    def _check_feature_access(path, business_id):
        """Check if the requested path requires specific feature access"""
        # Allow GET requests (read-only) to bypass feature checks
        if request.method == 'GET':
            return None

        for feature, routes in SubscriptionMiddleware.FEATURE_ROUTES_MAPPING.items():
            if any(path.startswith(route) for route in routes):
                if not SubscriptionValidator.check_feature_access(business_id, feature):
                    # Get available plans that include this feature
                    from app.models.subscription import Plan
                    plans_with_feature = []
                    all_plans = Plan.query.all()
                    for plan in all_plans:
                        if plan.features and feature in plan.features:
                            plans_with_feature.append({
                                'name': plan.name,
                                'price': plan.price,
                                'id': plan.id
                            })
                    
                    return jsonify({
                        'error': 'Feature not available',
                        'message': f'The {feature} feature is not available in your current subscription plan.',
                        'upgrade_message': f'Upgrade to a plan that includes {feature} to access this functionality.',
                        'feature_required': feature,
                        'upgrade_required': True,
                        'available_plans': plans_with_feature,
                        'redirect_to': '/subscription'
                    }), 403
        return None
    
    @staticmethod
    def before_request():
        """Flask before_request handler"""
        return SubscriptionMiddleware.check_subscription_access()