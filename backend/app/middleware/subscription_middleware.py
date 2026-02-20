from flask import request, jsonify
from app.utils.subscription_validator import SubscriptionValidator
from app.models.user import User, UserRole
from app import db
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from functools import lru_cache
import time

# Cache for plans (valid for 5 minutes)
_plans_cache = {
    'data': None,
    'timestamp': 0
}
CACHE_DURATION = 300  # 5 minutes in seconds

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
    
    # Feature-specific routes mapping - maps features to required routes
    FEATURE_ROUTES_MAPPING = {
        'HR & Payroll': [
            '/api/hr', 
            '/api/employees', 
            '/api/payroll',
            '/api/attendance',
            '/api/leave',
            '/api/performance',
            '/api/departments'
        ],
        'Inventory Management': [
            '/api/inventory', 
            '/api/products', 
            '/api/suppliers',
            '/api/categories',
            '/api/warehouse'
        ],
        'Advanced Reporting': [
            '/api/reports'
        ],
        'Multi-branch': [
            '/api/branches'
        ],
        'Asset Management': [
            '/api/assets'
        ],
        'Project Management': [
            '/api/projects'
        ],
        'Lead Management': [
            '/api/leads'
        ],
        'Point of Sale (POS)': [
            '/api/sales/pos'
        ],
        'Purchase Orders': [
            '/api/purchases'
        ],
        'Returns Management': [
            '/api/returns'
        ],
        'Payroll Processing': [
            '/api/hr/payroll'
        ],
        'Tax Management': [
            '/api/taxes'
        ],
        'Document Management': [
            '/api/documents'
        ],
        'Approval Workflows': [
            '/api/approvals',
            '/api/workflows'
        ],
        'Customer CRM': [
            '/api/customers'
        ],
        'Invoice Management': [
            '/api/invoices'
        ],
        'Supplier Bills': [
            '/api/supplier-bills'
        ],
        'Warehouse Management': [
            '/api/warehouse'
        ],
        'API Access': [
            '/api/'
        ],
        'Custom Reports Builder': [
            '/api/reports/custom'
        ]
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
                'error': 'subscription_required',
                'title': 'Subscription Required',
                'message': 'Please subscribe to a plan to access business features',
                'description': 'To create products, orders, customers, and other business resources, you need an active subscription plan.',
                'requires_subscription': True,
                'business_id': user.business_id,
                'action': {
                    'label': 'View Subscription Plans',
                    'url': '/subscription'
                }
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

        # All plans now have access to everything - no need to check plan_type
        # Get the features from the business limits
        limits = SubscriptionValidator.get_business_limits(business_id)
        user_features = limits.get('features', []) or []
        
        # If no features are defined, allow access (backwards compatibility)
        if not user_features:
            return None

        for feature, routes in SubscriptionMiddleware.FEATURE_ROUTES_MAPPING.items():
            if any(path.startswith(route) for route in routes):
                # Map route features to plan features
                feature_mapping = {
                    'HR & Payroll': ['HR & Payroll', 'Employee Management', 'Attendance Tracking', 'Leave Management', 'Payroll Processing'],
                    'Inventory Management': ['Inventory Management', 'Product Management', 'Category Management', 'Warehouse Management'],
                    'Advanced Reporting': ['Advanced Reporting', 'Custom Reports Builder'],
                    'Multi-branch': ['Multi-Branch Support', 'Multi-branch'],
                    'Asset Management': ['Asset Management'],
                    'Project Management': ['Project Management'],
                    'Lead Management': ['Lead Management'],
                    'Point of Sale (POS)': ['Point of Sale (POS)', 'POS (Single Terminal)'],
                    'Purchase Orders': ['Purchase Orders'],
                    'Returns Management': ['Returns Management'],
                    'Payroll Processing': ['Payroll Processing'],
                    'Tax Management': ['Tax Management'],
                    'Document Management': ['Document Management'],
                    'Approval Workflows': ['Approval Workflows'],
                    'Customer CRM': ['Customer CRM'],
                    'Invoice Management': ['Invoices', 'Invoice Management'],
                    'Supplier Bills': ['Supplier Bills'],
                    'Warehouse Management': ['Warehouse Management'],
                    'API Access': ['API Access'],
                    'Custom Reports Builder': ['Custom Reports Builder']
                }
                
                required_features = feature_mapping.get(feature, [feature])
                has_access = any(f in user_features for f in required_features)
                
                if not has_access:
                    # Get available plans that include this feature (with caching)
                    plans_with_feature = SubscriptionMiddleware._get_cached_plans_for_feature(feature)
                    
                    return jsonify({
                        'error': 'feature_not_available',
                        'title': f'{feature} Not Available',
                        'message': f'You need the {feature} feature to access this page.',
                        'description': f'The {feature} feature is not included in your current subscription plan. Upgrade to access this feature.',
                        'upgrade_message': f'Upgrade to a plan that includes {feature} to access this functionality.',
                        'feature_required': feature,
                        'upgrade_required': True,
                        'available_plans': plans_with_feature,
                        'action': {
                            'label': 'View Subscription Plans',
                            'url': '/subscription'
                        },
                        'redirect_to': '/subscription'
                    }), 403
        return None
    
    @staticmethod
    def _get_cached_plans_for_feature(feature):
        """Get plans with a specific feature, with caching"""
        global _plans_cache
        
        current_time = time.time()
        if _plans_cache['data'] is None or (current_time - _plans_cache['timestamp']) > CACHE_DURATION:
            from app.models.subscription import Plan
            all_plans = Plan.query.all()
            _plans_cache['data'] = {plan.id: plan for plan in all_plans}
            _plans_cache['timestamp'] = current_time
        
        plans_with_feature = []
        for plan_id, plan in _plans_cache['data'].items():
            if plan.features and feature in plan.features:
                plans_with_feature.append({
                    'name': plan.name,
                    'price': plan.price,
                    'id': plan.id
                })
        return plans_with_feature
    
    @staticmethod
    def before_request():
        """Flask before_request handler"""
        return SubscriptionMiddleware.check_subscription_access()