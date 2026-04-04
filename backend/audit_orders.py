from app import create_app, db
from app.models.order import Order
from app.models.user import User

app = create_app()
with app.app_context():
    user = User.query.filter_by(username='emmanuel').first()
    if user:
        bid = user.business_id
        orders = Order.query.filter_by(business_id=bid).all()
        print(f"Orders: {len(orders)}")
        for o in orders:
            print(f"  - Order {o.order_id}: Total {o.total_amount} Status {o.status.value} Created {o.created_at}")
