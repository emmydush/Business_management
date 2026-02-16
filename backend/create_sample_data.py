from app import create_app, db
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.category import Category
from app.models.order import Order, OrderItem, OrderStatus
from datetime import datetime, timedelta
import random

app = create_app()

def create_sample_data():
    with app.app_context():
        # Check if we already have data
        if User.query.count() > 0:
            print("Data already exists, skipping sample data creation")
            return
            
        print("Creating sample data...")
        
        # Create a test user
        user = User(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            first_name="Test",
            last_name="User",
            role="admin",
            approval_status="approved"
        )
        db.session.add(user)
        db.session.commit()
        
        # Create a business
        from app.models.business import Business
        business = Business(
            name="Test Business",
            owner_id=user.id,
            subscription_status="active"
        )
        db.session.add(business)
        db.session.commit()
        
        # Create categories
        categories = []
        category_names = ["Electronics", "Clothing", "Home & Garden", "Sports", "Books"]
        for name in category_names:
            category = Category(name=name, business_id=business.id)
            db.session.add(category)
            categories.append(category)
        db.session.commit()
        
        # Create products
        products = []
        product_names = [
            "Smartphone", "Laptop", "T-Shirt", "Jeans", "Sneakers",
            "Coffee Maker", "Garden Tools", "Tennis Racket", "Novel", "Headphones"
        ]
        
        for i, name in enumerate(product_names):
            product = Product(
                name=name,
                description=f"High quality {name.lower()}",
                price=random.uniform(10, 500),
                category_id=categories[i % len(categories)].id,
                business_id=business.id,
                stock_quantity=random.randint(10, 100)
            )
            db.session.add(product)
            products.append(product)
        db.session.commit()
        
        # Create customers
        customers = []
        customer_names = [
            ("John", "Doe"), ("Jane", "Smith"), ("Bob", "Johnson"),
            ("Alice", "Brown"), ("Charlie", "Wilson")
        ]
        
        for first, last in customer_names:
            customer = Customer(
                first_name=first,
                last_name=last,
                email=f"{first.lower()}.{last.lower()}@example.com",
                phone=f"+123456789{i}",
                business_id=business.id
            )
            db.session.add(customer)
            customers.append(customer)
        db.session.commit()
        
        # Create orders with random dates in the last 30 days
        statuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, 
                   OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED]
        
        for i in range(50):  # Create 50 sample orders
            # Random date in last 30 days
            days_ago = random.randint(0, 30)
            order_date = datetime.utcnow() - timedelta(days=days_ago)
            
            # Create order
            order = Order(
                customer_id=random.choice(customers).id,
                business_id=business.id,
                total_amount=random.uniform(20, 1000),
                status=random.choice(statuses),
                created_at=order_date
            )
            db.session.add(order)
            db.session.flush()  # Get the order ID
            
            # Add order items
            num_items = random.randint(1, 3)
            for _ in range(num_items):
                product = random.choice(products)
                quantity = random.randint(1, 5)
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=quantity,
                    unit_price=product.price
                )
                db.session.add(order_item)
        
        db.session.commit()
        print("Sample data created successfully!")

if __name__ == "__main__":
    create_sample_data()