from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import os
from dotenv import load_dotenv
from urllib.parse import urlparse, quote, unquote

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
    # Get database URL and handle URL encoding for special characters in password
    raw_database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:Jesuslove%4012@localhost:5432/all_inone')
    
    # Parse the database URL to properly handle special characters in password
    if raw_database_url.startswith('postgresql://'):
        # Parse the URL to extract components
        parsed = urlparse(raw_database_url)
        username = parsed.username
        # URL decode the password to handle special characters properly
        password = unquote(parsed.password) if parsed.password else ''
        hostname = parsed.hostname
        port = parsed.port or 5432
        database = parsed.path.lstrip('/')
        
        # Reconstruct the URL with properly decoded password
        app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{username}:{password}@{hostname}:{port}/{database}'
    else:
        app.config['SQLALCHEMY_DATABASE_URI'] = raw_database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-string')
    
    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    CORS(app)
    
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
    from app.routes.reports import reports_bp
    from app.routes.leads import leads_bp
    from app.routes.status import status_bp
    
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
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(leads_bp, url_prefix='/api/leads')
    app.register_blueprint(status_bp, url_prefix='/api')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)