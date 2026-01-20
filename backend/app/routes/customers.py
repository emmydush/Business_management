from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.customer import Customer
from app.utils.decorators import staff_required, manager_required
from app.utils.middleware import module_required, get_business_id, get_active_branch_id
from datetime import datetime
import re

customers_bp = Blueprint('customers', __name__)

@customers_bp.route('/', methods=['GET'])
@jwt_required()
@module_required('customers')
def get_customers():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        is_active = request.args.get('is_active', type=str)
        
        query = Customer.query.filter_by(business_id=business_id)
        if branch_id:
            query = query.filter_by(branch_id=branch_id)
        
        if search:
            query = query.filter(
                db.or_(
                    Customer.customer_id.contains(search.upper()),
                    Customer.first_name.contains(search),
                    Customer.last_name.contains(search),
                    Customer.company.contains(search),
                    Customer.email.contains(search),
                    Customer.phone.contains(search),
                    Customer.customer_type.contains(search)
                )
            )
        
        if is_active is not None:
            query = query.filter(Customer.is_active == (is_active.lower() == 'true'))
        
        customer_type = request.args.get('customer_type')
        if customer_type:
            query = query.filter(Customer.customer_type == customer_type)
        
        customers = query.order_by(Customer.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'customers': [customer.to_dict() for customer in customers.items],
            'total': customers.total,
            'pages': customers.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@customers_bp.route('/', methods=['POST'])
@jwt_required()
@module_required('customers')
def create_customer():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate email format
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if customer ID is provided, otherwise generate one
        customer_id = data.get('customer_id')
        if not customer_id:
            # Generate customer ID (e.g., CUST0001)
            last_customer = Customer.query.filter_by(business_id=business_id).order_by(Customer.id.desc()).first()
            if last_customer:
                try:
                    last_id = int(last_customer.customer_id[4:])  # Remove 'CUST' prefix
                    customer_id = f'CUST{last_id + 1:04d}'
                except:
                    customer_id = f'CUST{datetime.now().strftime("%Y%m%d%H%M%S")}'
            else:
                customer_id = 'CUST0001'
        else:
            # Check if customer ID already exists for this business
            existing_customer = Customer.query.filter_by(business_id=business_id, customer_id=customer_id).first()
            if existing_customer:
                return jsonify({'error': 'Customer ID already exists for this business'}), 409
        
        # Check if email already exists for this business
        existing_email = Customer.query.filter_by(business_id=business_id, email=data['email']).first()
        if existing_email:
            return jsonify({'error': 'Email already exists for this business'}), 409
        
        customer = Customer(
            business_id=business_id,
            branch_id=branch_id,
            customer_id=customer_id,
            first_name=data['first_name'],
            last_name=data['last_name'],
            company=data.get('company', ''),
            email=data['email'],
            phone=data.get('phone', ''),
            address=data.get('address', ''),
            city=data.get('city', ''),
            state=data.get('state', ''),
            country=data.get('country', ''),
            zip_code=data.get('zip_code', ''),
            customer_type=data.get('customer_type', 'Individual'),
            notes=data.get('notes', ''),
            credit_limit=data.get('credit_limit', 0.00),
            balance=data.get('balance', 0.00)
        )
        
        db.session.add(customer)
        db.session.commit()
        
        return jsonify({
            'message': 'Customer created successfully',
            'customer': customer.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@customers_bp.route('/<int:customer_id>', methods=['GET'])
@jwt_required()
@module_required('customers')
def get_customer(customer_id):
    try:
        business_id = get_business_id()
        customer = Customer.query.filter_by(id=customer_id, business_id=business_id).first()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        return jsonify({'customer': customer.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@customers_bp.route('/<int:customer_id>', methods=['PUT'])
@jwt_required()
@module_required('customers')
def update_customer(customer_id):
    try:
        business_id = get_business_id()
        customer = Customer.query.filter_by(id=customer_id, business_id=business_id).first()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'first_name' in data:
            customer.first_name = data['first_name']
        if 'last_name' in data:
            customer.last_name = data['last_name']
        if 'company' in data:
            customer.company = data['company']
        if 'email' in data and data['email'] != customer.email:
            existing_customer = Customer.query.filter_by(business_id=business_id, email=data['email']).first()
            if existing_customer and existing_customer.id != customer.id:
                return jsonify({'error': 'Email already exists for this business'}), 409
            customer.email = data['email']
        if 'phone' in data:
            customer.phone = data['phone']
        if 'address' in data:
            customer.address = data['address']
        if 'city' in data:
            customer.city = data['city']
        if 'state' in data:
            customer.state = data['state']
        if 'country' in data:
            customer.country = data['country']
        if 'zip_code' in data:
            customer.zip_code = data['zip_code']
        if 'customer_type' in data:
            customer.customer_type = data['customer_type']
        if 'notes' in data:
            customer.notes = data['notes']
        if 'credit_limit' in data:
            customer.credit_limit = data['credit_limit']
        if 'balance' in data:
            customer.balance = data['balance']
        if 'is_active' in data:
            customer.is_active = data['is_active']
        if 'branch_id' in data:
            customer.branch_id = data['branch_id']
        
        customer.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Customer updated successfully',
            'customer': customer.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@customers_bp.route('/<int:customer_id>', methods=['DELETE'])
@jwt_required()
@module_required('customers')
def delete_customer(customer_id):
    try:
        business_id = get_business_id()
        customer = Customer.query.filter_by(id=customer_id, business_id=business_id).first()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        # Check if customer has related records (orders, invoices, etc.)
        if customer.orders:
            return jsonify({'error': 'Cannot delete customer with existing orders'}), 400
        
        db.session.delete(customer)
        db.session.commit()
        
        return jsonify({'message': 'Customer deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@customers_bp.route('/<int:customer_id>/orders', methods=['GET'])
@jwt_required()
@module_required('customers')
def get_customer_orders(customer_id):
    try:
        business_id = get_business_id()
        customer = Customer.query.filter_by(id=customer_id, business_id=business_id).first()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        orders = [order.to_dict() for order in customer.orders]
        
        return jsonify({'orders': orders}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500