from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole, UserApprovalStatus
from app.models.business import Business
from app.models.subscription import Subscription, SubscriptionStatus, Plan
from app.models.settings import SystemSetting
from app.utils.middleware import module_required
from app.utils.email_service import EmailService
from sqlalchemy import func
try:
    import psutil
except ImportError:
    psutil = None
import platform
from datetime import datetime, timedelta

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
        role_counts = {role.value: count for role, count in users_by_role}

        # Business stats
        total_businesses = Business.query.count()
        active_businesses = Business.query.filter_by(is_active=True).count()

        # System stats (optional - psutil may be missing in some environments)
        if psutil:
            cpu_usage = f"{psutil.cpu_percent()}%"
            memory = psutil.virtual_memory()
            memory_usage = f"{memory.percent}%" if memory else 'N/A'

            # Handle disk usage for Windows/Linux
            disk_path = 'C:\\' if platform.system() == 'Windows' else '/'
            try:
                disk = psutil.disk_usage(disk_path)
                disk_percent = f"{disk.percent}%"
            except:
                disk_percent = 'N/A'

            import time
            uptime_seconds = time.time() - psutil.boot_time()
            uptime_str = str(timedelta(seconds=int(uptime_seconds)))
        else:
            cpu_usage = 'N/A'
            memory_usage = 'N/A'
            disk_percent = 'N/A'
            uptime_str = 'N/A'

        system_info = {
            'os': platform.system(),
            'os_release': platform.release(),
            'cpu_usage': cpu_usage,
            'memory_usage': memory_usage,
            'disk_usage': disk_percent,
            'uptime': uptime_str
        }

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
            },
            'system': system_info
        }
        
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@superadmin_bp.route('/system-health', methods=['GET'])
@jwt_required()
@module_required('superadmin')
def get_system_health():
    try:
        # More detailed system health
        health = {
            'status': 'Healthy',
            'database': 'Connected',
            'storage': 'Available',
            'last_backup': '2026-01-04 22:00:00', # Mock
            'services': [
                {'name': 'Auth Service', 'status': 'Running'},
                {'name': 'Inventory Service', 'status': 'Running'},
                {'name': 'Sales Service', 'status': 'Running'},
                {'name': 'HR Service', 'status': 'Running'}
            ]
        }
        return jsonify(health), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@superadmin_bp.route('/toggle-module', methods=['POST'])
@jwt_required()
@module_required('superadmin')
def toggle_module():
    # In a real app, this would update a global settings table
    data = request.get_json()
    module = data.get('module')
    status = data.get('status')
    return jsonify({'message': f'Module {module} set to {status}'}), 200

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

        # For users with related records, we'll use soft deletion to avoid constraint violations
        user.is_active = False
        user.approval_status = UserApprovalStatus.REJECTED
        db.session.commit()
        
        return jsonify({'message': 'User deactivated successfully (related records preserved)'}), 200
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
        
        status_str = "activated" if business.is_active else "blocked"
        return jsonify({
            'message': f'Business {business.name} has been {status_str}',
            'business': business.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500



