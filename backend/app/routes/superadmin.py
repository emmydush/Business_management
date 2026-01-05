from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole, UserApprovalStatus
from app.utils.middleware import module_required
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

        stats = {
            'users': {
                'total': total_users,
                'active': active_users,
                'roles': role_counts
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
        users = User.query.all()
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
        return jsonify({'message': 'User rejected successfully', 'user': user.to_dict()}), 200
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

        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500



