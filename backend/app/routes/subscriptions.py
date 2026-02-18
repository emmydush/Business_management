from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from sqlalchemy import func
from app.models.user import User
from app.models.business import Business
from app.models.subscription import Subscription, Plan, SubscriptionStatus, PlanType
from app.models.payment import Payment, PaymentStatus
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
        
        if existing_subscription and existing_subscription.plan_id == int(data['plan_id']):
            return jsonify({'error': 'You are already subscribed to this plan'}), 400
            
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
            status=SubscriptionStatus.PENDING,  # Requires superadmin approval
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
            Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL, SubscriptionStatus.PENDING])
        ).order_by(Subscription.created_at.desc()).first()
        
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
        if 'plan_id' in data and data['plan_id']:
            try:
                subscription.plan_id = int(data['plan_id'])
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid plan_id'}), 400
        if 'custom_features' in data:
            # Handle custom features - set to None to use plan features, or a list for custom
            if data['custom_features'] is None or data['custom_features'] == '':
                subscription.custom_features = None
            else:
                subscription.custom_features = data['custom_features']
        
        db.session.commit()
        
        # Create notification for the business admin
        try:
            from app.models.communication import Notification
            from app.models.user import UserRole
            
            # Find the business admin(s)
            admins = User.query.filter_by(business_id=subscription.business_id, role=UserRole.admin).all()
            
            for admin in admins:
                notification = Notification(
                    business_id=subscription.business_id,
                    user_id=admin.id,
                    title="Subscription Updated",
                    message=f"Your subscription to the {subscription.plan.name} plan is now {subscription.status.value}.",
                    type="success" if subscription.status == SubscriptionStatus.ACTIVE else "info"
                )
                db.session.add(notification)
            
            db.session.commit()
        except Exception as e:
            print(f"Error creating notification: {e}")
            # Don't fail the whole request if notification fails
            
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


@subscriptions_bp.route('/subscription/payment', methods=['POST'])
@jwt_required()
def record_subscription_payment():
    """Record a subscription payment and activate subscription"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.business_id:
            return jsonify({'error': 'User or business not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['plan_id', 'amount', 'provider_reference']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        plan = Plan.query.get(data['plan_id'])
        if not plan:
            return jsonify({'error': 'Plan not found'}), 404
        
        # Check for existing active subscription
        existing_subscription = Subscription.query.filter_by(
            business_id=user.business_id,
            is_active=True
        ).filter(
            Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL])
        ).first()
        
        if existing_subscription:
            existing_subscription.is_active = False
            existing_subscription.status = SubscriptionStatus.CANCELLED
        
        # Calculate dates
        start_date = datetime.utcnow()
        if plan.billing_cycle == 'yearly':
            end_date = start_date + timedelta(days=365)
        else:  # monthly
            end_date = start_date + timedelta(days=30)
        
        # Create new subscription with ACTIVE status
        subscription = Subscription(
            business_id=user.business_id,
            plan_id=plan.id,
            status=SubscriptionStatus.ACTIVE,  # Auto-activate after payment
            start_date=start_date,
            end_date=end_date,
            auto_renew=data.get('auto_renew', True),
            payment_method=data.get('payment_method', 'momo'),
            last_payment_date=start_date,
            next_billing_date=end_date,
            is_active=True
        )
        
        db.session.add(subscription)
        db.session.flush()  # Flush to get subscription ID
        
        # Record payment
        payment = Payment(
            business_id=user.business_id,
            subscription_id=subscription.id,
            amount=float(data['amount']),
            provider=data.get('provider', 'mtn_momo'),
            provider_reference=data['provider_reference'],
            status=data.get('status', PaymentStatus.COMPLETED),
            meta={
                'user_id': current_user_id,
                'user_name': f"{user.first_name} {user.last_name}",
                'plan_name': plan.name,
                'plan_price': float(plan.price),
                'phone_number': data.get('phone_number'),
                'description': data.get('description', 'Subscription Payment')
            }
        )
        
        db.session.add(payment)
        db.session.commit()
        
        return jsonify({
            'message': 'Subscription payment recorded successfully',
            'subscription': subscription.to_dict(),
            'payment': payment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@subscriptions_bp.route('/payments', methods=['GET'])
@jwt_required()
@superadmin_required
def get_all_subscription_payments():
    """Get all subscription payments (superadmin only)"""
    try:
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        
        # Get all payments ordered by created_at descending
        payments_query = Payment.query.order_by(Payment.created_at.desc())
        
        # Filter by status if provided
        status = request.args.get('status')
        if status:
            payments_query = payments_query.filter(Payment.status == status)
        
        # Paginate
        paginated = payments_query.paginate(page=page, per_page=limit, error_out=False)
        
        payments = []
        for payment in paginated.items:
            business = payment.business
            subscription = payment.subscription
            plan = subscription.plan if subscription else None
            
            # Get user info from metadata first, fallback to database
            user_name = payment.meta.get('user_name', 'Unknown') if payment.meta else 'Unknown'
            user_email = payment.meta.get('user_email', '') if payment.meta else ''
            plan_name = payment.meta.get('plan_name', 'N/A') if payment.meta else 'N/A'
            
            # Use subscription data if available
            if subscription and plan:
                plan_name = plan.name
            
            # If metadata doesn't have user info, try to get from database
            if user_name == 'Unknown' or not user_email:
                try:
                    if business:
                        user = User.query.filter_by(business_id=business.id).first()
                        if user:
                            user_name = f"{user.first_name} {user.last_name}"
                            user_email = user.email
                except:
                    pass
            
            payments.append({
                'id': payment.id,
                'business_id': payment.business_id,
                'business_name': business.name if business else 'Unknown',
                'user_name': user_name,
                'user_email': user_email,
                'plan_name': plan_name,
                'amount': float(payment.amount),
                'provider': payment.provider,
                'status': payment.status,
                'created_at': payment.created_at.isoformat(),
                'subscription_status': subscription.status.value if subscription and subscription.status else 'N/A',
                'metadata': payment.meta
            })
        
        return jsonify({
            'payments': payments,
            'total': paginated.total,
            'pages': paginated.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        import traceback
        print(f"Error in get_all_subscription_payments: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500
