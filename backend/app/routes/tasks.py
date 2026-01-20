from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.task import Task
from app.utils.middleware import module_required, get_business_id, get_active_branch_id
from datetime import datetime

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/', methods=['GET'])
@jwt_required()
@module_required('business')
def get_tasks():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        
        query = Task.query.filter_by(business_id=business_id)
        if branch_id:
            query = query.filter_by(branch_id=branch_id)
            
        tasks = query.order_by(Task.due_date.asc()).all()
        return jsonify([task.to_dict() for task in tasks]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/', methods=['POST'])
@jwt_required()
@module_required('business')
def create_task():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        data = request.get_json()
        
        due_date = None
        if data.get('due_date'):
            due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
            
        task = Task(
            business_id=business_id,
            branch_id=branch_id,
            title=data['title'],
            description=data.get('description'),
            project=data.get('project'),
            assigned_to=data.get('assigned_to'),
            due_date=due_date,
            priority=data.get('priority', 'medium'),
            status=data.get('status', 'pending')
        )
        
        db.session.add(task)
        db.session.commit()
        
        return jsonify({'message': 'Task created successfully', 'task': task.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/<int:task_id>', methods=['PUT'])
@jwt_required()
@module_required('business')
def update_task(task_id):
    try:
        business_id = get_business_id()
        task = Task.query.filter_by(id=task_id, business_id=business_id).first()
        
        if not task:
            return jsonify({'error': 'Task not found'}), 404
            
        data = request.get_json()
        
        if 'title' in data: task.title = data['title']
        if 'description' in data: task.description = data['description']
        if 'project' in data: task.project = data['project']
        if 'assigned_to' in data: task.assigned_to = data['assigned_to']
        if 'due_date' in data:
            task.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
        if 'priority' in data: task.priority = data['priority']
        if 'status' in data: task.status = data['status']
        if 'branch_id' in data: task.branch_id = data['branch_id']
        
        db.session.commit()
        return jsonify({'message': 'Task updated successfully', 'task': task.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@jwt_required()
@module_required('business')
def delete_task(task_id):
    try:
        business_id = get_business_id()
        task = Task.query.filter_by(id=task_id, business_id=business_id).first()
        
        if not task:
            return jsonify({'error': 'Task not found'}), 404
            
        db.session.delete(task)
        db.session.commit()
        return jsonify({'message': 'Task deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
