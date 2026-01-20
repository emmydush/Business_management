
from app import create_app, db
from app.models.user import User
from app.models.order import Order
from app.models.customer import Customer
from app.models.product import Product
from app.models.expense import Expense
from sqlalchemy import func

app = create_app()

with app.app_context():
    # Find user
    search_term = "emmanuel"
    users = User.query.filter(
        (User.username.ilike(f'%{search_term}%')) | 
        (User.email.ilike(f'%{search_term}%')) |
        (User.first_name.ilike(f'%{search_term}%'))
    ).all()

    with open('inspection_result.txt', 'w') as f:
        if not users:
            f.write(f"No user found matching '{search_term}'\n")
        else:
            for user in users:
                f.write(f"--- User: {user.username} (ID: {user.id}) ---\n")
                f.write(f"  Email: {user.email}\n")
                f.write(f"  Role: {user.role}\n")
                f.write(f"  Business ID: {user.business_id}\n")
                # f.write(f"  Branch ID: {user.branch_id}\n") 
                
                if user.business_id:
                    # Check Orders
                    order_count = Order.query.filter_by(business_id=user.business_id).count()
                    f.write(f"  Total Orders (Business {user.business_id}): {order_count}\n")
                    
                    # Check Order Branch IDs
                    order_branches = db.session.query(Order.branch_id, func.count(Order.id)).filter_by(business_id=user.business_id).group_by(Order.branch_id).all()
                    f.write(f"  Order Branch Distribution: {order_branches}\n")
                    
                    # Check Order Statuses
                    status_counts = db.session.query(Order.status, func.count(Order.id)).filter_by(business_id=user.business_id).group_by(Order.status).all()
                    f.write(f"  Order Statuses: {status_counts}\n")

                    # Check Customers
                    customer_count = Customer.query.filter_by(business_id=user.business_id).count()
                    f.write(f"  Total Customers: {customer_count}\n")
                    
                    # Check Customer Branch IDs
                    customer_branches = db.session.query(Customer.branch_id, func.count(Customer.id)).filter_by(business_id=user.business_id).group_by(Customer.branch_id).all()
                    f.write(f"  Customer Branch Distribution: {customer_branches}\n")

                    # Check Products
                    product_count = Product.query.filter_by(business_id=user.business_id).count()
                    f.write(f"  Total Products: {product_count}\n")
                    
                    # Check Product Branch IDs
                    product_branches = db.session.query(Product.branch_id, func.count(Product.id)).filter_by(business_id=user.business_id).group_by(Product.branch_id).all()
                    f.write(f"  Product Branch Distribution: {product_branches}\n")
                    
                    # Check Expenses
                    expense_count = Expense.query.filter_by(business_id=user.business_id).count()
                    f.write(f"  Total Expenses: {expense_count}\n")
                else:
                    f.write("  No Business ID associated.\n")
                f.write("\n")
