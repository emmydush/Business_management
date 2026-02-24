from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole
from app.models.settings import UserPermission
from app.utils.decorators import admin_required, manager_required, subscription_required
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
@subscription_required
def update_user(user_id):
    try:
        business_id = get_business_id()
        user = User.query.filter_by(id=user_id, business_id=business_id).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        current_user_id = int(get_jwt_identity())
        current_user = db.session.get(User, current_user_id)
        
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
            
        # Update permissions
        if 'permissions' in data and current_user.role in [UserRole.superadmin, UserRole.admin]:
            # Remove existing permissions
            UserPermission.query.filter_by(user_id=user.id).delete()
            
            # Add new permissions (new format: {module: [permissions]})
            # Also support old format for backwards compatibility
            permissions_data = data['permissions']
            
            if isinstance(permissions_data, dict):
                # New format: {module: ['view', 'create', ...]}
                for module, perms in permissions_data.items():
                    if perms:  # Only add if there are permissions
                        permission = UserPermission(
                            business_id=business_id,
                            user_id=user.id,
                            module=module,
                            permissions=perms,
                            granted=True,
                            granted_by=current_user.id
                        )
                        db.session.add(permission)
            elif isinstance(permissions_data, list):
                # Old format: ['module1', 'module2'] - treat as view access
                for module in permissions_data:
                    permission = UserPermission(
                        business_id=business_id,
                        user_id=user.id,
                        module=module,
                        permissions=['view'],
                        granted=True,
                        granted_by=current_user.id
                    )
                    db.session.add(permission)
        
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
@subscription_required
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

# Create user endpoint
@users_bp.route('/', methods=['POST'])
@jwt_required()
@module_required('users')
@admin_required
@subscription_required
def create_user():
    try:
        business_id = get_business_id()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'first_name', 'last_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if username already exists for this business
        existing_user = User.query.filter_by(username=data['username'], business_id=business_id).first()
        if existing_user:
            return jsonify({'error': 'Username already exists for this business'}), 409
        
        # Check if email already exists for this business
        existing_email = User.query.filter_by(email=data['email'], business_id=business_id).first()
        if existing_email:
            return jsonify({'error': 'Email already exists for this business'}), 409
        
        # Determine role - default to staff if not provided or invalid
        role = UserRole.staff
        if data.get('role'):
            try:
                role_str = data['role'].lower()
                if role_str in [r.value for r in UserRole]:
                    role = UserRole[role_str]
            except KeyError:
                pass  # Use default role
        
        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data.get('phone', ''),
            role=role,
            business_id=business_id,
            is_active=data.get('is_active', True)
        )
        
        # Set a default password or require it
        password = data.get('password', 'TempPass123!')
        user.set_password(password)
        
        db.session.add(user)
        db.session.flush() # Get user ID
        
        # Add permissions
        if 'permissions' in data:
            permissions_data = data['permissions']
            
            if isinstance(permissions_data, dict):
                # New format: {module: ['view', 'create', ...]}
                for module, perms in permissions_data.items():
                    if perms:
                        permission = UserPermission(
                            business_id=business_id,
                            user_id=user.id,
                            module=module,
                            permissions=perms,
                            granted=True,
                            granted_by=current_user_id
                        )
                        db.session.add(permission)
            elif isinstance(permissions_data, list):
                # Old format: ['module1', 'module2'] - treat as view access
                for module in permissions_data:
                    permission = UserPermission(
                        business_id=business_id,
                        user_id=user.id,
                        module=module,
                        permissions=['view'],
                        granted=True,
                        granted_by=current_user_id
                    )
                    db.session.add(permission)
        
        db.session.commit()
        
        # Send welcome email
        try:
            from app.utils.email import send_staff_welcome_email
            send_staff_welcome_email(user, password)
        except Exception as email_err:
            print(f"Warning: Could not send welcome email: {email_err}")
        
        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict()
        }), 201
        
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