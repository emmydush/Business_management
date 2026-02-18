import sys
import os
from datetime import datetime, timedelta
import random

# Add the current directory to sys.path to import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User, UserRole, UserApprovalStatus
from app.models.category import Category
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderItem, OrderStatus
from app.models.employee import Employee
from app.models.expense import Expense
from app.models.attendance import Attendance
from app.models.leave_request import LeaveRequest, LeaveType, LeaveStatus
from app.models.payroll import Payroll, PayrollStatus

def seed_data():
    app = create_app()
    with app.app_context():
        print("Starting database seeding...")

        # 1. Categories
        categories_data = [
            {'name': 'Electronics', 'description': 'Gadgets and electronic devices'},
            {'name': 'Fashion', 'description': 'Clothing and accessories'},
            {'name': 'Home & Garden', 'description': 'Furniture and home decor'},
            {'name': 'Beauty', 'description': 'Cosmetics and personal care'},
            {'name': 'Sports', 'description': 'Sports equipment and apparel'}
        ]
        
        categories = []
        for cat_data in categories_data:
            category = Category.query.filter_by(name=cat_data['name']).first()
            if not category:
                category = Category(**cat_data)
                db.session.add(category)
                print(f"Added category: {cat_data['name']}")
            categories.append(category)
        db.session.commit()

        # 2. Suppliers
        suppliers_data = [
            {'supplier_id': 'SUP001', 'company_name': 'TechWorld Solutions', 'contact_person': 'John Tech', 'email': 'john@techworld.com', 'phone': '123-456-7890'},
            {'supplier_id': 'SUP002', 'company_name': 'Fashion Hub', 'contact_person': 'Jane Fashion', 'email': 'jane@fashionhub.com', 'phone': '234-567-8901'},
            {'supplier_id': 'SUP003', 'company_name': 'Home Essentials', 'contact_person': 'Bob Home', 'email': 'bob@homeessentials.com', 'phone': '345-678-9012'}
        ]
        
        suppliers = []
        for sup_data in suppliers_data:
            supplier = Supplier.query.filter_by(supplier_id=sup_data['supplier_id']).first()
            if not supplier:
                supplier = Supplier(**sup_data)
                db.session.add(supplier)
                print(f"Added supplier: {sup_data['company_name']}")
            suppliers.append(supplier)
        db.session.commit()

        # 3. Products
        products_data = [
            {'product_id': 'PROD001', 'name': 'iPhone 15 Pro', 'description': 'Latest Apple smartphone', 'unit_price': 999.99, 'cost_price': 700.00, 'stock_quantity': 50, 'category_id': categories[0].id, 'supplier_id': suppliers[0].id},
            {'product_id': 'PROD002', 'name': 'MacBook Air M2', 'description': 'Slim and powerful laptop', 'unit_price': 1199.99, 'cost_price': 850.00, 'stock_quantity': 30, 'category_id': categories[0].id, 'supplier_id': suppliers[0].id},
            {'product_id': 'PROD003', 'name': 'Designer Jeans', 'description': 'Premium denim jeans', 'unit_price': 89.99, 'cost_price': 40.00, 'stock_quantity': 100, 'category_id': categories[1].id, 'supplier_id': suppliers[1].id},
            {'product_id': 'PROD004', 'name': 'Cotton T-Shirt', 'description': 'Comfortable daily wear', 'unit_price': 19.99, 'cost_price': 8.00, 'stock_quantity': 200, 'category_id': categories[1].id, 'supplier_id': suppliers[1].id},
            {'product_id': 'PROD005', 'name': 'Modern Sofa', 'description': 'Elegant 3-seater sofa', 'unit_price': 599.99, 'cost_price': 350.00, 'stock_quantity': 10, 'category_id': categories[2].id, 'supplier_id': suppliers[2].id},
            {'product_id': 'PROD006', 'name': 'Coffee Table', 'description': 'Minimalist wooden table', 'unit_price': 149.99, 'cost_price': 80.00, 'stock_quantity': 25, 'category_id': categories[2].id, 'supplier_id': suppliers[2].id}
        ]
        
        products = []
        for prod_data in products_data:
            product = Product.query.filter_by(product_id=prod_data['product_id']).first()
            if not product:
                product = Product(**prod_data)
                db.session.add(product)
                print(f"Added product: {prod_data['name']}")
            products.append(product)
        db.session.commit()

        # 4. Customers
        customers_data = [
            {'customer_id': 'CUST001', 'first_name': 'Alice', 'last_name': 'Smith', 'email': 'alice@example.com', 'phone': '555-0101'},
            {'customer_id': 'CUST002', 'first_name': 'Bob', 'last_name': 'Johnson', 'email': 'bob@example.com', 'phone': '555-0102'},
            {'customer_id': 'CUST003', 'first_name': 'Charlie', 'last_name': 'Brown', 'email': 'charlie@example.com', 'phone': '555-0103'},
            {'customer_id': 'CUST004', 'first_name': 'Diana', 'last_name': 'Prince', 'email': 'diana@example.com', 'phone': '555-0104'}
        ]
        
        customers = []
        for cust_data in customers_data:
            customer = Customer.query.filter_by(customer_id=cust_data['customer_id']).first()
            if not customer:
                customer = Customer(**cust_data)
                db.session.add(customer)
                print(f"Added customer: {cust_data['first_name']} {cust_data['last_name']}")
            customers.append(customer)
        db.session.commit()

        # 5. Orders
        admin_user = User.query.filter_by(role=UserRole.ADMIN).first()
        if not Order.query.first():
            for i in range(10):
                customer = random.choice(customers)
                order = Order(
                    order_id=f'ORD{1000+i}',
                    customer_id=customer.id,
                    user_id=admin_user.id,
                    status=random.choice(list(OrderStatus)),
                    total_amount=0,
                    created_at=datetime.utcnow() - timedelta(days=random.randint(0, 30))
                )
                db.session.add(order)
                db.session.flush() # Get order ID
                
                # Add 1-3 items to each order
                total = 0
                for _ in range(random.randint(1, 3)):
                    product = random.choice(products)
                    quantity = random.randint(1, 5)
                    price = float(product.unit_price)
                    item_total = price * quantity
                    
                    item = OrderItem(
                        order_id=order.id,
                        product_id=product.id,
                        quantity=quantity,
                        unit_price=price,
                        line_total=item_total
                    )
                    db.session.add(item)
                    total += item_total
                
                order.total_amount = total
                order.subtotal = total
            print("Added 10 sample orders")
            db.session.commit()

        # 6. Employees
        admin_user = User.query.filter_by(role=UserRole.ADMIN).first()
        if not Employee.query.first():
            # Create some users first
            users_data = [
                {'username': 'manager1', 'email': 'manager1@business.com', 'first_name': 'Mike', 'last_name': 'Manager', 'role': UserRole.MANAGER},
                {'username': 'staff1', 'email': 'staff1@business.com', 'first_name': 'Sarah', 'last_name': 'Staff', 'role': UserRole.STAFF},
                {'username': 'staff2', 'email': 'staff2@business.com', 'first_name': 'Steve', 'last_name': 'Staff', 'role': UserRole.STAFF}
            ]
            
            for u_data in users_data:
                user = User.query.filter_by(username=u_data['username']).first()
                if not user:
                    u_data.setdefault('profile_picture', 'https://via.placeholder.com/80')
                    u_data.setdefault('approval_status', UserApprovalStatus.APPROVED)
                    u_data.setdefault('is_active', True)
                    user = User(**u_data)
                    user.set_password('password123')
                    db.session.add(user)
                    db.session.flush()
                    
                    employee = Employee(
                        user_id=user.id,
                        employee_id=f'EMP{random.randint(100, 999)}',
                        department='Operations',
                        position=u_data['role'].value.capitalize(),
                        hire_date=(datetime.utcnow() - timedelta(days=random.randint(100, 500))).date(),
                        salary=random.randint(3000, 6000)
                    )
                    db.session.add(employee)
            print("Added sample employees")
            db.session.commit()

        # 7. Expenses
        from app.models.expense import ExpenseCategory, ExpenseStatus
        if not Expense.query.first():
            categories_list = list(ExpenseCategory)
            for i in range(5):
                expense = Expense(
                    expense_id=f'EXP{100+i}',
                    description=f'Monthly {random.choice(categories_list).value}',
                    category=random.choice(categories_list),
                    amount=random.uniform(100, 2000),
                    expense_date=datetime.utcnow().date() - timedelta(days=random.randint(0, 30)),
                    status=ExpenseStatus.PAID,
                    created_by=admin_user.id
                )
                db.session.add(expense)
            print("Added sample expenses")
            db.session.commit()


        print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_data()
