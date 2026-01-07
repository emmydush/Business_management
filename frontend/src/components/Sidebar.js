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
  FiMessageSquare,
  FiShield
} from 'react-icons/fi';
import { useAuth } from './auth/AuthContext';
import { useI18n } from '../i18n/I18nProvider';
import Logo from './Logo';

const SidebarWithHover = ({ isCollapsed, toggleSidebar }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useI18n();
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const isActive = (path) => location.pathname === path;
  const isParentActive = (paths) => paths.some(path => location.pathname.startsWith(path));

  const navItems = [
    {
      title: t('sidebar_dashboard'),
      path: '/dashboard',
      icon: <FiHome size={20} />,
      active: isActive('/dashboard')
    },
    {
      title: t('sidebar_business'),
      icon: <FiBriefcase size={20} />,
      active: isParentActive(['/customers', '/suppliers', '/leads', '/projects', '/tasks']),
      submenu: [
        { title: t('sidebar_customers'), path: '/customers', active: isActive('/customers') },
        { title: t('sidebar_suppliers'), path: '/suppliers', active: isActive('/suppliers') },
        { title: t('sidebar_leads'), path: '/leads', active: isActive('/leads') },
        { title: t('sidebar_projects'), path: '/projects', active: isActive('/projects') },
        { title: t('sidebar_tasks'), path: '/tasks', active: isActive('/tasks') }
      ]
    },
    {
      title: t('sidebar_sales'),
      icon: <FiShoppingCart size={20} />,
      active: isParentActive(['/sales-orders', '/invoices', '/payments', '/pos', '/sales-reports', '/returns']),
      submenu: [
        { title: t('sidebar_easy_sales'), path: '/easy-sales', active: isActive('/easy-sales') },
        { title: t('sidebar_sales_orders'), path: '/sales-orders', active: isActive('/sales-orders') },
        { title: t('sidebar_invoices'), path: '/invoices', active: isActive('/invoices') },
        { title: t('sidebar_payments'), path: '/payments', active: isActive('/payments') },
        { title: t('sidebar_pos'), path: '/pos', active: isActive('/pos') },
        { title: t('sidebar_sales_reports'), path: '/sales-reports', active: isActive('/sales-reports') },
        { title: t('sidebar_returns'), path: '/returns', active: isActive('/returns') }
      ]
    },
    {
      title: t('sidebar_inventory'),
      icon: <FiBox size={20} />,
      active: isParentActive(['/products', '/categories', '/stock', '/warehouses', '/low-stock']),
      submenu: [
        { title: t('sidebar_products'), path: '/products', active: isActive('/products') },
        { title: t('sidebar_categories'), path: '/categories', active: isActive('/categories') },
        { title: t('sidebar_stock_movements'), path: '/stock', active: isActive('/stock') },
        { title: t('sidebar_warehouses'), path: '/warehouses', active: isActive('/warehouses') },
        { title: t('sidebar_low_stock'), path: '/low-stock', active: isActive('/low-stock') }
      ]
    },
    {
      title: t('sidebar_finance'),
      icon: <FiDollarSign size={20} />,
      active: isParentActive(['/expenses', '/income', '/accounting', '/payroll', '/taxes']),
      submenu: [
        { title: t('sidebar_expenses'), path: '/expenses', active: isActive('/expenses') },
        { title: t('sidebar_income'), path: '/income', active: isActive('/income') },
        { title: t('sidebar_accounting'), path: '/accounting', active: isActive('/accounting') },
        { title: t('sidebar_payroll'), path: '/payroll', active: isActive('/payroll') },
        { title: t('sidebar_taxes'), path: '/taxes', active: isActive('/taxes') }
      ]
    },
    {
      title: t('sidebar_hr'),
      icon: <FiUsers size={20} />,
      active: isParentActive(['/employees', '/attendance', '/leave', '/performance', '/departments', '/documents', '/approvals', '/workflows', '/assets']),
      submenu: [
        { title: t('sidebar_employees'), path: '/employees', active: isActive('/employees') },
        { title: t('sidebar_attendance'), path: '/attendance', active: isActive('/attendance') },
        { title: t('sidebar_leave'), path: '/leave', active: isActive('/leave') },
        { title: t('sidebar_performance'), path: '/performance', active: isActive('/performance') },
        { title: t('sidebar_departments'), path: '/departments', active: isActive('/departments') },
        { title: t('sidebar_documents'), path: '/documents', active: isActive('/documents') },
        { title: t('sidebar_approvals'), path: '/approvals', active: isActive('/approvals') },
        { title: t('sidebar_workflows'), path: '/workflows', active: isActive('/workflows') },
        { title: t('sidebar_assets'), path: '/assets', active: isActive('/assets') }
      ]
    },
    {
      title: t('sidebar_purchases'),
      icon: <FiShoppingCart size={20} />,
      active: isParentActive(['/purchases', '/purchase-orders', '/goods-received', '/supplier-bills', '/purchase-reports']),
      submenu: [
        { title: t('sidebar_purchase_transactions'), path: '/purchases', active: isActive('/purchases') },
        { title: t('sidebar_purchase_orders'), path: '/purchase-orders', active: isActive('/purchase-orders') },
        { title: t('sidebar_goods_received'), path: '/goods-received', active: isActive('/goods-received') },
        { title: t('sidebar_supplier_bills'), path: '/supplier-bills', active: isActive('/supplier-bills') },
        { title: t('sidebar_purchase_reports'), path: '/purchase-reports', active: isActive('/purchase-reports') }
      ]
    },
    {
      title: t('sidebar_operations'),
      icon: <FiActivity size={20} />,
      active: isParentActive(['/operations', '/approvals', '/workflows', '/documents', '/assets']),
      submenu: [
        { title: t('sidebar_operations_management'), path: '/operations', active: isActive('/operations') },
        { title: t('sidebar_approvals'), path: '/approvals', active: isActive('/approvals') },
        { title: t('sidebar_workflows'), path: '/workflows', active: isActive('/workflows') },
        { title: t('sidebar_documents'), path: '/documents', active: isActive('/documents') },
        { title: t('sidebar_assets'), path: '/assets', active: isActive('/assets') }
      ]
    },
    {
      title: t('sidebar_reports'),
      path: '/reports',
      icon: <FiBarChart2 size={20} />,
      active: isActive('/reports')
    },
    {
      title: t('sidebar_communication'),
      icon: <FiMessageSquare size={20} />,
      active: isParentActive(['/notifications', '/messages', '/announcements']),
      submenu: [
        { title: t('sidebar_notifications'), path: '/notifications', active: isActive('/notifications') },
        { title: t('sidebar_messages'), path: '/messages', active: isActive('/messages') },
        { title: t('sidebar_announcements'), path: '/announcements', active: isActive('/announcements') }
      ]
    },
    {
      title: t('sidebar_settings'),
      icon: <FiSettings size={20} />,
      active: isParentActive(['/settings', '/advanced-settings', '/users', '/company-profile', '/permissions', '/system-settings', '/integrations', '/backup', '/audit-logs']),
      submenu: [
        { title: t('sidebar_general_settings'), path: '/settings', active: isActive('/settings') },
        { title: t('sidebar_advanced_settings'), path: '/advanced-settings', active: isActive('/advanced-settings') },
        { title: t('sidebar_user_management'), path: '/users', active: isActive('/users') },
        { title: t('sidebar_company_profile'), path: '/company-profile', active: isActive('/company-profile') },
        { title: t('sidebar_permissions'), path: '/permissions', active: isActive('/permissions') },
        { title: t('sidebar_system_settings'), path: '/system-settings', active: isActive('/system-settings') },
        { title: t('sidebar_integrations'), path: '/integrations', active: isActive('/integrations') },
        { title: t('sidebar_backup'), path: '/backup', active: isActive('/backup') },
        { title: t('sidebar_audit_logs'), path: '/audit-logs', active: isActive('/audit-logs') }
      ]
    }
  ];

  // Add Superadmin link if user is superadmin
  if (user && user.role === 'superadmin') {
    navItems.push({
      title: t('sidebar_superadmin'),
      path: '/superadmin',
      icon: <FiShield size={20} />,
      active: isActive('/superadmin')
    });
  }

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
          >
            <Logo variant="full" size="medium" animated={true} />
          </motion.div>
        ) : (
          <div className="mx-auto">
            <Logo variant="icon" size="small" animated={true} />
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
        <Link
          to="/user-profile"
          className={`user-profile d-flex align-items-center ${isCollapsed ? 'justify-content-center' : ''} text-decoration-none`}
          style={{ color: 'inherit' }}
        >
          <div className="avatar-wrapper">
            <FiUser size={20} />
          </div>
          {!isCollapsed && (
            <motion.div
              className="ms-3 flex-grow-1 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="fw-bold small text-nowrap">{user ? `${user.first_name} ${user.last_name}` : 'Admin User'}</div>
              <div className="text-white-50 small text-nowrap" style={{ fontSize: '10px' }}>{user ? user.role : 'Administrator'}</div>
            </motion.div>
          )}
          {!isCollapsed && (
            <button className="logout-btn border-0 bg-transparent text-white-50 p-0 ms-2">
              <FiLogOut size={18} />
            </button>
          )}
        </Link>
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
          transform: translateX(4px);
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

export default SidebarWithHover;