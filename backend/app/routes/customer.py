"""
Customer Portal API Routes
Handles e-commerce customer authentication, orders, cart, and delivery tracking
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token, create_refresh_token, jwt_required, 
    get_jwt_identity, get_jwt
)
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime, timedelta
import re
import uuid

from app import db
from app.models import Product, User
from app.decorators import tenant_required

customer_bp = Blueprint('customer', __name__, url_prefix='/customer')

# ========================================
# AUTHENTICATION ENDPOINTS
# ========================================

@customer_bp.route('/auth/register', methods=['POST'])
def customer_register():
    """Register a new customer account"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'full_name', 'phone', 'address', 'city', 'postal_code']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate email format
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if email already exists
        existing_customer = db.session.execute(
            "SELECT id FROM customers WHERE email = :email",
            {'email': data['email'].lower()}
        ).fetchone()
        
        if existing_customer:
            return jsonify({'error': 'Email already registered'}), 409
        
        # Hash password
        password_hash = generate_password_hash(data['password'])
        
        # Create customer
        customer_id = db.session.execute(
            """
            INSERT INTO customers (email, password_hash, full_name, phone, created_at)
            VALUES (:email, :password_hash, :full_name, :phone, :created_at)
            """,
            {
                'email': data['email'].lower(),
                'password_hash': password_hash,
                'full_name': data['full_name'],
                'phone': data['phone'],
                'created_at': datetime.utcnow()
            }
        ).lastrowid
        
        # Create default address
        db.session.execute(
            """
            INSERT INTO customer_addresses 
            (customer_id, full_name, phone, address, city, postal_code, is_default, created_at)
            VALUES (:customer_id, :full_name, :phone, :address, :city, :postal_code, TRUE, :created_at)
            """,
            {
                'customer_id': customer_id,
                'full_name': data['full_name'],
                'phone': data['phone'],
                'address': data['address'],
                'city': data['city'],
                'postal_code': data['postal_code'],
                'created_at': datetime.utcnow()
            }
        )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Registration successful',
            'customer_id': customer_id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Customer registration error: {str(e)}")
        return jsonify({'error': 'Registration failed'}), 500

