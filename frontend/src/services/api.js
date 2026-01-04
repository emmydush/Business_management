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
    const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
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
  createPosSale: (saleData) => api.post('/sales/pos', saleData),
};

export const purchasesAPI = {
  getPurchaseOrders: (params = {}) => api.get('/purchases/orders', { params }),
  getPurchaseOrder: (orderId) => api.get(`/purchases/orders/${orderId}`),
  createPurchaseOrder: (orderData) => api.post('/purchases/orders', orderData),
  updatePurchaseOrder: (orderId, orderData) => api.put(`/purchases/orders/${orderId}`, orderData),
  receiveGoods: (receiptData) => api.post('/purchases/goods-receipt', receiptData),
  getSuppliers: () => api.get('/purchases/suppliers'),
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
};

export const reportsAPI = {
  getSalesReport: (params = {}) => api.get('/reports/sales', { params }),
  getInventoryReport: (params = {}) => api.get('/reports/inventory', { params }),
  getCustomerReport: () => api.get('/reports/customers'),
  getOrderReport: () => api.get('/reports/orders'),
  getFinancialReport: (params = {}) => api.get('/reports/financial', { params }),
  getBusinessSummary: () => api.get('/reports/summary'),
};

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};