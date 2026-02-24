# Business Management System

## Development quality and security

We run a comprehensive set of checks in continuous integration to enforce code quality, formatting and security.

### Python/backend

- `flake8`, `black` (with `--check`), `isort`
- `bandit` and `safety` for static security auditing
- tools are listed in `backend/requirements-dev.txt` and also invoked by the GitHub Actions pipeline.
- a `pyproject.toml` and `.flake8` file configure the formatting rules.

### JavaScript/frontend

- `eslint` (see `.eslintrc.json`) and `prettier` (see `.prettierrc`)
- npm scripts `lint`, `format`, `format:check`, and `audit` were added to `frontend/package.json`.
- `npm audit` runs in CI to highlight vulnerable packages.

> After checking out the repository, install pre‑commit (`pip install pre-commit`) and run `pre-commit install`
> so that local commits are also verified.

Continuous integration (see `.github/workflows/ci-cd.yml`) performs these steps on every push and pull request.
A comprehensive business management system built with Flask (backend) and React (frontend) that helps businesses manage their operations including users, customers, suppliers, inventory, sales, purchases, expenses, and HR functions.

## Features

### Core Modules
- **Authentication & Authorization**: Login/Signup with role-based access (Admin, Manager, Staff)
- **Dashboard**: Analytics and KPIs with visual charts
- **User Management**: Manage system users and roles
- **Customer Management**: CRM with customer profiles and interaction history
- **Supplier Management**: Supplier records and purchase history
- **Inventory Management**: Product and category management with stock tracking
- **Sales Management**: Orders, invoices, and POS system
- **Purchase Management**: Purchase orders and goods receipt
- **Expense Management**: Track business expenses with approval workflow
- **HR Management**: Employee records, attendance, and payroll
- **Reporting**: Sales, financial, and HR reports with export functionality

### Technical Features
- **Backend**: Flask REST API with PostgreSQL database
- **Frontend**: React with Bootstrap UI framework
- **Authentication**: JWT-based authentication
- **Security**: Role-based access control
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

### Backend
- Python 3.8+
- Flask 2.3.3
- Flask-SQLAlchemy
- Flask-JWT-Extended
- Flask-Bcrypt
- PostgreSQL
- Gunicorn

### Frontend
- React 18+
- React Router
- Bootstrap 5
- React Bootstrap
- Chart.js for data visualization

## Installation

### Backend Setup
1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables in `.env` file:
```env
SECRET_KEY=your-super-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production
DATABASE_URL=postgresql://postgres:Jesuslove@12@localhost/all_inone
FLASK_ENV=development
FLASK_DEBUG=True
```

4. Run the application:
```bash
python run.py
```

### Frontend Setup
1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login (login is blocked until a profile picture is uploaded)
- `POST /api/auth/register` - User registration (requires `profile_picture` which must be a URL returned by `/api/auth/upload-profile-picture`)
- `POST /api/auth/upload-profile-picture` - Upload a profile picture (multipart/form-data; returns `url`)
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile (can update `profile_picture`)
- `PUT /api/auth/change-password` - Change password

### Users
- `GET /api/users/` - Get all users
- `POST /api/users/` - Create user
- `GET /api/users/<id>` - Get user by ID
- `PUT /api/users/<id>` - Update user
- `DELETE /api/users/<id>` - Delete user

### Customers
- `GET /api/customers/` - Get all customers
- `POST /api/customers/` - Create customer
- `GET /api/customers/<id>` - Get customer by ID
- `PUT /api/customers/<id>` - Update customer
- `DELETE /api/customers/<id>` - Delete customer

### Products
- `GET /api/inventory/products` - Get all products
- `POST /api/inventory/products` - Create product
- `GET /api/inventory/products/<id>` - Get product by ID
- `PUT /api/inventory/products/<id>` - Update product
- `DELETE /api/inventory/products/<id>` - Delete product

### Sales
- `GET /api/sales/orders` - Get all orders
- `POST /api/sales/orders` - Create order
- `GET /api/sales/orders/<id>` - Get order by ID
- `PUT /api/sales/orders/<id>` - Update order
- `PUT /api/sales/orders/<id>/status` - Update order status

## Database Schema

The system includes the following main tables:
- `users` - System users with roles
- `employees` - Employee information
- `customers` - Customer records
- `suppliers` - Supplier information
- `products` - Product catalog
- `categories` - Product categories
- `orders` - Sales orders
- `order_items` - Order line items
- `invoices` - Invoices
- `purchase_orders` - Purchase orders
- `expenses` - Business expenses
- `attendance` - Employee attendance
- `leave_requests` - Employee leave requests
- `payrolls` - Payroll information

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Role-based access control
- Input validation and sanitization
- SQL injection prevention through ORM

## Role-Based Access

- **Admin**: Full access to all modules
- **Manager**: Access to most modules except user management
- **Staff**: Access to basic modules like sales, inventory, and customer management

## Responsive Design

The frontend is built with Bootstrap to ensure it works well on various screen sizes:
- Desktop: Full feature set
- Tablet: Optimized layout
- Mobile: Touch-friendly interface

## Development

The system follows clean code principles with:
- Modular architecture
- Separation of concerns
- Consistent naming conventions
- Comprehensive error handling
- Proper documentation

## Health check & frontend configuration ✅

- The backend exposes a lightweight public health endpoint at `GET /api/health` that returns 200 when the app and database are reachable.
- The frontend will poll this endpoint to detect when the backend becomes available again (used for retry auto-recovery).
- You can set the frontend API base URL with the environment variable `REACT_APP_API_URL` (defaults to `http://localhost:5000/api`).

## License

>>>>>>> 1207cf7f7215f8b334e827ff889cf04a21663ca7
This project is for educational purposes. For commercial use, please consult with the development team.
```

```

```
