from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from app.utils.decorators import staff_required, manager_required
from app.utils.middleware import module_required
from datetime import datetime

purchases_bp = Blueprint('purchases', __name__)

@purchases_bp.route('/orders', methods=['GET'])
@jwt_required()
@module_required('purchases')
def get_purchase_orders():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        supplier_id = request.args.get('supplier_id', type=int)
        date_from = request.args.get('date_from', '')
        date_to = request.args.get('date_to', '')
        
        query = PurchaseOrder.query
        
        if search:
            query = query.join(Supplier).filter(
                db.or_(
                    PurchaseOrder.order_id.contains(search.upper()),
                    Supplier.company_name.contains(search)
                )
            )
        
        if status:
            query = query.filter(PurchaseOrder.status == PurchaseOrderStatus[status.upper()])
        
        if supplier_id:
            query = query.filter(PurchaseOrder.supplier_id == supplier_id)
        
        if date_from:
            query = query.filter(PurchaseOrder.order_date >= date_from)
        
        if date_to:
            query = query.filter(PurchaseOrder.order_date <= date_to)
        
        purchase_orders = query.order_by(PurchaseOrder.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'purchase_orders': [po.to_dict() for po in purchase_orders.items],
            'total': purchase_orders.total,
            'pages': purchase_orders.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@purchases_bp.route('/orders', methods=['POST'])
@jwt_required()
@module_required('purchases')
def create_purchase_order():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['supplier_id', 'items']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        if not data['items'] or not isinstance(data['items'], list):
            return jsonify({'error': 'Items must be a non-empty list'}), 400
        
        # Check if supplier exists
        supplier = Supplier.query.get(data['supplier_id'])
        if not supplier:
            return jsonify({'error': 'Supplier not found'}), 404
        
        # Check if user exists (the buyer)
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Generate order ID (e.g., PO0001)
        last_order = PurchaseOrder.query.order_by(PurchaseOrder.id.desc()).first()
        if last_order:
            last_id = int(last_order.order_id[2:])  # Remove 'PO' prefix
            order_id = f'PO{last_id + 1:04d}'
        else:
            order_id = 'PO0001'
        
        # Validate and process items
        order_items = []
        subtotal = 0
        
        for item_data in data['items']:
            required_item_fields = ['product_id', 'quantity', 'unit_price']
            for field in required_item_fields:
                if field not in item_data:
                    return jsonify({'error': f'Item {field} is required'}), 400
            
            product = Product.query.get(item_data['product_id'])
            if not product:
                return jsonify({'error': f'Product with ID {item_data["product_id"]} not found'}), 404
            
            # Calculate line total
            discount_percent = item_data.get('discount_percent', 0)
            line_total = item_data['quantity'] * item_data['unit_price']
            if discount_percent > 0:
                discount_amount = line_total * (discount_percent / 100)
                line_total -= discount_amount
            
            order_item = PurchaseOrderItem(
                product_id=item_data['product_id'],
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                discount_percent=discount_percent,
                line_total=line_total
            )
            
            order_items.append(order_item)
            subtotal += line_total
        
        # Calculate totals
        tax_rate = data.get('tax_rate', 0)  # e.g., 10 for 10%
        tax_amount = subtotal * (tax_rate / 100) if tax_rate > 0 else 0
        discount_amount = data.get('discount_amount', 0)
        shipping_cost = data.get('shipping_cost', 0)
        total_amount = subtotal + tax_amount - discount_amount + shipping_cost
        
        # Create purchase order
        purchase_order = PurchaseOrder(
            order_id=order_id,
            supplier_id=data['supplier_id'],
            user_id=current_user_id,
            order_date=data.get('order_date', datetime.utcnow().date()),
            required_date=data.get('required_date'),
            status=PurchaseOrderStatus[data.get('status', 'PENDING').upper()] if data.get('status') in [s.name for s in PurchaseOrderStatus] else PurchaseOrderStatus.PENDING,
            subtotal=subtotal,
            tax_amount=tax_amount,
            discount_amount=discount_amount,
            shipping_cost=shipping_cost,
            total_amount=total_amount,
            notes=data.get('notes', '')
        )
        
        # Add items to order
        for item in order_items:
            purchase_order.order_items.append(item)
        
        db.session.add(purchase_order)
        db.session.commit()
        
        return jsonify({
            'message': 'Purchase order created successfully',
            'purchase_order': purchase_order.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@purchases_bp.route('/orders/<int:order_id>', methods=['GET'])
@jwt_required()
@module_required('purchases')
def get_purchase_order(order_id):
    try:
        purchase_order = PurchaseOrder.query.get(order_id)
        
        if not purchase_order:
            return jsonify({'error': 'Purchase order not found'}), 404
        
        return jsonify({'purchase_order': purchase_order.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@purchases_bp.route('/orders/<int:order_id>', methods=['PUT'])
@jwt_required()
@module_required('purchases')
def update_purchase_order(order_id):
    try:
        purchase_order = PurchaseOrder.query.get(order_id)
        
        if not purchase_order:
            return jsonify({'error': 'Purchase order not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'status' in data:
            if data['status'] in [s.name for s in PurchaseOrderStatus]:
                purchase_order.status = PurchaseOrderStatus[data['status']]
        
        if 'required_date' in data:
            purchase_order.required_date = data['required_date']
        
        if 'notes' in data:
            purchase_order.notes = data['notes']
        
        purchase_order.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Purchase order updated successfully',
            'purchase_order': purchase_order.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@purchases_bp.route('/goods-receipt', methods=['POST'])
@jwt_required()
@module_required('purchases')
def receive_goods():
    try:
        data = request.get_json()
        
        required_fields = ['order_id', 'items']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Get the purchase order
        purchase_order = PurchaseOrder.query.get(data['order_id'])
        if not purchase_order:
            return jsonify({'error': 'Purchase order not found'}), 404
        
        # Process each item in the receipt
        for item_data in data['items']:
            # Find the corresponding order item
            order_item = None
            for po_item in purchase_order.order_items:
                if po_item.product_id == item_data['product_id']:
                    order_item = po_item
                    break
            
            if not order_item:
                return jsonify({'error': f'Product {item_data["product_id"]} not found in purchase order'}), 400
            
            # Update received quantity
            order_item.received_quantity = item_data.get('received_quantity', 0)
            
            # Update product stock
            product = Product.query.get(item_data['product_id'])
            if product:
                product.stock_quantity += item_data['received_quantity']
                product.updated_at = datetime.utcnow()
        
        # Update order status based on received items
        total_items = len(purchase_order.order_items)
        received_items = sum(1 for item in purchase_order.order_items if item.received_quantity >= item.quantity)
        
        if received_items == total_items:
            purchase_order.status = PurchaseOrderStatus.RECEIVED
        elif received_items > 0:
            purchase_order.status = PurchaseOrderStatus.PARTIALLY_RECEIVED
        else:
            purchase_order.status = PurchaseOrderStatus.CONFIRMED
        
        purchase_order.received_date = datetime.utcnow().date()
        purchase_order.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Goods received and inventory updated successfully',
            'purchase_order': purchase_order.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@purchases_bp.route('/suppliers', methods=['GET'])
@jwt_required()
@module_required('purchases')
def get_suppliers_for_purchases():
    try:
        suppliers = Supplier.query.filter_by(is_active=True).all()
        return jsonify({
            'suppliers': [supplier.to_dict() for supplier in suppliers]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@purchases_bp.route('/orders/<int:order_id>', methods=['DELETE'])
@jwt_required()
@module_required('purchases')
@manager_required
def delete_purchase_order(order_id):
    try:
        purchase_order = PurchaseOrder.query.get(order_id)
        
        if not purchase_order:
            return jsonify({'error': 'Purchase order not found'}), 404
        
        db.session.delete(purchase_order)
        db.session.commit()
        
        return jsonify({'message': 'Purchase order deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Additional purchase-related endpoints would go here
# - Purchase order approval workflow
# - Supplier performance tracking
# - Purchase analytics