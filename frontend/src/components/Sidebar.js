import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome,
  FiUser,
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
  FiMessageSquare
} from 'react-icons/fi';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const isActive = (path) => location.pathname === path;
  const isParentActive = (paths) => paths.some(path => location.pathname.startsWith(path));

  const navItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: <FiHome size={20} />,
      active: isActive('/dashboard')
    },
    {
      title: 'Business',
      icon: <FiBriefcase size={20} />,
      active: isParentActive(['/customers', '/suppliers', '/leads', '/projects', '/tasks']),
      submenu: [
        { title: 'Customers', path: '/customers', active: isActive('/customers') },
        { title: 'Suppliers', path: '/suppliers', active: isActive('/suppliers') },
        { title: 'Leads', path: '/leads', active: isActive('/leads') },
        { title: 'Projects', path: '/projects', active: isActive('/projects') },
        { title: 'Tasks', path: '/tasks', active: isActive('/tasks') }
      ]
    },
    {
      title: 'Sales',
      icon: <FiShoppingCart size={20} />,
      active: isParentActive(['/sales-orders', '/invoices', '/payments', '/pos', '/sales-reports', '/returns']),
      submenu: [
        { title: 'Sales Orders', path: '/sales-orders', active: isActive('/sales-orders') },
        { title: 'Invoices', path: '/invoices', active: isActive('/invoices') },
        { title: 'Payments', path: '/payments', active: isActive('/payments') },
        { title: 'POS', path: '/pos', active: isActive('/pos') },
        { title: 'Sales Reports', path: '/sales-reports', active: isActive('/sales-reports') },
        { title: 'Returns', path: '/returns', active: isActive('/returns') }
      ]
    },
    {
      title: 'Inventory',
      icon: <FiBox size={20} />,
      active: isParentActive(['/products', '/categories', '/stock', '/warehouses', '/low-stock']),
      submenu: [
        { title: 'Products', path: '/products', active: isActive('/products') },
        { title: 'Categories', path: '/categories', active: isActive('/categories') },
        { title: 'Stock Movements', path: '/stock', active: isActive('/stock') },
        { title: 'Warehouses', path: '/warehouses', active: isActive('/warehouses') },
        { title: 'Low Stock Alerts', path: '/low-stock', active: isActive('/low-stock') }
      ]
    },
    {
      title: 'Finance',
      icon: <FiDollarSign size={20} />,
      active: isParentActive(['/expenses', '/income', '/accounting', '/payroll', '/taxes']),
      submenu: [
        { title: 'Expenses', path: '/expenses', active: isActive('/expenses') },
        { title: 'Income', path: '/income', active: isActive('/income') },
        { title: 'Accounting', path: '/accounting', active: isActive('/accounting') },
        { title: 'Payroll', path: '/payroll', active: isActive('/payroll') },
        { title: 'Taxes', path: '/taxes', active: isActive('/taxes') }
      ]
    },
    {
      title: 'HR',
      icon: <FiUsers size={20} />,
      active: isParentActive(['/employees', '/attendance', '/leave', '/performance', '/departments', '/documents', '/approvals', '/workflows', '/assets']),
      submenu: [
        { title: 'Employees', path: '/employees', active: isActive('/employees') },
        { title: 'Attendance', path: '/attendance', active: isActive('/attendance') },
        { title: 'Leave Management', path: '/leave', active: isActive('/leave') },
        { title: 'Performance', path: '/performance', active: isActive('/performance') },
        { title: 'Departments', path: '/departments', active: isActive('/departments') },
        { title: 'Documents', path: '/documents', active: isActive('/documents') },
        { title: 'Approvals', path: '/approvals', active: isActive('/approvals') },
        { title: 'Workflows', path: '/workflows', active: isActive('/workflows') },
        { title: 'Assets', path: '/assets', active: isActive('/assets') }
      ]
    },
    {
      title: 'Purchases',
      icon: <FiShoppingCart size={20} />,
      active: isParentActive(['/purchases', '/purchase-orders', '/goods-received', '/supplier-bills', '/purchase-reports']),
      submenu: [
        { title: 'Purchases', path: '/purchases', active: isActive('/purchases') },
        { title: 'Purchase Orders', path: '/purchase-orders', active: isActive('/purchase-orders') },
        { title: 'Goods Received', path: '/goods-received', active: isActive('/goods-received') },
        { title: 'Supplier Bills', path: '/supplier-bills', active: isActive('/supplier-bills') },
        { title: 'Purchase Reports', path: '/purchase-reports', active: isActive('/purchase-reports') }
      ]
    },
    {
      title: 'Operations',
      icon: <FiActivity size={20} />,
      active: isParentActive(['/operations', '/approvals', '/workflows', '/documents', '/assets']),
      submenu: [
        { title: 'Operations', path: '/operations', active: isActive('/operations') },
        { title: 'Approvals', path: '/approvals', active: isActive('/approvals') },
        { title: 'Workflows', path: '/workflows', active: isActive('/workflows') },
        { title: 'Documents', path: '/documents', active: isActive('/documents') },
        { title: 'Assets', path: '/assets', active: isActive('/assets') }
      ]
    },
    {
      title: 'Reports',
      path: '/reports',
      icon: <FiBarChart2 size={20} />,
      active: isActive('/reports')
    },
    {
      title: 'Communication',
      icon: <FiMessageSquare size={20} />,
      active: isParentActive(['/notifications', '/messages', '/announcements']),
      submenu: [
        { title: 'Notifications', path: '/notifications', active: isActive('/notifications') },
        { title: 'Messages', path: '/messages', active: isActive('/messages') },
        { title: 'Announcements', path: '/announcements', active: isActive('/announcements') }
      ]
    },
    {
      title: 'Settings',
      icon: <FiSettings size={20} />,
      active: isParentActive(['/settings', '/advanced-settings', '/users', '/company-profile', '/permissions', '/system-settings', '/integrations', '/backup', '/audit-logs']),
      submenu: [
        { title: 'General Settings', path: '/settings', active: isActive('/settings') },
        { title: 'Advanced Settings', path: '/advanced-settings', active: isActive('/advanced-settings') },
        { title: 'User Management', path: '/users', active: isActive('/users') },
        { title: 'Company Profile', path: '/company-profile', active: isActive('/company-profile') },
        { title: 'Permissions', path: '/permissions', active: isActive('/permissions') },
        { title: 'System Settings', path: '/system-settings', active: isActive('/system-settings') },
        { title: 'Integrations', path: '/integrations', active: isActive('/integrations') },
        { title: 'Backup & Restore', path: '/backup', active: isActive('/backup') },
        { title: 'Audit Logs', path: '/audit-logs', active: isActive('/audit-logs') }
      ]
    }
  ];

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
      animate={{ width: isCollapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="sidebar-header d-flex align-items-center justify-content-between p-3">
        {!isCollapsed ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="logo-container d-flex align-items-center"
          >
            <div className="logo-icon-wrapper me-2">
              <FiActivity size={20} />
            </div>
            <span className="logo-text fw-bold">Trade Flow</span>
          </motion.div>
        ) : (
          <div className="logo-icon-wrapper mx-auto">
            <FiActivity size={20} />
          </div>
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
        {navItems.map((item, index) => (
          <div key={index} className="nav-item-wrapper mb-1">
            {item.submenu ? (
              <>
                <div
                  className={`nav-link-custom d-flex align-items-center py-2 px-3 rounded ${item.active ? 'active' : ''}`}
                  onClick={() => handleSubmenuToggle(item.title)}
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
                </div>

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
                        <Link
                          key={subIndex}
                          to={subItem.path}
                          className={`nav-link-custom-submenu d-flex align-items-center py-2 px-4 ms-4 rounded ${subItem.active ? 'active' : ''}`}
                        >
                          <span className="text-nowrap">{subItem.title}</span>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <Link
                to={item.path}
                className={`nav-link-custom d-flex align-items-center py-2 px-3 rounded ${item.active ? 'active' : ''}`}
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

      <div className="sidebar-footer p-3 mt-auto">
        <div className={`user-profile d-flex align-items-center ${isCollapsed ? 'justify-content-center' : ''}`}>
          <div className="avatar-wrapper">
            <FiUser size={20} />
          </div>
          {!isCollapsed && (
            <motion.div
              className="ms-3 flex-grow-1 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="fw-bold small text-nowrap">Admin User</div>
              <div className="text-white-50 small text-nowrap" style={{ fontSize: '10px' }}>Administrator</div>
            </motion.div>
          )}
          {!isCollapsed && (
            <button className="logout-btn border-0 bg-transparent text-white-50 p-0 ms-2">
              <FiLogOut size={18} />
            </button>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .sidebar-wrapper {
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1100;
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          color: white;
          display: flex;
          flex-direction: column;
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }
        
        .sidebar-header {
          height: 72px;
          min-height: 72px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .logo-icon-wrapper {
          background: #2563eb;
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          flex-shrink: 0;
        }
        
        .logo-text {
          font-size: 1.2rem;
          letter-spacing: -0.5px;
          white-space: nowrap;
        }
        
        .toggle-btn {
          opacity: 0.7;
          transition: opacity 0.2s;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .toggle-btn:hover {
          opacity: 1;
        }
        
        .sidebar-nav-container {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .sidebar-nav-container::-webkit-scrollbar {
          width: 4px;
        }
        
        .sidebar-nav-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        
        .nav-item-wrapper {
          width: 100%;
          display: block;
        }
        
        .nav-link-custom {
          color: rgba(255, 255, 255, 0.7) !important;
          transition: all 0.2s ease;
          text-decoration: none !important;
          position: relative;
          cursor: pointer;
          width: 100%;
        }
        
        .nav-link-custom:hover {
          color: white !important;
          background: rgba(255, 255, 255, 0.08) !important;
        }
        
        .nav-link-custom.active {
          color: white !important;
          background: rgba(37, 99, 235, 0.15) !important;
        }
        
        .nav-link-custom.active::before {
          content: '';
          position: absolute;
          left: -8px;
          top: 20%;
          height: 60%;
          width: 4px;
          background: #2563eb;
          border-radius: 0 4px 4px 0;
          box-shadow: 0 0 10px rgba(37, 99, 235, 0.5);
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
          color: rgba(255, 255, 255, 0.5) !important;
          font-size: 0.85rem;
          transition: all 0.2s ease;
          text-decoration: none !important;
          display: block;
          width: calc(100% - 1.5rem);
        }
        
        .nav-link-custom-submenu:hover {
          color: white !important;
          background: rgba(255, 255, 255, 0.05) !important;
        }
        
        .nav-link-custom-submenu.active {
          color: #2563eb !important;
          font-weight: 600;
        }
        
        .sidebar-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(0, 0, 0, 0.1);
          min-height: 70px;
        }
        
        .avatar-wrapper {
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }
        
        .logout-btn {
          opacity: 0.5;
          transition: all 0.2s;
          cursor: pointer;
        }
        
        .logout-btn:hover {
          opacity: 1;
          color: #ef4444 !important;
        }
      `}} />
    </motion.div>
  );
};

export default Sidebar;