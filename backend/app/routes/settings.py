from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole
from app.utils.decorators import admin_required, staff_required, subscription_required
from app.utils.middleware import module_required, get_business_id
from datetime import datetime
from sqlalchemy import func

settings_bp = Blueprint('settings', __name__)

# Import the models from the models module
from app.models.settings import CompanyProfile, UserPermission, SystemSetting, ALLOWED_CURRENCIES
from app.models.audit_log import AuditLog, AuditAction

# Currency API
@settings_bp.route('/allowed-currencies', methods=['GET'])
def get_allowed_currencies():
    """Get list of allowed currencies"""
    try:
        return jsonify({
            'allowed_currencies': ALLOWED_CURRENCIES,
            'count': len(ALLOWED_CURRENCIES)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Company Profile API
@settings_bp.route('/company-profile', methods=['GET'])
@jwt_required()
@module_required('settings')
def get_company_profile():
    try:
        business_id = get_business_id()
        profile = CompanyProfile.query.filter_by(business_id=business_id).first()
        if not profile:
            # Create default profile if none exists for this business
            profile = CompanyProfile(
                business_id=business_id,
                company_name='My Business',
                email='',
                phone='',
                address='',
                website='',
                tax_rate=0.00,
                currency='RWF'  # Default to RWF, which is in ALLOWED_CURRENCIES
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
        business_id = get_business_id()
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        profile = CompanyProfile.query.filter_by(business_id=business_id).first()
        if not profile:
            # Set default company_name to avoid nullable constraint violation
            company_name = data.get('company_name', 'My Business') if data else 'My Business'
            profile = CompanyProfile(business_id=business_id, company_name=company_name)
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
            # Handle tax_rate conversion - convert string to float or use default
            try:
                if data['tax_rate'] is None or data['tax_rate'] == '':
                    profile.tax_rate = 0.00
                else:
                    profile.tax_rate = float(data['tax_rate'])
            except (ValueError, TypeError):
                profile.tax_rate = 0.00
        if 'currency' in data:
            # Validate currency against allowed list
            if data['currency'] not in ALLOWED_CURRENCIES:
                return jsonify({
                    'error': f'Invalid currency. Allowed currencies are: {", ".join(ALLOWED_CURRENCIES)}'
                }), 400
            profile.currency = data['currency']
        # New fields
        if 'business_type' in data:
            profile.business_type = data['business_type']
        if 'registration_number' in data:
            profile.registration_number = data['registration_number']
        if 'fiscal_year_start' in data:
            profile.fiscal_year_start = data['fiscal_year_start']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Company profile updated successfully',
            'company_profile': profile.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        import traceback
        print(f"Error updating company profile: {traceback.format_exc()}")
        return jsonify({'error': f'Failed to update company profile: {str(e)}'}), 500


# Users & Roles API
@settings_bp.route('/users', methods=['GET'])
@jwt_required()
@module_required('settings')
def get_users():
    try:
        business_id = get_business_id()
        users = User.query.filter_by(business_id=business_id).all()
        return jsonify({
            'users': [user.to_dict() for user in users]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@settings_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@module_required('settings')
@admin_required
@subscription_required
def update_user(user_id):
    try:
        business_id = get_business_id()
        user = User.query.filter_by(id=user_id, business_id=business_id).first_or_404()
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
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@settings_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@module_required('settings')
@admin_required
@subscription_required
def delete_user(user_id):
    try:
        business_id = get_business_id()
        user = User.query.filter_by(id=user_id, business_id=business_id).first_or_404()
        
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
        business_id = get_business_id()
        permissions = UserPermission.query.filter_by(business_id=business_id).all()
        return jsonify({
            'permissions': [perm.to_dict() for perm in permissions]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@settings_bp.route('/permissions', methods=['POST'])
@jwt_required()
@module_required('settings')
@admin_required
@subscription_required
def create_permission():
    try:
        business_id = get_business_id()
        data = request.get_json()
        
        # Ensure user belongs to the same business
        user = User.query.filter_by(id=data.get('user_id'), business_id=business_id).first()
        if not user:
            return jsonify({'error': 'User not found for this business'}), 404
            
        permission = UserPermission(
            business_id=business_id,
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
@subscription_required
def update_permission(permission_id):
    try:
        business_id = get_business_id()
        permission = UserPermission.query.filter_by(id=permission_id, business_id=business_id).first_or_404()
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
@subscription_required
def delete_permission(permission_id):
    try:
        business_id = get_business_id()
        permission = UserPermission.query.filter_by(id=permission_id, business_id=business_id).first_or_404()
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
        business_id = get_business_id()
        settings = SystemSetting.query.filter_by(business_id=business_id).all()
        
        # Convert to dict format
        settings_dict = {setting.setting_key: setting.setting_value for setting in settings}
        
        # Get tax-related settings from CompanyProfile
        company_profile = CompanyProfile.query.filter_by(business_id=business_id).first()
        if company_profile:
            if company_profile.tax_rate is not None:
                settings_dict['tax_rate'] = float(company_profile.tax_rate)
            if company_profile.registration_number:
                settings_dict['tax_number'] = company_profile.registration_number
        
        # Return as list of dicts for compatibility
        system_settings = [{'setting_key': k, 'setting_value': str(v)} for k, v in settings_dict.items()]
        
        return jsonify({
            'system_settings': system_settings
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@settings_bp.route('/system', methods=['PUT'])
@jwt_required()
@module_required('settings')
@admin_required
def update_system_settings():
    try:
        business_id = get_business_id()
        data = request.get_json()
        
        # Handle tax-related settings - save to CompanyProfile
        tax_related_keys = ['tax_rate', 'tax_number']
        tax_data = {}
        for key in tax_related_keys:
            if key in data:
                tax_data[key] = data.pop(key)
        
        # If there are tax-related settings, update CompanyProfile
        if tax_data:
            company_profile = CompanyProfile.query.filter_by(business_id=business_id).first()
            if not company_profile:
                company_profile = CompanyProfile(business_id=business_id, company_name='My Business')
                db.session.add(company_profile)
            
            if 'tax_rate' in tax_data:
                try:
                    company_profile.tax_rate = float(tax_data['tax_rate'])
                except (ValueError, TypeError):
                    company_profile.tax_rate = 0.0
            if 'tax_number' in tax_data:
                company_profile.registration_number = tax_data['tax_number']
        
        # Save remaining settings to SystemSetting
        for key, value in data.items():
            setting = SystemSetting.query.filter_by(business_id=business_id, setting_key=key).first()
            if not setting:
                setting = SystemSetting(business_id=business_id, setting_key=key)
                db.session.add(setting)
            
            setting.setting_value = str(value)
        
        db.session.commit()
        
        return jsonify({'message': 'System settings updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Backup API
@settings_bp.route('/backup', methods=['GET'])
@jwt_required()
@module_required('settings')
@admin_required
def get_backup_status():
    try:
        business_id = get_business_id()
        # Get backup-related settings
        backup_settings = SystemSetting.query.filter(
            SystemSetting.business_id == business_id,
            SystemSetting.setting_key.in_(['auto_backup', 'backup_frequency', 'backup_retention', 'last_backup'])
        ).all()
        
        settings_dict = {}
        for setting in backup_settings:
            settings_dict[setting.setting_key] = setting.setting_value
        
        return jsonify({
            'backup_settings': settings_dict
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@settings_bp.route('/backup', methods=['POST'])
@jwt_required()
@module_required('settings')
@admin_required
def create_backup():
    try:
        business_id = get_business_id()
        # Update last backup time
        setting = SystemSetting.query.filter_by(business_id=business_id, setting_key='last_backup').first()
        if not setting:
            setting = SystemSetting(business_id=business_id, setting_key='last_backup')
            db.session.add(setting)
        
        setting.setting_value = datetime.utcnow().isoformat()
        db.session.commit()
        
        return jsonify({
            'message': 'Backup created successfully',
            'backup_time': setting.setting_value
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Audit Logs API
@settings_bp.route('/audit-logs', methods=['GET'])
@jwt_required()
@module_required('settings')
@admin_required
def get_audit_logs():
    try:
        business_id = get_business_id()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        action_filter = request.args.get('action', '')
        user_id_filter = request.args.get('user_id', '')
        
        query = AuditLog.query.filter_by(business_id=business_id)
        
        if action_filter:
            try:
                query = query.filter(AuditLog.action == AuditAction(action_filter))
            except ValueError:
                # If action_filter doesn't match enum, return empty results
                query = query.filter(AuditLog.id == 0)
        if user_id_filter:
            query = query.filter_by(user_id=int(user_id_filter))
        
        logs = query.order_by(AuditLog.created_at.desc()).paginate(
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
