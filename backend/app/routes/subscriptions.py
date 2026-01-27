from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from sqlalchemy import func
from app.models.user import User
from app.models.business import Business
from app.models.subscription import Subscription, Plan, SubscriptionStatus, PlanType
from app.utils.decorators import admin_required, superadmin_required
from datetime import datetime, timedelta

subscriptions_bp = Blueprint('subscriptions', __name__)

@subscriptions_bp.route('/plans', methods=['GET'])
def get_plans():
    """Get all available subscription plans"""
    try:
        plans = Plan.query.filter_by(is_active=True).all()
        return jsonify({
            'plans': [plan.to_dict() for plan in plans]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@subscriptions_bp.route('/plans', methods=['POST'])
@jwt_required()
@superadmin_required
def create_plan():
    """Create a new subscription plan (superadmin only)"""
    try:
        data = request.get_json()
        
        required_fields = ['name', 'plan_type', 'price']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if plan already exists
        existing_plan = Plan.query.filter_by(name=data['name']).first()
        if existing_plan:
            return jsonify({'error': 'Plan with this name already exists'}), 400
        
        plan = Plan(
            name=data['name'],
            plan_type=PlanType[data['plan_type'].upper()],
            price=data.get('price', 0),
            billing_cycle=data.get('billing_cycle', 'monthly'),
            max_users=data.get('max_users', 1),
            max_products=data.get('max_products', 100),
            max_orders=data.get('max_orders', 1000),
            max_branches=data.get('max_branches', 1),
            features=data.get('features', [])
        )
        
        db.session.add(plan)
        db.session.commit()
        
        return jsonify({
            'message': 'Plan created successfully',
            'plan': plan.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@subscriptions_bp.route('/subscribe', methods=['POST'])
@jwt_required()
@admin_required
def subscribe():
    """Subscribe to a plan"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.business_id:
            return jsonify({'error': 'User or business not found'}), 404
        
        data = request.get_json()
        
        if 'plan_id' not in data:
            return jsonify({'error': 'plan_id is required'}), 400
        
        plan = Plan.query.get(data['plan_id'])
        if not plan or not plan.is_active:
            return jsonify({'error': 'Invalid or inactive plan'}), 404
        
        # Check if there's already an active subscription
        existing_subscription = Subscription.query.filter_by(
            business_id=user.business_id,
            is_active=True
        ).filter(
            Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL])
        ).first()
        
        if existing_subscription:
            # Deactivate old subscription
            existing_subscription.is_active = False
            existing_subscription.status = SubscriptionStatus.CANCELLED
        
        # Calculate dates
        start_date = datetime.utcnow()
        
        # Determine subscription duration based on billing cycle
        if plan.billing_cycle == 'yearly':
            end_date = start_date + timedelta(days=365)
        else:  # monthly
            end_date = start_date + timedelta(days=30)
        
        # Create new subscription
        subscription = Subscription(
            business_id=user.business_id,
            plan_id=plan.id,
            status=SubscriptionStatus.ACTIVE,  # In production, this would be PENDING until payment
            start_date=start_date,
            end_date=end_date,
            auto_renew=data.get('auto_renew', True),
            payment_method=data.get('payment_method', 'manual'),
            last_payment_date=start_date,
            next_billing_date=end_date
        )
        
        db.session.add(subscription)
        db.session.commit()
        
        return jsonify({
            'message': 'Subscription created successfully',
            'subscription': subscription.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@subscriptions_bp.route('/subscription/current', methods=['GET'])
@jwt_required()
def get_current_subscription():
    """Get current user's business subscription"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.business_id:
            return jsonify({'error': 'User or business not found'}), 404
        
        active_subscription = Subscription.query.filter_by(
            business_id=user.business_id,
            is_active=True
        ).filter(
            Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL])
        ).filter(
            Subscription.end_date >= datetime.utcnow()
        ).first()
        
        if not active_subscription:
            return jsonify({
                'has_subscription': False,
                'subscription': None
            }), 200
        
        return jsonify({
            'has_subscription': True,
            'subscription': active_subscription.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@subscriptions_bp.route('/subscription/cancel', methods=['POST'])
@jwt_required()
@admin_required
def cancel_subscription():
    """Cancel current subscription"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.business_id:
            return jsonify({'error': 'User or business not found'}), 404
        
        active_subscription = Subscription.query.filter_by(
            business_id=user.business_id,
            is_active=True
        ).filter(
            Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL])
        ).first()
        
        if not active_subscription:
            return jsonify({'error': 'No active subscription found'}), 404
        
        active_subscription.status = SubscriptionStatus.CANCELLED
        active_subscription.is_active = False
        active_subscription.auto_renew = False
        
        db.session.commit()
        
        return jsonify({'message': 'Subscription cancelled successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@subscriptions_bp.route('/all', methods=['GET'])
@jwt_required()
@superadmin_required
def get_all_subscriptions():
    """Get all subscriptions (superadmin only)"""
    try:
        subscriptions = Subscription.query.all()
        return jsonify({
            'subscriptions': [
                {
                    **sub.to_dict(),
                    'business_name': sub.business.name if sub.business else 'Unknown'
                } for sub in subscriptions
            ]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@subscriptions_bp.route('/stats', methods=['GET'])
@jwt_required()
@superadmin_required
def get_subscription_stats():
    """Get subscription statistics (superadmin only)"""
    try:
        total_subscriptions = Subscription.query.count()
        active_subscriptions = Subscription.query.filter_by(status=SubscriptionStatus.ACTIVE).count()
        trial_subscriptions = Subscription.query.filter_by(status=SubscriptionStatus.TRIAL).count()
        expired_subscriptions = Subscription.query.filter_by(status=SubscriptionStatus.EXPIRED).count()
        
        # Revenue stats (simplified)
        total_revenue = db.session.query(func.sum(Plan.price)).join(Subscription).filter(Subscription.status == SubscriptionStatus.ACTIVE).scalar() or 0
        
        return jsonify({
            'total': total_subscriptions,
            'active': active_subscriptions,
            'trial': trial_subscriptions,
            'expired': expired_subscriptions,
            'monthly_revenue': float(total_revenue)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@subscriptions_bp.route('/<int:subscription_id>/status', methods=['PUT'])
@jwt_required()
@superadmin_required
def update_subscription_status(subscription_id):
    """Update subscription status (superadmin only)"""
    try:
        subscription = Subscription.query.get(subscription_id)
        if not subscription:
            return jsonify({'error': 'Subscription not found'}), 404
            
        data = request.get_json()
        if 'status' in data:
            subscription.status = SubscriptionStatus[data['status'].upper()]
        if 'end_date' in data:
            subscription.end_date = datetime.fromisoformat(data['end_date'].replace('Z', ''))
        if 'is_active' in data:
            subscription.is_active = data['is_active']
            
        db.session.commit()
        return jsonify({'message': 'Subscription updated successfully', 'subscription': subscription.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@subscriptions_bp.route('/plans/<int:plan_id>', methods=['PUT'])
@jwt_required()
@superadmin_required
def update_plan(plan_id):
    """Update a plan (superadmin only)"""
    try:
        plan = Plan.query.get(plan_id)
        if not plan:
            return jsonify({'error': 'Plan not found'}), 404
            
        data = request.get_json()
        if 'name' in data:
            plan.name = data['name']
        if 'plan_type' in data:
            plan.plan_type = PlanType[data['plan_type'].upper()]
        if 'price' in data:
            plan.price = data['price']
        if 'max_users' in data:
            plan.max_users = data['max_users']
        if 'max_products' in data:
            plan.max_products = data['max_products']
        if 'max_orders' in data:
            plan.max_orders = data['max_orders']
        if 'max_branches' in data:
            plan.max_branches = data['max_branches']
        if 'features' in data:
            plan.features = data['features']
        if 'is_active' in data:
            plan.is_active = data['is_active']
            
        db.session.commit()
        return jsonify({'message': 'Plan updated successfully', 'plan': plan.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@subscriptions_bp.route('/plans/<int:plan_id>', methods=['DELETE'])
@jwt_required()
@superadmin_required
def delete_plan(plan_id):
    """Deactivate a plan (superadmin only)"""
    try:
        plan = Plan.query.get(plan_id)
        if not plan:
            return jsonify({'error': 'Plan not found'}), 404
            
        plan.is_active = False
        db.session.commit()
        return jsonify({'message': 'Plan deactivated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
