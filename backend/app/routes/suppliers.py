from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.supplier import Supplier
from app.utils.decorators import staff_required, manager_required, subscription_required
from app.utils.middleware import module_required, get_business_id, get_active_branch_id
from datetime import datetime
import re

suppliers_bp = Blueprint('suppliers', __name__)

@suppliers_bp.route('/', methods=['GET'])
@jwt_required()
@module_required('suppliers')
def get_suppliers():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        is_active = request.args.get('is_active', type=str)
        
        query = Supplier.query.filter_by(business_id=business_id)
        if branch_id:
            query = query.filter_by(branch_id=branch_id)
        
        if search:
            query = query.filter(
                db.or_(
                    Supplier.supplier_id.contains(search.upper()),
                    Supplier.company_name.contains(search),
                    Supplier.contact_person.contains(search),
                    Supplier.email.contains(search),
                    Supplier.phone.contains(search)
                )
            )
        
        if is_active is not None:
            query = query.filter(Supplier.is_active == (is_active.lower() == 'true'))
        
        suppliers = query.order_by(Supplier.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'suppliers': [supplier.to_dict() for supplier in suppliers.items],
            'total': suppliers.total,
            'pages': suppliers.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@suppliers_bp.route('/', methods=['POST'])
@jwt_required()
@module_required('suppliers')
@subscription_required
def create_supplier():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['company_name', 'contact_person', 'email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate email format
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if supplier ID is provided, otherwise generate one
        supplier_id = data.get('supplier_id')
        if not supplier_id:
            # Generate supplier ID (e.g., SUP0001)
            last_supplier = Supplier.query.filter_by(business_id=business_id).order_by(Supplier.id.desc()).first()
            if last_supplier:
                try:
                    last_id = int(last_supplier.supplier_id[3:])  # Remove 'SUP' prefix
                    supplier_id = f'SUP{last_id + 1:04d}'
                except:
                    supplier_id = f'SUP{datetime.now().strftime("%Y%m%d%H%M%S")}'
            else:
                supplier_id = 'SUP0001'
        else:
            # Check if supplier ID already exists for this business
            existing_supplier = Supplier.query.filter_by(business_id=business_id, supplier_id=supplier_id).first()
            if existing_supplier:
                return jsonify({'error': 'Supplier ID already exists for this business'}), 409
        
        # Check if email already exists for this business
        existing_email = Supplier.query.filter_by(business_id=business_id, email=data['email']).first()
        if existing_email:
            return jsonify({'error': 'Email already exists for this business'}), 409
        
        supplier = Supplier(
            business_id=business_id,
            branch_id=branch_id,
            supplier_id=supplier_id,
            company_name=data['company_name'],
            contact_person=data['contact_person'],
            email=data['email'],
            phone=data.get('phone', ''),
            address=data.get('address', ''),
            city=data.get('city', ''),
            state=data.get('state', ''),
            country=data.get('country', ''),
            zip_code=data.get('zip_code', ''),
            tax_id=data.get('tax_id', ''),
            payment_terms=data.get('payment_terms', ''),
            credit_limit=data.get('credit_limit', 0.00),
            notes=data.get('notes', '')
        )
        
        db.session.add(supplier)
        db.session.commit()
        
        return jsonify({
            'message': 'Supplier created successfully',
            'supplier': supplier.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@suppliers_bp.route('/<int:supplier_id>', methods=['GET'])
@jwt_required()
@module_required('suppliers')
def get_supplier(supplier_id):
    try:
        business_id = get_business_id()
        supplier = Supplier.query.filter_by(id=supplier_id, business_id=business_id).first()
        
        if not supplier:
            return jsonify({'error': 'Supplier not found'}), 404
        
        return jsonify({'supplier': supplier.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@suppliers_bp.route('/<int:supplier_id>', methods=['PUT'])
@jwt_required()
@module_required('suppliers')
@subscription_required
def update_supplier(supplier_id):
    try:
        business_id = get_business_id()
        supplier = Supplier.query.filter_by(id=supplier_id, business_id=business_id).first()
        
        if not supplier:
            return jsonify({'error': 'Supplier not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'company_name' in data:
            supplier.company_name = data['company_name']
        if 'contact_person' in data:
            supplier.contact_person = data['contact_person']
        if 'email' in data and data['email'] != supplier.email:
            existing_supplier = Supplier.query.filter_by(business_id=business_id, email=data['email']).first()
            if existing_supplier and existing_supplier.id != supplier.id:
                return jsonify({'error': 'Email already exists for this business'}), 409
            supplier.email = data['email']
        if 'phone' in data:
            supplier.phone = data['phone']
        if 'address' in data:
            supplier.address = data['address']
        if 'city' in data:
            supplier.city = data['city']
        if 'state' in data:
            supplier.state = data['state']
        if 'country' in data:
            supplier.country = data['country']
        if 'zip_code' in data:
            supplier.zip_code = data['zip_code']
        if 'tax_id' in data:
            supplier.tax_id = data['tax_id']
        if 'payment_terms' in data:
            supplier.payment_terms = data['payment_terms']
        if 'credit_limit' in data:
            supplier.credit_limit = data['credit_limit']
        if 'notes' in data:
            supplier.notes = data['notes']
        if 'is_active' in data:
            supplier.is_active = data['is_active']
        if 'branch_id' in data:
            supplier.branch_id = data['branch_id']
        
        supplier.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Supplier updated successfully',
            'supplier': supplier.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@suppliers_bp.route('/<int:supplier_id>', methods=['DELETE'])
@jwt_required()
@module_required('suppliers')
def delete_supplier(supplier_id):
    try:
        business_id = get_business_id()
        supplier = Supplier.query.filter_by(id=supplier_id, business_id=business_id).first()
        
        if not supplier:
            return jsonify({'error': 'Supplier not found'}), 404
        
        # Check if supplier has related records (products, purchase orders, etc.)
        if supplier.product_list:
            return jsonify({'error': 'Cannot delete supplier with associated products'}), 400
        
        db.session.delete(supplier)
        db.session.commit()
        
        return jsonify({'message': 'Supplier deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@suppliers_bp.route('/<int:supplier_id>/products', methods=['GET'])
@jwt_required()
@module_required('suppliers')
def get_supplier_products(supplier_id):
    try:
        business_id = get_business_id()
        supplier = Supplier.query.filter_by(id=supplier_id, business_id=business_id).first()
        
        if not supplier:
            return jsonify({'error': 'Supplier not found'}), 404
        
        products = [product.to_dict() for product in supplier.product_list]
        
        return jsonify({'products': products}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500