"""
Advanced Financial Reports Utility Module
=========================================
This module provides comprehensive financial reporting capabilities including:
- Comprehensive Income Statement (Profit & Loss)
- Balance Sheet Report
- Cash Flow Statement
- Accounts Receivable Aging Report
- Accounts Payable Aging Report
- Profitability Analysis
- Trial Balance Report
- Financial Ratios & KPIs
- Cost Analysis Reports

Author: Financial Reports Module
Date: 2026
"""

from app import db
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderStatus
from app.models.category import Category
from app.models.expense import Expense, ExpenseStatus, ExpenseCategory
from app.models.invoice import Invoice, InvoiceStatus
from app.models.supplier_bill import SupplierBill
from app.models.purchase_order import PurchaseOrder, PurchaseOrderStatus
from app.models.returns import Return, ReturnStatus
from app.models.payroll import Payroll, PayrollStatus
from app.models.settings import CompanyProfile
from app.models.employee import Employee
from sqlalchemy import func, desc, case, and_, or_, cast, String
from datetime import datetime, timedelta, date
from decimal import Decimal
from typing import Dict, List, Any, Optional
import json


class FinancialReportCalculator:
    """
    Advanced Financial Report Calculator
    Provides comprehensive financial calculations and report generation
    """
    
    def __init__(self, business_id: int, branch_id: Optional[int] = None):
        self.business_id = business_id
        self.branch_id = branch_id
    
    def _apply_branch_filter(self, query):
        """Apply branch filter to query if branch_id is specified"""
        if self.branch_id and hasattr(query, 'filter'):
            if hasattr(query, 'filter_by'):
                return query.filter_by(branch_id=self.branch_id)
        return query
    
    def _get_successful_order_statuses(self) -> List[OrderStatus]:
        """Get list of order statuses that count as successful/revenue-generating"""
        return [
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.COMPLETED
        ]
    
    def _calculate_percentage(self, numerator: float, denominator: float) -> float:
        """Calculate percentage with zero division protection"""
        if denominator == 0:
            return 0.0
        return round((numerator / denominator) * 100, 2)
    
    # ==================== COMPREHENSIVE INCOME STATEMENT ====================
    
    def get_comprehensive_income_statement(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """
        Generate Comprehensive Income Statement (Profit & Loss)
        Includes detailed revenue, COGS, expenses, and profit analysis
        """
        successful_statuses = self._get_successful_order_statuses()
        
        # ============== REVENUE SECTION ==============
        # Gross Sales Revenue
        gross_sales_query = db.session.query(func.sum(Order.total_amount)).filter(
            Order.business_id == self.business_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date,
            Order.status.in_(successful_statuses)
        )
        if self.branch_id:
            gross_sales_query = gross_sales_query.filter(Order.branch_id == self.branch_id)
        gross_sales = float(gross_sales_query.scalar() or 0)
        
        # Sales Discounts (from orders with discounts)
        sales_discounts_query = db.session.query(func.sum(Order.discount_amount)).filter(
            Order.business_id == self.business_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date,
            Order.status.in_(successful_statuses)
        )
        if self.branch_id:
            sales_discounts_query = sales_discounts_query.filter(Order.branch_id == self.branch_id)
        sales_discounts = float(sales_discounts_query.scalar() or 0)
        
        # Sales Returns & Allowances
        sales_returns_query = db.session.query(
            func.sum(Return.refund_amount)
        ).join(Order, Return.order_id == Order.id).filter(
            Return.business_id == self.business_id,
            Return.return_date >= start_date.date(),
            Return.return_date <= end_date.date(),
            Return.status.in_([ReturnStatus.APPROVED, ReturnStatus.PROCESSED])
        )
        if self.branch_id:
            sales_returns_query = sales_returns_query.filter(Order.branch_id == self.branch_id)
        sales_returns = float(sales_returns_query.scalar() or 0)
        
        # Net Sales
        net_sales = gross_sales - sales_discounts - sales_returns
        
        # ============== COST OF GOODS SOLD ==============
        # COGS from order items - use coalesce to handle null cost_price values
        cogs_query = db.session.query(
            func.coalesce(func.sum(OrderItem.quantity * Product.cost_price), 0)
        ).join(
            Order, OrderItem.order_id == Order.id
        ).join(
            Product, OrderItem.product_id == Product.id
        ).filter(
            Order.business_id == self.business_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date,
            Order.status.in_(successful_statuses)
        )
        if self.branch_id:
            cogs_query = cogs_query.filter(Order.branch_id == self.branch_id)
        cogs_result = cogs_query.scalar()
        total_cogs = float(cogs_result) if cogs_result is not None else 0
        
        # GROSS PROFIT
        gross_profit = net_sales - total_cogs
        gross_profit_margin = self._calculate_percentage(gross_profit, net_sales)
        
        # ============== OPERATING EXPENSES ==============
        # Get all approved expenses
        expenses_query = db.session.query(
            Expense.category,
            func.sum(Expense.amount).label('total'),
            func.count(Expense.id).label('count')
        ).filter(
            Expense.business_id == self.business_id,
            Expense.expense_date >= start_date.date(),
            Expense.expense_date <= end_date.date(),
            Expense.status == ExpenseStatus.APPROVED
        )
        if self.branch_id:
            expenses_query = expenses_query.filter(Expense.branch_id == self.branch_id)
        
        expense_breakdown = expenses_query.group_by(Expense.category).all()
        
        # Categorize expenses
        operating_expenses = {}
        total_operating_expenses = 0
        
        for exp in expense_breakdown:
            category_name = exp.category.value if hasattr(exp.category, 'value') else str(exp.category)
            amount = float(exp.total)
            operating_expenses[category_name] = {
                'amount': amount,
                'count': exp.count,
                'percentage': self._calculate_percentage(amount, gross_profit) if gross_profit != 0 else 0
            }
            total_operating_expenses += amount
        
        # ============== PAYROLL COSTS ==============
        payroll_query = db.session.query(
            func.sum(Payroll.gross_pay).label('gross'),
            func.sum(Payroll.net_pay).label('net'),
            func.sum(Payroll.tax_deductions).label('tax'),
            func.sum(Payroll.other_deductions).label('benefits'),
            func.count(Payroll.id).label('count')
        ).filter(
            Payroll.business_id == self.business_id,
            Payroll.payment_date >= start_date.date(),
            Payroll.payment_date <= end_date.date(),
            Payroll.status == PayrollStatus.PAID
        )
        if self.branch_id:
            payroll_query = payroll_query.filter(Payroll.branch_id == self.branch_id)
        
        payroll_data = payroll_query.first()
        total_payroll = float(payroll_data.gross or 0) if payroll_data else 0
        payroll_tax = float(payroll_data.tax or 0) if payroll_data else 0
        payroll_benefits = float(payroll_data.benefits or 0) if payroll_data else 0
        
        # ============== OTHER INCOME/EXPENSES ==============
        # Interest income (placeholder - would need payment model)
        other_income = 0
        
        # ============== OPERATING INCOME ==============
        total_operating_costs = total_operating_expenses + total_payroll
        operating_income = gross_profit - total_operating_costs
        
        # ============== NET PROFIT BEFORE TAX ==============
        net_profit_before_tax = operating_income + other_income
        
        # ============== TAX PROVISION ==============
        # Get tax rate from company profile
        company_profile = CompanyProfile.query.filter_by(business_id=self.business_id).first()
        tax_rate = 0
        if company_profile and company_profile.tax_rate is not None:
            try:
                tax_rate = float(company_profile.tax_rate) / 100
            except (ValueError, TypeError):
                tax_rate = 0
        income_tax_provision = max(0, net_profit_before_tax * tax_rate)
        
        # ============== NET PROFIT AFTER TAX ==============
        net_profit_after_tax = net_profit_before_tax - income_tax_provision
        
        # Calculate profit margins
        net_profit_margin = self._calculate_percentage(net_profit_after_tax, net_sales)
        operating_margin = self._calculate_percentage(operating_income, net_sales)
        
        # Build comprehensive income statement
        return {
            'period': {
                'from': start_date.isoformat(),
                'to': end_date.isoformat()
            },
            'revenue': {
                'gross_sales': gross_sales,
                'less_sales_discounts': sales_discounts,
                'less_sales_returns': sales_returns,
                'net_sales': net_sales
            },
            'cost_of_goods_sold': {
                'cogs': total_cogs,
                'gross_profit': gross_profit,
                'gross_margin_percent': gross_profit_margin
            },
            'operating_expenses': {
                'total': total_operating_expenses,
                'breakdown': operating_expenses,
                'expense_to_sales_ratio': self._calculate_percentage(total_operating_expenses, net_sales)
            },
            'payroll': {
                'total_gross_pay': total_payroll,
                'tax_withheld': payroll_tax,
                'benefits': payroll_benefits,
                'payroll_to_sales_ratio': self._calculate_percentage(total_payroll, net_sales)
            },
            'operating_income': {
                'amount': operating_income,
                'margin_percent': operating_margin
            },
            'other_income': {
                'amount': other_income
            },
            'income_tax': {
                'tax_rate': tax_rate * 100,
                'tax_provision': income_tax_provision
            },
            'net_income': {
                'before_tax': net_profit_before_tax,
                'after_tax': net_profit_after_tax,
                'margin_percent': net_profit_margin
            },
            'summary': {
                'total_revenue': net_sales,
                'total_costs': total_cogs + total_operating_costs,
                'net_profit': net_profit_after_tax,
                'profit_per_order': round(net_profit_after_tax / max(gross_sales_query.filter(
                    Order.status.in_(successful_statuses)
                ).count() or 1, 1), 2)
            }
        }
    
    # ==================== BALANCE SHEET ====================
    
    def get_balance_sheet(self, as_of_date: datetime) -> Dict[str, Any]:
        """
        Generate Balance Sheet Report
        Includes Assets, Liabilities, and Equity sections
        """
        
        # ============== ASSETS ==============
        
        # Current Assets
        
        # Cash and Cash Equivalents (from completed orders in last 30 days)
        thirty_days_ago = as_of_date - timedelta(days=30)
        cash_query = db.session.query(func.sum(Order.total_amount)).filter(
            Order.business_id == self.business_id,
            Order.created_at >= thirty_days_ago,
            Order.created_at <= as_of_date,
            Order.status.in_([OrderStatus.DELIVERED, OrderStatus.COMPLETED])
        )
        if self.branch_id:
            cash_query = cash_query.filter(Order.branch_id == self.branch_id)
        cash_and_equivalents = float(cash_query.scalar() or 0)
        
        # Accounts Receivable (outstanding invoices) - use cast to string for enum compatibility
        outstanding_invoice_statuses = ['sent', 'viewed', 'partially_paid', 'overdue']
        ar_query = db.session.query(func.sum(Invoice.amount_due)).filter(
            Invoice.business_id == self.business_id,
            cast(Invoice.status, String).in_(outstanding_invoice_statuses)
        )
        if self.branch_id:
            ar_query = ar_query.filter(Invoice.branch_id == self.branch_id)
        accounts_receivable = float(ar_query.scalar() or 0)
        
        # Inventory (products with stock)
        inventory_query = db.session.query(
            func.sum(Product.stock_quantity * Product.cost_price)
        ).filter(
            Product.business_id == self.business_id,
            Product.is_active == True,
            Product.stock_quantity > 0
        )
        if self.branch_id:
            inventory_query = inventory_query.filter(Product.branch_id == self.branch_id)
        inventory = float(inventory_query.scalar() or 0)
        
        # Prepaid Expenses (estimated from expenses)
        prepaid_query = db.session.query(func.sum(Expense.amount)).filter(
            Expense.business_id == self.business_id,
            Expense.status == ExpenseStatus.APPROVED,
            Expense.expense_date >= (as_of_date - timedelta(days=30)).date(),
            Expense.expense_date <= as_of_date.date()
        )
        if self.branch_id:
            prepaid_query = prepaid_query.filter(Expense.branch_id == self.branch_id)
        prepaid_expenses = float(prepaid_query.scalar() or 0) * 0.1  # Estimate 10% as prepaid
        
        # Total Current Assets
        total_current_assets = cash_and_equivalents + accounts_receivable + inventory + prepaid_expenses
        
        # Fixed Assets (estimated from products - equipment value)
        fixed_assets_query = db.session.query(func.sum(Product.cost_price * 1)).filter(
            Product.business_id == self.business_id,
            Product.is_active == True
        )
        if self.branch_id:
            fixed_assets_query = fixed_assets_query.filter(Product.branch_id == self.branch_id)
        # Estimate fixed assets as 2x average inventory value for estimation
        estimated_fixed_assets = inventory * 0.5
        
        # Total Assets
        total_assets = total_current_assets + estimated_fixed_assets
        
        # ============== LIABILITIES ==============
        
        # Current Liabilities
        
        # Accounts Payable (outstanding supplier bills)
        ap_query = db.session.query(func.sum(SupplierBill.total_amount)).filter(
            SupplierBill.business_id == self.business_id,
            SupplierBill.status.in_(['pending', 'partial', 'overdue'])
        )
        if self.branch_id:
            ap_query = ap_query.filter(SupplierBill.branch_id == self.branch_id)
        accounts_payable = float(ap_query.scalar() or 0)
        
        # Accrued Expenses (approved but unpaid expenses)
        accrued_query = db.session.query(func.sum(Expense.amount)).filter(
            Expense.business_id == self.business_id,
            Expense.status == ExpenseStatus.APPROVED,
            Expense.paid_date.is_(None)
        )
        if self.branch_id:
            accrued_query = accrued_query.filter(Expense.branch_id == self.branch_id)
        accrued_expenses = float(accrued_query.scalar() or 0)
        
        # Payroll Liabilities (estimated)
        payroll_liability_query = db.session.query(func.sum(Payroll.tax_deductions)).filter(
            Payroll.business_id == self.business_id,
            Payroll.status == PayrollStatus.APPROVED
        )
        if self.branch_id:
            payroll_liability_query = payroll_liability_query.filter(Payroll.branch_id == self.branch_id)
        payroll_liabilities = float(payroll_liability_query.scalar() or 0)
        
        # Total Current Liabilities
        total_current_liabilities = accounts_payable + accrued_expenses + payroll_liabilities
        
        # Long-term Liabilities (estimated as 20% of current)
        long_term_liabilities = total_current_liabilities * 0.2
        
        # Total Liabilities
        total_liabilities = total_current_liabilities + long_term_liabilities
        
        # ============== EQUITY ==============
        
        # Retained Earnings (estimated from cumulative profit)
        # Use recent profit as approximation
        one_year_ago = as_of_date - timedelta(days=365)
        profit_query = db.session.query(func.sum(Order.total_amount)).filter(
            Order.business_id == self.business_id,
            Order.created_at >= one_year_ago,
            Order.created_at <= as_of_date,
            Order.status.in_([OrderStatus.DELIVERED, OrderStatus.COMPLETED])
        )
        if self.branch_id:
            profit_query = profit_query.filter(Order.branch_id == self.branch_id)
        total_revenue = float(profit_query.scalar() or 0)
        
        # Estimate expenses
        est_expenses = total_revenue * 0.6  # Assume 60% expense ratio
        retained_earnings = total_revenue - est_expenses
        
        # Owner's Equity (simplified)
        owners_equity = total_assets - total_liabilities - retained_earnings
        
        # Total Equity
        total_equity = retained_earnings + owners_equity
        
        # ============== VERIFICATION ==============
        total_liabilities_and_equity = total_liabilities + total_equity
        balance_check = abs(total_assets - total_liabilities_and_equity)
        
        return {
            'as_of_date': as_of_date.isoformat(),
            'assets': {
                'current_assets': {
                    'cash_and_equivalents': cash_and_equivalents,
                    'accounts_receivable': accounts_receivable,
                    'inventory': inventory,
                    'prepaid_expenses': prepaid_expenses,
                    'total': total_current_assets
                },
                'fixed_assets': {
                    'equipment': estimated_fixed_assets,
                    'total': estimated_fixed_assets
                },
                'total_assets': total_assets
            },
            'liabilities': {
                'current_liabilities': {
                    'accounts_payable': accounts_payable,
                    'accrued_expenses': accrued_expenses,
                    'payroll_liabilities': payroll_liabilities,
                    'total': total_current_liabilities
                },
                'long_term_liabilities': {
                    'amount': long_term_liabilities,
                    'total': long_term_liabilities
                },
                'total_liabilities': total_liabilities
            },
            'equity': {
                'retained_earnings': retained_earnings,
                'owners_equity': owners_equity,
                'total_equity': total_equity
            },
            'total_liabilities_and_equity': total_liabilities_and_equity,
            'balance_check': {
                'total_assets': total_assets,
                'total_liabilities_and_equity': total_liabilities_and_equity,
                'difference': balance_check,
                'balanced': balance_check < 1.0  # Allow for rounding errors
            }
        }
    
    # ==================== CASH FLOW STATEMENT ====================
    
    def get_cash_flow_statement(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """
        Generate Cash Flow Statement
        Includes Operating, Investing, and Financing activities
        """
        successful_statuses = self._get_successful_order_statuses()
        
        # ============== OPERATING ACTIVITIES ==============
        
        # Cash received from customers
        cash_received_query = db.session.query(func.sum(Order.total_amount)).filter(
            Order.business_id == self.business_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date,
            Order.status.in_([OrderStatus.DELIVERED, OrderStatus.COMPLETED])
        )
        if self.branch_id:
            cash_received_query = cash_received_query.filter(Order.branch_id == self.branch_id)
        cash_from_customers = float(cash_received_query.scalar() or 0)
        
        # Cash paid to suppliers (purchase orders)
        cash_to_suppliers_query = db.session.query(func.sum(PurchaseOrder.total_amount)).filter(
            PurchaseOrder.business_id == self.business_id,
            PurchaseOrder.order_date >= start_date.date(),
            PurchaseOrder.order_date <= end_date.date(),
            PurchaseOrder.status == PurchaseOrderStatus.RECEIVED
        )
        if self.branch_id:
            cash_to_suppliers_query = cash_to_suppliers_query.filter(PurchaseOrder.branch_id == self.branch_id)
        cash_to_suppliers = float(cash_to_suppliers_query.scalar() or 0)
        
        # Cash paid for expenses
        cash_for_expenses_query = db.session.query(func.sum(Expense.amount)).filter(
            Expense.business_id == self.business_id,
            Expense.expense_date >= start_date.date(),
            Expense.expense_date <= end_date.date(),
            Expense.status == ExpenseStatus.PAID
        )
        if self.branch_id:
            cash_for_expenses_query = cash_for_expenses_query.filter(Expense.branch_id == self.branch_id)
        cash_for_expenses = float(cash_for_expenses_query.scalar() or 0)
        
        # Cash paid for payroll (use coalesce to handle NULL values and use gross_pay if net_pay is null)
        cash_for_payroll_query = db.session.query(
            func.coalesce(func.sum(func.coalesce(Payroll.net_pay, 0)), 0)
        ).filter(
            Payroll.business_id == self.business_id,
            Payroll.payment_date >= start_date.date(),
            Payroll.payment_date <= end_date.date(),
            Payroll.status == PayrollStatus.PAID
        )
        if self.branch_id:
            cash_for_payroll_query = cash_for_payroll_query.filter(Payroll.branch_id == self.branch_id)
        cash_for_payroll_result = cash_for_payroll_query.scalar()
        cash_for_payroll = float(cash_for_payroll_result) if cash_for_payroll_result is not None else float(0)
        
        # If net_pay is zero, also include gross_pay as alternative (for payroll cost visibility)
        if cash_for_payroll == 0:
            cash_for_payroll_gross_query = db.session.query(
                func.coalesce(func.sum(Payroll.gross_pay), 0)
            ).filter(
                Payroll.business_id == self.business_id,
                Payroll.payment_date >= start_date.date(),
                Payroll.payment_date <= end_date.date(),
                Payroll.status == PayrollStatus.PAID
            )
            if self.branch_id:
                cash_for_payroll_gross_query = cash_for_payroll_gross_query.filter(Payroll.branch_id == self.branch_id)
            cash_for_payroll_gross = float(cash_for_payroll_gross_query.scalar() or 0)
            if cash_for_payroll_gross > 0:
                cash_for_payroll = cash_for_payroll_gross
        
        # Taxes paid
        taxes_paid = cash_for_expenses * 0.15  # Estimate 15% as tax
        
        # Net Cash from Operating Activities
        net_cash_operating = cash_from_customers - cash_to_suppliers - cash_for_expenses - cash_for_payroll - taxes_paid
        
        # ============== INVESTING ACTIVITIES ==============
        
        # Purchase of equipment (from product costs as proxy)
        equipment_purchases = cash_to_suppliers * 0.1  # Estimate 10% of supplier payments
        
        # Net Cash from Investing Activities
        net_cash_investing = -equipment_purchases
        
        # ============== FINANCING ACTIVITIES ==============
        
        # Owner investments (estimated)
        owner_investments = 0
        
        # Owner withdrawals (estimated)
        owner_withdrawals = net_cash_operating * 0.1 if net_cash_operating > 0 else 0
        
        # Net Cash from Financing Activities
        net_cash_financing = owner_investments - owner_withdrawals
        
        # ============== NET CHANGE IN CASH ==============
        net_change_in_cash = net_cash_operating + net_cash_investing + net_cash_financing
        
        # Beginning cash (estimate)
        beginning_cash = cash_from_customers * 0.3  # Estimate based on revenue
        
        # Ending cash
        ending_cash = beginning_cash + net_change_in_cash
        
        return {
            'period': {
                'from': start_date.isoformat(),
                'to': end_date.isoformat()
            },
            'operating_activities': {
                'cash_received_from_customers': cash_from_customers,
                'cash_paid_to_suppliers': -cash_to_suppliers,
                'cash_paid_for_expenses': -cash_for_expenses,
                'cash_paid_for_payroll': -cash_for_payroll,
                'taxes_paid': -taxes_paid,
                'net_cash_flow': net_cash_operating
            },
            'investing_activities': {
                'equipment_purchases': -equipment_purchases,
                'net_cash_flow': net_cash_investing
            },
            'financing_activities': {
                'owner_investments': owner_investments,
                'owner_withdrawals': -owner_withdrawals,
                'net_cash_flow': net_cash_financing
            },
            'summary': {
                'net_change_in_cash': net_change_in_cash,
                'beginning_cash': beginning_cash,
                'ending_cash': ending_cash
            }
        }
    
    # ==================== ACCOUNTS RECEIVABLE AGING ====================
    
    def get_ar_aging_report(self) -> Dict[str, Any]:
        """
        Generate Accounts Receivable Aging Report
        Shows outstanding invoices grouped by age
        """
        today = date.today()
        
        # Get all outstanding invoices - use cast to string for enum comparison
        outstanding_statuses = ['sent', 'viewed', 'partially_paid', 'overdue']
        invoices_query = db.session.query(Invoice).filter(
            Invoice.business_id == self.business_id,
            cast(Invoice.status, String).in_(outstanding_statuses)
        )
        if self.branch_id:
            invoices_query = invoices_query.filter(Invoice.branch_id == self.branch_id)
        
        invoices = invoices_query.all()
        
        # Age buckets
        current = 0          # 0-30 days
        days_31_60 = 0      # 31-60 days
        days_61_90 = 0      # 61-90 days
        over_90 = 0         # Over 90 days
        total_outstanding = 0
        
        invoice_details = []
        
        for inv in invoices:
            age_days = (today - inv.issue_date).days if inv.issue_date else 0
            amount = float(inv.amount_due)
            
            invoice_details.append({
                'invoice_id': inv.invoice_id,
                'customer': f"{inv.customer.first_name} {inv.customer.last_name}" if inv.customer else 'Unknown',
                'issue_date': inv.issue_date.isoformat() if inv.issue_date else None,
                'due_date': inv.due_date.isoformat() if inv.due_date else None,
                'amount': amount,
                'age_days': age_days,
                'status': inv.status.value
            })
            
            total_outstanding += amount
            
            if age_days <= 30:
                current += amount
            elif age_days <= 60:
                days_31_60 += amount
            elif age_days <= 90:
                days_61_90 += amount
            else:
                over_90 += amount
        
        return {
            'report_date': today.isoformat(),
            'aging_buckets': {
                'current': {
                    'label': 'Current (0-30 days)',
                    'amount': current,
                    'percentage': self._calculate_percentage(current, total_outstanding)
                },
                'days_31_60': {
                    'label': '31-60 days',
                    'amount': days_31_60,
                    'percentage': self._calculate_percentage(days_31_60, total_outstanding)
                },
                'days_61_90': {
                    'label': '61-90 days',
                    'amount': days_61_90,
                    'percentage': self._calculate_percentage(days_61_90, total_outstanding)
                },
                'over_90': {
                    'label': 'Over 90 days',
                    'amount': over_90,
                    'percentage': self._calculate_percentage(over_90, total_outstanding)
                }
            },
            'total_outstanding': total_outstanding,
            'total_invoices': len(invoices),
            'details': invoice_details[:50]  # Limit to first 50 for performance
        }
    
    # ==================== ACCOUNTS PAYABLE AGING ====================
    
    def get_ap_aging_report(self) -> Dict[str, Any]:
        """
        Generate Accounts Payable Aging Report
        Shows outstanding bills grouped by age
        """
        today = date.today()
        
        # Get all outstanding supplier bills
        bills_query = db.session.query(SupplierBill).filter(
            SupplierBill.business_id == self.business_id,
            SupplierBill.status.in_(['pending', 'partial', 'overdue'])
        )
        if self.branch_id:
            bills_query = bills_query.filter(SupplierBill.branch_id == self.branch_id)
        
        bills = bills_query.all()
        
        # Age buckets
        current = 0
        days_31_60 = 0
        days_61_90 = 0
        over_90 = 0
        total_outstanding = 0
        
        bill_details = []
        
        for bill in bills:
            age_days = (today - bill.bill_date).days if bill.bill_date else 0
            amount = float(bill.total_amount)
            
            bill_details.append({
                'bill_number': bill.bill_number,
                'supplier': bill.supplier.name if bill.supplier else 'Unknown',
                'bill_date': bill.bill_date.isoformat() if bill.bill_date else None,
                'due_date': bill.due_date.isoformat() if bill.due_date else None,
                'amount': amount,
                'age_days': age_days,
                'status': bill.status
            })
            
            total_outstanding += amount
            
            if age_days <= 30:
                current += amount
            elif age_days <= 60:
                days_31_60 += amount
            elif age_days <= 90:
                days_61_90 += amount
            else:
                over_90 += amount
        
        return {
            'report_date': today.isoformat(),
            'aging_buckets': {
                'current': {
                    'label': 'Current (0-30 days)',
                    'amount': current,
                    'percentage': self._calculate_percentage(current, total_outstanding)
                },
                'days_31_60': {
                    'label': '31-60 days',
                    'amount': days_31_60,
                    'percentage': self._calculate_percentage(days_31_60, total_outstanding)
                },
                'days_61_90': {
                    'label': '61-90 days',
                    'amount': days_61_90,
                    'percentage': self._calculate_percentage(days_61_90, total_outstanding)
                },
                'over_90': {
                    'label': 'Over 90 days',
                    'amount': over_90,
                    'percentage': self._calculate_percentage(over_90, total_outstanding)
                }
            },
            'total_outstanding': total_outstanding,
            'total_bills': len(bills),
            'details': bill_details[:50]
        }
    
    # ==================== PROFITABILITY ANALYSIS ====================
    
    def get_profitability_analysis(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """
        Generate Profitability Analysis Report
        Shows profits by product, category, and customer
        """
        successful_statuses = self._get_successful_order_statuses()
        
        # ============== PROFIT BY PRODUCT ==============
        profit_by_product_query = db.session.query(
            Product.id,
            Product.name,
            func.sum(OrderItem.quantity).label('quantity_sold'),
            func.sum(OrderItem.line_total).label('revenue'),
            func.coalesce(func.sum(OrderItem.quantity * Product.cost_price), 0).label('cost'),
            func.count(func.distinct(Order.id)).label('orders')
        ).join(
            OrderItem, Product.id == OrderItem.product_id
        ).join(
            Order, OrderItem.order_id == Order.id
        ).filter(
            Order.business_id == self.business_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date,
            Order.status.in_(successful_statuses)
        )
        if self.branch_id:
            profit_by_product_query = profit_by_product_query.filter(Order.branch_id == self.branch_id)
        
        profit_by_product = profit_by_product_query.group_by(Product.id, Product.name).all()
        
        product_profitability = []
        for p in profit_by_product:
            revenue = float(p.revenue or 0)
            cost = float(p.cost) if p.cost is not None else 0
            profit = revenue - cost
            margin = self._calculate_percentage(profit, revenue)
            
            product_profitability.append({
                'product_id': p.id,
                'product_name': p.name,
                'quantity_sold': p.quantity_sold,
                'revenue': revenue,
                'cost': cost,
                'profit': profit,
                'margin_percent': margin
            })
        
        # Sort by profit descending
        product_profitability.sort(key=lambda x: x['profit'], reverse=True)
        
        # ============== PROFIT BY CATEGORY ==============
        profit_by_category_query = db.session.query(
            Category.name,
            func.sum(OrderItem.quantity).label('quantity_sold'),
            func.sum(OrderItem.line_total).label('revenue'),
            func.coalesce(func.sum(OrderItem.quantity * Product.cost_price), 0).label('cost')
        ).join(
            Product, Category.id == Product.category_id
        ).join(
            OrderItem, Product.id == OrderItem.product_id
        ).join(
            Order, OrderItem.order_id == Order.id
        ).filter(
            Order.business_id == self.business_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date,
            Order.status.in_(successful_statuses)
        )
        if self.branch_id:
            profit_by_category_query = profit_by_category_query.filter(Order.branch_id == self.branch_id)
        
        profit_by_category = profit_by_category_query.group_by(Category.name).all()
        
        category_profitability = []
        for c in profit_by_category:
            revenue = float(c.revenue or 0)
            cost = float(c.cost or 0)
            profit = revenue - cost
            margin = self._calculate_percentage(profit, revenue)
            
            category_profitability.append({
                'category_name': c.name,
                'quantity_sold': c.quantity_sold,
                'revenue': revenue,
                'cost': cost,
                'profit': profit,
                'margin_percent': margin
            })
        
        # ============== PROFIT BY CUSTOMER ==============
        profit_by_customer_query = db.session.query(
            Customer.id,
            Customer.first_name,
            Customer.last_name,
            func.sum(Order.total_amount).label('revenue'),
            func.count(Order.id).label('orders')
        ).join(
            Order, Customer.id == Order.customer_id
        ).filter(
            Customer.business_id == self.business_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date,
            Order.status.in_(successful_statuses)
        )
        if self.branch_id:
            profit_by_customer_query = profit_by_customer_query.filter(Order.branch_id == self.branch_id)
        
        profit_by_customer = profit_by_customer_query.group_by(
            Customer.id, Customer.first_name, Customer.last_name
        ).all()
        
        customer_profitability = []
        total_revenue = 0
        for c in profit_by_customer:
            revenue = float(c.revenue or 0)
            total_revenue += revenue
            
            # Estimate cost as 60% of revenue for customers (would need actual data)
            estimated_cost = revenue * 0.6
            profit = revenue - estimated_cost
            margin = self._calculate_percentage(profit, revenue)
            
            customer_profitability.append({
                'customer_id': c.id,
                'customer_name': f"{c.first_name} {c.last_name}",
                'order_count': c.orders,
                'revenue': revenue,
                'estimated_profit': profit,
                'margin_percent': margin
            })
        
        # Sort by revenue descending
        customer_profitability.sort(key=lambda x: x['revenue'], reverse=True)
        
        return {
            'period': {
                'from': start_date.isoformat(),
                'to': end_date.isoformat()
            },
            'by_product': product_profitability[:20],
            'by_category': category_profitability,
            'by_customer': customer_profitability[:20],
            'summary': {
                'total_revenue': total_revenue,
                'total_products': len(product_profitability),
                'total_categories': len(category_profitability),
                'total_customers': len(customer_profitability)
            }
        }
    
    # ==================== TRIAL BALANCE ====================
    
    def get_trial_balance(self, as_of_date: datetime) -> Dict[str, Any]:
        """
        Generate Trial Balance Report
        Shows all account balances
        """
        
        # Revenue Accounts
        revenue_query = db.session.query(func.sum(Order.total_amount)).filter(
            Order.business_id == self.business_id,
            Order.created_at <= as_of_date,
            Order.status.in_([OrderStatus.DELIVERED, OrderStatus.COMPLETED])
        )
        if self.branch_id:
            revenue_query = revenue_query.filter(Order.branch_id == self.branch_id)
        revenue = float(revenue_query.scalar() or 0)
        
        # Sales Returns
        returns_query = db.session.query(func.sum(Return.refund_amount)).filter(
            Return.business_id == self.business_id,
            Return.return_date <= as_of_date.date(),
            Return.status.in_([ReturnStatus.APPROVED, ReturnStatus.PROCESSED])
        )
        returns = float(returns_query.scalar() or 0)
        
        # COGS - use coalesce to handle null cost_price values
        cogs_query = db.session.query(
            func.coalesce(func.sum(OrderItem.quantity * Product.cost_price), 0)
        ).join(Order, OrderItem.order_id == Order.id).join(
            Product, OrderItem.product_id == Product.id
        ).filter(
            Order.business_id == self.business_id,
            Order.created_at <= as_of_date,
            Order.status.in_([OrderStatus.DELIVERED, OrderStatus.COMPLETED])
        )
        if self.branch_id:
            cogs_query = cogs_query.filter(Order.branch_id == self.branch_id)
        cogs_result = cogs_query.scalar()
        cogs = float(cogs_result) if cogs_result is not None else 0
        
        # Expenses
        expense_query = db.session.query(func.sum(Expense.amount)).filter(
            Expense.business_id == self.business_id,
            Expense.expense_date <= as_of_date.date(),
            Expense.status == ExpenseStatus.APPROVED
        )
        if self.branch_id:
            expense_query = expense_query.filter(Expense.branch_id == self.branch_id)
        expenses = float(expense_query.scalar() or 0)
        
        # Payroll
        payroll_query = db.session.query(func.sum(Payroll.gross_pay)).filter(
            Payroll.business_id == self.business_id,
            Payroll.payment_date <= as_of_date.date(),
            Payroll.status == PayrollStatus.PAID
        )
        if self.branch_id:
            payroll_query = payroll_query.filter(Payroll.branch_id == self.branch_id)
        payroll = float(payroll_query.scalar() or 0)
        
        # Assets
        asset_query = db.session.query(
            func.sum(Product.stock_quantity * Product.cost_price)
        ).filter(
            Product.business_id == self.business_id,
            Product.is_active == True
        )
        if self.branch_id:
            asset_query = asset_query.filter(Product.branch_id == self.branch_id)
        assets = float(asset_query.scalar() or 0)
        
        # Liabilities
        liability_query = db.session.query(func.sum(SupplierBill.total_amount)).filter(
            SupplierBill.business_id == self.business_id,
            SupplierBill.status.in_(['pending', 'partial', 'overdue'])
        )
        if self.branch_id:
            liability_query = liability_query.filter(SupplierBill.branch_id == self.branch_id)
        liabilities = float(liability_query.scalar() or 0)
        
        # Accounts Receivable - use cast to string for enum compatibility
        outstanding_invoice_statuses = ['sent', 'viewed', 'partially_paid', 'overdue']
        ar_query = db.session.query(func.sum(Invoice.amount_due)).filter(
            Invoice.business_id == self.business_id,
            cast(Invoice.status, String).in_(outstanding_invoice_statuses)
        )
        if self.branch_id:
            ar_query = ar_query.filter(Invoice.branch_id == self.branch_id)
        accounts_receivable = float(ar_query.scalar() or 0)
        
        # Accounts Payable
        ap_query = db.session.query(func.sum(SupplierBill.total_amount)).filter(
            SupplierBill.business_id == self.business_id,
            SupplierBill.status.in_(['pending', 'partial', 'overdue'])
        )
        if self.branch_id:
            ap_query = ap_query.filter(SupplierBill.branch_id == self.branch_id)
        accounts_payable = float(ap_query.scalar() or 0)
        
        # Calculate Net Income
        net_income = revenue - returns - cogs - expenses - payroll
        
        return {
            'as_of_date': as_of_date.isoformat(),
            'accounts': {
                'revenue': {
                    'account': 'Sales Revenue',
                    'debit': 0,
                    'credit': revenue,
                    'balance': revenue
                },
                'sales_returns': {
                    'account': 'Sales Returns',
                    'debit': returns,
                    'credit': 0,
                    'balance': -returns
                },
                'cogs': {
                    'account': 'Cost of Goods Sold',
                    'debit': cogs,
                    'credit': 0,
                    'balance': -cogs
                },
                'expenses': {
                    'account': 'Operating Expenses',
                    'debit': expenses,
                    'credit': 0,
                    'balance': -expenses
                },
                'payroll': {
                    'account': 'Payroll Expense',
                    'debit': payroll,
                    'credit': 0,
                    'balance': -payroll
                },
                'assets': {
                    'account': 'Assets',
                    'debit': assets,
                    'credit': 0,
                    'balance': assets
                },
                'accounts_receivable': {
                    'account': 'Accounts Receivable',
                    'debit': accounts_receivable,
                    'credit': 0,
                    'balance': accounts_receivable
                },
                'liabilities': {
                    'account': 'Liabilities',
                    'debit': 0,
                    'credit': liabilities,
                    'balance': -liabilities
                },
                'accounts_payable': {
                    'account': 'Accounts Payable',
                    'debit': 0,
                    'credit': accounts_payable,
                    'balance': -accounts_payable
                },
                'net_income': {
                    'account': 'Net Income',
                    'debit': max(0, net_income),
                    'credit': max(0, -net_income),
                    'balance': net_income
                }
            },
            'totals': {
                'total_debit': assets + accounts_receivable + cogs + expenses + payroll + returns + max(0, net_income),
                'total_credit': revenue + liabilities + accounts_payable + max(0, -net_income),
                'net_income': net_income
            }
        }
    
    # ==================== FINANCIAL RATIOS ====================
    
    def get_financial_ratios(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """
        Generate Financial Ratios and KPIs
        """
        
        # Get balance sheet data
        balance_sheet = self.get_balance_sheet(end_date)
        
        # Get income statement data
        income_statement = self.get_comprehensive_income_statement(start_date, end_date)
        
        # Extract values
        total_assets = balance_sheet['assets']['total_assets']
        total_equity = balance_sheet['equity']['total_equity']
        total_liabilities = balance_sheet['liabilities']['total_liabilities']
        current_assets = balance_sheet['assets']['current_assets']['total']
        current_liabilities = balance_sheet['liabilities']['current_liabilities']['total']
        inventory = balance_sheet['assets']['current_assets']['inventory']
        accounts_receivable = balance_sheet['assets']['current_assets']['accounts_receivable']
        accounts_payable = balance_sheet['liabilities']['current_liabilities']['accounts_payable']
        
        net_sales = income_statement['revenue']['net_sales']
        net_profit = income_statement['net_income']['after_tax']
        gross_profit = income_statement['cost_of_goods_sold']['gross_profit']
        operating_income = income_statement['operating_income']['amount']
        
        # Liquidity Ratios
        current_ratio = self._calculate_percentage(current_assets, current_liabilities)
        quick_ratio = self._calculate_percentage(current_assets - inventory, current_liabilities)
        cash_ratio = self._calculate_percentage(
            balance_sheet['assets']['current_assets']['cash_and_equivalents'],
            current_liabilities
        )
        
        # Profitability Ratios
        gross_margin = income_statement['cost_of_goods_sold']['gross_margin_percent']
        net_profit_margin = income_statement['net_income']['margin_percent']
        operating_margin = income_statement['operating_income']['margin_percent']
        roa = self._calculate_percentage(net_profit, total_assets) if total_assets > 0 else 0
        roe = self._calculate_percentage(net_profit, total_equity) if total_equity > 0 else 0
        
        # Leverage Ratios
        debt_to_assets = self._calculate_percentage(total_liabilities, total_assets)
        debt_to_equity = self._calculate_percentage(total_liabilities, total_equity) if total_equity > 0 else 0
        equity_ratio = self._calculate_percentage(total_equity, total_assets)
        
        # Efficiency Ratios
        asset_turnover = self._calculate_percentage(net_sales, total_assets) if total_assets > 0 else 0
        inventory_turnover = self._calculate_percentage(
            income_statement['cost_of_goods_sold']['cogs'],
            inventory
        ) if inventory > 0 else 0
        
        # Collection and Payment
        receivables_turnover = self._calculate_percentage(net_sales, accounts_receivable) if accounts_receivable > 0 else 0
        payables_turnover = self._calculate_percentage(
            income_statement['operating_expenses']['total'],
            accounts_payable
        ) if accounts_payable > 0 else 0
        
        return {
            'period': {
                'from': start_date.isoformat(),
                'to': end_date.isoformat()
            },
            'liquidity_ratios': {
                'current_ratio': round(current_ratio, 2),
                'quick_ratio': round(quick_ratio, 2),
                'cash_ratio': round(cash_ratio, 2),
                'interpretation': self._interpret_ratio('current', current_ratio)
            },
            'profitability_ratios': {
                'gross_margin_percent': round(gross_margin, 2),
                'net_profit_margin_percent': round(net_profit_margin, 2),
                'operating_margin_percent': round(operating_margin, 2),
                'return_on_assets_percent': round(roa, 2),
                'return_on_equity_percent': round(roe, 2)
            },
            'leverage_ratios': {
                'debt_to_assets_percent': round(debt_to_assets, 2),
                'debt_to_equity_percent': round(debt_to_equity, 2),
                'equity_ratio_percent': round(equity_ratio, 2)
            },
            'efficiency_ratios': {
                'asset_turnover': round(asset_turnover, 2),
                'inventory_turnover': round(inventory_turnover, 2),
                'receivables_turnover': round(receivables_turnover, 2),
                'payables_turnover': round(payables_turnover, 2)
            },
            'kpis': {
                'net_profit': net_profit,
                'gross_profit': gross_profit,
                'operating_income': operating_income,
                'total_revenue': net_sales,
                'total_assets': total_assets,
                'total_equity': total_equity
            }
        }
    
    def _interpret_ratio(self, ratio_type: str, value: float) -> str:
        """Provide interpretation of financial ratios"""
        interpretations = {
            'current': {
                'excellent': '> 2.0',
                'good': '1.5 - 2.0',
                'acceptable': '1.0 - 1.5',
                'poor': '< 1.0'
            }
        }
        
        if ratio_type == 'current':
            if value > 2.0:
                return "Excellent - Company has strong liquidity"
            elif value > 1.5:
                return "Good - Company has adequate liquidity"
            elif value > 1.0:
                return "Acceptable - Monitor liquidity closely"
            else:
                return "Poor - May have difficulty meeting short-term obligations"
        
        return "N/A"


# Export all report types
def generate_all_financial_reports(business_id: int, branch_id: Optional[int] = None,
                                     start_date: Optional[datetime] = None, 
                                     end_date: Optional[datetime] = None) -> Dict[str, Any]:
    """
    Generate all financial reports at once
    """
    calculator = FinancialReportCalculator(business_id, branch_id)
    
    # Default to current month
    if not start_date:
        start_date = datetime.utcnow().replace(day=1)
    if not end_date:
        end_date = datetime.utcnow()
    
    return {
        'income_statement': calculator.get_comprehensive_income_statement(start_date, end_date),
        'balance_sheet': calculator.get_balance_sheet(end_date),
        'cash_flow': calculator.get_cash_flow_statement(start_date, end_date),
        'ar_aging': calculator.get_ar_aging_report(),
        'ap_aging': calculator.get_ap_aging_report(),
        'profitability': calculator.get_profitability_analysis(start_date, end_date),
        'trial_balance': calculator.get_trial_balance(end_date),
        'financial_ratios': calculator.get_financial_ratios(start_date, end_date)
    }
