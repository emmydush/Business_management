import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome,
  FiShoppingCart,
  FiBox,
  FiDollarSign,
  FiBarChart2,
  FiSettings,
  FiChevronDown,
  FiMenu,
  FiX,
  FiLogOut,
  FiBriefcase,
  FiUsers,
  FiActivity,
  FiMessageSquare,
  FiShield
} from 'react-icons/fi';
import { useAuth } from './auth/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import toast from 'react-hot-toast';
import { Button } from 'react-bootstrap';

const SidebarWithHover = ({ isCollapsed, toggleSidebar }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { features, plan_type, is_superadmin } = useSubscription();
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const isActive = (path) => location.pathname === path;
  const isParentActive = (paths) => paths.some(path => location.pathname.startsWith(path));

  // Map moduleId to subscription feature names
  const moduleFeatureMapping = {
    'dashboard': ['Dashboard Access'],
    'business': ['Company Profile'],
    'customers': ['Customer CRM'],
    'suppliers': ['Supplier Management'],
    'sales': ['Sales Orders', 'POS (Single Terminal)'],
    'inventory': ['Product Management', 'Inventory Management', 'Category Management'],
    'products': ['Product Management'],
    'categories': ['Category Management'],
    'warehouses': ['Warehouse Management'],
    'expenses': ['Expense Tracking'],
    'income': ['Income Management'],
    'accounting': ['Basic Financial Reports'],
    'payroll': ['Payroll Processing'],
    'hr': ['HR & Payroll', 'Employee Management', 'Attendance Tracking', 'Leave Management'],
    'employees': ['Employee Management'],
    'attendance': ['Attendance Tracking'],
    'leave': ['Leave Management'],
    'performance': ['Employee Management'],
    'departments': ['HR & Payroll'],
    'documents': ['Document Management'],
    'approvals': ['Approval Workflows'],
    'workflows': ['Approval Workflows'],
    'assets': ['Asset Management'],
    'purchases': ['Purchase Orders'],
    'purchase_orders': ['Purchase Orders'],
    'goods_received': ['Purchase Orders'],
    'supplier_bills': ['Supplier Bills'],
    'reports': ['Basic Sales Reports', 'Basic Inventory Reports', 'Basic Financial Reports', 'Basic HR Reports', 'Basic Purchase Reports', 'Advanced Reporting'],
    'sales_reports': ['Basic Sales Reports', 'Advanced Reporting'],
    'inventory_reports': ['Basic Inventory Reports', 'Advanced Reporting'],
    'finance_reports': ['Basic Financial Reports', 'Advanced Reporting'],
    'hr_reports': ['Basic HR Reports', 'Advanced Reporting'],
    'purchase_reports': ['Basic Purchase Reports', 'Advanced Reporting'],
    'custom_reports': ['Custom Reports Builder', 'Advanced Reporting'],
    'leads': ['Lead Management'],
    'projects': ['Project Management'],
    'tasks': ['Task Management'],
    'branches': ['Multi-Branch Support', 'Multi-branch'],
    'settings': ['Company Profile'],
    'users': ['User Management'],
    'pos': ['Point of Sale (POS)', 'POS (Single Terminal)'],
    'invoices': ['Invoice Management', 'Invoices'],
    'payments': ['Payments Tracking'],
    'returns': ['Returns Management'],
    'taxes': ['Tax Management'],
    'services': ['Service Management'],
    'crm': ['Customer CRM'],
    'manufacturing': ['Manufacturing'],
    'operations': ['Operations Management'],
    'stock': ['Stock Movements'],
    'low_stock': ['Low Stock Alerts']
  };

  const isModuleAllowed = (moduleId) => {
    if (!user) return false;
    // Superadmins always have access
    if (user.role === 'superadmin' || is_superadmin) return true;

    // Professional and Enterprise plans have access to everything
    // Use lowercase comparison to handle case variations
    const planType = (plan_type || '').toLowerCase();
    if (planType === 'professional' || planType === 'enterprise') return true;

    // Check subscription features
    if (features && features.length > 0) {
      const requiredFeatures = moduleFeatureMapping[moduleId] || [];
      if (requiredFeatures.length > 0) {
        const hasFeatureAccess = requiredFeatures.some(feature => features.includes(feature));
        if (!hasFeatureAccess) return false;
      }
    }

    // If user has specific permissions defined, strictly follow them
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions.includes(moduleId);
    }

    // Fallback to role-based defaults if no specific permissions are set
    const rolePermissions = {
      admin: ['dashboard', 'users', 'customers', 'suppliers', 'inventory', 'sales', 'purchases', 'expenses', 'hr', 'reports', 'settings', 'leads', 'tasks', 'projects', 'documents', 'assets', 'warehouses', 'services', 'crm', 'manufacturing'],
      manager: ['dashboard', 'users', 'customers', 'suppliers', 'inventory', 'sales', 'purchases', 'expenses', 'hr', 'reports', 'leads', 'tasks', 'projects', 'documents', 'assets', 'warehouses', 'services', 'crm', 'manufacturing'],
      staff: ['dashboard', 'customers', 'suppliers', 'inventory', 'sales', 'reports', 'leads', 'tasks', 'projects', 'documents', 'assets', 'services']
    };

    const allowedModules = rolePermissions[user.role] || rolePermissions.admin; // Default to admin permissions for unknown roles
    return allowedModules.includes(moduleId);
  };

  // Define which modules are relevant for each business industry
  const industryModules = {
    // Retail & Trading businesses
    retail: ['dashboard', 'business', 'customers', 'suppliers', 'sales', 'pos', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'leads', 'tasks', 'branches', 'settings'],
    wholesale: ['dashboard', 'business', 'customers', 'suppliers', 'sales', 'pos', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'purchase_orders', 'goods_received', 'leads', 'tasks', 'branches', 'settings'],
    supermarket: ['dashboard', 'business', 'customers', 'suppliers', 'sales', 'pos', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'low_stock', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'purchase_orders', 'goods_received', 'tasks', 'branches', 'settings'],
    ecommerce: ['dashboard', 'business', 'customers', 'suppliers', 'sales', 'pos', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'leads', 'tasks', 'settings'],
    
    // Manufacturing
    manufacturing: ['dashboard', 'business', 'customers', 'suppliers', 'sales', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'manufacturing', 'bom', 'production', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'purchase_orders', 'goods_received', 'tasks', 'branches', 'settings'],
    food_processing: ['dashboard', 'business', 'customers', 'suppliers', 'sales', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'manufacturing', 'bom', 'production', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'purchase_orders', 'goods_received', 'tasks', 'settings'],
    
    // Services
    services: ['dashboard', 'business', 'customers', 'leads', 'projects', 'tasks', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'attendance', 'payroll', 'documents', 'settings'],
    consulting: ['dashboard', 'business', 'customers', 'leads', 'projects', 'tasks', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'documents', 'settings'],
    it_services: ['dashboard', 'business', 'customers', 'leads', 'projects', 'tasks', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'attendance', 'documents', 'settings'],
    cleaning_services: ['dashboard', 'business', 'customers', 'leads', 'projects', 'tasks', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'attendance', 'documents', 'settings'],
    salon: ['dashboard', 'business', 'customers', 'leads', 'appointments', 'tasks', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'attendance', 'products', 'inventory', 'settings'],
    repair_services: ['dashboard', 'business', 'customers', 'leads', 'tasks', 'invoices', 'payments', 'inventory', 'products', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'documents', 'settings'],
    digital_marketing: ['dashboard', 'business', 'customers', 'leads', 'projects', 'tasks', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'crm', 'campaigns', 'hr', 'employees', 'documents', 'settings'],
    security_services: ['dashboard', 'business', 'customers', 'leads', 'tasks', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'attendance', 'payroll', 'documents', 'settings'],
    event_planning: ['dashboard', 'business', 'customers', 'leads', 'projects', 'tasks', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'crm', 'hr', 'employees', 'documents', 'settings'],
    
    // Healthcare
    healthcare: ['dashboard', 'business', 'customers', 'patients', 'appointments', 'invoices', 'payments', 'inventory', 'products', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'attendance', 'payroll', 'documents', 'settings'],
    pharmacy: ['dashboard', 'business', 'customers', 'suppliers', 'sales', 'pos', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'purchase_orders', 'documents', 'settings'],
    
    // Hospitality & Tourism
    restaurant: ['dashboard', 'business', 'customers', 'sales', 'pos', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'tasks', 'hr', 'employees', 'attendance', 'documents', 'settings'],
    cafe: ['dashboard', 'business', 'customers', 'sales', 'pos', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'tasks', 'settings'],
    hotel: ['dashboard', 'business', 'customers', 'reservations', 'rooms', 'invoices', 'payments', 'inventory', 'products', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'attendance', 'documents', 'settings'],
    travel_agency: ['dashboard', 'business', 'customers', 'leads', 'bookings', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'crm', 'hr', 'employees', 'documents', 'settings'],
    
    // Agriculture
    agriculture: ['dashboard', 'business', 'suppliers', 'sales', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'manufacturing', 'production', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'tasks', 'hr', 'employees', 'settings'],
    poultry: ['dashboard', 'business', 'suppliers', 'sales', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'manufacturing', 'production', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'tasks', 'hr', 'employees', 'settings'],
    dairy: ['dashboard', 'business', 'suppliers', 'sales', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'manufacturing', 'production', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'tasks', 'hr', 'employees', 'settings'],
    fish_farming: ['dashboard', 'business', 'suppliers', 'sales', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'manufacturing', 'production', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'tasks', 'settings'],
    
    // Transport & Logistics
    transportation: ['dashboard', 'business', 'customers', 'leads', 'sales', 'invoices', 'payments', 'inventory', 'products', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'attendance', 'fleet', 'assets', 'tasks', 'settings'],
    logistics: ['dashboard', 'business', 'customers', 'suppliers', 'sales', 'invoices', 'payments', 'inventory', 'products', 'warehouses', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'tasks', 'hr', 'employees', 'fleet', 'assets', 'settings'],
    
    // Real Estate & Construction
    real_estate: ['dashboard', 'business', 'customers', 'leads', 'properties', 'projects', 'tasks', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'documents', 'settings'],
    construction: ['dashboard', 'business', 'customers', 'leads', 'projects', 'tasks', 'invoices', 'payments', 'inventory', 'products', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'documents', 'assets', 'settings'],
    property_management: ['dashboard', 'business', 'customers', 'leads', 'properties', 'tenants', 'leases', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'documents', 'settings'],
    
    // Other
    technology: ['dashboard', 'business', 'customers', 'leads', 'projects', 'tasks', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'documents', 'settings'],
    education: ['dashboard', 'business', 'students', 'courses', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'attendance', 'documents', 'settings'],
    finance: ['dashboard', 'business', 'customers', 'leads', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'documents', 'settings'],
    other: null // Show all modules
  };

  // Get industry from user business info
  const userIndustry = user?.industry || null;
  
  // Check if a module should be shown based on industry
  const isIndustryAllowed = (moduleId) => {
    // If no industry set or 'other', show all modules (filtered by permissions only)
    if (!userIndustry || userIndustry === 'other') return true;
    
    const industryAllowedModules = industryModules[userIndustry] || industryModules[userIndustry.toLowerCase()];
    
    // If industry not found in mapping, show all modules
    if (!industryAllowedModules) return true;
    
    return industryAllowedModules.includes(moduleId);
  };

  const navItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      moduleId: 'dashboard',
      icon: <FiHome size={20} />,
      active: isActive('/dashboard')
    },
    {
      title: 'Business',
      moduleId: 'business', // Parent module
      icon: <FiBriefcase size={20} />,
      active: isParentActive(['/customers', '/suppliers', '/leads', '/projects', '/tasks']),
      submenu: [
        { title: 'Customers', path: '/customers', moduleId: 'customers', active: isActive('/customers') },
        { title: 'Suppliers', path: '/suppliers', moduleId: 'suppliers', active: isActive('/suppliers') },
        { title: 'Leads', path: '/leads', moduleId: 'leads', active: isActive('/leads') },
        { title: 'Projects', path: '/projects', moduleId: 'projects', active: isActive('/projects') },
        { title: 'Tasks', path: '/tasks', moduleId: 'tasks', active: isActive('/tasks') },
        { title: 'Branches', path: '/branches', moduleId: 'settings', active: isActive('/branches') }
      ]
    },
    {
      title: 'Sales',
      moduleId: 'sales',
      icon: <FiShoppingCart size={20} />,
      active: isParentActive(['/sales-orders', '/invoices', '/payments', '/pos', '/sales-reports', '/returns']),
      submenu: [
        { title: 'Sales Orders', path: '/sales-orders', moduleId: 'sales', active: isActive('/sales-orders') },
        { title: 'Invoices', path: '/invoices', moduleId: 'sales', active: isActive('/invoices') },
        { title: 'Payments', path: '/payments', moduleId: 'sales', active: isActive('/payments') },
        { title: 'POS', path: '/pos', moduleId: 'sales', active: isActive('/pos') },
        { title: 'Sales Reports', path: '/sales-reports', moduleId: 'reports', active: isActive('/sales-reports') },
        { title: 'Debtors (Owed Money)', path: '/debtors', moduleId: 'sales', active: isActive('/debtors') },
        { title: 'Returns', path: '/returns', moduleId: 'sales', active: isActive('/returns') }
      ]
    },
    {
      title: 'Inventory',
      moduleId: 'inventory',
      icon: <FiBox size={20} />,
      active: isParentActive(['/products', '/categories', '/stock', '/warehouses', '/low-stock']),
      submenu: [
        { title: 'Products', path: '/products', moduleId: 'inventory', active: isActive('/products') },
        { title: 'Categories', path: '/categories', moduleId: 'inventory', active: isActive('/categories') },
        { title: 'Stock Movements', path: '/stock', moduleId: 'inventory', active: isActive('/stock') },
        { title: 'Warehouses', path: '/warehouses', moduleId: 'warehouses', active: isActive('/warehouses') },
        { title: 'Low Stock', path: '/low-stock', moduleId: 'inventory', active: isActive('/low-stock') }
      ]
    },
    {
      title: 'Finance',
      moduleId: 'expenses',
      icon: <FiDollarSign size={20} />,
      active: isParentActive(['/expenses', '/income', '/accounting', '/payroll', '/taxes']),
      submenu: [
        { title: 'Expenses', path: '/expenses', moduleId: 'expenses', active: isActive('/expenses') },
        { title: 'Income', path: '/income', moduleId: 'expenses', active: isActive('/income') },
        { title: 'Accounting', path: '/accounting', moduleId: 'expenses', active: isActive('/accounting') },
        { title: 'Payroll', path: '/payroll', moduleId: 'hr', active: isActive('/payroll') },
        { title: 'Taxes', path: '/taxes', moduleId: 'expenses', active: isActive('/taxes') }
      ]
    },
    {
      title: 'HR',
      moduleId: 'hr',
      icon: <FiUsers size={20} />,
      active: isParentActive(['/employees', '/attendance', '/leave', '/performance', '/departments', '/documents', '/approvals', '/workflows', '/assets']),
      submenu: [
        { title: 'Employees', path: '/employees', moduleId: 'hr', active: isActive('/employees') },
        { title: 'Attendance', path: '/attendance', moduleId: 'hr', active: isActive('/attendance') },
        { title: 'Leave', path: '/leave', moduleId: 'hr', active: isActive('/leave') },
        { title: 'Performance', path: '/performance', moduleId: 'hr', active: isActive('/performance') },
        { title: 'Departments', path: '/departments', moduleId: 'hr', active: isActive('/departments') },
        { title: 'Documents', path: '/documents', moduleId: 'documents', active: isActive('/documents') },
        { title: 'Approvals', path: '/approvals', moduleId: 'hr', active: isActive('/approvals') },
        { title: 'Workflows', path: '/workflows', moduleId: 'hr', active: isActive('/workflows') },
        { title: 'Assets', path: '/assets', moduleId: 'assets', active: isActive('/assets') }
      ]
    },
    {
      title: 'Purchases',
      moduleId: 'purchases',
      icon: <FiShoppingCart size={20} />,
      active: isParentActive(['/purchases', '/purchase-orders', '/goods-received', '/supplier-bills', '/purchase-reports']),
      submenu: [
        { title: 'Purchase Transactions', path: '/purchases', moduleId: 'purchases', active: isActive('/purchases') },
        { title: 'Purchase Orders', path: '/purchase-orders', moduleId: 'purchases', active: isActive('/purchase-orders') },
        { title: 'Goods Received', path: '/goods-received', moduleId: 'purchases', active: isActive('/goods-received') },
        { title: 'Supplier Bills', path: '/supplier-bills', moduleId: 'purchases', active: isActive('/supplier-bills') },
        { title: 'Purchase Reports', path: '/purchase-reports', moduleId: 'reports', active: isActive('/purchase-reports') }
      ]
    },
    {
      title: 'Operations',
      moduleId: 'dashboard', // General operations
      icon: <FiActivity size={20} />,
      active: isParentActive(['/operations', '/approvals', '/workflows', '/documents', '/assets']),
      submenu: [
        { title: 'Operations Management', path: '/operations', moduleId: 'dashboard', active: isActive('/operations') },
        { title: 'Approvals', path: '/approvals', moduleId: 'hr', active: isActive('/approvals') },
        { title: 'Workflows', path: '/workflows', moduleId: 'hr', active: isActive('/workflows') },
        { title: 'Documents', path: '/documents', moduleId: 'documents', active: isActive('/documents') },
        { title: 'Assets', path: '/assets', moduleId: 'assets', active: isActive('/assets') }
      ]
    },
    {
      title: 'Reports',
      path: '/reports',
      moduleId: 'reports',
      icon: <FiBarChart2 size={20} />,
      active: isActive('/reports')
    },
    {
      title: 'Communication',
      moduleId: 'dashboard',
      icon: <FiMessageSquare size={20} />,
      active: isParentActive(['/notifications', '/messages', '/announcements']),
      submenu: [
        { title: 'Notifications', path: '/notifications', moduleId: 'dashboard', active: isActive('/notifications') },
        { title: 'Messages', path: '/messages', moduleId: 'dashboard', active: isActive('/messages') },
        { title: 'Announcements', path: '/announcements', moduleId: 'dashboard', active: isActive('/announcements') }
      ]
    },
    {
      title: 'Settings',
      moduleId: 'settings',
      icon: <FiSettings size={20} />,
      active: isParentActive(['/settings', '/advanced-settings', '/users', '/team-management', '/company-profile', '/permissions', '/system-settings', '/integrations', '/backup', '/audit-logs']),
      submenu: [
        { title: 'General Settings', path: '/settings', moduleId: 'settings', active: isActive('/settings') },
        { title: 'Subscription', path: '/subscription', moduleId: 'settings', active: isActive('/subscription') },
        { title: 'Advanced Settings', path: '/advanced-settings', moduleId: 'settings', active: isActive('/advanced-settings') },
        { title: 'User Management', path: '/users', moduleId: 'users', active: isActive('/users') },
        { title: 'Team Management', path: '/team-management', moduleId: 'users', active: isActive('/team-management'), description: 'Manage team members and access' },
        { title: 'Company Profile', path: '/company-profile', moduleId: 'settings', active: isActive('/company-profile') },
        { title: 'Permissions', path: '/permissions', moduleId: 'settings', active: isActive('/permissions') },
        { title: 'System Settings', path: '/system-settings', moduleId: 'settings', active: isActive('/system-settings') },
        { title: 'Integrations', path: '/integrations', moduleId: 'settings', active: isActive('/integrations') },
        { title: 'Backup', path: '/backup', moduleId: 'settings', active: isActive('/backup') },
        { title: 'Audit Logs', path: '/audit-logs', moduleId: 'settings', active: isActive('/audit-logs') }
      ]
    },
    // New Advanced Business Modules
    {
      title: 'Service Management',
      moduleId: 'services',
      icon: <FiBriefcase size={20} />,
      active: isParentActive(['/service']),
      submenu: [
        { title: 'Services', path: '/service', moduleId: 'services', active: isActive('/service') }
      ]
    },
    {
      title: 'CRM & Marketing',
      moduleId: 'crm',
      icon: <FiUsers size={20} />,
      active: isParentActive(['/crm']),
      submenu: [
        { title: 'CRM Dashboard', path: '/crm', moduleId: 'crm', active: isActive('/crm') }
      ]
    },
    {
      title: 'Manufacturing',
      moduleId: 'manufacturing',
      icon: <FiBox size={20} />,
      active: isParentActive(['/manufacturing']),
      submenu: [
        { title: 'Production', path: '/manufacturing', moduleId: 'manufacturing', active: isActive('/manufacturing') }
      ]
    }
  ];

  // Filter navItems based on permissions and industry
  const navItemsWithPermissions = navItems.filter(item => {
    // Check industry filtering first
    if (item.moduleId && !isIndustryAllowed(item.moduleId)) {
      return false;
    }
    
    if (item.submenu) {
      // Filter submenu items first
      item.submenu = item.submenu.filter(sub => {
        // Check both permission and industry
        const allowedByPermission = isModuleAllowed(sub.moduleId);
        const allowedByIndustry = isIndustryAllowed(sub.moduleId);
        return allowedByPermission && allowedByIndustry;
      });
      // Only keep the parent if it has at least one allowed sub-item
      return item.submenu.length > 0;
    }
    return isModuleAllowed(item.moduleId);
  });

  // use items filtered by permissions (search removed)
  const filteredNavItems = navItemsWithPermissions;

  // Filter settings submenu based on role (additional restriction)
  const settingsItem = filteredNavItems.find(item => item.title === 'Settings');
  if (settingsItem && user?.role !== 'superadmin') {
    const restrictedPaths = ['/advanced-settings', '/system-settings', '/integrations', '/backup'];
    settingsItem.submenu = settingsItem.submenu.filter(sub => !restrictedPaths.includes(sub.path));
  }

  // Add Superadmin link if user is superadmin
  if (user && user.role === 'superadmin') {
    filteredNavItems.push({
      title: 'Superadmin',
      path: '/superadmin',
      icon: <FiShield size={20} />,
      active: isActive('/superadmin')
    });
  }

  const handleLogout = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    toast((t) => (
      <div className="d-flex flex-column gap-3 p-1">
        <div className="d-flex align-items-center gap-2">
          <FiLogOut className="text-danger" size={20} />
          <span className="fw-bold" style={{ fontSize: '1.1rem' }}>Confirm Logout</span>
        </div>
        <p className="mb-0 text-white-50 small">Are you sure you want to log out of your account?</p>
        <div className="d-flex gap-2 justify-content-end mt-1">
          <Button
            size="sm"
            variant="outline-light"
            className="border-0"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="danger"
            className="px-3 shadow-sm"
            onClick={() => {
              toast.dismiss(t.id);
              window.location.href = '/logout';
            }}
          >
            Logout
          </Button>
        </div>
      </div>
    ), {
      duration: 8000,
      style: {
        minWidth: '350px',
        background: '#0f172a',
        border: '1px solid rgba(255,255,255,0.1)'
      }
    });
  };

  const handleSubmenuToggle = (title) => {
    if (isCollapsed) {
      toggleSidebar();
      setOpenSubmenu(title);
    } else {
      setOpenSubmenu(openSubmenu === title ? null : title);
    }
  };

  return (
    <motion.div
      className="sidebar-wrapper"
      initial={false}
      animate={{
        width: isCollapsed ? 80 : 260,
        x: (window.innerWidth < 992 && isCollapsed) ? -260 : 0
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className={`sidebar-header d-flex align-items-center ${isCollapsed ? 'justify-content-center' : 'justify-content-between'} p-3`}>
        {/* sidebar header - search removed */}
        {!isCollapsed && (
          <></>
        )}
        {!isCollapsed && (
          <button className="toggle-btn border-0 bg-transparent text-white" onClick={toggleSidebar}>
            <FiX size={20} />
          </button>
        )}
        {isCollapsed && (
          <button className="toggle-btn border-0 bg-transparent text-white mt-2" onClick={toggleSidebar}>
            <FiMenu size={20} />
          </button>
        )}
      </div>

      <div className="sidebar-nav-container px-2 py-3">
        {filteredNavItems.map((item, index) => (
          <div
            key={index}
            className="nav-item-wrapper mb-1"
          >
            {item.submenu ? (
              <>
                <motion.div
                  className={`nav-link-custom d-flex align-items-center py-2 px-3 rounded ${item.active ? 'active' : ''}`}
                  onClick={() => handleSubmenuToggle(item.title)}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="icon-wrapper">{item.icon}</span>
                  {!isCollapsed && (
                    <motion.div
                      className="d-flex align-items-center flex-grow-1 ms-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <span className="flex-grow-1 text-nowrap">{item.title}</span>
                      <motion.span
                        animate={{ rotate: (openSubmenu === item.title || item.active) ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="d-flex"
                      >
                        <FiChevronDown size={16} />
                      </motion.span>
                    </motion.div>
                  )}
                </motion.div>

                <AnimatePresence>
                  {(openSubmenu === item.title || (item.active && openSubmenu === null)) && !isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="submenu-container overflow-hidden"
                    >
                      {item.submenu.map((subItem, subIndex) => (
                        <motion.div
                          key={subIndex}
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: subIndex * 0.05 }}
                        >
                          <Link
                            to={subItem.path}
                            className={`nav-link-custom-submenu d-flex align-items-center py-2 px-4 ms-4 rounded ${subItem.active ? 'active' : ''}`}
                            onClick={() => {
                              // Close sidebar on mobile when clicking a link
                              if (window.innerWidth < 992) {
                                // Only close if sidebar is currently open (not collapsed)
                                if (!isCollapsed) {
                                  toggleSidebar();
                                }
                              }
                            }}
                          >
                            <span className="text-nowrap">{subItem.title}</span>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <Link
                to={item.path}
                className={`nav-link-custom d-flex align-items-center py-2 px-3 rounded ${item.active ? 'active' : ''}`}
                onClick={() => {
                  // Close sidebar on mobile when clicking a link
                  if (window.innerWidth < 992) {
                    // Only close if sidebar is currently open (not collapsed)
                    if (!isCollapsed) {
                      toggleSidebar();
                    }
                  }
                }}
              >
                <span className="icon-wrapper">{item.icon}</span>
                {!isCollapsed && (
                  <motion.span
                    className="ms-3 text-nowrap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {item.title}
                  </motion.span>
                )}
              </Link>
            )}
          </div>
        ))}
        {/* Logout Button in Menu */}
        <div className="nav-item-wrapper mt-auto mb-2">
          <button
            className={`nav-link-custom d-flex align-items-center py-2 px-3 rounded w-100 border-0 bg-transparent`}
            onClick={handleLogout}
            style={{ color: '#dc2626' }}
          >
            <span className="icon-wrapper"><FiLogOut size={20} /></span>
            {!isCollapsed && (
              <motion.span
                className="ms-3 text-nowrap fw-semibold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {'Logout' || 'Logout'}
              </motion.span>
            )}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .sidebar-wrapper {
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1200;
          background: #f8f9fa;
          color: #333333;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          /* rounded right side corners */
          border-radius: 0 24px 24px 0;
          border-right: none;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        @media (max-width: 991.98px) {
          .sidebar-wrapper {
            width: 260px !important;
            /* on mobile keep slight rounding to avoid sharp edge */
            border-radius: 0 16px 16px 0;
          }
        }

        @media (max-width: 991.98px) {
          .sidebar-wrapper {
            width: 260px !important;
          }
        }
        
        .sidebar-header {
          height: 72px;
          min-height: 72px;
          background: rgba(255, 255, 255, 0.03);
        }
        
        .toggle-btn {
          opacity: 0.7;
          transition: opacity 0.2s;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #333333 !important;
        }
        
        .toggle-btn:hover {
          opacity: 1;
          transform: scale(1.1);
          color: #6b46c1 !important;
        }
        
        .sidebar-nav-container {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .sidebar-nav-container::-webkit-scrollbar {
          width: 6px;
        }
        
        .sidebar-nav-container::-webkit-scrollbar-thumb {
          /* thumb should match sidebar background and be subtle */
          background: rgba(0,0,0,0.2);
          border-radius: 3px;
        }

        .sidebar-nav-container::-webkit-scrollbar-track {
          /* track invisible */
          background: transparent;
        }
        
        .nav-item-wrapper {
          width: 100%;
          display: block;
        }
        
        .nav-link-custom {
          /* main menu entries should be pure black for better contrast */
          color: #000 !important;
          transition: all 0.2s ease;
          text-decoration: none !important;
          position: relative;
          cursor: pointer;
          width: 100%;
          font-weight: 500;
          font-size: 0.95rem;
          letter-spacing: 0.2px;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
        }
        
        .nav-link-custom:hover {
          color: #1a1a1a !important;
          background: rgba(139, 92, 246, 0.2) !important;
          border-radius: 12px;
          transform: translateX(2px);
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        
        .nav-link-custom.active {
          color: #1a1a1a !important;
          background: linear-gradient(90deg, rgba(139, 92, 246, 0.3) 0%, rgba(99, 102, 241, 0.2) 100%) !important;
          border-radius: 12px;
          font-weight: 600;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        
        .nav-link-custom.active::before {
          content: '';
          position: absolute;
          left: -8px;
          top: 20%;
          height: 60%;
          width: 4px;
          background: linear-gradient(180deg, #8b5cf6 0%, #6366f1 100%);
          border-radius: 0 4px 4px 0;
          box-shadow: 0 0 15px rgba(139, 92, 246, 0.6);
        }
        
        .icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }
        
        .text-nowrap {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .nav-link-custom-submenu {
          color: rgba(51, 51, 51, 0.7) !important;
          font-size: 0.9rem;
          transition: all 0.2s ease;
          text-decoration: none !important;
          display: block;
          width: calc(100% - 1.5rem);
          font-weight: 400;
          letter-spacing: 0.1px;
          text-shadow: 0 1px 1px rgba(255, 255, 255, 0.2);
        }
        
        .nav-link-custom-submenu:hover {
          color: #1a1a1a !important;
          background: rgba(139, 92, 246, 0.15) !important;
          transform: translateX(4px);
          border-radius: 10px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .nav-link-custom-submenu.active {
          color: #4c1d95 !important;
          font-weight: 600;
          background: rgba(139, 92, 246, 0.12) !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        
        .logout-btn {
          opacity: 0.5;
          transition: all 0.2;
          cursor: pointer;
        }
        
        .logout-btn:hover {
          opacity: 1;
          color: #f87171 !important;
          transform: scale(1.1);
        }

        .business-name-container span {
          color: #4c1d95 !important;
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          font-weight: 700;
          letter-spacing: 0.8px;
        }
        
              `}} />
    </motion.div>
  );
};

export default SidebarWithHover;