@customer_bp.route('/auth/login', methods=['POST'])
def customer_login():
    """Authenticate customer and return tokens"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
        
        # Find customer
        customer = db.session.execute(
            """
            SELECT id, email, password_hash, full_name, phone, is_active
            FROM customers 
            WHERE email = :email
            """,
            {'email': data['email'].lower()}
        ).fetchone()
        
        if not customer or not check_password_hash(customer['password_hash'], data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not customer['is_active']:
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Create access token
        access_token = create_access_token(
            identity=customer['id'],
            additional_claims={'type': 'customer'},
            expires_delta=timedelta(hours=24)
        )
        
        # Create session
        session_token = str(uuid.uuid4())
        session_hash = generate_password_hash(session_token)
        
        db.session.execute(
            """
            INSERT INTO customer_sessions 
            (customer_id, token_hash, ip_address, user_agent, expires_at, created_at)
            VALUES (:customer_id, :token_hash, :ip_address, :user_agent, :expires_at, :created_at)
            """,
            {
                'customer_id': customer['id'],
                'token_hash': session_hash,
                'ip_address': request.remote_addr,
                'user_agent': request.headers.get('User-Agent'),
                'expires_at': datetime.utcnow() + timedelta(days=30),
                'created_at': datetime.utcnow()
            }
        )
        
        # Update last login
        db.session.execute(
            "UPDATE customers SET last_login = :last_login WHERE id = :id",
            {'last_login': datetime.utcnow(), 'id': customer['id']}
        )
        
        db.session.commit()
        
        return jsonify({
            'token': access_token,
            'session_token': session_token,
            'customer': {
                'id': customer['id'],
                'email': customer['email'],
                'full_name': customer['full_name'],
                'phone': customer['phone']
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Customer login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

@customer_bp.route('/auth/logout', methods=['POST'])
@jwt_required()
def customer_logout():
    """Logout customer by invalidating session"""
    try:
        customer_id = get_jwt_identity()
        
        # Invalidate all sessions for this customer
        db.session.execute(
            "UPDATE customer_sessions SET is_active = FALSE WHERE customer_id = :customer_id",
            {'customer_id': customer_id}
        )
        
        db.session.commit()
        
        return jsonify({'message': 'Logout successful'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Customer logout error: {str(e)}")
        return jsonify({'error': 'Logout failed'}), 500

# ========================================
# PROFILE ENDPOINTS
# ========================================

@customer_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get customer profile"""
    try:
        customer_id = get_jwt_identity()
        
        customer = db.session.execute(
            """
            SELECT id, email, full_name, phone, email_verified, phone_verified, 
                   is_active, created_at, last_login
            FROM customers 
            WHERE id = :customer_id
            """,
            {'customer_id': customer_id}
        ).fetchone()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        # Get addresses
        addresses = db.session.execute(
            """
            SELECT id, full_name, phone, address, city, postal_code, 
                   country, is_default, created_at
            FROM customer_addresses 
            WHERE customer_id = :customer_id
            ORDER BY is_default DESC, created_at DESC
            """,
            {'customer_id': customer_id}
        ).fetchall()
        
        return jsonify({
            'customer': dict(customer),
            'addresses': [dict(addr) for addr in addresses]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get profile error: {str(e)}")
        return jsonify({'error': 'Failed to get profile'}), 500

@customer_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update customer profile"""
    try:
        customer_id = get_jwt_identity()
        data = request.get_json()
        
        # Update customer info
        if 'full_name' in data:
            db.session.execute(
                "UPDATE customers SET full_name = :full_name WHERE id = :id",
                {'full_name': data['full_name'], 'id': customer_id}
            )
        
        if 'phone' in data:
            db.session.execute(
                "UPDATE customers SET phone = :phone WHERE id = :id",
                {'phone': data['phone'], 'id': customer_id}
            )
        
        db.session.commit()
        
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Update profile error: {str(e)}")
        return jsonify({'error': 'Failed to update profile'}), 500

# ========================================
# PRODUCT ENDPOINTS
# ========================================

@customer_bp.route('/products', methods=['GET'])
def get_products():
    """Get products with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        search = request.args.get('search', '')
        category = request.args.get('category', '')
        sort = request.args.get('sort', 'name')
        min_price = request.args.get('min_price', 0, type=float)
        max_price = request.args.get('max_price', float('inf'), type=float)
        
        # Build query
        where_conditions = ["p.is_active = TRUE", "p.stock_quantity > 0"]
        params = {}
        
        if search:
            where_conditions.append("(p.name LIKE :search OR p.description LIKE :search)")
            params['search'] = f'%{search}%'
        
        if category:
            where_conditions.append("pc.slug = :category")
            params['category'] = category
        
        if min_price > 0:
            where_conditions.append("p.selling_price >= :min_price")
            params['min_price'] = min_price
        
        if max_price < float('inf'):
            where_conditions.append("p.selling_price <= :max_price")
            params['max_price'] = max_price
        
        # Sort mapping
        sort_mapping = {
            'name': 'p.name ASC',
            'price_low': 'p.selling_price ASC',
            'price_high': 'p.selling_price DESC',
            'newest': 'p.created_at DESC',
            'rating': 'COALESCE(prs.average_rating, 0) DESC'
        }
        order_by = sort_mapping.get(sort, 'p.name ASC')
        
        # Get products
        products = db.session.execute(
            f"""
            SELECT DISTINCT
                p.id, p.name, p.description, p.selling_price, p.cost_price,
                p.stock_quantity, p.image_url, p.sku, p.created_at,
                COALESCE(prs.average_rating, 0) as average_rating,
                COALESCE(prs.review_count, 0) as review_count
            FROM products p
            LEFT JOIN product_category_relations pcr ON p.id = pcr.product_id
            LEFT JOIN product_categories pc ON pcr.category_id = pc.id
            LEFT JOIN product_rating_summary prs ON p.id = prs.product_id
            WHERE {' AND '.join(where_conditions)}
            ORDER BY {order_by}
            LIMIT :limit OFFSET :offset
            """,
            {
                **params,
                'limit': per_page,
                'offset': (page - 1) * per_page
            }
        ).fetchall()
        
        # Get total count
        total_count = db.session.execute(
            f"""
            SELECT COUNT(DISTINCT p.id) as total
            FROM products p
            LEFT JOIN product_category_relations pcr ON p.id = pcr.product_id
            LEFT JOIN product_categories pc ON pcr.category_id = pc.id
            WHERE {' AND '.join(where_conditions)}
            """,
            params
        ).fetchone()['total']
        
        return jsonify({
            'products': [dict(product) for product in products],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total_count,
                'pages': (total_count + per_page - 1) // per_page
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get products error: {str(e)}")
        return jsonify({'error': 'Failed to get products'}), 500

@customer_bp.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get single product details"""
    try:
        product = db.session.execute(
            """
            SELECT 
                p.id, p.name, p.description, p.selling_price, p.cost_price,
                p.stock_quantity, p.image_url, p.sku, p.created_at,
                COALESCE(prs.average_rating, 0) as average_rating,
                COALESCE(prs.review_count, 0) as review_count
            FROM products p
            LEFT JOIN product_rating_summary prs ON p.id = prs.product_id
            WHERE p.id = :product_id AND p.is_active = TRUE
            """,
            {'product_id': product_id}
        ).fetchone()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Get product categories
        categories = db.session.execute(
            """
            SELECT pc.id, pc.name, pc.slug
            FROM product_categories pc
            JOIN product_category_relations pcr ON pc.id = pcr.category_id
            WHERE pcr.product_id = :product_id
            """,
            {'product_id': product_id}
        ).fetchall()
        
        # Get product reviews
        reviews = db.session.execute(
            """
            SELECT cr.rating, cr.review_text, c.full_name, cr.created_at
            FROM customer_reviews cr
            JOIN customers c ON cr.customer_id = c.id
            WHERE cr.product_id = :product_id AND cr.is_public = TRUE
            ORDER BY cr.created_at DESC
            LIMIT 10
            """,
            {'product_id': product_id}
        ).fetchall()
        
        return jsonify({
            'product': dict(product),
            'categories': [dict(cat) for cat in categories],
            'reviews': [dict(review) for review in reviews]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get product error: {str(e)}")
        return jsonify({'error': 'Failed to get product'}), 500

@customer_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get product categories"""
    try:
        categories = db.session.execute(
            """
            SELECT pc.id, pc.name, pc.slug, pc.description, pc.image_url,
                   (SELECT COUNT(*) FROM product_category_relations pcr 
                    JOIN products p ON pcr.product_id = p.id 
                    WHERE pcr.category_id = pc.id AND p.is_active = TRUE) as product_count
            FROM product_categories pc
            WHERE pc.is_active = TRUE
            ORDER BY pc.sort_order, pc.name
            """
        ).fetchall()
        
        return jsonify({
            'categories': [dict(cat) for cat in categories]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get categories error: {str(e)}")
        return jsonify({'error': 'Failed to get categories'}), 500

# ========================================
# CART ENDPOINTS
# ========================================

@customer_bp.route('/cart', methods=['GET'])
@jwt_required()
def get_cart():
    """Get customer's shopping cart"""
    try:
        customer_id = get_jwt_identity()
        
        cart_items = db.session.execute(
            """
            SELECT 
                cc.id, cc.quantity, cc.created_at,
                p.id as product_id, p.name, p.selling_price, p.image_url, p.sku,
                (p.selling_price * cc.quantity) as subtotal
            FROM customer_cart cc
            JOIN products p ON cc.product_id = p.id
            WHERE cc.customer_id = :customer_id AND p.is_active = TRUE
            ORDER BY cc.created_at DESC
            """,
            {'customer_id': customer_id}
        ).fetchall()
        
        total = sum(item['subtotal'] for item in cart_items)
        
        return jsonify({
            'items': [
                {
                    'id': item['id'],
                    'product': {
                        'id': item['product_id'],
                        'name': item['name'],
                        'price': float(item['selling_price']),
                        'image': item['image_url'],
                        'sku': item['sku']
                    },
                    'quantity': item['quantity'],
                    'subtotal': float(item['subtotal'])
                }
                for item in cart_items
            ],
            'total': total,
            'item_count': len(cart_items)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get cart error: {str(e)}")
        return jsonify({'error': 'Failed to get cart'}), 500

@customer_bp.route('/cart/add', methods=['POST'])
@jwt_required()
def add_to_cart():
    """Add item to cart"""
    try:
        customer_id = get_jwt_identity()
        data = request.get_json()
        
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        
        if not product_id or quantity <= 0:
            return jsonify({'error': 'Valid product_id and quantity required'}), 400
        
        # Check if product exists and is in stock
        product = db.session.execute(
            "SELECT id, stock_quantity FROM products WHERE id = :product_id AND is_active = TRUE",
            {'product_id': product_id}
        ).fetchone()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        if product['stock_quantity'] < quantity:
            return jsonify({'error': 'Insufficient stock'}), 400
        
        # Add or update cart item
        db.session.execute(
            """
            INSERT INTO customer_cart (customer_id, product_id, quantity, created_at, updated_at)
            VALUES (:customer_id, :product_id, :quantity, :created_at, :updated_at)
            ON DUPLICATE KEY UPDATE 
            quantity = LEAST(quantity + VALUES(quantity), 
                (SELECT stock_quantity FROM products WHERE id = :product_id)),
            updated_at = :updated_at
            """,
            {
                'customer_id': customer_id,
                'product_id': product_id,
                'quantity': quantity,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
        )
        
        db.session.commit()
        
        return jsonify({'message': 'Item added to cart'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Add to cart error: {str(e)}")
        return jsonify({'error': 'Failed to add to cart'}), 500

@customer_bp.route('/cart/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_cart_item(item_id):
    """Update cart item quantity"""
    try:
        customer_id = get_jwt_identity()
        data = request.get_json()
        quantity = data.get('quantity', 1)
        
        if quantity <= 0:
            return jsonify({'error': 'Quantity must be greater than 0'}), 400
        
        # Check if cart item belongs to customer
        cart_item = db.session.execute(
            """
            SELECT cc.id, cc.product_id, p.stock_quantity
            FROM customer_cart cc
            JOIN products p ON cc.product_id = p.id
            WHERE cc.id = :item_id AND cc.customer_id = :customer_id
            """,
            {'item_id': item_id, 'customer_id': customer_id}
        ).fetchone()
        
        if not cart_item:
            return jsonify({'error': 'Cart item not found'}), 404
        
        if cart_item['stock_quantity'] < quantity:
            return jsonify({'error': 'Insufficient stock'}), 400
        
        db.session.execute(
            "UPDATE customer_cart SET quantity = :quantity, updated_at = :updated_at WHERE id = :item_id",
            {'quantity': quantity, 'updated_at': datetime.utcnow(), 'item_id': item_id}
        )
        
        db.session.commit()
        
        return jsonify({'message': 'Cart item updated'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Update cart error: {str(e)}")
        return jsonify({'error': 'Failed to update cart'}), 500

@customer_bp.route('/cart/<int:item_id>', methods=['DELETE'])
@jwt_required()
def remove_from_cart(item_id):
    """Remove item from cart"""
    try:
        customer_id = get_jwt_identity()
        
        result = db.session.execute(
            "DELETE FROM customer_cart WHERE id = :item_id AND customer_id = :customer_id",
            {'item_id': item_id, 'customer_id': customer_id}
        )
        
        if result.rowcount == 0:
            return jsonify({'error': 'Cart item not found'}), 404
        
        db.session.commit()
        
        return jsonify({'message': 'Item removed from cart'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Remove from cart error: {str(e)}")
        return jsonify({'error': 'Failed to remove from cart'}), 500

@customer_bp.route('/cart', methods=['DELETE'])
@jwt_required()
def clear_cart():
    """Clear entire cart"""
    try:
        customer_id = get_jwt_identity()
        
        db.session.execute(
            "DELETE FROM customer_cart WHERE customer_id = :customer_id",
            {'customer_id': customer_id}
        )
        
        db.session.commit()
        
        return jsonify({'message': 'Cart cleared'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Clear cart error: {str(e)}")
        return jsonify({'error': 'Failed to clear cart'}), 500

# ========================================
# ORDER ENDPOINTS
# ========================================

@customer_bp.route('/orders', methods=['POST'])
@jwt_required()
def create_order():
    """Create a new order"""
    try:
        customer_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['items', 'delivery_address_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Get cart items
        cart_items = db.session.execute(
            """
            SELECT cc.product_id, cc.quantity, p.selling_price, p.name, p.stock_quantity
            FROM customer_cart cc
            JOIN products p ON cc.product_id = p.id
            WHERE cc.customer_id = :customer_id
            """,
            {'customer_id': customer_id}
        ).fetchall()
        
        if not cart_items:
            return jsonify({'error': 'Cart is empty'}), 400
        
        # Validate delivery address
        address = db.session.execute(
            "SELECT id FROM customer_addresses WHERE id = :address_id AND customer_id = :customer_id",
            {'address_id': data['delivery_address_id'], 'customer_id': customer_id}
        ).fetchone()
        
        if not address:
            return jsonify({'error': 'Invalid delivery address'}), 400
        
        # Calculate totals
        subtotal = sum(item['selling_price'] * item['quantity'] for item in cart_items)
        tax_amount = subtotal * 0.08  # 8% tax
        shipping_cost = 0 if subtotal > 100 else 9.99
        total_amount = subtotal + tax_amount + shipping_cost
        
        # Generate order number
        order_number = f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Create order
        order_id = db.session.execute(
            """
            INSERT INTO customer_orders 
            (order_number, customer_id, delivery_address_id, status, subtotal, 
             tax_amount, shipping_cost, total_amount, notes, created_at)
            VALUES (:order_number, :customer_id, :delivery_address_id, :status, :subtotal,
                    :tax_amount, :shipping_cost, :total_amount, :notes, :created_at)
            """,
            {
                'order_number': order_number,
                'customer_id': customer_id,
                'delivery_address_id': data['delivery_address_id'],
                'status': 'pending',
                'subtotal': subtotal,
                'tax_amount': tax_amount,
                'shipping_cost': shipping_cost,
                'total_amount': total_amount,
                'notes': data.get('notes'),
                'created_at': datetime.utcnow()
            }
        ).lastrowid
        
        # Create order items
        for item in cart_items:
            db.session.execute(
                """
                INSERT INTO customer_order_items 
                (order_id, product_id, product_name, product_sku, quantity, unit_price, total_price, created_at)
                VALUES (:order_id, :product_id, :product_name, :product_sku, :quantity, :unit_price, :total_price, :created_at)
                """,
                {
                    'order_id': order_id,
                    'product_id': item['product_id'],
                    'product_name': item['name'],
                    'product_sku': item.get('sku', ''),
                    'quantity': item['quantity'],
                    'unit_price': item['selling_price'],
                    'total_price': item['selling_price'] * item['quantity'],
                    'created_at': datetime.utcnow()
                }
            )
            
            # Update product stock
            db.session.execute(
                "UPDATE products SET stock_quantity = stock_quantity - :quantity WHERE id = :product_id",
                {'quantity': item['quantity'], 'product_id': item['product_id']}
            )
        
        # Clear cart
        db.session.execute(
            "DELETE FROM customer_cart WHERE customer_id = :customer_id",
            {'customer_id': customer_id}
        )
        
        # Add initial tracking
        db.session.execute(
            """
            INSERT INTO delivery_tracking 
            (order_id, status, description, tracking_timestamp, created_at)
            VALUES (:order_id, :status, :description, :tracking_timestamp, :created_at)
            """,
            {
                'order_id': order_id,
                'status': 'order_placed',
                'description': 'Order has been placed successfully',
                'tracking_timestamp': datetime.utcnow(),
                'created_at': datetime.utcnow()
            }
        )
        
        db.session.commit()
        
        return jsonify({
            'order': {
                'id': order_id,
                'order_number': order_number,
                'status': 'pending',
                'total_amount': total_amount
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Create order error: {str(e)}")
        return jsonify({'error': 'Failed to create order'}), 500

@customer_bp.route('/orders', methods=['GET'])
@jwt_required()
def get_orders():
    """Get customer's orders"""
    try:
        customer_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 50)
        status = request.args.get('status', '')
        
        where_conditions = ["customer_id = :customer_id"]
        params = {'customer_id': customer_id}
        
        if status:
            where_conditions.append("status = :status")
            params['status'] = status
        
        orders = db.session.execute(
            f"""
            SELECT id, order_number, status, subtotal, tax_amount, shipping_cost, 
                   total_amount, currency, tracking_number, estimated_delivery, 
                   delivered_at, created_at
            FROM customer_orders
            WHERE {' AND '.join(where_conditions)}
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
            """,
            {
                **params,
                'limit': per_page,
                'offset': (page - 1) * per_page
            }
        ).fetchall()
        
        # Get order items for each order
        orders_with_items = []
        for order in orders:
            items = db.session.execute(
                """
                SELECT product_name, quantity, unit_price, total_price
                FROM customer_order_items
                WHERE order_id = :order_id
                """,
                {'order_id': order['id']}
            ).fetchall()
            
            order_dict = dict(order)
            order_dict['items'] = [dict(item) for item in items]
            orders_with_items.append(order_dict)
        
        return jsonify({
            'orders': orders_with_items
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get orders error: {str(e)}")
        return jsonify({'error': 'Failed to get orders'}), 500

@customer_bp.route('/orders/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    """Get single order details"""
    try:
        customer_id = get_jwt_identity()
        
        order = db.session.execute(
            """
            SELECT co.*, ca.full_name, ca.phone, ca.address, ca.city, ca.postal_code
            FROM customer_orders co
            JOIN customer_addresses ca ON co.delivery_address_id = ca.id
            WHERE co.id = :order_id AND co.customer_id = :customer_id
            """,
            {'order_id': order_id, 'customer_id': customer_id}
        ).fetchone()
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        # Get order items
        items = db.session.execute(
            """
            SELECT product_name, product_sku, quantity, unit_price, total_price
            FROM customer_order_items
            WHERE order_id = :order_id
            """,
            {'order_id': order_id}
        ).fetchall()
        
        # Get tracking history
        tracking = db.session.execute(
            """
            SELECT status, location, description, tracking_timestamp
            FROM delivery_tracking
            WHERE order_id = :order_id
            ORDER BY tracking_timestamp ASC
            """,
            {'order_id': order_id}
        ).fetchall()
        
        return jsonify({
            'order': dict(order),
            'items': [dict(item) for item in items],
            'tracking': [dict(track) for track in tracking]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get order error: {str(e)}")
        return jsonify({'error': 'Failed to get order'}), 500

@customer_bp.route('/orders/<int:order_id>/track', methods=['GET'])
@jwt_required()
def track_delivery(order_id):
    """Track order delivery"""
    try:
        customer_id = get_jwt_identity()
        
        # Verify order belongs to customer
        order = db.session.execute(
            "SELECT id, status, tracking_number FROM customer_orders WHERE id = :order_id AND customer_id = :customer_id",
            {'order_id': order_id, 'customer_id': customer_id}
        ).fetchone()
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        # Get tracking history
        tracking = db.session.execute(
            """
            SELECT status, location, description, tracking_timestamp
            FROM delivery_tracking
            WHERE order_id = :order_id
            ORDER BY tracking_timestamp ASC
            """,
            {'order_id': order_id}
        ).fetchall()
        
        return jsonify({
            'order': {
                'id': order['id'],
                'status': order['status'],
                'tracking_number': order['tracking_number']
            },
            'tracking': [dict(track) for track in tracking]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Track delivery error: {str(e)}")
        return jsonify({'error': 'Failed to track delivery'}), 500

# ========================================
# ADDITIONAL ENDPOINTS (Wishlist, Reviews, etc.)
# ========================================

@customer_bp.route('/wishlist', methods=['GET'])
@jwt_required()
def get_wishlist():
    """Get customer's wishlist"""
    try:
        customer_id = get_jwt_identity()
        
        wishlist_items = db.session.execute(
            """
            SELECT cw.created_at, p.id, p.name, p.selling_price, p.image_url,
                   COALESCE(prs.average_rating, 0) as average_rating
            FROM customer_wishlist cw
            JOIN products p ON cw.product_id = p.id
            LEFT JOIN product_rating_summary prs ON p.id = prs.product_id
            WHERE cw.customer_id = :customer_id AND p.is_active = TRUE
            ORDER BY cw.created_at DESC
            """,
            {'customer_id': customer_id}
        ).fetchall()
        
        return jsonify({
            'wishlist': [dict(item) for item in wishlist_items]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get wishlist error: {str(e)}")
        return jsonify({'error': 'Failed to get wishlist'}), 500

@customer_bp.route('/wishlist', methods=['POST'])
@jwt_required()
def add_to_wishlist():
    """Add item to wishlist"""
    try:
        customer_id = get_jwt_identity()
        data = request.get_json()
        product_id = data.get('product_id')
        
        if not product_id:
            return jsonify({'error': 'product_id is required'}), 400
        
        # Check if product exists
        product = db.session.execute(
            "SELECT id FROM products WHERE id = :product_id AND is_active = TRUE",
            {'product_id': product_id}
        ).fetchone()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Add to wishlist (ignore duplicates)
        db.session.execute(
            """
            INSERT IGNORE INTO customer_wishlist (customer_id, product_id, created_at)
            VALUES (:customer_id, :product_id, :created_at)
            """,
            {
                'customer_id': customer_id,
                'product_id': product_id,
                'created_at': datetime.utcnow()
            }
        )
        
        db.session.commit()
        
        return jsonify({'message': 'Item added to wishlist'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Add to wishlist error: {str(e)}")
        return jsonify({'error': 'Failed to add to wishlist'}), 500

@customer_bp.route('/wishlist/<int:product_id>', methods=['DELETE'])
@jwt_required()
def remove_from_wishlist(product_id):
    """Remove item from wishlist"""
    try:
        customer_id = get_jwt_identity()
        
        result = db.session.execute(
            "DELETE FROM customer_wishlist WHERE customer_id = :customer_id AND product_id = :product_id",
            {'customer_id': customer_id, 'product_id': product_id}
        )
        
        db.session.commit()
        
        return jsonify({'message': 'Item removed from wishlist'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Remove from wishlist error: {str(e)}")
        return jsonify({'error': 'Failed to remove from wishlist'}), 500
