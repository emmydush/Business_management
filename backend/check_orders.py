from app import create_app, db
from app.models.order import Order
from datetime import datetime, timedelta

app = create_app()

with app.app_context():
    # Check total orders
    count = Order.query.count()
    print(f"Total orders in database: {count}")
    
    # Check recent orders (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_orders = Order.query.filter(Order.created_at >= thirty_days_ago).all()
    print(f"\nOrders in last 30 days: {len(recent_orders)}")
    
    if recent_orders:
        print("\nRecent orders:")
        for order in recent_orders[:10]:
            print(f"  Order {order.order_id}: Status={order.status}, Total=${order.total_amount}, Date={order.created_at}")
    else:
        print("\nNo orders found in the last 30 days!")
        print("This is why the sales report is empty.")
        
    # Check all order statuses
    if count > 0:
        print("\nOrder status breakdown:")
        statuses = db.session.query(Order.status, db.func.count(Order.id)).group_by(Order.status).all()
        for status, cnt in statuses:
            print(f"  {status}: {cnt} orders")
