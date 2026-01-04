import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Expenses from './pages/Expenses';
import HR from './pages/HR';
import Reports from './pages/Reports';
import Operations from './pages/Operations';
import Leads from './pages/Leads';
import Tasks from './pages/Tasks';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import Categories from './pages/Categories';
import Customers from './pages/Customers';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Logout from './pages/Logout';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Suppliers from './pages/Suppliers';
import Users from './pages/Users';
import SalesOrders from './pages/SalesOrders';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import POS from './pages/POS';
import Returns from './pages/Returns';
import SalesReports from './pages/SalesReports';
import StockMovements from './pages/StockMovements';
import Warehouses from './pages/Warehouses';
import LowStockAlerts from './pages/LowStockAlerts';
import Income from './pages/Income';
import Accounting from './pages/Accounting';
import Payroll from './pages/Payroll';
import Taxes from './pages/Taxes';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import LeaveManagement from './pages/LeaveManagement';
import Performance from './pages/Performance';
import Departments from './pages/Departments';
import Documents from './pages/Documents';
import Approvals from './pages/Approvals';
import Workflows from './pages/Workflows';
import Assets from './pages/Assets';
import FinanceReports from './pages/FinanceReports';
import InventoryReports from './pages/InventoryReports';
import HRReports from './pages/HRReports';
import CustomReports from './pages/CustomReports';

function App() {
  return (
    <Router>
      <div className="App">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '14px',
              padding: '12px 24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/products" element={<Layout><Products /></Layout>} />
          <Route path="/categories" element={<Layout><Categories /></Layout>} />
          <Route path="/sales" element={<Layout><Sales /></Layout>} />
          <Route path="/purchases" element={<Layout><Purchases /></Layout>} />
          <Route path="/expenses" element={<Layout><Expenses /></Layout>} />
          <Route path="/customers" element={<Layout><Customers /></Layout>} />
          <Route path="/suppliers" element={<Layout><Suppliers /></Layout>} />
          <Route path="/orders" element={<Layout><Orders /></Layout>} />
          <Route path="/hr" element={<Layout><HR /></Layout>} />
          <Route path="/reports" element={<Layout><Reports /></Layout>} />
          <Route path="/operations" element={<Layout><Operations /></Layout>} />
          <Route path="/leads" element={<Layout><Leads /></Layout>} />
          <Route path="/tasks" element={<Layout><Tasks /></Layout>} />
          <Route path="/projects" element={<Layout><Projects /></Layout>} />
          <Route path="/users" element={<Layout><Users /></Layout>} />
          <Route path="/logout" element={<Logout />} />

          {/* Sales Module Routes */}
          <Route path="/sales-orders" element={<Layout><SalesOrders /></Layout>} />
          <Route path="/invoices" element={<Layout><Invoices /></Layout>} />
          <Route path="/payments" element={<Layout><Payments /></Layout>} />
          <Route path="/pos" element={<Layout><POS /></Layout>} />
          <Route path="/returns" element={<Layout><Returns /></Layout>} />
          <Route path="/sales-reports" element={<Layout><SalesReports /></Layout>} />

          {/* Inventory Module Routes */}
          <Route path="/stock" element={<Layout><StockMovements /></Layout>} />
          <Route path="/warehouses" element={<Layout><Warehouses /></Layout>} />
          <Route path="/low-stock" element={<Layout><LowStockAlerts /></Layout>} />

          {/* Finance Module Routes */}
          <Route path="/income" element={<Layout><Income /></Layout>} />
          <Route path="/accounting" element={<Layout><Accounting /></Layout>} />
          <Route path="/payroll" element={<Layout><Payroll /></Layout>} />
          <Route path="/taxes" element={<Layout><Taxes /></Layout>} />

          {/* HR Module Routes */}
          <Route path="/employees" element={<Layout><Employees /></Layout>} />
          <Route path="/attendance" element={<Layout><Attendance /></Layout>} />
          <Route path="/leave" element={<Layout><LeaveManagement /></Layout>} />
          <Route path="/performance" element={<Layout><Performance /></Layout>} />
          <Route path="/departments" element={<Layout><Departments /></Layout>} />

          {/* Operations Module Routes */}
          <Route path="/documents" element={<Layout><Documents /></Layout>} />
          <Route path="/approvals" element={<Layout><Approvals /></Layout>} />
          <Route path="/workflows" element={<Layout><Workflows /></Layout>} />
          <Route path="/assets" element={<Layout><Assets /></Layout>} />

          {/* Reports Module Routes */}
          <Route path="/finance-reports" element={<Layout><FinanceReports /></Layout>} />
          <Route path="/inventory-reports" element={<Layout><InventoryReports /></Layout>} />
          <Route path="/hr-reports" element={<Layout><HRReports /></Layout>} />
          <Route path="/custom-reports" element={<Layout><CustomReports /></Layout>} />

          {/* Placeholder routes */}
          <Route path="/purchase-orders" element={<Layout><div className="p-4"><h2>Purchase Orders</h2><p>Purchase order management functionality will be implemented here.</p></div></Layout>} />
          <Route path="/goods-received" element={<Layout><div className="p-4"><h2>Goods Received</h2><p>Goods received functionality will be implemented here.</p></div></Layout>} />
          <Route path="/supplier-bills" element={<Layout><div className="p-4"><h2>Supplier Bills</h2><p>Supplier bills management functionality will be implemented here.</p></div></Layout>} />
          <Route path="/purchase-reports" element={<Layout><div className="p-4"><h2>Purchase Reports</h2><p>Purchase reports functionality will be implemented here.</p></div></Layout>} />
          <Route path="/notifications" element={<Layout><div className="p-4"><h2>Notifications</h2><p>Notification management functionality will be implemented here.</p></div></Layout>} />
          <Route path="/messages" element={<Layout><div className="p-4"><h2>Messages</h2><p>Message system functionality will be implemented here.</p></div></Layout>} />
          <Route path="/announcements" element={<Layout><div className="p-4"><h2>Announcements</h2><p>Announcement system functionality will be implemented here.</p></div></Layout>} />
          <Route path="/company-profile" element={<Layout><div className="p-4"><h2>Company Profile</h2><p>Company profile management functionality will be implemented here.</p></div></Layout>} />
          <Route path="/permissions" element={<Layout><div className="p-4"><h2>Permissions</h2><p>Permission management functionality will be implemented here.</p></div></Layout>} />
          <Route path="/system-settings" element={<Layout><div className="p-4"><h2>System Settings</h2><p>System settings functionality will be implemented here.</p></div></Layout>} />
          <Route path="/integrations" element={<Layout><div className="p-4"><h2>Integrations</h2><p>Integration management functionality will be implemented here.</p></div></Layout>} />
          <Route path="/backup" element={<Layout><div className="p-4"><h2>Backup & Restore</h2><p>Backup and restore functionality will be implemented here.</p></div></Layout>} />
          <Route path="/audit-logs" element={<Layout><div className="p-4"><h2>Audit Logs</h2><p>Audit logs functionality will be implemented here.</p></div></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;