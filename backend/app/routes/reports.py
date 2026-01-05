from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderStatus
from app.utils.decorators import staff_required, manager_required
from app.utils.middleware import module_required, get_business_id
from datetime import datetime, timedelta
from sqlalchemy import func

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/sales', methods=['GET'])
@jwt_required()
@module_required('reports')
def get_sales_report():
    try:
        business_id = get_business_id()
        date_from = request.args.get('date_from', '')
        date_to = request.args.get('date_to', '')
        
        if not date_from and not date_to:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=30)
        else:
            start_date = datetime.fromisoformat(date_from) if date_from else datetime.utcnow() - timedelta(days=30)
            end_date = datetime.fromisoformat(date_to) if date_to else datetime.utcnow()
        
        # Calculate actual sales data for this business
        total_sales = db.session.query(func.sum(Order.total_amount)).filter(
            Order.business_id == business_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date
        ).scalar() or 0.0
        
        total_orders = db.session.query(func.count(Order.id)).filter(
            Order.business_id == business_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date
        ).scalar() or 0
        
        avg_order_value = total_sales / total_orders if total_orders > 0 else 0.0
        
        sales_report = {
            'period': {
                'from': start_date.isoformat(),
                'to': end_date.isoformat()
            },
            'total_sales': float(total_sales),
            'total_orders': total_orders,
            'average_order_value': float(avg_order_value),
            'top_products': [], # Would require complex join
            'sales_by_category': [] # Would require complex join
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
        
        # Get stats for this business
        total_products = db.session.query(func.count(Product.id)).filter(Product.business_id == business_id).scalar()
        
        low_stock_products = db.session.query(Product).filter(
            Product.business_id == business_id,
            Product.stock_quantity <= Product.reorder_level
        ).all()
        
        out_of_stock_products = db.session.query(Product).filter(
            Product.business_id == business_id,
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
        business_id = get_business_id()
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
        total_orders = db.session.query(func.count(Order.id)).filter(Order.business_id == business_id).scalar()
        
        orders_by_status = {}
        for status in OrderStatus:
            count = db.session.query(func.count(Order.id)).filter(
                Order.business_id == business_id,
                Order.status == status
            ).scalar()
            orders_by_status[status.value] = count
        
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_orders = db.session.query(func.count(Order.id)).filter(
            Order.business_id == business_id,
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
        business_id = get_business_id()
        date_from = request.args.get('date_from', '')
        date_to = request.args.get('date_to', '')
        
        if not date_from and not date_to:
            end_date = datetime.utcnow()
            start_date = end_date.replace(day=1)
        else:
            start_date = datetime.fromisoformat(date_from) if date_from else datetime.utcnow().replace(day=1)
            end_date = datetime.fromisoformat(date_to) if date_to else datetime.utcnow()
        
        total_revenue = db.session.query(func.sum(Order.total_amount)).filter(
            Order.business_id == business_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date
        ).scalar() or 0.0
        
        from app.models.expense import Expense
        total_expenses = db.session.query(func.sum(Expense.amount)).filter(
            Expense.business_id == business_id,
            Expense.expense_date >= start_date,
            Expense.expense_date <= end_date,
            Expense.status == 'APPROVED'
        ).scalar() or 0.0
        
        financial_report = {
            'period': {
                'from': start_date.isoformat(),
                'to': end_date.isoformat()
            },
            'total_revenue': float(total_revenue),
            'total_expenses': float(total_expenses),
            'net_profit': float(total_revenue - total_expenses),
            'gross_profit_margin': float((total_revenue - total_expenses) / total_revenue * 100) if total_revenue > 0 else 0.0,
            'top_expense_categories': []
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
        total_customers = db.session.query(func.count(Customer.id)).filter(Customer.business_id == business_id).scalar()
        total_products = db.session.query(func.count(Product.id)).filter(Product.business_id == business_id).scalar()
        total_orders = db.session.query(func.count(Order.id)).filter(Order.business_id == business_id).scalar()
        
        total_revenue = db.session.query(func.sum(Order.total_amount)).filter(
            Order.business_id == business_id,
            Order.status == OrderStatus.COMPLETED
        ).scalar() or 0.0
        
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_orders = db.session.query(func.count(Order.id)).filter(
            Order.business_id == business_id,
            Order.created_at >= seven_days_ago
        ).scalar()
        
        summary = {
            'total_customers': total_customers,
            'total_products': total_products,
            'total_orders': total_orders,
            'recent_orders': recent_orders,
            'total_revenue': float(total_revenue),
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
        from app.models.employee import Employee
        from app.models.attendance import Attendance
        from app.models.leave_request import LeaveRequest, LeaveStatus
        from datetime import date
        
        total_employees = db.session.query(func.count(Employee.id)).filter(Employee.business_id == business_id).scalar()
        active_employees = db.session.query(func.count(Employee.id)).filter(
            Employee.business_id == business_id,
            Employee.is_active == True
        ).scalar()
        
        today = date.today()
        present_today = db.session.query(func.count(Attendance.id)).join(Employee).filter(
            Employee.business_id == business_id,
            Attendance.date == today,
            Attendance.status == 'present'
        ).scalar()
        
        pending_leaves = db.session.query(func.count(LeaveRequest.id)).join(Employee).filter(
            Employee.business_id == business_id,
            LeaveRequest.status == LeaveStatus.PENDING
        ).scalar()
        
        hr_report = {
            'total_employees': total_employees,
            'active_employees': active_employees,
            'present_today': present_today,
            'pending_leave_requests': pending_leaves,
            'turnover_rate': 0.0,
            'average_tenure': 0.0
        }
        
        return jsonify({'hr_report': hr_report}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500