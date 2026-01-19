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

  // Filter settings submenu based on role
  const settingsItem = navItems.find(item => item.title === t('sidebar_settings'));
  if (settingsItem && user?.role !== 'superadmin') {
    const restrictedPaths = ['/advanced-settings', '/system-settings', '/integrations', '/backup'];
    settingsItem.submenu = settingsItem.submenu.filter(sub => !restrictedPaths.includes(sub.path));
  }

  // Add Superadmin link if user is superadmin
  if (user && user.role === 'superadmin') {
    navItems.push({
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
            className="business-name-container overflow-hidden flex-grow-1 me-2"
          >
            <span className="fw-bold text-truncate d-block" style={{ fontSize: '1.2rem', color: '#60a5fa', letterSpacing: '0.5px' }}>
              {user?.business_name || 'Business Manager'}
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
      </div>

      <div className="sidebar-footer p-3 mt-auto">
        <div className={`d-flex align-items-center ${isCollapsed ? 'justify-content-center' : ''} w-100`}>
          {!isCollapsed ? (
            <button
              className="btn w-100 d-flex align-items-center justify-content-center gap-2 border-0 shadow-sm py-2"
              onClick={handleLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#fca5a5',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                e.currentTarget.style.color = '#fca5a5';
              }}
            >
              <FiLogOut size={18} />
              <span className="fw-semibold">{t('logout') || 'Logout'}</span>
            </button>
          ) : (
            <button
              className="btn p-0 d-flex align-items-center justify-content-center border-0 rounded-3"
              onClick={handleLogout}
              title={t('logout') || 'Logout'}
              style={{
                width: '40px',
                height: '40px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#fca5a5',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                e.currentTarget.style.color = '#fca5a5';
              }}
            >
              <FiLogOut size={20} />
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
          z-index: 1200;
          background: linear-gradient(180deg, #2d1b69 0%, #1a0f3d 100%);
          color: white;
          display: flex;
          flex-direction: column;
          box-shadow: 4px 0 20px rgba(45, 27, 105, 0.3);
          overflow: hidden;
        }

        /* Alternative sidebar gradient options - uncomment to use */
        /* Option 1: Deep Indigo to Navy */
        /* background: linear-gradient(180deg, #312e81 0%, #1e1b4b 100%); */
        
        /* Option 2: Dark Slate (Original) */
        /* background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); */
        
        /* Option 3: Rich Purple */
        /* background: linear-gradient(180deg, #5b21b6 0%, #3b0764 100%); */
        
        /* Option 4: Dark Teal to Navy */
        /* background: linear-gradient(180deg, #134e4a 0%, #0c2340 100%); */

        @media (max-width: 991.98px) {
          .sidebar-wrapper {
            width: 260px !important;
          }
        }
        
        .sidebar-header {
          height: 72px;
          min-height: 72px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03);
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
          transform: scale(1.1);
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
          color: rgba(255, 255, 255, 0.7) !important;
          transition: all 0.2s ease;
          text-decoration: none !important;
          position: relative;
          cursor: pointer;
          width: 100%;
        }
        
        .nav-link-custom:hover {
          color: white !important;
          background: rgba(139, 92, 246, 0.15) !important;
          border-radius: 8px;
          transform: translateX(2px);
        }
        
        .nav-link-custom.active {
          color: white !important;
          background: linear-gradient(90deg, rgba(139, 92, 246, 0.25) 0%, rgba(99, 102, 241, 0.15) 100%) !important;
          border-radius: 8px;
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
          color: rgba(255, 255, 255, 0.5) !important;
          font-size: 0.85rem;
          transition: all 0.2s ease;
          text-decoration: none !important;
          display: block;
          width: calc(100% - 1.5rem);
        }
        
        .nav-link-custom-submenu:hover {
          color: white !important;
          background: rgba(139, 92, 246, 0.1) !important;
          transform: translateX(4px);
          border-radius: 6px;
        }
        
        .nav-link-custom-submenu.active {
          color: #a78bfa !important;
          font-weight: 600;
          background: rgba(139, 92, 246, 0.08) !important;
        }
        
        .sidebar-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.2);
          min-height: 70px;
        }
        
        .avatar-wrapper {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 4px 10px rgba(139, 92, 246, 0.3);
        }
        
        .logout-btn {
          opacity: 0.5;
          transition: all 0.2s;
          cursor: pointer;
        }
        
        .logout-btn:hover {
          opacity: 1;
          color: #f87171 !important;
          transform: scale(1.1);
        }

        /* Business name styling */
        .business-name-container span {
          color: #c4b5fd !important;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        /* Enhanced user profile in footer */
        .user-profile .fw-bold {
          color: #e9d5ff;
        }

        .user-profile .text-white-50 {
          color: rgba(233, 213, 255, 0.6) !important;
        }

        .user-profile .text-primary {
          color: #c4b5fd !important;
        }
      `}} />
    </motion.div>
  );
};

export default SidebarWithHover;
