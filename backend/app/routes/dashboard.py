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
from sqlalchemy import func, text

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
@module_required('dashboard')
def get_dashboard_stats():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        period = request.args.get('period', 'daily').lower()
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        # Parse date range if provided
        if start_date_str and end_date_str:
            try:
                current_start = datetime.strptime(start_date_str, '%Y-%m-%d')
                current_end = datetime.strptime(end_date_str, '%Y-%m-%d') + timedelta(days=1)  # End of day
                # For previous period, shift back by the same duration
                duration = current_end - current_start
                previous_end = current_start
                previous_start = current_start - duration
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        else:
            # Define date ranges based on period
            now = datetime.utcnow()
            if period == 'daily':
                # Current: last 30 days, Previous: 30-60 days ago
                current_start = now - timedelta(days=30)
                previous_end = current_start
                previous_start = now - timedelta(days=60)
            elif period == 'monthly':
                # Current: last 12 months, Previous: 13-24 months ago
                current_start = now - timedelta(days=365)
                previous_end = current_start
                previous_start = now - timedelta(days=730)
            else: # yearly
                # Current: last 5 years, Previous: 5-10 years ago
                current_start = now - timedelta(days=365*5)
                previous_end = current_start
                previous_start = now - timedelta(days=365*10)

        # Define successful statuses
        successful_statuses = [
            OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING,
            OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED
        ]

        def get_metrics(start_date, end_date=None):
            # Revenue
            rev_q = db.session.query(func.sum(Order.total_amount)).filter(
                Order.business_id == business_id,
                Order.status.in_(successful_statuses),
                Order.created_at >= start_date
            )
            if end_date: rev_q = rev_q.filter(Order.created_at < end_date)
            if branch_id: rev_q = rev_q.filter(Order.branch_id == branch_id)
            rev = float(rev_q.scalar() or 0)

            # COGS
            cogs_q = db.session.query(func.sum(OrderItem.quantity * Product.cost_price)).join(
                Order, OrderItem.order_id == Order.id
            ).join(
                Product, OrderItem.product_id == Product.id
            ).filter(
                Order.business_id == business_id,
                Order.status.in_(successful_statuses),
                Order.created_at >= start_date
            )
            if end_date: cogs_q = cogs_q.filter(Order.created_at < end_date)
            if branch_id: cogs_q = cogs_q.filter(Order.branch_id == branch_id)
            cogs = float(cogs_q.scalar() or 0)

            # Expenses
            from app.models.expense import Expense, ExpenseStatus
            exp_q = db.session.query(func.sum(Expense.amount)).filter(
                Expense.business_id == business_id,
                Expense.status == ExpenseStatus.APPROVED,
                Expense.expense_date >= start_date.date()
            )
            if end_date: exp_q = exp_q.filter(Expense.expense_date < end_date.date())
            if hasattr(Expense, 'branch_id') and branch_id:
                exp_q = exp_q.filter(Expense.branch_id == branch_id)
            exp = float(exp_q.scalar() or 0)

            profit = rev - cogs - exp
            return {'revenue': rev, 'cogs': cogs, 'expenses': exp, 'profit': profit}

        current_metrics = get_metrics(current_start)
        previous_metrics = get_metrics(previous_start, previous_end)

        def calc_change(curr, prev):
            if prev == 0: return 100 if curr > 0 else 0
            return round(((curr - prev) / prev) * 100, 1)

        # Basic stats (totals)
        total_customers = db.session.query(func.count(Customer.id)).filter(Customer.business_id == business_id).scalar()
        total_products = db.session.query(func.count(Product.id)).filter(Product.business_id == business_id, Product.is_active == True).scalar()
        total_orders = db.session.query(func.count(Order.id)).filter(Order.business_id == business_id).scalar()
        
        # Inventory Value
        total_inventory_value = db.session.query(func.sum(Product.stock_quantity * Product.cost_price)).filter(
            Product.business_id == business_id, Product.is_active == True
        ).scalar() or 0

        # Outstanding Invoices
        from app.models.invoice import Invoice, InvoiceStatus
        outstanding_invoices = db.session.query(func.sum(Invoice.amount_due)).filter(
            Invoice.business_id == business_id,
            Invoice.status != InvoiceStatus.PAID,
            Invoice.status != InvoiceStatus.CANCELLED
        ).scalar() or 0

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
        if branch_id: rbc_query = rbc_query.filter(Order.branch_id == branch_id)
        revenue_by_category = rbc_query.group_by(Category.name).all()
        revenue_distribution = {name: float(amount) if amount else 0.0 for name, amount in revenue_by_category}

        # Calculate margin change with division by zero protection
        current_margin = round(((current_metrics['revenue'] - current_metrics['cogs']) / current_metrics['revenue'] * 100), 1) if current_metrics['revenue'] > 0 else 0
        previous_margin = round(((previous_metrics['revenue'] - previous_metrics['cogs']) / previous_metrics['revenue'] * 100), 1) if previous_metrics['revenue'] > 0 else 0
        margin_change = round(current_margin - previous_margin, 1)

        # Calculate inventory progress (relative to a dynamic scale, e.g., 5M for now or based on business size)
        inventory_progress = min(100, round((float(total_inventory_value) / 5000000) * 100, 1)) if total_inventory_value else 0
        
        # Calculate invoice progress (relative to total revenue)
        invoice_progress = min(100, round((float(outstanding_invoices) / current_metrics['revenue'] * 100), 1)) if current_metrics['revenue'] > 0 else 0

        stats = {
            'total_customers': total_customers,
            'total_products': total_products,
            'total_orders': total_orders,
            'total_revenue': current_metrics['revenue'],
            'total_expenses': current_metrics['expenses'],
            'total_cogs': current_metrics['cogs'],
            'net_profit': current_metrics['profit'],
            'total_inventory_value': float(total_inventory_value),
            'outstanding_invoices': float(outstanding_invoices),
            'revenue_distribution': revenue_distribution,
            'changes': {
                'revenue': calc_change(current_metrics['revenue'], previous_metrics['revenue']),
                'profit': calc_change(current_metrics['profit'], previous_metrics['profit']),
                'expenses': calc_change(current_metrics['expenses'], previous_metrics['expenses']),
                'margin': margin_change,
                'inventory': calc_change(float(total_inventory_value), float(total_inventory_value) * 0.9) if total_inventory_value else 0.0,
                'invoices': calc_change(float(outstanding_invoices), float(outstanding_invoices) * 1.1) if outstanding_invoices else 0.0
            },
            'progress': {
                'revenue': min(100, round((current_metrics['revenue'] / 1000000) * 100, 1)) if current_metrics['revenue'] > 0 else 0,
                'profit': min(100, round((current_metrics['profit'] / 500000) * 100, 1)) if current_metrics['profit'] > 0 else 0,
                'expenses': min(100, round((current_metrics['expenses'] / current_metrics['revenue'] * 100), 1)) if current_metrics['revenue'] > 0 else 0,
                'margin': current_margin,
                'inventory': inventory_progress,
                'invoices': invoice_progress
            }
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
        period = request.args.get('period', 'daily').lower()
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        sales_data = []
        previous_sales_data = []
        successful_statuses = [
            OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING,
            OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED
        ]
        
        if start_date_str and end_date_str:
            # Use provided date range
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                
                # Generate data for each day in the range
                current_date = start_date
                while current_date <= end_date:
                    day_query = db.session.query(
                        func.sum(Order.total_amount).label('revenue'),
                        func.count(Order.id).label('orders')
                    ).filter(
                        Order.business_id == business_id,
                        func.date(Order.created_at) == current_date,
                        Order.status.in_(successful_statuses)
                    )
                    if branch_id:
                        day_query = day_query.filter(Order.branch_id == branch_id)
                    result = day_query.first()
                    sales_data.append({
                        'label': current_date.strftime('%b %d'),
                        'revenue': float(result.revenue or 0),
                        'orders': int(result.orders or 0)
                    })
                    current_date += timedelta(days=1)
                
                # For previous period comparison, shift back by the same duration
                duration = (end_date - start_date).days + 1
                prev_start = start_date - timedelta(days=duration)
                prev_end = end_date - timedelta(days=duration)
                
                current_date = prev_start
                while current_date <= prev_end:
                    day_query = db.session.query(
                        func.sum(Order.total_amount).label('revenue')
                    ).filter(
                        Order.business_id == business_id,
                        func.date(Order.created_at) == current_date,
                        Order.status.in_(successful_statuses)
                    )
                    if branch_id:
                        day_query = day_query.filter(Order.branch_id == branch_id)
                    result = day_query.first()
                    previous_sales_data.append(float(result.revenue or 0))
                    current_date += timedelta(days=1)
                    
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        elif period == 'daily':
            # Current 30 days (fallback when no specific dates provided)
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

        elif period == 'monthly':
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
        else:
            # Last 5 years
            for i in range(4, -1, -1):
                year = datetime.utcnow().year - i
                
                year_query = db.session.query(
                    func.sum(Order.total_amount).label('revenue'),
                    func.count(Order.id).label('orders')
                ).filter(
                    Order.business_id == business_id,
                    func.extract('year', Order.created_at) == year,
                    Order.status.in_(successful_statuses)
                )
                if branch_id:
                    year_query = year_query.filter(Order.branch_id == branch_id)
                result = year_query.first()
                
                sales_data.append({
                    'label': str(year),
                    'revenue': float(result.revenue or 0),
                    'orders': int(result.orders or 0)
                })

                # Previous 5 years comparison (just 0 for now or same year - 5)
                prev_year = year - 5
                prev_query = db.session.query(func.sum(Order.total_amount)).filter(
                    Order.business_id == business_id,
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
        period = request.args.get('period', 'daily').lower()
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
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
        
        if start_date_str and end_date_str:
            # Use provided date range
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                
                # Generate data for each day in the range
                current_date = start_date
                while current_date <= end_date:
                    labels.append(current_date.strftime('%b %d'))
                    
                    # Revenue
                    rev_query = db.session.query(func.sum(Order.total_amount)).filter(
                        Order.business_id == business_id,
                        func.date(Order.created_at) == current_date,
                        Order.status.in_(successful_statuses)
                    )
                    if branch_id:
                        rev_query = rev_query.filter(Order.branch_id == branch_id)
                    revenue_data.append(float(rev_query.scalar() or 0))
                    
                    # Expenses
                    exp_query = db.session.query(func.sum(Expense.amount)).filter(
                        Expense.business_id == business_id,
                        Expense.expense_date == current_date,
                        Expense.status == ExpenseStatus.APPROVED
                    )
                    if hasattr(Expense, 'branch_id') and branch_id:
                        exp_query = exp_query.filter(Expense.branch_id == branch_id)
                    expense_data.append(float(exp_query.scalar() or 0))
                    
                    current_date += timedelta(days=1)
                    
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        elif period == 'daily':
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
                
        elif period == 'monthly':
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
        else:
            # Last 5 years
            for i in range(4, -1, -1):
                year = datetime.utcnow().year - i
                labels.append(str(year))
                
                # Revenue
                rev_query = db.session.query(func.sum(Order.total_amount)).filter(
                    Order.business_id == business_id,
                    func.extract('year', Order.created_at) == year,
                    Order.status.in_(successful_statuses)
                )
                if branch_id:
                    rev_query = rev_query.filter(Order.branch_id == branch_id)
                revenue_data.append(float(rev_query.scalar() or 0))
                
                # Expenses
                exp_query = db.session.query(func.sum(Expense.amount)).filter(
                    Expense.business_id == business_id,
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
        period = request.args.get('period', 'daily').lower()
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        successful_statuses = [
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.COMPLETED
        ]
        
        # Base query for sales quantity
        base_query = db.session.query(
            Product.name,
            func.sum(OrderItem.quantity).label('total_quantity')
        ).join(OrderItem, OrderItem.product_id == Product.id)\
         .join(Order, Order.id == OrderItem.order_id)\
         .filter(
            Order.business_id == business_id,
            Order.status.in_(successful_statuses)
        )
        
        if branch_id:
            base_query = base_query.filter(Order.branch_id == branch_id)
            
        # Apply date filter
        if start_date_str and end_date_str:
            # Use provided date range
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d') + timedelta(days=1)  # End of day
                base_query = base_query.filter(Order.created_at >= start_date, Order.created_at < end_date)
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        elif period == 'daily':
            start_date = datetime.utcnow() - timedelta(days=30)
            base_query = base_query.filter(Order.created_at >= start_date)
        else:
            start_date = datetime.utcnow() - timedelta(days=365)
            base_query = base_query.filter(Order.created_at >= start_date)
            
        # Fast Moving (Top 5)
        fast_results = base_query.group_by(Product.id, Product.name)\
            .order_by(func.sum(OrderItem.quantity).desc())\
            .limit(5).all()
            
        # Slow Moving (Bottom 5 - only including products that have at least 1 sale)
        slow_results = base_query.group_by(Product.id, Product.name)\
            .order_by(func.sum(OrderItem.quantity).asc())\
            .limit(5).all()
            
        return jsonify({
            'chart_data': {
                'fast_products': [{'name': name, 'quantity': float(quantity)} for name, quantity in fast_results],
                'slow_products': [{'name': name, 'quantity': float(quantity)} for name, quantity in slow_results]
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
