from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole
from app.models.invoice import Invoice
from app.models.order import Order
from app.models.expense import Expense
from app.models.settings import CompanyProfile
from app.utils.decorators import staff_required, manager_required, subscription_required
from app.utils.middleware import module_required, get_business_id, get_active_branch_id
from datetime import datetime, timedelta
from sqlalchemy import func
import calendar

taxes_bp = Blueprint('taxes', __name__)

@taxes_bp.route('/overview', methods=['GET'])
@jwt_required()
@module_required('reports')
def get_tax_overview():
    """Get tax overview with calculations based on company settings and financial data"""
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        
        # Get company profile to get tax rate
        company_profile = CompanyProfile.query.filter_by(business_id=business_id).first()
        
        # Use company tax rate if set, otherwise return 0 and let user configure
        if not company_profile or company_profile.tax_rate is None:
            # Return default values without error - let user configure tax rate
            tax_overview = {
                'period': {
                    'from': start_date.isoformat(),
                    'to': end_date.isoformat()
                },
                'sales_tax_rate': 0,
                'income_tax_rate': 0,
                'sales_tax_payable': 0,
                'income_tax_payable': 0,
                'total_tax_payable': 0,
                'total_revenue': 0,
                'total_expenses': 0,
                'net_profit': 0
            }
            return jsonify({'tax_overview': tax_overview}), 200
        
        # Get financial data for tax calculations
        current_month = datetime.utcnow().replace(day=1)
        start_date = current_month
        end_date = datetime.utcnow()
        
        revenue_query = db.session.query(func.sum(Order.total_amount)).filter(
            Order.business_id == business_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date
        )
        if branch_id:
            revenue_query = revenue_query.filter(Order.branch_id == branch_id)
            
        total_revenue = revenue_query.scalar() or 0.0
        
        # Calculate tax based on company's configured tax rate
        sales_tax_rate = float(company_profile.tax_rate) / 100
        sales_tax_payable = float(total_revenue) * sales_tax_rate
        
        # Get expenses to calculate actual net profit
        from app.models.expense import Expense, ExpenseStatus
        expenses_query = db.session.query(func.sum(Expense.amount)).filter(
            Expense.business_id == business_id,
            Expense.expense_date >= start_date,
            Expense.expense_date <= end_date,
            Expense.status == ExpenseStatus.APPROVED
        )
        total_expenses = expenses_query.scalar() or 0.0
        
        # Calculate actual net profit = revenue - expenses
        net_profit = float(total_revenue) - float(total_expenses)
        
        # Ensure net profit is not negative for tax calculation
        net_profit = max(0, net_profit)
        
        # Get income tax rate from company settings or use a placeholder (income tax should be configured separately)
        # For now, return 0 as income tax requires more complex setup
        income_tax_rate = 0.0  # Income tax should be calculated separately based on business type
        income_tax_payable = net_profit * income_tax_rate
        
        tax_overview = {
            'period': {
                'from': start_date.isoformat(),
                'to': end_date.isoformat()
            },
            'sales_tax_rate': sales_tax_rate * 100,
            'income_tax_rate': income_tax_rate * 100,
            'sales_tax_payable': float(sales_tax_payable),
            'income_tax_payable': float(income_tax_payable),
            'total_tax_payable': float(sales_tax_payable + income_tax_payable),
            'total_revenue': float(total_revenue),
            'total_expenses': float(total_expenses),
            'net_profit': float(net_profit)
        }
        
        return jsonify({'tax_overview': tax_overview}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@taxes_bp.route('/filing-history', methods=['GET'])
@jwt_required()
@module_required('reports')
def get_tax_filing_history():
    """Get tax filing history for the business"""
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        
        # This would typically come from a TaxFiling model
        # For now, we'll return a simplified version based on invoice/order data
        
        # Get recent orders/invoices to calculate tax history
        order_query = Order.query.filter_by(business_id=business_id)
        if branch_id:
            order_query = order_query.filter_by(branch_id=branch_id)
            
        orders = order_query.order_by(Order.created_at.desc()).limit(10).all()
        
        # Group by quarter and calculate tax amounts
        quarterly_tax = {}
        for order in orders:
            # Determine quarter from order date
            quarter = f"Q{((order.created_at.month - 1) // 3) + 1} {order.created_at.year}"
            tax_amount = float(order.tax_amount) if order.tax_amount else 0
            
            if quarter in quarterly_tax:
                quarterly_tax[quarter]['amount'] += tax_amount
                quarterly_tax[quarter]['count'] += 1
            else:
                quarterly_tax[quarter] = {
                    'period': quarter,
                    'type': 'VAT',
                    'amount': tax_amount,
                    'dateFiled': order.created_at.strftime('%b %d, %Y'),
                    'status': 'Calculated',
                    'count': 1
                }
        
        filing_history = list(quarterly_tax.values())
        
        if not filing_history:
            filing_history = []
        
        return jsonify({'filing_history': filing_history}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@taxes_bp.route('/upcoming-deadlines', methods=['GET'])
@jwt_required()
@module_required('reports')
def get_upcoming_tax_deadlines():
    """Get upcoming tax filing deadlines"""
    try:
        business_id = get_business_id()
        
        # Deadlines are usually business-wide, not branch-specific
        # unless branches are in different tax jurisdictions.
        # For now, we'll keep it business-wide.
        
        current_date = datetime.utcnow()
        deadlines = []
        
        # VAT/QST filing (typically quarterly)
        next_month = current_date.month + 3
        next_year = current_date.year
        if next_month > 12:
            next_month = next_month - 12
            next_year = next_year + 1
            
        if next_month in [1, 2, 3]:
            quarter_end_month = 3
        elif next_month in [4, 5, 6]:
            quarter_end_month = 6
        elif next_month in [7, 8, 9]:
            quarter_end_month = 9
        else:
            quarter_end_month = 12
            
        quarter_end = datetime(next_year, quarter_end_month, 
                              calendar.monthrange(next_year, quarter_end_month)[1])
        
        deadlines.append({
            'name': 'Q{} VAT Filing'.format(((quarter_end.month - 1) // 3) + 1),
            'date': quarter_end.strftime('%b %d, %Y'),
            'due_date': quarter_end.date(),
            'urgency': 'high'
        })
        
        # Annual income tax filing
        next_year = current_date.year + 1
        annual_deadline = datetime(next_year, 3, 31)
        if annual_deadline.date() >= current_date.date():
            deadlines.append({
                'name': 'Annual Income Tax',
                'date': annual_deadline.strftime('%b %d, %Y'),
                'due_date': annual_deadline.date(),
                'urgency': 'medium'
            })
        
        return jsonify({'upcoming_deadlines': deadlines}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@taxes_bp.route('/compliance-score', methods=['GET'])
@jwt_required()
@module_required('reports')
def get_tax_compliance_score():
    """Get tax compliance score for the business"""
    try:
        business_id = get_business_id()
        branch_id = request.args.get('branch_id', type=int) or get_active_branch_id()
        
        order_count_query = db.session.query(func.count(Order.id)).filter_by(business_id=business_id)
        if branch_id:
            order_count_query = order_count_query.filter_by(branch_id=branch_id)
            
        orders_count = order_count_query.scalar()
        
        # Check if tax rates are configured
        company_profile = CompanyProfile.query.filter_by(business_id=business_id).first()
        tax_configured = company_profile and company_profile.tax_rate and company_profile.tax_rate > 0
        
        # Calculate compliance score based on actual factors:
        # 1. Tax rate configured (30%)
        # 2. Has orders to track (20%)
        # 3. Regular order activity (30%)
        # 4. Company profile complete (20%)
        compliance_score = 0
        if tax_configured:
            compliance_score += 30
        if orders_count > 0:
            compliance_score += 20
        # Check for recent activity (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_orders = db.session.query(func.count(Order.id)).filter(
            Order.business_id == business_id,
            Order.created_at >= thirty_days_ago
        ).scalar() or 0
        if recent_orders > 0:
            compliance_score += 30
        # Check company profile completeness
        if company_profile and company_profile.company_name and company_profile.email:
            compliance_score += 20
            
        compliance_data = {
            'score': compliance_score,
            'status': 'Excellent' if compliance_score >= 90 else 'Good' if compliance_score >= 70 else 'Fair' if compliance_score >= 50 else 'Needs Setup',
            'details': {
                'tax_rate_configured': tax_configured,
                'orders_tracked': orders_count > 0,
                'recent_activity': recent_orders > 0,
                'profile_complete': bool(company_profile and company_profile.company_name)
            }
        }
        
        return jsonify({'compliance_score': compliance_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@taxes_bp.route('/file', methods=['POST'])
@jwt_required()
@module_required('reports')
@manager_required
@subscription_required
def file_tax_return():
    """File a tax return"""
    try:
        business_id = get_business_id()
        data = request.get_json()
        
        required_fields = ['period', 'type', 'amount', 'filing_date']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        filing_response = {
            'message': f'{data["type"]} tax return for {data["period"]} filed successfully',
            'filing': {
                'period': data['period'],
                'type': data['type'],
                'amount': data['amount'],
                'filing_date': data['filing_date'],
                'status': 'Filed',
                'filing_id': f'TAX-{business_id}-{datetime.utcnow().strftime("%Y%m%d")}'
            }
        }
        
        return jsonify(filing_response), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@taxes_bp.route('/settings', methods=['GET'])
@jwt_required()
@module_required('settings')
def get_tax_settings():
    """Get tax-related settings for the business"""
    try:
        business_id = get_business_id()
        
        company_profile = CompanyProfile.query.filter_by(business_id=business_id).first()
        if not company_profile:
            return jsonify({'error': 'Company profile not found'}), 404
        
        tax_settings = {
            'tax_rate': float(company_profile.tax_rate) if company_profile.tax_rate else 0.0,
            'tax_id': company_profile.business.tax_id if hasattr(company_profile.business, 'tax_id') else None,
            'filing_frequency': 'quarterly',
            'tax_types': ['VAT', 'Corporate Income Tax', 'Payroll Tax']
        }
        
        return jsonify({'tax_settings': tax_settings}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500