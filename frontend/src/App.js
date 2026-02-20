import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CurrencyProvider } from './context/CurrencyContext';
import { AuthProvider } from './components/auth/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SubscriptionUpgradeModal from './components/SubscriptionUpgradeModal';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Expenses from './pages/Expenses';
import HR from './pages/HR';
import Reports from './pages/Reports';
import Operations from './pages/Operations';
import Leads from './pages/Leads';
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
import Products from './pages/Products';
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
import Subscription from './pages/Subscription';
import SuperAdminLayout from './components/SuperAdminLayout';
import ServiceManagement from './pages/ServiceManagement';
import CRM from './pages/CRM';
import Manufacturing from './pages/Manufacturing';
import APISettings from './pages/APISettings';
import TeamManagement from './pages/TeamManagement';

function App() {
  // State for upgrade required modal
  const [upgradeError, setUpgradeError] = React.useState(null);

  React.useEffect(() => {
    // Listen for upgrade required events from API interceptor
    const handleUpgradeRequired = (event) => {
      setUpgradeError(event.detail);
    };

    // Check if there's an existing upgrade required in sessionStorage on mount
    const storedUpgrade = sessionStorage.getItem('upgradeRequired');
    if (storedUpgrade) {
      try {
        const parsed = JSON.parse(storedUpgrade);
        // Only use it if it's recent (within last 5 minutes)
        if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          setUpgradeError(parsed.error);
        } else {
          sessionStorage.removeItem('upgradeRequired');
        }
      } catch (e) {
        sessionStorage.removeItem('upgradeRequired');
      }
    }

    window.addEventListener('subscription-upgrade-required', handleUpgradeRequired);
    return () => window.removeEventListener('subscription-upgrade-required', handleUpgradeRequired);
  }, []);

  const handleCloseUpgradeModal = React.useCallback(() => {
    setUpgradeError(null);
    sessionStorage.removeItem('upgradeRequired');
  }, []);
  return (
    <LanguageProvider>
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
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />                <Route path="/forgot-password" element={<ForgotPassword />} />                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />
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
                <Route path="/projects/:id" element={<Layout><ProjectDetails /></Layout>} />
                <Route path="/users" element={<Layout><Users /></Layout>} />
                <Route path="/branches" element={<Layout><Branches /></Layout>} />
                <Route path="/logout" element={<Logout />} />
                <Route path="/settings" element={<Layout><Settings /></Layout>} />
                <Route path="/subscription" element={<Layout><Subscription /></Layout>} />
                <Route path="/advanced-settings" element={<ProtectedRoute allowedRoles={['superadmin']}><Layout><AdvancedSettings /></Layout></ProtectedRoute>} />

                {/* Sales Module Routes */}

                <Route path="/sales-orders" element={<Layout><SalesOrders /></Layout>} />
                <Route path="/invoices" element={<Layout><Invoices /></Layout>} />
                <Route path="/payments" element={<Layout><Payments /></Layout>} />
                <Route path="/pos" element={<Layout><POS /></Layout>} />
                <Route path="/returns" element={<Layout><Returns /></Layout>} />
                <Route path="/sales-reports" element={<Layout><SalesReports /></Layout>} />
                <Route path="/debtors" element={<Layout><Debtors /></Layout>} />

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
                <Route path="/purchase-orders" element={<Layout><Purchases /></Layout>} />
                <Route path="/goods-received" element={<Layout><GoodsReceived /></Layout>} />
                <Route path="/supplier-bills" element={<Layout><SupplierBills /></Layout>} />
                <Route path="/purchase-reports" element={<Layout><PurchaseReports /></Layout>} />
                <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
                <Route path="/messages" element={<Layout><Messages /></Layout>} />
                <Route path="/announcements" element={<Layout><Announcements /></Layout>} />
                <Route path="/company-profile" element={<Layout><CompanyProfile /></Layout>} />
                <Route path="/user-profile" element={<Layout><UserProfile /></Layout>} />
                <Route path="/permissions" element={<Layout><Permissions /></Layout>} />
                <Route path="/system-settings" element={<ProtectedRoute allowedRoles={['superadmin']}><Layout><SystemSettings /></Layout></ProtectedRoute>} />
                <Route path="/integrations" element={<ProtectedRoute allowedRoles={['superadmin']}><Layout><Integrations /></Layout></ProtectedRoute>} />
                <Route path="/backup" element={<ProtectedRoute allowedRoles={['superadmin']}><Layout><BackupRestore /></Layout></ProtectedRoute>} />
                <Route path="/audit-logs" element={<Layout><AuditLogs /></Layout>} />
                <Route path="/superadmin" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminLayout><SuperAdminDashboard /></SuperAdminLayout></ProtectedRoute>} />
                <Route path="/superadmin/users" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminLayout><SuperAdminUsers /></SuperAdminLayout></ProtectedRoute>} />
                <Route path="/superadmin/businesses" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminLayout><SuperAdminBusinesses /></SuperAdminLayout></ProtectedRoute>} />
                <Route path="/superadmin/email-config" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminLayout><SuperAdminEmailConfig /></SuperAdminLayout></ProtectedRoute>} />
                <Route path="/superadmin/subscriptions" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminLayout><SuperAdminSubscriptions /></SuperAdminLayout></ProtectedRoute>} />
                <Route path="/superadmin/advanced" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminLayout><SuperAdminAdvanced /></SuperAdminLayout></ProtectedRoute>} />
                
                {/* SuperAdmin Security & Access Routes */}
                <Route path="/superadmin/permissions" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminLayout><Permissions /></SuperAdminLayout></ProtectedRoute>} />
                <Route path="/superadmin/audit-logs" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminLayout><AuditLogs /></SuperAdminLayout></ProtectedRoute>} />
                
                {/* New Routes for Advanced Features */}
                <Route path="/service" element={<Layout><ServiceManagement /></Layout>} />
                <Route path="/crm" element={<Layout><CRM /></Layout>} />
                <Route path="/manufacturing" element={<Layout><Manufacturing /></Layout>} />
                <Route path="/api-settings" element={<Layout><APISettings /></Layout>} />
                <Route path="/team-management" element={<Layout><TeamManagement /></Layout>} />
              </Routes>
              
              {/* Subscription Upgrade Modal - shows when user doesn't have permission due to plan */}
              <SubscriptionUpgradeModal
                show={!!upgradeError}
                error={upgradeError}
                onHide={handleCloseUpgradeModal}
              />
            </div>
          </Router>
        </SubscriptionProvider>
      </AuthProvider>
    </CurrencyProvider>
  </LanguageProvider>
  );
}

export default App;
