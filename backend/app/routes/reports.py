from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderStatus
from app.utils.decorators import staff_required, manager_required
from app.utils.middleware import module_required
from datetime import datetime, timedelta
from sqlalchemy import func

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/sales', methods=['GET'])
@jwt_required()
@module_required('reports')
def get_sales_report():
    try:
        date_from = request.args.get('date_from', '')
        date_to = request.args.get('date_to', '')
        
        # If no dates provided, default to last 30 days
        if not date_from and not date_to:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=30)
        else:
            start_date = datetime.fromisoformat(date_from) if date_from else datetime.utcnow() - timedelta(days=30)
            end_date = datetime.fromisoformat(date_to) if date_to else datetime.utcnow()
        
        # For now, we'll return mock data
        # In a real implementation, you would calculate actual sales data
        sales_report = {
            'period': {
                'from': start_date.isoformat(),
                'to': end_date.isoformat()
            },
            'total_sales': 15000.00,
            'total_orders': 25,
            'average_order_value': 600.00,
            'top_products': [
                {'name': 'Product A', 'sales': 3500.00, 'quantity': 50},
                {'name': 'Product B', 'sales': 2800.00, 'quantity': 40},
                {'name': 'Product C', 'sales': 2100.00, 'quantity': 30}
            ],
            'sales_by_category': [
                {'category': 'Electronics', 'sales': 8000.00},
                {'category': 'Clothing', 'sales': 4500.00},
                {'category': 'Home & Garden', 'sales': 2500.00}
            ]
        }
        
        return jsonify({'sales_report': sales_report}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/inventory', methods=['GET'])
@jwt_required()
@module_required('reports')
def get_inventory_report():
    try:
        low_stock_only = request.args.get('low_stock_only', 'false').lower() == 'true'
        
        # Get total products
        total_products = db.session.query(func.count(Product.id)).scalar()
        
        # Get low stock products
        low_stock_products = db.session.query(Product).filter(
            Product.stock_quantity <= Product.reorder_level
        ).all()
        
        # Get out of stock products
        out_of_stock_products = db.session.query(Product).filter(
            Product.stock_quantity == 0
        ).all()
        
        inventory_report = {
            'total_products': total_products,
            'low_stock_products': len(low_stock_products),
            'out_of_stock_products': len(out_of_stock_products),
            'low_stock_items': [product.to_dict() for product in low_stock_products],
            'out_of_stock_items': [product.to_dict() for product in out_of_stock_products]
        }
        
        return jsonify({'inventory_report': inventory_report}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/customers', methods=['GET'])
@jwt_required()
@module_required('reports')
def get_customer_report():
    try:
        # Get customer statistics
        total_customers = db.session.query(func.count(Customer.id)).scalar()
        
        # Get new customers in the last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        new_customers = db.session.query(func.count(Customer.id)).filter(
            Customer.created_at >= thirty_days_ago
        ).scalar()
        
        # Get top customers by order count
        # This would require joining with orders table in a real implementation
        top_customers = []
        
        customer_report = {
            'total_customers': total_customers,
            'new_customers_last_30_days': new_customers,
            'top_customers': top_customers
        }
        
        return jsonify({'customer_report': customer_report}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/orders', methods=['GET'])
@jwt_required()
@module_required('reports')
def get_order_report():
    try:
        # Get order statistics
        total_orders = db.session.query(func.count(Order.id)).scalar()
        
        # Orders by status
        orders_by_status = {}
        for status in OrderStatus:
            count = db.session.query(func.count(Order.id)).filter(
                Order.status == status
            ).scalar()
            orders_by_status[status.value] = count
        
        # Get orders in the last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_orders = db.session.query(func.count(Order.id)).filter(
            Order.created_at >= thirty_days_ago
        ).scalar()
        
        order_report = {
            'total_orders': total_orders,
            'recent_orders': recent_orders,
            'orders_by_status': orders_by_status
        }
        
        return jsonify({'order_report': order_report}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/financial', methods=['GET'])
@jwt_required()
@module_required('reports')
def get_financial_report():
    try:
        date_from = request.args.get('date_from', '')
        date_to = request.args.get('date_to', '')
        
        # If no dates provided, default to current month
        if not date_from and not date_to:
            end_date = datetime.utcnow()
            start_date = end_date.replace(day=1)
        else:
            start_date = datetime.fromisoformat(date_from) if date_from else datetime.utcnow().replace(day=1)
            end_date = datetime.fromisoformat(date_to) if date_to else datetime.utcnow()
        
        # For now, we'll return mock financial data
        # In a real implementation, you would calculate actual financial data
        financial_report = {
            'period': {
                'from': start_date.isoformat(),
                'to': end_date.isoformat()
            },
            'total_revenue': 25000.00,
            'total_expenses': 10000.00,
            'net_profit': 15000.00,
            'gross_profit_margin': 60.0,
            'top_expense_categories': [
                {'category': 'Office Supplies', 'amount': 2500.00},
                {'category': 'Travel', 'amount': 2000.00},
                {'category': 'Utilities', 'amount': 1800.00}
            ]
        }
        
        return jsonify({'financial_report': financial_report}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/summary', methods=['GET'])
@jwt_required()
@module_required('reports')
def get_business_summary():
    try:
        # Get overall business metrics
        total_customers = db.session.query(func.count(Customer.id)).scalar()
        total_products = db.session.query(func.count(Product.id)).scalar()
        total_orders = db.session.query(func.count(Order.id)).scalar()
        total_revenue = 0  # This would be calculated from completed orders
        
        # Get recent activity
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_orders = db.session.query(func.count(Order.id)).filter(
            Order.created_at >= seven_days_ago
        ).scalar()
        
        summary = {
            'total_customers': total_customers,
            'total_products': total_products,
            'total_orders': total_orders,
            'recent_orders': recent_orders,
            'total_revenue': total_revenue,
            'top_performing_products': [],
            'recent_activity': []
        }
        
        return jsonify({'summary': summary}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/export/<report_type>', methods=['GET'])
@jwt_required()
@module_required('reports')
def export_report(report_type):
    try:
        # This would handle report export functionality
        # In a real implementation, you would generate and return a file
        # (PDF, Excel, etc.) based on the report type
        
        return jsonify({
            'message': f'{report_type} report export initiated',
            'report_type': report_type
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500