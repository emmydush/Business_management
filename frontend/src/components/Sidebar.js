import React, { useState, useEffect } from 'react';
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
import { settingsAPI } from '../services/api';

const SidebarWithHover = ({ isCollapsed, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  // const { features, plan_type, is_superadmin } = useSubscription(); // DISABLED - No longer needed
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [companyProfile, setCompanyProfile] = useState(null);

  const isActive = (path) => location.pathname === path;
  const isParentActive = (paths) => paths.some(path => location.pathname.startsWith(path));

  // Fetch company profile
  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        const response = await settingsAPI.getCompanyProfile();
        console.log('Company profile set:', response.data.company_profile || response.data); // Debug log
        setCompanyProfile(response.data.company_profile || response.data);
      } catch (error) {
        console.error('Failed to fetch company profile:', error);
        // Use default values if fetching fails
        setCompanyProfile({ company_name: 'AfriBiz' });
      }
    };

    fetchCompanyProfile();
  }, []);

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
      active: isParentActive(['/sales-orders', '/invoices', '/payments', '/pos', '/returns']),
      submenu: [
        { title: 'Sales Orders', path: '/sales-orders', moduleId: 'sales', active: isActive('/sales-orders') },
        { title: 'Invoices', path: '/invoices', moduleId: 'sales', active: isActive('/invoices') },
        { title: 'Payments', path: '/payments', moduleId: 'sales', active: isActive('/payments') },
        { title: 'POS', path: '/pos', moduleId: 'sales', active: isActive('/pos') },
        { title: 'Trade (by Kg)', path: '/trade', moduleId: 'sales', active: isActive('/trade') },
        { title: 'Debtors (Owed Money)', path: '/debtors', moduleId: 'sales', active: isActive('/debtors') },
        { title: 'Returns', path: '/returns', moduleId: 'sales', active: isActive('/returns') }
      ]
    },
    {
      title: 'Inventory',
      moduleId: 'inventory',
      icon: <FiBox size={20} />,
      active: isParentActive(['/products', '/categories', '/barcode-manager', '/stock', '/warehouses', '/low-stock']),
      submenu: [
        { title: 'Products', path: '/products', moduleId: 'inventory', active: isActive('/products') },
        { title: 'Barcode Manager', path: '/barcode-manager', moduleId: 'inventory', active: isActive('/barcode-manager') },
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
      title: 'Purchases',
      moduleId: 'purchases',
      icon: <FiShoppingCart size={20} />,
      active: isParentActive(['/purchases', '/goods-received', '/supplier-bills', '/purchase-reports']),
      submenu: [
        { title: 'Purchase Transactions', path: '/purchases', moduleId: 'purchases', active: isActive('/purchases') },
        { title: 'Goods Received', path: '/goods-received', moduleId: 'purchases', active: isActive('/goods-received') },
        { title: 'Supplier Bills', path: '/supplier-bills', moduleId: 'purchases', active: isActive('/supplier-bills') },
        { title: 'Purchase Reports', path: '/purchase-reports', moduleId: 'reports', active: isActive('/purchase-reports') }
      ]
    },
    {
      title: 'Operations',
      moduleId: 'dashboard', // General operations
      icon: <FiActivity size={20} />,
      active: isParentActive(['/operations', '/approvals', '/documents', '/assets']),
      submenu: [
        { title: 'Operations Management', path: '/operations', moduleId: 'dashboard', active: isActive('/operations') },
        { title: 'Approvals', path: '/approvals', moduleId: 'hr', active: isActive('/approvals') },
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
    // End of navigation items
  ];

  // Filter navItems - DISABLED - All users now see all modules
  const navItemsWithPermissions = navItems;

  // use items filtered by permissions (search removed)
  const filteredNavItems = navItemsWithPermissions;

  // Settings submenu filtering - Hide admin/superadmin settings from normal users
  const settingsItem = filteredNavItems.find(item => item.title === 'Settings');
  if (settingsItem) {
    const userRole = user?.role;
    if (userRole !== 'superadmin' && userRole !== 'admin') {
      // Normal users only see basic settings
      const allowedPaths = ['/settings', '/subscription', '/company-profile', '/user-profile'];
      settingsItem.submenu = settingsItem.submenu.filter(sub => allowedPaths.includes(sub.path));
    } else if (userRole === 'admin') {
      // Admin users can see business settings but NOT superadmin-only ones
      const restrictedPaths = [
        '/integrations', 
        '/backup', 
        '/audit-logs', 
        '/system-settings', 
        '/advanced-settings'  // Remove advanced settings from admin
      ];
      settingsItem.submenu = settingsItem.submenu.filter(sub => !restrictedPaths.includes(sub.path));
    } else if (userRole === 'superadmin') {
      // Superadmin should use the dedicated SuperAdminSidebar for advanced settings
      // Remove all advanced settings from regular sidebar
      const restrictedPaths = [
        '/integrations', 
        '/backup', 
        '/audit-logs', 
        '/system-settings', 
        '/advanced-settings',
        '/permissions'  // Permissions should be in superadmin sidebar
      ];
      settingsItem.submenu = settingsItem.submenu.filter(sub => !restrictedPaths.includes(sub.path));
    }
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
      <div className={`sidebar-header d-flex align-items-center ${isCollapsed ? 'justify-content-center' : 'justify-content-between'} p-3 border-bottom`} style={{background: 'var(--sidebar-bg)', borderColor: 'var(--border-color)'}}>
        {/* sidebar header - Company Name */}
        {!isCollapsed && (
          <div className="w-100">
            <Link to="/dashboard" className="text-decoration-none" style={{color: '#12b8ff', fontSize: '1.5rem', fontWeight: 'bold'}}>
              {companyProfile?.company_name || 'AfriBiz'}
            </Link>
          </div>
        )}
        {!isCollapsed && (
          <button className="toggle-btn border-0 bg-transparent text-white" onClick={toggleSidebar}>
            <FiX size={20} />
          </button>
        )}
        {isCollapsed && (
          <div className="text-center" style={{background: 'var(--sidebar-bg)'}}>
            <Link to="/dashboard" className="text-decoration-none" style={{color: '#12b8ff', fontSize: '0.8rem', fontWeight: 'bold'}}>
              {companyProfile?.company_name ? companyProfile.company_name.substring(0, 3).toUpperCase() : 'BOS'}
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
              to="/sales"
              className="create-item-mobile"
              onClick={() => {
                setShowCreateMenu(false);
                if (window.innerWidth < 992 && !isCollapsed) toggleSidebar();
              }}
            >
              New Sale
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

      <div className="sidebar-nav-container px-2 py-2">
        {filteredNavItems.map((item, index) => (
          <div
            key={index}
            className="nav-item-wrapper mb-1"
          >
            {item.submenu ? (
              <>
                <motion.div
                  className={`nav-link-custom d-flex align-items-center py-2 px-3 ${item.active ? 'active' : ''}`}
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
                            className={`nav-link-custom-submenu d-flex align-items-center py-2 px-4 ms-4 ${subItem.active ? 'active' : ''}`}
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
                className={`nav-link-custom d-flex align-items-center py-2 px-3 ${item.active ? 'active' : ''}`}
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
            className={`nav-link-custom d-flex align-items-center py-2 px-3 w-100 border-0 bg-transparent`}
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
          background: var(--sidebar-bg);
          color: var(--text-main);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 0;
          border-right: 1px solid var(--border-color);
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        @media (max-width: 991.98px) {
          .sidebar-wrapper {
            width: 260px !important;
            border-radius: 0;
          }
        }

        @media (max-width: 991.98px) {
          .sidebar-wrapper {
            width: 260px !important;
          }
        }
        
        .sidebar-header {
          height: 56px;
          min-height: 56px;
          background: var(--sidebar-bg);
          border-bottom: 1px solid var(--border-color);
        }
        
        .toggle-btn {
          opacity: 0.7;
          transition: opacity 0.2s;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280 !important;
        }
        
        .toggle-btn:hover {
          opacity: 1;
          transform: scale(1.1);
          color: #374151 !important;
        }
        
        .sidebar-nav-container {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
        }
        .sidebar-mobile-tools {
          background: var(--sidebar-bg);
        }
        .create-btn-mobile {
          height: 42px;
          border-radius: 9999px;
          border: 1px solid var(--border-color);
          background: var(--sidebar-bg);
          color: var(--text-main);
          font-weight: 700;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .create-btn-mobile:hover {
          background: #f8fafc;
          border-color: #e2e8f0;
        }
        .create-menu-mobile {
          border: 1px solid var(--border-color);
          border-radius: 12px;
          background: var(--card-bg);
          box-shadow: 0 12px 24px rgba(0,0,0,0.06);
        }
        .create-item-mobile {
          display: block;
          padding: 0.6rem 0.75rem;
          border-radius: 8px;
          text-decoration: none;
          color: var(--text-main);
          font-weight: 600;
        }
        .create-item-mobile:hover {
          background: #f8fafc;
          color: #111827;
        }
        .search-wrapper-mobile {
          width: 100%;
          height: 40px;
          background: var(--input-bg);
          border: 1px solid var(--border-color);
          border-radius: 9999px;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.03);
        }
        .search-input-mobile {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.95rem;
          color: var(--input-text);
        }
        .search-input-mobile::placeholder {
          color: #9ca3af;
        }
        
        @media (max-width: 991.98px) {
          .sidebar-header {
            height: 48px !important;
            min-height: 48px !important;
          }
          .sidebar-nav-container {
            padding-top: 0 !important;
          }
        }
        
        .sidebar-nav-container::-webkit-scrollbar {
          width: 6px;
        }
        
        .sidebar-nav-container::-webkit-scrollbar-thumb {
          background: #000000;
          border-radius: 3px;
        }

        .sidebar-nav-container::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        
        .nav-item-wrapper {
          width: 100%;
          display: block;
          position: relative;
        }
        .nav-item-wrapper + .nav-item-wrapper { border-top: 1px solid var(--border-color); }
        
        .nav-link-custom {
          color: var(--text-main);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          font-weight: 600;
          letter-spacing: 0.01em;
          border-radius: 0;
        }
        
        .nav-link-custom:hover {
          background: var(--sidebar-active-bg);
          color: var(--sidebar-active-text);
          border-radius: 0;
        }
        
        .nav-link-custom.active {
          background: var(--sidebar-active-bg);
          color: var(--sidebar-active-text);
          box-shadow: none;
          font-weight: 700;
          border-radius: 0;
        }
        
        .nav-link-custom.active::before {
          display: none;
        }
        
        .icon-wrapper {
          color: var(--text-muted);
          transition: color 0.15s ease;
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
          color: var(--text-muted);
          text-decoration: none;
          font-size: 0.9rem;
          transition: all 0.15s ease;
          font-weight: 500;
          display: block;
          width: calc(100% - 1.5rem);
          letter-spacing: 0.1px;
        }
        
        .nav-link-custom-submenu:hover {
          color: var(--sidebar-active-text);
        }
        
        .nav-link-custom-submenu.active {
          color: var(--sidebar-active-text);
          font-weight: 700;
          background: transparent !important;
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
          color: var(--text-main) !important;
          text-shadow: none;
          font-weight: 700;
          letter-spacing: 0.8px;
        }
        
              `}} />
    </motion.div>
  );
};

export default SidebarWithHover;
