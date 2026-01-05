from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.lead import Lead
from app.utils.middleware import module_required, get_business_id
from datetime import datetime

leads_bp = Blueprint('leads', __name__)

@leads_bp.route('/', methods=['GET'])
@jwt_required()
@module_required('business')
def get_leads():
    try:
        business_id = get_business_id()
        leads = Lead.query.filter_by(business_id=business_id).order_by(Lead.created_at.desc()).all()
        return jsonify([lead.to_dict() for lead in leads]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@leads_bp.route('/', methods=['POST'])
@jwt_required()
@module_required('business')
def create_lead():
    try:
        business_id = get_business_id()
        data = request.get_json()
        
        lead = Lead(
            business_id=business_id,
            title=data['title'],
            company=data.get('company'),
            contact_name=data.get('contact_name'),
            email=data.get('email'),
            phone=data.get('phone'),
            value=data.get('value', 0),
            status=data.get('status', 'new'),
            priority=data.get('priority', 'medium'),
            assigned_to=data.get('assigned_to')
        )
        
        db.session.add(lead)
        db.session.commit()
        
        return jsonify({'message': 'Lead created successfully', 'lead': lead.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@leads_bp.route('/<int:lead_id>', methods=['PUT'])
@jwt_required()
@module_required('business')
def update_lead(lead_id):
    try:
        business_id = get_business_id()
        lead = Lead.query.filter_by(id=lead_id, business_id=business_id).first()
        
        if not lead:
            return jsonify({'error': 'Lead not found'}), 404
            
        data = request.get_json()
        
        if 'title' in data: lead.title = data['title']
        if 'company' in data: lead.company = data['company']
        if 'contact_name' in data: lead.contact_name = data['contact_name']
        if 'email' in data: lead.email = data['email']
        if 'phone' in data: lead.phone = data['phone']
        if 'value' in data: lead.value = data['value']
        if 'status' in data: lead.status = data['status']
        if 'priority' in data: lead.priority = data['priority']
        if 'assigned_to' in data: lead.assigned_to = data['assigned_to']
        
        db.session.commit()
        return jsonify({'message': 'Lead updated successfully', 'lead': lead.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@leads_bp.route('/<int:lead_id>', methods=['DELETE'])
@jwt_required()
@module_required('business')
def delete_lead(lead_id):
    try:
        business_id = get_business_id()
        lead = Lead.query.filter_by(id=lead_id, business_id=business_id).first()
        
        if not lead:
            return jsonify({'error': 'Lead not found'}), 404
            
        db.session.delete(lead)
        db.session.commit()
        return jsonify({'message': 'Lead deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
