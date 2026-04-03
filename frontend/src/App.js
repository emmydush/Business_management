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
import Login from './pages/Login';
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
import SalesReports from './pages/SalesReports';
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
        element={user ? <Navigate to={user.role === 'superadmin' ? '/superadmin' : '/dashboard'} replace /> : <Login />} 
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Protected regular routes */}
      <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
      <Route path="/products" element={<Layout><Products /></Layout>} />
      <Route path="/barcode-manager" element={<Layout><BarcodeManager /></Layout>} />
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
      <Route path="/tasks" element={<Layout><Tasks /></Layout>} />
      <Route path="/projects" element={<Layout><Projects /></Layout>} />
      <Route path="/projects/:id" element={<Layout><ProjectDetails /></Layout>} />
      <Route path="/users" element={<Layout><Users /></Layout>} />
      <Route path="/branches" element={<Layout><Branches /></Layout>} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/settings" element={<Layout><Settings /></Layout>} />
      <Route path="/subscription" element={<Layout><Subscription /></Layout>} />
      <Route path="/advanced-settings" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><Layout><AdvancedSettings /></Layout></ProtectedRoute>} />

      <Route path="/sales-orders" element={<Layout><SalesOrders /></Layout>} />
      <Route path="/invoices" element={<Layout><Invoices /></Layout>} />
      <Route path="/payments" element={<Layout><Payments /></Layout>} />
      <Route path="/pos" element={<Layout><POS /></Layout>} />
      <Route path="/returns" element={<Layout><Returns /></Layout>} />
      <Route path="/sales-reports" element={<Layout><SalesReports /></Layout>} />
      <Route path="/debtors" element={<Layout><Debtors /></Layout>} />
      <Route path="/trade" element={<Layout><Trade /></Layout>} />

      <Route path="/stock" element={<Layout><StockMovements /></Layout>} />
      <Route path="/warehouses" element={<Layout><Warehouses /></Layout>} />
      <Route path="/low-stock" element={<Layout><LowStockAlerts /></Layout>} />

      <Route path="/income" element={<Layout><Income /></Layout>} />
      <Route path="/payroll" element={<Layout><Payroll /></Layout>} />

      <Route path="/employees" element={<Layout><Employees /></Layout>} />
      <Route path="/attendance" element={<Layout><Attendance /></Layout>} />
      <Route path="/leave" element={<Layout><LeaveManagement /></Layout>} />
      <Route path="/performance" element={<Layout><Performance /></Layout>} />
      <Route path="/departments" element={<Layout><Departments /></Layout>} />

      <Route path="/documents" element={<Layout><Documents /></Layout>} />
      <Route path="/documents/view/:id" element={<Layout><DocumentViewer /></Layout>} />
      <Route path="/approvals" element={<Layout><Approvals /></Layout>} />
      <Route path="/assets" element={<Layout><Assets /></Layout>} />

      <Route path="/finance-reports" element={<Layout><FinanceReports /></Layout>} />
      <Route path="/inventory-reports" element={<Layout><InventoryReports /></Layout>} />
      <Route path="/hr-reports" element={<Layout><HRReports /></Layout>} />
      <Route path="/custom-reports" element={<Layout><CustomReports /></Layout>} />

      <Route path="/goods-received" element={<Layout><GoodsReceived /></Layout>} />
      <Route path="/supplier-bills" element={<Layout><SupplierBills /></Layout>} />
      <Route path="/purchase-reports" element={<Layout><PurchaseReports /></Layout>} />
      <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
      <Route path="/messages" element={<Layout><Messages /></Layout>} />
      <Route path="/announcements" element={<Layout><Announcements /></Layout>} />
      <Route path="/company-profile" element={<Layout><CompanyProfile /></Layout>} />
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
                    duration: 4000,
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
              </div>
            </Router>
          </SubscriptionProvider>
        </AuthProvider>
      </CurrencyProvider>
    </AppThemeProvider>
  );
}

export default App;
