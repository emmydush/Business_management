import axios from 'axios';

// Create axios instance
const baseURL = process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');
const api = axios.create({
  baseURL, // Backend API base URL (overridable via REACT_APP_API_URL)
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration and retry on network/server errors
api.defaults.retry = 3;
api.defaults.retryDelay = (retryCount) => Math.pow(2, retryCount) * 1000;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    // Retry on network errors (no response) or server (5xx) errors
    if (config) {
      config._retryCount = config._retryCount || 0;
      const shouldRetry = (!error.response || (error.response && error.response.status >= 500)) && config._retryCount < api.defaults.retry;
      if (shouldRetry) {
        config._retryCount += 1;
        const delay = api.defaults.retryDelay(config._retryCount);
        await new Promise((res) => setTimeout(res, delay));
        return api.request(config);
      }
    }

    if (error.response && error.response.status === 401) {
      // Don't redirect if we're already on the login attempt
      if (config && config.url && config.url.includes('/auth/login')) {
        return Promise.reject(error);
      }

      // Token expired or invalid, redirect to landing page
      sessionStorage.removeItem('token');
      window.location.href = '/';
    }

    return Promise.reject(error);
  }
);

export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;

  // Handle profile pictures and other uploads that start with /uploads
  if (path.startsWith('/uploads')) {
    // For uploads, we want to use the root path directly
    return `${window.location.origin}${path}`;
  }

  const backendUrl = baseURL.replace('/api', '');
  return `${backendUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default api;

// API functions
export const salesAPI = {
  getOrders: (params = {}) => api.get('/sales/orders', { params }),
  getOrder: (orderId) => api.get(`/sales/orders/${orderId}`),
  createOrder: (orderData) => api.post('/sales/orders', orderData),
  updateOrder: (orderId, orderData) => api.put(`/sales/orders/${orderId}`, orderData),
  updateOrderStatus: (orderId, status) => api.put(`/sales/orders/${orderId}/status`, { status }),
  deleteOrder: (orderId) => api.delete(`/sales/orders/${orderId}`),
  exportOrders: () => api.get('/reports/export/orders'),
  createPosSale: (saleData) => api.post('/sales/pos', saleData),
};

export const invoicesAPI = {
  getInvoices: (params = {}) => api.get('/invoices/', { params }),
  getInvoice: (invoiceId) => api.get(`/invoices/${invoiceId}`),
  createInvoice: (invoiceData) => api.post('/invoices/', invoiceData),
  updateInvoice: (invoiceId, invoiceData) => api.put(`/invoices/${invoiceId}`, invoiceData),
  deleteInvoice: (invoiceId) => api.delete(`/invoices/${invoiceId}`),
  updateInvoiceStatus: (invoiceId, status) => api.put(`/invoices/${invoiceId}/status`, { status }),
  recordPayment: (invoiceId, paymentData) => api.put(`/invoices/${invoiceId}/payment`, paymentData),
};

export const paymentsAPI = {
  getPayments: (params = {}) => api.get('/invoices/', { params }), // Payments are tied to invoices
  getPayment: (invoiceId) => api.get(`/invoices/${invoiceId}`),
  recordPayment: (invoiceId, paymentData) => api.put(`/invoices/${invoiceId}/payment`, paymentData),
  updatePayment: (invoiceId, paymentData) => api.put(`/invoices/${invoiceId}/payment`, paymentData),
};

export const returnsAPI = {
  getReturns: (params = {}) => api.get('/returns/', { params }),
  getReturn: (returnId) => api.get(`/returns/${returnId}`),
  createReturn: (returnData) => api.post('/returns/', returnData),
  updateReturn: (returnId, returnData) => api.put(`/returns/${returnId}`, returnData),
  deleteReturn: (returnId) => api.delete(`/returns/${returnId}`),
  updateReturnStatus: (returnId, status) => api.put(`/returns/${returnId}/status`, { status }),
};

export const purchasesAPI = {
  getPurchaseOrders: (params = {}) => api.get('/purchases/orders', { params }),
  getPurchaseOrder: (orderId) => api.get(`/purchases/orders/${orderId}`),
  createPurchaseOrder: (orderData) => api.post('/purchases/orders', orderData),
  updatePurchaseOrder: (orderId, orderData) => api.put(`/purchases/orders/${orderId}`, orderData),
  deletePurchaseOrder: (orderId) => api.delete(`/purchases/orders/${orderId}`),
  receiveGoods: (receiptData) => api.post('/purchases/goods-receipt', receiptData),
  exportPurchases: () => api.get('/reports/export/purchases'),
  exportSuppliers: () => api.get('/reports/export/suppliers'),
  getSuppliers: () => api.get('/suppliers/'),
  getSupplier: (supplierId) => api.get(`/suppliers/${supplierId}`),
  createSupplier: (supplierData) => api.post('/suppliers/', supplierData),
  updateSupplier: (supplierId, supplierData) => api.put(`/suppliers/${supplierId}`, supplierData),
  deleteSupplier: (supplierId) => api.delete(`/suppliers/${supplierId}`),
  bulkUploadSuppliers: (formData) =>
    api.post('/suppliers/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const supplierBillsAPI = {
  getSupplierBills: (params = {}) => api.get('/supplier-bills/', { params }),
  getSupplierBill: (billId) => api.get(`/supplier-bills/${billId}`),
  createSupplierBill: (billData) => api.post('/supplier-bills/', billData),
  updateSupplierBill: (billId, billData) => api.put(`/supplier-bills/${billId}`, billData),
  deleteSupplierBill: (billId) => api.delete(`/supplier-bills/${billId}`),
  exportSupplierBills: () => api.get('/reports/export/supplier-bills'),
};

export const expensesAPI = {
  getExpenses: (params = {}) => api.get('/expenses/expenses', { params }),
  getExpense: (expenseId) => api.get(`/expenses/expenses/${expenseId}`),
  createExpense: (expenseData) => api.post('/expenses/expenses', expenseData),
  updateExpense: (expenseId, expenseData) => api.put(`/expenses/expenses/${expenseId}`, expenseData),
  deleteExpense: (expenseId) => api.delete(`/expenses/expenses/${expenseId}`),
  approveExpense: (expenseId) => api.put(`/expenses/expenses/approve/${expenseId}`),
  rejectExpense: (expenseId) => api.put(`/expenses/expenses/reject/${expenseId}`),
  getExpenseCategories: () => api.get('/expenses/categories'),
  getExpenseSummary: () => api.get('/expenses/summary'),
  exportExpenses: () => api.get('/reports/export/expenses'),
};

export const inventoryAPI = {
  getProducts: (params = {}) => api.get('/inventory/products', { params }),
  getProduct: (productId) => api.get(`/inventory/products/${productId}`),
  createProduct: (productData) => {
    if (productData instanceof FormData) {
      return api.post('/inventory/products', productData, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.post('/inventory/products', productData);
  },
  updateProduct: (productId, productData) => {
    if (productData instanceof FormData) {
      return api.put(`/inventory/products/${productId}`, productData, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.put(`/inventory/products/${productId}`, productData);
  },
  deleteProduct: (productId) => api.delete(`/inventory/products/${productId}`),
  getCategories: () => api.get('/inventory/categories'),
  createCategory: (categoryData) => api.post('/inventory/categories', categoryData),
  adjustStock: (adjustmentData) => api.post('/inventory/stock-adjustment', adjustmentData),
  bulkUploadProducts: (formData) => api.post('/inventory/products/bulk-upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getInventoryTransactions: (params = {}) => api.get('/inventory/transactions', { params }),
  exportProducts: () => api.get('/reports/export/inventory'),
};

export const customersAPI = {
  getCustomers: (params = {}) => api.get('/customers/', { params }),
  getCustomer: (customerId) => api.get(`/customers/${customerId}`),
  createCustomer: (customerData) => api.post('/customers/', customerData),
  updateCustomer: (customerId, customerData) => api.put(`/customers/${customerId}`, customerData),
  deleteCustomer: (customerId) => api.delete(`/customers/${customerId}`),
  getCustomerOrders: (customerId) => api.get(`/customers/${customerId}/orders`),
  recalculateBalances: () => api.post('/customers/recalculate-balances'),
  bulkUploadCustomers: (formData) =>
    api.post('/customers/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const hrAPI = {
  getEmployees: (params = {}) => api.get('/hr/employees', { params }),
  getEmployee: (employeeId) => api.get(`/hr/employees/${employeeId}`),
  createEmployee: (employeeData) => api.post('/hr/employees', employeeData),
  updateEmployee: (employeeId, employeeData) => api.put(`/hr/employees/${employeeId}`, employeeData),
  deleteEmployee: (employeeId) => api.delete(`/hr/employees/${employeeId}`),
  getDepartments: (params = {}) => api.get('/hr/departments', { params }),
  createDepartment: (departmentData) => api.post('/hr/departments', departmentData),
  updateDepartment: (deptId, departmentData) => api.put(`/hr/departments/${deptId}`, departmentData),
  deleteDepartment: (deptId) => api.delete(`/hr/departments/${deptId}`),
  getPositions: () => api.get('/hr/positions'),
  getPayroll: () => api.get('/hr/payroll'),
  createPayroll: (payrollData) => api.post('/hr/payroll', payrollData),
  updatePayroll: (payrollId, payrollData) => api.put(`/hr/payroll/${payrollId}`, payrollData),
  getAttendance: () => api.get('/hr/attendance'),
  getAttendanceRecords: (params = {}) => api.get('/hr/attendance/records', { params }),
  getPerformance: (params = {}) => api.get('/hr/performance', { params }),
  getLeaveRequests: (params = {}) => api.get('/hr/leave-requests', { params }),
  approveLeaveRequest: (leaveId) => api.put(`/hr/leave-requests/${leaveId}/approve`),
  rejectLeaveRequest: (leaveId) => api.put(`/hr/leave-requests/${leaveId}/reject`),
  exportPayroll: () => api.get('/reports/export/payroll'),
  exportEmployees: () => api.get('/reports/export/employees'),
  bulkUploadEmployees: (formData) =>
    api.post('/hr/employees/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const reportsAPI = {
  getSalesReport: (params = {}) => api.get('/reports/sales', { params }),
  getInventoryReport: (params = {}) => api.get('/reports/inventory', { params }),
  getCustomerReport: () => api.get('/reports/customers'),
  getOrderReport: () => api.get('/reports/orders'),
  getFinancialReport: (params = {}) => api.get('/reports/financial', { params }),
  getBusinessSummary: () => api.get('/reports/summary'),
  getHrReport: (params = {}) => api.get('/reports/hr', { params }),
  getCustomReport: (params = {}) => api.get('/reports/custom', { params }),
  exportFinancialReportCSV: () => api.get('/reports/export/financial?format=csv'),
  exportFinancialReportPDF: () => api.get('/reports/export/financial?format=pdf'),
  exportFinancialReportExcel: () => api.get('/reports/export/financial?format=xlsx'),
};

export const taxesAPI = {
  getTaxOverview: (params = {}) => api.get('/taxes/overview', { params }),
  getTaxFilingHistory: (params = {}) => api.get('/taxes/filing-history', { params }),
  getUpcomingDeadlines: (params = {}) => api.get('/taxes/upcoming-deadlines', { params }),
  getComplianceScore: (params = {}) => api.get('/taxes/compliance-score', { params }),
  getFileTax: (filingData) => api.post('/taxes/file', filingData),
  getTaxSettings: () => api.get('/taxes/settings'),
};

export const communicationAPI = {
  // Notifications
  getNotifications: (params = {}) => api.get('/communication/notifications', { params }),
  markNotificationRead: (id) => api.put(`/communication/notifications/${id}`),
  markAllNotificationsRead: () => api.put('/communication/notifications/mark-all-read'),
  deleteNotification: (id) => api.delete(`/communication/notifications/${id}`),
  clearAllNotifications: () => api.delete('/communication/notifications/clear-all'),

  // Messages
  getMessages: (params = {}) => api.get('/communication/messages', { params }),
  sendMessage: (messageData) => api.post('/communication/messages', messageData),
  getMessage: (id) => api.get(`/communication/messages/${id}`),
  updateMessage: (id, messageData) => api.put(`/communication/messages/${id}`, messageData),

  // Announcements
  getAnnouncements: () => api.get('/communication/announcements'),
  createAnnouncement: (announcementData) => api.post('/communication/announcements', announcementData),
  updateAnnouncement: (id, announcementData) => api.put(`/communication/announcements/${id}`, announcementData),
  deleteAnnouncement: (id) => api.delete(`/communication/announcements/${id}`),
};

export const settingsAPI = {
  // Company Profile
  getCompanyProfile: () => api.get('/settings/company-profile'),
  updateCompanyProfile: (profileData) => api.put('/settings/company-profile', profileData),

  // Currency
  getAllowedCurrencies: () => api.get('/settings/allowed-currencies'),

  // Users & Roles
  getUsers: () => api.get('/users/'),
  createUser: (userData) => api.post('/users/', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),

  // Permissions
  getPermissions: () => api.get('/settings/permissions'),
  createPermission: (permissionData) => api.post('/settings/permissions', permissionData),
  updatePermission: (id, permissionData) => api.put(`/settings/permissions/${id}`, permissionData),
  deletePermission: (id) => api.delete(`/settings/permissions/${id}`),

  // System Settings
  getSystemSettings: () => api.get('/settings/system'),
  updateSystemSettings: (settingsData) => api.put('/settings/system', settingsData),

  // Email Settings
  getEmailSettings: () => api.get('/settings/email-settings'),
  updateEmailSettings: (settingsData) => api.put('/settings/email-settings', settingsData),
  testEmailSettings: (testData) => api.post('/settings/email-settings/test', testData),

  // Integrations
  getIntegrations: () => api.get('/settings/integrations'),
  updateIntegration: (id, integrationData) => api.put(`/settings/integrations/${id}`, integrationData),

  // Backup & Restore
  getBackupStatus: () => api.get('/settings/backup'),
  createBackup: () => api.post('/settings/backup'),

  // Audit Logs
  getAuditLogs: (params = {}) => api.get('/settings/audit-logs', { params }),
};

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  uploadProfilePicture: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/auth/upload-profile-picture', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (currentPassword, newPassword) =>
    api.put('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, new_password: newPassword }),
  getSubscriptionStatus: () => api.get('/auth/subscription-status'),
  subscribe: (planId) => api.post('/subscriptions/subscribe', { plan_id: planId }),
};

export const dashboardAPI = {
  getStats: (params = {}) => api.get('/dashboard/stats', { params }),
  getRecentActivity: (params = {}) => api.get('/dashboard/recent-activity', { params }),
  getSalesChart: (period = 'daily', params = {}) => api.get('/dashboard/sales-chart', { params: { ...params, period } }),
  getRevenueExpenseChart: (period = 'daily', params = {}) => api.get('/dashboard/revenue-expense-chart', { params: { ...params, period } }),
  getProductPerformanceChart: (period = 'daily', params = {}) => api.get('/dashboard/product-performance-chart', { params: { ...params, period } }),
};

export const superadminAPI = {
  getStats: () => api.get('/superadmin/stats'),
  toggleModule: (moduleData) => api.post('/superadmin/toggle-module', moduleData),
  getUsers: () => api.get('/superadmin/users'),
  getUser: (userId) => api.get(`/superadmin/users/${userId}`),
  updateUser: (userId, userData) => api.put(`/superadmin/users/${userId}`, userData),
  approveUser: (userId) => api.put(`/superadmin/users/${userId}/approve`),
  rejectUser: (userId) => api.put(`/superadmin/users/${userId}/reject`),
  deleteUser: (userId) => api.delete(`/superadmin/users/${userId}`),
  getBusinesses: () => api.get('/superadmin/businesses'),
  getBusiness: (businessId) => api.get(`/superadmin/businesses/${businessId}`),
  updateBusiness: (businessId, businessData) => api.put(`/superadmin/businesses/${businessId}`, businessData),
  toggleBusinessStatus: (businessId) => api.put(`/superadmin/businesses/${businessId}/toggle-status`),
  deleteBusiness: (businessId) => api.delete(`/superadmin/businesses/${businessId}`),
  getEmailSettings: () => api.get('/superadmin/email-settings'),
  updateEmailSettings: (settingsData) => api.put('/superadmin/email-settings', settingsData),
  testEmailSettings: (testData) => api.post('/superadmin/email-settings/test', testData),

  // Broadcast/Announcements
  sendBroadcast: (data) => api.post('/superadmin/broadcast', data),

  // API Analytics
  getApiAnalytics: (days) => api.get(`/superadmin/api-analytics?days=${days || 7}`),

  // System Settings
  getSystemSettings: () => api.get('/superadmin/system-settings'),
  updateSystemSettings: (settings) => api.put('/superadmin/system-settings', settings),

  // Audit Logs
  getAuditLogs: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/superadmin/audit-logs?${queryParams}`);
  },

  // Platform Overview
  getPlatformOverview: () => api.get('/superadmin/platform-overview'),

  // Quick Actions
  executeQuickAction: (action, data) => api.post('/superadmin/quick-actions', { action, ...data }),

  // Subscription Management
  getAllSubscriptions: () => api.get('/subscriptions/all'),
  getSubscriptionStats: () => api.get('/subscriptions/stats'),
  updateSubscriptionStatus: (id, data) => api.put(`/subscriptions/${id}/status`, data),
  getPlans: () => api.get('/subscriptions/plans'),
  createPlan: (data) => api.post('/subscriptions/plans', data),
  updatePlan: (id, data) => api.put(`/subscriptions/plans/${id}`, data),
  deletePlan: (id) => api.delete(`/subscriptions/plans/${id}`),
};

