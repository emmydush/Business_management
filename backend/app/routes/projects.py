from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.utils.decorators import admin_required
from app.utils.middleware import get_business_id
from app.models.project import Project
from app.models.task import Task
from datetime import datetime

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('/', methods=['GET'])
@admin_required
def get_projects():
    try:
        business_id = get_business_id()
        
        projects = Project.query.filter_by(business_id=business_id).all()
        
        return jsonify({'projects': [project.to_dict() for project in projects]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/<int:project_id>', methods=['GET'])
@admin_required
def get_project(project_id):
    try:
        business_id = get_business_id()
        
        project = Project.query.filter_by(id=project_id, business_id=business_id).first()
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
            
        return jsonify({'project': project.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/', methods=['POST'])
@admin_required
def create_project():
    try:
        business_id = get_business_id()
        data = request.get_json()
        
        # Parse deadline string to date if provided
        deadline = None
        if data.get('deadline'):
            try:
                deadline = datetime.strptime(data.get('deadline'), '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid date format for deadline. Use YYYY-MM-DD'}), 400
        
        new_project = Project(
            title=data.get('title'),
            client=data.get('client'),
            budget=data.get('budget', 0),
            spent=data.get('spent', 0),
            deadline=deadline,
            status=data.get('status', 'new'),
            progress=data.get('progress', 0),
            members=data.get('members', 1),
            description=data.get('description', ''),
            business_id=business_id
        )
        
        db.session.add(new_project)
        db.session.commit()
        
        return jsonify({'project': new_project.to_dict(), 'message': 'Project created successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/<int:project_id>', methods=['PUT'])
@admin_required
def update_project(project_id):
    try:
        business_id = get_business_id()
        data = request.get_json()
        
        project = Project.query.filter_by(id=project_id, business_id=business_id).first()
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Update project fields
        if data.get('title'):
            project.title = data.get('title')
        if data.get('client'):
            project.client = data.get('client')
        if data.get('budget') is not None:
            project.budget = data.get('budget')
        if data.get('spent') is not None:
            project.spent = data.get('spent')
        if data.get('deadline'):
            try:
                project.deadline = datetime.strptime(data.get('deadline'), '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid date format for deadline. Use YYYY-MM-DD'}), 400
        if data.get('status'):
            project.status = data.get('status')
        if data.get('progress') is not None:
            project.progress = data.get('progress')
        if data.get('members') is not None:
            project.members = data.get('members')
        if data.get('description') is not None:
            project.description = data.get('description')
        
        project.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'project': project.to_dict(), 'message': 'Project updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/<int:project_id>', methods=['DELETE'])
@admin_required
def delete_project(project_id):
    try:
        business_id = get_business_id()
        
        project = Project.query.filter_by(id=project_id, business_id=business_id).first()
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        db.session.delete(project)
        db.session.commit()
        
        return jsonify({'message': 'Project deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
