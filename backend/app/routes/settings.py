from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole
from app.utils.decorators import admin_required, staff_required
from app.utils.middleware import module_required
from datetime import datetime
from sqlalchemy import func

settings_bp = Blueprint('settings', __name__)

# Import the models from the models module
from app.models.settings import CompanyProfile, UserPermission, SystemSetting, AuditLog

# Company Profile API
@settings_bp.route('/company-profile', methods=['GET'])
@jwt_required()
@module_required('settings')
def get_company_profile():
    try:
        profile = CompanyProfile.query.first()
        if not profile:
            # Create default profile if none exists
            profile = CompanyProfile(
                company_name='Trade Flow Solutions',
                email='contact@tradeflow.com',
                phone='+1 (555) 000-1234',
                address='123 Business Ave, Tech City, TC 12345',
                website='https://tradeflow.com',
                tax_rate=15.00,
                currency='USD'
            )
            db.session.add(profile)
            db.session.commit()
        
        return jsonify({'company_profile': profile.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@settings_bp.route('/company-profile', methods=['PUT'])
@jwt_required()
@module_required('settings')
@admin_required
def update_company_profile():
    try:
        data = request.get_json()
        
        profile = CompanyProfile.query.first()
        if not profile:
            profile = CompanyProfile()
            db.session.add(profile)
        
        # Update profile fields
        if 'company_name' in data:
            profile.company_name = data['company_name']
        if 'email' in data:
            profile.email = data['email']
        if 'phone' in data:
            profile.phone = data['phone']
        if 'address' in data:
            profile.address = data['address']
        if 'website' in data:
            profile.website = data['website']
        if 'tax_rate' in data:
            profile.tax_rate = data['tax_rate']
        if 'currency' in data:
            profile.currency = data['currency']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Company profile updated successfully',
            'company_profile': profile.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Users & Roles API
@settings_bp.route('/users', methods=['GET'])
@jwt_required()
@module_required('settings')
def get_users():
    try:
        users = User.query.all()
        return jsonify({
            'users': [user.to_dict(include_sensitive=False) for user in users]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@settings_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@module_required('settings')
@admin_required
def update_user(user_id):
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        if 'role' in data:
            user.role = UserRole[data['role'].upper()]
        if 'is_active' in data:
            user.is_active = data['is_active']
        if 'email' in data:
            user.email = data['email']
        
        db.session.commit()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict(include_sensitive=False)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@settings_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@module_required('settings')
@admin_required
def delete_user(user_id):
    try:
        user = User.query.get_or_404(user_id)
        
        # Don't actually delete, just deactivate
        user.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'User deactivated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Permissions API
@settings_bp.route('/permissions', methods=['GET'])
@jwt_required()
@module_required('settings')
def get_permissions():
    try:
        permissions = UserPermission.query.all()
        return jsonify({
            'permissions': [perm.to_dict() for perm in permissions]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@settings_bp.route('/permissions', methods=['POST'])
@jwt_required()
@module_required('settings')
@admin_required
def create_permission():
    try:
        data = request.get_json()
        
        permission = UserPermission(
            user_id=data.get('user_id'),
            module=data.get('module'),
            permission=data.get('permission'),
            granted=data.get('granted', True)
        )
        
        db.session.add(permission)
        db.session.commit()
        
        return jsonify({
            'message': 'Permission created successfully',
            'permission': permission.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@settings_bp.route('/permissions/<int:permission_id>', methods=['PUT'])
@jwt_required()
@module_required('settings')
@admin_required
def update_permission(permission_id):
    try:
        permission = UserPermission.query.get_or_404(permission_id)
        data = request.get_json()
        
        if 'granted' in data:
            permission.granted = data['granted']
        
        db.session.commit()
        
        return jsonify({'message': 'Permission updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@settings_bp.route('/permissions/<int:permission_id>', methods=['DELETE'])
@jwt_required()
@module_required('settings')
@admin_required
def delete_permission(permission_id):
    try:
        permission = UserPermission.query.get_or_404(permission_id)
        db.session.delete(permission)
        db.session.commit()
        
        return jsonify({'message': 'Permission deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# System Settings API
@settings_bp.route('/system', methods=['GET'])
@jwt_required()
@module_required('settings')
def get_system_settings():
    try:
        settings = SystemSetting.query.all()
        return jsonify({
            'system_settings': [setting.to_dict() for setting in settings]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@settings_bp.route('/system', methods=['PUT'])
@jwt_required()
@module_required('settings')
@admin_required
def update_system_settings():
    try:
        data = request.get_json()
        
        for key, value in data.items():
            setting = SystemSetting.query.filter_by(setting_key=key).first()
            if not setting:
                setting = SystemSetting(setting_key=key)
                db.session.add(setting)
            
            setting.setting_value = str(value)
        
        db.session.commit()
        
        return jsonify({'message': 'System settings updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Integrations API
@settings_bp.route('/integrations', methods=['GET'])
@jwt_required()
@module_required('settings')
def get_integrations():
    try:
        # Mock integrations data - in real implementation, this would come from integration models
        integrations = [
            {
                'id': 1,
                'name': 'Stripe Payment Gateway',
                'enabled': True,
                'last_sync': '2023-06-15T10:30:00Z',
                'status': 'Connected'
            },
            {
                'id': 2,
                'name': 'QuickBooks',
                'enabled': False,
                'last_sync': None,
                'status': 'Not Connected'
            },
            {
                'id': 3,
                'name': 'Mailchimp',
                'enabled': True,
                'last_sync': '2023-06-15T09:15:00Z',
                'status': 'Connected'
            }
        ]
        
        return jsonify({'integrations': integrations}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@settings_bp.route('/integrations/<int:integration_id>', methods=['PUT'])
@jwt_required()
@module_required('settings')
@admin_required
def update_integration(integration_id):
    try:
        data = request.get_json()
        enabled = data.get('enabled', False)
        
        # In a real implementation, this would update the integration status
        # For now, we just return a success message
        return jsonify({
            'message': f'Integration {integration_id} updated successfully',
            'enabled': enabled
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Backup & Restore API
@settings_bp.route('/backup', methods=['GET'])
@jwt_required()
@module_required('settings')
@admin_required
def get_backup_status():
    try:
        # Mock backup status data
        backup_status = {
            'last_backup': '2023-06-15T03:00:00Z',
            'backup_frequency': 'daily',
            'retention_days': 30,
            'storage_used': '2.5 GB',
            'total_backups': 15
        }
        
        return jsonify({'backup_status': backup_status}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@settings_bp.route('/backup', methods=['POST'])
@jwt_required()
@module_required('settings')
@admin_required
def create_backup():
    try:
        # In a real implementation, this would trigger a backup process
        return jsonify({
            'message': 'Backup process initiated successfully',
            'backup_id': 'backup_12345',
            'status': 'in_progress'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Audit Logs API
@settings_bp.route('/audit-logs', methods=['GET'])
@jwt_required()
@module_required('settings')
@admin_required
def get_audit_logs():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        logs = AuditLog.query.order_by(AuditLog.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'audit_logs': [log.to_dict() for log in logs.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': logs.total,
                'pages': logs.pages
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


