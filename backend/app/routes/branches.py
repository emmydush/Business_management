from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.branch import Branch, UserBranchAccess
from app.models.user import User, UserRole
from app import db
from app.utils.decorators import subscription_required
from sqlalchemy.exc import IntegrityError

branches_bp = Blueprint('branches', __name__)

@branches_bp.route('/', methods=['GET'])
@jwt_required()
def get_branches():
    """Get all approved branches for the current user's business"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.business_id:
            return jsonify({'error': 'User not found or not associated with a business'}), 404
        
        # Get all approved branches for the business
        branches = Branch.query.filter_by(
            business_id=user.business_id,
            is_active=True,
            status='approved'
        ).all()
        
        # Get user's accessible branches
        user_branch_ids = [access.branch_id for access in user.branch_access]
        
        branches_data = []
        for branch in branches:
            branch_dict = branch.to_dict()
            branch_dict['has_access'] = branch.id in user_branch_ids
            branch_dict['is_default'] = any(
                access.branch_id == branch.id and access.is_default 
                for access in user.branch_access
            )
            branches_data.append(branch_dict)
        
        return jsonify({
            'branches': branches_data,
            'total': len(branches_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@branches_bp.route('/accessible', methods=['GET'])
@jwt_required()
def get_accessible_branches():
    """Get only approved branches the current user has access to"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not user or not user.role:
            return jsonify({'error': 'User role not defined'}), 403
            
        # If superadmin or business admin, show all approved branches
        if user.role.value in ['superadmin', 'admin']:
            branches = Branch.query.filter_by(
                business_id=user.business_id,
                is_active=True,
                status='approved'
            ).all()
        else:
            # Get only accessible approved branches
            accessible_branch_ids = [access.branch_id for access in user.branch_access]
            branches = Branch.query.filter(
                Branch.id.in_(accessible_branch_ids),
                Branch.is_active == True,
                Branch.status == 'approved'
            ).all() if accessible_branch_ids else []
        
        # Find default branch
        default_branch_id = next(
            (access.branch_id for access in user.branch_access if access.is_default),
            None
        )
        
        branches_data = [
            {**branch.to_dict(), 'is_default': branch.id == default_branch_id}
            for branch in branches
        ]
        
        return jsonify({
            'branches': branches_data,
            'default_branch_id': default_branch_id
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@branches_bp.route('/', methods=['POST'])
@jwt_required()
@subscription_required
def create_branch():
    """Create a new branch (Requires SuperAdmin approval if created by Admin)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role.value not in ['admin', 'superadmin']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        # Superadmins can auto-approve their own branches
        # Admins create pending branches
        status = 'approved' if user.role.value == 'superadmin' else 'pending'
        
        new_branch = Branch(
            business_id=user.business_id,
            name=data.get('name'),
            code=data.get('code'),
            address=data.get('address'),
            city=data.get('city'),
            phone=data.get('phone'),
            email=data.get('email'),
            manager_id=data.get('manager_id'),
            is_headquarters=data.get('is_headquarters', False),
            status=status
        )
        
        db.session.add(new_branch)
        db.session.commit()
        
        message = 'Branch created successfully' if status == 'approved' else 'Branch creation request submitted for SuperAdmin approval'
        
        return jsonify({
            'message': message,
            'branch': new_branch.to_dict()
        }), 201
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Branch code already exists'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@branches_bp.route('/pending', methods=['GET'])
@jwt_required()
def get_pending_branches():
    """Get all pending branches (SuperAdmin only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role.value != 'superadmin':
            return jsonify({'error': 'Unauthorized. SuperAdmin access required.'}), 403
        
        pending_branches = Branch.query.filter_by(status='pending').all()
        
        return jsonify({
            'branches': [b.to_dict() for b in pending_branches],
            'total': len(pending_branches)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@branches_bp.route('/approve/<int:branch_id>', methods=['POST'])
@jwt_required()
def approve_branch(branch_id):
    """Approve a pending branch (SuperAdmin only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role.value != 'superadmin':
            return jsonify({'error': 'Unauthorized. SuperAdmin access required.'}), 403
        
        branch = Branch.query.get(branch_id)
        if not branch:
            return jsonify({'error': 'Branch not found'}), 404
        
        branch.status = 'approved'
        branch.is_active = True
        db.session.commit()
        
        return jsonify({
            'message': f'Branch "{branch.name}" has been approved.',
            'branch': branch.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@branches_bp.route('/reject/<int:branch_id>', methods=['POST'])
@jwt_required()
def reject_branch(branch_id):
    """Reject a pending branch (SuperAdmin only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role.value != 'superadmin':
            return jsonify({'error': 'Unauthorized. SuperAdmin access required.'}), 403
        
        branch = Branch.query.get(branch_id)
        if not branch:
            return jsonify({'error': 'Branch not found'}), 404
        
        branch.status = 'rejected'
        branch.is_active = False
        db.session.commit()
        
        return jsonify({
            'message': f'Branch "{branch.name}" has been rejected.',
            'branch': branch.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@branches_bp.route('/<int:branch_id>', methods=['PUT'])
@jwt_required()
@subscription_required
def update_branch(branch_id):
    """Update branch details (Admin only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role.value not in ['admin', 'superadmin']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        branch = Branch.query.filter_by(
            id=branch_id,
            business_id=user.business_id
        ).first()
        
        if not branch:
            return jsonify({'error': 'Branch not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            branch.name = data['name']
        if 'code' in data:
            branch.code = data['code']
        if 'address' in data:
            branch.address = data['address']
        if 'city' in data:
            branch.city = data['city']
        if 'phone' in data:
            branch.phone = data['phone']
        if 'email' in data:
            branch.email = data['email']
        if 'manager_id' in data:
            branch.manager_id = data['manager_id']
        if 'is_active' in data:
            branch.is_active = data['is_active']
        if 'status' in data and user.role.value == 'superadmin':
            branch.status = data['status']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Branch updated successfully',
            'branch': branch.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@branches_bp.route('/switch/<int:branch_id>', methods=['POST'])
@jwt_required()
def switch_branch(branch_id):
    """
    Switch user's active branch
    Returns the new active branch data
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user has access to this branch
        has_access = UserBranchAccess.query.filter_by(
            user_id=current_user_id,
            branch_id=branch_id
        ).first()
        
        # Admins and superadmins can switch to any branch in their business
        if user.role.value not in ['admin', 'superadmin'] and not has_access:
            return jsonify({'error': 'You do not have access to this branch'}), 403
        
        # Verify branch exists, belongs to user's business, and is approved
        branch = Branch.query.filter_by(
            id=branch_id,
            business_id=user.business_id,
            is_active=True,
            status='approved'
        ).first()
        
        if not branch:
            return jsonify({'error': 'Branch not found, inactive, or pending approval'}), 404
        
        # Update default branch (set all to False, then set the new one)
        UserBranchAccess.query.filter_by(user_id=current_user_id).update({'is_default': False})
        
        if has_access:
            has_access.is_default = True
        else:
            # Create access if admin is switching to a branch they don't have explicit access to
            new_access = UserBranchAccess(
                user_id=current_user_id,
                branch_id=branch_id,
                is_default=True
            )
            db.session.add(new_access)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Switched to branch: {branch.name}',
            'branch': branch.to_dict(),
            'success': True
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@branches_bp.route('/user-access', methods=['POST'])
@jwt_required()
def grant_branch_access():
    """Grant user access to a branch (Admin only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role.value not in ['admin', 'superadmin']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        target_user_id = data.get('user_id')
        branch_id = data.get('branch_id')
        is_default = data.get('is_default', False)
        
        # Verify target user belongs to same business
        target_user = User.query.filter_by(
            id=target_user_id,
            business_id=user.business_id
        ).first()
        
        if not target_user:
            return jsonify({'error': 'Target user not found'}), 404
        
        # Verify branch belongs to business and is approved
        branch = Branch.query.filter_by(
            id=branch_id,
            business_id=user.business_id,
            status='approved'
        ).first()
        
        if not branch:
            return jsonify({'error': 'Branch not found or pending approval'}), 404
        
        # Check if access already exists
        existing_access = UserBranchAccess.query.filter_by(
            user_id=target_user_id,
            branch_id=branch_id
        ).first()
        
        if existing_access:
            return jsonify({'error': 'User already has access to this branch'}), 400
        
        # If this is set as default, remove default from other branches
        if is_default:
            UserBranchAccess.query.filter_by(user_id=target_user_id).update({'is_default': False})
        
        new_access = UserBranchAccess(
            user_id=target_user_id,
            branch_id=branch_id,
            is_default=is_default
        )
        
        db.session.add(new_access)
        db.session.commit()
        
        return jsonify({
            'message': 'Branch access granted successfully',
            'access': new_access.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@branches_bp.route('/user-access/<int:access_id>', methods=['DELETE'])
@jwt_required()
def revoke_branch_access(access_id):
    """Revoke user's access to a branch (Admin only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role.value not in ['admin', 'superadmin']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        access = UserBranchAccess.query.get(access_id)
        
        if not access:
            return jsonify({'error': 'Access record not found'}), 404
        
        # Verify the access belongs to user's business
        if access.user.business_id != user.business_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        db.session.delete(access)
        db.session.commit()
        
        return jsonify({'message': 'Branch access revoked successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
