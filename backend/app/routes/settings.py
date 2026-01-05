from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole
from app.utils.decorators import admin_required, staff_required
from app.utils.middleware import module_required, get_business_id
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
        business_id = get_business_id()
        data = request.get_json()
        
        profile = CompanyProfile.query.filter_by(business_id=business_id).first()
        if not profile:
            profile = CompanyProfile(business_id=business_id)
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
        business_id = get_business_id()
        data = request.get_json()
        
        for key, value in data.items():
            setting = SystemSetting.query.filter_by(business_id=business_id, setting_key=key).first()
            if not setting:
                setting = SystemSetting(business_id=business_id, setting_key=key)
                db.session.add(setting)
            
            setting.setting_value = str(value)
        
        db.session.commit()
        
        return jsonify({'message': 'System settings updated successfully'}), 200
        
    except Exception as e:
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
        
        logs = AuditLog.query.filter_by(business_id=business_id).order_by(AuditLog.created_at.desc()).paginate(
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
