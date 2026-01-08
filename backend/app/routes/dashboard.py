from flask import Blueprint, jsonify, request
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
        
        # Total Revenue for this business (excluding cancelled/returned/draft)
        total_revenue = db.session.query(func.sum(Order.total_amount)).filter(
            Order.business_id == business_id,
            Order.status.in_([
                OrderStatus.PENDING,
                OrderStatus.CONFIRMED,
                OrderStatus.PROCESSING,
                OrderStatus.SHIPPED,
                OrderStatus.DELIVERED,
                OrderStatus.COMPLETED
            ])
        ).scalar() or 0
        
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
        
        # Low stock products for this business
        low_stock_count = db.session.query(func.count(Product.id)).filter(
            Product.business_id == business_id,
            Product.stock_quantity <= Product.reorder_level
        ).scalar()
        
        stats = {
            'total_customers': total_customers,
            'total_products': total_products,
            'total_orders': total_orders,
            'recent_orders': recent_orders_count,
            'orders_by_status': orders_by_status,
            'total_revenue': float(total_revenue),
            'low_stock_count': low_stock_count
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
        period = request.args.get('period', 'monthly').lower()  # Default to monthly
        
        sales_data = []
        
        # Define successful statuses for revenue calculation
        successful_statuses = [
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.COMPLETED
        ]
        
        if period == 'daily':
            # Get data for last 7 days
            for i in range(7):
                day_date = datetime.utcnow() - timedelta(days=6-i)
                start_of_day = day_date.replace(hour=0, minute=0, second=0, microsecond=0)
                end_of_day = day_date.replace(hour=23, minute=59, second=59, microsecond=999999)
                
                revenue = db.session.query(func.sum(Order.total_amount)).filter(
                    Order.business_id == business_id,
                    Order.created_at >= start_of_day,
                    Order.created_at <= end_of_day,
                    Order.status.in_(successful_statuses)
                ).scalar() or 0
                
                sales_data.append({
                    'label': day_date.strftime('%a %d'),  # e.g., Mon 15
                    'revenue': float(revenue)
                })
        elif period == 'weekly':
            # Get data for last 4 weeks
            for i in range(4):
                week_start = datetime.utcnow() - timedelta(weeks=3-i)
                week_end = week_start + timedelta(days=6)
                
                revenue = db.session.query(func.sum(Order.total_amount)).filter(
                    Order.business_id == business_id,
                    func.date(Order.created_at) >= week_start.date(),
                    func.date(Order.created_at) <= week_end.date(),
                    Order.status.in_(successful_statuses)
                ).scalar() or 0
                
                sales_data.append({
                    'label': f'Week {week_start.strftime("%U")}',  # Week number
                    'revenue': float(revenue)
                })
        else:  # monthly (default)
            # Get data for last 12 months in chronological order
            now = datetime.utcnow()
            for i in range(11, -1, -1):
                # Calculate year and month for 'i' months ago
                month = now.month - i
                year = now.year
                while month <= 0:
                    month += 12
                    year -= 1
                
                start_of_month = datetime(year, month, 1)
                if month == 12:
                    end_of_month = datetime(year + 1, 1, 1)
                else:
                    end_of_month = datetime(year, month + 1, 1)
                
                # For the current month, don't go beyond 'now'
                if i == 0:
                    end_of_month = now + timedelta(seconds=1)

                revenue = db.session.query(func.sum(Order.total_amount)).filter(
                    Order.business_id == business_id,
                    Order.created_at >= start_of_month,
                    Order.created_at < end_of_month,
                    Order.status.in_(successful_statuses)
                ).scalar() or 0
                
                sales_data.append({
                    'label': start_of_month.strftime('%b %Y'),
                    'revenue': float(revenue)
                })
        
        return jsonify({'sales_data': sales_data, 'period': period}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/revenue-expense-chart', methods=['GET'])
@jwt_required()
@module_required('dashboard')
def get_revenue_expense_chart_data():
    try:
        business_id = get_business_id()
        period = request.args.get('period', 'monthly').lower()  # Default to monthly
        
        revenue_data = []
        expense_data = []
        
        # Define successful statuses for revenue calculation
        successful_statuses = [
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.COMPLETED
        ]
        
        if period == 'daily':
            # Get data for last 7 days
            for i in range(7):
                day_date = datetime.utcnow() - timedelta(days=6-i)
                start_of_day = day_date.replace(hour=0, minute=0, second=0, microsecond=0)
                end_of_day = day_date.replace(hour=23, minute=59, second=59, microsecond=999999)
                
                revenue = db.session.query(func.sum(Order.total_amount)).filter(
                    Order.business_id == business_id,
                    Order.created_at >= start_of_day,
                    Order.created_at <= end_of_day,
                    Order.status.in_(successful_statuses)
                ).scalar() or 0
                
                from app.models.expense import Expense
                # For daily expenses, we use the day of expense_date
                expense = db.session.query(func.sum(Expense.amount)).filter(
                    Expense.business_id == business_id,
                    Expense.expense_date == day_date.date(),
                    Expense.status.in_(['APPROVED', 'PAID'])
                ).scalar() or 0
                
                revenue_data.append({
                    'label': day_date.strftime('%a %d'),  # e.g., Mon 15
                    'value': float(revenue)
                })
                
                expense_data.append({
                    'label': day_date.strftime('%a %d'),  # e.g., Mon 15
                    'value': float(expense)
                })
        elif period == 'weekly':
            # Get data for last 4 weeks
            for i in range(4):
                week_start = datetime.utcnow() - timedelta(weeks=3-i)
                week_end = week_start + timedelta(days=6)
                
                revenue = db.session.query(func.sum(Order.total_amount)).filter(
                    Order.business_id == business_id,
                    func.date(Order.created_at) >= week_start.date(),
                    func.date(Order.created_at) <= week_end.date(),
                    Order.status.in_(successful_statuses)
                ).scalar() or 0
                
                from app.models.expense import Expense
                # For weekly expenses, we use the date range
                expense = db.session.query(func.sum(Expense.amount)).filter(
                    Expense.business_id == business_id,
                    Expense.expense_date >= week_start.date(),
                    Expense.expense_date <= week_end.date(),
                    Expense.status.in_(['APPROVED', 'PAID'])
                ).scalar() or 0
                
                revenue_data.append({
                    'label': f'Week {week_start.strftime("%U")}',  # Week number
                    'value': float(revenue)
                })
                
                expense_data.append({
                    'label': f'Week {week_start.strftime("%U")}',  # Week number
                    'value': float(expense)
                })
        else:  # monthly (default)
            # Get data for last 12 months in chronological order
            now = datetime.utcnow()
            for i in range(11, -1, -1):
                # Calculate year and month for 'i' months ago
                month = now.month - i
                year = now.year
                while month <= 0:
                    month += 12
                    year -= 1
                
                start_of_month = datetime(year, month, 1)
                if month == 12:
                    end_of_month = datetime(year + 1, 1, 1)
                else:
                    end_of_month = datetime(year, month + 1, 1)
                
                # For the current month, don't go beyond 'now'
                if i == 0:
                    end_of_month = now + timedelta(seconds=1)

                revenue = db.session.query(func.sum(Order.total_amount)).filter(
                    Order.business_id == business_id,
                    Order.created_at >= start_of_month,
                    Order.created_at < end_of_month,
                    Order.status.in_(successful_statuses)
                ).scalar() or 0
                
                from app.models.expense import Expense
                expense = db.session.query(func.sum(Expense.amount)).filter(
                    Expense.business_id == business_id,
                    Expense.expense_date >= start_of_month.date(),
                    Expense.expense_date < end_of_month.date(),
                    Expense.status.in_(['APPROVED', 'PAID'])
                ).scalar() or 0
                
                revenue_data.append({
                    'label': start_of_month.strftime('%b %Y'),
                    'value': float(revenue)
                })
                
                expense_data.append({
                    'label': start_of_month.strftime('%b %Y'),
                    'value': float(expense)
                })
        
        chart_data = {
            'labels': [item['label'] for item in revenue_data],
            'revenue': [item['value'] for item in revenue_data],
            'expense': [item['value'] for item in expense_data],
            'period': period
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
        period = request.args.get('period', 'monthly').lower()  # Default to monthly
        from app.models.order import OrderItem
        from sqlalchemy import desc
        
        # Base query
        base_query = db.session.query(
            Product.id,
            Product.name,
            func.sum(OrderItem.quantity).label('total_quantity')
        ).join(OrderItem).join(Order).filter(Order.business_id == business_id)
        
        # Apply period-based filtering
        today = datetime.utcnow().date()
        if period == 'daily':
            # Get data for last 7 days
            start_date = today - timedelta(days=7)
            base_query = base_query.filter(func.date(Order.created_at) >= start_date)
        elif period == 'weekly':
            # Get data for last 4 weeks (28 days)
            start_date = today - timedelta(days=28)
            base_query = base_query.filter(func.date(Order.created_at) >= start_date)
        else:  # monthly (default)
            # Get data for last 12 months
            start_date = today - timedelta(days=365)  # Approximate
            base_query = base_query.filter(func.date(Order.created_at) >= start_date)
        
        product_sales = base_query.group_by(Product.id, Product.name).order_by(desc('total_quantity')).limit(10).all()
        
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
            'slow_products': slow_data,
            'period': period
        }
        
        return jsonify({'chart_data': chart_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500