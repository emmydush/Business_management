from app import create_app, db
from app.models.product import Product
from app.models.user import User

app = create_app()
with app.app_context():
    user = User.query.filter_by(username='emmanuel').first()
    if user:
        product = Product.query.filter_by(business_id=user.business_id, name='Printer Wireless').first()
        if product:
            product.stock_quantity = 100
            db.session.commit()
            print(f"Stock for '{product.name}' updated to {product.stock_quantity}")
        else:
            print("Product not found")
    else:
        print("User not found")