export const leadsAPI = {
  getLeads: () => api.get('/leads/'),
  createLead: (leadData) => api.post('/leads/', leadData),
  updateLead: (id, leadData) => api.put(`/leads/${id}`, leadData),
  deleteLead: (id) => api.delete(`/leads/${id}`),
};

export const tasksAPI = {
  getTasks: () => api.get('/tasks/'),
  createTask: (taskData) => api.post('/tasks/', taskData),
  updateTask: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
};

export const projectsAPI = {
  getProjects: (params = {}) => api.get('/projects/', { params }),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (projectData) => api.post('/projects/', projectData),
  updateProject: (id, projectData) => api.put(`/projects/${id}`, projectData),
  deleteProject: (id) => api.delete(`/projects/${id}`),
};

export const documentsAPI = {
  getDocuments: (params = {}) => api.get('/documents/', { params }),
  uploadDocument: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  downloadDocument: (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
  viewDocument: (id) => api.get(`/documents/${id}/view`, { responseType: 'blob' }),
  deleteDocument: (id) => api.delete(`/documents/${id}`),
};

export const assetsAPI = {
  getAssets: (params = {}) => api.get('/assets/', { params }),
  getAsset: (id) => api.get(`/assets/${id}`),
  createAsset: (assetData) => api.post('/assets/', assetData),
  updateAsset: (id, assetData) => api.put(`/assets/${id}`, assetData),
  deleteAsset: (id) => api.delete(`/assets/${id}`),
};

export const warehousesAPI = {
  getWarehouses: (params = {}) => api.get('/warehouses/', { params }),
  getWarehouse: (id) => api.get(`/warehouses/${id}`),
  createWarehouse: (warehouseData) => api.post('/warehouses/', warehouseData),
  updateWarehouse: (id, warehouseData) => api.put(`/warehouses/${id}`, warehouseData),
  deleteWarehouse: (id) => api.delete(`/warehouses/${id}`),
};

export const branchesAPI = {
  getBranches: () => api.get('/branches/'),
  getAccessibleBranches: () => api.get('/branches/accessible'),
  getPendingBranches: () => api.get('/branches/pending'),
  approveBranch: (id) => api.post(`/branches/approve/${id}`),
  rejectBranch: (id) => api.post(`/branches/reject/${id}`),
  createBranch: (branchData) => api.post('/branches/', branchData),
  updateBranch: (id, branchData) => api.put(`/branches/${id}`, branchData),
  switchBranch: (id) => api.post(`/branches/switch/${id}`),
  grantBranchAccess: (accessData) => api.post('/branches/user-access', accessData),
  revokeBranchAccess: (accessId) => api.delete(`/branches/user-access/${accessId}`),
};
