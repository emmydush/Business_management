import React from 'react';
import {
  FiHome,
  FiUsers,
  FiShoppingCart,
  FiBox,
  FiDollarSign,
  FiPieChart,
  FiSettings,
  FiBriefcase,
  FiFileText,
  FiBell,
  FiActivity,
  FiTruck,
  FiClipboard,
  FiLayers,
  FiUserCheck,
  FiMessageSquare
} from 'react-icons/fi';

export const SidebarData = [
  {
    id: 'main',
    title: 'MAIN',
    icon: <FiHome />,
    items: [
      { to: '/dashboard', label: 'Overview / Analytics' }
    ]
  },
  {
    id: 'business',
    title: 'BUSINESS',
    icon: <FiBriefcase />,
    items: [
      { to: '/customers', label: 'Customers' },
      { to: '/suppliers', label: 'Suppliers' },
      { to: '/leads', label: 'Leads / CRM' },
      { to: '/projects', label: 'Projects' },
      { to: '/tasks', label: 'Tasks' }
    ]
  },
  {
    id: 'sales',
    title: 'SALES',
    icon: <FiShoppingCart />,
    items: [
      { to: '/sales-orders', label: 'Sales Orders' },
      { to: '/invoices', label: 'Invoices' },
      { to: '/payments', label: 'Payments' },
      { to: '/pos', label: 'POS' },
      { to: '/returns', label: 'Returns' }
    ]
  },
  {
    id: 'inventory',
    title: 'INVENTORY',
    icon: <FiBox />,
    items: [
      { to: '/products', label: 'Products' },
      { to: '/categories', label: 'Categories' },
      { to: '/stock', label: 'Stock In / Out' },
      { to: '/warehouses', label: 'Warehouses' },
      { to: '/low-stock', label: 'Low Stock Alerts' }
    ]
  },
  {
    id: 'purchases',
    title: 'PURCHASES',
    icon: <FiTruck />,
    items: [
      { to: '/purchase-orders', label: 'Purchase Orders' },
      { to: '/goods-received', label: 'Goods Received' },
      { to: '/supplier-bills', label: 'Supplier Bills' },
      { to: '/purchase-reports', label: 'Purchase Reports' }
    ]
  },
  {
    id: 'finance',
    title: 'FINANCE',
    icon: <FiDollarSign />,
    items: [
      { to: '/expenses', label: 'Expenses' },
      { to: '/income', label: 'Income' },
      { to: '/accounting', label: 'Accounting' },
      { to: '/payroll', label: 'Payroll' },
      { to: '/taxes', label: 'Taxes' }
    ]
  },
  {
    id: 'hr',
    title: 'HR',
    icon: <FiUsers />,
    items: [
      { to: '/employees', label: 'Employees' },
      { to: '/attendance', label: 'Attendance' },
      { to: '/leave', label: 'Leave Management' },
      { to: '/performance', label: 'Performance' },
      { to: '/departments', label: 'Departments' }
    ]
  },
  {
    id: 'operations',
    title: 'OPERATIONS',
    icon: <FiActivity />,
    items: [
      { to: '/documents', label: 'Documents' },
      { to: '/approvals', label: 'Approvals' },
      { to: '/workflows', label: 'Workflows' },
      { to: '/assets', label: 'Asset Management' }
    ]
  },
  {
    id: 'reports',
    title: 'REPORTS',
    icon: <FiPieChart />,
    items: [
      { to: '/sales-reports', label: 'Sales Reports' },
      { to: '/finance-reports', label: 'Finance Reports' },
      { to: '/inventory-reports', label: 'Inventory Reports' },
      { to: '/hr-reports', label: 'HR Reports' },
      { to: '/custom-reports', label: 'Custom Reports' }
    ]
  },
  {
    id: 'communication',
    title: 'COMMUNICATION',
    icon: <FiMessageSquare />,
    items: [
      { to: '/notifications', label: 'Notifications' },
      { to: '/messages', label: 'Messages' },
      { to: '/announcements', label: 'Announcements' }
    ]
  },
  {
    id: 'settings',
    title: 'SETTINGS',
    icon: <FiSettings />,
    items: [
      { to: '/company-profile', label: 'Company Profile' },
      { to: '/users', label: 'Users & Roles' },
      { to: '/permissions', label: 'Permissions' },
      { to: '/system-settings', label: 'System Settings' },
      { to: '/integrations', label: 'Integrations' },
      { to: '/backup', label: 'Backup & Restore' },
      { to: '/audit-logs', label: 'Audit Logs' }
    ]
  }
];
