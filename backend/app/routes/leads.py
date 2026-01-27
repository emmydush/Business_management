from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.lead import Lead
from app.utils.middleware import module_required, get_business_id, get_active_branch_id
from app.utils.decorators import subscription_required
from datetime import datetime

leads_bp = Blueprint('leads', __name__)

@leads_bp.route('/', methods=['GET'])
@jwt_required()
@module_required('leads')
def get_leads():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        page = request.args.get('page')
        per_page = request.args.get('per_page')
        search = request.args.get('search', '')

        query = Lead.query.filter_by(business_id=business_id)
        if branch_id:
            query = query.filter_by(branch_id=branch_id)

        if search:
            query = query.filter(
                db.or_(
                    Lead.title.contains(search),
                    Lead.company.contains(search),
                    Lead.contact_name.contains(search),
                    Lead.email.contains(search),
                    Lead.phone.contains(search)
                )
            )

        query = query.order_by(Lead.created_at.desc())

        if page and per_page:
            try:
                page = int(page)
                per_page = int(per_page)
                paginated = query.paginate(page=page, per_page=per_page, error_out=False)
                leads_list = [lead.to_dict() for lead in paginated.items]
            except Exception:
                leads_list = [lead.to_dict() for lead in query.all()]
        else:
            leads_list = [lead.to_dict() for lead in query.all()]

        return jsonify(leads_list), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@leads_bp.route('/', methods=['POST'])
@jwt_required()
@module_required('business')
@subscription_required
def create_lead():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        data = request.get_json()
        
        lead = Lead(
            business_id=business_id,
            branch_id=branch_id,
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
@subscription_required
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
        if 'branch_id' in data: lead.branch_id = data['branch_id']
        
        db.session.commit()
        return jsonify({'message': 'Lead updated successfully', 'lead': lead.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@leads_bp.route('/<int:lead_id>', methods=['DELETE'])
@jwt_required()
@module_required('business')
@subscription_required
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
