import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CurrencyProvider } from './context/CurrencyContext';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { ThemeProvider as AppThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import CookieConsent from './components/CookieConsent';
import Chatbot from './components/Chatbot';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Expenses from './pages/Expenses';
import HR from './pages/HR';
import Reports from './pages/Reports';
import Operations from './pages/Operations';
import Tasks from './pages/Tasks';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Settings from './pages/Settings';
import AdvancedSettings from './pages/AdvancedSettings';
import Categories from './pages/Categories';
import Customers from './pages/Customers';
import LandingPage from './pages/LandingPage';
// Login import removed to favor modal login
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Logout from './pages/Logout';
import Orders from './pages/Orders';
import Trade from './pages/Trade';
import Products from './pages/Products';
import BarcodeManager from './components/BarcodeManager';
import Suppliers from './pages/Suppliers';
import Users from './pages/Users';
import GoodsReceived from './pages/GoodsReceived';
import PurchaseReports from './pages/PurchaseReports';
import SupplierBills from './pages/SupplierBills';
import SalesOrders from './pages/SalesOrders';
import Branches from './pages/Branches';
import Debtors from './pages/Debtors';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import POS from './pages/POS';
import Returns from './pages/Returns';
import PurchaseReturns from './pages/PurchaseReturns';
import StockMovements from './pages/StockMovements';
import Warehouses from './pages/Warehouses';
import LowStockAlerts from './pages/LowStockAlerts';
import Income from './pages/Income';
import Payroll from './pages/Payroll';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import LeaveManagement from './pages/LeaveManagement';
import Performance from './pages/Performance';
import Departments from './pages/Departments';
import Documents from './pages/Documents';
import Approvals from './pages/Approvals';
import Assets from './pages/Assets';
import FinanceReports from './pages/FinanceReports';
import InventoryReports from './pages/InventoryReports';
import HRReports from './pages/HRReports';
import CustomReports from './pages/CustomReports';
import SalesReports from './pages/SalesReports';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import Announcements from './pages/Announcements';
import CompanyProfile from './pages/CompanyProfile';
import UserProfile from './pages/UserProfile';
import Permissions from './pages/Permissions';
import SystemSettings from './pages/SystemSettings';
import Integrations from './pages/Integrations';
import BackupRestore from './pages/BackupRestore';
import AuditLogs from './pages/AuditLogs';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminUsers from './pages/SuperAdminUsers';
import SuperAdminBusinesses from './pages/SuperAdminBusinesses';
import SuperAdminEmailConfig from './pages/SuperAdminEmailConfig';
import SuperAdminSubscriptions from './pages/SuperAdminSubscriptions';
import SuperAdminAdvanced from './pages/SuperAdminAdvanced';
import SuperAdminApiKeys from './pages/SuperAdminApiKeys';
import SuperAdminBranches from './pages/SuperAdminBranches';
import Subscription from './pages/Subscription';
import SuperAdminLayout from './components/SuperAdminLayout';
import APISettings from './pages/APISettings';
import GlobalSearch from './pages/GlobalSearch';
import DocumentViewer from './pages/DocumentViewer';
import TeamManagement from './pages/TeamManagement';

/**
 * AppRoutes Component
 * Handles the actual routing logic and role-based redirects.
 * Needs to be a separate component to use the useAuth hook within the Router context.
 */
function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
       <Route 
        path="/login" 
        element={user ? <Navigate to={user.role === 'superadmin' ? '/superadmin' : '/dashboard'} replace /> : <Navigate to="/" state={{ showLogin: true }} replace />} 
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Protected regular routes */}
      <Route path="/dashboard" element={<ProtectedRoute module="dashboard"><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute module="inventory"><Layout><Products /></Layout></ProtectedRoute>} />
      <Route path="/barcode-manager" element={<ProtectedRoute module="inventory"><Layout><BarcodeManager /></Layout></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute module="inventory"><Layout><Categories /></Layout></ProtectedRoute>} />
      <Route path="/sales" element={<ProtectedRoute module="sales"><Layout><Sales /></Layout></ProtectedRoute>} />
      <Route path="/purchases" element={<ProtectedRoute module="purchases"><Layout><Purchases /></Layout></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute module="expenses"><Layout><Expenses /></Layout></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute module="customers"><Layout><Customers /></Layout></ProtectedRoute>} />
      <Route path="/suppliers" element={<ProtectedRoute module="suppliers"><Layout><Suppliers /></Layout></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute module="sales"><Layout><Orders /></Layout></ProtectedRoute>} />
      <Route path="/hr" element={<ProtectedRoute module="hr"><Layout><HR /></Layout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute module="reports"><Layout><Reports /></Layout></ProtectedRoute>} />
      <Route path="/operations" element={<ProtectedRoute module="dashboard"><Layout><Operations /></Layout></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute module="tasks"><Layout><Tasks /></Layout></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute module="projects"><Layout><Projects /></Layout></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute module="projects"><Layout><ProjectDetails /></Layout></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute module="users"><Layout><Users /></Layout></ProtectedRoute>} />
      <Route path="/branches" element={<ProtectedRoute module="branches"><Layout><Branches /></Layout></ProtectedRoute>} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/settings" element={<ProtectedRoute module="settings"><Layout><Settings /></Layout></ProtectedRoute>} />
      <Route path="/subscription" element={<ProtectedRoute module="settings"><Layout><Subscription /></Layout></ProtectedRoute>} />
      <Route path="/advanced-settings" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><Layout><AdvancedSettings /></Layout></ProtectedRoute>} />

      <Route path="/sales-orders" element={<ProtectedRoute module="sales"><Layout><SalesOrders /></Layout></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute module="invoices"><Layout><Invoices /></Layout></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute module="payments"><Layout><Payments /></Layout></ProtectedRoute>} />
      <Route path="/pos" element={<ProtectedRoute module="pos"><Layout><POS /></Layout></ProtectedRoute>} />
      <Route path="/returns" element={<ProtectedRoute module="returns"><Layout><Returns /></Layout></ProtectedRoute>} />
      <Route path="/purchase-returns" element={<ProtectedRoute module="purchases"><Layout><PurchaseReturns /></Layout></ProtectedRoute>} />
      <Route path="/debtors" element={<ProtectedRoute module="sales"><Layout><Debtors /></Layout></ProtectedRoute>} />
      <Route path="/trade" element={<ProtectedRoute module="sales"><Layout><Trade /></Layout></ProtectedRoute>} />

      <Route path="/stock" element={<ProtectedRoute module="inventory"><Layout><StockMovements /></Layout></ProtectedRoute>} />
      <Route path="/warehouses" element={<ProtectedRoute module="warehouse"><Layout><Warehouses /></Layout></ProtectedRoute>} />
      <Route path="/low-stock" element={<ProtectedRoute module="inventory"><Layout><LowStockAlerts /></Layout></ProtectedRoute>} />

      <Route path="/income" element={<ProtectedRoute module="expenses"><Layout><Income /></Layout></ProtectedRoute>} />
      <Route path="/payroll" element={<ProtectedRoute module="payroll"><Layout><Payroll /></Layout></ProtectedRoute>} />

      <Route path="/employees" element={<ProtectedRoute module="employees"><Layout><Employees /></Layout></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute module="attendance"><Layout><Attendance /></Layout></ProtectedRoute>} />
      <Route path="/leave" element={<ProtectedRoute module="leave"><Layout><LeaveManagement /></Layout></ProtectedRoute>} />
      <Route path="/performance" element={<ProtectedRoute module="hr"><Layout><Performance /></Layout></ProtectedRoute>} />
      <Route path="/departments" element={<ProtectedRoute module="hr"><Layout><Departments /></Layout></ProtectedRoute>} />

      <Route path="/documents" element={<ProtectedRoute module="documents"><Layout><Documents /></Layout></ProtectedRoute>} />
      <Route path="/documents/view/:id" element={<ProtectedRoute module="documents"><Layout><DocumentViewer /></Layout></ProtectedRoute>} />
      <Route path="/approvals" element={<ProtectedRoute module="hr"><Layout><Approvals /></Layout></ProtectedRoute>} />
      <Route path="/assets" element={<ProtectedRoute module="assets"><Layout><Assets /></Layout></ProtectedRoute>} />

      <Route path="/finance-reports" element={<ProtectedRoute module="financial_reports"><Layout><FinanceReports /></Layout></ProtectedRoute>} />
      <Route path="/inventory-reports" element={<ProtectedRoute module="inventory_reports"><Layout><InventoryReports /></Layout></ProtectedRoute>} />
      <Route path="/hr-reports" element={<ProtectedRoute module="reports"><Layout><HRReports /></Layout></ProtectedRoute>} />
      <Route path="/custom-reports" element={<ProtectedRoute module="reports"><Layout><CustomReports /></Layout></ProtectedRoute>} />
      <Route path="/sales-reports" element={<ProtectedRoute module="sales_reports"><Layout><SalesReports /></Layout></ProtectedRoute>} />

      <Route path="/goods-received" element={<ProtectedRoute module="purchases"><Layout><GoodsReceived /></Layout></ProtectedRoute>} />
      <Route path="/supplier-bills" element={<ProtectedRoute module="purchases"><Layout><SupplierBills /></Layout></ProtectedRoute>} />
      <Route path="/purchase-reports" element={<ProtectedRoute module="reports"><Layout><PurchaseReports /></Layout></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute module="dashboard"><Layout><Notifications /></Layout></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute module="dashboard"><Layout><Messages /></Layout></ProtectedRoute>} />
      <Route path="/announcements" element={<ProtectedRoute module="dashboard"><Layout><Announcements /></Layout></ProtectedRoute>} />
      <Route path="/company-profile" element={<ProtectedRoute module="settings"><Layout><CompanyProfile /></Layout></ProtectedRoute>} />
      <Route path="/user-profile" element={<Layout><UserProfile /></Layout>} />
      <Route path="/permissions" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><Layout><Permissions /></Layout></ProtectedRoute>} />
      <Route path="/system-settings" element={<ProtectedRoute allowedRoles={['superadmin']}><Layout><SystemSettings /></Layout></ProtectedRoute>} />
      <Route path="/api-settings" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><Layout><APISettings /></Layout></ProtectedRoute>} />
      <Route path="/global-search" element={<Layout><GlobalSearch /></Layout>} />
      <Route path="/document-viewer/:documentId" element={<Layout><DocumentViewer /></Layout>} />
      
            
            
      {/* SuperAdmin Only Routes */}
      <Route path="/superadmin" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminLayout><SuperAdminDashboard /></SuperAdminLayout></ProtectedRoute>} />
      <Route path="/superadmin/users" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminLayout><SuperAdminUsers /></SuperAdminLayout></ProtectedRoute>} />
      <Route path="/superadmin/businesses" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminLayout><SuperAdminBusinesses /></SuperAdminLayout></ProtectedRoute>} />
      <Route path="/superadmin/email-config" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminLayout><SuperAdminEmailConfig /></SuperAdminLayout></ProtectedRoute>} />
      <Route path="/superadmin/subscriptions" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminLayout><SuperAdminSubscriptions /></SuperAdminLayout></ProtectedRoute>} />
      <Route path="/superadmin/branches" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminLayout><SuperAdminBranches /></SuperAdminLayout></ProtectedRoute>} />
      <Route path="/superadmin/advanced" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminLayout><SuperAdminAdvanced /></SuperAdminLayout></ProtectedRoute>} />
      <Route path="/superadmin/security/keys" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminLayout><SuperAdminApiKeys /></SuperAdminLayout></ProtectedRoute>} />
      
      <Route path="/superadmin/permissions" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminLayout><Permissions /></SuperAdminLayout></ProtectedRoute>} />
      <Route path="/superadmin/audit-logs" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminLayout><AuditLogs /></SuperAdminLayout></ProtectedRoute>} />
      <Route path="/superadmin/integrations" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminLayout><Integrations /></SuperAdminLayout></ProtectedRoute>} />
      <Route path="/superadmin/backup" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminLayout><BackupRestore /></SuperAdminLayout></ProtectedRoute>} />
      <Route path="/team-management" element={<Layout><TeamManagement /></Layout>} />
    </Routes>
  );
}

