import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Backend API base URL
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

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid, redirect to login
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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
  createProduct: (productData) => api.post('/inventory/products', productData),
  updateProduct: (productId, productData) => api.put(`/inventory/products/${productId}`, productData),
  deleteProduct: (productId) => api.delete(`/inventory/products/${productId}`),
  getCategories: () => api.get('/inventory/categories'),
  createCategory: (categoryData) => api.post('/inventory/categories', categoryData),
  adjustStock: (adjustmentData) => api.post('/inventory/stock-adjustment', adjustmentData),
  exportProducts: () => api.get('/reports/export/inventory'),
};

export const customersAPI = {
  getCustomers: (params = {}) => api.get('/customers/', { params }),
  getCustomer: (customerId) => api.get(`/customers/${customerId}`),
  createCustomer: (customerData) => api.post('/customers/', customerData),
  updateCustomer: (customerId, customerData) => api.put(`/customers/${customerId}`, customerData),
  deleteCustomer: (customerId) => api.delete(`/customers/${customerId}`),
  getCustomerOrders: (customerId) => api.get(`/customers/${customerId}/orders`),
};

export const hrAPI = {
  getEmployees: (params = {}) => api.get('/hr/employees', { params }),
  getEmployee: (employeeId) => api.get(`/hr/employees/${employeeId}`),
  createEmployee: (employeeData) => api.post('/hr/employees', employeeData),
  updateEmployee: (employeeId, employeeData) => api.put(`/hr/employees/${employeeId}`, employeeData),
  deleteEmployee: (employeeId) => api.delete(`/hr/employees/${employeeId}`),
  getDepartments: () => api.get('/hr/departments'),
  getPositions: () => api.get('/hr/positions'),
  getPayroll: () => api.get('/hr/payroll'),
  getAttendance: () => api.get('/hr/attendance'),
  getLeaveRequests: (params = {}) => api.get('/hr/leave-requests', { params }),
  approveLeaveRequest: (leaveId) => api.put(`/hr/leave-requests/${leaveId}/approve`),
  rejectLeaveRequest: (leaveId) => api.put(`/hr/leave-requests/${leaveId}/reject`),
  exportPayroll: () => api.get('/reports/export/payroll'),
  exportEmployees: () => api.get('/reports/export/employees'),
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
};

export const communicationAPI = {
  // Notifications
  getNotifications: (params = {}) => api.get('/communication/notifications', { params }),
  markNotificationRead: (id) => api.put(`/communication/notifications/${id}`),
  markAllNotificationsRead: () => api.put('/communication/notifications/mark-all-read'),
  
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
  
  // Users & Roles
  getUsers: () => api.get('/settings/users'),
  updateUser: (id, userData) => api.put(`/settings/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/settings/users/${id}`),
  
  // Permissions
  getPermissions: () => api.get('/settings/permissions'),
  createPermission: (permissionData) => api.post('/settings/permissions', permissionData),
  updatePermission: (id, permissionData) => api.put(`/settings/permissions/${id}`, permissionData),
  deletePermission: (id) => api.delete(`/settings/permissions/${id}`),
  
  // System Settings
  getSystemSettings: () => api.get('/settings/system'),
  updateSystemSettings: (settingsData) => api.put('/settings/system', settingsData),
  
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
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
  getSalesChart: () => api.get('/dashboard/sales-chart'),
  getRevenueExpenseChart: () => api.get('/dashboard/revenue-expense-chart'),
  getProductPerformanceChart: () => api.get('/dashboard/product-performance-chart'),
};
export const superadminAPI = {
  getStats: () => api.get('/superadmin/stats'),
  getSystemHealth: () => api.get('/superadmin/system-health'),
  toggleModule: (moduleData) => api.post('/superadmin/toggle-module', moduleData),
  getPendingUsers: () => api.get('/superadmin/pending-users'),
  approveUser: (userId) => api.put('/superadmin/users/' + userId + '/approve'),
  rejectUser: (userId) => api.put('/superadmin/users/' + userId + '/reject'),
};
