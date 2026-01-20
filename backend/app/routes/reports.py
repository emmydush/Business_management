from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderStatus, OrderItem
from app.models.category import Category
from app.models.expense import Expense, ExpenseStatus, ExpenseCategory
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.models.leave_request import LeaveRequest, LeaveStatus
# Department model does not exist - departments are stored as string field in employee table
from sqlalchemy import text
from app.utils.decorators import staff_required, manager_required
from app.utils.middleware import module_required, get_business_id, get_active_branch_id
from datetime import datetime, timedelta, date
from sqlalchemy import func, desc

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/sales', methods=['GET'])
@jwt_required()
@module_required('reports')
def get_sales_report():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        date_from = request.args.get('date_from', '')
        date_to = request.args.get('date_to', '')
        
        if not date_from and not date_to:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=30)
        else:
            try:
                start_date = datetime.fromisoformat(date_from) if date_from else datetime.utcnow() - timedelta(days=30)
                end_date = datetime.fromisoformat(date_to) if date_to else datetime.utcnow()
            except ValueError:
                start_date = datetime.utcnow() - timedelta(days=30)
                end_date = datetime.utcnow()
        
        # Define successful statuses
        successful_statuses = [
            OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING,
            OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED
        ]

        # Calculate actual sales data
        total_sales_query = db.session.query(func.sum(Order.total_amount)).filter(
            Order.business_id == business_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date,
            Order.status.in_(successful_statuses)
        )
        if branch_id:
            total_sales_query = total_sales_query.filter(Order.branch_id == branch_id)
        total_sales_result = total_sales_query.scalar()
        total_sales = float(total_sales_result) if total_sales_result is not None else 0.0
        
        total_orders_query = db.session.query(func.count(Order.id)).filter(
            Order.business_id == business_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date,
            Order.status.in_(successful_statuses)
        )
        if branch_id:
            total_orders_query = total_orders_query.filter(Order.branch_id == branch_id)
        total_orders = total_orders_query.scalar() or 0
        
        avg_order_value = total_sales / total_orders if total_orders > 0 else 0.0
        
        # Top Selling Products
        top_products_query = db.session.query(
            Product.name,
            Category.name.label('category_name'),
            func.count(Order.id).label('orders_count'),
            func.sum(OrderItem.line_total).label('revenue'),
            func.sum(OrderItem.quantity * Product.cost_price).label('cost')
        ).join(OrderItem, Product.id == OrderItem.product_id)\
         .join(Order, OrderItem.order_id == Order.id)\
         .outerjoin(Category, Product.category_id == Category.id)\
         .filter(
            Order.business_id == business_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date,
            Order.status.in_(successful_statuses)
        )
        if branch_id:
            top_products_query = top_products_query.filter(Order.branch_id == branch_id)
        top_products_query = top_products_query.group_by(Product.id, Product.name, Category.name)\
         .order_by(desc('revenue'))\
         .limit(5).all()

        top_products = []
        for p in top_products_query:
            revenue = float(p.revenue or 0)
            cost = float(p.cost or 0)
            top_products.append({
                'name': p.name,
                'category': p.category_name or 'Uncategorized',
                'orders': p.orders_count,
                'revenue': revenue,
                'cost': cost,
                'profit': revenue - cost,
                'trend': 0 
            })

        # Sales by Category
        sales_by_cat_query = db.session.query(
            Category.name,
            func.sum(OrderItem.line_total).label('revenue'),
            func.sum(OrderItem.quantity * Product.cost_price).label('cost')
        ).join(Product, Category.id == Product.category_id)\
         .join(OrderItem, Product.id == OrderItem.product_id)\
         .join(Order, OrderItem.order_id == Order.id)\
         .filter(
            Order.business_id == business_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date,
            Order.status.in_(successful_statuses)
        )
        if branch_id:
            sales_by_cat_query = sales_by_cat_query.filter(Order.branch_id == branch_id)
        sales_by_cat_query = sales_by_cat_query.group_by(Category.name).all()

        sales_by_category = []
        for cat in sales_by_cat_query:
            cat_revenue = float(cat.revenue or 0)
            cat_cost = float(cat.cost or 0)
            percentage = (cat_revenue / total_sales * 100) if total_sales > 0 else 0
            sales_by_category.append({
                'category': cat.name,
                'revenue': cat_revenue,
                'cost': cat_cost,
                'profit': cat_revenue - cat_cost,
                'percentage': round(percentage, 1)
            })

        # New Customers (business-wide)
        new_customers = db.session.query(func.count(Customer.id)).filter(
            Customer.business_id == business_id,
            Customer.created_at >= start_date,
            Customer.created_at <= end_date
        ).scalar() or 0

        # Sales Trend
        sales_trend = []
        delta = end_date - start_date
        if delta.days <= 31:
            for i in range(delta.days + 1):
                d = start_date.date() + timedelta(days=i)
                trend_query = db.session.query(
                    func.sum(Order.total_amount).label('revenue'),
                    func.count(Order.id).label('orders')
                ).filter(
                    Order.business_id == business_id,
                    func.date(Order.created_at) == d,
                    Order.status.in_(successful_statuses)
                )
                if branch_id:
                    trend_query = trend_query.filter(Order.branch_id == branch_id)
                result = trend_query.first()
                sales_trend.append({
                    'period': d.strftime('%b %d'),
                    'revenue': float(result.revenue or 0),
                    'orders': int(result.orders or 0)
                })
        else:
            curr = start_date
            while curr <= end_date:
                m = curr.month
                y = curr.year
                trend_query = db.session.query(
                    func.sum(Order.total_amount).label('revenue'),
                    func.count(Order.id).label('orders')
                ).filter(
                    Order.business_id == business_id,
                    func.extract('month', Order.created_at) == m,
                    func.extract('year', Order.created_at) == y,
                    Order.status.in_(successful_statuses)
                )
                if branch_id:
                    trend_query = trend_query.filter(Order.branch_id == branch_id)
                result = trend_query.first()
                sales_trend.append({
                    'period': curr.strftime('%b %Y'),
                    'revenue': float(result.revenue or 0),
                    'orders': int(result.orders or 0)
                })
                if curr.month == 12:
                    curr = curr.replace(year=curr.year + 1, month=1)
                else:
                    curr = curr.replace(month=curr.month + 1)

        # Previous Period Trend
        previous_sales_trend = []
        prev_delta = end_date - start_date
        prev_start_date = start_date - prev_delta
        prev_end_date = start_date - timedelta(seconds=1)

        if prev_delta.days <= 31:
            for i in range(prev_delta.days + 1):
                d = prev_start_date.date() + timedelta(days=i)
                trend_query = db.session.query(func.sum(Order.total_amount)).filter(
                    Order.business_id == business_id,
                    func.date(Order.created_at) == d,
                    Order.status.in_(successful_statuses)
                )
                if branch_id:
                    trend_query = trend_query.filter(Order.branch_id == branch_id)
                previous_sales_trend.append(float(trend_query.scalar() or 0))
        else:
            curr = prev_start_date
            while curr <= prev_end_date:
                m = curr.month
                y = curr.year
                trend_query = db.session.query(func.sum(Order.total_amount)).filter(
                    Order.business_id == business_id,
                    func.extract('month', Order.created_at) == m,
                    func.extract('year', Order.created_at) == y,
                    Order.status.in_(successful_statuses)
                )
                if branch_id:
                    trend_query = trend_query.filter(Order.branch_id == branch_id)
                previous_sales_trend.append(float(trend_query.scalar() or 0))
                
                if curr.month == 12:
                    curr = curr.replace(year=curr.year + 1, month=1)
                else:
                    curr = curr.replace(month=curr.month + 1)

        # Sales by Day of Week
        sales_by_day = []
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        for i, day_name in enumerate(days):
            day_query = db.session.query(
                func.sum(Order.total_amount).label('revenue'),
                func.count(Order.id).label('orders')
            ).filter(
                Order.business_id == business_id,
                Order.created_at >= start_date,
                Order.created_at <= end_date,
                Order.status.in_(successful_statuses),
                func.extract('dow', Order.created_at) == (i + 1) % 7
            )
            if branch_id:
                day_query = day_query.filter(Order.branch_id == branch_id)
            result = day_query.first()
            sales_by_day.append({
                'day': day_name,
                'revenue': float(result.revenue or 0),
                'orders': int(result.orders or 0)
            })

        sales_report = {
            'period': {
                'from': start_date.isoformat(),
                'to': end_date.isoformat()
            },
            'total_sales': float(total_sales),
            'total_orders': total_orders,
            'new_customers': new_customers,
            'average_order_value': float(avg_order_value),
            'top_products': top_products,
            'sales_by_category': sales_by_category,
            'sales_trend': sales_trend,
            'previous_sales_trend': previous_sales_trend,
            'sales_by_day': sales_by_day
        }
        
        return jsonify({'sales_report': sales_report}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/inventory', methods=['GET'])
@jwt_required()
@module_required('reports')
def get_inventory_report():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        
        # Get stats
        tp_query = db.session.query(func.count(Product.id)).filter(Product.business_id == business_id)
        if branch_id:
            tp_query = tp_query.filter(Product.branch_id == branch_id)
        total_products = tp_query.scalar()
        
        ls_query = Product.query.filter(
            Product.business_id == business_id,
            Product.stock_quantity <= Product.reorder_level
        )
        if branch_id:
            ls_query = ls_query.filter(Product.branch_id == branch_id)
        low_stock_products = ls_query.all()
        
        oos_query = Product.query.filter(
            Product.business_id == business_id,
            Product.stock_quantity == 0
        )
        if branch_id:
            oos_query = oos_query.filter(Product.branch_id == branch_id)
        out_of_stock_products = oos_query.all()
        
        # Inventory Value
        iv_query = db.session.query(func.sum(Product.stock_quantity * Product.cost_price)).filter(
            Product.business_id == business_id
        )
        if branch_id:
            iv_query = iv_query.filter(Product.branch_id == branch_id)
        inventory_value_result = iv_query.scalar()
        inventory_value = float(inventory_value_result) if inventory_value_result is not None else 0.0
        
        # Category Distribution
        cd_query = db.session.query(
            Category.name,
            func.count(Product.id).label('count')
        ).join(Product).filter(Product.business_id == business_id)
        if branch_id:
            cd_query = cd_query.filter(Product.branch_id == branch_id)
        category_distribution = cd_query.group_by(Category.name).all()
        
        cat_dist = []
        for cat in category_distribution:
            cat_dist.append({
                'category': cat.name,
                'count': cat.count,
                'percentage': round((cat.count / total_products * 100), 1) if total_products > 0 else 0
            })
            
        inventory_report = {
            'total_products': total_products,
            'low_stock_products': len(low_stock_products),
            'out_of_stock_products': len(out_of_stock_products),
            'inventory_value': float(inventory_value),
            'category_distribution': cat_dist,
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
        business_id = get_business_id()
        # Customers are business-wide
        total_customers = db.session.query(func.count(Customer.id)).filter(Customer.business_id == business_id).scalar()
        
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        new_customers = db.session.query(func.count(Customer.id)).filter(
            Customer.business_id == business_id,
            Customer.created_at >= thirty_days_ago
        ).scalar()
        
        customer_report = {
            'total_customers': total_customers,
            'new_customers_last_30_days': new_customers,
            'top_customers': []
        }
        
        return jsonify({'customer_report': customer_report}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/orders', methods=['GET'])
@jwt_required()
@module_required('reports')
def get_order_report():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        
        to_query = db.session.query(func.count(Order.id)).filter(Order.business_id == business_id)
        if branch_id:
            to_query = to_query.filter(Order.branch_id == branch_id)
        total_orders = to_query.scalar()
        
        orders_by_status = {}
        for status in OrderStatus:
            obs_query = db.session.query(func.count(Order.id)).filter(
                Order.business_id == business_id,
                Order.status == status
            )
            if branch_id:
                obs_query = obs_query.filter(Order.branch_id == branch_id)
            orders_by_status[status.value] = obs_query.scalar()
        
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        ro_query = db.session.query(func.count(Order.id)).filter(
            Order.business_id == business_id,
            Order.created_at >= thirty_days_ago
        )
        if branch_id:
            ro_query = ro_query.filter(Order.branch_id == branch_id)
        recent_orders = ro_query.scalar()
        
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
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        date_from = request.args.get('date_from', '')
        date_to = request.args.get('date_to', '')
        
        if not date_from and not date_to:
            end_date = datetime.utcnow()
            start_date = end_date.replace(day=1)
        else:
            start_date = datetime.fromisoformat(date_from) if date_from else datetime.utcnow().replace(day=1)
            end_date = datetime.fromisoformat(date_to) if date_to else datetime.utcnow()
        
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
        tr_query = db.session.query(func.sum(Order.total_amount)).filter(
            Order.business_id == business_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date,
            Order.status.in_(successful_statuses)
        )
        if branch_id:
            tr_query = tr_query.filter(Order.branch_id == branch_id)
        total_revenue_result = tr_query.scalar()
        total_revenue = float(total_revenue_result) if total_revenue_result is not None else 0.0

        # Net Sales
        ns_query = db.session.query(func.sum(Order.subtotal)).filter(
            Order.business_id == business_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date,
            Order.status.in_(successful_statuses)
        )
        if branch_id:
            ns_query = ns_query.filter(Order.branch_id == branch_id)
        net_sales_result = ns_query.scalar()
        net_sales = float(net_sales_result) if net_sales_result is not None else 0.0

        # Calculate COGS
        cogs_query = db.session.query(func.sum(OrderItem.quantity * Product.cost_price)).join(
            Order, OrderItem.order_id == Order.id
        ).join(
            Product, OrderItem.product_id == Product.id
        ).filter(
            Order.business_id == business_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date,
            Order.status.in_(successful_statuses)
        )
        if branch_id:
            cogs_query = cogs_query.filter(Order.branch_id == branch_id)
        total_cogs_result = cogs_query.scalar()
        total_cogs = float(total_cogs_result) if total_cogs_result is not None else 0.0
        
        exp_query = db.session.query(func.sum(Expense.amount)).filter(
            Expense.business_id == business_id,
            Expense.expense_date >= start_date,
            Expense.expense_date <= end_date,
            Expense.status == ExpenseStatus.APPROVED
        )
        if hasattr(Expense, 'branch_id') and branch_id:
            exp_query = exp_query.filter(Expense.branch_id == branch_id)
        total_expenses_result = exp_query.scalar()
        total_expenses = float(total_expenses_result) if total_expenses_result is not None else 0.0
        
        # Top Expense Categories
        tec_query = db.session.query(
            Expense.category,
            func.sum(Expense.amount).label('total_amount')
        ).filter(
            Expense.business_id == business_id,
            Expense.expense_date >= start_date,
            Expense.expense_date <= end_date,
            Expense.status == ExpenseStatus.APPROVED
        )
        if hasattr(Expense, 'branch_id') and branch_id:
            tec_query = tec_query.filter(Expense.branch_id == branch_id)
        top_expense_categories_query = tec_query.group_by(Expense.category).order_by(desc('total_amount')).limit(5).all()
        
        top_expense_categories = []
        for cat in top_expense_categories_query:
            top_expense_categories.append({
                'category': cat.category.value if hasattr(cat.category, 'value') else str(cat.category),
                'amount': float(cat.total_amount)
            })
            
        gross_profit = net_sales - total_cogs
        net_profit = gross_profit - total_expenses
        
        financial_report = {
            'period': {
                'from': start_date.isoformat(),
                'to': end_date.isoformat()
            },
            'total_revenue': total_revenue,
            'net_sales': net_sales,
            'total_cogs': total_cogs,
            'gross_profit': gross_profit,
            'total_expenses': total_expenses,
            'net_profit': net_profit,
            'gross_profit_margin': round((gross_profit / net_sales * 100), 1) if net_sales > 0 else 0.0,
            'net_profit_margin': round((net_profit / net_sales * 100), 1) if net_sales > 0 else 0.0,
            'top_expense_categories': top_expense_categories
        }
        
        return jsonify({'financial_report': financial_report}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/summary', methods=['GET'])
@jwt_required()
@module_required('reports')
def get_business_summary():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        
        total_customers = db.session.query(func.count(Customer.id)).filter(Customer.business_id == business_id).scalar()
        
        tp_query = db.session.query(func.count(Product.id)).filter(Product.business_id == business_id)
        if branch_id:
            tp_query = tp_query.filter(Product.branch_id == branch_id)
        total_products = tp_query.scalar()
        
        to_query = db.session.query(func.count(Order.id)).filter(Order.business_id == business_id)
        if branch_id:
            to_query = to_query.filter(Order.branch_id == branch_id)
        total_orders = to_query.scalar()
        
        tr_query = db.session.query(func.sum(Order.total_amount)).filter(
            Order.business_id == business_id,
            Order.status.in_([
                OrderStatus.PENDING,
                OrderStatus.CONFIRMED,
                OrderStatus.PROCESSING,
                OrderStatus.SHIPPED,
                OrderStatus.DELIVERED,
                OrderStatus.COMPLETED
            ])
        )
        if branch_id:
            tr_query = tr_query.filter(Order.branch_id == branch_id)
        total_revenue_result = tr_query.scalar()
        total_revenue = float(total_revenue_result) if total_revenue_result is not None else 0.0
        
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        ro_query = db.session.query(func.count(Order.id)).filter(
            Order.business_id == business_id,
            Order.created_at >= seven_days_ago
        )
        if branch_id:
            ro_query = ro_query.filter(Order.branch_id == branch_id)
        recent_orders = ro_query.scalar()
        
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
        business_id = get_business_id()
        valid_types = ['sales', 'inventory', 'customers', 'orders', 'financial', 'hr', 'expenses', 'products', 'employees', 'payroll', 'purchases', 'suppliers']
        if report_type.lower() not in valid_types:
            return jsonify({'error': f'Invalid report type. Valid types: {", ".join(valid_types)}'}), 400
        
        return jsonify({
            'message': f'{report_type} report export initiated for business {business_id}',
            'report_type': report_type
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/hr', methods=['GET'])
@jwt_required()
@module_required('reports')
def get_hr_report():
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        
        te_query = db.session.query(func.count(Employee.id)).filter(Employee.business_id == business_id)
        if branch_id:
            te_query = te_query.filter(Employee.branch_id == branch_id)
        total_employees = te_query.scalar()
        
        ae_query = db.session.query(func.count(Employee.id)).filter(
            Employee.business_id == business_id,
            Employee.is_active == True
        )
        if branch_id:
            ae_query = ae_query.filter(Employee.branch_id == branch_id)
        active_employees = ae_query.scalar()
        
        today_date = date.today()
        pt_query = db.session.query(func.count(Attendance.id)).join(Employee).filter(
            Employee.business_id == business_id,
            Attendance.date == today_date,
            Attendance.status == 'present'
        )
        if branch_id:
            pt_query = pt_query.filter(Employee.branch_id == branch_id)
        present_today = pt_query.scalar()
        
        pl_query = db.session.query(func.count(LeaveRequest.id)).join(Employee).filter(
            Employee.business_id == business_id,
            LeaveRequest.status == LeaveStatus.PENDING
        )
        if branch_id:
            pl_query = pl_query.filter(Employee.branch_id == branch_id)
        pending_leaves = pl_query.scalar()
        
        # Department Distribution
        dd_query = db.session.query(
            Employee.department,
            func.count(Employee.id).label('count')
        ).filter(
            Employee.business_id == business_id,
            Employee.department.isnot(None)
        )
        if branch_id:
            dd_query = dd_query.filter(Employee.branch_id == branch_id)
        dept_dist_query = dd_query.group_by(Employee.department).all()
        
        dept_dist = []
        for dept in dept_dist_query:
            dept_dist.append({
                'department': dept.department,
                'count': dept.count,
                'percentage': round((dept.count / total_employees * 100), 1) if total_employees > 0 else 0
            })
            
        # Recent Leave Requests
        rl_query = LeaveRequest.query.join(Employee).filter(
            Employee.business_id == business_id
        )
        if branch_id:
            rl_query = rl_query.filter(Employee.branch_id == branch_id)
        recent_leaves = rl_query.order_by(LeaveRequest.created_at.desc()).limit(5).all()
        
        hr_report = {
            'total_employees': total_employees,
            'active_employees': active_employees,
            'present_today': present_today,
            'pending_leave_requests': pending_leaves,
            'department_distribution': dept_dist,
            'recent_leaves': [leave.to_dict() for leave in recent_leaves],
            'turnover_rate': 0.0,
            'average_tenure': 0.0
        }
        
        return jsonify({'hr_report': hr_report}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500