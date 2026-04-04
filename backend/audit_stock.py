from app import create_app, db
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User

app = create_app()
with app.app_context():
    user = User.query.filter_by(username='emmanuel').first()
    if user:
        bid = user.business_id
        product = Product.query.filter_by(business_id=bid, name='Printer Wireless').first()
        if product:
            print(f"Product ID: {product.id} Name: {product.name} Stock: {product.stock_quantity}")
            
        orders = Order.query.filter_by(business_id=bid).all()
        for o in orders:
            print(f"Order: {o.order_id} Status {o.status.value}")
            items = OrderItem.query.filter_by(order_id=o.id).all()
            for item in items:
                print(f"  - Item {item.product.name if item.product else 'Unknown'} Qty {item.quantity}")
