from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole
from app.utils.decorators import admin_required, manager_required
from app.utils.middleware import module_required, get_business_id
from datetime import datetime
import re

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'])
@jwt_required()
@module_required('users')
def get_users():
    try:
        business_id = get_business_id()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        role = request.args.get('role', '')
        
        query = User.query.filter_by(business_id=business_id)
        
        if search:
            query = query.filter(
                db.or_(
                    User.username.contains(search),
                    User.email.contains(search),
                    User.first_name.contains(search),
                    User.last_name.contains(search)
                )
            )
        
        if role:
            try:
                query = query.filter(User.role == UserRole[role.lower()])
            except KeyError:
                pass
        
        users = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'users': [user.to_dict() for user in users.items],
            'total': users.total,
            'pages': users.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
@module_required('users')
def get_user(user_id):
    try:
        business_id = get_business_id()
        user = User.query.filter_by(id=user_id, business_id=business_id).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
@module_required('users')
def update_user(user_id):
    try:
        business_id = get_business_id()
        user = User.query.filter_by(id=user_id, business_id=business_id).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if current_user.id == user.id and current_user.role not in [UserRole.superadmin, UserRole.admin]:
            if 'role' in data:
                return jsonify({'error': 'You cannot change your own role'}), 403
        
        # Update allowed fields
        if 'username' in data and data['username'] != user.username:
            existing_user = User.query.filter_by(username=data['username'], business_id=business_id).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'error': 'Username already exists for this business'}), 409
            user.username = data['username']
        
        if 'email' in data and data['email'] != user.email:
            existing_user = User.query.filter_by(email=data['email'], business_id=business_id).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'error': 'Email already exists for this business'}), 409
            user.email = data['email']
        
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'phone' in data:
            user.phone = data['phone']
        
        if 'role' in data and current_user.role in [UserRole.superadmin, UserRole.admin]:
            role_str = data['role'].lower()
            if role_str in [r.value for r in UserRole]:
                if role_str == 'superadmin' and current_user.role != UserRole.superadmin:
                    return jsonify({'error': 'Only superadmins can assign superadmin role'}), 403
                user.role = UserRole[role_str]
        
        if 'is_active' in data and current_user.role in [UserRole.superadmin, UserRole.admin]:
            user.is_active = data['is_active']
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
@module_required('users')
def delete_user(user_id):
    try:
        business_id = get_business_id()
        user = User.query.filter_by(id=user_id, business_id=business_id).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        current_user_id = get_jwt_identity()
        if user.id == current_user_id:
            return jsonify({'error': 'You cannot delete your own account'}), 403
        
        if user.role == UserRole.superadmin:
            current_user = User.query.get(current_user_id)
            if current_user.role != UserRole.superadmin:
                return jsonify({'error': 'Only superadmins can delete other superadmins'}), 403
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@users_bp.route('/roles', methods=['GET'])
@jwt_required()
@module_required('users')
def get_user_roles():
    try:
        roles = [{'id': role.value, 'name': role.name.title()} for role in UserRole if role != UserRole.superadmin]
        return jsonify({'roles': roles}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500