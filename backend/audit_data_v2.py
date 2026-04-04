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
import os

app = create_app()
with app.app_context():
    user = User.query.filter((User.username == 'emmanuel') | (User.email == 'emmanuel')).first()
    output = []
    if not user:
        output.append("User emmanuel not found")
    else:
        bid = user.business_id
        output.append(f"User: {user.username} (ID: {user.id}) Business ID: {bid}")
        
        # Inventory
        products = Product.query.filter_by(business_id=bid).all()
        inv_total = sum(p.stock_quantity * p.cost_price for p in products)
        output.append(f"Products: {len(products)} Total Inv Cost: {inv_total}")
        for p in products:
            output.append(f"  - {p.name}: Qty {p.stock_quantity} Cost {p.cost_price} Total {p.stock_quantity * p.cost_price}")
        
        # Assets
        assets = Asset.query.filter_by(business_id=bid).all()
        asset_total = sum(a.value or 0 for a in assets)
        output.append(f"Assets: {len(assets)} Total Asset Value: {asset_total}")
        for a in assets:
            output.append(f"  - {a.name}: Value {a.value}")
            
        # Invoices (Cash)
        invoices = Invoice.query.filter_by(business_id=bid).all()
        cash_in = sum(i.amount_paid for i in invoices)
        ar_total = sum(i.amount_due for i in invoices)
        output.append(f"Invoices: {len(invoices)} Total Cash In: {cash_in} Total AR: {ar_total}")
        for i in invoices:
            output.append(f"  - Inv {i.invoice_id}: Paid {i.amount_paid} Due {i.amount_due}")
        
        # Expenses
        expenses = Expense.query.filter_by(business_id=bid).all()
        output.append(f"Expenses: {len(expenses)}")
        for e in expenses:
            output.append(f"  - {e.description}: Amt {e.amount} Status {e.status.value}")

    with open('audit_result.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(map(str, output)))
