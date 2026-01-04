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
        
        # Get basic stats
        total_customers = db.session.query(func.count(Customer.id)).scalar()
        total_products = db.session.query(func.count(Product.id)).scalar()
        total_orders = db.session.query(func.count(Order.id)).scalar()
        
        # Total Revenue
        total_revenue = db.session.query(func.sum(Order.total_amount)).scalar() or 0
        
        # Recent orders (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_orders_count = db.session.query(func.count(Order.id)).filter(
            Order.created_at >= seven_days_ago
        ).scalar()
        
        # Orders by status
        orders_by_status = {}
        for status in OrderStatus:
            count = db.session.query(func.count(Order.id)).filter(
                Order.status == status
            ).scalar()
            orders_by_status[status.value] = count
        
        stats = {
            'total_customers': total_customers,
            'total_products': total_products,
            'total_orders': total_orders,
            'recent_orders': recent_orders_count,
            'orders_by_status': orders_by_status,
            'total_revenue': float(total_revenue)
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
        sales_data = []
        
        # Generate mock data for the last 12 months
        # In a real app, this would be aggregated from the database
        for i in range(7):
            month_date = datetime.utcnow() - timedelta(days=(6-i)*30)
            
            # Try to get real revenue for this month
            start_of_month = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if i < 6:
                next_month = (start_of_month + timedelta(days=32)).replace(day=1)
            else:
                next_month = datetime.utcnow()
                
            revenue = db.session.query(func.sum(Order.total_amount)).filter(
                Order.created_at >= start_of_month,
                Order.created_at < next_month
            ).scalar() or 0
            
            sales_data.append({
                'month': month_date.strftime('%b'),
                'revenue': float(revenue)
            })
        
        return jsonify({'sales_data': sales_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/revenue-expense-chart', methods=['GET'])
@jwt_required()
@module_required('dashboard')
def get_revenue_expense_chart_data():
    try:
        # Get revenue data for the last 12 months
        revenue_data = []
        expense_data = []
        
        for i in range(12):
            month_date = datetime.utcnow() - timedelta(days=i*30)
            start_of_month = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            next_month = (start_of_month + timedelta(days=32)).replace(day=1)
            
            # Calculate revenue for this month
            revenue = db.session.query(func.sum(Order.total_amount)).filter(
                Order.created_at >= start_of_month,
                Order.created_at < next_month
            ).scalar() or 0
            
            # For expense data, we need to import the Expense model
            from app.models.expense import Expense
            expense = db.session.query(func.sum(Expense.amount)).filter(
                Expense.expense_date >= start_of_month,
                Expense.expense_date < next_month,
                Expense.status == 'APPROVED'
            ).scalar() or 0
            
            revenue_data.append({
                'month': month_date.strftime('%b'),
                'value': float(revenue)
            })
            
            expense_data.append({
                'month': month_date.strftime('%b'),
                'value': float(expense)
            })
        
        chart_data = {
            'months': [item['month'] for item in revenue_data],
            'revenue': [item['value'] for item in revenue_data],
            'expense': [item['value'] for item in expense_data]
        }
        
        return jsonify({'chart_data': chart_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/product-performance-chart', methods=['GET'])
@jwt_required()
@module_required('dashboard')
def get_product_performance_chart_data():
    try:
        # Get top selling and slow moving products
        from app.models.order_item import OrderItem
        from sqlalchemy import desc
        
        # Get product sales by quantity
        product_sales = db.session.query(
            Product.id,
            Product.name,
            func.sum(OrderItem.quantity).label('total_quantity')
        ).join(OrderItem).join(Order).group_by(Product.id, Product.name).order_by(desc('total_quantity')).limit(10).all()
        
        # Separate top and slow products
        top_products = product_sales[:5]  # Top 5 products
        slow_products = product_sales[-5:] if len(product_sales) >= 5 else product_sales  # Bottom 5 products
        
        # Prepare chart data
        top_data = []
        slow_data = []
        
        for product in top_products:
            top_data.append({
                'name': product.name,
                'quantity': int(product.total_quantity)
            })
        
        for product in slow_products:
            slow_data.append({
                'name': product.name,
                'quantity': int(product.total_quantity)
            })
        
        chart_data = {
            'top_products': top_data,
            'slow_products': slow_data
        }
        
        return jsonify({'chart_data': chart_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500