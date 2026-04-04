from app import create_app, db
from app.models.product import Product
from app.models.user import User

app = create_app()
with app.app_context():
    user = User.query.filter_by(username='emmanuel').first()
    if user:
        products = Product.query.filter_by(business_id=user.business_id).all()
        print(f"Total products: {len(products)}")
        for p in products:
            print(f" - {p.name}: Stock {p.stock_quantity}")
