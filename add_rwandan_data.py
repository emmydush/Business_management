import os
import sys
import django
from datetime import datetime, timedelta
import random

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Flask app properly
os.chdir('backend')  # Change to backend directory
from app import create_app
from app.models import db, Business, User, Product, Category, Customer, Supplier, Order, OrderItem, Invoice, Expense, Employee, Attendance, LeaveRequest, Payroll, Lead, Task

def add_rwandan_data():
    app = create_app()
    
    with app.app_context():
        # Find the business for user "dush"
        user = User.query.filter_by(username='dush').first()
        if not user:
            print("User 'dush' not found")
            return
        
        business = Business.query.filter_by(id=user.business_id).first()
        if not business:
            print(f"Business for user 'dush' not found")
            return
            
        print(f"Adding Rwandan data for business: {business.name}")
        
        # Add Rwandan categories
        rwandan_categories = [
            {'name': 'Agriculture Products', 'description': 'Rwandan agricultural products'},
            {'name': 'Handicrafts', 'description': 'Traditional Rwandan handicrafts'},
            {'name': 'Coffee & Tea', 'description': 'Rwandan coffee and tea products'},
            {'name': 'Construction Materials', 'description': 'Building materials'},
            {'name': 'Food & Beverages', 'description': 'Local food and beverage items'},
            {'name': 'Electronics', 'description': 'Electronic items'},
            {'name': 'Clothing', 'description': 'Apparel and textiles'},
            {'name': 'Pharmaceuticals', 'description': 'Medicines and health products'},
        ]
        
        categories = []
        for cat_data in rwandan_categories:
            category = Category.query.filter_by(name=cat_data['name'], business_id=business.id).first()
            if not category:
                category = Category(
                    name=cat_data['name'],
                    description=cat_data['description'],
                    business_id=business.id
                )
                db.session.add(category)
                db.session.flush()
            categories.append(category)
        
        # Add Rwandan products
        rwandan_products = [
            {'name': 'Rwandan Coffee Beans', 'category_id': categories[2].id, 'price': 8500, 'cost_price': 6000, 'stock_quantity': 500, 'sku': 'COF-RWA-001'},
            {'name': 'Rwandan Tea', 'category_id': categories[2].id, 'price': 3500, 'cost_price': 2500, 'stock_quantity': 300, 'sku': 'TEA-RWA-001'},
            {'name': 'Bananas (Musambi)', 'category_id': categories[0].id, 'price': 200, 'cost_price': 120, 'stock_quantity': 1000, 'sku': 'BAN-RWA-001'},
            {'name': 'Sweet Potatoes', 'category_id': categories[0].id, 'price': 300, 'cost_price': 180, 'stock_quantity': 800, 'sku': 'POT-RWA-001'},
            {'name': 'Beans (Nyiramacuku)', 'category_id': categories[0].id, 'price': 400, 'cost_price': 250, 'stock_quantity': 600, 'sku': 'BEA-RWA-001'},
            {'name': 'Handwoven Baskets', 'category_id': categories[1].id, 'price': 15000, 'cost_price': 10000, 'stock_quantity': 50, 'sku': 'BAS-RWA-001'},
            {'name': 'Imigongo Artwork', 'category_id': categories[1].id, 'price': 25000, 'cost_price': 18000, 'stock_quantity': 25, 'sku': 'ART-RWA-001'},
            {'name': 'Cement (50kg)', 'category_id': categories[3].id, 'price': 28000, 'cost_price': 24000, 'stock_quantity': 100, 'sku': 'CEM-RWA-001'},
            {'name': 'Bricks (100 pieces)', 'category_id': categories[3].id, 'price': 12000, 'cost_price': 10000, 'stock_quantity': 500, 'sku': 'BRI-RWA-001'},
            {'name': 'Urwagwa (Traditional Banana Wine)', 'category_id': categories[4].id, 'price': 2500, 'cost_price': 1800, 'stock_quantity': 200, 'sku': 'WIN-RWA-001'},
            {'name': 'Samsung Galaxy A04', 'category_id': categories[5].id, 'price': 125000, 'cost_price': 110000, 'stock_quantity': 20, 'sku': 'PHO-RWA-001'},
            {'name': 'Kigali Beer (1 bottle)', 'category_id': categories[4].id, 'price': 800, 'cost_price': 600, 'stock_quantity': 500, 'sku': 'BEER-RWA-001'},
            {'name': 'Kitenge Fabric', 'category_id': categories[6].id, 'price': 8000, 'cost_price': 6000, 'stock_quantity': 150, 'sku': 'FAB-RWA-001'},
            {'name': 'Paracetamol 500mg', 'category_id': categories[7].id, 'price': 200, 'cost_price': 120, 'stock_quantity': 1000, 'sku': 'PAR-RWA-001'},
        ]
        
        products = []
        for prod_data in rwandan_products:
            product = Product.query.filter_by(sku=prod_data['sku'], business_id=business.id).first()
            if not product:
                product = Product(
                    name=prod_data['name'],
                    category_id=prod_data['category_id'],
                    price=prod_data['price'],
                    cost_price=prod_data['cost_price'],
                    stock_quantity=prod_data['stock_quantity'],
                    sku=prod_data['sku'],
                    business_id=business.id
                )
                db.session.add(product)
                db.session.flush()
            products.append(product)
        
        # Add Rwandan customers
        rwandan_customers = [
            {'name': 'Kigali City Hall', 'email': 'info@kigali.gov.rw', 'phone': '+250 788 123 456', 'address': 'KN 1 Ave, Kigali'},
            {'name': 'University of Rwanda', 'email': 'info@ur.ac.rw', 'phone': '+250 788 456 789', 'address': 'Huye, Southern Province'},
            {'name': 'Kigali Genocide Memorial', 'email': 'info@memoryofgenocide.rw', 'phone': '+250 788 789 012', 'address': 'Gasabo, Kigali'},
            {'name': 'Rwanda Development Board', 'email': 'info@rdb.rw', 'phone': '+250 788 012 345', 'address': 'Kigali'},
            {'name': 'Bank of Kigali', 'email': 'info@bkrwanda.com', 'phone': '+250 788 345 678', 'address': 'KN 4 Ave, Kigali'},
            {'name': 'Sage Hotel Kigali', 'email': 'info@sagehotelkigali.com', 'phone': '+250 788 567 890', 'address': 'KN 3 Ave, Kigali'},
            {'name': 'Rwanda Coffee Limited', 'email': 'info@rwandacoffee.com', 'phone': '+250 788 678 901', 'address': 'Muhanga, Southern Province'},
            {'name': 'Bralirwa Ltd', 'email': 'info@bralirwa.com', 'phone': '+250 788 789 012', 'address': 'Gisenyi, Northern Province'},
        ]
        
        customers = []
        for cust_data in rwandan_customers:
            customer = Customer.query.filter_by(email=cust_data['email'], business_id=business.id).first()
            if not customer:
                customer = Customer(
                    name=cust_data['name'],
                    email=cust_data['email'],
                    phone=cust_data['phone'],
                    address=cust_data['address'],
                    business_id=business.id
                )
                db.session.add(customer)
                db.session.flush()
            customers.append(customer)
        
        # Add Rwandan suppliers
        rwandan_suppliers = [
            {'name': 'Rwanda Coffee Company', 'email': 'supply@rwandacoffee.com', 'phone': '+250 788 111 222', 'address': 'Huye, Southern Province'},
            {'name': 'Rwanda Tea Factory', 'email': 'supply@rwandatea.rw', 'phone': '+250 788 222 333', 'address': 'Rulindo, Northern Province'},
            {'name': 'Kigali Construction Materials', 'email': 'supply@kigalicm.rw', 'phone': '+250 788 333 444', 'address': 'Gasabo, Kigali'},
            {'name': 'Rwanda Pharmaceuticals', 'email': 'supply@rwandapharma.rw', 'phone': '+250 788 444 555', 'address': 'Kicukiro, Kigali'},
            {'name': 'Artisan Cooperative', 'email': 'supply@artisancoop.rw', 'phone': '+250 788 555 666', 'address': 'Nyamata, Eastern Province'},
        ]
        
        suppliers = []
        for supp_data in rwandan_suppliers:
            supplier = Supplier.query.filter_by(email=supp_data['email'], business_id=business.id).first()
            if not supplier:
                supplier = Supplier(
                    name=supp_data['name'],
                    email=supp_data['email'],
                    phone=supp_data['phone'],
                    address=supp_data['address'],
                    business_id=business.id
                )
                db.session.add(supplier)
                db.session.flush()
            suppliers.append(supplier)
        
        # Add Rwandan employees
        rwandan_employees = [
            {'name': 'Jean Claude Nkurunziza', 'email': 'jcn@company.rw', 'phone': '+250 788 666 777', 'position': 'Manager', 'department': 'Management', 'salary': 1200000},
            {'name': 'Ange Uwera', 'email': 'au@company.rw', 'phone': '+250 788 777 888', 'position': 'Sales Representative', 'department': 'Sales', 'salary': 600000},
            {'name': 'Pierre Niyigena', 'email': 'pn@company.rw', 'phone': '+250 788 888 999', 'position': 'Accountant', 'department': 'Finance', 'salary': 750000},
            {'name': 'Marie Umutoni', 'email': 'mu@company.rw', 'phone': '+250 788 999 000', 'position': 'HR Manager', 'department': 'Human Resources', 'salary': 800000},
            {'name': 'Samuel Mugisha', 'email': 'sm@company.rw', 'phone': '+250 788 000 111', 'position': 'Warehouse Manager', 'department': 'Operations', 'salary': 650000},
        ]
        
        employees = []
        for emp_data in rwandan_employees:
            user_exists = User.query.filter_by(email=emp_data['email']).first()
            if user_exists:
                continue  # Skip if user already exists
            
            # Create user for employee
            new_user = User(
                username=emp_data['email'].split('@')[0],
                email=emp_data['email'],
                role='staff',
                business_id=business.id
            )
            new_user.set_password('Rwanda@2025')  # Set a default password
            db.session.add(new_user)
            db.session.flush()
            
            employee = Employee(
                name=emp_data['name'],
                email=emp_data['email'],
                phone=emp_data['phone'],
                position=emp_data['position'],
                department=emp_data['department'],
                salary=emp_data['salary'],
                user_id=new_user.id,
                business_id=business.id
            )
            db.session.add(employee)
            db.session.flush()
            employees.append(employee)
        
        # Add some sample orders
        for i in range(10):
            order_date = datetime.now() - timedelta(days=random.randint(1, 90))
            customer = random.choice(customers)
            
            order = Order(
                customer_id=customer.id,
                total_amount=random.randint(50000, 500000),
                status=random.choice(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
                business_id=business.id,
                user_id=user.id
            )
            db.session.add(order)
            db.session.flush()
            
            # Add order items
            num_items = random.randint(1, 5)
            for j in range(num_items):
                product = random.choice(products)
                quantity = random.randint(1, 10)
                unit_price = product.price
                
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=quantity,
                    unit_price=unit_price
                )
                db.session.add(order_item)
        
        # Add some invoices
        for i in range(8):
            order = Order.query.filter_by(business_id=business.id).offset(i).first()
            if order:
                invoice = Invoice(
                    order_id=order.id,
                    customer_id=order.customer_id,
                    total_amount=order.total_amount,
                    status=random.choice(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
                    business_id=business.id
                )
                db.session.add(invoice)
        
        # Add some expenses
        expense_categories = ['Rent', 'Utilities', 'Salaries', 'Marketing', 'Transport', 'Office Supplies', 'Maintenance', 'Insurance']
        for i in range(15):
            expense_date = datetime.now() - timedelta(days=random.randint(1, 90))
            expense = Expense(
                description=f'{random.choice(expense_categories)} expense',
                amount=random.randint(100000, 5000000),
                category=random.choice(expense_categories),
                date=expense_date,
                business_id=business.id
            )
            db.session.add(expense)
        
        # Add some leads
        lead_sources = ['Website', 'Referral', 'Advertisement', 'Social Media', 'Trade Show']
        lead_statuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
        
        for i in range(12):
            lead = Lead(
                name=f'Lead {i+1}',
                email=f'lead{i+1}@example.rw',
                phone=f'+250 788 {str(i+1).zfill(3)} {str(i+1).zfill(3)}',
                company=f'Company {i+1}',
                status=random.choice(lead_statuses),
                source=random.choice(lead_sources),
                value=random.randint(500000, 5000000),
                notes=f'Notes about lead {i+1}',
                business_id=business.id
            )
            db.session.add(lead)
        
        # Add some tasks
        task_priorities = ['low', 'medium', 'high', 'critical']
        task_statuses = ['pending', 'in-progress', 'completed']
        
        for i in range(10):
            task = Task(
                title=f'Task {i+1}: {random.choice(["Update documentation", "Review reports", "Client meeting", "System maintenance", "Team training"])}',
                description=f'Detailed description for task {i+1}',
                priority=random.choice(task_priorities),
                status=random.choice(task_statuses),
                due_date=datetime.now() + timedelta(days=random.randint(1, 30)),
                business_id=business.id
            )
            db.session.add(task)
        
        # Add some attendance records
        for employee in employees[:3]:  # Only for first 3 employees
            for day in range(30):  # Last 30 days
                date = datetime.now() - timedelta(days=day)
                # Randomly decide if employee was present (80% chance)
                if random.random() > 0.2:
                    attendance = Attendance(
                        employee_id=employee.id,
                        date=date.date(),
                        check_in=f'{random.randint(7, 10):02d}:{random.randint(0, 59):02d}',
                        check_out=f'{random.randint(16, 18):02d}:{random.randint(0, 59):02d}',
                        status='present',
                        business_id=business.id
                    )
                    db.session.add(attendance)
        
        # Add some leave requests
        leave_types = ['Annual', 'Sick', 'Maternity', 'Paternity', 'Study']
        for employee in employees[:2]:  # Only for first 2 employees
            for i in range(2):
                start_date = datetime.now() + timedelta(days=random.randint(1, 60))
                end_date = start_date + timedelta(days=random.randint(3, 14))
                
                leave_request = LeaveRequest(
                    employee_id=employee.id,
                    leave_type=random.choice(leave_types),
                    start_date=start_date.date(),
                    end_date=end_date.date(),
                    reason=f'Reason for leave {i+1}',
                    status=random.choice(['pending', 'approved', 'rejected']),
                    days_requested=(end_date - start_date).days + 1,
                    business_id=business.id
                )
                db.session.add(leave_request)
        
        # Add some payroll records
        for employee in employees:
            for month_offset in range(3):  # Last 3 months
                pay_date = datetime.now() - timedelta(days=month_offset * 30)
                
                # Calculate some deductions
                tax = int(employee.salary * 0.15)  # 15% tax
                nssf = int(employee.salary * 0.03)  # 3% NSSF
                other_deductions = random.randint(0, 50000)
                
                net_salary = employee.salary - tax - nssf - other_deductions
                
                payroll = Payroll(
                    employee_id=employee.id,
                    pay_period_start=pay_date.replace(day=1),
                    pay_period_end=pay_date.replace(day=1) + timedelta(days=30),
                    basic_salary=employee.salary,
                    tax_deduction=tax,
                    nssf_deduction=nssf,
                    other_deductions=other_deductions,
                    net_salary=net_salary,
                    payment_date=pay_date,
                    business_id=business.id
                )
                db.session.add(payroll)
        
        # Commit all changes
        db.session.commit()
        print(f"Successfully added Rwandan data for business: {business.name}")

if __name__ == "__main__":
    add_rwandan_data()