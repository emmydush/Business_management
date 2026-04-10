import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  FiShield,
  FiSearch,
  FiPlus
} from 'react-icons/fi';
import { useAuth } from './auth/AuthContext';
// import { useSubscription } from '../context/SubscriptionContext'; // DISABLED - No longer needed
import toast from 'react-hot-toast';
import { Button } from 'react-bootstrap';
import Logo from './Logo';

const SidebarWithHover = ({ isCollapsed, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  // const { features, plan_type, is_superadmin } = useSubscription(); // DISABLED - No longer needed
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const isActive = (path) => location.pathname === path;
  const isParentActive = (paths) => paths.some(path => location.pathname.startsWith(path));

  // Map moduleId to subscription feature names - DISABLED
  /*
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
    'payroll': ['Payroll Processing'],
    'hr': ['HR & Payroll', 'Employee Management', 'Attendance Tracking', 'Leave Management'],
    'employees': ['Employee Management'],
    'attendance': ['Attendance Tracking'],
    'leave': ['Leave Management'],
    'performance': ['Employee Management'],
    'departments': ['HR & Payroll'],
    'documents': ['Document Management'],
    'approvals': ['Approval Workflows'],
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
    'operations': ['Operations Management'],
    'stock': ['Stock Movements'],
    'low_stock': ['Low Stock Alerts']
  };
  */

  // const isModuleAllowed = () => {
  //   if (!user) return false;
  //   // Superadmin should not see business user modules here
  //   if (user.role === 'superadmin') return false;
  //   // All users now have access to all modules - subscription restrictions removed
  //   return true;
  // }; // DISABLED - No longer needed

  // Define which modules are relevant for each business industry - DISABLED
  // const industryModules = {
    // Retail & Trading businesses
    // retail: ['dashboard', 'business', 'customers', 'suppliers', 'sales', 'pos', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'leads', 'tasks', 'branches', 'settings'],
    // wholesale: ['dashboard', 'business', 'customers', 'suppliers', 'sales', 'pos', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'purchase_orders', 'goods_received', 'leads', 'tasks', 'branches', 'settings'],
    // supermarket: ['dashboard', 'business', 'customers', 'suppliers', 'sales', 'pos', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'low_stock', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'purchase_orders', 'goods_received', 'tasks', 'branches', 'settings'],
    // ecommerce: ['dashboard', 'business', 'customers', 'suppliers', 'sales', 'pos', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'leads', 'tasks', 'settings'],
    
    // Manufacturing
    // manufacturing: ['dashboard', 'business', 'customers', 'suppliers', 'sales', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'manufacturing', 'bom', 'production', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'purchase_orders', 'goods_received', 'tasks', 'branches', 'settings'],
    // food_processing: ['dashboard', 'business', 'customers', 'suppliers', 'sales', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'manufacturing', 'bom', 'production', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'purchase_orders', 'goods_received', 'tasks', 'settings'],
    
    // Services
    // services: ['dashboard', 'business', 'customers', 'leads', 'projects', 'tasks', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'attendance', 'documents', 'settings'],
    // consulting: ['dashboard', 'business', 'customers', 'leads', 'projects', 'tasks', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'documents', 'settings'],
    // it_services: ['dashboard', 'business', 'customers', 'leads', 'projects', 'tasks', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'attendance', 'documents', 'settings'],
    // cleaning_services: ['dashboard', 'business', 'customers', 'leads', 'projects', 'tasks', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'attendance', 'documents', 'settings'],
    // salon: ['dashboard', 'business', 'customers', 'leads', 'appointments', 'tasks', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'attendance', 'products', 'inventory', 'settings'],
    // repair_services: ['dashboard', 'business', 'customers', 'leads', 'tasks', 'invoices', 'payments', 'inventory', 'products', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'documents', 'settings'],
    // digital_marketing: ['dashboard', 'business', 'customers', 'leads', 'projects', 'tasks', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'crm', 'campaigns', 'hr', 'employees', 'documents', 'settings'],
    // security_services: ['dashboard', 'business', 'customers', 'leads', 'tasks', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'attendance', 'payroll', 'documents', 'settings'],
    // event_planning: ['dashboard', 'business', 'customers', 'leads', 'projects', 'tasks', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'crm', 'hr', 'employees', 'documents', 'settings'],
    
    // Healthcare
    // healthcare: ['dashboard', 'business', 'customers', 'patients', 'appointments', 'invoices', 'payments', 'inventory', 'products', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'attendance', 'payroll', 'documents', 'settings'],
    // pharmacy: ['dashboard', 'business', 'customers', 'suppliers', 'sales', 'pos', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'purchase_orders', 'documents', 'settings'],
    
    // Hospitality & Tourism
    // restaurant: ['dashboard', 'business', 'customers', 'sales', 'pos', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'tasks', 'hr', 'employees', 'attendance', 'documents', 'settings'],
    // cafe: ['dashboard', 'business', 'customers', 'sales', 'pos', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'tasks', 'settings'],
    // hotel: ['dashboard', 'business', 'customers', 'reservations', 'rooms', 'invoices', 'payments', 'inventory', 'products', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'attendance', 'documents', 'settings'],
    // travel_agency: ['dashboard', 'business', 'customers', 'leads', 'bookings', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'crm', 'hr', 'employees', 'documents', 'settings'],
    
    // Agriculture
    // agriculture: ['dashboard', 'business', 'suppliers', 'sales', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'manufacturing', 'production', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'tasks', 'hr', 'employees', 'settings'],
    // poultry: ['dashboard', 'business', 'suppliers', 'sales', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'manufacturing', 'production', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'tasks', 'hr', 'employees', 'settings'],
    // dairy: ['dashboard', 'business', 'suppliers', 'sales', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'manufacturing', 'production', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'tasks', 'hr', 'employees', 'settings'],
    // fish_farming: ['dashboard', 'business', 'suppliers', 'sales', 'invoices', 'payments', 'inventory', 'products', 'categories', 'warehouses', 'manufacturing', 'production', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'tasks', 'settings'],
    
    // Transport & Logistics
    // transportation: ['dashboard', 'business', 'customers', 'leads', 'sales', 'invoices', 'payments', 'inventory', 'products', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'attendance', 'fleet', 'assets', 'tasks', 'settings'],
    // logistics: ['dashboard', 'business', 'customers', 'suppliers', 'sales', 'invoices', 'payments', 'inventory', 'products', 'warehouses', 'expenses', 'income', 'accounting', 'reports', 'purchases', 'tasks', 'hr', 'employees', 'fleet', 'assets', 'settings'],
    
    // Real Estate & Construction
    // real_estate: ['dashboard', 'business', 'customers', 'leads', 'properties', 'projects', 'tasks', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'documents', 'settings'],
    // construction: ['dashboard', 'business', 'customers', 'leads', 'projects', 'tasks', 'invoices', 'payments', 'inventory', 'products', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'documents', 'assets', 'settings'],
    // property_management: ['dashboard', 'business', 'customers', 'leads', 'properties', 'tenants', 'leases', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'documents', 'settings'],
    
    // Other
    // technology: ['dashboard', 'business', 'customers', 'leads', 'projects', 'tasks', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'documents', 'settings'],
    // education: ['dashboard', 'business', 'students', 'courses', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'attendance', 'documents', 'settings'],
    // finance: ['dashboard', 'business', 'customers', 'leads', 'invoices', 'payments', 'expenses', 'income', 'accounting', 'reports', 'hr', 'employees', 'documents', 'settings'],
    // other: null // Show all modules
  // };

  // Get industry from user business info - DISABLED - No longer filtering by industry
  // const userIndustry = user?.industry || null;
  
  // Check if a module should be shown based on industry - DISABLED
  // const isIndustryAllowed = (moduleId) => {
  //   // If no industry set or 'other', show all modules (filtered by permissions only)
  //   if (!userIndustry || userIndustry === 'other') return true;
  //   
  //   const industryAllowedModules = industryModules[userIndustry] || industryModules[userIndustry.toLowerCase()];
  //   
  //   // If industry not found in mapping, show all modules (filtered by permissions only)
  //   if (!industryAllowedModules) return true;
  //   
  //   return industryAllowedModules.includes(moduleId);
  // };

  const navGroups = [
    {
      group: 'General',
      items: [
        {
          title: 'Dashboard',
          path: '/dashboard',
          moduleId: 'dashboard',
          icon: <FiHome size={20} />,
          active: isActive('/dashboard')
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
        }
      ]
    },
    {
      group: 'Commercial',
      items: [
        {
          title: 'Business',
          moduleId: 'business',
          icon: <FiBriefcase size={20} />,
          active: isParentActive(['/customers', '/suppliers', '/projects', '/tasks']),
          submenu: [
            { title: 'Customers', path: '/customers', moduleId: 'customers', active: isActive('/customers') },
            { title: 'Suppliers', path: '/suppliers', moduleId: 'suppliers', active: isActive('/suppliers') },
            { title: 'Projects', path: '/projects', moduleId: 'projects', active: isActive('/projects') },
            { title: 'Tasks', path: '/tasks', moduleId: 'tasks', active: isActive('/tasks') },
            { title: 'Branches', path: '/branches', moduleId: 'settings', active: isActive('/branches') }
          ]
        },
        {
          title: 'Sales',
          moduleId: 'sales',
          icon: <FiShoppingCart size={20} />,
          active: isParentActive(['/sales-orders', '/invoices', '/payments', '/pos', '/trade', '/debtors', '/returns', '/purchase-returns', '/sales-reports']),
          submenu: [
            { title: 'Sales Orders', path: '/sales-orders', moduleId: 'sales', active: isActive('/sales-orders') },
            { title: 'Invoices', path: '/invoices', moduleId: 'sales', active: isActive('/invoices') },
            { title: 'Payments', path: '/payments', moduleId: 'sales', active: isActive('/payments') },
            { title: 'POS', path: '/pos', moduleId: 'sales', active: isActive('/pos') },
            { title: 'Trade (by Kg)', path: '/trade', moduleId: 'sales', active: isActive('/trade') },
            { title: 'Debtors', path: '/debtors', moduleId: 'sales', active: isActive('/debtors') },
            { title: 'Returns', path: '/returns', moduleId: 'sales', active: isActive('/returns') },
            { title: 'Purchase Returns', path: '/purchase-returns', moduleId: 'purchases', active: isActive('/purchase-returns') },
            { title: 'Sales Reports', path: '/sales-reports', moduleId: 'reports', active: isActive('/sales-reports') }
          ]
        },
        {
          title: 'Purchases',
          moduleId: 'purchases',
          icon: <FiBox size={20} />,
          active: isParentActive(['/purchases', '/goods-received', '/supplier-bills', '/purchase-reports']),
          submenu: [
            { title: 'Purchase Transactions', path: '/purchases', moduleId: 'purchases', active: isActive('/purchases') },
            { title: 'Goods Received', path: '/goods-received', moduleId: 'purchases', active: isActive('/goods-received') },
            { title: 'Supplier Bills', path: '/supplier-bills', moduleId: 'purchases', active: isActive('/supplier-bills') },
            { title: 'Purchase Reports', path: '/purchase-reports', moduleId: 'reports', active: isActive('/purchase-reports') }
          ]
        }
      ]
    },
    {
      group: 'Management',
      items: [
        {
          title: 'Inventory',
          moduleId: 'inventory',
          icon: <FiBox size={20} />,
          active: isParentActive(['/products', '/categories', '/barcode-manager', '/stock', '/warehouses', '/low-stock']),
          submenu: [
            { title: 'Inventory List', path: '/products', moduleId: 'inventory', active: isActive('/products') },
            { title: 'Barcode Manager', path: '/barcode-manager', moduleId: 'inventory', active: isActive('/barcode-manager') },
            { title: 'Categories', path: '/categories', moduleId: 'inventory', active: isActive('/categories') },
            { title: 'Stock In', path: '/stock?type=in', moduleId: 'inventory', active: location.pathname === '/stock' && new URLSearchParams(location.search).get('type') === 'in' },
            { title: 'Stock Out', path: '/stock?type=out', moduleId: 'inventory', active: location.pathname === '/stock' && new URLSearchParams(location.search).get('type') === 'out' },
            { title: 'Stock Movements', path: '/stock', moduleId: 'inventory', active: isActive('/stock') && !new URLSearchParams(location.search).get('type') },
            { title: 'Warehouses', path: '/warehouses', moduleId: 'warehouses', active: isActive('/warehouses') },
            { title: 'Low Stock', path: '/low-stock', moduleId: 'inventory', active: isActive('/low-stock') }
          ]
        },
        {
          title: 'Finance',
          moduleId: 'expenses',
          icon: <FiDollarSign size={20} />,
          active: isParentActive(['/expenses', '/income', '/payroll']),
          submenu: [
            { title: 'Expenses', path: '/expenses', moduleId: 'expenses', active: isActive('/expenses') },
            { title: 'Income', path: '/income', moduleId: 'expenses', active: isActive('/income') },
            { title: 'Payroll', path: '/payroll', moduleId: 'hr', active: isActive('/payroll') }
          ]
        },
        {
          title: 'HR',
          moduleId: 'hr',
          icon: <FiUsers size={20} />,
          active: isParentActive(['/employees', '/attendance', '/leave', '/performance', '/departments', '/documents', '/approvals', '/assets']),
          submenu: [
            { title: 'Employees', path: '/employees', moduleId: 'hr', active: isActive('/employees') },
            { title: 'Attendance', path: '/attendance', moduleId: 'hr', active: isActive('/attendance') },
            { title: 'Leave', path: '/leave', moduleId: 'hr', active: isActive('/leave') },
            { title: 'Performance', path: '/performance', moduleId: 'hr', active: isActive('/performance') },
            { title: 'Departments', path: '/departments', moduleId: 'hr', active: isActive('/departments') },
            { title: 'Documents', path: '/documents', moduleId: 'documents', active: isActive('/documents') },
            { title: 'Approvals', path: '/approvals', moduleId: 'hr', active: isActive('/approvals') },
            { title: 'Assets', path: '/assets', moduleId: 'assets', active: isActive('/assets') }
          ]
        },
        {
          title: 'Operations',
          moduleId: 'dashboard',
          icon: <FiActivity size={20} />,
          active: isParentActive(['/operations', '/approvals', '/documents', '/assets']),
          submenu: [
            { title: 'Operations Management', path: '/operations', moduleId: 'dashboard', active: isActive('/operations') },
            { title: 'Approvals', path: '/approvals', moduleId: 'hr', active: isActive('/approvals') },
            { title: 'Documents', path: '/documents', moduleId: 'documents', active: isActive('/documents') },
            { title: 'Assets', path: '/assets', moduleId: 'assets', active: isActive('/assets') }
          ]
        }
      ]
    },
    {
      group: 'Reporting',
      items: [
        {
          title: 'Reports',
          moduleId: 'reports',
          icon: <FiBarChart2 size={20} />,
          active: isParentActive(['/reports', '/sales-reports', '/finance-reports', '/inventory-reports', '/hr-reports', '/custom-reports', '/purchase-reports']),
          submenu: [
            { title: 'All Reports', path: '/reports', moduleId: 'reports', active: isActive('/reports') },
            { title: 'Sales Reports', path: '/sales-reports', moduleId: 'reports', active: isActive('/reports') },
            { title: 'Finance Reports', path: '/finance-reports', moduleId: 'reports', active: isActive('/reports') },
            { title: 'Inventory Reports', path: '/inventory-reports', moduleId: 'reports', active: isActive('/reports') },
            { title: 'HR Reports', path: '/hr-reports', moduleId: 'reports', active: isActive('/reports') },
            { title: 'Purchase Reports', path: '/purchase-reports', moduleId: 'reports', active: isActive('/reports') },
            { title: 'Custom Reports', path: '/custom-reports', moduleId: 'reports', active: isActive('/reports') }
          ]
        }
      ]
    },
    {
      group: 'System',
      items: [
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
            { title: 'Team Management', path: '/team-management', moduleId: 'users', active: isActive('/team-management') },
            { title: 'Company Profile', path: '/company-profile', moduleId: 'settings', active: isActive('/company-profile') },
            { title: 'Permissions', path: '/permissions', moduleId: 'settings', active: isActive('/permissions') },
            { title: 'System Settings', path: '/system-settings', moduleId: 'settings', active: isActive('/system-settings') },
            { title: 'Integrations', path: '/integrations', moduleId: 'settings', active: isActive('/integrations') },
            { title: 'Backup', path: '/backup', moduleId: 'settings', active: isActive('/backup') },
            { title: 'Audit Logs', path: '/audit-logs', moduleId: 'settings', active: isActive('/audit-logs') }
          ]
        }
      ]
    }
  ];

  // Map user role for conditional filtering
  const userRole = user?.role;

  // Filter submenu items based on permissions
  navGroups.forEach(group => {
    group.items.forEach(item => {
      if (item.title === 'Settings' && item.submenu) {
        if (userRole !== 'superadmin' && userRole !== 'admin') {
          const allowedPaths = ['/settings', '/subscription', '/company-profile', '/user-profile'];
          item.submenu = item.submenu.filter(sub => allowedPaths.includes(sub.path));
        } else if (userRole === 'admin') {
          const restrictedPaths = ['/integrations', '/backup', '/audit-logs', '/system-settings', '/advanced-settings'];
          item.submenu = item.submenu.filter(sub => !restrictedPaths.includes(sub.path));
        } else if (userRole === 'superadmin') {
          const restrictedPaths = ['/integrations', '/backup', '/audit-logs', '/system-settings', '/advanced-settings', '/permissions'];
          item.submenu = item.submenu.filter(sub => !restrictedPaths.includes(sub.path));
        }
      }
    });
  });

  // Add Superadmin group if user is superadmin
  if (user && user.role === 'superadmin') {
    navGroups.push({
      group: 'Admin',
      items: [
        {
          title: 'Superadmin',
          path: '/superadmin',
          icon: <FiShield size={20} />,
          active: isActive('/superadmin')
        }
      ]
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

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      const q = (searchQuery || '').trim();
      if (q.length > 0) {
        navigate(`/search?q=${encodeURIComponent(q)}`);
        // auto-close drawer on mobile after searching
        if (window.innerWidth < 992 && !isCollapsed) {
          toggleSidebar();
        }
      }
    }
  };

  const handleSearchClick = () => {
    const q = (searchQuery || '').trim();
    if (q.length > 0) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      if (window.innerWidth < 992 && !isCollapsed) {
        toggleSidebar();
      }
    }
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
      <div className={`sidebar-header d-flex align-items-center ${isCollapsed ? 'justify-content-center' : 'justify-content-between'} p-3 border-bottom`}>
        {/* sidebar header - Company Name */}
        {!isCollapsed && (
          <div className="w-100 ps-2">
            <Link to="/dashboard" className="text-decoration-none">
              <Logo size="medium" />
            </Link>
          </div>
        )}
        {!isCollapsed && (
          <button className="toggle-btn border-0 bg-transparent text-white" onClick={toggleSidebar}>
            <FiX size={20} />
          </button>
        )}
        {isCollapsed && (
          <div className="text-center">
            <Link to="/dashboard" className="text-decoration-none d-flex justify-content-center">
              <Logo size="small" variant="icon" />
            </Link>
            <button className="toggle-btn border-0 bg-transparent text-white d-block mt-2" onClick={toggleSidebar}>
              <FiMenu size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Mobile-only search input in the drawer */}
      <div className="sidebar-mobile-tools px-3 py-3 d-lg-none">
        <button
          type="button"
          className="create-btn-mobile d-flex align-items-center justify-content-center mb-2 w-100"
          onClick={() => setShowCreateMenu((s) => !s)}
          aria-expanded={showCreateMenu ? 'true' : 'false'}
          aria-controls="create-menu-mobile"
        >
          <FiPlus className="me-2" />
          Create
        </button>
        {showCreateMenu && (
          <div id="create-menu-mobile" className="create-menu-mobile p-2 mb-2">
            <Link
              to="/pos"
              className="create-item-mobile"
              onClick={() => {
                setShowCreateMenu(false);
                if (window.innerWidth < 992 && !isCollapsed) toggleSidebar();
              }}
            >
              New Sale (POS)
            </Link>
            <Link
              to="/customers"
              className="create-item-mobile"
              onClick={() => {
                setShowCreateMenu(false);
                if (window.innerWidth < 992 && !isCollapsed) toggleSidebar();
              }}
            >
              Add Customer
            </Link>
            <Link
              to="/products"
              className="create-item-mobile"
              onClick={() => {
                setShowCreateMenu(false);
                if (window.innerWidth < 992 && !isCollapsed) toggleSidebar();
              }}
            >
              Add Product
            </Link>
          </div>
        )}
        <div className="search-wrapper-mobile d-flex align-items-center px-3">
          <button
            type="button"
            className="border-0 bg-transparent p-0 me-2"
            aria-label="Search"
            onClick={handleSearchClick}
          >
            <FiSearch size={18} className="text-muted" />
          </button>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="search-input-mobile"
          />
        </div>
      </div>

      <div className="sidebar-nav-container px-3 py-4">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="nav-group mb-4">
            {!isCollapsed && (
              <motion.div 
                className="group-label px-3 mb-2 text-uppercase small fw-bold text-muted opacity-50"
                style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
              >
                {group.group}
              </motion.div>
            )}
            
            {group.items.map((item, index) => (
              <div key={index} className="nav-item-wrapper mb-1">
                {item.submenu ? (
                  <>
                    <motion.div
                      className={`nav-link-custom d-flex align-items-center py-2 px-3 rounded-3 ${item.active ? 'active' : ''}`}
                      onClick={() => handleSubmenuToggle(item.title)}
                      whileHover={{ x: 4, backgroundColor: '#f8fafc' }}
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
                            <FiChevronDown size={14} />
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
                          className="submenu-container overflow-hidden mt-1 ms-2 ps-3 border-start border-slate-200"
                          style={{ borderLeft: '1px solid #e2e8f0' }}
                        >
                          {item.submenu.map((subItem, subIndex) => (
                            <motion.div
                              key={subIndex}
                              initial={{ x: -10, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: subIndex * 0.03 }}
                            >
                              <Link
                                to={subItem.path}
                                className={`nav-link-custom-submenu d-flex align-items-center py-2 px-3 rounded-2 ${subItem.active ? 'active' : ''}`}
                                onClick={() => {
                                  if (window.innerWidth < 992 && !isCollapsed) toggleSidebar();
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
                    className={`nav-link-custom d-flex align-items-center py-2 px-3 rounded-3 ${item.active ? 'active' : ''}`}
                    onClick={() => {
                      if (window.innerWidth < 992 && !isCollapsed) toggleSidebar();
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
          </div>
        ))}
        {/* Logout Button in Menu */}
        <div className="nav-item-wrapper mt-3 pt-3 border-top border-white border-opacity-10">
          <button
            className={`nav-link-custom d-flex align-items-center py-2 px-3 rounded-3 w-100 border-0 bg-transparent mb-4`}
            onClick={handleLogout}
            style={{ color: '#ef4444' }}
          >
            <span className="icon-wrapper"><FiLogOut size={20} /></span>
            {!isCollapsed && (
              <motion.span
                className="ms-3 text-nowrap fw-semibold font-inter"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Logout
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
          background: #ffffff;
          color: #1e293b;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-right: 1px solid #e2e8f0;
          box-shadow: 4px 0 24px rgba(0,0,0,0.02);
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .sidebar-header {
          height: 70px;
          min-height: 70px;
          background: #ffffff;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          padding: 0 1.5rem;
        }

        .sidebar-nav-container {
          flex: 1;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }

        .sidebar-nav-container::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar-nav-container::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }

        .nav-link-custom {
          color: #64748b;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.925rem;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .nav-link-custom:hover {
          color: #0f172a;
          background: #f8fafc;
        }

        .nav-link-custom.active {
          color: #2563eb;
          background: #eff6ff;
          font-weight: 600;
        }

        .nav-link-custom.active .icon-wrapper {
          color: #000000;
        }

        .icon-wrapper {
          color: #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .nav-link-custom:hover .icon-wrapper {
          color: #000000;
        }

        .nav-link-custom-submenu {
          color: #64748b;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 400;
          transition: all 0.2s;
          position: relative;
        }

        .nav-link-custom-submenu:hover {
          color: #0f172a;
          background: #f8fafc;
        }

        .nav-link-custom-submenu.active {
          color: #2563eb;
          font-weight: 600;
          background: transparent !important;
        }

        .nav-link-custom-submenu.active::before {
          content: '';
          position: absolute;
          left: -1px;
          top: 25%;
          height: 50%;
          width: 2px;
          background: #2563eb;
          border-radius: 0 2px 2px 0;
        }

        .create-btn-mobile {
          background: #2563eb;
          border: none;
          color: white;
          border-radius: 12px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        .search-wrapper-mobile {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .search-input-mobile {
          color: #0f172a;
        }

        .sidebar-header .toggle-btn {
          color: #94a3b8 !important;
        }

        .sidebar-header .toggle-btn:hover {
          color: #1e293b !important;
        }
        
              `}} />
    </motion.div>
  );
};

export default SidebarWithHover;
