from app import create_app, db
from app.models.product import Product
from app.models.asset import Asset
from app.models.user import User
from app.models.invoice import Invoice
from app.models.expense import Expense
from app.models.order import Order
from app.models.payroll import Payroll
from app.models.supplier_bill import SupplierBill
from sqlalchemy import func

app = create_app()
with app.app_context():
    user = User.query.filter((User.username == 'emmanuel') | (User.email == 'emmanuel')).first()
    if not user:
        print("User emmanuel not found")
        exit()
    
    bid = user.business_id
    print(f"User: {user.username} (ID: {user.id}) Business ID: {bid}")
    
    # Inventory
    products = Product.query.filter_by(business_id=bid).all()
    inv_total = sum(p.stock_quantity * p.cost_price for p in products)
    print(f"Products: {len(products)} Total Inv Cost: {inv_total}")
    for p in products[:5]:
        print(f"  - {p.name}: Qty {p.stock_quantity} Rate {p.cost_price}")
    
    # Assets
    assets = Asset.query.filter_by(business_id=bid).all()
    asset_total = sum(a.value or 0 for a in assets)
    print(f"Assets: {len(assets)} Total Asset Value: {asset_total}")
    for a in assets[:5]:
        print(f"  - {a.name}: Value {a.value}")
        
    # Invoices (Cash)
    invoices = Invoice.query.filter_by(business_id=bid).all()
    cash_in = sum(i.amount_paid for i in invoices)
    ar_total = sum(i.amount_due for i in invoices)
    print(f"Invoices: {len(invoices)} Total Cash In: {cash_in} Total AR: {ar_total}")
    
    # Expenses
    expenses = Expense.query.filter_by(business_id=bid).all()
    exp_total = sum(e.amount for e in expenses)
    print(f"Expenses: {len(expenses)} Total Expenses: {exp_total}")
    for e in expenses:
        print(f"  - {e.description}: Amt {e.amount} Status {e.status.value}")
