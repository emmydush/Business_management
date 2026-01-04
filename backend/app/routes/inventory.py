from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.product import Product
from app.models.category import Category
from app.models.supplier import Supplier
from app.utils.decorators import staff_required, manager_required
from app.utils.middleware import module_required
from datetime import datetime

inventory_bp = Blueprint('inventory', __name__)

@inventory_bp.route('/products', methods=['GET'])
@jwt_required()
@module_required('inventory')
def get_products():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        category_id = request.args.get('category_id', type=int)
        supplier_id = request.args.get('supplier_id', type=int)
        is_active = request.args.get('is_active', type=str)
        low_stock = request.args.get('low_stock', type=bool)
        
        query = Product.query
        
        if search:
            query = query.filter(
                db.or_(
                    Product.product_id.contains(search.upper()),
                    Product.name.contains(search),
                    Product.sku.contains(search),
                    Product.barcode.contains(search)
                )
            )
        
        if category_id:
            query = query.filter(Product.category_id == category_id)
        
        if supplier_id:
            query = query.filter(Product.supplier_id == supplier_id)
        
        if is_active is not None:
            query = query.filter(Product.is_active == (is_active.lower() == 'true'))
        
        if low_stock:
            query = query.filter(Product.stock_quantity <= Product.reorder_level)
        
        products = query.order_by(Product.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'products': [product.to_dict() for product in products.items],
            'total': products.total,
            'pages': products.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@inventory_bp.route('/products', methods=['POST'])
@jwt_required()
@module_required('inventory')
def create_product():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'category_id', 'unit_price']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if product ID is provided, otherwise generate one
        product_id = data.get('product_id')
        if not product_id:
            # Generate product ID (e.g., PROD0001)
            last_product = Product.query.order_by(Product.id.desc()).first()
            if last_product:
                last_id = int(last_product.product_id[4:])  # Remove 'PROD' prefix
                product_id = f'PROD{last_id + 1:04d}'
            else:
                product_id = 'PROD0001'
        else:
            # Check if product ID already exists
            existing_product = Product.query.filter_by(product_id=product_id).first()
            if existing_product:
                return jsonify({'error': 'Product ID already exists'}), 409
        
        # Check if SKU or barcode already exists
        if data.get('sku'):
            existing_sku = Product.query.filter_by(sku=data['sku']).first()
            if existing_sku:
                return jsonify({'error': 'SKU already exists'}), 409
        
        if data.get('barcode'):
            existing_barcode = Product.query.filter_by(barcode=data['barcode']).first()
            if existing_barcode:
                return jsonify({'error': 'Barcode already exists'}), 409
        
        # Check if category exists
        category = Category.query.get(data['category_id'])
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        # Check if supplier exists (if provided)
        supplier = None
        if data.get('supplier_id'):
            supplier = Supplier.query.get(data['supplier_id'])
            if not supplier:
                return jsonify({'error': 'Supplier not found'}), 404
        
        product = Product(
            product_id=product_id,
            name=data['name'],
            description=data.get('description', ''),
            sku=data.get('sku', ''),
            barcode=data.get('barcode', ''),
            category_id=data['category_id'],
            supplier_id=data.get('supplier_id'),
            unit_price=data['unit_price'],
            cost_price=data.get('cost_price'),
            unit_of_measure=data.get('unit_of_measure', 'pieces'),
            stock_quantity=data.get('stock_quantity', 0),
            reorder_level=data.get('reorder_level', 0),
            min_stock_level=data.get('min_stock_level', 0),
            max_stock_level=data.get('max_stock_level'),
            weight=data.get('weight'),
            dimensions=data.get('dimensions'),
            color=data.get('color'),
            size=data.get('size'),
            brand=data.get('brand')
        )
        
        db.session.add(product)
        db.session.commit()
        
        return jsonify({
            'message': 'Product created successfully',
            'product': product.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@inventory_bp.route('/products/<int:product_id>', methods=['GET'])
@jwt_required()
@module_required('inventory')
def get_product(product_id):
    try:
        product = Product.query.get(product_id)
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        return jsonify({'product': product.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@inventory_bp.route('/products/<int:product_id>', methods=['PUT'])
@jwt_required()
@module_required('inventory')
def update_product(product_id):
    try:
        product = Product.query.get(product_id)
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'name' in data:
            product.name = data['name']
        if 'description' in data:
            product.description = data['description']
        if 'sku' in data and data['sku'] != product.sku:
            existing_product = Product.query.filter_by(sku=data['sku']).first()
            if existing_product and existing_product.id != product.id:
                return jsonify({'error': 'SKU already exists'}), 409
            product.sku = data['sku']
        if 'barcode' in data and data['barcode'] != product.barcode:
            existing_product = Product.query.filter_by(barcode=data['barcode']).first()
            if existing_product and existing_product.id != product.id:
                return jsonify({'error': 'Barcode already exists'}), 409
            product.barcode = data['barcode']
        if 'category_id' in data:
            category = Category.query.get(data['category_id'])
            if not category:
                return jsonify({'error': 'Category not found'}), 404
            product.category_id = data['category_id']
        if 'supplier_id' in data:
            supplier = Supplier.query.get(data['supplier_id'])
            if not supplier:
                return jsonify({'error': 'Supplier not found'}), 404
            product.supplier_id = data['supplier_id']
        if 'unit_price' in data:
            product.unit_price = data['unit_price']
        if 'cost_price' in data:
            product.cost_price = data['cost_price']
        if 'unit_of_measure' in data:
            product.unit_of_measure = data['unit_of_measure']
        if 'stock_quantity' in data:
            product.stock_quantity = data['stock_quantity']
        if 'reorder_level' in data:
            product.reorder_level = data['reorder_level']
        if 'min_stock_level' in data:
            product.min_stock_level = data['min_stock_level']
        if 'max_stock_level' in data:
            product.max_stock_level = data['max_stock_level']
        if 'weight' in data:
            product.weight = data['weight']
        if 'dimensions' in data:
            product.dimensions = data['dimensions']
        if 'color' in data:
            product.color = data['color']
        if 'size' in data:
            product.size = data['size']
        if 'brand' in data:
            product.brand = data['brand']
        if 'is_active' in data:
            product.is_active = data['is_active']
        
        product.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Product updated successfully',
            'product': product.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@inventory_bp.route('/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
@module_required('inventory')
def delete_product(product_id):
    try:
        product = Product.query.get(product_id)
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        db.session.delete(product)
        db.session.commit()
        
        return jsonify({'message': 'Product deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@inventory_bp.route('/categories', methods=['GET'])
@jwt_required()
@module_required('inventory')
def get_categories():
    try:
        categories = Category.query.filter_by(is_active=True).all()
        return jsonify({
            'categories': [category.to_dict() for category in categories]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@inventory_bp.route('/categories', methods=['POST'])
@jwt_required()
@module_required('inventory')
def create_category():
    try:
        data = request.get_json()
        
        if not data.get('name'):
            return jsonify({'error': 'Category name is required'}), 400
        
        category = Category(
            name=data['name'],
            description=data.get('description', ''),
            parent_id=data.get('parent_id')
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'message': 'Category created successfully',
            'category': category.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@inventory_bp.route('/stock-adjustment', methods=['POST'])
@jwt_required()
@module_required('inventory')
def adjust_stock():
    try:
        data = request.get_json()
        
        required_fields = ['product_id', 'adjustment_type', 'quantity']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        product = Product.query.get(data['product_id'])
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        adjustment_type = data['adjustment_type'].upper()
        quantity = data['quantity']
        
        if adjustment_type == 'IN':
            # Stock in - increase inventory
            product.stock_quantity += quantity
        elif adjustment_type == 'OUT':
            # Stock out - decrease inventory
            if product.stock_quantity < quantity:
                return jsonify({'error': 'Insufficient stock'}), 400
            product.stock_quantity -= quantity
        else:
            return jsonify({'error': 'Invalid adjustment type. Use IN or OUT'}), 400
        
        product.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Stock adjusted successfully',
            'product': product.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500