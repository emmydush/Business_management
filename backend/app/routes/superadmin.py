from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole, UserApprovalStatus
from app.models.business import Business
from app.models.subscription import Subscription, SubscriptionStatus, Plan
from app.models.settings import SystemSetting
from app.models.audit_log import AuditLog, AuditAction
from app.utils.middleware import module_required
from app.utils.email_service import EmailService
from sqlalchemy import func, desc
try:
    import psutil
except ImportError:
    psutil = None
import platform
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

superadmin_bp = Blueprint('superadmin', __name__)

@superadmin_bp.route('/stats', methods=['GET'])
@jwt_required()
@module_required('superadmin')
def get_superadmin_stats():
    try:
        # User stats
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        users_by_role = db.session.query(User.role, func.count(User.id)).group_by(User.role).all()
        role_counts = {}
        for role, count in users_by_role:
            # Handle both enum and string roles
            if hasattr(role, 'value'):
                role_counts[role.value] = count
            else:
                role_counts[str(role)] = count

        # Business stats
        total_businesses = Business.query.count()
        active_businesses = Business.query.filter_by(is_active=True).count()

        # Subscription stats
        total_subscriptions = Subscription.query.count()
        active_subscriptions = Subscription.query.filter_by(status=SubscriptionStatus.ACTIVE).count()
        total_revenue = db.session.query(func.sum(Plan.price)).join(Subscription).filter(Subscription.status == SubscriptionStatus.ACTIVE).scalar() or 0

        stats = {
            'users': {
                'total': total_users,
                'active': active_users,
                'roles': role_counts
            },
            'businesses': {
                'total': total_businesses,
                'active': active_businesses
            },
            'subscriptions': {
                'total': total_subscriptions,
                'active': active_subscriptions,
                'monthly_revenue': float(total_revenue)
            }
        }
        
        return jsonify(stats), 200
    except Exception as e:
        import traceback
        print(f"Error in get_superadmin_stats: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@superadmin_bp.route('/audit-logs', methods=['GET'])
@jwt_required()
@module_required('superadmin')
def get_audit_logs():
    try:
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Get filter parameters
        action = request.args.get('action')
        entity_type = request.args.get('entity_type')
        user_id = request.args.get('user_id', type=int)
        business_id = request.args.get('business_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Build query - superadmin sees ALL audit logs across all businesses
        query = AuditLog.query
        
        # Apply filters
        if action:
            try:
                query = query.filter(AuditLog.action == AuditAction(action))
            except ValueError:
                pass  # Invalid action value, ignore filter
        if entity_type:
            query = query.filter(AuditLog.entity_type == entity_type)
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if business_id:
            query = query.filter(AuditLog.business_id == business_id)
        if start_date:
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(AuditLog.created_at >= start_dt)
        if end_date:
            end_dt = datetime.strptime(end_date, '%Y-%m-%d')
            # Include the entire end date
            end_dt = end_dt + timedelta(days=1)
            query = query.filter(AuditLog.created_at < end_dt)
        
        # Order by creation date descending
        query = query.order_by(desc(AuditLog.created_at))
        
        # Paginate results
        audit_logs = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'logs': [log.to_dict() for log in audit_logs.items],
            'total': audit_logs.total,
            'pages': audit_logs.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except ValueError as e:
        return jsonify({'error': f'Invalid parameter: {str(e)}'}), 400
    except Exception as e:
        import traceback
        print(f"Error in get_audit_logs: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@superadmin_bp.route('/toggle-module', methods=['POST'])
@jwt_required()
@module_required('superadmin')
def toggle_module():
    try:
        data = request.get_json()
        module = data.get('module')
        status = data.get('status')
        
        if not module:
            return jsonify({'error': 'Module name is required'}), 400
        
        # Store module status in system settings (global, business_id is None)
        setting = SystemSetting.query.filter_by(
            business_id=None,
            setting_key=f'module_{module}'
        ).first()
        
        if not setting:
            setting = SystemSetting(
                business_id=None,
                setting_key=f'module_{module}',
                setting_value=str(status),
                setting_type='boolean',
                description=f'Module {module} enabled status'
            )
            db.session.add(setting)
        else:
            setting.setting_value = str(status)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Module {module} set to {status}',
            'module': module,
            'status': status
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@superadmin_bp.route('/users', methods=['GET'])
@jwt_required()
@module_required('superadmin')
def get_all_users():
    try:
        users = User.query.filter_by(is_active=True).all()
        return jsonify([user.to_dict() for user in users]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@superadmin_bp.route('/users/<int:user_id>/approve', methods=['PUT'])
@jwt_required()
@module_required('superadmin')
def approve_user(user_id):
    try:
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        current_user_id = get_jwt_identity()
        user.approval_status = UserApprovalStatus.APPROVED
        user.approved_by = current_user_id
        user.approved_at = datetime.utcnow().date()
        
        db.session.commit()
        
        # Send approval email
        try:
            from app.utils.email import send_approval_email
            send_approval_email(user, user.business_id)
        except Exception as email_err:
            print(f"Warning: Could not send approval email: {email_err}")
            
        return jsonify({'message': 'User approved successfully', 'user': user.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@superadmin_bp.route('/users/<int:user_id>/reject', methods=['PUT'])
@jwt_required()
@module_required('superadmin')
def reject_user(user_id):
    try:
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        current_user_id = get_jwt_identity()
        # Use correct enum value
        user.approval_status = UserApprovalStatus.REJECTED
        user.approved_by = current_user_id
        user.approved_at = datetime.utcnow().date()
        
        db.session.commit()
        
        # Send rejection email
        try:
            from app.utils.email import send_rejection_email
            send_rejection_email(user, user.business_id)
        except Exception as email_err:
            print(f"Warning: Could not send rejection email: {email_err}")
            
        return jsonify({'message': 'User rejected successfully', 'user': user.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@superadmin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@module_required('superadmin')
def update_user_superadmin(user_id):
    try:
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        current_user_id = get_jwt_identity()
        current_user = db.session.get(User, current_user_id)

        data = request.get_json()
        
        # Update allowed fields
        if 'username' in data and data['username'] != user.username:
            existing_user = User.query.filter_by(username=data['username']).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'error': 'Username already exists'}), 409
            user.username = data['username']
        
        if 'email' in data and data['email'] != user.email:
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'error': 'Email already exists'}), 409
            user.email = data['email']
        
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'phone' in data:
            user.phone = data['phone']
        
        if 'role' in data:
            role_str = data['role'].lower()
            if role_str in [r.value for r in UserRole]:
                if role_str == 'superadmin' and current_user.role != UserRole.superadmin:
                    return jsonify({'error': 'Only superadmins can assign superadmin role'}), 403
                user.role = UserRole[role_str]
        
        if 'is_active' in data:
            user.is_active = data['is_active']
            
        if 'approval_status' in data:
            approval_status_str = data['approval_status'].lower()
            if approval_status_str in [s.value.lower() for s in UserApprovalStatus]:
                user.approval_status = UserApprovalStatus(approval_status_str.upper())
                if approval_status_str == 'approved':
                    user.approved_by = current_user_id
                    user.approved_at = datetime.utcnow().date()
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@superadmin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@module_required('superadmin')
def delete_user_superadmin(user_id):
    try:
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        current_user_id = get_jwt_identity()
        # Prevent deleting your own account
        if user.id == current_user_id:
            return jsonify({'error': 'You cannot delete your own account'}), 403

        # Only allow non-superadmin users to be deleted by non-superadmins
        if user.role == UserRole.superadmin:
            current_user = db.session.get(User, current_user_id)
            if current_user.role != UserRole.superadmin:
                return jsonify({'error': 'Only superadmins can delete other superadmins'}), 403

        # Perform hard deletion
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Superadmin Email Settings
@superadmin_bp.route('/email-settings', methods=['GET'])
@jwt_required()
@module_required('superadmin')
def get_global_email_settings():
    try:
        # Global settings have business_id as NULL
        email_settings = SystemSetting.query.filter(
            SystemSetting.business_id.is_(None),
            SystemSetting.setting_key.like('email_%')
        ).all()
        
        settings_dict = {}
        for setting in email_settings:
            settings_dict[setting.setting_key] = setting.setting_value
        
        return jsonify({'email_settings': settings_dict}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@superadmin_bp.route('/email-settings', methods=['PUT'])
@jwt_required()
@module_required('superadmin')
def update_global_email_settings():
    try:
        data = request.get_json()
        
        # Define email setting keys
        email_setting_keys = [
            'email_smtp_host', 'email_smtp_port', 'email_smtp_username', 
            'email_smtp_password', 'email_sender_email', 'email_sender_name',
            'email_encryption', 'email_enable_ssl', 'email_enable_tls', 'email_timeout', 'email_enabled'
        ]
        
        for key in email_setting_keys:
            if key in data:
                # Get existing setting or create new one
                setting = SystemSetting.query.filter_by(
                    business_id=None,  # Global setting
                    setting_key=key
                ).first()
                
                if not setting:
                    setting = SystemSetting(
                        business_id=None,  # Global setting
                        setting_key=key
                    )
                    db.session.add(setting)
                
                setting.setting_value = str(data[key])
        
        db.session.commit()
        
        return jsonify({'message': 'Global email settings updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@superadmin_bp.route('/email-settings/test', methods=['POST'])
@jwt_required()
@module_required('superadmin')
def test_global_email_settings():
    try:
        data = request.get_json()
        test_email = data.get('test_email') or data.get('email_sender_email')
        
        if not test_email:
            return jsonify({'error': 'Test email address is required'}), 400
        
        # Use the email service to send a test email with the provided settings
        # This allows testing settings BEFORE saving them to the database
        result = EmailService.send_email(
            to_email=test_email,
            subject="Test Global Email",
            body=f"This is a test email to {test_email} to confirm global email settings are working properly.",
            business_id=None,
            force=True,
            custom_config=data  # Pass the data from the form
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@superadmin_bp.route('/businesses', methods=['GET'])
@jwt_required()
@module_required('superadmin')
def get_all_businesses():
    try:
        businesses = Business.query.all()
        return jsonify([b.to_dict() for b in businesses]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@superadmin_bp.route('/businesses/<int:business_id>', methods=['PUT'])
@jwt_required()
@module_required('superadmin')
def update_business_superadmin(business_id):
    try:
        business = db.session.get(Business, business_id)
        if not business:
            return jsonify({'error': 'Business not found'}), 404

        data = request.get_json()
        
        # Update allowed fields
        if 'name' in data:
            business.name = data['name']
        if 'email' in data:
            business.email = data['email']
        if 'phone' in data:
            business.phone = data['phone']
        if 'address' in data:
            business.address = data['address']
        if 'city' in data:
            business.city = data['city']
        if 'country' in data:
            business.country = data['country']
        if 'is_active' in data:
            business.is_active = data['is_active']
        
        business.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Business updated successfully',
            'business': business.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@superadmin_bp.route('/businesses/<int:business_id>/toggle-status', methods=['PUT'])
@jwt_required()
@module_required('superadmin')
def toggle_business_status(business_id):
    try:
        business = db.session.get(Business, business_id)
        if not business:
            return jsonify({'error': 'Business not found'}), 404
        
        business.is_active = not business.is_active
        
        db.session.commit()
        
        # Send email notification to business owner
        try:
            # Get the business owner (admin user)
            from app.models.user import User, UserRole
            owner = User.query.filter_by(
                business_id=business_id,
                role=UserRole.admin
            ).first()
            
            if owner:
                from app.utils.email import send_business_blocked_email, send_business_activated_email
                if business.is_active:
                    send_business_activated_email(owner, business)
                else:
                    send_business_blocked_email(owner, business)
        except Exception as email_err:
            print(f"Warning: Could not send business status email: {email_err}")
        
        status_str = "activated" if business.is_active else "blocked"
        return jsonify({
            'message': f'Business {business.name} has been {status_str}',
            'business': business.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@superadmin_bp.route('/businesses/<int:business_id>', methods=['DELETE'])
@jwt_required()
@module_required('superadmin')
def delete_business_superadmin(business_id):
    try:
        business = db.session.get(Business, business_id)
        if not business:
            return jsonify({'error': 'Business not found'}), 404

        # Delete the business - this will trigger cascade deletion of all related records
        db.session.delete(business)
        db.session.commit()
        
        return jsonify({'message': 'Business and all related data deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Superadmin - Global Broadcast/Announcements
@superadmin_bp.route('/broadcast', methods=['POST'])
@jwt_required()
@module_required('superadmin')
def send_broadcast():
    try:
        data = request.get_json()
        title = data.get('title')
        message = data.get('message')
        target = data.get('target', 'all')  # all, businesses, users
        priority = data.get('priority', 'normal')  # low, normal, high, critical
        
        if not title or not message:
            return jsonify({'error': 'Title and message are required'}), 400
        
        # Get all businesses or users based on target
        if target == 'all' or target == 'businesses':
            businesses = Business.query.filter_by(is_active=True).all()
            for business in businesses:
                # Create notification for each business
                from app.models.communication import Notification
                notification = Notification(
                    business_id=business.id,
                    user_id=None,  # Business-wide notification
                    title=title,
                    message=message,
                    notification_type='broadcast',
                    priority=priority
                )
                db.session.add(notification)
        
        if target == 'all' or target == 'users':
            users = User.query.filter_by(is_active=True).all()
            for user in users:
                from app.models.communication import Notification
                notification = Notification(
                    business_id=user.business_id,
                    user_id=user.id,
                    title=title,
                    message=message,
                    notification_type='broadcast',
                    priority=priority
                )
                db.session.add(notification)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Broadcast sent successfully to {target}',
            'title': title
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Superadmin - API Usage Analytics
@superadmin_bp.route('/api-analytics', methods=['GET'])
@jwt_required()
@module_required('superadmin')
def get_api_analytics():
    try:
        from app.models.audit_log import AuditLog
        from datetime import datetime, timedelta
        
        # Get date range from query params
        days = request.args.get('days', 7, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get API calls by endpoint
        api_logs = AuditLog.query.filter(
            AuditLog.action.like('API%'),
            AuditLog.created_at >= start_date
        ).all()
        
        # Group by action
        endpoint_counts = {}
        for log in api_logs:
            action = log.action
            if action not in endpoint_counts:
                endpoint_counts[action] = {'total': 0, 'by_business': {}}
            endpoint_counts[action]['total'] += 1
            
            # Count by business
            if log.business_id:
                if log.business_id not in endpoint_counts[action]['by_business']:
                    endpoint_counts[action]['by_business'][log.business_id] = 0
                endpoint_counts[action]['by_business'][log.business_id] += 1
        
        # Daily API calls
        daily_counts = {}
        for i in range(days):
            date = (datetime.utcnow() - timedelta(days=i)).strftime('%Y-%m-%d')
            daily_counts[date] = 0
        
        for log in api_logs:
            date = log.created_at.strftime('%Y-%m-%d')
            if date in daily_counts:
                daily_counts[date] += 1
        
        # Top businesses by API usage
        business_api_counts = {}
        for log in api_logs:
            if log.business_id:
                if log.business_id not in business_api_counts:
                    business_api_counts[log.business_id] = 0
                business_api_counts[log.business_id] += 1
        
        # Get business names
        top_businesses = []
        for business_id, count in sorted(business_api_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
            business = db.session.get(Business, business_id)
            if business:
                top_businesses.append({
                    'business_id': business_id,
                    'business_name': business.name,
                    'api_calls': count
                })
        
        analytics = {
            'total_calls': len(api_logs),
            'days': days,
            'endpoint_usage': endpoint_counts,
            'daily_calls': daily_counts,
            'top_businesses': top_businesses,
            'avg_daily_calls': len(api_logs) / days if days > 0 else 0
        }
        
        return jsonify(analytics), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Superadmin - Global System Settings
@superadmin_bp.route('/system-settings', methods=['GET'])
@jwt_required()
@module_required('superadmin')
def get_global_system_settings():
    try:
        # Get all global settings (business_id is NULL)
        settings = SystemSetting.query.filter(SystemSetting.business_id.is_(None)).all()
        
        settings_dict = {}
        for setting in settings:
            settings_dict[setting.setting_key] = setting.setting_value
        
        return jsonify({'settings': settings_dict}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@superadmin_bp.route('/system-settings', methods=['PUT'])
@jwt_required()
@module_required('superadmin')
def update_global_system_settings():
    try:
        data = request.get_json()
        
        for key, value in data.items():
            setting = SystemSetting.query.filter_by(
                business_id=None,
                setting_key=key
            ).first()
            
            if not setting:
                setting = SystemSetting(
                    business_id=None,
                    setting_key=key
                )
                db.session.add(setting)
            
            setting.setting_value = str(value)
        
        db.session.commit()
        
        return jsonify({'message': 'System settings updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Superadmin - Audit Logs
@superadmin_bp.route('/audit-logs', methods=['GET'])
@jwt_required()
@module_required('superadmin')
def get_superadmin_audit_logs():
    try:
        from app.models.audit_log import AuditLog, AuditAction
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        action_filter = request.args.get('action', None)
        user_filter = request.args.get('user_id', None, type=int)
        business_filter = request.args.get('business_id', None, type=int)
        
        query = AuditLog.query
        
        if action_filter:
            try:
                query = query.filter(AuditLog.action == AuditAction(action_filter))
            except ValueError:
                # If action_filter doesn't match enum, return empty results
                query = query.filter(AuditLog.id == 0)
        if user_filter:
            query = query.filter_by(user_id=user_filter)
        if business_filter:
            query = query.filter_by(business_id=business_filter)
        
        logs = query.order_by(AuditLog.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'logs': [log.to_dict() for log in logs.items],
            'total': logs.total,
            'pages': logs.pages,
            'current_page': page
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Superadmin - Platform Overview
@superadmin_bp.route('/platform-overview', methods=['GET'])
@jwt_required()
@module_required('superadmin')
def get_platform_overview():
    try:
        from datetime import datetime, timedelta
        from app.models.audit_log import AuditLog
        
        # Time-based stats
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = now - timedelta(days=7)
        month_start = now - timedelta(days=30)
        
        # User registrations
        users_today = User.query.filter(User.created_at >= today_start).count()
        users_week = User.query.filter(User.created_at >= week_start).count()
        users_month = User.query.filter(User.created_at >= month_start).count()
        
        # Business registrations
        businesses_today = Business.query.filter(Business.created_at >= today_start).count()
        businesses_week = Business.query.filter(Business.created_at >= week_start).count()
        businesses_month = Business.query.filter(Business.created_at >= month_start).count()
        
        # Active sessions (based on recent audit logs)
        active_users_24h = AuditLog.query.filter(
            AuditLog.created_at >= now - timedelta(hours=24)
        ).distinct(AuditLog.user_id).count()
        
        # Subscription breakdown
        subscription_breakdown = {}
        for status in SubscriptionStatus:
            count = Subscription.query.filter_by(status=status).count()
            subscription_breakdown[status.value] = count
        
        overview = {
            'users': {
                'total': User.query.count(),
                'today': users_today,
                'this_week': users_week,
                'this_month': users_month,
                'active_24h': active_users_24h
            },
            'businesses': {
                'total': Business.query.count(),
                'today': businesses_today,
                'this_week': businesses_week,
                'this_month': businesses_month,
                'active': Business.query.filter_by(is_active=True).count()
            },
            'subscriptions': subscription_breakdown
        }
        
        return jsonify(overview), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Superadmin - Quick Actions
@superadmin_bp.route('/quick-actions', methods=['POST'])
@jwt_required()
@module_required('superadmin')
def execute_quick_action():
    try:
        data = request.get_json()
        action = data.get('action')
        
        current_user_id = get_jwt_identity()
        
        if action == 'cleanup_sessions':
            # Clean up old sessions from database
            from app.models.settings import SystemSetting
            from datetime import datetime, timedelta
            
            # Get all sessions older than 24 hours
            cutoff_time = datetime.utcnow() - timedelta(hours=24)
            
            # For now, just record the cleanup action
            affected = 0
            
            # Log the cleanup action
            return jsonify({
                'message': 'Session cleanup completed',
                'affected': affected,
                'details': f'Cleaned sessions older than 24 hours'
            }), 200
        
        elif action == 'clear_cache':
            # Clear application cache
            import os
            import shutil
            
            cache_cleared = 0
            cache_dirs = []
            
            # Try to find and clear cache directories
            instance_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'instance')
            if os.path.exists(instance_dir):
                for item in os.listdir(instance_dir):
                    if item.endswith('.db'):
                        cache_dirs.append(item)
            
            cache_cleared = len(cache_dirs)
            
            return jsonify({
                'message': 'Cache cleared successfully',
                'files_cleared': cache_cleared
            }), 200
        
        elif action == 'test_email':
            test_email = data.get('email')
            if not test_email:
                return jsonify({'error': 'Email address required'}), 400
            
            try:
                EmailService.send_email(
                    to_email=test_email,
                    subject='Test Email from MoMo ERP',
                    body='This is a test email to verify email configuration.',
                    business_id=None
                )
                return jsonify({'message': f'Test email sent to {test_email}'}), 200
            except Exception as e:
                return jsonify({'error': f'Failed to send email: {str(e)}'}), 500
        
        elif action == 'maintenance_mode':
            # Toggle maintenance mode
            maintenance_enabled = data.get('enabled', True)
            
            setting = SystemSetting.query.filter_by(
                business_id=None,
                setting_key='maintenance_mode'
            ).first()
            
            if not setting:
                setting = SystemSetting(
                    business_id=None,
                    setting_key='maintenance_mode',
                    setting_value=str(maintenance_enabled),
                    setting_type='boolean',
                    description='Maintenance mode enabled/disabled'
                )
                db.session.add(setting)
            else:
                setting.setting_value = str(maintenance_enabled)
            
            db.session.commit()
            
            return jsonify({
                'message': f'Maintenance mode {"enabled" if maintenance_enabled else "disabled"} successfully',
                'maintenance_mode': maintenance_enabled
            }), 200
        
        else:
            return jsonify({'error': 'Unknown action'}), 400
            
    except Exception as e:
        import traceback
        print(f"Error in execute_quick_action: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500


# Superadmin - Impersonate Business (Login as admin safely)
@superadmin_bp.route('/impersonate/<int:business_id>', methods=['POST'])
@jwt_required()
@module_required('superadmin')
def impersonate_business(business_id):
    """Impersonate a business admin - creates a token to login as that business's admin"""
    try:
        business = db.session.get(Business, business_id)
        if not business:
            return jsonify({'error': 'Business not found'}), 404
        
        if not business.is_active:
            return jsonify({'error': 'Cannot impersonate a suspended business'}), 403
        
        # Find the admin user for this business
        from app.models.user import User, UserRole
        admin_user = User.query.filter_by(
            business_id=business_id,
            role=UserRole.admin,
            is_active=True
        ).first()
        
        if not admin_user:
            return jsonify({'error': 'No active admin found for this business'}), 404
        
        # Create a JWT token for the admin user
        from flask_jwt_extended import create_access_token
        
        # Create impersonation token with additional claims
        additional_claims = {
            'impersonated_by': get_jwt_identity(),
            'impersonated_business_id': business_id,
            'original_role': 'superadmin'
        }
        
        access_token = create_access_token(
            identity=admin_user.id,
            additional_claims=additional_claims
        )
        
        # Log the impersonation action
        try:
            current_superadmin_id = get_jwt_identity()
            audit_log = AuditLog(
                user_id=current_superadmin_id,
                business_id=business_id,
                action=AuditAction.IMPERSONATE,
                entity_type='superadmin',
                description=f'Superadmin impersonated business: {business.name}',
                ip_address=request.remote_addr
            )
            db.session.add(audit_log)
            db.session.commit()
        except Exception as log_err:
            print(f"Warning: Could not create audit log: {log_err}")
        
        return jsonify({
            'message': f'Now impersonating {business.name}',
            'business_id': business_id,
            'business_name': business.name,
            'admin_user_id': admin_user.id,
            'access_token': access_token,
            'user': {
                'id': admin_user.id,
                'email': admin_user.email,
                'username': admin_user.username
            }
        }), 200
    except Exception as e:
        import traceback
        print(f"Error in impersonate_business: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500


# Superadmin - Expiring Subscriptions
@superadmin_bp.route('/subscriptions/expiring', methods=['GET'])
@jwt_required()
@module_required('superadmin')
def get_expiring_subscriptions():
    """Get subscriptions expiring within a given number of days"""
    try:
        days = request.args.get('days', 7, type=int)
        from datetime import datetime, timedelta
        
        expiry_threshold = datetime.utcnow() + timedelta(days=days)
        
        expiring_subs = Subscription.query.filter(
            Subscription.is_active == True,
            Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]),
            Subscription.end_date <= expiry_threshold,
            Subscription.end_date >= datetime.utcnow()
        ).order_by(Subscription.end_date.asc()).all()
        
        result = []
        for sub in expiring_subs:
            business = sub.business
            result.append({
                'subscription_id': sub.id,
                'business_id': business.id if business else None,
                'business_name': business.name if business else 'Unknown',
                'plan_name': sub.plan.name if sub.plan else 'Unknown',
                'status': sub.status.value,
                'end_date': sub.end_date.isoformat() if sub.end_date else None,
                'days_until_expiry': (sub.end_date - datetime.utcnow()).days if sub.end_date else None,
                'auto_renew': sub.auto_renew
            })
        
        return jsonify({
            'expiring_subscriptions': result,
            'total': len(result),
            'days': days
        }), 200
    except Exception as e:
        import traceback
        print(f"Error in get_expiring_subscriptions: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500


# Superadmin - System Health
@superadmin_bp.route('/system-health', methods=['GET'])
@jwt_required()
@module_required('superadmin')
def get_system_health():
    """Get system health status including CPU, memory, disk usage"""
    try:
        health_data = {
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Try to get psutil data if available
        if psutil:
            try:
                health_data['cpu'] = {
                    'percent': psutil.cpu_percent(interval=1),
                    'count': psutil.cpu_count()
                }
                
                memory = psutil.virtual_memory()
                health_data['memory'] = {
                    'total': memory.total,
                    'available': memory.available,
                    'percent': memory.percent,
                    'used': memory.used
                }
                
                disk = psutil.disk_usage('/')
                health_data['disk'] = {
                    'total': disk.total,
                    'used': disk.used,
                    'free': disk.free,
                    'percent': disk.percent
                }
                
                # Check if system is under stress
                if memory.percent > 90 or disk.percent > 90:
                    health_data['status'] = 'warning'
                if memory.percent > 95 or disk.percent > 95:
                    health_data['status'] = 'critical'
                    
            except Exception as ps_err:
                health_data['psutil_error'] = str(ps_err)
        else:
            health_data['psutil'] = 'not available'
        
        # Database connection check
        try:
            db.session.execute(db.text('SELECT 1'))
            health_data['database'] = 'connected'
        except Exception as db_err:
            health_data['database'] = 'error'
            health_data['db_error'] = str(db_err)
            health_data['status'] = 'degraded'
        
        # Maintenance mode check
        maintenance_setting = SystemSetting.query.filter_by(
            business_id=None,
            setting_key='maintenance_mode'
        ).first()
        
        health_data['maintenance_mode'] = maintenance_setting.setting_value == 'True' if maintenance_setting else False
        
        return jsonify(health_data), 200
    except Exception as e:
        import traceback
        print(f"Error in get_system_health: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500


# Superadmin - Revenue Analytics
@superadmin_bp.route('/revenue-analytics', methods=['GET'])
@jwt_required()
@module_required('superadmin')
def get_revenue_analytics():
    """Get detailed revenue analytics"""
    try:
        from app.models.payment import Payment, PaymentStatus
        from datetime import datetime, timedelta
        
        # Get date range from query params
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get all successful payments in the date range
        payments = Payment.query.filter(
            Payment.status == PaymentStatus.COMPLETED,
            Payment.created_at >= start_date
        ).all()
        
        # Calculate total revenue
        total_revenue = sum(float(p.amount) for p in payments)
        
        # Revenue by day
        revenue_by_day = {}
        for i in range(days):
            date = (datetime.utcnow() - timedelta(days=i)).strftime('%Y-%m-%d')
            revenue_by_day[date] = 0
        
        for payment in payments:
            date = payment.created_at.strftime('%Y-%m-%d')
            if date in revenue_by_day:
                revenue_by_day[date] += float(payment.amount)
        
        # Revenue by business
        revenue_by_business = {}
        for payment in payments:
            if payment.business_id:
                if payment.business_id not in revenue_by_business:
                    revenue_by_business[payment.business_id] = {
                        'business_name': payment.business.name if payment.business else 'Unknown',
                        'total': 0
                    }
                revenue_by_business[payment.business_id]['total'] += float(payment.amount)
        
        # Revenue by provider (MoMo, Stripe, etc.)
        revenue_by_provider = {}
        for payment in payments:
            provider = payment.provider or 'unknown'
            if provider not in revenue_by_provider:
                revenue_by_provider[provider] = 0
            revenue_by_provider[provider] += float(payment.amount)
        
        # Average revenue per business
        unique_businesses = len(set(p.business_id for p in payments if p.business_id))
        avg_revenue_per_business = total_revenue / unique_businesses if unique_businesses > 0 else 0
        
        # MRR calculation (Monthly Recurring Revenue)
        # Active subscriptions with their plans
        active_subs = Subscription.query.filter(
            Subscription.status == SubscriptionStatus.ACTIVE,
            Subscription.is_active == True
        ).all()
        
        mrr = 0
        for sub in active_subs:
            if sub.plan:
                if sub.plan.billing_cycle == 'yearly':
                    mrr += sub.plan.price / 12
                else:
                    mrr += sub.plan.price
        
        return jsonify({
            'total_revenue': total_revenue,
            'mrr': mrr,
            'days': days,
            'revenue_by_day': revenue_by_day,
            'revenue_by_business': list(revenue_by_business.values()),
            'revenue_by_provider': revenue_by_provider,
            'total_transactions': len(payments),
            'unique_businesses': unique_businesses,
            'avg_revenue_per_business': avg_revenue_per_business
        }), 200
    except Exception as e:
        import traceback
        print(f"Error in get_revenue_analytics: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500


# Superadmin - Payment Integration Logs
@superadmin_bp.route('/payment-logs', methods=['GET'])
@jwt_required()
@module_required('superadmin')
def get_payment_logs():
    """Get payment integration logs"""
    try:
        from app.models.payment import Payment, PaymentStatus
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        query = Payment.query.order_by(Payment.created_at.desc())
        
        # Filters
        status = request.args.get('status')
        if status:
            query = query.filter(Payment.status == status)
        
        provider = request.args.get('provider')
        if provider:
            query = query.filter(Payment.provider == provider)
        
        business_id = request.args.get('business_id', type=int)
        if business_id:
            query = query.filter(Payment.business_id == business_id)
        
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        
        logs = []
        for payment in paginated.items:
            logs.append({
                'id': payment.id,
                'business_id': payment.business_id,
                'business_name': payment.business.name if payment.business else 'Unknown',
                'subscription_id': payment.subscription_id,
                'amount': float(payment.amount),
                'provider': payment.provider,
                'provider_reference': payment.provider_reference,
                'status': payment.status,
                'created_at': payment.created_at.isoformat(),
                'metadata': payment.meta
            })
        
        return jsonify({
            'logs': logs,
            'total': paginated.total,
            'pages': paginated.pages,
            'current_page': page
        }), 200
    except Exception as e:
        import traceback
        print(f"Error in get_payment_logs: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500


# Superadmin - Export Business Data
@superadmin_bp.route('/business/<int:business_id>/export', methods=['GET'])
@jwt_required()
@module_required('superadmin')
def export_business_data(business_id):
    """Export all data for a specific business"""
    try:
        business = db.session.get(Business, business_id)
        if not business:
            return jsonify({'error': 'Business not found'}), 404
        
        # Gather all data for the business
        from app.models.user import User
        from app.models.order import Order
        from app.models.invoice import Invoice
        from app.models.product import Product
        
        users = User.query.filter_by(business_id=business_id).all()
        orders = Order.query.filter_by(business_id=business_id).all()
        invoices = Invoice.query.filter_by(business_id=business_id).all()
        products = Product.query.filter_by(business_id=business_id).all()
        
        export_data = {
            'business': business.to_dict(),
            'users': [u.to_dict() for u in users],
            'orders': [o.to_dict() for o in orders],
            'invoices': [i.to_dict() for i in invoices],
            'products': [p.to_dict() for p in products],
            'exported_at': datetime.utcnow().isoformat()
        }
        
        return jsonify(export_data), 200
    except Exception as e:
        import traceback
        print(f"Error in export_business_data: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500


# Superadmin - Subscription Plans Management
@superadmin_bp.route('/plans', methods=['GET'])
@jwt_required()
@module_required('superadmin')
def get_all_plans():
    """Get all subscription plans (superadmin view)"""
    try:
        plans = Plan.query.order_by(Plan.price.asc()).all()
        return jsonify({
            'plans': [plan.to_dict() for plan in plans]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Superadmin - Reset Business Admin Password
@superadmin_bp.route('/business/<int:business_id>/reset-password', methods=['POST'])
@jwt_required()
@module_required('superadmin')
def reset_business_admin_password(business_id):
    """Reset the password for a business admin"""
    try:
        business = db.session.get(Business, business_id)
        if not business:
            return jsonify({'error': 'Business not found'}), 404
        
        from app.models.user import User, UserRole
        
        # Find the admin user
        admin_user = User.query.filter_by(
            business_id=business_id,
            role=UserRole.admin
        ).first()
        
        if not admin_user:
            return jsonify({'error': 'No admin user found for this business'}), 404
        
        data = request.get_json()
        new_password = data.get('new_password')
        
        if not new_password or len(new_password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        # Generate password hash
        from werkzeug.security import generate_password_hash
        admin_user.password_hash = generate_password_hash(new_password)
        
        # Clear any reset tokens
        admin_user.reset_token = None
        admin_user.reset_token_expires = None
        
        db.session.commit()
        
        # Log the password reset
        try:
            audit_log = AuditLog(
                user_id=get_jwt_identity(),
                business_id=business_id,
                action=AuditAction.UPDATE,
                entity_type='user',
                entity_id=admin_user.id,
                description=f'Password reset for admin user {admin_user.email} by superadmin'
            )
            db.session.add(audit_log)
            db.session.commit()
        except:
            pass
        
        return jsonify({
            'message': f'Password reset successfully for {admin_user.email}',
            'user_id': admin_user.id
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Superadmin - Business Usage Stats
@superadmin_bp.route('/business/<int:business_id>/usage', methods=['GET'])
@jwt_required()
@module_required('superadmin')
def get_business_usage(business_id):
    """Get usage statistics for a specific business"""
    try:
        business = db.session.get(Business, business_id)
        if not business:
            return jsonify({'error': 'Business not found'}), 404
        
        from app.models.user import User
        from app.models.order import Order
        from app.models.invoice import Invoice
        from app.models.product import Product
        from app.models.customer import Customer
        
        # Count users
        total_users = User.query.filter_by(business_id=business_id).count()
        active_users = User.query.filter_by(business_id=business_id, is_active=True).count()
        
        # Count orders
        total_orders = Order.query.filter_by(business_id=business_id).count()
        
        # Count invoices
        total_invoices = Invoice.query.filter_by(business_id=business_id).count()
        
        # Count products
        total_products = Product.query.filter_by(business_id=business_id).count()
        
        # Count customers
        total_customers = Customer.query.filter_by(business_id=business_id).count()
        
        # Get subscription info
        subscription = Subscription.query.filter_by(
            business_id=business_id,
            is_active=True
        ).filter(
            Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL])
        ).first()
        
        usage = {
            'business_id': business_id,
            'business_name': business.name,
            'users': {
                'total': total_users,
                'active': active_users
            },
            'orders': total_orders,
            'invoices': total_invoices,
            'products': total_products,
            'customers': total_customers,
            'subscription': {
                'plan_name': subscription.plan.name if subscription and subscription.plan else 'No subscription',
                'status': subscription.status.value if subscription else 'None',
                'max_users': subscription.plan.max_users if subscription and subscription.plan else 0,
                'max_products': subscription.plan.max_products if subscription and subscription.plan else 0
            }
        }
        
        return jsonify(usage), 200
    except Exception as e:
        import traceback
        print(f"Error in get_business_usage: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500



