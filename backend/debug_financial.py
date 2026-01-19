
from app import create_app, db
from app.models.order import Order, OrderStatus, OrderItem
from app.models.product import Product
from app.models.expense import Expense
from sqlalchemy import func, desc
from datetime import datetime, timedelta

app = create_app()
with app.app_context():
    try:
        business_id = 4 # Business ID 4 has orders
        end_date = datetime.utcnow()
        start_date = end_date.replace(day=1)
        
        successful_statuses = [
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.COMPLETED
        ]

        print(f"Testing Financial Report for Business ID: {business_id}")
        
        # Total Revenue
        total_revenue_result = db.session.query(func.sum(Order.total_amount)).filter(
            Order.business_id == business_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date,
            Order.status.in_(successful_statuses)
        ).scalar()
        total_revenue = float(total_revenue_result) if total_revenue_result is not None else 0.0
        print(f"Total Revenue: {total_revenue}")

        # Net Sales
        net_sales_result = db.session.query(func.sum(Order.subtotal)).filter(
            Order.business_id == business_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date,
            Order.status.in_(successful_statuses)
        ).scalar()
        net_sales = float(net_sales_result) if net_sales_result is not None else 0.0
        print(f"Net Sales: {net_sales}")

        # COGS
        total_cogs_result = db.session.query(func.sum(OrderItem.quantity * Product.cost_price)).join(
            Order, OrderItem.order_id == Order.id
        ).join(
            Product, OrderItem.product_id == Product.id
        ).filter(
            Order.business_id == business_id,
            Order.created_at >= start_date,
            Order.created_at <= end_date,
            Order.status.in_(successful_statuses)
        ).scalar()
        total_cogs = float(total_cogs_result) if total_cogs_result is not None else 0.0
        print(f"Total COGS: {total_cogs}")
        
        # Expenses
        total_expenses_result = db.session.query(func.sum(Expense.amount)).filter(
            Expense.business_id == business_id,
            Expense.expense_date >= start_date,
            Expense.expense_date <= end_date,
            Expense.status == 'APPROVED'
        ).scalar()
        total_expenses = float(total_expenses_result) if total_expenses_result is not None else 0.0
        print(f"Total Expenses: {total_expenses}")

        gross_profit = net_sales - total_cogs
        net_profit = gross_profit - total_expenses
        print(f"Gross Profit: {gross_profit}")
        print(f"Net Profit: {net_profit}")

        print("Test completed successfully!")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
