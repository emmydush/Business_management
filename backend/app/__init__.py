from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import os
from dotenv import load_dotenv
import urllib.parse

# Load environment variables
load_dotenv()

# Initialize extensions
db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
    
    # Handle password with @ in it
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        password = urllib.parse.quote_plus("Jesuslove@12")
        db_url = f"postgresql://postgres:{password}@localhost/all_inone"
        
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-string')
    
    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    CORS(app)
    
    # Import models to register them with SQLAlchemy
    from app.models.business import Business
    from app.models.user import User
    from app.models.employee import Employee
    from app.models.customer import Customer
    from app.models.supplier import Supplier
    from app.models.category import Category
    from app.models.product import Product
    from app.models.order import Order, OrderItem
    from app.models.invoice import Invoice
    from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
    from app.models.expense import Expense
    from app.models.inventory_transaction import InventoryTransaction
    from app.models.attendance import Attendance
    from app.models.leave_request import LeaveRequest, LeaveType, LeaveStatus
    from app.models.payroll import Payroll, PayrollStatus
    from app.models.returns import Return, ReturnItem
    from app.models.communication import Notification, Message, Announcement
    from app.models.settings import CompanyProfile, UserPermission, SystemSetting, AuditLog
    from app.models.lead import Lead
    from app.models.task import Task
    from app.models.document import Document
    from app.models.warehouse import Warehouse
    from app.models.asset import Asset
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.users import users_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.customers import customers_bp
    from app.routes.suppliers import suppliers_bp
    from app.routes.inventory import inventory_bp
    from app.routes.sales import sales_bp
    from app.routes.purchases import purchases_bp
    from app.routes.expenses import expenses_bp
    from app.routes.hr import hr_bp
    from app.routes.invoices import invoices_bp
    from app.routes.reports import reports_bp
    from app.routes.returns import returns_bp
    from app.routes.communication import communication_bp
    from app.routes.settings import settings_bp
    from app.routes.superadmin import superadmin_bp
    from app.routes.status import status_bp
    from app.routes.leads import leads_bp
    from app.routes.tasks import tasks_bp
    from app.routes.projects import projects_bp
    from app.routes.documents import documents_bp
    from app.routes.warehouse import warehouse_bp
    from app.routes.assets import assets_bp
    from app.routes.taxes import taxes_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(customers_bp, url_prefix='/api/customers')
    app.register_blueprint(suppliers_bp, url_prefix='/api/suppliers')
    app.register_blueprint(inventory_bp, url_prefix='/api/inventory')
    app.register_blueprint(sales_bp, url_prefix='/api/sales')
    app.register_blueprint(purchases_bp, url_prefix='/api/purchases')
    app.register_blueprint(expenses_bp, url_prefix='/api/expenses')
    app.register_blueprint(hr_bp, url_prefix='/api/hr')
    app.register_blueprint(invoices_bp, url_prefix='/api/invoices')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(returns_bp, url_prefix='/api/returns')
    app.register_blueprint(communication_bp, url_prefix='/api/communication')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')
    app.register_blueprint(superadmin_bp, url_prefix='/api/superadmin')
    app.register_blueprint(status_bp, url_prefix='/api')
    app.register_blueprint(leads_bp, url_prefix='/api/leads')
    app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
    app.register_blueprint(projects_bp, url_prefix='/api/projects')
    app.register_blueprint(documents_bp, url_prefix='/api/documents')
    app.register_blueprint(warehouse_bp, url_prefix='/api/warehouses')
    app.register_blueprint(assets_bp, url_prefix='/api/assets')
    app.register_blueprint(taxes_bp, url_prefix='/api/taxes')
    
    # Create tables
    with app.app_context():
        db.create_all()
        
        # Create default superadmin user if not exists
        from app.models.user import User, UserRole
        try:
            superadmin_user = User.query.filter_by(username='superadmin').first()
            if not superadmin_user:
                superadmin = User(
                    username='superadmin',
                    email='superadmin@business.com',
                    first_name='Super',
                    last_name='Admin',
                    role=UserRole.superadmin
                )
                superadmin.set_password('admin123')
                db.session.add(superadmin)
                db.session.commit()
        except Exception as e:
            # If there's a database schema mismatch, log warning and continue
            print(f"Warning: Could not create/update superadmin user: {e}")
            db.session.rollback()  # Rollback the failed transaction
    
    return app