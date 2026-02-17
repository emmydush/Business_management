from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.customer import Customer
from app.utils.decorators import staff_required, manager_required, subscription_required
from app.utils.middleware import module_required, get_business_id, get_active_branch_id
from datetime import datetime
import re
import csv

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
@subscription_required
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
@subscription_required
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

@customers_bp.route('/recalculate-balances', methods=['POST'])
@jwt_required()
@module_required('customers')
@manager_required
def recalculate_balances():
    try:
        business_id = get_business_id()
        customers = Customer.query.filter_by(business_id=business_id).all()
        
        from app.models.invoice import Invoice
        
        count = 0
        for customer in customers:
            # Sum up all amount_due from invoices for this customer
            unpaid_invoices = Invoice.query.filter_by(customer_id=customer.id, business_id=business_id).all()
            total_due = sum(float(inv.amount_due) for inv in unpaid_invoices)
            
            if float(customer.balance) != total_due:
                customer.balance = total_due
                count += 1
        
        db.session.commit()
        return jsonify({'message': f'Balances recalculated for {count} customers'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@customers_bp.route('/bulk-upload', methods=['POST'])
@jwt_required()
@module_required('customers')
@manager_required
@subscription_required
def bulk_upload_customers():
    """
    Bulk upload customers from a CSV file.

    Expected columns (case-insensitive, flexible):
    - first_name (required)
    - last_name (required)
    - email (required, unique per business)
    - company
    - phone
    - address
    - city
    - state
    - country
    - zip_code
    - customer_type (Individual/Business)
    - notes
    - credit_limit
    - balance
    - customer_id (optional, auto-generated if missing)
    - is_active (true/false, defaults to true)
    """
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()

        if 'file' not in request.files:
            return jsonify({'error': 'No file part in the request'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        if not file.filename.lower().endswith('.csv'):
            return jsonify({'error': 'Only CSV files are supported. Please upload a .csv file'}), 400

        content = file.read().decode('utf-8-sig')
        reader = csv.DictReader(content.splitlines())

        created = []
        errors = []
        row_num = 1

        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

        for row in reader:
            row_num += 1
            try:
                first_name = (row.get('first_name') or row.get('First Name') or '').strip()
                last_name = (row.get('last_name') or row.get('Last Name') or '').strip()
                email = (row.get('email') or row.get('Email') or '').strip()

                if not first_name or not last_name or not email:
                    errors.append({'row': row_num, 'error': 'Missing required fields: first_name, last_name, email'})
                    continue

                if not re.match(email_regex, email):
                    errors.append({'row': row_num, 'error': f'Invalid email format: {email}'})
                    continue

                # Check if email already exists for this business
                existing_email = Customer.query.filter_by(business_id=business_id, email=email).first()
                if existing_email:
                    errors.append({'row': row_num, 'error': f'Email {email} already exists for this business'})
                    continue

                # Handle customer_id (optional)
                customer_id = (row.get('customer_id') or row.get('Customer ID') or '').strip() or None
                if customer_id:
                    existing_cust_id = Customer.query.filter_by(business_id=business_id, customer_id=customer_id).first()
                    if existing_cust_id:
                        errors.append({'row': row_num, 'error': f'Customer ID {customer_id} already exists for this business'})
                        continue
                else:
                    # Auto-generate customer_id similar to create_customer
                    last_customer = Customer.query.filter_by(business_id=business_id).order_by(Customer.id.desc()).first()
                    if last_customer and last_customer.customer_id and last_customer.customer_id.startswith('CUST'):
                        try:
                            last_id = int(last_customer.customer_id[4:])
                            customer_id = f'CUST{last_id + 1:04d}'
                        except Exception:
                            customer_id = f'CUST{datetime.utcnow().strftime("%Y%m%d%H%M%S")}'
                    else:
                        customer_id = 'CUST0001'

                company = (row.get('company') or row.get('Company') or '').strip()
                phone = (row.get('phone') or row.get('Phone') or '').strip()
                address = (row.get('address') or row.get('Address') or '').strip()
                city = (row.get('city') or row.get('City') or '').strip()
                state = (row.get('state') or row.get('State') or '').strip()
                country = (row.get('country') or row.get('Country') or '').strip()
                zip_code = (row.get('zip_code') or row.get('Postal Code') or '').strip()
                customer_type = (row.get('customer_type') or row.get('Customer Type') or 'Individual').strip() or 'Individual'
                notes = (row.get('notes') or row.get('Notes') or '').strip()

                # Numeric fields
                try:
                    credit_limit_raw = row.get('credit_limit') or row.get('Credit Limit') or ''
                    credit_limit = float(credit_limit_raw) if credit_limit_raw != '' else 0.0
                except (ValueError, TypeError):
                    errors.append({'row': row_num, 'error': f'Invalid credit_limit: {row.get("credit_limit")}'})
                    continue

                try:
                    balance_raw = row.get('balance') or row.get('Balance') or ''
                    balance = float(balance_raw) if balance_raw != '' else 0.0
                except (ValueError, TypeError):
                    errors.append({'row': row_num, 'error': f'Invalid balance: {row.get("balance")}'})
                    continue

                is_active_raw = (row.get('is_active') or row.get('Is Active') or '').strip().lower()
                is_active = True if is_active_raw == '' else is_active_raw in ['true', '1', 'yes', 'on']

                customer = Customer(
                    business_id=business_id,
                    branch_id=branch_id,
                    customer_id=customer_id,
                    first_name=first_name,
                    last_name=last_name,
                    company=company,
                    email=email,
                    phone=phone,
                    address=address,
                    city=city,
                    state=state,
                    country=country,
                    zip_code=zip_code,
                    customer_type=customer_type,
                    notes=notes,
                    credit_limit=credit_limit,
                    balance=balance,
                    is_active=is_active
                )

                db.session.add(customer)
                db.session.commit()
                created.append(customer.to_dict())

            except Exception as row_err:
                db.session.rollback()
                errors.append({'row': row_num, 'error': str(row_err)})
                continue

        return jsonify({
            'created': created,
            'errors': errors,
            'created_count': len(created)
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500