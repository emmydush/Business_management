from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderStatus
from app.utils.decorators import staff_required
from app.utils.middleware import module_required, get_business_id
from datetime import datetime, timedelta
from sqlalchemy import func

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
@module_required('dashboard')
def get_dashboard_stats():
    try:
        business_id = get_business_id()
        
        # Get basic stats for this business
        total_customers = db.session.query(func.count(Customer.id)).filter(Customer.business_id == business_id).scalar()
        total_products = db.session.query(func.count(Product.id)).filter(Product.business_id == business_id).scalar()
        total_orders = db.session.query(func.count(Order.id)).filter(Order.business_id == business_id).scalar()
        
        # Total Revenue for this business
        total_revenue = db.session.query(func.sum(Order.total_amount)).filter(Order.business_id == business_id).scalar() or 0
        
        # Recent orders (last 7 days) for this business
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_orders_count = db.session.query(func.count(Order.id)).filter(
            Order.business_id == business_id,
            Order.created_at >= seven_days_ago
        ).scalar()
        
        # Orders by status for this business
        orders_by_status = {}
        for status in OrderStatus:
            count = db.session.query(func.count(Order.id)).filter(
                Order.business_id == business_id,
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
        business_id = get_business_id()
        # Get recent orders for this business
        recent_orders = Order.query.filter_by(business_id=business_id).order_by(Order.created_at.desc()).limit(5).all()
        
        # Get recent customers for this business
        recent_customers = Customer.query.filter_by(business_id=business_id).order_by(Customer.created_at.desc()).limit(5).all()
        
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
        business_id = get_business_id()
        sales_data = []
        
        for i in range(7):
            month_date = datetime.utcnow() - timedelta(days=(6-i)*30)
            start_of_month = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if i < 6:
                next_month = (start_of_month + timedelta(days=32)).replace(day=1)
            else:
                next_month = datetime.utcnow()
                
            revenue = db.session.query(func.sum(Order.total_amount)).filter(
                Order.business_id == business_id,
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
        business_id = get_business_id()
        revenue_data = []
        expense_data = []
        
        for i in range(12):
            month_date = datetime.utcnow() - timedelta(days=i*30)
            start_of_month = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            next_month = (start_of_month + timedelta(days=32)).replace(day=1)
            
            revenue = db.session.query(func.sum(Order.total_amount)).filter(
                Order.business_id == business_id,
                Order.created_at >= start_of_month,
                Order.created_at < next_month
            ).scalar() or 0
            
            from app.models.expense import Expense
            expense = db.session.query(func.sum(Expense.amount)).filter(
                Expense.business_id == business_id,
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
        business_id = get_business_id()
        from app.models.order import OrderItem
        from sqlalchemy import desc
        
        product_sales = db.session.query(
            Product.id,
            Product.name,
            func.sum(OrderItem.quantity).label('total_quantity')
        ).join(OrderItem).join(Order).filter(Order.business_id == business_id).group_by(Product.id, Product.name).order_by(desc('total_quantity')).limit(10).all()
        
        top_products = product_sales[:5]
        slow_products = product_sales[-5:] if len(product_sales) >= 5 else product_sales
        
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