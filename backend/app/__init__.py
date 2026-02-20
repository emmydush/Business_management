from flask import Flask, send_from_directory, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_mail import Mail, Message
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
from dotenv import load_dotenv
import urllib.parse

# Load environment variables
load_dotenv()

# Initialize extensions
db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()
mail = Mail()  # Initialize mail extension
limiter = Limiter(key_func=get_remote_address, default_limits=["200 per day", "50 per hour"])

def create_app():
    # Set the static folder to the frontend build directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(current_dir)
    grandparent_dir = os.path.dirname(parent_dir)
    
    # Check if we are in Docker (parent_dir is /app) or local (grandparent_dir is root)
    if os.path.exists(os.path.join(parent_dir, 'frontend', 'build')):
        base_dir = parent_dir
    else:
        base_dir = grandparent_dir
        
    frontend_folder = os.path.join(base_dir, 'frontend', 'build')
    
    app = Flask(__name__, static_folder=frontend_folder, static_url_path='/')
    
    # Configuration
    # In production, these MUST be set via environment variables
    is_production = os.getenv('FLASK_ENV') == 'production'
    
    # SECRET_KEY: Use environment variable or generate a warning
    secret_key = os.getenv('SECRET_KEY')
    if not secret_key:
        if is_production:
            raise ValueError("SECRET_KEY must be set in production environment")
        import secrets
        secret_key = secrets.token_hex(32)
        print("WARNING: Using generated SECRET_KEY. Set SECRET_KEY environment variable for production.")
    app.config['SECRET_KEY'] = secret_key
    
    # Handle password with @ in it
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        # Use environment variables for database credentials
        db_user = os.getenv('DB_USER', 'postgres')
        db_password = os.getenv('DB_PASSWORD')
        if not db_password:
            raise ValueError("Database password must be set via DB_PASSWORD environment variable")
        password = urllib.parse.quote_plus(db_password)
        db_host = os.getenv('DB_HOST', 'localhost')
        db_port = os.getenv('DB_PORT', '5432')
        db_name = os.getenv('DB_NAME', 'all_inone')
        db_url = f"postgresql://{db_user}:{password}@{db_host}:{db_port}/{db_name}"
        
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # JWT_SECRET_KEY: Use environment variable or use fixed development key
    jwt_secret = os.getenv('JWT_SECRET_KEY')
    if not jwt_secret:
        if is_production:
            raise ValueError("JWT_SECRET_KEY must be set in production environment")
        # Use a fixed key for development to avoid invalidating tokens on app reload
        jwt_secret = 'dev-secret-key-do-not-use-in-production-1234567890abcdef1234567890abcdef'
        print("WARNING: Using fixed development JWT_SECRET_KEY. Set JWT_SECRET_KEY environment variable for production.")
    app.config['JWT_SECRET_KEY'] = jwt_secret
    
    # Email configuration
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
    app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL', 'false').lower() == 'true'
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@yourcompany.com')
    
    # Initialize rate limiter
    limiter.init_app(app)
    
    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    
    # Configure CORS - restrict to known origins in production
    cors_origins = os.getenv('CORS_ORIGINS')
    if not cors_origins:
        # Default to allowing localhost for development
        cors_origins = ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:3000', 'http://127.0.0.1:5000']
    else:
        # Split by comma if multiple origins are provided
        cors_origins = [origin.strip() for origin in cors_origins.split(',')]
    CORS(app, origins=cors_origins, supports_credentials=True)
    
    # Import models to register them with SQLAlchemy
    from app.models.business import Business
    from app.models.user import User
    from app.models.branch import Branch, UserBranchAccess
    from app.models.employee import Employee
    from app.models.department import Department
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
    from app.models.settings import CompanyProfile, UserPermission, SystemSetting
    from app.models.audit_log import AuditLog
    from app.models.lead import Lead
    from app.models.task import Task
    from app.models.document import Document
    from app.models.warehouse import Warehouse
    from app.models.asset import Asset
    from app.models.subscription import Subscription, Plan
    from app.models.supplier_bill import SupplierBill
    from app.models.service import Service, Appointment, TimeEntry, Quote, QuoteItem
    from app.models.crm import Campaign, CampaignEmail, Segment, SegmentMember, LoyaltyProgram, LoyaltyMember, LoyaltyTransaction, LoyaltyReward
    from app.models.manufacturing import BillOfMaterials, BOMItem, ProductionOrder, ProductionMaterial, ProductionOperation
    from app.models.api_integrations import APIClient, APIAccessToken, WebhookSubscription, WebhookDelivery, Currency, ExchangeRate, CustomField, CustomFieldValue, DocumentTemplate
    from app.models.workflow import Workflow, WorkflowTrigger, WorkflowAction, WorkflowRun, WorkflowActionResult
    
    # Register subscription middleware
    from app.middleware.subscription_middleware import SubscriptionMiddleware
    app.before_request(SubscriptionMiddleware.before_request)
    
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
    from app.routes.audit_log import audit_log_bp
    from app.routes.branches import branches_bp
    from app.routes.subscriptions import subscriptions_bp
    from app.routes.supplier_bills import supplier_bills_bp
    from app.routes.service import service_bp
    from app.routes.crm import crm_bp
    from app.routes.manufacturing import manufacturing_bp
    from app.routes.api import api_bp
    from app.routes.workflows import workflows_bp
    from app.routes.payments import payments_bp
    
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
    app.register_blueprint(audit_log_bp, url_prefix='/api/audit-log')
    app.register_blueprint(branches_bp, url_prefix='/api/branches')
    app.register_blueprint(subscriptions_bp, url_prefix='/api/subscriptions')
    app.register_blueprint(supplier_bills_bp, url_prefix='/api/supplier-bills')
    app.register_blueprint(service_bp, url_prefix='/api/services')
    app.register_blueprint(crm_bp, url_prefix='/api/crm')
    app.register_blueprint(manufacturing_bp, url_prefix='/api/manufacturing')
    app.register_blueprint(api_bp, url_prefix='/api/integrations')
    app.register_blueprint(workflows_bp, url_prefix='/api/workflows')
    app.register_blueprint(payments_bp, url_prefix='/api/payments')
    
    # Configure static file serving for uploaded images
    upload_folder = os.path.join(base_dir, 'static', 'uploads')
    app.config['UPLOAD_FOLDER'] = upload_folder
    os.makedirs(upload_folder, exist_ok=True)
    
    # Serve uploaded files
    @app.route('/uploads/<path:filename>')
    def serve_uploads(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    # Serve frontend static files
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        else:
            return send_from_directory(app.static_folder, 'index.html')

    # Add security headers middleware
    @app.after_request
    def add_security_headers(response):
        # Prevent clickjacking
        response.headers['X-Frame-Options'] = 'DENY'
        # Prevent MIME type sniffing
        response.headers['X-Content-Type-Options'] = 'nosniff'
        # Enable XSS filter (browser should block reflected XSS)
        response.headers['X-XSS-Protection'] = '1; mode=block'
        # Referrer policy for privacy
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        # Content Security Policy
        response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
        # HSTS (only enable in production with proper HTTPS)
        if os.getenv('FLASK_ENV') == 'production':
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response

    # Add a 404 error handler to serve index.html for SPA routing
    @app.errorhandler(404)
    def not_found(e):
        if not request.path.startswith('/api/'):
            return send_from_directory(app.static_folder, 'index.html')
        return e

    return app