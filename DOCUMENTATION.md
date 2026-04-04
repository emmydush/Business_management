# AfriBiz - Business Management System Documentation

## 1. Executive Summary
**AfriBiz** (formerly BusinessOS) is a comprehensive, multi-tenant Business Management System designed to streamline operations for small to medium-sized enterprises (SMEs). The platform provides a centralized dashboard for managing inventory, sales, purchases, branches, and financial reporting, with a strong emphasis on security, scalability, and user-friendly interfaces.

---

## 2. Core Features

### 2.1. Multi-Branch Management
- **Centralized Control**: Manage multiple physical locations from a single account.
- **Branch Switching**: Seamlessly switch between branches in the UI to view location-specific data.
- **Data Isolation**: Ensure that inventory and sales data are tracked per branch while maintaining business-wide visibility for administrators.

### 2.2. Inventory & Product Management
- **Product Tracking**: Track stock levels across different branches.
- **Bulk Import**: Support for bulk product uploads via CSV/Excel.
- **Barcode System**: Integrated barcode generation and scanning for quick product lookup and checkout.
- **Categories & Pricing**: Organize products by categories and manage pricing strategies.

### 2.3. Sales & Point of Sale (POS)
- **POS Interface**: A fast and responsive interface for walk-in customers.
- **Invoicing**: Automatic invoice generation with PDF export support.
- **Transaction History**: Real-time tracking of all sales transactions.
- **Payment Methods**: Support for multiple payment types (Cash, Card, Mobile Money).

### 2.4. Purchases & Supplier Management
- **Purchase Orders**: Manage replenishment of stock from suppliers.
- **Supplier Tracking**: Maintain a database of suppliers and their transaction history.
- **Expense Tracking**: Log and categorize business expenses.

### 2.5. Financial Reporting & Analytics
- **Cash Flow Statements**: Real-time visibility into cash inflows and outflows.
- **Profit & Loss**: automated calculation of margins and net profit.
- **Interactive Dashboards**: Data visualization using Charts to track performance trends.
- **Custom Reports**: Generate filtered reports by date range, branch, or product category.

### 2.6. User Roles & Access Control
- **Role-Based Access Control (RBAC)**: Defined roles including SuperAdmin, Admin, Manager, and Staff.
- **Multi-Factor Authentication (MFA)**: Enhanced security via TOTP (Time-based One-Time Password) and backup codes.
- **Approval System**: New user registrations can require administrator approval.

### 2.7. Subscription Management (SuperAdmin)
- **Plan Management**: Create and manage different subscription tiers for business clients.
- **Business Approval**: SuperAdmins can approve or suspend entire business accounts.

---

## 3. Technology Stack

### 3.1. Backend (Python)
- **Framework**: Flask (v3.0+)
- **ORM**: SQLAlchemy (v2.0+) with Flask-SQLAlchemy
- **Security**: Flask-JWT-Extended (Authentication), Flask-Bcrypt (Hashing), Flask-Talisman (Security headers)
- **Data Processing**: Pandas & NumPy for complex financial calculation
- **Exporting**: ReportLab for PDF generation, OpenPyXL for Excel exports
- **Caching/Rate Limiting**: Redis with Flask-Limiter

### 3.2. Frontend (JavaScript/React)
- **Library**: React (v19.0)
- **UI Framework**: Material UI (MUI v6.0), React-Bootstrap (v5.3)
- **Animations**: Framer Motion
- **Charting**: Chart.js with React-Chartjs-2
- **State Management**: React Hooks & Context API
- **Internationalization**: i18next for multi-language support

### 3.3. Infrastructure & DevOps
- **Containerization**: Docker & Docker Compose
- **Database**: SQLite (Development) / PostgreSQL (Production)
- **Web Server**: Gunicorn (WSGI) & Nginx (Reverse Proxy)

---

## 4. Installation & Setup

### 4.1. Prerequisites
- **Docker** & **Docker Compose** (Recommended)
- **Python 3.10+** (For manual backend setup)
- **Node.js 18+** (For manual frontend setup)

### 4.2. Recommended Setup (Docker)
1. Clone the repository.
2. Run `docker-compose up --build`.
3. The platform will be available at `http://localhost:3000` (Frontend) and `http://localhost:5000` (Backend).

### 4.3. Manual Backend Setup
1. Navigate to the `backend` directory.
2. Create a virtual environment: `python -m venv .venv`.
3. Activate the environment: `.venv\Scripts\activate` (Windows) or `source .venv/bin/activate` (Linux/Mac).
4. Install dependencies: `pip install -r requirements.txt`.
5. Run the server: `python run.py`.

### 4.4. Manual Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`.
3. Start the development server: `npm start`.

---

## 5. Database Architecture
The database follows a relational structure optimized for multi-tenancy:
- **Businesses**: Top-level entity representing a client company.
- **Branches**: Associated with a Business.
- **Users**: Associated with a Business and assigned to specific Branches.
- **Products**: Linked to both Business and optionally specific Branches.
- **Sales/Invoices**: Record transactions performed within a Branch.
- **Inventory/Stock**: Tracks quantity of Products per Branch.

---

## 6. Security Standards
- **JWT Authentication**: Secure stateless authentication for API requests.
- **MFA Compliance**: Support for Google Authenticator and other TOTP apps.
- **Encryption**: sensitive data is encrypted at rest and in transit.
- **Input Sanitization**: Protection against XSS and SQL Injection via Flask-SQLAlchemy and Bleach.

---

## 7. Branding & Customization
AfriBiz supports rebranding through:
- **Localization**: Translation files in `frontend/src/i18n`.
- **Theming**: Configurable color palettes in the MUI theme provider.
- **App Configuration**: Environment variables in `.env` files for both frontend and backend.

---

*Documentation generated on 2026-04-03.*
