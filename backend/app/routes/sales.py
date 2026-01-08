from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderStatus
from app.utils.decorators import staff_required, manager_required
from app.utils.middleware import module_required, get_business_id
from datetime import datetime
import re
from app.utils.notifications import check_low_stock_and_notify

sales_bp = Blueprint('sales', __name__)

@sales_bp.route('/orders', methods=['GET'])
@jwt_required()
@module_required('sales')
def get_orders():
    try:
        business_id = get_business_id()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        customer_id = request.args.get('customer_id', type=int)
        date_from = request.args.get('date_from', '')
        date_to = request.args.get('date_to', '')
        
        query = Order.query.filter_by(business_id=business_id)
        
        if search:
            query = query.join(Customer).filter(
                db.or_(
                    Order.order_id.contains(search.upper()),
                    Customer.first_name.contains(search),
                    Customer.last_name.contains(search),
                    Customer.company.contains(search)
                )
            )
        
        if status:
            try:
                query = query.filter(Order.status == OrderStatus[status.upper()])
            except KeyError:
                pass
        
        if customer_id:
            query = query.filter(Order.customer_id == customer_id)
        
        if date_from:
            query = query.filter(Order.order_date >= date_from)
        
        if date_to:
            query = query.filter(Order.order_date <= date_to)
        
        orders = query.order_by(Order.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'orders': [order.to_dict() for order in orders.items],
            'total': orders.total,
            'pages': orders.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/orders', methods=['POST'])
@jwt_required()
@module_required('sales')
def create_order(is_pos_sale=False):
    try:
        business_id = get_business_id()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['customer_id', 'items']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        if not data['items'] or not isinstance(data['items'], list):
            return jsonify({'error': 'Items must be a non-empty list'}), 400
        
        # Check if customer exists for this business
        customer = Customer.query.filter_by(id=data['customer_id'], business_id=business_id).first()
        if not customer:
            return jsonify({'error': 'Customer not found for this business'}), 404
        
        # Generate order ID (e.g., ORD0001)
        last_order = Order.query.filter_by(business_id=business_id).order_by(Order.id.desc()).first()
        if last_order:
            try:
                last_id = int(last_order.order_id[3:])  # Remove 'ORD' prefix
                order_id = f'ORD{last_id + 1:04d}'
            except:
                order_id = f'ORD{datetime.now().strftime("%Y%m%d%H%M%S")}'
        else:
            order_id = 'ORD0001'
        
        # Validate and process items
        order_items = []
        subtotal = 0
        
        # First, validate all items and check stock availability
        validated_items = []
        for item_data in data['items']:
            required_item_fields = ['product_id', 'quantity', 'unit_price']
            for field in required_item_fields:
                if field not in item_data:
                    return jsonify({'error': f'Item {field} is required'}), 400
            
            product = Product.query.filter_by(id=item_data['product_id'], business_id=business_id).first()
            if not product:
                return jsonify({'error': f'Product with ID {item_data["product_id"]} not found for this business'}), 404
            
            if product.stock_quantity < item_data['quantity']:
                return jsonify({'error': f'Insufficient stock for product {product.name}. Available: {product.stock_quantity}, Requested: {item_data["quantity"]}'}), 400
            
            validated_items.append((item_data, product))
        
        # Process items after validation
        for item_data, product in validated_items:
            # Calculate line total
            discount_percent = item_data.get('discount_percent', 0)
            line_total = item_data['quantity'] * item_data['unit_price']
            if discount_percent > 0:
                discount_amount = line_total * (discount_percent / 100)
                line_total -= discount_amount
            
            order_item = OrderItem(
                product_id=item_data['product_id'],
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                discount_percent=discount_percent,
                line_total=line_total
            )
            
            order_items.append(order_item)
            subtotal += line_total
            
            # Reduce stock immediately during processing
            product.stock_quantity -= item_data['quantity']
            
            # Check for low stock and notify
            check_low_stock_and_notify(product)
        
        # Calculate totals
        tax_rate = data.get('tax_rate', 0)
        tax_amount = subtotal * (tax_rate / 100) if tax_rate > 0 else 0
        discount_amount = data.get('discount_amount', 0)
        shipping_cost = data.get('shipping_cost', 0)
        total_amount = subtotal + tax_amount - discount_amount + shipping_cost
        
        # Determine status based on whether it's a POS sale
        if is_pos_sale:
            # POS sales are paid immediately and delivered on spot
            order_status = OrderStatus.DELIVERED  # since items are given immediately at POS
        else:
            # Regular orders start as pending
            order_status = OrderStatus[data.get('status', 'PENDING').upper()] if data.get('status') in [s.name for s in OrderStatus] else OrderStatus.PENDING
        
        # Create order
        order = Order(
            business_id=business_id,
            order_id=order_id,
            customer_id=data['customer_id'],
            user_id=get_jwt_identity(),
            order_date=data.get('order_date', datetime.utcnow().date()),
            required_date=data.get('required_date'),
            shipped_date=data.get('shipped_date'),
            status=order_status,
            subtotal=subtotal,
            tax_amount=tax_amount,
            discount_amount=discount_amount,
            shipping_cost=shipping_cost,
            total_amount=total_amount,
            notes=data.get('notes', '')
        )
        
        # Add items to order
        for item in order_items:
            order.order_items.append(item)
        
        db.session.add(order)
        db.session.commit()
        
        return jsonify({
            'message': 'Order created successfully',
            'order': order.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/orders/<int:order_id>', methods=['GET'])
@jwt_required()
@module_required('sales')
def get_order(order_id):
    try:
        business_id = get_business_id()
        order = Order.query.filter_by(id=order_id, business_id=business_id).first()
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        # Include order items with product details
        order_dict = order.to_dict()
        order_dict['items'] = []
        for item in order.order_items:
            order_dict['items'].append({
                'id': item.id,
                'product_id': item.product_id,
                'product_name': item.product.name if item.product else 'Unknown Product',
                'product_description': item.product.description if item.product else '',
                'quantity': item.quantity,
                'unit_price': float(item.unit_price) if item.unit_price else 0.0,
                'cost_price': float(item.product.cost_price) if item.product and item.product.cost_price else 0.0,
                'discount_percent': float(item.discount_percent) if item.discount_percent else 0.0,
                'line_total': float(item.line_total) if item.line_total else 0.0,
                'created_at': item.created_at.isoformat() if item.created_at else None,
                'updated_at': item.updated_at.isoformat() if item.updated_at else None
            })
        
        return jsonify({'order': order_dict}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/orders/<int:order_id>', methods=['PUT'])
@jwt_required()
@module_required('sales')
def update_order(order_id):
    try:
        business_id = get_business_id()
        order = Order.query.filter_by(id=order_id, business_id=business_id).first()
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        data = request.get_json()
        
        if 'status' in data:
            status_val = data['status'].upper()
            if status_val in [s.name for s in OrderStatus]:
                order.status = OrderStatus[status_val]
        
        if 'customer_id' in data:
            customer = Customer.query.filter_by(id=data['customer_id'], business_id=business_id).first()
            if customer:
                order.customer_id = data['customer_id']
        
        if 'order_date' in data:
            try:
                order.order_date = datetime.strptime(data['order_date'], '%Y-%m-%d').date()
            except:
                pass

        if 'required_date' in data:
            try:
                order.required_date = datetime.strptime(data['required_date'], '%Y-%m-%d').date() if data['required_date'] else None
            except:
                pass
        
        if 'shipped_date' in data:
            try:
                order.shipped_date = datetime.strptime(data['shipped_date'], '%Y-%m-%d').date() if data['shipped_date'] else None
            except:
                pass
        
        if 'notes' in data:
            order.notes = data['notes']
        
        order.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Order updated successfully',
            'order': order.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/orders/<int:order_id>/status', methods=['PUT'])
@jwt_required()
@module_required('sales')
def update_order_status(order_id):
    try:
        business_id = get_business_id()
        order = Order.query.filter_by(id=order_id, business_id=business_id).first()
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        data = request.get_json()
        
        if not data.get('status'):
            return jsonify({'error': 'Status is required'}), 400
        
        if data['status'].upper() not in [s.name for s in OrderStatus]:
            return jsonify({'error': 'Invalid status'}), 400
        
        order.status = OrderStatus[data['status'].upper()]
        order.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Order status updated successfully',
            'order': order.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/orders/<int:order_id>', methods=['DELETE'])
@jwt_required()
@module_required('sales')
@manager_required
def delete_order(order_id):
    try:
        business_id = get_business_id()
        order = Order.query.filter_by(id=order_id, business_id=business_id).first()
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        db.session.delete(order)
        db.session.commit()
        
        return jsonify({'message': 'Order deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/pos', methods=['POST'])
@jwt_required()
@module_required('sales')
@staff_required
def create_pos_sale():
    try:
        return create_order(is_pos_sale=True)
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500