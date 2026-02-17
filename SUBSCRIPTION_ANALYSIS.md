# Subscription Plan Analysis

## Actual Platform Features (from Backend Routes)

| Module | Route | Feature Name in Plan | Status |
|--------|-------|---------------------|--------|
| auth | /api/auth | Authentication | ✅ OK |
| users | /api/users | User Management | ✅ OK |
| dashboard | /api/dashboard | Dashboard Access | ✅ OK |
| customers | /api/customers | Customer CRM | ✅ OK |
| suppliers | /api/suppliers | Supplier Management | ✅ OK |
| inventory | /api/inventory | Product Management | ✅ OK |
| inventory | /api/inventory | Category Management | ✅ OK |
| inventory | /api/inventory | Inventory Management | ✅ OK |
| sales | /api/sales | Sales Orders | ✅ OK |
| sales | /api/sales | Point of Sale (POS) | ✅ OK |
| purchases | /api/purchases | Purchase Orders | ✅ OK |
| purchases | /api/purchases | Goods Received | ✅ OK |
| expenses | /api/expenses | Expense Tracking | ✅ OK |
| expenses | /api/expenses | Income Management | ✅ OK |
| hr | /api/hr | Employee Management | ✅ OK |
| hr | /api/hr | Attendance Tracking | ✅ OK |
| hr | /api/hr | Leave Management | ✅ OK |
| hr | /api/hr | Payroll Processing | ✅ OK |
| hr | /api/hr | Performance Reviews | ✅ OK |
| hr | /api/hr | Department Management | ✅ OK |
| invoices | /api/invoices | Invoice Management | ✅ OK |
| reports | /api/reports | Advanced Reporting | ✅ OK |
| reports | /api/reports | Custom Reports Builder | ✅ OK |
| returns | /api/returns | Returns Management | ✅ OK |
| communication | /api/communication | Notifications | ✅ OK |
| communication | /api/communication | Messages | ✅ OK |
| leads | /api/leads | Lead Management | ✅ OK |
| tasks | /api/tasks | Task Management | ✅ OK |
| projects | /api/projects | Project Management | ✅ OK |
| documents | /api/documents | Document Management | ✅ OK |
| warehouse | /api/warehouses | Warehouse Management | ✅ OK |
| assets | /api/assets | Asset Management | ✅ OK |
| taxes | /api/taxes | Tax Management | ✅ OK |
| branches | /api/branches | Multi-Branch Support | ✅ OK |
| settings | /api/settings | Company Profile | ✅ OK |
| settings | /api/settings | Role & Permissions | ✅ OK |
| supplier_bills | /api/supplier-bills | Supplier Bills | ✅ OK |
| audit_log | /api/audit-log | Audit Logs | ⚠️ MISSING |
| superadmin | /api/superadmin | Platform Management | ⚠️ MISSING |

## Issues Found

| Issue # | Description | Severity |
|---------|-------------|----------|
| 1 | **Audit Logs** feature not in subscription plans - needs to be added | Medium |
| 2 | **Superadmin/Platform Management** not in subscription plans - this is correct (superadmin has full access) | N/A |
| 3 | **Stock Movements** feature in plan but backend route needs verification | Low |
| 4 | **Low Stock Alerts** feature in plan - needs route verification | Low |

## Feature Discrepancies

### Missing from Plans but Exists in Platform:
1. **Audit Logs** (/api/audit-log) - Not included in any plan

### Need Route Verification:
1. Stock Movements - Need to check if there's a specific endpoint
2. Low Stock Alerts - Need to check if there's a specific endpoint

## Recommendations

1. Add **Audit Logs** to Enterprise plan features
2. Consider adding a "Stock Movements" feature to map to inventory module
3. Consider adding "Notifications" and "Messages" as communication features

## Corrected Plan Features

Based on the analysis, here's the corrected feature list:

### Free Plan (Should have):
- Dashboard Access
- User Management (1 user)
- Product Management (up to 20)
- Basic Sales Orders
- Basic Invoices

### Starter Plan (Should have):
- All Free features +
- Supplier Management
- Category Management
- Expenses & Income
- Basic Reporting

### Business Plan (Should have):
- All Starter features +
- Multi-Branch (up to 3)
- POS
- Full Inventory (Products, Stock, Warehouse)
- Full HR (Employees, Attendance, Leave, Payroll)
- Purchase Orders, Goods Received, Supplier Bills
- Documents, Assets
- Leads, Projects, Tasks
- Returns
- Taxes
- Advanced Reporting

### Enterprise Plan (Should have):
- Everything Unlimited
- API Access
- White-label
- Dedicated Support
- SLA Guarantee
