from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.utils.decorators import staff_required
from app.utils.middleware import module_required, get_business_id
from app.models.task import Task  # We'll reuse Task model or create a Project model
from datetime import datetime
import uuid

projects_bp = Blueprint('projects', __name__)

# Since there's no Project model in the codebase, we'll create a simple implementation
# using a dictionary to store projects in memory for demo purposes
# In a real application, this would be stored in the database

# In-memory storage for demo purposes - in production, use a database model
demo_projects = [
    {
        'id': 1,
        'title': 'Website Redesign',
        'client': 'Acme Corp',
        'budget': 15000,
        'spent': 8500,
        'deadline': '2026-03-15',
        'status': 'in-progress',
        'progress': 65,
        'members': 4,
        'description': 'Overhaul of the corporate website with new branding and e-commerce features.',
        'business_id': 1
    },
    {
        'id': 2,
        'title': 'Mobile App Development',
        'client': 'StartUp Inc',
        'budget': 45000,
        'spent': 12000,
        'deadline': '2026-06-30',
        'status': 'planning',
        'progress': 15,
        'members': 6,
        'description': 'Native iOS and Android application for customer loyalty program.',
        'business_id': 1
    },
    {
        'id': 3,
        'title': 'Internal Dashboard',
        'client': 'Internal',
        'budget': 5000,
        'spent': 4800,
        'deadline': '2025-12-31',
        'status': 'completed',
        'progress': 100,
        'members': 2,
        'description': 'Admin panel for tracking sales and inventory metrics.',
        'business_id': 1
    },
    {
        'id': 4,
        'title': 'Marketing Campaign',
        'client': 'Global Retail',
        'budget': 25000,
        'spent': 20000,
        'deadline': '2026-02-28',
        'status': 'active',
        'progress': 80,
        'members': 3,
        'description': 'Q1 digital marketing push across social media and search.',
        'business_id': 1
    },
    {
        'id': 5,
        'title': 'Cloud Migration',
        'client': 'Data Systems',
        'budget': 80000,
        'spent': 35000,
        'deadline': '2026-09-15',
        'status': 'on-hold',
        'progress': 40,
        'members': 5,
        'description': 'Migrating legacy on-premise servers to AWS infrastructure.',
        'business_id': 1
    },
    {
        'id': 6,
        'title': 'Security Audit',
        'client': 'FinTech Ltd',
        'budget': 12000,
        'spent': 0,
        'deadline': '2026-01-20',
        'status': 'new',
        'progress': 0,
        'members': 2,
        'description': 'Comprehensive security review and penetration testing.',
        'business_id': 1
    },
]

next_project_id = 7

@projects_bp.route('/', methods=['GET'])
@jwt_required()
@module_required('projects')
def get_projects():
    try:
        business_id = get_business_id()
        
        # Filter projects by business_id (in demo, all have business_id 1)
        filtered_projects = [p for p in demo_projects if p['business_id'] == business_id]
        
        return jsonify({'projects': filtered_projects}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/<int:project_id>', methods=['GET'])
@jwt_required()
@module_required('projects')
def get_project(project_id):
    try:
        business_id = get_business_id()
        
        project = next((p for p in demo_projects if p['id'] == project_id and p['business_id'] == business_id), None)
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
            
        return jsonify({'project': project}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/', methods=['POST'])
@jwt_required()
@module_required('projects')
def create_project():
    try:
        business_id = get_business_id()
        data = request.get_json()
        
        global next_project_id
        
        new_project = {
            'id': next_project_id,
            'title': data.get('title'),
            'client': data.get('client'),
            'budget': data.get('budget', 0),
            'spent': data.get('spent', 0),
            'deadline': data.get('deadline'),
            'status': data.get('status', 'new'),
            'progress': data.get('progress', 0),
            'members': data.get('members', 1),
            'description': data.get('description', ''),
            'business_id': business_id
        }
        
        demo_projects.append(new_project)
        next_project_id += 1
        
        return jsonify({'project': new_project, 'message': 'Project created successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/<int:project_id>', methods=['PUT'])
@jwt_required()
@module_required('projects')
def update_project(project_id):
    try:
        business_id = get_business_id()
        data = request.get_json()
        
        project = next((p for p in demo_projects if p['id'] == project_id and p['business_id'] == business_id), None)
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Update project fields
        project.update({
            'title': data.get('title', project['title']),
            'client': data.get('client', project['client']),
            'budget': data.get('budget', project['budget']),
            'spent': data.get('spent', project['spent']),
            'deadline': data.get('deadline', project['deadline']),
            'status': data.get('status', project['status']),
            'progress': data.get('progress', project['progress']),
            'members': data.get('members', project['members']),
            'description': data.get('description', project['description'])
        })
        
        return jsonify({'project': project, 'message': 'Project updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/<int:project_id>', methods=['DELETE'])
@jwt_required()
@module_required('projects')
def delete_project(project_id):
    try:
        business_id = get_business_id()
        
        project = next((p for p in demo_projects if p['id'] == project_id and p['business_id'] == business_id), None)
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        demo_projects.remove(project)
        
        return jsonify({'message': 'Project deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500