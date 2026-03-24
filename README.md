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

### Docker Deployment (Recommended)

#### Prerequisites
- Docker Desktop installed on your system
- Git for cloning the repository

#### Quick Start with Docker

1. **Clone the repository** (if not already done):
```bash
git clone <repository-url>
cd "New folder"
```

2. **Create environment file**:
```bash
copy .env.docker .env
```
Edit `.env` and customize the settings, especially:
- `SECRET_KEY` - Generate a strong random key
- `JWT_SECRET_KEY` - Generate a strong random key
- Database credentials (optional, defaults provided)
- Email configuration (optional)

3. **Build and start all services**:
```bash
docker-compose up --build
```

4. **Access the application**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Database: localhost:5432

5. **Default credentials**:
- Username: `superadmin`
- Password: `admin123`
(You'll be prompted to change this on first login)

#### Docker Commands

```bash
# Start services in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Rebuild a specific service
docker-compose build backend
docker-compose build frontend

# Restart a service
docker-compose restart backend

# Run migrations manually
docker-compose exec backend python run_all_migrations.py

# Access backend shell
docker-compose exec backend bash

# Access database shell
docker-compose exec db psql -U postgres -d all_inone
```

#### Production Deployment

For production deployment:

1. Update `.env` with production values:
```env
FLASK_ENV=production
SECRET_KEY=<strong-random-key>
JWT_SECRET_KEY=<strong-random-key>
DB_PASSWORD=<strong-database-password>
```

2. Build and deploy:
```bash
docker-compose -f docker-compose.yml up -d --build
```

3. Monitor health:
```bash
docker-compose ps
docker-compose logs -f backend
```

### Traditional Setup (Development)

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
