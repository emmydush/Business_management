import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import components
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Users from './pages/Users';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Expenses from './pages/Expenses';
import HR from './pages/HR';
import Reports from './pages/Reports';
import Operations from './pages/Operations';
import Settings from './pages/Settings';
import Leads from './pages/Leads';
import Tasks from './pages/Tasks';
import Projects from './pages/Projects';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route path="/" element={<Layout><Dashboard /></Layout>} />

          <Route path="/users" element={<Layout><Users /></Layout>} />

          <Route path="/customers" element={<Layout><Customers /></Layout>} />

          <Route path="/suppliers" element={<Layout><Suppliers /></Layout>} />

          <Route path="/products" element={<Layout><Products /></Layout>} />

          <Route path="/categories" element={<Layout><Categories /></Layout>} />

          <Route path="/orders" element={<Layout><Orders /></Layout>} />

          <Route path="/sales" element={<Layout><Sales /></Layout>} />

          <Route path="/purchases" element={<Layout><Purchases /></Layout>} />

          <Route path="/expenses" element={<Layout><Expenses /></Layout>} />

          <Route path="/hr" element={<Layout><HR /></Layout>} />

          <Route path="/reports" element={<Layout><Reports /></Layout>} />

          <Route path="/operations" element={<Layout><Operations /></Layout>} />

          <Route path="/leads" element={<Layout><Leads /></Layout>} />

          <Route path="/tasks" element={<Layout><Tasks /></Layout>} />

          <Route path="/projects" element={<Layout><Projects /></Layout>} />

          <Route path="/sales-orders" element={
            <Layout>
              <div className="p-4">
                <h2>Sales Orders</h2>
                <p>Sales orders management functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/invoices" element={
            <Layout>
              <div className="p-4">
                <h2>Invoices</h2>
                <p>Invoice management functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/payments" element={
            <Layout>
              <div className="p-4">
                <h2>Payments</h2>
                <p>Payment processing functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/pos" element={
            <Layout>
              <div className="p-4">
                <h2>POS (Point of Sale)</h2>
                <p>Point of Sale functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/returns" element={
            <Layout>
              <div className="p-4">
                <h2>Returns</h2>
                <p>Return management functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/stock" element={
            <Layout>
              <div className="p-4">
                <h2>Stock In / Out</h2>
                <p>Stock movement tracking functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/warehouses" element={
            <Layout>
              <div className="p-4">
                <h2>Warehouses</h2>
                <p>Warehouse management functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/low-stock" element={
            <Layout>
              <div className="p-4">
                <h2>Low Stock Alerts</h2>
                <p>Low stock alert functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/purchase-orders" element={
            <Layout>
              <div className="p-4">
                <h2>Purchase Orders</h2>
                <p>Purchase order management functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/goods-received" element={
            <Layout>
              <div className="p-4">
                <h2>Goods Received</h2>
                <p>Goods received functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/supplier-bills" element={
            <Layout>
              <div className="p-4">
                <h2>Supplier Bills</h2>
                <p>Supplier bills management functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/purchase-reports" element={
            <Layout>
              <div className="p-4">
                <h2>Purchase Reports</h2>
                <p>Purchase reports functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/income" element={
            <Layout>
              <div className="p-4">
                <h2>Income</h2>
                <p>Income tracking functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/accounting" element={
            <Layout>
              <div className="p-4">
                <h2>Accounting</h2>
                <p>Accounting functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/taxes" element={
            <Layout>
              <div className="p-4">
                <h2>Taxes</h2>
                <p>Tax management functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/employees" element={
            <Layout>
              <div className="p-4">
                <h2>Employees</h2>
                <p>Employee management functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/attendance" element={
            <Layout>
              <div className="p-4">
                <h2>Attendance</h2>
                <p>Attendance tracking functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/leave" element={
            <Layout>
              <div className="p-4">
                <h2>Leave Management</h2>
                <p>Leave management functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/performance" element={
            <Layout>
              <div className="p-4">
                <h2>Performance</h2>
                <p>Performance tracking functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/departments" element={
            <Layout>
              <div className="p-4">
                <h2>Departments</h2>
                <p>Department management functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/documents" element={
            <Layout>
              <div className="p-4">
                <h2>Documents</h2>
                <p>Document management functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/approvals" element={
            <Layout>
              <div className="p-4">
                <h2>Approvals</h2>
                <p>Approval workflow functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/workflows" element={
            <Layout>
              <div className="p-4">
                <h2>Workflows</h2>
                <p>Workflow management functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/assets" element={
            <Layout>
              <div className="p-4">
                <h2>Asset Management</h2>
                <p>Asset management functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/sales-reports" element={
            <Layout>
              <div className="p-4">
                <h2>Sales Reports</h2>
                <p>Sales reports functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/finance-reports" element={
            <Layout>
              <div className="p-4">
                <h2>Finance Reports</h2>
                <p>Finance reports functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/inventory-reports" element={
            <Layout>
              <div className="p-4">
                <h2>Inventory Reports</h2>
                <p>Inventory reports functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/hr-reports" element={
            <Layout>
              <div className="p-4">
                <h2>HR Reports</h2>
                <p>HR reports functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/custom-reports" element={
            <Layout>
              <div className="p-4">
                <h2>Custom Reports</h2>
                <p>Custom reports functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/notifications" element={
            <Layout>
              <div className="p-4">
                <h2>Notifications</h2>
                <p>Notification management functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/messages" element={
            <Layout>
              <div className="p-4">
                <h2>Messages</h2>
                <p>Message system functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/announcements" element={
            <Layout>
              <div className="p-4">
                <h2>Announcements</h2>
                <p>Announcement system functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/company-profile" element={
            <Layout>
              <div className="p-4">
                <h2>Company Profile</h2>
                <p>Company profile management functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/permissions" element={
            <Layout>
              <div className="p-4">
                <h2>Permissions</h2>
                <p>Permission management functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/system-settings" element={
            <Layout>
              <div className="p-4">
                <h2>System Settings</h2>
                <p>System settings functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/integrations" element={
            <Layout>
              <div className="p-4">
                <h2>Integrations</h2>
                <p>Integration management functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/backup" element={
            <Layout>
              <div className="p-4">
                <h2>Backup & Restore</h2>
                <p>Backup and restore functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/audit-logs" element={
            <Layout>
              <div className="p-4">
                <h2>Audit Logs</h2>
                <p>Audit logs functionality will be implemented here.</p>
              </div>
            </Layout>
          } />

          <Route path="/settings" element={
            <Layout>
              <Settings />
            </Layout>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;