function App() {
  return (
    <AppThemeProvider>
      <CurrencyProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <Router>
              <div className="App">
                <Toaster
                  position="top-center"
                  toastOptions={{
                    duration: 2000,
                    style: {
                      background: 'transparent',
                      color: '#fff',
                      fontSize: '16px',
                      padding: '12px 24px',
                      boxShadow: 'none',
                      border: 'none',
                      fontWeight: '500',
                      textAlign: 'center'
                    },
                    success: {
                      style: {
                        background: '#059669',
                        color: '#fff',
                        borderRadius: '8px',
                        padding: '12px 20px',
                        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.4)'
                      },
                      iconTheme: {
                        primary: '#fff',
                        secondary: '#059669',
                      },
                    },
                    error: {
                      style: {
                        background: '#dc2626',
                        color: '#fff',
                        borderRadius: '8px',
                        padding: '12px 20px',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
                      },
                      iconTheme: {
                        primary: '#fff',
                        secondary: '#dc2626',
                      },
                    },
                  }}
                  limit={1}
                />
                <AppRoutes />
                <CookieConsent />
                <Chatbot />
              </div>
            </Router>
          </SubscriptionProvider>
        </AuthProvider>
      </CurrencyProvider>
    </AppThemeProvider>
  );
}

export default App;
