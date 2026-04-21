from flask import Blueprint, request, jsonify
from app import db, bcrypt
from app.models.customer import Customer
from app.models.business import Business
from app.models.product import Product
from app.models.category import Category
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import re

customer_portal_bp = Blueprint('customer_portal', __name__)

# Business Information
@customer_portal_bp.route('/business/<slug>', methods=['GET'])
def get_business_by_slug(slug):
    try:
        business = Business.query.filter_by(slug=slug, is_active=True).first()
        if not business:
            return jsonify({'error': 'Business not found'}), 404
        return jsonify({'business': business.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Authentication Routes
@customer_portal_bp.route('/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        required = ['email', 'password', 'full_name']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Determine business_id from slug if provided
        business_slug = data.get('business_slug')
        business_id = data.get('business_id')
        
        if business_slug:
            business = Business.query.filter_by(slug=business_slug).first()
            if business:
                business_id = business.id
        
        if not business_id:
            business = Business.query.filter_by(is_active=True).first()
            if not business:
                return jsonify({'error': 'No active business found in system'}), 500
            business_id = business.id
            
        # Check if email exists for THIS business
        if Customer.query.filter_by(email=data['email'], business_id=business_id).first():
            return jsonify({'error': 'Email already registered with this business'}), 409
        
        full_name = data.get('full_name', '')
        parts = full_name.split(' ', 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ''
        
        customer = Customer(
            email=data['email'],
            first_name=first_name,
            last_name=last_name,
            phone=data.get('phone'),
            address=data.get('address'),
            city=data.get('city'),
            zip_code=data.get('postal_code'),
            business_id=business_id,
            customer_id=f'CUST{datetime.now().strftime("%y%m%d%H%M%S")}',
            is_active=True
        )
        customer.set_password(data['password'])
        
        db.session.add(customer)
        db.session.commit()
        
        return jsonify({
            'message': 'Registration successful',
            'customer': customer.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@customer_portal_bp.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        email = data.get('email')
        password = data.get('password')
        business_slug = data.get('business_slug')
        business_id = data.get('business_id')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
            
        query = Customer.query.filter_by(email=email)
        
        if business_slug:
            business = Business.query.filter_by(slug=business_slug).first()
            if business:
                query = query.filter_by(business_id=business.id)
        elif business_id:
            query = query.filter_by(business_id=business_id)
            
        customer = query.first()
        
        if not customer or not customer.check_password(password):
            return jsonify({'error': 'Invalid email or password'}), 401
            
        if not customer.is_active:
            return jsonify({'error': 'Account is inactive'}), 403
            
        customer.last_login = datetime.utcnow()
        db.session.commit()
        
        access_token = create_access_token(
            identity=str(customer.id), 
            additional_claims={'type': 'customer', 'business_id': customer.business_id},
            expires_delta=timedelta(days=1)
        )
        
        return jsonify({
            'message': 'Login successful',
            'token': access_token,
            'customer': customer.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@customer_portal_bp.route('/auth/logout', methods=['POST'])
def logout():
    return jsonify({'message': 'Logged out successfully'}), 200

@customer_portal_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    from flask_jwt_extended import get_jwt
    claims = get_jwt()
    if claims.get('type') != 'customer':
        return jsonify({'error': 'Not a customer token'}), 403
        
    customer_id = get_jwt_identity()
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({'error': 'Customer not found'}), 404
        
    return jsonify({'customer': customer.to_dict()}), 200

# Products & Categories for Shop
@customer_portal_bp.route('/products', methods=['GET'])
def get_products():
    try:
        business_slug = request.args.get('business_slug')
        business_id = request.args.get('business_id', type=int)
        
        if business_slug:
            business = Business.query.filter_by(slug=business_slug).first()
            if business:
                business_id = business.id
        
        if not business_id:
            business = Business.query.filter_by(is_active=True).first()
            if business:
                business_id = business.id
        
        query = Product.query
        if business_id:
            query = query.filter_by(business_id=business_id)
            
        category_id = request.args.get('category')
        if category_id:
            query = query.filter_by(category_id=category_id)
            
        search = request.args.get('search')
        if search:
            query = query.filter(Product.name.ilike(f'%{search}%'))
            
        products = query.filter_by(is_active=True).all()
        
        return jsonify({
            'products': [p.to_dict() for p in products]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@customer_portal_bp.route('/categories', methods=['GET'])
def get_categories():
    try:
        business_slug = request.args.get('business_slug')
        business_id = request.args.get('business_id', type=int)
        
        if business_slug:
            business = Business.query.filter_by(slug=business_slug).first()
            if business:
                business_id = business.id
                
        if not business_id:
            business = Business.query.filter_by(is_active=True).first()
            if business:
                business_id = business.id
                
        query = Category.query
        if business_id:
            query = query.filter_by(business_id=business_id)
            
        categories = query.all()
        return jsonify({
            'categories': [c.to_dict() for c in categories]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Cart Management (Simple implementation for now)
@customer_portal_bp.route('/cart', methods=['GET'])
@jwt_required()
def get_cart():
    return jsonify({'items': [], 'total': 0.0}), 200

@customer_portal_bp.route('/cart/add', methods=['POST'])
@jwt_required()
def add_to_cart():
    data = request.get_json()
    return jsonify({'message': 'Product added to cart', 'item': data}), 200

@customer_portal_bp.route('/cart/<int:item_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def update_cart_item(item_id):
    return jsonify({'message': 'Cart updated'}), 200

@customer_portal_bp.route('/cart', methods=['DELETE'])
@jwt_required()
def clear_cart():
    return jsonify({'message': 'Cart cleared'}), 200

# Orders
@customer_portal_bp.route('/orders', methods=['POST'])
@jwt_required()
def place_order():
    return jsonify({'message': 'Order placed successfully', 'order_id': 12345}), 201
