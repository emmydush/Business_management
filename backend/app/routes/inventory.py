from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.product import Product
from app.models.category import Category
from app.models.supplier import Supplier
from app.models.inventory_transaction import InventoryTransaction
from app.utils.decorators import staff_required, manager_required, subscription_required
from app.utils.middleware import module_required, get_business_id, get_active_branch_id
from datetime import datetime
import os
from werkzeug.utils import secure_filename
from app.utils.notifications import check_low_stock_and_notify, check_expiry_and_notify

inventory_bp = Blueprint('inventory', __name__)

@inventory_bp.route('/products', methods=['GET'])
@jwt_required()
@module_required('inventory')
def get_products():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        category_id = request.args.get('category_id', type=int)
        supplier_id = request.args.get('supplier_id', type=int)
        is_active = request.args.get('is_active', type=str)
        low_stock = request.args.get('low_stock', type=bool)
        
        query = Product.query.filter_by(business_id=business_id)
        if branch_id:
            query = query.filter_by(branch_id=branch_id)
        
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
@subscription_required
def create_product():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        # Support JSON or multipart/form-data (for image upload)
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form
        else:
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
            last_product = Product.query.filter_by(business_id=business_id).order_by(Product.id.desc()).first()
            if last_product:
                try:
                    last_id = int(last_product.product_id[4:])  # Remove 'PROD' prefix
                    product_id = f'PROD{last_id + 1:04d}'
                except:
                    product_id = f'PROD{datetime.now().strftime("%Y%m%d%H%M%S")}'
            else:
                product_id = 'PROD0001'
        else:
            # Check if product ID already exists for this business
            existing_product = Product.query.filter_by(business_id=business_id, product_id=product_id).first()
            if existing_product:
                return jsonify({'error': 'Product ID already exists for this business'}), 409
        
        # Check if SKU or barcode already exists for this business
        if data.get('sku'):
            existing_sku = Product.query.filter_by(business_id=business_id, sku=data['sku']).first()
            if existing_sku:
                return jsonify({'error': 'SKU already exists for this business'}), 409
        
        if data.get('barcode'):
            existing_barcode = Product.query.filter_by(business_id=business_id, barcode=data['barcode']).first()
            if existing_barcode:
                return jsonify({'error': 'Barcode already exists for this business'}), 409
        
        # Check if category exists for this business
        category = Category.query.filter_by(id=data['category_id'], business_id=business_id).first()
        if not category:
            return jsonify({'error': 'Category not found for this business'}), 404
        
        # Check if supplier exists (if provided)
        if data.get('supplier_id'):
            supplier = Supplier.query.filter_by(id=data['supplier_id'], business_id=business_id).first()
            if not supplier:
                return jsonify({'error': 'Supplier not found for this business'}), 404
        
        product = Product(
            business_id=business_id,
            branch_id=branch_id,
            product_id=product_id,
            name=data['name'],
            description=data.get('description', ''),
            sku=data.get('sku') or None,
            barcode=data.get('barcode') or None,
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
            brand=data.get('brand'),
            expiry_date=datetime.fromisoformat(data['expiry_date']).date() if data.get('expiry_date') else None
        )
        db.session.add(product)
        db.session.commit()

        # Check for low stock and expiry and notify
        check_low_stock_and_notify(product)
        check_expiry_and_notify(product)

        # Handle image upload if provided
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename:
                filename = secure_filename(file.filename)
                # Use the base directory for uploads, not the static folder
                base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                uploads_dir = os.path.join(base_dir, 'static', 'uploads', 'products')
                os.makedirs(uploads_dir, exist_ok=True)
                # prefix filename with product id to avoid collisions
                name, ext = os.path.splitext(filename)
                filename = f"product_{product.id}_{int(datetime.utcnow().timestamp())}{ext}"
                file_path = os.path.join(uploads_dir, filename)
                file.save(file_path)
                # store relative URL
                product.image = f"/static/uploads/products/{filename}"
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
        business_id = get_business_id()
        product = Product.query.filter_by(id=product_id, business_id=business_id).first()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        return jsonify({'product': product.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@inventory_bp.route('/products/<int:product_id>', methods=['PUT'])
@jwt_required()
@module_required('inventory')
@subscription_required
def update_product(product_id):
    try:
        business_id = get_business_id()
        product = Product.query.filter_by(id=product_id, business_id=business_id).first()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Support JSON or multipart/form-data (for image upload)
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form
        else:
            data = request.get_json()
        
        # Update allowed fields
        if 'name' in data:
            product.name = data['name']
        if 'description' in data:
            product.description = data['description']
        if 'sku' in data and data['sku'] != product.sku:
            existing_product = Product.query.filter_by(business_id=business_id, sku=data['sku']).first()
            if existing_product and existing_product.id != product.id:
                return jsonify({'error': 'SKU already exists for this business'}), 409
            product.sku = data['sku'] or None
        if 'barcode' in data and data['barcode'] != product.barcode:
            existing_product = Product.query.filter_by(business_id=business_id, barcode=data['barcode']).first()
            if existing_product and existing_product.id != product.id:
                return jsonify({'error': 'Barcode already exists for this business'}), 409
            product.barcode = data['barcode'] or None
        if 'category_id' in data:
            category = Category.query.filter_by(id=data['category_id'], business_id=business_id).first()
            if not category:
                return jsonify({'error': 'Category not found for this business'}), 404
            product.category_id = data['category_id']
        if 'supplier_id' in data:
            supplier = Supplier.query.filter_by(id=data['supplier_id'], business_id=business_id).first()
            if not supplier:
                return jsonify({'error': 'Supplier not found for this business'}), 404
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
        if 'expiry_date' in data:
            product.expiry_date = datetime.fromisoformat(data['expiry_date']).date() if data['expiry_date'] else None
        if 'is_active' in data:
            # Convert string values to boolean
            if isinstance(data['is_active'], str):
                product.is_active = data['is_active'].lower() in ['true', '1', 'yes', 'on']
            else:
                product.is_active = bool(data['is_active'])
        if 'branch_id' in data:
            product.branch_id = data['branch_id']
        
        product.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Check for low stock and expiry and notify
        check_low_stock_and_notify(product)
        check_expiry_and_notify(product)

        # Handle image upload if provided
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename:
                filename = secure_filename(file.filename)
                # Use the base directory for uploads, not the static folder
                base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                uploads_dir = os.path.join(base_dir, 'static', 'uploads', 'products')
                os.makedirs(uploads_dir, exist_ok=True)
                name, ext = os.path.splitext(filename)
                filename = f"product_{product.id}_{int(datetime.utcnow().timestamp())}{ext}"
                file_path = os.path.join(uploads_dir, filename)
                file.save(file_path)
                product.image = f"/static/uploads/products/{filename}"
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
        business_id = get_business_id()
        product = Product.query.filter_by(id=product_id, business_id=business_id).first()
        
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
        business_id = get_business_id()
        categories = Category.query.filter_by(business_id=business_id, is_active=True).all()
        return jsonify({
            'categories': [category.to_dict() for category in categories]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@inventory_bp.route('/categories', methods=['POST'])
@jwt_required()
@module_required('inventory')
@subscription_required
def create_category():
    try:
        business_id = get_business_id()
        data = request.get_json()
        
        if not data.get('name'):
            return jsonify({'error': 'Category name is required'}), 400
            
        # Check if category name already exists for this business
        existing_category = Category.query.filter_by(business_id=business_id, name=data['name']).first()
        if existing_category:
            return jsonify({'error': 'Category name already exists for this business'}), 409
        
        category = Category(
            business_id=business_id,
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
@subscription_required
def adjust_stock():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        data = request.get_json()
        
        required_fields = ['product_id', 'adjustment_type', 'quantity']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        product = Product.query.filter_by(id=data['product_id'], business_id=business_id).first()
        if not product:
            return jsonify({'error': 'Product not found for this business'}), 404
        
        adjustment_type = data['adjustment_type'].upper()
        quantity = data['quantity']
        
        if adjustment_type == 'IN':
            product.stock_quantity += quantity
        elif adjustment_type == 'OUT':
            if product.stock_quantity < quantity:
                return jsonify({'error': 'Insufficient stock'}), 400
            product.stock_quantity -= quantity
        else:
            return jsonify({'error': 'Invalid adjustment type. Use IN or OUT'}), 400
        
        product.updated_at = datetime.utcnow()
        
        # Create an inventory transaction record
        from app.models.inventory_transaction import InventoryTransaction, TransactionType
        
        transaction_type = TransactionType.ADJUSTMENT_IN if adjustment_type == 'IN' else TransactionType.ADJUSTMENT_OUT
        
        # Generate transaction ID
        last_transaction = InventoryTransaction.query.filter_by(business_id=business_id).order_by(InventoryTransaction.id.desc()).first()
        if last_transaction:
            try:
                last_id = int(last_transaction.transaction_id[3:])  # Remove 'ITX' prefix
                transaction_id = f'ITX{last_id + 1:04d}'
            except:
                transaction_id = f'ITX{datetime.now().strftime("%Y%m%d%H%M%S")}'
        else:
            transaction_id = 'ITX0001'
        
        transaction = InventoryTransaction(
            business_id=business_id,
            branch_id=branch_id or product.branch_id,
            transaction_id=transaction_id,
            product_id=product.id,
            transaction_type=transaction_type,
            quantity=quantity,
            reference_id=data.get('reason', ''),
            notes=data.get('reason', ''),
            created_by=get_jwt_identity()
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        # Check for low stock and expiry and notify
        check_low_stock_and_notify(product)
        check_expiry_and_notify(product)
        
        return jsonify({
            'message': 'Stock adjusted successfully',
            'product': product.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Get inventory transactions (stock movements)
@inventory_bp.route('/transactions', methods=['GET'])
@jwt_required()
@module_required('inventory')
def get_inventory_transactions():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Get filters
        transaction_type = request.args.get('type')
        product_id = request.args.get('product_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = InventoryTransaction.query.filter_by(business_id=business_id)
        if branch_id:
            query = query.filter_by(branch_id=branch_id)
        
        if transaction_type:
            query = query.filter(InventoryTransaction.transaction_type == transaction_type.upper())
        
        if product_id:
            query = query.filter(InventoryTransaction.product_id == product_id)
        
        if start_date:
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(InventoryTransaction.created_at >= start_dt)
        
        if end_date:
            end_dt = datetime.strptime(end_date, '%Y-%m-%d')
            query = query.filter(InventoryTransaction.created_at <= end_dt)
        
        transactions = query.order_by(InventoryTransaction.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'transactions': [tx.to_dict() for tx in transactions.items],
            'total': transactions.total,
            'pages': transactions.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Bulk upload products via CSV
@inventory_bp.route('/products/bulk-upload', methods=['POST'])
@jwt_required()
@module_required('inventory')
@manager_required
@subscription_required
def bulk_upload_products():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()

        if 'file' not in request.files:
            return jsonify({'error': 'No file part in the request'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        # Only accept CSV files for now
        if not file.filename.lower().endswith('.csv'):
            return jsonify({'error': 'Only CSV files are supported. Please upload a .csv file'}), 400

        content = file.read().decode('utf-8-sig')

        import csv
        reader = csv.DictReader(content.splitlines())

        created = []
        errors = []
        row_num = 1
        for row in reader:
            row_num += 1
            # Basic validation
            name = row.get('name') or row.get('product_name')
            if not name:
                errors.append({'row': row_num, 'error': 'Missing product name'})
                continue

            # Category: allow category_id or category_name
            category_id = None
            if row.get('category_id'):
                try:
                    category_id = int(row.get('category_id'))
                    cat = Category.query.filter_by(id=category_id, business_id=business_id).first()
                    if not cat:
                        errors.append({'row': row_num, 'error': f'Category id {category_id} not found for this business'})
                        continue
                except ValueError:
                    errors.append({'row': row_num, 'error': 'Invalid category_id format'})
                    continue
            elif row.get('category'):
                cat_name = row.get('category').strip()
                cat = Category.query.filter_by(name=cat_name, business_id=business_id).first()
                if cat:
                    category_id = cat.id
                else:
                    # Auto-create category if it doesn't exist
                    try:
                        new_cat = Category(
                            business_id=business_id,
                            name=cat_name,
                            description=f"Auto-created during bulk upload on {datetime.now().strftime('%Y-%m-%d')}"
                        )
                        db.session.add(new_cat)
                        db.session.flush() # Get the ID without committing the whole transaction yet
                        category_id = new_cat.id
                    except Exception as e:
                        errors.append({'row': row_num, 'error': f"Failed to create category '{cat_name}': {str(e)}"})
                        continue

            # Unit price
            try:
                unit_price_val = row.get('unit_price')
                if unit_price_val is None or unit_price_val == '':
                    unit_price = 0.0
                else:
                    unit_price = float(unit_price_val)
            except (ValueError, TypeError):
                errors.append({'row': row_num, 'error': f'Invalid unit_price: {row.get("unit_price")}'})
                continue

            # Stock quantity
            try:
                stock_quantity_val = row.get('stock_quantity')
                if stock_quantity_val is None or stock_quantity_val == '':
                    stock_quantity = 0
                else:
                    stock_quantity = int(float(stock_quantity_val))
            except (ValueError, TypeError):
                errors.append({'row': row_num, 'error': f'Invalid stock_quantity: {row.get("stock_quantity")}'})
                continue

            # Other fields
            product_id = row.get('product_id')
            sku = row.get('sku')
            barcode = row.get('barcode')
            description = row.get('description')
            
            # Safely parse cost_price
            try:
                cost_price_val = row.get('cost_price')
                if cost_price_val is None or cost_price_val == '':
                    cost_price = None
                else:
                    cost_price = float(cost_price_val)
            except (ValueError, TypeError):
                errors.append({'row': row_num, 'error': f'Invalid cost_price: {row.get("cost_price")}'})
                continue
            
            # Safely parse reorder_level
            try:
                reorder_level_val = row.get('reorder_level')
                if reorder_level_val is None or reorder_level_val == '':
                    reorder_level = 0
                else:
                    reorder_level = int(float(reorder_level_val))
            except (ValueError, TypeError):
                errors.append({'row': row_num, 'error': f'Invalid reorder_level: {row.get("reorder_level")}'})
                continue
            
            # Parse other optional fields
            unit_of_measure = row.get('unit_of_measure')
            
            # Safely parse min_stock_level
            try:
                min_stock_level_val = row.get('min_stock_level')
                if min_stock_level_val is None or min_stock_level_val == '':
                    min_stock_level = 0
                else:
                    min_stock_level = int(float(min_stock_level_val))
            except (ValueError, TypeError):
                errors.append({'row': row_num, 'error': f'Invalid min_stock_level: {row.get("min_stock_level")}'})
                continue
            
            # Safely parse max_stock_level
            try:
                max_stock_level_val = row.get('max_stock_level')
                if max_stock_level_val is None or max_stock_level_val == '':
                    max_stock_level = None
                else:
                    max_stock_level = int(float(max_stock_level_val))
            except (ValueError, TypeError):
                errors.append({'row': row_num, 'error': f'Invalid max_stock_level: {row.get("max_stock_level")}'})
                continue
            
            # Safely parse weight
            try:
                weight_val = row.get('weight')
                if weight_val is None or weight_val == '':
                    weight = None
                else:
                    weight = float(weight_val)
            except (ValueError, TypeError):
                errors.append({'row': row_num, 'error': f'Invalid weight: {row.get("weight")}'})
                continue
            
            dimensions = row.get('dimensions')
            color = row.get('color')
            size = row.get('size')
            brand = row.get('brand')
            # Safely parse expiry_date
            try:
                expiry_date = datetime.fromisoformat(row['expiry_date']).date() if row.get('expiry_date') else None
            except (ValueError, TypeError):
                errors.append({'row': row_num, 'error': f'Invalid expiry_date: {row.get("expiry_date")}'})
                continue
            is_active = row.get('is_active', 'true').lower() in ['true', '1', 'yes', 'on'] if row.get('is_active') else True

            # Uniqueness checks
            if product_id:
                existing = Product.query.filter_by(business_id=business_id, product_id=product_id).first()
                if existing:
                    errors.append({'row': row_num, 'error': f'Product ID {product_id} already exists for this business'})
                    continue

            if sku:
                existing = Product.query.filter_by(business_id=business_id, sku=sku).first()
                if existing:
                    errors.append({'row': row_num, 'error': f'SKU {sku} already exists for this business'})
                    continue

            if barcode:
                existing = Product.query.filter_by(business_id=business_id, barcode=barcode).first()
                if existing:
                    errors.append({'row': row_num, 'error': f'Barcode {barcode} already exists for this business'})
                    continue

            # Generate product_id if missing
            if not product_id:
                last_product = Product.query.filter_by(business_id=business_id).order_by(Product.id.desc()).first()
                if last_product:
                    try:
                        last_id = int(last_product.product_id[4:])  # Remove 'PROD' prefix
                        product_id = f'PROD{last_id + 1:04d}'
                    except Exception:
                        product_id = f'PROD{datetime.now().strftime("%Y%m%d%H%M%S")}'
                else:
                    product_id = 'PROD0001'

            # Create product
            product = Product(
                business_id=business_id,
                branch_id=branch_id,
                product_id=product_id,
                name=name,
                description=description or '',
                sku=sku,
                barcode=barcode,
                category_id=category_id,
                unit_price=unit_price,
                cost_price=cost_price,
                unit_of_measure=unit_of_measure,
                stock_quantity=stock_quantity,
                reorder_level=reorder_level,
                min_stock_level=min_stock_level,
                max_stock_level=max_stock_level,
                weight=weight,
                dimensions=dimensions,
                color=color,
                size=size,
                brand=brand,
                expiry_date=expiry_date,
                is_active=is_active
            )

            try:
                db.session.add(product)
                db.session.commit()
                
                # Check for low stock and expiry and notify after each product is created
                try:
                    check_low_stock_and_notify(product)
                    check_expiry_and_notify(product)
                except Exception as notify_error:
                    # Log notification errors but don't fail the entire upload
                    print(f"Notification error for product {product.name}: {str(notify_error)}")
                
                created.append(product.to_dict())
            except Exception as e:
                db.session.rollback()
                errors.append({'row': row_num, 'error': str(e)})
                continue

        return jsonify({'created': created, 'errors': errors, 'created_count': len(created)}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500