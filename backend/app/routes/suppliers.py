from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.supplier import Supplier
from app.utils.decorators import staff_required, manager_required, subscription_required
from app.utils.middleware import module_required, get_business_id, get_active_branch_id
from datetime import datetime
import re
import csv

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


@suppliers_bp.route('/bulk-upload', methods=['POST'])
@jwt_required()
@module_required('suppliers')
@manager_required
@subscription_required
def bulk_upload_suppliers():
    """
    Bulk upload suppliers from a CSV file.

    Expected columns (case-insensitive, flexible):
    - company_name (required)
    - contact_person (required)
    - email (required, unique per business)
    - phone
    - address
    - city
    - state
    - country
    - zip_code
    - tax_id
    - payment_terms
    - credit_limit
    - notes
    - supplier_id (optional, auto-generated if missing)
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
                company_name = (row.get('company_name') or row.get('Company Name') or '').strip()
                contact_person = (row.get('contact_person') or row.get('Contact Person') or '').strip()
                email = (row.get('email') or row.get('Email') or '').strip()

                if not company_name or not contact_person or not email:
                    errors.append({'row': row_num, 'error': 'Missing required fields: company_name, contact_person, email'})
                    continue

                if not re.match(email_regex, email):
                    errors.append({'row': row_num, 'error': f'Invalid email format: {email}'})
                    continue

                # Email uniqueness
                existing_email = Supplier.query.filter_by(business_id=business_id, email=email).first()
                if existing_email:
                    errors.append({'row': row_num, 'error': f'Email {email} already exists for this business'})
                    continue

                # Supplier ID handling
                supplier_id = (row.get('supplier_id') or row.get('Supplier ID') or '').strip() or None
                if supplier_id:
                    existing_id = Supplier.query.filter_by(business_id=business_id, supplier_id=supplier_id).first()
                    if existing_id:
                        errors.append({'row': row_num, 'error': f'Supplier ID {supplier_id} already exists for this business'})
                        continue
                else:
                    last_supplier = Supplier.query.filter_by(business_id=business_id).order_by(Supplier.id.desc()).first()
                    if last_supplier and last_supplier.supplier_id and last_supplier.supplier_id.startswith('SUP'):
                        try:
                            last_id = int(last_supplier.supplier_id[3:])
                            supplier_id = f'SUP{last_id + 1:04d}'
                        except Exception:
                            supplier_id = f'SUP{datetime.utcnow().strftime("%Y%m%d%H%M%S")}'
                    else:
                        supplier_id = 'SUP0001'

                phone = (row.get('phone') or row.get('Phone') or '').strip()
                address = (row.get('address') or row.get('Address') or '').strip()
                city = (row.get('city') or row.get('City') or '').strip()
                state = (row.get('state') or row.get('State') or '').strip()
                country = (row.get('country') or row.get('Country') or '').strip()
                zip_code = (row.get('zip_code') or row.get('Postal Code') or '').strip()
                tax_id = (row.get('tax_id') or row.get('Tax ID') or '').strip()
                payment_terms = (row.get('payment_terms') or row.get('Payment Terms') or '').strip()
                notes = (row.get('notes') or row.get('Notes') or '').strip()

                # Numeric fields
                try:
                    credit_limit_raw = row.get('credit_limit') or row.get('Credit Limit') or ''
                    credit_limit = float(credit_limit_raw) if credit_limit_raw != '' else 0.0
                except (ValueError, TypeError):
                    errors.append({'row': row_num, 'error': f'Invalid credit_limit: {row.get("credit_limit")}'})
                    continue

                is_active_raw = (row.get('is_active') or row.get('Is Active') or '').strip().lower()
                is_active = True if is_active_raw == '' else is_active_raw in ['true', '1', 'yes', 'on']

                supplier = Supplier(
                    business_id=business_id,
                    branch_id=branch_id,
                    supplier_id=supplier_id,
                    company_name=company_name,
                    contact_person=contact_person,
                    email=email,
                    phone=phone,
                    address=address,
                    city=city,
                    state=state,
                    country=country,
                    zip_code=zip_code,
                    tax_id=tax_id,
                    payment_terms=payment_terms,
                    credit_limit=credit_limit,
                    notes=notes,
                    is_active=is_active
                )

                db.session.add(supplier)
                db.session.commit()
                created.append(supplier.to_dict())

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