from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.product import Product
from app.utils.middleware import get_business_id

barcode_bp = Blueprint('barcode', __name__)

@barcode_bp.route('/lookup/<barcode>', methods=['GET'])
@jwt_required()
def lookup_barcode(barcode):
    """
    Lookup product information by barcode
    Returns product details if barcode is found in the system
    """
    try:
        business_id = get_business_id()
        
        # Search for product by barcode in the current business
        product = Product.query.filter_by(
            business_id=business_id, 
            barcode=barcode, 
            is_active=True
        ).first()
        
        if product:
            return jsonify({
                'found': True,
                'product': product.to_dict()
            }), 200
        else:
            # Try to find by SKU as fallback
            product_by_sku = Product.query.filter_by(
                business_id=business_id,
                sku=barcode,
                is_active=True
            ).first()
            
            if product_by_sku:
                return jsonify({
                    'found': True,
                    'product': product_by_sku.to_dict(),
                    'matched_by': 'sku'
                }), 200
            else:
                return jsonify({
                    'found': False,
                    'message': f'No product found with barcode: {barcode}'
                }), 200
                
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@barcode_bp.route('/products/with-barcodes', methods=['GET'])
@jwt_required()
def get_products_with_barcodes():
    """
    Get all products that have barcodes assigned
    Useful for testing and management
    """
    try:
        business_id = get_business_id()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        products = Product.query.filter_by(
            business_id=business_id,
            is_active=True
        ).filter(
            Product.barcode.isnot(None),
            Product.barcode != ''
        ).paginate(
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
