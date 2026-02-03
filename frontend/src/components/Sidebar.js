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
import toast from 'react-hot-toast';
import { Button } from 'react-bootstrap';

const SidebarWithHover = ({ isCollapsed, toggleSidebar }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useI18n();
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const isActive = (path) => location.pathname === path;
  const isParentActive = (paths) => paths.some(path => location.pathname.startsWith(path));

  const isModuleAllowed = (moduleId) => {
    if (!user) return false;
    if (user.role === 'superadmin') return true;

    // If user has specific permissions defined, strictly follow them
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions.includes(moduleId);
    }

    // Fallback to role-based defaults if no specific permissions are set
    const rolePermissions = {
      admin: ['dashboard', 'users', 'customers', 'suppliers', 'inventory', 'sales', 'purchases', 'expenses', 'hr', 'reports', 'settings', 'leads', 'tasks', 'projects', 'documents', 'assets', 'warehouses'],
      manager: ['dashboard', 'users', 'customers', 'suppliers', 'inventory', 'sales', 'purchases', 'expenses', 'hr', 'reports', 'leads', 'tasks', 'projects', 'documents', 'assets', 'warehouses'],
      staff: ['dashboard', 'customers', 'suppliers', 'inventory', 'sales', 'reports', 'leads', 'tasks', 'projects', 'documents', 'assets']
    };

    const allowedModules = rolePermissions[user.role] || [];
    return allowedModules.includes(moduleId);
  };

  const navItems = [
    {
      title: t('sidebar_dashboard'),
      path: '/dashboard',
      moduleId: 'dashboard',
      icon: <FiHome size={20} />,
      active: isActive('/dashboard')
    },
    {
      title: t('sidebar_business'),
      moduleId: 'business', // Parent module
      icon: <FiBriefcase size={20} />,
      active: isParentActive(['/customers', '/suppliers', '/leads', '/projects', '/tasks']),
      submenu: [
        { title: t('sidebar_customers'), path: '/customers', moduleId: 'customers', active: isActive('/customers') },
        { title: t('sidebar_suppliers'), path: '/suppliers', moduleId: 'suppliers', active: isActive('/suppliers') },
        { title: t('sidebar_leads'), path: '/leads', moduleId: 'leads', active: isActive('/leads') },
        { title: t('sidebar_projects'), path: '/projects', moduleId: 'projects', active: isActive('/projects') },
        { title: t('sidebar_tasks'), path: '/tasks', moduleId: 'tasks', active: isActive('/tasks') },
        { title: t('sidebar_branches'), path: '/branches', moduleId: 'settings', active: isActive('/branches') }
      ]
    },
    {
      title: t('sidebar_sales'),
      moduleId: 'sales',
      icon: <FiShoppingCart size={20} />,
      active: isParentActive(['/sales-orders', '/invoices', '/payments', '/pos', '/sales-reports', '/returns']),
      submenu: [
        { title: t('sidebar_sales_orders'), path: '/sales-orders', moduleId: 'sales', active: isActive('/sales-orders') },
        { title: t('sidebar_invoices'), path: '/invoices', moduleId: 'sales', active: isActive('/invoices') },
        { title: t('sidebar_payments'), path: '/payments', moduleId: 'sales', active: isActive('/payments') },
        { title: t('sidebar_pos'), path: '/pos', moduleId: 'sales', active: isActive('/pos') },
        { title: t('sidebar_sales_reports'), path: '/sales-reports', moduleId: 'reports', active: isActive('/sales-reports') },
        { title: 'Debtors (Owed Money)', path: '/debtors', moduleId: 'sales', active: isActive('/debtors') },
        { title: t('sidebar_returns'), path: '/returns', moduleId: 'sales', active: isActive('/returns') }
      ]
    },
    {
      title: t('sidebar_inventory'),
      moduleId: 'inventory',
      icon: <FiBox size={20} />,
      active: isParentActive(['/products', '/categories', '/stock', '/warehouses', '/low-stock']),
      submenu: [
        { title: t('sidebar_products'), path: '/products', moduleId: 'inventory', active: isActive('/products') },
        { title: t('sidebar_categories'), path: '/categories', moduleId: 'inventory', active: isActive('/categories') },
        { title: t('sidebar_stock_movements'), path: '/stock', moduleId: 'inventory', active: isActive('/stock') },
        { title: t('sidebar_warehouses'), path: '/warehouses', moduleId: 'warehouses', active: isActive('/warehouses') },
        { title: t('sidebar_low_stock'), path: '/low-stock', moduleId: 'inventory', active: isActive('/low-stock') }
      ]
    },
    {
      title: t('sidebar_finance'),
      moduleId: 'expenses',
      icon: <FiDollarSign size={20} />,
      active: isParentActive(['/expenses', '/income', '/accounting', '/payroll', '/taxes']),
      submenu: [
        { title: t('sidebar_expenses'), path: '/expenses', moduleId: 'expenses', active: isActive('/expenses') },
        { title: t('sidebar_income'), path: '/income', moduleId: 'expenses', active: isActive('/income') },
        { title: t('sidebar_accounting'), path: '/accounting', moduleId: 'expenses', active: isActive('/accounting') },
        { title: t('sidebar_payroll'), path: '/payroll', moduleId: 'hr', active: isActive('/payroll') },
        { title: t('sidebar_taxes'), path: '/taxes', moduleId: 'expenses', active: isActive('/taxes') }
      ]
    },
    {
      title: t('sidebar_hr'),
      moduleId: 'hr',
      icon: <FiUsers size={20} />,
      active: isParentActive(['/employees', '/attendance', '/leave', '/performance', '/departments', '/documents', '/approvals', '/workflows', '/assets']),
      submenu: [
        { title: t('sidebar_employees'), path: '/employees', moduleId: 'hr', active: isActive('/employees') },
        { title: t('sidebar_attendance'), path: '/attendance', moduleId: 'hr', active: isActive('/attendance') },
        { title: t('sidebar_leave'), path: '/leave', moduleId: 'hr', active: isActive('/leave') },
        { title: t('sidebar_performance'), path: '/performance', moduleId: 'hr', active: isActive('/performance') },
        { title: t('sidebar_departments'), path: '/departments', moduleId: 'hr', active: isActive('/departments') },
        { title: t('sidebar_documents'), path: '/documents', moduleId: 'documents', active: isActive('/documents') },
        { title: t('sidebar_approvals'), path: '/approvals', moduleId: 'hr', active: isActive('/approvals') },
        { title: t('sidebar_workflows'), path: '/workflows', moduleId: 'hr', active: isActive('/workflows') },
        { title: t('sidebar_assets'), path: '/assets', moduleId: 'assets', active: isActive('/assets') }
      ]
    },
    {
      title: t('sidebar_purchases'),
      moduleId: 'purchases',
      icon: <FiShoppingCart size={20} />,
      active: isParentActive(['/purchases', '/purchase-orders', '/goods-received', '/supplier-bills', '/purchase-reports']),
      submenu: [
        { title: t('sidebar_purchase_transactions'), path: '/purchases', moduleId: 'purchases', active: isActive('/purchases') },
        { title: t('sidebar_purchase_orders'), path: '/purchase-orders', moduleId: 'purchases', active: isActive('/purchase-orders') },
        { title: t('sidebar_goods_received'), path: '/goods-received', moduleId: 'purchases', active: isActive('/goods-received') },
        { title: t('sidebar_supplier_bills'), path: '/supplier-bills', moduleId: 'purchases', active: isActive('/supplier-bills') },
        { title: t('sidebar_purchase_reports'), path: '/purchase-reports', moduleId: 'reports', active: isActive('/purchase-reports') }
      ]
    },
    {
      title: t('sidebar_operations'),
      moduleId: 'dashboard', // General operations
      icon: <FiActivity size={20} />,
      active: isParentActive(['/operations', '/approvals', '/workflows', '/documents', '/assets']),
      submenu: [
        { title: t('sidebar_operations_management'), path: '/operations', moduleId: 'dashboard', active: isActive('/operations') },
        { title: t('sidebar_approvals'), path: '/approvals', moduleId: 'hr', active: isActive('/approvals') },
        { title: t('sidebar_workflows'), path: '/workflows', moduleId: 'hr', active: isActive('/workflows') },
        { title: t('sidebar_documents'), path: '/documents', moduleId: 'documents', active: isActive('/documents') },
        { title: t('sidebar_assets'), path: '/assets', moduleId: 'assets', active: isActive('/assets') }
      ]
    },
    {
      title: t('sidebar_reports'),
      path: '/reports',
      moduleId: 'reports',
      icon: <FiBarChart2 size={20} />,
      active: isActive('/reports')
    },
    {
      title: t('sidebar_communication'),
      moduleId: 'dashboard',
      icon: <FiMessageSquare size={20} />,
      active: isParentActive(['/notifications', '/messages', '/announcements']),
      submenu: [
        { title: t('sidebar_notifications'), path: '/notifications', moduleId: 'dashboard', active: isActive('/notifications') },
        { title: t('sidebar_messages'), path: '/messages', moduleId: 'dashboard', active: isActive('/messages') },
        { title: t('sidebar_announcements'), path: '/announcements', moduleId: 'dashboard', active: isActive('/announcements') }
      ]
    },
    {
      title: t('sidebar_settings'),
      moduleId: 'settings',
      icon: <FiSettings size={20} />,
      active: isParentActive(['/settings', '/advanced-settings', '/users', '/company-profile', '/permissions', '/system-settings', '/integrations', '/backup', '/audit-logs']),
      submenu: [
        { title: t('sidebar_general_settings'), path: '/settings', moduleId: 'settings', active: isActive('/settings') },
        { title: 'Subscription', path: '/subscription', moduleId: 'settings', active: isActive('/subscription') },
        { title: t('sidebar_advanced_settings'), path: '/advanced-settings', moduleId: 'settings', active: isActive('/advanced-settings') },
        { title: t('sidebar_user_management'), path: '/users', moduleId: 'users', active: isActive('/users') },
        { title: t('sidebar_company_profile'), path: '/company-profile', moduleId: 'settings', active: isActive('/company-profile') },
        { title: t('sidebar_permissions'), path: '/permissions', moduleId: 'settings', active: isActive('/permissions') },
        { title: t('sidebar_system_settings'), path: '/system-settings', moduleId: 'settings', active: isActive('/system-settings') },
        { title: t('sidebar_integrations'), path: '/integrations', moduleId: 'settings', active: isActive('/integrations') },
        { title: t('sidebar_backup'), path: '/backup', moduleId: 'settings', active: isActive('/backup') },
        { title: t('sidebar_audit_logs'), path: '/audit-logs', moduleId: 'settings', active: isActive('/audit-logs') }
      ]
    }
  ];

  // Filter navItems based on permissions
  const filteredNavItems = navItems.filter(item => {
    if (item.submenu) {
      // Filter submenu items first
      item.submenu = item.submenu.filter(sub => isModuleAllowed(sub.moduleId));
      // Only keep the parent if it has at least one allowed sub-item
      return item.submenu.length > 0;
    }
    return isModuleAllowed(item.moduleId);
  });

  // Filter settings submenu based on role (additional restriction)
  const settingsItem = filteredNavItems.find(item => item.title === t('sidebar_settings'));
  if (settingsItem && user?.role !== 'superadmin') {
    const restrictedPaths = ['/advanced-settings', '/system-settings', '/integrations', '/backup'];
    settingsItem.submenu = settingsItem.submenu.filter(sub => !restrictedPaths.includes(sub.path));
  }

  // Add Superadmin link if user is superadmin
  if (user && user.role === 'superadmin') {
    filteredNavItems.push({
      title: t('sidebar_superadmin'),
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
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="business-name-container overflow-hidden flex-grow-1 me-2 d-flex align-items-center"
          >
            <img
              src="/assets/logo.png"
              alt="Logo"
              style={{ height: '32px', marginRight: '10px', borderRadius: '4px' }}
            />
            <span className="fw-bold text-truncate d-block" style={{ fontSize: '1.2rem', color: '#60a5fa', letterSpacing: '0.5px' }}>
              NexusFlow
            </span>
          </motion.div>
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
                {t('logout') || 'Logout'}
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
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          border-radius: 0 24px 24px 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
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
          width: 4px;
        }
        
        .sidebar-nav-container::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #8b5cf6 0%, #6366f1 100%);
          border-radius: 10px;
        }

        .sidebar-nav-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .nav-item-wrapper {
          width: 100%;
          display: block;
        }
        
        .nav-link-custom {
          color: rgba(51, 51, 51, 0.9) !important;
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
