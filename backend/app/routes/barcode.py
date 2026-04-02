from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.product import Product
from app.utils.middleware import get_business_id
import qrcode
import io
import base64
from PIL import Image, ImageDraw, ImageFont
import random
import string
from datetime import datetime

barcode_bp = Blueprint('barcode', __name__)

def generate_unique_barcode(business_id):
    """Generate a unique barcode for a business"""
    while True:
        # Generate a 12-digit barcode (like EAN-12)
        barcode = ''.join(random.choices(string.digits, k=12))
        
        # Check if barcode already exists for this business
        existing = Product.query.filter_by(
            business_id=business_id,
            barcode=barcode
        ).first()
        
        if not existing:
            return barcode

@barcode_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_barcode():
    """
    Generate a unique barcode for a product
    """
    try:
        business_id = get_business_id()
        print(f"DEBUG: business_id = {business_id}")
        
        if not business_id:
            return jsonify({'error': 'Business ID not found'}), 400
        
        # Generate unique barcode
        barcode = generate_unique_barcode(business_id)
        print(f"DEBUG: generated barcode = {barcode}")
        
        return jsonify({
            'barcode': barcode,
            'message': 'Barcode generated successfully'
        }), 200
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in generate_barcode: {str(e)}")
        print(error_trace)
        return jsonify({'error': str(e)}), 500

@barcode_bp.route('/generate-image/<barcode>', methods=['GET'])
@jwt_required()
def generate_barcode_image(barcode):
    """
    Generate barcode image as base64
    """
    try:
        business_id = get_business_id()
        
        # Verify barcode belongs to business
        product = Product.query.filter_by(
            business_id=business_id,
            barcode=barcode
        ).first()
        
        if not product:
            return jsonify({'error': 'Barcode not found'}), 404
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(barcode)
        qr.make(fit=True)
        
        # Create QR code image
        qr_img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        qr_img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return jsonify({
            'barcode_image': f'data:image/png;base64,{img_str}',
            'barcode': barcode
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@barcode_bp.route('/print-labels', methods=['POST'])
@jwt_required()
def print_barcode_labels():
    """
    Generate printable barcode labels
    """
    try:
        business_id = get_business_id()
        data = request.get_json()
        
        print(f"DEBUG: Received data: {data}")
        
        product_ids = data.get('product_ids', [])
        label_format = data.get('format', 'standard')  # standard, small, large
        quantity = data.get('quantity', 1)
        
        print(f"DEBUG: Product IDs: {product_ids}")
        print(f"DEBUG: Format: {label_format}")
        print(f"DEBUG: Quantity: {quantity}")
        
        if not product_ids:
            return jsonify({'error': 'No products selected'}), 400
        
        # Get products
        products = Product.query.filter(
            Product.business_id == business_id,
            Product.id.in_(product_ids),
            Product.barcode.isnot(None),
            Product.barcode != ''
        ).all()
        
        print(f"DEBUG: Found {len(products)} products with barcodes")
        for product in products:
            print(f"DEBUG: Product: {product.name} - Barcode: {product.barcode}")
        
        if not products:
            return jsonify({'error': 'No products with barcodes found'}), 404
        
        # Create label sheet
        labels = []
        for product in products:
            for _ in range(quantity):
                label = create_product_label(product, label_format)
                labels.append(label)
        
        return jsonify({
            'labels': labels,
            'total': len(labels)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def create_product_label(product, format_type='standard'):
    """Create a product label with barcode and info"""
    
    # Define label sizes based on format
    sizes = {
        'small': {'width': 200, 'height': 100},
        'standard': {'width': 300, 'height': 150},
        'large': {'width': 400, 'height': 200}
    }
    
    size = sizes.get(format_type, sizes['standard'])
    
    # Create image
    img = Image.new('RGB', (size['width'], size['height']), 'white')
    draw = ImageDraw.Draw(img)
    
    # Try to load a proper font for better quality, especially on Windows
    try:
        import platform
        if platform.system() == 'Windows':
            # Common Windows font path
            font_path = "C:\\Windows\\Fonts\\arial.ttf"
            font_small = ImageFont.truetype(font_path, 12)
            font_large = ImageFont.truetype(font_path, 14)
        else:
            font_small = ImageFont.load_default()
            font_large = font_small
    except:
        font_small = ImageFont.load_default()
        font_large = font_small
    
    # Generate QR code for barcode
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=3,
        border=1,
    )
    qr.add_data(product.barcode)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    # Calculate positions
    qr_size = 60 if format_type == 'small' else 80 if format_type == 'standard' else 100
    qr_x = 10
    qr_y = 10
    
    # Paste QR code
    qr_img = qr_img.resize((qr_size, qr_size))
    img.paste(qr_img, (qr_x, qr_y))
    
    # Add product information
    text_x = qr_x + qr_size + 10
    text_y = qr_y
    
    # Product name
    name = product.name[:20] + '...' if len(product.name) > 20 else product.name
    draw.text((text_x, text_y), name, fill='black', font=font_large)
    
    # Product ID/SKU
    text_y += 25
    identifier = product.sku or product.product_id
    draw.text((text_x, text_y), f'SKU: {identifier}', fill='black', font=font_small)
    
    # Price
    text_y += 20
    # Get currency symbol from business settings or default to $
    currency_symbol = getattr(product.business, 'currency_symbol', '$') if hasattr(product, 'business') and hasattr(product.business, 'currency_symbol') else '$'
    price_text = f'Price: {currency_symbol}{float(product.unit_price):.2f}'
    draw.text((text_x, text_y), price_text, fill='black', font=font_small)
    
    # Barcode number
    text_y += 20
    draw.text((text_x, text_y), f'Code: {product.barcode}', fill='black', font=font_small)
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG', dpi=(300, 300))
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return {
        'image': f'data:image/png;base64,{img_str}',
        'product_name': product.name,
        'barcode': product.barcode,
        'sku': product.sku or product.product_id,
        'price': float(product.unit_price)
    }

@barcode_bp.route('/bulk-generate', methods=['POST'])
@jwt_required()
def bulk_generate_barcodes():
    """
    Generate barcodes for multiple products that don't have them
    """
    try:
        business_id = get_business_id()
        data = request.get_json()
        
        product_ids = data.get('product_ids', [])
        
        if not product_ids:
            # Generate for all products without barcodes
            products = Product.query.filter(
                Product.business_id == business_id,
                db.or_(
                    Product.barcode.is_(None),
                    Product.barcode == ''
                )
            ).all()
        else:
            # Generate for specific products
            products = Product.query.filter(
                Product.business_id == business_id,
                Product.id.in_(product_ids)
            ).all()
        
        generated = []
        for product in products:
            if not product.barcode:
                product.barcode = generate_unique_barcode(business_id)
                generated.append({
                    'id': product.id,
                    'name': product.name,
                    'barcode': product.barcode
                })
        
        db.session.commit()
        
        return jsonify({
            'message': f'Generated barcodes for {len(generated)} products',
            'generated': generated
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

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
