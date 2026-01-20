from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.category import Category
from app.models.order import Order, OrderItem, OrderStatus
from app.utils.decorators import staff_required
from app.utils.middleware import module_required, get_business_id, get_active_branch_id
from datetime import datetime, timedelta
from sqlalchemy import func

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
@module_required('dashboard')
def get_dashboard_stats():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        
        # Get basic stats
        cust_query = db.session.query(func.count(Customer.id)).filter(Customer.business_id == business_id)
        if branch_id:
            cust_query = cust_query.filter(Customer.branch_id == branch_id)
        total_customers = cust_query.scalar()
        
        prod_query = db.session.query(func.count(Product.id)).filter(Product.business_id == business_id, Product.is_active == True)
        if branch_id:
            prod_query = prod_query.filter(Product.branch_id == branch_id)
        total_products = prod_query.scalar()
        
        ord_query = db.session.query(func.count(Order.id)).filter(Order.business_id == business_id)
        if branch_id:
            ord_query = ord_query.filter(Order.branch_id == branch_id)
        total_orders = ord_query.scalar()
        
        # Define successful statuses
        successful_statuses = [
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.COMPLETED
        ]

        # Total Revenue
        rev_query = db.session.query(func.sum(Order.total_amount)).filter(
            Order.business_id == business_id,
            Order.status.in_(successful_statuses)
        )
        if branch_id:
            rev_query = rev_query.filter(Order.branch_id == branch_id)
        total_revenue = rev_query.scalar() or 0

        # Net Sales (Subtotal)
        ns_query = db.session.query(func.sum(Order.subtotal)).filter(
            Order.business_id == business_id,
            Order.status.in_(successful_statuses)
        )
        if branch_id:
            ns_query = ns_query.filter(Order.branch_id == branch_id)
        net_sales = ns_query.scalar() or 0

        # Total COGS
        cogs_query = db.session.query(func.sum(OrderItem.quantity * Product.cost_price)).join(
            Order, OrderItem.order_id == Order.id
        ).join(
            Product, OrderItem.product_id == Product.id
        ).filter(
            Order.business_id == business_id,
            Order.status.in_(successful_statuses)
        )
        if branch_id:
            cogs_query = cogs_query.filter(Order.branch_id == branch_id)
        total_cogs = cogs_query.scalar() or 0

        # Total Expenses
        from app.models.expense import Expense, ExpenseStatus
        exp_query = db.session.query(func.sum(Expense.amount)).filter(
            Expense.business_id == business_id,
            Expense.status == ExpenseStatus.APPROVED
        )
        if hasattr(Expense, 'branch_id') and branch_id:
            exp_query = exp_query.filter(Expense.branch_id == branch_id)
        total_expenses = exp_query.scalar() or 0

        # Total Inventory Value
        iv_query = db.session.query(func.sum(Product.stock_quantity * Product.cost_price)).filter(
            Product.business_id == business_id,
            Product.is_active == True
        )
        if branch_id:
            iv_query = iv_query.filter(Product.branch_id == branch_id)
        total_inventory_value = iv_query.scalar() or 0

        # Outstanding Invoices
        from app.models.invoice import Invoice, InvoiceStatus
        oi_query = db.session.query(func.sum(Invoice.amount_due)).filter(
            Invoice.business_id == business_id,
            Invoice.status != InvoiceStatus.PAID,
            Invoice.status != InvoiceStatus.CANCELLED
        )
        if branch_id:
            oi_query = oi_query.filter(Invoice.branch_id == branch_id)
        outstanding_invoices = oi_query.scalar() or 0

        net_profit = float(total_revenue) - float(total_cogs) - float(total_expenses)
        
        # Recent orders (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        ro_query = db.session.query(func.count(Order.id)).filter(
            Order.business_id == business_id,
            Order.created_at >= seven_days_ago
        )
        if branch_id:
            ro_query = ro_query.filter(Order.branch_id == branch_id)
        recent_orders_count = ro_query.scalar()
        
        # Orders by status
        orders_by_status = {}
        for status in OrderStatus:
            obs_query = db.session.query(func.count(Order.id)).filter(
                Order.business_id == business_id,
                Order.status == status
            )
            if branch_id:
                obs_query = obs_query.filter(Order.branch_id == branch_id)
            orders_by_status[status.value] = obs_query.scalar()
        
        # Low stock products
        ls_query = db.session.query(func.count(Product.id)).filter(
            Product.business_id == business_id,
            Product.stock_quantity <= Product.reorder_level
        )
        if branch_id:
            ls_query = ls_query.filter(Product.branch_id == branch_id)
        low_stock_count = ls_query.scalar()

        # Revenue by category
        rbc_query = db.session.query(
            Category.name,
            func.sum(OrderItem.quantity * OrderItem.unit_price)
        ).join(Product, Product.category_id == Category.id)\
         .join(OrderItem, OrderItem.product_id == Product.id)\
         .join(Order, Order.id == OrderItem.order_id)\
         .filter(
            Order.business_id == business_id,
            Order.status.in_(successful_statuses)
        )
        if branch_id:
            rbc_query = rbc_query.filter(Order.branch_id == branch_id)
        revenue_by_category = rbc_query.group_by(Category.name).all()
        
        revenue_distribution = {name: float(amount) if amount else 0.0 for name, amount in revenue_by_category}
        
        stats = {
            'total_customers': total_customers,
            'total_products': total_products,
            'total_orders': total_orders,
            'recent_orders': recent_orders_count,
            'orders_by_status': orders_by_status,
            'total_revenue': float(total_revenue),
            'total_expenses': float(total_expenses),
            'total_cogs': float(total_cogs),
            'total_inventory_value': float(total_inventory_value),
            'outstanding_invoices': float(outstanding_invoices),
            'net_profit': float(net_profit),
            'low_stock_count': low_stock_count,
            'revenue_distribution': revenue_distribution
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
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        
        # Recent orders
        ro_query = Order.query.filter_by(business_id=business_id)
        if branch_id:
            ro_query = ro_query.filter_by(branch_id=branch_id)
        recent_orders = ro_query.order_by(Order.created_at.desc()).limit(5).all()
        
        # Recent customers
        rc_query = Customer.query.filter_by(business_id=business_id)
        if branch_id:
            rc_query = rc_query.filter_by(branch_id=branch_id)
        recent_customers = rc_query.order_by(Customer.created_at.desc()).limit(5).all()
        
        # Recent expenses
        from app.models.expense import Expense
        re_query = Expense.query.filter_by(business_id=business_id)
        if hasattr(Expense, 'branch_id') and branch_id:
            re_query = re_query.filter_by(branch_id=branch_id)
        recent_expenses = re_query.order_by(Expense.created_at.desc()).limit(5).all()
        
        # Recent inventory transactions
        from app.models.inventory_transaction import InventoryTransaction
        rt_query = InventoryTransaction.query.filter_by(business_id=business_id)
        if hasattr(InventoryTransaction, 'branch_id') and branch_id:
            rt_query = rt_query.filter_by(branch_id=branch_id)
        recent_transactions = rt_query.order_by(InventoryTransaction.created_at.desc()).limit(5).all()
        
        # Recent tasks
        from app.models.task import Task
        rtask_query = Task.query.filter_by(business_id=business_id)
        if hasattr(Task, 'branch_id') and branch_id:
            rtask_query = rtask_query.filter_by(branch_id=branch_id)
        recent_tasks = rtask_query.order_by(Task.created_at.desc()).limit(5).all()
        
        activity = {
            'recent_orders': [order.to_dict() for order in recent_orders],
            'recent_customers': [customer.to_dict() for customer in recent_customers],
            'recent_expenses': [expense.to_dict() for expense in recent_expenses],
            'recent_transactions': [tx.to_dict() for tx in recent_transactions],
            'recent_tasks': [task.to_dict() for task in recent_tasks]
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
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        period = request.args.get('period', 'monthly').lower()
        
        sales_data = []
        previous_sales_data = []
        successful_statuses = [
            OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING,
            OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED
        ]
        
        if period == 'daily':
            # Current 30 days
            for i in range(29, -1, -1):
                date = datetime.utcnow().date() - timedelta(days=i)
                day_query = db.session.query(
                    func.sum(Order.total_amount).label('revenue'),
                    func.count(Order.id).label('orders')
                ).filter(
                    Order.business_id == business_id,
                    func.date(Order.created_at) == date,
                    Order.status.in_(successful_statuses)
                )
                if branch_id:
                    day_query = day_query.filter(Order.branch_id == branch_id)
                result = day_query.first()
                sales_data.append({
                    'label': date.strftime('%b %d'),
                    'revenue': float(result.revenue or 0),
                    'orders': int(result.orders or 0)
                })
            
            # Previous 30 days (for comparison)
            for i in range(59, 29, -1):
                date = datetime.utcnow().date() - timedelta(days=i)
                day_query = db.session.query(
                    func.sum(Order.total_amount).label('revenue')
                ).filter(
                    Order.business_id == business_id,
                    func.date(Order.created_at) == date,
                    Order.status.in_(successful_statuses)
                )
                if branch_id:
                    day_query = day_query.filter(Order.branch_id == branch_id)
                result = day_query.first()
                previous_sales_data.append(float(result.revenue or 0))

        elif period == 'weekly':
            # Last 12 weeks
            for i in range(11, -1, -1):
                start_date = datetime.utcnow().date() - timedelta(days=datetime.utcnow().weekday(), weeks=i)
                end_date = start_date + timedelta(days=6)
                
                week_query = db.session.query(
                    func.sum(Order.total_amount).label('revenue'),
                    func.count(Order.id).label('orders')
                ).filter(
                    Order.business_id == business_id,
                    func.date(Order.created_at) >= start_date,
                    func.date(Order.created_at) <= end_date,
                    Order.status.in_(successful_statuses)
                )
                if branch_id:
                    week_query = week_query.filter(Order.branch_id == branch_id)
                result = week_query.first()
                sales_data.append({
                    'label': f"Week {start_date.strftime('%W')}",
                    'revenue': float(result.revenue or 0),
                    'orders': int(result.orders or 0)
                })

                # Previous year same week (optional, but let's just do sequential for now)
                prev_start = start_date - timedelta(weeks=12)
                prev_end = end_date - timedelta(weeks=12)
                prev_query = db.session.query(func.sum(Order.total_amount)).filter(
                    Order.business_id == business_id,
                    func.date(Order.created_at) >= prev_start,
                    func.date(Order.created_at) <= prev_end,
                    Order.status.in_(successful_statuses)
                )
                if branch_id:
                    prev_query = prev_query.filter(Order.branch_id == branch_id)
                previous_sales_data.append(float(prev_query.scalar() or 0))
        else:
            # Last 12 months
            for i in range(11, -1, -1):
                current_date = datetime.utcnow()
                month = (current_date.month - i - 1) % 12 + 1
                year = current_date.year + (current_date.month - i - 1) // 12
                
                month_query = db.session.query(
                    func.sum(Order.total_amount).label('revenue'),
                    func.count(Order.id).label('orders')
                ).filter(
                    Order.business_id == business_id,
                    func.extract('month', Order.created_at) == month,
                    func.extract('year', Order.created_at) == year,
                    Order.status.in_(successful_statuses)
                )
                if branch_id:
                    month_query = month_query.filter(Order.branch_id == branch_id)
                result = month_query.first()
                
                month_name = datetime(year, month, 1).strftime('%b %Y')
                sales_data.append({
                    'label': month_name,
                    'revenue': float(result.revenue or 0),
                    'orders': int(result.orders or 0)
                })

                # Previous year same month
                prev_year = year - 1
                prev_query = db.session.query(func.sum(Order.total_amount)).filter(
                    Order.business_id == business_id,
                    func.extract('month', Order.created_at) == month,
                    func.extract('year', Order.created_at) == prev_year,
                    Order.status.in_(successful_statuses)
                )
                if branch_id:
                    prev_query = prev_query.filter(Order.branch_id == branch_id)
                previous_sales_data.append(float(prev_query.scalar() or 0))

        return jsonify({
            'sales_data': sales_data,
            'previous_sales_data': previous_sales_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@dashboard_bp.route('/revenue-expense-chart', methods=['GET'])
@jwt_required()
@module_required('dashboard')
def get_revenue_expense_chart():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        period = request.args.get('period', 'monthly').lower()
        
        labels = []
        revenue_data = []
        expense_data = []
        
        successful_statuses = [
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.COMPLETED
        ]
        
        from app.models.expense import Expense, ExpenseStatus
        
        if period == 'daily':
            # Last 30 days
            days_to_fetch = 30
            for i in range(days_to_fetch - 1, -1, -1):
                date = datetime.utcnow().date() - timedelta(days=i)
                labels.append(date.strftime('%b %d'))
                
                # Revenue
                rev_query = db.session.query(func.sum(Order.total_amount)).filter(
                    Order.business_id == business_id,
                    func.date(Order.created_at) == date,
                    Order.status.in_(successful_statuses)
                )
                if branch_id:
                    rev_query = rev_query.filter(Order.branch_id == branch_id)
                revenue_data.append(float(rev_query.scalar() or 0))
                
                # Expenses
                exp_query = db.session.query(func.sum(Expense.amount)).filter(
                    Expense.business_id == business_id,
                    Expense.expense_date == date,
                    Expense.status == ExpenseStatus.APPROVED
                )
                if hasattr(Expense, 'branch_id') and branch_id:
                    exp_query = exp_query.filter(Expense.branch_id == branch_id)
                expense_data.append(float(exp_query.scalar() or 0))
                
        else:
            # Last 12 months
            for i in range(11, -1, -1):
                current_date = datetime.utcnow()
                month = (current_date.month - i - 1) % 12 + 1
                year = current_date.year + (current_date.month - i - 1) // 12
                
                month_name = datetime(year, month, 1).strftime('%b %Y')
                labels.append(month_name)
                
                # Revenue
                rev_query = db.session.query(func.sum(Order.total_amount)).filter(
                    Order.business_id == business_id,
                    func.extract('month', Order.created_at) == month,
                    func.extract('year', Order.created_at) == year,
                    Order.status.in_(successful_statuses)
                )
                if branch_id:
                    rev_query = rev_query.filter(Order.branch_id == branch_id)
                revenue_data.append(float(rev_query.scalar() or 0))
                
                # Expenses
                exp_query = db.session.query(func.sum(Expense.amount)).filter(
                    Expense.business_id == business_id,
                    func.extract('month', Expense.expense_date) == month,
                    func.extract('year', Expense.expense_date) == year,
                    Expense.status == ExpenseStatus.APPROVED
                )
                if hasattr(Expense, 'branch_id') and branch_id:
                    exp_query = exp_query.filter(Expense.branch_id == branch_id)
                expense_data.append(float(exp_query.scalar() or 0))
        
        return jsonify({
            'chart_data': {
                'labels': labels,
                'revenue': revenue_data,
                'expense': expense_data
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/product-performance-chart', methods=['GET'])
@jwt_required()
@module_required('dashboard')
def get_product_performance_chart():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        period = request.args.get('period', 'monthly').lower()
        
        successful_statuses = [
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.COMPLETED
        ]
        
        # Base query
        query = db.session.query(
            Product.name,
            func.sum(OrderItem.quantity).label('total_quantity')
        ).join(OrderItem, OrderItem.product_id == Product.id)\
         .join(Order, Order.id == OrderItem.order_id)\
         .filter(
            Order.business_id == business_id,
            Order.status.in_(successful_statuses)
        )
        
        if branch_id:
            query = query.filter(Order.branch_id == branch_id)
            
        # Apply date filter
        if period == 'daily':
            # Last 30 days
            start_date = datetime.utcnow() - timedelta(days=30)
            query = query.filter(Order.created_at >= start_date)
        else:
            # Last 12 months
            start_date = datetime.utcnow() - timedelta(days=365)
            query = query.filter(Order.created_at >= start_date)
            
        # Group by product and order by quantity desc
        results = query.group_by(Product.id, Product.name)\
            .order_by(func.sum(OrderItem.quantity).desc())\
            .limit(5).all()
            
        top_products = [
            {'name': name, 'quantity': float(quantity)}
            for name, quantity in results
        ]
        
        return jsonify({
            'chart_data': {
                'top_products': top_products
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
