from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderStatus
from app.utils.decorators import staff_required
from app.utils.middleware import module_required
from datetime import datetime, timedelta
from sqlalchemy import func

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
@module_required('dashboard')
def get_dashboard_stats():
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # Get basic stats based on user role
        total_customers = db.session.query(func.count(Customer.id)).scalar()
        total_products = db.session.query(func.count(Product.id)).scalar()
        total_orders = db.session.query(func.count(Order.id)).scalar()
        
        # Recent orders (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_orders = db.session.query(func.count(Order.id)).filter(
            Order.created_at >= seven_days_ago
        ).scalar()
        
        # Orders by status
        orders_by_status = {}
        for status in OrderStatus:
            count = db.session.query(func.count(Order.id)).filter(
                Order.status == status
            ).scalar()
            orders_by_status[status.value] = count
        
        # For managers and admins, get additional stats
        if current_user.role in ['ADMIN', 'MANAGER']:
            # This would include financial stats, employee stats, etc.
            # For now, we'll return basic stats
            pass
        
        stats = {
            'total_customers': total_customers,
            'total_products': total_products,
            'total_orders': total_orders,
            'recent_orders': recent_orders,
            'orders_by_status': orders_by_status
        }
        
        return jsonify({'stats': stats}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/recent-activity', methods=['GET'])
@jwt_required()
@module_required('dashboard')
def get_recent_activity():
    try:
        # Get recent orders
        recent_orders = Order.query.order_by(Order.created_at.desc()).limit(5).all()
        
        # Get recent customers
        recent_customers = Customer.query.order_by(Customer.created_at.desc()).limit(5).all()
        
        activity = {
            'recent_orders': [order.to_dict() for order in recent_orders],
            'recent_customers': [customer.to_dict() for customer in recent_customers]
        }
        
        return jsonify({'activity': activity}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/sales-chart', methods=['GET'])
@jwt_required()
@module_required('dashboard')
def get_sales_chart_data():
    try:
        # Get sales data for the last 12 months
        twelve_months_ago = datetime.utcnow() - timedelta(days=365)
        
        # This is a simplified version - in a real app, you'd have sales/invoice data
        # For now, we'll return mock data structure
        sales_data = []
        
        # Generate mock data for the last 12 months
        for i in range(12):
            month_start = datetime.utcnow() - timedelta(days=i*30)
            month_end = datetime.utcnow() - timedelta(days=(i+1)*30)
            
            # Mock sales count for this month
            month_sales = {
                'month': month_start.strftime('%B %Y'),
                'date': month_start.isoformat(),
                'sales_count': 0,  # This would come from actual sales data
                'revenue': 0.0     # This would come from actual sales data
            }
            sales_data.append(month_sales)
        
        # Reverse the list to show oldest first
        sales_data.reverse()
        
        return jsonify({'sales_data': sales_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500